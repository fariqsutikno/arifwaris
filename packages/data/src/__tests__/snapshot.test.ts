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
  test('cache dipakai, tapi kunci diksi baru dari bawaan ikut; kunci yang sudah ada di cache tetap versi cache', () => {
    const diksi = (kunci: string, id: string) => ({ kunci, halaman: 'u', id, ar: null, versiTerbit: 1 });
    const bawaan = { ...kosong, versi: 3, diksi: [diksi('u.a', 'A lama'), diksi('u.baru', 'Baru')] };
    const cache = { ...kosong, versi: 5, diksi: [diksi('u.a', 'A server')] };
    expect(pilihAwal(bawaan, cache).diksi.map(d => d.id)).toEqual(['A server', 'Baru']);
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

describe('sinkronkan penghapusan', () => {
  test('entri yang penghapusannya disetujui dibuang dari cache; rollback memunculkannya lagi', async () => {
    const memori = buatMemori({ sesi: { userId: 'x', email: 'x' }, peran: { x: 'admin' } });
    const entri = await memori.editorial.buatEntri('kitab', 'k', 0);
    const revisi = await memori.editorial.buatDraf(entri, 'kitab', { judul: 'K' }, []);
    await memori.editorial.ajukan(revisi);
    await memori.editorial.setujui(revisi);
    const awal = (await sinkronkan(memori, kosong))!;
    await memori.editorial.buangEntri(entri);
    const setelahHapus = (await sinkronkan(memori, awal))!;
    expect(setelahHapus.konten).toEqual([]);
    await memori.editorial.pulihkanEntri(entri);
    expect((await sinkronkan(memori, setelahHapus))!.konten.map(b => b.slug)).toEqual(['k']);
  });
});

test('cache lebih baru tanpa kunci narasi tetap mendapat kunci narasi dari bawaan', () => {
  const bawaan = { versi: 1, konten: [], diksi: [{ kunci: 'narasi.cerita.harta.dibagi', halaman: 'narasi', id: 'x', ar: null, versiTerbit: 1 }] };
  const cache = { versi: 2, konten: [], diksi: [] };
  expect(pilihAwal(bawaan, cache).diksi.map(butir => butir.kunci)).toContain('narasi.cerita.harta.dibagi');
});
