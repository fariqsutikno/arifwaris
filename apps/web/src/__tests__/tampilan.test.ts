import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bacaSuara, geraknyaDikurangi, penggunaMengurangiGerak, simpanGerakKurang, simpanSuara, suaraAktif } from '../tampilan';

const matchMedia = (reduce: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));

beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute('data-gerak'); matchMedia(false); });

describe('gerak', () => {
  it('bawaan: tidak dikurangi, atribut tidak terpasang', () => {
    expect(geraknyaDikurangi()).toBe(false);
    expect(document.documentElement.hasAttribute('data-gerak')).toBe(false);
  });
  it('pengguna mematikan animasi: diingat dan atribut data-gerak terpasang; menyalakan lagi melepasnya', () => {
    simpanGerakKurang(true);
    expect(penggunaMengurangiGerak()).toBe(true);
    expect(document.documentElement.getAttribute('data-gerak')).toBe('kurang');
    simpanGerakKurang(false);
    expect(document.documentElement.hasAttribute('data-gerak')).toBe(false);
  });
  it('sistem meminta kurangi gerak: dianggap dikurangi walau pengguna belum memilih', () => {
    matchMedia(true);
    expect(geraknyaDikurangi()).toBe(true);
    expect(penggunaMengurangiGerak()).toBe(false);
  });
});

describe('suara', () => {
  it('bawaan "ikut": nyala di Belajar, mati di Hitung', () => {
    expect(bacaSuara()).toBe('ikut');
    expect(suaraAktif('belajar')).toBe(true);
    expect(suaraAktif('hitung')).toBe(false);
  });
  it('nyala: di mana pun; mati: tidak di mana pun; diingat', () => {
    simpanSuara('nyala');
    expect(suaraAktif('hitung')).toBe(true);
    simpanSuara('mati');
    expect(suaraAktif('belajar')).toBe(false);
    expect(bacaSuara()).toBe('mati');
  });
  it('nilai tersimpan yang tidak dikenal jatuh ke "ikut"', () => {
    localStorage.setItem('arif-waris:suara', 'keras');
    expect(bacaSuara()).toBe('ikut');
  });
});
