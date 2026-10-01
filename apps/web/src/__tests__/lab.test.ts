import { expect, test } from 'vitest';
import { BATAS_TAMPIL_CARI, SUSUNAN_CEPAT, cariEntri, kasusDariSusunan } from '../lab';
import { hitungIsian } from '../checklist';

test('cariEntri tidak peka huruf besar dan mencari judul serta keterangan', () => {
  const daftar = [{ judul: 'Keluarga Budi', keterangan: 'Rp 1' }, { judul: 'Istri, Ayah', keterangan: 'Data belum lengkap' }];
  expect(cariEntri(daftar, 'budi')).toHaveLength(1);
  expect(cariEntri(daftar, 'BELUM')).toHaveLength(1);
  expect(cariEntri(daftar, '  ')).toHaveLength(2);
  expect(BATAS_TAMPIL_CARI).toBe(8);
});

test('tiap susunan cepat menghasilkan kasus sah dengan ahli waris sesuai', () => {
  for (const susunan of SUSUNAN_CEPAT) {
    const kasus = kasusDariSusunan(susunan);
    const isian = hitungIsian(kasus.graf, kasus.graf.idPewaris);
    expect(Object.keys(isian).sort()).toEqual([...new Set(susunan.ahliWaris)].sort());
    expect(kasus.tirkah.kotor).toBe(0n);
  }
});
