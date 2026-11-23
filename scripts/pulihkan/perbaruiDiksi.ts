// scripts/pulihkan/perbaruiDiksi.ts
// CLI: terbitkan ulang teks diksi yang sudah terbit dari snapshot.json, HANYA untuk kunci yang disebut di argumen
// (konten:pulihkan melewati kunci terbit). Sengaja per kunci: suntingan portal yang lebih baru dari snapshot tidak tertimpa.
// pakai: pnpm --filter @waris/skrip perbarui-diksi <kunci> [kunci ...]
import { readFileSync } from 'node:fs';
import { masukSebagaiImpor } from './masuk';

const daftarKunci = process.argv.slice(2);
if (daftarKunci.length === 0) throw new Error('pakai: perbarui-diksi <kunci> [kunci ...]');
const snapshot: { diksi: Array<{ kunci: string; id: string; ar: string | null }> } =
  JSON.parse(readFileSync(new URL('../../apps/web/src/snapshot.json', import.meta.url), 'utf8'));
const { url, repo } = await masukSebagaiImpor();
const terbit = new Map((await repo.diksi.bacaTerbit()).map(d => [d.kunci, d]));
for (const kunci of daftarKunci) {
  const baru = snapshot.diksi.find(d => d.kunci === kunci);
  if (!baru) throw new Error(`kunci tidak ada di snapshot: ${kunci}`);
  const lama = terbit.get(kunci);
  if (!lama) throw new Error(`kunci belum terbit di ${url}: ${kunci} (pakai konten:pulihkan)`);
  if (lama.id === baru.id && lama.ar === baru.ar) { console.log(`${kunci}: sudah sama`); continue; }
  const revisi = await repo.diksi.buatDraf(kunci, baru.id, baru.ar, 'diselaraskan dari snapshot.json');
  await repo.diksi.terbitkanLangsung(revisi);
  console.log(`${kunci}:\n  lama: ${lama.id} | ${lama.ar}\n  baru: ${baru.id} | ${baru.ar}`);
}
console.log(`selesai di ${url}`);
