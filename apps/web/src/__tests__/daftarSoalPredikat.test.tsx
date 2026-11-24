// Daftar Latihan: keterangan cara soal diselesaikan (mandiri / dengan petunjuk / kolom dibuka) dan penanda layak diulang.
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { daftarSoalHitung } from '../konten/sumber';
import { DaftarSoalHitung } from '../layar/belajar/DaftarSoalHitung';
import { catatPredikatSoal } from '../bantuanSoal';
import { catatLatihan } from '../progres';

beforeEach(() => localStorage.clear());
const contoh = daftarSoalHitung()[0]!;
const tampilkan = () => {
  render(<DaftarSoalHitung kasusSekarang={null} saatKerjakan={() => undefined} />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: contoh.kode } });
};

test('mandiri: keterangan Mandiri, tanpa penanda layak diulang', () => {
  catatLatihan('hitung', contoh.kode, true, null);
  catatPredikatSoal(contoh.kode, 'mandiri');
  tampilkan();
  expect(screen.getByText('Mandiri')).toBeTruthy();
  expect(screen.queryByText('Layak diulang')).toBeNull();
});

test.each([['petunjuk', 'Dengan petunjuk', true], ['dibuka', 'Kolom dibuka', false]] as const)('%s: keterangan dan penanda layak diulang', (predikat, keterangan, benar) => {
  catatLatihan('hitung', contoh.kode, benar, null);
  catatPredikatSoal(contoh.kode, predikat);
  tampilkan();
  expect(screen.getByText(keterangan)).toBeTruthy();
  expect(screen.getByText('Layak diulang')).toBeTruthy();
});

test('jawaban dibuka lewat Lihat jawaban lama (tanpa predikat) tetap layak diulang', () => {
  catatLatihan('hitung', contoh.kode, false, null);
  tampilkan();
  expect(screen.getByText('Layak diulang')).toBeTruthy();
});
