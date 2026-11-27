// Soal buta (spec 4A.9): judul soal membocorkan susunan keluarga ("Suami, dua saudari kandung"), jadi sebelum soal
// dikerjakan atau jawabannya dibuka daftar dan pratinjau hanya menampilkan kodenya. Satu fungsi supaya semua tempat sepakat.

import type { SoalHitung } from '@waris/content';
import { adalahSoalBank } from '../../bank/soalBank';
import { t } from '../../terjemah';

/** `selesai` = soal sudah punya catatan (benar, atau jawabannya dibuka): saat itu judul aslinya aman ditampilkan. */
export const judulSoalTampil = (soal: Pick<SoalHitung, 'kode' | 'judul'>, selesai: boolean): string =>
  selesai ? soal.judul : adalahSoalBank(soal.kode) ? t('latihan.soal_dari_bank') : t('latihan.soal_kode', { kode: soal.kode });
