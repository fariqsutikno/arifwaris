// apps/web/src/__tests__/cache.test.ts
import { expect, test } from 'vitest';
import { bacaCache, simpanCache } from '../konten/cache';

test('tanpa IndexedDB (jsdom): baca null, simpan tidak melempar', async () => {
  expect(await bacaCache()).toBeNull();
  await expect(simpanCache({ versi: 1, konten: [], diksi: [] })).resolves.toBeUndefined();
});
