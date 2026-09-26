// Menilai tebakan mode Belajar: tiap orang ditebak bagiannya sebagai pecahan dari harta ("1/8", "0", "1").
// Tebakan benar bila senilai dengan saham/penyebut dari engine (3/24 sama dengan 1/8). Tanpa number: bigint saja.

import { angkaLatin } from '../terjemah';

export interface Pecahan { n: bigint; d: bigint }

/** "1/8" → {1, 8}; "0" / "1" → bilangan bulat; selain itu (kosong, "0,5", "1/0") → null. */
export function bacaPecahan(teks: string): Pecahan | null {
  const cocok = /^\s*(\d+)\s*(?:\/\s*(\d+)\s*)?$/.exec(angkaLatin(teks));
  if (!cocok) return null;
  const d = BigInt(cocok[2] ?? '1');
  return d === 0n ? null : { n: BigInt(cocok[1]!), d };
}

export const senilai = (tebakan: Pecahan, saham: bigint, penyebut: bigint): boolean => tebakan.n * penyebut === saham * tebakan.d;

export type HasilTebakan =
  | { jenis: 'belumLengkap'; idKosong: string[] }
  | { jenis: 'dinilai'; idBenar: string[]; idSalah: string[] };

export function nilaiTebakan(
  tebakan: Record<string, string>, kunci: Array<{ id: string; saham: bigint }>, penyebut: bigint,
): HasilTebakan {
  const terbaca = kunci.map(orang => ({ ...orang, pecahan: bacaPecahan(tebakan[orang.id] ?? '') }));
  const idKosong = terbaca.filter(orang => !orang.pecahan).map(orang => orang.id);
  if (idKosong.length > 0) return { jenis: 'belumLengkap', idKosong };
  const benar = (orang: typeof terbaca[number]) => senilai(orang.pecahan!, orang.saham, penyebut);
  return { jenis: 'dinilai', idBenar: terbaca.filter(benar).map(orang => orang.id), idSalah: terbaca.filter(orang => !benar(orang)).map(orang => orang.id) };
}
