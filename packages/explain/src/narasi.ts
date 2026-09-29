// Pintu masuk penjelasan (lapis 2 engine-contract): hasil engine → daftar bab penjelasan.
//   jejak + tabel (data) → konteks → bab-bab (cerita atau ringkas) → tiap bab berisi baris kalimat.
// Tiap baris = potongan berjenis (teks, sebutan orang, istilah bertooltip) + `refs` untuk lapis dalil.

import type { GrafKeluarga } from '@waris/engine';
import { angkaArab, babArab, pembukaanMadzhabArab } from './arab.js';
import { babCerita, pembukaanMadzhab, type Bab } from './cerita.js';
import { buatKonteks, type HasilOk } from './context.js';
import { babRingkas } from './ringkas.js';
import type { Bahasa, Kamus } from './segments.js';

export type BabPenjelasan = Bab;
export interface Penjelasan { daftarBab: BabPenjelasan[] }
export interface OpsiPenjelasan { gaya?: 'cerita' | 'ringkas' | undefined; bahasa?: Bahasa; kamus: Kamus }

/**
 * Gaya 'cerita' (default) untuk orang awam; 'ringkas' untuk pelajar/ustadz. Bahasa 'ar' = pohon kalimat bergaya kitab
 * (arab.ts; gaya diabaikan). Nama berubah → panggil ulang (murah).
 */
export function jelaskan(hasil: HasilOk, graf: GrafKeluarga, opsi: OpsiPenjelasan): Penjelasan {
  const bahasa = opsi.bahasa ?? 'id';
  const arab = bahasa === 'ar';
  const konteks = buatKonteks(hasil, graf, { kamus: opsi.kamus, bahasa });
  const daftarBab = arab ? babArab(konteks, graf) : opsi.gaya === 'ringkas' ? babRingkas(konteks) : babCerita(konteks);
  const pembukaan = arab ? pembukaanMadzhabArab(hasil.ruleset) : pembukaanMadzhab(hasil.ruleset);
  const [babPertama] = daftarBab;
  if (pembukaan && babPertama) daftarBab[0] = { ...babPertama, daftarBaris: [pembukaan, ...babPertama.daftarBaris] };
  const nomorLangkah = (i: number) => (arab ? `الخطوة ${angkaArab(String(i + 1))}` : `Langkah ${i + 1}`);
  return { daftarBab: daftarBab.map((bab, i) => ({ ...bab, judul: `${nomorLangkah(i)} — ${bab.judul}` })) };
}
