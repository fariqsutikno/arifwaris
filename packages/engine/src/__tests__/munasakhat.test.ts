import { describe, expect, test } from 'vitest';
import { hitungMunasakhat } from '../munasakhat.js';
import type { InputMunasakhat, HasilMunasakhat } from '../types.js';
import { M2, MUNASAKHAT_FIXTURES } from './fixtures/munasakhat.js';

type Ok = Extract<HasilMunasakhat, { status: 'OK' }>;

function ok(input: InputMunasakhat): Ok {
  const hasil = hitungMunasakhat(input);
  if (hasil.status !== 'OK') throw new Error(`${hasil.status}: ${JSON.stringify(hasil)}`);
  return hasil;
}

/** Saham > 0 dinyatakan sebagai pecahan saham/jamiah yang dinormalisasi, supaya bisa dibandingkan lintas jami'ah. */
function asFractions(saham: Record<string, bigint>, jamiah: bigint): Record<string, string> {
  const fpb = (a: bigint, b: bigint): bigint => (b === 0n ? a : fpb(b, a % b));
  return Object.fromEntries(Object.entries(saham).filter(([, s]) => s > 0n).map(([id, s]) => {
    const g = fpb(s, jamiah);
    return [id, `${s / g}/${jamiah / g}`];
  }));
}

describe('Munasakhat bab 12 — kasus uji M1–M9 (bab 16)', () => {
  for (const fixture of MUNASAKHAT_FIXTURES) {
    test(`${fixture.id}: ${fixture.menguji}`, () => {
      const hasil = ok(fixture.input);
      const { expected } = fixture;

      expect(asFractions(hasil.saham, hasil.jamiah)).toEqual(asFractions(expected.saham, expected.jamiah));
      expect(Object.values(hasil.saham).reduce((a, b) => a + b, 0n), 'Σ saham = jami\'ah').toBe(hasil.jamiah);
      if (expected.exactJamiah) {
        expect(hasil.jamiah).toBe(expected.jamiah);
        expect(hasil.saham).toEqual(expected.saham);
      }
      expect(hasil.keadaan, 'keadaan').toBe(expected.keadaan);
      if (expected.ikhtishar) expect(hasil.ikhtishar).toEqual(expected.ikhtishar);
      if (expected.relations) {
        const relations = hasil.jejak.flatMap(step => (step.jenis === 'MUNASAKHAT' ? [step.hubungan] : []));
        expect(relations).toEqual(expected.relations);
      }
      expect(hasil.langkahLangkah.map(s => s.mayit)).toEqual([fixture.input.dasar.graf.idPewaris, ...fixture.input.urutanWafat]);
    });
  }
});

describe('Munasakhat — penolakan dan pertanyaan', () => {
  const cloneGraph = () => {
    const { graf } = M2.input.dasar;
    return { ...graf, orang: { ...graf.orang }, pernikahan: [...graf.pernikahan] };
  };

  test('yang wafat tanpa bagian dari mayit sebelumnya (mahjub) → diabaikan dengan catatan', () => {
    const graf = cloneGraph();
    graf.orang['F1'] = { id: 'F1', jenisKelamin: 'L', statusHidup: 'wafat', agama: 'islam', penghubung: true };
    graf.orang['D'] = { ...graf.orang['D']!, idAyah: 'F1' };
    graf.orang['AK'] = { id: 'AK', jenisKelamin: 'L', statusHidup: 'hidup', agama: 'islam', idAyah: 'F1' };
    const hasil = ok({ ...M2.input, dasar: { ...M2.input.dasar, graf }, urutanWafat: ['AK', 'B'] });
    expect(hasil.jejak).toContainEqual({ tahap: 'munasakhat', refs: ['R12-1'], jenis: 'MUNASAKHAT_DILEWATI', mayit: 'AK' });
    expect(hasil.langkahLangkah.map(s => s.mayit)).toEqual(['D', 'B']);
    expect(hasil.saham).toEqual({ W: 16n, S: 56n });
  });

  test('data kurang pada mayit berikutnya → PERLU_INPUT dengan mayit-nya', () => {
    const graf = cloneGraph();
    graf.orang['HB'] = { id: 'HB', jenisKelamin: 'L', statusHidup: 'hidup', agama: 'tidakDiketahui' };
    graf.pernikahan.push({ idSuami: 'HB', idIstri: 'B', status: 'utuh' });
    const hasil = hitungMunasakhat({ ...M2.input, dasar: { ...M2.input.dasar, graf } });
    expect(hasil).toMatchObject({ status: 'PERLU_INPUT', mayit: 'B', pertanyaan: [{ idOrang: 'HB', isian: 'agama' }] });
  });
});

describe('Munasakhat — nominal', () => {
  test('hanya harta mayit pertama yang dibagi, menurut jami\'ah (bab 12.5)', () => {
    const hasil = ok({ ...M2.input, dasar: { ...M2.input.dasar, tirkah: { kotor: 72_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } } });
    expect(hasil.nominal).toEqual({ W: 16_000_000n, S: 56_000_000n });
    expect(hasil.pembulatan.sisaPembulatan).toBe(0n);
  });
});
