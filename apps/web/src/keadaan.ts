// Keadaan aplikasi: layar aktif, langkah wizard, Kasus, dan tujuan pemakaian. Satu reducer, tanpa library state.
// Semua perubahan kasus lewat UBAH_KASUS supaya urutan wafat selalu dirapikan di satu tempat;
// perpindahan langkah dibatasi validasi supaya stepper tidak bisa melompati isian yang belum lengkap.

import { bolehUbahJenisKelamin, type IdOrang } from '@waris/engine';
import { kasusBaru, rapikanKeadaan, type JenisKasus, type Kasus } from './kasus';
import type { Tujuan } from './preferensi';
import { turunkanDariWaktu } from './silsilah';
import { LANGKAH_HASIL, langkahTerjauh } from './layar/wizard/validasi';

export const TOTAL_LANGKAH = 4;
export type Layar = 'awal' | 'pintu' | 'wizard' | 'cerita' | 'hasil' | 'belajar';

export interface KeadaanAplikasi { layar: Layar; langkah: number; kasus: Kasus | null; tujuan: Tujuan | null; jenisKasus: JenisKasus | null;
  /** Kartu mayit latihan yang digulir dan difokus saat langkah 3 dibuka dari "ubah" di Periksa; hilang saat kasus diubah. */
  fokus?: IdOrang }

export type Aksi =
  | { jenis: 'PILIH_TUJUAN'; tujuan: Tujuan }
  | { jenis: 'MULAI' }
  | { jenis: 'PILIH_JENIS_KASUS'; jenisKasus: JenisKasus }
  | { jenis: 'PILIH_PEWARIS'; jenisKelamin: 'L' | 'P' }
  | { jenis: 'MUAT'; kasus: Kasus }
  | { jenis: 'KE_LANGKAH'; langkah: number; fokus?: IdOrang }
  | { jenis: 'UBAH_KASUS'; ubah: (kasus: Kasus) => Kasus }
  | { jenis: 'KE_LAYAR'; layar: Layar }
  | { jenis: 'ULANGI' };

export const keadaanAwal = (kasusTersimpan: Kasus | null, tujuan: Tujuan | null): KeadaanAplikasi =>
  ({ layar: 'awal', langkah: 1, kasus: kasusTersimpan, tujuan, jenisKasus: kasusTersimpan?.jenisKasus ?? null });

export function pengurangKeadaan(keadaan: KeadaanAplikasi, aksi: Aksi): KeadaanAplikasi {
  switch (aksi.jenis) {
    case 'PILIH_TUJUAN': return { ...keadaan, tujuan: aksi.tujuan };
    case 'MULAI': return { ...keadaan, layar: 'pintu', langkah: 1, kasus: null, jenisKasus: null };
    case 'PILIH_JENIS_KASUS': return { ...keadaan, layar: 'wizard', langkah: 1, jenisKasus: aksi.jenisKasus };
    case 'PILIH_PEWARIS': return { ...keadaan, kasus: pilihPewaris(keadaan.kasus, aksi.jenisKelamin, keadaan.jenisKasus) };
    case 'MUAT': return { ...keadaan, layar: 'hasil', langkah: TOTAL_LANGKAH, kasus: aksi.kasus, jenisKasus: aksi.kasus.jenisKasus };
    case 'KE_LANGKAH': {
      const batas = Math.min(TOTAL_LANGKAH, langkahTerjauh(keadaan.kasus));
      const langkah = Math.min(batas, Math.max(1, aksi.langkah));
      const { fokus: _lama, ...tanpaFokus } = keadaan;
      return { ...tanpaFokus, layar: 'wizard', langkah, ...(aksi.fokus ? { fokus: aksi.fokus } : {}) };
    }
    case 'UBAH_KASUS': {
      if (!keadaan.kasus) return keadaan;
      const kasus = rapikanKeadaan(turunkanDariWaktu(aksi.ubah(keadaan.kasus)));
      const { fokus: _lama, ...tanpaFokus } = keadaan;
      return { ...tanpaFokus, kasus };
    }
    case 'KE_LAYAR': {
      const bolehHasil = langkahTerjauh(keadaan.kasus) === LANGKAH_HASIL;
      if ((aksi.layar === 'hasil' || aksi.layar === 'belajar' || aksi.layar === 'cerita') && !bolehHasil) return keadaan;
      return { ...keadaan, layar: aksi.layar };
    }
    case 'ULANGI': return { ...keadaan, layar: 'awal', langkah: 1, kasus: null, jenisKasus: null };
  }
}

/** Kasus dibuat saat jenis kelamin pertama kali dipilih; sesudahnya hanya boleh diganti selama belum ada pasangan/anak. */
function pilihPewaris(kasus: Kasus | null, jenisKelamin: 'L' | 'P', jenisKasus: JenisKasus | null): Kasus {
  if (!kasus) return kasusBaru(jenisKelamin, jenisKasus ?? 'nyata');
  const { idPewaris } = kasus.graf;
  if (!bolehUbahJenisKelamin(kasus.graf, idPewaris)) return kasus;
  const pewaris = kasus.graf.orang[idPewaris]!;
  return { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [idPewaris]: { ...pewaris, jenisKelamin } } } };
}
