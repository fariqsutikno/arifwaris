// Teks umum di luar wizard.

import { t } from '../terjemah';

/** Ganti dengan URL repo sungguhan saat dipublikasikan. */
export const TAUTAN_LAPORAN = 'https://github.com/NAMA-ORG/arif-waris/issues';

export const TEKS_HITUNG = {
  judul: 'ArifLab',
  janji: t('Ruang buat nyoba simulasi hitung waris. Masukin kasusnya, ikutin langkahnya, tiap angka dijelasin lengkap sama alasannya.'),
  mulai: {
    baru: t('Isi data almarhum, ahli waris, dan harta dari awal.'),
    impor: t('Buka file .json hasil ekspor dari aplikasi ini.'),
  },
} as const;
