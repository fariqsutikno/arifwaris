import { beforeEach, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru } from '../kasus';
import { MASA_SIMPAN, bacaRiwayat, catatRiwayat, hapusRiwayat, labelSumber, ringkasKasus, waktuRelatif } from '../riwayat';

const sendiri = { jenis: 'sendiri' } as const;

const kasus = (...daftar: Parameters<typeof tambahAhliWaris>[2][]) => {
  const dasar = kasusBaru('L');
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: 24_000_000n }, graf: daftar.reduce((graf, kunci) => tambahAhliWaris(graf, 'PEWARIS', kunci), dasar.graf) };
};

beforeEach(() => hapusRiwayat());

it('satu entri per sesi, terbaru di atas; kasus yang sama tidak dobel', () => {
  catatRiwayat('a', kasus('ISTRI'), 1, sendiri);
  catatRiwayat('b', kasus('ISTRI', 'ANAK_PR', 'ANAK_PR'), 2, sendiri);
  catatRiwayat('a', kasus('ISTRI', 'AYAH'), 3, sendiri);
  expect(bacaRiwayat().map(entri => [entri.id, entri.judul])).toEqual([['a', 'Istri, Ayah'], ['b', 'Istri, 2 Anak perempuan']]);
  catatRiwayat('c', kasus('ISTRI', 'AYAH'), 4, sendiri);
  expect(bacaRiwayat().map(entri => entri.id)).toEqual(['c', 'b']);
  hapusRiwayat('b');
  expect(bacaRiwayat().map(entri => entri.id)).toEqual(['c']);
});

it('sumber tercatat; entri yang tidak dibuka lebih dari 30 hari dibuang', () => {
  catatRiwayat('lama', kasus('ISTRI'), 0, sendiri);
  catatRiwayat('soal', kasus('ANAK_PR'), MASA_SIMPAN + 1, { jenis: 'latihan', kode: 'H-01' });
  expect(bacaRiwayat().map(entri => [entri.id, labelSumber(entri.sumber)])).toEqual([['soal', 'Soal latihan H-01']]);
});

it('ringkasan dan waktu relatif', () => {
  expect(ringkasKasus(kasus())).toEqual({ judul: 'Belum ada ahli waris', keterangan: 'Data belum lengkap', lengkap: false });
  expect(ringkasKasus(kasus('ISTRI'))).toEqual({ judul: 'Istri', keterangan: 'Rp 24.000.000', lengkap: true });
  expect(waktuRelatif(0, 30_000)).toBe('baru saja');
  expect(waktuRelatif(0, 5 * 60_000)).toMatch(/5 menit/);
});
