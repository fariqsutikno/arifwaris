// Paket soal vs engine: topik harus sah dan dihasilkan engine, harapan harus sama dengan hasil engine.
import { expect, test } from 'vitest';
import { bacaPaketSoal } from '@waris/content';
import { buatKodeSoal, periksaAngkaPaketSoal } from '../index.js';

const periksa = (isian: string, topik = 'hajb:SAUDARA_KANDUNG') => {
  const teks = `---\npaket: uji\nmodul: 5\nsumber: 06\n---\n\n\`\`\`soal\nkode: P-05-001\ntingkat: dasar\ntopik: ${topik}\ntanya: x?\npembahasan: y\nrujukan: R06-4\n${isian}\n- a | b\n* c | d\n- e | f\n\`\`\`\n`;
  return periksaAngkaPaketSoal(bacaPaketSoal(teks, 'uji.md')).map(temuan => temuan.pesan);
};
const kasus = 'pewaris: L\nahli waris: AYAH, IBU, 2 SAUDARA_KANDUNG\n';

test('harapan cocok lolos; harapan salah ditolak dengan angka engine', () => {
  expect(periksa(`${kasus}harapan: IBU 1, AYAH 5; ashl 6`)).toEqual([]);
  expect(periksa(`${kasus}harapan: IBU 2, AYAH 4; ashl 6`)).toEqual([expect.stringContaining('Engine: "IBU 1, AYAH 5; ashl 6"')]);
});

test('topik: token tak dikenal ditolak; token yang tidak dihasilkan engine ditolak', () => {
  expect(periksa(kasus, 'hajb-ibu')).toEqual([expect.stringContaining('bukan token label')]);
  expect(periksa('', 'konsep:tirkah')).toEqual([]);
  expect(periksa(kasus, 'aul')).toEqual([expect.stringContaining('tidak dihasilkan engine')]);
  expect(periksa('', 'aul:6>7')).toEqual([]);
});

test('kode-bank: biasa dicocokkan harapannya; susunan tak sah ditolak', () => {
  const kode = buatKodeSoal({ pewaris: 'L', ahliWaris: { AYAH: 1, IBU: 1, SAUDARA_KANDUNG: 2 } });
  expect(periksa(`kode-bank: ${kode}\nharapan: IBU 1, AYAH 5; ashl 6`)).toEqual([]);
  expect(periksa('pewaris: L\nahli waris: 2 AYAH, IBU\n')).toEqual([expect.stringContaining('tidak sah')]);
  expect(periksa('kode-bank: G1-B-00000000')).toEqual([expect.stringContaining('tidak terbaca')]);
});
