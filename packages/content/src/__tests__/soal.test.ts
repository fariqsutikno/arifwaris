import { describe, expect, test } from 'vitest';
import { DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, JUDUL_BAB, bacaSoalKuis, cariIstilah, cariRujukan, type Potongan } from '../index.js';

const cekPotongan = (daftar: Potongan[]) => {
  for (const potongan of daftar) {
    if (potongan.jenis === 'rujukan') expect(cariRujukan(potongan.kode), potongan.kode).toBeDefined();
    if (potongan.jenis === 'istilah') expect(cariIstilah(potongan.id), potongan.id).toBeDefined();
  }
};

describe('bank soal', () => {
  test('soal hitung: kode unik, bab ada di KB', () => {
    expect(DAFTAR_SOAL_HITUNG.length).toBeGreaterThan(0);
    expect(new Set(DAFTAR_SOAL_HITUNG.map(soal => soal.kode)).size).toBe(DAFTAR_SOAL_HITUNG.length);
    for (const soal of DAFTAR_SOAL_HITUNG) expect(JUDUL_BAB[soal.bab], soal.kode).toBeDefined();
  });

  test('kuis: kode unik, bab ada, rujukan & istilah valid', () => {
    expect(DAFTAR_SOAL_KUIS.length).toBeGreaterThan(0);
    expect(new Set(DAFTAR_SOAL_KUIS.map(soal => soal.kode)).size).toBe(DAFTAR_SOAL_KUIS.length);
    for (const soal of DAFTAR_SOAL_KUIS) {
      expect(JUDUL_BAB[soal.bab], soal.kode).toBeDefined();
      [soal.pertanyaan, soal.pembahasan, ...soal.pilihan].forEach(cekPotongan);
    }
  });

  test('kuis rusak = galat', () => {
    expect(() => bacaSoalKuis('## K-99\nbab: 1\npertanyaan: a\n- [ ] x\n- [ ] y\npembahasan: b')).toThrow(/tepat satu/);
    expect(() => bacaSoalKuis('## K-99\nbab: 1\n- [x] x\n- [ ] y')).toThrow(/pertanyaan/);
    expect(bacaSoalKuis('## K-99\nbab: 1\npertanyaan: a\n- [ ] x\n- [x] y\npembahasan: b')[0]).toMatchObject({ kode: 'K-99', indeksBenar: 1 });
  });
});
