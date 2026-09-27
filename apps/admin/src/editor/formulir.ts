// Deskripsi form per jenis konten (data, bukan JSX). Menerima: jenis konten. Memutuskan: bidang apa saja yang tampil,
// labelnya, dan cara nilainya dibentuk (teks, angka, Markdown, dst.). Menyerahkan ke nilaiForm.ts (konversi isi ↔ nilai)
// dan FormKonten.tsx (perender). Field isi yang tidak disebut di sini tidak hilang: nilaiForm mempertahankannya dari isi asal.
import type { JenisKonten } from '@waris/content';

export type JenisBidang =
  | 'teks' | 'teksPanjang' | 'angka' | 'pilihan' | 'centang' | 'tautan'
  | 'markdownBlok' | 'markdownPotongan' | 'pilihanKuis' | 'kasus' | 'barisAhwal';

/** Sumber opsi dropdown: runtime (modul, kelompok FAQ, refs, alasan ahwal yang sudah dipakai) atau statis dari KB
 * (istilah glosarium, judul bab, kunci ahli waris). */
export type SumberOpsi = 'modul' | 'kelompokFaq' | 'istilah' | 'bab' | 'refs' | 'kunciAhliWaris' | 'kodeAlasan';

/** Bidang identitas: kunci yang dipakai web (URL, progres pengguna), jadi slug entri diambil dari sini dan bidangnya
 * terkunci setelah pernah terbit. Kosong saat simpan → diisi otomatis: `dari` = slug dari bidang itu; `awalan` = kode
 * berikutnya (K-01, K-02, …) yang sudah diisikan saat entri baru dibuka. */
export interface Identitas { dari?: string; awalan?: string }

export interface Bidang {
  /** Jalur di isi, dipisah titik: `ar.judul`. */
  jalur: string;
  label: string;
  jenis: JenisBidang;
  /** Kosong → field dihapus dari isi (atau `null` bila `kosongJadiNull`). */
  opsional?: boolean;
  kosongJadiNull?: boolean;
  arab?: boolean;
  opsi?: readonly string[];
  /** Tampil sebagai dropdown berisi opsi runtime; berlaku juga untuk bidang angka (nomor modul). */
  sumberOpsi?: SumberOpsi;
  /** Pilihan boleh diisi nilai baru di luar opsi (kelompok FAQ). */
  bolehBaru?: boolean;
  bantuan?: string;
  /** Metadata: tampil di panel Info di samping isi, bukan di kolom utama. */
  samping?: boolean;
  identitas?: Identitas;
}

export interface Bagian {
  judul?: string;
  /** Bagian berupa objek opsional di isi (mis. `ar`); sakelar mati → objek dihapus. */
  objekOpsional?: string;
  bidang: Bidang[];
}

const BANTUAN_MARKDOWN = 'Markdown: **tebal**, *miring*, [[id-istilah]], [R04-2] untuk dalil.';
const BANTUAN_MARKDOWN_BLOK = `${BANTUAN_MARKDOWN} Blok: ## judul, - daftar, > catatan, tabel, \`\`\`kasus / \`\`\`video / \`\`\`kuis.`;

const blokArab = (jalur: string, label: string): Bidang => ({ jalur, label, jenis: 'markdownBlok', arab: true, opsional: true });

const BANTUAN_IDENTITAS = 'Dipakai sebagai alamat tautan. Kosongkan untuk dibuat otomatis.';

export const FORM_KONTEN: Record<JenisKonten, Bagian[]> = {
  modul: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks' },
      { jalur: 'ringkas', label: 'Ringkasan', jenis: 'teksPanjang' },
      { jalur: 'nomor', label: 'Nomor modul', jenis: 'angka', samping: true, identitas: {},
        bantuan: 'Menentukan urutan modul dan dipakai materi untuk menunjuk modulnya.' },
    ] },
    { judul: 'Versi Arab', objekOpsional: 'ar', bidang: [
      { jalur: 'ar.judul', label: 'Judul (Arab)', jenis: 'teks', arab: true },
      { jalur: 'ar.ringkas', label: 'Ringkasan (Arab)', jenis: 'teksPanjang', arab: true },
    ] },
  ],
  materi: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks' },
      { jalur: 'tujuan', label: 'Tujuan pembelajaran', jenis: 'teksPanjang' },
      { jalur: 'blok', label: 'Isi materi', jenis: 'markdownBlok', bantuan: BANTUAN_MARKDOWN_BLOK },
      { jalur: 'modul', label: 'Modul', jenis: 'angka', sumberOpsi: 'modul', samping: true },
      { jalur: 'perluCek', label: 'Perlu dicek tim keilmuan', jenis: 'centang', samping: true },
      { jalur: 'slug', label: 'Slug', jenis: 'teks', samping: true, identitas: { dari: 'judul' }, bantuan: BANTUAN_IDENTITAS },
    ] },
    { judul: 'Versi Arab', objekOpsional: 'ar', bidang: [
      { jalur: 'ar.judul', label: 'Judul (Arab)', jenis: 'teks', arab: true },
      { jalur: 'ar.tujuan', label: 'Tujuan (Arab)', jenis: 'teksPanjang', arab: true },
      { ...blokArab('ar.blok', 'Isi materi (Arab)'), bantuan: 'Kosongkan bila isi masih memakai versi Indonesia.' },
    ] },
  ],
  soal_kuis: [
    { bidang: [
      { jalur: 'pertanyaan', label: 'Pertanyaan', jenis: 'markdownPotongan', bantuan: BANTUAN_MARKDOWN },
      { jalur: 'pilihan', label: 'Pilihan jawaban', jenis: 'pilihanKuis' },
      { jalur: 'pembahasan', label: 'Pembahasan', jenis: 'markdownPotongan', bantuan: BANTUAN_MARKDOWN },
      { jalur: 'bab', label: 'Bab KB', jenis: 'angka', sumberOpsi: 'bab', samping: true },
      { jalur: 'kode', label: 'Kode soal', jenis: 'teks', samping: true, identitas: { awalan: 'K-' },
        bantuan: 'Diisi otomatis. Dipakai untuk menyimpan progres latihan pengguna.' },
    ] },
  ],
  soal_hitung: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks', bantuan: 'Susunan ahli waris, mis. "Istri, ayah, ibu, anak laki-laki".' },
      { jalur: 'topik', label: 'Topik', jenis: 'teks', bantuan: 'Pokok yang dilatih, mis. "Ayah fardh saja".' },
      { jalur: 'kasus', label: 'Kasus', jenis: 'kasus' },
      { jalur: 'bab', label: 'Bab KB', jenis: 'angka', sumberOpsi: 'bab', samping: true },
      { jalur: 'tingkat', label: 'Tingkat', jenis: 'pilihan', opsi: ['dasar', 'menengah', 'sulit'], samping: true },
      { jalur: 'sumber', label: 'Sumber', jenis: 'teks', samping: true, bantuan: 'Asal kasus, mis. "KB 16 #20".' },
      { jalur: 'kode', label: 'Kode soal', jenis: 'teks', samping: true, identitas: { awalan: 'H-' },
        bantuan: 'Diisi otomatis. Dipakai untuk menyimpan progres latihan pengguna.' },
    ] },
  ],
  tanya_jawab: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks' },
      { jalur: 'ringkasan', label: 'Ringkasan', jenis: 'teksPanjang' },
      { jalur: 'kasus', label: 'Kasus', jenis: 'markdownBlok', bantuan: BANTUAN_MARKDOWN_BLOK },
      { jalur: 'penyelesaian', label: 'Penyelesaian', jenis: 'markdownBlok', bantuan: BANTUAN_MARKDOWN_BLOK },
      { jalur: 'jenis', label: 'Bentuk jawaban', jenis: 'pilihan', opsi: ['Saran ustadz', 'Fatwa'], samping: true },
      { jalur: 'sumber', label: 'Sumber', jenis: 'teks', samping: true },
      { jalur: 'slug', label: 'Slug', jenis: 'teks', samping: true, identitas: { dari: 'judul' }, bantuan: BANTUAN_IDENTITAS },
    ] },
    { judul: 'Versi Arab', objekOpsional: 'ar', bidang: [
      { jalur: 'ar.judul', label: 'Judul (Arab)', jenis: 'teks', arab: true },
      { jalur: 'ar.ringkasan', label: 'Ringkasan (Arab)', jenis: 'teksPanjang', arab: true },
      { jalur: 'ar.sumber', label: 'Sumber (Arab)', jenis: 'teks', arab: true },
      blokArab('ar.kasus', 'Kasus (Arab)'),
      blokArab('ar.penyelesaian', 'Penyelesaian (Arab)'),
    ] },
  ],
  faq: [
    { bidang: [
      { jalur: 'pertanyaan', label: 'Pertanyaan', jenis: 'teks' },
      { jalur: 'jawaban', label: 'Jawaban', jenis: 'markdownBlok', bantuan: BANTUAN_MARKDOWN_BLOK },
      { jalur: 'kelompok', label: 'Kelompok', jenis: 'pilihan', sumberOpsi: 'kelompokFaq', bolehBaru: true, samping: true },
      { jalur: 'id', label: 'Alamat tautan', jenis: 'teks', samping: true, identitas: { dari: 'pertanyaan' }, bantuan: BANTUAN_IDENTITAS },
    ] },
  ],
  kitab: [
    { bidang: [
      { jalur: 'judul', label: 'Judul kitab', jenis: 'teks' },
      { jalur: 'tautan', label: 'Tautan', jenis: 'tautan', opsional: true },
      { jalur: 'pdf', label: 'Tautan PDF', jenis: 'tautan', opsional: true },
    ] },
  ],
  syahid: [
    { bidang: [
      { jalur: 'hukum', label: 'Hukum', jenis: 'teks' },
      { jalur: 'syahid', label: 'Syahid (Arab)', jenis: 'teksPanjang', arab: true },
      { jalur: 'surah', label: 'Surah', jenis: 'teks', samping: true },
      { jalur: 'ayat', label: 'Ayat', jenis: 'angka', samping: true },
      { jalur: 'rujukan', label: 'Rujukan', jenis: 'pilihan', sumberOpsi: 'refs', samping: true },
    ] },
  ],
  glosarium_ar: [
    { bidang: [
      { jalur: 'istilahId', label: 'Istilah', jenis: 'pilihan', sumberOpsi: 'istilah', identitas: {} },
      { jalur: 'makna', label: 'Makna (Arab)', jenis: 'teksPanjang', arab: true },
      { jalur: 'artiAwam', label: 'Arti awam (Arab)', jenis: 'teksPanjang', arab: true, opsional: true },
      { jalur: 'contoh', label: 'Contoh (Arab)', jenis: 'teksPanjang', arab: true, opsional: true },
    ] },
  ],
  ahwal: [
    { bidang: [
      { jalur: 'kunci', label: 'Ahli waris', jenis: 'pilihan', sumberOpsi: 'kunciAhliWaris', identitas: {} },
      { jalur: 'baris', label: 'Kemungkinan bagian', jenis: 'barisAhwal', sumberOpsi: 'kodeAlasan' },
    ] },
  ],
  teks_edukasi: [
    { bidang: [
      { jalur: 'id', label: 'Teks (Indonesia)', jenis: 'teksPanjang' },
      { jalur: 'ar', label: 'Teks (Arab)', jenis: 'teksPanjang', arab: true, opsional: true },
    ] },
  ],
  cheatsheet: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks' },
      { jalur: 'judulAr', label: 'Judul (Arab)', jenis: 'teks', arab: true, opsional: true },
      { jalur: 'deskripsi', label: 'Deskripsi', jenis: 'teksPanjang' },
      { jalur: 'tautan', label: 'Tautan', jenis: 'tautan', opsional: true, kosongJadiNull: true },
    ] },
  ],
};

/** Bidang identitas satu jenis (paling banyak satu), atau undefined. */
export const bidangIdentitas = (jenis: JenisKonten): Bidang | undefined =>
  FORM_KONTEN[jenis].flatMap(bagian => bagian.bidang).find(bidang => bidang.identitas);

/** Jenis yang punya Versi Arab sebagai bagian tersendiri (tab Arab di editor). */
export const punyaVersiArab = (jenis: JenisKonten): boolean => FORM_KONTEN[jenis].some(bagian => bagian.objekOpsional);

/** Isi awal entri baru: field yang wajib di skema tapi tidak punya bidang (mis. urutan materi). */
export const ISI_AWAL: Partial<Record<JenisKonten, Record<string, unknown>>> = {
  materi: { urutan: 0, perluCek: true },
  soal_kuis: { indeksBenar: 0 },
  soal_hitung: { tingkat: 'dasar', kasus: { pewaris: 'L', ahliWaris: [], harta: '0', harapan: { saham: {}, ashlAkhir: '0' } } },
  ahwal: { baris: [] },
};
