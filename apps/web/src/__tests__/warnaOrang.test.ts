import { describe, expect, it } from 'vitest';
import { kasusBaru } from '../kasus';
import { tambahAhliWaris } from '../checklist';
import { jalankan } from '@waris/latihan';
import { ringkas } from '../hasil/ringkasan';
import { WARNA_NETRAL, warnaOrang } from '../hasil/warnaOrang';

describe('warnaOrang', () => {
  it('penerima berwarna berbeda, yang terhalang netral', () => {
    const awal = kasusBaru('L');
    const graf = (['ISTRI', 'IBU', 'ANAK_LK', 'ANAK_PR', 'SAUDARA_KANDUNG'] as const).reduce((g, k) => tambahAhliWaris(g, 'PEWARIS', k), awal.graf);
    const kasus = { ...awal, graf, tirkah: { kotor: 24_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
    const ringkasan = ringkas(kasus, jalankan(kasus));
    const warna = ringkasan.penerima.map(orang => warnaOrang(ringkasan, orang.id));
    expect(new Set(warna).size).toBe(warna.length);
    expect(ringkasan.terhalang.map(orang => warnaOrang(ringkasan, orang.id))).toEqual([WARNA_NETRAL]);
  });
});
