/**
 * Fixture taqdir bab 13 (haml 13a.7, mafqud 13b.6, khuntsa 13c.4) — dibuat SEBELUM implementasi logika.
 * Angka dari kitab Lahim; baris [SYF] haml = turunan 13a.4 (kelas D). `diberikan` hanya yang > 0.
 */

import type { GrafKeluarga, InputEngine, Orang, Ruleset } from '../../types.js';
import { input, p } from './bab16.js';

export interface TaqdirFixture {
  id: string;
  menguji: string;
  input: InputEngine;
  expected: { jamiah: bigint; diberikan: Record<string, bigint>; mauquf: bigint };
}

const dengan = (graf: GrafKeluarga, ruleset: Ruleset = 'syafii'): InputEngine => ({ ...input(graf), ruleset });
const wafat = (id: string, jenisKelamin: 'L' | 'P', extra: Partial<Orang> = {}) => p(id, jenisKelamin, { statusHidup: 'wafat', ...extra });
const khuntsa = (id: string, extra: Partial<Orang> = {}, keadaan: Orang['khuntsa'] = 'diharapkanJelas') => p(id, 'L', { khuntsa: keadaan, ...extra });

// ─── Haml (13a.7) ─────────────────────────────────────────────────────────────

// H1: ibu hamil dari ayah mayit, saudara lk kandung.
const grafH1: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: wafat('D', 'L', { idAyah: 'A', idIbu: 'I' }),
    A: wafat('A', 'L'), I: p('I', 'P'),
    S: p('S', 'L', { idAyah: 'A', idIbu: 'I' }),
    J: p('J', 'L', { idAyah: 'A', idIbu: 'I', statusHidup: 'dalamKandungan' }),
  },
  pernikahan: [{ idSuami: 'A', idIstri: 'I', status: 'utuh' }],
};

// H2: suami, ibu, 2 saudara seibu, haml istri ayah.
const grafH2: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: wafat('D', 'P', { idAyah: 'A', idIbu: 'I' }),
    H: p('H', 'L'), A: wafat('A', 'L'), I: p('I', 'P'), W: p('W', 'P'), Y: wafat('Y', 'L'),
    U1: p('U1', 'L', { idAyah: 'Y', idIbu: 'I' }), U2: p('U2', 'L', { idAyah: 'Y', idIbu: 'I' }),
    J: p('J', 'L', { idAyah: 'A', idIbu: 'W', statusHidup: 'dalamKandungan' }),
  },
  pernikahan: [{ idSuami: 'H', idIstri: 'D', status: 'utuh' }],
};

// H3: ibu hamil dari ayah mayit, saudara seibu.
const grafH3: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: wafat('D', 'L', { idAyah: 'A', idIbu: 'I' }),
    A: wafat('A', 'L'), I: p('I', 'P'), Y: wafat('Y', 'L'),
    U: p('U', 'L', { idAyah: 'Y', idIbu: 'I' }),
    J: p('J', 'L', { idAyah: 'A', idIbu: 'I', statusHidup: 'dalamKandungan' }),
  },
  pernikahan: [],
};

// ─── Mafqud (13b.6) ───────────────────────────────────────────────────────────

// F1: ibu, saudara lk sebapak hadir, saudara lk sebapak mafqud.
const grafF1: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: wafat('D', 'L', { idAyah: 'A', idIbu: 'I' }),
    A: wafat('A', 'L'), I: p('I', 'P'), W: wafat('W', 'P'),
    S: p('S', 'L', { idAyah: 'A', idIbu: 'W' }),
    Q: p('Q', 'L', { idAyah: 'A', idIbu: 'W', statusHidup: 'mafqud' }),
  },
  pernikahan: [],
};

// F2: ibu, ayah, saudara lk kandung, saudara lk sebapak mafqud.
const grafF2: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: wafat('D', 'L', { idAyah: 'A', idIbu: 'I' }),
    A: p('A', 'L'), I: p('I', 'P'), W: wafat('W', 'P'),
    S: p('S', 'L', { idAyah: 'A', idIbu: 'I' }),
    Q: p('Q', 'L', { idAyah: 'A', idIbu: 'W', statusHidup: 'mafqud' }),
  },
  pernikahan: [{ idSuami: 'A', idIstri: 'I', status: 'utuh' }],
};

// F3: suami, ibu, saudara seibu, saudari kandung, saudara lk kandung mafqud.
const grafF3: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: wafat('D', 'P', { idAyah: 'A', idIbu: 'I' }),
    H: p('H', 'L'), A: wafat('A', 'L'), I: p('I', 'P'), Y: wafat('Y', 'L'),
    U: p('U', 'L', { idAyah: 'Y', idIbu: 'I' }),
    K: p('K', 'P', { idAyah: 'A', idIbu: 'I' }),
    Q: p('Q', 'L', { idAyah: 'A', idIbu: 'I', statusHidup: 'mafqud' }),
  },
  pernikahan: [{ idSuami: 'H', idIstri: 'D', status: 'utuh' }],
};

// ─── Khuntsa (13c.4) ──────────────────────────────────────────────────────────

/** Pewaris D dengan ayah A (wafat kecuali disebut), ibu I, istri ayah W, ayah seibu Y. */
const keluarga = (jenisKelaminPewaris: 'L' | 'P', lain: Record<string, Orang>, ayahHidup = false): GrafKeluarga => ({
  idPewaris: 'D',
  orang: {
    D: wafat('D', jenisKelaminPewaris, { idAyah: 'A', idIbu: 'I' }),
    A: ayahHidup ? p('A', 'L') : wafat('A', 'L'), I: wafat('I', 'P'), W: wafat('W', 'P'), Y: wafat('Y', 'L'),
    ...lain,
  },
  pernikahan: [],
});
const ibuHidup = { I: p('I', 'P') };
const suami = (graf: GrafKeluarga): GrafKeluarga => ({ ...graf, orang: { ...graf.orang, H: p('H', 'L') }, pernikahan: [{ idSuami: 'H', idIstri: 'D', status: 'utuh' }] });

const grafX1 = keluarga('L', {
  B1: p('B1', 'P', { idAyah: 'D' }), B2: p('B2', 'P', { idAyah: 'D' }),
  S: wafat('S', 'L', { idAyah: 'D' }), K: khuntsa('K', { idAyah: 'S' }),
}, true);
const grafX2 = suami(keluarga('P', { T: p('T', 'P', { idAyah: 'A', idIbu: 'I' }), K: khuntsa('K', { idAyah: 'A', idIbu: 'W' }) }));
const grafX3 = keluarga('L', {
  ...ibuHidup, U: p('U', 'L', { idAyah: 'Y', idIbu: 'I' }), T: p('T', 'P', { idAyah: 'A', idIbu: 'I' }), K: khuntsa('K', { idAyah: 'A', idIbu: 'W' }),
});
const grafX4 = keluarga('L', {
  ...ibuHidup, U: p('U', 'L', { idAyah: 'Y', idIbu: 'I' }), K: khuntsa('K', { idAyah: 'A', idIbu: 'I' }), T: p('T', 'P', { idAyah: 'A', idIbu: 'I' }),
});
const grafX5 = suami(keluarga('P', { ...ibuHidup, K: khuntsa('K', { idAyah: 'A', idIbu: 'I' }) }));
const grafX5b = suami(keluarga('P', {
  ...ibuHidup, U: p('U', 'L', { idAyah: 'Y', idIbu: 'I' }), K: khuntsa('K', { idAyah: 'A', idIbu: 'W' }, 'tidakDiharapkanJelas'),
}));
const grafX6: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: wafat('D', 'L'), Z: p('Z', 'P'),
    B: p('B', 'P', { idAyah: 'D', idIbu: 'Z' }), K: khuntsa('K', { idAyah: 'D', idIbu: 'Z' }, 'tidakDiharapkanJelas'),
    S: wafat('S', 'L', { idAyah: 'D', idIbu: 'Z' }), C: p('C', 'L', { idAyah: 'S' }),
  },
  pernikahan: [{ idSuami: 'D', idIstri: 'Z', status: 'utuh' }],
};
const grafX7: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: wafat('D', 'L'), Z: p('Z', 'P'),
    S: p('S', 'L', { idAyah: 'D', idIbu: 'Z' }),
    K1: khuntsa('K1', { idAyah: 'D', idIbu: 'Z' }), K2: khuntsa('K2', { idAyah: 'D', idIbu: 'Z' }),
  },
  pernikahan: [{ idSuami: 'D', idIstri: 'Z', status: 'utuh' }],
};
const grafX8 = keluarga('L', {
  ...ibuHidup, S: p('S', 'L', { idAyah: 'A', idIbu: 'I' }),
  K1: khuntsa('K1', { idAyah: 'A', idIbu: 'I' }, 'tidakDiharapkanJelas'), K2: khuntsa('K2', { idAyah: 'A', idIbu: 'I' }, 'tidakDiharapkanJelas'),
});

export const TAQDIR_FIXTURES: TaqdirFixture[] = [
  { id: 'H1-HNB', menguji: 'haml 6 taqdir, mitra ashabah diberi aqall', input: dengan(grafH1, 'hanbali'),
    expected: { jamiah: 72n, diberikan: { I: 12n, S: 20n }, mauquf: 40n } },
  { id: 'H1-SYF', menguji: '[R13-15] mitra ashabah haml diberi 0 (kelas D)', input: dengan(grafH1),
    expected: { jamiah: 72n, diberikan: { I: 12n }, mauquf: 60n } },
  { id: 'H2', menguji: "haml, 'aul terbesar pada taqdir 2 pr", input: dengan(grafH2),
    expected: { jamiah: 90n, diberikan: { H: 27n, I: 9n, U1: 9n, U2: 9n }, mauquf: 36n } },
  { id: 'H2-HNB', menguji: 'haml ber-fardh saja: [HNB] = [SYF]', input: dengan(grafH2, 'hanbali'),
    expected: { jamiah: 90n, diberikan: { H: 27n, I: 9n, U1: 9n, U2: 9n }, mauquf: 36n } },
  { id: 'H3', menguji: 'haml, radd pada taqdir mati', input: dengan(grafH3),
    expected: { jamiah: 30n, diberikan: { I: 5n, U: 5n }, mauquf: 20n } },
  { id: 'F1', menguji: 'mafqud, saudara hadir diberi aqall', input: dengan(grafF1),
    expected: { jamiah: 12n, diberikan: { I: 2n, S: 5n }, mauquf: 5n } },
  { id: 'F2', menguji: 'mafqud terhijab di semua taqdir, mauquf bergantian ayah/ibu', input: dengan(grafF2),
    expected: { jamiah: 6n, diberikan: { I: 1n, A: 4n }, mauquf: 1n } },
  { id: 'F3', menguji: "mafqud dengan 'aul", input: dengan(grafF3),
    expected: { jamiah: 72n, diberikan: { H: 27n, I: 9n, U: 9n, K: 4n }, mauquf: 23n } },
  { id: 'X1', menguji: 'khuntsa gugur sebagai pr', input: dengan(grafX1),
    expected: { jamiah: 6n, diberikan: { A: 1n, B1: 2n, B2: 2n }, mauquf: 1n } },
  { id: 'X2', menguji: "khuntsa 0 sebagai lk, 'aul sebagai pr", input: dengan(grafX2),
    expected: { jamiah: 14n, diberikan: { H: 6n, T: 6n }, mauquf: 2n } },
  { id: 'X3', menguji: 'khuntsa sama di dua taqdir → tanpa mauquf', input: dengan(grafX3),
    expected: { jamiah: 6n, diberikan: { I: 1n, U: 1n, T: 3n, K: 1n }, mauquf: 0n } },
  { id: 'X4', menguji: 'khuntsa kandung bersama saudari kandung', input: dengan(grafX4),
    expected: { jamiah: 18n, diberikan: { I: 3n, U: 3n, K: 6n, T: 4n }, mauquf: 2n } },
  { id: 'X5', menguji: "khuntsa kandung, 'aul sebagai pr", input: dengan(grafX5),
    expected: { jamiah: 24n, diberikan: { H: 9n, I: 6n, K: 4n }, mauquf: 5n } },
  { id: 'X5b-HNB', menguji: '[HNB] tidak diharapkan jelas: setengah-setengah', input: dengan(grafX5b, 'hanbali'),
    expected: { jamiah: 48n, diberikan: { H: 21n, I: 7n, U: 7n, K: 13n }, mauquf: 0n } },
  { id: 'X5b-MLK', menguji: '[MLK] setengah-setengah', input: dengan(grafX5b, 'maliki'),
    expected: { jamiah: 48n, diberikan: { H: 21n, I: 7n, U: 7n, K: 13n }, mauquf: 0n } },
  { id: 'X6', menguji: '[MLK] setengah-setengah, cucu lk gugur di satu taqdir', input: dengan(grafX6, 'maliki'),
    expected: { jamiah: 48n, diberikan: { Z: 6n, B: 15n, K: 22n, C: 5n }, mauquf: 0n } },
  { id: 'X7', menguji: 'dua khuntsa, 4 taqdir', input: dengan(grafX7),
    expected: { jamiah: 480n, diberikan: { Z: 60n, S: 140n, K1: 84n, K2: 84n }, mauquf: 112n } },
  { id: 'X8', menguji: '[HNB] dua khuntsa tidak diharapkan jelas: jami\'ah × 4', input: dengan(grafX8, 'hanbali'),
    expected: { jamiah: 288n, diberikan: { I: 48n, S: 98n, K1: 71n, K2: 71n }, mauquf: 0n } },
  // Turunan K13c-1 [HNF] (bukan angka kitab): taqdir lk memberi khuntsa 0 → hanya taqdir itu dihitung.
  { id: 'X2-HNF', menguji: '[HNF] paling merugikan khuntsa, satu mas\'alah', input: dengan(grafX2, 'hanafi'),
    expected: { jamiah: 2n, diberikan: { H: 1n, T: 1n }, mauquf: 0n } },
];

export const GRAF = { grafH1, grafH3, grafF1, grafX2, grafX5, grafX5b, grafX7 };
