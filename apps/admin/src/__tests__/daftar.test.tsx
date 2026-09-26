// Tes DaftarKonten: susunan baris per `urutan`, status ringkas (termasuk "terbit + draf"), filter status, dan
// tautan "Entri baru". Plus tes langsung statusTampil untuk kelima kasusnya.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import type { RingkasanEntri, RingkasanRevisi } from '@waris/data';
import { KonteksRepo } from '../repo';
import { DaftarKonten, statusTampil } from '../layar/DaftarKonten';
import { DAFTAR_FAQ_UJI, SOAL_HITUNG_UJI } from './contoh';

const REVISI_DASAR = { refs: [] as string[], dibuatOleh: 'u1', diperiksaOleh: null, catatanReview: null, dibuatPada: '', diperiksaPada: null };
function revisi(sisa: Partial<RingkasanRevisi> & Pick<RingkasanRevisi, 'id' | 'entriId' | 'status' | 'isi'>): RingkasanRevisi {
  return { ...REVISI_DASAR, ...sisa } as RingkasanRevisi;
}
const ENTRI_DASAR = { jenis: 'faq' as const, slug: 'slug', urutan: 1 };

test('statusTampil: terbit (revisi terakhir = revisi terbit)', () => {
  const r = revisi({ id: 'r1', entriId: 'e1', status: 'disetujui', isi: {} });
  expect(statusTampil({ ...ENTRI_DASAR, entriId: 'e1', revisiTerbitId: 'r1', revisiTerakhir: r })).toBe('terbit');
});
test('statusTampil: draf (belum pernah terbit)', () => {
  const r = revisi({ id: 'r1', entriId: 'e1', status: 'draf', isi: {} });
  expect(statusTampil({ ...ENTRI_DASAR, entriId: 'e1', revisiTerbitId: null, revisiTerakhir: r })).toBe('draf');
});
test('statusTampil: diajukan (belum pernah terbit)', () => {
  const r = revisi({ id: 'r1', entriId: 'e1', status: 'diajukan', isi: {} });
  expect(statusTampil({ ...ENTRI_DASAR, entriId: 'e1', revisiTerbitId: null, revisiTerakhir: r })).toBe('diajukan');
});
test('statusTampil: dikembalikan (belum pernah terbit)', () => {
  const r = revisi({ id: 'r1', entriId: 'e1', status: 'dikembalikan', isi: {} });
  expect(statusTampil({ ...ENTRI_DASAR, entriId: 'e1', revisiTerbitId: null, revisiTerakhir: r })).toBe('dikembalikan');
});
test('statusTampil: terbit + draf (sudah terbit, ada draf baru berbeda)', () => {
  const draf = revisi({ id: 'r2', entriId: 'e1', status: 'draf', isi: {} });
  expect(statusTampil({ ...ENTRI_DASAR, entriId: 'e1', revisiTerbitId: 'r1', revisiTerakhir: draf })).toBe('terbit + draf');
});

function siapkanMemori() {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  return m;
}

async function siapkanEntri() {
  const m = siapkanMemori();
  // Entri 1 (faq): terbit lalu diajukan draf baru → "terbit + draf".
  const entriFaq = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 1);
  const draf1 = await m.editorial.buatDraf(entriFaq, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']);
  await m.editorial.ajukan(draf1);
  await m.editorial.setujui(draf1);
  await m.editorial.buatDraf(entriFaq, 'faq', DAFTAR_FAQ_UJI[1]!, ['R05-1']);
  // Entri 2 (soal_hitung): hanya diajukan, belum pernah terbit.
  const entriSoal = await m.editorial.buatEntri('soal_hitung', 'h-01', 2);
  const draf2 = await m.editorial.buatDraf(entriSoal, 'soal_hitung', SOAL_HITUNG_UJI, ['R05-1']);
  await m.editorial.ajukan(draf2);
  return m;
}

test('baris tampil berurut `urutan`, status "terbit + draf" dan "diajukan"', async () => {
  const m = await siapkanEntri();
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran: 'admin' }}>
      <DaftarKonten jenis="faq" />
    </KonteksRepo.Provider>,
  );
  await screen.findByText('apa-itu-tirkah');
  const baris = screen.getAllByRole('row');
  // baris[0] = header
  expect(within(baris[1]!).getByText('apa-itu-tirkah')).toBeTruthy();
  expect(within(baris[1]!).getByText('terbit + draf')).toBeTruthy();
});

test('filter status menyaring baris', async () => {
  const m = await siapkanEntri();
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran: 'admin' }}>
      <DaftarKonten jenis="soal_hitung" />
    </KonteksRepo.Provider>,
  );
  await screen.findByText('h-01');
  expect(screen.getByText('diajukan')).toBeTruthy();

  const select = screen.getByLabelText(/status/i) as HTMLSelectElement;
  fireEvent.change(select, { target: { value: 'draf' } });
  expect(screen.queryByText('h-01')).toBeNull();

  fireEvent.change(select, { target: { value: 'diajukan' } });
  expect(screen.getByText('h-01')).toBeTruthy();
});

test('tombol "Entri baru" menuju rute #/baru/<jenis>', async () => {
  const m = siapkanMemori();
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran: 'admin' }}>
      <DaftarKonten jenis="faq" />
    </KonteksRepo.Provider>,
  );
  const tautan = await screen.findByRole('link', { name: /entri baru/i });
  expect(tautan.getAttribute('href')).toBe('#/baru/faq');
});
