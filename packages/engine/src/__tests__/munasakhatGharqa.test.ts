import { describe, expect, test } from 'vitest';
import { hitungMunasakhat } from '../munasakhat.js';
import type { HasilMunasakhat, InputMunasakhat } from '../types.js';
import { input } from './fixtures/bab16.js';
import { grafAnakBersaudara } from './fixtures/munasakhatGharqa.js';

type Ok = Extract<HasilMunasakhat, { status: 'OK' }>;

function ok(masukan: InputMunasakhat): Ok {
  const hasil = hitungMunasakhat(masukan);
  if (hasil.status !== 'OK') throw new Error(`${hasil.status}: ${JSON.stringify(hasil)}`);
  return hasil;
}

const serentak = (anggota = ['B', 'C']) => ({ anggota, keadaan: 'serentak' as const });

describe('Kelompok gharqa sebagai langkah munasakhat [R12-6]', () => {
  test('MG1 [SYF] serentak: B dan C tidak saling mewarisi [R12-6]', () => {
    const hasil = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak()] });
    expect(hasil.jamiah).toBe(16n);
    expect(hasil.saham).toEqual({ WB: 1n, SB: 10n, WC: 1n, DC: 4n });
    expect(hasil.jejak).toContainEqual(expect.objectContaining({ jenis: 'MANI', mani: 'istibham', idOrang: 'C' }));
  });
  test('urutan anggota tidak mengubah hasil', () => {
    const a = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(['B', 'C'])] });
    const b = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(['C', 'B'])] });
    expect(b.saham).toEqual(a.saham);
  });
  test('MG6 pembanding: rantai biasa C lalu B memberi B bagian dari C', () => {
    const hasil = ok({ dasar: input(grafAnakBersaudara), urutanWafat: ['C', 'B'] });
    expect(hasil.saham).toEqual({ WC: 8n, DC: 32n, WB: 11n, SB: 77n });
  });
  test('MG3 [HNB] tilad–tharif di tengah rantai [R13-19]', () => {
    const hasil = ok({ dasar: { ...input(grafAnakBersaudara), ruleset: 'hanbali' }, urutanWafat: [{ anggota: ['B', 'C'], keadaan: 'tidakDiketahui' }] });
    expect(hasil.jamiah).toBe(128n);
    expect(hasil.saham).toEqual({ WB: 11n, SB: 77n, WC: 8n, DC: 32n });
  });
  test('MG4 campuran: kelompok lalu satu orang', () => {
    const hasil = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(), 'DC'] });
    expect(hasil.jamiah).toBe(48n);
    expect(hasil.saham).toEqual({ WB: 3n, SB: 38n, WC: 7n });
  });
  test('anggota tanpa bagian dilewati [R12-1]', () => {
    const hasil = ok({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(['B', 'SB'])] });
    expect(hasil.daftarLangkah.map(langkah => langkah.mayit)).toEqual(['A', 'B']);
    expect(hasil.jejak).toContainEqual({ tahap: 'munasakhat', refs: ['R12-1'], jenis: 'MUNASAKHAT_DILEWATI', mayit: 'SB' });
  });
  test('kelompok satu orang → PERLU_INPUT', () => {
    expect(hitungMunasakhat({ dasar: input(grafAnakBersaudara), urutanWafat: [serentak(['B'])] }).status).toBe('PERLU_INPUT');
  });
  test('orang tercatat dua kali → throw', () => {
    expect(() => hitungMunasakhat({ dasar: input(grafAnakBersaudara), urutanWafat: ['B', serentak()] })).toThrow('tercatat wafat dua kali');
  });
});
