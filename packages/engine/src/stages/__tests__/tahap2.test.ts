import { describe, expect, test } from 'vitest';
import * as bab16 from '../../__tests__/fixtures/bab16.js';
import { runHeirStages } from '../../pipeline.js';
import type { EngineInput } from '../../types.js';
import type { ShareGroup } from '../model.js';
import { ANAK, KANDUNG, SEBAPAK, keluarga } from './helpers.js';

/** Ringkas grup → { "id1,id2": "fardh 2/3 [id1:2,id2:1]" } supaya ekspektasi mudah dibaca. */
function summarize(groups: ShareGroup[]): Record<string, string> {
  const fr = (f: { n: bigint; d: bigint }) => `${f.n}/${f.d}`;
  const out: Record<string, string> = {};
  for (const g of groups) {
    const members = [...g.members].sort();
    const s = g.share;
    let text = s.kind === 'fardh' || s.kind === 'fardhAshabah' ? `${s.kind} ${fr(s.fardh)}`
      : s.kind === 'ashabah' ? `ashabah ${s.type}`
      : `fixed ${fr(s.value)} ${s.basis}`;
    if (members.some(id => g.weights[id] !== 1n)) text += ` [${members.map(id => `${id}:${g.weights[id]}`).join(',')}]`;
    out[members.join(',')] = text;
  }
  return out;
}

function shares(input: EngineInput) {
  const result = runHeirStages(input);
  if (result.status !== 'HEIRS') throw new Error(`${result.status}: ${JSON.stringify(result)}`);
  return { groups: summarize(result.groups), trace: result.trace };
}

describe('tahap 2 — furudh dan ashabah pada fixture bab 16', () => {
  const cases: Array<[string, EngineInput, Record<string, string>]> = [
    ['C01', bab16.case01.input, { W1: 'fardh 1/8', 'D1,S1': 'ashabah bilGhair [D1:1,S1:2]' }],
    ['C02', bab16.case02.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', F1: 'ashabah binNafsi' }],
    ['C03', bab16.case03.input, { W1: 'fardh 1/4', M1: 'fardh 1/4', F1: 'ashabah binNafsi' }],
    ['C04', bab16.case04.input, { H1: 'fardh 1/2', M1: 'fardh 1/3', GF1: 'ashabah binNafsi' }],
    ['C05', bab16.case05.input, { H1: 'fardh 1/2', 'UK1,UK2': 'fardh 2/3' }],
    ['C06', bab16.case06.input, { W1: 'fardh 1/8', F1: 'fardhAshabah 1/6', M1: 'fardh 1/6', 'D1,D2': 'fardh 2/3' }],
    ['C07', bab16.case07.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', 'UK1,UK2': 'fardh 2/3', 'UM1,UM2': 'fardh 1/3' }],
    ['C08', bab16.case08.input, { D1: 'fardh 1/2', GD1: 'fardh 1/6', UK1: 'ashabah maalGhair' }],
    ['C09', bab16.case09.input, { D1: 'fardh 1/2', M1: 'fardh 1/6' }],
    ['C10', bab16.case10.input, { H1: 'fardh 1/4', D1: 'fardh 1/2', GD1: 'fardh 1/6' }],
    ['C11', bab16.case11.input, { W1: 'fardh 1/4', M1: 'fardh 1/6', 'US1,US2': 'fardh 1/3' }],
    ['C12', bab16.case12.input, { H1: 'fardh 1/2', M1: 'fardh 1/3', 'GF1,UK1': 'fardh 2/3 [GF1:2,UK1:1]' }],
    ['C13', bab16.case13.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', 'AK1,US1,US2': 'fardh 1/3' }],
    ['C14', bab16.case14.input, { W1: 'fardh 1/4', GF1: 'fixed 1/4 tsulutsBaqi', 'AK1,AK2,AK3': 'ashabah binNafsi' }],
    ['C15', bab16.case15.input, { F1: 'ashabah binNafsi', M1: 'fardh 1/6' }],
    ['C16', bab16.case16.input, { H1: 'fardh 1/4', F1: 'fardh 1/6', S1: 'ashabah binNafsi' }],
    ['C17', bab16.case17.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', UK1: 'fardh 1/2', 'AB1,UB1': 'ashabah bilGhair [AB1:2,UB1:1]' }],
    ['C17b', bab16.case17b.input, { H1: 'fardh 1/2', M1: 'fardh 1/6', UK1: 'fardh 1/2', UB1: 'fardh 1/6' }],
    ['C18', bab16.case18.input, { 'D1,D2': 'fardh 2/3', 'GD1,GGS1': 'ashabah bilGhair [GD1:1,GGS1:2]' }],
    ['C19', bab16.case19.input, { W1: 'fardh 1/8', D1: 'fardh 1/2', AB1: 'ashabah binNafsi' }],
    ['C20', bab16.case20.input, { W1: 'fardh 1/8', F1: 'fardh 1/6', M1: 'fardh 1/6', S1: 'ashabah binNafsi' }],
    ['C21', bab16.case21.input, { W1: 'fardh 1/8', D1: 'fardh 1/2', M1: 'fardh 1/6', F1: 'fardhAshabah 1/6' }],
    ['C22', bab16.case22.input, { 'W1,W2,W3,W4': 'fardh 1/4', 'AK1,AK2,AK3': 'ashabah binNafsi' }],
    ['C23', bab16.case23.input, { 'GM1,GM2': 'fardh 1/6', 'AB1,AB2,AB3': 'ashabah binNafsi' }],
    ['NEG1', bab16.caseNeg1.input, { W1: 'fardh 1/4', M1: 'fardh 1/3' }],
    ['NEG2', bab16.caseNeg2.input, { W1: 'fardh 1/4', M1: 'fardh 1/3' }],
  ];

  test.each(cases)('%s', (_id, input, expected) => {
    expect(shares(input).groups).toEqual(expected);
  });

  test('kasus khusus dicatat di trace', () => {
    const special = (input: EngineInput) =>
      shares(input).trace.filter(s => s.kind === 'SPECIAL_CASE').map(s => s.kind === 'SPECIAL_CASE' && s.name);
    expect(special(bab16.case02.input)).toEqual(['umariyyatain']);
    expect(special(bab16.case04.input)).toEqual([]);            // kakek ≠ ayah [R07-1]
    expect(special(bab16.case12.input)).toEqual(['akdariyyah']);
    expect(special(bab16.case13.input)).toEqual(['musyarrakah']);
  });

  test('hajb nuqshan dicatat [bab 6.3]', () => {
    const nuqshan = shares(bab16.case10.input).trace.filter(s => s.kind === 'HAJB_NUQSHAN');
    expect(nuqshan).toContainEqual(expect.objectContaining({ affected: 'H1', from: { n: 1n, d: 2n }, to: { n: 1n, d: 4n } }));
    expect(nuqshan).toContainEqual(expect.objectContaining({ affected: 'GD1', from: { n: 1n, d: 2n }, to: { n: 1n, d: 6n } }));
  });
});

describe('tahap 2 — kakek bersama saudara [SYF] (bab 08)', () => {
  const kakek = { PGF: { sex: 'M' } } as const;

  test('[R08-2] tanpa furudh, unit < 4 → muqasamah bersama', () => {
    expect(shares(keluarga({ ...kakek, AK1: { sex: 'M', ...KANDUNG } })).groups)
      .toEqual({ 'AK1,PGF': 'ashabah binNafsi' });   // kakek = satu saudara lk
  });

  test('[R08-2] tanpa furudh, unit > 4 → 1/3', () => {
    expect(shares(keluarga({
      ...kakek, AK1: { sex: 'M', ...KANDUNG }, AK2: { sex: 'M', ...KANDUNG }, AK3: { sex: 'M', ...KANDUNG },
    })).groups).toEqual({ PGF: 'fixed 1/3 tsuluts', 'AK1,AK2,AK3': 'ashabah binNafsi' });
  });

  test('[R08-3] sisa ≤ 1/6 → kakek 1/6, saudara gugur (ashabah tanpa sisa)', () => {
    expect(shares(keluarga({
      ...kakek, M: { sex: 'F' }, B1: { sex: 'F', ...ANAK }, B2: { sex: 'F', ...ANAK }, W1: { sex: 'F' },
      AK1: { sex: 'M', ...KANDUNG },
    }, [{ husbandId: 'D', wifeId: 'W1', status: 'intact' }])).groups).toEqual({
      // Furudh 1/8 + 2/3 + 1/6 = 23/24 → sisa 1/24.
      W1: 'fardh 1/8', 'B1,B2': 'fardh 2/3', M: 'fardh 1/6', PGF: 'fardh 1/6', AK1: 'ashabah binNafsi',
    });
  });

  test('[R08-4] mu\'addah: saudara sebapak dihitung lalu bagiannya ke kandung', () => {
    const { groups, trace } = shares(keluarga({ ...kakek, AK1: { sex: 'M', ...KANDUNG }, AB1: { sex: 'M', ...SEBAPAK } }));
    expect(groups).toEqual({ PGF: 'fixed 1/3 muqasamah', 'AB1,AK1': 'ashabah binNafsi [AB1:0,AK1:1]' });
    expect(trace).toContainEqual(expect.objectContaining({ kind: 'SPECIAL_CASE', name: 'muaddah' }));
  });

  test('[R08-4] mu\'addah, satu saudari kandung mengambil hingga 1/2, sisanya ke sebapak', () => {
    // Kakek, saudari kandung, saudara sebapak → 10: kakek 4, saudari 5, sebapak 1.
    expect(shares(keluarga({ ...kakek, UK1: { sex: 'F', ...KANDUNG }, AB1: { sex: 'M', ...SEBAPAK } })).groups).toEqual({
      PGF: 'fixed 2/5 muqasamah', UK1: 'fixed 1/2 muaddah', AB1: 'ashabah binNafsi',
    });
  });

  test('kakek + saudari saja + anak pr → UNSUPPORTED (ma\'al ghair bersama kakek tidak dirinci KB)', () => {
    expect(runHeirStages(keluarga({ ...kakek, B1: { sex: 'F', ...ANAK }, UK1: { sex: 'F', ...KANDUNG } })))
      .toMatchObject({ status: 'UNSUPPORTED', refs: ['R08-3'] });
  });
});

describe('tahap 2 — alasan fardh terstruktur (untuk packages/explain)', () => {
  const reasonOf = (input: EngineInput, group: string) => {
    const step = shares(input).trace.find(s => s.kind === 'FARDH' && s.group === group);
    return step?.kind === 'FARDH' ? step.reason : undefined;
  };
  const f = (n: bigint, d: bigint) => ({ n, d });

  test('pasangan dan ibu menyebut siapa penyebab nuqshan', () => {
    expect(reasonOf(bab16.case10.input, 'ZAWJ')).toEqual({ code: 'ADA_FARU_WARITS', by: ['D1', 'GD1'] });
    expect(reasonOf(bab16.case04.input, 'ZAWJ')).toEqual({ code: 'TANPA_FARU_WARITS' });
    expect(reasonOf(bab16.case15.input, 'UMM')).toEqual({ code: 'JAM_IKHWAH', by: ['AK1', 'AK2'] });
    expect(reasonOf(bab16.case04.input, 'UMM')).toEqual({ code: 'TANPA_FARU_WARITS_DAN_IKHWAH' });
    expect(reasonOf(bab16.case02.input, 'UMM')).toEqual({ code: 'UMARIYYATAIN', spouseFardh: f(1n, 2n) });
  });

  test('keturunan, saudari, anak ibu, ayah', () => {
    expect(reasonOf(bab16.case06.input, 'BINT')).toEqual({ code: 'TANPA_MUASHSHIB', count: 2 });
    expect(reasonOf(bab16.case08.input, 'BINT_IBN_2')).toEqual({ code: 'TAKMILAH', with: ['D1'] });
    expect(reasonOf(bab16.case17b.input, 'UKHT_AB')).toEqual({ code: 'TAKMILAH', with: ['UK1'] });
    expect(reasonOf(bab16.case05.input, 'UKHT_SYQ')).toEqual({ code: 'KALALAH', count: 2 });
    expect(reasonOf(bab16.case11.input, 'AWLAD_UMM')).toEqual({ code: 'KALALAH', count: 2 });
    expect(reasonOf(bab16.case20.input, 'AB')).toEqual({ code: 'ADA_FARU_MUDZAKKAR', by: ['S1'] });
    expect(reasonOf(bab16.case21.input, 'AB')).toEqual({ code: 'ADA_FARU_MUANNATS', by: ['D1'] });
    expect(reasonOf(bab16.case23.input, 'JADDAH')).toEqual({ code: 'NENEK_TANPA_IBU', count: 2 });
  });

  test('kasus khusus: pilihan kakek dicatat lengkap dengan pembandingnya', () => {
    expect(reasonOf(bab16.case14.input, 'JADD')).toEqual({
      code: 'JADD_WAL_IKHWAH',
      sisa: f(3n, 4n),
      options: [
        { name: 'muqasamah', value: f(3n, 16n) },
        { name: 'tsulutsBaqi', value: f(1n, 4n) },
        { name: 'sudus', value: f(1n, 6n) },
      ],
      chosen: 'tsulutsBaqi',
    });
    expect(reasonOf(bab16.case13.input, 'MUSYARRAKAH')).toEqual({ code: 'MUSYARRAKAH' });
  });

  test('muqasamah bersama tetap mencatat pembanding pilihan kakek', () => {
    const step = shares(keluarga({ PGF: { sex: 'M' }, AK1: { sex: 'M', ...KANDUNG } })).trace
      .find(s => s.kind === 'ASHABAH' && s.group === 'JADD_IKHWAH');
    expect(step?.kind === 'ASHABAH' && step.jaddChoice).toEqual({
      code: 'JADD_WAL_IKHWAH',
      sisa: f(1n, 1n),
      options: [{ name: 'muqasamah', value: f(1n, 2n) }, { name: 'tsuluts', value: f(1n, 3n) }],
      chosen: 'muqasamah',
    });
  });
});
