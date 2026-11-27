// Satu kasus bank biasa → bahan soal kuis: Kasus siap engine, hasil, label, tingkat, modul, fakta, pertanyaan yang sah.
// Dipakai pembangun (sapuan) dan pembuat soal dari kode supaya keduanya membaca engine dengan cara yang sama.

import type { Tingkat } from '@waris/content';
import { jalankan, type HasilOk } from '../../jalankan.js';
import type { Kasus } from '../../kasus.js';
import { kasusBiasaDariKunci } from '../bangunKasus.js';
import type { KasusBiasa } from '../kodeBiasa.js';
import { labelSoal } from '../labelSoal.js';
import { modulSoal, tingkatSoal } from '../tingkatModul.js';
import { faktaDariHasil, type FaktaKasus } from './fakta.js';

export type AnalisisKasus =
  | { ok: true; kasus: Kasus; hasil: HasilOk; fakta: FaktaKasus; label: string[]; tingkat: Tingkat; modul: number[] }
  | { ok: false; galat: 'KASUS_TIDAK_SAH' | 'TIDAK_DIDUKUNG' | 'PERLU_INPUT' | 'GALAT_ENGINE' | 'BUKAN_KUIS_ANGKA' };

export function analisisKasus(dasar: KasusBiasa): AnalisisKasus {
  let kasus: Kasus;
  try {
    kasus = kasusBiasaDariKunci(dasar);
  } catch {
    return { ok: false, galat: 'KASUS_TIDAK_SAH' };
  }
  const tampil = jalankan(kasus);
  if (tampil.jenis === 'galat') return { ok: false, galat: 'GALAT_ENGINE' };
  if (tampil.jenis !== 'biasa') return { ok: false, galat: 'BUKAN_KUIS_ANGKA' };
  if (tampil.hasil.status !== 'OK') return { ok: false, galat: tampil.hasil.status === 'PERLU_INPUT' ? 'PERLU_INPUT' : 'TIDAK_DIDUKUNG' };
  const fakta = faktaDariHasil(dasar, tampil.hasil);
  if (!fakta) return { ok: false, galat: 'BUKAN_KUIS_ANGKA' };
  const label = labelSoal(tampil.hasil);
  return { ok: true, kasus, hasil: tampil.hasil, fakta, label, tingkat: tingkatSoal(label), modul: modulSoal(label) };
}

const TURUN_SATU: Readonly<Record<Tingkat, Tingkat>> = { dasar: 'dasar', menengah: 'dasar', sulit: 'menengah' };

/** Spec soal kuis §3.3: menebak siapa yang gugur atau ashabah lebih ringan daripada menghitung bagian, jadi turun satu tingkat (minimal dasar). */
export const tingkatKuis = (tingkatKasus: Tingkat, jenis: string): Tingkat =>
  (jenis === 'gugur' || jenis === 'ashabah' ? TURUN_SATU[tingkatKasus] : tingkatKasus);
