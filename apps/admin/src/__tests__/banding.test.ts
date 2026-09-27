import { expect, test } from 'vitest';
import { bersihkanMarkdown, bidangBanding, daftarPerubahan } from '../editor/banding';
import { diffKata } from '../editor/diff';
import { ringkasSama } from '../layar/Perbandingan';
import { DAFTAR_FAQ_UJI } from './contoh';

const FAQ = { ...DAFTAR_FAQ_UJI[0]!, pertanyaan: 'Apa itu tirkah?' };

test('bidang berlabel form, rujukan jadi klaim; hanya bidang yang berubah', () => {
  const lama = bidangBanding('faq', FAQ, ['R09-7']);
  expect(lama.map(b => b.label)).toEqual(['Pertanyaan', 'Jawaban', 'Kelompok', 'Alamat tautan', 'Rujukan dalil']);
  expect(lama.at(-1)!.teks).toBe('Cara pembagian radd');
  const baru = bidangBanding('faq', { ...FAQ, pertanyaan: 'Apa itu tirkah menurut fikih?' }, ['R09-7']);
  const perubahan = daftarPerubahan(lama, baru);
  expect(perubahan.map(p => p.label)).toEqual(['Pertanyaan']);
  expect(perubahan[0]!.potongan).toEqual([
    { jenis: 'sama', teks: 'Apa itu ' }, { jenis: 'hapus', teks: 'tirkah?' }, { jenis: 'tambah', teks: 'tirkah menurut fikih?' },
  ]);
});

test('entri baru: semua bidang terisi tampil sebagai tambah', () => {
  const perubahan = daftarPerubahan(null, bidangBanding('faq', FAQ, []));
  expect(perubahan.every(p => p.potongan.every(b => b.jenis === 'tambah'))).toBe(true);
});

test('isi tak terbaca tetap ditampilkan sebagai bidang Isi', () => {
  expect(bidangBanding('faq', { rusak: true }, [])[0]!.label).toBe('Isi');
});

test('Markdown dibersihkan: dalil jadi klaim, istilah jadi teks tampil', () => {
  expect(bersihkanMarkdown('Ia [[ashabah|mengambil sisa]] [R09-7].')).toBe('Ia mengambil sisa (dalil: Cara pembagian radd).');
});

test('diffKata menggabung potongan sejenis; ringkasSama memotong teks sama yang panjang', () => {
  expect(diffKata('a b c', 'a x y c')).toEqual([{ jenis: 'sama', teks: 'a ' }, { jenis: 'hapus', teks: 'b ' }, { jenis: 'tambah', teks: 'x y ' }, { jenis: 'sama', teks: 'c' }]);
  const panjang = Array.from({ length: 100 }, (_, i) => `k${i}`).join(' ');
  const [awal] = ringkasSama([{ jenis: 'sama', teks: panjang }, { jenis: 'tambah', teks: 'baru' }]);
  expect(awal!.teks.startsWith(' … ')).toBe(true);
  expect(awal!.teks.length).toBeLessThan(panjang.length);
});
