import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, rapikanKeadaan, type Kasus } from '../kasus';
import { KeadaanKeluarga } from '../layar/keadaan/KeadaanKeluarga';

let terakhir: Kasus;
function Uji({ awal, akhir = true }: { awal: Kasus; akhir?: boolean }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <KeadaanKeluarga kasus={kasus} idMayit={kasus.graf.idPewaris} akhir={akhir} ubah={f => setKasus(k => rapikanKeadaan(f(k)))} />;
}
const denganIstriDanAnak = () => {
  const k = kasusBaru('L');
  return { ...k, graf: tambahAhliWaris(tambahAhliWaris(k.graf, 'PEWARIS', 'ISTRI'), 'PEWARIS', 'ANAK_LK') };
};
const denganAnakSaja = () => { const k = kasusBaru('L'); return { ...k, graf: tambahAhliWaris(k.graf, 'PEWARIS', 'ANAK_LK') }; };

it('satu keputusan: tiga kartu, tak ada yang dicentang (kasus biasa langsung lanjut)', () => {
  render(<Uji awal={denganIstriDanAnak()} />);
  const kartu = screen.getAllByRole('checkbox');
  expect(kartu.map(k => k.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false']);
  expect(screen.queryByText(/Ketuk orangnya/)).toBeNull();
});

it('kartu yang tidak mungkin berlaku tidak tampil: hamil tanpa perempuan yang bisa hamil, beda agama di babak yang bukan terakhir', () => {
  const { unmount } = render(<Uji awal={denganAnakSaja()} />);
  expect(screen.queryByRole('checkbox', { name: /sedang hamil/ })).toBeNull();
  expect(screen.getByRole('checkbox', { name: /beda agama/ })).toBeTruthy();
  unmount();
  render(<Uji awal={denganIstriDanAnak()} akhir={false} />);
  expect(screen.getByRole('checkbox', { name: /sedang hamil/ })).toBeTruthy();
  expect(screen.queryByRole('checkbox', { name: /beda agama/ })).toBeNull();
});

it('mencentang "wafat atau hilang" membuka daftar orang; menutup tanpa isian langsung menutup', () => {
  render(<Uji awal={denganIstriDanAnak()} />);
  fireEvent.click(screen.getByRole('checkbox', { name: /sudah wafat atau hilang/ }));
  expect(screen.getByText(/Ketuk orangnya/)).toBeTruthy();
  expect(screen.getByRole('button', { name: /Anak laki-laki/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox', { name: /sudah wafat atau hilang/ }));
  expect(screen.queryByText(/Ketuk orangnya/)).toBeNull();
  expect(screen.queryByRole('alertdialog')).toBeNull();
});

it('mencentang "hamil" langsung menanyakan siapa yang hamil (tanpa mencari tautan tambah)', () => {
  render(<Uji awal={denganIstriDanAnak()} />);
  fireEvent.click(screen.getByRole('checkbox', { name: /sedang hamil/ }));
  expect(screen.getByRole('dialog', { name: /Siapa yang sedang hamil/ })).toBeTruthy();
});

it('menutup kartu hamil yang sudah berisi meminta konfirmasi, lalu janin dihapus', () => {
  render(<Uji awal={denganIstriDanAnak()} />);
  fireEvent.click(screen.getByRole('checkbox', { name: /sedang hamil/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Istri/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));   // siapa → dari siapa
  fireEvent.click(screen.getAllByRole('radio')[0]!);
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));   // dari siapa → sudah lahir?
  fireEvent.click(screen.getByRole('radio', { name: /Belum lahir/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
  expect(Object.values(terakhir.graf.orang).some(o => o.statusHidup === 'dalamKandungan')).toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: /sedang hamil/ }));
  expect(screen.getByRole('alertdialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Ya, hapus/ }));
  expect(Object.values(terakhir.graf.orang).some(o => o.statusHidup === 'dalamKandungan')).toBe(false);
  expect(screen.getByRole('checkbox', { name: /sedang hamil/ }).getAttribute('aria-checked')).toBe('false');
});

it('menutup kartu beda agama membersihkan tanda yang sempat dicentang', () => {
  render(<Uji awal={denganAnakSaja()} />);
  fireEvent.click(screen.getByRole('checkbox', { name: /beda agama/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Beda agama dengan almarhum/ }));
  fireEvent.click(screen.getAllByRole('checkbox', { name: /Anak laki-laki/ })[0]!);
  expect(Object.values(terakhir.graf.orang).some(o => o.agama === 'nonIslam')).toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: /Ada yang beda agama atau terlibat/ }));
  expect(Object.values(terakhir.graf.orang).some(o => o.agama === 'nonIslam')).toBe(false);
});
