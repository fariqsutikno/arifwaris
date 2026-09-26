// Pintu masuk penjelasan (lapis 2 engine-contract): hasil engine → daftar bab penjelasan.
//   jejak + tabel (data) → konteks → bab-bab (cerita atau ringkas) → tiap bab berisi baris kalimat.
// Tiap baris = potongan berjenis (teks, sebutan orang, istilah bertooltip) + `refs` untuk lapis dalil.

import type { HasilEngine, GrafKeluarga } from '@waris/engine';
import { angkaArab, babArab } from './arab.js';
import { babCerita, type Bab } from './cerita.js';
import { buatKonteks } from './context.js';
import { babRingkas } from './ringkas.js';

export type BabPenjelasan = Bab;
export interface Penjelasan { daftarBab: BabPenjelasan[] }

/**
 * Mode 'cerita' (default) untuk orang awam; 'ringkas' untuk pelajar/ustadz; 'arab' = ringkas berbahasa Arab untuk santri.
 * Nama berubah → panggil ulang (murah).
 */
export function jelaskan(
  hasil: Extract<HasilEngine, { status: 'OK' }>,
  graf: GrafKeluarga,
  opsi: { mode?: 'cerita' | 'ringkas' | 'arab' } = {},
): Penjelasan {
  const konteks = buatKonteks(hasil, graf);
  const daftarBab = opsi.mode === 'arab' ? babArab(konteks, graf) : opsi.mode === 'ringkas' ? babRingkas(konteks) : babCerita(konteks);
  const nomorLangkah = (i: number) => (opsi.mode === 'arab' ? `الخطوة ${angkaArab(String(i + 1))}` : `Langkah ${i + 1}`);
  return { daftarBab: daftarBab.map((bab, i) => ({ ...bab, judul: `${nomorLangkah(i)} — ${bab.judul}` })) };
}
