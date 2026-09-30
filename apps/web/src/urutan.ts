// Urutan wafat lewat pertanyaan berpasangan "Siapa yang wafat lebih dulu: A atau B?" (riset 7.3 L4).
// Orang baru hanya dibanding dengan yang wafat sesudah almarhum babaknya; pencarian biner, jadi n orang ≈ log₂(n+1) pertanyaan.

import type { IdOrang } from '@waris/engine';
import type { Kasus } from './kasus';

export interface Sisipan { calon: IdOrang[]; awal: number; bawah: number; atas: number }

export function mulaiSisip(kasus: Kasus, idMayitBabak: IdOrang): Sisipan {
  const awal = idMayitBabak === kasus.graf.idPewaris ? 0 : kasus.urutanWafat.indexOf(idMayitBabak) + 1;
  const calon = kasus.urutanWafat.slice(awal);
  return { calon, awal, bawah: 0, atas: calon.length };
}

export const pembanding = (sisipan: Sisipan): IdOrang | null =>
  sisipan.bawah >= sisipan.atas ? null : sisipan.calon[Math.floor((sisipan.bawah + sisipan.atas) / 2)]!;

export function jawabSisip(sisipan: Sisipan, orangBaruLebihDulu: boolean): Sisipan {
  const tengah = Math.floor((sisipan.bawah + sisipan.atas) / 2);
  return orangBaruLebihDulu ? { ...sisipan, atas: tengah } : { ...sisipan, bawah: tengah + 1 };
}

export const posisiAkhir = (sisipan: Sisipan): number => sisipan.awal + sisipan.bawah;
