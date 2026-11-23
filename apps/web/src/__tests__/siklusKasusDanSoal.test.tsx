// Siklus kasus dan soal (spec siklus-kasus-dan-soal): soal tinggal di Latihan, kasus di Kasusmu; soal jadi kasus lewat salinan.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { Aplikasi } from '../Aplikasi';
import { kasusDariSusunan, SUSUNAN_CEPAT } from '../lab';
import { daftarSoalHitung } from '../konten/sumber';
import { bacaKasusKu } from '../kasusmu';
import { bacaSemuaIsianSoal } from '../isianSoal';
import { urutanSoalHitung } from '../layar/belajar/KuisKonsep';
import { catatLatihan } from '../progres';
import { bacaRiwayat, catatRiwayat } from '../riwayat';

beforeEach(() => { cleanup(); localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); window.location.hash = '#/latihan/hitung'; });
const kotakPertama = () => document.querySelector<HTMLInputElement | HTMLSelectElement>('.tabel-kitab tbody select, .tabel-kitab tbody input')!;

test('entri lama bersumber latihan/materi tidak muncul di riwayat maupun Kasusmu, tetapi tidak dihapus', () => {
  const kasus = kasusDariSusunan(SUSUNAN_CEPAT[0]!);
  catatRiwayat('l', kasus, Date.now(), { jenis: 'latihan', kode: 'K-01' });
  catatRiwayat('m', { ...kasus, nama: 'lain' }, Date.now(), { jenis: 'materi' });
  catatRiwayat('s', { ...kasus, nama: 'sendiri' }, Date.now(), { jenis: 'sendiri' });
  expect(bacaRiwayat().map(entri => entri.id)).toEqual(['s']);
  expect(bacaKasusKu().map(kasus => kasus.id)).toEqual(['s']);
  expect(JSON.parse(localStorage.getItem('arif-waris:riwayat')!)).toHaveLength(3);
});

test('mengerjakan soal, isi satu kotak, keluar: soal tidak jadi kasus; dibuka lagi dari Latihan, isian kembali', async () => {
  render(<Aplikasi />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Kerjakan' })[0]!);
  await waitFor(() => expect(kotakPertama()).not.toBeNull());
  const kotak = kotakPertama();
  const nilai = kotak instanceof HTMLSelectElement ? kotak.options[1]!.value : '1';
  fireEvent.change(kotak, { target: { value: nilai } });
  const [kode] = Object.keys(bacaSemuaIsianSoal());
  expect(kode).toBeDefined();
  expect(bacaRiwayat()).toEqual([]);
  expect(Object.keys(localStorage).filter(kunci => /kasus/.test(kunci) && !/riwayat/.test(kunci))).toEqual([]);

  cleanup();
  window.location.hash = '#/latihan/hitung';
  render(<Aplikasi />);
  expect(bacaKasusKu()).toEqual([]);
  expect(screen.getByText('Lanjutkan yang terputus')).toBeTruthy();
  expect(screen.getAllByText(/^Terputus, 1 dari \d+ isian$/)).toHaveLength(1);
  fireEvent.click(screen.getAllByRole('button', { name: 'Lanjutkan' })[0]!);
  await waitFor(() => expect(kotakPertama()).not.toBeNull());
  expect(kotakPertama().value).toBe(nilai);
  // Soal yang masih ditebak bukan pembahasan: tautan salinan hanya untuk soal selesai (spec B5).
  expect(screen.queryByRole('button', { name: 'Jadikan kasus sendiri' })).toBeNull();
});

test('soal selesai dibuka sebagai pembahasan; Jadikan kasus sendiri menyalin ke Kasusmu', async () => {
  const [soal] = urutanSoalHitung(daftarSoalHitung());
  catatLatihan('hitung', soal!.kode, true, null);
  render(<Aplikasi />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Pembahasan' })[0]!);
  expect(await screen.findByRole('button', { name: 'Kerjakan ulang' })).toBeTruthy();
  expect(document.querySelector('.tabel-latihan')).toBeNull();
  expect(bacaKasusKu()).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Jadikan kasus sendiri' }));
  expect(bacaKasusKu().map(kasus => kasus.sumber.jenis)).toEqual(['sendiri']);
});

test('Kerjakan ulang membuka tebakan baru dengan isian kosong', async () => {
  const [soal] = urutanSoalHitung(daftarSoalHitung());
  catatLatihan('hitung', soal!.kode, true, null);
  render(<Aplikasi />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Pembahasan' })[0]!);
  fireEvent.click(await screen.findByRole('button', { name: 'Kerjakan ulang' }));
  await waitFor(() => expect(document.querySelector('.tabel-latihan')).not.toBeNull());
  expect(kotakPertama().value).toBe('');
});
