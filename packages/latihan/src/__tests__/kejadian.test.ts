import { describe, expect, test } from 'vitest';
import { hitung, KONFIGURASI_BAWAAN, type GrafKeluarga, type Orang } from '@waris/engine';
import { gabungKejadian, jalankan, jenisSoalDari, kasusBaru, susunTabelSoal, tabelKanonik, tambahAhliWaris, type KejadianPercobaan } from '../index.js';

const orang = (id: string, jenisKelamin: 'L' | 'P', lain: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...lain });
const graf: GrafKeluarga = { idPewaris: 'D', pernikahan: [{ idSuami: 'D', idIstri: 'W1', status: 'utuh' }], orang: {
  D: orang('D', 'L', { statusHidup: 'wafat' }), W1: orang('W1', 'P'), S1: orang('S1', 'L', { idAyah: 'D', idIbu: 'W1' }) } };
const tabelDari = (g: GrafKeluarga) => {
  const tabel = susunTabelSoal(hitung({ graf: g, tirkah: { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1n }, konfigurasi: KONFIGURASI_BAWAAN, ruleset: 'syafii', versiKb: 'uji' }), id => id);
  if ('status' in tabel) throw new Error(tabel.status);
  return tabel;
};

describe('tabelKanonik', () => {
  test('sama untuk tabel yang sama, tidak bergantung urutan kunci objek, berubah bila kunci berubah', () => {
    const tabel = tabelDari(graf);
    const terbalik = { ...tabel, baris: tabel.baris.map(baris => ({ ...baris, kunci: Object.fromEntries(Object.entries(baris.kunci).reverse()) })) };
    expect(tabelKanonik(terbalik)).toBe(tabelKanonik(tabel));
    const lain = { ...tabel, baris: tabel.baris.map((baris, i) => (i === 0 ? { ...baris, kunci: { ...baris.kunci, ashl: '99' } } : baris)) };
    expect(tabelKanonik(lain)).not.toBe(tabelKanonik(tabel));
  });
});

describe('gabungKejadian', () => {
  const k = (id: string) => ({ id }) as KejadianPercobaan;
  test('gabungan himpunan per id, urutan pertama dulu, tanpa menimpa', () => {
    expect(gabungKejadian([k('a'), k('b')], [k('b'), k('c')]).map(x => x.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('jenisSoalDari', () => {
  test('biasa; munasakhat; janin → haml', () => {
    let kasus = kasusBaru('L', 'latihan');
    for (const kunci of ['ISTRI', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, kasus.graf.idPewaris, kunci) };
    expect(jenisSoalDari(kasus, jalankan(kasus))).toBe('biasa');
    const janin: typeof kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, O2: { ...kasus.graf.orang.O2!, statusHidup: 'dalamKandungan' } } } };
    expect(jenisSoalDari(janin, jalankan(janin))).toBe('haml');
  });
});
