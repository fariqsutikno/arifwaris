import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { Aplikasi } from '../Aplikasi';

beforeEach(() => { localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); window.location.hash = '#/hitung'; });

it('alur penuh: beranda → wizard → hasil', () => {
  render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: /Mulai dari nol/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Harta/ }));
  fireEvent.change(screen.getByLabelText('Total harta peninggalan'), { target: { value: '24.000.000' } });
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Keluarga/ }));
  fireEvent.click(screen.getByLabelText('Tambah Istri'));
  fireEvent.click(screen.getByLabelText('Tambah Anak laki-laki'));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut: Periksa/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lihat hasil/ }));
  expect(screen.getByText('Nah, ini pembagiannya')).toBeTruthy();
});

it('autosave: kasus muncul lagi setelah render ulang', () => {
  const { unmount } = render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: /Mulai dari nol/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Laki-laki/ }));
  unmount();
  // Muat ulang di URL kasus: kembali ke langkah wizard yang sama.
  expect(window.location.hash).toMatch(/^#\/hitung\/[^/]+\/langkah\/1$/);
  const ulang = render(<Aplikasi />);
  expect(screen.getByRole('radio', { name: /Laki-laki/ })).toBeTruthy();
  ulang.unmount();
  // Dibuka dari awal Hitung: kasus tersimpan ditawarkan untuk dilanjutkan.
  window.location.hash = '#/hitung';
  render(<Aplikasi />);
  expect(screen.getByRole('button', { name: /Lanjutkan/ })).toBeTruthy();
  // Belum lengkap pun tetap masuk riwayat, dengan tombol Lanjut.
  expect(screen.getByText(/Data belum lengkap · dibuka/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Lanjut' })).toBeTruthy();
});

it('beranda: dua aksi utama dan identitas tim', () => {
  window.location.hash = '#/';
  render(<Aplikasi />);
  expect(screen.getByRole('link', { name: /^Coba di ArifLab/ }).getAttribute('href')).toBe('#/hitung');
  expect(screen.getByRole('link', { name: /^Mulai belajar/ })).toBeTruthy();
  expect(screen.getByRole('contentinfo', { name: 'Tentang ARIF' }).textContent).toMatch(/Imam Syafi'i Jember/);
});

it('reset progres belajar minta diketik dulu', () => {
  localStorage.setItem('arif-waris:catatan:kuis', JSON.stringify({ 'bab-4': '3/5' }));
  window.location.hash = '#/belajar';
  render(<Aplikasi />);
  fireEvent.click(screen.getByRole('button', { name: 'Reset progres' }));
  const lanjut = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Reset progres' }) as HTMLButtonElement;
  expect(lanjut.disabled).toBe(true);
  fireEvent.change(within(screen.getByRole('alertdialog')).getByRole('textbox'), { target: { value: 'reset progres' } });
  expect(lanjut.disabled).toBe(false);
});
