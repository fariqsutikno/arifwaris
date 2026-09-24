/**
 * Fixture munasakhat M1–M9 (KB bab 16) — dibuat SEBELUM implementasi logika.
 * Angka dari tabel kitab Lahim; `jamiah` = jami'ah mentah bila kitab menuliskannya.
 */

import type { FamilyGraph, MunasakhatInput } from '../../types.js';
import { input, p } from './bab16.js';

export interface MunasakhatFixture {
  id: string;
  menguji: string;
  input: MunasakhatInput;
  expected: {
    /** Saham akhir per orang; dibandingkan sebagai pecahan saham ÷ jamiah. */
    saham: Record<string, bigint>;
    jamiah: bigint;
    /** Jami'ah mentah sama dengan kitab (bukan hanya pecahannya). */
    exactJamiah?: boolean;
    ikhtishar?: { jamiah: bigint; saham: Record<string, bigint> };
    relations?: Array<'habis' | 'tawafuq' | 'tabayun'>;
  };
}

const munasakhat = (graph: FamilyGraph, deaths: string[], bornAfterDeathOf?: Record<string, string>): MunasakhatInput => ({
  base: input(graph),
  deaths,
  ...(bornAfterDeathOf ? { bornAfterDeathOf } : {}),
});

const placeholder = (id: string, sex: 'M' | 'F', extra = {}) => p(id, sex, { life: 'dead', isPlaceholder: true, ...extra });

// ─── M1: suami, ibu, saudara lk kandung → suami wafat (anak lk + anak pr dari istri lain) ───
export const M1: MunasakhatFixture = {
  id: 'M1', menguji: "Keadaan 3, habis (tamatsul)",
  input: munasakhat({
    deceasedId: 'D',
    persons: {
      D: p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      F1: placeholder('F1', 'M'),
      M1: p('M1', 'F'),
      AK: p('AK', 'M', { fatherId: 'F1', motherId: 'M1' }),
      H: p('H', 'M'),
      W2: placeholder('W2', 'F'),
      S: p('S', 'M', { fatherId: 'H', motherId: 'W2' }),
      B: p('B', 'F', { fatherId: 'H', motherId: 'W2' }),
    },
    marriages: [{ husbandId: 'H', wifeId: 'D', status: 'intact' }],
  }, ['H']),
  expected: { jamiah: 6n, exactJamiah: true, saham: { M1: 2n, AK: 1n, S: 2n, B: 1n }, relations: ['habis'] },
};

// ─── M2: istri, anak lk, anak pr → anak pr wafat (ibu + saudara lk) ───
export const M2: MunasakhatFixture = {
  id: 'M2', menguji: 'Keadaan 3, tabayun',
  input: munasakhat({
    deceasedId: 'D',
    persons: {
      D: p('D', 'M', { life: 'dead' }),
      W: p('W', 'F'),
      S: p('S', 'M', { fatherId: 'D', motherId: 'W' }),
      B: p('B', 'F', { fatherId: 'D', motherId: 'W' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W', status: 'intact' }],
  }, ['B']),
  expected: { jamiah: 72n, exactJamiah: true, saham: { W: 16n, S: 56n }, relations: ['tabayun'] },
};

// ─── M3: 6 akh syaqiq + ibu; 3 akh wafat berturut, lalu ibu → sisa 3 akh ───
export const M3: MunasakhatFixture = {
  id: 'M3', menguji: 'Keadaan 1: beberapa kematian beruntun, bagi rata ke penyintas',
  input: munasakhat({
    deceasedId: 'D',
    persons: {
      D: p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      F1: placeholder('F1', 'M'),
      M1: p('M1', 'F'),
      ...Object.fromEntries(['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map(id => [id, p(id, 'M', { fatherId: 'F1', motherId: 'M1' })])),
    },
    marriages: [],
  }, ['A1', 'A2', 'A3', 'M1']),
  expected: {
    jamiah: 3n, saham: { A4: 1n, A5: 1n, A6: 1n },
    ikhtishar: { jamiah: 3n, saham: { A4: 1n, A5: 1n, A6: 1n } },
  },
};

// ─── M4: 3 akh syaqiq; 2 wafat berturut, masing-masing meninggalkan zawjah + bint ───
export const M4: MunasakhatFixture = {
  id: 'M4', menguji: 'Keadaan 3 bertahap: 3 → 48 → 384',
  input: munasakhat({
    deceasedId: 'D',
    persons: {
      D: p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      F1: placeholder('F1', 'M'),
      M1: placeholder('M1', 'F'),
      A: p('A', 'M', { fatherId: 'F1', motherId: 'M1' }),
      B: p('B', 'M', { fatherId: 'F1', motherId: 'M1' }),
      C: p('C', 'M', { fatherId: 'F1', motherId: 'M1' }),
      WA: p('WA', 'F'), DA: p('DA', 'F', { fatherId: 'A', motherId: 'WA' }),
      WB: p('WB', 'F'), DB: p('DB', 'F', { fatherId: 'B', motherId: 'WB' }),
    },
    marriages: [{ husbandId: 'A', wifeId: 'WA', status: 'intact' }, { husbandId: 'B', wifeId: 'WB', status: 'intact' }],
  }, ['A', 'B']),
  expected: {
    jamiah: 384n, exactJamiah: true, relations: ['tabayun', 'tabayun'],
    saham: { C: 209n, WA: 16n, DA: 64n, WB: 19n, DB: 76n },
  },
};

// ─── M5/M6: zawjah, bint, 'amm; salah satu bint wafat ───
// 'amm mayit 1 = 'amm al-ab bagi bint (tabel kitab: «عم أب»).
const grandparents = {
  GF: placeholder('GF', 'M'),
  GM: placeholder('GM', 'F'),
  F1: placeholder('F1', 'M', { fatherId: 'GF', motherId: 'GM' }),
  U: p('U', 'M', { fatherId: 'GF', motherId: 'GM' }),
};

export const M5: MunasakhatFixture = {
  id: 'M5', menguji: "Keadaan 3, tawafuq; umm 1/3 karena hanya 1 saudari",
  input: munasakhat({
    deceasedId: 'D',
    persons: {
      ...grandparents,
      D: p('D', 'M', { life: 'dead', fatherId: 'F1' }),
      W: p('W', 'F'),
      B1: p('B1', 'F', { fatherId: 'D', motherId: 'W' }),
      B2: p('B2', 'F', { fatherId: 'D', motherId: 'W' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W', status: 'intact' }],
  }, ['B2']),
  expected: { jamiah: 72n, exactJamiah: true, saham: { W: 17n, B1: 36n, U: 19n }, relations: ['tawafuq'] },
};

export const M6: MunasakhatFixture = {
  id: 'M6', menguji: 'Keadaan 3, tabayun; zawjah bukan ibu para bint',
  input: munasakhat({
    deceasedId: 'D',
    persons: {
      ...grandparents,
      D: p('D', 'M', { life: 'dead', fatherId: 'F1' }),
      W: p('W', 'F'),
      W0: placeholder('W0', 'F'),
      B1: p('B1', 'F', { fatherId: 'D', motherId: 'W0' }),
      B2: p('B2', 'F', { fatherId: 'D', motherId: 'W0' }),
      B3: p('B3', 'F', { fatherId: 'D', motherId: 'W0' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W', status: 'intact' }],
  }, ['B3']),
  expected: { jamiah: 216n, exactJamiah: true, saham: { W: 27n, B1: 64n, B2: 64n, U: 61n }, relations: ['tabayun'] },
};

// ─── M7: zawj, syaqiqah, umm ab, ukht li-ab → ukht li-ab wafat (setelah dinikahi zawj) ───
export const M7: MunasakhatFixture = {
  id: 'M7', menguji: "Keadaan 1 fardh saja, 'aul melebihi bagian mayit 2, ikhtishar tetap sah",
  input: munasakhat({
    deceasedId: 'D',
    persons: {
      D: p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      F1: placeholder('F1', 'M', { motherId: 'JAB' }),
      M1: placeholder('M1', 'F'),
      M2: placeholder('M2', 'F'),
      JAB: p('JAB', 'F'),
      UK: p('UK', 'F', { fatherId: 'F1', motherId: 'M1' }),
      UB: p('UB', 'F', { fatherId: 'F1', motherId: 'M2' }),
      H: p('H', 'M'),
    },
    marriages: [{ husbandId: 'H', wifeId: 'D', status: 'intact' }, { husbandId: 'H', wifeId: 'UB', status: 'intact' }],
  }, ['UB']),
  expected: {
    jamiah: 56n, exactJamiah: true, relations: ['tabayun'],
    saham: { H: 24n, UK: 24n, JAB: 8n },
    ikhtishar: { jamiah: 7n, saham: { H: 3n, UK: 3n, JAB: 1n } },
  },
};

// ─── M8: zawjah, 2 bint (bukan dari zawjah), 'amm; keempatnya wafat (Keadaan 2) ───
export const M8: MunasakhatFixture = {
  id: 'M8', menguji: "Keadaan 2: jami'ah bersama 576",
  input: munasakhat({
    deceasedId: 'D',
    persons: {
      ...grandparents,
      D: p('D', 'M', { life: 'dead', fatherId: 'F1' }),
      W: p('W', 'F', { fatherId: 'WF', motherId: 'WM' }),
      WF: p('WF', 'M'), WM: p('WM', 'F'),
      MB1: p('MB1', 'F'), MB2: p('MB2', 'F'),
      B1: p('B1', 'F', { fatherId: 'D', motherId: 'MB1' }),
      B2: p('B2', 'F', { fatherId: 'D', motherId: 'MB2' }),
      HB1: p('HB1', 'M'),
      SB1: p('SB1', 'M', { fatherId: 'HB1', motherId: 'B1' }),
      HB2: placeholder('HB2', 'M'),
      SB2: p('SB2', 'M', { fatherId: 'HB2', motherId: 'B2' }),
      UW: p('UW', 'F'),
      US: p('US', 'M', { fatherId: 'U', motherId: 'UW' }),
    },
    marriages: [
      { husbandId: 'D', wifeId: 'W', status: 'intact' },
      { husbandId: 'HB1', wifeId: 'B1', status: 'intact' },
      { husbandId: 'U', wifeId: 'UW', status: 'intact' },
    ],
  }, ['B1', 'B2', 'U', 'W']),
  expected: {
    jamiah: 576n, exactJamiah: true,
    saham: { WM: 24n, WF: 48n, MB1: 32n, HB1: 48n, SB1: 112n, MB2: 32n, SB2: 160n, UW: 15n, US: 105n },
  },
};

// ─── M9: 4 mayit berantai (kitab mencetak ibn 613; 525 + 168 = 693) ───
export const M9: MunasakhatFixture = {
  id: 'M9', menguji: '4 mayit berantai, semua tabayun',
  input: munasakhat({
    deceasedId: 'D',
    persons: {
      ...grandparents,
      D: p('D', 'M', { life: 'dead', fatherId: 'F1' }),
      W: p('W', 'F'),
      B: p('B', 'F', { fatherId: 'D', motherId: 'W' }),
      S: p('S', 'M', { fatherId: 'U', motherId: 'W' }),
      W2: p('W2', 'F'),
    },
    marriages: [
      { husbandId: 'D', wifeId: 'W', status: 'intact' },
      { husbandId: 'U', wifeId: 'W', status: 'intact' },
      { husbandId: 'U', wifeId: 'W2', status: 'intact' },
    ],
  }, ['B', 'W', 'U'], { S: 'B' }),
  expected: {
    jamiah: 768n, exactJamiah: true, relations: ['tabayun', 'tabayun', 'tabayun'],
    saham: { W2: 75n, S: 693n },
  },
};

export const MUNASAKHAT_FIXTURES = [M1, M2, M3, M4, M5, M6, M7, M8, M9];
