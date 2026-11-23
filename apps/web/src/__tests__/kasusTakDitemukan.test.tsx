// URL kasus yang entrinya tidak ada: pesan umum di Awal Hitung, tanpa id dari URL (P8, P16, P17).
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { Aplikasi } from '../Aplikasi';

const PESAN = /Kasus ini tidak ada lagi di perangkat ini/;
beforeEach(() => localStorage.clear());

it('id yang tidak ada → Awal Hitung dengan pesan umum; id dari URL tidak tampil; URL dirapikan', () => {
  window.location.hash = '#/hitung/rahasia-abc123';
  const { container } = render(<Aplikasi />);
  expect(screen.getByText(PESAN)).toBeTruthy();
  expect(screen.getByRole('button', { name: /Mulai dari nol/ })).toBeTruthy();
  expect(container.textContent).not.toMatch(/rahasia-abc123/);
  expect(window.location.hash).toBe('#/hitung');
});

it('hash rusak (%E0) tidak membuat aplikasi macet dan memberi pesan yang sama', () => {
  window.location.hash = '#/hitung/%E0';
  render(<Aplikasi />);
  expect(screen.getByText(PESAN)).toBeTruthy();
});

it('#/hitung tanpa id tidak menampilkan pesan', () => {
  window.location.hash = '#/hitung';
  render(<Aplikasi />);
  expect(screen.queryByText(PESAN)).toBeNull();
});
