// Logika murni Awal Lab: pencarian kasus dan susunan keluarga
// untuk "Mulai cepat". Tanpa I/O dan tanpa aturan fikih: susunan cepat hanya mengisi ahli waris awal wizard;
// hukumnya tetap diputuskan engine setelah harta diisi.

import type { KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from './checklist';
import { KELOMPOK, kasusBaru, type Kasus } from './kasus';
import { adaSlotKosong } from './kelompok';
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

/** Susunan cepat = daftar ahli waris yang sudah pasti (seperti checklist lama): kelompok lain dianggap dijawab "tidak ada" (spec 9.2), dan pengisi tidak ditanya "Kamu". */
export const kasusDariSusunan = (susunan: SusunanCepat): Kasus => {
  const kasus = susunan.ahliWaris.reduce((hasil, kunci) => ({ ...hasil, graf: tambahAhliWaris(hasil.graf, hasil.graf.idPewaris, kunci) }), kasusBaru(susunan.pewaris, 'nyata'));
  const idPewaris = kasus.graf.idPewaris;
  // Bagian tetap yang slotnya kosong (mis. Ayah tidak disebut) tetap ditanya: keadaan Ayah tidak boleh ditebak.
  const dijawab = KELOMPOK.filter(jenis => !adaSlotKosong(kasus, { id: `${jenis}:${idPewaris}`, milik: idPewaris, jenis }));
  // Susunan cepat tanpa urutan wafat: pintu pasti "baru" (sama dengan migrasiKeV4), jadi langsung ke langkah Harta.
  return { ...kasus, pintu: 'baru', kelompokDijawab: { [idPewaris]: dijawab }, saya: null };
};
