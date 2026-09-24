import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Tur } from '../tur/Tur';
import { sudahLihatTur } from '../preferensi';

const DAFTAR = [
  { sasaran: 'satu', judul: 'Satu', isi: 'Isi satu' },
  { sasaran: 'hilang', judul: 'Hilang', isi: 'Tidak ada elemennya' },
  { sasaran: 'dua', judul: 'Dua', isi: 'Isi dua' },
];

const Halaman = ({ saatSelesai }: { saatSelesai: () => void }) => (
  <>
    <div data-tur="satu">A</div>
    <div data-tur="dua">B</div>
    <Tur daftar={DAFTAR} kunci="uji" sedangBerjalan saatSelesai={saatSelesai} />
  </>
);

it('berjalan per langkah, melewati sasaran yang tidak ada, lalu menandai sudah dilihat', () => {
  const saatSelesai = vi.fn();
  render(<Halaman saatSelesai={saatSelesai} />);
  expect(screen.getByRole('dialog', { name: 'Tur singkat' }).textContent).toMatch(/Satu/);
  fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
  expect(screen.getByRole('dialog', { name: 'Tur singkat' }).textContent).toMatch(/Dua/);
  expect(screen.getByRole('dialog', { name: 'Tur singkat' }).textContent).toMatch(/2 \/ 2/);
  fireEvent.click(screen.getByRole('button', { name: 'Selesai' }));
  expect(saatSelesai).toHaveBeenCalledOnce();
  expect(sudahLihatTur('uji')).toBe(true);
});

it('Esc dan klik area gelap menutup tur', () => {
  const saatSelesai = vi.fn();
  const { unmount } = render(<Halaman saatSelesai={saatSelesai} />);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(saatSelesai).toHaveBeenCalledTimes(1);
  unmount();
  render(<Halaman saatSelesai={saatSelesai} />);
  fireEvent.click(document.querySelector('.tur-tirai')!);
  expect(saatSelesai).toHaveBeenCalledTimes(2);
});
