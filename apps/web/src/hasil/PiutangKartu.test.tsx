import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { hitung, KONFIGURASI_BAWAAN, type InputEngine } from '@waris/engine';
import { afterEach, describe, expect, it } from 'vitest';
import { PiutangKartu } from './PiutangKartu';

afterEach(cleanup);

// Bab 11.4: empat anak laki-laki, tirkah bersih 20 (barang 12 + piutang 8), masing-masing 5.
const anak = (id: string) => ({ id, jenisKelamin: 'L' as const, statusHidup: 'hidup' as const, agama: 'islam' as const, idAyah: 'D' });
const masukan = (ruleset: InputEngine['ruleset']): InputEngine => ({
  graf: {
    idPewaris: 'D',
    orang: { D: { id: 'D', jenisKelamin: 'L', statusHidup: 'wafat', agama: 'islam' }, A1: anak('A1'), A2: anak('A2'), A3: anak('A3'), A4: anak('A4') },
    pernikahan: [],
  },
  tirkah: { kotor: 20n, tajhiz: 0n, hutang: 0n, wasiat: 0n },
  pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset, versiKb: 'uji',
});
const penerima = ['A1', 'A2', 'A3', 'A4'].map((id, indeks) => ({ id, nama: `Anak ${indeks + 1}` }));

const tampilkan = (ruleset: InputEngine['ruleset'] = 'syafii') => {
  const hasil = hitung(masukan(ruleset));
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  render(<PiutangKartu hasil={hasil} bersih={20n} penerima={penerima} />);
  fireEvent.click(screen.getByRole('button', { name: /Ada ahli waris yang punya hutang/ }));
};
const hutang = (nama: string, nilai: string) => fireEvent.change(screen.getByLabelText(`Hutang ${nama} ke almarhum`), { target: { value: nilai } });
const pilih = (teks: RegExp) => fireEvent.click(screen.getByRole('radio', { name: teks }));

describe('PiutangKartu', () => {
  it('tertutup sampai tautan diketuk; tanpa isian tidak ada hasil', () => {
    render(<PiutangKartu hasil={hitung(masukan('syafii')) as never} bersih={20n} penerima={penerima} />);
    expect(screen.queryByLabelText('Hutang Anak 1 ke almarhum')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Ada ahli waris yang punya hutang/ }));
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('hutang diisi tanpa jawaban setuju → pertanyaan, belum ada tabel', () => {
    tampilkan();
    hutang('Anak 1', '8');
    expect(screen.getByRole('alert').textContent).toContain('Anak 1: pilih dulu apakah setuju');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('S < H (contoh KB: S=5, H=8): membayar 3, tanpa kode rujukan', () => {
    tampilkan();
    hutang('Anak 1', '8');
    pilih(/Setuju dipotong/);
    expect(screen.getByText(/masih harus membayar Rp 3/)).toBeTruthy();
    expect(screen.getByRole('row', { name: /Anak 1/ }).textContent).toContain('Rp 3');
    expect(document.body.textContent).not.toMatch(/R11-/);
  });

  it('S = H dan S > H', () => {
    tampilkan();
    hutang('Anak 1', '5');
    pilih(/Menolak mengakui/);
    expect(screen.getByText(/sama dengan hutangnya/)).toBeTruthy();
    hutang('Anak 1', '2');
    expect(screen.getByText(/lebih besar dari hutangnya/)).toBeTruthy();
    expect(screen.getByText(/sisanya Rp 3 diambil dari barang/)).toBeTruthy();
  });

  it('mengakui, mampu, tetapi tidak setuju → penjelasan "harus saling rela"', () => {
    tampilkan();
    hutang('Anak 1', '8');
    pilih(/Mengakui dan mampu/);
    expect(screen.getByRole('alert').textContent).toContain('saling rela');
  });

  it('non-Syafi\'i → penjelasan tidak didukung', () => {
    tampilkan('hanbali');
    hutang('Anak 1', '8');
    pilih(/Setuju dipotong/);
    expect(screen.getByRole('alert').textContent).toContain('Syafi');
  });

  it('hutang melebihi harta → galat', () => {
    tampilkan();
    hutang('Anak 1', '21');
    expect(screen.getByRole('alert').textContent).toContain('melebihi harta');
  });
});
