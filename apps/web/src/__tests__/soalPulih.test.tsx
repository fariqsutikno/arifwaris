// Isian soal latihan tersimpan per kode soal (isianSoal), bukan per sesi: Hasil yang dipasang lagi memulihkannya.
// Menggantikan L3-L5 dari #53 (status selesai/lihat jawaban tidak lagi dipulihkan Hasil; itu tugas Aplikasi lewat progres, lihat soalAlamat.test.tsx).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { Hasil } from '../layar/Hasil';
import { bacaPercobaanSoal } from '../isianSoal';

// Jangkar tetap = sel "Asal masalah" Istri, supaya isian benar bisa diketik.
vi.mock('../acakBerbenih', () => ({ acakDariBenih: () => () => 0 }));

const SOAL = { id: 'H-01', revisiId: 'rev-1', bobotXp: 20 };
const kasus = () => {
  const dasar = kasusBaru('L');
  const graf = ['ISTRI', 'ANAK_LK', 'ANAK_PR'].reduce((g, k) => tambahAhliWaris(g, 'PEWARIS', k as 'ISTRI'), dasar.graf);
  return { ...dasar, tirkah: { kotor: 24_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, graf };
};

let dikerjakan: boolean[] = [];
const tampilkan = (idSesi = 'sesi-1') => render(
  <Hasil kasus={kasus()} idSesi={idSesi} tujuan="belajar" kirim={() => undefined} soal={SOAL} saatDikerjakan={benar => { dikerjakan.push(benar); }} />,
);
const pilih = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('combobox', { name: `Bagian ${nama}` }), { target: { value: nilai } });
const ketik = (nama: string, nilai: string) => fireEvent.change(screen.getByRole('textbox', { name: nama }), { target: { value: nilai } });
const muatUlang = (idSesi?: string) => { cleanup(); tampilkan(idSesi); };
const nilaiIstri = () => (screen.getByRole('combobox', { name: 'Bagian Istri' }) as HTMLSelectElement).value;

beforeEach(() => { localStorage.clear(); dikerjakan = []; });
afterEach(() => vi.useRealTimers());

it('L2: isian yang sudah diketik kembali setelah muat ulang', () => {
  tampilkan();
  pilih('Istri', '1/8');
  muatUlang();
  expect(nilaiIstri()).toBe('1/8');
});

it('L8 (diganti): idSesi lain tetap memulihkan isian soal yang sama, karena kuncinya kode soal', () => {
  tampilkan('sesi-1');
  pilih('Istri', '1/8');
  muatUlang('sesi-2');
  expect(nilaiIstri()).toBe('1/8');
});

it('Kosongkan pada isian terisi menaikkan nomor percobaan; Kosongkan pada isian kosong tidak', () => {
  tampilkan();
  fireEvent.click(screen.getByRole('button', { name: 'Kosongkan' }));
  expect(bacaPercobaanSoal('H-01')).toBe(0);
  pilih('Istri', '1/8');
  fireEvent.click(screen.getByRole('button', { name: 'Kosongkan' }));
  expect(bacaPercobaanSoal('H-01')).toBe(1);
  expect(nilaiIstri()).toBe('');
});
