// Soal bank generator di sisi web: kode → soal siap kerja yang sama bentuknya dengan soal kurasi, jadi layar soal
// hitung, penilaian, tangga bantuan, dan XP tidak perlu tahu asal soalnya. Kode bisa diurai tanpa basis data,
// jadi alamat `#/latihan/soal/<kode>` tetap terbuka setelah muat ulang. Judul dari susunan keluarga (bukan AI).

import type { SoalHitung } from '@waris/content';
import { adalahKodeGenerator, REVISI_SOAL_BANK, soalHitungDariKode } from '@waris/latihan';
import { cariSoalHitung, revisiIdSoalHitung } from '../konten/sumber';
import { ringkasKasus } from '../riwayat';

export const adalahSoalBank = adalahKodeGenerator;

const soalBankDariKode = (kode: string): SoalHitung | undefined => soalHitungDariKode(kode, kasus => ringkasKasus(kasus).judul) ?? undefined;

/** Soal kurasi lebih dulu, lalu soal bank; satu pintu untuk alamat soal, muat ulang, dan Kerjakan ulang. */
export const cariSoal = (kode: string): SoalHitung | undefined =>
  adalahKodeGenerator(kode) ? soalBankDariKode(kode) : cariSoalHitung(kode);

/** Revisi yang dikerjakan untuk kejadian percobaan; soal bank tak punya revisi di basis data. */
export const revisiIdSoal = (kode: string): string => (adalahKodeGenerator(kode) ? REVISI_SOAL_BANK : revisiIdSoalHitung(kode) ?? '');
