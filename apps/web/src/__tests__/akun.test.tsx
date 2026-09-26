import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { TombolAkun } from '../akun/TombolAkun';

test('tanpa repo (env kosong): tombol tidak tampil', () => {
  const { container } = render(<TombolAkun sesi={null} repo={null} />);
  expect(container.textContent).toBe('');
});

test('belum masuk: klik memanggil masukGoogle dengan alamat sekarang', () => {
  const repo = buatMemoriPengguna(buatMemori({ sesi: null }));
  repo.akun.masukGoogle = vi.fn().mockResolvedValue(undefined);
  render(<TombolAkun sesi={null} repo={repo} />);
  fireEvent.click(screen.getByRole('button', { name: /masuk/i }));
  expect(repo.akun.masukGoogle).toHaveBeenCalledWith(window.location.href);
});

test('masukGoogle gagal: pesan layanan tidak tersedia', async () => {
  const repo = buatMemoriPengguna(buatMemori({ sesi: null }));
  repo.akun.masukGoogle = vi.fn().mockRejectedValue(new Error('fetch failed'));
  render(<TombolAkun sesi={null} repo={repo} />);
  fireEvent.click(screen.getByRole('button', { name: /masuk/i }));
  expect(await screen.findByText(/sedang tidak tersedia/i)).toBeTruthy();
});

test('Esc menutup menu akun', () => {
  const repo = buatMemoriPengguna(buatMemori({ sesi: { userId: 'a', email: 'a@tes.local' } }));
  render(<TombolAkun sesi={{ userId: 'a', email: 'a@tes.local' }} repo={repo} />);
  const tombol = screen.getByRole('button', { name: /a@tes.local/i });
  fireEvent.click(tombol);
  expect(screen.getByRole('menu')).toBeTruthy();
  fireEvent.keyDown(tombol, { key: 'Escape' });
  expect(screen.queryByRole('menu')).toBeNull();
});

test('keluar dengan perubahan belum terkirim: tanya dulu', async () => {
  const repo = buatMemoriPengguna(buatMemori({ sesi: { userId: 'a', email: 'a@tes.local' } }));
  localStorage.setItem('arif-waris:akun', 'a');
  localStorage.setItem('arif-waris:antrean', JSON.stringify([{ tabel: 'belajar', baris: { pelajaranSlug: 'x', selesai: true, diubahPada: '1' } }]));
  repo.pengguna.simpanProgresBelajar = vi.fn().mockRejectedValue(new Error('luring'));
  render(<TombolAkun sesi={{ userId: 'a', email: 'a@tes.local' }} repo={repo} />);
  fireEvent.click(screen.getByRole('button', { name: /a@tes.local/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /keluar/i }));
  expect(await screen.findByText(/belum terkirim/i)).toBeTruthy();
});
