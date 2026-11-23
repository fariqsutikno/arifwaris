// "Hapus kasus ini" menggantikan "Jangan simpan kasus ini": hapus tuntas + Urungkan, dari layar Hasil (S1, S2, S6).
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { Aplikasi } from '../Aplikasi';
import { kasusDariSusunan, SUSUNAN_CEPAT } from '../lab';
import { bacaRiwayat, catatRiwayat } from '../riwayat';
import { semuaTersimpan, simpanKasus } from '../tersimpan';

// Susunan cepat: harta 0 dan bagian lain belum ditanya, tapi dibuka langsung di Hasil (kasus tersulit untuk Urungkan).
const kasusLengkap = () => kasusDariSusunan(SUSUNAN_CEPAT[0]!);
const bukaLembar = () => fireEvent.click(within(document.querySelector('.bilah-hero')!).getByRole('button', { name: 'Bagikan' }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('arif-waris:tur:hasil', '1');
  catatRiwayat('abc', kasusLengkap(), Date.now(), { jenis: 'sendiri' });
  simpanKasus('abc', kasusLengkap(), 'Kasus A');
  window.location.hash = '#/hitung/abc';
});

it('tautan "Jangan simpan kasus ini" tidak ada lagi; "Hapus kasus ini" menggantikannya', () => {
  render(<Aplikasi />);
  bukaLembar();
  expect(screen.queryByRole('button', { name: 'Jangan simpan kasus ini' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Hapus kasus ini' })).toBeTruthy();
});

it('hapus → konfirmasi → semua simpanan hilang, kembali ke Awal Hitung dengan toast; Urungkan mengembalikan dan membuka lagi', () => {
  render(<Aplikasi />);
  bukaLembar();
  fireEvent.click(screen.getByRole('button', { name: 'Hapus kasus ini' }));
  const dialog = screen.getByRole('alertdialog');
  expect(within(dialog).getByText('Hapus kasus ini?')).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Hapus' }));
  expect(bacaRiwayat()).toEqual([]);
  expect(semuaTersimpan()).toEqual([]);
  expect(screen.getByRole('button', { name: /Mulai dari nol/ })).toBeTruthy();
  expect(window.location.hash).toBe('#/hitung');
  expect(screen.getByText('Kasus dihapus')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Urungkan' }));
  expect(bacaRiwayat().map(entri => entri.id)).toEqual(['abc']);
  expect(semuaTersimpan().map(baris => baris.judul)).toEqual(['Kasus A']);
  expect(window.location.hash).toBe('#/hitung/abc');
  // Kembali ke layar yang sama (Hasil), bukan wizard.
  expect(within(document.querySelector('.bilah-hero')!).getByRole('button', { name: 'Bagikan' })).toBeTruthy();
});

it('Batal di dialog tidak menghapus apa pun', () => {
  render(<Aplikasi />);
  bukaLembar();
  fireEvent.click(screen.getByRole('button', { name: 'Hapus kasus ini' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Batal' }));
  expect(bacaRiwayat()).toHaveLength(1);
});
