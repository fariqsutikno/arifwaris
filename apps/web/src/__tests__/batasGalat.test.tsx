import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { BatasGalat } from '../ui/BatasGalat';

const Rusak = () => { throw new Error('rusak'); };

it('galat render menampilkan pesan dan tombol muat ulang, bukan layar kosong', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(<BatasGalat><Rusak /></BatasGalat>);
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Muat ulang' })).toBeTruthy();
});
