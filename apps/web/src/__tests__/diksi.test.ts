// apps/web/src/__tests__/diksi.test.ts
// Spec "Diksi": ID di kode ⊆ ID di snapshot; ID di snapshot yang tidak dipakai kode dilaporkan.
import { expect, it, test } from 'vitest';
import { snapshotTerpasang } from '../konten/sumber';

const SUMBER = (import.meta as unknown as { glob: (pola: string[], opsi: object) => Record<string, string> })
  .glob(['../**/*.ts', '../**/*.tsx', '!../__tests__/**'], { query: '?raw', import: 'default', eager: true });
const ambil = (pola: RegExp) => new Set(Object.values(SUMBER).flatMap(isi => [...isi.matchAll(pola)].map(c => c[1]!)));
const KUNCI_T = ambil(/\bt\('([a-z0-9_]+(?:\.[a-z0-9_]+)+)'/g);
const SLUG_EDUKASI = ambil(/\bteksEdukasi\('([^']+)'\)/g);

test('tidak ada lagi t() berisi teks Indonesia', () => {
  const sisa = Object.entries(SUMBER).flatMap(([jalur, isi]) =>
    [...isi.matchAll(/\bt\((['"])(.*?)\1/g)].filter(c => !/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(c[2]!)).map(c => `${jalur}: ${c[2]}`));
  expect(sisa).toEqual([]);
});

test('t() hanya menerima kunci literal (kunci dinamis lolos dari cek cakupan)', () => {
  const dinamis = Object.entries(SUMBER).flatMap(([jalur, isi]) =>
    isi.split('\n').filter(baris => !/^\s*(\/\/|\/?\*)/.test(baris) && !/function t\(/.test(baris))
      .filter(baris => /(?<![\w.])t\((?!['"])/.test(baris)).map(baris => `${jalur}: ${baris.trim()}`));
  expect(dinamis).toEqual([]);
});

test('setiap kunci diksi di kode ada di snapshot', () => {
  const ada = new Set(snapshotTerpasang().diksi.map(d => d.kunci));
  expect([...KUNCI_T].filter(kunci => !ada.has(kunci))).toEqual([]);
});

test('setiap teksEdukasi di kode ada di snapshot', () => {
  const ada = new Set(snapshotTerpasang().konten.filter(b => b.jenis === 'teks_edukasi').map(b => b.slug));
  expect([...SLUG_EDUKASI].filter(slug => !ada.has(slug))).toEqual([]);
});

test('kunci snapshot yang tidak dipakai kode dilaporkan', () => {
  const tidakDipakai = snapshotTerpasang().diksi.map(d => d.kunci).filter(kunci => !KUNCI_T.has(kunci));
  if (tidakDipakai.length) console.warn(`diksi tidak dipakai kode (${tidakDipakai.length}):`, tidakDipakai);
});

it('isian dengan angka Arab dibaca sama dengan angka Latin', async () => {
  const { bacaInputUang } = await import('../format');
  const { bacaPecahan } = await import('../hasil/tebak');
  expect(bacaInputUang('١٢٠٬٠٠٠')).toBe(120000n);
  expect(bacaPecahan('١/٨')).toEqual({ n: 1n, d: 8n });
  expect(bacaPecahan('۳/۲۴')).toEqual({ n: 3n, d: 24n });
});
