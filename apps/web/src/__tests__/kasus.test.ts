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
    const teks = keJson(kasusBaru('L')).replace('"versi":2', '"versi":9');
    expect(dariJson(teks)).toMatchObject({ berhasil: false });
  });

  it('file versi 1 tetap terbaca dan jadi versi 2', () => {
    const teks = keJson(kasusBaru('L')).replace('"versi":2', '"versi":1');
    const hasil = dariJson(teks);
    expect(hasil).toMatchObject({ berhasil: true, kasus: { versi: 2 } });
  });

  it('rincian harta ikut tersimpan', () => {
    const kasus = { ...kasusBaru('L'), rincianHarta: { tabungan: 5_000_000n, emas: 1n } };
    expect(dariJson(keJson(kasus))).toEqual({ berhasil: true, kasus });
  });

  it('menolak kategori harta yang tidak dikenal', () => {
    const teks = keJson({ ...kasusBaru('L'), rincianHarta: { tabungan: 1n } }).replace('"tabungan"', '"saham"');
    expect(dariJson(teks)).toMatchObject({ berhasil: false });
  });

  it('menolak pewaris atau orang ganda di urutan wafat', () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
    const [idAnak] = hitungIsian(kasus.graf, 'PEWARIS').ANAK_LK!;
    expect(dariJson(keJson({ ...kasus, urutanWafat: ['PEWARIS'] }))).toMatchObject({ berhasil: false });
    expect(dariJson(keJson({ ...kasus, urutanWafat: [idAnak!, idAnak!] }))).toMatchObject({ berhasil: false });
  });

  it('orang penghubung di urutan wafat dirapikan saat file dibuka', () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'CUCU_LK') };
    const idPenghubung = Object.values(kasus.graf.orang).find(orang => orang.penghubung)!.id;
    const hasil = dariJson(keJson({ ...kasus, urutanWafat: [idPenghubung] }));
    expect(hasil).toMatchObject({ berhasil: true, kasus: { urutanWafat: [] } });
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
