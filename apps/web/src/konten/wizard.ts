// Teks kerangka wizard (4 langkah): nama langkah (stepper & tombol Lanjut), pertanyaan utama, dan caption penjelas.
// Diedit tim keilmuan/konten tanpa menyentuh logika.

import { t, teksEdukasi } from '../terjemah';

export interface TeksLangkah { nama: string; pertanyaan: string; caption: string }

// Entri yang memakai t() berupa getter: kamus diksi belum siap saat modul dimuat.
export const LANGKAH_WIZARD: TeksLangkah[] = [
  { nama: teksEdukasi('wizard.almarhum'), pertanyaan: teksEdukasi('wizard.almarhum_laki_laki_atau_perempuan'),
    caption: teksEdukasi('wizard.ini_menentukan_pasangan_yang_ditanya_nanti') },
  { nama: teksEdukasi('wizard.harta'), pertanyaan: teksEdukasi('wizard.berapa_harta_peninggalannya'),
    caption: teksEdukasi('wizard.semua_yang_dimiliki_almarhum_saat_wafat') },
  { get nama() { return t('hitung.langkah_keluarga'); }, pertanyaan: teksEdukasi('wizard.siapa_saja_keluarga_yang_ditinggalkan'),
    caption: teksEdukasi('wizard.masukkan_semua_kerabat_yang_masih_hidup') },
  { get nama() { return t('hitung.langkah_periksa'); }, get pertanyaan() { return t('hitung.periksa_pertanyaan'); }, get caption() { return t('hitung.periksa_caption'); } },
];
