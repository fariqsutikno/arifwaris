import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
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

test('nama tautan langsung bisa diketik; status tersedia/dipakai muncul; buat tautan menyalin dan menampilkan tautan aktif', async () => {
  const { bagikan } = siapkan();
  await bagikan.simpan('lain', { slug: 'sama', akses: 'tautan', email: [] }, {});
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={() => {}} />);
  const isian = await screen.findByRole('textbox', { name: 'Nama tautan' });
  // Salin belum bisa sebelum tautan dibuat.
  expect(screen.getByRole('button', { name: 'Salin' })).toHaveProperty('disabled', true);
  fireEvent.change(isian, { target: { value: 'Sama' } });
  expect(await screen.findByText('Sudah dipakai kasus lain. Coba nama lain.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Buat tautan' })).toHaveProperty('disabled', true);
  fireEvent.change(isian, { target: { value: 'kasus-pak-budi' } });
  expect(await screen.findByText('Nama tautan ini tersedia.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Buat tautan' }));
  expect(await screen.findByText(/Tautan aktif/, { selector: 'p.sukses-bagikan' })).toBeTruthy();
  expect(sudahDibagikan('r1')).toBe(true);
  expect(await bagikan.bacaPengaturan('r1')).toEqual({ slug: 'kasus-pak-budi', akses: 'tautan', email: [] });
  // Sesudah tersimpan: Salin aktif, tombol simpan hilang sampai ada perubahan.
  expect(screen.getByRole('button', { name: /Salin|Tersalin/ })).toHaveProperty('disabled', false);
  expect(screen.queryByRole('button', { name: 'Simpan perubahan' })).toBeNull();
  fireEvent.click(screen.getByRole('radio', { name: /Hanya saya/ }));
  expect(screen.getByRole('button', { name: 'Simpan perubahan' })).toHaveProperty('disabled', false);
});

test('mematikan tautan minta konfirmasi dulu', async () => {
  const { bagikan } = siapkan();
  await bagikan.simpan('r1', { slug: 'umum', akses: 'tautan', email: [] }, {});
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={() => {}} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Matikan tautan' }));
  expect(await bagikan.bacaPengaturan('r1')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Ya, matikan' }));
  await waitFor(async () => expect(await bagikan.bacaPengaturan('r1')).toBeNull());
});

test('akses email: tombol buat tautan aktif hanya bila email sah, kesalahan ditunjuk saat mengetik', async () => {
  const { bagikan } = siapkan();
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={() => {}} />);
  fireEvent.click(await screen.findByRole('radio', { name: /Email tertentu/ }));
  await screen.findByText('Nama tautan ini tersedia.');
  expect(screen.getByRole('button', { name: 'Buat tautan' })).toHaveProperty('disabled', true);
  fireEvent.change(screen.getByRole('textbox', { name: /Email yang boleh/ }), { target: { value: 'bukan-email' } });
  expect(screen.getByText('Penulisan email “bukan-email” belum benar.')).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox', { name: /Email yang boleh/ }), { target: { value: 'a@b.co, c@d.co' } });
  expect(screen.getByText(/2 email/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Buat tautan' })).toHaveProperty('disabled', false);
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
