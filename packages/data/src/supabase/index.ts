// packages/data/src/supabase/index.ts
// Implementasi repository di atas Supabase (Postgres + Auth). Hanya tabel & fungsi SQL di supabase/migrations yang
// dipakai; tidak ada Edge Functions/Realtime/Storage, supaya pindah VPS cukup menambah implementasi http/.
// Aturan akses ditegakkan DB (RLS + fungsi transisi); di sini hanya validasi isi (Zod) sebelum simpan agar pesan
// galat ramah, dan saringValid saat baca.
import type { SupabaseClient } from '@supabase/supabase-js';
import { bacaIsi, keJson, type IsiKonten, type JenisKonten, type Peran } from '@waris/content';
import { BATAS_AJUAN_SAYA } from '../antarmuka.js';
import type {
  HasilAi, RepositoriAi,
  BarisPeringkat, PeranPengguna, RepositoriAkun, RepositoriDiksi, RepositoriEditorial, RepositoriKonten, RepositoriPengguna,
  RepositoriPeringkat,
} from '../antarmuka.js';
import { saringValid } from '../saring.js';
import {
  keDiksiTerbit, keJejak, keProgresBelajar, keProgresLatihan, keRevisi, keRevisiDiksi, keRingkasanEntri, keRingkasanKunciDiksi,
  keRiwayat, keTerbitMentah,
} from './peta.js';

const RELASI_TERBIT = 'revisi_terbit:revisi!entri_konten_revisi_terbit_id_fkey(id, isi, refs, hapus)';
const RELASI_TERBIT_DIKSI = 'revisi_terbit:revisi_diksi!diksi_revisi_terbit_id_fkey(id_teks, ar_teks)';

export function buatRepositoriSupabase(klien: SupabaseClient) {
  const hasil = async <T>(janji: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> => {
    const { data, error } = await janji;
    if (error) throw new Error(error.message);
    return data;
  };
  const rpc = (nama: string, argumen: Record<string, unknown>) => hasil(klien.rpc(nama, argumen)).then(() => undefined);
  const userId = async () => {
    const { data } = await klien.auth.getUser();
    if (!data.user) throw new Error('belum masuk');
    return data.user.id;
  };
  const isiSah = <J extends JenisKonten>(jenis: J, isi: IsiKonten[J]) => {
    const json = keJson(jenis, isi);
    const periksa = bacaIsi(jenis, json);
    if (!periksa.ok) throw new Error(`isi ${jenis} tidak sah: ${periksa.galat}`);
    return json;
  };

  const konten: RepositoriKonten = {
    async versiSekarang() {
      const baris = await hasil(klien.from('versi_konten').select('angka').single());
      return Number((baris as { angka: number }).angka);
    },
    async bacaTerbit(saring = {}) {
      let kueri = klien.from('entri_konten').select(`id, jenis, slug, urutan, versi_terbit, diarsipkan_pada, ${RELASI_TERBIT}`)
        .not('revisi_terbit_id', 'is', null).order('urutan');
      if (saring.jenis) kueri = kueri.eq('jenis', saring.jenis);
      if (saring.sejakVersi !== undefined) kueri = kueri.gt('versi_terbit', saring.sejakVersi);
      return saringValid((await hasil(kueri) as any[]).filter(baris => !baris.revisi_terbit.hapus && !baris.diarsipkan_pada).map(keTerbitMentah));
    },
    async bacaDihapus(sejakVersi) {
      // Penanda hapus sedikit; saring di klien supaya tidak bergantung pada filter relasi PostgREST.
      const baris = await hasil(klien.from('entri_konten').select('id, diarsipkan_pada, revisi_terbit:revisi!entri_konten_revisi_terbit_id_fkey(hapus)')
        .not('revisi_terbit_id', 'is', null).gt('versi_terbit', sejakVersi)) as any[];
      return baris.filter(b => b.revisi_terbit.hapus || b.diarsipkan_pada).map(b => b.id as string);
    },
    async daftarJejak(entriId) {
      return (await hasil(klien.from('jejak_entri').select('*').eq('entri_id', entriId).order('pada')) as any[]).map(keJejak);
    },
    async daftarRevisi(entriId) {
      return (await hasil(klien.from('revisi').select('*').eq('entri_id', entriId).order('dibuat_pada')) as any[]).map(keRevisi);
    },
    async daftarEntri(jenis) {
      let kueri = klien.from('entri_konten').select('id, jenis, slug, urutan, revisi_terbit_id, dibuang_pada, diarsipkan_pada, revisi!revisi_entri_id_fkey(*)');
      if (jenis !== undefined) kueri = kueri.eq('jenis', jenis);
      kueri = kueri.order('urutan').order('slug');
      return (await hasil(kueri) as any[]).map(keRingkasanEntri);
    },
    async daftarRefs() { return (await hasil(klien.from('daftar_refs').select('kode, bab').order('kode'))) as { kode: string; bab: number }[]; },
  };

  const editorial: RepositoriEditorial = {
    async buatEntri(jenis, slug, urutan) {
      const baris = await hasil(klien.from('entri_konten').insert({ jenis, slug, urutan }).select('id').single());
      return (baris as { id: string }).id;
    },
    aturUrutan: entriIds => rpc('atur_urutan', { p_entri: entriIds }),
    async buatDraf(entriId, jenis, isi, refs) {
      const baris = await hasil(klien.from('revisi').insert({ entri_id: entriId, isi: isiSah(jenis, isi), refs }).select('id').single());
      return (baris as { id: string }).id;
    },
    async ubahDraf(revisiId, jenis, isi, refs) {
      const baris = await hasil(klien.from('revisi').update({ isi: isiSah(jenis, isi), refs }).eq('id', revisiId).select('id'));
      if ((baris as unknown[]).length === 0) throw new Error('draf ini tidak bisa disunting');
    },
    ajukan: revisiId => rpc('ajukan_revisi', { p_id: revisiId }),
    setujui: revisiId => rpc('setujui_revisi', { p_id: revisiId }),
    kembalikan: (revisiId, catatan) => rpc('kembalikan_revisi', { p_id: revisiId, p_catatan: catatan }),
    terbitkanUlang: revisiId => rpc('terbitkan_ulang_revisi', { p_id: revisiId }),
    tarik: revisiId => rpc('tarik_revisi', { p_id: revisiId }),
    abaikan: revisiId => rpc('abaikan_revisi', { p_id: revisiId }),
    terbitkanLangsung: revisiId => rpc('terbitkan_langsung', { p_id: revisiId }),
    perbaruiAjuan: (revisiId, jenis, isi, refs) => rpc('perbarui_ajuan', { p_id: revisiId, p_isi: isiSah(jenis, isi), p_refs: refs }),
    async buangEntri(entriId, alasan) {
      return await hasil(klien.rpc('buang_entri', { p_entri: entriId, p_alasan: alasan ?? null })) as 'dibuang' | 'diajukan';
    },
    pulihkanEntri: entriId => rpc('pulihkan_entri', { p_entri: entriId }),
    arsipkanEntri: (entriId, alasan) => rpc('arsipkan_entri', { p_entri: entriId, p_alasan: alasan ?? null }),
    keluarkanArsipEntri: entriId => rpc('keluarkan_arsip_entri', { p_entri: entriId }),
    async antreanReview() {
      return (await hasil(klien.from('revisi').select('*').eq('status', 'diajukan').order('dibuat_pada')) as any[]).map(keRevisi);
    },
    async revisiSaya(userId) {
      const kueri = klien.from('revisi').select('*, entri:entri_konten!revisi_entri_id_fkey(jenis, slug)')
        .eq('dibuat_oleh', userId).neq('status', 'draf').order('dibuat_pada', { ascending: false }).limit(BATAS_AJUAN_SAYA);
      return (await hasil(kueri) as any[]).map(baris => ({ ...keRevisi(baris), jenis: baris.entri.jenis, slug: baris.entri.slug }));
    },
  };

  const diksi: RepositoriDiksi = {
    async bacaTerbit(sejakVersi) {
      let kueri = klien.from('diksi').select(`kunci, halaman, versi_terbit, ${RELASI_TERBIT_DIKSI}`).not('revisi_terbit_id', 'is', null);
      if (sejakVersi !== undefined) kueri = kueri.gt('versi_terbit', sejakVersi);
      return (await hasil(kueri) as any[]).map(keDiksiTerbit);
    },
    async buatKunci(kunci, halaman) { await hasil(klien.from('diksi').insert({ kunci, halaman })); },
    async buatDraf(kunci, idTeks, arTeks, catatan) {
      const baris = await hasil(klien.from('revisi_diksi').insert({ kunci, id_teks: idTeks, ar_teks: arTeks, catatan }).select('id').single());
      return (baris as { id: string }).id;
    },
    ajukan: revisiId => rpc('ajukan_revisi_diksi', { p_id: revisiId }),
    setujui: revisiId => rpc('setujui_revisi_diksi', { p_id: revisiId }),
    kembalikan: (revisiId, catatan) => rpc('kembalikan_revisi_diksi', { p_id: revisiId, p_catatan: catatan }),
    terbitkanUlang: revisiId => rpc('terbitkan_ulang_revisi_diksi', { p_id: revisiId }),
    terbitkanLangsung: revisiId => rpc('terbitkan_langsung_diksi', { p_id: revisiId }),
    abaikan: revisiId => rpc('abaikan_revisi_diksi', { p_id: revisiId }),
    perbaruiAjuan: (revisiId, idTeks, arTeks) => rpc('perbarui_ajuan_diksi', { p_id: revisiId, p_id_teks: idTeks, p_ar_teks: arTeks }),
    async daftarRevisi(kunci) {
      return (await hasil(klien.from('revisi_diksi').select('*').eq('kunci', kunci).order('dibuat_pada')) as any[]).map(keRevisiDiksi);
    },
    async daftarKunci() {
      const kueri = klien.from('diksi')
        .select(`kunci, halaman, versi_terbit, ${RELASI_TERBIT_DIKSI}, semua_revisi:revisi_diksi!revisi_diksi_kunci_fkey(*)`)
        .order('halaman').order('kunci');
      return (await hasil(kueri) as any[]).map(keRingkasanKunciDiksi);
    },
    async revisiSaya(userId) {
      const kueri = klien.from('revisi_diksi').select('*')
        .eq('dibuat_oleh', userId).neq('status', 'draf').order('dibuat_pada', { ascending: false }).limit(BATAS_AJUAN_SAYA);
      return (await hasil(kueri) as any[]).map(keRevisiDiksi);
    },
    async antreanReview() {
      return (await hasil(klien.from('revisi_diksi').select('*').eq('status', 'diajukan').order('dibuat_pada')) as any[]).map(keRevisiDiksi);
    },
  };

  const pengguna: RepositoriPengguna = {
    async bacaRiwayat() { return (await hasil(klien.from('riwayat_hitung').select('*').order('disimpan_pada', { ascending: false })) as any[]).map(keRiwayat); },
    async simpanRiwayat(baris) {
      await hasil(klien.from('riwayat_hitung').upsert({ user_id: await userId(), id: baris.id, kasus: baris.kasus, judul: baris.judul, disimpan_pada: baris.disimpanPada }));
    },
    async hapusRiwayat(id) { await hasil(klien.from('riwayat_hitung').delete().eq('id', id)); },
    async bacaProgresBelajar() { return (await hasil(klien.from('progres_belajar').select('*')) as any[]).map(keProgresBelajar); },
    async simpanProgresBelajar(baris) {
      await hasil(klien.from('progres_belajar').upsert({ user_id: await userId(), pelajaran_slug: baris.pelajaranSlug, selesai: baris.selesai, diubah_pada: baris.diubahPada }));
    },
    async bacaProgresLatihan() { return (await hasil(klien.from('progres_latihan').select('*')) as any[]).map(keProgresLatihan); },
    async simpanProgresLatihan(baris) {
      await hasil(klien.from('progres_latihan').upsert({
        user_id: await userId(), soal_slug: baris.soalSlug, jenis: baris.jenis, jawaban_terakhir: baris.jawabanTerakhir,
        benar: baris.benar, jumlah_coba: baris.jumlahCoba, diubah_pada: baris.diubahPada,
      }));
    },
    async hapusSemuaProgresLatihan() { await hasil(klien.from('progres_latihan').delete().eq('user_id', await userId())); },
    async bacaPreferensi() {
      const baris = await hasil(klien.from('preferensi').select('*').maybeSingle()) as any;
      return baris ? { isi: baris.isi, diubahPada: baris.diubah_pada } : null;
    },
    async simpanPreferensi(baris) {
      await hasil(klien.from('preferensi').upsert({ user_id: await userId(), isi: baris.isi, diubah_pada: baris.diubahPada }));
    },
    async catatKegiatan(baris) {
      await hasil(klien.from('log_kegiatan').upsert(
        { id: baris.id, jenis: baris.jenis, slug: baris.slug, benar: baris.benar }, { onConflict: 'id', ignoreDuplicates: true }));
    },
    async bacaProfil() {
      const baris = await hasil(klien.from('profil').select('*').eq('user_id', await userId()).maybeSingle()) as any;
      return baris && {
        namaTampilan: baris.nama_tampilan, ikutPapanPeringkat: baris.ikut_papan_peringkat,
        tampilkanAvatar: baris.tampilkan_avatar, zonaWaktu: baris.zona_waktu,
        pushStreak: baris.push_streak, pushPeringkat: baris.push_peringkat,
      };
    },
    async simpanProfil(profil) {
      await hasil(klien.from('profil').upsert({
        user_id: await userId(), nama_tampilan: profil.namaTampilan.trim(), ikut_papan_peringkat: profil.ikutPapanPeringkat,
        tampilkan_avatar: profil.tampilkanAvatar, zona_waktu: profil.zonaWaktu,
        ...(profil.pushStreak === undefined ? {} : { push_streak: profil.pushStreak }),
        ...(profil.pushPeringkat === undefined ? {} : { push_peringkat: profil.pushPeringkat }),
      }));
    },
    async simpanLangganan(langganan) {
      await hasil(klien.from('langganan_push').upsert({
        user_id: await userId(), endpoint: langganan.endpoint, p256dh: langganan.p256dh, auth: langganan.auth,
        bahasa: langganan.bahasa, gagal_berturut: 0,
      }, { onConflict: 'endpoint' }));
    },
    async hapusLangganan(endpoint) {
      await hasil(klien.from('langganan_push').delete().eq('user_id', await userId()).eq('endpoint', endpoint));
    },
    async bacaKabarPush(sejak) {
      const baris = await hasil(klien.from('kirim_push').select('kunci, jenis, judul, isi, tautan, mendesak, dikirim_pada')
        .eq('user_id', await userId()).gt('dikirim_pada', sejak).order('dikirim_pada', { ascending: false }).limit(20)) as any[];
      return baris.map(isi => ({
        kunci: isi.kunci, jenis: isi.jenis, judul: isi.judul, isi: isi.isi, tautan: isi.tautan, mendesak: isi.mendesak, dikirimPada: isi.dikirim_pada,
      }));
    },
  };

  const peringkat: RepositoriPeringkat = {
    async ringkasanSaya() {
      await userId();
      const [baris] = await hasil(klien.rpc('ringkasan_saya')) as any[];
      return {
        xpTotal: baris.xp_total, xpMingguIni: baris.xp_minggu_ini, streakSekarang: baris.streak_sekarang,
        streakTerpanjang: baris.streak_terpanjang, aktifHariIni: baris.aktif_hari_ini,
      };
    },
    async papan(periode, batas = 50) {
      return (await hasil(klien.rpc('papan_peringkat', { p_periode: periode, p_batas: batas })) as any[])
        .map((baris): BarisPeringkat => ({
          peringkat: baris.peringkat, namaTampilan: baris.nama_tampilan, avatar: baris.avatar, xp: baris.xp,
          streakSekarang: baris.streak_sekarang, saya: baris.saya,
        }));
    },
  };

  const akun: RepositoriAkun = {
    async sesi() {
      const { data } = await klien.auth.getUser();
      const meta = data.user?.user_metadata ?? {};
      return data.user ? {
        userId: data.user.id, email: data.user.email ?? '',
        nama: meta.full_name ?? meta.name ?? null, avatar: meta.avatar_url ?? meta.picture ?? null,
      } : null;
    },
    async masukGoogle(alamatKembali) {
      const { error } = await klien.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: alamatKembali } });
      if (error) throw new Error(error.message);
    },
    async keluar() { await klien.auth.signOut(); },
    async peranSaya() {
      const baris = await hasil(klien.from('peran_pengguna').select('peran').eq('user_id', await userId()).maybeSingle()) as { peran: Peran } | null;
      return baris?.peran ?? null;
    },
    async aturPeran(email: string, peran: Peran | null) { await rpc('atur_peran_email', { p_email: email, p_peran: peran }); },
    async daftarPeran() {
      return (await hasil(klien.rpc('daftar_peran')) as any[])
        .map((baris): PeranPengguna => ({ userId: baris.user_id, email: baris.email, nama: baris.nama, peran: baris.peran }));
    },
    async daftarNamaTim() {
      return (await hasil(klien.rpc('daftar_nama_tim')) as any[]).map(baris => ({ userId: baris.user_id as string, nama: baris.nama as string }));
    },
  };

  const ai: RepositoriAi = {
    async bantu(permintaan) {
      const { data, error } = await klien.functions.invoke('ai-bantu', { body: permintaan });
      if (error) {
        // Galat HTTP dari fungsi membawa pesan Indonesia di badan respons; selain itu (jaringan) pesan umum.
        const badan = await (error as { context?: Response }).context?.json?.().catch(() => null) as { galat?: string } | null | undefined;
        throw new Error(badan?.galat ?? 'Layanan AI tidak bisa dihubungi.');
      }
      return data as { hasil: HasilAi; sisaKuota: number };
    },
  };
  return { konten, editorial, diksi, pengguna, akun, peringkat, ai };
}
