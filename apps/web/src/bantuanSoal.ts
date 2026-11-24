// Jejak bantuan per soal di perangkat ini (tidak disinkron): XP hangus (sudah ada kolom dibuka) dan predikat percobaan
// terakhir yang selesai. Hanya untuk tampilan (penanda XP, keterangan daftar Latihan); XP sebenarnya milik server.

import { bacaMentah, simpanMentah } from './penyimpanan';
import type { PredikatSoal } from './tanggaBantuan';

const KUNCI_BANTUAN_SOAL = 'arif-waris:bantuan-soal';

export interface BantuanSoal { xpHangus: boolean; predikat?: PredikatSoal }

function bacaSemua(): Record<string, BantuanSoal> {
  try {
    const nilai: unknown = JSON.parse(bacaMentah(KUNCI_BANTUAN_SOAL) ?? '{}');
    return nilai && typeof nilai === 'object' && !Array.isArray(nilai) ? nilai as Record<string, BantuanSoal> : {};
  } catch {
    return {};
  }
}

export const bacaBantuanSoal = (kode: string): BantuanSoal => bacaSemua()[kode] ?? { xpHangus: false };
export const bacaSemuaBantuanSoal = bacaSemua;

const ubah = (kode: string, bagian: Partial<BantuanSoal>): void => {
  simpanMentah(KUNCI_BANTUAN_SOAL, JSON.stringify({ ...bacaSemua(), [kode]: { ...bacaBantuanSoal(kode), ...bagian } }));
};

export const tandaiXpHangus = (kode: string): void => ubah(kode, { xpHangus: true });
export const catatPredikatSoal = (kode: string, predikat: PredikatSoal): void => ubah(kode, { predikat });
export const hapusSemuaBantuanSoal = (): void => { simpanMentah(KUNCI_BANTUAN_SOAL, '{}'); };
