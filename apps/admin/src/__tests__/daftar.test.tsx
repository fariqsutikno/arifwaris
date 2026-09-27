// Tes daftar konten: tab status + jumlah, cari, urut, saring tersimpan di URL, aksi massal, grup modul pada menu
// materi, tab jenis pada menu bertab, tombol buat baru per peran, kondisi kosong & galat.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { LayarMenu } from '../layar/DaftarKonten';
import type { IsiMenu, KunciMenu } from '../navigasi';
import { DAFTAR_FAQ_UJI, PELAJARAN_UJI } from './contoh';

async function siapkan() {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  const faq1 = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const r1 = await m.editorial.buatDraf(faq1, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']);
  await m.editorial.ajukan(r1);
  await m.editorial.setujui(r1);
  const faq2 = await m.editorial.buatEntri('faq', 'siapa-ashabah', 20);
  await m.editorial.buatDraf(faq2, 'faq', DAFTAR_FAQ_UJI[1]!, ['R05-1']);
  return m;
}

function pasang(m: ReturnType<typeof buatMemori>, menu: KunciMenu, tab: IsiMenu, peran: Peran = 'admin', kueri?: Record<string, string>) {
  return render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran }}>
      <LayarMenu menu={menu} tab={tab} kueri={kueri} />
    </KonteksRepo.Provider>,
  );
}

// Radix Tabs berpindah pada mouseDown (bukan click) di jsdom.
const pilihTab = (nama: string) => fireEvent.mouseDown(screen.getByRole('tab', { name: nama }), { button: 0 });

test('tab status dengan jumlah menyaring baris', async () => {
  pasang(await siapkan(), 'faq', 'faq');
  await screen.findByText('Apa itu tirkah?');
  pilihTab('Draf 1');
  expect(screen.queryByText('Apa itu tirkah?')).toBeNull();
  expect(screen.getByText('Siapa ashabah?')).toBeTruthy();
  pilihTab('Terbit 1');
  expect(screen.getByText('Apa itu tirkah?')).toBeTruthy();
});

test('cari judul', async () => {
  pasang(await siapkan(), 'faq', 'faq');
  await screen.findByText('Apa itu tirkah?');
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cari' }), { target: { value: 'ashabah' } });
  expect(screen.queryByText('Apa itu tirkah?')).toBeNull();
  expect(screen.getByText('Siapa ashabah?')).toBeTruthy();
});

test('baris menaut ke editor; tombol buat baru untuk admin, tidak untuk reviewer', async () => {
  const m = await siapkan();
  const { unmount } = pasang(m, 'faq', 'faq');
  expect((await screen.findByRole('link', { name: 'Apa itu tirkah?' })).getAttribute('href')).toMatch(/^#\/entri\//);
  expect(screen.getByRole('link', { name: '+ FAQ baru' }).getAttribute('href')).toBe('#/baru/faq');
  unmount();
  pasang(m, 'faq', 'faq', 'reviewer');
  await screen.findByText('Apa itu tirkah?');
  expect(screen.queryByRole('link', { name: '+ FAQ baru' })).toBeNull();
});

test('menu bertab: tab jenis menaut ke rute menu', async () => {
  pasang(await siapkan(), 'pustaka', 'kitab');
  expect(screen.getByRole('link', { name: 'Syahid' }).getAttribute('href')).toBe('#/menu/pustaka/syahid');
  expect(screen.getByRole('link', { name: 'Kitab' }).getAttribute('aria-current')).toBe('page');
  expect(await screen.findByText(/Belum ada kitab/)).toBeTruthy();
});

test('menu materi: grup per modul dengan tautan edit modul', async () => {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  const modul = await m.editorial.buatEntri('modul', 'pengantar', 10);
  await m.editorial.buatDraf(modul, 'modul', { nomor: PELAJARAN_UJI.modul, judul: 'Pengantar', ringkas: 'r' }, []);
  const materi = await m.editorial.buatEntri('materi', PELAJARAN_UJI.slug, 10);
  await m.editorial.buatDraf(materi, 'materi', PELAJARAN_UJI, ['R05-1']);
  pasang(m, 'materi', 'materi');
  const grup = await screen.findByRole('region', { name: `Modul ${PELAJARAN_UJI.modul}: Pengantar` });
  expect(within(grup).getByText(PELAJARAN_UJI.judul)).toBeTruthy();
  expect(within(grup).getByRole('link', { name: 'Edit modul Pengantar' }).getAttribute('href')).toBe(`#/entri/${modul}`);
  expect(screen.getByRole('link', { name: '+ Modul baru' })).toBeTruthy();
});

test('galat repo tampil dengan tombol coba lagi', async () => {
  const m = await siapkan();
  m.konten.daftarEntri = async () => { throw new Error('jaringan putus'); };
  pasang(m, 'faq', 'faq');
  expect(await screen.findByText(/jaringan putus/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeTruthy();
});

test('Sampah: entri yang dibuang hilang dari Semua, muncul di tab Sampah, Pulihkan mengembalikannya', async () => {
  const m = await siapkan();
  const [, draf] = await m.konten.daftarEntri('faq');
  await m.editorial.buangEntri(draf!.entriId);
  pasang(m, 'faq', 'faq');
  await screen.findByText('Apa itu tirkah?');
  expect(screen.queryByText('Siapa ashabah?')).toBeNull();
  pilihTab('Sampah 1');
  fireEvent.click(await screen.findByRole('button', { name: 'Pulihkan' }));
  await screen.findByRole('tab', { name: 'Sampah 0' });
  pilihTab('Semua 2');
  expect(await screen.findByText('Siapa ashabah?')).toBeTruthy();
});

const judulBaris = () => screen.getAllByRole('link').filter(el => el.getAttribute('href')?.startsWith('#/entri/')).map(el => el.textContent);

test('urutkan judul A–Z & saring tersimpan di URL; kueri awal dipulihkan', async () => {
  const m = await siapkan();
  const { unmount } = pasang(m, 'faq', 'faq');
  await screen.findByText('Apa itu tirkah?');
  fireEvent.change(screen.getByRole('combobox', { name: 'Urutkan' }), { target: { value: 'judul' } });
  expect(judulBaris()).toEqual(['Apa itu tirkah?', 'Siapa ashabah?']);
  pilihTab('Draf 1');
  expect(location.hash).toBe('#/menu/faq/faq?status=draf&urut=judul');
  unmount();
  pasang(m, 'faq', 'faq', 'admin', { status: 'draf' });
  await screen.findByText('Siapa ashabah?');
  expect(screen.queryByText('Apa itu tirkah?')).toBeNull();
  location.hash = '';
});

test('baris menampilkan info ringkas: kelompok & pembuat', async () => {
  pasang(await siapkan(), 'faq', 'faq');
  const baris = (await screen.findByText('Siapa ashabah?')).closest('div')!;
  expect(within(baris).getByText(/Fikih · oleh Anda/)).toBeTruthy();
});

test('aksi massal: pilih semua → Ajukan hanya draf yang boleh diajukan', async () => {
  const m = await siapkan();
  pasang(m, 'faq', 'faq');
  expect(screen.queryByLabelText(/Pilih semua yang tampil/)).toBeNull();
  fireEvent.click(await screen.findByRole('button', { name: 'Pilih beberapa' }));
  fireEvent.click(await screen.findByLabelText(/Pilih semua yang tampil/));
  expect(screen.getByText('2 dipilih')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ajukan (1)' }));
  expect(await screen.findByText('1 revisi diajukan.')).toBeTruthy();
  const faq = await m.konten.daftarEntri('faq');
  expect(faq.find(e => e.slug === 'siapa-ashabah')!.revisiTerakhir!.status).toBe('diajukan');
});

test('aksi massal reviewer: Setujui setelah konfirmasi; yang gagal dilaporkan', async () => {
  const m = await siapkan();
  const [, kedua] = await m.konten.daftarEntri('faq');
  await m.editorial.ajukan(kedua!.revisiTerakhir!.id);
  m.aturPeranLangsung('u2', 'reviewer');
  m.masukSebagai({ userId: 'u2', email: 'r@x.id' });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u2', email: 'r@x.id' }, peran: 'reviewer' }}>
      <LayarMenu menu="faq" tab="faq" />
    </KonteksRepo.Provider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Pilih beberapa' }));
  fireEvent.click(await screen.findByLabelText('Pilih Siapa ashabah?'));
  expect(screen.queryByRole('button', { name: /^Ajukan/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Setujui (1)' }));
  await screen.findByText('1 revisi disetujui.');
  expect((await m.konten.bacaTerbit({ jenis: 'faq' })).map(t => t.slug).sort()).toEqual(['apa-itu-tirkah', 'siapa-ashabah']);
  vi.restoreAllMocks();
});

test('menu materi: tombol "Materi di modul ini" menaut ke entri baru dengan modul terisi', async () => {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  const id = await m.editorial.buatEntri('modul', '3', 30);
  await m.editorial.buatDraf(id, 'modul', { nomor: 3, judul: 'Furudh', ringkas: 'r' }, []);
  pasang(m, 'materi', 'materi');
  const tautan = await screen.findByRole('link', { name: /Materi di modul ini/ });
  expect(tautan.getAttribute('href')).toBe('#/baru/materi?modul=3');
  await waitFor(() => expect(screen.getByRole('region', { name: 'Modul 3: Furudh' })).toBeTruthy());
});

test('angka tab status mengikuti cari yang aktif', async () => {
  pasang(await siapkan(), 'faq', 'faq');
  await screen.findByRole('tab', { name: 'Semua 2' });
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cari' }), { target: { value: 'tirkah' } });
  expect(screen.getByRole('tab', { name: 'Semua 1' })).toBeTruthy();
  location.hash = '';
});

test('saring lewat tombol Saring: chip aktif bisa dihapus', async () => {
  pasang(await siapkan(), 'faq', 'faq');
  await screen.findByText('Apa itu tirkah?');
  fireEvent.click(screen.getByRole('button', { name: 'Saring' }));
  fireEvent.click(await screen.findByLabelText('Hanya milik saya'));
  expect(screen.getByRole('button', { name: /^Saring/ }).textContent).toBe('Saring1');
  fireEvent.click(screen.getByRole('button', { name: 'Hapus saring Milik saya' }));
  expect(screen.queryByRole('button', { name: 'Hapus saring Milik saya' })).toBeNull();
});
