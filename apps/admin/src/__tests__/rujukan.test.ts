import { expect, test } from 'vitest';
import { cariOpsiRujukan, opsiRujukan, teksRujukan } from '../editor/rujukan';

const DAFTAR = opsiRujukan([{ kode: 'R09-7', bab: 9 }, { kode: 'R10-3', bab: 10 }, { kode: 'R05-1', bab: 5 }]);

test('opsi rujukan memakai klaim & judul bab dari KB, bukan kode', () => {
  expect(DAFTAR[0]).toMatchObject({ klaim: 'Cara pembagian radd', bab: 9 });
  expect(DAFTAR[2]!.jenisDalil).toBe('Hadits');
  expect(teksRujukan('R99-9')).toBe('R99-9');
});

test('cari lewat kata biasa, tanpa peduli apostrof & huruf besar; kode tetap cocok', () => {
  const kode = (cari: string) => cariOpsiRujukan(DAFTAR, cari).map(opsi => opsi.kode);
  expect(kode('RADD pembagian')).toEqual(['R09-7']);
  expect(kode('hadits')).toEqual(['R05-1']);
  expect(kode('bab 10')).toEqual(['R10-3']);
  expect(kode('R05')).toEqual(['R05-1']);
  expect(kode('')).toHaveLength(3);
});
