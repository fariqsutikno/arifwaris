// Kamus narasi untuk tes = diksi snapshot bawaan web (sumber tunggal, spec keputusan 3). Mencatat kunci yang dibaca
// supaya tes cakupan bisa melaporkan kunci narasi yang tidak pernah dipakai.
import snapshot from '../../../../apps/web/src/snapshot.json';
import type { Bahasa, Kamus, Penyusun } from '../segments.js';

const peta = new Map(snapshot.diksi.map(butir => [butir.kunci, butir]));
export const kunciTerpakai = new Set<string>();
export const kamusSnapshot: Kamus = kunci => {
  kunciTerpakai.add(kunci);
  return peta.get(kunci);
};
export const penyusunTes = (bahasa: Bahasa = 'id'): Penyusun => ({ kamus: kamusSnapshot, bahasa });
