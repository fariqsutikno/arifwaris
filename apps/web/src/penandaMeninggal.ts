// Penanda "meninggal" di kotak pohon (C5-3): keterangan kecil di bawah sebutan, bukan coretan nama.
// Satu sumber untuk semua pohon: waktu meninggal menurut kasus, dan kalimat keterangannya.

import type { IdOrang } from '@waris/engine';
import type { Kasus } from './kasus';
import { t } from './terjemah';

export type WaktuMeninggal = 'lebihDulu' | 'sesudah' | 'bersamaan';

/** Tahun bila diketahui; selain itu urutannya terhadap almarhum pemilik harta. */
export function keteranganMeninggal(waktu: WaktuMeninggal, tahun?: number): string {
  if (tahun) return t('hitung.pohon.meninggal_tahun', { tahun: String(tahun) });
  if (waktu === 'sesudah') return t('hitung.pohon.meninggal_sesudah');
  return waktu === 'bersamaan' ? t('hitung.pohon.meninggal_bersamaan') : t('hitung.pohon.meninggal_lebih_dulu');
}

/** Null = bukan almarhum (atau pemilik harta sendiri, yang sudah disebut "Almarhum"). */
export function waktuMeninggal(kasus: Kasus, id: IdOrang): WaktuMeninggal | null {
  if (id === kasus.graf.idPewaris) return null;
  if (kasus.gharqa?.anggota.includes(id)) return 'bersamaan';
  if (kasus.urutanWafat.includes(id) || kasus.wafatSesudahDibagi?.includes(id)) return 'sesudah';
  const orang = kasus.graf.orang[id];
  return orang?.penghubung || orang?.statusHidup === 'wafat' ? 'lebihDulu' : null;
}

export const tahunWafat = (kasus: Kasus, id: IdOrang): number | undefined => kasus.waktu?.[id]?.wafat?.tahun;
