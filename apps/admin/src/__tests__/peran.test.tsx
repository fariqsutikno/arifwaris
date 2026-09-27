// Tes KelolaPeran: tabel nama+email+peran, form "Beri peran" menambah baris, email tak dikenal menampilkan
// pesan tanpa mengubah tabel, "Cabut" (window.confirm) menghapus baris dan tombolnya nonaktif untuk diri
// sendiri; plus Portal merender "hanya admin" untuk non-admin di rute #/peran.
import { fireEvent, render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import { KonteksRepo } from '../repo';
import { KelolaPeran } from '../layar/KelolaPeran';
import { Portal } from '../Portal';

const ADMIN = { userId: 'u-admin', email: 'admin@x.id' };

function siapkan() {
  const m = buatMemori({ refs: ['R09-7'], sesi: ADMIN, peran: { 'u-admin': 'admin' } });
  m.daftarkanPengguna({ ...ADMIN, nama: 'Admin' });
  m.daftarkanPengguna({ userId: 'u-rev', email: 'rev@x.id', nama: 'Ustadz' });
  return m;
}

function render_(m: ReturnType<typeof siapkan>) {
  return render(
    <KonteksRepo.Provider value={{ repo: m, sesi: ADMIN, peran: 'admin' }}>
      <KelolaPeran />
    </KonteksRepo.Provider>,
  );
}

test('tabel menampilkan nama + email + peran', async () => {
  const m = siapkan();
  await m.akun.aturPeran('rev@x.id', 'reviewer');
  render_(m);
  await screen.findByText('rev@x.id');
  expect(screen.getByText('Ustadz')).toBeTruthy();
  const baris = screen.getByText('rev@x.id').closest('tr')!;
  expect(within(baris).getByText('reviewer')).toBeTruthy();
});

test('form email + peran → "Beri peran" menambah baris', async () => {
  const m = siapkan();
  render_(m);
  await screen.findByText('admin@x.id');

  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'rev@x.id' } });
  fireEvent.change(screen.getByLabelText('Peran'), { target: { value: 'reviewer' } });
  fireEvent.click(screen.getByRole('button', { name: /beri peran/i }));

  await screen.findByText('rev@x.id');
  const baris = screen.getByText('rev@x.id').closest('tr')!;
  expect(within(baris).getByText('reviewer')).toBeTruthy();
});

test('email tak dikenal → pesan tampil, tabel tidak berubah', async () => {
  const m = siapkan();
  render_(m);
  await screen.findByText('admin@x.id');

  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'siapa@x.id' } });
  fireEvent.click(screen.getByRole('button', { name: /beri peran/i }));

  await screen.findByText(/akun belum pernah masuk/);
  expect(screen.queryByText('siapa@x.id')).toBeNull();
  expect(screen.getAllByRole('row')).toHaveLength(2); // header + admin saja
});

test('"Cabut" (dengan confirm) menghapus baris; admin tidak bisa mencabut dirinya sendiri', async () => {
  const m = siapkan();
  await m.akun.aturPeran('rev@x.id', 'reviewer');
  render_(m);
  await screen.findByText('rev@x.id');

  const barisAdmin = screen.getByText('admin@x.id').closest('tr')!;
  expect((barisAdmin.querySelector('button') as HTMLButtonElement).disabled).toBe(true);

  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const barisRev = screen.getByText('rev@x.id').closest('tr')!;
  fireEvent.click(barisRev.querySelector('button')!);

  await waitForElementToBeRemoved(() => screen.queryByText('rev@x.id'));
});

test('rute #/peran untuk non-admin → "hanya admin"', async () => {
  const m = siapkan();
  m.masukSebagai({ userId: 'u-rev', email: 'rev@x.id' });
  m.aturPeranLangsung('u-rev', 'penulis');
  m.daftarkanPengguna({ userId: 'u-rev', email: 'rev@x.id', nama: 'Ustadz' });
  location.hash = '#/peran';
  render(<Portal repo={m} />);
  await screen.findByText(/hanya admin/i);
});
