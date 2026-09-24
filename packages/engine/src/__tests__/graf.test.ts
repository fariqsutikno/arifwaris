import { describe, expect, test } from 'vitest';
import { tambahKerabat, bolehUbahJenisKelamin, opsiRelasi } from '../graf.js';
import { turunkanPeran } from '../stages/derivasi.js';
import { validasiInput } from '../stages/validasi.js';
import type { GrafKeluarga, KunciAhliWaris } from '../types.js';
import { BAB16_FIXTURES, input, p } from './fixtures/bab16.js';

const single = (jenisKelamin: 'L' | 'P'): GrafKeluarga => ({ idPewaris: 'D', orang: { D: p('D', jenisKelamin, { statusHidup: 'wafat' }) }, pernikahan: [] });

describe('opsi relasi mengikuti jenis kelamin', () => {
  test('laki-laki hanya ditawari istri, perempuan hanya suami', () => {
    expect(opsiRelasi(single('L'), 'D')).toEqual(['ayah', 'ibu', 'anakLaki', 'anakPerempuan', 'istri']);
    expect(opsiRelasi(single('P'), 'D')).toEqual(['ayah', 'ibu', 'anakLaki', 'anakPerempuan', 'suami']);
  });

  test('ayah/ibu hanya sekali; suami maksimal 1, istri maksimal 4', () => {
    let g = tambahKerabat(single('P'), 'D', 'ayah', { id: 'F1' });
    g = tambahKerabat(g, 'D', 'suami', { id: 'H1' });
    expect(opsiRelasi(g, 'D')).toEqual(['ibu', 'anakLaki', 'anakPerempuan']);

    let m = single('L');
    for (const id of ['W1', 'W2', 'W3', 'W4']) m = tambahKerabat(m, 'D', 'istri', { id });
    expect(opsiRelasi(m, 'D')).not.toContain('istri');
  });

  test('relasi yang tidak ditawarkan ditolak', () => {
    expect(() => tambahKerabat(single('L'), 'D', 'suami', { id: 'X' })).toThrow(/suami/);
  });
});

describe('tambahKerabat: jenis kelamin dan peran selalu konsisten', () => {
  test('jenis kelamin otomatis dari relasi; anak dihubungkan sesuai jenis kelamin orang tua', () => {
    let g = tambahKerabat(single('P'), 'D', 'suami', { id: 'H1' });
    g = tambahKerabat(g, 'D', 'anakPerempuan', { id: 'B1' }, { otherParentId: 'H1' });
    g = tambahKerabat(g, 'D', 'ibu', { id: 'M1' });
    expect(g.orang['H1']).toMatchObject({ jenisKelamin: 'L' });
    expect(g.orang['B1']).toMatchObject({ jenisKelamin: 'P', idIbu: 'D', idAyah: 'H1' });
    expect(g.orang['D']).toMatchObject({ idIbu: 'M1' });
    expect(g.pernikahan).toEqual([{ idSuami: 'H1', idIstri: 'D', status: 'utuh' }]);
    expect(validasiInput(input(g), turunkanPeran(g, input(g).konfigurasi).daftarPeran)).toEqual([]);
  });

  test('orang tua kedua harus pasangannya', () => {
    expect(() => tambahKerabat(single('L'), 'D', 'anakLaki', { id: 'S1' }, { otherParentId: 'X' })).toThrow(/pasangan/);
  });

  test('jenis kelamin tidak bisa diubah bila sudah punya peran bergender', () => {
    const g = tambahKerabat(tambahKerabat(single('L'), 'D', 'istri', { id: 'W1' }), 'D', 'anakLaki', { id: 'S1' });
    expect(bolehUbahJenisKelamin(g, 'D')).toBe(false);   // suami dan ayah
    expect(bolehUbahJenisKelamin(g, 'W1')).toBe(false);  // istri
    expect(bolehUbahJenisKelamin(g, 'S1')).toBe(true);   // belum punya peran bergender
  });
});

describe('tidak ada salah gender pada peran hasil derivasi', () => {
  const MALE: KunciAhliWaris[] = ['ANAK_LK', 'CUCU_LK', 'AYAH', 'KAKEK', 'SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARA_SEIBU', 'KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK',
    'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK', 'SUAMI', 'MUTIQ'];

  test.each(BAB16_FIXTURES.map(f => [f.id, f] as const))('%s', (_id, fixture) => {
    const { graf, konfigurasi } = fixture.input;
    for (const peran of Object.values(turunkanPeran(graf, konfigurasi).daftarPeran)) {
      if (peran.kunci === 'BUKAN_AHLI_WARIS' || peran.kunci === 'DZAWIL_ARHAM') continue;
      expect(graf.orang[peran.idOrang]!.jenisKelamin, `${peran.idOrang} ${peran.kunci}`).toBe(MALE.includes(peran.kunci) ? 'L' : 'P');
    }
  });
});
