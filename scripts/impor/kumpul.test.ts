// scripts/impor/kumpul.test.ts
import { expect, test } from 'vitest';
import { DAFTAR_FAQ, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, JENIS_FIKIH, bacaIsi, keJson } from '@waris/content';
import peta from '../diksi/peta.json';
import { kumpulkanKontenLama, kunciRefsManual } from './kumpul';

const { baris, galat } = kumpulkanKontenLama(peta, {});
const jumlah = (jenis: string) => baris.filter(b => b.jenis === jenis).length;

test('jumlah per jenis = jumlah di berkas lama', () => {
  expect(jumlah('materi')).toBe(DAFTAR_PELAJARAN.length);
  expect(jumlah('soal_kuis')).toBe(DAFTAR_SOAL_KUIS.length);
  expect(jumlah('soal_hitung')).toBe(DAFTAR_SOAL_HITUNG.length);
  expect(jumlah('faq')).toBe(DAFTAR_FAQ.length);
  expect(jumlah('teks_edukasi')).toBe(peta.edukasi.length + 12); // + 6 langkah selanjutnya × (judul, isi)
  expect(jumlah('cheatsheet')).toBe(4);
  expect(jumlah('ahwal')).toBeGreaterThan(0);
});

test('slug unik per jenis; semua isi lolos Zod setelah keJson', () => {
  const kunci = baris.map(b => `${b.jenis}/${b.slug}`);
  expect(new Set(kunci).size).toBe(kunci.length);
  for (const b of baris) expect(bacaIsi(b.jenis, keJson(b.jenis, b.isi)).ok, `${b.jenis}/${b.slug}`).toBe(true);
});

test('ref diambil dari isi; entri fikih tanpa ref dilaporkan, bukan dikarang', () => {
  const materi = baris.find(b => b.jenis === 'materi')!;
  expect(materi.refs.length).toBeGreaterThan(0);
  const tanpaRef = baris.filter(b => JENIS_FIKIH.includes(b.jenis) && b.refs.length === 0);
  for (const b of tanpaRef) expect(galat).toContain(`${kunciRefsManual(b.jenis, b.slug)}: jenis fikih tanpa ref, isi di refs-manual.json`);
});

test('refs manual digabung; ref manual yang tak dikenal KB dilaporkan', () => {
  const soal = baris.find(b => b.jenis === 'soal_hitung')!;
  const hasil = kumpulkanKontenLama(peta, { [kunciRefsManual('soal_hitung', soal.slug)]: ['R09-7', 'R99-9'] });
  expect(hasil.baris.find(b => b.jenis === 'soal_hitung' && b.slug === soal.slug)!.refs).toEqual(['R09-7', 'R99-9']);
  expect(hasil.galat.join('\n')).toMatch(/R99-9/);
});

test('draf: semua perluCek kecuali modul, kitab, cheatsheet', () => {
  for (const b of baris) expect(b.perluCek, b.jenis).toBe(!['modul', 'kitab', 'cheatsheet'].includes(b.jenis));
});

test('ahwal membawa Arab dari kamus', () => {
  const suami = baris.find(b => b.jenis === 'ahwal' && b.slug === 'SUAMI')!.isi as { baris: { ar?: unknown }[] };
  expect(suami.baris[0]!.ar).toBeDefined();
});
