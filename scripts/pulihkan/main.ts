// scripts/pulihkan/main.ts
// CLI: isi database dari apps/web/src/snapshot.json (lihat tulis.ts; yang sudah terbit dilewati).
import { readFileSync } from 'node:fs';
import { masukSebagaiImpor } from './masuk';
import { pulihkanDariSnapshot } from './tulis';

const snapshot = JSON.parse(readFileSync(new URL('../../apps/web/src/snapshot.json', import.meta.url), 'utf8'));
const { url, repo } = await masukSebagaiImpor();
console.log(`${url}:`, await pulihkanDariSnapshot(repo, snapshot, console.log));
