// packages/content/src/__tests__/tulisBlok.test.ts
import { expect, test } from 'vitest';
import { bacaBlok, bacaPotongan, tulisBlok, tulisPotongan } from '../index.js';
import { CONTOH_BLOK } from './contoh.js';

test('bolak-balik semua jenis blok', () => {
  expect(bacaBlok('uji', tulisBlok(CONTOH_BLOK))).toEqual(CONTOH_BLOK);
});

test('potongan: tebal, miring, istilah bertautan teks, rujukan', () => {
  const teks = 'Istri dapat **1/8** *fardh* [[ashabah|sisa]] [R04-2].';
  expect(tulisPotongan(bacaPotongan(teks))).toBe(teks);
});
