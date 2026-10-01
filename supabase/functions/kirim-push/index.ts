// Edge Function kirim-push: dipanggil tiap 15 menit oleh pg_cron (supabase/jadwal-push.sql) dengan header X-Cron.
// Alur: kandidat_push(now()) memilih siapa dikirimi apa (SQL, sudah membuang yang pernah dikirim dan menerapkan batas harian)
// → teks disusun dari diksi terbit (logika.ts) → Web Push ke semua langganan pengguna → kirim_push dicatat HANYA bila minimal
// satu perangkat menerima (kegagalan total dicoba lagi putaran berikutnya selama masih dalam jendela jam).
// Langganan mati (404/410) atau gagal berturut-turut dihapus. Isi push tidak memuat data kasus, nama keluarga, atau nominal.
// Secret: VAPID_PUBLIK, VAPID_PRIVAT, VAPID_SUBJEK (mailto:...), CRON_RAHASIA. SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY dari Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';
import {
  harusDihapus, KUNCI_DIKSI, muatanPush, pilihPerBatas, samaRahasia, susunKabar, tindakanDariStatus,
  type Bahasa, type Kandidat, type Teks,
} from './logika.ts';

const KONKUREN = 20;
const BATAS_WAKTU_MS = 5000;
const TTL_DETIK = 6 * 3600;

interface Langganan { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; bahasa: Bahasa; gagal_berturut: number }

const balas = (status: number, isi: unknown) => new Response(JSON.stringify(isi), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (!samaRahasia(req.headers.get('x-cron'), Deno.env.get('CRON_RAHASIA'))) return balas(401, { galat: 'tidak berwenang' });
  const [publik, privat, subjek] = [Deno.env.get('VAPID_PUBLIK'), Deno.env.get('VAPID_PRIVAT'), Deno.env.get('VAPID_SUBJEK')];
  if (!publik || !privat || !subjek) return balas(503, { galat: 'VAPID belum dipasang (VAPID_PUBLIK, VAPID_PRIVAT, VAPID_SUBJEK).' });
  webpush.setVapidDetails(subjek, publik, privat);

  const servis = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data, error } = await servis.rpc('kandidat_push', { p_sekarang: new Date().toISOString() });
  if (error) return balas(500, { galat: error.message });
  const kandidat = pilihPerBatas((data ?? []) as Kandidat[]);
  if (kandidat.length === 0) return balas(200, { kandidat: 0, dikirim: 0, langganan_dihapus: 0 });

  const teks = await bacaDiksi(servis);
  const ringkasan = { kandidat: kandidat.length, dikirim: 0, langganan_dihapus: 0 };
  for (let awal = 0; awal < kandidat.length; awal += KONKUREN) {
    const hasil = await Promise.all(kandidat.slice(awal, awal + KONKUREN).map(satu => kirimKe(servis, satu, teks)));
    for (const { dikirim, dihapus } of hasil) { ringkasan.dikirim += dikirim ? 1 : 0; ringkasan.langganan_dihapus += dihapus; }
  }
  return balas(200, ringkasan);
});

type Servis = ReturnType<typeof createClient>;

async function kirimKe(servis: Servis, kandidat: Kandidat, teks: Teks): Promise<{ dikirim: boolean; dihapus: number }> {
  const { data } = await servis.from('langganan_push').select('id, user_id, endpoint, p256dh, auth, bahasa, gagal_berturut').eq('user_id', kandidat.user_id);
  const daftar = (data ?? []) as Langganan[];
  let adaYangMenerima = false;
  let dihapus = 0;
  for (const langganan of daftar) {
    const kabar = susunKabar(kandidat, teks, langganan.bahasa);
    const tindakan = await kirimSatu(langganan, muatanPush(kabar), kandidat.mendesak);
    if (tindakan === 'berhasil') {
      adaYangMenerima = true;
      if (langganan.gagal_berturut > 0) await servis.from('langganan_push').update({ gagal_berturut: 0 }).eq('id', langganan.id);
    } else if (harusDihapus(tindakan, langganan.gagal_berturut)) {
      await servis.from('langganan_push').delete().eq('id', langganan.id);
      dihapus++;
    } else {
      await servis.from('langganan_push').update({ gagal_berturut: langganan.gagal_berturut + 1 }).eq('id', langganan.id);
    }
  }
  if (adaYangMenerima) {
    // Catatan memakai bahasa langganan pertama; hanya untuk kotak masuk klien, yang menyusun ulang teks sesuai bahasanya.
    const kabar = susunKabar(kandidat, teks, daftar[0]?.bahasa ?? 'id');
    await servis.from('kirim_push').insert({
      user_id: kandidat.user_id, jenis: kandidat.jenis, kunci: kandidat.kunci, judul: kabar.judul, isi: kabar.isi, tautan: kabar.tautan, mendesak: kandidat.mendesak,
    });
  }
  return { dikirim: adaYangMenerima, dihapus };
}

async function kirimSatu(langganan: Langganan, muatan: string, mendesak: boolean): Promise<'berhasil' | 'hapus' | 'ulang-nanti'> {
  try {
    await webpush.sendNotification({ endpoint: langganan.endpoint, keys: { p256dh: langganan.p256dh, auth: langganan.auth } }, muatan,
      { TTL: TTL_DETIK, urgency: mendesak ? 'high' : 'normal', timeout: BATAS_WAKTU_MS });
    return 'berhasil';
  } catch (galat) {
    return tindakanDariStatus((galat as { statusCode?: number }).statusCode ?? 0);
  }
}

async function bacaDiksi(servis: Servis): Promise<Teks> {
  const { data: butir } = await servis.from('diksi').select('kunci, revisi_terbit_id').in('kunci', [...KUNCI_DIKSI]).not('revisi_terbit_id', 'is', null);
  const idRevisi = (butir ?? []).map(isi => isi.revisi_terbit_id as string);
  if (idRevisi.length === 0) return {};
  const { data: revisi } = await servis.from('revisi_diksi').select('id, id_teks, ar_teks').in('id', idRevisi);
  const menurutId = new Map((revisi ?? []).map(isi => [isi.id as string, isi]));
  return Object.fromEntries((butir ?? []).flatMap(isi => {
    const terbit = menurutId.get(isi.revisi_terbit_id as string);
    return terbit ? [[isi.kunci as string, { id: terbit.id_teks as string, ar: terbit.ar_teks as string | null }]] : [];
  }));
}
