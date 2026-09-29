import { describe, expect, test } from 'vitest';
import { case24 } from '../../__tests__/fixtures/bab16.js';
import { grafDA03, grafDA04, grafDA07 } from '../../__tests__/fixtures/dzawilArham.js';
import { KONFIGURASI_BAWAAN } from '../../types.js';
import { turunkanPeran } from '../derivasi.js';
import { cariRuteTanzil, saringJihah, semuaLintasan } from '../tanzil.js';

const peranDari = (graf: typeof grafDA03) => turunkanPeran(graf, KONFIGURASI_BAWAAN).daftarPeran;

describe('semuaLintasan', () => {
  test('khalah: lintasan melompat dari ibu ke saudarinya, tanpa duplikat lewat kakek/nenek', () => {
    expect(semuaLintasan(case24.input.graf, 'KL1')).toEqual([['D', 'M1', 'KL1']]);
  });
  test('kakek fasid (ayahnya ibu): lintasan leluhur', () => {
    expect(semuaLintasan(grafDA04, 'MGF')).toEqual([['D', 'M1', 'MGF']]);
  });
  test('satu orang dua jalur → dua lintasan', () => {
    expect(semuaLintasan(grafDA07, 'Z').map(l => l.join('>')).sort())
      .toEqual(['D>SI>IZ>Z', 'D>SiK>AZ>Z']);
  });
});

describe('cariRuteTanzil [R14-7]', () => {
  test("khalah → ibu, 'ammah → ayah", () => {
    const graf = case24.input.graf;
    const peran = peranDari(graf);
    expect(cariRuteTanzil(graf, peran, 'KL1')).toMatchObject([{ perantara: 'M1', kunciPerantara: 'IBU', jihah: 'umumah', langkah: 1 }]);
    expect(cariRuteTanzil(graf, peran, 'AM1')).toMatchObject([{ perantara: 'F1', kunciPerantara: 'AYAH', jihah: 'ubuwwah', langkah: 1 }]);
  });
  test('ayahnya ibu → ibu', () => {
    expect(cariRuteTanzil(grafDA04, peranDari(grafDA04), 'MGF')).toMatchObject([{ perantara: 'M1', kunciPerantara: 'IBU' }]);
  });
  test('anak pr dari anak pr dari anak pr: 2 langkah ke anak pr; dari bint ibn ibn: 1 langkah ke cucu pr', () => {
    const peran = peranDari(grafDA03);
    expect(cariRuteTanzil(grafDA03, peran, 'X1')).toMatchObject([{ perantara: 'AP', kunciPerantara: 'ANAK_PR', langkah: 2, jihah: 'bunuwwah' }]);
    expect(cariRuteTanzil(grafDA03, peran, 'X2')).toMatchObject([{ perantara: 'SSD', kunciPerantara: 'CUCU_PR', langkah: 1 }]);
  });
});

describe('saringJihah [R14-10]', () => {
  test('jihah sama: yang lebih dulu sampai menghijab; jejak mencatat penghijabnya', () => {
    const peran = peranDari(grafDA03);
    const rute = [...cariRuteTanzil(grafDA03, peran, 'X1'), ...cariRuteTanzil(grafDA03, peran, 'X2')];
    const hasil = saringJihah(rute);
    expect(hasil.lolos.map(r => r.idOrang)).toEqual(['X2']);
    expect(hasil.jejak).toContainEqual({ tahap: 'dzawilArham', refs: ['R14-7', 'R14-10'], jenis: 'DZAWIL_ARHAM_TERHIJAB_JIHAH', idOrang: 'X1', perantara: 'AP', oleh: ['X2'] });
  });
});
