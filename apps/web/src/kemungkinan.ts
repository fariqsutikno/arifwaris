// Kemungkinan dari jawaban "tidak tahu" (spec 10-01 bag. 3, jenis B): bila tiap kemungkinan fakta bisa dihitung sebagai kasus yang pasti,
// semuanya dihitung dan ditampilkan berdampingan. Aplikasi TIDAK memilih mana yang berlaku (CLAUDE.md: tidak mengarang aturan).
// Kemungkinan tidak disimpan di Kasus; diturunkan tiap hitung: (kasus) => Kasus per kemungkinan, lalu jalankan().
// Saat ini yang didukung: urutan wafat dua orang yang tidak diketahui (Kasus.belumPasti, jenis 'urutan').

import type { IdOrang } from '@waris/engine';
import { cobaRingkas } from './hasil/ringkasan';
import { jalankan } from './jalankan';
import type { Kasus } from './kasus';
import { namaSingkat } from './keadaanOrang';
import { t } from './terjemah';

/** Paling banyak dua hal belum pasti (2² = 4 kemungkinan); lebih dari itu diganti daftar "Pastikan" (pola BATAS_DUNIA). */
export const BATAS_KEMUNGKINAN_TAMPIL = 4;

export interface Kemungkinan {
  label: string;
  kasus: Kasus;
  /** Nominal per orang menurut kemungkinan ini; null bila tidak bisa dihitung sebagai satu pembagian. */
  bagian: Record<IdOrang, bigint> | null;
  nama: Record<IdOrang, string>;
}

export type HasilKemungkinan =
  | { jenis: 'daftar'; daftar: Kemungkinan[]; berpengaruh: boolean; hal: Array<{ a: IdOrang; b: IdOrang }> }
  | { jenis: 'terlaluBanyak'; hal: Array<{ a: IdOrang; b: IdOrang }> };

/** null = tidak ada hal belum pasti. */
export function turunkanKemungkinan(kasus: Kasus): HasilKemungkinan | null {
  const hal = (kasus.belumPasti ?? []).filter(h => kasus.urutanWafat.includes(h.a) && kasus.urutanWafat.includes(h.b));
  if (hal.length === 0) return null;
  if (2 ** hal.length > BATAS_KEMUNGKINAN_TAMPIL) return { jenis: 'terlaluBanyak', hal };
  const daftar: Kemungkinan[] = [];
  for (let kombinasi = 0; kombinasi < 2 ** hal.length; kombinasi++) {
    const tukar = hal.filter((_, indeks) => (kombinasi >> indeks) & 1);
    const urutanWafat = tukar.reduce((urutan, { a, b }) => tukarPosisi(urutan, a, b), [...kasus.urutanWafat]);
    const varian: Kasus = { ...kasus, urutanWafat };
    const tampil = jalankan(varian);
    const ringkasan = cobaRingkas(varian, tampil);
    const bagian: Record<IdOrang, bigint> | null = ringkasan ? Object.fromEntries(ringkasan.penerima.map(orang => [orang.id, orang.nominal])) : null;
    const nama: Record<IdOrang, string> = ringkasan ? Object.fromEntries(ringkasan.penerima.map(orang => [orang.id, orang.nama])) : {};
    daftar.push({ label: labelKemungkinan(varian, hal), kasus: varian, bagian, nama });
  }
  const acuan = daftar[0]!.bagian;
  const berpengaruh = daftar.some(k => !samaBagian(k.bagian, acuan));
  return { jenis: 'daftar', daftar, berpengaruh, hal };
}

/** Selisih tiap orang terhadap kemungkinan acuan (pilihan pertama), dan orang yang menerima di acuan tetapi tidak di sini. */
export function selisihTerhadap(acuan: Kemungkinan, ini: Kemungkinan): { selisih: Record<IdOrang, bigint>; tidakLagi: Array<{ id: IdOrang; nama: string; nominal: bigint }> } {
  const selisih: Record<IdOrang, bigint> = {};
  const tidakLagi: Array<{ id: IdOrang; nama: string; nominal: bigint }> = [];
  if (!acuan.bagian || !ini.bagian) return { selisih, tidakLagi };
  for (const [id, nominal] of Object.entries(ini.bagian)) selisih[id] = nominal - (acuan.bagian[id] ?? 0n);
  for (const [id, nominal] of Object.entries(acuan.bagian)) if (!(id in ini.bagian)) tidakLagi.push({ id, nama: acuan.nama[id] ?? id, nominal });
  return { selisih, tidakLagi };
}

function tukarPosisi(urutan: IdOrang[], a: IdOrang, b: IdOrang): IdOrang[] {
  const ia = urutan.indexOf(a);
  const ib = urutan.indexOf(b);
  [urutan[ia], urutan[ib]] = [urutan[ib]!, urutan[ia]!];
  return urutan;
}

const labelKemungkinan = (varian: Kasus, hal: Array<{ a: IdOrang; b: IdOrang }>): string => hal.map(({ a, b }) => {
  const [dulu, lalu] = varian.urutanWafat.indexOf(a) < varian.urutanWafat.indexOf(b) ? [a, b] : [b, a];
  return t('hitung.kemungkinan.urutan', { dulu: namaSingkat(varian, dulu), lalu: namaSingkat(varian, lalu) });
}).join(' · ');

function samaBagian(x: Record<IdOrang, bigint> | null, y: Record<IdOrang, bigint> | null): boolean {
  if (!x || !y) return x === y;
  const kunci = new Set([...Object.keys(x), ...Object.keys(y)]);
  return [...kunci].every(id => (x[id] ?? 0n) === (y[id] ?? 0n));
}
