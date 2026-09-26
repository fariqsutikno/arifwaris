// packages/data/src/saring.ts
// Validasi baris konten terbit dari sumber mana pun (DB, cache, snapshot). Yang tidak lolos skema dibuang dan dicatat,
// supaya satu entri rusak tidak menjatuhkan seluruh web.
import { bacaIsi, type JenisKonten } from '@waris/content';
import type { KontenTerbit } from './antarmuka.js';

export type BarisTerbitMentah = Omit<KontenTerbit, 'isi'> & { isi: unknown };

export function saringValid(daftar: BarisTerbitMentah[]): KontenTerbit[] {
  return daftar.flatMap(baris => {
    const hasil = bacaIsi(baris.jenis as JenisKonten, baris.isi);
    if (hasil.ok) return [{ ...baris, isi: hasil.isi } as KontenTerbit];
    console.warn(`konten ${baris.jenis}/${baris.slug} dibuang: ${hasil.galat}`);
    return [];
  });
}
