/**
 * Fixture regression bab 16 — dibuat SEBELUM implementasi logika.
 * Format: input graf + expected output kunci per kasus.
 * Setiap kasus menguji invariant spesifik; lihat kolom "Menguji" di tabel KB bab 16.
 */

import type { EngineInput, FamilyGraph, MadhhabConfig, Person } from '../../types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const KB_VERSION = '1.0.0-dev';
const DEFAULT_CONFIG: MadhhabConfig = { residuePolicy: 'radd', talakBainInMaradh: 'qaulJadid' };

/** Buat Person minimal (default: alive, islam, no parents). */
export function p(id: string, sex: 'M' | 'F', overrides: Partial<Person> = {}): Person {
  return { id, sex, life: 'alive', religion: 'islam', ...overrides };
}

/** Buat input engine dengan tirkah default 0 (kasus tanpa nominal). */
export function input(graph: FamilyGraph, config: MadhhabConfig = DEFAULT_CONFIG): EngineInput {
  return { graph, tirkah: { gross: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, rounding: { unit: 1n }, config, ruleset: 'syafii', kbVersion: KB_VERSION };
}

// ─── Tipe fixture ─────────────────────────────────────────────────────────────

export interface ExpectedTable {
  /** ashlulMasalah setelah 'aul/radd/tashih. */
  finalAshl: bigint;
  /** Saham per personId. */
  saham: Record<string, bigint>;
  /** personId yang terhijab atau mamnuu' (tidak dapat bagian). */
  excluded?: string[];
}

export interface Fixture {
  id: string;
  /** Label singkat dari kolom "Menguji" di KB bab 16. */
  menguji: string;
  input: EngineInput;
  expected:
    | { status: 'OK'; table: ExpectedTable; traceKinds?: string[] }
    | { status: 'NEEDS_INPUT'; questionFields: string[] }
    | { status: 'UNSUPPORTED' };
}

// ═════════════════════════════════════════════════════════════════════════════
// KASUS BAB 16
// ═════════════════════════════════════════════════════════════════════════════

// ─── Case 1: Istri, anak lk, anak pr ─────────────────────────────────────────
// Ashl 8 → 24; Istri 3, anak lk 14, anak pr 7
// Menguji: Ashabah bil ghair + tashih tabayun [R10-2]
export const case01: Fixture = {
  id: 'C16-01',
  menguji: 'Ashabah bil ghair + tashih tabayun',
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead' }),
      W1: p('W1', 'F'),
      S1: p('S1', 'M', { fatherId: 'D', motherId: 'W1' }),
      D1: p('D1', 'F', { fatherId: 'D', motherId: 'W1' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    table: { finalAshl: 24n, saham: { W1: 3n, S1: 14n, D1: 7n } },
    traceKinds: ['TASHIH', 'NISAB_COMPARE'],
  },
};

// ─── Case 2: Suami, ayah, ibu ─────────────────────────────────────────────────
// Ashl 6; Suami 3, ibu 1, ayah 2
// Menguji: 'Umariyyah (suami + 2 orang tua) [R07-1]
export const case02: Fixture = {
  id: 'C16-02',
  menguji: "'Umariyyah (suami + 2 orang tua)",
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      H1: p('H1', 'M'),
      F1: p('F1', 'M'),
      M1: p('M1', 'F'),
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    table: { finalAshl: 6n, saham: { H1: 3n, M1: 1n, F1: 2n } },
    traceKinds: ['SPECIAL_CASE'],
  },
};

// ─── Case 3: Istri, ayah, ibu ─────────────────────────────────────────────────
// Ashl 4; Istri 1, ibu 1, ayah 2
// Menguji: 'Umariyyah (istri + 2 orang tua) [R07-1]
export const case03: Fixture = {
  id: 'C16-03',
  menguji: "'Umariyyah (istri + 2 orang tua)",
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      W1: p('W1', 'F'),
      F1: p('F1', 'M'),
      M1: p('M1', 'F'),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    table: { finalAshl: 4n, saham: { W1: 1n, M1: 1n, F1: 2n } },
    traceKinds: ['SPECIAL_CASE'],
  },
};

// ─── Case 4: Suami, kakek, ibu ────────────────────────────────────────────────
// Ashl 6; Suami 3, ibu 2, kakek 1
// Menguji: Kakek ≠ ayah dalam 'Umariyyah [R07-1] — 'Umariyyah tidak berlaku
export const case04: Fixture = {
  id: 'C16-04',
  menguji: "Kakek ≠ ayah dalam 'Umariyyah",
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      H1:  p('H1', 'M'),
      // F1: ayah D sudah wafat, penghubung ke kakek
      F1:  p('F1', 'M', { life: 'dead', fatherId: 'GF1', isPlaceholder: true }),
      GF1: p('GF1', 'M'),  // kakek (JADD)
      M1:  p('M1', 'F'),
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // Suami 1/2=3, ibu 1/3=2 (tanpa 'Umariyyah), kakek ashabah=1
    table: { finalAshl: 6n, saham: { H1: 3n, M1: 2n, GF1: 1n } },
  },
};

// ─── Case 5: Suami, 2 saudari kandung — 'Aul ─────────────────────────────────
// Ashl 6 → 7; Suami 3, saudari kandung 4 (2+2)
// Menguji: 'Aul ke-7 [R16-1] [R09-4]
export const case05: Fixture = {
  id: 'C16-05',
  menguji: "'Aul 6→7",
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      H1:  p('H1', 'M'),
      F1:  p('F1', 'M', { life: 'dead', isPlaceholder: true }),
      M1:  p('M1', 'F', { life: 'dead', isPlaceholder: true }),
      UK1: p('UK1', 'F', { fatherId: 'F1', motherId: 'M1' }),
      UK2: p('UK2', 'F', { fatherId: 'F1', motherId: 'M1' }),
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    table: { finalAshl: 7n, saham: { H1: 3n, UK1: 2n, UK2: 2n } },
    traceKinds: ['AUL', 'MASALAH_CLASS'],
  },
};

// ─── Case 6: Minbariyyah ──────────────────────────────────────────────────────
// Istri, ayah, ibu, 2 anak pr; Ashl 24 → 27
// Menguji: 'Aul ke-27 / Minbariyyah [R16-1]
export const case06: Fixture = {
  id: 'C16-06',
  menguji: "'Aul 24→27 / Minbariyyah",
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      W1: p('W1', 'F'),
      F1: p('F1', 'M'),
      M1: p('M1', 'F'),
      D1: p('D1', 'F', { fatherId: 'D', motherId: 'W1' }),
      D2: p('D2', 'F', { fatherId: 'D', motherId: 'W1' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    table: { finalAshl: 27n, saham: { W1: 3n, F1: 4n, M1: 4n, D1: 8n, D2: 8n } },
    traceKinds: ['AUL'],
  },
};

// ─── Case 7: Syuraihiyyah — 'Aul maksimal ────────────────────────────────────
// Suami, ibu, 2 saudari seibu, 2 saudari kandung; Ashl 6 → 10
// Menguji: 'Aul ke-10 (maksimal) [R16-1] [R09-4]
export const case07: Fixture = {
  id: 'C16-07',
  menguji: "'Aul 6→10 / Syuraihiyyah",
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      H1:  p('H1', 'M'),
      F1:  p('F1', 'M', { life: 'dead', isPlaceholder: true }),
      M1:  p('M1', 'F'),
      // Saudari kandung: share F1 dan M1 dengan D
      UK1: p('UK1', 'F', { fatherId: 'F1', motherId: 'M1' }),
      UK2: p('UK2', 'F', { fatherId: 'F1', motherId: 'M1' }),
      // Saudari seibu: share M1 saja (ayah berbeda)
      UF1: p('UF1', 'M', { life: 'dead', isPlaceholder: true }), // ayah saudari seibu
      UM1: p('UM1', 'F', { fatherId: 'UF1', motherId: 'M1' }),
      UM2: p('UM2', 'F', { fatherId: 'UF1', motherId: 'M1' }),
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    table: { finalAshl: 10n, saham: { H1: 3n, M1: 1n, UM1: 1n, UM2: 1n, UK1: 2n, UK2: 2n } },
    traceKinds: ['AUL'],
  },
};

// ─── Case 8: Takmilah + ma'al ghair ──────────────────────────────────────────
// Anak pr, cucu pr (dari anak lk), saudari kandung; Ashl 6
// Menguji: Takmilah ats-tsulutsain + ashabah ma'al ghair [R08-3] [R05-4]
export const case08: Fixture = {
  id: 'C16-08',
  menguji: 'Takmilah + ma\'al ghair',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'M', { life: 'dead', fatherId: 'GF1', motherId: 'GM1' }),
      // Anak pr
      D1:  p('D1', 'F', { fatherId: 'D' }),
      // Anak lk (wafat) — penghubung ke cucu pr
      S1:  p('S1', 'M', { fatherId: 'D', life: 'dead', isPlaceholder: true }),
      GD1: p('GD1', 'F', { fatherId: 'S1' }),  // cucu pr dari anak lk
      // Saudari kandung (share orang tua dengan D)
      GF1: p('GF1', 'M', { life: 'dead', isPlaceholder: true }),
      GM1: p('GM1', 'F', { life: 'dead', isPlaceholder: true }),
      UK1: p('UK1', 'F', { fatherId: 'GF1', motherId: 'GM1' }),
    },
    marriages: [],
  }),
  expected: {
    status: 'OK',
    // Anak pr 1/2=3, cucu pr takmilah 1/6=1, saudari kandung ma'al ghair=2
    table: { finalAshl: 6n, saham: { D1: 3n, GD1: 1n, UK1: 2n } },
    traceKinds: ['ASHABAH', 'FARDH'],
  },
};

// ─── Case 9: Radd tanpa pasangan ─────────────────────────────────────────────
// Anak pr, ibu; Ashl 6 → radd 4
// Menguji: raddA [R09-4]
export const case09: Fixture = {
  id: 'C16-09',
  menguji: 'Radd tanpa pasangan (raddA)',
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead', motherId: 'M1' }),
      D1: p('D1', 'F', { fatherId: 'D' }),
      M1: p('M1', 'F'),
    },
    marriages: [],
  }),
  expected: {
    status: 'OK',
    // Anak pr 3/4, ibu 1/4 setelah radd; ashl final=4
    table: { finalAshl: 4n, saham: { D1: 3n, M1: 1n } },
    traceKinds: ['MASALAH_CLASS', 'NISAB_COMPARE'],
  },
};

// ─── Case 10: Radd dengan pasangan — tabayun ──────────────────────────────────
// Suami, anak pr, cucu pr; 4 × 4 = 16
// Menguji: raddB tabayun [R09-4] — contoh di engine-contract.md
export const case10: Fixture = {
  id: 'C16-10',
  menguji: 'Radd dengan pasangan — tabayun (raddB)',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'F', { life: 'dead' }),
      H1:  p('H1', 'M'),
      D1:  p('D1', 'F', { fatherId: 'H1', motherId: 'D' }),
      // Anak lk wafat — penghubung ke cucu pr
      S1:  p('S1', 'M', { fatherId: 'H1', motherId: 'D', life: 'dead', isPlaceholder: true }),
      GD1: p('GD1', 'F', { fatherId: 'S1' }),
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    table: { finalAshl: 16n, saham: { H1: 4n, D1: 9n, GD1: 3n } },
    traceKinds: ['MASALAH_CLASS', 'NISAB_COMPARE'],
  },
};

// ─── Case 11: Radd dengan pasangan — habis ────────────────────────────────────
// Istri, ibu, 2 saudara seibu; Ashl 4
// Menguji: raddB tamatsul (habis) [R09-4]
export const case11: Fixture = {
  id: 'C16-11',
  menguji: 'Radd dengan pasangan — habis (raddB tamatsul)',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'M', { life: 'dead', motherId: 'M1' }),
      W1:  p('W1', 'F'),
      M1:  p('M1', 'F'),
      // Saudara seibu: share M1 saja
      UF1: p('UF1', 'M', { life: 'dead', isPlaceholder: true }),
      US1: p('US1', 'M', { fatherId: 'UF1', motherId: 'M1' }),
      US2: p('US2', 'M', { fatherId: 'UF1', motherId: 'M1' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    table: { finalAshl: 4n, saham: { W1: 1n, M1: 1n, US1: 1n, US2: 1n } },
    traceKinds: ['MASALAH_CLASS'],
  },
};

// ─── Case 12: Akdariyyah ──────────────────────────────────────────────────────
// Suami, ibu, kakek, 1 saudari kandung; Ashl 6 → 9 → 27
// Menguji: kasus Akdariyyah [R16-2] [R08-5]
export const case12: Fixture = {
  id: 'C16-12',
  menguji: 'Akdariyyah',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      H1:  p('H1', 'M'),
      F1:  p('F1', 'M', { life: 'dead', fatherId: 'GF1', isPlaceholder: true }),
      GF1: p('GF1', 'M'),  // kakek
      M1:  p('M1', 'F'),
      UK1: p('UK1', 'F', { fatherId: 'F1', motherId: 'M1' }),  // saudari kandung
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // [R16-2]: suami 9, ibu 6, saudari 4, kakek 8 (dari ashl 27)
    table: { finalAshl: 27n, saham: { H1: 9n, M1: 6n, UK1: 4n, GF1: 8n } },
    traceKinds: ['SPECIAL_CASE'],
  },
};

// ─── Case 13: Musyarrakah (tasyrik, default [SYF]) ───────────────────────────
// Suami, ibu, 2 saudara seibu, 1 saudara lk kandung; Ashl 6 → 18
// Menguji: Musyarrakah — tasyrik default [R07-2] [R16-4]
export const case13: Fixture = {
  id: 'C16-13',
  menguji: 'Musyarrakah (tasyrik default)',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      H1:  p('H1', 'M'),
      F1:  p('F1', 'M', { life: 'dead', isPlaceholder: true }),
      M1:  p('M1', 'F'),
      // Saudara seibu (2)
      UF1: p('UF1', 'M', { life: 'dead', isPlaceholder: true }),
      US1: p('US1', 'M', { fatherId: 'UF1', motherId: 'M1' }),
      US2: p('US2', 'M', { fatherId: 'UF1', motherId: 'M1' }),
      // Saudara kandung (1): share F1 dan M1
      AK1: p('AK1', 'M', { fatherId: 'F1', motherId: 'M1' }),
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // Ashl 6→18; suami 9, ibu 3, tiap saudara (3 orang) 2
    table: { finalAshl: 18n, saham: { H1: 9n, M1: 3n, US1: 2n, US2: 2n, AK1: 2n } },
    traceKinds: ['SPECIAL_CASE', 'TASHIH'],
  },
};

// ─── Case 14: Jadd wal ikhwah — jumhur ───────────────────────────────────────
// Istri, kakek, 3 saudara lk kandung; Ashl 4 → 12
// Menguji: Jadd wal ikhwah — kakek muqasamah [R08-2]
export const case14: Fixture = {
  id: 'C16-14',
  menguji: 'Jadd wal ikhwah — muqasamah jumhur',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      W1:  p('W1', 'F'),
      F1:  p('F1', 'M', { life: 'dead', fatherId: 'GF1', isPlaceholder: true }),
      GF1: p('GF1', 'M'),  // kakek
      M1:  p('M1', 'F', { life: 'dead', isPlaceholder: true }),
      AK1: p('AK1', 'M', { fatherId: 'F1', motherId: 'M1' }),
      AK2: p('AK2', 'M', { fatherId: 'F1', motherId: 'M1' }),
      AK3: p('AK3', 'M', { fatherId: 'F1', motherId: 'M1' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // Istri 1/4=3, kakek 1/3 sisa = 3, 3 saudara = 6 (2 each); ashl 12
    table: { finalAshl: 12n, saham: { W1: 3n, GF1: 3n, AK1: 2n, AK2: 2n, AK3: 2n } },
    traceKinds: ['NISAB_COMPARE'],
  },
};

// ─── Case 15: Hajb nuqshan ibu ────────────────────────────────────────────────
// Ayah, ibu, 2 saudara lk kandung; Ashl 6
// Menguji: Saudara mahjub oleh ayah TETAPI tetap menghajb ibu ke 1/6 [R06-5]
export const case15: Fixture = {
  id: 'C16-15',
  menguji: 'Mahjub tetap menghajb nuqshan ibu',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      F1:  p('F1', 'M'),
      M1:  p('M1', 'F'),
      AK1: p('AK1', 'M', { fatherId: 'F1', motherId: 'M1' }),
      AK2: p('AK2', 'M', { fatherId: 'F1', motherId: 'M1' }),
    },
    marriages: [],
  }),
  expected: {
    status: 'OK',
    // Ibu 1/6=1, ayah ashabah=5; saudara mahjub hirman
    table: { finalAshl: 6n, saham: { F1: 5n, M1: 1n }, excluded: ['AK1', 'AK2'] },
    traceKinds: ['HAJB_HIRMAN', 'HAJB_NUQSHAN'],
  },
};

// ─── Case 16: Regresi hajb — semua laki-laki selain anak lk ─────────────────
// Suami, ayah, anak lk (+semua lk lain dihajb); Ashl 12
// Menguji: Anak lk menghajb semua ashabah lk lebih jauh [R06-1]
export const case16: Fixture = {
  id: 'C16-16',
  menguji: 'Regresi hajb: anak lk + ayah menghijab semua lk lain',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      H1:  p('H1', 'M'),
      F1:  p('F1', 'M', { fatherId: 'GF1', motherId: 'GM1' }),
      M1:  p('M1', 'F', { life: 'dead', isPlaceholder: true }),
      S1:  p('S1', 'M', { fatherId: 'H1', motherId: 'D' }),   // anak lk
      GF1: p('GF1', 'M'),                                     // kakek — mahjub oleh ayah
      GM1: p('GM1', 'F', { life: 'dead', isPlaceholder: true }),
      GS1: p('GS1', 'M', { fatherId: 'S1' }),                 // cucu lk — mahjub oleh anak lk
      AK1: p('AK1', 'M', { fatherId: 'F1', motherId: 'M1' }), // saudara lk kandung
      IA1: p('IA1', 'M', { fatherId: 'AK1' }),                // anak saudara lk kandung
      AM1: p('AM1', 'M', { fatherId: 'GF1', motherId: 'GM1' }), // paman kandung
      IM1: p('IM1', 'M', { fatherId: 'AM1' }),                // anak paman kandung
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // Suami 1/4=3, ayah 1/6=2, anak lk ashabah=7; ashl 12
    table: {
      finalAshl: 12n,
      saham: { H1: 3n, F1: 2n, S1: 7n },
      excluded: ['GF1', 'GS1', 'AK1', 'IA1', 'AM1', 'IM1'],
    },
    traceKinds: ['HAJB_HIRMAN'],
  },
};

// ─── Case 17: Qarib masy'um ───────────────────────────────────────────────────
// Suami, ibu, saudari kandung, saudara lk sebapak, saudari sebapak; Ashl 6 → 7
// Menguji: Saudara/saudari sebapak terhajb oleh saudari kandung (ma'al ghair) [R05-4]
export const case17: Fixture = {
  id: 'C16-17',
  menguji: 'Qarib masy\'um — ashabah sebapak habis karena \'aul',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      H1:  p('H1', 'M'),
      F1:  p('F1', 'M', { life: 'dead', isPlaceholder: true }),
      M1:  p('M1', 'F'),
      // Ibu D = M1 (sudah di atas)
      UK1: p('UK1', 'F', { fatherId: 'F1', motherId: 'M1' }),  // saudari kandung
      // Saudara/saudari sebapak: share F1 saja
      GM1: p('GM1', 'F', { life: 'dead', isPlaceholder: true }),  // ibu saudara sebapak
      AB1: p('AB1', 'M', { fatherId: 'F1', motherId: 'GM1' }),    // saudara lk sebapak
      UB1: p('UB1', 'F', { fatherId: 'F1', motherId: 'GM1' }),    // saudari sebapak
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // Sebapak lk+pr = ashabah bil ghair, bukan mahjub; sisa habis karena 'aul → 0.
    table: { finalAshl: 7n, saham: { H1: 3n, M1: 1n, UK1: 3n, AB1: 0n, UB1: 0n } },
    traceKinds: ['AUL'],
  },
};

// ─── Case 17b: Pembanding 17 — tanpa saudara lk sebapak ─────────────────────
// Suami, ibu, saudari kandung, saudari sebapak; Ashl 6 → 8
// Menguji: Saudari sebapak takmilah ketika tidak ada saudara lk sebapak [R05-3]
export const case17b: Fixture = {
  id: 'C16-17b',
  menguji: 'Saudari sebapak takmilah (tanpa saudara sebapak)',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'F', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      H1:  p('H1', 'M'),
      F1:  p('F1', 'M', { life: 'dead', isPlaceholder: true }),
      M1:  p('M1', 'F'),
      UK1: p('UK1', 'F', { fatherId: 'F1', motherId: 'M1' }),   // saudari kandung
      GM1: p('GM1', 'F', { life: 'dead', isPlaceholder: true }),
      UB1: p('UB1', 'F', { fatherId: 'F1', motherId: 'GM1' }),  // saudari sebapak
    },
    marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // Suami 3, ibu 1, saudari kandung 3, saudari sebapak 1 (takmilah); ashl 8
    table: { finalAshl: 8n, saham: { H1: 3n, M1: 1n, UK1: 3n, UB1: 1n } },
    traceKinds: ['AUL'],
  },
};

// ─── Case 18: Qarib mubarak ───────────────────────────────────────────────────
// 2 anak pr, cucu pr, cicit lk (anak lk dari cucu lk); Ashl 3 → 9
// Menguji: Cicit lk ashabah memungkinkan cucu pr menerima takmilah [R04-4]
export const case18: Fixture = {
  id: 'C16-18',
  menguji: "Qarib mubarak — cicit lk membuka takmilah cucu pr",
  input: input({
    deceasedId: 'D',
    persons: {
      D:    p('D', 'M', { life: 'dead' }),
      // 2 anak pr
      D1:   p('D1', 'F', { fatherId: 'D' }),
      D2:   p('D2', 'F', { fatherId: 'D' }),
      // Cucu pr (dari anak lk yang wafat)
      S1:   p('S1', 'M', { fatherId: 'D', life: 'dead', isPlaceholder: true }),
      GD1:  p('GD1', 'F', { fatherId: 'S1' }),
      // Cicit lk (anak lk dari cucu lk yang wafat)
      GS1:  p('GS1', 'M', { fatherId: 'S1', life: 'dead', isPlaceholder: true }),
      GGS1: p('GGS1', 'M', { fatherId: 'GS1' }),
    },
    marriages: [],
  }),
  expected: {
    status: 'OK',
    // Anak pr 6 (3+3), cucu pr 1, cicit lk 2; ashl 9
    table: { finalAshl: 9n, saham: { D1: 3n, D2: 3n, GD1: 1n, GGS1: 2n } },
    traceKinds: ['TASHIH'],
  },
};

// ─── Case 19: Urutan jihah ────────────────────────────────────────────────────
// Istri, anak pr, saudara lk sebapak, paman kandung; Ashl 8
// Menguji: Saudara (ukhuwwah) mendahului paman ('umumah) [R05-3]
export const case19: Fixture = {
  id: 'C16-19',
  menguji: 'Urutan jihah: ukhuwwah sebelum umumah',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      W1:  p('W1', 'F'),
      F1:  p('F1', 'M', { life: 'dead', fatherId: 'GF1', motherId: 'GM2', isPlaceholder: true }),
      M1:  p('M1', 'F', { life: 'dead', isPlaceholder: true }),
      D1:  p('D1', 'F', { fatherId: 'D' }),    // anak pr
      // Saudara lk sebapak
      GM1: p('GM1', 'F', { life: 'dead', isPlaceholder: true }),
      AB1: p('AB1', 'M', { fatherId: 'F1', motherId: 'GM1' }),
      // Paman kandung (saudara lk ayah, berbagi kakek GF1)
      GF1: p('GF1', 'M', { life: 'dead', isPlaceholder: true }),
      GM2: p('GM2', 'F', { life: 'dead', isPlaceholder: true }),
      AM1: p('AM1', 'M', { fatherId: 'GF1', motherId: 'GM2' }),  // paman
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // Istri 1, anak pr 4, saudara sebapak 3, paman 0
    table: { finalAshl: 8n, saham: { W1: 1n, D1: 4n, AB1: 3n }, excluded: ['AM1'] },
    traceKinds: ['HAJB_HIRMAN'],
  },
};

// ─── Case 20: Ayah fardh saja (ada anak lk) ──────────────────────────────────
// Istri, anak lk, ayah, ibu; Ashl 24
// Menguji: Ayah hanya mendapat fardh 1/6 ketika ada anak lk [R04-3]
export const case20: Fixture = {
  id: 'C16-20',
  menguji: 'Ayah fardh saja (ada anak lk)',
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      W1: p('W1', 'F'),
      F1: p('F1', 'M'),
      M1: p('M1', 'F'),
      S1: p('S1', 'M', { fatherId: 'D', motherId: 'W1' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // Istri 1/8=3, ayah 1/6=4, ibu 1/6=4, anak lk ashabah=13; ashl 24
    table: { finalAshl: 24n, saham: { W1: 3n, F1: 4n, M1: 4n, S1: 13n } },
  },
};

// ─── Case 21: Ayah fardh + ashabah ───────────────────────────────────────────
// Istri, anak pr, ayah, ibu; Ashl 24
// Menguji: Ayah mendapat fardh 1/6 + sisa ashabah ketika ada anak pr saja [R04-3] [R05-2]
export const case21: Fixture = {
  id: 'C16-21',
  menguji: 'Ayah fardh + ashabah (ada anak pr saja)',
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      W1: p('W1', 'F'),
      F1: p('F1', 'M'),
      M1: p('M1', 'F'),
      D1: p('D1', 'F', { fatherId: 'D', motherId: 'W1' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // Istri 1/8=3, anak pr 1/2=12, ibu 1/6=4, ayah 1/6=4+sisa1=5; ashl 24
    table: { finalAshl: 24n, saham: { W1: 3n, D1: 12n, M1: 4n, F1: 5n } },
  },
};

// ─── Case 22: Tashih 1 kelompok ───────────────────────────────────────────────
// 4 istri, 3 saudara lk kandung; Ashl 4 → 16
// Menguji: Tashih inkisar 1 kelompok [R10-2] [R16-5]
export const case22: Fixture = {
  id: 'C16-22',
  menguji: 'Tashih inkisar 1 kelompok',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      W1:  p('W1', 'F'),
      W2:  p('W2', 'F'),
      W3:  p('W3', 'F'),
      W4:  p('W4', 'F'),
      F1:  p('F1', 'M', { life: 'dead', isPlaceholder: true }),
      M1:  p('M1', 'F', { life: 'dead', isPlaceholder: true }),
      AK1: p('AK1', 'M', { fatherId: 'F1', motherId: 'M1' }),
      AK2: p('AK2', 'M', { fatherId: 'F1', motherId: 'M1' }),
      AK3: p('AK3', 'M', { fatherId: 'F1', motherId: 'M1' }),
    },
    marriages: [
      { husbandId: 'D', wifeId: 'W1', status: 'intact' },
      { husbandId: 'D', wifeId: 'W2', status: 'intact' },
      { husbandId: 'D', wifeId: 'W3', status: 'intact' },
      { husbandId: 'D', wifeId: 'W4', status: 'intact' },
    ],
  }),
  expected: {
    status: 'OK',
    // 4 istri berbagi 1/4 → 1 saham masing-masing; saudara 3 berbagi sisa=3 saham tiap 1.
    // Ashl 4, tashih: istri 4 ru'us → tabayun dg 1 → ×4=16. Saudara 4 each.
    table: { finalAshl: 16n, saham: { W1: 1n, W2: 1n, W3: 1n, W4: 1n, AK1: 4n, AK2: 4n, AK3: 4n } },
    traceKinds: ['TASHIH'],
  },
};

// ─── Case 23: Tashih 2 kelompok ───────────────────────────────────────────────
// 2 nenek, 3 saudara lk sebapak; Ashl 6 → 36
// Menguji: Tashih inkisar 2 kelompok [R10-3] [R16-5]
export const case23: Fixture = {
  id: 'C16-23',
  menguji: 'Tashih inkisar 2 kelompok',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      F1:  p('F1', 'M', { life: 'dead', fatherId: 'GF1', motherId: 'GM1', isPlaceholder: true }),
      M1:  p('M1', 'F', { life: 'dead', fatherId: 'GF2', motherId: 'GM2', isPlaceholder: true }),
      GM1: p('GM1', 'F'),  // nenek dari pihak ayah (JADDAH_AB)
      GM2: p('GM2', 'F'),  // nenek dari pihak ibu (JADDAH_UMM)
      GF1: p('GF1', 'M', { life: 'dead', isPlaceholder: true }),
      GF2: p('GF2', 'M', { life: 'dead', isPlaceholder: true }),
      // Saudara lk sebapak
      GM3: p('GM3', 'F', { life: 'dead', isPlaceholder: true }),
      AB1: p('AB1', 'M', { fatherId: 'F1', motherId: 'GM3' }),
      AB2: p('AB2', 'M', { fatherId: 'F1', motherId: 'GM3' }),
      AB3: p('AB3', 'M', { fatherId: 'F1', motherId: 'GM3' }),
    },
    marriages: [],
  }),
  expected: {
    status: 'OK',
    // Nenek 1/6 bersama=1 saham, saudara ashabah=5. Tashih: nenek 2 orang (tabayun dg 1)→×2=12.
    // Saudara 3 orang (tabayun dg 5)→×3. Gabung: juz'=6. Ashl=6×6=36.
    // Nenek tiap 3; saudara tiap 10.
    table: { finalAshl: 36n, saham: { GM1: 3n, GM2: 3n, AB1: 10n, AB2: 10n, AB3: 10n } },
    traceKinds: ['TASHIH', 'NISAB_COMPARE'],
  },
};

// ─── Case 24: Dzawil arham — tanzil ──────────────────────────────────────────
// Khalah, 'ammah (tanpa ahli waris lain); Ashl 3
// Menguji: Dzawil arham tanzil (fase 3) — UNSUPPORTED di fase 1 [R14-1]
export const case24: Fixture = {
  id: 'C16-24',
  menguji: 'Dzawil arham tanzil — UNSUPPORTED fase 1',
  input: input({
    deceasedId: 'D',
    persons: {
      D:   p('D', 'M', { life: 'dead', fatherId: 'F1', motherId: 'M1' }),
      F1:  p('F1', 'M', { life: 'dead', fatherId: 'PGF', motherId: 'PGM', isPlaceholder: true }),
      M1:  p('M1', 'F', { life: 'dead', fatherId: 'MGF', motherId: 'MGM', isPlaceholder: true }),
      PGF: p('PGF', 'M', { life: 'dead', isPlaceholder: true }),
      PGM: p('PGM', 'F', { life: 'dead', isPlaceholder: true }),
      MGF: p('MGF', 'M', { life: 'dead', isPlaceholder: true }),
      MGM: p('MGM', 'F', { life: 'dead', isPlaceholder: true }),
      KL1: p('KL1', 'F', { fatherId: 'MGF', motherId: 'MGM' }),  // khalah: saudari kandung ibu
      AM1: p('AM1', 'F', { fatherId: 'PGF', motherId: 'PGM' }),  // 'ammah: saudari kandung ayah
    },
    marriages: [],
  }),
  // [R14-1] Fase 3. Target kelak: ashl 3, khalah 1 ('ammah 2).
  expected: { status: 'UNSUPPORTED' },
};

// ═════════════════════════════════════════════════════════════════════════════
// UJI NOMINAL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Tirkah Rp 150.000.000; tajhiz Rp 5.000.000; hutang Rp 25.000.000;
 * wasiat Rp 50.000.000 → dipotong jadi 40.000.000 (1/3 dari 120.000.000).
 * Tirkah bersih = 80.000.000. Ahli waris: case 1 (istri, anak lk, anak pr).
 * unit 1 → selisih pembulatan 1 (floor per orang, engine-contract Tahap 6). KB menulis anak lk
 * 46.666.667 — disepakati floor; KB perlu dikoreksi. Variasi unit diuji di regression.test.ts.
 */
export const caseNominal: Fixture = {
  id: 'C16-NOM',
  menguji: 'Nominal + potongan wasiat + selisih pembulatan',
  input: {
    graph: {
      deceasedId: 'D',
      persons: {
        D:  p('D', 'M', { life: 'dead' }),
        W1: p('W1', 'F'),
        S1: p('S1', 'M', { fatherId: 'D', motherId: 'W1' }),
        D1: p('D1', 'F', { fatherId: 'D', motherId: 'W1' }),
      },
      marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
    },
    tirkah: {
      gross:   150_000_000n,
      tajhiz:    5_000_000n,
      hutang:   25_000_000n,
      wasiat:   50_000_000n,  // dipotong jadi 40.000.000
    },
    rounding: { unit: 1n },
    config: DEFAULT_CONFIG,
    ruleset: 'syafii',
    kbVersion: KB_VERSION,
  },
  expected: {
    status: 'OK',
    table: {
      finalAshl: 24n,
      saham: { W1: 3n, S1: 14n, D1: 7n },
    },
    traceKinds: ['DISTRIBUTE'],
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// UJI NEGATIF
// ═════════════════════════════════════════════════════════════════════════════

// ─── Negatif 1: Ahli waris beda agama → dikeluarkan [R02-2] ─────────────────
export const caseNeg1: Fixture = {
  id: 'C16-NEG1',
  menguji: 'Ahli waris non-muslim → mamnu, tidak menghijab',
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead', motherId: 'M1' }),
      W1: p('W1', 'F'),
      M1: p('M1', 'F'),
      D1: p('D1', 'F', { fatherId: 'D', motherId: 'W1', religion: 'nonIslam' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // [R02] mamnu tidak menghijab: istri tetap 1/4 (bukan 1/8), ibu 1/3 (bukan 1/6).
    // Ashl 12: istri 3, ibu 4 → raddB; zawjiyyah 4 (istri 1, sisa 3), ibu satu-satunya ahli radd → 4.
    table: { finalAshl: 4n, saham: { W1: 1n, M1: 3n }, excluded: ['D1'] },
    traceKinds: ['MANI', 'MASALAH_CLASS'],
  },
};

// ─── Negatif 2: Pembunuh pewaris → dikeluarkan [R02-1] ──────────────────────
export const caseNeg2: Fixture = {
  id: 'C16-NEG2',
  menguji: 'Pembunuh pewaris → mamnu, tidak menghijab',
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead', motherId: 'M1' }),
      W1: p('W1', 'F'),
      M1: p('M1', 'F'),
      S1: p('S1', 'M', { fatherId: 'D', motherId: 'W1', killedDeceased: true }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'OK',
    // [R02] mamnu tidak menghijab: istri tetap 1/4 (bukan 1/8), ibu 1/3 (bukan 1/6).
    // Ashl 12: istri 3, ibu 4 → raddB; zawjiyyah 4 (istri 1, sisa 3), ibu satu-satunya ahli radd → 4.
    table: { finalAshl: 4n, saham: { W1: 1n, M1: 3n }, excluded: ['S1'] },
    traceKinds: ['MANI', 'MASALAH_CLASS'],
  },
};

// ─── Negatif 3: Status hidup tidak jelas → NEEDS_INPUT ──────────────────────
export const caseNeg3: Fixture = {
  id: 'C16-NEG3',
  menguji: 'Status hidup tidak jelas → NEEDS_INPUT',
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead' }),
      W1: p('W1', 'F'),
      S1: p('S1', 'M', { fatherId: 'D', motherId: 'W1', life: 'unknown' }),
    },
    marriages: [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }],
  }),
  expected: {
    status: 'NEEDS_INPUT',
    questionFields: ['life'],
  },
};

// ─── Negatif (blocked): wasiat kepada ahli waris → tandai perlu ijazah.
// Tidak dibuat fixture: R01-7 (ijazah wasiat) masih [perlu verifikasi lanjut] — lihat CLAUDE.md.

// ─── Negatif 4: Jumlah istri > 4 → validasi gagal ────────────────────────────
export const caseNeg4: Fixture = {
  id: 'C16-NEG4',
  menguji: 'Jumlah istri > 4 → NEEDS_INPUT (validasi input)',
  input: input({
    deceasedId: 'D',
    persons: {
      D:  p('D', 'M', { life: 'dead' }),
      W1: p('W1', 'F'),
      W2: p('W2', 'F'),
      W3: p('W3', 'F'),
      W4: p('W4', 'F'),
      W5: p('W5', 'F'),  // istri ke-5: tidak sah
    },
    marriages: [
      { husbandId: 'D', wifeId: 'W1', status: 'intact' },
      { husbandId: 'D', wifeId: 'W2', status: 'intact' },
      { husbandId: 'D', wifeId: 'W3', status: 'intact' },
      { husbandId: 'D', wifeId: 'W4', status: 'intact' },
      { husbandId: 'D', wifeId: 'W5', status: 'intact' },
    ],
  }),
  expected: {
    status: 'NEEDS_INPUT',
    questionFields: ['marriages'],
  },
};

// ─── Negatif 5: unit pembulatan tidak valid → NEEDS_INPUT ───────────────────
export const caseNeg5: Fixture = {
  id: 'C16-NEG5',
  menguji: 'Unit pembulatan ≤ 0 → NEEDS_INPUT',
  input: { ...case01.input, rounding: { unit: 0n } },
  expected: { status: 'NEEDS_INPUT', questionFields: ['rounding'] },
};

// ═════════════════════════════════════════════════════════════════════════════
// EKSPOR LENGKAP
// ═════════════════════════════════════════════════════════════════════════════

export const BAB16_FIXTURES: Fixture[] = [
  case01, case02, case03, case04, case05, case06, case07,
  case08, case09, case10, case11, case12, case13,
  case14, case15, case16, case17, case17b,
  case18, case19, case20, case21, case22, case23, case24,
  caseNominal,
  caseNeg1, caseNeg2, caseNeg3, caseNeg4, caseNeg5,
];
