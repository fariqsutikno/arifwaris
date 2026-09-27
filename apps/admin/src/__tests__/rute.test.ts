import { expect, test } from 'vitest';
import { bacaRute, tulisRute, type Rute } from '../rute';

const CONTOH: Rute[] = [
  { layar: 'beranda' }, { layar: 'menu', menu: 'pustaka', tab: 'syahid' }, { layar: 'entri', entriId: 'abc' },
  { layar: 'entriBaru', jenis: 'faq' }, { layar: 'review' }, { layar: 'peran' },
];
test.each(CONTOH)('bolak-balik %o', rute => expect(bacaRute(tulisRute(rute))).toEqual(rute));
test('hash kosong / tak dikenal / jenis tak sah → beranda', () => {
  expect(bacaRute('')).toEqual({ layar: 'beranda' });
  expect(bacaRute('#/konten/faq')).toEqual({ layar: 'beranda' });
  expect(bacaRute('#/baru/bukan_jenis')).toEqual({ layar: 'beranda' });
  expect(bacaRute('#/menu/bukan')).toEqual({ layar: 'beranda' });
});
test('menu tanpa tab / tab bukan miliknya → tab bawaan', () => {
  expect(bacaRute('#/menu/aplikasi')).toEqual({ layar: 'menu', menu: 'aplikasi', tab: 'teks_edukasi' });
  expect(bacaRute('#/menu/pustaka/faq')).toEqual({ layar: 'menu', menu: 'pustaka', tab: 'kitab' });
});
test('kueri saring pada menu & isian awal entri baru ikut bolak-balik', () => {
  const menu: Rute = { layar: 'menu', menu: 'soal_kuis', tab: 'soal_kuis', kueri: { status: 'draf', cari: 'ibu 1/3' } };
  expect(bacaRute(tulisRute(menu))).toEqual(menu);
  expect(bacaRute('#/baru/materi?modul=3')).toEqual({ layar: 'entriBaru', jenis: 'materi', kueri: { modul: '3' } });
  expect(tulisRute({ layar: 'menu', menu: 'faq', tab: 'faq', kueri: {} })).toBe('#/menu/faq/faq');
});
