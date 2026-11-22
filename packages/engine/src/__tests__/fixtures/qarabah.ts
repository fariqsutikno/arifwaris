/**
 * Fixture metode Ahl al-Qarabah [HNF] (KB 14.11) — dibuat SEBELUM logika.
 * Tiap graf diberi rujukan baris KB-nya; yang bukan contoh tertulis KB diberi tanda "di luar KB".
 */
import type { GrafKeluarga } from '../../types.js';
import { p } from './bab16.js';

const penghubung = { statusHidup: 'wafat' as const, penghubung: true };

// 14.11 «Contoh (Mabsuth)» #1: anak pr dari (anak pr dari anak lk) = X1 vs anak pr dari (anak pr dari anak pr) = X2.
// Derajat sama (3); orang tua X1 ashabul furudh (cucu pr), orang tua X2 dzawil arham → semua untuk X1.
export const grafQ1: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat' }),
    S: p('S', 'L', { ...penghubung, idAyah: 'D' }),
    SP: p('SP', 'P', { ...penghubung, idAyah: 'S' }),
    X1: p('X1', 'P', { idIbu: 'SP' }),
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    APP: p('APP', 'P', { ...penghubung, idIbu: 'AP' }),
    X2: p('X2', 'P', { idIbu: 'APP' }),
  },
  pernikahan: [],
};

// 14.11 «Contoh (Mabsuth)» #2 = grafDA03 di fixtures/dzawilArham.ts (X1 lebih dekat satu derajat → semua untuknya).

// 14.11 «Satu orang lewat dua jalur» (Mabsuth 30/15): 3/4 dan 1/4. Mayit punya dua anak pr A dan B;
// A punya anak lk A2; B punya dua anak pr B1, B2. X = anak pr A2 dan B1 (dua jalur); Y = anak pr B2.
// Tingkat pertama yang berbeda sifat = A2 (lk), B1, B2 (pr) → 2:1:1 → X = 2/4 + 1/4, Y = 1/4.
export const grafQDuaJalur: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat' }),
    A: p('A', 'P', { ...penghubung, idAyah: 'D' }),
    B: p('B', 'P', { ...penghubung, idAyah: 'D' }),
    A2: p('A2', 'L', { ...penghubung, idIbu: 'A' }),
    B1: p('B1', 'P', { ...penghubung, idIbu: 'B' }),
    B2: p('B2', 'P', { ...penghubung, idIbu: 'B' }),
    X: p('X', 'P', { idAyah: 'A2', idIbu: 'B1' }),
    Y: p('Y', 'P', { idIbu: 'B2' }),
  },
  pernikahan: [],
};

// Di luar KB: dua jalur di shinf kedua (anak saudara lk dan saudari kandung sekaligus). 14.11 hanya mencontohkan shinf pertama.
export const grafQDuaJalurShinf2: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
    F1: p('F1', 'L', penghubung), M1: p('M1', 'P', penghubung),
    SB: p('SB', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    SiB: p('SiB', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X: p('X', 'P', { idAyah: 'SB', idIbu: 'SiB' }),
  },
  pernikahan: [],
};

// Di luar KB: dua kakek fasid sepihak ibu dengan derajat sama (ayah ayahnya ibu; ayah ibunya ibu).
export const grafQDuaKakekFasid: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
    F1: p('F1', 'L', penghubung),
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF', idIbu: 'MGM' }),
    MGF: p('MGF', 'L', { ...penghubung, idAyah: 'MGFF' }),
    MGM: p('MGM', 'P', { ...penghubung, idAyah: 'MGMF' }),
    MGFF: p('MGFF', 'L'),
    MGMF: p('MGMF', 'L'),
  },
  pernikahan: [],
};

// Di luar KB (daftar shinf berhenti di 7): bibi dari ayahnya ayahnya ayah (saudari kakek buyut) = shinf kedelapan.
export const grafQShinf8: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1' }),
    F1: p('F1', 'L', { ...penghubung, idAyah: 'PGF' }),
    PGF: p('PGF', 'L', { ...penghubung, idAyah: 'PGFF' }),
    PGFF: p('PGFF', 'L', { ...penghubung, idAyah: 'C4' }),
    C4: p('C4', 'L', penghubung),
    X: p('X', 'P', { idAyah: 'C4' }),
  },
  pernikahan: [],
};

// Di luar KB: perbandingan lintas pihak: anak 'ammah (derajat 4, pihak ayah) vs cucu khalah (derajat 5, pihak ibu).
export const grafQBedaDerajatLintasPihak: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
    F1: p('F1', 'L', { ...penghubung, idAyah: 'PGF', idIbu: 'PGM' }),
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF', idIbu: 'MGM' }),
    PGF: p('PGF', 'L', penghubung), PGM: p('PGM', 'P', penghubung),
    MGF: p('MGF', 'L', penghubung), MGM: p('MGM', 'P', penghubung),
    AM: p('AM', 'P', { ...penghubung, idAyah: 'PGF', idIbu: 'PGM' }),
    XA: p('XA', 'P', { idIbu: 'AM' }),
    KL: p('KL', 'P', { ...penghubung, idAyah: 'MGF', idIbu: 'MGM' }),
    KLA: p('KLA', 'P', { ...penghubung, idIbu: 'KL' }),
    XB: p('XB', 'P', { idIbu: 'KLA' }),
  },
  pernikahan: [],
};
