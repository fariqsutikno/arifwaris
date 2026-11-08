import { describe, expect, it } from 'vitest';
import type { Kasus } from '../kasus';
import { anggotaHalLain, jawabHalLain, tandaiBedaAgama, tandaiTerlibat } from '../halLain';
import { keluargaKarto } from './fixtures/kanvas';

describe('halLain (spec kanvas 5.2, bab 02)', () => {
  it('anggota = keluarga milik yang masih hidup; Slamet (wafat lebih dulu) tidak ikut', () => {
    const { kasus, rina, budi, slamet } = keluargaKarto();
    const anggota = anggotaHalLain(kasus, 'PEWARIS');
    expect(anggota).toContain(rina);
    expect(anggota).toContain(budi);
    expect(anggota).not.toContain(slamet);
  });

  it('centang beda agama dan terlibat mengubah agama dan membunuhPewaris; bagian dijawab bila ada yang dicentang', () => {
    const { kasus, rina, budi } = keluargaKarto();
    const a = tandaiBedaAgama(kasus, rina, true);
    expect(a.graf.orang[rina]!.agama).toBe('nonIslam');
    expect(a.kelompokDijawab?.PEWARIS).toContain('halLain');
    const b = tandaiTerlibat(a, budi, true);
    expect(b.graf.orang[budi]!.membunuhPewaris).toBe(true);
    const bersih = tandaiBedaAgama(tandaiTerlibat(b, budi, false), rina, false);
    expect(bersih.graf.orang[rina]!.agama).toBe('islam');
    expect(bersih.kelompokDijawab?.PEWARIS ?? []).not.toContain('halLain');   // "Ada" tanpa centang belum jawaban
  });

  it('Tidak membersihkan agama dan membunuh anggota milik itu saja, dan mencatat dijawab', () => {
    const { kasus, rina, dewi } = keluargaKarto();
    expect(anggotaHalLain(kasus, 'PEWARIS')).not.toContain(dewi);   // menantu bukan kerabat almarhum
    const kotor: Kasus = tandaiBedaAgama(tandaiBedaAgama(kasus, rina, true), dewi, true);
    const hasil = jawabHalLain(kotor, 'PEWARIS', false);
    expect(hasil.graf.orang[rina]!.agama).toBe('islam');
    expect(hasil.graf.orang[dewi]!.agama).toBe('nonIslam');   // di luar anggota milik ini, tidak disentuh
    expect(hasil.kelompokDijawab?.PEWARIS).toContain('halLain');
  });

  it('Ada tanpa centang mengembalikan bagian ke belum dijawab', () => {
    const { kasus } = keluargaKarto();
    const dijawab = jawabHalLain(kasus, 'PEWARIS', false);
    expect(jawabHalLain(dijawab, 'PEWARIS', true).kelompokDijawab?.PEWARIS ?? []).not.toContain('halLain');
  });
});
