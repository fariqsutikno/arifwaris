// Sinkron latar belakang: bila env Supabase ada dan perangkat daring, unduh konten & diksi yang terbit sejak versi lokal
// lalu tulis ke cache (tampil di muat berikutnya). Mengembalikan true bila ada versi baru, supaya main.tsx memancarkan
// PERISTIWA_KONTEN_BARU dan pengguna ditawari muat ulang (tidak mengganti teks diam-diam). Semua kegagalan, termasuk gagal memuat pustaka Supabase, hanya
// dicatat: web tetap jalan dari snapshot/cache yang sudah terpasang.
import type { RepositoriDiksi, RepositoriKonten } from '@waris/data';
import type { Snapshot } from '@waris/data/snapshot';

type Repo = { konten: RepositoriKonten; diksi: RepositoriDiksi };
interface Lingkungan {
  url: string | undefined;
  kunci: string | undefined;
  daring: boolean;
  muatRepo: (url: string, kunci: string) => Promise<Repo>;
  simpan: (snapshot: Snapshot) => Promise<void>;
}

export const PERISTIWA_KONTEN_BARU = 'arif-waris:konten-baru';

export async function sinkronLatar(lokal: Snapshot, { url, kunci, daring, muatRepo, simpan }: Lingkungan): Promise<boolean> {
  if (!url || !kunci || !daring) return false;
  try {
    const { sinkronkan } = await import('@waris/data/snapshot');
    const baru = await sinkronkan(await muatRepo(url, kunci), lokal);
    if (!baru) return false;
    await simpan(baru);
    return true;
  } catch (galat) {
    console.warn('sinkron konten gagal, tetap memakai versi lokal:', galat);
    return false;
  }
}

/** Klien bersama dengan akun pengguna (akun/klien.ts): satu instans dipakai konten maupun sinkron akun. */
export async function muatRepoSupabase(url: string, kunci: string): Promise<Repo> {
  const { muatRepoAkun } = await import('../akun/klien');
  const repo = await muatRepoAkun(url, kunci);
  if (!repo) throw new Error('repo tidak tersedia');
  return repo;
}
