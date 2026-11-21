import { describe, expect, test } from 'vitest';
import { hitungTaqdir, KONFIGURASI_BAWAAN, type GrafKeluarga, type Orang } from '@waris/engine';
import { nilaiSemuaKolom, susunTabelSoal, type IsianTabel, type TabelSoal } from '../index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });

// KB 13a.7 H1: ibu I hamil dari ayah almarhum A, saudara lk kandung S.
const graf: GrafKeluarga = { idPewaris: 'D', orang: {
  D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }), A: orang('A', 'L', { statusHidup: 'wafat' }), I: orang('I', 'P'),
  S: orang('S', 'L', { idAyah: 'A', idIbu: 'I' }), J: orang('J', 'L', { idAyah: 'A', idIbu: 'I', statusHidup: 'dalamKandungan' }) },
  pernikahan: [{ idSuami: 'A', idIstri: 'I', status: 'utuh' }] };
const hitung = (ruleset: 'syafii' | 'hanbali') => hitungTaqdir({ graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n },
  konfigurasi: KONFIGURASI_BAWAAN, ruleset, versiKb: 'uji' });
const susunan = susunTabelSoal(hitung('syafii'), id => id);
if ('status' in susunan) throw new Error(susunan.status);
const tabel: TabelSoal = susunan;

const isianKunci = (): IsianTabel => ({
  kepala: Object.fromEntries(tabel.kolom.filter(kolom => kolom.kepala !== undefined).map(kolom => [kolom.id, String(kolom.kepala)])),
  sel: Object.fromEntries(tabel.baris.map(baris => [baris.id, { ...baris.kunci }])),
  pengali: Object.fromEntries(Object.entries(tabel.pengali!.kunci).map(([id, nilai]) => [id, String(nilai)])),
});

describe('susunTabelHamlSyafii — KB 13a.7 H1 [SYF]', () => {
  test('kolom: empat kemungkinan, mas\'alah 3 · 6 · 18 · 6, Jami\'ah 18; pengali 6, 3, 1, 3; gabung di laki-laki dan berbilang', () => {
    expect(tabel.kolom.filter(kolom => kolom.idJudul === 'sahamKemungkinan').map(kolom => [kolom.kemungkinan, kolom.kepala, kolom.gabungDari])).toEqual([
      ['haml.mati', 3n, undefined], ['haml.lk', 6n, 'b2'], ['haml.pr', 18n, undefined], ['haml.duaPr', 6n, 'b4']]);
    expect(tabel.kolom.at(-1)).toMatchObject({ id: 'jamiah', kepala: 18n });
    expect(tabel.pengali!.kunci).toEqual({ m1: 6n, m2: 3n, m3: 1n, m4: 3n });
  });

  test('baris: ibu, saudara, janin (sel bersama 5 di laki-laki dan berbilang), Ditahan 15', () => {
    expect(tabel.baris.map(baris => [baris.id, baris.kunci, baris.kelompok])).toEqual([
      ['I', { b1: '1/3', m1: '1', b2: '1/6', m2: '1', b3: '1/6', m3: '3', b4: '1/6', m4: '1', jamiah: '3' }, {}],
      ['S', { b1: 'Ashabah', m1: '2', b2: 'Ashabah', m2: '5', b3: 'Ashabah', m3: '10', b4: 'Ashabah', m4: '5', jamiah: '0' }, { m2: 'm2-1', m4: 'm4-1' }],
      ['J', { b2: 'Ashabah', m2: '5', b3: 'Ashabah', m3: '5', b4: 'Ashabah', m4: '5' }, { m2: 'm2-1', m4: 'm4-1' }],
      ['mauquf', { jamiah: '15' }, {}]]);
  });

  test('isian = kunci: semua kolom benar', () => {
    expect(nilaiSemuaKolom(tabel, isianKunci(), null).every(kolom => kolom.status === 'benar')).toBe(true);
  });

  test('haml [HNB] memakai jalur sendiri (lihat susunHamlHanbali.test.ts)', () => {
    expect(susunTabelSoal(hitung('hanbali'), id => id)).not.toEqual({ status: 'TIDAK_DIDUKUNG' });
  });
});
