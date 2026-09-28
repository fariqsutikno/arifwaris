/// <reference types="node" />
// Pemakaian rujukan KB oleh aturan kalkulator, dihitung saat build dari anotasi [Rxx-y] di packages/engine (tanpa tes).
// Disajikan sebagai modul virtual `virtual:refs-engine` (kode → jumlah tempat), supaya panel "Dipakai di" rujukan
// bisa memberi tahu bahwa koreksinya perlu diperiksa developer.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

export function hitungRefsEngine(daftarIsi: readonly string[]): Record<string, number> {
  const jumlah: Record<string, number> = {};
  for (const isi of daftarIsi) for (const [kode] of isi.matchAll(/\bR\d{2}-\d+\b/g)) jumlah[kode] = (jumlah[kode] ?? 0) + 1;
  return jumlah;
}

export function pluginRefsEngine(akarEngine: string): Plugin {
  const ID = 'virtual:refs-engine';
  const baca = () => readdirSync(akarEngine, { recursive: true, encoding: 'utf8' })
    .filter(jalur => /\.ts$/.test(jalur) && !jalur.includes('__tests__'))
    .map(jalur => readFileSync(join(akarEngine, jalur), 'utf8'));
  return {
    name: 'refs-engine',
    resolveId: id => (id === ID ? `\0${ID}` : undefined),
    load: id => (id === `\0${ID}` ? `export default ${JSON.stringify(hitungRefsEngine(baca()))};` : undefined),
  };
}
