import { expect, test } from 'vitest';
import { diffBaris } from '../editor/diff';

test('baris berubah = hapus + tambah, sisanya sama', () => {
  expect(diffBaris('a\nb\nc', 'a\nB\nc')).toEqual([
    { jenis: 'sama', teks: 'a' }, { jenis: 'hapus', teks: 'b' }, { jenis: 'tambah', teks: 'B' }, { jenis: 'sama', teks: 'c' },
  ]);
});
test('lama kosong (entri baru) = semua tambah', () => {
  expect(diffBaris('', 'x\ny').every(b => b.jenis === 'tambah')).toBe(true);
});
