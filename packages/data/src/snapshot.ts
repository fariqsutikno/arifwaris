// packages/data/src/snapshot.ts
// Konten & diksi terbit yang dibawa web: snapshot bawaan hasil build (scripts/ekspor), lalu cache perangkat, lalu
// pembaruan dari server sejak versi lokal (spec "Alur data di web pengguna"). isi disimpan mentah (bentuk keJson) dan
// divalidasi saat dipasang lewat saringValid. Tidak bergantung pada supabase-js supaya bundel utama web tetap ringan.
import type { DiksiTerbit, KontenTerbit, RepositoriDiksi, RepositoriKonten } from './antarmuka.js';
import { keJson, type JenisKonten } from '@waris/content';
import type { BarisTerbitMentah } from './saring.js';
export { saringValid, type BarisTerbitMentah } from './saring.js';

export interface Snapshot { versi: number; konten: BarisTerbitMentah[]; diksi: DiksiTerbit[] }

/** Cache dipakai hanya bila lebih baru dari snapshot bawaan; deploy baru bisa membawa versi lebih tinggi dari cache lama. */
export const pilihAwal = (bawaan: Snapshot, cache: Snapshot | null): Snapshot =>
  cache && cache.versi > bawaan.versi ? cache : bawaan;

export function gabungSnapshot(lama: Snapshot, versi: number, konten: BarisTerbitMentah[], diksi: DiksiTerbit[]): Snapshot {
  const menurutEntri = new Map(lama.konten.map(baris => [baris.entriId, baris]));
  for (const baris of konten) menurutEntri.set(baris.entriId, baris);
  const menurutKunci = new Map(lama.diksi.map(butir => [butir.kunci, butir]));
  for (const butir of diksi) menurutKunci.set(butir.kunci, butir);
  return { versi, konten: [...menurutEntri.values()], diksi: [...menurutKunci.values()] };
}

export async function sinkronkan(repo: { konten: RepositoriKonten; diksi: RepositoriDiksi }, lokal: Snapshot): Promise<Snapshot | null> {
  try {
    const versi = await repo.konten.versiSekarang();
    if (versi <= lokal.versi) return null;
    const [konten, diksi] = await Promise.all([repo.konten.bacaTerbit({ sejakVersi: lokal.versi }), repo.diksi.bacaTerbit(lokal.versi)]);
    return gabungSnapshot(lokal, versi, konten.map(keMentah), diksi);
  } catch (galat) {
    console.warn('sinkron konten gagal, tetap memakai versi lokal:', galat);
    return null;
  }
}

export const keMentah = (baris: KontenTerbit): BarisTerbitMentah => ({ ...baris, isi: keJson(baris.jenis as JenisKonten, baris.isi as never) });
