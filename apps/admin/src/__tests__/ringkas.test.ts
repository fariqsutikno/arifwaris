import { expect, test } from 'vitest';
import type { RingkasanEntri, RingkasanRevisi, } from '@waris/data';
import {
  bacaSaring, indeksSeret, jumlahPerTab, kelompokkanPerModul, pindahkan, ringkasBeranda, SARING_AWAL, saringDaftar, terapkanSaring,
  tulisSaring, urutkan, waktuRelatif,
} from '../ringkas';

function entri(id: string, sisa: { status?: RingkasanRevisi['status'] | null; terbit?: boolean; oleh?: string; isi?: unknown;
  refs?: string[]; pada?: string; catatan?: string } = {}): RingkasanEntri {
  const revisiTerakhir = sisa.status === null ? null : {
    id: `r-${id}`, entriId: id, status: sisa.status ?? 'draf', refs: sisa.refs ?? [], isi: sisa.isi ?? {},
    dibuatOleh: sisa.oleh ?? 'u1', diperiksaOleh: null, catatanReview: sisa.catatan ?? null,
    dibuatPada: sisa.pada ?? '2026-09-27T00:00:00.000Z', diperiksaPada: null,
  } satisfies RingkasanRevisi;
  const revisiTerbitId = sisa.terbit ? (sisa.status === 'disetujui' ? `r-${id}` : `lama-${id}`) : null;
  return { entriId: id, jenis: 'faq', slug: id, urutan: 0, revisiTerbitId, revisiTerakhir };
}

test('jumlahPerTab: terbit + draf dihitung di Draf dan Terbit', () => {
  const daftar = [entri('a', { status: 'disetujui', terbit: true }), entri('b', { status: 'draf', terbit: true }),
    entri('c', { status: 'diajukan' }), entri('d', { status: 'dikembalikan' })];
  expect(jumlahPerTab(daftar)).toEqual({ semua: 4, draf: 1, diajukan: 1, dikembalikan: 1, terbit: 2 });
});

test('saringDaftar: cari judul, slug, atau ref tanpa beda huruf besar', () => {
  const daftar = [entri('apa-itu-tirkah', { isi: { pertanyaan: 'Apa itu tirkah?' } }), entri('radd', { refs: ['R09-7'] })];
  expect(saringDaftar(daftar, 'semua', 'TIRKAH').map(e => e.slug)).toEqual(['apa-itu-tirkah']);
  expect(saringDaftar(daftar, 'semua', 'r09').map(e => e.slug)).toEqual(['radd']);
  expect(saringDaftar(daftar, 'diajukan', '')).toEqual([]);
});

test('kelompokkanPerModul: urut nomor modul, modul kosong tetap tampil, modul tak dikenal ke "Tanpa modul"', () => {
  const modul = [entri('m2', { isi: { nomor: 2, judul: 'Ashabah' } }), entri('m1', { isi: { nomor: 1, judul: 'Pengantar' } })];
  const materi = [entri('x', { isi: { modul: 1, judul: 'X' } }), entri('y', { isi: { modul: 7, judul: 'Y' } }),
    entri('z', { status: null })];
  const grup = kelompokkanPerModul(materi, modul);
  expect(grup.map(g => [g.nomor, g.judul, g.materi.map(e => e.slug)])).toEqual([
    [1, 'Pengantar', ['x']], [2, 'Ashabah', []], [null, 'Tanpa modul', ['y', 'z']],
  ]);
});

test('kelompokkanPerModul: nomor & judul modul dari revisi terbit, bukan draf', () => {
  const modul = [entri('m1', { isi: { nomor: 9, judul: 'Draf baru' } })];
  const materi = [entri('x', { isi: { modul: 1, judul: 'X' } })];
  const grup = kelompokkanPerModul(materi, modul, new Map([[modul[0]!.entriId, { nomor: 1, judul: 'Pengantar' }]]));
  expect(grup.map(g => [g.nomor, g.judul, g.materi.map(e => e.slug)])).toEqual([[1, 'Pengantar', ['x']]]);
});

test('ringkasBeranda: antrean diksi ikut dihitung di "Menunggu review" (sama dengan lencana)', () => {
  expect(ringkasBeranda([entri('d', { status: 'diajukan', oleh: 'lain' })], 'u1', 2).menungguReview).toBe(3);
});

test('ringkasBeranda: angka milik saya & antrean, lanjutkan terbaru dulu maks 8', () => {
  const semua = [
    entri('a', { status: 'draf', pada: '2026-09-27T01:00:00.000Z' }),
    entri('b', { status: 'dikembalikan', pada: '2026-09-27T03:00:00.000Z' }),
    entri('c', { status: 'draf', oleh: 'lain' }),
    entri('d', { status: 'diajukan', oleh: 'lain', pada: '2026-09-26T00:00:00.000Z' }),
    entri('e', { status: 'disetujui', terbit: true }),
    ...Array.from({ length: 9 }, (_, i) => entri(`f${i}`, { status: 'draf', pada: '2026-09-20T00:00:00.000Z' })),
  ];
  const hasil = ringkasBeranda(semua, 'u1');
  expect(hasil).toMatchObject({ drafSaya: 10, menungguReview: 1, dikembalikanKeSaya: 1, terbit: 1 });
  expect(hasil.lanjutkan).toHaveLength(8);
  expect(hasil.lanjutkan.slice(0, 2).map(e => e.slug)).toEqual(['b', 'a']);
  expect(hasil.antreanTertua.map(e => e.slug)).toEqual(['d']);
});

test('pindahkan: tidak memutasi, indeks di luar batas → salinan sama', () => {
  const awal = ['a', 'b', 'c'];
  expect(pindahkan(awal, 0, 2)).toEqual(['b', 'c', 'a']);
  expect(pindahkan(awal, 2, 0)).toEqual(['c', 'a', 'b']);
  expect(pindahkan(awal, 0, 5)).toEqual(['a', 'b', 'c']);
  expect(awal).toEqual(['a', 'b', 'c']);
});

test('waktuRelatif', () => {
  const sekarang = new Date('2026-09-27T12:00:00Z');
  expect(waktuRelatif('2026-09-27T11:59:30Z', sekarang)).toBe('baru saja');
  expect(waktuRelatif('2026-09-27T10:00:00Z', sekarang)).toBe('2 jam yang lalu');
  expect(waktuRelatif('2026-09-26T12:00:00Z', sekarang)).toBe('kemarin');
});

test('indeksSeret: posisi asal & tujuan, null bila tak berpindah', () => {
  expect(indeksSeret(['a', 'b', 'c'], 'a', 'c')).toEqual([0, 2]);
  expect(indeksSeret(['a', 'b', 'c'], 'c', 'a')).toEqual([2, 0]);
  expect(indeksSeret(['a', 'b'], 'a', 'a')).toBeNull();
  expect(indeksSeret(['a', 'b'], 'a', null)).toBeNull();
  expect(indeksSeret(['a', 'b'], 'a', 'x')).toBeNull();
});

test('bacaSaring/tulisSaring: bolak-balik, bawaan tidak ditulis, nilai asing diabaikan', () => {
  const saring = { ...SARING_AWAL, status: 'draf' as const, cari: 'ibu', urut: 'judul' as const, milikSaya: true, bidang: { bab: '4' } };
  expect(tulisSaring(saring)).toEqual({ status: 'draf', cari: 'ibu', urut: 'judul', milik: '1', bab: '4' });
  expect(bacaSaring(tulisSaring(saring))).toEqual(saring);
  expect(tulisSaring(SARING_AWAL)).toEqual({});
  expect(bacaSaring({ status: 'ngawur', urut: 'acak', lain: 'x' })).toEqual(SARING_AWAL);
});

test('terapkanSaring: milik saya, bidang isi, perlu dicek', () => {
  const daftar = [
    entri('a', { oleh: 'u1', isi: { bab: 4, perluCek: true } }),
    entri('b', { oleh: 'u2', isi: { bab: 4 } }),
    entri('c', { oleh: 'u1', isi: { bab: 9 } }),
  ];
  const slug = (hasil: RingkasanEntri[]) => hasil.map(e => e.slug);
  expect(slug(terapkanSaring(daftar, { ...SARING_AWAL, milikSaya: true }, 'u1'))).toEqual(['a', 'c']);
  expect(slug(terapkanSaring(daftar, { ...SARING_AWAL, bidang: { bab: '4' } }, 'u1'))).toEqual(['a', 'b']);
  expect(slug(terapkanSaring(daftar, { ...SARING_AWAL, perluCek: true }, 'u1'))).toEqual(['a']);
});

test('urutkan: manual apa adanya; diubah terbaru dulu; judul alfabet dengan angka alami; status dikembalikan dulu', () => {
  const daftar = [
    entri('b', { isi: { judul: 'Soal 10' }, pada: '2026-01-01T00:00:00Z', status: 'disetujui', terbit: true }),
    entri('a', { isi: { judul: 'Soal 2' }, pada: '2026-03-01T00:00:00Z', status: 'dikembalikan' }),
    entri('c', { isi: { judul: 'soal 1' }, pada: '2026-02-01T00:00:00Z' }),
  ];
  const slug = (hasil: RingkasanEntri[]) => hasil.map(e => e.slug);
  expect(slug(urutkan(daftar, 'manual'))).toEqual(['b', 'a', 'c']);
  expect(slug(urutkan(daftar, 'diubah'))).toEqual(['a', 'c', 'b']);
  expect(slug(urutkan(daftar, 'judul'))).toEqual(['c', 'a', 'b']);
  expect(slug(urutkan(daftar, 'status'))).toEqual(['a', 'c', 'b']);
});
