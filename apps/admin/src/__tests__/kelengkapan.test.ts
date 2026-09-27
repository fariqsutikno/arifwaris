import { expect, test } from 'vitest';
import { daftarKelengkapan } from '../editor/kelengkapan';
import { keNilaiForm, nilaiFormKosong } from '../editor/nilaiForm';

test('bidang wajib tanpa identitas & bagian Arab yang mati; status kosong / salah / benar', () => {
  const form = nilaiFormKosong('modul');
  expect(daftarKelengkapan('modul', form, {}, null).map(b => [b.label, b.status])).toEqual([
    ['Judul modul', 'kosong'], ['Ringkasan', 'kosong'],
  ]);
  const terisi = keNilaiForm('modul', { nomor: 1, judul: 'J', ringkas: 'r' });
  expect(daftarKelengkapan('modul', terisi, { judul: 'terlalu pendek' }, null).map(b => b.status)).toEqual(['salah', 'benar']);
  expect(daftarKelengkapan('modul', { ...terisi, aktif: { ar: true } }, {}, null)).toHaveLength(4);
});

test('rujukan ikut dinilai bila wajib', () => {
  expect(daftarKelengkapan('kitab', nilaiFormKosong('kitab'), {}, true).at(-1)).toEqual({ jalur: 'refs', label: 'Rujukan dalil', status: 'kosong' });
});
