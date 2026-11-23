import type { ProgresLatihan } from '@waris/data';
import { expect, test } from 'vitest';
import type { IsianSoal } from '../isianSoal';
import { soalSelesai, statusSoal } from '../layar/belajar/statusSoal';

const progres = (benar: boolean): ProgresLatihan => ({ soalSlug: 'K-01', jenis: 'hitung', benar, jawabanTerakhir: null, jumlahCoba: 1, diubahPada: '2026-11-23T00:00:00Z' });
const isian = (sel: Record<string, Record<string, string>>): IsianSoal => ({ isian: { kepala: {}, sel }, diubahPada: 1, jumlahKotak: 4 });

test('empat keadaan status soal', () => {
  expect(statusSoal(undefined, null)).toBe('belum');
  expect(statusSoal(undefined, isian({ a: { b: '1/2' } }))).toBe('terputus');
  expect(statusSoal(progres(true), null)).toBe('benar');
  expect(statusSoal(progres(false), null)).toBe('lihatJawaban');
});

test('isian kosong dianggap belum; progres mengalahkan isian sisa', () => {
  expect(statusSoal(undefined, isian({ a: { b: '' } }))).toBe('belum');
  expect(statusSoal(progres(true), isian({ a: { b: '1' } }))).toBe('benar');
});

test('selesai = benar atau lihat jawaban', () => {
  expect(['belum', 'terputus', 'benar', 'lihatJawaban'].map(status => soalSelesai(status as never))).toEqual([false, false, true, true]);
});
