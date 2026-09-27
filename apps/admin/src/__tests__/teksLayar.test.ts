import { expect, test } from 'vitest';
import { buatPencocok, type SumberTeks } from '../editor/teksLayar';

const teks = (kunci: string, id: string, sumber: SumberTeks['sumber'] = 'diksi'): SumberTeks => ({ sumber, kunci, id, ar: null });
const pencocok = buatPencocok([
  teks('harta.kendaraan', 'Kendaraan', 'teks'), teks('hitung.kendaraan', 'Kendaraan'),
  teks('hitung.jumlah_jt', '{jumlah} jt'), teks('umum.nama', '{nama}'), teks('hitung.lanjut', 'Lanjut'),
]);

test('cocok persis dengan spasi dirapikan; teks kembar mengembalikan semua sumbernya', () => {
  expect(pencocok.cari('  Lanjut \n').map(s => s.kunci)).toEqual(['hitung.lanjut']);
  expect(pencocok.cari('Kendaraan').map(s => s.kunci)).toEqual(['harta.kendaraan', 'hitung.kendaraan']);
});

test('teks bersisipan cocok sebagai pola; pola yang hampir kosong diabaikan', () => {
  expect(pencocok.cari('10 jt').map(s => s.kunci)).toEqual(['hitung.jumlah_jt']);
  expect(pencocok.cari('Fulan')).toEqual([]);
  expect(pencocok.cari('x')).toEqual([]);
});
