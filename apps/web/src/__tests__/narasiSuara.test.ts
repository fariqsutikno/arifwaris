import { describe, expect, it } from 'vitest';
import { lamaBacaMs, teksUcapan } from '../hasil/narasiSuara';

describe('narasiSuara', () => {
  it('rupiah dan pecahan diucapkan sebagai kata', () => {
    expect(teksUcapan('Istri: 9/72 = Rp37.500.000.')).toBe('Istri: 9 per 72 = 37.500.000 rupiah.');
  });
  it('lama baca punya batas bawah dan mengikuti kecepatan', () => {
    expect(lamaBacaMs('hai', 1)).toBe(2200);
    expect(lamaBacaMs('a'.repeat(100), 1)).toBe(5500);
    expect(lamaBacaMs('a'.repeat(100), 2)).toBe(2750);
  });
});
