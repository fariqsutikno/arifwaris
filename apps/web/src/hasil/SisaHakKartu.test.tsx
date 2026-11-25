import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { hitung, hitungTirkah, KONFIGURASI_BAWAAN, type InputEngine } from '@waris/engine';
import { afterEach, describe, expect, it } from 'vitest';
import { SisaHakKartu } from './SisaHakKartu';

afterEach(cleanup);

// Bab 11.1: suami, ibu, ayah; tirkah Rp 120 jt → suami 60, ibu 20, ayah 40 jt.
const masukan: InputEngine = {
  graf: {
    idPewaris: 'D',
    orang: {
      D: { id: 'D', jenisKelamin: 'P', statusHidup: 'wafat', agama: 'islam', idAyah: 'F1', idIbu: 'M1' },
      H1: { id: 'H1', jenisKelamin: 'L', statusHidup: 'hidup', agama: 'islam' },
      F1: { id: 'F1', jenisKelamin: 'L', statusHidup: 'hidup', agama: 'islam' },
      M1: { id: 'M1', jenisKelamin: 'P', statusHidup: 'hidup', agama: 'islam' },
    },
    pernikahan: [{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }],
  },
  tirkah: { kotor: 120_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n },
  pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji',
};
const hasil = hitung(masukan);
const penerima = [{ id: 'H1', nama: 'Suami' }, { id: 'M1', nama: 'Ibu' }, { id: 'F1', nama: 'Ayah' }];

const tampilkan = () => {
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  render(<SisaHakKartu hasil={hasil} bersih={hitungTirkah(masukan.tirkah).bersih} penerima={penerima} />);
  fireEvent.click(screen.getByRole('button', { name: /Sudah ada yang menerima sebagian/ }));
};
const isi = (nama: string, nilai: string) => fireEvent.change(screen.getByLabelText(nama), { target: { value: nilai } });

describe('SisaHakKartu', () => {
  it('tertutup sampai tautan diketuk; tanpa isian = bagian apa adanya', () => {
    if (hasil.status !== 'OK') throw new Error(hasil.status);
    render(<SisaHakKartu hasil={hasil} bersih={120_000_000n} penerima={penerima} />);
    expect(screen.queryByRole('table')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Sudah ada yang menerima sebagian/ }));
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByText(/Harta yang masih ada untuk dibagi: Rp 120\.000\.000/)).toBeTruthy();
  });

  it('suami sudah menerima 30 jt → masih diterima 30 jt, sisa kas 90 jt (contoh bab 11.3)', () => {
    tampilkan();
    isi('Suami', '30000000');
    const barisSuami = screen.getByRole('row', { name: /Suami/ });
    expect(barisSuami.textContent).toContain('Rp 60.000.000');
    expect(barisSuami.textContent).toContain('Rp 30.000.000');
    expect(screen.getByText(/Harta yang masih ada untuk dibagi: Rp 90\.000\.000/)).toBeTruthy();
  });

  it('kelebihan ditampilkan dengan catatan netral, tanpa saran pengembalian', () => {
    tampilkan();
    isi('Ayah', '70000000');
    expect(screen.getByText('Kelebihan Rp 30.000.000')).toBeTruthy();
    expect(screen.getByText(/Ayah menerima lebih dari bagiannya/)).toBeTruthy();
    expect(screen.getByText(/tidak cukup untuk semua sisa bagian/)).toBeTruthy();
  });

  it('jumlah melebihi tirkah → pesan galat, tabel hilang', () => {
    tampilkan();
    isi('Suami', '100000000');
    isi('Ibu', '30000000');
    expect(screen.getByRole('alert').textContent).toMatch(/melebihi tirkah/);
    expect(screen.queryByRole('table')).toBeNull();
  });
});
