import { describe, expect, test } from 'vitest';
import { hitung } from '../pipeline.js';
import { hitungTaqdir } from '../taqdir.js';
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
});
