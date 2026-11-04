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
