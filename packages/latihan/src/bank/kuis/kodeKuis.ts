// Kode soal kuis angka `K1-<muatan>` (spec soal kuis §3.1): satu kasus bank keluarga biasa + satu pertanyaan ⇄ string.
//   muatan = 16 huruf muatan kasus `G1-B` (kodeBiasa.ts, tak diulang di sini) + 2 huruf pertanyaan:
//   jenis (3 bit) + indeks kunci di URUTAN_KUNCI (5 bit; hanya bermakna untuk `bagian`, selain itu wajib 0).
//   Bit sisa wajib nol, jadi satu pertanyaan tepat satu kode. Tata letak beku; perubahan menaikkan VERSI_KODE_KUIS.

import type { KunciAhliWaris } from '@waris/engine';
import { bacaBit, tulisBit } from '../bitMuatan.js';
import { buatKodeBiasa, uraiKodeBiasa, URUTAN_KUNCI, VERSI_GENERATOR, type KasusBiasa, type KodeGalatSoal } from '../kodeBiasa.js';

export const VERSI_KODE_KUIS = 1;
export const POLA_KODE_KUIS = /^K(\d+)-([0-9A-HJKMNP-TV-Z]+)$/;

/** Hanya boleh ditambah di akhir: urutan ini adalah nomor jenis di kode `K1` yang beredar. */
export const JENIS_PERTANYAAN = ['bagian', 'gugur', 'ashlAkhir', 'ashabah'] as const;
export type JenisPertanyaan = typeof JENIS_PERTANYAAN[number];

export type PertanyaanKuis = { jenis: 'bagian'; kunci: KunciAhliWaris } | { jenis: Exclude<JenisPertanyaan, 'bagian'> };

const LEBAR_TANYA = [3, 5];
const PANJANG_MUATAN_KASUS = 16;
const AWALAN_G1 = `G${VERSI_GENERATOR}-B-`;

export type HasilUraiKuis = { ok: true; kasus: KasusBiasa; tanya: PertanyaanKuis } | { ok: false; galat: KodeGalatSoal };

/** Melempar Error bila kasus tak sah atau kunci `bagian` tak ada di kasus: pembangun tak boleh menghasilkan itu. */
export function buatKodeKuis(kasus: KasusBiasa, tanya: PertanyaanKuis): string {
  const kunci = tanya.jenis === 'bagian' ? tanya.kunci : null;
  if (kunci && !kasus.ahliWaris[kunci]) throw new Error('kunci pertanyaan tidak ada di kasus');
  const muatanKasus = buatKodeBiasa(kasus).slice(AWALAN_G1.length);
  const indeksKunci = kunci ? URUTAN_KUNCI.indexOf(kunci as typeof URUTAN_KUNCI[number]) : 0;
  return `K${VERSI_KODE_KUIS}-${muatanKasus}${tulisBit([JENIS_PERTANYAAN.indexOf(tanya.jenis), indeksKunci], LEBAR_TANYA)}`;
}

export function uraiKodeKuis(kode: string): HasilUraiKuis {
  const cocok = POLA_KODE_KUIS.exec(kode);
  if (!cocok) return { ok: false, galat: 'BUKAN_KODE_GENERATOR' };
  if (Number(cocok[1]) !== VERSI_KODE_KUIS) return { ok: false, galat: 'VERSI_TIDAK_DIKENAL' };
  const muatan = cocok[2]!;
  const rusak: HasilUraiKuis = { ok: false, galat: 'MUATAN_RUSAK' };
  const nilai = bacaBit(muatan.slice(PANJANG_MUATAN_KASUS), LEBAR_TANYA);
  if (muatan.length !== PANJANG_MUATAN_KASUS + 2 || !nilai) return rusak;
  const urai = uraiKodeBiasa(`${AWALAN_G1}${muatan.slice(0, PANJANG_MUATAN_KASUS)}`);
  if (!urai.ok) return urai;
  const [indeksJenis, indeksKunci] = nilai as [number, number];
  const jenis = JENIS_PERTANYAAN[indeksJenis];
  if (!jenis) return rusak;
  if (jenis !== 'bagian') return indeksKunci === 0 ? { ok: true, kasus: urai.kasus, tanya: { jenis } } : rusak;
  const kunci = URUTAN_KUNCI[indeksKunci];
  return kunci && urai.kasus.ahliWaris[kunci] ? { ok: true, kasus: urai.kasus, tanya: { jenis, kunci } } : rusak;
}
