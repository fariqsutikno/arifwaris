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
const bukaKerabatLain = () => fireEvent.click(screen.getByRole('button', { name: /Kerabat lain/ }));

it('keluarga inti selalu tampil; kerabat lain terlipat dulu', () => {
  render(<Uji />);
  for (const nama of ['Istri', 'Anak laki-laki', 'Anak perempuan', 'Ayah', 'Ibu']) expect(screen.getByRole('button', { name: `Tambah ${nama}` })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Tambah Suami' })).toBeNull();
  expect(screen.queryByRole('button', { name: /Tambah Paman/ })).toBeNull();
});

it('− dan + mengubah jumlah; tombol nonaktif di batas', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  expect(screen.getByRole('group', { name: 'Anak laki-laki' }).textContent).toMatch(/2/);
  fireEvent.click(screen.getByRole('button', { name: 'Kurangi Anak laki-laki' }));
  expect(hitungIsian(grafTerakhir, 'PEWARIS').ANAK_LK).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Kurangi Ayah' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Ayah' }));
  expect(screen.getByRole('button', { name: 'Tambah Ayah' }).hasAttribute('disabled')).toBe(true);
});

it('kakak/adik langsung berupa baris − +, bisa dikurangi lagi', () => {
  render(<Uji />);
  bukaKerabatLain();
  const grup = screen.getByRole('region', { name: 'Kakak/adik almarhum' });
  fireEvent.click(within(grup).getByRole('button', { name: 'Tambah Kakak/adik perempuan satu ayah' }));
  expect(hitungIsian(grafTerakhir, 'PEWARIS').SAUDARI_SEBAPAK).toHaveLength(1);
  fireEvent.click(within(grup).getByRole('button', { name: 'Kurangi Kakak/adik perempuan satu ayah' }));
  expect(hitungIsian(grafTerakhir, 'PEWARIS').SAUDARI_SEBAPAK ?? []).toHaveLength(0);
});

it('kerabat lain selalu terbuka bila sudah ada isinya', () => {
  render(<Uji />);
  bukaKerabatLain();
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Kakek (dari ayah)' }));
  const tombol = screen.getByRole('button', { name: /Kerabat lain/ });
  expect(tombol.hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('button', { name: 'Tambah Kakek (dari ayah)' })).toBeTruthy();
});

it('keterangan hubungan hanya tampil bila label belum cukup jelas', () => {
  render(<Uji />);
  bukaKerabatLain();
  expect(within(screen.getByRole('group', { name: 'Kakek (dari ayah)' })).getByText('ayahnya ayah almarhum')).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Ayah' }).querySelector('small')).toBeNull();
});

it('almarhum perempuan disebut almarhumah', () => {
  render(<Uji jenisKelamin="P" />);
  bukaKerabatLain();
  expect(screen.getByRole('region', { name: 'Kakak/adik almarhumah' })).toBeTruthy();
  expect(within(screen.getByRole('group', { name: 'Nenek (dari ibu)' })).getByText('ibunya ibu almarhumah')).toBeTruthy();
});

it('urutan kerabat lain: kakek-nenek, cucu, kakak/adik, paman, keponakan', () => {
  render(<Uji />);
  bukaKerabatLain();
  const judul = [...document.querySelectorAll('h3')].map(h => h.textContent);
  expect(judul).toEqual(['Keluarga inti', 'Kakek & nenek', 'Cucu', 'Kakak/adik almarhum', 'Paman & sepupu dari pihak ayah', 'Keponakan']);
});

it('cucu dengan dua anak laki-laki: pilih dari siapa', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  bukaKerabatLain();
  const pilih = screen.getByRole('combobox', { name: 'Cucu laki-laki dari siapa?' }) as HTMLSelectElement;
  fireEvent.change(pilih, { target: { value: pilih.options[1]!.value } });
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Cucu laki-laki' }));
  const [cucu] = hitungIsian(grafTerakhir, 'PEWARIS').CUCU_LK!;
  expect(grafTerakhir.orang[cucu!]!.idAyah).toBe(pilih.options[1]!.value);
});

it('dzawil arham tidak ditawarkan, tapi dijelaskan kenapa tidak ada', () => {
  render(<Uji />);
  bukaKerabatLain();
  expect(screen.queryByRole('button', { name: /Tambah .*ibunya ibu/ })).toBeNull();
  expect(screen.getByText(/Kok kakek dari ibu/)).toBeTruthy();
});

it('cucu bisa dari anak laki-laki lain yang sudah wafat', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  bukaKerabatLain();
  fireEvent.change(screen.getByRole('combobox', { name: 'Cucu laki-laki dari siapa?' }), { target: { value: 'INDUK_BARU_WAFAT' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Cucu laki-laki' }));
  const [cucu] = hitungIsian(grafTerakhir, 'PEWARIS').CUCU_LK!;
  const ayahCucu = grafTerakhir.orang[grafTerakhir.orang[cucu!]!.idAyah!]!;
  expect(ayahCucu.penghubung).toBe(true);
  expect(hitungIsian(grafTerakhir, 'PEWARIS').ANAK_LK).toHaveLength(1);
});

it('nama bisa diisi lewat ikon pensil dan dipakai di pilihan induk', () => {
  render(<Uji />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('button', { name: 'Beri nama Anak laki-laki' }));
  const isian = screen.getByRole('textbox', { name: 'Nama Anak laki-laki' });
  fireEvent.change(isian, { target: { value: 'Ahmad' } });
  fireEvent.blur(isian);
  bukaKerabatLain();
  expect(within(screen.getByRole('combobox', { name: 'Cucu laki-laki dari siapa?' })).getByText('dari Ahmad')).toBeTruthy();
});
