// Daftar istilah fikih yang boleh muncul sebagai tooltip; id = slug dari glosarium KB bab 15.

import { teksKamus, type Penyusun, type Potongan } from './segments.js';

/** Id istilah = slug kolom Istilah KB bab 15 (lihat `@waris/content` cariIstilah). */
export const ID_ISTILAH = [
  'tirkah', 'warits', 'faru-warits', 'hajb-hirman', 'hajb-nuqshan', 'mani', 'jam-min-al-ikhwah', 'muashshib',
  'takmilah-tsulutsain', 'kalalah', 'ashabah', 'bi-nafsihi', 'bil-ghair', 'maal-ghair', 'umariyyatain', 'musyarrakah',
  'akdariyyah', 'muaddah', 'muqasamah', 'ashlul-masalah', 'tamatsul', 'tadakhul', 'tawafuq', 'tabayun', 'wafq',
  'adilah', 'aul', 'radd', 'saham', 'ruus', 'inkisar', 'juz-as-sahm', 'tashih', 'munasakhat', 'jamiah',
  'haml', 'mafqud', 'khuntsa-musykil', 'mauquf', 'tilad',
] as const;
export type IdIstilah = typeof ID_ISTILAH[number];

/** Istilah fikih sebagai potongan tooltip; `contoh` = contoh dari kasus ini sendiri. */
export const istilah = (id: IdIstilah, teks: string, contoh?: string): Potongan =>
  ({ jenis: 'istilah', istilah: id, teks, ...(contoh ? { contoh } : {}) });

/** Istilah bertooltip berlabel diksi `narasi.umum.istilah.<id>` (label baku yang sama di semua gaya). */
export const istilahNarasi = (penyusun: Penyusun, id: IdIstilah, contoh?: string): Potongan =>
  istilah(id, teksKamus(penyusun, `narasi.umum.istilah.${id.replaceAll('-', '_')}`), contoh);
