// Isi tur singkat per layar. `sasaran` = nilai atribut data-tur pada elemen yang disorot.

import type { Layar } from '../keadaan';
import { teksEdukasi } from '../terjemah';

export interface LangkahTur { sasaran: string; judul: string; isi: string }

export const TUR: Partial<Record<Layar, LangkahTur[]>> = {
  wizard: [
    { sasaran: 'stepper', judul: teksEdukasi('tur.lima_langkah_saja'), isi: teksEdukasi('tur.ini_peta_langkahmu_langkah_yang_sudah') },
    { sasaran: 'pertanyaan', judul: teksEdukasi('tur.satu_pertanyaan_sekali'), isi: teksEdukasi('tur.jawab_pertanyaan_besar_ini_tulisan_abu') },
    { sasaran: 'bar-bawah', judul: teksEdukasi('tur.maju_dan_mundur'), isi: teksEdukasi('tur.kembali_ke_langkah_sebelumnya_atau_lanjut') },
  ],
  hasil: [
    { sasaran: 'pohon', judul: teksEdukasi('tur.pohon_keluarga'), isi: teksEdukasi('tur.warna_menunjukkan_kelompok_garis_putus_putus') },
    { sasaran: 'pembagian', judul: teksEdukasi('tur.pembagian'), isi: teksEdukasi('tur.bagian_tiap_orang_ikon_mata_menyembunyikan') },
    { sasaran: 'pembulatan', judul: teksEdukasi('tur.pembulatan'), isi: teksEdukasi('tur.muncul_hanya_kalau_ada_angka_yang') },
    { sasaran: 'langkah', judul: teksEdukasi('tur.pelajari_langkahnya'), isi: teksEdukasi('tur.buka_ini_untuk_melihat_cara_hitungnya') },
    { sasaran: 'selanjutnya', judul: teksEdukasi('tur.habis_ini_ngapain'), isi: teksEdukasi('tur.daftar_hal_yang_biasanya_dilakukan_keluarga') },
  ],
};
