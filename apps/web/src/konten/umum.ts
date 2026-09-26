// Teks umum di luar wizard.

import { teksEdukasi } from '../terjemah';

/** Ganti dengan URL repo sungguhan saat dipublikasikan. */
export const TAUTAN_LAPORAN = 'https://github.com/NAMA-ORG/arif-waris/issues';

export const TEKS_HITUNG = {
  judul: 'ArifLab',
  janji: teksEdukasi('umum.ruang_buat_nyoba_simulasi_hitung_waris'),
  mulai: {
    baru: teksEdukasi('umum.isi_data_almarhum_ahli_waris_dan'),
    impor: teksEdukasi('umum.buka_file_json_hasil_ekspor_dari'),
  },
} as const;
