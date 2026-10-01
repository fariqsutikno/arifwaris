import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { tambahAhliWaris } from '../checklist';
import { keJson, kasusBaru } from '../kasus';
import { sudahDibagikan } from '../bagikanLokal';
import { DialogBagikan } from '../layar/DialogBagikan';
import { KasusDibagikan } from '../layar/KasusDibagikan';

const kasus = () => {
  const dasar = kasusBaru('L');
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: 24_000_000n }, graf: tambahAhliWaris(dasar.graf, 'PEWARIS', 'ISTRI') };
};
const pemilik = { userId: 'u1', email: 'pemilik@tes.local' };

function siapkan() {
  const bersama = buatMemori();
  const { bagikan, pengguna, peringkat } = buatMemoriPengguna(bersama);
  bersama.masukSebagai(pemilik);
  return { bersama, bagikan, repo: { akun: bersama.akun, pengguna, peringkat, bagikan } };
}
beforeEach(() => localStorage.clear());

const pilihAkses = async (nama: RegExp) => fireEvent.click(await screen.findByRole('radio', { name: nama }));
const simpanDanKonfirmasi = async (tombol: string) => {
  fireEvent.click(screen.getByRole('button', { name: tombol }));
  fireEvent.click(await screen.findByRole('button', { name: 'Ya, simpan' }));
};

test('bawaan Hanya saya: tanpa tautan dan tanpa tombol simpan; memilih membagikan menampilkan tautan', async () => {
  const { bagikan } = siapkan();
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={() => {}} />);
  expect(await screen.findByRole('radio', { name: /Hanya saya/ })).toHaveProperty('checked', true);
  expect(screen.queryByRole('textbox', { name: 'Tautan' })).toBeNull();
  expect(screen.queryByRole('button', { name: /Buat tautan/ })).toBeNull();
  await pilihAkses(/Siapa saja/);
  expect(screen.getByRole('textbox', { name: 'Tautan' })).toBeTruthy();
});

test('nama tautan bisa diketik; status tersedia/dipakai; membuat tautan lewat konfirmasi lalu menyalin', async () => {
  const { bagikan } = siapkan();
  await bagikan.simpan('lain', { slug: 'sama', akses: 'tautan', email: [] }, {});
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={() => {}} />);
  await pilihAkses(/Siapa saja/);
  const isian = screen.getByRole('textbox', { name: 'Tautan' });
  expect(screen.getByRole('button', { name: 'Salin' })).toHaveProperty('disabled', true);
  fireEvent.change(isian, { target: { value: 'Sama' } });
  expect(await screen.findByText('Sudah dipakai kasus lain. Coba nama lain.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Buat tautan' })).toHaveProperty('disabled', true);
  fireEvent.change(isian, { target: { value: 'kasus-pak-budi' } });
  expect(await screen.findByText('Nama tautan ini tersedia.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Buat tautan' }));
  // Belum tersimpan sebelum dikonfirmasi.
  expect(await bagikan.bacaPengaturan('r1')).toBeNull();
  expect(screen.getByText(/Siapa saja yang punya tautan ini akan bisa melihat/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ya, simpan' }));
  expect(await screen.findByText(/Tautan aktif/, { selector: 'p.sukses-bagikan' })).toBeTruthy();
  expect(sudahDibagikan('r1')).toBe(true);
  expect(await bagikan.bacaPengaturan('r1')).toEqual({ slug: 'kasus-pak-budi', akses: 'tautan', email: [] });
  expect(screen.getByRole('button', { name: /Salin|Tersalin/ })).toHaveProperty('disabled', false);
  expect(screen.getByRole('link', { name: /Pratinjau sebagai penerima/ })).toBeTruthy();
});

test('memilih Hanya saya lalu menyimpan menghentikan pembagian (dengan konfirmasi)', async () => {
  const { bagikan } = siapkan();
  await bagikan.simpan('r1', { slug: 'umum', akses: 'tautan', email: [] }, {});
  const saatTutup = vi.fn();
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={saatTutup} />);
  await pilihAkses(/Hanya saya/);
  fireEvent.click(screen.getByRole('button', { name: 'Berhenti membagikan' }));
  expect(screen.getByText(/Pembagian dihentikan/)).toBeTruthy();
  expect(await bagikan.bacaPengaturan('r1')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
  expect(await bagikan.bacaPengaturan('r1')).not.toBeNull();
  await simpanDanKonfirmasi('Berhenti membagikan');
  await waitFor(async () => expect(await bagikan.bacaPengaturan('r1')).toBeNull());
  expect(saatTutup).toHaveBeenCalled();
});

test('akses email: tombol aktif hanya bila email sah, kesalahan ditunjuk saat mengetik', async () => {
  const { bagikan } = siapkan();
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={() => {}} />);
  await pilihAkses(/Email tertentu/);
  await screen.findByText('Nama tautan ini tersedia.');
  expect(screen.getByRole('button', { name: 'Buat tautan' })).toHaveProperty('disabled', true);
  fireEvent.change(screen.getByRole('textbox', { name: 'Email yang boleh membuka' }), { target: { value: 'bukan-email' } });
  expect(screen.getByText('Penulisan email “bukan-email” belum benar.')).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox', { name: 'Email yang boleh membuka' }), { target: { value: 'a@b.co, c@d.co' } });
  expect(screen.getByText(/2 email/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Buat tautan' })).toHaveProperty('disabled', false);
});

test('klik di luar dialog menutupnya; klik di dalam tidak', async () => {
  const { bagikan } = siapkan();
  const saatTutup = vi.fn();
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={saatTutup} />);
  const dialog = await screen.findByRole('dialog');
  fireEvent.mouseDown(screen.getByRole('radio', { name: /Hanya saya/ }));
  expect(saatTutup).not.toHaveBeenCalled();
  fireEvent.mouseDown(dialog);
  expect(saatTutup).toHaveBeenCalledTimes(1);
});

test('penerima: tautan umum tampil, slug asing tidak ditemukan, akses email minta masuk', async () => {
  const { bersama, bagikan, repo } = siapkan();
  await bagikan.simpan('r1', { slug: 'umum', akses: 'tautan', email: [] }, JSON.parse(keJson(kasus())));
  await bagikan.simpan('r2', { slug: 'teman', akses: 'email', email: ['teman@tes.local'] }, JSON.parse(keJson(kasus())));
  bersama.masukSebagai(null);

  const umum = render(<KasusDibagikan slug="umum" repo={repo} menunggu={false} saatSalin={() => {}} />);
  expect(await screen.findByRole('button', { name: /Salin ke riwayatku/ })).toBeTruthy();
  umum.unmount();

  const asing = render(<KasusDibagikan slug="tidak-ada" repo={repo} menunggu={false} saatSalin={() => {}} />);
  expect(await screen.findByText('Kasus tidak ditemukan')).toBeTruthy();
  asing.unmount();

  render(<KasusDibagikan slug="teman" repo={repo} menunggu={false} saatMasuk={() => {}} saatSalin={() => {}} />);
  expect(await screen.findByText('Masuk dulu untuk membuka kasus ini')).toBeTruthy();
});
