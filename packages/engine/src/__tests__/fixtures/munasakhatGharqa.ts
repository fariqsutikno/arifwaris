/**
 * Fixture kelompok gharqa di tengah rantai munasakhat (KB bab 16: MG1, MG3, MG4, MG6).
 * `MA` = ibu A yang hanya penghubung (placeholder).
 */

import type { GrafKeluarga } from '../../types.js';
import { p } from './bab16.js';

export const grafAnakBersaudara: GrafKeluarga = {
  idPewaris: 'A',
  orang: {
    A: p('A', 'L', { statusHidup: 'wafat', idIbu: 'MA' }),
    MA: p('MA', 'P', { statusHidup: 'wafat', penghubung: true }),
    B: p('B', 'L', { idAyah: 'A', idIbu: 'MA' }),
    C: p('C', 'L', { idAyah: 'A', idIbu: 'MA' }),
    WB: p('WB', 'P'),
    SB: p('SB', 'L', { idAyah: 'B', idIbu: 'WB' }),
    WC: p('WC', 'P'),
    DC: p('DC', 'P', { idAyah: 'C', idIbu: 'WC' }),
  },
  pernikahan: [
    { idSuami: 'B', idIstri: 'WB', status: 'utuh' },
    { idSuami: 'C', idIstri: 'WC', status: 'utuh' },
  ],
};
