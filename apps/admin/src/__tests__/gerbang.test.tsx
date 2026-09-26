import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
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
test('galat memuat sesi → pesan galat, bukan layar kosong', async () => {
  const m = buatMemori();
  m.akun.sesi = async () => { throw new Error('jaringan putus'); };
  render(<Portal repo={m} />);
  expect(await screen.findByText(/jaringan putus/)).toBeTruthy();
});
