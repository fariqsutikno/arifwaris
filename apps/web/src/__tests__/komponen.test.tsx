import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { KartuAhliWaris, LangkahHitung } from '../ui/komponen';

it('KartuAhliWaris: tombol tambah/kurang terhubung', () => {
  const saatTambah = vi.fn();
  render(<KartuAhliWaris nama="Istri" kelompok="pasangan" jumlah={1} saatTambah={saatTambah} saatKurang={() => {}} />);
  fireEvent.click(screen.getByLabelText('Tambah Istri'));
  expect(saatTambah).toHaveBeenCalledOnce();
});

it('KartuAhliWaris mahjub: label kehalang, tanpa penghitung', () => {
  render(<KartuAhliWaris nama="Saudara lk kandung" kelompok="saudara" adalahMahjub catatan="Kehalang oleh anak lk" />);
  expect(screen.getByText('Kehalang (mahjub)')).toBeTruthy();
  expect(screen.queryByLabelText('Tambah Saudara lk kandung')).toBeNull();
});

it('LangkahHitung menampilkan kotak Kenapa', () => {
  render(<LangkahHitung nomor={1} judul="Siapa kehalang?" kenapa={<span>QS An-Nisa 11</span>}>isi</LangkahHitung>);
  expect(screen.getByText('Kenapa?')).toBeTruthy();
});
