import { describe, expect, test } from 'vitest';
import { istilah } from '../terms.js';
import { susun, teksKamus, type Kamus } from '../segments.js';

const KAMUS: Record<string, { id: string; ar?: string | null }> = {
  'narasi.tes.harta': { id: 'Harta ({tirkah}) {jumlah} untuk {orang}.', ar: 'التركة {jumlah}' },
  'narasi.tes.polos': { id: 'Tanpa sisipan.' },
};
const kamus: Kamus = kunci => KAMUS[kunci];
const orang = { jenis: 'orang' as const, daftarIdOrang: ['a'], teks: 'istri' };

describe('susun', () => {
  test('sisipan teks, istilah, orang; teks bersebelahan digabung', () => {
    expect(susun({ kamus, bahasa: 'id' }, 'narasi.tes.harta', { tirkah: istilah('tirkah', 'tirkah'), jumlah: 'Rp10', orang })).toEqual([
      { jenis: 'teks', teks: 'Harta (' }, { jenis: 'istilah', istilah: 'tirkah', teks: 'tirkah' },
      { jenis: 'teks', teks: ') Rp10 untuk ' }, orang, { jenis: 'teks', teks: '.' },
    ]);
  });
  test('bahasa ar memakai ar; ar kosong → id', () => {
    expect(teksKamus({ kamus, bahasa: 'ar' }, 'narasi.tes.harta', { jumlah: '١٠' })).toBe('التركة ١٠');
    expect(teksKamus({ kamus, bahasa: 'ar' }, 'narasi.tes.polos')).toBe('Tanpa sisipan.');
  });
  test('kunci tidak ada → throw', () => {
    expect(() => susun({ kamus, bahasa: 'id' }, 'narasi.tes.hilang')).toThrow('kunci narasi tidak ada: narasi.tes.hilang');
  });
  test('sisipan kurang atau berlebih → throw', () => {
    expect(() => susun({ kamus, bahasa: 'id' }, 'narasi.tes.harta', { jumlah: '1', orang })).toThrow('sisipan {tirkah} tidak disediakan untuk narasi.tes.harta');
    expect(() => susun({ kamus, bahasa: 'id' }, 'narasi.tes.polos', { lebih: '1' })).toThrow('sisipan tidak dipakai templat narasi.tes.polos: lebih');
  });
});
