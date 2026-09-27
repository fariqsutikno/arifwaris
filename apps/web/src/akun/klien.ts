// Satu klien Supabase untuk web: dipakai sinkron konten dan akun pengguna. Sesi login disimpan (persistSession) dan
// memakai PKCE supaya kode login kembali lewat query (?code=), tidak bentrok dengan rute hash (#/...).
// Pustaka dimuat dinamis supaya tidak masuk bundel awal. Tanpa env → null, web jalan tanpa akun.

import type { RepoAkun } from './sinkron';

type RepoWeb = Awaited<ReturnType<(typeof import('@waris/data'))['buatRepositoriSupabase']>>;
let janjiRepo: Promise<RepoWeb | null> | null = null;

export function muatRepoAkun(
  url = import.meta.env.VITE_SUPABASE_URL as string | undefined,
  kunci = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
): Promise<RepoWeb | null> {
  if (!url || !kunci) return Promise.resolve(null);
  janjiRepo ??= Promise.all([import('@supabase/supabase-js'), import('@waris/data')])
    .then(([{ createClient }, { buatRepositoriSupabase }]) =>
      buatRepositoriSupabase(createClient(url, kunci, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } })))
    .catch(galat => { console.warn('pustaka akun gagal dimuat:', galat); janjiRepo = null; return null; });
  return janjiRepo;
}

export type { RepoAkun };
