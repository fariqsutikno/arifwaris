// Fixture spec kanvas silsilah (spec 11.1): contoh turun-temurun dan kakak tak menikah, dicocokkan ke KB.
// A/A2 menunjukkan bahwa urutan wafat mengubah hasil (dasar uji "urutan berpengaruh"); B' menguji kakek bersama saudara.
import { describe, expect, test } from 'vitest';
import { hitungMunasakhat } from '../munasakhat.js';
import { hitung } from '../pipeline.js';
import type { GrafKeluarga, HasilEngine } from '../types.js';
import { input, p } from './fixtures/bab16.js';

const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));
function sebagaiPecahan(saham: Record<string, bigint>): Record<string, string> {
  const total = Object.values(saham).reduce((a, b) => a + b, 0n);
  return Object.fromEntries(Object.entries(saham).filter(([, s]) => s > 0n).map(([id, s]) => {
    const g = fpb(s, total);
    return [id, `${s / g}/${total / g}`];
  }));
}
function sahamBiasa(hasil: HasilEngine): Record<string, bigint> {
  if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
  const saham: Record<string, bigint> = {};
  for (const baris of hasil.tabel.baris) for (const [id, isi] of Object.entries(baris.perOrang)) saham[id] = (saham[id] ?? 0n) + isi.saham;
  return saham;
}

// Mbah Karto (K) + istri Sumi (S) + anak Slamet (SL, wafat lebih dulu, anaknya Joko J) + Budi (B) + Rina (R);
// ayah Karto (AK) wafat lebih dulu; Budi beristri Dewi (D), anak Andi (A) dan Sari (SR).
const grafKarto: GrafKeluarga = {
  idPewaris: 'K',
  orang: {
    K: p('K', 'L', { statusHidup: 'wafat', idAyah: 'AK' }),
    AK: p('AK', 'L', { statusHidup: 'wafat' }),
    S: p('S', 'P'),
    SL: p('SL', 'L', { statusHidup: 'wafat', idAyah: 'K', idIbu: 'S' }),
    J: p('J', 'L', { idAyah: 'SL' }),
    B: p('B', 'L', { idAyah: 'K', idIbu: 'S' }),
    R: p('R', 'P', { idAyah: 'K', idIbu: 'S' }),
    D: p('D', 'P'),
    A: p('A', 'L', { idAyah: 'B', idIbu: 'D' }),
    SR: p('SR', 'P', { idAyah: 'B', idIbu: 'D' }),
  },
  pernikahan: [{ idSuami: 'K', idIstri: 'S', status: 'utuh' }, { idSuami: 'B', idIstri: 'D', status: 'utuh' }],
};

// Budi (BU) tak menikah; ayah AY wafat lebih dulu; ibu IB; saudara kandung Andi (AN) dan Rina (RI).
const grafBudi = (kakekHidup: boolean): GrafKeluarga => ({
  idPewaris: 'BU',
  orang: {
    BU: p('BU', 'L', { statusHidup: 'wafat', idAyah: 'AY', idIbu: 'IB' }),
    AY: p('AY', 'L', { statusHidup: 'wafat', ...(kakekHidup ? { idAyah: 'KK' } : {}) }),
    IB: p('IB', 'P'),
    AN: p('AN', 'L', { idAyah: 'AY', idIbu: 'IB' }),
    RI: p('RI', 'P', { idAyah: 'AY', idIbu: 'IB' }),
    ...(kakekHidup ? { KK: p('KK', 'L') } : {}),
  },
  pernikahan: [{ idSuami: 'AY', idIstri: 'IB', status: 'utuh' }],
});

describe('kanvas silsilah — fixture spec 11.1', () => {
  test('A: turun-temurun, Sumi wafat sebelum Budi [R12-1]; Joko terhalang Budi', () => {
    const hasil = hitungMunasakhat({ dasar: input(grafKarto), urutanWafat: ['S', 'B'] });
    if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(sebagaiPecahan(hasil.saham)).toEqual({ R: '1/3', D: '1/12', A: '7/18', SR: '7/36' });
    expect(hasil.sisaKeluar).toEqual([]);
  });

  test('A2: urutan dibalik (Budi sebelum Sumi) mengubah hasil; Joko tidak lagi terhalang [R06-3]', () => {
    const hasil = hitungMunasakhat({ dasar: input(grafKarto), urutanWafat: ['B', 'S'] });
    if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(sebagaiPecahan(hasil.saham)).toEqual({ R: '29/72', D: '7/96', A: '691/2160', SR: '691/4320', J: '2/45' });
  });

  test('B: kakak tak menikah, ibu + saudara kandung', () => {
    expect(sebagaiPecahan(sahamBiasa(hitung(input(grafBudi(false)))))).toEqual({ IB: '1/6', AN: '5/9', RI: '5/18' });
  });

  test("B': kakek bersama saudara dan ibu → muqasamah 1/3 [R08-1] [R08-3] [R08-5]", () => {
    expect(sebagaiPecahan(sahamBiasa(hitung(input(grafBudi(true)))))).toEqual({ IB: '1/6', KK: '1/3', AN: '1/3', RI: '1/6' });
  });
});
