import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import { hitungTaqdir, KONFIGURASI_BAWAAN, type GrafKeluarga, type Orang } from '@waris/engine';
import { nilaiSemuaKolom, pilihJangkar, susunTabelSoal, type IsianTabel, type TabelSoal } from '../index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });

// KB 13b.6 F1: pewaris D, ibu I, saudara kandung S, saudara kandung Q mafqud (seayah A, seibu W).
const graf: GrafKeluarga = { idPewaris: 'D', pernikahan: [], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }), A: orang('A', 'L', { statusHidup: 'wafat' }), I: orang('I', 'P'),
  W: orang('W', 'P', { statusHidup: 'wafat' }),
  S: orang('S', 'L', { idAyah: 'A', idIbu: 'W' }), Q: orang('Q', 'L', { idAyah: 'A', idIbu: 'W', statusHidup: 'mafqud' }) } };

const hasil = hitungTaqdir({ graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n },
  konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' });
const susunan = susunTabelSoal(hasil, id => id);
if ('status' in susunan) throw new Error(susunan.status);
const tabel: TabelSoal = susunan;

const isianKunci = (): IsianTabel => ({
  kepala: Object.fromEntries(tabel.kolom.filter(kolom => kolom.kepala !== undefined).map(kolom => [kolom.id, String(kolom.kepala)])),
  sel: Object.fromEntries(tabel.baris.map(baris => [baris.id, { ...baris.kunci }])),
  pengali: Object.fromEntries(Object.entries(tabel.pengali!.kunci).map(([id, nilai]) => [id, String(nilai)])),
});

describe('susunTabelMafqud — KB 13b.6 F1', () => {
  test('kolom: Bagian · hidup, mas\'alah 12 · Bagian · mati, mas\'alah 3 · Jami\'ah 12; pengali 1 dan 4', () => {
    expect(tabel.kolom.map(kolom => [kolom.id, kolom.idJudul, kolom.kepala, kolom.kemungkinan])).toEqual([
      ['b1', 'bagianKemungkinan', undefined, 'hidup'], ['m1', 'sahamKemungkinan', 12n, 'hidup'],
      ['b2', 'bagianKemungkinan', undefined, 'mati'], ['m2', 'sahamKemungkinan', 3n, 'mati'],
      ['jamiah', 'jamiahSekarang', 12n, undefined]]);
    expect(tabel.pengali!.kunci).toEqual({ m1: 1n, m2: 4n });
  });

  test('baris: ibu 1/6 2 → 1/3 1 → 2; saudara Ashabah 5 → Ashabah 2 → 5; mafqud hanya dunia hidup; Ditahan 5', () => {
    expect(tabel.baris.map(baris => [baris.id, baris.kunci])).toEqual([
      ['I', { b1: '1/6', m1: '2', b2: '1/3', m2: '1', jamiah: '2' }],
      ['S', { b1: 'Ashabah', m1: '5', b2: 'Ashabah', m2: '2', jamiah: '5' }],
      ['Q', { b1: 'Ashabah', m1: '5' }],
      ['mauquf', { jamiah: '5' }]]);
  });

  test('isian = kunci: semua kolom benar, pengali terakhir dan benar', () => {
    const hasilKolom = nilaiSemuaKolom(tabel, isianKunci(), null);
    expect(hasilKolom.every(kolom => kolom.status === 'benar')).toBe(true);
    expect(hasilKolom.at(-1)!.idKolom).toBe('pengali');
  });

  test('kepala kelipatan (mas\'alah 24, jami\'ah 24): pengali diturunkan dari kepala isian, tetap benar', () => {
    const isian = isianKunci();
    isian.kepala = { m1: '24', m2: '6', jamiah: '24' };
    for (const baris of tabel.baris) for (const id of ['m1', 'm2', 'jamiah']) if (isian.sel[baris.id]![id]) isian.sel[baris.id]![id] = String(BigInt(isian.sel[baris.id]![id]!) * 2n);
    expect(nilaiSemuaKolom(tabel, isian, null).every(kolom => kolom.status === 'benar')).toBe(true);
  });

  test('jangkar 100 kali tidak pernah di kolom pilihan, kepala, pengali, atau sel Ditahan', () => {
    fc.assert(fc.property(fc.integer(), (benih) => {
      const jangkar = pilihJangkar(tabel, () => Math.abs(Math.sin(benih)) % 1);
      expect(jangkar === null || (jangkar.idBaris !== 'mauquf' && tabel.kolom.find(kolom => kolom.id === jangkar.idKolom)!.jenis === 'bulat')).toBe(true);
    }), { numRuns: 100 });
  });

  test('bukan mafqud (haml) → TIDAK_DIDUKUNG; hasil bukan OK → TIDAK_DIDUKUNG', () => {
    expect(susunTabelSoal({ status: 'TIDAK_DIDUKUNG', alasan: 'x', refs: [] } as never, id => id)).toEqual({ status: 'TIDAK_DIDUKUNG' });
  });
});
