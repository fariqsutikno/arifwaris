import { describe, expect, test } from 'vitest';
import type { LangkahJejak } from '@waris/engine';
import { namaKasusDariJejak, pecahXp } from '../index.js';

const langkah = (isi: unknown) => isi as LangkahJejak;

describe('namaKasusDariJejak', () => {
  test('jejak tanpa kasus bernama → kosong', () => expect(namaKasusDariJejak([])).toEqual([]));
  test("'aul + akdariyyah, urutan tampil tetap", () => {
    const jejak = [langkah({ jenis: 'AUL', dari: 6n, menjadi: 9n }), langkah({ jenis: 'KASUS_KHUSUS', nama: 'akdariyyah' })];
    expect(namaKasusDariJejak(jejak)).toEqual(['akdariyyah', 'aul']);
  });
  test("tashih yang tidak mengubah angka bukan inkisar; muaddah tidak punya nama kasus", () => {
    const jejak = [langkah({ jenis: 'TASHIH', dasar: 6n, juzSahm: 1n, hasil: 6n }), langkah({ jenis: 'KASUS_KHUSUS', nama: 'muaddah' })];
    expect(namaKasusDariJejak(jejak)).toEqual([]);
    expect(namaKasusDariJejak([langkah({ jenis: 'TASHIH', dasar: 6n, juzSahm: 2n, hasil: 12n })])).toEqual(['inkisar']);
  });
});

describe('pecahXp', () => {
  test('dasar 60% dibulatkan ke bawah, bonus = sisanya', () => {
    expect(pecahXp(20)).toEqual({ dasar: 12, bonus: 8 });
    expect(pecahXp(15)).toEqual({ dasar: 9, bonus: 6 });
    expect(pecahXp(7)).toEqual({ dasar: 4, bonus: 3 });
  });
});
