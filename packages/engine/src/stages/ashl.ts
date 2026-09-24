import { nisab } from '@waris/math';
import type { GroupId, TraceStep } from '../types.js';
import { fixedFractionOf, isResidueGroup, sumWeights, type Masalah, type ShareGroup } from './model.js';

const VALID_USUL = [2n, 3n, 4n, 6n, 8n, 12n, 24n];   // [R09-1]

/**
 * Tahap 3: ashlul mas'alah (bab 9.1) dan saham tiap kelompok. Ashabah mengambil sisa (0 bila habis;
 * kelebihan furudh ditangani 'aul di tahap 4).
 */
export function computeAshl(groups: ShareGroup[]): Masalah & { trace: TraceStep[] } {
  const trace: TraceStep[] = [];
  const saham: Record<GroupId, bigint> = {};
  const fractions = groups.flatMap(g => {
    const f = fixedFractionOf(g.share);
    return f ? [{ group: g, fraction: f }] : [];
  });

  if (fractions.length === 0) {
    // [R09-2] semua ashabah: ashl = jumlah ru'us (lk 2, pr 1).
    for (const group of groups) saham[group.id] = sumWeights(group);
    return { groups, ashl: Object.values(saham).reduce((a, b) => a + b, 0n), saham, trace };
  }

  // [R10-1] penyebut-penyebut digabung dengan nisab arba'; tiap perbandingan dicatat.
  const denominators = [...new Set(fractions.map(f => f.fraction.d))];
  let ashl = denominators[0]!;
  for (const denominator of denominators.slice(1)) {
    const { hubungan: relation, fpb: gcd, hasil: result } = nisab(ashl, denominator);
    trace.push({ stage: 'ashl', refs: ['R10-1', 'R09-1'], kind: 'NISAB_COMPARE', purpose: 'ashl', a: ashl, b: denominator, relation, gcd, result });
    ashl = result;
  }
  // Bagian tetap bab 08 (1/3 sisa, muqasamah) bisa menghasilkan 18, 36, atau penyebut lain → di luar tujuh ashl.
  const hasJaddShare = groups.some(g => g.share.kind === 'fixed');
  if (!hasJaddShare && !VALID_USUL.includes(ashl)) throw new Error(`invariant [R09-1]: ashl ${ashl} di luar tujuh ashl`);

  let sahamTetap = 0n;
  for (const { group, fraction } of fractions) {
    const s = fraction.n * ashl / fraction.d;
    saham[group.id] = s;
    sahamTetap += s;   // termasuk bagian fardh ayah/kakek (fardhAshabah)
  }
  const sisa = ashl - sahamTetap;
  for (const group of groups.filter(isResidueGroup)) {
    saham[group.id] = (saham[group.id] ?? 0n) + (sisa > 0n ? sisa : 0n);
  }
  return { groups, ashl, saham, trace };
}
