import { describe, expect, test } from 'vitest';
import { hitungDzawilArham, KONFIGURASI_BAWAAN, type GrafKeluarga, type HasilEngine, type Orang } from '@waris/engine';
import { nilaiTabel, susunTabelSoal, type IsianTabel, type TabelSoal } from '../index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
const penghubung = { statusHidup: 'wafat' as const, penghubung: true };

// KB 14.6 baris 1 (tanzil, [SYF]): anak pr saudara lk kandung / seibu / sebapak.
const graf: GrafKeluarga = { idPewaris: 'D', pernikahan: [], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'F1', idIbu: 'M1' }), F1: orang('F1', 'L', penghubung), M1: orang('M1', 'P', penghubung),
  FX: orang('FX', 'L', penghubung), MX: orang('MX', 'P', penghubung),
  SK: orang('SK', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'M1' }), SI: orang('SI', 'L', { ...penghubung, idAyah: 'FX', idIbu: 'M1' }),
  SB: orang('SB', 'L', { ...penghubung, idAyah: 'F1', idIbu: 'MX' }),
  A1: orang('A1', 'P', { idAyah: 'SK' }), A2: orang('A2', 'P', { idAyah: 'SI' }), A3: orang('A3', 'P', { idAyah: 'SB' }) } };

const hasil = hitungDzawilArham({ graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n },
  konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' });
const susunan = susunTabelSoal(hasil, id => id);
if ('status' in susunan) throw new Error(susunan.status);
const tabel: TabelSoal = susunan;

const isianKunci = (): IsianTabel => ({
  kepala: { ashl: String(tabel.kolom.at(-1)!.kepala) },
  sel: Object.fromEntries(tabel.baris.map(baris => [baris.id, { ...baris.kunci }])),
});

describe('susunTabelDzawilArham — KB 14.6 baris 1', () => {
  test('kolom: Didudukkan sebagai (pilihan dari engine) · Bagian perantara · Asal masalah 6', () => {
    expect(tabel.kolom.map(kolom => [kolom.id, kolom.idJudul, kolom.jenis, kolom.kepala])).toEqual([
      ['duduk', 'didudukkanSebagai', 'pilih', undefined], ['bagian', 'bagianPerantara', 'pilih', undefined], ['ashl', 'asalMasalah', 'bulat', 6n]]);
    expect([...tabel.kolom[0]!.pilihan!].sort()).toEqual(['SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARA_SEIBU']);
  });

  test('baris: kandung Ashabah 5; seibu 1/6 1; sebapak Terhalang (saham 0 otomatis)', () => {
    expect(tabel.baris.map(baris => [baris.id, baris.kunci])).toEqual([
      ['A1', { duduk: 'SAUDARA_KANDUNG', bagian: 'Ashabah', ashl: '5' }],
      ['A2', { duduk: 'SAUDARA_SEIBU', bagian: '1/6', ashl: '1' }],
      ['A3', { duduk: 'SAUDARA_SEBAPAK', bagian: 'Terhalang' }]]);
  });

  test('isian = kunci → benar; kursi keliru → salah di kolom Didudukkan sebagai', () => {
    expect(nilaiTabel(tabel, isianKunci(), null)).toMatchObject({ jenis: 'benar' });
    const salah = isianKunci();
    salah.sel.A1!.duduk = 'SAUDARA_SEIBU';
    expect(nilaiTabel(tabel, salah, null)).toMatchObject({ jenis: 'salah', idKolom: 'duduk', idBarisSalah: ['A1'] });
  });

  test('di luar jangkauan → TIDAK_DIDUKUNG: tanpa tanzil, dan kerabat tanpa jalur terpakai', () => {
    if (hasil.status !== 'OK') throw new Error('harus OK');
    const tanpaTanzil = { ...hasil, tanzil: undefined } as unknown as HasilEngine;
    expect(susunTabelSoal(tanpaTanzil, id => id)).toEqual({ status: 'TIDAK_DIDUKUNG' });
    const kalah = { ...hasil, tanzil: { ...hasil.tanzil!, didudukkan: hasil.tanzil!.didudukkan.map(kursi => ({ ...kursi, lolos: false })) } } as HasilEngine;
    expect(susunTabelSoal(kalah, id => id)).toEqual({ status: 'TIDAK_DIDUKUNG' });
  });
});
