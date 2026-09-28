// Tipe bank soal (isinya konten jenis soal_hitung & soal_kuis di database). Kunci soal hitung (`harapan`) hanya untuk
// test, dicocokkan dengan engine.
import type { ContohKasus, Potongan } from './materi.js';

export type Tingkat = 'dasar' | 'menengah' | 'sulit';

export interface SoalHitung {
  kode: string;
  bab: number;
  tingkat: Tingkat;
  judul: string;
  kasus: ContohKasus;
  /** Konsep yang diuji; baru ditampilkan setelah soal dikerjakan. */
  topik: string;
  sumber: string;
}

export interface SoalKuis {
  kode: string;
  bab: number;
  /** Menentukan XP (spec tahap 5); kosong = dasar. */
  tingkat?: Tingkat;
  pertanyaan: Potongan[];
  pilihan: Potongan[][];
  indeksBenar: number;
  /** Kenapa jawaban benar itu benar (wajib, dengan dalil). */
  pembahasan: Potongan[];
  /** Draf dibuat dengan AI (portal): wajib lewat review sebelum pertama kali tayang. */
  dibantuAi?: boolean;
  /** Penjelasan per pilihan, sejajar dengan `pilihan`; opsional, tapi bila ada tiap pilihan wajib berpenjelasan. */
  alasanPilihan?: Potongan[][];
  /** Catatan tambahan setelah pembahasan; opsional. */
  catatan?: Potongan[];
}
