import { beforeEach, expect, test } from 'vitest';
import { bacaIsianSoal, bacaPercobaanSoal, hapusIsianSoal, hitungTerisiSoal, naikkanPercobaanSoal, simpanIsianGharqa, simpanIsianSoal } from '../isianSoal';

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

test('isian gharqa: keputusan + isian per harta tersimpan, dihitung terisi, percobaan bertahan', () => {
  naikkanPercobaanSoal('G-01');
  simpanIsianGharqa('G-01', { keputusan: 'tidakSalingMewarisi', harta: { ZAID: isian } }, 9, 1000);
  const tersimpan = bacaIsianSoal('G-01')!;
  expect(tersimpan.gharqa).toEqual({ keputusan: 'tidakSalingMewarisi', harta: { ZAID: isian } });
  expect(tersimpan.percobaan).toBe(1);
  expect(hitungTerisiSoal(tersimpan)).toBe(2); // keputusan + satu sel
});

test('data lama tanpa field gharqa tetap terbaca dan dihitung dari isian', () => {
  localStorage.setItem('arif-waris:isian-soal', JSON.stringify({ 'K-01': { isian, diubahPada: 1, jumlahKotak: 5 } }));
  expect(bacaIsianSoal('K-01')?.gharqa).toBeUndefined();
  expect(hitungTerisiSoal(bacaIsianSoal('K-01')!)).toBe(1);
});
