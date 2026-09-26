// Isi konten kecil untuk tes layar admin, disalin dari packages/data/src/__tests__/contoh.ts (berkas tes paket
// lain tidak diekspor sehingga tak bisa diimpor langsung). Task 4 boleh menambah data di sini.
import type { EntriFaq, SoalHitung } from '@waris/content';

export const DAFTAR_FAQ_UJI: EntriFaq[] = [
  { id: 'apa-itu-tirkah', kelompok: 'Fikih', pertanyaan: 'Apa itu tirkah?', jawaban: [{ jenis: 'paragraf', isi: [{ jenis: 'teks', teks: 'Harta peninggalan.' }] }] },
  { id: 'siapa-ashabah', kelompok: 'Fikih', pertanyaan: 'Siapa ashabah?', jawaban: [{ jenis: 'paragraf', isi: [{ jenis: 'rujukan', kode: 'R05-1' }] }] },
];
export const SOAL_HITUNG_UJI: SoalHitung = {
  kode: 'H-01', bab: 4, tingkat: 'dasar', judul: 'Istri, ayah, ibu, anak laki-laki', topik: 't', sumber: 'KB 16 #20',
  kasus: { pewaris: 'L', ahliWaris: ['ISTRI', 'AYAH', 'IBU', 'ANAK_LK'], harta: 120_000_000n,
    harapan: { saham: { ISTRI: 3n, AYAH: 4n, IBU: 4n, ANAK_LK: 13n }, ashlAkhir: 24n } },
};
