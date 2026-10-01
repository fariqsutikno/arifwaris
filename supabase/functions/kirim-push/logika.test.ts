import { expect, test } from 'vitest';
import {
  GAGAL_MAKS, harusDihapus, muatanPush, pilihPerBatas, samaRahasia, susunKabar, tindakanDariStatus, type Kandidat,
} from './logika';

const kandidat = (isi: Partial<Kandidat>): Kandidat => ({
  user_id: 'u1', jenis: 'streak_terancam', kunci: 'streak_terancam:2026-10-01', parameter: { jumlah: 5 }, tautan: '#/belajar', mendesak: true, ...isi,
});

test('streak terancam: judul dan isi dari diksi bawaan dengan sisipan', () => {
  expect(susunKabar(kandidat({}), {}, 'id')).toEqual({
    judul: 'Streak 5 harimu belum aman', isi: 'Selesaikan satu pelajaran atau soal hari ini untuk menjaganya.', tautan: '#/belajar', tag: 'streak_terancam:2026-10-01',
  });
});

test('diksi terbit menang atas bawaan, dan bahasa Arab dipakai bila ada (selain itu Indonesia)', () => {
  const teks = { 'notifikasi.streak_ingat_judul': { id: 'Awas, {jumlah} hari!', ar: 'انتبه {jumlah}' } };
  expect(susunKabar(kandidat({}), teks, 'id').judul).toBe('Awas, 5 hari!');
  expect(susunKabar(kandidat({}), teks, 'ar').judul).toBe('انتبه 5');
  expect(susunKabar(kandidat({}), {}, 'ar').judul).toBe('Streak 5 harimu belum aman');
});

test('peringkat pekan: isi mengikuti arah', () => {
  const pekan = (parameter: Kandidat['parameter']) => susunKabar(kandidat({ jenis: 'peringkat_pekan', mendesak: false, parameter, tautan: '#/peringkat' }), {}, 'id');
  expect(pekan({ peringkat: 3, arah: 'naik', selisih: 2 })).toMatchObject({ judul: 'Peringkatmu pekan lalu: 3', isi: 'Naik 2 peringkat dari pekan sebelumnya.' });
  expect(pekan({ peringkat: 5, arah: 'turun', selisih: 4 }).isi).toBe('Turun 4 peringkat dari pekan sebelumnya.');
  expect(pekan({ peringkat: 1, arah: 'sama', selisih: 0 }).isi).toBe('Sama dengan pekan sebelumnya.');
  expect(pekan({ peringkat: 1, arah: 'awal', selisih: 0 }).isi).toBe('Pekan baru sudah dimulai. Kumpulkan XP untuk naik peringkat.');
});

test('pilihPerBatas: semua mendesak lolos, kabar biasa hanya satu per pengguna', () => {
  const daftar = [
    kandidat({ kunci: 'a' }), kandidat({ kunci: 'b' }),
    kandidat({ kunci: 'c', mendesak: false }), kandidat({ kunci: 'd', mendesak: false }), kandidat({ kunci: 'e', user_id: 'u2', mendesak: false }),
  ];
  expect(pilihPerBatas(daftar).map(isi => isi.kunci)).toEqual(['a', 'b', 'c', 'e']);
});

test('status HTTP layanan push menjadi tindakan; langganan gagal terlalu sering dihapus', () => {
  expect(tindakanDariStatus(201)).toBe('berhasil');
  expect(tindakanDariStatus(410)).toBe('hapus');
  expect(tindakanDariStatus(404)).toBe('hapus');
  expect(tindakanDariStatus(429)).toBe('ulang-nanti');
  expect(tindakanDariStatus(500)).toBe('ulang-nanti');
  expect(harusDihapus('hapus', 0)).toBe(true);
  expect(harusDihapus('ulang-nanti', GAGAL_MAKS - 1)).toBe(false);
  expect(harusDihapus('ulang-nanti', GAGAL_MAKS)).toBe(true);
  expect(harusDihapus('berhasil', 99)).toBe(false);
});

test('muatan push berbentuk JSON yang dibaca sw.js; rahasia cron dibandingkan utuh', () => {
  expect(JSON.parse(muatanPush({ judul: 'j', isi: 'i', tautan: '#/x', tag: 't' }))).toEqual({ judul: 'j', isi: 'i', tautan: '#/x', tag: 't' });
  expect(samaRahasia('abc', 'abc')).toBe(true);
  expect(samaRahasia('abd', 'abc')).toBe(false);
  expect(samaRahasia('ab', 'abc')).toBe(false);
  expect(samaRahasia(null, 'abc')).toBe(false);
  expect(samaRahasia('abc', undefined)).toBe(false);
});
