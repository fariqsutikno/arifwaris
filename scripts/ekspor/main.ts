// scripts/ekspor/main.ts
// CLI: baca konten & diksi terbit sebagai anonim (sama seperti web) → apps/web/src/snapshot.json + docs/lampiran-konten/
// + tabel rujukan di docs/kb (lalu jalankan `pnpm db:refs` bila ada rujukan baru, dan cek diff KB sebelum commit).
// Versi dibaca lebih dulu: bila ada yang terbit di tengah jalan, sinkron web berikutnya tetap mengunduhnya.
import '../env';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buatRepositoriSupabase } from '@waris/data';
import { keMarkdown, susunSnapshot, tulisBerkasKb } from './susun';

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anon } = process.env;
if (!url || !anon) throw new Error('SUPABASE_URL dan SUPABASE_ANON_KEY wajib diisi (di shell, atau salin scripts/.env.example jadi scripts/.env)');
const repo = buatRepositoriSupabase(createClient(url, anon, { auth: { persistSession: false } }));
const versi = await repo.konten.versiSekarang();
const [konten, diksi] = await Promise.all([repo.konten.bacaTerbit(), repo.diksi.bacaTerbit()]);
writeFileSync(new URL('../../apps/web/src/snapshot.json', import.meta.url), JSON.stringify(susunSnapshot(versi, konten, diksi), null, 1) + '\n');
const folder = new URL('../../docs/lampiran-konten/', import.meta.url);
mkdirSync(folder, { recursive: true });
for (const [nama, isi] of Object.entries(keMarkdown(konten))) writeFileSync(new URL(nama, folder), isi);
const folderKb = new URL('../../docs/kb/', import.meta.url);
const berkasKb = Object.fromEntries(readdirSync(folderKb).filter(nama => nama.endsWith('.md')).map(nama => [nama, readFileSync(new URL(nama, folderKb), 'utf8')]));
const kbBerubah = tulisBerkasKb(konten, berkasKb);
for (const [nama, isi] of Object.entries(kbBerubah)) writeFileSync(new URL(nama, folderKb), isi);
console.log(`docs/kb: ${Object.keys(kbBerubah).length} berkas diperbarui${Object.keys(kbBerubah).join(', ') ? ` (${Object.keys(kbBerubah).join(', ')})` : ''}`);
console.log(`versi ${versi}: ${konten.length} konten, ${diksi.length} diksi`);
