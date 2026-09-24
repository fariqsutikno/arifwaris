import { describe, expect, it } from 'vitest';
import { hitung, hitungMunasakhat, type HasilEngine, type KunciAhliWaris } from '@waris/engine';
import { case01 } from '../../../../packages/engine/src/__tests__/fixtures/bab16';
import { M1 } from '../../../../packages/engine/src/__tests__/fixtures/munasakhat';
import { hitungIsian, tambahAhliWaris } from '../checklist';
import { kasusBaru, type Kasus } from '../kasus';
import { jalankan } from '../jalankan';

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
    kasus = { ...isi(kasus, idSuami!, ['ANAK_LK', 'ANAK_PR']), urutanWafat: [idSuami!] };
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
