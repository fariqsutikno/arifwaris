// Navigasi wizard sebagai fungsi murni: dari posisi (langkah, babak, bagian) ke posisi berikut/sebelumnya.
// Langkah Keluarga (3) dipecah jadi dua layar per babak: daftar orang, lalu keadaan khusus keluarga itu.
// Urutannya: babak 1 daftar → babak 1 keadaan → babak 2 daftar → … → Periksa. Kasus biasa (satu babak) hanya dua layar di sini.

export type Bagian = 'daftar' | 'keadaan';
export interface Posisi { langkah: number; babak: number; bagian: Bagian }

export const LANGKAH_KELUARGA = 3;
export const LANGKAH_PERIKSA = 4;

export const posisiAwal = (langkah: number): Posisi => ({ langkah, babak: 0, bagian: 'daftar' });

/** Posisi sesudah ini, atau 'hasil' bila Periksa sudah dilewati. `jumlahBabak` dibaca saat dipanggil: babak bisa bertambah di layar keadaan. */
export function posisiBerikut(posisi: Posisi, jumlahBabak: number): Posisi | 'hasil' {
  if (posisi.langkah === LANGKAH_PERIKSA) return 'hasil';
  if (posisi.langkah !== LANGKAH_KELUARGA) return posisiAwal(posisi.langkah + 1);
  if (posisi.bagian === 'daftar') return { ...posisi, bagian: 'keadaan' };
  if (posisi.babak < jumlahBabak - 1) return { langkah: LANGKAH_KELUARGA, babak: posisi.babak + 1, bagian: 'daftar' };
  return posisiAwal(LANGKAH_PERIKSA);
}

/** Posisi sebelum ini, atau 'awal' bila sudah di layar pertama. Mundur dari Periksa mendarat di keadaan babak terakhir. */
export function posisiSebelum(posisi: Posisi, jumlahBabak: number): Posisi | 'awal' {
  if (posisi.langkah === 1) return 'awal';
  if (posisi.langkah === LANGKAH_PERIKSA) return { langkah: LANGKAH_KELUARGA, babak: Math.max(0, jumlahBabak - 1), bagian: 'keadaan' };
  if (posisi.langkah === LANGKAH_KELUARGA) {
    if (posisi.bagian === 'keadaan') return { ...posisi, bagian: 'daftar' };
    if (posisi.babak > 0) return { langkah: LANGKAH_KELUARGA, babak: posisi.babak - 1, bagian: 'keadaan' };
  }
  return posisiAwal(posisi.langkah - 1);
}
