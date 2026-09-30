// Keadaan aplikasi: layar aktif, langkah wizard, Kasus, dan tujuan pemakaian. Satu reducer, tanpa library state.
// Semua perubahan kasus lewat UBAH_KASUS supaya urutan wafat selalu dirapikan di satu tempat;
// perpindahan langkah dibatasi validasi supaya stepper tidak bisa melompati isian yang belum lengkap.

import { bolehUbahJenisKelamin } from '@waris/engine';
import { kasusBaru, rapikanKeadaan, type Kasus } from './kasus';
import type { Tujuan } from './preferensi';
import { daftarAlmarhum } from './keadaanOrang';
import { LANGKAH_HASIL, langkahTerjauh } from './layar/wizard/validasi';

export const TOTAL_LANGKAH = 5;
export type Layar = 'awal' | 'wizard' | 'cerita' | 'hasil' | 'belajar';

export interface KeadaanAplikasi { layar: Layar; langkah: number; babak: number; kasus: Kasus | null; tujuan: Tujuan | null }

export type Aksi =
  | { jenis: 'PILIH_TUJUAN'; tujuan: Tujuan }
  | { jenis: 'MULAI' }
  | { jenis: 'PILIH_PEWARIS'; jenisKelamin: 'L' | 'P' }
  | { jenis: 'MUAT'; kasus: Kasus }
  | { jenis: 'KE_LANGKAH'; langkah: number }
  | { jenis: 'KE_BABAK'; babak: number }
  | { jenis: 'UBAH_KASUS'; ubah: (kasus: Kasus) => Kasus }
  | { jenis: 'KE_LAYAR'; layar: Layar }
  | { jenis: 'ULANGI' };

export const keadaanAwal = (kasusTersimpan: Kasus | null, tujuan: Tujuan | null): KeadaanAplikasi =>
  ({ layar: 'awal', langkah: 1, babak: 0, kasus: kasusTersimpan, tujuan });

const babakTerakhir = (kasus: Kasus | null): number => (kasus ? daftarAlmarhum(kasus).length - 1 : 0);

export function pengurangKeadaan(keadaan: KeadaanAplikasi, aksi: Aksi): KeadaanAplikasi {
  switch (aksi.jenis) {
    case 'PILIH_TUJUAN': return { ...keadaan, tujuan: aksi.tujuan };
    case 'MULAI': return { ...keadaan, layar: 'wizard', langkah: 1, babak: 0, kasus: null };
    case 'PILIH_PEWARIS': return { ...keadaan, kasus: pilihPewaris(keadaan.kasus, aksi.jenisKelamin) };
    case 'MUAT': return { ...keadaan, layar: 'hasil', langkah: TOTAL_LANGKAH, babak: 0, kasus: aksi.kasus };
    case 'KE_LANGKAH': {
      const batas = Math.min(TOTAL_LANGKAH, langkahTerjauh(keadaan.kasus));
      const langkah = Math.min(batas, Math.max(1, aksi.langkah));
      // Mundur dari langkah 5 ke langkah 4 = babak terakhir; selain itu mulai dari babak pewaris.
      const babak = langkah === 4 && keadaan.langkah === 5 ? babakTerakhir(keadaan.kasus) : 0;
      return { ...keadaan, layar: 'wizard', langkah, babak };
    }
    case 'KE_BABAK': return { ...keadaan, babak: Math.min(babakTerakhir(keadaan.kasus), Math.max(0, aksi.babak)) };
    case 'UBAH_KASUS': {
      if (!keadaan.kasus) return keadaan;
      const kasus = rapikanKeadaan(aksi.ubah(keadaan.kasus));
      return { ...keadaan, kasus, babak: Math.min(keadaan.babak, babakTerakhir(kasus)) };
    }
    case 'KE_LAYAR': {
      const bolehHasil = langkahTerjauh(keadaan.kasus) === LANGKAH_HASIL;
      if ((aksi.layar === 'hasil' || aksi.layar === 'belajar' || aksi.layar === 'cerita') && !bolehHasil) return keadaan;
      return { ...keadaan, layar: aksi.layar };
    }
    case 'ULANGI': return { ...keadaan, layar: 'awal', langkah: 1, babak: 0, kasus: null };
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
