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

test('slug acak tidak langsung bisa diedit; Ubah tautan membukanya; slug yang dipakai kasus lain ditolak', async () => {
  const { bagikan } = siapkan();
  await bagikan.simpan('lain', { slug: 'sama', akses: 'tautan', email: [] }, {});
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={() => {}} />);
  await screen.findByRole('button', { name: 'Ubah tautan' });
  expect(screen.queryByRole('textbox', { name: 'Nama tautan' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Ubah tautan' }));
  const isian = screen.getByRole('textbox', { name: 'Nama tautan' });
  fireEvent.change(isian, { target: { value: 'Sama' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan dan salin tautan' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Tautan itu sudah dipakai kasus lain.');
  fireEvent.change(isian, { target: { value: 'kasus-pak-budi' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan dan salin tautan' }));
  // Sesudah tersimpan: tampilan lihat dengan tautan siap salin, bukan formulir.
  expect(await screen.findByText('Tautan siap dibagikan')).toBeTruthy();
  expect((screen.getByRole('textbox', { name: 'Tautan' }) as HTMLInputElement).value).toMatch(/#\/k\/kasus-pak-budi$/);
  expect(sudahDibagikan('r1')).toBe(true);
  expect(await bagikan.bacaPengaturan('r1')).toEqual({ slug: 'kasus-pak-budi', akses: 'tautan', email: [] });
  fireEvent.click(screen.getByRole('button', { name: 'Ubah pengaturan' }));
  expect(screen.getByRole('radio', { name: /Siapa saja/ })).toHaveProperty('checked', true);
});

test('akses email butuh minimal satu email yang sah', async () => {
  const { bagikan } = siapkan();
  render(<DialogBagikan idRiwayat="r1" kasus={kasus()} repo={bagikan} saatTutup={() => {}} />);
  fireEvent.click(await screen.findByRole('radio', { name: /Email tertentu/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Simpan dan salin tautan' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Isi minimal satu email.');
  fireEvent.change(screen.getByRole('textbox', { name: /Email yang boleh/ }), { target: { value: 'bukan-email' } });
  fireEvent.click(screen.getByRole('button', { name: 'Simpan dan salin tautan' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Ada email yang penulisannya belum benar.');
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
