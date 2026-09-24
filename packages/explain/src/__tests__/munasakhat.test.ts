import { computeMunasakhat, type MunasakhatInput } from '@waris/engine';
import { describe, expect, test } from 'vitest';
import { M2, M7, M8, M9 } from '../../../engine/src/__tests__/fixtures/munasakhat.js';
import { explainMunasakhat, toPlainText, type MunasakhatExplanation } from '../index.js';

function explainCase(input: MunasakhatInput, mode?: 'cerita' | 'ringkas'): MunasakhatExplanation {
  const result = computeMunasakhat(input);
  if (result.status !== 'OK') throw new Error(result.status);
  return explainMunasakhat(result, input.base.graph, mode ? { mode } : {});
}

const texts = (e: MunasakhatExplanation, part: number, section = 0) =>
  e.parts[part]!.sections[section]!.lines.map(toPlainText);
const lastSection = (e: MunasakhatExplanation, part: number) =>
  e.parts[part]!.sections[e.parts[part]!.sections.length - 1]!;

describe('M2 — penjelasan munasakhat', () => {
  const e = explainCase(M2.input);

  test('susunan bagian: pembukaan, tiap mayit, hasil akhir', () => {
    expect(e.parts.map(p => p.title)).toEqual([
      'Kematian berantai', 'Pembagian harta almarhum', 'Bagian anak perempuan diteruskan', 'Hasil akhir',
    ]);
  });

  test('pembukaan menjelaskan munasakhat dan batas cakupannya (bab 12.5)', () => {
    expect(texts(e, 0)).toEqual([
      'Almarhum wafat. Sebelum hartanya dibagi, anak perempuan ikut wafat, berurutan seperti itu. Kasus seperti ini disebut '
        + 'munasakhat: bagian yang sudah menjadi hak orang yang wafat belakangan diteruskan kepada ahli warisnya.',
      'Susunan ahli warisnya berubah dari satu kematian ke kematian berikutnya (keadaan ketiga), jadi bagian tiap orang yang wafat '
        + 'diteruskan satu per satu.',
      'Yang diteruskan hanyalah bagian dari harta almarhum yang sampai kepada mereka, bukan pembagian waris atas seluruh harta '
        + 'mereka. Hutang, wasiat, dan harta lain milik mereka diselesaikan oleh ahli warisnya masing-masing.',
    ]);
  });

  test('mayit kedua disebut dengan perannya di pembagiannya sendiri', () => {
    expect(texts(e, 2)[0]).toBe('Ahli waris (warits) anak perempuan: ibu dan saudara laki-laki kandung.');
  });

  test('penggabungan tabayun dengan rincian per orang', () => {
    const section = lastSection(e, 2);
    expect(section.title).toBe('Menggabungkan dengan pembagian sebelumnya');
    expect(section.lines.map(toPlainText)).toEqual([
      'Anak perempuan mendapat 7 dari 24 bagian. Bagian itu dibagi kepada ahli warisnya, yang pembagiannya memakai 3 bagian.',
      '7 dan 3 tidak bisa sama-sama dibagi kecuali oleh 1 (tabayun). Angka pembagi sebelumnya dikali 3, dan bagian ahli waris '
        + 'anak perempuan dikali 7.',
      "Angka pembagi gabungan (jami'ah) sekarang 72:",
      'Istri: 3 × 3 + 1 × 7 = 16.',
      'Anak laki-laki: 14 × 3 + 2 × 7 = 56.',
    ]);
    expect(section.lines[2]!.segments).toContainEqual({ kind: 'term', term: 'jamiah', text: "jami'ah" });
  });

  test('hasil akhir: angka kitab + ringkasan', () => {
    expect(texts(e, 3)).toEqual([
      'Semua angka bisa diringkas dengan membagi 8: 72 menjadi 9.',
      'Istri: 16/72 (diringkas 2/9).',
      'Anak laki-laki: 56/72 (diringkas 7/9).',
    ]);
  });

  test('nominal hanya dari harta mayit pertama', () => {
    const e2 = explainCase({ ...M2.input, base: { ...M2.input.base, tirkah: { gross: 72_000_000n, tajhiz: 0n, hutang: 0n, wasiat: 0n } } });
    expect(texts(e2, 3).slice(1)).toEqual(['Istri: 16/72 (diringkas 2/9) = Rp16.000.000.', 'Anak laki-laki: 56/72 (diringkas 7/9) = Rp56.000.000.']);
    expect(e2.parts[2]!.sections.some(sec => sec.title.includes('Menghitung harta'))).toBe(false);
  });
});

describe('sebutan lintas mayit dan catatan', () => {
  test('M9: ahli waris dari mayit berikutnya disebut lewat mayitnya', () => {
    expect(texts(explainCase(M9.input), 5)).toEqual([
      'Semua angka bisa diringkas dengan membagi 3: 768 menjadi 256.',
      'Anak laki-laki dari istri: 693/768 (diringkas 231/256).',
      'Istri dari paman kandung: 75/768 (diringkas 25/256).',
    ]);
  });

  test('keadaan pertama dan kedua dijelaskan di pembukaan', () => {
    expect(texts(explainCase(M7.input), 0)[1]).toBe(
      'Yang wafat belakangan hanya meninggalkan ahli waris yang sama dengan sisa ahli waris almarhumah, dan bagian mereka tidak '
        + 'berubah (keadaan pertama). Karena itu hasil akhirnya sama dengan membagi harta almarhumah langsung kepada yang masih '
        + 'hidup, seolah yang wafat belakangan tidak ada. Langkah bertahap di bawah tetap ditampilkan sebagai buktinya.');
    expect(texts(explainCase(M8.input), 0)[1]).toBe(
      'Ahli waris masing-masing yang wafat belakangan tidak ikut mewarisi dari almarhum maupun dari yang lain (keadaan kedua). '
        + 'Kitab menghitungnya dengan satu angka pembagi gabungan sekaligus; langkah bertahap di bawah memberi hasil yang sama.');
  });

  test('M7: penggabungan saham 1 vs 7', () => {
    expect(lastSection(explainCase(M7.input), 2).lines.map(toPlainText).slice(0, 2)).toEqual([
      'Saudara perempuan sebapak mendapat 1 dari 8 bagian. Bagian itu dibagi kepada ahli warisnya, yang pembagiannya memakai 7 bagian.',
      '1 dan 7 tidak bisa sama-sama dibagi kecuali oleh 1 (tabayun). Angka pembagi sebelumnya dikali 7, dan bagian ahli waris '
        + 'saudara perempuan sebapak dikali 1.',
    ]);
  });

  test('yang wafat tanpa bagian dicatat di pembukaan', () => {
    const { graph } = M2.input.base;
    const withBrother = {
      ...graph,
      persons: {
        ...graph.persons,
        F1: { id: 'F1', sex: 'M' as const, life: 'dead' as const, religion: 'islam' as const, isPlaceholder: true },
        D: { ...graph.persons['D']!, fatherId: 'F1' },
        AK: { id: 'AK', sex: 'M' as const, life: 'alive' as const, religion: 'islam' as const, fatherId: 'F1' },
      },
    };
    const e = explainCase({ ...M2.input, base: { ...M2.input.base, graph: withBrother }, deaths: ['AK', 'B'] });
    expect(texts(e, 0)[3]).toBe('Saudara laki-laki sebapak tidak mendapat bagian dari harta almarhum, jadi tidak ada yang diteruskan kepada ahli warisnya.');
  });

  test('mode ringkas memakai penjelas per mayit versi ringkas', () => {
    const e = explainCase(M2.input, 'ringkas');
    expect(e.parts[1]!.sections.map(sec => sec.title)).toContain("Langkah 3 — Ashlul mas'alah");
  });
});
