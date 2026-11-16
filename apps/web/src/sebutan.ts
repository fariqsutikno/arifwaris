// Sebutan dari sudut pandang "Kamu" (spec kanvas 5.8): "ayahmu", "kakekmu". Hanya hubungan yang dikenal checklist;
// selain itu null dan pemanggil menulis nama saja (keputusan P3 rencana 4).

import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { hitungIsian } from './checklist';
import type { Kasus } from './kasus';
import { LABEL_SEHARI } from './konten/ahliWaris';

export function sebutanDariSaya(kasus: Kasus, id: IdOrang): string | null {
  const saya = kasus.saya;
  if (!saya || saya === id || !kasus.graf.orang[saya]) return null;
  const kunci = Object.entries(hitungIsian(kasus.graf, saya)).find(([, ids]) => ids?.includes(id))?.[0] as KunciAhliWaris | undefined;
  const label = kunci && LABEL_SEHARI[kunci];
  return label ? `${label.split(' ')[0]!.toLowerCase()}mu` : null;
}
