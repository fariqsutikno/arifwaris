import { describe, expect, test } from 'vitest';
import { hitungGharqa } from '../gharqa.js';
import { hitungTaqdir } from '../taqdir.js';
import type { GrafKeluarga, HartaGharqa, HasilGharqa, InputGharqa, Ruleset } from '../types.js';
import { input, p } from './fixtures/bab16.js';
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

// 13.0b: kelompok gharqa + haml/mafqud/khuntsa dalam satu kasus → taqdir gabungan.
describe('Gharqa × taqdir (13.0b)', () => {
  // Istri 'Amr sedang mengandung anak 'Amr; paman mafqud.
  const grafHaml: GrafKeluarga = { ...grafG1, orang: { ...grafG1.orang, JANIN: p('JANIN', 'L', { idAyah: 'AMR', idIbu: 'AW', statusHidup: 'dalamKandungan' }) } };
  const grafMafqud: GrafKeluarga = { ...grafG1, orang: { ...grafG1.orang, PAMAN: { ...grafG1.orang.PAMAN!, statusHidup: 'mafqud' } } };
  const jumlah = (saham: Record<string, bigint>) => Object.values(saham).reduce((a, b) => a + b, 0n);
  const periksaHarta = (harta: HartaGharqa) => expect(jumlah(harta.saham) + harta.mauquf, "Σ saham + mauquf = jami'ah").toBe(harta.jamiah);

  test('[SYF] terpisah + haml: harta tiap anggota = hitungTaqdir dengan anggota itu sebagai pewaris', () => {
    const dasar = { ...input(grafHaml), ruleset: 'syafii' as const };
    const hasil = ok(hitungGharqa({ dasar, anggota: ['ZAID', 'AMR', 'BAKR'], keadaan: 'tidakDiketahui' }));
    for (const harta of hasil.harta) {
      const tunggal = hitungTaqdir({ ...dasar, graf: { ...grafHaml, idPewaris: harta.mayit } });
      if (tunggal.status !== 'OK') throw new Error(tunggal.status);
      expect(harta.saham).toEqual(tunggal.diberikan);
      expect(harta.mauquf).toBe(tunggal.mauquf);
      expect(harta.daftarDunia).toHaveLength(6);
      periksaHarta(harta);
    }
    expect(hasil.harta[1]!.mauquf > 0n).toBe(true);
  });

  test('[SYF] keadaan 3 + mafqud: tiap skenario urutan memuat harta dengan bagian paman ditahan', () => {
    const hasil = hitungGharqa({ dasar: { ...input(grafMafqud), ruleset: 'syafii' }, anggota: ['ZAID', 'AMR'], keadaan: 'terlupakan' });
    if (hasil.status !== 'MAUQUF') throw new Error(hasil.status);
    for (const harta of hasil.skenario.flatMap(skenario => skenario.harta)) {
      expect(harta.saham.PAMAN ?? 0n).toBe(0n);
      expect(harta.mauquf > 0n).toBe(true);
      periksaHarta(harta);
    }
  });

  test('[HNB] tilad + haml: 6 taqdir haml di tiap harta, tharif tetap digabung', () => {
    const hasil = ok(hitungGharqa({ dasar: { ...input(grafHaml), ruleset: 'hanbali' }, anggota: ['ZAID', 'AMR', 'BAKR'], keadaan: 'tidakDiketahui' }));
    expect(hasil.metode).toBe('tilad');
    for (const harta of hasil.harta) {
      expect(harta.daftarDunia).toHaveLength(6);
      periksaHarta(harta);
    }
    expect(hasil.harta[1]!.mauquf > 0n).toBe(true);
  });

  test('[MLK] + haml: harta ditandai mauquf semua, bukan menggagalkan seluruh gharqa [K13a-2]', () => {
    const { AD1: _a, AD2: _b, ZD: _c, ...orang } = grafHaml.orang;
    const hasil = ok(hitungGharqa({ dasar: { ...input({ ...grafHaml, orang }), ruleset: 'maliki' }, anggota: ['ZAID', 'AMR', 'BAKR'], keadaan: 'tidakDiketahui' }));
    for (const harta of hasil.harta) expect(harta.mauqufSemua?.refs).toEqual(['K13a-2']);
  });

  test('tanpa ketidakpastian: mauquf 0 dan tanpa daftar dunia', () => {
    for (const harta of ok(gharqa('syafii')).harta) {
      expect(harta.mauquf).toBe(0n);
      expect(harta.daftarDunia).toBeUndefined();
    }
  });
});
