/**
 * Fixture regression bab 16 — dibuat SEBELUM implementasi logika.
 * Format: input graf + expected output kunci per kasus.
 * Setiap kasus menguji invariant spesifik; lihat kolom "Menguji" di tabel KB bab 16.
 */

import type { InputEngine, GrafKeluarga, KonfigurasiMadzhab, Orang } from '../../types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const KB_VERSION = '1.0.0-dev';
const KONFIGURASI_BAWAAN: KonfigurasiMadzhab = { kebijakanSisa: 'radd', talakBainSaatMaradh: 'qaulJadid' };

/** Buat Orang minimal (default: hidup, islam, no parents). */
export function p(id: string, jenisKelamin: 'L' | 'P', overrides: Partial<Orang> = {}): Orang {
  return { id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...overrides };
}

/** Buat input engine dengan tirkah default 0 (kasus tanpa nominal). */
export function input(graf: GrafKeluarga, konfigurasi: KonfigurasiMadzhab = KONFIGURASI_BAWAAN): InputEngine {
  return { graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n }, konfigurasi, ruleset: 'syafii', versiKb: KB_VERSION };
}

// ─── Tipe fixture ─────────────────────────────────────────────────────────────

export interface ExpectedTable {
  /** ashlulMasalah setelah 'aul/radd/tashih. */
  ashlAkhir: bigint;
  /** Saham per idOrang. */
  saham: Record<string, bigint>;
  /** idOrang yang terhijab atau mamnuu' (tidak dapat bagian). */
  dikecualikan?: string[];
}

export interface Fixture {
  id: string;
  /** Label singkat dari kolom "Menguji" di KB bab 16. */
  menguji: string;
  input: InputEngine;
  expected:
    | { status: 'OK'; tabel: ExpectedTable; traceKinds?: string[] }
    | { status: 'PERLU_INPUT'; isianPertanyaan: string[] }
    | { status: 'TIDAK_DIDUKUNG' };
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
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat' }),
      W1: p('W1', 'P'),
      S1: p('S1', 'L', { idAyah: 'D', idIbu: 'W1' }),
      D1: p('D1', 'P', { idAyah: 'D', idIbu: 'W1' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    tabel: { ashlAkhir: 24n, saham: { W1: 3n, S1: 14n, D1: 7n } },
    traceKinds: ['TASHIH', 'PERBANDINGAN_NISAB'],
  },
};

// ─── Case 2: Suami, ayah, ibu ─────────────────────────────────────────────────
// Ashl 6; Suami 3, ibu 1, ayah 2
// Menguji: 'Umariyyah (suami + 2 orang tua) [R07-1]
export const case02: Fixture = {
  id: 'C16-02',
  menguji: "'Umariyyah (suami + 2 orang tua)",
  input: input({
    idPewaris: 'D',
    orang: {
      D:  p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      H1: p('H1', 'L'),
      F1: p('F1', 'L'),
      M1: p('M1', 'P'),
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    tabel: { ashlAkhir: 6n, saham: { H1: 3n, M1: 1n, F1: 2n } },
    traceKinds: ['KASUS_KHUSUS'],
  },
};

// ─── Case 3: Istri, ayah, ibu ─────────────────────────────────────────────────
// Ashl 4; Istri 1, ibu 1, ayah 2
// Menguji: 'Umariyyah (istri + 2 orang tua) [R07-1]
export const case03: Fixture = {
  id: 'C16-03',
  menguji: "'Umariyyah (istri + 2 orang tua)",
  input: input({
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      W1: p('W1', 'P'),
      F1: p('F1', 'L'),
      M1: p('M1', 'P'),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    tabel: { ashlAkhir: 4n, saham: { W1: 1n, M1: 1n, F1: 2n } },
    traceKinds: ['KASUS_KHUSUS'],
  },
};

// ─── Case 4: Suami, kakek, ibu ────────────────────────────────────────────────
// Ashl 6; Suami 3, ibu 2, kakek 1
// Menguji: Kakek ≠ ayah dalam 'Umariyyah [R07-1] — 'Umariyyah tidak berlaku
export const case04: Fixture = {
  id: 'C16-04',
  menguji: "Kakek ≠ ayah dalam 'Umariyyah",
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      H1:  p('H1', 'L'),
      // F1: ayah D sudah wafat, penghubung ke kakek
      F1:  p('F1', 'L', { statusHidup: 'wafat', idAyah: 'GF1', penghubung: true }),
      GF1: p('GF1', 'L'),  // kakek (KAKEK)
      M1:  p('M1', 'P'),
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // Suami 1/2=3, ibu 1/3=2 (tanpa 'Umariyyah), kakek ashabah=1
    tabel: { ashlAkhir: 6n, saham: { H1: 3n, M1: 2n, GF1: 1n } },
  },
};

// ─── Case 5: Suami, 2 saudari kandung — 'Aul ─────────────────────────────────
// Ashl 6 → 7; Suami 3, saudari kandung 4 (2+2)
// Menguji: 'Aul ke-7 [R16-1] [R09-4]
export const case05: Fixture = {
  id: 'C16-05',
  menguji: "'Aul 6→7",
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      H1:  p('H1', 'L'),
      F1:  p('F1', 'L', { statusHidup: 'wafat', penghubung: true }),
      M1:  p('M1', 'P', { statusHidup: 'wafat', penghubung: true }),
      UK1: p('UK1', 'P', { idAyah: 'F1', idIbu: 'M1' }),
      UK2: p('UK2', 'P', { idAyah: 'F1', idIbu: 'M1' }),
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    tabel: { ashlAkhir: 7n, saham: { H1: 3n, UK1: 2n, UK2: 2n } },
    traceKinds: ['AUL', 'KELAS_MASALAH'],
  },
};

// ─── Case 6: Minbariyyah ──────────────────────────────────────────────────────
// Istri, ayah, ibu, 2 anak pr; Ashl 24 → 27
// Menguji: 'Aul ke-27 / Minbariyyah [R16-1]
export const case06: Fixture = {
  id: 'C16-06',
  menguji: "'Aul 24→27 / Minbariyyah",
  input: input({
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      W1: p('W1', 'P'),
      F1: p('F1', 'L'),
      M1: p('M1', 'P'),
      D1: p('D1', 'P', { idAyah: 'D', idIbu: 'W1' }),
      D2: p('D2', 'P', { idAyah: 'D', idIbu: 'W1' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    tabel: { ashlAkhir: 27n, saham: { W1: 3n, F1: 4n, M1: 4n, D1: 8n, D2: 8n } },
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
    idPewaris: 'D',
    orang: {
      D:   p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      H1:  p('H1', 'L'),
      F1:  p('F1', 'L', { statusHidup: 'wafat', penghubung: true }),
      M1:  p('M1', 'P'),
      // Saudari kandung: bagian F1 dan M1 dengan D
      UK1: p('UK1', 'P', { idAyah: 'F1', idIbu: 'M1' }),
      UK2: p('UK2', 'P', { idAyah: 'F1', idIbu: 'M1' }),
      // Saudari seibu: bagian M1 saja (ayah berbeda)
      UF1: p('UF1', 'L', { statusHidup: 'wafat', penghubung: true }), // ayah saudari seibu
      UM1: p('UM1', 'P', { idAyah: 'UF1', idIbu: 'M1' }),
      UM2: p('UM2', 'P', { idAyah: 'UF1', idIbu: 'M1' }),
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    tabel: { ashlAkhir: 10n, saham: { H1: 3n, M1: 1n, UM1: 1n, UM2: 1n, UK1: 2n, UK2: 2n } },
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
    idPewaris: 'D',
    orang: {
      D:   p('D', 'L', { statusHidup: 'wafat', idAyah: 'GF1', idIbu: 'GM1' }),
      // Anak pr
      D1:  p('D1', 'P', { idAyah: 'D' }),
      // Anak lk (wafat) — penghubung ke cucu pr
      S1:  p('S1', 'L', { idAyah: 'D', statusHidup: 'wafat', penghubung: true }),
      GD1: p('GD1', 'P', { idAyah: 'S1' }),  // cucu pr dari anak lk
      // Saudari kandung (bagian orang tua dengan D)
      GF1: p('GF1', 'L', { statusHidup: 'wafat', penghubung: true }),
      GM1: p('GM1', 'P', { statusHidup: 'wafat', penghubung: true }),
      UK1: p('UK1', 'P', { idAyah: 'GF1', idIbu: 'GM1' }),
    },
    pernikahan: [],
  }),
  expected: {
    status: 'OK',
    // Anak pr 1/2=3, cucu pr takmilah 1/6=1, saudari kandung ma'al ghair=2
    tabel: { ashlAkhir: 6n, saham: { D1: 3n, GD1: 1n, UK1: 2n } },
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
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat', idIbu: 'M1' }),
      D1: p('D1', 'P', { idAyah: 'D' }),
      M1: p('M1', 'P'),
    },
    pernikahan: [],
  }),
  expected: {
    status: 'OK',
    // Anak pr 3/4, ibu 1/4 setelah radd; ashl final=4
    tabel: { ashlAkhir: 4n, saham: { D1: 3n, M1: 1n } },
    traceKinds: ['KELAS_MASALAH', 'PERBANDINGAN_NISAB'],
  },
};

// ─── Case 10: Radd dengan pasangan — tabayun ──────────────────────────────────
// Suami, anak pr, cucu pr; 4 × 4 = 16
// Menguji: raddB tabayun [R09-4] — contoh di engine-contract.md
export const case10: Fixture = {
  id: 'C16-10',
  menguji: 'Radd dengan pasangan — tabayun (raddB)',
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'P', { statusHidup: 'wafat' }),
      H1:  p('H1', 'L'),
      D1:  p('D1', 'P', { idAyah: 'H1', idIbu: 'D' }),
      // Anak lk wafat — penghubung ke cucu pr
      S1:  p('S1', 'L', { idAyah: 'H1', idIbu: 'D', statusHidup: 'wafat', penghubung: true }),
      GD1: p('GD1', 'P', { idAyah: 'S1' }),
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    tabel: { ashlAkhir: 16n, saham: { H1: 4n, D1: 9n, GD1: 3n } },
    traceKinds: ['KELAS_MASALAH', 'PERBANDINGAN_NISAB'],
  },
};

// ─── Case 11: Radd dengan pasangan — habis ────────────────────────────────────
// Istri, ibu, 2 saudara seibu; Ashl 4
// Menguji: raddB tamatsul (habis) [R09-4]
export const case11: Fixture = {
  id: 'C16-11',
  menguji: 'Radd dengan pasangan — habis (raddB tamatsul)',
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'L', { statusHidup: 'wafat', idIbu: 'M1' }),
      W1:  p('W1', 'P'),
      M1:  p('M1', 'P'),
      // Saudara seibu: bagian M1 saja
      UF1: p('UF1', 'L', { statusHidup: 'wafat', penghubung: true }),
      US1: p('US1', 'L', { idAyah: 'UF1', idIbu: 'M1' }),
      US2: p('US2', 'L', { idAyah: 'UF1', idIbu: 'M1' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    tabel: { ashlAkhir: 4n, saham: { W1: 1n, M1: 1n, US1: 1n, US2: 1n } },
    traceKinds: ['KELAS_MASALAH'],
  },
};

// ─── Case 12: Akdariyyah ──────────────────────────────────────────────────────
// Suami, ibu, kakek, 1 saudari kandung; Ashl 6 → 9 → 27
// Menguji: kasus Akdariyyah [R16-2] [R08-5]
export const case12: Fixture = {
  id: 'C16-12',
  menguji: 'Akdariyyah',
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      H1:  p('H1', 'L'),
      F1:  p('F1', 'L', { statusHidup: 'wafat', idAyah: 'GF1', penghubung: true }),
      GF1: p('GF1', 'L'),  // kakek
      M1:  p('M1', 'P'),
      UK1: p('UK1', 'P', { idAyah: 'F1', idIbu: 'M1' }),  // saudari kandung
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // [R16-2]: suami 9, ibu 6, saudari 4, kakek 8 (dari ashl 27)
    tabel: { ashlAkhir: 27n, saham: { H1: 9n, M1: 6n, UK1: 4n, GF1: 8n } },
    traceKinds: ['KASUS_KHUSUS'],
  },
};

// ─── Case 13: Musyarrakah (tasyrik, default [SYF]) ───────────────────────────
// Suami, ibu, 2 saudara seibu, 1 saudara lk kandung; Ashl 6 → 18
// Menguji: Musyarrakah — tasyrik default [R07-2] [R16-4]
export const case13: Fixture = {
  id: 'C16-13',
  menguji: 'Musyarrakah (tasyrik default)',
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      H1:  p('H1', 'L'),
      F1:  p('F1', 'L', { statusHidup: 'wafat', penghubung: true }),
      M1:  p('M1', 'P'),
      // Saudara seibu (2)
      UF1: p('UF1', 'L', { statusHidup: 'wafat', penghubung: true }),
      US1: p('US1', 'L', { idAyah: 'UF1', idIbu: 'M1' }),
      US2: p('US2', 'L', { idAyah: 'UF1', idIbu: 'M1' }),
      // Saudara kandung (1): bagian F1 dan M1
      AK1: p('AK1', 'L', { idAyah: 'F1', idIbu: 'M1' }),
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // Ashl 6→18; suami 9, ibu 3, tiap saudara (3 orang) 2
    tabel: { ashlAkhir: 18n, saham: { H1: 9n, M1: 3n, US1: 2n, US2: 2n, AK1: 2n } },
    traceKinds: ['KASUS_KHUSUS', 'TASHIH'],
  },
};

// ─── Case 14: Jadd wal ikhwah — jumhur ───────────────────────────────────────
// Istri, kakek, 3 saudara lk kandung; Ashl 4 → 12
// Menguji: Jadd wal ikhwah — kakek muqasamah [R08-2]
export const case14: Fixture = {
  id: 'C16-14',
  menguji: 'Jadd wal ikhwah — muqasamah jumhur',
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      W1:  p('W1', 'P'),
      F1:  p('F1', 'L', { statusHidup: 'wafat', idAyah: 'GF1', penghubung: true }),
      GF1: p('GF1', 'L'),  // kakek
      M1:  p('M1', 'P', { statusHidup: 'wafat', penghubung: true }),
      AK1: p('AK1', 'L', { idAyah: 'F1', idIbu: 'M1' }),
      AK2: p('AK2', 'L', { idAyah: 'F1', idIbu: 'M1' }),
      AK3: p('AK3', 'L', { idAyah: 'F1', idIbu: 'M1' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // Istri 1/4=3, kakek 1/3 sisa = 3, 3 saudara = 6 (2 each); ashl 12
    tabel: { ashlAkhir: 12n, saham: { W1: 3n, GF1: 3n, AK1: 2n, AK2: 2n, AK3: 2n } },
    traceKinds: ['PERBANDINGAN_NISAB'],
  },
};

// ─── Case 15: Hajb nuqshan ibu ────────────────────────────────────────────────
// Ayah, ibu, 2 saudara lk kandung; Ashl 6
// Menguji: Saudara mahjub oleh ayah TETAPI tetap menghajb ibu ke 1/6 [R06-5]
export const case15: Fixture = {
  id: 'C16-15',
  menguji: 'Mahjub tetap menghajb nuqshan ibu',
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      F1:  p('F1', 'L'),
      M1:  p('M1', 'P'),
      AK1: p('AK1', 'L', { idAyah: 'F1', idIbu: 'M1' }),
      AK2: p('AK2', 'L', { idAyah: 'F1', idIbu: 'M1' }),
    },
    pernikahan: [],
  }),
  expected: {
    status: 'OK',
    // Ibu 1/6=1, ayah ashabah=5; saudara mahjub hirman
    tabel: { ashlAkhir: 6n, saham: { F1: 5n, M1: 1n }, dikecualikan: ['AK1', 'AK2'] },
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
    idPewaris: 'D',
    orang: {
      D:   p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      H1:  p('H1', 'L'),
      F1:  p('F1', 'L', { idAyah: 'GF1', idIbu: 'GM1' }),
      M1:  p('M1', 'P', { statusHidup: 'wafat', penghubung: true }),
      S1:  p('S1', 'L', { idAyah: 'H1', idIbu: 'D' }),   // anak lk
      GF1: p('GF1', 'L'),                                     // kakek — mahjub oleh ayah
      GM1: p('GM1', 'P', { statusHidup: 'wafat', penghubung: true }),
      GS1: p('GS1', 'L', { idAyah: 'S1' }),                 // cucu lk — mahjub oleh anak lk
      AK1: p('AK1', 'L', { idAyah: 'F1', idIbu: 'M1' }), // saudara lk kandung
      IA1: p('IA1', 'L', { idAyah: 'AK1' }),                // anak saudara lk kandung
      AM1: p('AM1', 'L', { idAyah: 'GF1', idIbu: 'GM1' }), // paman kandung
      IM1: p('IM1', 'L', { idAyah: 'AM1' }),                // anak paman kandung
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // Suami 1/4=3, ayah 1/6=2, anak lk ashabah=7; ashl 12
    tabel: {
      ashlAkhir: 12n,
      saham: { H1: 3n, F1: 2n, S1: 7n },
      dikecualikan: ['GF1', 'GS1', 'AK1', 'IA1', 'AM1', 'IM1'],
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
    idPewaris: 'D',
    orang: {
      D:   p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      H1:  p('H1', 'L'),
      F1:  p('F1', 'L', { statusHidup: 'wafat', penghubung: true }),
      M1:  p('M1', 'P'),
      // Ibu D = M1 (sudah di atas)
      UK1: p('UK1', 'P', { idAyah: 'F1', idIbu: 'M1' }),  // saudari kandung
      // Saudara/saudari sebapak: bagian F1 saja
      GM1: p('GM1', 'P', { statusHidup: 'wafat', penghubung: true }),  // ibu saudara sebapak
      AB1: p('AB1', 'L', { idAyah: 'F1', idIbu: 'GM1' }),    // saudara lk sebapak
      UB1: p('UB1', 'P', { idAyah: 'F1', idIbu: 'GM1' }),    // saudari sebapak
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // Sebapak lk+pr = ashabah bil ghair, bukan mahjub; sisa habis karena 'aul → 0.
    tabel: { ashlAkhir: 7n, saham: { H1: 3n, M1: 1n, UK1: 3n, AB1: 0n, UB1: 0n } },
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
    idPewaris: 'D',
    orang: {
      D:   p('D', 'P', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      H1:  p('H1', 'L'),
      F1:  p('F1', 'L', { statusHidup: 'wafat', penghubung: true }),
      M1:  p('M1', 'P'),
      UK1: p('UK1', 'P', { idAyah: 'F1', idIbu: 'M1' }),   // saudari kandung
      GM1: p('GM1', 'P', { statusHidup: 'wafat', penghubung: true }),
      UB1: p('UB1', 'P', { idAyah: 'F1', idIbu: 'GM1' }),  // saudari sebapak
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // Suami 3, ibu 1, saudari kandung 3, saudari sebapak 1 (takmilah); ashl 8
    tabel: { ashlAkhir: 8n, saham: { H1: 3n, M1: 1n, UK1: 3n, UB1: 1n } },
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
    idPewaris: 'D',
    orang: {
      D:    p('D', 'L', { statusHidup: 'wafat' }),
      // 2 anak pr
      D1:   p('D1', 'P', { idAyah: 'D' }),
      D2:   p('D2', 'P', { idAyah: 'D' }),
      // Cucu pr (dari anak lk yang wafat)
      S1:   p('S1', 'L', { idAyah: 'D', statusHidup: 'wafat', penghubung: true }),
      GD1:  p('GD1', 'P', { idAyah: 'S1' }),
      // Cicit lk (anak lk dari cucu lk yang wafat)
      GS1:  p('GS1', 'L', { idAyah: 'S1', statusHidup: 'wafat', penghubung: true }),
      GGS1: p('GGS1', 'L', { idAyah: 'GS1' }),
    },
    pernikahan: [],
  }),
  expected: {
    status: 'OK',
    // Anak pr 6 (3+3), cucu pr 1, cicit lk 2; ashl 9
    tabel: { ashlAkhir: 9n, saham: { D1: 3n, D2: 3n, GD1: 1n, GGS1: 2n } },
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
    idPewaris: 'D',
    orang: {
      D:   p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      W1:  p('W1', 'P'),
      F1:  p('F1', 'L', { statusHidup: 'wafat', idAyah: 'GF1', idIbu: 'GM2', penghubung: true }),
      M1:  p('M1', 'P', { statusHidup: 'wafat', penghubung: true }),
      D1:  p('D1', 'P', { idAyah: 'D' }),    // anak pr
      // Saudara lk sebapak
      GM1: p('GM1', 'P', { statusHidup: 'wafat', penghubung: true }),
      AB1: p('AB1', 'L', { idAyah: 'F1', idIbu: 'GM1' }),
      // Paman kandung (saudara lk ayah, berbagi kakek GF1)
      GF1: p('GF1', 'L', { statusHidup: 'wafat', penghubung: true }),
      GM2: p('GM2', 'P', { statusHidup: 'wafat', penghubung: true }),
      AM1: p('AM1', 'L', { idAyah: 'GF1', idIbu: 'GM2' }),  // paman
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // Istri 1, anak pr 4, saudara sebapak 3, paman 0
    tabel: { ashlAkhir: 8n, saham: { W1: 1n, D1: 4n, AB1: 3n }, dikecualikan: ['AM1'] },
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
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      W1: p('W1', 'P'),
      F1: p('F1', 'L'),
      M1: p('M1', 'P'),
      S1: p('S1', 'L', { idAyah: 'D', idIbu: 'W1' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // Istri 1/8=3, ayah 1/6=4, ibu 1/6=4, anak lk ashabah=13; ashl 24
    tabel: { ashlAkhir: 24n, saham: { W1: 3n, F1: 4n, M1: 4n, S1: 13n } },
  },
};

// ─── Case 21: Ayah fardh + ashabah ───────────────────────────────────────────
// Istri, anak pr, ayah, ibu; Ashl 24
// Menguji: Ayah mendapat fardh 1/6 + sisa ashabah ketika ada anak pr saja [R04-3] [R05-2]
export const case21: Fixture = {
  id: 'C16-21',
  menguji: 'Ayah fardh + ashabah (ada anak pr saja)',
  input: input({
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      W1: p('W1', 'P'),
      F1: p('F1', 'L'),
      M1: p('M1', 'P'),
      D1: p('D1', 'P', { idAyah: 'D', idIbu: 'W1' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // Istri 1/8=3, anak pr 1/2=12, ibu 1/6=4, ayah 1/6=4+sisa1=5; ashl 24
    tabel: { ashlAkhir: 24n, saham: { W1: 3n, D1: 12n, M1: 4n, F1: 5n } },
  },
};

// ─── Case 22: Tashih 1 kelompok ───────────────────────────────────────────────
// 4 istri, 3 saudara lk kandung; Ashl 4 → 16
// Menguji: Tashih inkisar 1 kelompok [R10-2] [R16-5]
export const case22: Fixture = {
  id: 'C16-22',
  menguji: 'Tashih inkisar 1 kelompok',
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      W1:  p('W1', 'P'),
      W2:  p('W2', 'P'),
      W3:  p('W3', 'P'),
      W4:  p('W4', 'P'),
      F1:  p('F1', 'L', { statusHidup: 'wafat', penghubung: true }),
      M1:  p('M1', 'P', { statusHidup: 'wafat', penghubung: true }),
      AK1: p('AK1', 'L', { idAyah: 'F1', idIbu: 'M1' }),
      AK2: p('AK2', 'L', { idAyah: 'F1', idIbu: 'M1' }),
      AK3: p('AK3', 'L', { idAyah: 'F1', idIbu: 'M1' }),
    },
    pernikahan: [
      { idSuami: 'D', idIstri: 'W1', status: 'utuh' },
      { idSuami: 'D', idIstri: 'W2', status: 'utuh' },
      { idSuami: 'D', idIstri: 'W3', status: 'utuh' },
      { idSuami: 'D', idIstri: 'W4', status: 'utuh' },
    ],
  }),
  expected: {
    status: 'OK',
    // 4 istri berbagi 1/4 → 1 saham masing-masing; saudara 3 berbagi sisa=3 saham tiap 1.
    // Ashl 4, tashih: istri 4 ru'us → tabayun dg 1 → ×4=16. Saudara 4 each.
    tabel: { ashlAkhir: 16n, saham: { W1: 1n, W2: 1n, W3: 1n, W4: 1n, AK1: 4n, AK2: 4n, AK3: 4n } },
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
    idPewaris: 'D',
    orang: {
      D:   p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      F1:  p('F1', 'L', { statusHidup: 'wafat', idAyah: 'GF1', idIbu: 'GM1', penghubung: true }),
      M1:  p('M1', 'P', { statusHidup: 'wafat', idAyah: 'GF2', idIbu: 'GM2', penghubung: true }),
      GM1: p('GM1', 'P'),  // nenek dari pihak ayah (NENEK_DARI_AYAH)
      GM2: p('GM2', 'P'),  // nenek dari pihak ibu (NENEK_DARI_IBU)
      GF1: p('GF1', 'L', { statusHidup: 'wafat', penghubung: true }),
      GF2: p('GF2', 'L', { statusHidup: 'wafat', penghubung: true }),
      // Saudara lk sebapak
      GM3: p('GM3', 'P', { statusHidup: 'wafat', penghubung: true }),
      AB1: p('AB1', 'L', { idAyah: 'F1', idIbu: 'GM3' }),
      AB2: p('AB2', 'L', { idAyah: 'F1', idIbu: 'GM3' }),
      AB3: p('AB3', 'L', { idAyah: 'F1', idIbu: 'GM3' }),
    },
    pernikahan: [],
  }),
  expected: {
    status: 'OK',
    // Nenek 1/6 bersama=1 saham, saudara ashabah=5. Tashih: nenek 2 orang (tabayun dg 1)→×2=12.
    // Saudara 3 orang (tabayun dg 5)→×3. Gabung: juz'=6. Ashl=6×6=36.
    // Nenek tiap 3; saudara tiap 10.
    tabel: { ashlAkhir: 36n, saham: { GM1: 3n, GM2: 3n, AB1: 10n, AB2: 10n, AB3: 10n } },
    traceKinds: ['TASHIH', 'PERBANDINGAN_NISAB'],
  },
};

// ─── Case 24: Dzawil arham — tanzil ──────────────────────────────────────────
// Khalah, 'ammah (tanpa ahli waris lain); Ashl 3
// Menguji: Dzawil arham tanzil (fase 3) — TIDAK_DIDUKUNG di fase 1 [R14-1]
export const case24: Fixture = {
  id: 'C16-24',
  menguji: 'Dzawil arham tanzil — TIDAK_DIDUKUNG fase 1',
  input: input({
    idPewaris: 'D',
    orang: {
      D:   p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
      F1:  p('F1', 'L', { statusHidup: 'wafat', idAyah: 'PGF', idIbu: 'PGM', penghubung: true }),
      M1:  p('M1', 'P', { statusHidup: 'wafat', idAyah: 'MGF', idIbu: 'MGM', penghubung: true }),
      PGF: p('PGF', 'L', { statusHidup: 'wafat', penghubung: true }),
      PGM: p('PGM', 'P', { statusHidup: 'wafat', penghubung: true }),
      MGF: p('MGF', 'L', { statusHidup: 'wafat', penghubung: true }),
      MGM: p('MGM', 'P', { statusHidup: 'wafat', penghubung: true }),
      KL1: p('KL1', 'P', { idAyah: 'MGF', idIbu: 'MGM' }),  // khalah: saudari kandung ibu
      AM1: p('AM1', 'P', { idAyah: 'PGF', idIbu: 'PGM' }),  // 'ammah: saudari kandung ayah
    },
    pernikahan: [],
  }),
  // [R14-1] Fase 3. Target kelak: ashl 3, khalah 1 ('ammah 2).
  expected: { status: 'TIDAK_DIDUKUNG' },
};

// ═════════════════════════════════════════════════════════════════════════════
// UJI NOMINAL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Tirkah Rp 150.000.000; tajhiz Rp 5.000.000; hutang Rp 25.000.000;
 * wasiat Rp 50.000.000 → dipotong jadi 40.000.000 (1/3 dari 120.000.000).
 * Tirkah bersih = 80.000.000. Ahli waris: case 1 (istri, anak lk, anak pr).
 * satuan 1 → selisih pembulatan 1 (floor per orang, engine-contract Tahap 6). KB menulis anak lk
 * 46.666.667 — disepakati floor; KB perlu dikoreksi. Variasi satuan diuji di regression.test.ts.
 */
export const caseNominal: Fixture = {
  id: 'C16-NOM',
  menguji: 'Nominal + potongan wasiat + selisih pembulatan',
  input: {
    graf: {
      idPewaris: 'D',
      orang: {
        D:  p('D', 'L', { statusHidup: 'wafat' }),
        W1: p('W1', 'P'),
        S1: p('S1', 'L', { idAyah: 'D', idIbu: 'W1' }),
        D1: p('D1', 'P', { idAyah: 'D', idIbu: 'W1' }),
      },
      pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
    },
    tirkah: {
      kotor:   150_000_000n,
      tajhiz:    5_000_000n,
      hutang:   25_000_000n,
      wasiat:   50_000_000n,  // dipotong jadi 40.000.000
    },
    pembulatan: { satuan: 1n },
    konfigurasi: KONFIGURASI_BAWAAN,
    ruleset: 'syafii',
    versiKb: KB_VERSION,
  },
  expected: {
    status: 'OK',
    tabel: {
      ashlAkhir: 24n,
      saham: { W1: 3n, S1: 14n, D1: 7n },
    },
    traceKinds: ['DISTRIBUSI'],
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
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat', idIbu: 'M1' }),
      W1: p('W1', 'P'),
      M1: p('M1', 'P'),
      D1: p('D1', 'P', { idAyah: 'D', idIbu: 'W1', agama: 'nonIslam' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // [R02] mamnu tidak menghijab: istri tetap 1/4 (bukan 1/8), ibu 1/3 (bukan 1/6).
    // Ashl 12: istri 3, ibu 4 → raddB; zawjiyyah 4 (istri 1, sisa 3), ibu satu-satunya ahli radd → 4.
    tabel: { ashlAkhir: 4n, saham: { W1: 1n, M1: 3n }, dikecualikan: ['D1'] },
    traceKinds: ['MANI', 'KELAS_MASALAH'],
  },
};

// ─── Negatif 2: Pembunuh pewaris → dikeluarkan [R02-1] ──────────────────────
export const caseNeg2: Fixture = {
  id: 'C16-NEG2',
  menguji: 'Pembunuh pewaris → mamnu, tidak menghijab',
  input: input({
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat', idIbu: 'M1' }),
      W1: p('W1', 'P'),
      M1: p('M1', 'P'),
      S1: p('S1', 'L', { idAyah: 'D', idIbu: 'W1', membunuhPewaris: true }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'OK',
    // [R02] mamnu tidak menghijab: istri tetap 1/4 (bukan 1/8), ibu 1/3 (bukan 1/6).
    // Ashl 12: istri 3, ibu 4 → raddB; zawjiyyah 4 (istri 1, sisa 3), ibu satu-satunya ahli radd → 4.
    tabel: { ashlAkhir: 4n, saham: { W1: 1n, M1: 3n }, dikecualikan: ['S1'] },
    traceKinds: ['MANI', 'KELAS_MASALAH'],
  },
};

// ─── Negatif 3: Status hidup tidak jelas → PERLU_INPUT ──────────────────────
export const caseNeg3: Fixture = {
  id: 'C16-NEG3',
  menguji: 'Status hidup tidak jelas → PERLU_INPUT',
  input: input({
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat' }),
      W1: p('W1', 'P'),
      S1: p('S1', 'L', { idAyah: 'D', idIbu: 'W1', statusHidup: 'tidakDiketahui' }),
    },
    pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }],
  }),
  expected: {
    status: 'PERLU_INPUT',
    isianPertanyaan: ['statusHidup'],
  },
};

// ─── Negatif (terhalang): wasiat kepada ahli waris → tandai perlu ijazah.
// Tidak dibuat fixture: R01-7 (ijazah wasiat) masih [perlu verifikasi lanjut] — lihat CLAUDE.md.

// ─── Negatif 4: Jumlah istri > 4 → validasi gagal ────────────────────────────
export const caseNeg4: Fixture = {
  id: 'C16-NEG4',
  menguji: 'Jumlah istri > 4 → PERLU_INPUT (validasi input)',
  input: input({
    idPewaris: 'D',
    orang: {
      D:  p('D', 'L', { statusHidup: 'wafat' }),
      W1: p('W1', 'P'),
      W2: p('W2', 'P'),
      W3: p('W3', 'P'),
      W4: p('W4', 'P'),
      W5: p('W5', 'P'),  // istri ke-5: tidak sah
    },
    pernikahan: [
      { idSuami: 'D', idIstri: 'W1', status: 'utuh' },
      { idSuami: 'D', idIstri: 'W2', status: 'utuh' },
      { idSuami: 'D', idIstri: 'W3', status: 'utuh' },
      { idSuami: 'D', idIstri: 'W4', status: 'utuh' },
      { idSuami: 'D', idIstri: 'W5', status: 'utuh' },
    ],
  }),
  expected: {
    status: 'PERLU_INPUT',
    isianPertanyaan: ['pernikahan'],
  },
};

// ─── Negatif 5: satuan pembulatan tidak valid → PERLU_INPUT ───────────────────
export const caseNeg5: Fixture = {
  id: 'C16-NEG5',
  menguji: 'Unit pembulatan ≤ 0 → PERLU_INPUT',
  input: { ...case01.input, pembulatan: { satuan: 0n } },
  expected: { status: 'PERLU_INPUT', isianPertanyaan: ['pembulatan'] },
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
