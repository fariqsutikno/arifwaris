import { beforeEach, expect, test } from 'vitest';
import { bacaIsianSoal, bacaPercobaanSoal, hapusIsianSoal, naikkanPercobaanSoal, simpanIsianSoal } from '../isianSoal';

beforeEach(() => localStorage.clear());
const isian = { kepala: {}, sel: { a: { b: '1/2' } } };

test('simpan, baca, hapus per kode soal', () => {
  simpanIsianSoal('K-01', isian, 5, 1000);
  simpanIsianSoal('K-02', isian, 3, 2000);
  expect(bacaIsianSoal('K-01')).toEqual({ isian, diubahPada: 1000, jumlahKotak: 5 });
  hapusIsianSoal('K-01');
  expect(bacaIsianSoal('K-01')).toBeNull();
  expect(bacaIsianSoal('K-02')).not.toBeNull();
});

test('JSON rusak terbaca sebagai tidak ada', () => {
  localStorage.setItem('arif-waris:isian-soal', '{rusak');
  expect(bacaIsianSoal('K-01')).toBeNull();
});

test('nomor percobaan naik, bertahan walau isian dihapus, dan ikut tersimpan bersama isian', () => {
  expect(bacaPercobaanSoal('K-01')).toBe(0);
  simpanIsianSoal('K-01', isian, 5, 1000);
  naikkanPercobaanSoal('K-01');
  expect(bacaPercobaanSoal('K-01')).toBe(1);
  expect(bacaIsianSoal('K-01')?.isian).toEqual({ kepala: {}, sel: {} });
  simpanIsianSoal('K-01', isian, 5, 2000);
  expect(bacaPercobaanSoal('K-01')).toBe(1);
  hapusIsianSoal('K-01');
  expect(bacaPercobaanSoal('K-01')).toBe(1);
});
