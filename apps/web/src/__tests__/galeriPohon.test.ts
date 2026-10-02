import { describe, expect, it } from 'vitest';
import { tataLetak } from '../hasil/tataLetak';
import { GALERI, hitungSilang, pelanggaran } from './galeriPohon';

describe('galeri pohon: invarian P1–P4 [spec 5.5]', () => {
  it.each(GALERI.map(f => [f.nama, f] as const))('%s', (_nama, fixture) => {
    expect(pelanggaran(fixture.graf, tataLetak(fixture.graf))).toEqual([]);
  });
});

describe('galeri pohon: P5 nol garis bersilangan pada graf berbentuk pohon', () => {
  it.each(GALERI.filter(f => !f.nikahKerabat).map(f => [f.nama, f] as const))('%s', (_nama, fixture) => {
    expect(hitungSilang(tataLetak(fixture.graf))).toBe(0);
  });
});
