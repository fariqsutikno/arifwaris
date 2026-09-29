// Menambah kunci diksi baru ke apps/web/src/snapshot.json (sumber build web; DB diisi darinya lewat konten:pulihkan).
// Masukan: file JSON [{ kunci, id, ar? }]. Halaman = segmen pertama kunci. Kunci yang sudah ada ditolak.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const jalurSnapshot = new URL('../apps/web/src/snapshot.json', import.meta.url);
const [jalurMasukan] = process.argv.slice(2);
if (!jalurMasukan) throw new Error('pakai: pnpm diksi:tambah <file.json>');

const snapshot = JSON.parse(readFileSync(jalurSnapshot, 'utf8'));
const masukan: Array<{ kunci: string; id: string; ar?: string }> = JSON.parse(readFileSync(resolve(process.env.INIT_CWD ?? '.', jalurMasukan), 'utf8'));
const ada = new Set(snapshot.diksi.map((butir: { kunci: string }) => butir.kunci));
for (const { kunci } of masukan) {
  if (!/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(kunci)) throw new Error(`kunci tidak sah: ${kunci}`);
  if (ada.has(kunci)) throw new Error(`kunci sudah ada: ${kunci}`);
  ada.add(kunci);
}
snapshot.diksi.push(...masukan.map(({ kunci, id, ar }) =>
  ({ kunci, halaman: kunci.split('.')[0], id, ar: ar ?? null, versiTerbit: snapshot.versi })));
writeFileSync(jalurSnapshot, `${JSON.stringify(snapshot, null, 1)}\n`);
console.log(`${masukan.length} kunci ditambahkan`);
