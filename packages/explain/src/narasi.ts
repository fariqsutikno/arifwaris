// Pintu masuk penjelasan (lapis 2 engine-contract): hasil engine → daftar bab penjelasan.
//   jejak + tabel (data) → konteks → bab-bab (cerita atau ringkas) → tiap bab berisi baris kalimat.
// Tiap baris = potongan berjenis (teks, sebutan orang, istilah bertooltip) + `refs` untuk lapis dalil.

import type { GrafKeluarga } from '@waris/engine';
import { angkaArab, babArab, babHasilArab, babTirkahArab, buatSebutArab, pembukaanMadzhabArab } from './arab.js';
import { babCerita, babHarta, babHasil, pembukaanMadzhab, type Bab } from './cerita.js';
import { buatKonteks, type HasilOk, type Konteks } from './context.js';
import { adaDzawilArham, babDzawilArham, buatSebutArham } from './dzawilArham.js';
import { babRingkas } from './ringkas.js';
import { teksKamus, type Bahasa, type Kamus } from './segments.js';

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
  const daftarBab = adaDzawilArham(hasil) ? babUntukDzawilArham(konteks, graf, arab)
    : arab ? babArab(konteks, graf) : opsi.gaya === 'ringkas' ? babRingkas(konteks) : babCerita(konteks);
  const pembukaan = arab ? pembukaanMadzhabArab(konteks.penyusun, hasil.ruleset) : pembukaanMadzhab(konteks.penyusun, hasil.ruleset);
  const [babPertama] = daftarBab;
  if (pembukaan && babPertama) daftarBab[0] = { ...babPertama, daftarBaris: [pembukaan, ...babPertama.daftarBaris] };
  const nomorLangkah = (i: number) => (arab ? teksKamus(konteks.penyusun, 'narasi.arab.langkah', { nomor: angkaArab(String(i + 1)) }) : teksKamus(konteks.penyusun, 'narasi.umum.langkah', { nomor: String(i + 1) }));
  return { daftarBab: daftarBab.map((bab, i) => ({ ...bab, judul: `${nomorLangkah(i)} — ${bab.judul}` })) };
}

/** Dzawil arham: harta → tanzil → hasil. Bab fardh/ashl/tashih pipeline tidak berlaku (pembagi berasal dari tanzil); gaya ringkas = cerita. */
function babUntukDzawilArham(konteks: Konteks, graf: GrafKeluarga, arab: boolean): BabPenjelasan[] {
  const sebut = buatSebutArham(konteks, graf, arab ? buatSebutArab(konteks, graf) : ids => konteks.sebutan.sebut(ids));
  const konteksArham: Konteks = { ...konteks, sebutan: { ...konteks.sebutan, sebut } };
  return [
    arab ? babTirkahArab(konteksArham) : babHarta(konteksArham),
    babDzawilArham(konteksArham, sebut),
    arab ? babHasilArab(konteksArham, sebut) : babHasil(konteksArham),
  ].filter((bab): bab is BabPenjelasan => bab !== undefined);
}
