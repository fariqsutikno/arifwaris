// Syarat lanjut tiap langkah wizard. Menerima Kasus (null = jenis kelamin belum dipilih);
// menyerahkan alasan dalam bahasa pengguna, dipakai bar bawah dan untuk membatasi lompatan stepper.

import { hitungIsian } from '../../checklist';
import { daftarAlmarhum, kerabatDari } from '../../keadaanOrang';
import type { Kasus } from '../../kasus';
import { t } from '../../terjemah';

export const LANGKAH_HASIL = 5;

export function alasanBelumLengkap(kasus: Kasus | null, langkah: number): string | null {
  if (!kasus) return t('hitung.pilih_dulu_jenis_kelamin_almarhum');
  if (langkah === 2 && kasus.tirkah.kotor <= 0n) return t('hitung.isi_total_harta_peninggalan_dulu_harus');
  if (langkah === 3) {
    if (!adaAhliWaris(kasus)) return t('hitung.tambahkan_minimal_satu_ahli_waris');
    for (let babak = 1; babak < daftarAlmarhum(kasus).length; babak++) {
      const alasan = alasanBabak(kasus, babak);
      if (alasan) return alasan;
    }
  }
  return null;
}

/** Babak k lengkap bila almarhumnya punya ≥ 1 kerabat yang masih hidup saat ia wafat (bukan almarhum sebelumnya). */
export function alasanBabak(kasus: Kasus, babak: number): string | null {
  const almarhum = daftarAlmarhum(kasus);
  const idMayit = almarhum[babak];
  if (!idMayit) return null;
  const sebelumnya = new Set(almarhum.slice(0, babak));
  const ada = kerabatDari(kasus, idMayit).some(id => !sebelumnya.has(id) && kasus.graf.orang[id]!.statusHidup !== 'wafat');
  return ada ? null : t('hitung.babak.tambahkan_keluarga_almarhum');
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
