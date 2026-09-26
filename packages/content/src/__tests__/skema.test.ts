// packages/content/src/__tests__/skema.test.ts
import { describe, expect, test } from 'vitest';
import {
  DAFTAR_FAQ, DAFTAR_MODUL, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, DAFTAR_SYAHID, DAFTAR_TANYA_JAWAB,
  SUMBER_KITAB, bacaIsi, keJson, type IsiKonten, type JenisKonten,
} from '../index.js';

const bolakBalik = <J extends JenisKonten>(jenis: J, isi: IsiKonten[J]) => {
  const json = JSON.parse(JSON.stringify(keJson(jenis, isi)));
  const hasil = bacaIsi(jenis, json);
  if (!hasil.ok) throw new Error(`${jenis}: ${hasil.galat}`);
  expect(hasil.isi).toEqual(isi);
};

describe('skema isi konten', () => {
  test('semua konten sekarang lolos dan bolak-balik JSON tanpa berubah (termasuk bigint)', () => {
    DAFTAR_MODUL.forEach(isi => bolakBalik('modul', isi));
    DAFTAR_PELAJARAN.forEach(isi => bolakBalik('materi', isi));
    DAFTAR_SOAL_KUIS.forEach(isi => bolakBalik('soal_kuis', isi));
    DAFTAR_SOAL_HITUNG.forEach(isi => bolakBalik('soal_hitung', isi));
    DAFTAR_TANYA_JAWAB.forEach(isi => bolakBalik('tanya_jawab', isi));
    DAFTAR_FAQ.forEach(isi => bolakBalik('faq', isi));
    SUMBER_KITAB.forEach(isi => bolakBalik('kitab', isi));
    DAFTAR_SYAHID.forEach(isi => bolakBalik('syahid', isi));
  });

  test('bigint disimpan sebagai string digit', () => {
    const soal = DAFTAR_SOAL_HITUNG[0]!;
    const json = keJson('soal_hitung', soal) as { kasus: { harta: unknown } };
    expect(json.kasus.harta).toBe(soal.kasus.harta.toString());
  });

  test('isi rusak ditolak dengan pesan, tidak melempar', () => {
    expect(bacaIsi('faq', { id: 'x' }).ok).toBe(false);
    expect(bacaIsi('soal_hitung', { ...keJson('soal_hitung', DAFTAR_SOAL_HITUNG[0]!) as object, kasus: { harta: '12a' } }).ok).toBe(false);
    expect(bacaIsi('cheatsheet', { judul: 'A', deskripsi: '', tautan: 'bukan-url' }).ok).toBe(false);
  });

  test('jenis baru kecil', () => {
    expect(bacaIsi('teks_edukasi', { id: 'Tabungan & kas' }).ok).toBe(true);
    expect(bacaIsi('ahwal', { kunci: 'SUAMI', baris: [{ bagian: '1/2', syarat: 'x', cocok: { fardh: '1/2' } }] }).ok).toBe(true);
    expect(bacaIsi('ahwal', { kunci: 'SUAMI', baris: [{ bagian: '1/2', syarat: 'x', cocok: { fardh: null } }] }).ok).toBe(true);
    expect(bacaIsi('cheatsheet', { judul: 'Peta hajb', deskripsi: '', tautan: null }).ok).toBe(true);
    expect(bacaIsi('glosarium_ar', { istilahId: 'ashabah', makna: 'عصبة' }).ok).toBe(true);
  });
});
