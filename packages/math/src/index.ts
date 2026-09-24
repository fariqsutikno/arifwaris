// [KH] Kaidah hisab — fungsi murni; tidak ada I/O, Date, Math.random, atau `number` di jalur hitung.

declare const fractionBrand: unique symbol;

/** Pecahan eksak berbasis bigint; hanya bisa dibuat lewat `fraction()` → selalu ternormalisasi (d > 0, gcd(n,d)=1). */
export type Fraction = { readonly n: bigint; readonly d: bigint; readonly [fractionBrand]: true };

/** Uang dalam satuan terkecil (rupiah, tanpa desimal). */
export type Money = bigint;

const abs = (x: bigint): bigint => (x < 0n ? -x : x);

export function gcd(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

export function lcm(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  return abs(a / gcd(a, b) * b);
}

export function fraction(n: bigint, d: bigint = 1n): Fraction {
  if (d === 0n) throw new RangeError('fraction: penyebut nol');
  const sign = d < 0n ? -1n : 1n;
  const divisor = gcd(n, d) || 1n;
  return Object.freeze({ n: sign * n / divisor, d: sign * d / divisor }) as Fraction;
}

export const add = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Fraction, b: Fraction): Fraction => fraction(a.n * b.n, a.d * b.d);

export function div(a: Fraction, b: Fraction): Fraction {
  if (b.n === 0n) throw new RangeError('div: pembagi nol');
  return fraction(a.n * b.d, a.d * b.n);
}

export function compare(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const diff = a.n * b.d - b.n * a.d;
  return diff < 0n ? -1 : diff > 0n ? 1 : 0;
}

export type Nisab = 'tamatsul' | 'tadakhul' | 'tawafuq' | 'tabayun';

/**
 * [R10-1] Nisab arba' antara dua bilangan positif, bab 10.2.
 * `result` = hasil gabung (KPK) menurut kaidah tiap relasi; dipakai untuk ashl, radd, dan juz' as-sahm.
 */
export function nisab(a: bigint, b: bigint): { relation: Nisab; gcd: bigint; result: bigint } {
  if (a <= 0n || b <= 0n) throw new RangeError('nisab: bilangan harus positif');
  const faktorPersekutuan = gcd(a, b);
  const [kecil, besar] = a < b ? [a, b] : [b, a];
  if (a === b) return { relation: 'tamatsul', gcd: faktorPersekutuan, result: a };
  // [R10-5] «كل عدد مع الواحد فهو متباين»: angka 1 vs angka lain = tabayun, didahulukan atas
  // tadakhul (1 selalu habis membagi angka apa pun, tapi itu bukan tadakhul menurut kaidah ini).
  if (kecil === 1n) return { relation: 'tabayun', gcd: faktorPersekutuan, result: a * b };
  if (besar % kecil === 0n) return { relation: 'tadakhul', gcd: faktorPersekutuan, result: besar };
  if (faktorPersekutuan > 1n) {
    // Tawafuq: kalikan salah satu dengan wafq yang lain.
    return { relation: 'tawafuq', gcd: faktorPersekutuan, result: a * (b / faktorPersekutuan) };
  }
  return { relation: 'tabayun', gcd: faktorPersekutuan, result: a * b };
}

/**
 * Nominal = harta × bagian, dibulatkan ke bawah ke kelipatan `unit` (engine-contract Tahap 6).
 * Selisihnya dilaporkan pemanggil sebagai selisih pembulatan, tidak dibagikan di sini.
 */
export function floorShare(harta: Money, bagian: Fraction, unit: bigint): Money {
  if (unit <= 0n) throw new RangeError('floorShare: unit harus > 0');
  if (bagian.n < 0n || harta < 0n) throw new RangeError('floorShare: harta dan bagian tidak boleh negatif');
  return (harta * bagian.n) / (bagian.d * unit) * unit;
}
