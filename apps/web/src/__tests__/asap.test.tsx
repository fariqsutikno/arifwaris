import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { Aplikasi } from '../Aplikasi';

beforeEach(() => { localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); });

it('alur penuh: beranda → wizard → hasil', () => {
  render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: /Hitung kasus/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Harta/ }));
  fireEvent.change(screen.getByLabelText(/Total harta/), { target: { value: '24.000.000' } });
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Kewajiban/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Ahli waris/ }));
  fireEvent.click(screen.getByLabelText('Tambah Istri'));
  fireEvent.click(screen.getByLabelText('Tambah Anak laki-laki'));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Kondisi khusus/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lihat hasil/ }));
  expect(screen.getByText('Nah, ini pembagiannya')).toBeTruthy();
});

it('autosave: kasus muncul lagi setelah render ulang', () => {
  const { unmount } = render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: /Hitung kasus/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  unmount();
  render(<Aplikasi />);
  expect(screen.getByRole('button', { name: /Lanjutkan kasus terakhir/ })).toBeTruthy();
});
