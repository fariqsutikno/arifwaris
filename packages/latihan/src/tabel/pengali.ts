// Baris Pengali munasakhat (spec B6 langkah 6): nilai yang harus diisi diturunkan dari kepala yang DIISI pelajar,
// supaya kelipatan asal masalah tetap konsisten.
// [R12-2] mas'alah × pengalinya = bagian jami'ah yang dicakup mas'alah itu; perbandingannya ke jami'ah tetap, berapa pun kelipatannya.

import type { TabelSoal } from './model.js';

/** `kepala`: kepala tiap kolom bulat (kolom terkunci = kuncinya). Ada yang kosong/nol → tidak bisa diturunkan. */
export function pengaliHarusnya(tabel: TabelSoal, idKolom: string, kepala: Record<string, bigint | undefined>): bigint | undefined {
  const { kunci, kolomJamiah } = tabel.pengali!;
  const masalah = tabel.kolom.find(kolom => kolom.id === idKolom)!.kepala!;
  const jamiahKunci = tabel.kolom.find(kolom => kolom.id === kolomJamiah)!.kepala!;
  const jamiahIsi = kepala[kolomJamiah];
  const masalahIsi = kepala[idKolom];
  if (!jamiahIsi || !masalahIsi) return undefined;
  const pembilang = jamiahIsi * masalah * kunci[idKolom]!;
  const penyebut = jamiahKunci * masalahIsi;
  return pembilang % penyebut === 0n ? pembilang / penyebut : undefined;
}
