import { describe, expect, it } from 'vitest';
import type { GrafKeluarga, IdOrang, Orang } from '@waris/engine';
import { sebutanHubungan } from '../hubungan.js';
import { penyusunTes } from './kamus.js';

const orang = (id: IdOrang, jenisKelamin: 'L' | 'P', sisa: Partial<Orang> = {}): Orang => ({ id, jenisKelamin, statusHidup: 'hidup', agama: 'islam', ...sisa });

// Budi (B): ayah Ali, ibu Siti; istri Dewi (anak: Eko); saudara Tono; paman Hasan (saudara Ali); sepupu Sari (anak Hasan),
// anak Sari: Nia; mertua Pak Harjo; menantu Rina (istri Eko); besan Pak Slamet (ayah Rina); ibu tiri Lina (istri ke-2 Ali).
const graf: GrafKeluarga = {
  idPewaris: 'B',
  orang: Object.fromEntries([
    orang('B', 'L', { idAyah: 'ALI', idIbu: 'SITI' }), orang('ALI', 'L'), orang('SITI', 'P'), orang('LINA', 'P'),
    orang('DEWI', 'P', { idAyah: 'HARJO' }), orang('HARJO', 'L'),
    orang('EKO', 'L', { idAyah: 'B', idIbu: 'DEWI' }), orang('RINA', 'P', { idAyah: 'SLAMET' }), orang('SLAMET', 'L'),
    orang('TONO', 'L', { idAyah: 'ALI', idIbu: 'SITI' }), orang('HASAN', 'L', { idAyah: 'KAKEK' }), orang('KAKEK', 'L'),
    orang('SARI', 'P', { idAyah: 'HASAN' }), orang('NIA', 'P', { idIbu: 'SARI' }), orang('SOLO', 'L'),
  ].map(o => [o.id, o])),
  pernikahan: [
    { idSuami: 'ALI', idIstri: 'SITI', status: 'utuh' }, { idSuami: 'ALI', idIstri: 'LINA', status: 'utuh' },
    { idSuami: 'B', idIstri: 'DEWI', status: 'utuh' }, { idSuami: 'EKO', idIstri: 'RINA', status: 'utuh' },
  ],
};
graf.orang.B!.idAyah = 'ALI';
graf.orang.ALI!.idAyah = 'KAKEK';

const sebut = (id: IdOrang, pusat: IdOrang = 'B') => sebutanHubungan(penyusunTes(), graf, pusat, id);

describe('sebutanHubungan [5.4]', () => {
  it.each([
    ['ALI', 'ayah'], ['SITI', 'ibu'], ['DEWI', 'istri'], ['EKO', 'anak laki-laki'], ['TONO', 'saudara laki-laki'],
    ['KAKEK', 'kakek (ayah dari ayah)'], ['HASAN', 'paman'], ['SARI', 'sepupu'], ['HARJO', 'mertua'], ['RINA', 'menantu'],
    ['SLAMET', 'besan'], ['LINA', 'ibu tiri'], ['B', 'diri sendiri'],
  ])('%s → %s', (id, harapan) => { expect(sebut(id)).toBe(harapan); });

  it('tanpa nama baku: dibungkus langkah sisa', () => { expect(sebut('NIA')).toBe('anak perempuan dari sepupu'); });
  it('tidak terhubung → undefined', () => { expect(sebut('SOLO')).toBeUndefined(); });
  it('mengikuti pusat yang dilihat: dari sisi Eko, Budi adalah ayah dan Dewi ibu', () => {
    expect(sebut('B', 'EKO')).toBe('ayah');
    expect(sebut('DEWI', 'EKO')).toBe('ibu');
    expect(sebut('SITI', 'EKO')).toBe('nenek (ibu dari ayah)');
  });
});
