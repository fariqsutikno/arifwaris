// Pemilihan soal hitung acak dari saringan bab + tingkat. Murni: acak dan status selesai masuk lewat argumen.
// Himpunan kosong = tidak ada yang dipilih (bukan "semua"), supaya layar bisa berkata terus terang "pilih minimal satu".

import type { SoalHitung, Tingkat } from '@waris/content';

export interface SaringanAcak {
  bab: ReadonlySet<number>;
  tingkat: ReadonlySet<Tingkat>;
  utamakanBelum: boolean;
}

export interface Kandidat {
  soal: SoalHitung[];
  /** Semua yang cocok sudah dikerjakan, jadi diambil dari yang sudah selesai walau "utamakan belum" menyala. */
  jatuhKeSelesai: boolean;
}

export function kandidatAcak(daftar: SoalHitung[], selesai: (kode: string) => boolean, saringan: SaringanAcak): Kandidat {
  const cocok = daftar.filter(soal => saringan.bab.has(soal.bab) && saringan.tingkat.has(soal.tingkat));
  if (!saringan.utamakanBelum) return { soal: cocok, jatuhKeSelesai: false };
  const belum = cocok.filter(soal => !selesai(soal.kode));
  return belum.length > 0 || cocok.length === 0 ? { soal: belum, jatuhKeSelesai: false } : { soal: cocok, jatuhKeSelesai: true };
}

/** Hindari mengulang soal yang baru keluar bila masih ada pilihan lain. */
export function pilihAcak(kandidat: SoalHitung[], barusan: string | undefined, acak: () => number = Math.random): SoalHitung | undefined {
  const pilihan = kandidat.length > 1 ? kandidat.filter(soal => soal.kode !== barusan) : kandidat;
  return pilihan[Math.floor(acak() * pilihan.length)];
}
