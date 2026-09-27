// Tes mode atur urutan: pegangan hanya di mode, pindahan lokal dikirim sekali saat Simpan urutan, Batal membuang,
// gagal simpan tetap di mode, reviewer tanpa tombol, dan materi mengirim urutan global rata per modul.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { LayarMenu } from '../layar/DaftarKonten';
import { DAFTAR_FAQ_UJI } from './contoh';

async function siapkanFaq() {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'penulis' } });
  const a = await m.editorial.buatEntri('faq', 'a', 10);
  await m.editorial.buatDraf(a, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']);
  const b = await m.editorial.buatEntri('faq', 'b', 20);
  await m.editorial.buatDraf(b, 'faq', DAFTAR_FAQ_UJI[1]!, ['R05-1']);
  return { m, a, b };
}
const pasang = (m: ReturnType<typeof buatMemori>, peran: Peran, menu: 'faq' | 'materi' = 'faq') => render(
  <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran }}>
    <LayarMenu menu={menu} tab={menu} />
  </KonteksRepo.Provider>,
);
const judulBaris = () => screen.getAllByRole('link').filter(el => el.getAttribute('href')?.startsWith('#/entri/')).map(el => el.textContent);

const aturUrutan = async () => fireEvent.click(await screen.findByRole('button', { name: 'Atur urutan' }));
const simpanUrutan = () => fireEvent.click(screen.getByRole('button', { name: 'Simpan urutan' }));

test('tampilan biasa tanpa pegangan; mode atur urutan menampilkannya', async () => {
  const { m } = await siapkanFaq();
  pasang(m, 'penulis');
  await screen.findByText('Apa itu tirkah?');
  expect(screen.queryByRole('button', { name: /^Turunkan/ })).toBeNull();
  await aturUrutan();
  expect(screen.getByRole('button', { name: 'Seret Apa itu tirkah?' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Turunkan Apa itu tirkah?' })).toBeTruthy();
});

test('beberapa pindahan lokal → satu kali aturUrutan saat Simpan urutan, lalu mode keluar', async () => {
  const { m, a, b } = await siapkanFaq();
  const mata = vi.spyOn(m.editorial, 'aturUrutan');
  pasang(m, 'penulis');
  await aturUrutan();
  expect((screen.getByRole('button', { name: 'Simpan urutan' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Turunkan Apa itu tirkah?' }));
  fireEvent.click(screen.getByRole('button', { name: 'Naikkan Apa itu tirkah?' }));
  fireEvent.click(screen.getByRole('button', { name: 'Turunkan Apa itu tirkah?' }));
  expect(judulBaris()).toEqual(['Siapa ashabah?', 'Apa itu tirkah?']);
  expect(mata).not.toHaveBeenCalled();
  simpanUrutan();
  await screen.findByRole('button', { name: 'Atur urutan' });
  expect(mata).toHaveBeenCalledTimes(1);
  expect(mata).toHaveBeenCalledWith([b, a]);
  expect((await m.konten.daftarEntri('faq')).map(e => e.slug)).toEqual(['b', 'a']);
});

test('Batal → susunan kembali, tidak ada yang dikirim', async () => {
  const { m } = await siapkanFaq();
  const mata = vi.spyOn(m.editorial, 'aturUrutan');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  pasang(m, 'penulis');
  await aturUrutan();
  fireEvent.click(screen.getByRole('button', { name: 'Turunkan Apa itu tirkah?' }));
  fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
  expect(judulBaris()).toEqual(['Apa itu tirkah?', 'Siapa ashabah?']);
  expect(mata).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

test('gagal simpan → pesan galat, tetap di mode dengan susunan lokal', async () => {
  const { m } = await siapkanFaq();
  m.editorial.aturUrutan = async () => { throw new Error('jaringan putus'); };
  pasang(m, 'penulis');
  await aturUrutan();
  fireEvent.click(screen.getByRole('button', { name: 'Turunkan Apa itu tirkah?' }));
  simpanUrutan();
  expect(await screen.findByText(/Urutan gagal disimpan: jaringan putus/)).toBeTruthy();
  expect(judulBaris()).toEqual(['Siapa ashabah?', 'Apa itu tirkah?']);
  expect(screen.getByRole('button', { name: 'Simpan urutan' })).toBeTruthy();
});

test('reviewer tanpa tombol Atur urutan; masuk mode mengosongkan filter & cari', async () => {
  const { m } = await siapkanFaq();
  const { unmount } = pasang(m, 'reviewer');
  await screen.findByText('Apa itu tirkah?');
  expect(screen.queryByRole('button', { name: 'Atur urutan' })).toBeNull();
  unmount();
  pasang(m, 'penulis');
  fireEvent.change(await screen.findByRole('searchbox', { name: 'Cari' }), { target: { value: 'tirkah' } });
  expect(judulBaris()).toEqual(['Apa itu tirkah?']);
  await aturUrutan();
  expect(judulBaris()).toEqual(['Apa itu tirkah?', 'Siapa ashabah?']);
});

test('materi: pindah di modul 2 mengirim semua materi rata per modul', async () => {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  const buatModul = async (nomor: number) => {
    const id = await m.editorial.buatEntri('modul', `m${nomor}`, nomor * 10);
    await m.editorial.buatDraf(id, 'modul', { nomor, judul: `Modul ${nomor}`, ringkas: 'r' }, []);
  };
  await buatModul(1);
  await buatModul(2);
  const buatMateri = async (slug: string, modul: number, urutan: number) => {
    const id = await m.editorial.buatEntri('materi', slug, urutan);
    await m.editorial.buatDraf(id, 'materi', {
      slug, judul: slug.toUpperCase(), modul, urutan, tujuan: 't', perluCek: false,
      blok: [{ jenis: 'paragraf', isi: [{ jenis: 'rujukan', kode: 'R05-1' }] }],
    }, ['R05-1']);
    return id;
  };
  // Urutan global awal sengaja acak antar-modul: materi modul 2 dibuat duluan dengan urutan kecil.
  const x = await buatMateri('x', 2, 10);
  const y = await buatMateri('y', 2, 20);
  const p = await buatMateri('p', 1, 30);
  const mata = vi.spyOn(m.editorial, 'aturUrutan');
  pasang(m, 'admin', 'materi');
  await aturUrutan();
  const grup2 = await screen.findByRole('region', { name: 'Modul 2: Modul 2' });
  fireEvent.click(within(grup2).getByRole('button', { name: 'Turunkan X' }));
  simpanUrutan();
  await waitFor(() => expect(mata).toHaveBeenCalledWith([p, y, x]));
});
