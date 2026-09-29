// Keluaran narasi dibekukan sebelum migrasi ke templat diksi: semua kasus × semua mode harus identik setelah tiap task.
import { expect, test } from 'vitest';
import { semuaPenjelasan } from './kasus.js';

test('keluaran narasi identik dengan emas', async () => {
  const hasil = semuaPenjelasan();
  expect(Object.keys(hasil).length).toBeGreaterThan(100);
  await expect(JSON.stringify(hasil, null, 1)).toMatchFileSnapshot('./__snapshots__/emas.json');
});
