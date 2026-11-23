// Soal hitung punya alamat #/latihan/soal/<kode>: muat ulang membuka soal yang sama dari bank soal + isianSoal (spec siklus kasus dan soal, B6).
// Menggantikan pemulihan soal lewat riwayat/progresSoalLokal dari #53.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { Aplikasi } from '../Aplikasi';
import { daftarSoalHitung } from '../konten/sumber';
import { bacaPercobaanSoal, bacaSemuaIsianSoal } from '../isianSoal';
import { urutanSoalHitung } from '../layar/belajar/KuisKonsep';
import { catatLatihan } from '../progres';
import { bacaRiwayat } from '../riwayat';

beforeEach(() => { cleanup(); localStorage.clear(); localStorage.setItem('arif-waris:tur:hasil', '1'); window.location.hash = '#/latihan/hitung'; });
const kotakPertama = () => document.querySelector<HTMLInputElement | HTMLSelectElement>('.tabel-kitab tbody select, .tabel-kitab tbody input')!;
const urutan = () => urutanSoalHitung(daftarSoalHitung());
const salinTabel = () => document.querySelector('.tabel-latihan')?.textContent;

test('soal yang dikerjakan beralamat #/latihan/soal/<kode>; muat ulang membuka soal, isian, hero, dan jangkar yang sama', async () => {
  render(<Aplikasi />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Kerjakan' })[0]!);
  await waitFor(() => expect(kotakPertama()).not.toBeNull());
  const [soal] = urutan();
  expect(window.location.hash).toBe(`#/latihan/soal/${soal!.kode}`);
  const kotak = kotakPertama();
  const nilai = kotak instanceof HTMLSelectElement ? kotak.options[1]!.value : '1';
  fireEvent.change(kotak, { target: { value: nilai } });
  const hero = document.querySelector('.lok-hero')?.textContent;
  const tabel = salinTabel();
  expect(hero).toMatch(/Soal 1 dari/);

  // Muat ulang: hash tetap, komponen dipasang lagi dari nol.
  cleanup();
  render(<Aplikasi />);
  await waitFor(() => expect(kotakPertama()).not.toBeNull());
  expect(kotakPertama().value).toBe(nilai);
  expect(document.querySelector('.lok-hero')?.textContent).toBe(hero);
  expect(salinTabel()).toBe(tabel);
  expect(window.location.hash).toBe(`#/latihan/soal/${soal!.kode}`);
  expect(bacaRiwayat()).toEqual([]);
});

test('soal selesai dimuat ulang → pembahasan (tanpa tebak), alamat tetap', async () => {
  const [soal] = urutan();
  catatLatihan('hitung', soal!.kode, true, null);
  window.location.hash = `#/latihan/soal/${soal!.kode}`;
  render(<Aplikasi />);
  expect(await screen.findByRole('button', { name: 'Kerjakan ulang' })).toBeTruthy();
  expect(document.querySelector('.tabel-latihan')).toBeNull();
  expect(window.location.hash).toBe(`#/latihan/soal/${soal!.kode}`);
});

test('kode soal tak dikenal: pesan umum tanpa kode dari URL, lalu daftar Latihan', async () => {
  window.location.hash = '#/latihan/soal/rahasia-xyz';
  const { container } = render(<Aplikasi />);
  expect(await screen.findByText(/Soal ini tidak ditemukan/)).toBeTruthy();
  expect(container.textContent).not.toMatch(/rahasia-xyz/);
  expect(window.location.hash).toBe('#/latihan');
});

test('kode soal rusak (%E0) tidak membuat aplikasi macet dan memberi pesan yang sama', async () => {
  window.location.hash = '#/latihan/soal/%E0';
  render(<Aplikasi />);
  expect(await screen.findByText(/Soal ini tidak ditemukan/)).toBeTruthy();
});

test('Kerjakan ulang menaikkan nomor percobaan dan mengosongkan isian', async () => {
  const [soal] = urutan();
  catatLatihan('hitung', soal!.kode, true, null);
  window.location.hash = `#/latihan/soal/${soal!.kode}`;
  render(<Aplikasi />);
  fireEvent.click(await screen.findByRole('button', { name: 'Kerjakan ulang' }));
  await waitFor(() => expect(kotakPertama()).not.toBeNull());
  expect(bacaPercobaanSoal(soal!.kode)).toBe(1);
  expect(kotakPertama().value).toBe('');
  expect(Object.keys(bacaSemuaIsianSoal())).toEqual([soal!.kode]);
});

test('pindah ke soal lain lewat alamat (tombol mundur/maju): isian soal sebelumnya tidak ikut terbawa', async () => {
  const [pertama, kedua] = urutan();
  window.location.hash = `#/latihan/soal/${pertama!.kode}`;
  render(<Aplikasi />);
  await waitFor(() => expect(kotakPertama()).not.toBeNull());
  const kotak = kotakPertama();
  fireEvent.change(kotak, { target: { value: kotak instanceof HTMLSelectElement ? kotak.options[1]!.value : '1' } });
  window.location.hash = `#/latihan/soal/${kedua!.kode}`;
  await waitFor(() => expect(document.querySelector('.lok-hero')?.textContent).toMatch(/Soal 2 dari/));
  expect(kotakPertama().value).toBe('');
  expect(bacaSemuaIsianSoal()[kedua!.kode]).toBeUndefined();
});
