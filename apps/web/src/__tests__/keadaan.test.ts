import { expect, it } from 'vitest';
import { keadaanAwal, pengurangKeadaan } from '../keadaan';

it('MULAI membuat kasus baru di langkah 1', () => {
  const keadaan = pengurangKeadaan(keadaanAwal(null), { jenis: 'MULAI', jenisKelamin: 'P' });
  expect(keadaan).toMatchObject({ layar: 'wizard', langkah: 1 });
  expect(keadaan.kasus?.graf.orang.PEWARIS?.jenisKelamin).toBe('P');
});

it('KE_LANGKAH dibatasi 1..5', () => {
  const awal = pengurangKeadaan(keadaanAwal(null), { jenis: 'MULAI', jenisKelamin: 'L' });
  expect(pengurangKeadaan(awal, { jenis: 'KE_LANGKAH', langkah: 9 }).langkah).toBe(5);
  expect(pengurangKeadaan(awal, { jenis: 'KE_LANGKAH', langkah: 0 }).langkah).toBe(1);
});

it('UBAH_KASUS selalu merapikan urutan wafat', () => {
  const awal = pengurangKeadaan(keadaanAwal(null), { jenis: 'MULAI', jenisKelamin: 'L' });
  const keadaan = pengurangKeadaan(awal, { jenis: 'UBAH_KASUS', ubah: kasus => ({ ...kasus, urutanWafat: ['TIDAK_ADA'] }) });
  expect(keadaan.kasus?.urutanWafat).toEqual([]);
});

it('kasus tersimpan membuka beranda dengan tawaran lanjut', () => {
  const tersimpan = pengurangKeadaan(keadaanAwal(null), { jenis: 'MULAI', jenisKelamin: 'L' }).kasus!;
  expect(keadaanAwal(tersimpan)).toMatchObject({ layar: 'beranda', kasus: tersimpan });
});
