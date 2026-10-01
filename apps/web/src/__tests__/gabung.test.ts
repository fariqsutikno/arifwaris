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
    { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: true, diubahPada: '2026-09-27T00:00:01.000Z' }] },
    { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: true, diubahPada: '2026-09-27T00:00:02.000Z' }] });
  expect(hasil.belajar).toEqual([{ pelajaranSlug: 'x', selesai: true, diubahPada: '2026-09-27T00:00:02.000Z' }]);
});

// Trigger tolak_data_lebih_lama menolak upsert yang waktunya <= baris server: hasil gabungan harus lebih baru.
test('hasil gabungan beda dari server yang lebih baru: waktu dimajukan 1 ms supaya tidak ditolak server', () => {
  const { hasil, kirim } = gabung(
    { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: true, diubahPada: '2026-09-27T00:00:01.000Z' }],
      latihan: [latihan('2026-09-27T00:00:01.000Z', false, 5)] },
    { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: false, diubahPada: '2026-09-27T00:00:02.000Z' }],
      latihan: [latihan('2026-09-27T00:00:02.000Z', true, 2)] });
  expect(hasil.belajar).toEqual([{ pelajaranSlug: 'x', selesai: true, diubahPada: '2026-09-27T00:00:02.001Z' }]);
  expect(hasil.latihan).toEqual([latihan('2026-09-27T00:00:02.001Z', true, 5)]);
  expect(kirim.map(entri => entri.tabel)).toEqual(['belajar', 'latihan']);
});

test('progres latihan: terbaru menang, jumlah coba = maksimum', () => {
  const { hasil } = gabung({ ...kosong, latihan: [latihan('2026-09-27T00:00:03.000Z', true, 5)] },
    { ...kosong, latihan: [latihan('2026-09-27T00:00:02.000Z', false, 2)] });
  expect(hasil.latihan).toEqual([latihan('2026-09-27T00:00:03.001Z', true, 5)]);
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

test('tersimpan: sematan ikut baris yang lebih baru', () => {
  const { hasil } = gabung(
    { ...kosong, tersimpan: [{ ...simpanan('a', '2'), disematkan: true }] },
    { ...kosong, tersimpan: [{ ...simpanan('a', '1'), disematkan: false }] });
  expect(hasil.tersimpan[0]!.disematkan).toBe(true);
});
