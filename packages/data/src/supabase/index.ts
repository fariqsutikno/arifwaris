// packages/data/src/supabase/index.ts
// Implementasi repository di atas Supabase (Postgres + Auth). Hanya tabel & fungsi SQL di supabase/migrations yang
// dipakai; tidak ada Edge Functions/Realtime/Storage, supaya pindah VPS cukup menambah implementasi http/.
// Aturan akses ditegakkan DB (RLS + fungsi transisi); di sini hanya validasi isi (Zod) sebelum simpan agar pesan
// galat ramah, dan saringValid saat baca.
import type { SupabaseClient } from '@supabase/supabase-js';
import { bacaIsi, keJson, type IsiKonten, type JenisKonten, type Peran } from '@waris/content';
import type { PeranPengguna, RepositoriAkun, RepositoriDiksi, RepositoriEditorial, RepositoriKonten, RepositoriPengguna } from '../antarmuka.js';
import { saringValid } from '../saring.js';
import {
  keDiksiTerbit, keProgresBelajar, keProgresLatihan, keRevisi, keRevisiDiksi, keRingkasanEntri, keRingkasanKunciDiksi,
  keRiwayat, keTerbitMentah,
} from './peta.js';

const RELASI_TERBIT = 'revisi_terbit:revisi!entri_konten_revisi_terbit_id_fkey(id, isi, refs)';
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
      let kueri = klien.from('entri_konten').select(`id, jenis, slug, urutan, versi_terbit, ${RELASI_TERBIT}`)
        .not('revisi_terbit_id', 'is', null).order('urutan');
      if (saring.jenis) kueri = kueri.eq('jenis', saring.jenis);
      if (saring.sejakVersi !== undefined) kueri = kueri.gt('versi_terbit', saring.sejakVersi);
      return saringValid((await hasil(kueri) as any[]).map(keTerbitMentah));
    },
    async daftarRevisi(entriId) {
      return (await hasil(klien.from('revisi').select('*').eq('entri_id', entriId).order('dibuat_pada')) as any[]).map(keRevisi);
    },
    async daftarEntri(jenis) {
      const kueri = klien.from('entri_konten').select('id, jenis, slug, urutan, revisi_terbit_id, revisi!revisi_entri_id_fkey(*)')
        .eq('jenis', jenis).order('urutan').order('slug');
      return (await hasil(kueri) as any[]).map(keRingkasanEntri);
    },
    async daftarRefs() { return (await hasil(klien.from('daftar_refs').select('kode, bab').order('kode'))) as { kode: string; bab: number }[]; },
  };

  const editorial: RepositoriEditorial = {
    async buatEntri(jenis, slug, urutan) {
      const baris = await hasil(klien.from('entri_konten').insert({ jenis, slug, urutan }).select('id').single());
      return (baris as { id: string }).id;
    },
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
    async antreanReview() {
      return (await hasil(klien.from('revisi').select('*').eq('status', 'diajukan').order('dibuat_pada')) as any[]).map(keRevisi);
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
    async daftarRevisi(kunci) {
      return (await hasil(klien.from('revisi_diksi').select('*').eq('kunci', kunci).order('dibuat_pada')) as any[]).map(keRevisiDiksi);
    },
    async daftarKunci() {
      const kueri = klien.from('diksi')
        .select(`kunci, halaman, versi_terbit, ${RELASI_TERBIT_DIKSI}, semua_revisi:revisi_diksi!revisi_diksi_kunci_fkey(*)`)
        .order('halaman').order('kunci');
      return (await hasil(kueri) as any[]).map(keRingkasanKunciDiksi);
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
    async bacaPreferensi() {
      const baris = await hasil(klien.from('preferensi').select('*').maybeSingle()) as any;
      return baris ? { isi: baris.isi, diubahPada: baris.diubah_pada } : null;
    },
    async simpanPreferensi(baris) {
      await hasil(klien.from('preferensi').upsert({ user_id: await userId(), isi: baris.isi, diubah_pada: baris.diubahPada }));
    },
  };

  const akun: RepositoriAkun = {
    async sesi() {
      const { data } = await klien.auth.getUser();
      return data.user ? { userId: data.user.id, email: data.user.email ?? '' } : null;
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
  };

  return { konten, editorial, diksi, pengguna, akun };
}
