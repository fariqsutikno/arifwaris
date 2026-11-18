// Sebutan dari sudut pandang "Kamu" (spec kanvas 5.8): "ayahmu", "kakekmu". Hanya hubungan yang dikenal checklist;
// selain itu null dan pemanggil menulis nama saja (keputusan P3 rencana 4).

import type { IdOrang, KunciAhliWaris } from '@waris/engine';
import { DAFTAR_JENIS, daftarInduk } from './checklist';
import type { Kasus } from './kasus';
import { LABEL_SEHARI } from './konten/ahliWaris';

export function sebutanDariSaya(kasus: Kasus, id: IdOrang): string | null {
  const saya = kasus.saya;
  if (!saya || saya === id || !kasus.graf.orang[saya]) return null;
  // daftarInduk menyertakan yang sudah wafat (pewaris, penghubung), jadi mayit tetap mendapat sebutan menurut hubungannya.
  const kunci = DAFTAR_JENIS.find(jenis => daftarInduk(kasus.graf, saya, jenis.kunci).includes(id))?.kunci as KunciAhliWaris | undefined;
  const label = kunci && LABEL_SEHARI[kunci];
  if (!label) return null;
  const sebutan = label.split(' ')[0]!.toLowerCase();
  // Hanya bahasa sehari-hari, bukan fikih: kakek/nenek yang lebih dari dua generasi di atas disebut buyut.
  return generasiDiAtas(kasus, saya, id) > GENERASI_KAKEK ? `${sebutan} buyutmu` : `${sebutan}mu`;
}

const GENERASI_KAKEK = 2;

/** Jarak generasi `idLeluhur` di atas `idOrang` lewat ayah/ibu; 0 bila bukan leluhurnya. */
function generasiDiAtas(kasus: Kasus, idOrang: IdOrang, idLeluhur: IdOrang): number {
  let lapis: IdOrang[] = [idOrang];
  for (let generasi = 1; lapis.length > 0; generasi++) {
    lapis = lapis.flatMap(id => [kasus.graf.orang[id]?.idAyah, kasus.graf.orang[id]?.idIbu]).filter((id): id is IdOrang => !!id);
    if (lapis.includes(idLeluhur)) return generasi;
  }
  return 0;
}
