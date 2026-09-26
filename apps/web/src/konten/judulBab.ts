// Judul bab KB dan nama surah sebagai teks UI berterjemah. Satu baris literal per entri JUDUL_BAB/surah, supaya
// kunci diksinya terlihat oleh pemeriksa cakupan (t dinamis tidak bisa dicek).
import { JUDUL_BAB } from '@waris/content';
import { t } from '../terjemah';

export const judulBab = (bab: number): string => (({
  1: t('bab.pendahuluan_dan_hak_hak_atas_tirkah'),
  2: t('bab.asas_kewarisan_syarat_rukun_asbab_mawani'),
  3: t('bab.daftar_dan_klasifikasi_ahli_waris'),
  4: t('bab.ashabul_furudh_furudh_muqaddarah_dan_11'),
  5: t('hitung.ashabah'),
  6: t('bab.hajb_penghalangan'),
  7: t('bab.masalah_khusus_furudh_umariyyatain_dan_musyarrakah'),
  8: t('bab.kakek_bersama_saudara_al_jadd_wal'),
  9: t('bab.hisab_ashlul_mas_alah_aul_radd'),
  10: t('bab.tashih_koreksi_pembagian'),
  11: t('bab.pembagian_tirkah_qismah_dan_takharuj'),
  12: t('bab.munasakhat_kematian_berantai'),
  13: t('bab.kasus_khusus_haml_mafqud_khuntsa_gharqa'),
  14: t('bab.dzawil_arham'),
  16: t('bab.kasus_uji_test_cases_terverifikasi'),
}) as Record<number, string>)[bab] ?? JUDUL_BAB[bab] ?? '';

export const namaSurah = (surah: string): string => (({
  'An-Nisa': t('rujukan.an_nisa'),
}) as Record<string, string>)[surah] ?? surah;
