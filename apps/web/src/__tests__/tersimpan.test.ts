import { beforeEach, expect, test } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, keJson } from '../kasus';
import { bacaTersimpan, hapusTersimpan, semuaTersimpan, simpanKasus, sudahTersimpan } from '../tersimpan';

const kasus = () => {
  const dasar = kasusBaru('L');
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: 123_456_789_012_345_678n }, graf: tambahAhliWaris(dasar.graf, 'PEWARIS', 'ISTRI') };
};
beforeEach(() => localStorage.clear());

test('simpan, timpa per id, hapus; bigint utuh', () => {
  simpanKasus('a', kasus());
  simpanKasus('a', kasus());
  expect(semuaTersimpan()).toHaveLength(1);
  const [entri] = bacaTersimpan();
  expect(entri!.judul).toBe('Istri');
  expect(keJson(entri!.kasus)).toBe(keJson(kasus()));
  expect(sudahTersimpan('a', kasus())).toBe(true);
  hapusTersimpan('a');
  expect(bacaTersimpan()).toEqual([]);
});

test('isi rusak diabaikan', () => {
  localStorage.setItem('arif-waris:tersimpan', JSON.stringify([{ id: 'x', kasus: { bukan: 'kasus' }, judul: 'x', disimpanPada: 'z' }]));
  expect(bacaTersimpan()).toEqual([]);
});
