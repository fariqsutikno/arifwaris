// [KH] Kaidah hisab: fungsi murni tanpa I/O, Date, Math.random, dan tanpa `number` di jalur hitung.
// Isi file ini: (1) pecahan eksak, (2) FPB/KPK, (3) nisab arba', (4) pembulatan nominal.

declare const tandaPecahan: unique symbol;

/** Pecahan eksak berbasis bigint. Hanya bisa dibuat lewat `pecahan()`, jadi selalu ternormalisasi (penyebut > 0, FPB = 1). */
export type Pecahan = { readonly n: bigint; readonly d: bigint; readonly [tandaPecahan]: true };

/** Uang dalam satuan terkecil (rupiah, tanpa desimal). */
export type Uang = bigint;

const mutlak = (x: bigint): bigint => (x < 0n ? -x : x);

// ─── 1. FPB & KPK ─────────────────────────────────────────────────────────────

export function fpb(a: bigint, b: bigint): bigint {
  let x = mutlak(a);
  let y = mutlak(b);
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

export function kpk(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  return mutlak(a / fpb(a, b) * b);
}

// ─── 2. Pecahan ───────────────────────────────────────────────────────────────

export function pecahan(pembilang: bigint, penyebut: bigint = 1n): Pecahan {
  if (penyebut === 0n) throw new RangeError('pecahan: penyebut nol');
  const tanda = penyebut < 0n ? -1n : 1n;
  const pembagi = fpb(pembilang, penyebut) || 1n;
  return Object.freeze({ n: tanda * pembilang / pembagi, d: tanda * penyebut / pembagi }) as Pecahan;
}

export const tambah = (a: Pecahan, b: Pecahan): Pecahan => pecahan(a.n * b.d + b.n * a.d, a.d * b.d);
export const kurang = (a: Pecahan, b: Pecahan): Pecahan => pecahan(a.n * b.d - b.n * a.d, a.d * b.d);
export const kali = (a: Pecahan, b: Pecahan): Pecahan => pecahan(a.n * b.n, a.d * b.d);

export function bagi(a: Pecahan, b: Pecahan): Pecahan {
  if (b.n === 0n) throw new RangeError('bagi: pembagi nol');
  return pecahan(a.n * b.d, a.d * b.n);
}

/** -1 kalau a < b, 0 kalau sama, 1 kalau a > b. */
export function bandingkan(a: Pecahan, b: Pecahan): -1 | 0 | 1 {
  const selisih = a.n * b.d - b.n * a.d;
  return selisih < 0n ? -1 : selisih > 0n ? 1 : 0;
}

// ─── 3. Nisab arba' ───────────────────────────────────────────────────────────

export type Nisab = 'tamatsul' | 'tadakhul' | 'tawafuq' | 'tabayun';

/**
 * [R10-1] Nisab arba' antara dua bilangan positif (bab 10.2).
 * `hasil` = gabungan keduanya menurut kaidah tiap hubungan; dipakai di ashl, radd, dan tashih.
 */
export function nisab(a: bigint, b: bigint): { hubungan: Nisab; fpb: bigint; hasil: bigint } {
  if (a <= 0n || b <= 0n) throw new RangeError('nisab: bilangan harus positif');
  const faktorPersekutuan = fpb(a, b);
  const [kecil, besar] = a < b ? [a, b] : [b, a];
  if (a === b) return { hubungan: 'tamatsul', fpb: faktorPersekutuan, hasil: a };
  // [R10-5] «كل عدد مع الواحد فهو متباين»: 1 dengan angka lain = tabayun. Ini didahulukan atas
  // tadakhul, karena 1 memang habis membagi apa pun, tapi menurut kaidah ini bukan tadakhul.
  if (kecil === 1n) return { hubungan: 'tabayun', fpb: faktorPersekutuan, hasil: a * b };
  if (besar % kecil === 0n) return { hubungan: 'tadakhul', fpb: faktorPersekutuan, hasil: besar };
  if (faktorPersekutuan > 1n) {
    // Tawafuq: salah satu dikali wafq (hasil bagi dengan FPB) yang lain.
    return { hubungan: 'tawafuq', fpb: faktorPersekutuan, hasil: a * (b / faktorPersekutuan) };
  }
  return { hubungan: 'tabayun', fpb: faktorPersekutuan, hasil: a * b };
}

// ─── 4. Pembulatan nominal ────────────────────────────────────────────────────

/**
 * Nominal = harta × bagian, dibulatkan ke bawah ke kelipatan `satuan` (engine-contract Tahap 6).
 * Sisa pembulatan tidak dibagikan di sini; pemanggil melaporkannya sebagai selisih pembulatan.
 */
export function bulatkanKeBawah(harta: Uang, bagian: Pecahan, satuan: bigint): Uang {
  if (satuan <= 0n) throw new RangeError('bulatkanKeBawah: satuan harus > 0');
  if (bagian.n < 0n || harta < 0n) throw new RangeError('bulatkanKeBawah: harta dan bagian tidak boleh negatif');
  return (harta * bagian.n) / (bagian.d * satuan) * satuan;
}
