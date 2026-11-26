// Satu pintu bank soal: kode → kasus untuk layar + label + tingkat + modul. Kunci jawaban tidak dibawa;
// engine menghitungnya saat layar membutuhkan. Hanya keluarga `biasa` (G1); keluarga lain menyusul di G3.

import type { Kasus } from '../kasus.js';
import { jalankan } from '../jalankan.js';
import { kasusDariSoal } from '../soal.js';
import { uraiKodeSoal, type KodeGalatSoal } from './kodeSoal.js';
import { labelSoal } from './labelSoal.js';
import { modulSoal, tingkatSoal } from './tingkatModul.js';
import type { Tingkat } from '@waris/content';

/** Harta soal bank tetap satu nilai: soal menguji pembagian, bukan aritmetika rupiah (keputusan pemilik 2026-11-25). */
export const HARTA_SOAL_BANK = 120_000_000n;

export type SoalDariKode =
  | { ok: true; kasus: Kasus; label: string[]; tingkat: Tingkat; modul: number[] }
  | { ok: false; galat: KodeGalatSoal | 'TIDAK_DIDUKUNG' };

export function soalDariKode(kode: string): SoalDariKode {
  const urai = uraiKodeSoal(kode);
  if (!urai.ok) return urai;
  const { pewaris, ahliWaris } = urai.kasus;
  const daftarKunci = Object.entries(ahliWaris).flatMap(([kunci, jumlah]) => Array<string>(jumlah).fill(kunci));
  try {
    const kasus = kasusDariSoal({ pewaris, ahliWaris: daftarKunci, harta: HARTA_SOAL_BANK, harapan: { saham: {}, ashlAkhir: 0n } });
    const tampil = jalankan(kasus);
    if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') return { ok: false, galat: 'TIDAK_DIDUKUNG' };
    const label = labelSoal(tampil.hasil);
    return { ok: true, kasus, label, tingkat: tingkatSoal(label), modul: modulSoal(label) };
  } catch {
    return { ok: false, galat: 'TIDAK_DIDUKUNG' };
  }
}
