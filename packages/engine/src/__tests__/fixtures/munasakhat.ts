/**
 * Fixture munasakhat M1–M9 (KB bab 16) — dibuat SEBELUM implementasi logika.
 * Angka dari tabel kitab Lahim; `jamiah` = jami'ah mentah bila kitab menuliskannya.
 */

import type { GrafKeluarga, InputMunasakhat } from '../../types.js';
import { input, p } from './bab16.js';

export interface MunasakhatFixture {
  id: string;
  menguji: string;
  input: InputMunasakhat;
  expected: {
    /** Saham akhir per orang; dibandingkan sebagai pecahan saham ÷ jamiah. */
    saham: Record<string, bigint>;
    jamiah: bigint;
    /** Jami'ah mentah sama dengan kitab (bukan hanya pecahannya). */
    exactJamiah?: boolean;
    ikhtishar?: { jamiah: bigint; saham: Record<string, bigint> };
    relations?: Array<'habis' | 'tawafuq' | 'tabayun'>;
    /** Bab 12.2 kaidah pembeda. */
    keadaan: 1 | 2 | 3;
  };
}

const munasakhat = (graf: GrafKeluarga, urutanWafat: string[], lahirSetelahWafat?: Record<string, string>): InputMunasakhat => ({
  dasar: input(graf),
  urutanWafat,
  ...(lahirSetelahWafat ? { lahirSetelahWafat } : {}),
});

const placeholder = (id: string, jenisKelamin: 'L' | 'P', extra = {}) => p(id, jenisKelamin, { statusHidup: 'wafat', penghubung: true, ...extra });

// ─── M1: suami, ibu, saudara lk kandung → suami wafat (anak lk + anak pr dari istri lain) ───
export const M1: MunasakhatFixture = {
  id: 'M1', menguji: "Keadaan 3, habis (tamatsul)",
  input: munasakhat({
    idPewaris: 'D',
    orang: {
      D: p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      F1: placeholder('F1', 'L'),
      M1: p('M1', 'P'),
      AK: p('AK', 'L', { idAyah: 'F1', idIbu: 'M1' }),
      H: p('H', 'L'),
      W2: placeholder('W2', 'P'),
      S: p('S', 'L', { idAyah: 'H', idIbu: 'W2' }),
      B: p('B', 'P', { idAyah: 'H', idIbu: 'W2' }),
    },
    pernikahan: [{ idSuami: 'H', idIstri: 'D', status: 'utuh' }],
  }, ['H']),
  expected: { keadaan: 3, jamiah: 6n, exactJamiah: true, saham: { M1: 2n, AK: 1n, S: 2n, B: 1n }, relations: ['habis'] },
};

// ─── M2: istri, anak lk, anak pr → anak pr wafat (ibu + saudara lk) ───
export const M2: MunasakhatFixture = {
  id: 'M2', menguji: 'Keadaan 3, tabayun',
  input: munasakhat({
    idPewaris: 'D',
    orang: {
      D: p('D', 'L', { statusHidup: 'wafat' }),
      W: p('W', 'P'),
      S: p('S', 'L', { idAyah: 'D', idIbu: 'W' }),
      B: p('B', 'P', { idAyah: 'D', idIbu: 'W' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W', status: 'utuh' }],
  }, ['B']),
  expected: { keadaan: 3, jamiah: 72n, exactJamiah: true, saham: { W: 16n, S: 56n }, relations: ['tabayun'] },
};

// ─── M3: 6 akh syaqiq + ibu; 3 akh wafat berturut, lalu ibu → sisa 3 akh ───
export const M3: MunasakhatFixture = {
  id: 'M3', menguji: 'Keadaan 1: beberapa kematian beruntun, bagi rata ke penyintas',
  input: munasakhat({
    idPewaris: 'D',
    orang: {
      D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      F1: placeholder('F1', 'L'),
      M1: p('M1', 'P'),
      ...Object.fromEntries(['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map(id => [id, p(id, 'L', { idAyah: 'F1', idIbu: 'M1' })])),
    },
    pernikahan: [],
  }, ['A1', 'A2', 'A3', 'M1']),
  expected: { keadaan: 1,
    jamiah: 3n, saham: { A4: 1n, A5: 1n, A6: 1n },
    ikhtishar: { jamiah: 3n, saham: { A4: 1n, A5: 1n, A6: 1n } },
  },
};

// ─── M4: 3 akh syaqiq; 2 wafat berturut, masing-masing meninggalkan zawjah + bint ───
export const M4: MunasakhatFixture = {
  id: 'M4', menguji: 'Keadaan 3 bertahap: 3 → 48 → 384',
  input: munasakhat({
    idPewaris: 'D',
    orang: {
      D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      F1: placeholder('F1', 'L'),
      M1: placeholder('M1', 'P'),
      A: p('A', 'L', { idAyah: 'F1', idIbu: 'M1' }),
      B: p('B', 'L', { idAyah: 'F1', idIbu: 'M1' }),
      C: p('C', 'L', { idAyah: 'F1', idIbu: 'M1' }),
      WA: p('WA', 'P'), DA: p('DA', 'P', { idAyah: 'A', idIbu: 'WA' }),
      WB: p('WB', 'P'), DB: p('DB', 'P', { idAyah: 'B', idIbu: 'WB' }),
    },
    pernikahan: [{ idSuami: 'A', idIstri: 'WA', status: 'utuh' }, { idSuami: 'B', idIstri: 'WB', status: 'utuh' }],
  }, ['A', 'B']),
  expected: { keadaan: 3,
    jamiah: 384n, exactJamiah: true, relations: ['tabayun', 'tabayun'],
    saham: { C: 209n, WA: 16n, DA: 64n, WB: 19n, DB: 76n },
  },
};

// ─── M5/M6: zawjah, bint, 'amm; salah satu bint wafat ───
// 'amm mayit 1 = 'amm al-ab bagi bint (tabel kitab: «عم أب»).
const grandparents = {
  GF: placeholder('GF', 'L'),
  GM: placeholder('GM', 'P'),
  F1: placeholder('F1', 'L', { idAyah: 'GF', idIbu: 'GM' }),
  U: p('U', 'L', { idAyah: 'GF', idIbu: 'GM' }),
};

export const M5: MunasakhatFixture = {
  id: 'M5', menguji: "Keadaan 3, tawafuq; umm 1/3 karena hanya 1 saudari",
  input: munasakhat({
    idPewaris: 'D',
    orang: {
      ...grandparents,
      D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1' }),
      W: p('W', 'P'),
      B1: p('B1', 'P', { idAyah: 'D', idIbu: 'W' }),
      B2: p('B2', 'P', { idAyah: 'D', idIbu: 'W' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W', status: 'utuh' }],
  }, ['B2']),
  expected: { keadaan: 3, jamiah: 72n, exactJamiah: true, saham: { W: 17n, B1: 36n, U: 19n }, relations: ['tawafuq'] },
};

export const M6: MunasakhatFixture = {
  id: 'M6', menguji: 'Keadaan 3, tabayun; zawjah bukan ibu para bint',
  input: munasakhat({
    idPewaris: 'D',
    orang: {
      ...grandparents,
      D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1' }),
      W: p('W', 'P'),
      W0: placeholder('W0', 'P'),
      B1: p('B1', 'P', { idAyah: 'D', idIbu: 'W0' }),
      B2: p('B2', 'P', { idAyah: 'D', idIbu: 'W0' }),
      B3: p('B3', 'P', { idAyah: 'D', idIbu: 'W0' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W', status: 'utuh' }],
  }, ['B3']),
  expected: { keadaan: 3, jamiah: 216n, exactJamiah: true, saham: { W: 27n, B1: 64n, B2: 64n, U: 61n }, relations: ['tabayun'] },
};

// ─── M7: zawj, syaqiqah, umm ab, ukht li-ab → ukht li-ab wafat (setelah dinikahi zawj) ───
export const M7: MunasakhatFixture = {
  id: 'M7', menguji: "Keadaan 1 fardh saja, 'aul melebihi bagian mayit 2, ikhtishar tetap sah",
  input: munasakhat({
    idPewaris: 'D',
    orang: {
      D: p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      F1: placeholder('F1', 'L', { idIbu: 'JAB' }),
      M1: placeholder('M1', 'P'),
      M2: placeholder('M2', 'P'),
      JAB: p('JAB', 'P'),
      UK: p('UK', 'P', { idAyah: 'F1', idIbu: 'M1' }),
      UB: p('UB', 'P', { idAyah: 'F1', idIbu: 'M2' }),
      H: p('H', 'L'),
    },
    pernikahan: [{ idSuami: 'H', idIstri: 'D', status: 'utuh' }, { idSuami: 'H', idIstri: 'UB', status: 'utuh' }],
  }, ['UB']),
  expected: { keadaan: 1,
    jamiah: 56n, exactJamiah: true, relations: ['tabayun'],
    saham: { H: 24n, UK: 24n, JAB: 8n },
    ikhtishar: { jamiah: 7n, saham: { H: 3n, UK: 3n, JAB: 1n } },
  },
};

// ─── M8: zawjah, 2 bint (bukan dari zawjah), 'amm; keempatnya wafat (Keadaan 2) ───
export const M8: MunasakhatFixture = {
  id: 'M8', menguji: "Keadaan 2: jami'ah bersama 576",
  input: munasakhat({
    idPewaris: 'D',
    orang: {
      ...grandparents,
      D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1' }),
      W: p('W', 'P', { idAyah: 'WF', idIbu: 'WM' }),
      WF: p('WF', 'L'), WM: p('WM', 'P'),
      MB1: p('MB1', 'P'), MB2: p('MB2', 'P'),
      B1: p('B1', 'P', { idAyah: 'D', idIbu: 'MB1' }),
      B2: p('B2', 'P', { idAyah: 'D', idIbu: 'MB2' }),
      HB1: p('HB1', 'L'),
      SB1: p('SB1', 'L', { idAyah: 'HB1', idIbu: 'B1' }),
      HB2: placeholder('HB2', 'L'),
      SB2: p('SB2', 'L', { idAyah: 'HB2', idIbu: 'B2' }),
      UW: p('UW', 'P'),
      US: p('US', 'L', { idAyah: 'U', idIbu: 'UW' }),
    },
    pernikahan: [
      { idSuami: 'D', idIstri: 'W', status: 'utuh' },
      { idSuami: 'HB1', idIstri: 'B1', status: 'utuh' },
      { idSuami: 'U', idIstri: 'UW', status: 'utuh' },
    ],
  }, ['B1', 'B2', 'U', 'W']),
  expected: { keadaan: 2,
    jamiah: 576n, exactJamiah: true,
    saham: { WM: 24n, WF: 48n, MB1: 32n, HB1: 48n, SB1: 112n, MB2: 32n, SB2: 160n, UW: 15n, US: 105n },
  },
};

// ─── M9: 4 mayit berantai (kitab mencetak ibn 613; 525 + 168 = 693) ───
export const M9: MunasakhatFixture = {
  id: 'M9', menguji: '4 mayit berantai, semua tabayun',
  input: munasakhat({
    idPewaris: 'D',
    orang: {
      ...grandparents,
      D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1' }),
      W: p('W', 'P'),
      B: p('B', 'P', { idAyah: 'D', idIbu: 'W' }),
      S: p('S', 'L', { idAyah: 'U', idIbu: 'W' }),
      W2: p('W2', 'P'),
    },
    pernikahan: [
      { idSuami: 'D', idIstri: 'W', status: 'utuh' },
      { idSuami: 'U', idIstri: 'W', status: 'utuh' },
      { idSuami: 'U', idIstri: 'W2', status: 'utuh' },
    ],
  }, ['B', 'W', 'U'], { S: 'B' }),
  expected: { keadaan: 3,
    jamiah: 768n, exactJamiah: true, relations: ['tabayun', 'tabayun', 'tabayun'],
    saham: { W2: 75n, S: 693n },
  },
};

export const MUNASAKHAT_FIXTURES = [M1, M2, M3, M4, M5, M6, M7, M8, M9];
