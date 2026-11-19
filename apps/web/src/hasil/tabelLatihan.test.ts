import { describe, expect, test } from 'vitest';
import { hitung, KONFIGURASI_BAWAAN, type GrafKeluarga, type InputEngine, type Orang } from '@waris/engine';
import { nilaiTabel, pilihJangkar, susunTabelSoal, type IsianTabel, type TabelSoal } from './tabelLatihan';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
const masukan = (graf: GrafKeluarga): InputEngine => ({ graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n },
  konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' });

// Bab 16.1: istri 1/8, anak lk + anak pr ashabah bil ghair; tashih 8 → 24.
const graf161: GrafKeluarga = { idPewaris: 'D', pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat' }), W1: orang('W1', 'P', { nama: 'Istri' }),
  S1: orang('S1', 'L', { idAyah: 'D', idIbu: 'W1', nama: 'Anak lk' }), D1: orang('D1', 'P', { idAyah: 'D', idIbu: 'W1', nama: 'Anak pr' }) } };
// Ayah, ibu, saudara kandung: saudara terhalang oleh ayah.
const grafTerhalang: GrafKeluarga = { idPewaris: 'D', pernikahan: [], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat', idAyah: 'A', idIbu: 'I' }), A: orang('A', 'L'), I: orang('I', 'P'),
  K: orang('K', 'L', { idAyah: 'A', idIbu: 'I' }) } };

function tabelDari(graf: GrafKeluarga): TabelSoal {
  const tabel = susunTabelSoal(hitung(masukan(graf)), graf);
  if ('status' in tabel) throw new Error(tabel.status);
  return tabel;
}
const tabel161 = tabelDari(graf161);
const isianBenar = (): IsianTabel => ({ kepala: { ashl: '8', akhir: '24' }, sel: {
  W1: { bagian: '1/8', ashl: '1', akhir: '3' }, S1: { bagian: 'Ashabah', ashl: '7', akhir: '14' }, D1: { bagian: 'Ashabah', akhir: '7' } } });

describe('susunTabelSoal — soal biasa dari keluaran engine', () => {
  test('16.1: bagian, asal masalah 8, asal masalah akhir 24', () => {
    expect(tabel161.kolom.map(kolom => [kolom.id, kolom.kepala])).toEqual([['bagian', undefined], ['ashl', 8n], ['akhir', 24n]]);
    expect(tabel161.baris.map(baris => [baris.nama, baris.kunci])).toEqual([
      ['Istri', { bagian: '1/8', ashl: '1', akhir: '3' }],
      ['Anak lk', { bagian: 'Ashabah', ashl: '7', akhir: '14' }],
      ['Anak pr', { bagian: 'Ashabah', ashl: '7', akhir: '7' }],
    ]);
  });

  test('sel bersama hanya pada kelompok beranggota > 1', () => {
    const [istri, anakLk, anakPr] = tabel161.baris;
    expect(istri!.kelompok).toEqual({});
    expect(anakLk!.kelompok.ashl).toBeDefined();
    expect(anakLk!.kelompok.ashl).toBe(anakPr!.kelompok.ashl);
  });

  test('orang terhalang: kunci Bagian saja, tanpa saham', () => {
    const terhalang = tabelDari(grafTerhalang).baris.find(baris => baris.id === 'K')!;
    expect(terhalang.kunci).toEqual({ bagian: 'Terhalang' });
  });

  test('jenis lain (taqdir, hasil tak OK) → TIDAK_DIDUKUNG', () => {
    expect(susunTabelSoal({ status: 'PERLU_INPUT', pertanyaan: [] }, graf161)).toEqual({ status: 'TIDAK_DIDUKUNG' });
  });
});

describe('nilaiTabel — aturan B6', () => {
  test('semua benar → benar, tanpa bentuk terkecil', () => {
    expect(nilaiTabel(tabel161, isianBenar(), null)).toEqual({ jenis: 'benar', bentukTerkecil: [] });
  });

  test('kolom Bagian belum lengkap → berhenti di kolom itu', () => {
    const isian = isianBenar();
    delete isian.sel.W1!.bagian;
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'belumLengkap', idKolom: 'bagian', idBarisKosong: ['W1'] });
  });

  test('salah di Bagian → kolom sesudahnya tidak diperiksa', () => {
    const isian = isianBenar();
    isian.sel.W1!.bagian = '1/4';
    isian.kepala.ashl = '';
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'salah', idKolom: 'bagian', idBarisSalah: ['W1'] });
  });

  test('kepala kosong → belum lengkap', () => {
    const isian = isianBenar();
    isian.kepala.ashl = '';
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'belumLengkap', idKolom: 'ashl', kepalaKosong: true });
  });

  test('sebanding diterima: asal masalah 16 dengan saham 2 dan 14 bersama; bentuk terkecil dilaporkan', () => {
    const isian = isianBenar();
    isian.kepala.ashl = '16';
    isian.sel.W1!.ashl = '2';
    isian.sel.S1!.ashl = '14';
    const hasil = nilaiTabel(tabel161, isian, null);
    expect(hasil).toEqual({ jenis: 'benar', bentukTerkecil: [{ idKolom: 'ashl', judul: 'Asal masalah', diisi: 16n, terkecil: 8n }] });
  });

  test('kepala bukan kelipatan kunci → kepala salah', () => {
    const isian = isianBenar();
    isian.kepala.akhir = '30';
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'salah', idKolom: 'akhir', kepalaSalah: true });
  });

  test('sel bersama dinilai sekali: baris kedua kelompok tidak perlu diisi di kolom bersama', () => {
    const isian = isianBenar();
    isian.sel.D1 = { bagian: 'Ashabah', akhir: '7' };
    expect(nilaiTabel(tabel161, isian, null).jenis).toBe('benar');
  });

  test('saham salah → sel itu ditandai', () => {
    const isian = isianBenar();
    isian.sel.D1!.akhir = '8';
    expect(nilaiTabel(tabel161, isian, null)).toMatchObject({ jenis: 'salah', idKolom: 'akhir', idBarisSalah: ['D1'], kepalaSalah: false });
  });

  test('angka Arab-Hindi dibaca sebagai Latin', () => {
    const isian = isianBenar();
    isian.sel.W1!.akhir = '٣';
    expect(nilaiTabel(tabel161, isian, null).jenis).toBe('benar');
  });

  test('jangkar: selnya dianggap terisi, dan kepala kolomnya harus persis kunci', () => {
    const jangkar = { idBaris: 'W1', idKolom: 'akhir' };
    const isian = isianBenar();
    delete isian.sel.W1!.akhir;
    expect(nilaiTabel(tabel161, isian, jangkar).jenis).toBe('benar');
    isian.kepala.akhir = '48';
    isian.sel.S1!.akhir = '28';
    isian.sel.D1!.akhir = '14';
    expect(nilaiTabel(tabel161, isian, jangkar)).toMatchObject({ jenis: 'salah', idKolom: 'akhir', kepalaSalah: true });
  });
});

describe('pilihJangkar', () => {
  test('hanya sel saham berkunci, bukan bersama, bukan kolom pilihan', () => {
    const semua = new Set<string>();
    for (let indeks = 0; indeks < 20; indeks += 1) {
      const jangkar = pilihJangkar(tabel161, () => indeks / 20)!;
      semua.add(`${jangkar.idBaris}|${jangkar.idKolom}`);
    }
    // Calon: istri@ashl, istri@akhir, anak lk@akhir, anak pr@akhir (ashl anak = bersama).
    expect([...semua].sort()).toEqual(['D1|akhir', 'S1|akhir', 'W1|akhir', 'W1|ashl']);
  });

  test('deterministik untuk acak yang sama; batas atas acak = 1 tetap sah', () => {
    expect(pilihJangkar(tabel161, () => 0)).toEqual({ idBaris: 'W1', idKolom: 'ashl' });
    expect(pilihJangkar(tabel161, () => 1)).toEqual({ idBaris: 'D1', idKolom: 'akhir' });
  });

  test('tanpa calon → null', () => {
    expect(pilihJangkar({ kolom: [], baris: [] }, () => 0.5)).toBeNull();
  });
});
