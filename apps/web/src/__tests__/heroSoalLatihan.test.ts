import { describe, expect, it } from 'vitest';
import type { SoalHitung } from '@waris/content';
import { urutanSoalHitung } from '../layar/belajar/KuisKonsep';

const soal = (kode: string, bab: number): SoalHitung => ({ kode, bab, tingkat: 'dasar', judul: kode, kasus: {} as never, topik: '', sumber: '' });

describe('urutanSoalHitung', () => {
  it('mengelompokkan per bab menaik, mempertahankan urutan di dalam bab (sama dengan daftar Latihan)', () => {
    expect(urutanSoalHitung([soal('b2-1', 2), soal('b1-1', 1), soal('b2-2', 2), soal('b1-2', 1)]).map(isi => isi.kode)).toEqual(['b1-1', 'b1-2', 'b2-1', 'b2-2']);
  });
});
