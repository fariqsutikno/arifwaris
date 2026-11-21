// Tipe bank soal (isinya konten jenis soal_hitung & soal_kuis di database). Kunci soal hitung (`harapan`) hanya untuk
// test, dicocokkan dengan engine.
import type { ContohKasus, Potongan } from './materi.js';

export type Tingkat = 'dasar' | 'menengah' | 'sulit';

/** Isi berkas "Simpan ke berkas" kalkulator (versi ≥ 4): graf, urutan wafat, gharqa, status hidup, khuntsa, madzhab.
 *  Isinya divalidasi `bacaBerkasKasus` (@waris/latihan) di uji konten dan portal; di sini hanya bentuk luarnya. */
export type BerkasKasus = Record<string, unknown>;

/** Kasus sebuah soal hitung. Tanpa penanda `bentuk` = bentuk lama (pewaris + kunci ahli waris + harta), jadi soal lama
 *  tetap terbaca tanpa migrasi; jenis soal lain (munasakhat, mafqud, khuntsa, haml, gharqa, ...) memakai berkas. */
export type KasusSoal = ContohKasus | { bentuk: 'berkas'; berkas: BerkasKasus };
export const adalahKasusLama = (kasus: KasusSoal): kasus is ContohKasus => !('bentuk' in kasus);

export interface SoalHitung {
  kode: string;
  bab: number;
  tingkat: Tingkat;
  judul: string;
  kasus: KasusSoal;
  /** Konsep yang diuji; baru ditampilkan setelah soal dikerjakan. */
  topik: string;
  sumber: string;
  /** Poin XP yang didapat sekali per soal (1–200); kosong = mengikuti tingkat (10/20/30). Dibaca dari revisi yang dikerjakan. */
  bobotXp?: number;
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
