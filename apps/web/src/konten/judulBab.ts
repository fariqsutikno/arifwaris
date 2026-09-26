// Judul bab KB dan nama surah sebagai teks UI berterjemah. Satu baris literal per entri JUDUL_BAB/surah, supaya
// kunci diksinya terlihat oleh pemeriksa cakupan (t dinamis tidak bisa dicek).
import { JUDUL_BAB } from '@waris/content';
import { t } from '../terjemah';

export const judulBab = (bab: number): string => (({
  1: t('Pendahuluan dan Hak-hak atas Tirkah'),
  2: t("Asas Kewarisan (Syarat, Rukun, Asbab, Mawani')"),
  3: t('Daftar dan Klasifikasi Ahli Waris'),
  4: t('Ashabul Furudh (Furudh Muqaddarah dan 11 Ahli Waris)'),
  5: t('Ashabah'),
  6: t('Hajb (Penghalangan)'),
  7: t("Masalah Khusus Furudh ('Umariyyatain dan Musyarrakah)"),
  8: t('Kakek Bersama Saudara (al-Jadd wal-Ikhwah)'),
  9: t("Hisab (Ashlul Mas'alah, 'Aul, Radd)"),
  10: t('Tashih (Koreksi Pembagian)'),
  11: t('Pembagian Tirkah (Qismah) dan Takharuj'),
  12: t('Munasakhat (Kematian Berantai)'),
  13: t("Kasus Khusus (Haml, Mafqud, Khuntsa, Gharqa, Murtad, Anak Li'an/Zina, Laqith)"),
  14: t('Dzawil Arham'),
  16: t('Kasus Uji (Test Cases) Terverifikasi'),
}) as Record<number, string>)[bab] ?? JUDUL_BAB[bab] ?? '';

export const namaSurah = (surah: string): string => (({
  'An-Nisa': t('An-Nisa'),
}) as Record<string, string>)[surah] ?? surah;
