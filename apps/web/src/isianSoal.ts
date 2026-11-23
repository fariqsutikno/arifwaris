// Tebakan soal hitung yang belum selesai, per kode soal, di perangkat ini (tidak disinkron ke akun).
// Soal tinggal di Latihan: isian disimpan di sini, bukan di riwayat kasus (spec siklus kasus dan soal, P3).

import type { IsianTabel } from '@waris/latihan';
import { bacaMentah, simpanMentah } from './penyimpanan';

const KUNCI_ISIAN_SOAL = 'arif-waris:isian-soal';

export interface IsianSoal {
  isian: IsianTabel;
  diubahPada: number;
  /** Jumlah kotak yang harus diisi, untuk tampilan "n dari m isian". */
  jumlahKotak: number;
}

export function bacaSemuaIsianSoal(): Record<string, IsianSoal> {
  try {
    const nilai: unknown = JSON.parse(bacaMentah(KUNCI_ISIAN_SOAL) ?? '{}');
    return nilai && typeof nilai === 'object' && !Array.isArray(nilai) ? nilai as Record<string, IsianSoal> : {};
  } catch {
    return {};
  }
}

export const bacaIsianSoal = (kode: string): IsianSoal | null => bacaSemuaIsianSoal()[kode] ?? null;

export function simpanIsianSoal(kode: string, isian: IsianTabel, jumlahKotak = 0, sekarang = Date.now()): void {
  simpanMentah(KUNCI_ISIAN_SOAL, JSON.stringify({ ...bacaSemuaIsianSoal(), [kode]: { isian, diubahPada: sekarang, jumlahKotak } }));
}

export function hapusIsianSoal(kode: string): void {
  const { [kode]: _dihapus, ...sisa } = bacaSemuaIsianSoal();
  simpanMentah(KUNCI_ISIAN_SOAL, JSON.stringify(sisa));
}

/** Kotak yang sudah terisi (teks tak kosong), di kepala kolom, sel, maupun baris pengali. */
export const hitungTerisi = (isian: IsianTabel): number =>
  [isian.kepala, isian.pengali ?? {}, ...Object.values(isian.sel).map(baris => baris ?? {})]
    .flatMap(kotak => Object.values(kotak)).filter(nilai => typeof nilai === 'string' && nilai !== '').length;
