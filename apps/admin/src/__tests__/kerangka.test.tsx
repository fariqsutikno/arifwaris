// Tes Kerangka: sidebar berkelompok per peran, lencana antrean, menu aktif, laci layar sempit.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { Kerangka, menuAktif } from '../Kerangka';
import type { Rute } from '../rute';
import { DAFTAR_FAQ_UJI } from './contoh';

const LEBAR_AWAL = window.innerWidth;
afterEach(() => { window.innerWidth = LEBAR_AWAL; });

async function pasang(peran: Peran, rute: Rute = { layar: 'beranda' }) {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'fariq@x.id' }, peran: { u1: peran, u2: 'penulis' } });
  if (peran !== 'reviewer') {
    const id = await m.editorial.buatEntri('faq', 'a', 10);
    await m.editorial.ajukan(await m.editorial.buatDraf(id, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']));
  }
  const onKeluar = vi.fn();
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'fariq@x.id' }, peran }}>
      <Kerangka rute={rute} onKeluar={onKeluar}><p>isi layar</p></Kerangka>
    </KonteksRepo.Provider>,
  );
  return { onKeluar };
}

test('admin: grup, menu Peran, lencana antrean, email & keluar', async () => {
  const { onKeluar } = await pasang('admin');
  const nav = screen.getByRole('navigation', { name: 'Navigasi portal' });
  for (const grup of ['Belajar', 'Bank soal', 'Tanya jawab', 'Pustaka', 'Aplikasi']) expect(within(nav).getByText(grup)).toBeTruthy();
  expect(within(nav).getByRole('link', { name: /Modul & Materi/ }).getAttribute('href')).toBe('#/menu/materi/materi');
  expect(within(nav).getByRole('link', { name: 'Peran' })).toBeTruthy();
  expect(await within(nav).findByLabelText('1 menunggu review')).toBeTruthy();
  expect(screen.getByText('fariq@x.id')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));
  expect(onKeluar).toHaveBeenCalled();
  expect(screen.getByText('isi layar')).toBeTruthy();
});

test('reviewer: tanpa menu Peran', async () => {
  await pasang('reviewer');
  expect(screen.queryByRole('link', { name: 'Peran' })).toBeNull();
});

test('menu aktif ditandai aria-current', async () => {
  await pasang('admin', { layar: 'menu', menu: 'pustaka', tab: 'syahid' });
  expect(screen.getByRole('link', { name: /Kitab & syahid/ }).getAttribute('aria-current')).toBe('page');
});

test('menuAktif: entri & entriBaru dari jenisnya', () => {
  expect(menuAktif({ layar: 'entri', entriId: 'x' }, 'kitab')).toBe('pustaka');
  expect(menuAktif({ layar: 'entri', entriId: 'x' }, null)).toBe(null);
  expect(menuAktif({ layar: 'entriBaru', jenis: 'modul' }, null)).toBe('materi');
  expect(menuAktif({ layar: 'review' }, 'faq')).toBe('review');
});

test('layar sempit: tombol Menu membuka laci, memilih menu menutupnya', async () => {
  window.innerWidth = 500;
  await pasang('admin');
  expect(screen.queryByRole('link', { name: /FAQ/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
  const laci = await screen.findByRole('dialog');
  fireEvent.click(within(laci).getByRole('link', { name: /FAQ/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

test('layar lebar: tombol Menu tetap tampil supaya sidebar yang diciutkan (Ctrl+B) bisa dibuka lagi', async () => {
  await pasang('admin');
  const tombol = screen.getByRole('button', { name: 'Menu' });
  expect(tombol.closest('header')!.className).not.toMatch(/\bmd:hidden\b/);
  fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
  expect(document.querySelector('[data-state="collapsed"]')).toBeTruthy();
  fireEvent.click(tombol);
  expect(document.querySelector('[data-state="expanded"]')).toBeTruthy();
});
