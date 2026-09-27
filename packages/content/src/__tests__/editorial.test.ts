// packages/content/src/__tests__/editorial.test.ts
import { describe, expect, test } from 'vitest';
import { bolehSuntingDraf, periksaRefs, transisiRevisi } from '../index.js';

const dasar = { pelakuId: 'a', pembuatId: 'a' } as const;

describe('transisi revisi', () => {
  test('penulis mengajukan drafnya sendiri', () => {
    expect(transisiRevisi({ ...dasar, status: 'draf', aksi: 'ajukan', peran: 'penulis' })).toEqual({ ok: true, status: 'diajukan' });
  });
  test('penulis tidak bisa mengajukan draf orang lain', () => {
    expect(transisiRevisi({ status: 'draf', aksi: 'ajukan', peran: 'penulis', pelakuId: 'a', pembuatId: 'b' }).ok).toBe(false);
  });
  test('penulis tidak bisa menyetujui', () => {
    expect(transisiRevisi({ status: 'diajukan', aksi: 'setujui', peran: 'penulis', pelakuId: 'a', pembuatId: 'b' }).ok).toBe(false);
  });
  test('reviewer menyetujui revisi orang lain, bukan revisinya sendiri', () => {
    expect(transisiRevisi({ status: 'diajukan', aksi: 'setujui', peran: 'reviewer', pelakuId: 'r', pembuatId: 'p' })).toEqual({ ok: true, status: 'disetujui' });
    expect(transisiRevisi({ status: 'diajukan', aksi: 'setujui', peran: 'reviewer', pelakuId: 'r', pembuatId: 'r' }).ok).toBe(false);
  });
  test('admin boleh menyetujui revisinya sendiri', () => {
    expect(transisiRevisi({ ...dasar, status: 'diajukan', aksi: 'setujui', peran: 'admin' }).ok).toBe(true);
  });
  test('kembalikan wajib catatan', () => {
    const p = { status: 'diajukan', aksi: 'kembalikan', peran: 'reviewer', pelakuId: 'r', pembuatId: 'p' } as const;
    expect(transisiRevisi(p).ok).toBe(false);
    expect(transisiRevisi({ ...p, catatan: '   ' }).ok).toBe(false);
    expect(transisiRevisi({ ...p, catatan: 'Rujukan R09-7 kurang' })).toEqual({ ok: true, status: 'dikembalikan' });
  });
  test('status akhir tidak bisa ditransisikan lagi', () => {
    for (const status of ['disetujui', 'dikembalikan'] as const) {
      for (const aksi of ['ajukan', 'setujui', 'kembalikan'] as const) {
        expect(transisiRevisi({ status, aksi, peran: 'admin', pelakuId: 'a', pembuatId: 'b', catatan: 'x' }).ok).toBe(false);
      }
    }
  });
  test('tanpa peran ditolak', () => {
    expect(transisiRevisi({ ...dasar, status: 'draf', aksi: 'ajukan', peran: null }).ok).toBe(false);
  });
});

describe('sunting draf', () => {
  test('hanya pembuat (atau admin) dan hanya selagi draf', () => {
    expect(bolehSuntingDraf({ status: 'draf', peran: 'penulis', pelakuId: 'a', pembuatId: 'a' })).toBe(true);
    expect(bolehSuntingDraf({ status: 'draf', peran: 'penulis', pelakuId: 'a', pembuatId: 'b' })).toBe(false);
    expect(bolehSuntingDraf({ status: 'diajukan', peran: 'penulis', pelakuId: 'a', pembuatId: 'a' })).toBe(false);
    expect(bolehSuntingDraf({ status: 'draf', peran: 'admin', pelakuId: 'a', pembuatId: 'b' })).toBe(true);
  });
});

describe('periksa refs', () => {
  const dikenal = new Set(['R09-7', 'R04-2']);
  test('jenis fikih wajib minimal satu ref', () => {
    expect(periksaRefs('materi', {}, [], dikenal)).toMatch(/minimal satu/);
    expect(periksaRefs('materi', {}, ['R09-7'], dikenal)).toBeNull();
  });
  test('jenis non-fikih boleh tanpa ref', () => {
    expect(periksaRefs('cheatsheet', {}, [], dikenal)).toBeNull();
  });
  test('FAQ kelompok "Pakai aplikasi" bukan klaim fikih: boleh tanpa ref; FAQ Fikih tetap wajib', () => {
    expect(periksaRefs('faq', { kelompok: 'Pakai aplikasi' }, [], dikenal)).toBeNull();
    expect(periksaRefs('faq', { kelompok: 'Fikih' }, [], dikenal)).toMatch(/minimal satu/);
  });
  test('ref tak dikenal ditolak dan disebut', () => {
    expect(periksaRefs('faq', {}, ['R09-7', 'R99-1'], dikenal)).toMatch(/R99-1/);
  });
});
