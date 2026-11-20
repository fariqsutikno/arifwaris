// Satu sel saham terisi per soal (spec B5). `acak` disuntikkan: peramban memakai Math.random, server/uji memakai yang deterministik.

import type { Jangkar, TabelSoal } from './model.js';

/** Kolom bulat, berkunci, bukan 0, bukan sel bersama, bukan kolom terkunci. Tidak ada calon → null. */
export function pilihJangkar(tabel: TabelSoal, acak: () => number): Jangkar | null {
  const calon = tabel.kolom.filter(kolom => kolom.jenis === 'bulat' && !kolom.terkunci).flatMap(kolom => tabel.baris
    .filter(baris => baris.kunci[kolom.id] !== undefined && baris.kunci[kolom.id] !== '0' && baris.kelompok[kolom.id] === undefined)
    .map(baris => ({ idBaris: baris.id, idKolom: kolom.id })));
  return calon.length === 0 ? null : calon[Math.min(Math.floor(acak() * calon.length), calon.length - 1)]!;
}
