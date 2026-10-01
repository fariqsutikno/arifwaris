import { expect, it } from 'vitest';
import { DAFTAR_KITAB, RUJUKAN } from '@waris/content';
import { daftarSyahid } from '../konten/sumber';
import { daftarBabDi, penggunaanDalil, cariRujukanTeks, saringBab } from '../layar/rujukan/cari';

it('cari: kurang dari dua huruf atau tak cocok → kosong', () => {
  expect(cariRujukanTeks('')).toEqual([]);
  expect(cariRujukanTeks(' a ')).toEqual([]);
  expect(cariRujukanTeks('zzqqxx')).toEqual([]);
});

it('cari: cocok ke klaim dalil, tak peka huruf besar, tautannya ke detail', () => {
  const dalil = RUJUKAN[0]!;
  const hasil = cariRujukanTeks(dalil.klaim.slice(0, 12).toUpperCase());
  expect(hasil.map(isi => isi.tautan)).toContain(`#/rujukan/${dalil.kode}`);
});

it('cari: cocok ke judul kitab, tautannya ke daftar kitab', () => {
  const hasil = cariRujukanTeks(DAFTAR_KITAB[0]!.judul);
  expect(hasil.map(isi => isi.tautan)).toContain('#/rujukan/kitab');
});

it('saringBab dan daftarBabDi', () => {
  const bab = daftarBabDi(RUJUKAN);
  expect(bab).toEqual([...bab].sort((a, b) => a - b));
  expect(new Set(bab).size).toBe(bab.length);
  expect(saringBab(RUJUKAN, bab[0]).every(isi => isi.bab === bab[0])).toBe(true);
  expect(saringBab(RUJUKAN)).toBe(RUJUKAN);
});

it('penggunaanDalil: bab dalil + hukum syahid yang merujuknya; kode asing → kosong', () => {
  const syahid = daftarSyahid().find(isi => RUJUKAN.some(dalil => dalil.kode === isi.rujukan));
  expect(syahid, 'ada syahid yang rujukannya kode dalil').toBeTruthy();
  expect(penggunaanDalil(syahid!.rujukan).hukum).toContain(syahid!.hukum);
  expect(penggunaanDalil('R99-9')).toEqual({ bab: undefined, hukum: [] });
});
