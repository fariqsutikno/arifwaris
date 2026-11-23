import { beforeEach, expect, it } from 'vitest';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { pulihDariUrl } from '../Aplikasi';
import { kasusBaru } from '../kasus';
import { tandaiWafatSebelumDibagi } from '../latihan';
import { catatRiwayat, hapusRiwayat } from '../riwayat';

const lengkap = () => {
  const dasar = kasusBaru('L', 'latihan');
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: 24_000_000n }, graf: tambahAhliWaris(dasar.graf, 'PEWARIS', 'ISTRI') };
};

beforeEach(() => hapusRiwayat());

it('muat ulang di URL kasus kembali ke kasus dan halaman yang sama', () => {
  catatRiwayat('abc', lengkap(), 1, { jenis: 'materi' });
  expect(pulihDariUrl('#/hitung/abc', null)?.keadaan).toMatchObject({ layar: 'hasil' });
  expect(pulihDariUrl('#/hitung/abc', null)?.sumber).toEqual({ jenis: 'materi' });
  expect(pulihDariUrl('#/hitung/abc/langkah/2', null)?.keadaan).toMatchObject({ layar: 'wizard', langkah: 2 });
  expect(pulihDariUrl('#/hitung/abc/langkah/3/9', null)?.keadaan).toMatchObject({ layar: 'wizard', langkah: 3 });
});

it('tautan babak lama (latihan dengan mayit lanjutan) tetap terbuka di langkah 3', () => {
  let kasus = lengkap();
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  const [anak] = hitungIsian(kasus.graf, 'PEWARIS').ANAK_LK!;
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, anak!, 'ANAK_LK') };   // anak punya ahli waris hidup, jadi langkah 3 tidak tertahan
  kasus = tandaiWafatSebelumDibagi(kasus, anak!, true);
  catatRiwayat('lama', kasus, 1, { jenis: 'materi' });
  expect(pulihDariUrl('#/hitung/lama/langkah/3/2', null)?.keadaan).toMatchObject({ layar: 'wizard', langkah: 3 });
});

it('id tak dikenal atau URL biasa tidak memulihkan apa pun', () => {
  expect(pulihDariUrl('#/hitung/tidak-ada', null)).toBeNull();
  expect(pulihDariUrl('#/hitung', null)).toBeNull();
});

it('kasus belum lengkap tidak dibuka di hasil', () => {
  catatRiwayat('x', kasusBaru('P'), 1, { jenis: 'sendiri' });
  expect(pulihDariUrl('#/hitung/x', null)?.keadaan.layar).toBe('wizard');
});

it('susunan cepat (harta 0) tetap di hasil saat dimuat ulang', () => {
  const dasar = kasusBaru('L', 'latihan');
  const cepat = { ...dasar, tirkah: { ...dasar.tirkah, kotor: 0n }, graf: tambahAhliWaris(dasar.graf, 'PEWARIS', 'ISTRI') };
  catatRiwayat('cepat', cepat, 1, { jenis: 'sendiri' });
  expect(pulihDariUrl('#/hitung/cepat', null)?.keadaan.layar).toBe('hasil');
});

it('kasus nyata yang pintunya belum dijawab dibuka di wizard', () => {
  const nyata = kasusBaru('L', 'nyata');
  catatRiwayat('nyata', { ...nyata, graf: tambahAhliWaris(nyata.graf, 'PEWARIS', 'ISTRI') }, 1, { jenis: 'sendiri' });
  expect(pulihDariUrl('#/hitung/nyata', null)?.keadaan.layar).toBe('wizard');
});
