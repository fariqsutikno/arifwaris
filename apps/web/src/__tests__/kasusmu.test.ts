import { beforeEach, expect, test } from 'vitest';
import { bacaKasusKu, hapusKasus, hapusSemuaSementara } from '../kasusmu';
import { kasusDariSusunan, SUSUNAN_CEPAT } from '../lab';
import { catatRiwayat, hapusRiwayat } from '../riwayat';
import { semuaTersimpan, simpanKasus } from '../tersimpan';

const HARI = 24 * 60 * 60 * 1000;
const sendiri = { jenis: 'sendiri' } as const;
const kasusKe = (i: number) => {
  const dasar = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: BigInt(1_000_000 * (i + 1)) } };
};
beforeEach(() => { localStorage.clear(); hapusRiwayat(); });

test('kasus yang ada di riwayat dan tersimpan hanya muncul sekali, sebagai tersimpan dengan nama', () => {
  catatRiwayat('a', kasusKe(0), Date.now(), sendiri);
  simpanKasus('a', kasusKe(0), 'Keluarga A');
  catatRiwayat('b', kasusKe(1), Date.now(), sendiri);
  const daftar = bacaKasusKu();
  expect(daftar.map(kasus => [kasus.id, kasus.judul, kasus.tersimpan])).toEqual([['a', 'Keluarga A', true], ['b', 'Istri, Anak laki-laki, Anak perempuan', false]]);
});

test('tersimpan di depan, lalu yang sementara; masing-masing terbaru dulu', () => {
  const sekarang = Date.now();
  catatRiwayat('s1', kasusKe(0), sekarang - 3000, sendiri);
  catatRiwayat('s2', kasusKe(1), sekarang - 1000, sendiri);
  simpanKasus('t1', kasusKe(2), 'T1');
  expect(bacaKasusKu(sekarang).map(kasus => kasus.id)).toEqual(['t1', 's2', 's1']);
});

test('sementara punya sisa hari sampai dihapus otomatis; tersimpan tidak', () => {
  const sekarang = Date.now();
  catatRiwayat('lama', kasusKe(0), sekarang - 10 * HARI, sendiri);
  simpanKasus('t', kasusKe(1), 'T');
  const [tersimpan, sementara] = bacaKasusKu(sekarang);
  expect(sementara!.sisaHari).toBe(20);
  expect(tersimpan!.sisaHari).toBeNull();
});

test('kasus tersimpan dari perangkat lain (tanpa riwayat lokal) tetap tampil', () => {
  simpanKasus('x', kasusKe(0), 'Dari HP');
  expect(bacaKasusKu().map(kasus => kasus.judul)).toEqual(['Dari HP']);
});

test('hapusKasus menghapus dari riwayat dan tersimpan sekaligus', () => {
  catatRiwayat('a', kasusKe(0), Date.now(), sendiri);
  simpanKasus('a', kasusKe(0), 'A');
  hapusKasus('a');
  expect(bacaKasusKu()).toEqual([]);
  expect(semuaTersimpan()).toEqual([]);
});

test('hapusSemuaSementara menyisakan yang tersimpan', () => {
  catatRiwayat('s', kasusKe(0), Date.now(), sendiri);
  catatRiwayat('t', kasusKe(1), Date.now(), sendiri);
  simpanKasus('t', kasusKe(1), 'T');
  hapusSemuaSementara();
  expect(bacaKasusKu().map(kasus => kasus.id)).toEqual(['t']);
});
