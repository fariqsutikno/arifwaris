import { describe, expect, test } from 'vitest';
import { hitungGharqa, KONFIGURASI_BAWAAN, type GrafKeluarga, type InputGharqa, type Orang } from '@waris/engine';
import { nilaiSemuaKolom, susunSoalGharqa, type IsianTabel, type TabelSoal } from '../index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
const wafat = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}) => orang(id, jenisKelamin, { statusHidup: 'wafat', ...lain });

// KB 13d.2: Zaid dan 'Amr wafat bersamaan, tidak diketahui siapa lebih dulu; masing-masing punya ahli waris lain.
const graf: GrafKeluarga = { idPewaris: 'ZAID', pernikahan: [{ idSuami: 'AMR', idIstri: 'AW', status: 'utuh' }], orang: {
  KAKEK: wafat('KAKEK', 'L'), F: wafat('F', 'L', { idAyah: 'KAKEK' }), PAMAN: orang('PAMAN', 'L', { idAyah: 'KAKEK' }),
  MZ: orang('MZ', 'P'), MA: wafat('MA', 'P'),
  ZAID: wafat('ZAID', 'L', { idAyah: 'F', idIbu: 'MZ' }), ZD: orang('ZD', 'P', { idAyah: 'ZAID' }),
  AMR: wafat('AMR', 'L', { idAyah: 'F', idIbu: 'MA' }), AW: orang('AW', 'P'),
  AD1: orang('AD1', 'P', { idAyah: 'AMR', idIbu: 'AW' }), AD2: orang('AD2', 'P', { idAyah: 'AMR', idIbu: 'AW' }) } };
const hitung = (ruleset: 'syafii' | 'hanbali', keadaan: InputGharqa['keadaan'] = 'tidakDiketahui') => hitungGharqa({
  dasar: { graf, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset, versiKb: 'uji' },
  anggota: ['ZAID', 'AMR'], keadaan });

const soal = susunSoalGharqa(hitung('syafii'), id => id);
if ('status' in soal) throw new Error(soal.status);

describe('susunSoalGharqa — KB 13d.2', () => {
  test('tidak diketahui sama sekali [SYF] → keputusan Tidak saling mewarisi, satu tabel biasa per harta', () => {
    expect(soal.keputusan).toBe('tidakSalingMewarisi');
    expect(soal.harta.map(harta => harta.mayit)).toEqual(['ZAID', 'AMR']);
    const zaid: TabelSoal = soal.harta[0]!.tabel;
    expect(zaid.baris.map(baris => [baris.id, baris.kunci.bagian, baris.kunci.akhir])).toEqual([['MZ', '1/6', '1'], ['ZD', '1/2', '3'], ['PAMAN', 'Ashabah', '2']]);
  });

  test('isian = kunci tiap harta: semua kolom benar', () => {
    for (const { tabel } of soal.harta) {
      const isian: IsianTabel = {
        kepala: Object.fromEntries(tabel.kolom.filter(kolom => kolom.kepala !== undefined).map(kolom => [kolom.id, String(kolom.kepala)])),
        sel: Object.fromEntries(tabel.baris.map(baris => [baris.id, { ...baris.kunci }])),
      };
      expect(nilaiSemuaKolom(tabel, isian, null).every(kolom => kolom.status === 'benar')).toBe(true);
    }
  });

  test('[SYF] terlupakan → Ditahan sampai jelas, tanpa tabel', () => {
    expect(susunSoalGharqa(hitung('syafii', 'terlupakan'), id => id)).toEqual({ keputusan: 'ditahan', harta: [] });
  });

  test('[HNB] tilad–tharif belum didukung', () => {
    expect(susunSoalGharqa(hitung('hanbali'), id => id)).toEqual({ status: 'TIDAK_DIDUKUNG' });
  });
});
