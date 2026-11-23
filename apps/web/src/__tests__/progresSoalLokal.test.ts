import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { MASA_SIMPAN, catatRiwayat, hapusRiwayat } from '../riwayat';
import { bacaProgresSoal, buangProgresSoalSelain, hapusProgresSoal, hapusSemuaProgresSoal, simpanProgresSoal, type ProgresSoalLokal } from '../progresSoalLokal';

const contoh: ProgresSoalLokal = {
  isian: { kepala: { asal: '8' }, sel: { PEWARIS: { bagian: '1/4' } } },
  pilihanGharqa: null, jawabanTerbuka: false, sudahMencoba: true, tebakanBenar: false, idSesiSoal: 'percobaan-1', revisiSoal: 'rev-1',
};

beforeEach(() => { localStorage.clear(); hapusRiwayat(); });
afterEach(() => vi.restoreAllMocks());

it('bolak-balik; sesi lain tidak terbaca', () => {
  simpanProgresSoal('a', contoh);
  expect(bacaProgresSoal('a', 'rev-1')).toEqual(contoh);
  expect(bacaProgresSoal('b', 'rev-1')).toBeNull();
  hapusProgresSoal('a');
  expect(bacaProgresSoal('a', 'rev-1')).toBeNull();
});

it('revisi soal berbeda → dibuang (L13)', () => {
  simpanProgresSoal('a', contoh);
  expect(bacaProgresSoal('a', 'rev-2')).toBeNull();
});

it('JSON rusak atau bentuk lama → null', () => {
  localStorage.setItem('arif-waris:progres-soal', '{rusak');
  expect(bacaProgresSoal('a', 'rev-1')).toBeNull();
  localStorage.setItem('arif-waris:progres-soal', JSON.stringify({ a: { isian: 5 } }));
  expect(bacaProgresSoal('a', 'rev-1')).toBeNull();
});

it('localStorage melempar → tidak melempar, progres bertahan di memori selama sesi (P10)', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('diblokir'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('penuh'); });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('diblokir'); });
  expect(() => simpanProgresSoal('a', contoh)).not.toThrow();
  expect(bacaProgresSoal('a', 'rev-1')).toEqual(contoh);
  expect(() => hapusProgresSoal('a')).not.toThrow();
  expect(bacaProgresSoal('a', 'rev-1')).toBeNull();
  expect(() => hapusSemuaProgresSoal()).not.toThrow();
});

it('hapusSemuaProgresSoal dan buangProgresSoalSelain', () => {
  simpanProgresSoal('a', contoh); simpanProgresSoal('b', contoh);
  buangProgresSoalSelain(new Set(['a']));
  expect(bacaProgresSoal('a', 'rev-1')).not.toBeNull();
  expect(bacaProgresSoal('b', 'rev-1')).toBeNull();
  hapusSemuaProgresSoal();
  expect(bacaProgresSoal('a', 'rev-1')).toBeNull();
});

it('entri riwayat kedaluwarsa → progres soalnya ikut hilang (S5)', () => {
  const dasar = kasusBaru('L', 'latihan');
  const kasus = { ...dasar, graf: tambahAhliWaris(dasar.graf, 'PEWARIS', 'ISTRI') };
  catatRiwayat('lama', kasus, 0, { jenis: 'latihan', kode: 'H-01' });
  simpanProgresSoal('lama', contoh);
  catatRiwayat('baru', { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'AYAH') }, MASA_SIMPAN + 1, { jenis: 'sendiri' });
  expect(bacaProgresSoal('lama', 'rev-1')).toBeNull();
});
