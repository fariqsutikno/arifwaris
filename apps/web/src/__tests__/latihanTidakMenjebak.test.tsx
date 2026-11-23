import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { Aplikasi } from '../Aplikasi';

beforeEach(() => { localStorage.clear(); localStorage.setItem('arif-waris:tur:wizard', '1'); window.location.hash = '#/latihan/hitung'; });

it('mengerjakan soal lalu kembali ke Lab Hitung: soal tidak ditawarkan lagi lewat Lanjutkan', () => {
  render(<Aplikasi />);
  const panel = within(screen.getByRole('region', { name: 'Soal acak' }));
  fireEvent.click(panel.getByRole('button', { name: 'Acak soal' }));
  fireEvent.click(panel.getByRole('button', { name: 'Kerjakan' }));
  // Soal sudah tampil sebagai kasus di kalkulator, tapi tidak tersimpan sebagai kasus terakhir.
  expect(Object.keys(localStorage).filter(kunci => /kasus/.test(kunci) && !/riwayat/.test(kunci))).toEqual([]);
  expect(localStorage.getItem('arif-waris:tujuan')).toBeNull();
});
