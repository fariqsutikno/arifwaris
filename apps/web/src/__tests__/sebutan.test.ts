import { describe, expect, it } from 'vitest';
import { sebutanDariSaya } from '../sebutan';
import { keluargaKarto, tambah } from './fixtures/kanvas';

describe('sebutanDariSaya (spec kanvas 5.8)', () => {
  it('saya = Andi: Budi ayahmu, Dewi ibumu, Sumi nenekmu', () => {
    const { kasus, andi, budi, dewi, sumi } = keluargaKarto();
    const dariAndi = { ...kasus, saya: andi };
    expect(sebutanDariSaya(dariAndi, budi)).toBe('ayahmu');
    expect(sebutanDariSaya(dariAndi, dewi)).toBe('ibumu');
    expect(sebutanDariSaya(dariAndi, sumi)).toBe('nenekmu');
    expect(sebutanDariSaya(dariAndi, andi)).toBeNull();
  });

  it('mayit tetap disebut menurut hubungannya: pewaris Karto dari Andi = kakekmu; Slamet (wafat) = pamanmu', () => {
    const { kasus, andi, slamet } = keluargaKarto();
    const dariAndi = { ...kasus, saya: andi };
    expect(sebutanDariSaya(dariAndi, 'PEWARIS')).toBe('kakekmu');
    expect(sebutanDariSaya(dariAndi, slamet)).toBe('pamanmu');
  });

  it('leluhur dua generasi di atas kakek/nenek = kakek buyutmu / nenek buyutmu', () => {
    const { kasus, andi, ayah } = keluargaKarto();
    let k = kasus;
    const r = tambah(k, 'PEWARIS', 'IBU'); k = r.kasus;
    const dariAndi = { ...k, saya: andi };
    expect(sebutanDariSaya(dariAndi, ayah)).toBe('kakek buyutmu');
    expect(sebutanDariSaya(dariAndi, r.id)).toBe('nenek buyutmu');
  });

  it('tanpa saya, atau saya null → null', () => {
    const { kasus, budi } = keluargaKarto();
    expect(sebutanDariSaya(kasus, budi)).toBeNull();
    expect(sebutanDariSaya({ ...kasus, saya: null }, budi)).toBeNull();
  });
});
