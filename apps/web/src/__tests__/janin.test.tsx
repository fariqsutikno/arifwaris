import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { PertanyaanHamil } from '../layar/keadaan/PertanyaanHamil';

let terakhir: Kasus;
function Uji({ awal }: { awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <PertanyaanHamil kasus={kasus} idMayit="PEWARIS" ubah={f => setKasus(k => rapikanKeadaan(f(k)))} />;
}
function keluargaAhmad(): Kasus {
  let kasus = kasusBaru('L');
  for (const kunci of ['ISTRI', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  return kasus;
}

it('Ada yang hamil → pilih ibu → dari suami → belum lahir → node janin', () => {
  render(<Uji awal={keluargaAhmad()} />);
  fireEvent.click(screen.getByRole('radio', { name: /^Ada$/ }));
  fireEvent.click(screen.getByRole('button', { name: /Tambah/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Istri/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getAllByRole('radio')[0]!);   // suaminya di data
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Belum lahir/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  expect(Object.values(terakhir.graf.orang).some(o => o.statusHidup === 'dalamKandungan')).toBe(true);
  expect(screen.getByRole('radio', { name: /^Ada$/ }).getAttribute('aria-checked')).toBe('true');
});

it('lahir hidup kembar laki-laki dan perempuan: janin diganti dua anak', () => {
  render(<Uji awal={keluargaAhmad()} />);
  fireEvent.click(screen.getByRole('radio', { name: /^Ada$/ }));
  fireEvent.click(screen.getByRole('button', { name: /Tambah/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Istri/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getAllByRole('radio')[0]!);
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Sudah lahir, masih hidup/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getByRole('radio', { name: /^Laki-laki$/ }));
  fireEvent.click(screen.getByRole('button', { name: /Kembar/ }));
  fireEvent.click(screen.getByRole('radio', { name: /^Perempuan$/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  expect(Object.values(terakhir.graf.orang).some(o => o.statusHidup === 'dalamKandungan')).toBe(false);
  expect(Object.values(terakhir.graf.orang).filter(o => o.idAyah === 'PEWARIS').length).toBe(3);   // anak awal + kembar L + P
});

it('"Tidak ada" dengan janin terisi meminta konfirmasi lalu menghapus janin', () => {
  render(<Uji awal={keluargaAhmad()} />);
  fireEvent.click(screen.getByRole('radio', { name: /^Ada$/ }));
  fireEvent.click(screen.getByRole('button', { name: /Tambah/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Istri/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getAllByRole('radio')[0]!);
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Belum lahir/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Tidak ada/ }));
  fireEvent.click(screen.getByRole('button', { name: /Ya, hapus/ }));
  expect(Object.values(terakhir.graf.orang).some(o => o.statusHidup === 'dalamKandungan')).toBe(false);
});
