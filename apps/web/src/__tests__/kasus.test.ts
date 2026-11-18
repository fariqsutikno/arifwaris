import { describe, expect, it } from 'vitest';
import { tambahAhliWaris, hitungIsian, kurangiAhliWaris } from '../checklist';
import { dariJson, kasusBaru, keJson, keJsonDibagikan, rapikanKeadaan, type Kasus } from '../kasus';

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
    const teks = keJson(kasusBaru('L')).replace('"versi":4', '"versi":9');
    expect(dariJson(teks)).toMatchObject({ berhasil: false });
  });

  it('file versi 1 tetap terbaca dan jadi versi 4', () => {
    const teks = keJson(kasusBaru('L')).replace('"versi":4', '"versi":1');
    const hasil = dariJson(teks);
    expect(hasil).toMatchObject({ berhasil: true, kasus: { versi: 4 } });
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
  it('kasusBaru versi 4 tanpa field opsional', () => {
    expect(kasusBaru('L')).toMatchObject({ versi: 4, urutanWafat: [] });
    expect(kasusBaru('L')).not.toHaveProperty('gharqa');
  });

  it('file versi 2 dimigrasi ke versi 4', () => {
    const { kasus } = denganAnak();
    const teks = keJson({ ...kasus, versi: 2 } as unknown as Kasus);
    expect(dariJson(teks)).toMatchObject({ berhasil: true, kasus: { versi: 4 } });
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

describe('kasus v4 (spec kanvas silsilah 9.1–9.2)', () => {
  const dasar = () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ISTRI') };
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'ANAK_LK') };
    const isian = hitungIsian(kasus.graf, 'PEWARIS');
    return { kasus, istri: isian.ISTRI![0]!, anak: isian.ANAK_LK![0]! };
  };

  it('kasusBaru: versi 4, bawaan nyata, bisa latihan', () => {
    expect(kasusBaru('L')).toMatchObject({ versi: 4, jenisKasus: 'nyata' });
    expect(kasusBaru('P', 'latihan').jenisKasus).toBe('latihan');
  });

  it('round-trip semua field baru', () => {
    const { kasus, istri, anak } = dasar();
    const penuh = {
      ...kasus, urutanWafat: [anak], pintu: 'lama' as const, saya: istri,
      kelompokDijawab: { PEWARIS: ['pasangan', 'anak'] as const }, belumDiisi: [istri],
      waktu: { [anak]: { wafat: { tahun: 1998, kiraKira: false } } },
      peristiwa: [{ jenis: 'cerai' as const, idOrang: 'PEWARIS', idPasangan: istri, sesudahWafat: 'PEWARIS' }],
      urutanDijawab: [anak],
    };
    const hasil = dariJson(keJson(penuh as unknown as Kasus));
    expect(hasil).toMatchObject({ berhasil: true, kasus: { pintu: 'lama', saya: istri, belumDiisi: [istri], urutanDijawab: [anak] } });
  });

  it('migrasi v3 berurutan wafat: nyata, pintu lama, semua kelompok almarhum dianggap dijawab', () => {
    const { kasus, anak } = dasar();
    const teks = keJson({ ...kasus, urutanWafat: [anak] }).replace('"versi":4', '"versi":3').replace(/,"jenisKasus":"nyata"/, '');
    const hasil = dariJson(teks);
    if (!hasil.berhasil) throw new Error(hasil.pesan);
    expect(hasil.kasus).toMatchObject({ versi: 4, jenisKasus: 'nyata', pintu: 'lama', urutanWafat: [anak] });
    expect(hasil.kasus.kelompokDijawab?.PEWARIS).toContain('halLain');
    expect(hasil.kasus.kelompokDijawab?.[anak]).toContain('anak');
  });

  it('migrasi v3 tanpa urutan wafat: pintu baru', () => {
    const teks = keJson(kasusBaru('L')).replace('"versi":4', '"versi":3').replace(/,"jenisKasus":"nyata"/, '');
    expect(dariJson(teks)).toMatchObject({ berhasil: true, kasus: { pintu: 'baru' } });
  });

  it('menolak TanggalKira rusak', () => {
    const { kasus, anak } = dasar();
    for (const wafat of [{ tahun: 1998.5, kiraKira: false }, { tahun: 1998, bulan: 13, kiraKira: false }, { tahun: 1998 }]) {
      const teks = keJson({ ...kasus, waktu: { [anak]: { wafat } } } as unknown as Kasus);
      expect(dariJson(teks)).toMatchObject({ berhasil: false });
    }
  });

  it('menolak peristiwa ke orang yang tidak ada, dan jenisKasus tak dikenal', () => {
    const { kasus } = dasar();
    expect(dariJson(keJson({ ...kasus, peristiwa: [{ jenis: 'lahir', idOrang: 'HANTU', sesudahWafat: 'PEWARIS' }] } as Kasus))).toMatchObject({ berhasil: false });
    expect(dariJson(keJson(kasus).replace('"jenisKasus":"nyata"', '"jenisKasus":"lain"'))).toMatchObject({ berhasil: false });
  });

  it('rapikanKeadaan membersihkan rujukan orang yang dihapus', () => {
    const { kasus, istri, anak } = dasar();
    const isi: Kasus = {
      ...kasus, urutanWafat: [anak], saya: istri, belumDiisi: [istri], urutanDijawab: [anak],
      kelompokDijawab: { [istri]: ['anak'] }, waktu: { [istri]: { wafat: { tahun: 1990, kiraKira: true } } },
      peristiwa: [{ jenis: 'lahir', idOrang: istri, sesudahWafat: 'PEWARIS' }],
      belumPasti: [{ jenis: 'lahir', anak: istri, almarhum: 'PEWARIS' }],
    };
    const { [istri]: _hapus, ...sisaOrang } = isi.graf.orang;
    const rapi = rapikanKeadaan({ ...isi, graf: { ...isi.graf, orang: sisaOrang, pernikahan: [] } });
    expect(rapi.saya).toBeUndefined();
    expect(rapi.belumDiisi).toBeUndefined();
    expect(rapi.kelompokDijawab).toEqual({});
    expect(rapi.waktu).toEqual({});
    expect(rapi.peristiwa).toBeUndefined();
    expect(rapi.belumPasti).toBeUndefined();
    expect(rapi.urutanDijawab).toEqual([anak]);
  });

  it('urutanDijawab hanya berisi orang di urutan wafat', () => {
    const { kasus, anak } = dasar();
    expect(rapikanKeadaan({ ...kasus, urutanDijawab: [anak] }).urutanDijawab).toBeUndefined();
  });

  it('keJsonDibagikan membuang saya; saya null (mengisi untuk orang lain) juga tidak ikut', () => {
    const { kasus, istri } = dasar();
    expect(JSON.parse(keJsonDibagikan({ ...kasus, saya: istri }))).not.toHaveProperty('saya');
    expect(JSON.parse(keJsonDibagikan({ ...kasus, saya: null }))).not.toHaveProperty('saya');
    expect(dariJson(keJsonDibagikan({ ...kasus, saya: istri }))).toMatchObject({ berhasil: true });
  });

  it('saya: null tersimpan apa adanya', () => {
    const { kasus } = dasar();
    expect(dariJson(keJson({ ...kasus, saya: null }))).toMatchObject({ berhasil: true, kasus: { saya: null } });
  });
});
