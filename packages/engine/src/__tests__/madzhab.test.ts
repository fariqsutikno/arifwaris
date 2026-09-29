import { describe, expect, test } from 'vitest';
import { hitung } from '../pipeline.js';
import { hitungMunasakhat } from '../munasakhat.js';
import type { InputEngine } from '../types.js';
import { BAB16_FIXTURES, input, p } from './fixtures/bab16.js';
import { M2 } from './fixtures/munasakhat.js';
import { KASUS_MADZHAB } from './fixtures/madzhab.js';
import { periksaInvarian } from './invarian.property.test.js';

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

function sahamAkhir(hasil: Extract<ReturnType<typeof hitung>, { status: 'OK' }>) {
  const { totalKolom, baris } = hasil.tabel;
  const penyebut = totalKolom.tashih ?? totalKolom.radd ?? totalKolom.aul ?? totalKolom.ashl!;
  const saham = Object.fromEntries(baris.flatMap(b => Object.entries(b.perOrang)).filter(([, sel]) => sel.saham > 0n).map(([id, sel]) => [id, sel.saham]));
  return { saham, penyebut };
}

describe('Overlay madzhab — kasus bab 18.2', () => {
  for (const kasus of KASUS_MADZHAB) {
    for (const [ruleset, harapan] of Object.entries(kasus.harapan)) {
      test(`${kasus.id} ${kasus.kode} ${kasus.menguji} [${ruleset}]`, () => {
        const hasil = hitung({ ...input(kasus.graf), ruleset: ruleset as InputEngine['ruleset'] });
        if (harapan === 'TIDAK_DIDUKUNG') { expect(hasil.status).toBe('TIDAK_DIDUKUNG'); return; }
        if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
        periksaInvarian(kasus.graf, hasil);
        expect(sahamAkhir(hasil)).toEqual(harapan);
      });
    }
  }
});

describe('Jejak KHILAF_MADZHAB', () => {
  const khilaf = (id: string, ruleset: InputEngine['ruleset']) => {
    const hasil = hitung(denganRuleset(input(KASUS_MADZHAB.find(kasus => kasus.id === id)!.graf), ruleset));
    return hasil.status === 'OK' ? hasil.jejak.flatMap(l => (l.jenis === 'KHILAF_MADZHAB' ? [`${l.kode}:${l.idOrang.join(',')}`] : [])) : [];
  };

  test.each([
    ['MZ1', 'hanbali', ['K04-2:NA']],
    ['MZ2', 'hanbali', ['K04-1:N3']],
    ['MZ3', 'maliki', ['K03-1:UK']],
    ['MZ4', 'hanbali', ['K03-1:UKB']],
    ['MZ8', 'hanafi', ['K07-1:SK']],
    ['MZ9', 'hanafi', ['K05-1:SK']],
    ['MZ11', 'hanafi', ['K05-1:SK', 'K05-1:SB']],
  ] as const)('%s [%s] memancarkan %j', (id, ruleset, harapan) => {
    expect(khilaf(id, ruleset).sort()).toEqual([...harapan].sort());
  });

  test('[SYF] tidak pernah memancarkan KHILAF_MADZHAB', () => {
    for (const kasus of KASUS_MADZHAB) expect(khilaf(kasus.id, 'syafii'), kasus.id).toEqual([]);
  });
});
