import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { PilihanMenunggu } from '../layar/PeriksaCerita';

it('pilihan menunggu kelahiran disimpan lalu lanjut ke hasil', () => {
  const kirim = vi.fn();
  render(<PilihanMenunggu kirim={kirim} />);
  expect(screen.getByText(/Mau menunggu dulu/)).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: /Tunggu lahir dulu/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  const ubah = kirim.mock.calls.find(([a]) => a.jenis === 'UBAH_KASUS')![0].ubah;
  expect(ubah({} as never).pilihanJanin).toBe('tunggu');
  expect(kirim).toHaveBeenCalledWith({ jenis: 'KE_LAYAR', layar: 'hasil' });
});
