import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { Aplikasi } from '../Aplikasi';

beforeEach(() => localStorage.clear());

const mulai = (tujuan: 'Hitung kasus' | 'Belajar' = 'Hitung kasus') => {
  render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: new RegExp(tujuan) }));
};

it('beranda menanyakan tujuan lalu membuka langkah pewaris tanpa pilihan bawaan', () => {
  mulai();
  expect(screen.getByRole('heading', { name: /laki-laki atau perempuan/i })).toBeTruthy();
  expect(screen.getByRole('radio', { name: /Laki-laki/ }).getAttribute('aria-checked')).toBe('false');
  expect(screen.getByRole('radio', { name: /Perempuan/ }).getAttribute('aria-checked')).toBe('false');
});

it('tombol lanjut nonaktif dengan alasan tertulis', () => {
  mulai();
  const lanjut = screen.getByRole('button', { name: /Lanjut: Harta/ });
  expect(lanjut.hasAttribute('disabled')).toBe(true);
  expect(screen.getByText(/Pilih dulu jenis kelamin/)).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: /Perempuan/ }));
  expect(screen.getByRole('button', { name: /Lanjut: Harta/ }).hasAttribute('disabled')).toBe(false);
});

it('stepper tidak bisa membuka langkah yang belum boleh', () => {
  mulai();
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  const ahliWaris = screen.getByRole('button', { name: /Ahli waris/ });
  expect(ahliWaris.hasAttribute('disabled')).toBe(true);
});

it('ulangi dari awal meminta konfirmasi di halaman', () => {
  mulai();
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Ulangi dari awal' }));
  expect(screen.getByRole('alertdialog')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Simpan file dulu/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(screen.getByRole('heading', { name: /laki-laki atau perempuan/i })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ulangi dari awal' }));
  fireEvent.click(screen.getByRole('button', { name: /Hapus dan mulai baru/ }));
  expect(screen.getByText(/Mau pakai buat apa/)).toBeTruthy();
});

it('header tidak punya tombol simpan', () => {
  mulai();
  expect(screen.queryByRole('banner')?.textContent ?? '').not.toMatch(/Simpan file/);
});
