// Metode Ahl al-Qarabah [HNF] untuk dzawil arham (KB 14.11, K14-2, K14-3). Fixture dari contoh tertulis KB.
import { describe, expect, test } from 'vitest';
import { hitungDzawilArham } from '../dzawilArham.js';
import type { GrafKeluarga, HasilEngine } from '../types.js';
import { case24 } from './fixtures/bab16.js';
import { dengan, grafDA02, grafDA03, grafDA04, grafDA05, grafDA09, grafDA10, grafDA11, grafDA12 } from './fixtures/dzawilArham.js';
import {
  grafQ1, grafQBedaDerajatLintasPihak, grafQDuaJalur, grafQDuaJalurShinf2, grafQDuaKakekFasid, grafQShinf8,
} from './fixtures/qarabah.js';

type Ok = Extract<HasilEngine, { status: 'OK' }>;

function hitungQarabah(graf: GrafKeluarga): HasilEngine {
  return hitungDzawilArham(dengan(graf, 'hanafi'));
}
function ok(hasil: HasilEngine): Ok {
  if (hasil.status !== 'OK') throw new Error(`${hasil.status}: ${JSON.stringify(hasil, (_, nilai) => (typeof nilai === 'bigint' ? String(nilai) : nilai))}`);
  return hasil;
}
const sahamPerOrang = (hasil: Ok): Record<string, bigint> =>
  Object.fromEntries(hasil.tabel.baris.flatMap(baris => Object.entries(baris.perOrang).map(([id, sel]) => [id, sel.saham] as const)).filter(([, saham]) => saham > 0n));

describe('Qarabah [HNF] — contoh tertulis KB 14.11', () => {
  test('Mabsuth #1: anak ashabul furudh didahulukan atas anak dzawil arham pada derajat sama → semua X1', () => {
    const hasil = ok(hitungQarabah(grafQ1));
    expect(sahamPerOrang(hasil)).toEqual({ X1: 1n });
    expect(hasil.statusOrang.X2).toMatchObject({ jenis: 'mahjub', oleh: ['X1'], rujukanAturan: 'R14-14' });
  });

  test('Mabsuth #2: lebih dekat satu derajat menghalangi walau yang jauh anak ahli waris → semua X1', () => {
    const hasil = ok(hitungQarabah(grafDA03));
    expect(sahamPerOrang(hasil)).toEqual({ X1: 1n });
    expect(hasil.statusOrang.X2).toMatchObject({ jenis: 'mahjub', oleh: ['X1'], rujukanAturan: 'R14-14' });
  });

  test('dua jalur (Mabsuth 30/15): 2:1:1 di tingkat pertama yang berbeda sifat → X 3/4, Y 1/4', () => {
    const hasil = ok(hitungQarabah(grafQDuaJalur));
    expect(sahamPerOrang(hasil)).toEqual({ X: 3n, Y: 1n });
    expect(hasil.tabel.totalKolom.tashih).toBe(4n);
    const duaJalur = hasil.jejak.filter(langkah => langkah.jenis === 'DZAWIL_ARHAM_DUA_JALUR');
    expect(duaJalur).toMatchObject([{ idOrang: 'X', perantara: ['A2', 'B1'] }]);
  });

  test('14.4 (Ibnu Utsaimin): cicit pr dari anak pr (bunuwwah) + anak pr saudara → semua untuk cicit', () => {
    expect(sahamPerOrang(ok(hitungQarabah(grafDA05)))).toEqual({ X1: 1n });
  });

  test('14.9 bersama istri: istri 1/4 penuh, sisa untuk anak saudari kandung → 4: 1, 3', () => {
    const hasil = ok(hitungQarabah(grafDA09));
    expect(sahamPerOrang(hasil)).toEqual({ W: 1n, X: 3n });
    expect(hasil.tabel.totalKolom.tashih).toBe(4n);
    expect(hasil.jejak.some(langkah => langkah.jenis === 'DZAWIL_ARHAM_GABUNG_PASANGAN')).toBe(true);
  });

  test('14.9 empat istri + anak pr saudara kandung → 16: tiap istri 1, anak 12', () => {
    expect(sahamPerOrang(ok(hitungQarabah(grafDA10)))).toEqual({ W1: 1n, W2: 1n, W3: 1n, W4: 1n, X: 12n });
  });
});

describe('Qarabah [HNF] — kaidah 14.11 (urutan shinf, quwwat, pihak ayah/ibu)', () => {
  test("'ammah (pihak ayah) 2/3, khalah (pihak ibu) 1/3 [dasar ijma' sahabat] — 14.6 baris 2", () => {
    const hasil = ok(hitungDzawilArham({ ...case24.input, ruleset: 'hanafi' }));
    expect(sahamPerOrang(hasil)).toEqual({ AM1: 2n, KL1: 1n });
  });

  test('khal dan khalah kandung dalam satu shinf: lk 2:1', () => {
    expect(sahamPerOrang(ok(hitungQarabah(grafDA12)))).toEqual({ KH: 2n, KL: 1n });
  });

  test('anak lk dan anak pr dari anak pr: pusat sama sifat → per badan 2:1 (K14-3 [HNF])', () => {
    expect(sahamPerOrang(ok(hitungQarabah(grafDA11)))).toEqual({ XL: 2n, XP: 1n });
  });

  test('quwwat al-qarabah dalam shinf kedua: kandung menghalangi seibu dan sebapak (14.6 baris 1)', () => {
    const hasil = ok(hitungQarabah(grafDA02));
    expect(sahamPerOrang(hasil)).toEqual({ A1: 1n });
    expect(hasil.statusOrang.A2).toMatchObject({ jenis: 'mahjub', rujukanAturan: 'R14-14' });
    expect(hasil.statusOrang.A3).toMatchObject({ jenis: 'mahjub', rujukanAturan: 'R14-14' });
  });

  test('shinf kedua menghalangi shinf ketiga: anak pr saudari kandung mengalahkan ayahnya ibu (14.6 baris 4)', () => {
    const hasil = ok(hitungQarabah(grafDA04));
    expect(sahamPerOrang(hasil)).toEqual({ B2: 1n });
    expect(hasil.statusOrang.MGF).toMatchObject({ jenis: 'mahjub', rujukanAturan: 'R14-14' });
  });

  test('tanpa jejak tanzil: tidak ada tabel perantara', () => {
    const hasil = ok(hitungQarabah(grafDA11));
    expect(hasil.tanzil).toBeUndefined();
    expect(hasil.jejak.some(langkah => langkah.jenis === 'DZAWIL_ARHAM_TANZIL' || langkah.jenis === 'DZAWIL_ARHAM_MASALAH_PERANTARA')).toBe(false);
  });

  test('invarian: Σ saham = tashih, saham bulat', () => {
    for (const graf of [grafQ1, grafDA03, grafQDuaJalur, grafDA09, grafDA10, grafDA11, grafDA12, grafDA02, grafDA04, grafDA05]) {
      const hasil = ok(hitungQarabah(graf));
      const saham = sahamPerOrang(hasil);
      expect(Object.values(saham).reduce((a, b) => a + b, 0n)).toBe(hasil.tabel.totalKolom.tashih);
    }
  });

  test('nominal: harta 120.000.000 pada contoh dua jalur → X 90 jt, Y 30 jt', () => {
    const masukan = dengan(grafQDuaJalur, 'hanafi');
    const hasil = ok(hitungDzawilArham({ ...masukan, tirkah: { kotor: 120_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } }));
    const nominal = Object.fromEntries(hasil.tabel.baris.flatMap(baris => Object.entries(baris.perOrang).map(([id, sel]) => [id, sel.nominal] as const)));
    expect(nominal).toMatchObject({ X: 90_000_000n, Y: 30_000_000n });
  });
});

describe('Qarabah [HNF] — bentuk di luar KB 14.11 → TIDAK_DIDUKUNG', () => {
  test('dua jalur di luar shinf pertama (contoh KB hanya shinf pertama)', () => {
    expect(hitungQarabah(grafQDuaJalurShinf2)).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['R14-15', 'K14-2'] });
  });

  test('beberapa kakek fasid sepihak: cara membaginya tidak dirumuskan KB', () => {
    expect(hitungQarabah(grafQDuaKakekFasid)).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['R14-14'] });
  });

  test('kerabat di luar tujuh shinf', () => {
    expect(hitungQarabah(grafQShinf8)).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['R14-14'] });
  });

  test('derajat berbeda lintas pihak ayah dan ibu: perbandingannya tidak dirumuskan KB', () => {
    expect(hitungQarabah(grafQBedaDerajatLintasPihak)).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['R14-14'] });
  });

  test('[MLK] tetap ditolak (K14-2)', () => {
    expect(hitungDzawilArham(dengan(grafDA11, 'maliki'))).toMatchObject({ status: 'TIDAK_DIDUKUNG', refs: ['K14-2'] });
  });
});
