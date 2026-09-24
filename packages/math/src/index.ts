// [KH] Kaidah hisab — tipe dan fungsi murni; tidak ada I/O, Date, Math.random.

/** Pecahan eksak berbasis bigint, selalu ternormalisasi (d > 0, gcd(n,d)=1). */
export type Fraction = { readonly n: bigint; readonly d: bigint };

/** Uang dalam satuan terkecil (rupiah, tanpa desimal). */
export type Money = bigint;
