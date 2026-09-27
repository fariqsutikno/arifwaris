import { fireEvent, render, screen } from '@testing-library/react';
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
  expect(await screen.findByText(/jaringan putus/i)).toBeTruthy();
});
test('lencana antrean: hanya revisi yang boleh diperiksa (penulis tanpa lencana, reviewer tanpa revisinya sendiri)', async () => {
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-p', email: 'p@x.id' }, peran: { 'u-p': 'penulis', 'u-r': 'reviewer' } });
  await m.diksi.buatKunci('a.b', 'a');
  await m.diksi.ajukan(await m.diksi.buatDraf('a.b', 'teks', null, null));
  const { unmount } = render(<Portal repo={m} />);
  await screen.findByRole('link', { name: /antrean review/i });
  expect(screen.queryByLabelText(/menunggu review/)).toBeNull();
  unmount();

  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  m.aturPeranLangsung('u-r', 'penulis');
  await m.diksi.buatKunci('c.d', 'c');
  await m.diksi.ajukan(await m.diksi.buatDraf('c.d', 'milik reviewer', null, null));
  m.aturPeranLangsung('u-r', 'reviewer');
  render(<Portal repo={m} />);
  expect(await screen.findByLabelText('1 menunggu review')).toBeTruthy();
});
