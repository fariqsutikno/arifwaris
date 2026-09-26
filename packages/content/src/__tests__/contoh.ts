// Contoh isi konten kecil untuk tes paket ini. Data nyata ada di database; cakupannya diuji di apps/web
// (__tests__/snapshot.test.ts). Blok & potongan di sini mencakup semua jenis, supaya bolak-balik tulisBlok/skema teruji.
import { DAFTAR_AYAT, type Blok, type EntriFaq, type KasusTanyaJawab, type Modul, type Pelajaran, type SoalHitung, type SoalKuis, type Syahid } from '../index.js';

export const CONTOH_BLOK: Blok[] = [
  { jenis: 'judul', tingkat: 2, isi: [{ jenis: 'teks', teks: 'Bagian ' }, { jenis: 'tebal', teks: 'suami' }] },
  { jenis: 'judul', tingkat: 3, isi: [{ jenis: 'miring', teks: 'Nishf' }] },
  { jenis: 'paragraf', isi: [
    { jenis: 'teks', teks: 'Sisa untuk ' }, { jenis: 'istilah', id: 'ashabah', teks: 'ashabah' }, { jenis: 'teks', teks: ' dan ' },
    { jenis: 'istilah', id: 'fardh', teks: 'bagian pasti' }, { jenis: 'teks', teks: ' ' }, { jenis: 'rujukan', kode: 'R04-2' },
  ] },
  { jenis: 'daftar', berurut: true, butir: [[{ jenis: 'teks', teks: 'satu' }], [{ jenis: 'teks', teks: 'dua' }]] },
  { jenis: 'daftar', berurut: false, butir: [[{ jenis: 'teks', teks: 'butir' }]] },
  { jenis: 'catatan', isi: [{ jenis: 'teks', teks: 'Catatan.' }] },
  { jenis: 'tabel', kepala: [[{ jenis: 'teks', teks: 'A' }], [{ jenis: 'teks', teks: 'B' }]],
    baris: [[[{ jenis: 'teks', teks: '1' }], [{ jenis: 'istilah', id: 'fardh', teks: 'fardh' }]]] },
  { jenis: 'kasus', kasus: { pewaris: 'L', ahliWaris: ['ISTRI', 'ANAK_PR', 'ANAK_PR', 'AYAH'], harta: 120_000_000n,
    harapan: { saham: { ISTRI: 3n, ANAK_PR: 16n, AYAH: 4n }, ashlAkhir: 24n } } },
  { jenis: 'video', idYoutube: 'dQw4w9WgXcQ', judul: 'Pengantar' },
  { jenis: 'kuis', daftarKode: ['K-01', 'K-02'] },
];

export const CONTOH_MODUL: Modul = { nomor: 1, judul: 'Pengantar', ringkas: 'r', ar: { judul: 'مقدمة', ringkas: 'م' } };
export const CONTOH_PELAJARAN: Pelajaran = { slug: 'uji', judul: 'Uji', modul: 1, urutan: 1, tujuan: 't', perluCek: true, blok: CONTOH_BLOK };
export const CONTOH_SOAL_KUIS: SoalKuis = {
  kode: 'K-01', bab: 4, pertanyaan: [{ jenis: 'teks', teks: 'Bagian suami?' }],
  pilihan: [[{ jenis: 'teks', teks: '1/2' }], [{ jenis: 'teks', teks: '1/4' }]], indeksBenar: 0, pembahasan: [{ jenis: 'rujukan', kode: 'R04-2' }],
};
export const CONTOH_SOAL_HITUNG: SoalHitung = {
  kode: 'H-01', bab: 4, tingkat: 'dasar', judul: 'Istri, ayah, ibu, anak laki-laki', topik: 't', sumber: 'KB 16 #20',
  kasus: { pewaris: 'L', ahliWaris: ['ISTRI', 'AYAH', 'IBU', 'ANAK_LK'], harta: 120_000_000n,
    harapan: { saham: { ISTRI: 3n, AYAH: 4n, IBU: 4n, ANAK_LK: 13n }, ashlAkhir: 24n } },
};
export const CONTOH_FAQ: EntriFaq = { id: 'apa-itu-tirkah', kelompok: 'Fikih', pertanyaan: 'Apa itu tirkah?', jawaban: CONTOH_BLOK.slice(0, 3) };
export const CONTOH_TANYA_JAWAB: KasusTanyaJawab = {
  slug: 'uji', judul: 'Uji', jenis: 'Fatwa', ringkasan: 'r', sumber: 's', kasus: CONTOH_BLOK.slice(2, 4), penyelesaian: CONTOH_BLOK.slice(5, 7),
};
const ayat = DAFTAR_AYAT[0]!;
export const CONTOH_SYAHID: Syahid = { surah: ayat.surah, ayat: ayat.ayat, hukum: 'h', syahid: ayat.teks.slice(0, 12), rujukan: 'R04-2' };
