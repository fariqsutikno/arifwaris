// scripts/pulihkan/main.ts
// CLI: isi database dari apps/web/src/snapshot.json + rujukan dari tabel docs/kb. Butuh SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// dari proyek tujuan (shell atau scripts/.env). Memastikan akun impor ber-peran admin (kata sandi acak per jalan), masuk, lalu menulis.
import '../env';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buatRepositoriSupabase } from '@waris/data';
import { barisRujukanKb, pulihkanDariSnapshot } from './tulis';

const snapshot = JSON.parse(readFileSync(new URL('../../apps/web/src/snapshot.json', import.meta.url), 'utf8'));
const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: servis } = process.env;
if (!url || !anon || !servis) throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY wajib diisi (di shell, atau salin scripts/.env.example jadi scripts/.env)');

const EMAIL_IMPOR = 'impor@arif-waris.local';
const sandi = randomUUID();
const admin = createClient(url, servis, { auth: { persistSession: false } });
const { data: daftar } = await admin.auth.admin.listUsers();
const ada = daftar?.users.find(u => u.email === EMAIL_IMPOR);
const userId = ada
  ? (await admin.auth.admin.updateUserById(ada.id, { password: sandi })).data.user!.id
  : (await admin.auth.admin.createUser({ email: EMAIL_IMPOR, password: sandi, email_confirm: true })).data.user!.id;
await admin.from('peran_pengguna').upsert({ user_id: userId, peran: 'admin' });

const klien = createClient(url, anon, { auth: { persistSession: false } });
const { error } = await klien.auth.signInWithPassword({ email: EMAIL_IMPOR, password: sandi });
if (error) throw error;
console.log(`${url}:`, await pulihkanDariSnapshot(buatRepositoriSupabase(klien), { ...snapshot, konten: [...barisRujukanKb(), ...snapshot.konten] }));
