import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BarBawah } from '../layar/wizard/BarBawah';

const aksiTombol = (saatKlik = () => undefined) => ({ label: 'Lanjut: Harta', saatKlik, sebagai: 'tombol' as const });

describe('BarBawah (spec kanvas 5.9, aturan 4)', () => {
  it('tombol utama tidak pernah nonaktif', () => {
    render(<BarBawah saatKembali={() => undefined} status="Pilih dulu." aksi={aksiTombol()} />);
    expect(screen.getByRole('button', { name: 'Lanjut: Harta' }).hasAttribute('disabled')).toBe(false);
  });

  it('status berada di role=status dan selalu ada, juga saat kosong', () => {
    const { rerender } = render(<BarBawah saatKembali={() => undefined} status={null} aksi={aksiTombol()} />);
    expect(screen.getByRole('status').textContent).toBe('');
    rerender(<BarBawah saatKembali={() => undefined} status="Keluarga: 2 bagian lagi." aksi={aksiTombol()} />);
    expect(screen.getByRole('status').textContent).toBe('Keluarga: 2 bagian lagi.');
  });

  it('aksi tautan dirender sebagai teks, bukan tombol berbingkai', () => {
    const saatKlik = vi.fn();
    render(<BarBawah saatKembali={() => undefined} status={null} aksi={{ label: 'Ke Periksa ›', saatKlik, sebagai: 'tautan' }} />);
    const aksi = screen.getByRole('button', { name: 'Ke Periksa ›' });
    expect(aksi.className).toContain('tautan-teks');
    expect(aksi.className).not.toContain('aw-btn');
    fireEvent.click(aksi);
    expect(saatKlik).toHaveBeenCalledTimes(1);
  });

  it('Kembali memanggil saatKembali dan juga berupa tautan', () => {
    const saatKembali = vi.fn();
    render(<BarBawah saatKembali={saatKembali} status={null} aksi={aksiTombol()} />);
    const kembali = screen.getByRole('button', { name: 'Kembali' });
    expect(kembali.className).not.toContain('aw-btn');
    fireEvent.click(kembali);
    expect(saatKembali).toHaveBeenCalledTimes(1);
  });
});
