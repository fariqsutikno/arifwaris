// Posisi dalam linimasa: satu indeks datar menelusuri semua langkah dari semua tahap; tampilan Teks dan Sinema memakainya bersama,
// supaya pindah tampilan tidak menggeser posisi.

import type { KodeSel, Linimasa, Visual } from '@waris/explain';

export interface Posisi { tahap: number; langkah: number }

export const urutanLinimasa = (linimasa: Linimasa): Posisi[] =>
  linimasa.tahap.flatMap((tahap, nomorTahap) => tahap.langkah.map((_, nomorLangkah) => ({ tahap: nomorTahap, langkah: nomorLangkah })));

/** Sel tabel yang sudah terisi sampai indeks `sampai`, dan yang baru terisi tepat di indeks itu. */
export function selSampai(linimasa: Linimasa, urutan: Posisi[], sampai: number): { terbuka: Set<KodeSel>; kini: Set<KodeSel> } {
  const sel = (posisi: Posisi) => linimasa.tahap[posisi.tahap]!.langkah[posisi.langkah]!.sel ?? [];
  return {
    terbuka: new Set(urutan.slice(0, sampai + 1).flatMap(sel)),
    kini: new Set(urutan[sampai] ? sel(urutan[sampai]) : []),
  };
}

type JenisVisual = Visual['jenis'];
/** Visual terakhir berjenis `jenis` sampai indeks `sampai`; `diTahapIni` membatasi pencarian pada tahap langkah itu. */
export function visualTerakhir<J extends JenisVisual>(linimasa: Linimasa, urutan: Posisi[], sampai: number, jenis: J, diTahapIni = false): Extract<Visual, { jenis: J }> | undefined {
  const sekarang = urutan[sampai];
  for (let indeks = sampai; indeks >= 0; indeks--) {
    const posisi = urutan[indeks]!;
    if (diTahapIni && posisi.tahap !== sekarang?.tahap) return undefined;
    const visual = linimasa.tahap[posisi.tahap]!.langkah[posisi.langkah]!.visual;
    if (visual?.jenis === jenis) return visual as Extract<Visual, { jenis: J }>;
  }
  return undefined;
}
