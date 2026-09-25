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
