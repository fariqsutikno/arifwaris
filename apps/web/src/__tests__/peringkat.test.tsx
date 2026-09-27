// Spec tahap 5 "Web": kartu streak hanya untuk yang login, papan terbaca tanpa login, ikut papan lewat profil (opt-in).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori, buatMemoriPengguna, type BarisPeringkat, type NilaiPeringkat } from '@waris/data';
import { KartuStreak } from '../akun/KartuStreak';
import { Peringkat } from '../layar/Peringkat';

const SESI = { userId: 'a', email: 'umar@tes.local', nama: 'Umar bin Khattab' };
const baris = (namaTampilan: string, xp: number, saya = false): BarisPeringkat =>
  ({ peringkat: 1, namaTampilan, avatar: null, xp, streakSekarang: 2, saya });
const NILAI: NilaiPeringkat = {
  ringkasan: { xpTotal: 63, xpMingguIni: 51, streakSekarang: 3, streakTerpanjang: 5, aktifHariIni: false },
  papan: { minggu: [baris('Zaid', 40), baris('Umar', 20, true)], semua: [baris('Zaid', 90)] },
};

function siapkan(sesi: typeof SESI | null, nilai: NilaiPeringkat | null = NILAI) {
  const repo = buatMemoriPengguna(buatMemori({ sesi }));
  repo.aturPeringkat(nilai);
  return repo;
}

test('kartu streak: tanpa login tidak tampil', () => {
  const { container } = render(<KartuStreak sesi={null} repo={siapkan(null)} />);
  expect(container.textContent).toBe('');
});

test('kartu streak: angka dari server, ajakan bila hari ini belum aktif', async () => {
  render(<KartuStreak sesi={SESI} repo={siapkan(SESI)} />);
  expect(await screen.findByText(/3 hari beruntun/)).toBeTruthy();
  expect(screen.getByText(/63 XP · 51 XP minggu ini/)).toBeTruthy();
  expect(screen.getByText(/untuk menjaga streak/)).toBeTruthy();
});

test('kartu streak: layanan gagal → tidak tampil, bukan angka nol', async () => {
  const { container } = render(<KartuStreak sesi={SESI} repo={siapkan(SESI, null)} />);
  await new Promise(selesai => setTimeout(selesai, 0));
  expect(container.textContent).toBe('');
});

test('papan: terbaca tanpa login, dengan ajakan masuk; ganti periode memuat ulang', async () => {
  render(<Peringkat sesi={null} repo={siapkan(null)} />);
  expect(await screen.findByText('Zaid')).toBeTruthy();
  expect(screen.getByText(/masuk untuk mengumpulkan xp/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: /sepanjang waktu/i }));
  expect(await screen.findByText('90 XP')).toBeTruthy();
});

test('papan: baris sendiri disorot', async () => {
  render(<Peringkat sesi={SESI} repo={siapkan(SESI)} />);
  const saya = (await screen.findByText('Umar')).closest('li')!;
  expect(saya.getAttribute('aria-current')).toBe('true');
  expect(saya.className).toContain('baris-saya');
});

test('papan gagal dimuat: pesan, bukan daftar kosong', async () => {
  render(<Peringkat sesi={null} repo={siapkan(null, null)} />);
  expect(await screen.findByRole('alert')).toBeTruthy();
});

test('ikut papan: nama depan Google sebagai bawaan, sakelar ikut sudah menyala, tersimpan ke profil', async () => {
  const repo = siapkan(SESI);
  render(<Peringkat sesi={SESI} repo={repo} />);
  fireEvent.click(await screen.findByRole('button', { name: /ikut papan peringkat/i }));
  const nama = await screen.findByLabelText(/nama tampilan/i) as HTMLInputElement;
  expect(nama.value).toBe('Umar');
  expect((screen.getByLabelText(/tampilkan namaku/i) as HTMLInputElement).checked).toBe(true);
  fireEvent.change(nama, { target: { value: '  ' } });
  expect((screen.getByRole('button', { name: /simpan/i }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(nama, { target: { value: 'Abu Hafsh' } });
  fireEvent.click(screen.getByRole('button', { name: /simpan/i }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await repo.pengguna.bacaProfil()).toMatchObject({ namaTampilan: 'Abu Hafsh', ikutPapanPeringkat: true, tampilkanAvatar: false });
  expect(screen.getByRole('button', { name: /ubah profil/i })).toBeTruthy();
});
