import { describe, expect, test } from 'vitest';
import { hitungDzawilArham } from '../dzawilArham.js';
import { hitung } from '../pipeline.js';
import type { HasilEngine, Ruleset } from '../types.js';
import { case24 } from './fixtures/bab16.js';
import {
  DZAWIL_ARHAM_FIXTURES, KASUS_DZAWIL_ARHAM_MADZHAB, dengan, grafDA14, grafDA17, grafDA19, grafDA20, type FixtureDzawilArham,
} from './fixtures/dzawilArham.js';

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

describe('Dzawil arham — nominal', () => {
  test('harta 90.000.000: khalah 30 jt, ammah 60 jt; Σ nominal + selisih = bersih', () => {
    const hasil = hitungDzawilArham({ ...case24.input, tirkah: { kotor: 90_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } });
    if (hasil.status !== 'OK') throw new Error(hasil.status);
    const nominal = Object.fromEntries(hasil.tabel.baris.flatMap(b => Object.entries(b.perOrang).map(([id, sel]) => [id, sel.nominal])));
    expect(nominal).toMatchObject({ KL1: 30_000_000n, AM1: 60_000_000n });
    expect(Object.values(nominal).reduce((a, b) => a + b, 0n) + hasil.pembulatan.sisaPembulatan).toBe(90_000_000n);
  });

  test('kasus tanpa dzawil arham → hasil hitung() apa adanya', () => {
    const graf = { idPewaris: 'D', orang: { D: { id: 'D', jenisKelamin: 'L' as const, statusHidup: 'wafat' as const, agama: 'islam' as const },
      A: { id: 'A', jenisKelamin: 'P' as const, statusHidup: 'hidup' as const, agama: 'islam' as const, idAyah: 'D' } }, pernikahan: [] };
    const masukan = { ...case24.input, graf };
    expect(hitungDzawilArham(masukan)).toEqual(hitung(masukan));
  });
});

describe('Dzawil arham — temuan review akhir', () => {
  test("istri + dzawil arham yang semuanya terhalang mawani' → istri 1/4, sisa ke baitul mal [R02-1]", () => {
    const hasil = hitungDzawilArham(dengan(grafDA17));
    if (hasil.status !== 'OK') throw new Error(`${hasil.status}`);
    expect(sahamPerOrang(hasil).W).toBe(1n);
    expect(hasil.tabel.totalKolom.ashl).toBe(4n);
    expect(hasil.sisaKeluar?.tujuan).toBe('baitulMal');
  });

  test('penerima terhijab di dalam cabang perantara punya penghijab', () => {
    const hasil = hitungDzawilArham(dengan(grafDA19));
    if (hasil.status !== 'OK') throw new Error(`${hasil.status}`);
    expect(hasil.statusOrang.DS).toMatchObject({ jenis: 'mahjub', oleh: ['SD'] });
  });

  test('dua jalur satu jihah: tidak ada jejak "terhijab oleh dirinya sendiri"', () => {
    const hasil = hitungDzawilArham(dengan(grafDA20));
    if (hasil.status !== 'OK') throw new Error(`${hasil.status}`);
    const terhijabDiriSendiri = hasil.jejak.filter(langkah => langkah.jenis === 'DZAWIL_ARHAM_TERHIJAB_JIHAH' && langkah.oleh.includes(langkah.idOrang));
    expect(terhijabDiriSendiri).toEqual([]);
  });

  test('satu penerima: tidak ada jejak sama rata / khilaf', () => {
    const hasil = hitungDzawilArham(dengan(grafDA14, 'hanbali'));
    if (hasil.status !== 'OK') throw new Error(`${hasil.status}`);
    expect(hasil.jejak.some(langkah => langkah.jenis === 'KHILAF_MADZHAB')).toBe(false);
    expect(hasil.jejak.some(langkah => langkah.jenis === 'DZAWIL_ARHAM_TURUN' && langkah.rasio === 'samaRata')).toBe(false);
  });
});

describe('Gerbang radd [HNB] di luar tanzil', () => {
  test('radd biasa lewat hitung() publik tetap ditolak R09-7 (pengecualian [R14-9] hanya di dalam tanzil)', () => {
    const graf = { idPewaris: 'D', orang: { D: { id: 'D', jenisKelamin: 'L' as const, statusHidup: 'wafat' as const, agama: 'islam' as const },
      A: { id: 'A', jenisKelamin: 'P' as const, statusHidup: 'hidup' as const, agama: 'islam' as const, idAyah: 'D' } }, pernikahan: [] };
    const masukan = dengan(graf, 'hanbali');
    const hasil = hitung(masukan);
    expect(hasil.status).toBe('TIDAK_DIDUKUNG');
    if (hasil.status === 'TIDAK_DIDUKUNG') expect(hasil.refs).toContain('R09-7');
    expect(hitungDzawilArham(masukan)).toEqual(hasil);
  });
});

describe('Dzawil arham — invarian di semua fixture OK', () => {
  for (const fixture of DZAWIL_ARHAM_FIXTURES.filter(f => f.harapan.status === 'OK')) {
    test(fixture.id, () => {
      const hasil = hitungDzawilArham(fixture.input);
      if (hasil.status !== 'OK') throw new Error(hasil.status);
      const saham = sahamPerOrang(hasil);
      expect(Object.values(saham).every(s => s >= 0n), 'saham bulat ≥ 0').toBe(true);
      expect(Object.values(saham).reduce((a, b) => a + b, 0n), 'Σ saham = tashih').toBe(hasil.tabel.totalKolom.tashih);
      for (const langkah of hasil.jejak) {
        if (langkah.jenis === 'DZAWIL_ARHAM_MASALAH_PERANTARA' && langkah.aul !== undefined) {
          expect([langkah.ashl, langkah.aul], "'aul hanya 6 → 7 [R14-13]").toEqual([6n, 7n]);
        }
      }
      // Tiap dzawil arham hidup yang tidak mendapat saham harus tercatat alasannya.
      for (const [id, status] of Object.entries(hasil.statusOrang)) {
        if (status.jenis === 'ahliWaris' && status.peran.kunci === 'DZAWIL_ARHAM') expect(saham[id], id).toBeGreaterThan(0n);
      }
    });
  }
});
