// Tes editor kasus soal hitung: fungsi murni jumlah/urutan ahli waris, lalu komponen — tambah ahli waris, tombol
// Hitung mengisi harapan dari engine, harapan manual yang beda memunculkan peringatan, kasus tak didukung → galat.
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import type { ContohKasus } from '@waris/content';
import { aturJumlah, bacaBigint, jumlahPerKunci, samaHarapan } from '../editor/kasus';
import { EditorKasus } from '../layar/EditorKasus';
import { SOAL_HITUNG_UJI } from './contoh';

test('aturJumlah mempertahankan urutan', () => {
  expect(aturJumlah(['ISTRI', 'AYAH'], 'ISTRI', 2)).toEqual(['ISTRI', 'ISTRI', 'AYAH']);
  expect(aturJumlah(['ISTRI', 'AYAH'], 'IBU', 1)).toEqual(['ISTRI', 'AYAH', 'IBU']);
  expect(aturJumlah(['ISTRI', 'AYAH'], 'ISTRI', 0)).toEqual(['AYAH']);
  expect(jumlahPerKunci(['ANAK_PR', 'ANAK_PR', 'IBU'])).toEqual({ ANAK_PR: 2, IBU: 1 });
});

test('samaHarapan & bacaBigint', () => {
  const h = SOAL_HITUNG_UJI.kasus.harapan;
  expect(samaHarapan(h, { ...h })).toBe(true);
  expect(samaHarapan(h, { ...h, saham: { ...h.saham, IBU: 5n } })).toBe(false);
  expect(bacaBigint('120.000.000')).toBe(120_000_000n);
  expect(bacaBigint('1,5')).toBeNull();
});

function Uji({ awal }: { awal: ContohKasus }) {
  const [nilai, setNilai] = useState(awal);
  return <><EditorKasus nilai={nilai} saatUbah={setNilai} bacaSaja={false} /><output data-testid="isi">{JSON.stringify(nilai, (_k, v) => typeof v === 'bigint' ? `${v}n` : v)}</output></>;
}
const isi = () => screen.getByTestId('isi').textContent!;

test('tambah ahli waris lalu Hitung → harapan dari engine, tanpa peringatan', () => {
  render(<Uji awal={{ pewaris: 'L', ahliWaris: ['ISTRI'], harta: 100n, harapan: { saham: {}, ashlAkhir: 0n } }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Tambah Anak laki-laki' }));
  fireEvent.click(screen.getByRole('button', { name: /Hitung dengan engine/ }));
  expect(isi()).toContain('"ahliWaris":["ISTRI","ANAK_LK"]');
  expect(isi()).toContain('"saham":{"ISTRI":"1n","ANAK_LK":"7n"},"ashlAkhir":"8n"');
  expect(screen.queryByText('Harapan berbeda dari hasil engine.')).toBeNull();
});

test('harapan manual beda dari engine → peringatan', () => {
  render(<Uji awal={SOAL_HITUNG_UJI.kasus} />);
  expect(screen.queryByText('Harapan berbeda dari hasil engine.')).toBeNull();
  fireEvent.change(screen.getByLabelText('Ashl akhir'), { target: { value: '12' } });
  expect(screen.getByText('Harapan berbeda dari hasil engine.')).toBeTruthy();
});

test('kunci tak dikenal checklist → galat, harapan tidak berubah', () => {
  render(<Uji awal={{ pewaris: 'L', ahliWaris: ['BUKAN_KUNCI'], harta: 100n, harapan: { saham: {}, ashlAkhir: 0n } }} />);
  fireEvent.click(screen.getByRole('button', { name: /Hitung dengan engine/ }));
  expect(screen.getByText(/Engine tidak bisa menghitung kasus ini/)).toBeTruthy();
  expect(isi()).toContain('"ashlAkhir":"0n"');
});
