// Blok ```kasus di materi → Kasus kalkulator. Dipakai untuk menampilkan contoh (dihitung engine) dan tombol
// "Coba di kalkulator"; pembentukan graf memakai checklist yang sama dengan wizard.

import type { ContohKasus } from '@waris/content';
import type { KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from '../../checklist';
import { kasusBaru, type Kasus } from '../../kasus';

export function kasusDariContoh(contoh: ContohKasus): Kasus {
  const dasar = kasusBaru(contoh.pewaris);
  // Kunci yang bukan ahli waris di checklist membuat tambahAhliWaris melempar galat; test materi menangkapnya.
  const graf = contoh.ahliWaris.reduce((grafIni, kunci) => tambahAhliWaris(grafIni, dasar.graf.idPewaris, kunci as KunciAhliWaris), dasar.graf);
  return { ...dasar, graf, tirkah: { ...dasar.tirkah, kotor: contoh.harta } };
}
