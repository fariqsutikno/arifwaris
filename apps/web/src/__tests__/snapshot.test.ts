// apps/web/src/__tests__/snapshot.test.ts
// Snapshot bawaan = sumber konten saat offline; pengganti tes data di packages/content (yang berkasnya dihapus).
import { expect, test } from 'vitest';
import { periksaKonsistensi } from '@waris/content';
import { saringValid, type Snapshot } from '@waris/data/snapshot';
import bawaan from '../snapshot.json';
import { cariIstilah, cariPelajaran, daftarKonten, daftarPelajaran, glosarium, pasangSnapshot, snapshotTerpasang } from '../konten/sumber';

test('semua baris snapshot lolos skema (tidak ada yang dibuang)', () => {
  expect(saringValid((bawaan as Snapshot).konten)).toHaveLength((bawaan as Snapshot).konten.length);
});

test('snapshot konsisten dengan KB', () => {
  const baris = saringValid((bawaan as Snapshot).konten).map(({ jenis, slug, isi }) => ({ jenis, slug, isi }));
  expect(periksaKonsistensi(baris)).toEqual([]);
});

test('getter terurut dan bigint terbaca', () => {
  const pelajaran = daftarPelajaran();
  expect(pelajaran.length).toBeGreaterThan(0);
  expect(pelajaran.map(p => p.modul * 100 + p.urutan)).toEqual([...pelajaran].map(p => p.modul * 100 + p.urutan).sort((a, b) => a - b));
  expect(cariPelajaran(pelajaran[0]!.slug)).toBe(pelajaran[0]);
  expect(typeof daftarKonten('soal_hitung')[0]!.kasus.harta).toBe('bigint');
});

test('glosarium KB mendapat Arab dari glosarium_ar', () => {
  const terjemahan = daftarKonten('glosarium_ar');
  for (const isi of terjemahan) expect(glosarium().find(e => e.istilah === isi.istilahId)?.ar?.makna).toBe(isi.makna);
  expect(cariIstilah(glosarium()[0]!.id)).toBe(glosarium()[0]);
});

test('pasangSnapshot mengganti isi getter', () => {
  const asli = snapshotTerpasang();
  pasangSnapshot({ versi: 99, konten: [], diksi: [] });
  expect(daftarPelajaran()).toEqual([]);
  pasangSnapshot(asli);
});
