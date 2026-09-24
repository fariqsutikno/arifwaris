import { pecahan } from '@waris/math';
import { describe, expect, test } from 'vitest';
import * as bab16 from '../../__tests__/fixtures/bab16.js';
import { compute } from '../../pipeline.js';
import type { EngineInput, EngineResult, TraceStep } from '../../types.js';
import { computeAshl } from '../ashl.js';
import { classifyMasalah } from '../klasifikasi.js';
import { makeGroup } from '../model.js';
import { applyTashih } from '../tashih.js';
import { computeTirkah } from '../tirkah.js';
import { ANAK, KANDUNG, SEBAPAK, keluarga } from './helpers.js';

type Ok = Extract<EngineResult, { status: 'OK' }>;

function ok(input: EngineInput): Ok {
  const result = compute(input);
  if (result.status !== 'OK') throw new Error(`${result.status}: ${JSON.stringify(result)}`);
  return result;
}

const steps = <K extends TraceStep['kind']>(input: EngineInput, kind: K) =>
  ok(input).trace.filter((s): s is Extract<TraceStep, { kind: K }> => s.kind === kind);

const compares = (input: EngineInput, purpose: string) =>
  steps(input, 'NISAB_COMPARE').filter(s => s.purpose === purpose)
    .map(({ a, b, relation, gcd, result }) => ({ a, b, relation, gcd, result }));

describe('tahap 0 — tirkah [R01-1] [R01-4]', () => {
  test('uji nominal bab 16: wasiat dipotong ke 1/3 sisa setelah hutang', () => {
    const { bersih, trace } = computeTirkah(bab16.caseNominal.input.tirkah);
    expect(bersih).toBe(80_000_000n);
    expect(trace).toMatchObject({
      kind: 'TIRKAH', gross: 150_000_000n, tajhiz: 5_000_000n, hutang: 25_000_000n,
      wasiatDiminta: 50_000_000n, wasiatBatas: 40_000_000n, wasiatDipakai: 40_000_000n, wasiatButuhIjazah: 10_000_000n,
    });
  });

  test('bab 1.5: hutang ≥ tirkah → tidak ada pembagian', () => {
    expect(computeTirkah({ gross: 10n, tajhiz: 2n, hutang: 20n, wasiat: 5n }).bersih).toBe(0n);
  });
});

describe('tahap 3 — ashlul mas\'alah [R09-1] [R10-1]', () => {
  test('setiap pasangan penyebut dibandingkan dengan nisab arba\'', () => {
    // Minbariyyah: 1/8, 1/6, 1/6, 2/3 → 8 vs 6 tawafuq → 24; 24 vs 3 tadakhul → 24.
    expect(compares(bab16.case06.input, 'ashl')).toEqual([
      { a: 8n, b: 6n, relation: 'tawafuq', gcd: 2n, result: 24n },
      { a: 24n, b: 3n, relation: 'tadakhul', gcd: 3n, result: 24n },
    ]);
    expect(compares(bab16.case02.input, 'ashl')).toEqual([{ a: 2n, b: 6n, relation: 'tadakhul', gcd: 2n, result: 6n }]);
    expect(compares(bab16.case04.input, 'ashl')).toEqual([{ a: 2n, b: 3n, relation: 'tabayun', gcd: 1n, result: 6n }]);
  });

  test('[R09-2] semua ashabah → ashl = jumlah ru\'us', () => {
    expect(computeAshl([makeGroup('ASHABAH', { S1: 2n, D1: 1n }, { kind: 'ashabah', type: 'bilGhair' })]).ashl).toBe(3n);
  });
});

describe('tahap 4 — klasifikasi, \'aul, radd [R09-3] [R09-7]', () => {
  test('\'aul 24 → 27', () => {
    expect(steps(bab16.case06.input, 'MASALAH_CLASS')).toMatchObject([{ cls: 'ailah', sumSaham: 27n, ashl: 24n }]);
    expect(steps(bab16.case06.input, 'AUL')).toMatchObject([{ from: 24n, to: 27n }]);
  });

  test('[R09-4] \'aul di luar 6→7..10, 12→13/15/17, 24→27 = pelanggaran invarian', () => {
    const fardh = (d: bigint, n = 1n) => ({ kind: 'fardh' as const, fardh: pecahan(n, d) });
    const masalah = computeAshl([
      makeGroup('A', { a: 1n }, fardh(8n)), makeGroup('B', { b: 1n }, fardh(3n, 2n)), makeGroup('C', { c: 1n }, fardh(3n, 2n)),
    ]);
    expect(() => classifyMasalah(masalah, bab16.case01.input.config, false)).toThrow(/R09-4/);
  });

  test('raddA: ashl diganti jumlah saham ahli radd', () => {
    expect(steps(bab16.case09.input, 'MASALAH_CLASS')).toMatchObject([{ cls: 'raddA', sumSaham: 4n, ashl: 6n }]);
    expect(steps(bab16.case09.input, 'RADD')).toMatchObject([{ raddiyyah: { ashl: 4n }, result: 4n }]);
  });

  test('raddB: zawjiyyah vs raddiyyah — tabayun (kasus 10) dan habis (kasus 11)', () => {
    expect(steps(bab16.case10.input, 'RADD')).toMatchObject([{
      zawjiyyah: { ashl: 4n, spouseSaham: 1n, sisa: 3n }, raddiyyah: { ashl: 4n }, result: 16n,
    }]);
    expect(compares(bab16.case10.input, 'raddVsSisa')).toEqual([{ a: 3n, b: 4n, relation: 'tabayun', gcd: 1n, result: 16n }]);
    expect(compares(bab16.case11.input, 'raddVsSisa')).toEqual([{ a: 3n, b: 3n, relation: 'habis', gcd: 3n, result: 4n }]);
  });

  test('radd tanpa ahli radd selain pasangan → UNSUPPORTED [R09-9]', () => {
    const istriSaja = keluarga({ W1: { sex: 'F' } }, [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }]);
    expect(compute(istriSaja)).toMatchObject({ status: 'UNSUPPORTED', refs: ['R09-9', 'R02-1'] });
  });

  test('residuePolicy baitulMal belum didukung', () => {
    const input = { ...bab16.case09.input, config: { ...bab16.case09.input.config, residuePolicy: 'baitulMal' as const } };
    expect(compute(input)).toMatchObject({ status: 'UNSUPPORTED', refs: ['R09-8'] });
  });
});

describe('tahap 5 — tashih [R10-2] [R10-3]', () => {
  test('inkisar: saham vs ru\'us hanya habis/tawafuq/tabayun (bab 10.3)', () => {
    // 4 istri, 3 saudara: istri 1 vs 4 → tabayun; saudara 3 vs 3 → habis.
    expect(compares(bab16.case22.input, 'inkisar')).toEqual([
      { a: 1n, b: 4n, relation: 'tabayun', gcd: 1n, result: 4n },
      { a: 3n, b: 3n, relation: 'habis', gcd: 3n, result: 1n },
    ]);
    expect(steps(bab16.case22.input, 'TASHIH')).toMatchObject([{ base: 4n, juzSahm: 4n, result: 16n }]);
  });

  test('dua kelompok inkisar: simpanan dibandingkan dengan nisab arba\' → juz\' as-sahm', () => {
    expect(compares(bab16.case23.input, 'juzSahm')).toEqual([{ a: 2n, b: 3n, relation: 'tabayun', gcd: 1n, result: 6n }]);
    expect(steps(bab16.case23.input, 'TASHIH')).toMatchObject([{ base: 6n, juzSahm: 6n, result: 36n }]);
  });

  test('akdariyyah: \'aul 9 lalu tashih 27', () => {
    expect(steps(bab16.case12.input, 'AUL')).toMatchObject([{ from: 6n, to: 9n }]);
    expect(steps(bab16.case12.input, 'TASHIH')).toMatchObject([{ base: 9n, juzSahm: 3n, result: 27n }]);
  });

  test('[R10-3] inkisar > 4 kelompok = pelanggaran invarian', () => {
    const groups = ['A', 'B', 'C', 'D', 'E'].map(id =>
      makeGroup(id, { [`${id}1`]: 1n, [`${id}2`]: 1n }, { kind: 'fardh', fardh: pecahan(1n, 5n) }));
    const saham = Object.fromEntries(groups.map(g => [g.id, 1n]));
    expect(() => applyTashih(groups, saham, 5n)).toThrow(/R10-3/);
  });
});

describe('tabel mas\'alah', () => {
  test('kolom dinamis dan total', () => {
    expect(ok(bab16.case01.input).table).toMatchObject({
      columns: ['fardh', 'ashl', 'tashih', 'perPerson', 'nominal'], totals: { ashl: 8n, tashih: 24n },
    });
    expect(ok(bab16.case05.input).table).toMatchObject({
      columns: ['fardh', 'ashl', 'aul', 'perPerson', 'nominal'], totals: { ashl: 6n, aul: 7n },
    });
    expect(ok(bab16.case10.input).table.totals).toEqual({ ashl: 12n, radd: 16n });
  });

  test('kelompok 2:1 punya bagian per orang berbeda', () => {
    const row = ok(bab16.case01.input).table.rows.find(r => r.group === 'ASHABAH');
    expect(row?.cells).toMatchObject({ ashl: 7n, tashih: 21n });
    expect(row?.perPerson).toEqual({ S1: { saham: 14n, nominal: 0n }, D1: { saham: 7n, nominal: 0n } });
  });
});

describe('end-to-end bab 08 [SYF]', () => {
  const sahamOf = (input: EngineInput) => {
    const result = ok(input);
    const out: Record<string, bigint> = {};
    for (const row of result.table.rows) for (const [id, { saham }] of Object.entries(row.perPerson)) out[id] = saham;
    return out;
  };
  const kakek = { PGF: { sex: 'M' } } as const;

  test('muqasamah: kakek + 1 saudara → 2 : kakek 1, saudara 1', () => {
    expect(sahamOf(keluarga({ ...kakek, AK1: { sex: 'M', ...KANDUNG } }))).toEqual({ PGF: 1n, AK1: 1n });
  });

  test('[R08-4] mu\'addah: kakek, saudara kandung, saudara sebapak → 3 : 1, 2, 0', () => {
    expect(sahamOf(keluarga({ ...kakek, AK1: { sex: 'M', ...KANDUNG }, AB1: { sex: 'M', ...SEBAPAK } })))
      .toEqual({ PGF: 1n, AK1: 2n, AB1: 0n });
  });

  test('[R08-4] kakek, saudari kandung, saudara sebapak → 10 : 4, 5, 1', () => {
    expect(sahamOf(keluarga({ ...kakek, UK1: { sex: 'F', ...KANDUNG }, AB1: { sex: 'M', ...SEBAPAK } })))
      .toEqual({ PGF: 4n, UK1: 5n, AB1: 1n });
  });

  test('[R08-3] sisa ≤ 1/6: kakek 1/6 dengan \'aul, saudara gugur → 27', () => {
    const input = keluarga({
      ...kakek, M: { sex: 'F' }, B1: { sex: 'F', ...ANAK }, B2: { sex: 'F', ...ANAK }, W1: { sex: 'F' },
      AK1: { sex: 'M', ...KANDUNG },
    }, [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }]);
    expect(sahamOf(input)).toEqual({ W1: 3n, B1: 8n, B2: 8n, M: 4n, PGF: 4n, AK1: 0n });
    expect(steps(input, 'AUL')).toMatchObject([{ from: 24n, to: 27n }]);
  });
});
