// packages/content/src/__tests__/tulisBlok.test.ts
import { expect, test } from 'vitest';
import { DAFTAR_FAQ, DAFTAR_PELAJARAN, DAFTAR_TANYA_JAWAB, bacaBlok, bacaPotongan, tulisBlok, tulisPotongan } from '../index.js';

test.each(DAFTAR_PELAJARAN.map(p => [p.slug, p.blok] as const))('bolak-balik materi %s', (slug, blok) => {
  expect(bacaBlok(slug, tulisBlok(blok))).toEqual(blok);
});

test('bolak-balik FAQ dan tanya jawab', () => {
  for (const entri of DAFTAR_FAQ) expect(bacaBlok(entri.id, tulisBlok(entri.jawaban))).toEqual(entri.jawaban);
  for (const entri of DAFTAR_TANYA_JAWAB) {
    expect(bacaBlok(entri.slug, tulisBlok(entri.kasus))).toEqual(entri.kasus);
    expect(bacaBlok(entri.slug, tulisBlok(entri.penyelesaian))).toEqual(entri.penyelesaian);
  }
});

test('potongan: tebal, miring, istilah bertautan teks, rujukan', () => {
  const teks = 'Istri dapat **1/8** *fardh* [[ashabah|sisa]] [R04-2].';
  expect(tulisPotongan(bacaPotongan(teks))).toBe(teks);
});
