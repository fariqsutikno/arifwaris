import { expect, it } from 'vitest';
import { acakDariBenih } from '../acakBerbenih';

const deret = (benih: string) => { const acak = acakDariBenih(benih); return Array.from({ length: 8 }, acak); };

it('benih sama menghasilkan deret sama, benih beda menghasilkan deret beda', () => {
  expect(deret('sesi-1')).toEqual(deret('sesi-1'));
  expect(deret('sesi-1')).not.toEqual(deret('sesi-2'));
});

it('nilai selalu dalam [0, 1)', () => {
  for (const nilai of deret('x').concat(deret('yy'))) { expect(nilai).toBeGreaterThanOrEqual(0); expect(nilai).toBeLessThan(1); }
});
