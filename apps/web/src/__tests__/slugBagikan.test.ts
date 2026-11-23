import { expect, test } from 'vitest';
import { SLUG_BAGIKAN, SLUG_BAGIKAN_TAUTAN } from '../rute';
import { buatSlugAcak } from '../slugBagikan';

test('slug acak: 16 karakter a-z0-9, lolos pola tautan dan pola umum, dan tidak berulang', () => {
  const semua = Array.from({ length: 200 }, buatSlugAcak);
  for (const slug of semua) {
    expect(slug).toMatch(SLUG_BAGIKAN_TAUTAN);
    expect(slug).toMatch(SLUG_BAGIKAN);
  }
  expect(new Set(semua).size).toBe(semua.length);
});
