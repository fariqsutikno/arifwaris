// Antrean pertanyaan urutan wafat (spec kanvas 5.6). Menerima Kasus; menyerahkan orang yang posisinya di urutan wafat
// belum pasti (tanpa tahun pembanding, belum dijawab, belum ditunda) dan yang urutannya mengubah hasil.
// Pertanyaannya berpasangan dengan pencarian biner (urutan.ts), jadi n orang ≈ log₂(n+1) pertanyaan.

import type { IdOrang } from '@waris/engine';
import type { Kasus } from './kasus';
import { bandingTanggal } from './silsilah';
import { urutanBerpengaruh } from './ujiHipotetis';
import { mulaiSisip, posisiAkhir, type Sisipan } from './urutan';

export function orangUrutanBelumPasti(kasus: Kasus): IdOrang[] {
  return kasus.urutanWafat.filter(orang =>
    kasus.urutanWafat.some(lain => lain !== orang && pasanganBelumPasti(kasus, orang, lain)) && urutanBerpengaruh(kasus, orang));
}

export function pertanyaanUrutanBerikut(kasus: Kasus): { orang: IdOrang; sisipan: Sisipan } | null {
  const [orang] = orangUrutanBelumPasti(kasus);
  if (!orang) return null;
  const tanpaOrang: Kasus = { ...kasus, urutanWafat: kasus.urutanWafat.filter(id => id !== orang) };
  return { orang, sisipan: mulaiSisip(tanpaOrang, kasus.graf.idPewaris) };
}

export function selesaikanUrutan(kasus: Kasus, orang: IdOrang, sisipan: Sisipan): Kasus {
  const urutanWafat = kasus.urutanWafat.filter(id => id !== orang);
  urutanWafat.splice(posisiAkhir(sisipan), 0, orang);
  return { ...kasus, urutanWafat, urutanDijawab: [...new Set([...(kasus.urutanDijawab ?? []), orang])] };
}

export function tundaUrutan(kasus: Kasus, orang: IdOrang, pembanding: IdOrang, bersamaan = false): Kasus {
  return { ...kasus, belumPasti: [...(kasus.belumPasti ?? []), { jenis: 'urutan', a: orang, b: pembanding, bersamaan }] };
}

/** Dua orang belum pasti urutannya bila tahunnya tak bisa dibandingkan dan belum dijawab atau ditunda. */
function pasanganBelumPasti(kasus: Kasus, orangA: IdOrang, orangB: IdOrang): boolean {
  if (bandingTanggal(kasus.waktu?.[orangA]?.wafat, kasus.waktu?.[orangB]?.wafat) !== null) return false;
  const dijawab = new Set(kasus.urutanDijawab ?? []);
  if (dijawab.has(orangA) || dijawab.has(orangB)) return false;
  return !(kasus.belumPasti ?? []).some(hal => hal.jenis === 'urutan'
    && ((hal.a === orangA && hal.b === orangB) || (hal.a === orangB && hal.b === orangA)));
}

/** Urutan a dan b ditentukan oleh tahun wafat keduanya (spec kanvas 9.1): tidak perlu ditanya dan tidak bisa digeser. */
export const urutanDariTahun = (kasus: Kasus, a: IdOrang, b: IdOrang): boolean =>
  bandingTanggal(kasus.waktu?.[a]?.wafat, kasus.waktu?.[b]?.wafat) !== null;

/** Jawaban atas urutan yang ditunda: `a` ditempatkan tepat sebelum atau sesudah `b`; entri tunda a–b dibuang. */
export function jawabUrutanTertunda(kasus: Kasus, a: IdOrang, b: IdOrang, jawaban: 'sebelum' | 'sesudah'): Kasus {
  const urutanWafat = kasus.urutanWafat.filter(id => id !== a);
  urutanWafat.splice(urutanWafat.indexOf(b) + (jawaban === 'sesudah' ? 1 : 0), 0, a);
  const belumPasti = (kasus.belumPasti ?? []).filter(hal => !(hal.jenis === 'urutan'
    && ((hal.a === a && hal.b === b) || (hal.a === b && hal.b === a))));
  const { belumPasti: _lama, ...tanpaBelumPasti } = kasus;
  return {
    ...tanpaBelumPasti, urutanWafat,
    urutanDijawab: [...new Set([...(kasus.urutanDijawab ?? []), a])],
    ...(belumPasti.length ? { belumPasti } : {}),
  };
}

/** Tukar dengan tetangga di urutan wafat. Ditolak bila keduanya bertahun: tahun menentukan urutan. */
export function geserUrutan(kasus: Kasus, idOrang: IdOrang, arah: -1 | 1): Kasus {
  const i = kasus.urutanWafat.indexOf(idOrang), j = i + arah;
  if (i < 0 || j < 0 || j >= kasus.urutanWafat.length) return kasus;
  if (urutanDariTahun(kasus, idOrang, kasus.urutanWafat[j]!)) return kasus;
  const urutanWafat = [...kasus.urutanWafat];
  [urutanWafat[i], urutanWafat[j]] = [urutanWafat[j]!, urutanWafat[i]!];
  return { ...kasus, urutanWafat, urutanDijawab: [...new Set([...(kasus.urutanDijawab ?? []), idOrang])] };
}
