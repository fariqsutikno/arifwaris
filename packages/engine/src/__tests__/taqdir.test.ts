import { describe, expect, test } from 'vitest';
import { hitung } from '../pipeline.js';
import { BATAS_DUNIA, hitungTaqdir } from '../taqdir.js';
import type { HasilTaqdir, InputEngine } from '../types.js';
import { GRAF, TAQDIR_FIXTURES } from './fixtures/taqdir.js';
import { input } from './fixtures/bab16.js';

type Ok = Extract<HasilTaqdir, { status: 'OK' }>;

function ok(masukan: InputEngine): Ok {
  const hasil = hitungTaqdir(masukan);
  if (hasil.status !== 'OK') throw new Error(`${hasil.status}: ${JSON.stringify(hasil)}`);
  return hasil;
}

const positif = (saham: Record<string, bigint>) => Object.fromEntries(Object.entries(saham).filter(([, nilai]) => nilai > 0n));
const jumlah = (saham: Record<string, bigint>) => Object.values(saham).reduce((a, b) => a + b, 0n);

describe('Taqdir bab 13 — haml, mafqud, khuntsa (kitab Lahim)', () => {
  for (const fixture of TAQDIR_FIXTURES) {
    test(`${fixture.id}: ${fixture.menguji}`, () => {
      const hasil = ok(fixture.input);
      expect(hasil.jamiah).toBe(fixture.expected.jamiah);
      expect(positif(hasil.diberikan)).toEqual(fixture.expected.diberikan);
      expect(hasil.mauquf).toBe(fixture.expected.mauquf);
      expect(jumlah(hasil.diberikan) + hasil.mauquf, "Σ diberikan + mauquf = jami'ah").toBe(hasil.jamiah);
      for (const dunia of hasil.daftarDunia) {
        expect(jumlah(dunia.saham), "Σ saham dunia = jami'ah").toBe(hasil.jamiah);
      }
    });
  }
});

describe('Taqdir — perilaku lain', () => {
  test('pipeline menolak node yang belum pasti', () => {
    const hasil = hitung(input(GRAF.grafH1));
    expect(hasil.status).toBe('TIDAK_DIDUKUNG');
    expect(hasil.status === 'TIDAK_DIDUKUNG' && hasil.kode).toBe('PERLU_TAQDIR');
  });

  test('[K13a-2] [MLK] haml → seluruh tirkah ditahan', () => {
    expect(hitungTaqdir({ ...input(GRAF.grafH1), ruleset: 'maliki' }).status).toBe('MAUQUF_SEMUA');
  });

  test('tabel "jika terbukti": H1 [SYF] punya 6 dunia, F1 punya 2', () => {
    expect(ok(input(GRAF.grafH1)).daftarDunia).toHaveLength(6);
    expect(ok(input(GRAF.grafF1)).daftarDunia.map(dunia => dunia.taqdir)).toEqual([{ Q: 'hidup' }, { Q: 'mati' }]);
  });

  test('haml di taqdir 2 lk: saham kedua janin digabung ke node haml', () => {
    const duaLk = ok(input(GRAF.grafH1)).daftarDunia.find(dunia => dunia.taqdir.J === 'duaLk')!;
    expect(duaLk.saham).toEqual({ I: 12n, S: 20n, J: 40n });
  });

  test('nominal: diberikan + mauquf + selisih pembulatan = harta bersih', () => {
    const hasil = ok({ ...input(GRAF.grafX5), tirkah: { kotor: 1_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n }, pembulatan: { satuan: 1000n } });
    expect(jumlah(hasil.nominal) + hasil.nominalMauquf + hasil.pembulatan.sisaPembulatan).toBe(1_000_000n);
    expect(hasil.nominal.H).toBe(375_000n);
  });

  test('khuntsa sebagai pasangan → PERLU_INPUT', () => {
    const graf = { ...GRAF.grafX2, orang: { ...GRAF.grafX2.orang, H: { ...GRAF.grafX2.orang.H!, khuntsa: 'diharapkanJelas' as const } } };
    expect(hitungTaqdir(input(graf)).status).toBe('PERLU_INPUT');
  });

  test('[HNF] lebih dari satu khuntsa → TIDAK_DIDUKUNG', () => {
    expect(hitungTaqdir({ ...input(GRAF.grafX7), ruleset: 'hanafi' }).status).toBe('TIDAK_DIDUKUNG');
  });

  test('tanpa ketidakpastian: satu dunia, tanpa mauquf', () => {
    const graf = { ...GRAF.grafF1, orang: { ...GRAF.grafF1.orang, Q: { ...GRAF.grafF1.orang.Q!, statusHidup: 'hidup' as const } } };
    const hasil = ok(input(graf));
    expect(hasil.daftarDunia).toHaveLength(1);
    expect(hasil.mauquf).toBe(0n);
  });

  test('13.0b butir 2: taqdir + munasakhat — bagian saudara hadir yang wafat berpindah ke anaknya', () => {
    const graf = { ...GRAF.grafF1, orang: { ...GRAF.grafF1.orang,
      S: { ...GRAF.grafF1.orang.S!, statusHidup: 'wafat' as const }, N: { id: 'N', jenisKelamin: 'L' as const, idAyah: 'S', statusHidup: 'hidup' as const, agama: 'islam' as const } } };
    const hasil = hitungTaqdir(input(graf), { urutanWafat: ['S'] });
    if (hasil.status !== 'OK') throw new Error(JSON.stringify(hasil));
    expect(positif(hasil.diberikan)).toEqual({ I: 2n * hasil.jamiah / 12n, N: 5n * hasil.jamiah / 12n });
    expect(hasil.mauquf * 12n).toBe(5n * hasil.jamiah);
    // Status tiap mas'alah (pewaris, lalu S) ikut dicatat per dunia, untuk sebutan peran di rantai munasakhat.
    expect(hasil.daftarDunia[0]!.daftarStatus.map(butir => butir.mayit)).toEqual([graf.idPewaris, 'S']);
  });

  test('13.0b butir 4: node belum pasti yang bukan kerabat pewaris tidak menambah dunia', () => {
    const graf = { ...GRAF.grafF1, orang: { ...GRAF.grafF1.orang,
      ASING: { id: 'ASING', jenisKelamin: 'L' as const, statusHidup: 'mafqud' as const, agama: 'islam' as const } } };
    expect(ok(input(graf)).daftarDunia).toHaveLength(ok(input(GRAF.grafF1)).daftarDunia.length);
  });

  test('13.0b butir 2: taqdir + dzawil arham — mafqud menghalangi dzawil arham di taqdir hidup', () => {
    const graf = { ...GRAF.grafF1, orang: { ...GRAF.grafF1.orang,
      I: { ...GRAF.grafF1.orang.I!, statusHidup: 'wafat' as const }, S: { ...GRAF.grafF1.orang.S!, statusHidup: 'wafat' as const },
      B: { id: 'B', jenisKelamin: 'P' as const, idAyah: 'S', statusHidup: 'hidup' as const, agama: 'islam' as const } } };
    const hasil = ok(input(graf));
    expect(positif(hasil.diberikan)).toEqual({});
    expect(hasil.mauquf).toBe(hasil.jamiah);
    expect(hasil.daftarDunia.find(dunia => dunia.taqdir.Q === 'mati')!.saham.B).toBe(hasil.jamiah);
  });

  test('13.0b butir 5: [HNB] khuntsa tak jelas dilebur di dalam tiap taqdir mafqud', () => {
    const graf = { ...GRAF.grafX5b, orang: { ...GRAF.grafX5b.orang, U: { ...GRAF.grafX5b.orang.U!, statusHidup: 'mafqud' as const } } };
    const hasil = ok({ ...input(graf), ruleset: 'hanbali' });
    expect(hasil.daftarDunia.map(dunia => dunia.taqdir)).toEqual([{ U: 'hidup' }, { U: 'mati' }]);
    expect(hasil.jejak.filter(langkah => langkah.jenis === 'TAQDIR_LEBUR')).toHaveLength(2);
    expect(hasil.diberikan.U).toBe(0n);
  });

  test(`lebih dari ${BATAS_DUNIA} dunia → PERLU_INPUT`, () => {
    const orang = { ...GRAF.grafF1.orang };
    for (let indeks = 0; indeks < 9; indeks++) orang[`Q${indeks}`] = { ...orang.Q!, id: `Q${indeks}` };
    expect(hitungTaqdir(input({ ...GRAF.grafF1, orang })).status).toBe('PERLU_INPUT');
  });
});
