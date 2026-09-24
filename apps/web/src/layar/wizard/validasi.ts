// Syarat lanjut tiap langkah wizard. Menerima Kasus (null = jenis kelamin belum dipilih);
// menyerahkan alasan dalam bahasa pengguna, dipakai bar bawah dan untuk membatasi lompatan stepper.

import { hitungIsian } from '../../checklist';
import type { Kasus } from '../../kasus';

export const LANGKAH_HASIL = 6;

export function alasanBelumLengkap(kasus: Kasus | null, langkah: number): string | null {
  if (!kasus) return 'Pilih dulu jenis kelamin almarhum.';
  if (langkah === 2 && kasus.tirkah.kotor <= 0n) return 'Isi total harta peninggalan dulu, harus lebih dari Rp 0.';
  if (langkah === 4 && !adaAhliWaris(kasus)) return 'Tambahkan minimal satu ahli waris.';
  return null;
}

/** Langkah terjauh yang boleh dibuka: langkah pertama yang belum lengkap, atau hasil bila semua lengkap. */
export function langkahTerjauh(kasus: Kasus | null): number {
  for (let langkah = 1; langkah < LANGKAH_HASIL; langkah++) {
    if (alasanBelumLengkap(kasus, langkah)) return langkah;
  }
  return LANGKAH_HASIL;
}

const adaAhliWaris = (kasus: Kasus): boolean =>
  Object.values(hitungIsian(kasus.graf, kasus.graf.idPewaris)).some(daftar => (daftar?.length ?? 0) > 0);
