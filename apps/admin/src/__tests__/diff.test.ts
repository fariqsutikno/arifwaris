import { expect, test } from 'vitest';
import { diffBaris, lipatDiff } from '../editor/diff';

test('baris berubah = hapus + tambah, sisanya sama', () => {
  expect(diffBaris('a\nb\nc', 'a\nB\nc')).toEqual([
    { jenis: 'sama', teks: 'a' }, { jenis: 'hapus', teks: 'b' }, { jenis: 'tambah', teks: 'B' }, { jenis: 'sama', teks: 'c' },
  ]);
});
test('lama kosong (entri baru) = semua tambah', () => {
  expect(diffBaris('', 'x\ny').every(b => b.jenis === 'tambah')).toBe(true);
});

test('lipatDiff: baris sama jauh dari perubahan dilipat, 3 baris konteks tetap tampil', () => {
  const lama = Array.from({ length: 20 }, (_, i) => `b${i}`).join('\n');
  const baru = lama.replace('b10', 'B10');
  const bagian = lipatDiff(diffBaris(lama, baru));
  expect(bagian.map(b => (b.jenis === 'lipat' ? `lipat${b.baris.length}` : b.baris.teks))).toEqual([
    'lipat7', 'b7', 'b8', 'b9', 'b10', 'B10', 'b11', 'b12', 'b13', 'lipat6',
  ]);
});
test('lipatDiff: lipatan satu baris tidak dibuat; tanpa perubahan → satu lipatan', () => {
  const lama = 'a\nb\nc\nd\ne';
  expect(lipatDiff(diffBaris(lama, 'a\nb\nc\nd\nE')).every(b => b.jenis === 'baris')).toBe(true);
  expect(lipatDiff(diffBaris(lama, lama))).toEqual([{ jenis: 'lipat', baris: diffBaris(lama, lama) }]);
});
