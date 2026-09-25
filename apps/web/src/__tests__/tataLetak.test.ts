import { expect, it } from 'vitest';
import type { GrafKeluarga, KunciAhliWaris } from '@waris/engine';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { tataLetak } from '../hasil/tataLetak';

const bangun = (jenisKelamin: 'L' | 'P', kunci: KunciAhliWaris[]): GrafKeluarga =>
  kunci.reduce((graf, k) => tambahAhliWaris(graf, 'PEWARIS', k), kasusBaru(jenisKelamin).graf);
const id = (graf: GrafKeluarga, kunci: KunciAhliWaris, idMayit = 'PEWARIS') => hitungIsian(graf, idMayit)[kunci]![0]!;

it('orang tua di atas, anak di bawah, pasangan sebaris; saudara di samping pewaris', () => {
  const graf = bangun('L', ['ISTRI', 'IBU', 'AYAH', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG']);
  const { baris } = tataLetak(graf);
  expect(baris).toHaveLength(3);
  expect(new Set(baris[0])).toEqual(new Set([id(graf, 'AYAH'), id(graf, 'IBU')]));
  expect(baris[1]).toEqual([id(graf, 'SAUDARA_KANDUNG'), 'PEWARIS', id(graf, 'ISTRI')]);
  expect(new Set(baris[2])).toEqual(new Set([id(graf, 'ANAK_LK'), id(graf, 'ANAK_PR')]));
});

it('keluarga untuk garis: orang tua dan anak-anaknya', () => {
  const graf = bangun('L', ['ISTRI', 'IBU', 'AYAH', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG']);
  const { keluarga } = tataLetak(graf);
  const keluargaPewaris = keluarga.find(k => k.orangTua.includes('PEWARIS'))!;
  expect(new Set(keluargaPewaris.orangTua)).toEqual(new Set(['PEWARIS', id(graf, 'ISTRI')]));
  expect(new Set(keluargaPewaris.anak)).toEqual(new Set([id(graf, 'ANAK_LK'), id(graf, 'ANAK_PR')]));
  const keluargaAyah = keluarga.find(k => k.orangTua.includes(id(graf, 'AYAH')))!;
  expect(new Set(keluargaAyah.anak)).toEqual(new Set(['PEWARIS', id(graf, 'SAUDARA_KANDUNG')]));
});

it('pasangan tanpa anak tetap disambung garis menikah', () => {
  const graf = bangun('P', ['SUAMI']);
  expect(tataLetak(graf).pasanganSaja).toEqual([['PEWARIS', id(graf, 'SUAMI')]]);
});

it('anak dari suami (istri lain) tergambar di bawah suami saja', () => {
  let graf = bangun('P', ['SUAMI', 'IBU']);
  const idSuami = id(graf, 'SUAMI');
  graf = tambahAhliWaris(graf, idSuami, 'ANAK_LK');
  const { baris, keluarga } = tataLetak(graf);
  const anak = hitungIsian(graf, idSuami).ANAK_LK![0]!;
  expect(baris.at(-1)).toContain(anak);
  expect(keluarga.find(k => k.anak.includes(anak))!.orangTua).toEqual([idSuami]);
});
