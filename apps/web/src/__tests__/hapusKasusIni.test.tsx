// "Hapus kasus ini" menggantikan "Jangan simpan kasus ini": hapus tuntas + Urungkan, dari layar Hasil (S1, S2, S6).
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { Aplikasi } from '../Aplikasi';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { bacaProgresSoal, simpanProgresSoal } from '../progresSoalLokal';
import { bacaRiwayat, catatRiwayat } from '../riwayat';
import { semuaTersimpan, simpanKasus } from '../tersimpan';

const kasusLengkap = () => {
  const dasar = kasusBaru('L', 'latihan');
  const graf = ['ISTRI', 'ANAK_LK'].reduce((g, k) => tambahAhliWaris(g, 'PEWARIS', k as 'ISTRI'), dasar.graf);
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: 24_000_000n }, graf };
};
const bukaLembar = () => fireEvent.click(within(document.querySelector('.bilah-hero')!).getByRole('button', { name: 'Bagikan' }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('arif-waris:tur:hasil', '1');
  catatRiwayat('abc', kasusLengkap(), Date.now(), { jenis: 'sendiri' });
  simpanKasus('abc', kasusLengkap(), 'Kasus A');
  simpanProgresSoal('abc', { isian: null, pilihanGharqa: null, jawabanTerbuka: false, sudahMencoba: false, tebakanBenar: false, idSesiSoal: 'p', revisiSoal: 'r' });
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
  expect(bacaProgresSoal('abc', 'r')).toBeNull();
  expect(screen.getByRole('button', { name: /Mulai dari nol/ })).toBeTruthy();
  expect(window.location.hash).toBe('#/hitung');
  expect(screen.getByText('Kasus dihapus')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Urungkan' }));
  expect(bacaRiwayat().map(entri => entri.id)).toEqual(['abc']);
  expect(semuaTersimpan().map(baris => baris.judul)).toEqual(['Kasus A']);
  expect(bacaProgresSoal('abc', 'r')).not.toBeNull();
  expect(window.location.hash).toBe('#/hitung/abc');
});

it('Batal di dialog tidak menghapus apa pun', () => {
  render(<Aplikasi />);
  bukaLembar();
  fireEvent.click(screen.getByRole('button', { name: 'Hapus kasus ini' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Batal' }));
  expect(bacaRiwayat()).toHaveLength(1);
});
