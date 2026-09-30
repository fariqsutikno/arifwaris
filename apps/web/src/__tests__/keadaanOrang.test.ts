import { describe, expect, it } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import {
  alasanTidakDidukung, babakAsal, calonIbuJanin, janinLahir, tambahJanin, daftarAlmarhum, keadaanOrang, kerabatDari, orangTerputus, perluPeriksaCerita, terapkanKeadaan,
} from '../keadaanOrang';

const TANPA_HARTA = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };
/** Pak Ahmad (PEWARIS) + istri Siti + anak Budi + anak Rina. */
function keluargaAhmad() {
  let kasus = kasusBaru('L');
  for (const kunci of ['ISTRI', 'ANAK_LK', 'ANAK_PR'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
  const cari = (jk: 'L' | 'P', pasangan: boolean) => Object.values(kasus.graf.orang)
    .find(o => o.id !== 'PEWARIS' && o.jenisKelamin === jk && (pasangan ? !o.idAyah : !!o.idAyah))!.id;
  return { kasus, siti: cari('P', true), budi: cari('L', false), rina: cari('P', false) };
}

describe('keadaanOrang', () => {
  it('bawaan: semua masih hidup, almarhum hanya pewaris, tanpa layar cerita', () => {
    const { kasus, budi } = keluargaAhmad();
    expect(keadaanOrang(kasus, budi)).toBe('hidup');
    expect(daftarAlmarhum(kasus)).toEqual(['PEWARIS']);
    expect(perluPeriksaCerita(kasus)).toBe(false);
  });

  it('S1: wafat sesudah, belum dibagi → urutanWafat; babak Budi berisi Siti (ibu) & Rina', () => {
    const { kasus, budi, siti, rina } = keluargaAhmad();
    const baru = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
    expect(baru.urutanWafat).toEqual([budi]);
    expect(keadaanOrang(baru, budi)).toBe('wafatSesudah');
    expect(daftarAlmarhum(baru)).toEqual(['PEWARIS', budi]);
    expect(kerabatDari(baru, budi)).toEqual(expect.arrayContaining([siti, rina]));
    expect(babakAsal(baru, siti)).toBe('PEWARIS');
    expect(perluPeriksaCerita(baru)).toBe(true);
  });

  it('S5: wafat sebelum → statusHidup wafat, tidak di urutan', () => {
    const { kasus, budi } = keluargaAhmad();
    const baru = terapkanKeadaan(kasus, budi, { jenis: 'wafatSebelum' });
    expect(baru.graf.orang[budi]!.statusHidup).toBe('wafat');
    expect(baru.urutanWafat).toEqual([]);
    expect(keadaanOrang(baru, budi)).toBe('wafatSebelum');
  });

  it('S30: wafat sesudah harta dibagi → hanya catatan UI', () => {
    const { kasus, budi } = keluargaAhmad();
    const baru = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: true });
    expect(baru.urutanWafat).toEqual([]);
    expect(baru.wafatSesudahDibagi).toEqual([budi]);
    expect(baru.graf.orang[budi]!.statusHidup).toBe('hidup');
    expect(keadaanOrang(baru, budi)).toBe('wafatSesudahDibagi');
  });

  it('bersamaan dengan pewaris → gharqa dengan harta Budi', () => {
    const { kasus, budi } = keluargaAhmad();
    const baru = terapkanKeadaan(kasus, budi, { jenis: 'bersamaan', keadaan: 'tidakDiketahui', tirkah: { ...TANPA_HARTA, kotor: 7n } });
    expect(baru.gharqa).toEqual({ anggota: ['PEWARIS', budi], keadaan: 'tidakDiketahui', tirkah: { [budi]: { ...TANPA_HARTA, kotor: 7n } } });
    expect(keadaanOrang(baru, budi)).toBe('bersamaan');
  });

  it('hilang dan khuntsa', () => {
    const { kasus, budi } = keluargaAhmad();
    expect(terapkanKeadaan(kasus, budi, { jenis: 'hilang' }).graf.orang[budi]!.statusHidup).toBe('mafqud');
    const k = terapkanKeadaan(kasus, budi, { jenis: 'khuntsa', keadaan: 'diharapkanJelas' });
    expect(k.graf.orang[budi]!.khuntsa).toBe('diharapkanJelas');
    expect(keadaanOrang(k, budi)).toBe('khuntsa');
  });

  it('kembali ke hidup menghapus keadaan lama', () => {
    const { kasus, budi } = keluargaAhmad();
    const hilang = terapkanKeadaan(kasus, budi, { jenis: 'hilang' });
    const hidup = terapkanKeadaan(hilang, budi, { jenis: 'hidup' });
    expect(hidup.graf.orang[budi]!.statusHidup).toBe('hidup');
    expect(keadaanOrang(hidup, budi)).toBe('hidup');
  });

  it('membatalkan Budi menghapus istri Budi, tapi cucu (tetap kerabat pewaris) tidak', () => {
    const { kasus, budi } = keluargaAhmad();
    let k = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
    k = { ...k, graf: tambahAhliWaris(k.graf, budi, 'ISTRI') };
    k = { ...k, graf: tambahAhliWaris(k.graf, budi, 'ANAK_LK') };
    const dewi = Object.keys(k.graf.orang).find(id => !kasus.graf.orang[id] && k.graf.orang[id]!.jenisKelamin === 'P')!;
    const cucu = Object.keys(k.graf.orang).find(id => k.graf.orang[id]!.idAyah === budi)!;
    const batal = terapkanKeadaan(k, budi, { jenis: 'hidup' });
    expect(orangTerputus(k, batal)).toEqual([dewi]);
    expect(batal.graf.orang[dewi]).toMatchObject({ penghubung: true }); // ibu cucu: tetap ada di graf sebagai penghubung, bukan orang nyata
    expect(batal.graf.orang[cucu]).toBeDefined();
  });

  it('menolak dengan jujur: bersamaan di babak 2 (S29) dan campuran gharqa + munasakhat (E2)', () => {
    const { kasus, budi, rina } = keluargaAhmad();
    const s1 = terapkanKeadaan(kasus, budi, { jenis: 'wafatSesudah', hartaSudahDibagi: false });
    const dewiKasus = { ...s1, graf: tambahAhliWaris(s1.graf, budi, 'ISTRI') };
    const dewi = Object.keys(dewiKasus.graf.orang).find(id => !s1.graf.orang[id])!;
    const bersamaan = { jenis: 'bersamaan', keadaan: 'serentak', tirkah: TANPA_HARTA } as const;
    expect(alasanTidakDidukung(dewiKasus, dewi, bersamaan)).toBe('hitung.keadaan.belum_didukung');
    expect(alasanTidakDidukung(s1, rina, bersamaan)).toBe('hitung.keadaan.belum_didukung');
    const g = terapkanKeadaan(kasus, budi, bersamaan);
    expect(alasanTidakDidukung(g, rina, { jenis: 'wafatSesudah', hartaSudahDibagi: false })).toBe('hitung.keadaan.belum_didukung');
    expect(alasanTidakDidukung(kasus, rina, { jenis: 'wafatSesudah', hartaSudahDibagi: false })).toBeNull();
  });
});

it('janin: calon ibu hanya yang janinnya bisa mewarisi; lahir hidup/tanpa kehidupan', () => {
  const { kasus, siti } = keluargaAhmad();
  expect(calonIbuJanin(kasus, 'PEWARIS').map(c => c.idIbu)).toContain(siti);           // istri pewaris
  const k = tambahJanin(kasus, siti, 'PEWARIS');
  const janin = Object.values(k.graf.orang).find(o => o.statusHidup === 'dalamKandungan')!;
  expect(janin).toMatchObject({ idIbu: siti, idAyah: 'PEWARIS' });
  const kembar = janinLahir(k, janin.id, { jenis: 'hidup', anak: ['L', 'P'] }).kasus;
  expect(Object.values(kembar.graf.orang).filter(o => o.idIbu === siti && o.idAyah === 'PEWARIS' && o.statusHidup === 'hidup').length).toBeGreaterThanOrEqual(2);
  expect(janinLahir(k, janin.id, { jenis: 'tanpaKehidupan' }).kasus.graf.orang[janin.id]).toBeUndefined();   // [R13-2]
  const { kasus: w, idBayiWafat } = janinLahir(k, janin.id, { jenis: 'lahirLaluWafat', jenisKelamin: 'P' });
  expect(w.graf.orang[idBayiWafat!]).toMatchObject({ statusHidup: 'hidup', jenisKelamin: 'P' });
});
