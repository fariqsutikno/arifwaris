import { describe, expect, it } from 'vitest';
import { tambahAhliWaris, hitungIsian, kurangiAhliWaris } from '../checklist';
import { dariJson, kasusBaru, keJson, rapikanKeadaan, type Kasus } from '../kasus';

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
    const teks = keJson(kasusBaru('L')).replace('"versi":3', '"versi":9');
    expect(dariJson(teks)).toMatchObject({ berhasil: false });
  });

  it('file versi 1 tetap terbaca dan jadi versi 3', () => {
    const teks = keJson(kasusBaru('L')).replace('"versi":3', '"versi":1');
    const hasil = dariJson(teks);
    expect(hasil).toMatchObject({ berhasil: true, kasus: { versi: 3 } });
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
    kasus = rapikanKeadaan({ ...kasus, graf: kurangiAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') });
    expect(kasus.urutanWafat).toEqual([]);
  });
});

const denganAnak = (): { kasus: Kasus; idAnak: string } => {
  const kasus = kasusBaru('L');
  const graf = tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK');
  return { kasus: { ...kasus, graf }, idAnak: Object.keys(graf.orang).find(id => id !== 'PEWARIS')! };
};
const ubahOrang = (kasus: Kasus, id: string, perubahan: object): Kasus =>
  ({ ...kasus, graf: { ...kasus.graf, orang: { ...kasus.graf.orang, [id]: { ...kasus.graf.orang[id]!, ...perubahan } } } });

describe('Kasus v3', () => {
  it('kasusBaru versi 3 tanpa field opsional', () => {
    expect(kasusBaru('L')).toMatchObject({ versi: 3, urutanWafat: [] });
    expect(kasusBaru('L')).not.toHaveProperty('gharqa');
  });

  it('file versi 2 dimigrasi ke versi 3', () => {
    const { kasus } = denganAnak();
    const teks = keJson({ ...kasus, versi: 2 } as unknown as Kasus);
    expect(dariJson(teks)).toMatchObject({ berhasil: true, kasus: { versi: 3 } });
  });

  it('field baru bolak-balik lewat JSON', () => {
    const { kasus, idAnak } = denganAnak();
    const lengkap: Kasus = ubahOrang({
      ...kasus,
      gharqa: { anggota: ['PEWARIS', idAnak], keadaan: 'tidakDiketahui', tirkah: { [idAnak]: { kotor: 5n, tajhiz: 0n, hutang: 0n, wasiat: 0n } } },
    }, idAnak, { statusHidup: 'wafat' });
    const hasil = dariJson(keJson(lengkap));
    expect(hasil).toMatchObject({ berhasil: true });
    if (hasil.berhasil) expect(hasil.kasus.gharqa?.tirkah[idAnak]?.kotor).toBe(5n);
  });

  it('menolak file yang tidak konsisten', () => {
    const { kasus, idAnak } = denganAnak();
    // anggota gharqa masih hidup
    expect(dariJson(keJson({ ...kasus, gharqa: { anggota: ['PEWARIS', idAnak], keadaan: 'serentak', tirkah: {} } }))).toMatchObject({ berhasil: false });
    // orang di dua daftar
    expect(dariJson(keJson({ ...kasus, urutanWafat: [idAnak], wafatSesudahDibagi: [idAnak] }))).toMatchObject({ berhasil: false });
    // dikandungSetelahWafat menunjuk bukan almarhum
    expect(dariJson(keJson({ ...kasus, dikandungSetelahWafat: { [idAnak]: idAnak } }))).toMatchObject({ berhasil: false });
    // status hidup tak dikenal, khuntsa tak sah
    expect(dariJson(keJson(ubahOrang(kasus, idAnak, { statusHidup: 'zombie' })))).toMatchObject({ berhasil: false });
    expect(dariJson(keJson(ubahOrang(kasus, idAnak, { khuntsa: 'ya' })))).toMatchObject({ berhasil: false });
  });

  it('menerima status dalamKandungan, mafqud, dan khuntsa', () => {
    const { kasus, idAnak } = denganAnak();
    for (const perubahan of [{ statusHidup: 'mafqud' }, { statusHidup: 'dalamKandungan' }, { khuntsa: 'diharapkanJelas' }]) {
      expect(dariJson(keJson(ubahOrang(kasus, idAnak, perubahan)))).toMatchObject({ berhasil: true });
    }
  });
});

describe('rapikanKeadaan', () => {
  it('satu orang hanya di satu daftar; urutanWafat tanpa orang berstatus wafat', () => {
    const { kasus, idAnak } = denganAnak();
    expect(rapikanKeadaan({ ...kasus, urutanWafat: [idAnak], wafatSesudahDibagi: [idAnak] }).wafatSesudahDibagi).toBeUndefined();
    expect(rapikanKeadaan(ubahOrang({ ...kasus, urutanWafat: [idAnak] }, idAnak, { statusHidup: 'wafat' })).urutanWafat).toEqual([]);
  });

  it('gharqa hilang bila anggota < 2 atau pewaris bukan anggota', () => {
    const { kasus, idAnak } = denganAnak();
    const wafat = ubahOrang(kasus, idAnak, { statusHidup: 'wafat' });
    expect(rapikanKeadaan({ ...wafat, gharqa: { anggota: ['PEWARIS'], keadaan: 'serentak', tirkah: {} } }).gharqa).toBeUndefined();
    expect(rapikanKeadaan({ ...wafat, gharqa: { anggota: [idAnak, 'X'], keadaan: 'serentak', tirkah: {} } }).gharqa).toBeUndefined();
    expect(rapikanKeadaan({ ...wafat, gharqa: { anggota: ['PEWARIS', idAnak], keadaan: 'serentak', tirkah: {} } }).gharqa?.anggota).toEqual(['PEWARIS', idAnak]);
  });

  it('dikandungSetelahWafat dan pilihanJanin dibersihkan bila rujukannya hilang', () => {
    const { kasus, idAnak } = denganAnak();
    const rapi = rapikanKeadaan({ ...kasus, dikandungSetelahWafat: { [idAnak]: 'O99' }, pilihanJanin: 'tunggu' });
    expect(rapi.dikandungSetelahWafat).toBeUndefined();
    expect(rapi.pilihanJanin).toBeUndefined();
  });
});
