// Kalimat predikat dan target nilai kuis, dipakai papan kuis dan layar hasil (satu sumber supaya kata-katanya sama).

import { angka, t } from '../../terjemah';
import { targetBerikut, type Predikat } from '../../skorKuis';

export const teksPredikat = (predikat: Predikat): string => ({
  perlu_diulang: t('latihan.predikat_perlu_diulang'),
  cukup: t('latihan.predikat_cukup'),
  baik: t('latihan.predikat_baik'),
  sangat_baik: t('latihan.predikat_sangat_baik'),
})[predikat];

/** "Butuh 70% untuk Baik" bila masih ada tingkat di atasnya; kosong di puncak. */
export function teksTarget(persen: number): string | null {
  const target = targetBerikut(persen);
  return target ? t('latihan.butuh_persen_untuk_predikat', { persen: angka(String(target.dari)), predikat: teksPredikat(target.predikat) }) : null;
}
