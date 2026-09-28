// Tes Daftar teks aplikasi: teks edukasi & diksi tampil bersama tanpa kunci teknis, label pendek disembunyikan kecuali
// admin menampilkan semua, sunting diksi lewat dialog → diajukan, dan riwayat diksi bisa menayangkan lagi versi lama.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { DaftarTeksAplikasi } from '../layar/DaftarTeksAplikasi';
import { layakDisunting } from '../editor/teksAplikasi';

async function siapkan() {
  const m = buatMemori({ refs: [], sesi: { userId: 'u-a', email: 'a@x.id' }, peran: { 'u-a': 'admin', 'u-p': 'penulis', 'u-r': 'reviewer' } });
  const entriId = await m.editorial.buatEntri('teks_edukasi', 'harta.penjelasan_utang', 10);
  await m.editorial.terbitkanLangsung(await m.editorial.buatDraf(entriId, 'teks_edukasi', { id: 'Utang dilunasi sebelum harta dibagi.' }, []));
  await m.diksi.buatKunci('beranda.judul', 'beranda');
  await m.diksi.buatKunci('umum.kembali', 'umum');
  for (const [kunci, id] of [['beranda.judul', 'Hitung warisan dengan tenang'], ['umum.kembali', 'Kembali']] as const) {
    const r = await m.diksi.buatDraf(kunci, id, null, null);
    await m.diksi.ajukan(r);
  }
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  for (const k of await m.diksi.daftarKunci()) if (k.revisiTerakhir?.status === 'diajukan') await m.diksi.setujui(k.revisiTerakhir.id);
  return m;
}

function tampilkan(m: Awaited<ReturnType<typeof siapkan>>, peran: Peran, userId: string) {
  m.masukSebagai({ userId, email: `${userId}@x.id` });
  render(<KonteksRepo.Provider value={{ repo: m, sesi: { userId, email: 'x@x.id' }, peran }}><DaftarTeksAplikasi /></KonteksRepo.Provider>);
}

test('layakDisunting: label ≤ 2 kata tidak, kalimat ya, sisipan tidak dihitung', () => {
  expect(layakDisunting('Kembali')).toBe(false);
  expect(layakDisunting('{jumlah} orang')).toBe(false);
  expect(layakDisunting('Harta yang dibagi')).toBe(true);
});

test('dua sumber tampil bersama tanpa kunci; label pendek disembunyikan, admin bisa menampilkan semua', async () => {
  tampilkan(await siapkan(), 'admin', 'u-a');
  await screen.findByText('Hitung warisan dengan tenang');
  expect(screen.getByText('Utang dilunasi sebelum harta dibagi.')).toBeTruthy();
  expect(screen.queryByText('Kembali')).toBeNull();
  expect(screen.queryByText(/beranda\.judul|harta\.penjelasan/)).toBeNull();
  fireEvent.click(screen.getByLabelText(/Tampilkan semua teks/));
  expect(screen.getByText('Kembali')).toBeTruthy();
});

test('penulis: sunting teks → diajukan untuk review', async () => {
  const m = await siapkan();
  tampilkan(m, 'penulis', 'u-p');
  const butir = await screen.findByRole('article', { name: 'Hitung warisan dengan tenang' });
  expect(screen.queryByLabelText(/Tampilkan semua teks/)).toBeNull();
  fireEvent.click(within(butir).getByRole('button', { name: 'Sunting' }));
  fireEvent.change(await screen.findByLabelText('Bahasa Indonesia'), { target: { value: 'Hitung warisan dengan tenang dan benar' } });
  expect(screen.getByText('Pratinjau:', { exact: false })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Simpan & ajukan' }));
  await waitFor(async () => {
    const k = (await m.diksi.daftarKunci()).find(x => x.kunci === 'beranda.judul')!;
    expect(k.revisiTerakhir).toMatchObject({ status: 'diajukan', idTeks: 'Hitung warisan dengan tenang dan benar' });
  });
});

test('reviewer: riwayat teks menayangkan lagi versi lama', async () => {
  const m = await siapkan();
  m.masukSebagai({ userId: 'u-a', email: 'a@x.id' });
  const baru = await m.diksi.buatDraf('beranda.judul', 'Judul baru yang lebih panjang', null, null);
  await m.diksi.ajukan(baru);
  m.masukSebagai({ userId: 'u-r', email: 'r@x.id' });
  await m.diksi.setujui(baru);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  tampilkan(m, 'reviewer', 'u-r');
  const butir = await screen.findByRole('article', { name: 'Judul baru yang lebih panjang' });
  fireEvent.click(within(butir).getByRole('button', { name: 'Riwayat' }));
  fireEvent.click(await within(butir).findByRole('button', { name: 'Tayangkan lagi' }));
  await waitFor(async () => expect((await m.diksi.bacaTerbit()).find(t => t.kunci === 'beranda.judul')?.id).toBe('Hitung warisan dengan tenang'));
  vi.restoreAllMocks();
});
