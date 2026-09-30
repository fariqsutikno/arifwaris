/**
 * Fixture regression dzawil arham (bab 14) — dibuat SEBELUM logika. Harapan = saham akhir per orang (> 0)
 * terhadap `penyebut`; dibandingkan sebagai pecahan kecuali `penyebutEksak`.
 */
import type { GrafKeluarga, InputEngine, KonfigurasiMadzhab, Ruleset } from '../../types.js';
import { case24, input, p } from './bab16.js';

export interface FixtureDzawilArham {
  id: string;
  sumber: string;
  menguji: string;
  input: InputEngine;
  harapan:
    | { status: 'OK'; saham: Record<string, bigint>; penyebut: bigint; penyebutEksak?: boolean; dikecualikan?: string[]; jenisJejak?: string[] }
    | { status: 'TIDAK_DIDUKUNG'; refs: string[] }
    | { status: 'PERLU_INPUT'; isian: string[] };
}

const penghubung = { statusHidup: 'wafat' as const, penghubung: true };
const RADD: KonfigurasiMadzhab = { kebijakanSisa: 'radd', talakBainSaatMaradh: 'qaulJadid' };
const BAITUL_MAL: KonfigurasiMadzhab = { kebijakanSisa: 'baitulMal', talakBainSaatMaradh: 'qaulJadid' };
const dengan = (graf: GrafKeluarga, ruleset: Ruleset = 'syafii', konfigurasi: KonfigurasiMadzhab = RADD): InputEngine =>
  ({ ...input(graf, konfigurasi), ruleset });

/** Pewaris lk D dengan ayah F1 & ibu M1 (keduanya wafat). */
const keluargaInti = {
  D: p('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }),
  F1: p('F1', 'L', penghubung),
  M1: p('M1', 'P', penghubung),
};

// 14.6 #1: anak pr saudara lk kandung / seibu / sebapak → sebagai saudara kandung (ashabah), seibu (1/6), sebapak (terhijab).
export const grafDA02: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    FX: p('FX', 'L', penghubung), MX: p('MX', 'P', penghubung),
    SK: p('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    SI: p('SI', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    SB: p('SB', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'MX' }),
    A1: p('A1', 'P', { idAyah: 'SK' }),
    A2: p('A2', 'P', { idAyah: 'SI' }),
    A3: p('A3', 'P', { idAyah: 'SB' }),
  },
  pernikahan: [],
};

// 14.6 #3: anak pr dari anak pr dari anak pr (X1, 2 langkah) vs anak pr dari bint ibn ibn (X2, 1 langkah) → semua X2.
export const grafDA03: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat' }),
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    APP: p('APP', 'P', { ...penghubung, idIbu: 'AP' }),
    X1: p('X1', 'P', { idIbu: 'APP' }),
    S: p('S', 'L', { ...penghubung, idAyah: 'D' }),
    SS: p('SS', 'L', { ...penghubung, idAyah: 'S' }),
    SSD: p('SSD', 'P', { ...penghubung, idAyah: 'SS' }),
    X2: p('X2', 'P', { idIbu: 'SSD' }),
  },
  pernikahan: [],
};

// 14.6 #4: ayahnya ibu, anak pr saudari seibu / kandung / sebapak → ibu 1/6, seibu 1/6, kandung 1/2, sebapak 1/6.
export const grafDA04: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF' }),
    MGF: p('MGF', 'L'),
    FX: p('FX', 'L', penghubung), MX: p('MX', 'P', penghubung),
    SiI: p('SiI', 'P', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    SiB: p('SiB', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'MX' }),
    B1: p('B1', 'P', { idIbu: 'SiI' }),
    B2: p('B2', 'P', { idIbu: 'SiK' }),
    B3: p('B3', 'P', { idIbu: 'SiB' }),
  },
  pernikahan: [],
};

// 14.4: cicit pr dari anak pr (bunuwwah, 2 langkah) + anak pr saudara lk kandung (ubuwwah) → masing-masing 1/2.
export const grafDA05: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    Q: p('Q', 'P', { ...penghubung, idIbu: 'AP' }),
    X1: p('X1', 'P', { idIbu: 'Q' }),
    SK: p('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X2: p('X2', 'P', { idAyah: 'SK' }),
  },
  pernikahan: [],
};

// 14.7 (Lahim hlm. 222): 'ammah kandung (→ ayah), anak lk saudari kandung (→ saudari, terhijab ayah), anak lk anak pr (→ anak pr).
export const grafDA06: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    F1: p('F1', 'L', { ...penghubung, idAyah: 'PGF', idIbu: 'PGM' }),
    PGF: p('PGF', 'L', penghubung), PGM: p('PGM', 'P', penghubung),
    AM1: p('AM1', 'P', { idAyah: 'PGF', idIbu: 'PGM' }),
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    NS: p('NS', 'L', { idIbu: 'SiK' }),
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    NP: p('NP', 'L', { idIbu: 'AP' }),
  },
  pernikahan: [],
};

// 14.8 (dikoreksi di Task 1): Z = anak lk dari anak lk saudari kandung (pihak ayah Z) sekaligus anak lk dari anak pr
// saudara seibu (pihak ibu Z); Y = cucu lk saudari sebapak. Mas'alah 5: Z = 3 + 1, Y = 1.
export const grafDA07: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    FX: p('FX', 'L', penghubung), MX: p('MX', 'P', penghubung),
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    AZ: p('AZ', 'L', { ...penghubung, idIbu: 'SiK' }),
    SI: p('SI', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    IZ: p('IZ', 'P', { ...penghubung, idAyah: 'SI' }),
    Z: p('Z', 'L', { idAyah: 'AZ', idIbu: 'IZ' }),
    SiB: p('SiB', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'MX' }),
    AY: p('AY', 'L', { ...penghubung, idIbu: 'SiB' }),
    Y: p('Y', 'L', { idAyah: 'AY' }),
  },
  pernikahan: [],
};

// 14.9: suami + anak lk anak pr → 2: 1, 1.
export const grafDA08: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'P', { statusHidup: 'wafat' }),
    H: p('H', 'L'),
    AP: p('AP', 'P', { ...penghubung, idIbu: 'D', idAyah: 'H' }),
    X: p('X', 'L', { idIbu: 'AP' }),
  },
  pernikahan: [{ idSuami: 'H', idIstri: 'D', status: 'utuh' }],
};

// 14.9: istri + anak saudari kandung → 4: 1, 3.
export const grafDA09: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    W: p('W', 'P'),
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X: p('X', 'L', { idIbu: 'SiK' }),
  },
  pernikahan: [{ idSuami: 'D', idIstri: 'W', status: 'utuh' }],
};

// 14.9: 4 istri + anak pr saudara kandung → 16: tiap istri 1, anak pr saudara 12.
export const grafDA10: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    W1: p('W1', 'P'), W2: p('W2', 'P'), W3: p('W3', 'P'), W4: p('W4', 'P'),
    SK: p('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X: p('X', 'P', { idAyah: 'SK' }),
  },
  pernikahan: ['W1', 'W2', 'W3', 'W4'].map(idIstri => ({ idSuami: 'D', idIstri, status: 'utuh' as const })),
};

// K14-3: anak lk & anak pr dari anak pr. [SYF] 2:1; [HNB] sama rata.
export const grafDA11: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat' }),
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    XL: p('XL', 'L', { idIbu: 'AP' }),
    XP: p('XP', 'P', { idIbu: 'AP' }),
  },
  pernikahan: [],
};

// K14-3 pengecualian [HNB]: khal & khalah kandung → 2:1 (Mughni 6/324); [SYF] juga 2:1 (saudara kandung ibu).
export const grafDA12: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF', idIbu: 'MGM' }),
    MGF: p('MGF', 'L', penghubung), MGM: p('MGM', 'P', penghubung),
    KH: p('KH', 'L', { idAyah: 'MGF', idIbu: 'MGM' }),
    KL: p('KL', 'P', { idAyah: 'MGF', idIbu: 'MGM' }),
  },
  pernikahan: [],
};

// K14-3 [HNB]: khal kandung + khalah seibu (lintas kelompok di bawah ibu) → belum didukung.
export const grafDA12KandungSeibu: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF', idIbu: 'MGM' }),
    MGF: p('MGF', 'L', penghubung), MGM: p('MGM', 'P', penghubung), MGX: p('MGX', 'L', penghubung),
    KH: p('KH', 'L', { idAyah: 'MGF', idIbu: 'MGM' }),
    KL: p('KL', 'P', { idAyah: 'MGX', idIbu: 'MGM' }),
  },
  pernikahan: [],
};

// K14-3 [HNB]: khal seibu + khalah seibu (satu kelompok, tetapi seibu) → belum didukung.
export const grafDA12Seibu: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF', idIbu: 'MGM' }),
    MGF: p('MGF', 'L', penghubung), MGM: p('MGM', 'P', penghubung), MGX: p('MGX', 'L', penghubung),
    KH: p('KH', 'L', { idAyah: 'MGX', idIbu: 'MGM' }),
    KL: p('KL', 'P', { idAyah: 'MGX', idIbu: 'MGM' }),
  },
  pernikahan: [],
};

// Mawani': anak lk saudari non-muslim tidak menempati kursi perantara; anak pr saudara lk mengambil semua.
export const grafDA14: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    NS: p('NS', 'L', { idIbu: 'SiK', agama: 'nonIslam' }),
    SK: p('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X: p('X', 'P', { idAyah: 'SK' }),
  },
  pernikahan: [],
};

// 'Aul 6 → 7 [R14-13]: anak dua saudari kandung (2/3), anak dua saudara seibu (1/3), khalah (ibu 1/6).
export const grafDA16: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    M1: p('M1', 'P', { ...penghubung, idAyah: 'MGF' }),
    MGF: p('MGF', 'L', penghubung),
    FX: p('FX', 'L', penghubung),
    SiK1: p('SiK1', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    SiK2: p('SiK2', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    SI1: p('SI1', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    SI2: p('SI2', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    N1: p('N1', 'L', { idIbu: 'SiK1' }), N2: p('N2', 'L', { idIbu: 'SiK2' }),
    N3: p('N3', 'L', { idAyah: 'SI1' }), N4: p('N4', 'L', { idAyah: 'SI2' }),
    KL: p('KL', 'P', { idAyah: 'MGF' }),
  },
  pernikahan: [],
};

// Mawani': istri + anak lk saudari kandung non-muslim → tidak ada dzawil arham yang sah; sisa ke baitul mal [R02-1].
export const grafDA17: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    W: p('W', 'P'),
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    X: p('X', 'L', { idIbu: 'SiK', agama: 'nonIslam' }),
  },
  pernikahan: [{ idSuami: 'D', idIstri: 'W', status: 'utuh' }],
};

// [R14-8] anak lk & anak pr dari anak pr saudari seibu: di bawah perantara seibu sama rata, walau turunnya rekursif.
export const grafDA18: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    FX: p('FX', 'L', penghubung), QH: p('QH', 'L', penghubung),
    SI: p('SI', 'P', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
    Q: p('Q', 'P', { ...penghubung, idIbu: 'SI' }),
    XL: p('XL', 'L', { idAyah: 'QH', idIbu: 'Q' }),
    XP: p('XP', 'P', { idAyah: 'QH', idIbu: 'Q' }),
  },
  pernikahan: [],
};

// K14-3 [HNB] "sama rata bila ayah dan ibunya sama": anak dari anak pr, satu ibu beda ayah → belum didukung.
export const grafDA11BedaAyah: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...grafDA11.orang,
    H1: p('H1', 'L', penghubung), H2: p('H2', 'L', penghubung),
    XL: p('XL', 'L', { idAyah: 'H1', idIbu: 'AP' }),
    XP: p('XP', 'P', { idAyah: 'H2', idIbu: 'AP' }),
  },
  pernikahan: [],
};

// Terhijab di dalam cabang perantara: di bawah anak pr AP, cucu pr-nya (SD, ahli waris AP) mendahului anak lk anak pr-nya (DS).
export const grafDA19: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { statusHidup: 'wafat' }),
    AP: p('AP', 'P', { ...penghubung, idAyah: 'D' }),
    AS: p('AS', 'L', { ...penghubung, idIbu: 'AP' }),
    AD: p('AD', 'P', { ...penghubung, idIbu: 'AP' }),
    SD: p('SD', 'P', { idAyah: 'AS' }),
    DS: p('DS', 'L', { idIbu: 'AD' }),
  },
  pernikahan: [],
};

// Satu orang dua jalur dalam jihah ubuwwah: lewat saudari kandung (2 langkah) dan saudara kandung (3 langkah).
export const grafDA20: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    ...keluargaInti,
    SiK: p('SiK', 'P', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    AZ: p('AZ', 'L', { ...penghubung, idIbu: 'SiK' }),
    SK: p('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }),
    Q: p('Q', 'P', { ...penghubung, idAyah: 'SK' }),
    IZ: p('IZ', 'P', { ...penghubung, idIbu: 'Q' }),
    Z: p('Z', 'L', { idAyah: 'AZ', idIbu: 'IZ' }),
  },
  pernikahan: [],
};

export const DZAWIL_ARHAM_FIXTURES: FixtureDzawilArham[] = [
  { id: 'DA-01', sumber: '16 #24, 14.6', menguji: "khalah (→ ibu) & 'ammah (→ ayah)", input: case24.input,
    harapan: { status: 'OK', saham: { KL1: 1n, AM1: 2n }, penyebut: 3n, jenisJejak: ['DZAWIL_ARHAM_TANZIL', 'DZAWIL_ARHAM_MASALAH_PERANTARA'] } },
  { id: 'DA-02', sumber: '14.6 #1', menguji: 'hajb antar-perantara lewat pipeline', input: dengan(grafDA02),
    harapan: { status: 'OK', saham: { A1: 5n, A2: 1n }, penyebut: 6n, dikecualikan: ['A3'] } },
  { id: 'DA-03', sumber: '14.6 #3', menguji: 'yang lebih dulu sampai ke ahli waris menang [R14-7]', input: dengan(grafDA03),
    harapan: { status: 'OK', saham: { X2: 1n }, penyebut: 1n, dikecualikan: ['X1'], jenisJejak: ['DZAWIL_ARHAM_TERHIJAB_JIHAH'] } },
  { id: 'DA-04', sumber: '14.6 #4', menguji: 'empat perantara berfardh', input: dengan(grafDA04),
    harapan: { status: 'OK', saham: { MGF: 1n, B1: 1n, B2: 3n, B3: 1n }, penyebut: 6n } },
  { id: 'DA-05', sumber: '14.4', menguji: 'lintas jihah: jarak tidak berpengaruh', input: dengan(grafDA05),
    harapan: { status: 'OK', saham: { X1: 1n, X2: 1n }, penyebut: 2n } },
  { id: 'DA-06', sumber: '14.7', menguji: 'hajb antar-perantara lintas jihah', input: dengan(grafDA06),
    harapan: { status: 'OK', saham: { AM1: 1n, NP: 1n }, penyebut: 2n, dikecualikan: ['NS'] } },
  { id: 'DA-07', sumber: '14.8', menguji: 'satu orang dua jalur [R14-11]', input: dengan(grafDA07),
    harapan: { status: 'OK', saham: { Z: 4n, Y: 1n }, penyebut: 5n, jenisJejak: ['DZAWIL_ARHAM_DUA_JALUR'] } },
  { id: 'DA-08', sumber: '14.9', menguji: 'suami + dzawil arham', input: dengan(grafDA08),
    harapan: { status: 'OK', saham: { H: 1n, X: 1n }, penyebut: 2n, penyebutEksak: true, jenisJejak: ['DZAWIL_ARHAM_GABUNG_PASANGAN'] } },
  { id: 'DA-09', sumber: '14.9', menguji: 'istri + dzawil arham', input: dengan(grafDA09),
    harapan: { status: 'OK', saham: { W: 1n, X: 3n }, penyebut: 4n, penyebutEksak: true } },
  { id: 'DA-10', sumber: '14.9', menguji: '4 istri + dzawil arham (tashih zaujiyyah)', input: dengan(grafDA10),
    harapan: { status: 'OK', saham: { W1: 1n, W2: 1n, W3: 1n, W4: 1n, X: 12n }, penyebut: 16n, penyebutEksak: true } },
  { id: 'DA-11', sumber: '14.5 (R14-8)', menguji: '[SYF] 2:1 di bawah perantara', input: dengan(grafDA11),
    harapan: { status: 'OK', saham: { XL: 2n, XP: 1n }, penyebut: 3n } },
  { id: 'DA-12', sumber: '14.5 (R14-8)', menguji: 'khal & khalah 2:1', input: dengan(grafDA12),
    harapan: { status: 'OK', saham: { KH: 2n, KL: 1n }, penyebut: 3n } },
  { id: 'DA-13', sumber: '14.3 (R14-5)', menguji: '[SYF] baitul mal tegak → tidak mewarisi', input: dengan(grafDA11, 'syafii', BAITUL_MAL),
    harapan: { status: 'TIDAK_DIDUKUNG', refs: ['R14-5'] } },
  { id: 'DA-14', sumber: '02 (R02-4)', menguji: 'mawani dzawil arham sebelum tanzil', input: dengan(grafDA14),
    harapan: { status: 'OK', saham: { X: 1n }, penyebut: 1n, jenisJejak: ['MANI'] } },
  { id: 'DA-15', sumber: '00 konvensi 4', menguji: 'agama dzawil arham belum diisi → tanya',
    input: dengan({ ...grafDA11, orang: { ...grafDA11.orang, XL: p('XL', 'L', { idIbu: 'AP', agama: 'tidakDiketahui' }) } }),
    harapan: { status: 'PERLU_INPUT', isian: ['agama'] } },
  { id: 'DA-16', sumber: '14.10 (R14-13)', menguji: "'aul 6 → 7", input: dengan(grafDA16),
    harapan: { status: 'OK', saham: { N1: 2n, N2: 2n, N3: 1n, N4: 1n, KL: 1n }, penyebut: 7n } },
  { id: 'DA-18', sumber: '14.5 (R14-8)', menguji: 'sama rata cabang seibu pada turun rekursif', input: dengan(grafDA18),
    harapan: { status: 'OK', saham: { XL: 1n, XP: 1n }, penyebut: 2n } },
  { id: 'DA-19', sumber: '14.5 (R14-7)', menguji: 'terhijab di dalam cabang perantara', input: dengan(grafDA19),
    harapan: { status: 'OK', saham: { SD: 1n }, penyebut: 1n, dikecualikan: ['DS'] } },
  { id: 'DA-20', sumber: '14.8 (R14-11)', menguji: 'dua jalur satu jihah: jalur terjauh gugur, bukan terhijab', input: dengan(grafDA20),
    harapan: { status: 'OK', saham: { Z: 1n }, penyebut: 1n } },
];

/** Kasus yang sama lintas madzhab (K14-1..3). */
export const KASUS_DZAWIL_ARHAM_MADZHAB: Array<{ id: string; graf: GrafKeluarga; konfigurasi?: KonfigurasiMadzhab;
  harapan: Partial<Record<Ruleset, FixtureDzawilArham['harapan']>> }> = [
  { id: 'K14-3 anak dari anak pr', graf: grafDA11, harapan: {
    hanbali: { status: 'OK', saham: { XL: 1n, XP: 1n }, penyebut: 2n, jenisJejak: ['KHILAF_MADZHAB'] },
    hanafi: { status: 'TIDAK_DIDUKUNG', refs: ['K14-2'] },
    maliki: { status: 'TIDAK_DIDUKUNG', refs: ['K14-2'] },
  } },
  { id: 'K14-3 khal & khalah', graf: grafDA12, harapan: {
    hanbali: { status: 'OK', saham: { KH: 2n, KL: 1n }, penyebut: 3n },
  } },
  { id: 'K14-3 khal kandung & khalah seibu', graf: grafDA12KandungSeibu, harapan: {
    hanbali: { status: 'TIDAK_DIDUKUNG', refs: ['K14-3'] },
  } },
  { id: 'K14-3 khal & khalah seibu', graf: grafDA12Seibu, harapan: {
    hanbali: { status: 'TIDAK_DIDUKUNG', refs: ['K14-3'] },
  } },
  { id: 'K14-3 satu ibu beda ayah', graf: grafDA11BedaAyah, harapan: {
    syafii: { status: 'OK', saham: { XL: 2n, XP: 1n }, penyebut: 3n },
    hanbali: { status: 'TIDAK_DIDUKUNG', refs: ['K14-3'] },
  } },
  { id: 'K14-3 cabang seibu rekursif', graf: grafDA18, harapan: {
    hanbali: { status: 'OK', saham: { XL: 1n, XP: 1n }, penyebut: 2n, jenisJejak: ['KHILAF_MADZHAB'] },
  } },
  { id: 'K14-1 maliki baitul mal', graf: grafDA11, konfigurasi: BAITUL_MAL, harapan: {
    maliki: { status: 'TIDAK_DIDUKUNG', refs: ['K14-1'] },
  } },
];

export { dengan };
