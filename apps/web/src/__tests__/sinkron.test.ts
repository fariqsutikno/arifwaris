import { expect, test, vi } from 'vitest';
import { sinkronLatar } from '../konten/sinkron';

test('pustaka sinkron gagal dimuat (jaringan putus, chunk lama hilang): tidak melempar, cache tidak ditulis', async () => {
  const peringatan = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const simpan = vi.fn();
  await expect(sinkronLatar({ versi: 1, konten: [], diksi: [] }, {
    url: 'http://x', kunci: 'k', daring: true, muatRepo: () => Promise.reject(new Error('chunk hilang')), simpan,
  })).resolves.toBeUndefined();
  expect(simpan).not.toHaveBeenCalled();
  expect(peringatan).toHaveBeenCalled();
});

test('tanpa env atau luring: tidak memuat apa pun', async () => {
  const muatRepo = vi.fn();
  await sinkronLatar({ versi: 1, konten: [], diksi: [] }, { url: undefined, kunci: 'k', daring: true, muatRepo, simpan: vi.fn() });
  await sinkronLatar({ versi: 1, konten: [], diksi: [] }, { url: 'u', kunci: 'k', daring: false, muatRepo, simpan: vi.fn() });
  expect(muatRepo).not.toHaveBeenCalled();
});
