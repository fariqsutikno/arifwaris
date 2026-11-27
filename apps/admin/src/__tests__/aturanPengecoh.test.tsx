// Tes halaman Aturan pengecoh dengan repo memori: tujuh aturan tampil bernama manusiawi, contoh soal (5, utuh, tanpa kode
// teknis) dibangun dari kode, Setujui/Cabut persetujuan mengubah status dan mempengaruhi pencarian soal kuis di bank,
// dan peran selain keilmuan/admin tidak melihat halamannya.
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { buatMemori, type BarisBankSoal } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { AturanPengecoh } from '../layar/AturanPengecoh';

afterEach(cleanup);

// Enam kode nyata dari bank:kuis yang memakai lupaAul.
const KODE_LUPA_AUL = [
  'K1-0000000000000KG02W', 'K1-0000000000002J4080', 'K1-0000000000002KC02G', 'K1-0000000000004J4080', 'K1-0000000000100G402W', 'K1-0000000000100RC02W',
];
const baris = (kode: string): BarisBankSoal => ({
  kode, versiGenerator: 1, keluarga: 'biasa', tingkat: 'menengah', modul: [6], label: [], jumlahMayit: 1, jumlahAhliWaris: 0, bentuk: 'kuis', aturan: ['lupaAul', 'pasanganTertukar'],
});

async function tampilkan(peran: Peran) {
  const m = buatMemori({ sesi: { userId: 'u', email: 'u@x.id' }, peran: { u: peran } });
  await m.bank.simpan(KODE_LUPA_AUL.map(baris));
  render(<KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u', email: 'u@x.id' }, peran }}><AturanPengecoh /></KonteksRepo.Provider>);
  return m;
}
const kartu = (nama: string) => screen.findByRole('article', { name: nama });

test('tujuh aturan bernama manusiawi dengan penjelasan, status awal belum disetujui, tanpa kode teknis', async () => {
  await tampilkan('keilmuan');
  expect(await screen.findAllByRole('article')).toHaveLength(7);
  const aul = await kartu("Lupa 'aul");
  expect(within(aul).getByText(/bagian sebelum 'aul/)).toBeTruthy();
  expect(within(aul).getByText('Belum disetujui')).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/lupaAul|ibuTetapSepertiga|soal_kuis\./);
});

test('lima contoh soal tampil utuh saat dibuka; contoh lain mengganti benih', async () => {
  await tampilkan('keilmuan');
  const aul = await kartu("Lupa 'aul");
  fireEvent.click(within(aul).getByText('Contoh soal'));
  await waitFor(() => expect(within(aul).getAllByText('Jawaban benar')).toHaveLength(5));
  expect(within(aul).getAllByText('Pembahasan')).toHaveLength(5);
  expect(within(aul).getByText('Contoh 5')).toBeTruthy();
  expect(aul.textContent).not.toMatch(/K1-|"indeksBenar"/);
  fireEvent.click(within(aul).getByText('Tampilkan contoh lain'));
  await waitFor(() => expect(within(aul).getAllByText('Jawaban benar')).toHaveLength(5));
});

test('aturan tanpa soal di bank menampilkan keterangan kosong', async () => {
  await tampilkan('keilmuan');
  const radd = await kartu('Lupa radd');
  fireEvent.click(within(radd).getByText('Contoh soal'));
  expect(await within(radd).findByText('Belum ada soal di bank yang memakai aturan ini.')).toBeTruthy();
});

test('Setujui lalu Cabut persetujuan: status berganti dan soal kuis di bank ikut muncul/hilang', async () => {
  const m = await tampilkan('keilmuan');
  const aul = await kartu("Lupa 'aul");
  const cari = () => m.bank.cariSoal({ jumlah: 10, benih: 'x', bentuk: 'kuis' });
  expect(await cari()).toEqual([]);
  fireEvent.click(within(aul).getByRole('button', { name: 'Setujui' }));
  expect(await within(aul).findByText('Disetujui')).toBeTruthy();
  // Semua soal contoh juga memakai pasanganTertukar, jadi baru tampil setelah aturan itu disetujui.
  expect(await cari()).toEqual([]);
  fireEvent.click(within(await kartu('Bagian suami atau istri tertukar')).getByRole('button', { name: 'Setujui' }));
  await waitFor(async () => expect((await cari()).length).toBe(6));
  fireEvent.click(within(aul).getByRole('button', { name: 'Cabut persetujuan' }));
  expect(await within(aul).findByText('Belum disetujui')).toBeTruthy();
  expect(await cari()).toEqual([]);
});

test('admin boleh; penulis tidak melihat halaman', async () => {
  await tampilkan('admin');
  expect(await screen.findAllByRole('article')).toHaveLength(7);
  cleanup();
  await tampilkan('penulis');
  expect(screen.getByText('Halaman ini untuk tim keilmuan dan admin.')).toBeTruthy();
  expect(screen.queryAllByRole('article')).toHaveLength(0);
});
