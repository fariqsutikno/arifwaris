// Edge Function hapus-akun (UU PDP, hak hapus): memverifikasi sesi lalu menghapus pengguna dengan service role.
// Semua tabel data pengguna `on delete cascade` ke auth.users (dijaga uji pgTAP 24), jadi satu penghapusan cukup.
// Akun yang pernah menulis/memeriksa konten terikat jejak editorial (FK tanpa cascade) → 409 AKUN_PENULIS; admin menangani.
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY disediakan Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const balas = (status: number, isi: unknown) =>
  new Response(JSON.stringify(isi), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return balas(405, { galat: 'METODE_TIDAK_DIIZINKAN' });
  const url = Deno.env.get('SUPABASE_URL')!;
  const klien = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }, auth: { persistSession: false },
  });
  const { data: { user } } = await klien.auth.getUser();
  if (!user) return balas(401, { galat: 'BELUM_MASUK' });
  const servis = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error } = await servis.auth.admin.deleteUser(user.id);
  if (!error) return balas(200, { terhapus: true });
  // GoTrue hanya menjawab "Database error deleting user"; sebabnya diperiksa langsung: jejak editorial menahan FK tanpa cascade.
  const jejak = await Promise.all([
    servis.from('revisi').select('id', { head: true, count: 'exact' }).or(`dibuat_oleh.eq.${user.id},diperiksa_oleh.eq.${user.id}`),
    servis.from('revisi_diksi').select('id', { head: true, count: 'exact' }).or(`dibuat_oleh.eq.${user.id},diperiksa_oleh.eq.${user.id}`),
    servis.from('jejak_entri').select('id', { head: true, count: 'exact' }).eq('pelaku', user.id),
  ]);
  return jejak.some(hasil => (hasil.count ?? 0) > 0) ? balas(409, { galat: 'AKUN_PENULIS' }) : balas(500, { galat: 'GAGAL_MENGHAPUS' });
});
