// Edge Function catat-percobaan: SATU-SATUNYA pintu tulis `percobaan_soal` (spec 2.6, G3). Klien hanya mengirim isian dan klik;
// benar/salah, jenis soal, versi, dan waktu ditentukan di sini. Urutan pemeriksaan (berhenti di yang pertama gagal):
//   identitas (401) → bentuk (400) → soal dan revisi (400) → isian terhadap tabel (400) → catat_percobaan di SQL (laju 429,
//   urutan/idempoten 409). Penilaian murni ada di penilai.js (bundel `pnpm fungsi:bundel`); aturan urutan dan laju di SQL.
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY disediakan Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { bacaIsi, bacaKiriman, bacaKirimanKegiatan, nilaiKiriman, nilaiKuis, tabelKanonik, VERSI_ENGINE } from './penilai.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const balas = (status: number, isi: unknown) =>
  new Response(JSON.stringify(isi), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const galat = (status: number, kode: string) => balas(status, { galat: kode });

const POLA_SOAL_POLA = /@\d+#\d+$/;
const PANJANG_KUNCI_TABEL = 16;

async function ringkasKunci(tabel: unknown): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tabelKanonik(tabel)));
  return [...new Uint8Array(hash)].map(bita => bita.toString(16).padStart(2, '0')).join('').slice(0, PANJANG_KUNCI_TABEL);
}

// Soal biasa: hash satu tabel. Gharqa: keputusan benar + hash tiap tabel harta, dipisah '|' (sama dengan yang disusun klien).
async function kunciVersi(penilaian: { keputusanSoal: string | null; daftarTabel: unknown[] }): Promise<string> {
  const hash = await Promise.all(penilaian.daftarTabel.map(ringkasKunci));
  return [...(penilaian.keputusanSoal ? [penilaian.keputusanSoal] : []), ...hash].join('|');
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return galat(405, 'METODE_TIDAK_DIIZINKAN');
  const url = Deno.env.get('SUPABASE_URL')!;
  const klien = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }, auth: { persistSession: false },
  });
  const { data: { user } } = await klien.auth.getUser();
  if (!user) return galat(401, 'BELUM_MASUK');

  const teks = await req.text();
  let mentah: unknown;
  try { mentah = JSON.parse(teks); } catch { return galat(400, 'BENTUK_TIDAK_SAH'); }
  const ukuranBadan = new TextEncoder().encode(teks).length;
  const kegiatan = bacaKirimanKegiatan(mentah, ukuranBadan);
  if (kegiatan) return kegiatan.ok ? await catatKegiatan(url, user.id, kegiatan.kegiatan) : galat(kegiatan.status, kegiatan.kode);
  const baca = bacaKiriman(mentah, ukuranBadan);
  if (!baca.ok) return galat(baca.status, baca.kode);
  const { kiriman } = baca;
  // Soal bangkitan menunggu katalog `soal_bangkitan` (G4); sebelum itu tidak ada soalId pola yang sah.
  if (POLA_SOAL_POLA.test(kiriman.soalId)) return galat(400, 'SOAL_BANGKITAN_BELUM_ADA');

  const servis = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: revisi } = await servis.from('revisi').select('isi, status, entri_id').eq('id', kiriman.revisiSoal).maybeSingle();
  // 'disetujui' = pernah terbit; draf dan revisi soal lain tidak boleh dinilai.
  if (!revisi || revisi.status !== 'disetujui') return galat(400, 'REVISI_TIDAK_TERBIT');
  const { data: entri } = await servis.from('entri_konten').select('jenis').eq('id', revisi.entri_id).maybeSingle();
  const isi = entri?.jenis === 'soal_hitung' ? bacaIsi('soal_hitung', revisi.isi) : null;
  if (!isi?.ok || isi.isi.kode !== kiriman.soalId) return galat(400, 'REVISI_BUKAN_SOAL_INI');

  const nilai = nilaiKiriman(kiriman, { kasus: isi.isi.kasus, revisiId: kiriman.revisiSoal }, VERSI_ENGINE);
  if (!nilai.ok) return galat(nilai.status, nilai.kode);
  const { penilaian } = nilai;

  const { data, error } = await servis.rpc('catat_percobaan', {
    p_user: user.id, p_id: kiriman.id, p_id_sesi_soal: kiriman.idSesiSoal, p_soal_id: kiriman.soalId, p_revisi_soal: kiriman.revisiSoal,
    p_jenis_soal: penilaian.jenisSoal.replace(/[A-Z]/g, huruf => `_${huruf.toLowerCase()}`), p_mode: kiriman.mode,
    p_aksi: kiriman.aksi.replace(/[A-Z]/g, huruf => `_${huruf.toLowerCase()}`), p_isian: kiriman.isian ?? kiriman.gharqa, p_jangkar: kiriman.jangkar,
    p_hasil_kolom: penilaian.hasilKolom, p_benar_semua: penilaian.hasilKolom ? penilaian.benarSemua : null,
    p_dimulai_pada: kiriman.dimulaiPada,
    p_versi: { engine: VERSI_ENGINE, ruleset: penilaian.ruleset, madzhab: 'bawaan', kunci: await kunciVersi(penilaian) },
  });
  if (error) {
    // PT400/PT409/PT429 dari catat_percobaan: pesan = kode galat, status = tiga angka terakhir SQLSTATE.
    const status = /^PT\d{3}$/.test(error.code ?? '') ? Number(error.code!.slice(2)) : 500;
    return status === 500 ? galat(500, 'GAGAL_MENCATAT') : galat(status, error.message);
  }
  return balas(200, { duplikat: data.duplikat, diterimaPada: data.diterima_pada, hasilKolom: data.hasil_kolom, benarSemua: data.benar_semua });
});

// Kuis konsep dan pelajaran: benar/salah kuis dari revisi terbit di server; XP tetap dihitung SQL dari log_kegiatan (sekali per slug).
async function catatKegiatan(url: string, userId: string, kegiatan: { jenis: 'kuis' | 'pelajaran'; id: string; slug: string; indeksPilihan?: number }) {
  const servis = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const jenisKonten = kegiatan.jenis === 'kuis' ? 'soal_kuis' : 'materi';
  const { data: entri } = await servis.from('entri_konten').select('revisi_terbit_id').eq('jenis', jenisKonten).eq('slug', kegiatan.slug).maybeSingle();
  if (!entri?.revisi_terbit_id) return galat(400, 'KONTEN_TIDAK_TERBIT');
  let benar: boolean | null = null;
  if (kegiatan.jenis === 'kuis') {
    const { data: revisi } = await servis.from('revisi').select('isi').eq('id', entri.revisi_terbit_id).single();
    const isi = bacaIsi('soal_kuis', revisi?.isi);
    benar = isi.ok ? nilaiKuis(isi.isi, kegiatan.indeksPilihan!) : null;
    if (benar === null) return galat(400, 'PILIHAN_TIDAK_SAH');
  }
  // Kiriman ulang dengan id sama diabaikan (idempoten); waktu terjadi_pada dari server.
  const { error } = await servis.from('log_kegiatan').upsert(
    { id: kegiatan.id, user_id: userId, jenis: kegiatan.jenis, slug: kegiatan.slug, benar }, { onConflict: 'id', ignoreDuplicates: true });
  return error ? galat(500, 'GAGAL_MENCATAT') : balas(200, { benar });
}
