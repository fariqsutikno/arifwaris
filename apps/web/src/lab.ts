// Logika murni Awal Lab: pengelompokan riwayat per hari, urutan rak eksperimen, pencarian, dan susunan keluarga
// untuk "Mulai cepat". Tanpa I/O dan tanpa aturan fikih: susunan cepat hanya mengisi ahli waris awal wizard;
// hukumnya tetap diputuskan engine setelah harta diisi.

import type { KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from './checklist';
import { kasusBaru, type Kasus } from './kasus';

const HARI = 24 * 60 * 60 * 1000;
const HARI_DALAM_PEKAN = 7;
export const BATAS_TAMPIL_CARI = 8;

export type KelompokHari = 'hariIni' | 'kemarin' | 'pekanIni' | 'lebihLama';
const URUTAN_KELOMPOK: KelompokHari[] = ['hariIni', 'kemarin', 'pekanIni', 'lebihLama'];

export function kelompokHari(waktu: number, sekarang: number): KelompokHari {
  const hariIni = new Date(sekarang).setHours(0, 0, 0, 0);
  if (waktu >= hariIni) return 'hariIni';
  if (waktu >= hariIni - HARI) return 'kemarin';
  if (waktu >= hariIni - (HARI_DALAM_PEKAN - 1) * HARI) return 'pekanIni';
  return 'lebihLama';
}

export function kelompokkanRiwayat<T extends { waktu: number }>(daftar: T[], sekarang: number): Array<{ kelompok: KelompokHari; isi: T[] }> {
  return URUTAN_KELOMPOK
    .map(kelompok => ({ kelompok, isi: daftar.filter(entri => kelompokHari(entri.waktu, sekarang) === kelompok) }))
    .filter(kelompok => kelompok.isi.length > 0);
}

export const urutRak = <T extends { disematkan: boolean; disimpanPada: string }>(daftar: T[]): T[] =>
  [...daftar].sort((a, b) => Number(b.disematkan) - Number(a.disematkan) || b.disimpanPada.localeCompare(a.disimpanPada));

export function cariEntri<T extends { judul: string; keterangan: string }>(daftar: T[], kata: string): T[] {
  const cari = kata.trim().toLocaleLowerCase();
  return cari ? daftar.filter(entri => `${entri.judul} ${entri.keterangan}`.toLocaleLowerCase().includes(cari)) : daftar;
}

export interface SusunanCepat { kunci: string; kunciDiksi: string; pewaris: 'L' | 'P'; ahliWaris: KunciAhliWaris[] }

export const SUSUNAN_CEPAT: SusunanCepat[] = [
  { kunci: 'istri-anak', kunciDiksi: 'hitung.lab_cepat_istri_anak', pewaris: 'L', ahliWaris: ['ISTRI', 'ANAK_LK', 'ANAK_PR'] },
  { kunci: 'suami-anak', kunciDiksi: 'hitung.lab_cepat_suami_anak', pewaris: 'P', ahliWaris: ['SUAMI', 'ANAK_LK', 'ANAK_PR'] },
  { kunci: 'orang-tua-anak', kunciDiksi: 'hitung.lab_cepat_orang_tua_anak', pewaris: 'L', ahliWaris: ['AYAH', 'IBU', 'ANAK_LK'] },
  { kunci: 'ibu-saudara', kunciDiksi: 'hitung.lab_cepat_ibu_saudara', pewaris: 'L', ahliWaris: ['IBU', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG'] },
];

export const kasusDariSusunan = (susunan: SusunanCepat): Kasus =>
  susunan.ahliWaris.reduce((kasus, kunci) => ({ ...kasus, graf: tambahAhliWaris(kasus.graf, kasus.graf.idPewaris, kunci) }), kasusBaru(susunan.pewaris));
