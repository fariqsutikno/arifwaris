// Keadaan aplikasi: layar aktif, langkah wizard, Kasus, dan tujuan pemakaian. Satu reducer, tanpa library state.
// Semua perubahan kasus lewat UBAH_KASUS supaya urutan wafat selalu dirapikan di satu tempat;
// perpindahan langkah dibatasi validasi supaya stepper tidak bisa melompati isian yang belum lengkap.
// Langkah Keluarga punya dua layar per babak (bagian): daftar orang, lalu keadaan khusus (layar/wizard/navigasi.ts).

import { bolehUbahJenisKelamin } from '@waris/engine';
import { kasusBaru, rapikanKeadaan, type Kasus } from './kasus';
import type { Tujuan } from './preferensi';
import { daftarAlmarhum } from './keadaanOrang';
import { LANGKAH_HASIL, langkahTerjauh } from './layar/wizard/validasi';
import type { Bagian } from './layar/wizard/navigasi';

export const TOTAL_LANGKAH = 4;
export type Layar = 'awal' | 'wizard' | 'cerita' | 'hasil' | 'belajar';

export interface KeadaanAplikasi { layar: Layar; langkah: number; babak: number; bagian: Bagian; kasus: Kasus | null; tujuan: Tujuan | null }

export type Aksi =
  | { jenis: 'PILIH_TUJUAN'; tujuan: Tujuan }
  | { jenis: 'MULAI' }
  | { jenis: 'PILIH_PEWARIS'; jenisKelamin: 'L' | 'P' }
  | { jenis: 'MUAT'; kasus: Kasus }
  | { jenis: 'KE_LANGKAH'; langkah: number }
  | { jenis: 'KE_BABAK'; babak: number }
  | { jenis: 'KE_BAGIAN'; bagian: Bagian }
  | { jenis: 'KE_POSISI'; langkah: number; babak: number; bagian: Bagian }
  | { jenis: 'UBAH_KASUS'; ubah: (kasus: Kasus) => Kasus }
  | { jenis: 'KE_LAYAR'; layar: Layar }
  | { jenis: 'ULANGI' };

export const keadaanAwal = (kasusTersimpan: Kasus | null, tujuan: Tujuan | null): KeadaanAplikasi =>
  ({ layar: 'awal', langkah: 1, babak: 0, bagian: 'daftar', kasus: kasusTersimpan, tujuan });

const babakTerakhir = (kasus: Kasus | null): number => (kasus ? daftarAlmarhum(kasus).length - 1 : 0);

export function pengurangKeadaan(keadaan: KeadaanAplikasi, aksi: Aksi): KeadaanAplikasi {
  switch (aksi.jenis) {
    case 'PILIH_TUJUAN': return { ...keadaan, tujuan: aksi.tujuan };
    case 'MULAI': return { ...keadaan, layar: 'wizard', langkah: 1, babak: 0, bagian: 'daftar', kasus: null };
    case 'PILIH_PEWARIS': return { ...keadaan, kasus: pilihPewaris(keadaan.kasus, aksi.jenisKelamin) };
    case 'MUAT': return { ...keadaan, layar: 'hasil', langkah: TOTAL_LANGKAH, babak: 0, bagian: 'daftar', kasus: aksi.kasus };
    case 'KE_LANGKAH': {
      const batas = Math.min(TOTAL_LANGKAH, langkahTerjauh(keadaan.kasus));
      const langkah = Math.min(batas, Math.max(1, aksi.langkah));
      // Mundur dari Periksa (4) ke Keluarga (3) = keadaan babak terakhir; selain itu mulai dari daftar babak pewaris.
      const mundurDariPeriksa = langkah === 3 && keadaan.langkah === 4;
      return { ...keadaan, layar: 'wizard', langkah, babak: mundurDariPeriksa ? babakTerakhir(keadaan.kasus) : 0, bagian: mundurDariPeriksa ? 'keadaan' : 'daftar' };
    }
    case 'KE_BABAK': return { ...keadaan, babak: Math.min(babakTerakhir(keadaan.kasus), Math.max(0, aksi.babak)), bagian: 'daftar' };
    case 'KE_BAGIAN': return { ...keadaan, bagian: aksi.bagian };
    case 'KE_POSISI': {
      // Satu lompatan atomik (tombol Lanjut/Kembali): langkah tetap dibatasi validasi, babak dibatasi jumlah almarhum.
      const langkah = Math.min(Math.min(TOTAL_LANGKAH, langkahTerjauh(keadaan.kasus)), Math.max(1, aksi.langkah));
      const babak = langkah === 3 ? Math.min(babakTerakhir(keadaan.kasus), Math.max(0, aksi.babak)) : 0;
      return { ...keadaan, layar: 'wizard', langkah, babak, bagian: langkah === 3 ? aksi.bagian : 'daftar' };
    }
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
    case 'ULANGI': return { ...keadaan, layar: 'awal', langkah: 1, babak: 0, bagian: 'daftar', kasus: null };
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
