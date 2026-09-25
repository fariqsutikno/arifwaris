import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import type { GrafKeluarga } from '@waris/engine';
import { hitungIsian } from '../checklist';
import { kasusBaru } from '../kasus';
import { LangkahAhliWaris } from '../layar/LangkahAhliWaris';

let grafTerakhir: GrafKeluarga;
function Uji({ jenisKelamin = 'L' as 'L' | 'P' }) {
  const [graf, setGraf] = useState(kasusBaru(jenisKelamin).graf);
  grafTerakhir = graf;
  return <LangkahAhliWaris graf={graf} idMayit="PEWARIS" ubahGraf={ubah => setGraf(ubah)} />;
}
const daftar = () => screen.getByRole('list', { name: 'Ahli waris yang sudah ditambahkan' });

it('mulai kosong dengan tambah cepat untuk kerabat paling umum', () => {
  render(<Uji />);
  expect(screen.getByText(/Belum ada/)).toBeTruthy();
  for (const nama of ['Istri', 'Anak laki-laki', 'Anak perempuan', 'Ayah', 'Ibu']) expect(screen.getByRole('button', { name: `Tambah ${nama}` })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Tambah Suami' })).toBeNull();
  expect(screen.queryByRole('button', { name: /Tambah Paman/ })).toBeNull();   // kerabat jauh tersembunyi dulu
});

it('orang yang ditambah tampil bernomor dan bisa dihapus satu per satu', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  expect(within(daftar()).getByText('Anak laki-laki 1')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Hapus Anak laki-laki 1' }));
  expect(hitungIsian(grafTerakhir, 'PEWARIS').ANAK_LK).toHaveLength(1);
});

it('tombol nonaktif bila sudah mencapai batas (ayah satu)', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Ayah' }));
  expect(screen.getByRole('button', { name: 'Tambah Ayah' }).hasAttribute('disabled')).toBe(true);
});

it('kakak/adik ditanya bertahap: jenis kelamin lalu hubungan orang tua', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: /Tambah kerabat lain/ }));
  const grup = screen.getByRole('group', { name: 'Kakak/adik almarhum' });
  fireEvent.click(within(grup).getByRole('radio', { name: 'Perempuan' }));
  fireEvent.click(within(grup).getByRole('radio', { name: /Satu ayah saja/ }));
  fireEvent.click(within(grup).getByRole('button', { name: /Tambah kakak\/adik/ }));
  expect(hitungIsian(grafTerakhir, 'PEWARIS').SAUDARI_SEBAPAK).toHaveLength(1);
  expect(within(daftar()).getByText(/Kakak\/adik perempuan satu ayah/)).toBeTruthy();
});

it('istilah fikih tetap tampil kecil di bawah label sehari-hari', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: /Tambah kerabat lain/ }));
  const grup = screen.getByRole('group', { name: 'Kakak/adik almarhum' });
  fireEvent.click(within(grup).getByRole('radio', { name: 'Laki-laki' }));
  fireEvent.click(within(grup).getByRole('radio', { name: /Satu ibu saja/ }));
  fireEvent.click(within(grup).getByRole('button', { name: /Tambah kakak\/adik/ }));
  expect(within(daftar()).getByText('Saudara lk seibu')).toBeTruthy();
});

it('yang sudah ditambahkan bisa dilihat sebagai pohon keluarga', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Pohon keluarga' }));
  const pohon = screen.getByRole('region', { name: 'Pohon keluarga' });
  expect(within(pohon).getByText('Anak laki-laki')).toBeTruthy();
  expect(within(pohon).getByText('Pewaris')).toBeTruthy();
});

it('label kerabat jauh menyebut hubungannya dengan pewaris', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: /Tambah kerabat lain/ }));
  expect(screen.getByRole('button', { name: 'Tambah Kakek (ayahnya ayah pewaris)' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Tambah Nenek (ibunya ibu pewaris)' })).toBeTruthy();
});

it('paman & sepupu ditanya bertahap dengan bahasa sederhana', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: /Tambah kerabat lain/ }));
  const grup = screen.getByRole('group', { name: 'Paman & sepupu dari pihak ayah' });
  fireEvent.click(within(grup).getByRole('radio', { name: 'Sepupu laki-laki' }));
  fireEvent.click(within(grup).getByRole('radio', { name: /satu ayah saja/ }));
  fireEvent.click(within(grup).getByRole('button', { name: /Tambah sepupu/ }));
  expect(hitungIsian(grafTerakhir, 'PEWARIS').SEPUPU_SEBAPAK).toHaveLength(1);
});

it('kerabat yang bukan ahli waris bisa ditambahkan dan ditandai dzawil arham', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: /Tambah kerabat lain/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Kakek dari pihak ibu (ayahnya ibu pewaris)' }));
  const terisi = screen.getByRole('list', { name: 'Kerabat lain yang sudah ditambahkan' });
  expect(within(terisi).getByText(/Kakek dari pihak ibu/)).toBeTruthy();
  expect(within(terisi).getByText(/dzawil arham/i)).toBeTruthy();
});

it('urutan kerabat lain: kakek-nenek, cucu, kakak/adik, paman, keponakan', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: /Tambah kerabat lain/ }));
  const judul = [...document.querySelectorAll('.kerabat-lain legend')].map(legend => legend.textContent);
  expect(judul.slice(0, 5)).toEqual(['Kakek & nenek', 'Cucu', 'Kakak/adik almarhum', 'Paman & sepupu dari pihak ayah', 'Keponakan']);
});

it('tambah cepat pakai tombol kurang dan tambah dengan jumlah di tengah', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('button', { name: 'Kurangi Anak laki-laki' }));
  expect(hitungIsian(grafTerakhir, 'PEWARIS').ANAK_LK).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Kurangi Ayah' }).hasAttribute('disabled')).toBe(true);
});

it('di tampilan pohon, tiap orang bisa dihapus dengan tanda silang', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Pohon keluarga' }));
  fireEvent.click(within(screen.getByRole('region', { name: 'Pohon keluarga' })).getByRole('button', { name: 'Hapus Anak laki-laki' }));
  expect(hitungIsian(grafTerakhir, 'PEWARIS').ANAK_LK ?? []).toHaveLength(0);
});

it('tambah cepat menunjukkan jumlah yang sudah ditambahkan', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  expect(screen.getByRole('group', { name: 'Anak laki-laki' }).textContent).toMatch(/2/);
});
