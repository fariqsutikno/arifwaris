/**
 * Kasus uji overlay madzhab (bab 18.2). Dibuat SEBELUM logika. Nilai harapan diturunkan dari sel matriks;
 * [SYF] dicocokkan ke bab asal. `saham` = saham akhir per orang (> 0) terhadap `penyebut` akhir.
 */
import type { GrafKeluarga, Ruleset } from '../../types.js';
import { p } from './bab16.js';

export interface KasusMadzhab {
  id: string;
  kode: string;
  menguji: string;
  graf: GrafKeluarga;
  harapan: Partial<Record<Ruleset, { saham: Record<string, bigint>; penyebut: bigint } | 'TIDAK_DIDUKUNG'>>;
}

const penghubung = { statusHidup: 'wafat' as const, penghubung: true };

// ─── K04-2: ayah + ibu ayah (ummul ab) + anak lk ───
// [SYF]/[HNF]/[MLK]: nenek terhijab ayah [R04-10] → ayah 1/6 = 1, anak lk 5 (ashl 6).
// [HNB]: nenek tidak terhijab (Mughni 6/303) → ayah 1, nenek 1, anak lk 4 (ashl 6).
const grafK04_2: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A' }),
    A: p('A', 'L', { idIbu: 'NA' }),
    NA: p('NA', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

// ─── K04-1: ibu ayah (dekat, pihak ayah) + ibu dari ibu dari ibu (jauh, pihak ibu) + anak lk; tanpa ayah & ibu ───
// [SYF]/[MLK]: yang dekat pihak ayah tidak menghijab yang jauh pihak ibu → berbagi 1/6: ashl 6 → tashih 12: NA 1, N3 1, anak lk 10.
// [HNB]/[HNF]: yang dekat menghijab mutlak → NA 1, anak lk 5 (ashl 6).
const grafK04_1: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }),
    A: p('A', 'L', { ...penghubung, idIbu: 'NA' }),
    NA: p('NA', 'P'),
    I: p('I', 'P', { ...penghubung, idIbu: 'I2' }),
    I2: p('I2', 'P', { ...penghubung, idIbu: 'N3' }),
    N3: p('N3', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

// ─── K03-1 (a): ibu kakek (ummul jadd) + anak lk; ayah & kakek wafat ───
// [SYF]/[HNB]/[HNF]: ahli waris 1/6 → nenek 1, anak lk 5 (ashl 6).
// [MLK]: hanya ummul umm & ummul ab → dzawil arham → anak lk seluruhnya (1/1).
const grafK03_1a: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A' }),
    A: p('A', 'L', { ...penghubung, idAyah: 'K' }),
    K: p('K', 'L', { ...penghubung, idIbu: 'UK' }),
    UK: p('UK', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

// ─── K03-1 (b): ibu ayah kakek (umm abil jadd) + anak lk ───
// [SYF]/[HNF]: ahli waris → nenek 1, anak lk 5 (ashl 6).  [HNB]/[MLK]: dzawil arham → anak lk 1/1.
const grafK03_1b: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A' }),
    A: p('A', 'L', { ...penghubung, idAyah: 'K' }),
    K: p('K', 'L', { ...penghubung, idAyah: 'KB' }),
    KB: p('KB', 'L', { ...penghubung, idIbu: 'UKB' }),
    UKB: p('UKB', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

// ─── K04-3: satu nenek lewat ayah sekaligus lewat ibu (ayah & ibu pewaris sama-sama anak G) + anak lk ───
// [SYF]: satu bagian [R04-8] → G 1, anak lk 5 (ashl 6). Madzhab lain: belum dimodelkan → TIDAK_DIDUKUNG.
const grafK04_3: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }),
    A: p('A', 'L', { ...penghubung, idIbu: 'G' }),
    I: p('I', 'P', { ...penghubung, idIbu: 'G' }),
    G: p('G', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

// ─── K04-3 pihak yang sama: G nenek dari dua jalur, keduanya lewat ayah (B & C sepupu, ibu mereka kakak-adik) ───
// Jalur PW→A→B→E→G (L L P, 2 lk) dan PW→A→C→F→G (L P P, 1 lk); keduanya shahihah.
// [SYF]: satu bagian. [HNB] (batas 2 lk): dua jalur sah → dua qarabah → TIDAK_DIDUKUNG. [HNF] sama.
// [MLK] (batas 1 lk): jalur pertama lewat batas, tinggal satu qarabah → G 1, anak lk 5.
const grafK04_3SatuPihak: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A' }),
    A: p('A', 'L', { ...penghubung, idAyah: 'B', idIbu: 'C' }),
    B: p('B', 'L', { ...penghubung, idIbu: 'E' }),
    C: p('C', 'P', { ...penghubung, idIbu: 'F' }),
    E: p('E', 'P', { ...penghubung, idIbu: 'G' }),
    F: p('F', 'P', { ...penghubung, idIbu: 'G' }),
    G: p('G', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

// ─── Jalur terpendek fasidah, jalur lain shahihah: G tetap nenek shahihah lewat jalur ibu ───
// PW→A→B→C→G (L P L: fasidah, 4 generasi) dan PW→I→J→K→G (P P P: shahihah, 4 generasi). [SYF]: G 1, anak lk 5.
// Madzhab lain tertahan gerbang R14-4 karena C (jadd fasid) ada di graf.
const grafNenekJalurKedua: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }),
    A: p('A', 'L', { ...penghubung, idIbu: 'B' }),
    B: p('B', 'P', { ...penghubung, idAyah: 'C' }),
    C: p('C', 'L', { ...penghubung, idIbu: 'G' }),
    I: p('I', 'P', { ...penghubung, idIbu: 'J' }),
    J: p('J', 'P', { ...penghubung, idIbu: 'K' }),
    K: p('K', 'P', { ...penghubung, idIbu: 'G' }),
    G: p('G', 'P'),
    AL: p('AL', 'L', { idAyah: 'PW' }),
  },
  pernikahan: [],
};

const sendiri ={ saham: { AL: 1n }, penyebut: 1n };

export const KASUS_NENEK: KasusMadzhab[] = [
  { id: 'MZ1', kode: 'K04-2', menguji: 'ummul ab bersama ayah', graf: grafK04_2, harapan: {
    syafii: { saham: { A: 1n, AL: 5n }, penyebut: 6n }, hanafi: { saham: { A: 1n, AL: 5n }, penyebut: 6n },
    maliki: { saham: { A: 1n, AL: 5n }, penyebut: 6n }, hanbali: { saham: { A: 1n, NA: 1n, AL: 4n }, penyebut: 6n } } },
  { id: 'MZ2', kode: 'K04-1', menguji: 'nenek dekat pihak ayah vs jauh pihak ibu', graf: grafK04_1, harapan: {
    syafii: { saham: { NA: 1n, N3: 1n, AL: 10n }, penyebut: 12n }, maliki: { saham: { NA: 1n, N3: 1n, AL: 10n }, penyebut: 12n },
    hanbali: { saham: { NA: 1n, AL: 5n }, penyebut: 6n }, hanafi: { saham: { NA: 1n, AL: 5n }, penyebut: 6n } } },
  { id: 'MZ3', kode: 'K03-1', menguji: 'ummul jadd', graf: grafK03_1a, harapan: {
    syafii: { saham: { UK: 1n, AL: 5n }, penyebut: 6n }, hanbali: { saham: { UK: 1n, AL: 5n }, penyebut: 6n },
    hanafi: { saham: { UK: 1n, AL: 5n }, penyebut: 6n }, maliki: sendiri } },
  { id: 'MZ4', kode: 'K03-1', menguji: 'umm abil jadd', graf: grafK03_1b, harapan: {
    syafii: { saham: { UKB: 1n, AL: 5n }, penyebut: 6n }, hanafi: { saham: { UKB: 1n, AL: 5n }, penyebut: 6n },
    hanbali: sendiri, maliki: sendiri } },
  { id: 'MZ5', kode: 'K04-3', menguji: 'nenek dua qarabah', graf: grafK04_3, harapan: {
    syafii: { saham: { G: 1n, AL: 5n }, penyebut: 6n },
    hanbali: 'TIDAK_DIDUKUNG', hanafi: 'TIDAK_DIDUKUNG', maliki: 'TIDAK_DIDUKUNG' } },
  { id: 'MZ6', kode: 'K04-3', menguji: 'nenek dua qarabah, pihak yang sama', graf: grafK04_3SatuPihak, harapan: {
    syafii: { saham: { G: 1n, AL: 5n }, penyebut: 6n }, maliki: { saham: { G: 1n, AL: 5n }, penyebut: 6n },
    hanbali: 'TIDAK_DIDUKUNG', hanafi: 'TIDAK_DIDUKUNG' } },
  { id: 'MZ7', kode: 'R03-5', menguji: 'jalur terpendek fasidah, jalur lain shahihah', graf: grafNenekJalurKedua, harapan: {
    syafii: { saham: { G: 1n, AL: 5n }, penyebut: 6n },
    hanbali: 'TIDAK_DIDUKUNG', hanafi: 'TIDAK_DIDUKUNG', maliki: 'TIDAK_DIDUKUNG' } },
];

// ─── K07-1: suami, ibu, 2 saudara seibu, saudara lk kandung (bab 7 contoh) ───
// [SYF]/[MLK] tasyrik: ashl 6 → tashih 18: suami 9, ibu 3, tiap saudara (3 orang) 2.
// [HNB]/[HNF] tanpa tasyrik: suami 3, ibu 1, tiap saudara seibu 1, saudara kandung 0 (ashl 6).
const grafK07_1: GrafKeluarga = {
  idPewaris: 'PW',
  orang: {
    PW: p('PW', 'P', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }),
    A: p('A', 'L', penghubung),
    AT: p('AT', 'L', penghubung),
    I: p('I', 'P'),
    H: p('H', 'L'),
    SI1: p('SI1', 'L', { idAyah: 'AT', idIbu: 'I' }),
    SI2: p('SI2', 'P', { idAyah: 'AT', idIbu: 'I' }),
    SK: p('SK', 'L', { idAyah: 'A', idIbu: 'I' }),
  },
  pernikahan: [{ idSuami: 'H', idIstri: 'PW', status: 'utuh' }],
};

export const KASUS_MUSYARRAKAH: KasusMadzhab[] = [
  { id: 'MZ8', kode: 'K07-1', menguji: 'musyarrakah', graf: grafK07_1, harapan: {
    syafii: { saham: { H: 9n, I: 3n, SI1: 2n, SI2: 2n, SK: 2n }, penyebut: 18n },
    maliki: { saham: { H: 9n, I: 3n, SI1: 2n, SI2: 2n, SK: 2n }, penyebut: 18n },
    hanbali: { saham: { H: 3n, I: 1n, SI1: 1n, SI2: 1n }, penyebut: 6n },
    hanafi: { saham: { H: 3n, I: 1n, SI1: 1n, SI2: 1n }, penyebut: 6n } } },
];

export const KASUS_MADZHAB: KasusMadzhab[] = [...KASUS_NENEK, ...KASUS_MUSYARRAKAH];
