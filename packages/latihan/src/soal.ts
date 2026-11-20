// Soal → Kasus: membangun graf dari kunci ahli waris yang ditulis di bank soal (pewaris + daftar kunci + harta).
// Memakai pembangun graf yang sama dengan wizard supaya soal dan kalkulator satu jalur. Murni.

import type { ContohKasus } from '@waris/content';
import type { KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from './grafAhliWaris.js';
import { kasusBaru, type Kasus } from './kasus.js';

export function kasusDariSoal(contoh: ContohKasus): Kasus {
  const dasar = kasusBaru(contoh.pewaris, 'latihan');
  // Kunci yang bukan ahli waris di checklist membuat tambahAhliWaris melempar galat; uji konten menangkapnya.
  const graf = contoh.ahliWaris.reduce((grafIni, kunci) => tambahAhliWaris(grafIni, dasar.graf.idPewaris, kunci as KunciAhliWaris), dasar.graf);
  return { ...dasar, graf, tirkah: { ...dasar.tirkah, kotor: contoh.harta } };
}
