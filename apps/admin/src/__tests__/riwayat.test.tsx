// Tes RiwayatRevisi dengan repo memori: entri faq dengan dua revisi disetujui (r1 lalu r2, terbit = r2). Reviewer
// melihat r2 berlabel "terbit" dan r1 dengan tombol "Terbitkan ulang"; klik (setelah confirm) → terbit balik ke r1
// dan saatBerubah dipanggil. Penulis tidak melihat tombol rollback. Catatan review revisi tampil.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { RiwayatRevisi } from '../layar/RiwayatRevisi';
import { DAFTAR_FAQ_UJI } from './contoh';

async function siapkan() {
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-p', email: 'p@x.id' }, peran: { 'u-p': 'penulis', 'u-r': 'reviewer' } });
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const r1 = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(r1);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.editorial.setujui(r1);
  m.masukSebagai({ userId: 'u-p', email: 'p@x.id' });
  const r2 = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[1]!, ['R09-7']);
  await m.editorial.ajukan(r2);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.editorial.setujui(r2);
  return { m, entriId, r1, r2 };
}
type Memori = Awaited<ReturnType<typeof siapkan>>['m'];

function tampilkan(m: Memori, entriId: string, peran: Peran = 'reviewer', userId = 'u-r') {
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: 'x@x.id' }, peran }}>
      <RiwayatRevisi entriId={entriId} jenis="faq" revisiTerbitId={null} saatBerubah={() => {}} />
    </KonteksRepo.Provider>,
  );
}

test('reviewer: r2 berlabel terbit, r1 punya tombol Terbitkan ulang; klik → rollback ke r1', async () => {
  const { m, entriId, r1 } = await siapkan();
  const saatBerubah = vi.fn();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u-r', email: 'r@x.id' }, peran: 'reviewer' }}>
      <RiwayatRevisi entriId={entriId} jenis="faq" revisiTerbitId={r1} saatBerubah={saatBerubah} />
    </KonteksRepo.Provider>,
  );
  const barisR1 = await screen.findByLabelText(`revisi ${r1.slice(0, 8)}`);
  expect(within(barisR1).getByText(/^terbit ·/)).toBeTruthy();
  const semuaBaris = screen.getAllByRole('article');
  const barisR2 = semuaBaris.find(b => b !== barisR1)!;
  expect(within(barisR2).getByRole('button', { name: 'Terbitkan ulang' })).toBeTruthy();
  expect(within(barisR1).queryByRole('button', { name: 'Terbitkan ulang' })).toBeNull();

  fireEvent.click(within(barisR2).getByRole('button', { name: 'Terbitkan ulang' }));
  await waitFor(() => expect(saatBerubah).toHaveBeenCalled());
  expect(window.confirm).toHaveBeenCalled();
});

test('penulis: tombol Terbitkan ulang tidak tampil', async () => {
  const { m, entriId, r1 } = await siapkan();
  m.masukSebagai({ userId: 'u-p', email: 'p@x.id' });
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u-p', email: 'p@x.id' }, peran: 'penulis' }}>
      <RiwayatRevisi entriId={entriId} jenis="faq" revisiTerbitId={r1} saatBerubah={() => {}} />
    </KonteksRepo.Provider>,
  );
  await screen.findAllByRole('article');
  expect(screen.queryByRole('button', { name: 'Terbitkan ulang' })).toBeNull();
});

test('catatan review revisi tampil', async () => {
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-p', email: 'p@x.id' }, peran: { 'u-p': 'penulis', 'u-r': 'reviewer' } });
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const r1 = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(r1);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.editorial.kembalikan(r1, 'perbaiki ejaan');
  tampilkan(m, entriId);
  expect(await screen.findByText(/perbaiki ejaan/)).toBeTruthy();
});
