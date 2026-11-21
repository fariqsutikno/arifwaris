import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import { hitungMunasakhat, KONFIGURASI_BAWAAN, type GrafKeluarga, type Orang } from '@waris/engine';
import { nilaiSemuaKolom, nilaiTabel, pilihJangkar, susunTabelSoal, type IsianTabel, type TabelSoal } from '../index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });

// KB 12.6 contoh 2 (M2): istri, anak lk, anak pr; anak pr wafat sebelum harta dibagi → ibunya (istri tadi) dan saudaranya (anak lk tadi).
const graf: GrafKeluarga = { idPewaris: 'D', pernikahan: [{ idSuami: 'D', idIstri: 'W', status: 'utuh' }], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat' }), W: orang('W', 'P'),
  S: orang('S', 'L', { idAyah: 'D', idIbu: 'W' }), B: orang('B', 'P', { idAyah: 'D', idIbu: 'W' }) } };

const hasil = hitungMunasakhat({ urutanWafat: ['B'], dasar: { graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n },
  pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' } });
const susunan = susunTabelSoal(hasil, id => id);
if ('status' in susunan) throw new Error(susunan.status);
const tabel: TabelSoal = susunan;

const isianKunci = (): IsianTabel => ({
  kepala: Object.fromEntries(tabel.kolom.filter(kolom => kolom.kepala !== undefined && !kolom.terkunci).map(kolom => [kolom.id, String(kolom.kepala)])),
  sel: Object.fromEntries(tabel.baris.map(baris => [baris.id, { ...baris.kunci }])),
  pengali: Object.fromEntries(Object.entries(tabel.pengali!.kunci).map(([id, nilai]) => [id, String(nilai)])),
});

describe('susunTabelMunasakhat — KB 12.6 contoh 2', () => {
  test('kolom: Mas\'alah 1 terkunci 24 · Bagian · Mas\'alah 2 (3) · Jami\'ah 72; pengali 3 dan 7', () => {
    expect(tabel.kolom.map(kolom => [kolom.id, kolom.idJudul, kolom.kepala, !!kolom.terkunci, kolom.mayit])).toEqual([
      ['m1', 'masalahPertama', 24n, true, 'D'], ['b2', 'bagian', undefined, false, 'B'], ['m2', 'masalahLanjutan', 3n, false, 'B'], ['jamiah', 'jamiah', 72n, false, undefined]]);
    expect(tabel.pengali!.kunci).toEqual({ m1: 3n, m2: 7n });
  });

  test('baris: ibu 3 → 1/3 → 1 → 16; saudara 14 → Ashabah → 2 → 56; anak pr (wafat) hanya mas\'alah 1 (7)', () => {
    expect(tabel.baris.map(baris => [baris.id, baris.kunci])).toEqual([
      ['W', { m1: '3', b2: '1/3', m2: '1', jamiah: '16' }],
      ['S', { m1: '14', b2: 'Ashabah', m2: '2', jamiah: '56' }],
      ['B', { m1: '7' }]]);
  });

  test('isian = kunci: semua kolom benar, pengali terakhir dan benar', () => {
    const hasilKolom = nilaiSemuaKolom(tabel, isianKunci(), null);
    expect(hasilKolom.map(kolom => [kolom.idKolom, kolom.status])).toEqual([['b2', 'benar'], ['m2', 'benar'], ['jamiah', 'benar'], ['pengali', 'benar']]);
    expect(nilaiTabel(tabel, isianKunci(), null)).toMatchObject({ jenis: 'benar' });
  });

  test('kelipatan: pengali diturunkan dari kepala yang diisi pelajar, bukan dari kunci', () => {
    const isian = isianKunci();
    isian.kepala = { m2: '6', jamiah: '144' };
    isian.sel.W = { ...isian.sel.W!, m2: '2', jamiah: '32' };
    isian.sel.S = { ...isian.sel.S!, m2: '4', jamiah: '112' };
    // m1 tetap 24: pengali 6 (=144/24); m2 = 7 × 6 / 6 = 7.
    isian.pengali = { m1: '6', m2: '7' };
    expect(nilaiTabel(tabel, isian, null)).toMatchObject({ jenis: 'benar' });
  });

  test('pengali salah → status salah, kolom lain tetap benar; kosong → belumLengkap', () => {
    const salah = isianKunci();
    salah.pengali = { m1: '3', m2: '6' };
    expect(nilaiSemuaKolom(tabel, salah, null).at(-1)).toMatchObject({ idKolom: 'pengali', status: 'salah' });
    expect(nilaiTabel(tabel, salah, null)).toMatchObject({ jenis: 'salah', idKolom: 'pengali' });
    const kosong = isianKunci();
    delete kosong.pengali!.m2;
    expect(nilaiTabel(tabel, kosong, null)).toMatchObject({ jenis: 'belumLengkap', idKolom: 'pengali' });
  });

  test('kolom terkunci tidak dinilai dan tidak pernah jadi jangkar', () => {
    expect(nilaiSemuaKolom(tabel, isianKunci(), null).some(kolom => kolom.idKolom === 'm1')).toBe(false);
    fc.assert(fc.property(fc.double({ min: 0, max: 1, noDefaultInfinity: true, noNaN: true }), acak => {
      const jangkar = pilihJangkar(tabel, () => acak)!;
      const kolom = tabel.kolom.find(lain => lain.id === jangkar.idKolom)!;
      return kolom.jenis === 'bulat' && !kolom.terkunci && tabel.baris.find(baris => baris.id === jangkar.idBaris)!.kunci[kolom.id] !== '0';
    }));
  });
});

describe('susunTabelMunasakhat — di luar jangkauan', () => {
  test('PERLU_INPUT / TIDAK_DIDUKUNG dari engine → TIDAK_DIDUKUNG', () => {
    expect(susunTabelSoal({ status: 'PERLU_INPUT', mayit: 'D' } as never, id => id)).toEqual({ status: 'TIDAK_DIDUKUNG' });
  });
});

describe('susunTabelMunasakhat — kelompok gharqa di rantai [R12-6]', () => {
  test('munasakhat yang memuat kelompok gharqa → TIDAK_DIDUKUNG (tabelnya perlu desain sendiri)', () => {
    const graf: GrafKeluarga = { idPewaris: 'A', pernikahan: [{ idSuami: 'B', idIstri: 'WB', status: 'utuh' }, { idSuami: 'C', idIstri: 'WC', status: 'utuh' }], orang: {
      A: orang('A', 'L', { statusHidup: 'wafat', idIbu: 'MA' }), MA: orang('MA', 'P', { statusHidup: 'wafat', penghubung: true }),
      B: orang('B', 'L', { idAyah: 'A', idIbu: 'MA' }), C: orang('C', 'L', { idAyah: 'A', idIbu: 'MA' }),
      WB: orang('WB', 'P'), SB: orang('SB', 'L', { idAyah: 'B', idIbu: 'WB' }), WC: orang('WC', 'P'), DC: orang('DC', 'P', { idAyah: 'C', idIbu: 'WC' }) } };
    const dengan = hitungMunasakhat({ urutanWafat: [{ anggota: ['B', 'C'], keadaan: 'serentak' }], dasar: { graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n },
      pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' } });
    expect(dengan.status).toBe('OK');
    expect(susunTabelSoal(dengan, id => id)).toEqual({ status: 'TIDAK_DIDUKUNG' });
  });
});

