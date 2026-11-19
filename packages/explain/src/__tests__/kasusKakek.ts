// Tiga jalur kakek bersama saudara yang belum ada di fixture bab 16, disusun dari KB bab 08 (R08-2, R08-3, R08-4).
import type { GrafKeluarga, InputEngine } from '@waris/engine';
import { input, p } from '../../../engine/src/__tests__/fixtures/bab16.js';

const wafat = { statusHidup: 'wafat' as const };
const penghubung = { statusHidup: 'wafat' as const, penghubung: true };

/** Kakek + satu saudara laki-laki kandung, tanpa ashabul furudh: muqasamah [R08-2]. */
export const grafMuqasamah: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { ...wafat, idAyah: 'F1', idIbu: 'M1' }),
    F1: p('F1', 'L', { ...penghubung, idAyah: 'GF1' }),
    GF1: p('GF1', 'L'),
    M1: p('M1', 'P', penghubung),
    AK1: p('AK1', 'L', { idAyah: 'F1', idIbu: 'M1' }),
  },
  pernikahan: [],
};

/** Suami 1/2 + ibu 1/3 + kakek + saudara: sisa tinggal 1/6, kakek 1/6 dan saudara gugur [R08-3]. */
export const grafSisaSedikit: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'P', { ...wafat, idAyah: 'F1', idIbu: 'M1' }),
    H1: p('H1', 'L'),
    F1: p('F1', 'L', { ...penghubung, idAyah: 'GF1' }),
    GF1: p('GF1', 'L'),
    M1: p('M1', 'P'),
    AK1: p('AK1', 'L', { idAyah: 'F1', idIbu: 'M1' }),
  },
  pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
};

/** Kakek + saudara kandung + saudara sebapak: mu'addah [R08-4]. */
export const grafMuaddah: GrafKeluarga = {
  idPewaris: 'D',
  orang: {
    D: p('D', 'L', { ...wafat, idAyah: 'F1', idIbu: 'M1' }),
    F1: p('F1', 'L', { ...penghubung, idAyah: 'GF1' }),
    GF1: p('GF1', 'L'),
    M1: p('M1', 'P', penghubung),
    M2: p('M2', 'P', penghubung),
    AK1: p('AK1', 'L', { idAyah: 'F1', idIbu: 'M1' }),
    AS1: p('AS1', 'L', { idAyah: 'F1', idIbu: 'M2' }),
  },
  pernikahan: [],
};

export const KASUS_KAKEK: Array<{ id: string; menguji: string; input: InputEngine }> = [
  { id: 'KK-1', menguji: 'muqasamah', input: input(grafMuqasamah) },
  { id: 'KK-2', menguji: 'sisa sedikit', input: input(grafSisaSedikit) },
  { id: 'KK-3', menguji: "mu'addah", input: input(grafMuaddah) },
];
