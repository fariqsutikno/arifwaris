import { beforeEach, expect, test, vi } from 'vitest';
import {
  bacaPelajaranSelesai, bacaProgresBelajar, bacaProgresLatihan, bacaSkorPaket, catatLatihan, resetProgresBelajar,
  tandaiPelajaranSelesai,
} from '../progres';

const WAKTU_LAMA = new Date(0).toISOString();
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-27T10:00:00Z')); });

test('pelajaran selesai tercatat dengan waktu', () => {
  tandaiPelajaranSelesai('ashabah-1');
  expect(bacaPelajaranSelesai()).toEqual(new Set(['ashabah-1']));
  expect(bacaProgresBelajar()['ashabah-1']).toEqual({ pelajaranSlug: 'ashabah-1', selesai: true, diubahPada: '2026-09-27T10:00:00.000Z' });
});

test('latihan: jumlah coba bertambah, jawaban & benar terakhir disimpan', () => {
  catatLatihan('kuis', 'K-01', false, 2);
  catatLatihan('kuis', 'K-01', true, 1);
  expect(bacaProgresLatihan('kuis')['K-01']).toMatchObject({ jenis: 'kuis', benar: true, jumlahCoba: 2, jawabanTerakhir: 1 });
  expect(bacaProgresLatihan('hitung')).toEqual({});
});

test('catatan format lama dimigrasi sekali: waktu 0, jumlah coba 1, skor paket dipisah', () => {
  localStorage.setItem('arif-waris:catatan:pelajaran', JSON.stringify({ 'ashabah-1': 'selesai' }));
  localStorage.setItem('arif-waris:catatan:soal', JSON.stringify({ 'H-01': 'selesai' }));
  localStorage.setItem('arif-waris:catatan:kuis', JSON.stringify({ 'K-01': 'salah', 'bab-9': '3/5' }));
  expect(bacaProgresBelajar()['ashabah-1']).toEqual({ pelajaranSlug: 'ashabah-1', selesai: true, diubahPada: WAKTU_LAMA });
  expect(bacaProgresLatihan('hitung')['H-01']).toMatchObject({ benar: true, jumlahCoba: 1, jawabanTerakhir: null, diubahPada: WAKTU_LAMA });
  expect(bacaProgresLatihan('kuis')['K-01']).toMatchObject({ benar: false, jumlahCoba: 1 });
  expect(bacaSkorPaket()).toEqual({ 'bab-9': '3/5' });
  expect(localStorage.getItem('arif-waris:catatan:kuis')).toBeNull();
});

test('isi rusak dibaca sebagai kosong', () => {
  localStorage.setItem('arif-waris:progres-belajar', '{rusak');
  localStorage.setItem('arif-waris:progres-latihan', '[1,2]');
  expect(bacaProgresBelajar()).toEqual({});
  expect(bacaProgresLatihan('kuis')).toEqual({});
});

test('reset menghapus progres & skor paket', () => {
  tandaiPelajaranSelesai('a');
  catatLatihan('kuis', 'K-01', true, 0);
  resetProgresBelajar();
  expect(bacaPelajaranSelesai().size).toBe(0);
  expect(bacaProgresLatihan('kuis')).toEqual({});
});
