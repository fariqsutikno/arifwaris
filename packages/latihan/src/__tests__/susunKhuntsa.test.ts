import { describe, expect, test } from 'vitest';
import { hitungTaqdir, KONFIGURASI_BAWAAN, type GrafKeluarga, type Orang } from '@waris/engine';
import { nilaiSemuaKolom, susunTabelSoal, type IsianTabel, type TabelSoal } from '../index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
const wafat = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}) => orang(id, jenisKelamin, { statusHidup: 'wafat', ...lain });

// KB 13c.4 X1: pewaris D, ayah A, dua anak pr B1 B2, cucu khuntsa K dari anak lk S yang sudah wafat.
const graf: GrafKeluarga = { idPewaris: 'D', pernikahan: [], orang: {
  D: wafat('D', 'L', { idAyah: 'A', idIbu: 'I' }), A: orang('A', 'L'), I: wafat('I', 'P'),
  B1: orang('B1', 'P', { idAyah: 'D' }), B2: orang('B2', 'P', { idAyah: 'D' }),
  S: wafat('S', 'L', { idAyah: 'D' }), K: orang('K', 'L', { idAyah: 'S', khuntsa: 'diharapkanJelas' }) } };

const hasil = hitungTaqdir({ graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n },
  konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' });
const susunan = susunTabelSoal(hasil, id => id);
if ('status' in susunan) throw new Error(susunan.status);
const tabel: TabelSoal = susunan;

describe('susunTabelKhuntsa — KB 13c.4 X1', () => {
  test('kolom: ia laki-laki (mas\'alah 6) · ia perempuan (6) · Jami\'ah 6; pengali 1 dan 1', () => {
    expect(tabel.kolom.map(kolom => [kolom.id, kolom.idJudul, kolom.kepala, kolom.kemungkinan])).toEqual([
      ['b1', 'bagianKemungkinan', undefined, 'lk'], ['m1', 'sahamKemungkinan', 6n, 'lk'],
      ['b2', 'bagianKemungkinan', undefined, 'pr'], ['m2', 'sahamKemungkinan', 6n, 'pr'],
      ['jamiah', 'jamiahSekarang', 6n, undefined]]);
    expect(tabel.pengali!.kunci).toEqual({ m1: 1n, m2: 1n });
  });

  test('baris: ayah, dua anak pr, khuntsa Terhalang sebagai pr; Ditahan 1', () => {
    const anakPr = { b1: '2/3', m1: '2', b2: '2/3', m2: '2', jamiah: '2' };
    expect(tabel.baris.map(baris => [baris.id, baris.kunci])).toEqual([
      ['B1', anakPr], ['B2', anakPr],
      ['K', { b1: 'Ashabah', m1: '1', b2: 'Terhalang' }],
      ['A', { b1: '1/6', m1: '1', b2: '1/6 + Ashabah', m2: '2', jamiah: '1' }],
      ['mauquf', { jamiah: '1' }]]);
  });

  test('isian = kunci: semua kolom benar', () => {
    const isian: IsianTabel = {
      kepala: Object.fromEntries(tabel.kolom.filter(kolom => kolom.kepala !== undefined).map(kolom => [kolom.id, String(kolom.kepala)])),
      sel: Object.fromEntries(tabel.baris.map(baris => [baris.id, { ...baris.kunci }])),
      pengali: Object.fromEntries(Object.entries(tabel.pengali!.kunci).map(([id, nilai]) => [id, String(nilai)])),
    };
    expect(nilaiSemuaKolom(tabel, isian, null).every(kolom => kolom.status === 'benar')).toBe(true);
  });
});
