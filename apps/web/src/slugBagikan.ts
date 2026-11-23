// Slug acak untuk akses "siapa pun yang punya tautan": satu-satunya penjaga akses ini adalah slug yang tidak bisa ditebak,
// jadi dibuat dari crypto.getRandomValues (bukan Math.random) dan tanpa bias modulo.

const ALFABET_SLUG = 'abcdefghijklmnopqrstuvwxyz0123456789';
const PANJANG_SLUG_ACAK = 16;
// Byte >= kelipatan terbesar 36 di bawah 256 dibuang (rejection sampling), supaya tiap karakter sama peluangnya.
const BATAS_BYTE_ADIL = 256 - (256 % ALFABET_SLUG.length);

export function buatSlugAcak(): string {
  let slug = '';
  while (slug.length < PANJANG_SLUG_ACAK) {
    for (const byte of crypto.getRandomValues(new Uint8Array(PANJANG_SLUG_ACAK))) {
      if (byte < BATAS_BYTE_ADIL && slug.length < PANJANG_SLUG_ACAK) slug += ALFABET_SLUG[byte % ALFABET_SLUG.length];
    }
  }
  return slug;
}
