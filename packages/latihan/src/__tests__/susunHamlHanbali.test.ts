import { describe, expect, test } from 'vitest';
import { hitungTaqdir, KONFIGURASI_BAWAAN, type GrafKeluarga, type Orang } from '@waris/engine';
import { nilaiSemuaKolom, susunTabelSoal, type IsianTabel, type TabelSoal } from '../index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });

// KB 13a.7 H1 [HNB]: ibu I hamil dari ayah almarhum A, saudara lk kandung S.
const graf: GrafKeluarga = { idPewaris: 'D', orang: {
  D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }), A: orang('A', 'L', { statusHidup: 'wafat' }), I: orang('I', 'P'),
  S: orang('S', 'L', { idAyah: 'A', idIbu: 'I' }), J: orang('J', 'L', { idAyah: 'A', idIbu: 'I', statusHidup: 'dalamKandungan' }) },
  pernikahan: [{ idSuami: 'A', idIstri: 'I', status: 'utuh' }] };
const susunan = susunTabelSoal(hitungTaqdir({ graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n },
  konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'hanbali', versiKb: 'uji' }), id => id);
if ('status' in susunan) throw new Error(susunan.status);
const tabel: TabelSoal = susunan;

describe('susunTabelHaml [HNB] — KB 13a.7 H1', () => {
  test('kolom: enam kemungkinan, mas\'alah 3 · 12 · 18 · 18 · 24 · 6, Jami\'ah 72; pengali 24, 6, 4, 4, 3, 12; tanpa sel bersama', () => {
    expect(tabel.kolom.filter(kolom => kolom.idJudul === 'sahamKemungkinan').map(kolom => [kolom.kemungkinan, kolom.kepala, kolom.gabungDari])).toEqual([
      ['hamlHnb.mati', 3n, undefined], ['hamlHnb.lk', 12n, undefined], ['hamlHnb.pr', 18n, undefined],
      ['hamlHnb.duaLk', 18n, undefined], ['hamlHnb.duaPr', 24n, undefined], ['hamlHnb.lkPr', 6n, undefined]]);
    expect(tabel.kolom.at(-1)).toMatchObject({ id: 'jamiah', kepala: 72n });
    expect(tabel.pengali!.kunci).toEqual({ m1: 24n, m2: 6n, m3: 4n, m4: 4n, m5: 3n, m6: 12n });
  });

  test('baris: ibu jami\'ah 12, saudara 20, janin tanpa jami\'ah, Ditahan 40', () => {
    expect(tabel.baris.map(baris => [baris.id, baris.kunci, baris.kelompok])).toEqual([
      ['I', { b1: '1/3', m1: '1', b2: '1/6', m2: '2', b3: '1/6', m3: '3', b4: '1/6', m4: '3', b5: '1/6', m5: '4', b6: '1/6', m6: '1', jamiah: '12' }, {}],
      ['S', { b1: 'Ashabah', m1: '2', b2: 'Ashabah', m2: '5', b3: 'Ashabah', m3: '10', b4: 'Ashabah', m4: '5', b5: 'Ashabah', m5: '10', b6: 'Ashabah', m6: '2', jamiah: '20' }, {}],
      ['J', { b2: 'Ashabah', m2: '5', b3: 'Ashabah', m3: '5', b4: 'Ashabah', m4: '10', b5: 'Ashabah', m5: '10', b6: 'Ashabah', m6: '3' }, {}],
      ['mauquf', { jamiah: '40' }, {}]]);
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
