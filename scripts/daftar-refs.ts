// scripts/daftar-refs.ts
// docs/kb (tabel "Dasar dan Rujukan" tiap bab) → supabase/seed.sql. Dijalankan dengan vite-node karena
// packages/content mengimpor berkas KB lewat `?raw`. Jalankan ulang setiap KB berubah, lalu `pnpm db:reset`.
import { writeFileSync } from 'node:fs';
import { RUJUKAN, sqlDaftarRefs } from '@waris/content';

const KEPALA = '-- DIHASILKAN scripts/daftar-refs.ts dari docs/kb. Jangan disunting manual.\n';
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), KEPALA + sqlDaftarRefs(RUJUKAN));
console.log(`daftar_refs: ${new Set(RUJUKAN.map(rujukan => rujukan.kode)).size} kode`);
