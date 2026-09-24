import { describe, expect, test } from 'vitest';
import * as bab16 from '../../__tests__/fixtures/bab16.js';
import { runHeirStages } from '../../pipeline.js';
import type { EngineInput, PersonStatus } from '../../types.js';
import { deriveRoles } from '../derivasi.js';
import { ANAK, KANDUNG, PAMAN_KANDUNG, SEBAPAK, SEIBU, keluarga, p } from './helpers.js';

const keysOf = (input: EngineInput) =>
  Object.fromEntries(Object.entries(deriveRoles(input.graph, input.config).roles).map(([id, r]) => [id, r.key]));

function statuses(input: EngineInput): Record<string, PersonStatus> {
  const result = runHeirStages(input);
  if (result.status !== 'HEIRS') throw new Error(`status ${result.status}`);
  return result.statuses;
}

const mahjubBy = (input: EngineInput, id: string) => {
  const s = statuses(input)[id];
  return s?.kind === 'mahjub' ? [...s.by].sort() : null;
};

describe('1a derivasi peran [R03-1]', () => {
  test('fixture bab 16', () => {
    expect(keysOf(bab16.case01.input)).toMatchObject({ W1: 'ZAWJAH', S1: 'IBN', D1: 'BINT' });
    expect(keysOf(bab16.case04.input)).toMatchObject({ H1: 'ZAWJ', F1: 'AB', GF1: 'JADD', M1: 'UMM' });
    expect(keysOf(bab16.case07.input)).toMatchObject({ UK1: 'UKHT_SYQ', UM1: 'UKHT_UMM', UF1: 'NON_HEIR' });
    expect(keysOf(bab16.case08.input)).toMatchObject({ GD1: 'BINT_IBN', UK1: 'UKHT_SYQ' });
    expect(keysOf(bab16.case16.input)).toMatchObject({
      S1: 'IBN', GS1: 'IBN_IBN', AK1: 'AKH_SYQ', IA1: 'IBN_AKH_SYQ', AM1: 'AMM_SYQ', IM1: 'IBN_AMM_SYQ', GF1: 'JADD',
    });
    expect(keysOf(bab16.case17.input)).toMatchObject({ AB1: 'AKH_AB', UB1: 'UKHT_AB' });
    expect(keysOf(bab16.case18.input)).toMatchObject({ GD1: 'BINT_IBN', GGS1: 'IBN_IBN' });
    expect(keysOf(bab16.case23.input)).toMatchObject({ GM1: 'JADDAH_AB', GM2: 'JADDAH_UMM' });
    expect(keysOf(bab16.case24.input)).toMatchObject({ KL1: 'DZAWIL_ARHAM', AM1: 'DZAWIL_ARHAM' });
  });

  test('darajah dan koordinat kekerabatan (bab 5.3)', () => {
    const { roles } = deriveRoles(bab16.case18.input.graph, bab16.case18.input.config);
    expect(roles['GGS1']?.kinship).toMatchObject({ ancestorGeneration: 0, descentDepth: 3 });
    const paman = deriveRoles(bab16.case16.input.graph, bab16.case16.input.config).roles['IM1'];
    expect(paman?.kinship).toMatchObject({ ancestorGeneration: 2, descentDepth: 2, lineage: 'full' });
  });

  test('[R03-5] [R03-7] [R14-4] jalur lewat perempuan → dzawil arham', () => {
    const keys = keysOf(keluarga({
      B1: { sex: 'F', ...ANAK, life: 'dead' },
      CB1: { sex: 'M', motherId: 'B1' },                       // cucu dari anak pr
      MGM: { sex: 'F' },                                       // ibunya ibu → JADDAH_UMM
      MGF: { sex: 'M' },                                       // ayahnya ibu → jadd fasid
      AK1: { sex: 'F', ...KANDUNG, life: 'dead' },
      AKS: { sex: 'M', motherId: 'AK1' },                      // anak saudari
      AU1: { sex: 'M', ...SEIBU, life: 'dead' },
      AUS: { sex: 'M', fatherId: 'AU1' },                      // anak saudara seibu
      AMU: { sex: 'M', fatherId: 'X', motherId: 'PGM' },       // paman seibu (saudara seibu ayah)
      X:   { sex: 'M', life: 'dead' },
    }));
    const withMpgm = keluarga({
      MGF: { sex: 'M', life: 'dead', motherId: 'MPGM' },
      MPGM: { sex: 'F' },
    });
    expect(keysOf(withMpgm)['MPGM']).toBe('DZAWIL_ARHAM');
    expect(keys).toMatchObject({
      CB1: 'DZAWIL_ARHAM', MGM: 'JADDAH_UMM', MGF: 'DZAWIL_ARHAM',
      AKS: 'DZAWIL_ARHAM', AUS: 'DZAWIL_ARHAM', AMU: 'DZAWIL_ARHAM',
    });
  });

  test('[R03-4] nenek di atas kakek dari ayah = ahli waris [SYF]', () => {
    expect(keysOf(keluarga({ PPGM: { sex: 'F' } }))['PPGM']).toBe('JADDAH_AB');
  });

  test('[R02-3] talak: raj\'i dalam iddah mewarisi; ba\'in tidak, kecuali maradh + qaul qadim', () => {
    const graph = (status: 'talakRajiIddah' | 'talakBain') =>
      keluarga({ W1: { sex: 'F' } }, [{ husbandId: 'D', wifeId: 'W1', status, talakInMaradh: true }]);
    expect(keysOf(graph('talakRajiIddah'))['W1']).toBe('ZAWJAH');
    expect(keysOf(graph('talakBain'))['W1']).toBe('NON_HEIR');
    const qadim = graph('talakBain');
    qadim.config = { ...qadim.config, talakBainInMaradh: 'qaulQadim' };
    expect(keysOf(qadim)['W1']).toBe('ZAWJAH');
  });

  test('suami yang juga anak paman → dua jihah (tidak diatur KB)', () => {
    const graph = keluarga({
      D: { sex: 'F', life: 'dead' },
      AM1: { sex: 'M', ...PAMAN_KANDUNG, life: 'dead' },
      H1: { sex: 'M', fatherId: 'AM1' },
    }, [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }]);
    expect(deriveRoles(graph.graph, graph.config).duaJihah).toEqual(['H1']);
  });
});

describe('1b mawani\' [R02-2] — keluar dan tidak menghijab [R06-6]', () => {
  test('beda agama dan pembunuh → mamnu', () => {
    expect(statuses(bab16.caseNeg1.input)['D1']).toMatchObject({ kind: 'mamnu', mani: 'ikhtilafDin' });
    expect(statuses(bab16.caseNeg2.input)['S1']).toMatchObject({ kind: 'mamnu', mani: 'qatl' });
  });

  test('anak pembunuh tidak dihijab ayahnya yang mamnu', () => {
    const graph = keluarga({ S1: { sex: 'M', ...ANAK, killedDeceased: true }, SS1: { sex: 'M', fatherId: 'S1' } });
    expect(statuses(graph)['SS1']).toMatchObject({ kind: 'heir' });
  });

  test('status mamnu dan mahjub membawa peran (untuk narasi)', () => {
    expect(statuses(bab16.caseNeg1.input)['D1']).toMatchObject({ kind: 'mamnu', role: { key: 'BINT' } });
    expect(statuses(bab16.case15.input)['AK1']).toMatchObject({ kind: 'mahjub', role: { key: 'AKH_SYQ' } });
  });

  test('yang wafat bukan ahli waris', () => {
    expect(statuses(bab16.case04.input)['F1']).toMatchObject({ kind: 'nonHeir' });
  });
});

describe('1c hajb hirman [R06-3]', () => {
  test('fixture bab 16', () => {
    expect(mahjubBy(bab16.case15.input, 'AK1')).toEqual(['F1']);
    const c16 = bab16.case16.input;
    expect(mahjubBy(c16, 'GF1')).toEqual(['F1']);
    expect(mahjubBy(c16, 'GS1')).toEqual(['S1']);
    for (const id of ['AK1', 'IA1', 'AM1', 'IM1']) expect(mahjubBy(c16, id)).toEqual(['F1', 'S1']);
    expect(mahjubBy(bab16.case19.input, 'AM1')).toEqual(['AB1']);
    expect(mahjubBy(bab16.case17.input, 'AB1')).toBeNull();   // ashabah, bukan mahjub
    expect(mahjubBy(bab16.case18.input, 'GD1')).toBeNull();   // qarib mubarak [R04-13]
  });

  test('[R04-9] [R04-10] hajb atas nenek', () => {
    const tiga = keluarga({ M: { sex: 'F' }, PGM: { sex: 'F' }, MGM: { sex: 'F' } });
    expect(mahjubBy(tiga, 'PGM')).toEqual(['M']);
    expect(mahjubBy(tiga, 'MGM')).toEqual(['M']);

    const ayah = keluarga({ F: { sex: 'M' }, PGM: { sex: 'F' }, MGM: { sex: 'F' } });
    expect(mahjubBy(ayah, 'PGM')).toEqual(['F']);
    expect(mahjubBy(ayah, 'MGM')).toBeNull();

    // Nenek dekat pihak ibu menghijab nenek jauh pihak ayah, tidak sebaliknya [SYF].
    expect(mahjubBy(keluarga({ MGM: { sex: 'F' }, PPGM: { sex: 'F' } }), 'PPGM')).toEqual(['MGM']);
    expect(mahjubBy(keluarga({ PGM: { sex: 'F' }, MMGM: { sex: 'F' } }), 'MMGM')).toBeNull();

    // Kakek menghijab nenek yang lewat dia, bukan ibunya ayah [R04-6].
    const kakek = keluarga({ PGF: { sex: 'M' }, PGM: { sex: 'F' }, PPGM: { sex: 'F' } });
    expect(mahjubBy(kakek, 'PGM')).toBeNull();
    expect(mahjubBy(kakek, 'PPGM')).toEqual(['PGF', 'PGM']);
  });

  test('keturunan perempuan', () => {
    const duaAnakPr = { B1: { sex: 'F', ...ANAK }, B2: { sex: 'F', ...ANAK }, S1: { sex: 'M', ...ANAK, life: 'dead' } } as const;
    // [R04-13] 2 anak pr menghabiskan 2/3 → cucu pr gugur tanpa mu'ashshib
    expect(mahjubBy(keluarga({ ...duaAnakPr, BI1: { sex: 'F', fatherId: 'S1' } }), 'BI1')).toEqual(['B1', 'B2']);
    // [R06-5] far'u warits pr menghijab saudara seibu
    expect(mahjubBy(keluarga({ B1: { sex: 'F', ...ANAK }, AU1: { sex: 'M', ...SEIBU } }), 'AU1')).toEqual(['B1']);
  });

  test('saudari sebapak [R04-14] [R05-5]', () => {
    const maalGhair = keluarga({ B1: { sex: 'F', ...ANAK }, UK1: { sex: 'F', ...KANDUNG }, UB1: { sex: 'F', ...SEBAPAK } });
    expect(mahjubBy(maalGhair, 'UB1')).toEqual(['UK1']);

    const duaKandung = { UK1: { sex: 'F', ...KANDUNG }, UK2: { sex: 'F', ...KANDUNG }, UB1: { sex: 'F', ...SEBAPAK } } as const;
    expect(mahjubBy(keluarga(duaKandung), 'UB1')).toEqual(['UK1', 'UK2']);
    expect(mahjubBy(keluarga({ ...duaKandung, AB1: { sex: 'M', ...SEBAPAK } }), 'UB1')).toBeNull();
  });

  test('[R05-3] jihah → darajah → quwwah', () => {
    // Anak saudara kandung kalah dari saudara sebapak (darajah sebelum quwwah).
    const g1 = keluarga({ AK1: { sex: 'M', ...KANDUNG, life: 'dead' }, IAK: { sex: 'M', fatherId: 'AK1' }, AB1: { sex: 'M', ...SEBAPAK } });
    expect(mahjubBy(g1, 'IAK')).toEqual(['AB1']);
    // Paman kandung kalah dari anak saudara sebapak (jihah).
    const g2 = keluarga({
      AB1: { sex: 'M', ...SEBAPAK, life: 'dead' }, IAB: { sex: 'M', fatherId: 'AB1' }, AM1: { sex: 'M', ...PAMAN_KANDUNG },
    });
    expect(mahjubBy(g2, 'AM1')).toEqual(['IAB']);
  });

  test('kakek bersama saudara [R08-1] [R05-2]', () => {
    const muaddah = keluarga({ PGF: { sex: 'M' }, AK1: { sex: 'M', ...KANDUNG }, AB1: { sex: 'M', ...SEBAPAK } });
    expect(mahjubBy(muaddah, 'AK1')).toBeNull();
    expect(mahjubBy(muaddah, 'AB1')).toBeNull();   // dihitung dalam mu'addah (bab 8.4)

    const anakSaudara = keluarga({ PGF: { sex: 'M' }, AK1: { sex: 'M', ...KANDUNG, life: 'dead' }, IAK: { sex: 'M', fatherId: 'AK1' } });
    expect(mahjubBy(anakSaudara, 'IAK')).toEqual(['PGF']);
  });

  test('[R06-6] saudara mahjub tetap menghitung untuk nuqshan ibu (dicek di trace)', () => {
    const result = runHeirStages(bab16.case15.input);
    if (result.status !== 'HEIRS') throw new Error(result.status);
    expect(result.trace).toContainEqual(expect.objectContaining({ kind: 'HAJB_NUQSHAN', affected: 'M1', cause: ['AK1', 'AK2'] }));
  });
});

describe('validasi input → NEEDS_INPUT / UNSUPPORTED', () => {
  test('uji negatif bab 16', () => {
    expect(runHeirStages(bab16.caseNeg3.input)).toMatchObject({ status: 'NEEDS_INPUT', questions: [{ personId: 'S1', field: 'life' }] });
    expect(runHeirStages(bab16.caseNeg4.input)).toMatchObject({ status: 'NEEDS_INPUT', questions: [{ field: 'marriages' }] });
    expect(runHeirStages(bab16.caseNeg5.input)).toMatchObject({ status: 'NEEDS_INPUT', questions: [{ field: 'rounding' }] });
  });

  test('agama tidak diketahui → tanya; placeholder tidak ditanya', () => {
    const graph = keluarga({ S1: { sex: 'M', ...ANAK, religion: 'unknown' } });
    expect(runHeirStages(graph)).toMatchObject({ status: 'NEEDS_INPUT', questions: [{ personId: 'S1', field: 'religion' }] });
  });

  test('tanpa ahli waris, ada dzawil arham → UNSUPPORTED (fase 3)', () => {
    expect(runHeirStages(bab16.case24.input)).toMatchObject({ status: 'UNSUPPORTED', refs: ['R14-4'] });
  });

  test('pewaris non-muslim di luar cakupan', () => {
    const graph = keluarga({ D: { sex: 'M', life: 'dead', religion: 'nonIslam' }, S1: { sex: 'M', ...ANAK } });
    expect(runHeirStages(graph)).toMatchObject({ status: 'UNSUPPORTED' });
  });

  test('jenis kelamin tidak cocok dengan peran di graf → tanya', () => {
    const suamiPerempuan = bab16.input({
      deceasedId: 'D',
      persons: { D: p('D', 'M', { life: 'dead' }), H1: p('H1', 'M') },
      marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }],
    });
    expect(runHeirStages(suamiPerempuan)).toMatchObject({ status: 'NEEDS_INPUT', questions: [{ personId: 'D', field: 'sex' }] });
    const ayahPerempuan = keluarga({ S1: { sex: 'M', motherId: 'D' } });
    expect(runHeirStages(ayahPerempuan)).toMatchObject({ status: 'NEEDS_INPUT', questions: [{ personId: 'D', field: 'sex' }] });
  });

  test('suami lebih dari satu → tanya', () => {
    const graph = bab16.input({
      deceasedId: 'D',
      persons: { D: p('D', 'F', { life: 'dead' }), H1: p('H1', 'M'), H2: p('H2', 'M') },
      marriages: [{ husbandId: 'H1', wifeId: 'D', status: 'intact' }, { husbandId: 'H2', wifeId: 'D', status: 'intact' }],
    });
    expect(runHeirStages(graph)).toMatchObject({ status: 'NEEDS_INPUT', questions: [{ field: 'marriages' }] });
  });
});
