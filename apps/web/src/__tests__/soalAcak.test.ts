import { describe, expect, it } from 'vitest';
import type { SoalHitung, Tingkat } from '@waris/content';
import { kandidatAcak, pilihAcak } from '../layar/belajar/soalAcak';

const soal = (kode: string, bab: number, tingkat: Tingkat) => ({ kode, bab, tingkat }) as SoalHitung;
const daftar = [soal('a', 1, 'dasar'), soal('b', 1, 'sulit'), soal('c', 2, 'dasar'), soal('d', 3, 'menengah')];
const semua = { bab: new Set([1, 2, 3]), tingkat: new Set<Tingkat>(['dasar', 'menengah', 'sulit']), utamakanBelum: false };
const kode = (hasil: { soal: SoalHitung[] }) => hasil.soal.map(isi => isi.kode);

describe('kandidat soal acak', () => {
  it('menyaring bab dan tingkat', () => {
    expect(kode(kandidatAcak(daftar, () => false, { ...semua, bab: new Set([1]) }))).toEqual(['a', 'b']);
    expect(kode(kandidatAcak(daftar, () => false, { ...semua, tingkat: new Set<Tingkat>(['dasar']) }))).toEqual(['a', 'c']);
  });

  it('himpunan kosong = tidak ada kandidat', () => {
    expect(kandidatAcak(daftar, () => false, { ...semua, bab: new Set() }).soal).toEqual([]);
  });

  it('utamakan yang belum dikerjakan; bila semua selesai, jatuh ke yang selesai dan memberi tahu', () => {
    expect(kode(kandidatAcak(daftar, kodeSoal => kodeSoal === 'a', { ...semua, utamakanBelum: true }))).toEqual(['b', 'c', 'd']);
    const tuntas = kandidatAcak(daftar, () => true, { ...semua, utamakanBelum: true });
    expect(kode(tuntas)).toEqual(['a', 'b', 'c', 'd']);
    expect(tuntas.jatuhKeSelesai).toBe(true);
    expect(kandidatAcak(daftar, () => true, { ...semua, bab: new Set(), utamakanBelum: true }).jatuhKeSelesai).toBe(false);
  });
});

describe('pilih acak', () => {
  it('tidak mengulang soal barusan bila ada pilihan lain', () => {
    for (const nilai of [0, 0.5, 0.99]) expect(pilihAcak(daftar, 'a', () => nilai)?.kode).not.toBe('a');
  });
  it('satu-satunya kandidat tetap dipakai; kosong → undefined', () => {
    expect(pilihAcak([daftar[0]!], 'a')?.kode).toBe('a');
    expect(pilihAcak([], undefined)).toBeUndefined();
  });
});
