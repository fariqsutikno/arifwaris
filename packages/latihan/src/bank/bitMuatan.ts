// Pengemas bit generik untuk muatan kode keluarga lanjutan (G3): daftar (nilai, lebar bit) ⇄ base32 Crockford.
// Panjang muatan ditentukan lebar total (dibulatkan ke atas ke kelipatan 5 bit); bit sisa wajib nol, jadi satu
// daftar nilai tepat satu muatan. Keluarga `biasa` memakai pengemas sendiri (kodeBiasa.ts) dan tidak berubah.

export const ABJAD_MUATAN = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BIT_PER_HURUF = 5;

const panjangHuruf = (lebar: readonly number[]) => Math.ceil(lebar.reduce((total, bit) => total + bit, 0) / BIT_PER_HURUF);

/** Nilai di luar jangkauan lebarnya melempar Error: pemanggil sudah memeriksa; ini penjaga terakhir. */
export function tulisBit(nilai: readonly number[], lebar: readonly number[]): string {
  let bit = 0n;
  nilai.forEach((isi, urutan) => {
    if (!Number.isInteger(isi) || isi < 0 || isi >= 2 ** lebar[urutan]!) throw new Error('nilai muatan di luar lebar bit');
    bit = (bit << BigInt(lebar[urutan]!)) | BigInt(isi);
  });
  const panjang = panjangHuruf(lebar);
  bit <<= BigInt(panjang * BIT_PER_HURUF - lebar.reduce((total, ukuran) => total + ukuran, 0));
  let muatan = '';
  for (let urutan = panjang - 1; urutan >= 0; urutan--) muatan += ABJAD_MUATAN[Number((bit >> BigInt(urutan * BIT_PER_HURUF)) & 31n)];
  return muatan;
}

/** null bila panjang salah, ada huruf asing, atau bit sisa tidak nol. */
export function bacaBit(muatan: string, lebar: readonly number[]): number[] | null {
  if (muatan.length !== panjangHuruf(lebar)) return null;
  let bit = 0n;
  for (const huruf of muatan) {
    const nilai = ABJAD_MUATAN.indexOf(huruf);
    if (nilai < 0) return null;
    bit = (bit << BigInt(BIT_PER_HURUF)) | BigInt(nilai);
  }
  const sisa = muatan.length * BIT_PER_HURUF - lebar.reduce((total, ukuran) => total + ukuran, 0);
  if (bit & ((1n << BigInt(sisa)) - 1n)) return null;
  bit >>= BigInt(sisa);
  const nilai: number[] = [];
  for (let urutan = lebar.length - 1; urutan >= 0; urutan--) {
    nilai[urutan] = Number(bit & ((1n << BigInt(lebar[urutan]!)) - 1n));
    bit >>= BigInt(lebar[urutan]!);
  }
  return nilai;
}
