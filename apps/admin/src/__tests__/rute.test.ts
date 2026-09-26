import { expect, test } from 'vitest';
import { bacaRute, tulisRute, type Rute } from '../rute';

const CONTOH: Rute[] = [
  { layar: 'konten', jenis: 'materi' }, { layar: 'entri', entriId: 'abc' }, { layar: 'entriBaru', jenis: 'faq' },
  { layar: 'review' }, { layar: 'diksi' }, { layar: 'peran' },
];
test.each(CONTOH)('bolak-balik %o', rute => expect(bacaRute(tulisRute(rute))).toEqual(rute));
test('hash tak dikenal / jenis tak sah → review', () => {
  expect(bacaRute('')).toEqual({ layar: 'review' });
  expect(bacaRute('#/konten/bukan_jenis')).toEqual({ layar: 'review' });
});
