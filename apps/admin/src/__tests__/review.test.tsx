// Tes AntreanReview dengan repo memori: penulis u-p mengajukan draf faq & draf diksi; reviewer u-r menyetujui/
// mengembalikan. Revisi reviewer sendiri tampil tanpa tombol ("revisi Anda"); penulis melihat antrean baca-saja.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { AntreanReview } from '../layar/AntreanReview';
import { DAFTAR_FAQ_UJI } from './contoh';

async function siapkan() {
  const m = buatMemori({ refs: ['R09-7'], sesi: { userId: 'u-p', email: 'p@x.id' }, peran: { 'u-p': 'penulis', 'u-r': 'reviewer' } });
  const entriId = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const revisiFaq = await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[0]!, ['R09-7']);
  await m.editorial.ajukan(revisiFaq);
  await m.diksi.buatKunci('beranda.judul', 'beranda');
  const revisiDiksi = await m.diksi.buatDraf('beranda.judul', 'Kalkulator Waris', null, null);
  await m.diksi.ajukan(revisiDiksi);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  return { m, revisiFaq, revisiDiksi };
}
type Memori = Awaited<ReturnType<typeof siapkan>>['m'];

function tampilkan(m: Memori, peran: Peran = 'reviewer', userId = 'u-r') {
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: 'x@x.id' }, peran }}>
      <AntreanReview />
    </KonteksRepo.Provider>,
  );
}
const butir = (nama: RegExp) => screen.findByRole('article', { name: nama });

test('antrean menampilkan butir konten & diksi dengan diff', async () => {
  const { m } = await siapkan();
  tampilkan(m);
  const konten = await butir(/faq: apa-itu-tirkah/);
  expect(within(konten).getByText(/Apa itu tirkah\?/).textContent).toMatch(/^\+/);
  const diksi = await butir(/diksi: beranda.judul/);
  expect(within(diksi).getByText(/Kalkulator Waris/).textContent).toMatch(/^\+/);
});

test('Setujui butir konten → hilang dari antrean dan terbit', async () => {
  const { m } = await siapkan();
  tampilkan(m);
  fireEvent.click(within(await butir(/faq: /)).getByRole('button', { name: 'Setujui' }));
  await waitFor(() => expect(screen.queryByRole('article', { name: /faq: / })).toBeNull());
  const terbit = await m.konten.bacaTerbit({ jenis: 'faq' });
  expect(terbit.map(t => t.slug)).toEqual(['apa-itu-tirkah']);
});

test('Kembalikan: tanpa catatan nonaktif, dengan catatan → dikembalikan', async () => {
  const { m } = await siapkan();
  tampilkan(m);
  const diksi = await butir(/diksi: /);
  const tombol = within(diksi).getByRole('button', { name: 'Kembalikan' }) as HTMLButtonElement;
  expect(tombol.disabled).toBe(true);
  fireEvent.change(within(diksi).getByLabelText('Catatan'), { target: { value: 'ejaan' } });
  expect(tombol.disabled).toBe(false);
  fireEvent.click(tombol);
  await waitFor(async () => expect((await m.diksi.daftarRevisi('beranda.judul'))[0]!.status).toBe('dikembalikan'));
});

test('revisi reviewer sendiri: tanpa tombol, berlabel "revisi Anda"', async () => {
  const { m } = await siapkan();
  m.aturPeranLangsung('u-r', 'penulis');
  const entriId = await m.editorial.buatEntri('faq', 'siapa-ashabah', 20);
  await m.editorial.ajukan(await m.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ_UJI[1]!, ['R09-7']));
  m.aturPeranLangsung('u-r', 'reviewer');
  tampilkan(m);
  const milikSendiri = await butir(/faq: siapa-ashabah/);
  expect(within(milikSendiri).getByText('revisi Anda')).toBeTruthy();
  expect(within(milikSendiri).queryByRole('button', { name: 'Setujui' })).toBeNull();
  expect(within(await butir(/faq: apa-itu-tirkah/)).getByRole('button', { name: 'Setujui' })).toBeTruthy();
});

test('penulis membuka antrean: baca-saja', async () => {
  const { m } = await siapkan();
  m.masukSebagai({ userId: 'u-p', email: 'p@x.id' });
  tampilkan(m, 'penulis', 'u-p');
  await butir(/faq: /);
  await butir(/diksi: /);
  expect(screen.queryByRole('button', { name: 'Setujui' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Kembalikan' })).toBeNull();
});

test('galat repo tampil di butir itu', async () => {
  const { m } = await siapkan();
  m.editorial.setujui = async () => { throw new Error('ditolak RLS'); };
  tampilkan(m);
  const konten = await butir(/faq: /);
  fireEvent.click(within(konten).getByRole('button', { name: 'Setujui' }));
  expect((await within(konten).findByRole('alert')).textContent).toMatch(/ditolak RLS/);
});
