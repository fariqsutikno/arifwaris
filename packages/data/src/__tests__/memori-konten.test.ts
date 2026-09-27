// packages/data/src/__tests__/memori-konten.test.ts
import { describe, expect, test, vi } from 'vitest';
import { DAFTAR_FAQ_UJI, SOAL_HITUNG_UJI } from './contoh.js';
import { buatMemori } from '../index.js';

const PENULIS = { userId: 'p', email: 'p@tes.local' };
const REVIEWER = { userId: 'r', email: 'r@tes.local' };
const siapkan = () => buatMemori({ refs: ['R09-7', 'R04-2'], peran: { p: 'penulis', r: 'reviewer' }, sesi: PENULIS });

describe('memori: konten & editorial', () => {
  test('alur lengkap: draf → ajukan → setujui → terbit, versi naik', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
    expect(await db.konten.bacaTerbit()).toEqual([]);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    expect((await db.editorial.antreanReview()).map(revisi => revisi.id)).toEqual([revisiId]);
    await db.editorial.setujui(revisiId);
    const terbit = await db.konten.bacaTerbit();
    expect(terbit).toHaveLength(1);
    expect(terbit[0]!.isi).toEqual(DAFTAR_FAQ_UJI[0]);
    expect(await db.konten.versiSekarang()).toBe(1);
  });

  test('bigint tetap bigint setelah disimpan dan dibaca', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('soal_hitung', 'H-01', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.editorial.setujui(revisiId);
    const [soal] = await db.konten.bacaTerbit({ jenis: 'soal_hitung' });
    expect(soal!.isi).toEqual(SOAL_HITUNG_UJI);
  });

  test('sejakVersi hanya mengembalikan yang terbit setelahnya', async () => {
    const db = siapkan();
    for (const [indeks, faq] of DAFTAR_FAQ_UJI.slice(0, 2).entries()) {
      db.masukSebagai(PENULIS);
      const entriId = await db.editorial.buatEntri('faq', `f${indeks}`, indeks);
      const revisiId = await db.editorial.buatDraf(entriId, 'faq', faq, ['R09-7']);
      await db.editorial.ajukan(revisiId);
      db.masukSebagai(REVIEWER);
      await db.editorial.setujui(revisiId);
    }
    expect((await db.konten.bacaTerbit({ sejakVersi: 1 })).map(konten => konten.slug)).toEqual(['f1']);
  });

  test('aturan ditolak dengan Error', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    await expect(db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, [])).rejects.toThrow(/minimal satu ref/);
    await expect(db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R99-1'])).rejects.toThrow(/R99-1/);
    await expect(db.editorial.buatDraf(entriId, 'faq', { id: 'x' } as never, ['R09-7'])).rejects.toThrow(/tidak sah/);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
    await expect(db.editorial.setujui(revisiId)).rejects.toThrow();
    await db.editorial.ajukan(revisiId);
    await expect(db.editorial.ubahDraf(revisiId, 'faq', DAFTAR_FAQ_UJI[1]!, ['R09-7'])).rejects.toThrow();
    db.masukSebagai(REVIEWER);
    await expect(db.editorial.kembalikan(revisiId, '')).rejects.toThrow(/catatan/);
  });

  test('rollback menerbitkan ulang revisi lama', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiIds: string[] = [];
    for (const faq of DAFTAR_FAQ_UJI.slice(0, 2)) {
      db.masukSebagai(PENULIS);
      const revisiId = await db.editorial.buatDraf(entriId, 'faq', faq, ['R09-7']);
      await db.editorial.ajukan(revisiId);
      db.masukSebagai(REVIEWER);
      await db.editorial.setujui(revisiId);
      revisiIds.push(revisiId);
    }
    await db.editorial.terbitkanUlang(revisiIds[0]!);
    expect((await db.konten.bacaTerbit())[0]!.isi).toEqual(DAFTAR_FAQ_UJI[0]);
    expect(await db.konten.daftarRevisi(entriId)).toHaveLength(2);
  });

  test('isi tidak valid di baris terbit dibuang dengan peringatan, bukan crash', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.editorial.setujui(revisiId);
    db.isiRevisiMentah(revisiId, { rusak: true });
    const peringatan = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await db.konten.bacaTerbit()).toEqual([]);
    expect(peringatan).toHaveBeenCalledWith(expect.stringContaining('faq/contoh'));
    peringatan.mockRestore();
  });

  test('diksi: draf → terbit; ar kosong = null', async () => {
    const db = siapkan();
    await db.diksi.buatKunci('hitung.lanjut', 'hitung');
    const revisiId = await db.diksi.buatDraf('hitung.lanjut', 'Lanjut', null, null);
    await db.diksi.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.diksi.setujui(revisiId);
    expect(await db.diksi.bacaTerbit()).toEqual([{ kunci: 'hitung.lanjut', halaman: 'hitung', id: 'Lanjut', ar: null, versiTerbit: 1 }]);
  });
});

test('saringDiksiValid membuang diksi rusak dari cache', async () => {
  const { saringDiksiValid } = await import('../snapshot.js');
  const baik = { kunci: 'a.b', halaman: 'x', id: 'Teks', ar: null, versiTerbit: 1 };
  expect(saringDiksiValid([baik, { kunci: 'a.c', id: 5 }, null])).toEqual([baik]);
});
