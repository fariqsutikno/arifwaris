import { describe, expect, it } from 'vitest';
import type { GrafKeluarga, IdOrang, KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { BATAS_PER_BARIS, jumlahPerBaris, tataLetak } from '../hasil/tataLetak';
import { selesaikanJalur } from '../hubunganPohon';
import { tambahDariOrang } from '../kerabatPohon';

const bangun = (kunci: KunciAhliWaris[]): GrafKeluarga =>
  kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasusBaru('L').graf);
const ambil = (h: ReturnType<typeof selesaikanJalur>): GrafKeluarga => { if (!('graf' in h)) throw new Error(JSON.stringify(h)); return h.graf; };
const indeksDi = (baris: IdOrang[][], id: IdOrang) => { const b = baris.findIndex(r => r.includes(id)); return { baris: b, kolom: baris[b]!.indexOf(id) }; };

describe('B1: pembungkus baris', () => {
  it.each([[1, 6, 1], [6, 6, 6], [7, 6, 4], [12, 6, 6], [7, 4, 4], [9, 4, 3], [13, 4, 4]])('%i node, maks %i → %i per baris', (jumlah, maks, harapan) => {
    expect(jumlahPerBaris(jumlah, maks)).toBe(harapan);
  });
  it('maks bawaan = BATAS_PER_BARIS', () => { expect(jumlahPerBaris(7)).toBe(jumlahPerBaris(7, BATAS_PER_BARIS)); });
});

describe('B2: keluarga asal pasangan di sisi pasangannya', () => {
  it('mertua berada di kanan orang tua pewaris', () => {
    let g = bangun(['ISTRI', 'AYAH', 'IBU']);
    g = ambil(selesaikanJalur(g, 'PEWARIS', 'mertua', { jenisKelamin: 'L', nama: 'Bapak Mertua' }));
    g = ambil(selesaikanJalur(g, 'PEWARIS', 'mertua', { jenisKelamin: 'P', nama: 'Ibu Mertua' }));
    const { baris } = tataLetak(g);
    const kolomMertua = Object.values(g.orang).filter(o => o.nama?.includes('Mertua')).map(o => indeksDi(baris, o.id).kolom);
    const kolomOrtu = [g.orang.PEWARIS!.idAyah!, g.orang.PEWARIS!.idIbu!].map(id => indeksDi(baris, id).kolom);
    expect(Math.min(...kolomMertua)).toBeGreaterThan(Math.max(...kolomOrtu));
  });
});

describe('B3: anak satu keluarga berdampingan', () => {
  it('poligami 2 istri: anak tiap istri satu blok', () => {
    let g = bangun(['ISTRI', 'ISTRI']);
    const [istri1, istri2] = g.pernikahan.map(n => n.idIstri);
    for (const [istri, jumlah] of [[istri1!, 2], [istri2!, 2]] as const) {
      for (let i = 0; i < jumlah; i++) g = tambahDariOrang(g, 'PEWARIS', { aksi: 'anak', jenisKelamin: i % 2 ? 'P' : 'L', idPasangan: istri }).graf;
    }
    const { baris, keluarga } = tataLetak(g);
    for (const { anak } of keluarga.filter(k => k.anak.length > 1)) {
      const kolom = anak.map(id => indeksDi(baris, id).kolom).sort((a, b) => a - b);
      expect(kolom[kolom.length - 1]! - kolom[0]!).toBe(kolom.length - 1);
    }
  });
});

describe('B5: menambah satu orang tidak mengacak urutan orang lain', () => {
  const kasusUji: Array<[string, GrafKeluarga, (g: GrafKeluarga) => GrafKeluarga]> = [
    ['anak baru', bangun(['ISTRI', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG', 'AYAH', 'IBU']), g => tambahDariOrang(g, 'PEWARIS', { aksi: 'anak', jenisKelamin: 'L' }).graf],
    ['istri baru', bangun(['ISTRI', 'ANAK_LK', 'AYAH', 'IBU']), g => tambahDariOrang(g, 'PEWARIS', { aksi: 'pasangan' }).graf],
    ['saudara baru', bangun(['ISTRI', 'SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'AYAH', 'IBU']), g => tambahDariOrang(g, 'PEWARIS', { aksi: 'saudara', jenisKelamin: 'P', jalur: 'kandung' }).graf],
    ['mertua baru', bangun(['ISTRI', 'ANAK_LK', 'AYAH', 'IBU']), g => ambil(selesaikanJalur(g, 'PEWARIS', 'mertua', { jenisKelamin: 'L' }))],
  ];
  it.each(kasusUji)('%s', (_nama, awal, tambah) => {
    const sebelum = tataLetak(awal).baris;
    const sesudah = tataLetak(tambah(awal)).baris;
    for (const barisLama of sebelum) {
      const sisa = sesudah.map(r => r.filter(id => barisLama.includes(id))).find(r => r.length === barisLama.length);
      expect(sisa).toEqual(barisLama);
    }
  });
});
