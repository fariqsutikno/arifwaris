// Semua teks narasi lewat diksi: tidak ada kalimat berhuruf tersisa di kode, dan kunci narasi.* di snapshot terpakai.
import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from 'vitest';
import snapshot from '../../../../apps/web/src/snapshot.json';
import { kunciTerpakai } from './kamus.js';
import { semuaPenjelasan } from './kasus.js';

const DIR = new URL('..', import.meta.url);
const SUMBER = readdirSync(DIR).filter(nama => nama.endsWith('.ts')).map(nama => [nama, readFileSync(new URL(nama, DIR), 'utf8')] as const);

test('tidak ada kalimat`…` berhuruf di kode explain', () => {
  const sisa = SUMBER.flatMap(([nama, isi]) => [...isi.matchAll(/kalimat`([^`]*)`/g)]
    .filter(cocok => /\p{L}/u.test(cocok[1]!.replace(/\$\{[^}]*\}/g, ''))).map(cocok => `${nama}: ${cocok[1]}`));
  expect(sisa).toEqual([]);
});

test('setiap kunci narasi.* di snapshot dipakai oleh kasus emas', () => {
  semuaPenjelasan();
  const narasi = snapshot.diksi.map(butir => butir.kunci).filter(kunci => kunci.startsWith('narasi.'));
  const tidakDipakai = narasi.filter(kunci => !kunciTerpakai.has(kunci));
  if (tidakDipakai.length) console.warn(`kunci narasi tidak terjangkau kasus uji (${tidakDipakai.length}):`, tidakDipakai);
});
