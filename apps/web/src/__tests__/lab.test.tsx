import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { DialogNama } from '../layar/lab/DialogNama';
import { MulaiCepat } from '../layar/lab/MulaiCepat';
import { RakEksperimen } from '../layar/lab/RakEksperimen';
import { SUSUNAN_CEPAT, kasusDariSusunan } from '../lab';
import { sematkan, simpanKasus } from '../tersimpan';

beforeEach(() => localStorage.clear());

test('dialog nama terisi judul awal, Simpan mengirim nama yang dipangkas', () => {
  const saatSimpan = vi.fn();
  render(<DialogNama judulAwal="Istri, Ayah" saatSimpan={saatSimpan} saatBatal={() => {}} />);
  const isian = screen.getByLabelText('Nama kasus') as HTMLInputElement;
  expect(isian.value).toBe('Istri, Ayah');
  fireEvent.change(isian, { target: { value: '  Keluarga Pak Budi ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  expect(saatSimpan).toHaveBeenCalledWith('Keluarga Pak Budi');
});

test('Esc membatalkan', () => {
  const saatBatal = vi.fn();
  render(<DialogNama judulAwal="x" saatSimpan={() => {}} saatBatal={saatBatal} />);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(saatBatal).toHaveBeenCalled();
});

test('rak kosong tidak dirender apa pun', () => {
  const { container } = render(<RakEksperimen kasusSekarang={null} saatBuka={() => {}} />);
  expect(container.innerHTML).toBe("");
});

test('rak menampilkan nama dan menaruh yang disematkan di depan', () => {
  const kasus = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  simpanKasus('b', kasus, 'Keluarga B');
  simpanKasus('a', kasus, 'Keluarga A');
  sematkan('b', true);
  render(<RakEksperimen kasusSekarang={null} saatBuka={() => {}} />);
  expect(screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent)).toEqual(['Keluarga B', 'Keluarga A']);
});

test('menyematkan dari rak mengubah urutan dan tersimpan', () => {
  const kasus = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  simpanKasus('a', kasus, 'Keluarga A');
  simpanKasus('b', kasus, 'Keluarga B');
  render(<RakEksperimen kasusSekarang={null} saatBuka={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Sematkan Keluarga A' }));
  expect(screen.getAllByRole('heading', { level: 3 })[0]!.textContent).toBe('Keluarga A');
});

test('ganti nama dari rak lewat dialog', () => {
  simpanKasus('a', kasusDariSusunan(SUSUNAN_CEPAT[0]!), 'Lama');
  render(<RakEksperimen kasusSekarang={null} saatBuka={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ganti nama Lama' }));
  fireEvent.change(screen.getByLabelText('Nama kasus'), { target: { value: 'Baru' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
  expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Baru');
});

test('mulai cepat: satu ketukan mengirim kasus dengan ahli waris susunannya', () => {
  const saatPilih = vi.fn();
  render(<MulaiCepat saatPilih={saatPilih} />);
  fireEvent.click(screen.getByRole('button', { name: 'Istri dan anak' }));
  expect(saatPilih).toHaveBeenCalledTimes(1);
  expect(saatPilih.mock.calls[0]![0].tirkah.kotor).toBe(0n);
});
