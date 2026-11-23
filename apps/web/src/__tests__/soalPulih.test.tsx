// Isian dan status soal latihan bertahan saat Hasil dimuat ulang (render ulang dengan idSesi sama): L2–L5, L8.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { Hasil } from '../layar/Hasil';
import { bacaPercobaan } from '../percobaan';

// Jangkar tetap = sel "Asal masalah" Istri, supaya isian benar bisa diketik.
vi.mock('../acakBerbenih', () => ({ acakDariBenih: () => () => 0 }));

const SOAL = { id: 'H-01', revisiId: 'rev-1' };
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
const periksa = () => fireEvent.click(screen.getByRole('button', { name: 'Periksa' }));
const isiBenar = () => {
  pilih('Istri', '1/8'); pilih('Anak laki-laki', 'Ashabah'); pilih('Anak perempuan', 'Ashabah');
  ketik('Asal masalah', '8'); ketik('Asal masalah bersama', '7'); ketik('Asal masalah akhir', '24');
  ketik('Asal masalah akhir Istri', '3'); ketik('Asal masalah akhir Anak laki-laki', '14'); ketik('Asal masalah akhir Anak perempuan', '7');
};
const bukaLewatDialog = () => {
  vi.useFakeTimers();
  fireEvent.pointerDown(screen.getByRole('button', { name: /Tahan untuk buka/ }));
  act(() => { vi.advanceTimersByTime(1300); });
  vi.useRealTimers();
};
const muatUlang = () => { cleanup(); tampilkan(); };

beforeEach(() => { localStorage.clear(); dikerjakan = []; });
afterEach(() => vi.useRealTimers());

it('L2: isian yang sudah diketik kembali setelah muat ulang', () => {
  tampilkan();
  pilih('Istri', '1/8');
  muatUlang();
  expect((screen.getByRole('combobox', { name: 'Bagian Istri' }) as HTMLSelectElement).value).toBe('1/8');
});

it('L3: sesudah periksa salah dan muat ulang, buka jawaban dihitung dikerjakan sekali tanpa XP', () => {
  tampilkan();
  for (const pilihan of screen.getAllByRole('combobox')) fireEvent.change(pilihan, { target: { value: 'Terhalang' } });
  periksa();
  muatUlang();
  expect(screen.queryByText(/Mulai salah/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
  bukaLewatDialog();
  expect(dikerjakan).toEqual([false]);
});

it('L4: jawab benar, muat ulang → pembahasan tetap terbuka, tidak dicatat ulang', () => {
  tampilkan();
  isiBenar(); periksa();
  expect(dikerjakan).toEqual([true]);
  const kejadian = bacaPercobaan().length;
  muatUlang();
  expect(screen.queryByRole('button', { name: 'Periksa' })).toBeNull();
  expect(screen.getByRole('region', { name: 'Kunci jawaban' })).toBeTruthy();
  expect(dikerjakan).toEqual([true]);
  expect(bacaPercobaan().length).toBe(kejadian);
});

it('L5: lihat jawaban tanpa mencoba, muat ulang → tetap terbuka, tidak dihitung dikerjakan', () => {
  tampilkan();
  fireEvent.click(screen.getByRole('button', { name: 'Lihat jawaban' }));
  bukaLewatDialog();
  muatUlang();
  expect(screen.queryByRole('button', { name: 'Lihat jawaban' })).toBeNull();
  expect(dikerjakan).toEqual([]);
});

it('L8: idSesi lain (soal dibuka dari daftar) mulai kosong', () => {
  tampilkan('sesi-1');
  pilih('Istri', '1/8');
  cleanup(); tampilkan('sesi-2');
  expect((screen.getByRole('combobox', { name: 'Bagian Istri' }) as HTMLSelectElement).value).toBe('');
});
