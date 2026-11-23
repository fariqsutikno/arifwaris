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
  /** Nomor percobaan (0 = pertama); benih jangkar acak. Bertahan walau isian dihapus. */
  percobaan?: number;
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
  const percobaan = bacaPercobaanSoal(kode);
  tulis(kode, { isian, diubahPada: sekarang, jumlahKotak, ...(percobaan > 0 ? { percobaan } : {}) });
}

export const bacaPercobaanSoal = (kode: string): number => bacaIsianSoal(kode)?.percobaan ?? 0;

/** Isian dibuang; nomor percobaan disimpan supaya jangkar tidak kembali ke yang lama. */
export function hapusIsianSoal(kode: string): void {
  const percobaan = bacaPercobaanSoal(kode);
  tulis(kode, percobaan > 0 ? { isian: { kepala: {}, sel: {} }, diubahPada: 0, jumlahKotak: 0, percobaan } : null);
}

/** Mulai percobaan baru (Kerjakan ulang / Kosongkan): isian kosong, jangkar baru. */
export const naikkanPercobaanSoal = (kode: string): void =>
  tulis(kode, { isian: { kepala: {}, sel: {} }, diubahPada: 0, jumlahKotak: 0, percobaan: bacaPercobaanSoal(kode) + 1 });

function tulis(kode: string, isi: IsianSoal | null): void {
  const { [kode]: _lama, ...sisa } = bacaSemuaIsianSoal();
  simpanMentah(KUNCI_ISIAN_SOAL, JSON.stringify(isi ? { ...sisa, [kode]: isi } : sisa));
}

/** Kotak yang sudah terisi (teks tak kosong), di kepala kolom, sel, maupun baris pengali. */
export const hitungTerisi = (isian: IsianTabel): number =>
  [isian.kepala, isian.pengali ?? {}, ...Object.values(isian.sel).map(baris => baris ?? {})]
    .flatMap(kotak => Object.values(kotak)).filter(nilai => typeof nilai === 'string' && nilai !== '').length;
