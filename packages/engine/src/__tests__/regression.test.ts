import { describe, expect, test } from 'vitest';
import { compute } from '../pipeline.js';
import type { EngineResult } from '../types.js';
import { BAB16_FIXTURES, caseNominal } from './fixtures/bab16.js';

type OkResult = Extract<EngineResult, { status: 'OK' }>;

/** Saham individu dari row.perPerson (kelompok 2:1 punya bagian anggota berbeda). */
function sahamPerPerson(result: OkResult): Record<string, bigint> {
  const out: Record<string, bigint> = {};
  for (const row of result.table.rows) {
    for (const [personId, { saham }] of Object.entries(row.perPerson)) out[personId] = saham;
  }
  return out;
}

describe('Regression bab 16', () => {
  for (const fixture of BAB16_FIXTURES) {
    test(`${fixture.id}: ${fixture.menguji}`, () => {
      const result = compute(fixture.input);
      const expected = fixture.expected;
      expect(result.status).toBe(expected.status);

      if (expected.status === 'OK' && result.status === 'OK') {
        const actual = sahamPerPerson(result);

        // Tepat sama: tidak ada orang lain yang dapat saham > 0 di luar expected.
        const nonZero = Object.fromEntries(Object.entries(actual).filter(([, v]) => v > 0n));
        const expectedNonZero = Object.fromEntries(Object.entries(expected.table.saham).filter(([, v]) => v > 0n));
        expect(nonZero).toEqual(expectedNonZero);

        // Invarian: Σ saham individu = ashl final (tashih) [bab 10.5]
        const sumSaham = Object.values(actual).reduce((a, b) => a + b, 0n);
        expect(sumSaham, 'Σ saham = ashl final').toBe(expected.table.finalAshl);

        for (const excludedId of expected.table.excluded ?? []) {
          expect(result.table.excluded, `${excludedId} harus excluded`).toContain(excludedId);
        }

        const kinds = new Set(result.trace.map(step => step.kind));
        for (const kind of expected.traceKinds ?? []) {
          expect(kinds, `trace harus mengandung ${kind}`).toContain(kind);
        }
      } else if (expected.status === 'NEEDS_INPUT' && result.status === 'NEEDS_INPUT') {
        const askedFields = result.questions.map(q => q.field);
        for (const field of expected.questionFields) {
          expect(askedFields, `harus tanya '${field}'`).toContain(field);
        }
      }
    });
  }
});

describe('Uji nominal bab 16', () => {
  // Floor per orang ke kelipatan unit (engine-contract Tahap 6); KB menulis 46.666.667 — sengaja menyimpang.
  // Tirkah bersih 80.000.000: istri 3/24, anak lk 14/24, anak pr 7/24.
  const cases = [
    { unit: 1n,    W1: 10_000_000n, S1: 46_666_666n, D1: 23_333_333n, remainder: 1n },
    { unit: 100n,  W1: 10_000_000n, S1: 46_666_600n, D1: 23_333_300n, remainder: 100n },
    { unit: 1000n, W1: 10_000_000n, S1: 46_666_000n, D1: 23_333_000n, remainder: 1_000n },
  ];

  for (const { unit, remainder, ...amounts } of cases) {
    test(`C16-NOM unit ${unit}: wasiat dipotong ke 1/3, floor per orang, selisih dilaporkan`, () => {
      const result = compute({ ...caseNominal.input, rounding: { unit } });
      expect(result.status).toBe('OK');
      if (result.status !== 'OK') return;

      const distributed = result.trace.filter(
        (step): step is Extract<OkResult['trace'][number], { kind: 'DISTRIBUTE' }> => step.kind === 'DISTRIBUTE',
      );
      const byPerson = Object.fromEntries(distributed.map(d => [d.personId, d.amount]));
      expect(byPerson).toEqual(amounts);
      expect(result.rounding).toEqual({ unit, remainder });

      const total = distributed.reduce((sum, d) => sum + d.amount, 0n);
      expect(total + result.rounding.remainder).toBe(80_000_000n);
    });
  }
});
