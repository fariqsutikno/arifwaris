import { describe, expect, it } from 'vitest';
import type { KunciAhliWaris, PeranAhliWaris } from '@waris/engine';
import { labelPeran } from '../people.js';
import { penyusunTes } from './kamus.js';

const peran = (kunci: KunciAhliWaris, generasiLeluhur: number, kedalamanKeturunan: number): PeranAhliWaris =>
  ({ idOrang: 'X', kunci, kekerabatan: { generasiLeluhur, kedalamanKeturunan, jalur: 'kandung', lewatPerempuan: false }, lintasan: [] });
const label = (...args: Parameters<typeof peran>) => labelPeran(penyusunTes(), peran(...args));

describe('labelPeran bertingkat (bab 3.1–3.2 "dan seterusnya ke bawah")', () => {
  it('kedalaman dasar tetap memakai label bab 3', () => {
    expect(label('CUCU_LK', 0, 2)).toBe('cucu laki-laki dari anak laki-laki');
    expect(label('SEPUPU_KANDUNG', 2, 2)).toBe('anak laki-laki paman kandung');
  });
  it('lebih dalam dari dasar → "anak ... dari" bertingkat', () => {
    expect(label('CUCU_LK', 0, 3)).toBe('anak laki-laki dari cucu laki-laki dari anak laki-laki');
    expect(label('CUCU_PR', 0, 4)).toBe('anak perempuan dari anak laki-laki dari cucu laki-laki dari anak laki-laki');
    expect(label('KEPONAKAN_SEBAPAK', 1, 3)).toBe('anak laki-laki dari anak laki-laki saudara sebapak');
    expect(label('SEPUPU_KANDUNG', 2, 3)).toBe('anak laki-laki dari anak laki-laki paman kandung');
  });
  it('bertingkat ke bawah dan ke atas sekaligus', () => {
    expect(label('SEPUPU_SEBAPAK', 3, 3)).toBe('anak laki-laki dari anak laki-laki paman sebapak ayah');
  });
});
