import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { hitung, KONFIGURASI_BAWAAN } from '@waris/engine';
import { cariIstilah } from '@waris/content';
import { Aplikasi } from '../Aplikasi';

it('aplikasi tampil dan paket workspace bisa diimpor', () => {
  render(<Aplikasi />);
  expect(screen.getByText('Arif Waris')).toBeTruthy();
  expect(typeof hitung).toBe('function');
  expect(KONFIGURASI_BAWAAN.kebijakanSisa).toBe('radd');
  expect(cariIstilah('ashabah')).toBeDefined();
});
