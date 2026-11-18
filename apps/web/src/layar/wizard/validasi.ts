// Syarat lanjut tiap langkah wizard. Menerima Kasus (null = jenis kelamin belum dipilih);
// menyerahkan alasan dalam bahasa pengguna, dipakai bar bawah dan untuk membatasi lompatan stepper.

import { hitungIsian } from '../../checklist';
import { labelMayit, mayitTanpaAhliWaris } from '../../latihan';
import type { Kasus } from '../../kasus';
import { judulPendek } from '../../ringkasanBagian';
import { statusKeluarga } from '../../statusKeluarga';
import { t } from '../../terjemah';

export const LANGKAH_HASIL = 5;

export function alasanBelumLengkap(kasus: Kasus | null, langkah: number): string | null {
  if (!kasus) return t('hitung.pilih_dulu_jenis_kelamin_almarhum');
  // Kasus nyata: jawaban pintu tanpa bawaan, karena menentukan apakah munasakhat perlu ditanyakan (spec kanvas 4).
  if (langkah === 1 && kasus.jenisKasus === 'nyata' && !kasus.pintu) return t('hitung.kanvas.pintu_belum_dijawab');
  if (langkah === 2 && kasus.tirkah.kotor <= 0n) return t('hitung.isi_total_harta_peninggalan_dulu_harus');
  if (langkah === 3 && kasus.jenisKasus === 'nyata') return alasanKanvasBelumLengkap(kasus);
  if (langkah === 3) {
    if (!adaAhliWaris(kasus)) return t('hitung.tambahkan_minimal_satu_ahli_waris');
    const kartuKurang = mayitTanpaAhliWaris(kasus);
    if (kartuKurang) return t('hitung.latihan.kartu_tanpa_ahli_waris', { nama: labelMayit(kasus, kartuKurang) });
  }
  return null;
}

/** Kasus nyata: lengkap bila semua bagian kanvas lengkap dan ada ahli waris; kalimatnya menyebut sisa dan bagian pertama (spec 5.9). */
function alasanKanvasBelumLengkap(kasus: Kasus): string | null {
  const { sisa, pertama } = statusKeluarga(kasus);
  if (pertama) return t('hitung.kanvas.tertahan', { n: sisa, bagian: judulPendek(kasus, pertama) });
  return adaAhliWaris(kasus) ? null : t('hitung.tambahkan_minimal_satu_ahli_waris');
}

/** Langkah terjauh yang boleh dibuka: langkah pertama yang belum lengkap, atau hasil bila semua lengkap. */
export function langkahTerjauh(kasus: Kasus | null): number {
  for (let langkah = 1; langkah < LANGKAH_HASIL; langkah++) {
    if (alasanBelumLengkap(kasus, langkah)) return langkah;
  }
  return LANGKAH_HASIL;
}

export const adaAhliWaris = (kasus: Kasus): boolean =>
  Object.values(hitungIsian(kasus.graf, kasus.graf.idPewaris)).some(daftar => (daftar?.length ?? 0) > 0);
