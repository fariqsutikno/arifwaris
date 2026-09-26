// packages/data/src/__tests__/snapshot.test.ts
import { describe, expect, test, vi } from 'vitest';
import { buatMemori } from '../memori/konten.js';
import { gabungSnapshot, pilihAwal, sinkronkan, type Snapshot } from '../snapshot.js';

const kosong: Snapshot = { versi: 0, konten: [], diksi: [] };
const baris = (slug: string, versiTerbit: number, judul = slug) => ({
  entriId: `e-${slug}`, jenis: 'kitab' as const, slug, urutan: 0, revisiId: `r-${slug}-${versiTerbit}`, isi: { judul }, refs: [], versiTerbit,
});

describe('pilihAwal', () => {
  test('cache lebih baru → cache; snapshot bawaan lebih baru (deploy baru) → bawaan; tanpa cache → bawaan', () => {
    const lama = { ...kosong, versi: 3 }, baru = { ...kosong, versi: 5 };
    expect(pilihAwal(lama, baru)).toBe(baru);
    expect(pilihAwal(baru, lama)).toBe(baru);
    expect(pilihAwal(lama, null)).toBe(lama);
  });
});

describe('gabungSnapshot', () => {
  test('mengganti per entriId dan per kunci diksi, menambah yang baru, versi naik', () => {
    const lama: Snapshot = { versi: 1, konten: [baris('a', 1), baris('b', 1)], diksi: [{ kunci: 'u.a', halaman: 'u', id: 'A', ar: null, versiTerbit: 1 }] };
    const hasil = gabungSnapshot(lama, 2, [baris('a', 2, 'A baru'), baris('c', 2)], [{ kunci: 'u.a', halaman: 'u', id: 'A2', ar: 'ا', versiTerbit: 2 }]);
    expect(hasil.versi).toBe(2);
    expect(hasil.konten.map(b => [b.slug, (b.isi as { judul: string }).judul])).toEqual([['a', 'A baru'], ['b', 'b'], ['c', 'c']]);
    expect(hasil.diksi).toEqual([{ kunci: 'u.a', halaman: 'u', id: 'A2', ar: 'ا', versiTerbit: 2 }]);
  });
});

describe('sinkronkan', () => {
  const siapkan = async () => {
    const memori = buatMemori({ sesi: { userId: 'x', email: 'x' }, peran: { x: 'admin' } });
    const entri = await memori.editorial.buatEntri('kitab', 'k', 0);
    const revisi = await memori.editorial.buatDraf(entri, 'kitab', { judul: 'K' }, []);
    await memori.editorial.ajukan(revisi);
    await memori.editorial.setujui(revisi);
    return memori;
  };
  test('unduh yang berubah sejak versi lokal', async () => {
    const memori = await siapkan();
    const hasil = await sinkronkan(memori, kosong);
    expect(hasil?.versi).toBe(1);
    expect(hasil?.konten.map(b => b.slug)).toEqual(['k']);
    expect(await sinkronkan(memori, hasil!)).toBeNull();
  });
  test('repo mati → null, tidak melempar', async () => {
    const peringatan = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mati = { versiSekarang: () => Promise.reject(new Error('jaringan')) };
    expect(await sinkronkan({ konten: mati as never, diksi: {} as never }, kosong)).toBeNull();
    expect(peringatan).toHaveBeenCalled();
  });
});
