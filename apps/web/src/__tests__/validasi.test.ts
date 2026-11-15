import { expect, it } from 'vitest';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { jawabHalLain } from '../halLain';
import { isiBarisTetap, jawabAdaTidak, jawabKamu, slotTetap } from '../isianBagian';
import { kasusBaru, type Kasus } from '../kasus';
import { bagianLengkap, daftarBagian } from '../kelompok';
import { alasanBelumLengkap, langkahTerjauh, LANGKAH_HASIL } from '../layar/wizard/validasi';
import { labelMayit, tandaiWafatSebelumDibagi } from '../latihan';
import { t } from '../terjemah';

const denganHarta = (kasus: Kasus, kotor: bigint): Kasus => ({ ...kasus, tirkah: { ...kasus.tirkah, kotor } });

it('langkah 1 butuh jenis kelamin (kasus belum ada)', () => {
  expect(alasanBelumLengkap(null, 1)).toMatch(/jenis kelamin/);
  expect(langkahTerjauh(null)).toBe(1);
});

it('harta harus lebih dari 0', () => {
  const kasus = kasusBaru('L', 'latihan');
  expect(alasanBelumLengkap(kasus, 2)).toMatch(/harta/i);
  expect(langkahTerjauh(kasus)).toBe(2);
  expect(alasanBelumLengkap(denganHarta(kasus, 1n), 2)).toBeNull();
});

it('minimal satu ahli waris sebelum lanjut dari langkah 3', () => {
  const kasus = denganHarta(kasusBaru('L', 'latihan'), 1_000_000n);
  expect(langkahTerjauh(kasus)).toBe(3);
  expect(alasanBelumLengkap(kasus, 3)).toMatch(/ahli waris/);
  const lengkap = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  expect(langkahTerjauh(lengkap)).toBe(LANGKAH_HASIL);
});

it('mayit lanjutan tanpa ahli waris hidup belum lengkap', () => {
  let kasus = { ...kasusBaru('L', 'latihan'), tirkah: { kotor: 10n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
  kasus = { ...kasus, urutanWafat: [anak] };
  expect(alasanBelumLengkap(kasus, 3)).toMatch(/ahli waris/);
});

it('langkah 1 kasus nyata butuh jawaban pintu; latihan tidak', () => {
  expect(alasanBelumLengkap(kasusBaru('L'), 1)).toMatch(/Pilih salah satu/);
  expect(alasanBelumLengkap({ ...kasusBaru('L'), pintu: 'tidakTahu' }, 1)).toBeNull();
  expect(alasanBelumLengkap(kasusBaru('L', 'latihan'), 1)).toBeNull();
  expect(langkahTerjauh(kasusBaru('L'))).toBe(1);
});

it('langkahTerjauh kasus nyata berhenti di 3 selama ada bagian belum lengkap dan naik ke hasil bila semua lengkap', () => {
  const kasus = { ...denganHarta(kasusBaru('L'), 1_000_000n), pintu: 'baru' as const };
  expect(langkahTerjauh(kasus)).toBe(3);
  expect(alasanBelumLengkap(kasus, 3)).toMatch(/^Masih \d+ bagian, lanjutkan dari Istri\.$/);
  const bagian = (jenis: 'pasangan' | 'anak') => ({ id: `${jenis}:PEWARIS`, milik: 'PEWARIS', jenis });
  let lengkap = jawabAdaTidak(jawabAdaTidak(kasus, bagian('pasangan'), false), bagian('anak'), false);
  for (const bagianTetap of daftarBagian(lengkap)) {
    if (bagianLengkap(lengkap, bagianTetap)) continue;
    if (bagianTetap.jenis === 'orangTua') for (const kunci of slotTetap(lengkap, bagianTetap)) lengkap = isiBarisTetap(lengkap, bagianTetap, kunci, 'hidup');
    else if (bagianTetap.jenis === 'halLain') lengkap = jawabHalLain(lengkap, bagianTetap.milik, false);
    else if (bagianTetap.jenis === 'kamu') lengkap = jawabKamu(lengkap, null);
    else lengkap = jawabAdaTidak(lengkap, bagianTetap, false);
  }
  expect(langkahTerjauh(lengkap)).toBe(LANGKAH_HASIL);
});

it('latihan tidak memakai syarat bagian kanvas', () => {
  const kasus = denganHarta(kasusBaru('L', 'latihan'), 1_000_000n);
  expect(alasanBelumLengkap(kasus, 3)).toMatch(/ahli waris/);
});

it('latihan: langkah 3 tertahan selama ada kartu tanpa ahli waris, alasannya menyebut kartu itu', () => {
  let kasus = denganHarta(kasusBaru('L', 'latihan'), 1_000_000n);
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
  const anak = hitungIsian(kasus.graf, 'PEWARIS').ANAK_LK![0]!;
  kasus = tandaiWafatSebelumDibagi(kasus, anak, true);
  expect(alasanBelumLengkap(kasus, 3)).toBe(t('hitung.latihan.kartu_tanpa_ahli_waris', { nama: labelMayit(kasus, anak) }));
  kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, anak, 'ANAK_LK') };
  expect(alasanBelumLengkap(kasus, 3)).toBeNull();
});
