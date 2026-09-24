import { describe, expect, test } from 'vitest';
import { computeMunasakhat } from '../munasakhat.js';
import type { MunasakhatInput, MunasakhatResult } from '../types.js';
import { M2, MUNASAKHAT_FIXTURES } from './fixtures/munasakhat.js';

type Ok = Extract<MunasakhatResult, { status: 'OK' }>;

function ok(input: MunasakhatInput): Ok {
  const result = computeMunasakhat(input);
  if (result.status !== 'OK') throw new Error(`${result.status}: ${JSON.stringify(result)}`);
  return result;
}

/** Saham > 0 dinyatakan sebagai pecahan saham/jamiah yang dinormalisasi, supaya bisa dibandingkan lintas jami'ah. */
function asFractions(saham: Record<string, bigint>, jamiah: bigint): Record<string, string> {
  const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));
  return Object.fromEntries(Object.entries(saham).filter(([, s]) => s > 0n).map(([id, s]) => {
    const g = gcd(s, jamiah);
    return [id, `${s / g}/${jamiah / g}`];
  }));
}

describe('Munasakhat bab 12 — kasus uji M1–M9 (bab 16)', () => {
  for (const fixture of MUNASAKHAT_FIXTURES) {
    test(`${fixture.id}: ${fixture.menguji}`, () => {
      const result = ok(fixture.input);
      const { expected } = fixture;

      expect(asFractions(result.saham, result.jamiah)).toEqual(asFractions(expected.saham, expected.jamiah));
      expect(Object.values(result.saham).reduce((a, b) => a + b, 0n), 'Σ saham = jami\'ah').toBe(result.jamiah);
      if (expected.exactJamiah) {
        expect(result.jamiah).toBe(expected.jamiah);
        expect(result.saham).toEqual(expected.saham);
      }
      if (expected.ikhtishar) expect(result.ikhtishar).toEqual(expected.ikhtishar);
      if (expected.relations) {
        const relations = result.trace.flatMap(step => (step.kind === 'MUNASAKHAT' ? [step.relation] : []));
        expect(relations).toEqual(expected.relations);
      }
      expect(result.steps.map(s => s.mayit)).toEqual([fixture.input.base.graph.deceasedId, ...fixture.input.deaths.map(d => d.personId)]);
    });
  }
});

describe('Munasakhat — penolakan dan pertanyaan', () => {
  test('yang wafat bukan ahli waris mayit sebelumnya (saham 0) → UNSUPPORTED', () => {
    const graph = structuredClone(M2.input.base.graph);
    graph.persons['F1'] = { id: 'F1', sex: 'M', life: 'dead', religion: 'islam', isPlaceholder: true };
    graph.persons['D']!.fatherId = 'F1';
    graph.persons['AK'] = { id: 'AK', sex: 'M', life: 'alive', religion: 'islam', fatherId: 'F1' };
    const result = computeMunasakhat({ ...M2.input, base: { ...M2.input.base, graph }, deaths: [{ personId: 'AK' }] });
    expect(result).toMatchObject({ status: 'UNSUPPORTED', mayit: 'AK', refs: ['R12-1'] });
  });

  test('data kurang pada mayit berikutnya → NEEDS_INPUT dengan mayit-nya', () => {
    const graph = structuredClone(M2.input.base.graph);
    graph.persons['HB'] = { id: 'HB', sex: 'M', life: 'alive', religion: 'unknown' };
    graph.marriages.push({ husbandId: 'HB', wifeId: 'B', status: 'intact' });
    const result = computeMunasakhat({ ...M2.input, base: { ...M2.input.base, graph } });
    expect(result).toMatchObject({ status: 'NEEDS_INPUT', mayit: 'B', questions: [{ personId: 'HB', field: 'religion' }] });
  });
});

describe('Munasakhat — nominal (bab 12.5)', () => {
  const withTirkah = (deaths: MunasakhatInput['deaths']): MunasakhatInput => ({
    ...M2.input,
    base: { ...M2.input.base, tirkah: { gross: 72_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } },
    deaths,
  });

  test('default: potongan mayit berikutnya dianggap beres → dibagi menurut jami\'ah', () => {
    const result = ok(withTirkah([{ personId: 'B' }]));
    expect(result.nominal).toEqual({ W: 16_000_000n, S: 56_000_000n });
    expect(result.rounding.remainder).toBe(0n);
  });

  test('potongan 0 diisi eksplisit = jalur jami\'ah', () => {
    const result = ok(withTirkah([{ personId: 'B', tirkah: { pribadi: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n } }]));
    expect(result.nominal).toEqual({ W: 16_000_000n, S: 56_000_000n });
  });

  test('hutang mayit kedua dibayar dulu dari hartanya (warisan 21 jt → bersih 18 jt)', () => {
    const result = ok(withTirkah([{ personId: 'B', tirkah: { pribadi: 0n, tajhiz: 0n, hutang: 3_000_000n, wasiat: 0n } }]));
    // W: 3/24 × 72 jt + 1/3 × 18 jt; S: 14/24 × 72 jt + 2/3 × 18 jt
    expect(result.nominal).toEqual({ W: 15_000_000n, S: 54_000_000n });
    expect(result.rounding.remainder).toBe(0n);
    expect(result.trace.some(step => step.kind === 'MUNASAKHAT_TIRKAH')).toBe(true);
  });

  test('harta pribadi + wasiat mayit kedua (wasiat dipangkas 1/3)', () => {
    // B: warisan 21 jt + pribadi 9 jt = 30 jt; wasiat diminta 15 jt → dipakai 10 jt; bersih 20 jt
    const result = ok(withTirkah([{ personId: 'B', tirkah: { pribadi: 9_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 15_000_000n } }]));
    expect(result.nominal).toEqual({ W: 9_000_000n + 6_666_666n, S: 42_000_000n + 13_333_333n });
    expect(result.rounding.remainder).toBe(1n);
  });
});
