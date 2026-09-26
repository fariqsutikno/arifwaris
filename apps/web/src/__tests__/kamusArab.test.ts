// Semua teks t('...') di halaman yang sudah dialihbahasakan harus ada di kamus Arab,
// supaya mode 'ar' tidak diam-diam menampilkan bahasa Indonesia.
import { expect, it } from 'vitest';
import { KAMUS_ARAB } from '../konten/kamusArab';

// Nama orang dan merek sengaja tidak diterjemahkan.
const TANPA_TERJEMAHAN = new Set(['ARIF', 'Arif Waris', 'Rp', 'Rp 1', 'Rp 100', 'Rp 1.000', 'Rp ••••••', '−Rp ••••••',
  'Fariq bin Sutikno', 'Muhammad Fatih Ikhsan', 'Ridha Ar Rasyid', 'Riyan Maulana Sidiq',
  'Ustaz Arif Husnul Khuluq, M.H.', 'Ustaz Muhammad Yassir, M.H.']);

// Sumber semua berkas web (Vite glob, tanpa node:fs supaya tsc aplikasi tidak butuh tipe Node).
const SUMBER = (import.meta as unknown as { glob: (pola: string[], opsi: object) => Record<string, string> })
  .glob(['../**/*.ts', '../**/*.tsx', '!../__tests__/**'], { query: '?raw', import: 'default', eager: true });

it('kamus Arab lengkap untuk semua t()', () => {
  const kunci = Object.values(SUMBER).flatMap(isi =>
    [...isi.matchAll(/\bt\((['"])((?:(?!\1)[^\\]|\\.)*)\1/g)].map(cocok => cocok[2]!.replace(/\\(['"])/g, '$1')));
  const belum = [...new Set(kunci)].filter(teks => !(teks in KAMUS_ARAB) && !TANPA_TERJEMAHAN.has(teks));
  expect(belum).toEqual([]);
});
