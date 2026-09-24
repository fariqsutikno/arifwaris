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
      expect(result.keadaan, 'keadaan').toBe(expected.keadaan);
      if (expected.ikhtishar) expect(result.ikhtishar).toEqual(expected.ikhtishar);
      if (expected.relations) {
        const relations = result.trace.flatMap(step => (step.kind === 'MUNASAKHAT' ? [step.relation] : []));
        expect(relations).toEqual(expected.relations);
      }
      expect(result.steps.map(s => s.mayit)).toEqual([fixture.input.base.graph.deceasedId, ...fixture.input.deaths]);
    });
  }
});

describe('Munasakhat — penolakan dan pertanyaan', () => {
  const cloneGraph = () => {
    const { graph } = M2.input.base;
    return { ...graph, persons: { ...graph.persons }, marriages: [...graph.marriages] };
  };

  test('yang wafat tanpa bagian dari mayit sebelumnya (mahjub) → diabaikan dengan catatan', () => {
    const graph = cloneGraph();
    graph.persons['F1'] = { id: 'F1', sex: 'M', life: 'dead', religion: 'islam', isPlaceholder: true };
    graph.persons['D'] = { ...graph.persons['D']!, fatherId: 'F1' };
    graph.persons['AK'] = { id: 'AK', sex: 'M', life: 'alive', religion: 'islam', fatherId: 'F1' };
    const result = ok({ ...M2.input, base: { ...M2.input.base, graph }, deaths: ['AK', 'B'] });
    expect(result.trace).toContainEqual({ stage: 'munasakhat', refs: ['R12-1'], kind: 'MUNASAKHAT_SKIP', mayit: 'AK' });
    expect(result.steps.map(s => s.mayit)).toEqual(['D', 'B']);
    expect(result.saham).toEqual({ W: 16n, S: 56n });
  });

  test('data kurang pada mayit berikutnya → NEEDS_INPUT dengan mayit-nya', () => {
    const graph = cloneGraph();
    graph.persons['HB'] = { id: 'HB', sex: 'M', life: 'alive', religion: 'unknown' };
    graph.marriages.push({ husbandId: 'HB', wifeId: 'B', status: 'intact' });
    const result = computeMunasakhat({ ...M2.input, base: { ...M2.input.base, graph } });
    expect(result).toMatchObject({ status: 'NEEDS_INPUT', mayit: 'B', questions: [{ personId: 'HB', field: 'religion' }] });
  });
});

describe('Munasakhat — nominal', () => {
  test('hanya harta mayit pertama yang dibagi, menurut jami\'ah (bab 12.5)', () => {
    const result = ok({ ...M2.input, base: { ...M2.input.base, tirkah: { gross: 72_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } } });
    expect(result.nominal).toEqual({ W: 16_000_000n, S: 56_000_000n });
    expect(result.rounding.remainder).toBe(0n);
  });
});
