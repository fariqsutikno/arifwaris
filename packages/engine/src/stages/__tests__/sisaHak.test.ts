// Tahap 6b — sisa hak (bab 11.3 [KH]): contoh KB 11.1/11.3 sebagai regression, invarian sebagai property.
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { case02 } from '../../__tests__/fixtures/bab16.js';
import { hitung } from '../../pipeline.js';
import type { HasilEngine, InputEngine } from '../../types.js';
import { hitungSisaHak } from '../sisaHak.js';
import { hitungTirkah } from '../tirkah.js';

type Ok = Extract<HasilEngine, { status: 'OK' }>;
const JUTA = 1_000_000n;

// Bab 11.1: suami, ibu, ayah; tirkah bersih Rp 120 jt → suami 60, ibu 20, ayah 40.
function kasusUmariyyah(satuan = 1n): { hasil: Ok; bersih: bigint } {
  const masukan: InputEngine = { ...case02.input, tirkah: { kotor: 120n * JUTA, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan } };
  const hasil = hitung(masukan);
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return { hasil, bersih: hitungTirkah(masukan.tirkah).bersih };
}

describe('hitungSisaHak', () => {
  test('contoh bab 11.3: suami sudah menerima 30 jt → sisa 30 / 20 / 40, sisa kas 90 jt', () => {
    const { hasil, bersih } = kasusUmariyyah();
    const sisa = hitungSisaHak(hasil, bersih, { H1: 30n * JUTA });
    if (sisa.status !== 'OK') throw new Error(sisa.status);
    expect(sisa.perOrang['H1']).toEqual({ nominal: 60n * JUTA, sudahDiterima: 30n * JUTA, sisaHak: 30n * JUTA });
    expect(sisa.perOrang['M1']!.sisaHak).toBe(20n * JUTA);
    expect(sisa.perOrang['F1']!.sisaHak).toBe(40n * JUTA);
    expect(sisa.sisaKas).toBe(90n * JUTA);
    expect(sisa.kelebihan).toEqual([]);
    expect(sisa.kasKurang).toBe(false);
  });

  test('tanpa sudahDiterima = nominal apa adanya', () => {
    const { hasil, bersih } = kasusUmariyyah();
    const sisa = hitungSisaHak(hasil, bersih, {});
    if (sisa.status !== 'OK') throw new Error(sisa.status);
    expect(sisa.sisaKas).toBe(bersih);
    expect(sisa.perOrang['F1']!.sisaHak).toBe(40n * JUTA);
  });

  test('kelebihan: ayah menerima 70 jt (bagian 40) → sisa hak negatif, kas 50 jt < Σ sisa hak positif 80 jt', () => {
    const { hasil, bersih } = kasusUmariyyah();
    const sisa = hitungSisaHak(hasil, bersih, { F1: 70n * JUTA });
    if (sisa.status !== 'OK') throw new Error(sisa.status);
    expect(sisa.perOrang['F1']!.sisaHak).toBe(-30n * JUTA);
    expect(sisa.kelebihan).toEqual(['F1']);
    expect(sisa.sisaKas).toBe(50n * JUTA);
    expect(sisa.kasKurang).toBe(true);
  });

  test('uji negatif: jumlah diterima melebihi tirkah → PERLU_INPUT sudahDiterima', () => {
    const { hasil, bersih } = kasusUmariyyah();
    const sisa = hitungSisaHak(hasil, bersih, { H1: 100n * JUTA, M1: 30n * JUTA });
    expect(sisa.status).toBe('PERLU_INPUT');
    if (sisa.status === 'PERLU_INPUT') expect(sisa.pertanyaan[0]!.isian).toBe('sudahDiterima');
  });

  test('uji negatif: nilai negatif atau orang bukan ahli waris → PERLU_INPUT', () => {
    const { hasil, bersih } = kasusUmariyyah();
    expect(hitungSisaHak(hasil, bersih, { H1: -1n }).status).toBe('PERLU_INPUT');
    const asing = hitungSisaHak(hasil, bersih, { TIDAK_ADA: 1n });
    expect(asing.status).toBe('PERLU_INPUT');
    if (asing.status === 'PERLU_INPUT') expect(asing.pertanyaan[0]!.idOrang).toBe('TIDAK_ADA');
  });

  test('property: Σ sisaHak + sisaLainnya = sisaKas untuk sembarang penerimaan sah (tashih/pembulatan 1000)', () => {
    const { hasil, bersih } = kasusUmariyyah(1000n);
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 40 }), fc.integer({ min: 0, max: 40 }), fc.integer({ min: 0, max: 40 }),
      (suami, ibu, ayah) => {
        const sisa = hitungSisaHak(hasil, bersih, { H1: BigInt(suami) * JUTA, M1: BigInt(ibu) * JUTA, F1: BigInt(ayah) * JUTA });
        if (sisa.status !== 'OK') return false;
        const jumlahSisa = Object.values(sisa.perOrang).reduce((a, b) => a + b.sisaHak, 0n);
        return jumlahSisa + sisa.sisaLainnya === sisa.sisaKas;
      },
    ));
  });
});
