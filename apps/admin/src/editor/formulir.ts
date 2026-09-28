// Deskripsi form per jenis konten (data, bukan JSX). Menerima: jenis konten. Memutuskan: bidang apa saja yang tampil,
// labelnya, dan cara nilainya dibentuk (teks, angka, Markdown, dst.). Menyerahkan ke nilaiForm.ts (konversi isi ↔ nilai)
// dan FormKonten.tsx (perender). Field isi yang tidak disebut di sini tidak hilang: nilaiForm mempertahankannya dari isi asal.
import type { JenisKonten } from '@waris/content';

export type JenisBidang =
  | 'teks' | 'teksPanjang' | 'angka' | 'pilihan' | 'centang' | 'tautan'
  | 'markdownBlok' | 'markdownPotongan' | 'pilihanKuis' | 'kasus' | 'barisAhwal';

/** Satu opsi dropdown runtime. */
export interface Opsi { nilai: string; label: string }

/** Sumber opsi dropdown: runtime (modul, kelompok FAQ, refs, alasan ahwal yang sudah dipakai) atau statis dari KB
 * (istilah glosarium, judul bab, kunci ahli waris, judul kitab). */
export type SumberOpsi = 'modul' | 'kelompokFaq' | 'istilah' | 'bab' | 'refs' | 'kunciAhliWaris' | 'kodeAlasan' | 'kitab';

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
  /** Apa yang diisi & di mana tampil di web. */
  bantuan?: string;
  /** Isi awal yang bisa dipakai penulis saat bidang masih kosong (tautan "Pakai templat"). */
  templat?: string;
  /** Contoh isian: placeholder bidang pendek, baris "Contoh:" untuk bidang panjang. */
  contoh?: string;
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

const BANTUAN_IDENTITAS = 'Dipakai sebagai alamat tautan di web. Kosongkan: dibuat otomatis dari judul.';
const BANTUAN_KODE_SOAL = 'Diisi otomatis. Dipakai untuk menyimpan progres latihan pengguna.';
const BANTUAN_BAB = 'Bab pembahasan yang menjadi dasar isi ini. Dipakai untuk mengelompokkan dan menyaring.';

// Susunan penyelesaian tanya jawab yang disarankan: siapa ahli warisnya, pembagiannya, lalu catatan.
const TEMPLAT_PENYELESAIAN = `## Ahli waris

- 

## Pembagian

| Ahli waris | Bagian | Alasan |
| --- | --- | --- |
|  |  |  |

## Catatan

`;

// Templat berikut hanya kerangka susunan (judul bagian + petunjuk dalam kurung), bukan isi hukum; penulis menggantinya.
const TEMPLAT_PELAJARAN = `## Masalahnya

(Situasi yang sering ditanyakan, satu atau dua kalimat.)

## Aturannya

(Aturan beserta dalilnya; sisipkan dalil lewat tombol Sisip rujukan. Tabel sangat membantu.)

## Contoh

(Sisipkan contoh lewat tombol Sisip contoh kasus, lalu jelaskan langkahnya.)

## Cek pemahaman

(Sisipkan soal lewat tombol Sisip kuis.)
`;

const TEMPLAT_JAWABAN_FAQ = `(Kalimat pertama langsung menjawab: ya / tidak / tergantung.)

(Dalilnya; sisipkan lewat tombol Sisip rujukan.)

**Catatan:** (hal yang perlu diperhatikan, bila ada)
`;

const TEMPLAT_CERITA_KASUS = `(Siapa yang wafat, laki-laki atau perempuan.)

(Siapa saja keluarga yang masih hidup saat ia wafat.)

(Hartanya apa saja, berapa utang dan wasiatnya.)

(Apa yang ditanyakan.)
`;

const TEMPLAT_PEMBAHASAN_KUIS = '(Satu kalimat: kenapa jawaban ini benar, lalu dalilnya lewat Sisip rujukan.)';

const blokArab = (jalur: string, label: string): Bidang => ({ jalur, label, jenis: 'markdownBlok', arab: true, opsional: true });

export const FORM_KONTEN: Record<JenisKonten, Bagian[]> = {
  modul: [
    { bidang: [
      { jalur: 'judul', label: 'Judul modul', jenis: 'teks', contoh: 'Bagian pasti (furudh)',
        bantuan: 'Tampil sebagai judul kelompok di halaman Belajar. Singkat, 2–5 kata.' },
      { jalur: 'ringkas', label: 'Ringkasan', jenis: 'teksPanjang', contoh: 'Enam bagian pasti dan siapa saja yang mendapatkannya.',
        bantuan: 'Satu kalimat tentang isi modul; muncul saat kursor diarahkan ke modul di halaman Belajar.' },
      { jalur: 'nomor', label: 'Nomor modul', jenis: 'angka', samping: true, identitas: {},
        bantuan: 'Menentukan urutan modul dan dipakai materi untuk menunjuk modulnya.' },
    ] },
    { judul: 'Versi Arab', objekOpsional: 'ar', bidang: [
      { jalur: 'ar.judul', label: 'Judul modul (Arab)', jenis: 'teks', arab: true },
      { jalur: 'ar.ringkas', label: 'Ringkasan (Arab)', jenis: 'teksPanjang', arab: true },
    ] },
  ],
  materi: [
    { bidang: [
      { jalur: 'judul', label: 'Judul pelajaran', jenis: 'teks', contoh: 'Enam bagian pasti, dan bagian suami-istri',
        bantuan: 'Tampil sebagai judul besar di halaman pelajaran dan di daftar modul.' },
      { jalur: 'tujuan', label: 'Tujuan pembelajaran', jenis: 'teksPanjang',
        contoh: 'Setelah pelajaran ini, Anda bisa menyebut enam bagian pasti dan kapan suami/istri mendapat 1/2, 1/4, atau 1/8.',
        bantuan: 'Tampil tepat di bawah judul. Satu atau dua kalimat: apa yang bisa dilakukan pembaca setelah membaca.' },
      { jalur: 'blok', label: 'Isi pelajaran', jenis: 'markdownBlok', templat: TEMPLAT_PELAJARAN,
        contoh: 'Masalahnya apa → aturannya (dengan dalil) → contoh kasus → cek pemahaman.',
        bantuan: 'Isi utama halaman pelajaran. Panjang ideal 300–700 kata; setiap klaim hukum diberi dalil lewat tombol Sisip rujukan.' },
      { jalur: 'modul', label: 'Modul', jenis: 'angka', sumberOpsi: 'modul', samping: true,
        bantuan: 'Pelajaran tampil di bawah modul ini.' },
      { jalur: 'perluCek', label: 'Perlu dicek tim keilmuan', jenis: 'centang', samping: true,
        bantuan: 'Centang selama isi belum diperiksa ustadz; halaman pelajaran diberi tanda "draf, belum direview".' },
      { jalur: 'slug', label: 'Alamat tautan', jenis: 'teks', samping: true, identitas: { dari: 'judul' }, bantuan: BANTUAN_IDENTITAS },
    ] },
    { judul: 'Versi Arab', objekOpsional: 'ar', bidang: [
      { jalur: 'ar.judul', label: 'Judul pelajaran (Arab)', jenis: 'teks', arab: true },
      { jalur: 'ar.tujuan', label: 'Tujuan (Arab)', jenis: 'teksPanjang', arab: true },
      { ...blokArab('ar.blok', 'Isi pelajaran (Arab)'), bantuan: 'Kosongkan bila isi masih memakai versi Indonesia.' },
    ] },
  ],
  soal_kuis: [
    { bidang: [
      { jalur: 'tingkat', label: 'Tingkat', jenis: 'pilihan', opsi: ['dasar', 'menengah', 'sulit'], opsional: true, samping: true,
        bantuan: 'Kosong = dasar. Menentukan besar XP yang didapat pengguna.' },
      { jalur: 'pertanyaan', label: 'Pertanyaan', jenis: 'markdownPotongan', contoh: 'Kapan istri mendapat 1/8?',
        bantuan: 'Satu pertanyaan yang menguji satu konsep. Tulis seperti bertanya ke orang awam.' },
      { jalur: 'pilihan', label: 'Pilihan jawaban', jenis: 'pilihanKuis',
        bantuan: 'Minimal dua, tepat satu yang benar. Pilihan salah sebaiknya kesalahan yang memang sering terjadi, bukan jawaban ngawur.' },
      { jalur: 'pembahasan', label: 'Kenapa jawaban ini benar', jenis: 'markdownPotongan', templat: TEMPLAT_PEMBAHASAN_KUIS,
        contoh: 'Istri mendapat 1/8 bila suami punya anak atau cucu dari anak laki-laki.',
        bantuan: 'Bagian pertama pembahasan, tampil setelah pengguna menjawab. Sisipkan dalilnya.' },
      { jalur: 'pengecoh', label: 'Kenapa pilihan lain salah', jenis: 'markdownPotongan', opsional: true,
        contoh: 'Jumlah istri tidak mengubah besar bagian; mereka berbagi rata.',
        bantuan: 'Luruskan salah paham yang membuat orang memilih jawaban lain.' },
      { jalur: 'catatan', label: 'Catatan tambahan', jenis: 'markdownPotongan', opsional: true,
        bantuan: 'Hal kecil yang perlu diingat, tampil paling bawah dengan huruf lebih kecil.' },
      { jalur: 'bab', label: 'Bab', jenis: 'angka', sumberOpsi: 'bab', samping: true, bantuan: BANTUAN_BAB },
      { jalur: 'kode', label: 'Kode soal', jenis: 'teks', samping: true, identitas: { awalan: 'K-' }, bantuan: BANTUAN_KODE_SOAL },
    ] },
  ],
  soal_hitung: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks', contoh: 'Suami, dua saudari kandung',
        bantuan: 'Susunan ahli waris dalam bahasa sehari-hari. Jangan membocorkan jawaban atau topiknya.' },
      { jalur: 'topik', label: 'Topik', jenis: 'teks', contoh: "'Aul",
        bantuan: 'Konsep yang dilatih. Baru ditampilkan setelah soal dikerjakan.' },
      { jalur: 'kasus', label: 'Kasus', jenis: 'kasus',
        bantuan: 'Pilih ahli waris; kunci jawabannya dihitung otomatis oleh kalkulator. Harta selalu Rp 120.000.000.' },
      { jalur: 'bab', label: 'Bab', jenis: 'angka', sumberOpsi: 'bab', samping: true, bantuan: BANTUAN_BAB },
      { jalur: 'tingkat', label: 'Tingkat', jenis: 'pilihan', opsi: ['dasar', 'menengah', 'sulit'], samping: true },
      { jalur: 'sumber', label: 'Sumber', jenis: 'teks', samping: true, contoh: 'Kasus uji no. 5',
        bantuan: 'Asal kasus: nomor kasus uji tim keilmuan, atau nama kitab dan halamannya.' },
      { jalur: 'kode', label: 'Kode soal', jenis: 'teks', samping: true, identitas: { awalan: 'H-' }, bantuan: BANTUAN_KODE_SOAL },
    ] },
  ],
  tanya_jawab: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks', contoh: 'Sengketa rumah peninggalan',
        bantuan: 'Tampil di daftar Tanya jawab dan sebagai judul halaman kasus.' },
      { jalur: 'ringkasan', label: 'Ringkasan', jenis: 'teksPanjang',
        contoh: 'Rumah peninggalan ayah ditempati salah satu anak; bagaimana membaginya?',
        bantuan: 'Satu kalimat di bawah judul pada daftar Tanya jawab.' },
      { jalur: 'kasus', label: 'Kasus', jenis: 'markdownBlok', templat: TEMPLAT_CERITA_KASUS,
        bantuan: 'Cerita kasus seperti yang ditanyakan: siapa yang wafat, siapa ahli warisnya, hartanya apa.' },
      { jalur: 'penyelesaian', label: 'Penyelesaian', jenis: 'markdownBlok', templat: TEMPLAT_PENYELESAIAN,
        bantuan: 'Jawaban ustadz atau lembaga fatwa. Hanya isi bila sumbernya jelas. Pakai templat supaya susunannya seragam.' },
      { jalur: 'jenis', label: 'Bentuk jawaban', jenis: 'pilihan', opsi: ['Saran ustadz', 'Fatwa'], samping: true },
      { jalur: 'sumber', label: 'Sumber', jenis: 'teks', samping: true, contoh: 'Ustadz Fulan, kajian 12 Mei 2025',
        bantuan: 'Siapa yang menjawab dan di mana.' },
      { jalur: 'slug', label: 'Alamat tautan', jenis: 'teks', samping: true, identitas: { dari: 'judul' }, bantuan: BANTUAN_IDENTITAS },
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
      { jalur: 'pertanyaan', label: 'Pertanyaan', jenis: 'teks', contoh: 'Apakah anak angkat mendapat warisan?',
        bantuan: 'Tulis seperti orang awam bertanya, bukan seperti judul bab.' },
      { jalur: 'jawaban', label: 'Jawaban', jenis: 'markdownBlok', templat: TEMPLAT_JAWABAN_FAQ,
        contoh: 'Tidak lewat jalur waris. Sebab mewarisi hanya empat: kekerabatan, pernikahan, wala\', dan Islam.',
        bantuan: 'Kalimat pertama langsung menjawab. Kelompok Fikih wajib diberi dalil.' },
      { jalur: 'kelompok', label: 'Kelompok', jenis: 'pilihan', sumberOpsi: 'kelompokFaq', bolehBaru: true, samping: true, contoh: 'Fikih',
        bantuan: 'Judul kelompok di halaman FAQ. Pilih yang sudah ada, atau ketik nama baru.' },
      { jalur: 'id', label: 'Alamat tautan', jenis: 'teks', samping: true, identitas: { dari: 'pertanyaan' }, bantuan: BANTUAN_IDENTITAS },
    ] },
  ],
  kitab: [
    { bidang: [
      { jalur: 'judul', label: 'Judul kitab', jenis: 'pilihan', sumberOpsi: 'kitab',
        bantuan: 'Pilih dari daftar kitab rujukan aplikasi.' },
      { jalur: 'tautan', label: 'Tautan baca', jenis: 'tautan', opsional: true, contoh: 'https://…',
        bantuan: 'Mengisi tombol "Baca kitab" di halaman Rujukan. Hanya situs resmi atau yang legal.' },
      { jalur: 'pdf', label: 'Tautan PDF', jenis: 'tautan', opsional: true,
        bantuan: 'Hanya berkas yang lisensinya jelas boleh dibagikan.' },
    ] },
  ],
  syahid: [
    { bidang: [
      { jalur: 'hukum', label: 'Hukum', jenis: 'teks', contoh: 'Istri mendapat 1/8 bila suami punya anak',
        bantuan: 'Hukum yang didasari potongan ayat ini; tampil sebagai pilihan di halaman Rujukan.' },
      { jalur: 'syahid', label: 'Potongan ayat', jenis: 'teksPanjang', arab: true,
        bantuan: 'Salin persis dari teks ayatnya, termasuk harakat. Diperiksa otomatis saat disimpan.' },
      { jalur: 'surah', label: 'Surah', jenis: 'teks', samping: true, contoh: 'An-Nisa' },
      { jalur: 'ayat', label: 'Ayat', jenis: 'angka', samping: true, contoh: '12' },
      { jalur: 'rujukan', label: 'Dalil', jenis: 'pilihan', sumberOpsi: 'refs', samping: true },
    ] },
  ],
  glosarium_ar: [
    { bidang: [
      { jalur: 'istilahId', label: 'Istilah', jenis: 'pilihan', sumberOpsi: 'istilah', identitas: {},
        bantuan: 'Istilah glosarium yang diberi versi Arab.' },
      { jalur: 'makna', label: 'Makna (Arab)', jenis: 'teksPanjang', arab: true },
      { jalur: 'artiAwam', label: 'Arti awam (Arab)', jenis: 'teksPanjang', arab: true, opsional: true },
      { jalur: 'contoh', label: 'Contoh (Arab)', jenis: 'teksPanjang', arab: true, opsional: true },
    ] },
  ],
  ahwal: [
    { bidang: [
      { jalur: 'kunci', label: 'Ahli waris', jenis: 'pilihan', sumberOpsi: 'kunciAhliWaris', identitas: {} },
      { jalur: 'baris', label: 'Kemungkinan bagian', jenis: 'barisAhwal', sumberOpsi: 'kodeAlasan',
        bantuan: 'Satu baris = satu keadaan (mis. 1/2 bila sendirian). Baris yang cocok dengan hasil hitung disorot di tabel ahwal.' },
    ] },
  ],
  teks_edukasi: [
    { bidang: [
      { jalur: 'id', label: 'Teks (Indonesia)', jenis: 'teksPanjang', bantuan: 'Teks yang tampil di layar aplikasi.' },
      { jalur: 'ar', label: 'Teks (Arab)', jenis: 'teksPanjang', arab: true, opsional: true },
    ] },
  ],
  cheatsheet: [
    { bidang: [
      { jalur: 'judul', label: 'Judul', jenis: 'teks', contoh: 'Tabel bagian pasti' },
      { jalur: 'judulAr', label: 'Judul (Arab)', jenis: 'teks', arab: true, opsional: true },
      { jalur: 'deskripsi', label: 'Deskripsi', jenis: 'teksPanjang', bantuan: 'Satu kalimat tentang isi lembar ringkas ini.' },
      { jalur: 'tautan', label: 'Tautan', jenis: 'tautan', opsional: true, kosongJadiNull: true, contoh: 'https://…' },
    ] },
  ],
};

/** Bidang wajib diisi penulis: bukan opsional, bukan centang, bukan identitas (diisi otomatis). */
export const bidangWajib = (bidang: Bidang): boolean => !bidang.opsional && bidang.jenis !== 'centang' && !bidang.identitas;

/** Bidang identitas satu jenis (paling banyak satu), atau undefined. */
export const bidangIdentitas = (jenis: JenisKonten): Bidang | undefined =>
  FORM_KONTEN[jenis].flatMap(bagian => bagian.bidang).find(bidang => bidang.identitas);

/** Jenis yang punya Versi Arab sebagai bagian tersendiri (tab Arab di editor). */
export const punyaVersiArab = (jenis: JenisKonten): boolean => FORM_KONTEN[jenis].some(bagian => bagian.objekOpsional);

/** Isi awal entri baru: field yang wajib di skema tapi tidak punya bidang (mis. urutan materi). */
export const ISI_AWAL: Partial<Record<JenisKonten, Record<string, unknown>>> = {
  materi: { urutan: 0, perluCek: true },
  soal_kuis: { tingkat: 'dasar', indeksBenar: 0 },
  soal_hitung: { tingkat: 'dasar', kasus: { pewaris: 'L', ahliWaris: [], harta: '0', harapan: { saham: {}, ashlAkhir: '0' } } },
  ahwal: { baris: [] },
};
