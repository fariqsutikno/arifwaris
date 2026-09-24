import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { tambah, bandingkan, bagi, bulatkanKeBawah, pecahan, fpb, kpk, kali, nisab, kurang } from '../index.js';

const nonZero = fc.bigInt({ min: -10_000n, max: 10_000n }).filter(x => x !== 0n);
const anyInt = fc.bigInt({ min: -10_000n, max: 10_000n });
const positive = fc.bigInt({ min: 1n, max: 10_000n });
const arbFraction = fc.tuple(anyInt, nonZero).map(([n, d]) => pecahan(n, d));

describe('fpb / kpk', () => {
  test('nilai dasar', () => {
    expect(fpb(4n, 6n)).toBe(2n);
    expect(fpb(-4n, 6n)).toBe(2n);
    expect(fpb(0n, 5n)).toBe(5n);
    expect(fpb(0n, 0n)).toBe(0n);
    expect(kpk(4n, 6n)).toBe(12n);
    expect(kpk(0n, 6n)).toBe(0n);
  });

  test('property: fpb × kpk = |a × b|, dan fpb membagi keduanya', () => {
    fc.assert(fc.property(positive, positive, (a, b) => {
      const g = fpb(a, b);
      expect(a % g).toBe(0n);
      expect(b % g).toBe(0n);
      expect(g * kpk(a, b)).toBe(a * b);
    }));
  });
});

describe('pecahan', () => {
  test('dinormalisasi: fpb(n,d)=1, d>0, nol = 0/1', () => {
    expect(pecahan(2n, 4n)).toEqual({ n: 1n, d: 2n });
    expect(pecahan(1n, -3n)).toEqual({ n: -1n, d: 3n });
    expect(pecahan(0n, -7n)).toEqual({ n: 0n, d: 1n });
    expect(pecahan(5n)).toEqual({ n: 5n, d: 1n });
  });

  test('penyebut nol ditolak', () => {
    expect(() => pecahan(1n, 0n)).toThrow(RangeError);
  });

  test('immutable', () => {
    const half = pecahan(1n, 2n);
    expect(Object.isFrozen(half)).toBe(true);
  });

  test('property: selalu ternormalisasi', () => {
    fc.assert(fc.property(anyInt, nonZero, (n, d) => {
      const f = pecahan(n, d);
      expect(f.d > 0n).toBe(true);
      expect(fpb(f.n, f.d)).toBe(1n);
      expect(f.n * d).toBe(n * f.d); // nilai tidak berubah
    }));
  });
});

describe('aritmetika pecahan', () => {
  test('contoh furudh: 1/2 + 1/6 + 1/3 = 1', () => {
    expect(tambah(tambah(pecahan(1n, 2n), pecahan(1n, 6n)), pecahan(1n, 3n))).toEqual(pecahan(1n));
  });

  test('kurang, kali, bagi', () => {
    expect(kurang(pecahan(2n, 3n), pecahan(1n, 2n))).toEqual(pecahan(1n, 6n)); // takmilah ats-tsulutsain
    expect(kali(pecahan(1n, 3n), pecahan(3n, 4n))).toEqual(pecahan(1n, 4n));  // 1/3 sisa
    expect(bagi(pecahan(1n, 4n), pecahan(1n, 2n))).toEqual(pecahan(1n, 2n));
  });

  test('bagi dengan nol ditolak', () => {
    expect(() => bagi(pecahan(1n), pecahan(0n))).toThrow(RangeError);
  });

  test('bandingkan', () => {
    expect(bandingkan(pecahan(1n, 3n), pecahan(1n, 2n))).toBe(-1);
    expect(bandingkan(pecahan(2n, 4n), pecahan(1n, 2n))).toBe(0);
    expect(bandingkan(pecahan(-1n, 2n), pecahan(-1n, 3n))).toBe(-1);
  });

  test('property: a + b - b = a, (a × b) ÷ b = a', () => {
    fc.assert(fc.property(arbFraction, arbFraction, (a, b) => {
      expect(kurang(tambah(a, b), b)).toEqual(a);
      if (b.n !== 0n) expect(bagi(kali(a, b), b)).toEqual(a);
    }));
  });
});

describe('nisab arba\' [R10-1], bab 10.2', () => {
  test('contoh tabel bab 10.2', () => {
    expect(nisab(3n, 3n)).toEqual({ hubungan: 'tamatsul', fpb: 3n, hasil: 3n });
    expect(nisab(3n, 6n)).toEqual({ hubungan: 'tadakhul', fpb: 3n, hasil: 6n });
    expect(nisab(4n, 6n)).toEqual({ hubungan: 'tawafuq', fpb: 2n, hasil: 12n });
    expect(nisab(3n, 4n)).toEqual({ hubungan: 'tabayun', fpb: 1n, hasil: 12n });
  });

  test('contoh bab 9 / 10: raddB 3 vs 4 → 16 dimulai dari tabayun; juz\' 2 vs 3 → 6', () => {
    expect(nisab(3n, 4n).hubungan).toBe('tabayun');
    expect(nisab(2n, 3n)).toEqual({ hubungan: 'tabayun', fpb: 1n, hasil: 6n });
  });

  test('[R10-5] angka 1 = tabayun, bukan tadakhul (10_tashih.md contoh 10.3c: istri 1 vs 4)', () => {
    expect(nisab(1n, 4n)).toEqual({ hubungan: 'tabayun', fpb: 1n, hasil: 4n });
    expect(nisab(1n, 2n)).toEqual({ hubungan: 'tabayun', fpb: 1n, hasil: 2n });
    expect(nisab(5n, 1n)).toEqual({ hubungan: 'tabayun', fpb: 1n, hasil: 5n });
  });

  test('bilangan ≤ 0 ditolak', () => {
    expect(() => nisab(0n, 4n)).toThrow(RangeError);
    expect(() => nisab(4n, -2n)).toThrow(RangeError);
  });

  test('property: hasil = KPK, simetris, relasi sesuai definisi', () => {
    fc.assert(fc.property(positive, positive, (a, b) => {
      const r = nisab(a, b);
      expect(r).toEqual(nisab(b, a));
      expect(r.hasil).toBe(kpk(a, b));
      expect(r.fpb).toBe(fpb(a, b));
      const [small, big] = a < b ? [a, b] : [b, a];
      // [R10-5] angka 1 = tabayun, didahulukan atas tadakhul.
      const expected = a === b ? 'tamatsul' : small === 1n ? 'tabayun' : big % small === 0n ? 'tadakhul' : r.fpb > 1n ? 'tawafuq' : 'tabayun';
      expect(r.hubungan).toBe(expected);
    }));
  });
});

describe('bulatkanKeBawah — nominal dibulatkan ke bawah ke kelipatan unit', () => {
  test('uji nominal bab 16: 14/24 × 80.000.000', () => {
    const share = pecahan(14n, 24n);
    expect(bulatkanKeBawah(80_000_000n, share, 1n)).toBe(46_666_666n);
    expect(bulatkanKeBawah(80_000_000n, share, 100n)).toBe(46_666_600n);
    expect(bulatkanKeBawah(80_000_000n, share, 1000n)).toBe(46_666_000n);
  });

  test('unit ≤ 0 atau bagian negatif ditolak', () => {
    expect(() => bulatkanKeBawah(100n, pecahan(1n, 2n), 0n)).toThrow(RangeError);
    expect(() => bulatkanKeBawah(100n, pecahan(-1n, 2n), 1n)).toThrow(RangeError);
  });

  test('property: kelipatan unit, ≤ nilai eksak, selisih < unit', () => {
    fc.assert(fc.property(
      fc.bigInt({ min: 0n, max: 10n ** 12n }), positive, positive, fc.constantFrom(1n, 100n, 1000n),
      (harta, x, y, unit) => {
        const share = x <= y ? pecahan(x, y) : pecahan(y, x);
        const amount = bulatkanKeBawah(harta, share, unit);
        expect(amount % unit).toBe(0n);
        const exactTimesD = harta * share.n;
        expect(amount * share.d <= exactTimesD).toBe(true);
        expect(exactTimesD - amount * share.d < unit * share.d).toBe(true);
      },
    ));
  });
});
