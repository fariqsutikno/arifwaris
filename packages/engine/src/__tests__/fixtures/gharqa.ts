// Fixture gharqa (13d.4), dipakai tes engine dan explain.
import type { GrafKeluarga } from '../../types.js';
import { p } from './bab16.js';

// G1 (13d.4, Lahim hlm. 111–118): tiga saudara lk sebapak Zaid, 'Amr, Bakr wafat dalam tabrakan; paman hidup.
// Zaid: ibu + anak pr. 'Amr: istri + 2 anak pr. Bakr: ibu + saudara seibu.
const wafat = (id: string, jenisKelamin: 'L' | 'P', extra = {}) => p(id, jenisKelamin, { statusHidup: 'wafat', ...extra });
export const grafG1: GrafKeluarga = {
  idPewaris: 'ZAID',
  orang: {
    KAKEK: wafat('KAKEK', 'L'), F: wafat('F', 'L', { idAyah: 'KAKEK' }), PAMAN: p('PAMAN', 'L', { idAyah: 'KAKEK' }),
    MZ: p('MZ', 'P'), MA: wafat('MA', 'P'), MB: p('MB', 'P'), Y: wafat('Y', 'L'),
    ZAID: wafat('ZAID', 'L', { idAyah: 'F', idIbu: 'MZ' }), ZD: p('ZD', 'P', { idAyah: 'ZAID' }),
    AMR: wafat('AMR', 'L', { idAyah: 'F', idIbu: 'MA' }), AW: p('AW', 'P'),
    AD1: p('AD1', 'P', { idAyah: 'AMR', idIbu: 'AW' }), AD2: p('AD2', 'P', { idAyah: 'AMR', idIbu: 'AW' }),
    BAKR: wafat('BAKR', 'L', { idAyah: 'F', idIbu: 'MB' }), SB: p('SB', 'L', { idAyah: 'Y', idIbu: 'MB' }),
  },
  pernikahan: [{ idSuami: 'AMR', idIstri: 'AW', status: 'utuh' }],
};
