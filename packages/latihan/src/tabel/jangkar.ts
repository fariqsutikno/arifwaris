// Satu sel saham terisi per soal (spec B5). `acak` disuntikkan: peramban memakai Math.random, server/uji memakai yang deterministik.

import { ID_BARIS_MAUQUF, type Jangkar, type TabelSoal } from './model.js';

/** Kolom bulat, berkunci, bukan 0, bukan sel bersama, bukan kolom terkunci. Tidak ada calon → null. */
export function calonJangkar(tabel: TabelSoal): Jangkar[] {
  return tabel.kolom.filter(kolom => kolom.jenis === 'bulat' && !kolom.terkunci).flatMap(kolom => tabel.baris
    .filter(baris => baris.kunci[kolom.id] !== undefined && baris.kunci[kolom.id] !== '0' && baris.kelompok[kolom.id] === undefined && baris.id !== ID_BARIS_MAUQUF)
    .map(baris => ({ idBaris: baris.id, idKolom: kolom.id })));
}

export function pilihJangkar(tabel: TabelSoal, acak: () => number): Jangkar | null {
  const calon = calonJangkar(tabel);
  return calon.length === 0 ? null : calon[Math.min(Math.floor(acak() * calon.length), calon.length - 1)]!;
}
