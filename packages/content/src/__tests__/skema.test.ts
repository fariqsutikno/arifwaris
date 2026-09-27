// packages/content/src/__tests__/skema.test.ts
import { describe, expect, test } from 'vitest';
import { bacaIsi, keJson, type IsiKonten, type JenisKonten } from '../index.js';
import {
  CONTOH_FAQ, CONTOH_MODUL, CONTOH_PELAJARAN, CONTOH_SOAL_HITUNG, CONTOH_SOAL_KUIS, CONTOH_SYAHID, CONTOH_TANYA_JAWAB,
} from './contoh.js';

const bolakBalik = <J extends JenisKonten>(jenis: J, isi: IsiKonten[J]) => {
  const json = JSON.parse(JSON.stringify(keJson(jenis, isi)));
  const hasil = bacaIsi(jenis, json);
  if (!hasil.ok) throw new Error(`${jenis}: ${hasil.galat}`);
  expect(hasil.isi).toEqual(isi);
};

describe('skema isi konten', () => {
  test('tiap jenis lolos dan bolak-balik JSON tanpa berubah (termasuk bigint)', () => {
    bolakBalik('modul', CONTOH_MODUL);
    bolakBalik('materi', CONTOH_PELAJARAN);
    bolakBalik('soal_kuis', CONTOH_SOAL_KUIS);
    bolakBalik('soal_hitung', CONTOH_SOAL_HITUNG);
    bolakBalik('tanya_jawab', CONTOH_TANYA_JAWAB);
    bolakBalik('faq', CONTOH_FAQ);
    bolakBalik('kitab', { judul: 'Raudhah', tautan: 'https://contoh.org' });
    bolakBalik('syahid', CONTOH_SYAHID);
  });

  test('bigint disimpan sebagai string digit', () => {
    const soal = CONTOH_SOAL_HITUNG;
    const json = keJson('soal_hitung', soal) as { kasus: { harta: unknown } };
    expect(json.kasus.harta).toBe(soal.kasus.harta.toString());
  });

  test('isi rusak ditolak dengan pesan, tidak melempar', () => {
    expect(bacaIsi('faq', { id: 'x' }).ok).toBe(false);
    expect(bacaIsi('soal_hitung', { ...keJson('soal_hitung', CONTOH_SOAL_HITUNG) as object, kasus: { harta: '12a' } }).ok).toBe(false);
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
