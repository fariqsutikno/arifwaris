// Soal buta (spec 4A.9): sebelum dikerjakan, daftar dan pratinjau tidak memuat judul soal (susunan keluarga); sesudahnya judul tampil.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { daftarSoalHitung } from '../konten/sumber';
import { DaftarSoalHitung } from '../layar/belajar/DaftarSoalHitung';
import { SoalAcak } from '../layar/belajar/SoalAcak';
import { catatLatihan } from '../progres';

beforeEach(() => localStorage.clear());
const soal = daftarSoalHitung();
const tanpaAksi = () => undefined;
// Semua bab dibuka lewat pencarian kosong "dasar" supaya baris soal terlihat tanpa menebak bab.
const bukaSemua = () => fireEvent.click(screen.getByRole('button', { name: /^dasar$/i }));

test('daftar sebelum dikerjakan: tidak ada judul soal, hanya kode', () => {
  render(<DaftarSoalHitung kasusSekarang={null} saatKerjakan={tanpaAksi} />);
  bukaSemua();
  const teks = document.body.textContent ?? '';
  const bocor = soal.filter(isi => isi.judul.length > 8 && teks.includes(isi.judul));
  expect(bocor.map(isi => isi.kode)).toEqual([]);
  expect(screen.getAllByText(/^Soal [A-Z]-\d+/).length).toBeGreaterThan(0);
});

test('pencarian sebelum selesai: judul tidak dicari, kode dan tingkat dicari', () => {
  render(<DaftarSoalHitung kasusSekarang={null} saatKerjakan={tanpaAksi} />);
  const kotak = screen.getByRole('searchbox');
  const contoh = soal[0]!;
  fireEvent.change(kotak, { target: { value: contoh.judul } });
  expect(screen.queryByText(`Soal ${contoh.kode}`)).toBeNull();
  fireEvent.change(kotak, { target: { value: contoh.kode } });
  expect(screen.getByText(`Soal ${contoh.kode}`)).toBeTruthy();
});

test('sesudah dikerjakan: judul asli dan topik tampil, dan bisa dicari', () => {
  const contoh = soal[0]!;
  catatLatihan('hitung', contoh.kode, true, null);
  render(<DaftarSoalHitung kasusSekarang={null} saatKerjakan={tanpaAksi} />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: contoh.judul } });
  expect(screen.getAllByText(contoh.judul).length).toBeGreaterThan(0);
});

test('Soal acak: pratinjau memakai kode, bukan judul', () => {
  render(<SoalAcak kasusSekarang={null} saatKerjakan={tanpaAksi} />);
  fireEvent.click(screen.getByRole('button', { name: /acak soal/i }));
  const pratinjau = document.querySelector('.pratinjau-acak') as HTMLElement;
  expect(within(pratinjau).getByText(/^Soal [A-Z]-\d+/)).toBeTruthy();
  expect(soal.some(isi => isi.judul.length > 8 && (pratinjau.textContent ?? '').includes(isi.judul))).toBe(false);
});
