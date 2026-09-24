import { expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from '../layar/wizard/validasi';

const denganHarta = (kasus: Kasus, kotor: bigint): Kasus => ({ ...kasus, tirkah: { ...kasus.tirkah, kotor } });

it('langkah 1 butuh jenis kelamin (kasus belum ada)', () => {
  expect(alasanBelumLengkap(null, 1)).toMatch(/jenis kelamin/);
  expect(langkahTerjauh(null)).toBe(1);
});

it('harta harus lebih dari 0', () => {
  const kasus = kasusBaru('L');
  expect(alasanBelumLengkap(kasus, 2)).toMatch(/harta/i);
  expect(langkahTerjauh(kasus)).toBe(2);
  expect(alasanBelumLengkap(denganHarta(kasus, 1n), 2)).toBeNull();
});

it('minimal satu ahli waris sebelum lanjut dari langkah 4', () => {
  const kasus = denganHarta(kasusBaru('L'), 1_000_000n);
  expect(langkahTerjauh(kasus)).toBe(4);
  expect(alasanBelumLengkap(kasus, 4)).toMatch(/ahli waris/);
  const lengkap = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  expect(langkahTerjauh(lengkap)).toBe(LANGKAH_HASIL);
});
