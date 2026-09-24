// Keadaan aplikasi: layar aktif, langkah wizard, dan Kasus. Satu reducer, tanpa library state.
// Setiap perubahan kasus lewat UBAH_KASUS supaya urutan wafat selalu dirapikan di satu tempat.

import { kasusBaru, rapikanUrutanWafat, type Kasus } from './kasus';

export const TOTAL_LANGKAH = 5;
export type Layar = 'beranda' | 'wizard' | 'hasil' | 'belajar';

export interface KeadaanAplikasi { layar: Layar; langkah: number; kasus: Kasus | null }

export type Aksi =
  | { jenis: 'MULAI'; jenisKelamin: 'L' | 'P' }
  | { jenis: 'MUAT'; kasus: Kasus }
  | { jenis: 'KE_LANGKAH'; langkah: number }
  | { jenis: 'UBAH_KASUS'; ubah: (kasus: Kasus) => Kasus }
  | { jenis: 'KE_LAYAR'; layar: Layar };

export const keadaanAwal = (kasusTersimpan: Kasus | null): KeadaanAplikasi =>
  ({ layar: 'beranda', langkah: 1, kasus: kasusTersimpan });

export function pengurangKeadaan(keadaan: KeadaanAplikasi, aksi: Aksi): KeadaanAplikasi {
  switch (aksi.jenis) {
    case 'MULAI': return { layar: 'wizard', langkah: 1, kasus: kasusBaru(aksi.jenisKelamin) };
    case 'MUAT': return { layar: 'hasil', langkah: TOTAL_LANGKAH, kasus: aksi.kasus };
    case 'KE_LANGKAH': return { ...keadaan, layar: 'wizard', langkah: Math.min(TOTAL_LANGKAH, Math.max(1, aksi.langkah)) };
    case 'UBAH_KASUS': return keadaan.kasus ? { ...keadaan, kasus: rapikanUrutanWafat(aksi.ubah(keadaan.kasus)) } : keadaan;
    case 'KE_LAYAR': return { ...keadaan, layar: aksi.layar };
  }
}
