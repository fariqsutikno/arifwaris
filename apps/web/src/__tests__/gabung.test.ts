import { expect, test } from 'vitest';
import { gabung, type DataPengguna } from '../akun/gabung';

const kosong: DataPengguna = { tersimpan: [], belajar: [], latihan: [], preferensi: null };
const simpanan = (id: string, disimpanPada: string, judul = id) => ({ id, kasus: {}, judul, disimpanPada });
const latihan = (diubahPada: string, benar: boolean, jumlahCoba: number) =>
  ({ soalSlug: 'K-01', jenis: 'kuis' as const, jawabanTerakhir: null, benar, jumlahCoba, diubahPada });

test('tersimpan: gabung per id, yang terbaru menang; kirim hanya yang beda dari server', () => {
  const { hasil, kirim } = gabung(
    { ...kosong, tersimpan: [simpanan('a', '2', 'lokal'), simpanan('b', '1')] },
    { ...kosong, tersimpan: [simpanan('a', '1', 'server'), simpanan('c', '1')] });
  expect(hasil.tersimpan.map(baris => [baris.id, baris.judul]).sort()).toEqual([['a', 'lokal'], ['b', 'b'], ['c', 'c']]);
  expect(kirim.map(entri => entri.tabel === 'tersimpan' && entri.baris.id).sort()).toEqual(['a', 'b']);
});

test('progres belajar: selesai = OR, waktu = maksimum', () => {
  const { hasil } = gabung(
    { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: true, diubahPada: '1' }] },
    { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: false, diubahPada: '2' }] });
  expect(hasil.belajar).toEqual([{ pelajaranSlug: 'x', selesai: true, diubahPada: '2' }]);
});

test('progres latihan: terbaru menang, jumlah coba = maksimum', () => {
  const { hasil } = gabung({ ...kosong, latihan: [latihan('1', false, 5)] }, { ...kosong, latihan: [latihan('2', true, 2)] });
  expect(hasil.latihan).toEqual([latihan('2', true, 5)]);
});

test('preferensi: terbaru utuh; server kosong → lokal dikirim', () => {
  const lokal = { isi: { a: '1' }, diubahPada: '1' };
  expect(gabung({ ...kosong, preferensi: lokal }, { ...kosong, preferensi: { isi: { b: '2' }, diubahPada: '2' } }).hasil.preferensi)
    .toEqual({ isi: { b: '2' }, diubahPada: '2' });
  expect(gabung({ ...kosong, preferensi: lokal }, kosong).kirim).toEqual([{ tabel: 'preferensi', baris: lokal }]);
});

test('sama persis di kedua sisi → tidak ada yang dikirim', () => {
  const data = { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: true, diubahPada: '1' }] };
  expect(gabung(data, data).kirim).toEqual([]);
});
