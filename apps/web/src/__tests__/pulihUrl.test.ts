import { beforeEach, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { pulihDariUrl } from '../Aplikasi';
import { kasusBaru } from '../kasus';
import { catatRiwayat, hapusRiwayat } from '../riwayat';

const lengkap = () => {
  const dasar = kasusBaru('L');
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: 24_000_000n }, graf: tambahAhliWaris(dasar.graf, 'PEWARIS', 'ISTRI') };
};

beforeEach(() => hapusRiwayat());

it('muat ulang di URL kasus kembali ke kasus dan halaman yang sama', () => {
  catatRiwayat('abc', lengkap(), 1, { jenis: 'materi' });
  expect(pulihDariUrl('#/hitung/abc', null)?.keadaan).toMatchObject({ layar: 'hasil' });
  expect(pulihDariUrl('#/hitung/abc', null)?.sumber).toEqual({ jenis: 'materi' });
  expect(pulihDariUrl('#/hitung/abc/langkah/2', null)?.keadaan).toMatchObject({ layar: 'wizard', langkah: 2 });
  expect(pulihDariUrl('#/hitung/abc/langkah/3/9', null)?.keadaan).toMatchObject({ layar: 'wizard', langkah: 3, babak: 0 });
});

it('id tak dikenal atau URL biasa tidak memulihkan apa pun', () => {
  expect(pulihDariUrl('#/hitung/tidak-ada', null)).toBeNull();
  expect(pulihDariUrl('#/hitung', null)).toBeNull();
});

it('kasus belum lengkap tidak dibuka di hasil', () => {
  catatRiwayat('x', kasusBaru('P'), 1, { jenis: 'sendiri' });
  expect(pulihDariUrl('#/hitung/x', null)?.keadaan.layar).toBe('wizard');
});
