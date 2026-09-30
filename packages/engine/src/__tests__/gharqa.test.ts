import { describe, expect, test } from 'vitest';
import { hitungGharqa } from '../gharqa.js';
import type { HasilGharqa, InputGharqa, Ruleset } from '../types.js';
import { input } from './fixtures/bab16.js';
import { grafG1 } from './fixtures/gharqa.js';

const gharqa = (ruleset: Ruleset, keadaan: InputGharqa['keadaan'] = 'tidakDiketahui', anggota = ['ZAID', 'AMR', 'BAKR']): HasilGharqa =>
  hitungGharqa({ dasar: { ...input(grafG1), ruleset }, anggota, keadaan });

function ok(hasil: HasilGharqa) {
  if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil, (_, nilai) => (typeof nilai === 'bigint' ? String(nilai) : nilai)));
  return hasil;
}
const positif = (saham: Record<string, bigint>) => Object.fromEntries(Object.entries(saham).filter(([, nilai]) => nilai > 0n));

describe('Gharqa bab 13d', () => {
  test('G1 [HNB] tilad–tharif: Zaid 144, \'Amr 288, Bakr 72 [R13-19]', () => {
    const hasil = ok(gharqa('hanbali'));
    expect(hasil.metode).toBe('tilad');
    const [zaid, amr, bakr] = hasil.harta;
    expect(zaid!.jamiah).toBe(144n);
    expect(positif(zaid!.saham)).toEqual({ MZ: 24n, ZD: 72n, PAMAN: 17n, AW: 3n, AD1: 8n, AD2: 8n, MB: 8n, SB: 4n });
    expect(amr!.jamiah).toBe(288n);
    expect(bakr!.jamiah).toBe(72n);
  });

  test('G1 [SYF] tidak saling mewarisi: tiap harta untuk ahli waris yang hidup saja [R13-10]', () => {
    const hasil = ok(gharqa('syafii'));
    expect(hasil.metode).toBe('terpisah');
    const zaid = hasil.harta[0]!;
    expect(positif(zaid.saham)).toEqual({ MZ: zaid.jamiah / 6n, ZD: zaid.jamiah / 2n, PAMAN: zaid.jamiah / 3n });
    expect(zaid.jejak.some(langkah => langkah.jenis === 'MANI' && langkah.mani === 'istibham')).toBe(true);
  });

  test('keadaan serentak: [HNB] pun tidak saling mewarisi (ijma\')', () => {
    expect(ok(gharqa('hanbali', 'serentak')).metode).toBe('terpisah');
  });

  test('[SYF] keadaan 3 (terlupakan) → MAUQUF dengan skenario tiap urutan', () => {
    const hasil = gharqa('syafii', 'terlupakan', ['ZAID', 'AMR']);
    if (hasil.status !== 'MAUQUF') throw new Error(hasil.status);
    expect(hasil.skenario.map(skenario => skenario.urutan)).toEqual([['ZAID', 'AMR'], ['AMR', 'ZAID']]);
    // Zaid wafat lebih dulu: 'Amr mewarisi sepertiga Zaid bersama Bakr? Bakr wafat → 'Amr sendirian dapat 1/3, diteruskan ke ahli warisnya.
    const hartaZaid = hasil.skenario[0]!.harta[0]!;
    expect(hartaZaid.saham.AMR).toBeUndefined();
    expect(hartaZaid.saham.AW! > 0n).toBe(true);
  });

  test('[HNF]/[MLK] keadaan 3 → terpisah (K13d-1)', () => {
    // Tanpa anak pr para anggota: bagi anggota lain mereka dzawil arham, dan R14-4 belum dikaji untuk [HNF]/[MLK] (18.4).
    const { AD1: _a, AD2: _b, ZD: _c, ...orang } = grafG1.orang;
    for (const ruleset of ['hanafi', 'maliki'] as const) {
      const hasil = hitungGharqa({ dasar: { ...input({ ...grafG1, orang }), ruleset }, anggota: ['ZAID', 'AMR', 'BAKR'], keadaan: 'terlupakan' });
      expect(ok(hasil).metode).toBe('terpisah');
    }
  });

  test('anggota yang masih hidup → PERLU_INPUT', () => {
    expect(gharqa('syafii', 'tidakDiketahui', ['ZAID', 'PAMAN']).status).toBe('PERLU_INPUT');
  });

  test('Σ saham = jami\'ah di tiap harta', () => {
    for (const ruleset of ['syafii', 'hanbali'] as const) {
      for (const harta of ok(gharqa(ruleset)).harta) {
        expect(Object.values(harta.saham).reduce((a, b) => a + b, 0n)).toBe(harta.jamiah);
      }
    }
  });
});
