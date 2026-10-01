// Logika murni Awal Lab: pencarian kasus dan susunan keluarga
// untuk "Mulai cepat". Tanpa I/O dan tanpa aturan fikih: susunan cepat hanya mengisi ahli waris awal wizard;
// hukumnya tetap diputuskan engine setelah harta diisi.

import type { KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from './checklist';
import { kasusBaru, type Kasus } from './kasus';
import { t } from './terjemah';

export const BATAS_TAMPIL_CARI = 8;

export function cariEntri<T extends { judul: string; keterangan: string }>(daftar: T[], kata: string): T[] {
  const cari = kata.trim().toLocaleLowerCase();
  return cari ? daftar.filter(entri => `${entri.judul} ${entri.keterangan}`.toLocaleLowerCase().includes(cari)) : daftar;
}

export interface SusunanCepat { kunci: string; label: () => string; pewaris: 'L' | 'P'; ahliWaris: KunciAhliWaris[] }

export const SUSUNAN_CEPAT: SusunanCepat[] = [
  { kunci: 'istri-anak', label: () => t('hitung.lab_cepat_istri_anak'), pewaris: 'L', ahliWaris: ['ISTRI', 'ANAK_LK', 'ANAK_PR'] },
  { kunci: 'suami-anak', label: () => t('hitung.lab_cepat_suami_anak'), pewaris: 'P', ahliWaris: ['SUAMI', 'ANAK_LK', 'ANAK_PR'] },
  { kunci: 'orang-tua-anak', label: () => t('hitung.lab_cepat_orang_tua_anak'), pewaris: 'L', ahliWaris: ['AYAH', 'IBU', 'ANAK_LK'] },
  { kunci: 'ibu-saudara', label: () => t('hitung.lab_cepat_ibu_saudara'), pewaris: 'L', ahliWaris: ['IBU', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG'] },
];

export const kasusDariSusunan = (susunan: SusunanCepat): Kasus =>
  susunan.ahliWaris.reduce((kasus, kunci) => ({ ...kasus, graf: tambahAhliWaris(kasus.graf, kasus.graf.idPewaris, kunci) }), kasusBaru(susunan.pewaris));
