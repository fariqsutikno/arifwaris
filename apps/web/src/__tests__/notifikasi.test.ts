import { beforeEach, expect, test } from 'vitest';
import { bacaNotifikasi, catatNotifikasi, type NotifikasiBaru } from '../notifikasi/gudang';
import { modulBerubah } from '../konten/sinkron';

const kabar = (id: string, prioritas: number, mendesak = false): NotifikasiBaru => ({ id, jenis: 'streak', judul: id, isi: '', prioritas, mendesak });
const PAGI = new Date(2026, 9, 2, 8).getTime();
const SORE = new Date(2026, 9, 2, 18).getTime();
const BESOK = new Date(2026, 9, 3, 8).getTime();

beforeEach(() => localStorage.clear());

test('satu notifikasi per hari: kandidat kedua yang kurang penting dibuang', () => {
  expect(catatNotifikasi(kabar('a', 70), PAGI)).toBe(true);
  expect(catatNotifikasi(kabar('b', 50), SORE)).toBe(false);
  expect(bacaNotifikasi().map(ini => ini.id)).toEqual(['a']);
});

test('kandidat yang lebih penting menggantikan yang sudah ada di hari yang sama', () => {
  catatNotifikasi(kabar('a', 40), PAGI);
  expect(catatNotifikasi(kabar('b', 90), SORE)).toBe(true);
  expect(bacaNotifikasi().map(ini => ini.id)).toEqual(['b']);
});

test('kabar mendesak tidak terkena batas harian dan tidak menggeser kabar biasa', () => {
  catatNotifikasi(kabar('biasa', 40), PAGI);
  expect(catatNotifikasi(kabar('terancam', 70, true), SORE)).toBe(true);
  expect(catatNotifikasi(kabar('terancam-lagi', 70, true), SORE)).toBe(true);
  expect(bacaNotifikasi().map(ini => ini.id).sort()).toEqual(['biasa', 'terancam', 'terancam-lagi']);
  expect(catatNotifikasi(kabar('biasa-kedua', 30), SORE)).toBe(false);
});

test('hari berikutnya boleh lagi, dan id yang sama tidak dicatat dua kali', () => {
  catatNotifikasi(kabar('a', 40), PAGI);
  expect(catatNotifikasi(kabar('b', 40), BESOK)).toBe(true);
  expect(catatNotifikasi(kabar('a', 99), BESOK)).toBe(false);
  expect(bacaNotifikasi()).toHaveLength(2);
});

test('modulBerubah: hanya modul dari materi yang baru atau berganti revisi', () => {
  const baris = (entriId: string, revisiId: string, modul: number) => ({ entriId, jenis: 'materi', slug: entriId, urutan: 1, revisiId, isi: { modul }, refs: [], versiTerbit: 1 });
  const lama = { versi: 1, diksi: [], konten: [baris('a', 'r1', 1), baris('b', 'r1', 2)] };
  const baru = { versi: 2, diksi: [], konten: [baris('a', 'r1', 1), baris('b', 'r2', 2), baris('c', 'r1', 3)] };
  expect(modulBerubah(lama as never, baru as never).sort()).toEqual([2, 3]);
});
