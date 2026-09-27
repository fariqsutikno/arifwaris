// Tes daftar konten: tab status + jumlah, cari, grup modul pada menu materi, tab jenis pada menu bertab,
// tombol buat baru per peran, kondisi kosong & galat.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
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

function pasang(m: ReturnType<typeof buatMemori>, menu: KunciMenu, tab: IsiMenu, peran: Peran = 'admin') {
  return render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran }}>
      <LayarMenu menu={menu} tab={tab} />
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
  expect(await screen.findByText(/Jaringan putus/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeTruthy();
});
