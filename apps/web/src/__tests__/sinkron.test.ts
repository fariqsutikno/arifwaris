import { expect, test, vi } from 'vitest';
import { sinkronLatar } from '../konten/sinkron';

test('pustaka sinkron gagal dimuat (jaringan putus, chunk lama hilang): tidak melempar, cache tidak ditulis', async () => {
  const peringatan = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const simpan = vi.fn();
  await expect(sinkronLatar({ versi: 1, konten: [], diksi: [] }, {
    url: 'http://x', kunci: 'k', daring: true, muatRepo: () => Promise.reject(new Error('chunk hilang')), simpan,
  })).resolves.toBe(false);
  expect(simpan).not.toHaveBeenCalled();
  expect(peringatan).toHaveBeenCalled();
});

test('tanpa env atau luring: tidak memuat apa pun', async () => {
  const muatRepo = vi.fn();
  await sinkronLatar({ versi: 1, konten: [], diksi: [] }, { url: undefined, kunci: 'k', daring: true, muatRepo, simpan: vi.fn() });
  await sinkronLatar({ versi: 1, konten: [], diksi: [] }, { url: 'u', kunci: 'k', daring: false, muatRepo, simpan: vi.fn() });
  expect(muatRepo).not.toHaveBeenCalled();
});

test('versi baru: cache ditulis dan hasilnya true (untuk tawaran muat ulang)', async () => {
  const simpan = vi.fn();
  const repo = {
    konten: { versiSekarang: async () => 2, bacaTerbit: async () => [], bacaDihapus: async () => [] },
    diksi: { bacaTerbit: async () => [] },
  };
  await expect(sinkronLatar({ versi: 1, konten: [], diksi: [] }, {
    url: 'u', kunci: 'k', daring: true, muatRepo: async () => repo as never, simpan,
  })).resolves.toBe(true);
  expect(simpan).toHaveBeenCalledWith(expect.objectContaining({ versi: 2 }));
});
