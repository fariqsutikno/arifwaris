// Isi konten kecil untuk tes layar admin, disalin dari packages/data/src/__tests__/contoh.ts (berkas tes paket
// lain tidak diekspor sehingga tak bisa diimpor langsung). Task 4 boleh menambah data di sini.
import { bacaIsi, type ContohKasus, type EntriFaq, type Pelajaran, type SoalHitung, type SoalKuis } from '@waris/content';
import snapshot from '../../../web/src/snapshot.json';

export const DAFTAR_FAQ_UJI: EntriFaq[] = [
  { id: 'apa-itu-tirkah', kelompok: 'Fikih', pertanyaan: 'Apa itu tirkah?', jawaban: [{ jenis: 'paragraf', isi: [{ jenis: 'teks', teks: 'Harta peninggalan.' }] }] },
  { id: 'siapa-ashabah', kelompok: 'Fikih', pertanyaan: 'Siapa ashabah?', jawaban: [{ jenis: 'paragraf', isi: [{ jenis: 'rujukan', kode: 'R05-1' }] }] },
];
export const SOAL_HITUNG_UJI: SoalHitung & { kasus: ContohKasus } = {
  kode: 'H-01', bab: 4, tingkat: 'dasar', judul: 'Istri, ayah, ibu, anak laki-laki', topik: 't', sumber: 'KB 16 #20',
  kasus: { pewaris: 'L', ahliWaris: ['ISTRI', 'AYAH', 'IBU', 'ANAK_LK'], harta: 120_000_000n,
    harapan: { saham: { ISTRI: 3n, AYAH: 4n, IBU: 4n, ANAK_LK: 13n }, ashlAkhir: 24n } },
};

/** Pelajaran nyata pertama dari snapshot web, dibaca lewat bacaIsi (bigint dipulihkan). */
export const PELAJARAN_UJI: Pelajaran = (() => {
  const baris = snapshot.konten.find(k => k.jenis === 'materi');
  const hasil = bacaIsi('materi', baris?.isi);
  if (!hasil.ok) throw new Error(`snapshot materi tidak sah: ${hasil.galat}`);
  return hasil.isi;
})();

const teks = (isi: string) => [{ jenis: 'teks' as const, teks: isi }];
/** Soal kuis lengkap (alasan tiap pilihan + pembahasan) untuk tes alur dua tahap. */
export const soalKuisUji = (kode: string, tambahan: Partial<SoalKuis> = {}): SoalKuis => ({
  kode, bab: 4, tingkat: 'dasar', pertanyaan: teks('Berapa bagian suami bila pewaris punya anak?'),
  pilihan: [teks('1/2'), teks('1/4'), teks('1/8')], indeksBenar: 1, pembahasan: teks('Suami mendapat 1/4 karena ada far\'u waris.'),
  alasanPilihan: [teks('1/2 bila tanpa anak.'), teks('Benar, ada anak.'), teks('1/8 bagian istri.')], ...tambahan,
});
