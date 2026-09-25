import { expect, it } from 'vitest';
import { bacaPecahan, nilaiTebakan } from '../hasil/tebak';

it('pecahan terbaca; yang bukan pecahan ditolak', () => {
  expect(bacaPecahan(' 1 / 8 ')).toEqual({ n: 1n, d: 8n });
  expect(bacaPecahan('0')).toEqual({ n: 0n, d: 1n });
  for (const salah of ['', '0,5', '1/0', 'a', '-1/2']) expect(bacaPecahan(salah)).toBeNull();
});

it('tebakan senilai dianggap benar; kosong = belum lengkap', () => {
  const kunci = [{ id: 'istri', saham: 3n }, { id: 'anak', saham: 21n }, { id: 'paman', saham: 0n }];
  expect(nilaiTebakan({ istri: '1/8', anak: '7/8', paman: '0' }, kunci, 24n)).toEqual({ jenis: 'dinilai', idBenar: ['istri', 'anak', 'paman'], idSalah: [] });
  expect(nilaiTebakan({ istri: '1/4', anak: '21/24', paman: '0' }, kunci, 24n)).toEqual({ jenis: 'dinilai', idBenar: ['anak', 'paman'], idSalah: ['istri'] });
  expect(nilaiTebakan({ istri: '1/8' }, kunci, 24n)).toEqual({ jenis: 'belumLengkap', idKosong: ['anak', 'paman'] });
});
