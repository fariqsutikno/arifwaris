import { describe, expect, test } from 'vitest';
import { hitungDzawilArham } from '../dzawilArham.js';
import type { HasilEngine, Ruleset } from '../types.js';
import { DZAWIL_ARHAM_FIXTURES, KASUS_DZAWIL_ARHAM_MADZHAB, dengan, type FixtureDzawilArham } from './fixtures/dzawilArham.js';

type Ok = Extract<HasilEngine, { status: 'OK' }>;
const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));

function sahamPerOrang(hasil: Ok): Record<string, bigint> {
  return Object.fromEntries(hasil.tabel.baris.flatMap(baris => Object.entries(baris.perOrang).map(([id, sel]) => [id, sel.saham])));
}
function sebagaiPecahan(saham: Record<string, bigint>, penyebut: bigint): Record<string, string> {
  return Object.fromEntries(Object.entries(saham).filter(([, s]) => s > 0n)
    .map(([id, s]) => { const g = fpb(s, penyebut); return [id, `${s / g}/${penyebut / g}`]; }));
}

function periksa(hasil: HasilEngine, harapan: FixtureDzawilArham['harapan']) {
  expect(hasil.status).toBe(harapan.status);
  if (hasil.status === 'OK' && harapan.status === 'OK') {
    const saham = sahamPerOrang(hasil);
    const penyebut = hasil.tabel.totalKolom.tashih!;
    expect(sebagaiPecahan(saham, penyebut)).toEqual(sebagaiPecahan(harapan.saham, harapan.penyebut));
    expect(Object.values(saham).reduce((a, b) => a + b, 0n), 'Σ saham = penyebut').toBe(penyebut);
    if (harapan.penyebutEksak) expect(penyebut).toBe(harapan.penyebut);
    for (const id of harapan.dikecualikan ?? []) expect(hasil.tabel.dikecualikan).toContain(id);
    const jenis = new Set(hasil.jejak.map(langkah => langkah.jenis));
    for (const j of harapan.jenisJejak ?? []) expect(jenis, `jejak ${j}`).toContain(j);
    expect(hasil.sisaKeluar).toBeUndefined();
  } else if (hasil.status === 'TIDAK_DIDUKUNG' && harapan.status === 'TIDAK_DIDUKUNG') {
    expect(hasil.refs).toEqual(harapan.refs);
  } else if (hasil.status === 'PERLU_INPUT' && harapan.status === 'PERLU_INPUT') {
    expect(hasil.pertanyaan.map(q => q.isian)).toEqual(expect.arrayContaining(harapan.isian));
  }
}

describe('Dzawil arham bab 14 — regression [SYF]', () => {
  for (const fixture of DZAWIL_ARHAM_FIXTURES) {
    test(`${fixture.id} (${fixture.sumber}): ${fixture.menguji}`, () => periksa(hitungDzawilArham(fixture.input), fixture.harapan));
  }
});

describe('Dzawil arham — overlay madzhab (K14-1..3)', () => {
  for (const kasus of KASUS_DZAWIL_ARHAM_MADZHAB) {
    for (const [ruleset, harapan] of Object.entries(kasus.harapan) as Array<[Ruleset, FixtureDzawilArham['harapan']]>) {
      test(`${kasus.id} [${ruleset}]`, () => periksa(hitungDzawilArham(dengan(kasus.graf, ruleset, kasus.konfigurasi)), harapan));
    }
  }
});
