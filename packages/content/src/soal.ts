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
  pertanyaan: Potongan[];
  pilihan: Potongan[][];
  indeksBenar: number;
  pembahasan: Potongan[];
}
