import { describe, expect, it } from 'vitest';
import { kasusBaru } from '../kasus';
import { tambahAhliWaris } from '../checklist';
import { keteranganMeninggal, tahunWafat, waktuMeninggal } from '../penandaMeninggal';

describe('penandaMeninggal', () => {
  it('keterangan: tahun bila diketahui, selain itu urutan terhadap almarhum', () => {
    expect(keteranganMeninggal('lebihDulu')).toBe('meninggal sebelum almarhum');
    expect(keteranganMeninggal('sesudah')).toBe('meninggal sesudah almarhum');
    expect(keteranganMeninggal('bersamaan')).toBe('meninggal bersamaan');
    expect(keteranganMeninggal('lebihDulu', 1990)).toBe('meninggal 1990');
  });

  it('waktu: pemilik harta dan yang hidup tidak ditandai; penghubung, wafat, dan urutan wafat ditandai', () => {
    const dasar = kasusBaru('L');
    const graf = tambahAhliWaris(tambahAhliWaris(dasar.graf, 'PEWARIS', 'PAMAN_KANDUNG'), 'PEWARIS', 'ANAK_LK');
    const kasus = { ...dasar, graf };
    const penghubung = Object.values(graf.orang).find(orang => orang.penghubung)!.id;
    const anak = Object.values(graf.orang).find(orang => orang.idAyah === 'PEWARIS')!.id;
    expect(waktuMeninggal(kasus, 'PEWARIS')).toBeNull();
    expect(waktuMeninggal(kasus, anak)).toBeNull();
    expect(waktuMeninggal(kasus, penghubung)).toBe('lebihDulu');
    expect(waktuMeninggal({ ...kasus, urutanWafat: [anak] }, anak)).toBe('sesudah');
    expect(tahunWafat({ ...kasus, waktu: { [anak]: { wafat: { tahun: 2001, kiraKira: false } } } }, anak)).toBe(2001);
  });
});
