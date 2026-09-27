import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import { Portal } from '../Portal';

test('tanpa sesi → tombol masuk Google', async () => {
  const m = buatMemori();
  render(<Portal repo={m} />);
  expect(await screen.findByRole('button', { name: /masuk dengan google/i })).toBeTruthy();
});
test('sesi tanpa peran → belum punya akses + tombol keluar', async () => {
  const m = buatMemori({ sesi: { userId: 'u1', email: 'a@x.id' } });
  render(<Portal repo={m} />);
  expect(await screen.findByText(/belum punya akses/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: /keluar/i })).toBeTruthy();
});
test('peran reviewer → navigasi tanpa menu Peran', async () => {
  const m = buatMemori({ sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'reviewer' } });
  render(<Portal repo={m} />);
  expect(await screen.findByRole('link', { name: /antrean review/i })).toBeTruthy();
  expect(screen.queryByRole('link', { name: /peran/i })).toBeNull();
});
test('peran ada → tombol keluar di navigasi, klik kembali ke layar masuk', async () => {
  const m = buatMemori({ sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  render(<Portal repo={m} />);
  fireEvent.click(await screen.findByRole('button', { name: /keluar/i }));
  expect(await screen.findByRole('button', { name: /masuk dengan google/i })).toBeTruthy();
});
test('galat memuat sesi → pesan galat, bukan layar kosong', async () => {
  const m = buatMemori();
  m.akun.sesi = async () => { throw new Error('jaringan putus'); };
  render(<Portal repo={m} />);
  expect(await screen.findByText(/jaringan putus/)).toBeTruthy();
});
test('editor dengan perubahan belum disimpan: pindah rute ditanya dulu; batal → tetap di editor', async () => {
  const m = buatMemori({ sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  location.hash = '#/baru/faq';
  render(<Portal repo={m} />);
  fireEvent.change(await screen.findByLabelText('Pertanyaan'), { target: { value: 'Belum disimpan' } });
  const tanya = vi.spyOn(window, 'confirm').mockReturnValue(false);
  location.hash = '#/review';
  await waitFor(() => expect(tanya).toHaveBeenCalled());
  expect(location.hash).toBe('#/baru/faq');
  expect((screen.getByLabelText('Pertanyaan') as HTMLInputElement).value).toBe('Belum disimpan');

  tanya.mockReturnValue(true);
  location.hash = '#/review';
  expect(await screen.findByRole('heading', { name: 'Antrean review' })).toBeTruthy();
  tanya.mockRestore();
  location.hash = '';
});
