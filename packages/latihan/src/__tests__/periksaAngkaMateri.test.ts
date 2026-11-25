// Angka contoh di materi harus sama dengan engine; peraga 'aul hanya untuk kasus yang benar-benar 'aul.
import { expect, test } from 'vitest';
import { bacaBlok } from '@waris/content';
import { hitungContoh, periksaAngkaMateri } from '../index.js';

const periksa = (isi: string) => { const blok = bacaBlok('u', isi); return periksaAngkaMateri(blok, blok.map(() => 1)).map(temuan => temuan.pesan); };

test('hitungContoh: Umm al-Furukh 6 → 10', () => {
  expect(hitungContoh('P', ['SUAMI', 'IBU', 'SAUDARA_SEIBU', 'SAUDARA_SEIBU', 'SAUDARI_KANDUNG', 'SAUDARI_KANDUNG'])).toMatchObject({
    ok: true, ashlAkhir: 10n, aul: true, saham: { SUAMI: 3n, IBU: 1n, SAUDARA_SEIBU: 2n, SAUDARI_KANDUNG: 4n },
  });
});

test('kasus: harapan cocok lolos, salah ditolak dengan angka engine', () => {
  const kasus = (harapan: string) => `\`\`\`kasus\npewaris: L\nahli waris: ISTRI, ANAK_LK, IBU, SAUDARA_KANDUNG\nharta: 120.000.000\nharapan: ${harapan}\n\`\`\``;
  expect(periksa(kasus('ISTRI 3, IBU 4, ANAK_LK 17; ashl 24'))).toEqual([]);
  expect(periksa(kasus('ISTRI 3, IBU 4, ANAK_LK 17; ashl 25'))).toEqual([expect.stringContaining('Engine: "ISTRI 3, IBU 4, ANAK_LK 17; ashl 24"')]);
});

test('peraga aul pada kasus tanpa aul ditolak; kunci simulasi tak dikenal ditolak', () => {
  expect(periksa('```peraga\npewaris: P\ntampil: aul\nkeadaan: A\nahli waris: SUAMI, 2 SAUDARI_KANDUNG\npenjelasan: x\n```')).toEqual([]);
  expect(periksa('```peraga\npewaris: L\ntampil: aul\nkeadaan: A\nahli waris: ISTRI, ANAK_LK\npenjelasan: x\n```')).toHaveLength(1);
  expect(periksa('```simulasi\npewaris: L\npilihan: AYAH, CICIT\nawal: AYAH\ntampil: status\n```')).toEqual([expect.stringContaining('CICIT')]);
});
