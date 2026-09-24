import type { Segment } from './segments.js';

/** Id istilah = slug kolom Istilah KB bab 15 (lihat `@waris/content` findTerm). */
export const TERM_IDS = [
  'tirkah', 'warits', 'faru-warits', 'hajb-hirman', 'hajb-nuqshan', 'mani', 'jam-min-al-ikhwah', 'muashshib',
  'takmilah-tsulutsain', 'kalalah', 'ashabah', 'bi-nafsihi', 'bil-ghair', 'maal-ghair', 'umariyyatain', 'musyarrakah',
  'akdariyyah', 'muaddah', 'muqasamah', 'ashlul-masalah', 'tamatsul', 'tadakhul', 'tawafuq', 'tabayun', 'wafq',
  'adilah', 'aul', 'radd', 'saham', 'ruus', 'inkisar', 'juz-as-sahm', 'tashih', 'munasakhat', 'jamiah',
] as const;
export type TermId = typeof TERM_IDS[number];

/** Istilah fikih sebagai potongan tooltip; `example` = contoh dari kasus ini sendiri. */
export const term = (id: TermId, text: string, example?: string): Segment =>
  ({ jenis: 'term', term: id, text, ...(example ? { example } : {}) });
