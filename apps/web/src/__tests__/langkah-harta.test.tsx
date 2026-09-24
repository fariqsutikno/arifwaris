import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { kasusBaru, type Kasus } from '../kasus';
import { LangkahHarta } from '../layar/wizard/LangkahHarta';
import { LangkahKewajiban } from '../layar/wizard/LangkahKewajiban';

let terakhir: Kasus;
function Uji({ Langkah, awal }: { Langkah: typeof LangkahHarta; awal: Kasus }) {
  const [kasus, setKasus] = useState(awal);
  terakhir = kasus;
  return <Langkah kasus={kasus} ubah={ubah => setKasus(ubah)} />;
}

it('titik ribuan muncul langsung saat mengetik, dengan prefix Rp', () => {
  render(<Uji Langkah={LangkahHarta} awal={kasusBaru('L')} />);
  const isian = screen.getByLabelText('Total harta peninggalan') as HTMLInputElement;
  fireEvent.change(isian, { target: { value: '1500000' } });
  expect(isian.value).toBe('1.500.000');
  expect(terakhir.tirkah.kotor).toBe(1_500_000n);
  expect(screen.getAllByText('Rp').length).toBeGreaterThan(0);
});

it('huruf dibuang, bukan disimpan', () => {
  render(<Uji Langkah={LangkahHarta} awal={kasusBaru('L')} />);
  const isian = screen.getByLabelText('Total harta peninggalan') as HTMLInputElement;
  fireEvent.change(isian, { target: { value: '12a3' } });
  expect(isian.value).toBe('123');
});

it('tambah cepat menambah ke total', () => {
  render(<Uji Langkah={LangkahHarta} awal={kasusBaru('L')} />);
  fireEvent.click(screen.getByRole('button', { name: '+10 jt' }));
  fireEvent.click(screen.getByRole('button', { name: '+1 jt' }));
  expect((screen.getByLabelText('Total harta peninggalan') as HTMLInputElement).value).toBe('11.000.000');
  expect(terakhir.tirkah.kotor).toBe(11_000_000n);
});

it('rinci per jenis menjumlahkan otomatis ke total', () => {
  render(<Uji Langkah={LangkahHarta} awal={kasusBaru('L')} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Rinci per jenis' }));
  fireEvent.change(screen.getByLabelText('Tabungan & kas'), { target: { value: '5000000' } });
  fireEvent.change(screen.getByLabelText('Emas & perhiasan'), { target: { value: '2000000' } });
  expect(terakhir.tirkah.kotor).toBe(7_000_000n);
  expect(terakhir.rincianHarta).toEqual({ tabungan: 5_000_000n, emas: 2_000_000n });
  expect(screen.getByText('Rp 7.000.000')).toBeTruthy();
});

it('pembulatan: ringkas saat tertutup, pilihan berlabel jelas saat dibuka', () => {
  render(<Uji Langkah={LangkahHarta} awal={kasusBaru('L')} />);
  expect(screen.getByText(/Dibulatkan ke Rp 1/)).toBeTruthy();
  fireEvent.click(screen.getByText(/Pembulatan/));
  fireEvent.click(screen.getByRole('radio', { name: /Rp 1.000/ }));
  expect(terakhir.satuanPembulatan).toBe(1000n);
  expect(screen.getByText(/Contoh/)).toBeTruthy();
});

it('kewajiban: hitungan berjalan dari engine, wasiat lebih dari 1/3 dipangkas', () => {
  const awal = { ...kasusBaru('L'), tirkah: { kotor: 90_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  render(<Uji Langkah={LangkahKewajiban} awal={awal} />);
  fireEvent.change(screen.getByLabelText('Wasiat'), { target: { value: '60000000' } });
  expect(screen.getByRole('status').textContent).toMatch(/dipangkas jadi Rp 30.000.000/);
  expect(screen.getByText('Rp 60.000.000', { selector: '.hitungan-total' })).toBeTruthy();
});
