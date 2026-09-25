import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { kasusBaru, type Kasus } from '../kasus';
import { LangkahAhliWaris } from '../layar/LangkahAhliWaris';
import { LangkahKondisi } from '../layar/LangkahKondisi';

function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  return (
    <>
      <LangkahAhliWaris graf={kasus.graf} idMayit="PEWARIS" ubahGraf={ubah => setKasus(k => ({ ...k, graf: ubah(k.graf) }))} />
      <LangkahKondisi kasus={kasus} ubah={ubah => setKasus(ubah)} />
      <output data-testid="urutan">{kasus.urutanWafat.join(',')}</output>
    </>
  );
}

it('pewaris laki-laki: ada kartu istri, tidak ada kartu suami', () => {
  render(<Uji awal={kasusBaru('L')} />);
  expect(screen.getByLabelText('Tambah Istri')).toBeTruthy();
  expect(screen.queryByLabelText('Tambah Suami')).toBeNull();
});

it('tambah anak lk lalu tandai wafat sebelum pembagian', () => {
  render(<Uji awal={kasusBaru('L')} />);
  fireEvent.click(screen.getByLabelText('Tambah Anak laki-laki'));
  fireEvent.click(screen.getByRole('radio', { name: /^Ada/ }));
  fireEvent.click(screen.getByLabelText(/wafat sebelum harta dibagi/));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Anak laki-laki' }));
  expect(screen.getByTestId('urutan').textContent).not.toBe('');
  expect(screen.getByText(/Ahli waris Anak laki-laki/)).toBeTruthy();
});

it('kondisi beda agama juga menawarkan ahli waris mayit munasakhat', () => {
  render(<Uji awal={kasusBaru('L')} />);
  fireEvent.click(screen.getByLabelText('Tambah Anak laki-laki'));
  fireEvent.click(screen.getByRole('radio', { name: /^Ada/ }));
  fireEvent.click(screen.getByLabelText(/wafat sebelum harta dibagi/));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Anak laki-laki' }));
  fireEvent.click(screen.getAllByLabelText('Tambah Istri')[1]!);
  fireEvent.click(screen.getByLabelText(/beda agama/));
  expect(screen.getAllByRole('checkbox', { name: /Istri/ }).length).toBeGreaterThan(0);
});
