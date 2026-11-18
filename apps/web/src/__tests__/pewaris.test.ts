import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { gantiJenisKelaminPewaris, ubahNamaPewaris } from '../pewaris';

describe('pewaris', () => {
  it('ganti jenis kelamin membawa jenisKasus, pintu, tahun wafat, harta, dan nama; keluarga dan kelompokDijawab kosong', () => {
    const dasar = kasusBaru('L');
    const kasus: Kasus = {
      ...dasar,
      graf: tambahAhliWaris({ ...dasar.graf, orang: { PEWARIS: { ...dasar.graf.orang.PEWARIS!, nama: 'Karto' } } }, 'PEWARIS', 'ISTRI'),
      tirkah: { ...dasar.tirkah, kotor: 5_000_000n }, satuanPembulatan: 1000n,
      pintu: 'lama', waktu: { PEWARIS: { wafat: { tahun: 1975, kiraKira: false } } },
      kelompokDijawab: { PEWARIS: ['anak'] },
    };
    const hasil = gantiJenisKelaminPewaris(kasus, 'P');
    expect(hasil).toMatchObject({ jenisKasus: 'nyata', pintu: 'lama', tirkah: { kotor: 5_000_000n }, satuanPembulatan: 1000n,
      waktu: { PEWARIS: { wafat: { tahun: 1975 } } } });
    expect(hasil.graf.orang.PEWARIS).toMatchObject({ nama: 'Karto', jenisKelamin: 'P' });
    expect(Object.keys(hasil.graf.orang)).toEqual(['PEWARIS']);
    expect(hasil.kelompokDijawab).toBeUndefined();
  });

  it('ganti jenis kelamin kasus latihan tetap latihan', () => {
    expect(gantiJenisKelaminPewaris(kasusBaru('L', 'latihan'), 'P').jenisKasus).toBe('latihan');
  });

  it('ubahNamaPewaris menghapus nama bila kosong', () => {
    const bernama = ubahNamaPewaris(kasusBaru('L'), 'Karto');
    expect(bernama.graf.orang.PEWARIS?.nama).toBe('Karto');
    expect(ubahNamaPewaris(bernama, '').graf.orang.PEWARIS).not.toHaveProperty('nama');
  });
});
