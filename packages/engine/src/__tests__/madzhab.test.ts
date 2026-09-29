import { describe, expect, test } from 'vitest';
import { hitung } from '../pipeline.js';
import { hitungMunasakhat } from '../munasakhat.js';
import type { InputEngine } from '../types.js';
import { BAB16_FIXTURES, input, p } from './fixtures/bab16.js';
import { M2 } from './fixtures/munasakhat.js';

const denganRuleset = (dasar: InputEngine, ruleset: InputEngine['ruleset']): InputEngine => ({ ...dasar, ruleset });

describe('Kerangka ruleset', () => {
  test('[SYF] eksplisit = hasil lama untuk semua fixture bab 16', () => {
    for (const fixture of BAB16_FIXTURES) {
      expect(hitung(denganRuleset(fixture.input, 'syafii'))).toEqual(hitung(fixture.input));
    }
  });

  test('gerbang: pembunuh di mode [HNB] → TIDAK_DIDUKUNG dengan token R02-9 (K02-1 ditunda)', () => {
    const graf = {
      idPewaris: 'PW',
      orang: {
        PW: p('PW', 'L', { statusHidup: 'wafat' }),
        AL: p('AL', 'L', { idAyah: 'PW' }),
        AL2: p('AL2', 'L', { idAyah: 'PW', membunuhPewaris: true }),
      },
      pernikahan: [],
    };
    expect(hitung(denganRuleset(input(graf), 'hanbali'))).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: expect.arrayContaining(['R02-9']) });
    expect(hitung(input(graf)).status).toBe('OK');
  });

  test('konfigurasi tidak sah: baitulMal di [HNB] → TIDAK_DIDUKUNG K09-1', () => {
    const graf = { idPewaris: 'PW', orang: { PW: p('PW', 'L', { statusHidup: 'wafat' }), AL: p('AL', 'L', { idAyah: 'PW' }) }, pernikahan: [] };
    const hasil = hitung({ ...input(graf, { kebijakanSisa: 'baitulMal', talakBainSaatMaradh: 'qaulJadid' }), ruleset: 'hanbali' });
    expect(hasil).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['K09-1'] });
  });

  test("konfigurasi tidak sah: qaul qadim talak ba'in di luar [SYF] → TIDAK_DIDUKUNG K02-3", () => {
    const graf = { idPewaris: 'PW', orang: { PW: p('PW', 'L', { statusHidup: 'wafat' }), AL: p('AL', 'L', { idAyah: 'PW' }) }, pernikahan: [] };
    const hasil = hitung({ ...input(graf, { kebijakanSisa: 'radd', talakBainSaatMaradh: 'qaulQadim' }), ruleset: 'maliki' });
    expect(hasil).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['K02-3'] });
  });

  test('munasakhat meneruskan ruleset ke tiap mayit', () => {
    const hasil = hitungMunasakhat({ ...M2.input, dasar: denganRuleset(M2.input.dasar, 'hanbali') });
    if (hasil.status === 'OK') {
      expect(hasil.daftarLangkah.every(langkah => langkah.hasil.ruleset === 'hanbali')).toBe(true);
    } else {
      expect(hasil.status).toBe('TIDAK_DIDUKUNG');
    }
  });
});
