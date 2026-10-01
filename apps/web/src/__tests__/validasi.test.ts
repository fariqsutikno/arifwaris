import { expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { alasanBabak, alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from '../layar/wizard/validasi';

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

it('minimal satu ahli waris sebelum lanjut dari langkah 3', () => {
  const kasus = denganHarta(kasusBaru('L'), 1_000_000n);
  expect(langkahTerjauh(kasus)).toBe(3);
  expect(alasanBelumLengkap(kasus, 3)).toMatch(/ahli waris/);
  const lengkap = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  expect(langkahTerjauh(lengkap)).toBe(LANGKAH_HASIL);
});

it('babak almarhum tanpa kerabat belum lengkap', () => {
  let kasus = { ...kasusBaru('L'), tirkah: { kotor: 10n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
  kasus = { ...kasus, urutanWafat: [anak] };
  expect(alasanBabak(kasus, 0)).toBeNull();                 // pewaris punya anak
  expect(alasanBabak(kasus, 1)).not.toBeNull();             // anak belum punya kerabat selain yang wafat
  expect(alasanBelumLengkap(kasus, 3)).not.toBeNull();
});
