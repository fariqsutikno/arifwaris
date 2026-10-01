import { expect, test } from 'vitest';
import { BATAS_TAMPIL_CARI, SUSUNAN_CEPAT, cariEntri, kasusDariSusunan, kelompokHari, kelompokkanRiwayat, urutRak } from '../lab';
import { hitungIsian } from '../checklist';

const JAM = 3_600_000;
// Rabu 14 Okt 2026 15:00 waktu lokal
const sekarang = new Date(2026, 9, 14, 15).getTime();
const hariIni00 = new Date(2026, 9, 14).getTime();

test('batas hari dihitung dari tengah malam lokal', () => {
  expect(kelompokHari(hariIni00, sekarang)).toBe('hariIni');
  expect(kelompokHari(hariIni00 - 1, sekarang)).toBe('kemarin');
  expect(kelompokHari(new Date(2026, 9, 13).getTime() - 1, sekarang)).toBe('pekanIni');
  expect(kelompokHari(new Date(2026, 9, 8).getTime(), sekarang)).toBe('pekanIni');
  expect(kelompokHari(new Date(2026, 9, 8).getTime() - 1, sekarang)).toBe('lebihLama');
});

test('kelompokkanRiwayat mempertahankan urutan dan membuang kelompok kosong', () => {
  const daftar = [{ waktu: sekarang - JAM }, { waktu: sekarang - 2 * JAM }, { waktu: hariIni00 - JAM }];
  const hasil = kelompokkanRiwayat(daftar, sekarang);
  expect(hasil.map(kelompok => [kelompok.kelompok, kelompok.isi.length])).toEqual([['hariIni', 2], ['kemarin', 1]]);
  expect(kelompokkanRiwayat([], sekarang)).toEqual([]);
});

test('urutRak: tersemat dulu, lalu terbaru', () => {
  const daftar = [
    { id: 'a', disematkan: false, disimpanPada: '2026-10-03' },
    { id: 'b', disematkan: true, disimpanPada: '2026-10-01' },
    { id: 'c', disematkan: false, disimpanPada: '2026-10-05' },
  ];
  expect(urutRak(daftar).map(entri => entri.id)).toEqual(['b', 'c', 'a']);
});

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
