// Sinkron latar belakang: bila env Supabase ada dan perangkat daring, unduh konten & diksi yang terbit sejak versi lokal
// lalu tulis ke cache (tampil di muat berikutnya). Semua kegagalan, termasuk gagal memuat pustaka Supabase, hanya
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

export async function sinkronLatar(lokal: Snapshot, { url, kunci, daring, muatRepo, simpan }: Lingkungan): Promise<void> {
  if (!url || !kunci || !daring) return;
  try {
    const { sinkronkan } = await import('@waris/data/snapshot');
    const baru = await sinkronkan(await muatRepo(url, kunci), lokal);
    if (baru) await simpan(baru);
  } catch (galat) {
    console.warn('sinkron konten gagal, tetap memakai versi lokal:', galat);
  }
}

/** Pustaka Supabase dimuat dinamis supaya tidak masuk bundel awal. */
export async function muatRepoSupabase(url: string, kunci: string): Promise<Repo> {
  const [{ createClient }, { buatRepositoriSupabase }] = await Promise.all([import('@supabase/supabase-js'), import('@waris/data')]);
  return buatRepositoriSupabase(createClient(url, kunci, { auth: { persistSession: false } }));
}
