import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { Aplikasi } from '../Aplikasi';

beforeEach(() => localStorage.clear());

it('alur penuh: beranda → wizard → hasil', () => {
  render(<Aplikasi />);
  fireEvent.click(screen.getByText('Mulai hitung'));
  fireEvent.click(screen.getByText('Laki-laki'));
  for (let langkah = 1; langkah <= 3; langkah++) fireEvent.click(screen.getByText('Gas, langkah berikutnya'));
  fireEvent.click(screen.getByLabelText('Tambah Istri'));
  fireEvent.click(screen.getByLabelText('Tambah Anak laki-laki'));
  fireEvent.click(screen.getByText('Gas, langkah berikutnya'));
  fireEvent.click(screen.getByText('Gas hitung'));
  expect(screen.getByText('Nah, ini pembagiannya')).toBeTruthy();
});

it('autosave: kasus muncul lagi setelah render ulang', () => {
  const { unmount } = render(<Aplikasi />);
  fireEvent.click(screen.getByText('Mulai hitung'));
  unmount();
  render(<Aplikasi />);
  expect(screen.getByText('Lanjutin kasus terakhir')).toBeTruthy();
});
