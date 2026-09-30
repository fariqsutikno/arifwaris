import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { jalankan } from '../jalankan';
import { terapkanKeadaan } from '../keadaanOrang';

function dasar() {
  let kasus: Kasus = { ...kasusBaru('L'), tirkah: { kotor: 1_200_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
  for (const kunci of ['ISTRI', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
  return { kasus, anak };
}

describe('jalankan memilih orkestrator', () => {
  it('biasa', () => expect(jalankan(dasar().kasus).jenis).toBe('biasa'));
  it('munasakhat', () => {
    const { kasus, anak } = dasar();
    const k = terapkanKeadaan(kasus, anak, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
    expect(jalankan({ ...k, graf: tambahAhliWaris(k.graf, anak, 'ANAK_PR') }).jenis).toBe('munasakhat');
  });
  it('taqdir untuk orang hilang', () => {
    const { kasus, anak } = dasar();
    const hasil = jalankan(terapkanKeadaan(kasus, anak, { jenis: 'hilang' }));
    expect(hasil.jenis).toBe('taqdir');
    if (hasil.jenis === 'taqdir') expect(hasil.hasil.status).toBe('OK');
  });
  it('gharqa mendahului semua', () => {
    const { kasus, anak } = dasar();
    const k = terapkanKeadaan(kasus, anak, { jenis: 'bersamaan', keadaan: 'serentak', tirkah: { kotor: 10n, tajhiz: 0n, hutang: 0n, wasiat: 0n } });
    expect(jalankan(k).jenis).toBe('gharqa');
  });
  it('menunggu bila ada janin dan pengguna memilih tunggu', () => {
    const { kasus } = dasar();
    const janin = { id: 'J', jenisKelamin: 'L' as const, idAyah: 'PEWARIS', statusHidup: 'dalamKandungan' as const, agama: 'islam' as const };
    const k: Kasus = { ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, J: janin } }, pilihanJanin: 'tunggu' };
    expect(jalankan(k).jenis).toBe('menunggu');
    expect(jalankan({ ...k, pilihanJanin: 'hitungSekarang' }).jenis).toBe('taqdir');
  });
});
