// Keadaan aplikasi: layar aktif, langkah wizard, Kasus, dan tujuan pemakaian. Satu reducer, tanpa library state.
// Semua perubahan kasus lewat UBAH_KASUS supaya urutan wafat selalu dirapikan di satu tempat;
// perpindahan langkah dibatasi validasi supaya stepper tidak bisa melompati isian yang belum lengkap.

import { bolehUbahJenisKelamin } from '@waris/engine';
import { kasusBaru, rapikanUrutanWafat, type Kasus } from './kasus';
import type { Tujuan } from './preferensi';
import { LANGKAH_HASIL, langkahTerjauh } from './layar/wizard/validasi';

export const TOTAL_LANGKAH = 5;
export type Layar = 'beranda' | 'wizard' | 'hasil' | 'belajar';

export interface KeadaanAplikasi { layar: Layar; langkah: number; kasus: Kasus | null; tujuan: Tujuan | null }

export type Aksi =
  | { jenis: 'PILIH_TUJUAN'; tujuan: Tujuan }
  | { jenis: 'MULAI' }
  | { jenis: 'PILIH_PEWARIS'; jenisKelamin: 'L' | 'P' }
  | { jenis: 'MUAT'; kasus: Kasus }
  | { jenis: 'KE_LANGKAH'; langkah: number }
  | { jenis: 'UBAH_KASUS'; ubah: (kasus: Kasus) => Kasus }
  | { jenis: 'KE_LAYAR'; layar: Layar }
  | { jenis: 'ULANGI' };

export const keadaanAwal = (kasusTersimpan: Kasus | null, tujuan: Tujuan | null): KeadaanAplikasi =>
  ({ layar: 'beranda', langkah: 1, kasus: kasusTersimpan, tujuan });

export function pengurangKeadaan(keadaan: KeadaanAplikasi, aksi: Aksi): KeadaanAplikasi {
  switch (aksi.jenis) {
    case 'PILIH_TUJUAN': return { ...keadaan, tujuan: aksi.tujuan };
    case 'MULAI': return { ...keadaan, layar: 'wizard', langkah: 1, kasus: null };
    case 'PILIH_PEWARIS': return { ...keadaan, kasus: pilihPewaris(keadaan.kasus, aksi.jenisKelamin) };
    case 'MUAT': return { ...keadaan, layar: 'hasil', langkah: TOTAL_LANGKAH, kasus: aksi.kasus };
    case 'KE_LANGKAH': {
      const batas = Math.min(TOTAL_LANGKAH, langkahTerjauh(keadaan.kasus));
      return { ...keadaan, layar: 'wizard', langkah: Math.min(batas, Math.max(1, aksi.langkah)) };
    }
    case 'UBAH_KASUS': return keadaan.kasus ? { ...keadaan, kasus: rapikanUrutanWafat(aksi.ubah(keadaan.kasus)) } : keadaan;
    case 'KE_LAYAR': {
      const bolehHasil = langkahTerjauh(keadaan.kasus) === LANGKAH_HASIL;
      if ((aksi.layar === 'hasil' || aksi.layar === 'belajar') && !bolehHasil) return keadaan;
      return { ...keadaan, layar: aksi.layar };
    }
    case 'ULANGI': return { ...keadaan, layar: 'beranda', langkah: 1, kasus: null };
  }
}

/** Kasus dibuat saat jenis kelamin pertama kali dipilih; sesudahnya hanya boleh diganti selama belum ada pasangan/anak. */
function pilihPewaris(kasus: Kasus | null, jenisKelamin: 'L' | 'P'): Kasus {
  if (!kasus) return kasusBaru(jenisKelamin);
  const { idPewaris } = kasus.graf;
  if (!bolehUbahJenisKelamin(kasus.graf, idPewaris)) return kasus;
  const pewaris = kasus.graf.orang[idPewaris]!;
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [idPewaris]: { ...pewaris, jenisKelamin } } } };
}
