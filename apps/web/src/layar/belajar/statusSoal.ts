// Status satu soal hitung, diturunkan dari progres + isian tersimpan (spec siklus kasus dan soal, P5).
// Satu sumber untuk daftar Latihan, pintasan Lab, dan Beranda.

import type { SoalHitung } from '@waris/content';
import type { ProgresLatihan } from '@waris/data';
import { hitungTerisi, type IsianSoal } from '../../isianSoal';

export type StatusSoal = 'belum' | 'terputus' | 'benar' | 'lihatJawaban';

export function statusSoal(progres: ProgresLatihan | undefined, isian: IsianSoal | null | undefined): StatusSoal {
  if (progres) return progres.benar ? 'benar' : 'lihatJawaban';
  return isian && hitungTerisi(isian.isian) > 0 ? 'terputus' : 'belum';
}

/** Sama dengan `judulSoalTampil`: benar atau jawabannya dibuka. */
export const soalSelesai = (status: StatusSoal): boolean => status === 'benar' || status === 'lihatJawaban';

/** Soal terputus, yang terakhir diubah paling depan. */
export const soalTerputus = (daftar: readonly SoalHitung[], progres: Record<string, ProgresLatihan>, isian: Record<string, IsianSoal>): SoalHitung[] =>
  daftar.filter(soal => statusSoal(progres[soal.kode], isian[soal.kode]) === 'terputus')
    .sort((a, b) => isian[b.kode]!.diubahPada - isian[a.kode]!.diubahPada);

/** Porsi kotak terisi, 0-100, untuk cincin status; tanpa jumlah kotak (isian lama) tampil setengah. */
export const porsiIsian = (isian: IsianSoal): number =>
  isian.jumlahKotak > 0 ? Math.min(100, Math.round((hitungTerisi(isian.isian) / isian.jumlahKotak) * 100)) : 50;
