// scripts/impor/main.ts
// CLI impor. `--periksa`: cetak galat saja, tanpa DB. Tanpa flag: butuh SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY; memastikan akun impor ber-peran admin (kata sandi acak per jalan), masuk, lalu menulis.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buatRepositoriSupabase } from '@waris/data';
import type { PetaDiksi } from '../diksi/rencana';
import { kumpulkanKontenLama } from './kumpul';
import { tulisKeRepositori } from './tulis';

const bacaJson = <T>(jalur: string): T => JSON.parse(readFileSync(new URL(jalur, import.meta.url), 'utf8')) as T;
const peta = bacaJson<PetaDiksi>('../diksi/peta.json');
const { baris, galat } = kumpulkanKontenLama(peta, bacaJson<Record<string, string[]>>('./refs-manual.json'));
if (galat.length) {
  console.error(galat.join('\n'));
  console.error(`\n${galat.length} galat; tidak ada yang ditulis.`);
  process.exit(1);
}
if (process.argv.includes('--periksa')) {
  console.log(`siap: ${baris.length} konten, ${peta.diksi.length} diksi`);
  process.exit(0);
}

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: servis } = process.env;
if (!url || !anon || !servis) throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY wajib diisi');
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
console.log(await tulisKeRepositori(buatRepositoriSupabase(klien), baris, peta.diksi));
