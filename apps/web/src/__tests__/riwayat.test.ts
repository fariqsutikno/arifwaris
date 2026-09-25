import { beforeEach, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { bacaRiwayat, catatRiwayat, hapusRiwayat, ringkasKasus, waktuRelatif } from '../riwayat';

const kasus = (...daftar: Parameters<typeof tambahAhliWaris>[2][]) => {
  const dasar = kasusBaru('L');
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: 24_000_000n }, graf: daftar.reduce((graf, kunci) => tambahAhliWaris(graf, 'PEWARIS', kunci), dasar.graf) };
};

beforeEach(() => hapusRiwayat());

it('satu entri per sesi, terbaru di atas; kasus yang sama tidak dobel', () => {
  catatRiwayat('a', kasus('ISTRI'), 1);
  catatRiwayat('b', kasus('ISTRI', 'ANAK_PR', 'ANAK_PR'), 2);
  catatRiwayat('a', kasus('ISTRI', 'AYAH'), 3);
  expect(bacaRiwayat().map(entri => [entri.id, entri.judul])).toEqual([['a', 'Istri, Ayah'], ['b', 'Istri, 2 Anak perempuan']]);
  catatRiwayat('c', kasus('ISTRI', 'AYAH'), 4);
  expect(bacaRiwayat().map(entri => entri.id)).toEqual(['c', 'b']);
  hapusRiwayat('b');
  expect(bacaRiwayat().map(entri => entri.id)).toEqual(['c']);
});

it('ringkasan dan waktu relatif', () => {
  expect(ringkasKasus(kasus())).toEqual({ judul: 'Belum ada ahli waris', keterangan: 'Rp 24.000.000' });
  expect(waktuRelatif(0, 30_000)).toBe('baru saja');
  expect(waktuRelatif(0, 5 * 60_000)).toMatch(/5 menit/);
});
