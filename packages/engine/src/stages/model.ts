import { fpb, type Pecahan } from '@waris/math';
import type { IdKelompok, KunciAhliWaris, PeranAhliWaris, IdOrang } from '../types.js';

/** Calon ahli waris: peran yang punya KunciAhliWaris (bukan DZAWIL_ARHAM / BUKAN_AHLI_WARIS). */
export type AhliWaris = PeranAhliWaris & { kunci: KunciAhliWaris };

export type Bagian =
  | { jenis: 'fardh'; fardh: Pecahan }
  // [R04-5] ayah/kakek bersama far'u warits muannats: 1/6 + sisa.
  | { jenis: 'fardhAshabah'; fardh: Pecahan }
  | { jenis: 'ashabah'; jenisAshabah: 'binNafsi' | 'bilGhair' | 'maalGhair' }
  // Bab 08: bagian kakek/saudari yang ditetapkan sebagai pecahan harta, bukan fardh muqaddarah.
  | { jenis: 'tetap'; nilai: Pecahan; basis: 'tsuluts' | 'tsulutsBaqi' | 'muqasamah' | 'muaddah' };

/**
 * Satu baris tabel mas'alah. `bobot` = perbandingan bagian antar anggota (2:1 ashabah bil ghair,
 * rata untuk furudh bersama, 0 untuk saudara sebapak dalam mu'addah).
 */
export interface KelompokBagian {
  id: IdKelompok;
  anggota: IdOrang[];
  bobot: Record<IdOrang, bigint>;
  bagian: Bagian;
}

export type TidakDidukung = { status: 'TIDAK_DIDUKUNG'; alasan: string; refs: string[] };

/** Buat grup; bobot dinormalisasi (dibagi FPB bobot bukan nol) supaya 2:2 tampil sebagai rata. */
export function buatKelompok(id: IdKelompok, bobot: Record<IdOrang, bigint>, bagian: Bagian): KelompokBagian {
  const bukanNol = Object.values(bobot).filter(w => w > 0n);
  const pembagi = bukanNol.reduce((acc, w) => fpb(acc, w), 0n) || 1n;
  const ternormalisasi = Object.fromEntries(Object.entries(bobot).map(([id, w]) => [id, w / pembagi]));
  return { id, anggota: Object.keys(bobot), bobot: ternormalisasi, bagian };
}

/** Bobot rata 1 untuk tiap anggota (furudh bersama: istri-istri, nenek-nenek, anak-anak pr). */
export const bobotRata = (daftarAhliWaris: Array<{ idOrang: IdOrang }>): Record<IdOrang, bigint> =>
  Object.fromEntries(daftarAhliWaris.map(h => [h.idOrang, 1n]));

const KUNCI_LAKI_LAKI: KunciAhliWaris[] = ['ANAK_LK', 'CUCU_LK', 'AYAH', 'KAKEK', 'SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARA_SEIBU',
  'KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK', 'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK', 'SUAMI', 'MUTIQ'];
export const adalahLakiLaki = (ahliWaris: AhliWaris): boolean => KUNCI_LAKI_LAKI.includes(ahliWaris.kunci);

/** Unit ru'us ashabah bil ghair: laki-laki 2, perempuan 1 (An-Nisa' 11, 176). */
export const satuanRuus = (ahliWaris: AhliWaris): bigint => (adalahLakiLaki(ahliWaris) ? 2n : 1n);

/** Keadaan mas'alah setelah tahap 3: saham tiap kelompok pada ashl (ashabah sudah mengambil sisa, min. 0). */
export interface Masalah {
  daftarKelompok: KelompokBagian[];
  ashl: bigint;
  saham: Record<IdKelompok, bigint>;
}

/** Pecahan tetap sebuah kelompok (fardh, bagian fardh ayah/kakek, atau bagian tetap bab 08); ashabah murni → undefined. */
export function pecahanTetapDari(bagian: Bagian): Pecahan | undefined {
  switch (bagian.jenis) {
    case 'fardh': case 'fardhAshabah': return bagian.fardh;
    case 'tetap': return bagian.nilai;
    case 'ashabah': return undefined;
  }
}

export const penerimaSisa = (kelompok: KelompokBagian): boolean =>
  kelompok.bagian.jenis === 'ashabah' || kelompok.bagian.jenis === 'fardhAshabah';

export const jumlahBobot = (kelompok: KelompokBagian): bigint => Object.values(kelompok.bobot).reduce((a, b) => a + b, 0n);
