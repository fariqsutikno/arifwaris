import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { hitungPosisi, InfoTip, Istilah } from '../ui/Tooltip';

it('posisi tooltip tetap di dalam layar: tidak keluar di kanan, pindah ke atas bila bawah penuh', () => {
  const layar = { lebar: 400, tinggi: 800 };
  const diKanan = hitungPosisi({ left: 380, right: 395, top: 100, bottom: 120 }, { lebar: 240, tinggi: 80 }, layar);
  expect(diKanan.left + 240).toBeLessThanOrEqual(400 - 8);
  const diBawah = hitungPosisi({ left: 20, right: 60, top: 760, bottom: 780 }, { lebar: 240, tinggi: 80 }, layar);
  expect(diBawah.top).toBeLessThan(760);
  expect(diBawah.left).toBeGreaterThanOrEqual(8);
});

it('ikon info menampilkan penjelasan saat difokus dan menyembunyikannya lagi', () => {
  render(<InfoTip label="Tentang wasiat">Maksimal 1/3 dari sisa harta.</InfoTip>);
  const tombol = screen.getByRole('button', { name: 'Tentang wasiat' });
  fireEvent.focus(tombol);
  expect(screen.getByRole('tooltip').textContent).toMatch(/Maksimal 1\/3/);
  fireEvent.blur(tombol);
  expect(screen.queryByRole('tooltip')).toBeNull();
});

it('istilah mengambil arti dari glosarium', () => {
  render(<Istilah id="tashih">tashih</Istilah>);
  fireEvent.focus(screen.getByText('tashih'));
  expect(screen.getByRole('tooltip').textContent).toMatch(/pembagi/);
});
