import { describe, expect, it } from 'vitest';
import { tambahAhliWaris, hitungIsian, kurangiAhliWaris } from '../checklist';
import { dariJson, kasusBaru, keJson, rapikanUrutanWafat } from '../kasus';

describe('kasus', () => {
  it('round-trip JSON menjaga bigint', () => {
    const kasus = { ...kasusBaru('L'), tirkah: { kotor: 123456789012345678901n, tajhiz: 5n, hutang: 0n, wasiat: 1n }, satuanPembulatan: 1000n };
    const hasil = dariJson(keJson(kasus));
    expect(hasil).toEqual({ berhasil: true, kasus });
  });

  it('menolak JSON rusak', () => {
    expect(dariJson('{bukan json')).toMatchObject({ berhasil: false });
  });

  it('menolak versi lain', () => {
    const teks = keJson(kasusBaru('L')).replace('"versi":1', '"versi":2');
    expect(dariJson(teks)).toMatchObject({ berhasil: false });
  });

  it('menolak idAyah yang menunjuk orang tidak ada', () => {
    const kasus = kasusBaru('L');
    kasus.graf.orang.PEWARIS = { ...kasus.graf.orang.PEWARIS!, idAyah: 'HANTU' };
    expect(dariJson(keJson(kasus))).toMatchObject({ berhasil: false });
  });

  it('menolak uang negatif atau bukan angka', () => {
    const teks = keJson(kasusBaru('L')).replace('"kotor":"0"', '"kotor":"-5"');
    expect(dariJson(teks)).toMatchObject({ berhasil: false });
  });

  it('menolak satuan pembulatan di luar 1/100/1000', () => {
    const teks = keJson(kasusBaru('L')).replace('"satuanPembulatan":"1"', '"satuanPembulatan":"7"');
    expect(dariJson(teks)).toMatchObject({ berhasil: false });
  });

  it('orang yang dihapus ikut keluar dari urutan wafat', () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
    const [idAnak] = hitungIsian(kasus.graf, 'PEWARIS').ANAK_LK!;
    kasus = { ...kasus, urutanWafat: [idAnak!] };
    kasus = rapikanUrutanWafat({ ...kasus, graf: kurangiAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') });
    expect(kasus.urutanWafat).toEqual([]);
  });
});
