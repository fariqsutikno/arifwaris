// Tes perender FormKonten: soal kuis (tambah/hapus pilihan, jawaban benar), ahwal (tambah baris, cocok tiga keadaan),
// sakelar Versi Arab, dan mode baca. Nilai diperiksa lewat dariNilaiForm supaya yang diuji = isi yang akan disimpan.
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import type { JenisKonten } from '@waris/content';
import { dariNilaiForm, keNilaiForm, nilaiFormKosong, type NilaiForm } from '../editor/nilaiForm';
import { FormKonten } from '../layar/FormKonten';

const OPSI = { modul: [], kelompokFaq: [], istilah: [] };
let terakhir: NilaiForm;

function Uji({ jenis, awal, bacaSaja = false }: { jenis: JenisKonten; awal: NilaiForm; bacaSaja?: boolean }) {
  const [form, setForm] = useState(awal);
  terakhir = form;
  return <FormKonten jenis={jenis} form={form} saatUbah={setForm} bacaSaja={bacaSaja} galatBidang={{}} opsi={OPSI} />;
}
const ketik = (label: string, nilai: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: nilai } });
/** Bidang blok/potongan memakai editor rich text; tes mengetik lewat mode Markdown-nya. */
function ketikMarkdown(label: string, nilai: string) {
  fireEvent.click(screen.getByRole('button', { name: `Sunting ${label} sebagai Markdown` }));
  ketik(`${label} (Markdown)`, nilai);
}

test('soal kuis: tambah pilihan, pilih benar, hapus pilihan menggeser indeks benar', () => {
  render(<Uji jenis="soal_kuis" awal={nilaiFormKosong('soal_kuis')} />);
  ketik('Kode soal', 'K-1');
  ketik('Bab', '4');
  ketikMarkdown('Pilihan A', '1/2');
  ketikMarkdown('Pilihan B', '1/4');
  fireEvent.click(screen.getByRole('button', { name: '+ Tambah pilihan' }));
  ketikMarkdown('Pilihan C', '1/8');
  fireEvent.click(screen.getByLabelText('Pilihan C jawaban benar'));
  fireEvent.click(screen.getByRole('button', { name: 'Hapus pilihan A' }));
  const hasil = dariNilaiForm('soal_kuis', 'x', terakhir);
  expect(hasil).toMatchObject({ ok: true, isi: { indeksBenar: 1, pilihan: [[{ teks: '1/4' }], [{ teks: '1/8' }]] } });
});

test('ahwal: tambah baris, fardh "-" = tanpa fardh, ashabah ya', () => {
  render(<Uji jenis="ahwal" awal={nilaiFormKosong('ahwal')} />);
  ketik('Ahli waris', 'IBU');
  fireEvent.click(screen.getByRole('button', { name: 'Tambah baris' }));
  ketik('Bagian', 'Sisa');
  ketik('Syarat', 'tidak ada anak');
  ketik('Fardh', '-');
  ketik('Ashabah', 'ya');
  expect(dariNilaiForm('ahwal', 'x', terakhir)).toEqual({ ok: true, isi: {
    kunci: 'IBU', baris: [{ bagian: 'Sisa', syarat: 'tidak ada anak', cocok: { fardh: null, ashabah: true } }],
  } });
});

test('sakelar Versi Arab menampilkan bidang Arab rtl', () => {
  render(<Uji jenis="modul" awal={keNilaiForm('modul', { nomor: 1, judul: 'J', ringkas: 'r' })} />);
  expect(screen.queryByLabelText('Judul modul (Arab)')).toBeNull();
  fireEvent.click(screen.getByLabelText('Ada versi arab'));
  expect(screen.getByLabelText('Judul modul (Arab)').getAttribute('dir')).toBe('rtl');
  ketik('Judul modul (Arab)', 'مقدمة');
  ketik('Ringkasan (Arab)', 'ر');
  expect(dariNilaiForm('modul', 'x', terakhir)).toEqual({ ok: true, isi: { nomor: 1, judul: 'J', ringkas: 'r', ar: { judul: 'مقدمة', ringkas: 'ر' } } });
});

test('mode baca: input readOnly, tanpa tombol tambah', () => {
  render(<Uji jenis="soal_kuis" awal={nilaiFormKosong('soal_kuis')} bacaSaja />);
  expect((screen.getByLabelText('Kode soal') as HTMLInputElement).readOnly).toBe(true);
  expect(screen.queryByRole('button', { name: 'Tambah pilihan' })).toBeNull();
});

test('soal kuis: penjelasan per pilihan opsional; bila dinyalakan, kenapa benar ditulis di bawah pilihan benar dan pilihan salah wajib diisi', () => {
  render(<Uji jenis="soal_kuis" awal={nilaiFormKosong('soal_kuis')} />);
  ketik('Kode soal', 'K-1');
  ketik('Bab', '4');
  ketikMarkdown('Pilihan A', '1/2');
  ketikMarkdown('Pilihan B', '1/4');
  ketikMarkdown('Kenapa jawaban ini benar', 'Karena ada anak.');
  expect(dariNilaiForm('soal_kuis', 'x', terakhir)).toMatchObject({ ok: true, isi: { pembahasan: [{ teks: 'Karena ada anak.' }] } });
  expect((dariNilaiForm('soal_kuis', 'x', terakhir) as { isi: object }).isi).not.toHaveProperty('alasanPilihan');
  fireEvent.click(screen.getByLabelText('Jelaskan tiap pilihan'));
  // A = jawaban benar (bawaan): "Kenapa A benar" = kotak pembahasan yang sama, pindah ke bawah pilihan A (tidak dua kali).
  expect(screen.getByText('Kenapa A benar')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'Sunting Kenapa jawaban ini benar sebagai Markdown' })).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Sunting Penjelasan pilihan A sebagai Markdown' })).toBeNull();
  const belumLengkap = dariNilaiForm('soal_kuis', 'x', terakhir);
  expect(!belumLengkap.ok && belumLengkap.galatBidang.pilihan).toMatch(/Penjelasan pilihan B belum diisi/);
  ketikMarkdown('Penjelasan pilihan B', 'Itu bagian bila tanpa anak.');
  expect(dariNilaiForm('soal_kuis', 'x', terakhir)).toMatchObject({ ok: true, isi: { alasanPilihan: [[{ teks: 'Karena ada anak.' }], [{ teks: 'Itu bagian bila tanpa anak.' }]] } });
});
