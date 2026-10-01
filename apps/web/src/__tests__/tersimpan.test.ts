import { beforeEach, expect, test } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, keJson } from '../kasus';
import { bacaTersimpan, hapusTersimpan, semuaTersimpan, simpanKasus, sematkan, sudahTersimpan, ubahJudul } from '../tersimpan';

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

test('nama dan sematan buatan pengguna bertahan saat kasus disimpan ulang', () => {
  simpanKasus('a', kasus());
  ubahJudul('a', 'Keluarga Pak Budi');
  sematkan('a', true);
  simpanKasus('a', kasus());
  const [entri] = bacaTersimpan();
  expect(entri!.judul).toBe('Keluarga Pak Budi');
  expect(entri!.disematkan).toBe(true);
});

test('judul diberikan saat simpan menggantikan yang lama', () => {
  simpanKasus('a', kasus(), 'Keluarga X');
  expect(bacaTersimpan()[0]!.judul).toBe('Keluarga X');
});

test('nama kosong kembali ke ringkasan otomatis; nama panjang dipotong 80 karakter', () => {
  simpanKasus('a', kasus());
  ubahJudul('a', '   ');
  expect(bacaTersimpan()[0]!.judul).toBe('Istri');
  ubahJudul('a', 'x'.repeat(200));
  expect(bacaTersimpan()[0]!.judul).toHaveLength(80);
});

test('ganti nama dan sematkan memajukan disimpanPada (trigger server menolak waktu lama)', () => {
  simpanKasus('a', kasus());
  const sebelum = semuaTersimpan()[0]!.disimpanPada;
  ubahJudul('a', 'Baru');
  const sesudah = semuaTersimpan()[0]!.disimpanPada;
  expect(sesudah > sebelum).toBe(true);
});

test('data lama tanpa disematkan terbaca sebagai false', () => {
  localStorage.setItem('arif-waris:tersimpan', JSON.stringify([{ id: 'x', kasus: JSON.parse(keJson(kasus())), judul: 'x', disimpanPada: '2026-01-01T00:00:00.000Z' }]));
  expect(bacaTersimpan()[0]!.disematkan).toBe(false);
});
