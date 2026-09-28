// packages/content/src/__tests__/editorial.test.ts
import { describe, expect, test } from 'vitest';
import { bolehAbaikanRevisi, bolehPulihkanEntri, bolehSuntingDraf, caraBuangEntri, periksaRefs, transisiRevisi } from '../index.js';

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

describe('tarik & terbitkan langsung', () => {
  test('pembuat (atau admin) menarik kembali pengajuannya; reviewer & orang lain tidak', () => {
    expect(transisiRevisi({ ...dasar, status: 'diajukan', aksi: 'tarik', peran: 'penulis' })).toEqual({ ok: true, status: 'draf' });
    expect(transisiRevisi({ status: 'diajukan', aksi: 'tarik', peran: 'admin', pelakuId: 'a', pembuatId: 'b' }).ok).toBe(true);
    expect(transisiRevisi({ status: 'diajukan', aksi: 'tarik', peran: 'penulis', pelakuId: 'a', pembuatId: 'b' }).ok).toBe(false);
    expect(transisiRevisi({ ...dasar, status: 'diajukan', aksi: 'tarik', peran: 'reviewer' }).ok).toBe(false);
    expect(transisiRevisi({ ...dasar, status: 'draf', aksi: 'tarik', peran: 'penulis' }).ok).toBe(false);
  });
  test('hanya admin menerbitkan draf langsung', () => {
    expect(transisiRevisi({ ...dasar, status: 'draf', aksi: 'terbitkan', peran: 'admin' })).toEqual({ ok: true, status: 'disetujui' });
    expect(transisiRevisi({ ...dasar, status: 'draf', aksi: 'terbitkan', peran: 'penulis' }).ok).toBe(false);
    expect(transisiRevisi({ ...dasar, status: 'diajukan', aksi: 'terbitkan', peran: 'admin' }).ok).toBe(false);
  });
  test('perbarui ajuan: pembuat atau admin, hanya selagi diajukan; tetap diajukan', () => {
    expect(transisiRevisi({ ...dasar, status: 'diajukan', aksi: 'perbarui', peran: 'penulis' })).toEqual({ ok: true, status: 'diajukan' });
    expect(transisiRevisi({ status: 'diajukan', aksi: 'perbarui', peran: 'admin', pelakuId: 'a', pembuatId: 'b' }).ok).toBe(true);
    expect(transisiRevisi({ status: 'diajukan', aksi: 'perbarui', peran: 'penulis', pelakuId: 'a', pembuatId: 'b' }).ok).toBe(false);
    expect(transisiRevisi({ ...dasar, status: 'diajukan', aksi: 'perbarui', peran: 'reviewer' }).ok).toBe(false);
    expect(transisiRevisi({ ...dasar, status: 'disetujui', aksi: 'perbarui', peran: 'penulis' }).ok).toBe(false);
  });
});

describe('Sampah', () => {
  const entri = { pelakuId: 'p', pernahTerbit: true, diSampah: false, buangSedangDiajukan: false, pembuatRevisi: ['p'] } as const;
  test('entri terbit: penulis mengajukan, admin langsung', () => {
    expect(caraBuangEntri({ ...entri, peran: 'penulis' })).toEqual({ ok: true, cara: 'ajukan' });
    expect(caraBuangEntri({ ...entri, peran: 'admin', pembuatRevisi: ['lain'] })).toEqual({ ok: true, cara: 'langsung' });
  });
  test('reviewer, entri sudah di Sampah, atau pengajuan ganda ditolak', () => {
    expect(caraBuangEntri({ ...entri, peran: 'reviewer' }).ok).toBe(false);
    expect(caraBuangEntri({ ...entri, peran: 'penulis', diSampah: true })).toEqual({ ok: false, galat: 'entri sudah di Sampah' });
    expect(caraBuangEntri({ ...entri, peran: 'penulis', buangSedangDiajukan: true }).ok).toBe(false);
  });
  test('entri belum terbit: langsung; penulis hanya bila semua revisinya milik sendiri', () => {
    const belumTerbit = { ...entri, pernahTerbit: false };
    expect(caraBuangEntri({ ...belumTerbit, peran: 'penulis' })).toEqual({ ok: true, cara: 'langsung' });
    expect(caraBuangEntri({ ...belumTerbit, peran: 'penulis', pembuatRevisi: ['p', 'lain'] }).ok).toBe(false);
  });
  test('pulihkan: pernah terbit oleh reviewer/admin; belum terbit oleh pembuatnya/admin', () => {
    const terbit = { ...entri, diSampah: true };
    expect(bolehPulihkanEntri({ ...terbit, peran: 'reviewer' }).ok).toBe(true);
    expect(bolehPulihkanEntri({ ...terbit, peran: 'penulis' }).ok).toBe(false);
    const belumTerbit = { ...terbit, pernahTerbit: false };
    expect(bolehPulihkanEntri({ ...belumTerbit, peran: 'penulis' }).ok).toBe(true);
    expect(bolehPulihkanEntri({ ...belumTerbit, peran: 'penulis', pembuatRevisi: ['lain'] }).ok).toBe(false);
    expect(bolehPulihkanEntri({ ...belumTerbit, peran: 'reviewer' }).ok).toBe(false);
    expect(bolehPulihkanEntri({ ...entri, peran: 'admin' }).ok).toBe(false);
  });
});

describe('bolehAbaikanRevisi', () => {
  const dasarAbaikan = { pelakuId: 'a', pembuatId: 'a', status: 'dikembalikan' } as const;
  test('pembuat & admin boleh; reviewer, orang lain, dan status lain tidak', () => {
    expect(bolehAbaikanRevisi({ ...dasarAbaikan, peran: 'penulis' })).toBe(true);
    expect(bolehAbaikanRevisi({ ...dasarAbaikan, peran: 'admin', pelakuId: 'x' })).toBe(true);
    expect(bolehAbaikanRevisi({ ...dasarAbaikan, peran: 'reviewer' })).toBe(false);
    expect(bolehAbaikanRevisi({ ...dasarAbaikan, peran: 'penulis', pelakuId: 'x' })).toBe(false);
    expect(bolehAbaikanRevisi({ ...dasarAbaikan, peran: 'penulis', status: 'diajukan' })).toBe(false);
  });
});
