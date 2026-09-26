// Teks kerangka wizard: nama langkah (stepper & tombol Lanjut), pertanyaan utama, dan caption penjelas.
// Diedit tim keilmuan/konten tanpa menyentuh logika.

import { teksEdukasi } from '../terjemah';

export interface TeksLangkah { nama: string; pertanyaan: string; caption: string }

export const LANGKAH_WIZARD: TeksLangkah[] = [
  { nama: teksEdukasi('wizard.almarhum'), pertanyaan: teksEdukasi('wizard.almarhum_laki_laki_atau_perempuan'),
    caption: teksEdukasi('wizard.ini_menentukan_pasangan_yang_ditanya_nanti') },
  { nama: teksEdukasi('wizard.harta'), pertanyaan: teksEdukasi('wizard.berapa_harta_peninggalannya'),
    caption: teksEdukasi('wizard.semua_yang_dimiliki_almarhum_saat_wafat') },
  { nama: teksEdukasi('wizard.kewajiban'), pertanyaan: teksEdukasi('wizard.ada_kewajiban_yang_harus_dibayar_dulu'),
    caption: teksEdukasi('wizard.sebelum_dibagi_harta_dipakai_dulu_untuk') },
  { nama: teksEdukasi('wizard.ahli_waris'), pertanyaan: teksEdukasi('wizard.siapa_saja_keluarga_yang_ditinggalkan'),
    caption: teksEdukasi('wizard.masukkan_semua_kerabat_yang_masih_hidup') },
  { nama: teksEdukasi('wizard.kondisi_khusus'), pertanyaan: teksEdukasi('wizard.ada_kondisi_khusus'),
    caption: teksEdukasi('wizard.opsional_kebanyakan_kasus_nggak_butuh_ini') },
];
