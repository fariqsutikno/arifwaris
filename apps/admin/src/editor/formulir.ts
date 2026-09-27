// Deskripsi form per jenis konten (data, bukan JSX). Menerima: jenis konten. Memutuskan: bidang apa saja yang tampil,
// labelnya, dan cara nilainya dibentuk (teks, angka, Markdown, dst.). Menyerahkan ke nilaiForm.ts (konversi isi ↔ nilai)
// dan FormKonten.tsx (perender). Field isi yang tidak disebut di sini tidak hilang: nilaiForm mempertahankannya dari isi asal.
import type { JenisKonten } from '@waris/content';

export type JenisBidang =
  | 'teks' | 'teksPanjang' | 'angka' | 'pilihan' | 'centang' | 'tautan'
  | 'markdownBlok' | 'markdownPotongan' | 'pilihanKuis' | 'kasus' | 'barisAhwal';

/** Satu opsi dropdown runtime. */
export interface Opsi { nilai: string; label: string }

/** Sumber opsi yang baru diketahui saat runtime (daftar modul, kelompok FAQ, istilah glosarium). */
export type SumberOpsi = 'modul' | 'kelompokFaq' | 'istilah';

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

export const FORM_KONTEN: Record<JenisKonten, Bagian[]> = {
  modul: [
    { bidang: [
      { jalur: 'nomor', label: 'Nomor modul', jenis: 'angka' },
      { jalur: 'judul', label: 'Judul', jenis: 'teks' },
      { jalur: 'ringkas', label: 'Ringkasan', jenis: 'teksPanjang' },
    ] },
    { judul: 'Versi Arab', objekOpsional: 'ar', bidang: [
      { jalur: 'ar.judul', label: 'Judul (Arab)', jenis: 'teks', arab: true },
      { jalur: 'ar.ringkas', label: 'Ringkasan (Arab)', jenis: 'teksPanjang', arab: true },
    ] },
  ],
  materi: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks' },
      { jalur: 'slug', label: 'Slug', jenis: 'teks', bantuan: 'Alamat halaman: huruf kecil dan tanda hubung.' },
      { jalur: 'modul', label: 'Modul', jenis: 'angka', sumberOpsi: 'modul' },
      { jalur: 'tujuan', label: 'Tujuan pembelajaran', jenis: 'teksPanjang' },
      { jalur: 'perluCek', label: 'Perlu dicek tim keilmuan', jenis: 'centang' },
      { jalur: 'blok', label: 'Isi materi', jenis: 'markdownBlok', bantuan: BANTUAN_MARKDOWN_BLOK },
    ] },
    { judul: 'Versi Arab', objekOpsional: 'ar', bidang: [
      { jalur: 'ar.judul', label: 'Judul (Arab)', jenis: 'teks', arab: true },
      { jalur: 'ar.tujuan', label: 'Tujuan (Arab)', jenis: 'teksPanjang', arab: true },
      { ...blokArab('ar.blok', 'Isi materi (Arab)'), bantuan: 'Kosongkan bila isi masih memakai versi Indonesia.' },
    ] },
  ],
  soal_kuis: [
    { bidang: [
      { jalur: 'kode', label: 'Kode soal', jenis: 'teks' },
      { jalur: 'bab', label: 'Bab KB', jenis: 'angka' },
      { jalur: 'tingkat', label: 'Tingkat (kosong = dasar)', jenis: 'pilihan', opsi: ['dasar', 'menengah', 'sulit'], opsional: true },
      { jalur: 'pertanyaan', label: 'Pertanyaan', jenis: 'markdownPotongan', bantuan: BANTUAN_MARKDOWN },
      { jalur: 'pilihan', label: 'Pilihan jawaban', jenis: 'pilihanKuis' },
      { jalur: 'pembahasan', label: 'Pembahasan', jenis: 'markdownPotongan', bantuan: BANTUAN_MARKDOWN },
    ] },
  ],
  soal_hitung: [
    { bidang: [
      { jalur: 'kode', label: 'Kode soal', jenis: 'teks' },
      { jalur: 'bab', label: 'Bab KB', jenis: 'angka' },
      { jalur: 'tingkat', label: 'Tingkat', jenis: 'pilihan', opsi: ['dasar', 'menengah', 'sulit'] },
      { jalur: 'judul', label: 'Judul', jenis: 'teks' },
      { jalur: 'topik', label: 'Topik', jenis: 'teks' },
      { jalur: 'sumber', label: 'Sumber', jenis: 'teks' },
      { jalur: 'kasus', label: 'Kasus', jenis: 'kasus' },
    ] },
  ],
  tanya_jawab: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks' },
      { jalur: 'slug', label: 'Slug', jenis: 'teks' },
      { jalur: 'jenis', label: 'Jenis', jenis: 'pilihan', opsi: ['Saran ustadz', 'Fatwa'] },
      { jalur: 'ringkasan', label: 'Ringkasan', jenis: 'teksPanjang' },
      { jalur: 'kasus', label: 'Kasus', jenis: 'markdownBlok', bantuan: BANTUAN_MARKDOWN_BLOK },
      { jalur: 'penyelesaian', label: 'Penyelesaian', jenis: 'markdownBlok', bantuan: BANTUAN_MARKDOWN_BLOK },
      { jalur: 'sumber', label: 'Sumber', jenis: 'teks' },
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
      { jalur: 'id', label: 'Id', jenis: 'teks' },
      { jalur: 'kelompok', label: 'Kelompok', jenis: 'pilihan', sumberOpsi: 'kelompokFaq', bolehBaru: true },
      { jalur: 'pertanyaan', label: 'Pertanyaan', jenis: 'teks' },
      { jalur: 'jawaban', label: 'Jawaban', jenis: 'markdownBlok', bantuan: BANTUAN_MARKDOWN_BLOK },
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
      { jalur: 'surah', label: 'Surah', jenis: 'teks' },
      { jalur: 'ayat', label: 'Ayat', jenis: 'angka' },
      { jalur: 'hukum', label: 'Hukum', jenis: 'teks' },
      { jalur: 'syahid', label: 'Syahid (Arab)', jenis: 'teksPanjang', arab: true },
      { jalur: 'rujukan', label: 'Rujukan', jenis: 'teks' },
    ] },
  ],
  glosarium_ar: [
    { bidang: [
      { jalur: 'istilahId', label: 'Istilah', jenis: 'pilihan', sumberOpsi: 'istilah' },
      { jalur: 'makna', label: 'Makna (Arab)', jenis: 'teksPanjang', arab: true },
      { jalur: 'artiAwam', label: 'Arti awam (Arab)', jenis: 'teksPanjang', arab: true, opsional: true },
      { jalur: 'contoh', label: 'Contoh (Arab)', jenis: 'teksPanjang', arab: true, opsional: true },
    ] },
  ],
  ahwal: [
    { bidang: [
      { jalur: 'kunci', label: 'Kunci ahli waris', jenis: 'teks' },
      { jalur: 'baris', label: 'Kemungkinan bagian', jenis: 'barisAhwal' },
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

/** Isi awal entri baru: field yang wajib di skema tapi tidak punya bidang (mis. urutan materi). */
export const ISI_AWAL: Partial<Record<JenisKonten, Record<string, unknown>>> = {
  materi: { urutan: 0, perluCek: true },
  soal_kuis: { tingkat: 'dasar', indeksBenar: 0 },
  soal_hitung: { tingkat: 'dasar', kasus: { pewaris: 'L', ahliWaris: [], harta: '0', harapan: { saham: {}, ashlAkhir: '0' } } },
  ahwal: { baris: [] },
};
