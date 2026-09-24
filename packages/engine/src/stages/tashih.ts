import { gcd, nisab } from '@waris/math';
import type { GroupId, InkisarRelation, PersonId, TraceStep } from '../types.js';
import { sumWeights, type ShareGroup } from './model.js';

const MAX_KELOMPOK_INKISAR = 4;   // [R10-3]

export interface Tashih {
  tashih: bigint;
  juzSahm: bigint;
  groupSaham: Record<GroupId, bigint>;
  perPerson: Record<PersonId, bigint>;
  trace: TraceStep[];
}

/**
 * Tahap 5 (bab 10.3): saham kelompok vs ru'us hanya lewat FPB (habis/tawafuq/tabayun); simpanan
 * digabung dengan nisab arba' → juz' as-sahm; tashih = base × juz'.
 */
export function applyTashih(groups: ShareGroup[], saham: Record<GroupId, bigint>, base: bigint): Tashih {
  const trace: TraceStep[] = [];
  const simpanan: bigint[] = [];

  for (const group of groups) {
    const sahamKelompok = saham[group.id]!;
    const ruus = sumWeights(group);
    if (sahamKelompok === 0n || ruus <= 1n) continue;
    const fpb = gcd(sahamKelompok, ruus);
    const relation: InkisarRelation = sahamKelompok % ruus === 0n ? 'habis' : fpb > 1n ? 'tawafuq' : 'tabayun';
    // Tawafuq → wafq ru'us; tabayun → seluruh ru'us (rumus sama: ru'us ÷ FPB).
    const disimpan = ruus / fpb;
    trace.push({ stage: 'tashih', refs: ['R10-2'], kind: 'NISAB_COMPARE', purpose: 'inkisar', group: group.id,
      a: sahamKelompok, b: ruus, relation, gcd: fpb, result: disimpan });
    if (relation !== 'habis') simpanan.push(disimpan);
  }
  if (simpanan.length > MAX_KELOMPOK_INKISAR) throw new Error(`invariant [R10-3]: inkisar pada ${simpanan.length} kelompok`);

  let juzSahm = simpanan[0] ?? 1n;
  for (const next of simpanan.slice(1)) {
    const { relation, gcd: fpb, result } = nisab(juzSahm, next);
    trace.push({ stage: 'tashih', refs: ['R10-2', 'R10-1'], kind: 'NISAB_COMPARE', purpose: 'juzSahm', a: juzSahm, b: next, relation, gcd: fpb, result });
    juzSahm = result;
  }
  const tashih = base * juzSahm;
  if (juzSahm > 1n) trace.push({ stage: 'tashih', refs: ['R10-2'], kind: 'TASHIH', base, juzSahm, result: tashih });

  const groupSaham: Record<GroupId, bigint> = {};
  const perPerson: Record<PersonId, bigint> = {};
  for (const group of groups) {
    const total = saham[group.id]! * juzSahm;
    const ruus = sumWeights(group);
    groupSaham[group.id] = total;
    for (const [personId, weight] of Object.entries(group.weights)) {
      if ((total * weight) % ruus !== 0n) throw new Error(`invariant: saham ${personId} tidak bulat setelah tashih`);
      perPerson[personId] = total * weight / ruus;
    }
  }
  const jumlah = Object.values(perPerson).reduce((a, b) => a + b, 0n);
  if (jumlah !== tashih) throw new Error(`invariant (bab 10.5): Σ saham individu ${jumlah} ≠ tashih ${tashih}`);
  return { tashih, juzSahm, groupSaham, perPerson, trace };
}
