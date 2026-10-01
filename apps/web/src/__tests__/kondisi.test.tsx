import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { LangkahKondisi } from '../layar/LangkahKondisi';

let terakhir: Kasus;
function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <LangkahKondisi kasus={kasus} ubah={ubah => setKasus(ubah)} />;
}
const denganAnak = () => { const k = kasusBaru('L'); return { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }; };

it('bawaan "Tidak ada", kartu kondisi belum tampil', () => {
  render(<Uji awal={denganAnak()} />);
  expect(screen.getByRole('radio', { name: /Tidak ada/ }).getAttribute('aria-checked')).toBe('true');
  expect(screen.queryByLabelText(/Beda agama dengan almarhum/)).toBeNull();
});

it('memilih "Ada" menampilkan dua kondisi dengan akibatnya (munasakhat disembunyikan)', () => {
  render(<Uji awal={denganAnak()} />);
  fireEvent.click(screen.getByRole('radio', { name: /^Ada/ }));
  expect(screen.getByLabelText(/Beda agama dengan almarhum/)).toBeTruthy();
  expect(screen.getByLabelText(/Ikut menyebabkan kematian/)).toBeTruthy();
  expect(screen.getAllByText(/Akibatnya:/).length).toBe(2);
});

it('kembali ke "Tidak ada" menghapus kondisi yang sempat diisi', () => {
  render(<Uji awal={denganAnak()} />);
  fireEvent.click(screen.getByRole('radio', { name: /^Ada/ }));
  fireEvent.click(screen.getByLabelText(/Beda agama dengan almarhum/));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Anak laki-laki' }));
  expect(terakhir.graf.orang[Object.keys(terakhir.graf.orang).find(id => terakhir.graf.orang[id]!.agama === 'nonIslam')!]).toBeTruthy();
  fireEvent.click(screen.getByRole('radio', { name: /Tidak ada/ }));
  expect(Object.values(terakhir.graf.orang).some(orang => orang.agama === 'nonIslam')).toBe(false);
});

it('kasus yang sudah punya kondisi langsung terbuka di "Ada"', () => {
  const kasus = denganAnak();
  const idAnak = Object.keys(kasus.graf.orang).find(id => id !== 'PEWARIS')!;
  render(<Uji awal={{ ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [idAnak]: { ...kasus.graf.orang[idAnak]!, agama: 'nonIslam' } } } }} />);
  expect(screen.getByRole('radio', { name: /^Ada/ }).getAttribute('aria-checked')).toBe('true');
});

it('memilih "Tidak ada" tidak menyentuh urutan wafat (munasakhat bukan urusan langkah 5)', () => {
  const kasus = denganAnak();
  const idAnak = Object.keys(kasus.graf.orang).find(id => id !== 'PEWARIS')!;
  render(<Uji awal={{ ...kasus, urutanWafat: [idAnak] }} />);
  fireEvent.click(screen.getByRole('radio', { name: /Tidak ada/ }));
  expect(terakhir.urutanWafat).toEqual([idAnak]);
});
