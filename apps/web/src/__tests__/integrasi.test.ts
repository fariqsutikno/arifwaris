import { describe, expect, it } from 'vitest';
import { hitung, hitungMunasakhat, type HasilEngine, type KunciAhliWaris } from '@waris/engine';
import { case01 } from '../../../../packages/engine/src/__tests__/fixtures/bab16';
import { M1 } from '../../../../packages/engine/src/__tests__/fixtures/munasakhat';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { jalankan } from '../jalankan';
import { tambahJanin, terapkanKeadaan } from '../keadaanOrang';

type Ok = Extract<HasilEngine, { status: 'OK' }>;
const sahamPerKunci = (hasil: Ok) => {
  const ringkas: Partial<Record<string, string[]>> = {};
  for (const baris of hasil.tabel.baris) {
    for (const [id, { saham }] of Object.entries(baris.perOrang)) {
      const status = hasil.statusOrang[id]!;
      const kunci = 'peran' in status ? status.peran.kunci : 'LAIN';
      (ringkas[kunci] ??= []).push(String(saham));
    }
  }
  for (const daftar of Object.values(ringkas)) daftar!.sort();
  return ringkas;
};
const isi = (kasus: Kasus, idMayit: string, daftar: KunciAhliWaris[]): Kasus =>
  ({ ...kasus, graf: daftar.reduce((graf, kunci) => tambahAhliWaris(graf, idMayit, kunci), kasus.graf) });

describe('UI → engine identik dengan fixture', () => {
  it('C16-01 istri, anak lk, anak pr', () => {
    const kasus = isi(kasusBaru('L'), 'PEWARIS', ['ISTRI', 'ANAK_LK', 'ANAK_PR']);
    const dariUi = jalankan(kasus);
    const dariFixture = hitung(case01.input) as Ok;
    if (dariUi.jenis !== 'biasa' || dariUi.hasil.status !== 'OK') throw new Error(JSON.stringify(dariUi));
    expect(sahamPerKunci(dariUi.hasil)).toEqual(sahamPerKunci(dariFixture));
    expect(dariUi.hasil.tabel.totalKolom).toEqual(dariFixture.tabel.totalKolom);
  });

  it('M1 munasakhat: suami wafat sebelum pembagian', () => {
    let kasus = isi(kasusBaru('P'), 'PEWARIS', ['SUAMI', 'IBU', 'SAUDARA_KANDUNG']);
    const [idSuami] = hitungIsian(kasus.graf, 'PEWARIS').SUAMI!;
    kasus = isi(terapkanKeadaan(kasus, idSuami!, { jenis: 'wafatSesudah', hartaSudahDibagi: false }), idSuami!, ['ANAK_LK', 'ANAK_PR']);
    const dariUi = jalankan(kasus);
    const dariFixture = hitungMunasakhat(M1.input);
    if (dariUi.jenis !== 'munasakhat' || dariUi.hasil.status !== 'OK' || dariFixture.status !== 'OK') throw new Error(JSON.stringify(dariUi));
    expect(dariUi.hasil.jamiah).toBe(dariFixture.jamiah);
    expect(Object.values(dariUi.hasil.saham).map(String).sort()).toEqual(Object.values(dariFixture.saham).map(String).sort());
  });

  it('exception engine menjadi galat, bukan crash', () => {
    const kasus = kasusBaru('L');
    const rusak = { ...kasus, graf: { ...kasus.graf, idPewaris: 'TIDAK_ADA' } };
    expect(jalankan(rusak).jenis).toBe('galat');
  });
});

describe('kasus bab 13 lewat jawaban UI', () => {
  it('H1 [SYF]: ibu hamil dari ayah mayit, saudara lk kandung → saudara 0, mauquf 60/72', () => {
    let kasus = kasusBaru('L');
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'IBU') };
    kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', 'SAUDARA_KANDUNG') };
    const ibu = kasus.graf.orang['PEWARIS']!.idIbu!;
    const ayah = kasus.graf.orang['PEWARIS']!.idAyah!;   // penghubung wafat
    kasus = tambahJanin(kasus, ibu, ayah);
    const hasil = jalankan(kasus);
    if (hasil.jenis !== 'taqdir' || hasil.hasil.status !== 'OK') throw new Error(JSON.stringify(hasil, (_k, v) => (typeof v === 'bigint' ? String(v) : v)));
    const { jamiah, mauquf, diberikan } = hasil.hasil;
    expect(mauquf * 72n).toBe(60n * jamiah);
    expect(diberikan[ibu]! * 72n).toBe(12n * jamiah);
  });

  it('F1: ibu, saudara lk sebapak hadir, saudara lk sebapak hilang → mauquf 5/12', () => {
    let kasus = kasusBaru('L');
    for (const kunci of ['IBU', 'SAUDARA_SEBAPAK', 'SAUDARA_SEBAPAK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
    const hilang = Object.values(kasus.graf.orang).filter(o => o.jenisKelamin === 'L' && o.id !== 'PEWARIS' && !o.penghubung).at(-1)!.id;
    kasus = terapkanKeadaan(kasus, hilang, { jenis: 'hilang' });
    const hasil = jalankan(kasus);
    if (hasil.jenis !== 'taqdir' || hasil.hasil.status !== 'OK') throw new Error(JSON.stringify(hasil, (_k, v) => (typeof v === 'bigint' ? String(v) : v)));
    expect(hasil.hasil.mauquf * 12n).toBe(5n * hasil.hasil.jamiah);
  });

  it('X1: ayah, 2 anak pr, cucu (anak dari anak lk) khuntsa → mauquf 1/6', () => {
    let kasus = kasusBaru('L');
    for (const kunci of ['AYAH', 'ANAK_PR', 'ANAK_PR', 'CUCU_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
    const cucu = Object.values(kasus.graf.orang).find(o => o.idAyah && kasus.graf.orang[o.idAyah]?.penghubung)!.id;
    kasus = terapkanKeadaan(kasus, cucu, { jenis: 'khuntsa', keadaan: 'diharapkanJelas' });
    const hasil = jalankan(kasus);
    if (hasil.jenis !== 'taqdir' || hasil.hasil.status !== 'OK') throw new Error(JSON.stringify(hasil, (_k, v) => (typeof v === 'bigint' ? String(v) : v)));
    expect(hasil.hasil.mauquf * 6n).toBe(1n * hasil.hasil.jamiah);
  });

  it('gharqa [SYF] serentak: dua harta terpisah, tidak saling mewarisi', () => {
    let kasus = { ...kasusBaru('L'), tirkah: { kotor: 600n, tajhiz: 0n, hutang: 0n, wasiat: 0n } };
    for (const kunci of ['ISTRI', 'ANAK_LK'] as const) kasus = { ...kasus, graf: tambahAhliWaris(kasus.graf, 'PEWARIS', kunci) };
    const anak = Object.values(kasus.graf.orang).find(o => o.idAyah === 'PEWARIS')!.id;
    kasus = terapkanKeadaan(kasus, anak, { jenis: 'bersamaan', keadaan: 'serentak', tirkah: { kotor: 300n, tajhiz: 0n, hutang: 0n, wasiat: 0n } });
    const hasil = jalankan(kasus);
    if (hasil.jenis !== 'gharqa' || hasil.hasil.status !== 'OK') throw new Error(JSON.stringify(hasil, (_k, v) => (typeof v === 'bigint' ? String(v) : v)));
    expect(hasil.hasil.metode).toBe('terpisah');
    const hartaAyah = hasil.hasil.harta.find(h => h.mayit === 'PEWARIS')!;
    expect(hartaAyah.saham[anak]).toBeUndefined();   // anak tidak mewarisi ayah [R13-10]
  });
});
