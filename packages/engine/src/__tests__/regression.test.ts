import { describe, expect, test } from 'vitest';
import { hitung } from '../pipeline.js';
import type { HasilEngine } from '../types.js';
import { BAB16_FIXTURES, caseNominal } from './fixtures/bab16.js';

type OkResult = Extract<HasilEngine, { status: 'OK' }>;

/** Saham individu dari barisTabel.perOrang (kelompok 2:1 punya bagian anggota berbeda). */
function sahamPerPerson(hasil: OkResult): Record<string, bigint> {
  const out: Record<string, bigint> = {};
  for (const barisTabel of hasil.tabel.baris) {
    for (const [idOrang, { saham }] of Object.entries(barisTabel.perOrang)) out[idOrang] = saham;
  }
  return out;
}

describe('Regression bab 16', () => {
  for (const fixture of BAB16_FIXTURES) {
    test(`${fixture.id}: ${fixture.menguji}`, () => {
      const hasil = hitung(fixture.input);
      const expected = fixture.expected;
      expect(hasil.status).toBe(expected.status);

      if (expected.status === 'OK' && hasil.status === 'OK') {
        const actual = sahamPerPerson(hasil);

        // Tepat sama: tidak ada orang lain yang dapat saham > 0 di luar expected.
        const nonZero = Object.fromEntries(Object.entries(actual).filter(([, v]) => v > 0n));
        const expectedNonZero = Object.fromEntries(Object.entries(expected.tabel.saham).filter(([, v]) => v > 0n));
        expect(nonZero).toEqual(expectedNonZero);

        // Invarian: Σ saham individu = ashl final (tashih) [bab 10.5]
        const jumlahSaham = Object.values(actual).reduce((a, b) => a + b, 0n);
        expect(jumlahSaham, 'Σ saham = ashl final').toBe(expected.tabel.finalAshl);

        for (const excludedId of expected.tabel.dikecualikan ?? []) {
          expect(hasil.tabel.dikecualikan, `${excludedId} harus dikecualikan`).toContain(excludedId);
        }

        const kinds = new Set(hasil.jejak.map(step => step.jenis));
        for (const jenis of expected.traceKinds ?? []) {
          expect(kinds, `jejak harus mengandung ${jenis}`).toContain(jenis);
        }
      } else if (expected.status === 'PERLU_INPUT' && hasil.status === 'PERLU_INPUT') {
        const askedFields = hasil.pertanyaan.map(q => q.isian);
        for (const isian of expected.questionFields) {
          expect(askedFields, `harus tanya '${isian}'`).toContain(isian);
        }
      }
    });
  }
});

describe('Uji nominal bab 16', () => {
  // Floor per orang ke kelipatan satuan (engine-contract Tahap 6); KB menulis 46.666.667 — sengaja menyimpang.
  // Tirkah bersih 80.000.000: istri 3/24, anak lk 14/24, anak pr 7/24.
  const cases = [
    { satuan: 1n,    W1: 10_000_000n, S1: 46_666_666n, D1: 23_333_333n, sisaPembulatan: 1n },
    { satuan: 100n,  W1: 10_000_000n, S1: 46_666_600n, D1: 23_333_300n, sisaPembulatan: 100n },
    { satuan: 1000n, W1: 10_000_000n, S1: 46_666_000n, D1: 23_333_000n, sisaPembulatan: 1_000n },
  ];

  for (const { satuan, sisaPembulatan, ...amounts } of cases) {
    test(`C16-NOM satuan ${satuan}: wasiat dipotong ke 1/3, floor per orang, selisih dilaporkan`, () => {
      const hasil = hitung({ ...caseNominal.input, pembulatan: { satuan } });
      expect(hasil.status).toBe('OK');
      if (hasil.status !== 'OK') return;

      const distributed = hasil.jejak.filter(
        (step): step is Extract<OkResult['jejak'][number], { jenis: 'DISTRIBUSI' }> => step.jenis === 'DISTRIBUSI',
      );
      const byPerson = Object.fromEntries(distributed.map(d => [d.idOrang, d.besaran]));
      expect(byPerson).toEqual(amounts);
      expect(hasil.pembulatan).toEqual({ satuan, sisaPembulatan });

      const total = distributed.reduce((sum, d) => sum + d.besaran, 0n);
      expect(total + hasil.pembulatan.sisaPembulatan).toBe(80_000_000n);
    });
  }
});
