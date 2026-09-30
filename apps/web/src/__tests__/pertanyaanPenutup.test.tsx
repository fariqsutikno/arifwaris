import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { terapkanKeadaan } from '../keadaanOrang';
import { PertanyaanPenutup } from '../layar/keadaan/PertanyaanPenutup';

let terakhir: Kasus;
function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <PertanyaanPenutup kasus={kasus} idMayit={kasus.graf.idPewaris} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} />;
}
const denganAnak = () => { const k = kasusBaru('L'); return { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }; };

it('bawaan "Ya, masih hidup semua"; daftar keadaan tersembunyi', () => {
  render(<Uji awal={denganAnak()} />);
  expect(screen.getByRole('radio', { name: /masih hidup semua/ }).getAttribute('aria-checked')).toBe('true');
  expect(screen.queryByText(/Ketuk orangnya/)).toBeNull();
});

it('"Ada yang wafat" → ketuk orang → dialog → keadaan tampil di daftar', () => {
  render(<Uji awal={denganAnak()} />);
  fireEvent.click(screen.getByRole('radio', { name: /Ada yang sudah wafat atau hilang/ }));
  fireEvent.click(screen.getByRole('button', { name: /Anak laki-laki/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Hilang/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Belum ada/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  expect(Object.values(terakhir.graf.orang).some(o => o.statusHidup === 'mafqud')).toBe(true);
  expect(screen.getByText(/^hilang$/)).toBeTruthy();
});

it('kembali ke "Ya" dengan keluarga babak lain meminta konfirmasi yang menyebut namanya', () => {
  let kasus = denganAnak();
  const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
  kasus = terapkanKeadaan(kasus, anak, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, anak, 'ISTRI') };
  const istri = Object.keys(kasus.graf.orang).find(id => kasus.graf.orang[id]!.jenisKelamin === 'P')!;
  kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [istri]: { ...kasus.graf.orang[istri]!, nama: 'Dewi' } } } };
  render(<Uji awal={kasus} />);
  fireEvent.click(screen.getByRole('radio', { name: /masih hidup semua/ }));
  expect(screen.getByRole('alertdialog').textContent).toMatch(/Dewi/);
  fireEvent.click(screen.getByRole('button', { name: /Ya, hapus/ }));
  expect(terakhir.urutanWafat).toEqual([]);
  expect(terakhir.graf.orang[istri]).toBeUndefined();
});
