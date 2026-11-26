// Satu-satunya pintu web ke bank soal di basis data. Hanya membaca (RPC cari_soal terbuka untuk anon), jadi klien
// sendiri tanpa sesi. Tanpa env Supabase: pengembangan lokal memakai bank memori berisi sampel kecil
// (sampelDev.ts, tidak ikut bundel produksi); produksi tanpa env = tidak terhubung (null).

import type { RepositoriBankSoal } from '@waris/data';

let janjiBank: Promise<RepositoriBankSoal | null> | null = null;

export function muatBankSoal(
  url = import.meta.env.VITE_SUPABASE_URL as string | undefined,
  kunci = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
): Promise<RepositoriBankSoal | null> {
  if (!url || !kunci) return import.meta.env.DEV ? import('./sampelDev').then(isi => isi.buatBankSampel()) : Promise.resolve(null);
  janjiBank ??= Promise.all([import('@supabase/supabase-js'), import('@waris/data')])
    .then(([{ createClient }, { buatBankSupabase }]) =>
      buatBankSupabase(createClient(url, kunci, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })))
    .catch(galat => { console.warn('bank soal gagal dimuat:', galat); janjiBank = null; return null; });
  return janjiBank;
}
