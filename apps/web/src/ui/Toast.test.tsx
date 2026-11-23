import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Toast } from './Toast';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });
const jalan = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

it('toast tanpa aksi hilang sesudah 4 detik', () => {
  const saatHilang = vi.fn();
  render(<Toast isi={{ teks: 'Disalin' }} saatHilang={saatHilang} />);
  jalan(3900); expect(saatHilang).not.toHaveBeenCalled();
  jalan(200); expect(saatHilang).toHaveBeenCalledTimes(1);
});

it('toast beraksi bertahan ≥ 10 detik', () => {
  const saatHilang = vi.fn();
  render(<Toast isi={{ teks: 'Kasus dihapus', aksi: { label: 'Urungkan', saat: vi.fn() } }} saatHilang={saatHilang} />);
  jalan(9900); expect(saatHilang).not.toHaveBeenCalled();
  jalan(200); expect(saatHilang).toHaveBeenCalledTimes(1);
});

it('toast beraksi tidak hilang selagi kursor di atasnya; hitung ulang saat kursor pergi', () => {
  const saatHilang = vi.fn();
  render(<Toast isi={{ teks: 'Kasus dihapus', aksi: { label: 'Urungkan', saat: vi.fn() } }} saatHilang={saatHilang} />);
  const toast = screen.getByRole('status');
  fireEvent.mouseEnter(toast);
  jalan(60000); expect(saatHilang).not.toHaveBeenCalled();
  fireEvent.mouseLeave(toast);
  jalan(10100); expect(saatHilang).toHaveBeenCalledTimes(1);
});

it('toast beraksi tidak hilang selagi fokus ada di dalamnya', () => {
  const saatHilang = vi.fn();
  render(<Toast isi={{ teks: 'Kasus dihapus', aksi: { label: 'Urungkan', saat: vi.fn() } }} saatHilang={saatHilang} />);
  fireEvent.focus(screen.getByRole('button', { name: 'Urungkan' }));
  jalan(60000); expect(saatHilang).not.toHaveBeenCalled();
  fireEvent.blur(screen.getByRole('button', { name: 'Urungkan' }));
  jalan(10100); expect(saatHilang).toHaveBeenCalledTimes(1);
});
