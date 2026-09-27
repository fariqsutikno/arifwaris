// Syarat lanjut tiap langkah wizard. Menerima Kasus (null = jenis kelamin belum dipilih);
// menyerahkan alasan dalam bahasa pengguna, dipakai bar bawah dan untuk membatasi lompatan stepper.

import { hitungIsian } from '../../checklist';
import type { Kasus } from '../../kasus';
import { t } from '../../terjemah';

export const LANGKAH_HASIL = 6;

export function alasanBelumLengkap(kasus: Kasus | null, langkah: number): string | null {
  if (!kasus) return t('hitung.pilih_dulu_jenis_kelamin_almarhum');
  if (langkah === 2 && kasus.tirkah.kotor <= 0n) return t('hitung.isi_total_harta_peninggalan_dulu_harus');
  if (langkah === 4 && !adaAhliWaris(kasus)) return t('hitung.tambahkan_minimal_satu_ahli_waris');
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
