// Sisi web catatan KHI: dari kasus + hasil yang ditampilkan → daftar catatan relevan (tanpa menghitung bagian).
import { describe, expect, it } from 'vitest';
import { jalankan, kasusBaru } from '@waris/latihan';
import type { Kasus } from '../kasus';
import { catatanKhiUntuk } from '../hasil/catatanKhi';

const kasusDengan = (orang: Kasus['graf']['orang'], pernikahan: Kasus['graf']['pernikahan'] = []): Kasus => {
  const dasar = kasusBaru('L');
  return { ...dasar, graf: { ...dasar.graf, orang: { ...dasar.graf.orang, ...orang }, pernikahan } };
};
const hidup = (id: string, jenisKelamin: 'L' | 'P', lain: object = {}) => ({ id, jenisKelamin, statusHidup: 'hidup' as const, agama: 'islam' as const, ...lain });
const idCatatan = (kasus: Kasus) => catatanKhiUntuk(kasus, jalankan(kasus)).map(catatan => catatan.id);
const PEWARIS = kasusBaru('L').graf.idPewaris;

describe('catatanKhiUntuk', () => {
  it('anak saja → tidak ada catatan', () => {
    expect(idCatatan(kasusDengan({ A: hidup('A', 'L', { idAyah: PEWARIS }) }))).toEqual([]);
  });

  it('istri dan anak → harta bersama', () => {
    const kasus = kasusDengan({ W: hidup('W', 'P'), A: hidup('A', 'L', { idAyah: PEWARIS }) }, [{ idSuami: PEWARIS, idIstri: 'W', status: 'utuh' }]);
    expect(idCatatan(kasus)).toEqual(['hartaBersama']);
  });

  it('cucu dari anak laki-laki yang wafat bersama anak laki-laki lain → pengganti', () => {
    const kasus = kasusDengan({
      S1: hidup('S1', 'L', { idAyah: PEWARIS }), S2: hidup('S2', 'L', { idAyah: PEWARIS, statusHidup: 'wafat' }), C: hidup('C', 'L', { idAyah: 'S2' }),
    });
    expect(idCatatan(kasus)).toEqual(['pengganti']);
  });

  it('mengembalikan data catatan lengkap (bukan hanya id)', () => {
    const kasus = kasusDengan({ A: hidup('A', 'L', { idAyah: PEWARIS, agama: 'nonIslam' }), B: hidup('B', 'P', { idAyah: PEWARIS }) });
    const daftar = catatanKhiUntuk(kasus, jalankan(kasus));
    expect(daftar.map(catatan => catatan.id)).toEqual(['wasiatWajibah', 'penghalang']);
    expect(daftar[0]!.bunyiKhi.length).toBeGreaterThan(0);
  });

  it('hasil galat atau kasus khusus tidak melempar; kosong bila tak ada sinyal', () => {
    const kasus = kasusDengan({ A: hidup('A', 'L', { idAyah: PEWARIS }) });
    expect(catatanKhiUntuk(kasus, { jenis: 'galat', pesan: 'x' })).toEqual([]);
  });
});
