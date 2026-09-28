// "Standar konten yang baik" per jenis, ditampilkan di atas form. Ringkasan dari docs/panduan-tim-keilmuan.md
// (bagian 1, 3–10); bila panduan itu berubah, sesuaikan di sini. Aturan umum berlaku untuk semua jenis bertema fikih.
import type { JenisKonten } from '@waris/content';

export const PANDUAN_UMUM: readonly string[] = [
  'Sumber hukum hanya rujukan madzhab Syafi\'i yang ada di aplikasi. Pendapat lain boleh disebut sebagai perbandingan, dengan keterangan jelas.',
  'Setiap klaim hukum diberi dalil lewat tombol Sisip rujukan. Hal yang masih dikaji jangan dijawab; arahkan ke ahli.',
  'Pembaca utama orang awam: kalimat pendek, satu paragraf satu gagasan, istilah Arab dijelaskan saat pertama muncul.',
  'Contoh angka pakai harta Rp 120.000.000 supaya mudah dibagi 6, 8, 12, dan 24.',
];

export const PANDUAN_JENIS: Partial<Record<JenisKonten, readonly string[]>> = {
  modul: ['Satu modul = satu tema besar. Judul 2–5 kata, ringkasan satu kalimat.'],
  materi: [
    'Susunan yang disarankan: masalahnya apa → aturannya (dengan dalil, tabel sangat membantu) → contoh kasus → cek pemahaman.',
    'Panjang ideal 300–700 kata. Lebih dari itu, pecah jadi dua pelajaran.',
    'Contoh kasus yang disisipkan dihitung ulang oleh aplikasi, jadi angkanya pasti diperiksa.',
  ],
  soal_kuis: [
    'Satu soal menguji satu konsep.',
    'Tepat satu jawaban benar. Pilihan salah sebaiknya kesalahan yang sering terjadi, bukan jawaban ngawur.',
    'Pembahasan: kenapa jawaban benar (wajib, dengan dalil). Bila perlu, jelaskan tiap pilihan (semua pilihan diisi), lalu catatan singkat.',
  ],
  soal_hitung: [
    'Judul menyebut susunan ahli waris dalam bahasa sehari-hari, tanpa membocorkan topik atau jawaban.',
    'Kasus yang belum bisa dibentuk di kalkulator (cicit, dzawil arham, kasus khusus bab 13) belum bisa dijadikan soal.',
  ],
  tanya_jawab: ['Hanya isi dengan jawaban yang sumbernya jelas (ustadz atau lembaga fatwa), dan sebut sumbernya.'],
  faq: [
    'Tulis pertanyaan seperti orang awam bertanya. Kalimat pertama jawaban langsung menjawab.',
    'Kelompok Fikih wajib punya dalil. Pertanyaan yang belum dibahas rujukan aplikasi dijawab: "belum dibahas di aplikasi ini, tanyakan ke ustadz atau lembaga yang berwenang".',
  ],
  kitab: ['Judul dipilih dari daftar kitab rujukan. Tautan hanya ke situs resmi atau legal.'],
  syahid: ['Potongan ayat harus sama persis dengan teks ayatnya, termasuk harakat. Salin langsung dari teks ayat.'],
  glosarium_ar: ['Hanya menerjemahkan makna di glosarium; jangan menambah hukum.'],
};
