// scripts/ekspor/main.ts
// CLI: baca konten & diksi terbit sebagai anonim (sama seperti web) → apps/web/src/snapshot.json + docs/lampiran-konten/.
// Versi dibaca lebih dulu: bila ada yang terbit di tengah jalan, sinkron web berikutnya tetap mengunduhnya.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buatRepositoriSupabase } from '@waris/data';
import { keMarkdown, susunSnapshot } from './susun';

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anon } = process.env;
if (!url || !anon) throw new Error('SUPABASE_URL dan SUPABASE_ANON_KEY wajib diisi');
const repo = buatRepositoriSupabase(createClient(url, anon, { auth: { persistSession: false } }));
const versi = await repo.konten.versiSekarang();
const [konten, diksi] = await Promise.all([repo.konten.bacaTerbit(), repo.diksi.bacaTerbit()]);
writeFileSync(new URL('../../apps/web/src/snapshot.json', import.meta.url), JSON.stringify(susunSnapshot(versi, konten, diksi), null, 1) + '\n');
const folder = new URL('../../docs/lampiran-konten/', import.meta.url);
mkdirSync(folder, { recursive: true });
for (const [nama, isi] of Object.entries(keMarkdown(konten))) writeFileSync(new URL(nama, folder), isi);
console.log(`versi ${versi}: ${konten.length} konten, ${diksi.length} diksi`);
