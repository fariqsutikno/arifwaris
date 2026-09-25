import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { PenyediaPenjaga, usePenjaga } from '../ui/Penjaga';

function Halaman({ aktif }: { aktif: boolean }) {
  usePenjaga(aktif, { berlaku: href => href !== '#/aman', judul: 'Keluar?', isi: <p>Pekerjaanmu belum selesai.</p>, labelTetap: 'Tetap', labelPergi: 'Keluar' });
  return <><a href="#/belajar">Belajar</a><a href="#/aman">Aman</a></>;
}

it('tautan yang dijaga meminta konfirmasi; Tetap membatalkan, Keluar melanjutkan', () => {
  window.location.hash = '';
  render(<PenyediaPenjaga><Halaman aktif /></PenyediaPenjaga>);
  fireEvent.click(screen.getByRole('link', { name: 'Belajar' }));
  expect(screen.getByRole('alertdialog').textContent).toMatch(/belum selesai/);
  fireEvent.click(screen.getByRole('button', { name: 'Tetap' }));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(window.location.hash).toBe('');
  fireEvent.click(screen.getByRole('link', { name: 'Belajar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));
  expect(window.location.hash).toBe('#/belajar');
});

it('tautan yang tidak dijaga dan penjaga nonaktif tidak bertanya', () => {
  render(<PenyediaPenjaga><Halaman aktif={false} /></PenyediaPenjaga>);
  fireEvent.click(screen.getByRole('link', { name: 'Belajar' }));
  expect(screen.queryByRole('alertdialog')).toBeNull();
});

it('tombol tahan bisa dipakai dengan keyboard: tahan Spasi sampai penuh', async () => {
  const { act } = await import('@testing-library/react');
  const { vi } = await import('vitest');
  const { TombolTahan } = await import('../ui/Dialog');
  let selesai = 0;
  vi.useFakeTimers();
  render(<TombolTahan label="Tahan untuk buka" saatSelesai={() => { selesai++; }} />);
  const tombol = screen.getByRole('button', { name: 'Tahan untuk buka' });
  fireEvent.keyDown(tombol, { key: ' ' });
  act(() => { vi.advanceTimersByTime(1300); });
  vi.useRealTimers();
  expect(selesai).toBe(1);
});
