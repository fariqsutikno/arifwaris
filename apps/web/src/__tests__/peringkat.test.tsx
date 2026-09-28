// Spec tahap 5 "Web" + keputusan 2026-09-28: streak di header (teks), papan terbaca tanpa login, ikut papan otomatis
// (opt-out lewat profil), aksi sekunder berupa teks.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori, buatMemoriPengguna, type BarisPeringkat, type NilaiPeringkat } from '@waris/data';
import { PERISTIWA_KEGIATAN_TERKIRIM } from '../akun/antrean';
import { StreakKepala } from '../akun/StreakKepala';
import { Peringkat } from '../layar/Peringkat';

const SESI = { userId: 'a', email: 'umar@tes.local', nama: 'Umar bin Khattab' };
const baris = (namaTampilan: string, xp: number, saya = false): BarisPeringkat =>
  ({ peringkat: 1, namaTampilan, avatar: null, xp, streakSekarang: 2, saya });
const RINGKASAN = { xpTotal: 63, xpMingguIni: 51, streakSekarang: 3, streakTerpanjang: 5, aktifHariIni: false };
const NILAI: NilaiPeringkat = {
  ringkasan: RINGKASAN,
  papan: { minggu: [baris('Zaid', 40), baris('Umar', 20, true)], semua: [baris('Zaid', 90)] },
};

function siapkan(sesi: typeof SESI | null, nilai: NilaiPeringkat | null = NILAI) {
  const repo = buatMemoriPengguna(buatMemori({ sesi }));
  repo.aturPeringkat(nilai);
  return repo;
}

test('streak header: tanpa login tidak tampil', () => {
  const { container } = render(<StreakKepala sesi={null} repo={siapkan(null)} />);
  expect(container.textContent).toBe('');
});

test('streak header: teks tautan ke papan, redup bila hari ini belum aktif', async () => {
  render(<StreakKepala sesi={SESI} repo={siapkan(SESI)} />);
  const tautan = await screen.findByRole('link', { name: /streak 3 hari, 63 xp/i });
  expect(tautan.textContent).toBe('3');
  expect(tautan.getAttribute('href')).toBe('#/peringkat');
  expect(tautan.className).toContain('redup');
});

test('streak header: kegiatan terkirim → dimuat ulang, XP yang naik tampil sebentar', async () => {
  const repo = siapkan(SESI);
  render(<StreakKepala sesi={SESI} repo={repo} />);
  await screen.findByText('3');
  repo.aturPeringkat({ ...NILAI, ringkasan: { ...RINGKASAN, xpTotal: 75, streakSekarang: 4, aktifHariIni: true } });
  act(() => { window.dispatchEvent(new Event(PERISTIWA_KEGIATAN_TERKIRIM)); });
  expect(await screen.findByText('4')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe('+12 XP');
});

test('streak header: streak 0 mengajak mulai, bukan angka nol', async () => {
  render(<StreakKepala sesi={SESI} repo={siapkan(SESI, { ...NILAI, ringkasan: { ...RINGKASAN, streakSekarang: 0 } })} />);
  expect(await screen.findByText(/mulai streak/i)).toBeTruthy();
});

test('streak header: layanan gagal → tidak tampil', async () => {
  const { container } = render(<StreakKepala sesi={SESI} repo={siapkan(SESI, null)} />);
  await new Promise(selesai => setTimeout(selesai, 0));
  expect(container.textContent).toBe('');
});

test('papan: terbaca tanpa login, ajakan masuk berupa teks; ganti periode memuat ulang', async () => {
  render(<Peringkat sesi={null} repo={siapkan(null)} />);
  expect(await screen.findByText('Zaid')).toBeTruthy();
  expect(screen.getByRole('button', { name: /masuk untuk mengumpulkan xp/i }).className).toContain('tautan-teks');
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

test('profil belum diatur: ikut papan secara bawaan, nama depan Google; menyembunyikan diri tersimpan', async () => {
  const repo = siapkan(SESI);
  render(<Peringkat sesi={SESI} repo={repo} />);
  fireEvent.click(await screen.findByRole('button', { name: /ubah profil/i }));
  const nama = await screen.findByLabelText(/nama tampilan/i) as HTMLInputElement;
  expect(nama.value).toBe('Umar');
  const ikut = screen.getByLabelText(/tampilkan namaku/i) as HTMLInputElement;
  expect(ikut.checked).toBe(true);
  fireEvent.change(nama, { target: { value: '  ' } });
  expect((screen.getByRole('button', { name: /simpan/i }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(nama, { target: { value: 'Abu Hafsh' } });
  fireEvent.click(ikut);
  fireEvent.click(screen.getByRole('button', { name: /simpan/i }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await repo.pengguna.bacaProfil()).toMatchObject({ namaTampilan: 'Abu Hafsh', ikutPapanPeringkat: false });
  expect(screen.getByText(/sedang disembunyikan/i)).toBeTruthy();
});

test('tanpa nama Google: nama bawaan "Pengguna", bukan awalan email', async () => {
  render(<Peringkat sesi={{ userId: 'b', email: 'rahasia@tes.local' }} repo={siapkan({ ...SESI, userId: 'b' })} />);
  fireEvent.click(await screen.findByRole('button', { name: /ubah profil/i }));
  expect(((await screen.findByLabelText(/nama tampilan/i)) as HTMLInputElement).value).toBe('Pengguna');
});
