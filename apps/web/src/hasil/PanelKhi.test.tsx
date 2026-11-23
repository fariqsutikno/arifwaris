import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cariCatatanKhi } from '@waris/content';
import { PanelKhi } from './PanelKhi';

afterEach(cleanup);
const tampilkan = (saatTutup = vi.fn(), madzhab: 'syafii' | 'hanbali' = 'syafii') => {
  render(<PanelKhi daftar={[cariCatatanKhi('pengganti'), cariCatatanKhi('hartaBersama')]} madzhab={madzhab} saatTutup={saatTutup} />);
  return saatTutup;
};
const buka = (judul: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(judul) }));

describe('PanelKhi', () => {
  it('judul, penanda hukum positif, pengantar dengan madzhab, dan penutup tampil; kartu tertutup', () => {
    tampilkan();
    expect(screen.getByRole('dialog', { name: 'Kalau menurut KHI' })).toBeTruthy();
    expect(screen.getByText('Hukum positif, bukan fikih')).toBeTruthy();
    expect(screen.getByText(/madzhab Syafi'i di layar ini/)).toBeTruthy();
    expect(screen.getByText(/bukan fatwa/)).toBeTruthy();
    expect(screen.getAllByRole('button', { expanded: false }).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('Bunyi KHI')).toBeNull();
  });

  it('kartu dibuka: bagian berurutan, label pasal dan tingkat tampil', () => {
    tampilkan();
    expect(screen.getAllByText('Pasal 185 KHI').length).toBeGreaterThan(0);
    buka('Cucu menggantikan orang tuanya');
    const judul = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(judul).toEqual(['Bunyi KHI', 'Menurut praktik Pengadilan Agama', "Menurut fikih madzhab Syafi'i", 'Belum tersedia', 'Jika ingin selaras dengan fikih, yang dapat ditempuh', 'Perlu diperhatikan']);
  });

  it('harta bersama: peringatan di atas bunyi KHI', () => {
    tampilkan();
    buka('Harta bersama suami-istri');
    const judul = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(judul[0]).toBe('Perlu diperhatikan');
    expect(judul[1]).toBe('Bunyi KHI');
  });

  it('pilihan praktik Pengadilan Agama menyembunyikan bagian praktik', () => {
    tampilkan();
    buka('Cucu menggantikan orang tuanya');
    expect(screen.getByText('Menurut praktik Pengadilan Agama')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Tampilkan praktik Pengadilan Agama'));
    expect(screen.queryByText('Menurut praktik Pengadilan Agama')).toBeNull();
  });

  it('madzhab pilihan mengganti judul dan isi bagian fikih', () => {
    tampilkan(vi.fn(), 'hanbali');
    buka('Cucu menggantikan orang tuanya');
    expect(screen.getByText('Menurut fikih madzhab Hanbali')).toBeTruthy();
  });

  it('sumber tampil sebagai nama tanpa kode, dan bisa disembunyikan', () => {
    tampilkan();
    buka('Harta bersama suami-istri');
    fireEvent.click(screen.getByRole('button', { name: 'Lihat sumbernya' }));
    expect(screen.getByText(/Kompilasi Hukum Islam \(Inpres 1\/1991\), Pasal 85–97/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\b[SF]0\d\b|KHI-\d|R19-/);
    fireEvent.click(screen.getByRole('button', { name: 'Sembunyikan sumber' }));
    expect(screen.queryByText(/Kompilasi Hukum Islam \(Inpres/)).toBeNull();
  });

  it('Esc dan tautan Tutup menutup panel', () => {
    const saatTutup = tampilkan();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(saatTutup).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(saatTutup).toHaveBeenCalledTimes(2);
  });
});
