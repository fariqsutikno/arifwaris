import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { add, compare, div, floorShare, fraction, gcd, lcm, mul, nisab, sub } from '../index.js';

const nonZero = fc.bigInt({ min: -10_000n, max: 10_000n }).filter(x => x !== 0n);
const anyInt = fc.bigInt({ min: -10_000n, max: 10_000n });
const positive = fc.bigInt({ min: 1n, max: 10_000n });
const arbFraction = fc.tuple(anyInt, nonZero).map(([n, d]) => fraction(n, d));

describe('gcd / lcm', () => {
  test('nilai dasar', () => {
    expect(gcd(4n, 6n)).toBe(2n);
    expect(gcd(-4n, 6n)).toBe(2n);
    expect(gcd(0n, 5n)).toBe(5n);
    expect(gcd(0n, 0n)).toBe(0n);
    expect(lcm(4n, 6n)).toBe(12n);
    expect(lcm(0n, 6n)).toBe(0n);
  });

  test('property: gcd × lcm = |a × b|, dan gcd membagi keduanya', () => {
    fc.assert(fc.property(positive, positive, (a, b) => {
      const g = gcd(a, b);
      expect(a % g).toBe(0n);
      expect(b % g).toBe(0n);
      expect(g * lcm(a, b)).toBe(a * b);
    }));
  });
});

describe('fraction', () => {
  test('dinormalisasi: gcd(n,d)=1, d>0, nol = 0/1', () => {
    expect(fraction(2n, 4n)).toEqual({ n: 1n, d: 2n });
    expect(fraction(1n, -3n)).toEqual({ n: -1n, d: 3n });
    expect(fraction(0n, -7n)).toEqual({ n: 0n, d: 1n });
    expect(fraction(5n)).toEqual({ n: 5n, d: 1n });
  });

  test('penyebut nol ditolak', () => {
    expect(() => fraction(1n, 0n)).toThrow(RangeError);
  });

  test('immutable', () => {
    const half = fraction(1n, 2n);
    expect(Object.isFrozen(half)).toBe(true);
  });

  test('property: selalu ternormalisasi', () => {
    fc.assert(fc.property(anyInt, nonZero, (n, d) => {
      const f = fraction(n, d);
      expect(f.d > 0n).toBe(true);
      expect(gcd(f.n, f.d)).toBe(1n);
      expect(f.n * d).toBe(n * f.d); // nilai tidak berubah
    }));
  });
});

describe('aritmetika pecahan', () => {
  test('contoh furudh: 1/2 + 1/6 + 1/3 = 1', () => {
    expect(add(add(fraction(1n, 2n), fraction(1n, 6n)), fraction(1n, 3n))).toEqual(fraction(1n));
  });

  test('sub, mul, div', () => {
    expect(sub(fraction(2n, 3n), fraction(1n, 2n))).toEqual(fraction(1n, 6n)); // takmilah ats-tsulutsain
    expect(mul(fraction(1n, 3n), fraction(3n, 4n))).toEqual(fraction(1n, 4n));  // 1/3 sisa
    expect(div(fraction(1n, 4n), fraction(1n, 2n))).toEqual(fraction(1n, 2n));
  });

  test('bagi dengan nol ditolak', () => {
    expect(() => div(fraction(1n), fraction(0n))).toThrow(RangeError);
  });

  test('compare', () => {
    expect(compare(fraction(1n, 3n), fraction(1n, 2n))).toBe(-1);
    expect(compare(fraction(2n, 4n), fraction(1n, 2n))).toBe(0);
    expect(compare(fraction(-1n, 2n), fraction(-1n, 3n))).toBe(-1);
  });

  test('property: a + b - b = a, (a × b) ÷ b = a', () => {
    fc.assert(fc.property(arbFraction, arbFraction, (a, b) => {
      expect(sub(add(a, b), b)).toEqual(a);
      if (b.n !== 0n) expect(div(mul(a, b), b)).toEqual(a);
    }));
  });
});

describe('nisab arba\' [R10-1], bab 10.2', () => {
  test('contoh tabel bab 10.2', () => {
    expect(nisab(3n, 3n)).toEqual({ relation: 'tamatsul', gcd: 3n, result: 3n });
    expect(nisab(3n, 6n)).toEqual({ relation: 'tadakhul', gcd: 3n, result: 6n });
    expect(nisab(4n, 6n)).toEqual({ relation: 'tawafuq', gcd: 2n, result: 12n });
    expect(nisab(3n, 4n)).toEqual({ relation: 'tabayun', gcd: 1n, result: 12n });
  });

  test('contoh bab 9 / 10: raddB 3 vs 4 → 16 dimulai dari tabayun; juz\' 2 vs 3 → 6', () => {
    expect(nisab(3n, 4n).relation).toBe('tabayun');
    expect(nisab(2n, 3n)).toEqual({ relation: 'tabayun', gcd: 1n, result: 6n });
  });

  test('bilangan ≤ 0 ditolak', () => {
    expect(() => nisab(0n, 4n)).toThrow(RangeError);
    expect(() => nisab(4n, -2n)).toThrow(RangeError);
  });

  test('property: hasil = KPK, simetris, relasi sesuai definisi', () => {
    fc.assert(fc.property(positive, positive, (a, b) => {
      const r = nisab(a, b);
      expect(r).toEqual(nisab(b, a));
      expect(r.result).toBe(lcm(a, b));
      expect(r.gcd).toBe(gcd(a, b));
      const [small, big] = a < b ? [a, b] : [b, a];
      const expected = a === b ? 'tamatsul' : big % small === 0n ? 'tadakhul' : r.gcd > 1n ? 'tawafuq' : 'tabayun';
      expect(r.relation).toBe(expected);
    }));
  });
});

describe('floorShare — nominal dibulatkan ke bawah ke kelipatan unit', () => {
  test('uji nominal bab 16: 14/24 × 80.000.000', () => {
    const share = fraction(14n, 24n);
    expect(floorShare(80_000_000n, share, 1n)).toBe(46_666_666n);
    expect(floorShare(80_000_000n, share, 100n)).toBe(46_666_600n);
    expect(floorShare(80_000_000n, share, 1000n)).toBe(46_666_000n);
  });

  test('unit ≤ 0 atau bagian negatif ditolak', () => {
    expect(() => floorShare(100n, fraction(1n, 2n), 0n)).toThrow(RangeError);
    expect(() => floorShare(100n, fraction(-1n, 2n), 1n)).toThrow(RangeError);
  });

  test('property: kelipatan unit, ≤ nilai eksak, selisih < unit', () => {
    fc.assert(fc.property(
      fc.bigInt({ min: 0n, max: 10n ** 12n }), positive, positive, fc.constantFrom(1n, 100n, 1000n),
      (harta, x, y, unit) => {
        const share = x <= y ? fraction(x, y) : fraction(y, x);
        const amount = floorShare(harta, share, unit);
        expect(amount % unit).toBe(0n);
        const exactTimesD = harta * share.n;
        expect(amount * share.d <= exactTimesD).toBe(true);
        expect(exactTimesD - amount * share.d < unit * share.d).toBe(true);
      },
    ));
  });
});
