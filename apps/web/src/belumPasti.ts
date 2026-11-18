// Daftar "Belum dipastikan" di Periksa (spec kanvas 7.1). Menerima Kasus; menyerahkan hal yang masih belum pasti
// (keadaan orang "belum tahu", urutan wafat yang ditunda) dan apakah hasil bisa dihitung sebagai beberapa kemungkinan.

import type { IdOrang } from '@waris/engine';
import type { Kasus } from './kasus';
import { anggotaBagian, daftarBagian } from './kelompok';

export type HalBelumPastiTampil =
  | { jenis: 'keadaan'; orang: IdOrang; milik: IdOrang }
  | { jenis: 'urutan'; a: IdOrang; b: IdOrang };

/** `milik` = almarhum yang menjadi rujukan orang itu (bagian keluarga yang memuatnya). */
export function daftarBelumPasti(kasus: Kasus): HalBelumPastiTampil[] {
  const bagian = daftarBagian(kasus);
  const milikDari = (id: IdOrang) => bagian.find(satu => anggotaBagian(kasus, satu).includes(id))?.milik ?? kasus.graf.idPewaris;
  const keadaan = Object.values(kasus.graf.orang)
    .filter(orang => !orang.penghubung && orang.statusHidup === 'tidakDiketahui')
    .map(orang => ({ jenis: 'keadaan' as const, orang: orang.id, milik: milikDari(orang.id) }));
  const urutan = (kasus.belumPasti ?? []).flatMap(hal => (hal.jenis === 'urutan' ? [{ jenis: 'urutan' as const, a: hal.a, b: hal.b }] : []));
  return [...keadaan, ...urutan];
}

// Urutan wafat yang ditunda dan orang "belum tahu" belum bisa dihitung sebagai kemungkinan: engine mengembalikan
// PERLU_INPUT untuk `tidakDiketahui`; "Bagaimana kalau" urutan baru ada di Tahap 7 (keputusan P1).
export const bisaDihitungDenganKemungkinan = (kasus: Kasus): boolean =>
  daftarBelumPasti(kasus).length === 0;
