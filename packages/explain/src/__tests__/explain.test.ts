import { compute, type EngineInput, type TraceStep } from '@waris/engine';
import { describe, expect, test } from 'vitest';
import * as bab16 from '../../../engine/src/__tests__/fixtures/bab16.js';
import { explain, narrateNisab, type Explanation } from '../index.js';

function explainCase(input: EngineInput): Explanation {
  const result = compute(input);
  if (result.status !== 'OK') throw new Error(result.status);
  return explain(result, input.graph);
}

const section = (e: Explanation, title: string) => {
  const found = e.sections.find(s => s.title === title);
  if (!found) throw new Error(`section "${title}" tidak ada; ada: ${e.sections.map(s => s.title).join(' | ')}`);
  return found.lines.map(l => l.text);
};

const compare = (fields: Partial<Extract<TraceStep, { kind: 'NISAB_COMPARE' }>>): Extract<TraceStep, { kind: 'NISAB_COMPARE' }> =>
  ({ stage: 'ashl', refs: [], kind: 'NISAB_COMPARE', purpose: 'ashl', a: 0n, b: 0n, relation: 'tamatsul', gcd: 0n, result: 0n, ...fields });

describe('narasi nisab — identifikasi hubungan dua bilangan', () => {
  test('empat nisab arba\' untuk ashl (bab 10.2)', () => {
    expect(narrateNisab(compare({ a: 6n, b: 6n, relation: 'tamatsul', gcd: 6n, result: 6n })))
      .toBe('Penyebut 6 dan 6 sama → tamatsul. Ambil salah satunya: 6.');
    expect(narrateNisab(compare({ a: 4n, b: 2n, relation: 'tadakhul', gcd: 2n, result: 4n })))
      .toBe('Penyebut 4 dan 2: 4 habis dibagi 2 → tadakhul. Ambil yang besar: 4.');
    expect(narrateNisab(compare({ a: 4n, b: 6n, relation: 'tawafuq', gcd: 2n, result: 12n })))
      .toBe('Penyebut 4 dan 6: tidak saling habis membagi, FPB 2 → tawafuq. Kalikan salah satu dengan wafq yang lain: 4 × (6 ÷ 2) = 12.');
    expect(narrateNisab(compare({ a: 2n, b: 3n, relation: 'tabayun', gcd: 1n, result: 6n })))
      .toBe('Penyebut 2 dan 3: FPB 1 → tabayun. Kalikan keduanya: 2 × 3 = 6.');
  });

  test('[R10-5] angka 1 disebut tabayun dengan alasannya', () => {
    expect(narrateNisab(compare({ purpose: 'juzSahm', a: 1n, b: 4n, relation: 'tabayun', gcd: 1n, result: 4n })))
      .toBe('Simpanan 1 dan 4: setiap bilangan bertemu 1 dihukumi tabayun. Kalikan keduanya: 1 × 4 = 4.');
  });

  test('inkisar hanya memakai FPB (bab 10.3)', () => {
    expect(narrateNisab(compare({ purpose: 'inkisar', a: 3n, b: 3n, relation: 'habis', gcd: 3n, result: 1n })))
      .toBe('Saham 3 habis dibagi ru\'us 3 → tidak perlu dikoreksi.');
    expect(narrateNisab(compare({ purpose: 'inkisar', a: 2n, b: 4n, relation: 'tawafuq', gcd: 2n, result: 2n })))
      .toBe('Saham 2 tidak habis dibagi ru\'us 4, FPB 2 → tawafuq. Simpan wafq ru\'us: 4 ÷ 2 = 2.');
    expect(narrateNisab(compare({ purpose: 'inkisar', a: 7n, b: 3n, relation: 'tabayun', gcd: 1n, result: 3n })))
      .toBe('Saham 7 tidak habis dibagi ru\'us 3, FPB 1 → tabayun. Simpan seluruh ru\'us: 3.');
  });
});

describe('kasus 10 — suami, anak pr, cucu pr (radd dengan pasangan)', () => {
  const e = explainCase(bab16.case10.input);

  test('urutan langkah', () => {
    expect(e.sections.map(s => s.title)).toEqual([
      'Ahli waris', 'Bagian masing-masing', 'Ashlul mas\'alah (penyebut bersama)', 'Radd (pengembalian sisa)', 'Hasil',
    ]);
  });

  test('ahli waris dan bagian beserta alasannya', () => {
    expect(section(e, 'Ahli waris')).toEqual([
      'Yang mewarisi: suami (H1), anak perempuan (D1), cucu perempuan dari anak laki-laki (GD1).',
    ]);
    expect(section(e, 'Bagian masing-masing')).toEqual([
      'Suami (H1) mendapat 1/4 karena ada keturunan yang mewarisi (far\'u warits): anak perempuan (D1), cucu perempuan dari anak laki-laki (GD1).',
      'Hajb nuqshan: bagian suami (H1) berkurang dari 1/2 menjadi 1/4.',
      'Anak perempuan (D1) mendapat 1/2 karena seorang diri tanpa laki-laki sederajat yang menjadikannya ashabah (mu\'ashshib).',
      'Cucu perempuan dari anak laki-laki (GD1) mendapat 1/6 sebagai penyempurna 2/3 (takmilah ats-tsulutsain) bersama anak perempuan (D1).',
      'Hajb nuqshan: bagian cucu perempuan dari anak laki-laki (GD1) berkurang dari 1/2 menjadi 1/6.',
    ]);
  });

  test('ashl: 4 dan 2 tadakhul, lalu 4 dan 6 tawafuq', () => {
    expect(section(e, 'Ashlul mas\'alah (penyebut bersama)')).toEqual([
      'Penyebut 4 dan 2: 4 habis dibagi 2 → tadakhul. Ambil yang besar: 4.',
      'Penyebut 4 dan 6: tidak saling habis membagi, FPB 2 → tawafuq. Kalikan salah satu dengan wafq yang lain: 4 × (6 ÷ 2) = 12.',
      'Ashl = 12. Saham: suami (H1) 1/4 × 12 = 3; anak perempuan (D1) 1/2 × 12 = 6; cucu perempuan dari anak laki-laki (GD1) 1/6 × 12 = 2.',
    ]);
  });

  test('radd: zawjiyyah, raddiyyah, dan perbandingan sisa', () => {
    expect(section(e, 'Radd (pengembalian sisa)')).toEqual([
      'Jumlah saham 11 lebih kecil dari ashl 12 dan tidak ada ashabah → sisa dikembalikan kepada ashabul furudh (radd). Suami/istri tidak menerima radd.',
      'Mas\'alah zawjiyyah: ashl 4 dari bagian suami (H1) → suami (H1) 1, sisa 3.',
      'Mas\'alah raddiyyah: perbandingan anak perempuan (D1) : cucu perempuan dari anak laki-laki (GD1) = 3 : 1 → ashl radd 4.',
      'Sisa 3 dibanding ashl radd 4: FPB 1 → tabayun. Kalikan ashl zawjiyyah dengan seluruh ashl radd: 4 × 4 = 16.',
    ]);
  });

  test('hasil', () => {
    expect(section(e, 'Hasil')).toEqual([
      'Suami (H1): 4/16.',
      'Anak perempuan (D1): 9/16.',
      'Cucu perempuan dari anak laki-laki (GD1): 3/16.',
    ]);
  });
});

describe('kasus 12 — akdariyyah (\'aul lalu tashih)', () => {
  const e = explainCase(bab16.case12.input);

  test('kasus khusus disebut dan bagian kakek/saudari dijelaskan', () => {
    expect(section(e, 'Bagian masing-masing')).toEqual([
      'Suami (H1) mendapat 1/2 karena tidak ada keturunan yang mewarisi (far\'u warits).',
      'Ibu (M1) mendapat 1/3 karena tidak ada keturunan yang mewarisi dan tidak ada dua saudara atau lebih.',
      'Kasus khusus: al-Akdariyyah.',
      'Kakek (GF1) diberi 1/6.',
      'Saudara perempuan kandung (UK1) diberi 1/2, lalu bagiannya digabung dengan bagian kakek (1/6 + 1/2 = 2/3) untuk dibagi 2 : 1.',
    ]);
  });

  test('\'aul dan tashih', () => {
    expect(section(e, '\'Aul')).toEqual([
      'Jumlah saham 9 lebih besar dari ashl 6 → \'aul: ashl dinaikkan menjadi 9, sehingga setiap bagian berkurang secara proporsional.',
    ]);
    expect(section(e, 'Tashih (koreksi agar bagian per orang bulat)')).toEqual([
      'Kakek (GF1) dan saudara perempuan kandung (UK1): saham 4 tidak habis dibagi ru\'us 3 (laki-laki dihitung 2), FPB 1 → tabayun. Simpan seluruh ru\'us: 3.',
      'Juz\' as-sahm = 3. Tashih = 9 × 3 = 27.',
    ]);
    expect(section(e, 'Hasil')).toEqual([
      'Suami (H1): 9/27.', 'Ibu (M1): 6/27.', 'Kakek (GF1): 8/27.', 'Saudara perempuan kandung (UK1): 4/27.',
    ]);
  });
});

describe('penghalang, jam\' min al-ikhwah, nominal', () => {
  test('kasus 15: saudara terhijab tetapi tetap mengurangi bagian ibu', () => {
    const e = explainCase(bab16.case15.input);
    expect(section(e, 'Ahli waris')).toEqual([
      'Yang mewarisi: ayah (F1), ibu (M1).',
      '2 saudara laki-laki kandung (AK1, AK2) terhalang seluruhnya (hajb hirman) oleh ayah (F1).',
    ]);
    expect(section(e, 'Bagian masing-masing')).toContain(
      'Ibu (M1) mendapat 1/6 karena ada dua saudara atau lebih (jam\' min al-ikhwah): 2 saudara laki-laki kandung (AK1, AK2), tetap dihitung walaupun mereka terhalang.');
  });

  test('pembunuh tidak mewarisi', () => {
    expect(section(explainCase(bab16.caseNeg2.input), 'Ahli waris')).toContain(
      'Anak laki-laki (S1) tidak mewarisi karena membunuh pewaris (mani\' qatl).');
  });

  test('uji nominal: tirkah, rupiah, dan selisih pembulatan', () => {
    const input = { ...bab16.caseNominal.input, rounding: { unit: 1000n } };
    const e = explainCase(input);
    expect(section(e, 'Harta yang dibagi')).toEqual([
      'Tirkah Rp150.000.000 dikurangi biaya pengurusan jenazah Rp5.000.000 dan hutang Rp25.000.000 → sisa Rp120.000.000.',
      'Wasiat Rp50.000.000 melebihi batas 1/3 (Rp40.000.000); yang dijalankan Rp40.000.000. Kelebihan Rp10.000.000 hanya berlaku dengan persetujuan (ijazah) ahli waris.',
      'Harta yang dibagi kepada ahli waris: Rp80.000.000.',
    ]);
    expect(section(e, 'Hasil')).toEqual([
      'Istri (W1): 3/24 = Rp10.000.000.',
      'Anak laki-laki (S1): 14/24 = Rp46.666.000.',
      'Anak perempuan (D1): 7/24 = Rp23.333.000.',
      'Selisih pembulatan Rp1.000 (dibulatkan ke bawah per Rp1.000) belum dibagikan; tetap milik ahli waris dan perlu disepakati penyalurannya. Bila diserahkan lewat transfer bank, pembagian bisa per rupiah sehingga selisihnya lebih kecil.',
    ]);
  });

  test('setiap baris membawa rujukan untuk lapis dalil', () => {
    const e = explainCase(bab16.case10.input);
    const bagian = e.sections.find(s => s.title === 'Bagian masing-masing')!;
    expect(bagian.lines[0]!.refs).toEqual(['R04-2']);
  });
});
