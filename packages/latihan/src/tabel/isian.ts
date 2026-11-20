// Pembacaan isian pelajar yang dipakai penilaian dan ECF: satu pintu supaya keduanya membaca sel dengan aturan sama.

import { angkaLatin } from '../angka.js';
import type { BarisSoal, IsianTabel, Jangkar, KolomSoal, TabelSoal } from './model.js';

export const bersihkan = (teks: string | undefined): string | undefined => (teks?.trim() ? teks.trim() : undefined);

/** Hanya bilangan bulat tak negatif (B2); selain itu dianggap kosong. */
export function bacaBulat(teks: string | undefined): bigint | undefined {
  const bersih = angkaLatin(teks ?? '').trim();
  return /^\d{1,6}$/.test(bersih) ? BigInt(bersih) : undefined;
}

/** Isi sel; sel jangkar selalu berisi kunci. */
export function isiSel(baris: BarisSoal, kolom: KolomSoal, isian: IsianTabel, jangkar: Jangkar | null): string | undefined {
  return jangkar?.idKolom === kolom.id && jangkar.idBaris === baris.id ? baris.kunci[kolom.id] : bersihkan(isian.sel[baris.id]?.[kolom.id]);
}

/** Baris yang dinilai di kolom: berkunci, dan sel bersama hanya di baris pertama kelompoknya [B4]. */
export function barisDinilai(tabel: TabelSoal, kolom: KolomSoal): BarisSoal[] {
  return tabel.baris.filter((baris, indeks) => baris.kunci[kolom.id] !== undefined
    && (baris.kelompok[kolom.id] === undefined || tabel.baris.findIndex(lain => lain.kelompok[kolom.id] === baris.kelompok[kolom.id]) === indeks));
}
