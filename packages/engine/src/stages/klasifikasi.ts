import { fpb } from '@waris/math';
import type { GroupId, InkisarRelation, MadhhabConfig, TraceStep } from '../types.js';
import { isResidueGroup, type Masalah, type Unsupported } from './model.js';

// [R09-4] hanya 6, 12, 24 yang bisa 'aul, dengan batas masing-masing.
const VALID_AUL: Record<string, bigint[]> = { 6: [7n, 8n, 9n, 10n], 12: [13n, 15n, 17n], 24: [27n] };
// Id kelompok pasangan dari tahap 2 (bagian.ts); pasangan tidak menerima radd [R09-9].
const SPOUSE_GROUPS: GroupId[] = ['ZAWJ', 'ZAWJAH'];

export interface Classified {
  /** Penyebut setelah klasifikasi: ashl ('adilah), hasil 'aul, atau hasil radd. */
  base: bigint;
  saham: Record<GroupId, bigint>;
  column?: 'aul' | 'radd';
  trace: TraceStep[];
}

const sum = (xs: bigint[]) => xs.reduce((a, b) => a + b, 0n);

/** Tahap 4: 'adilah / 'ailah / radd (bab 9.2–9.4). */
export function classifyMasalah(masalah: Masalah, config: MadhhabConfig, hasDzawilArham: boolean): Classified | Unsupported {
  const { ashl, saham, groups } = masalah;
  const total = sum(Object.values(saham));

  if (total === ashl) {
    return { base: ashl, saham, trace: [{ stage: 'klasifikasi', refs: ['R09-3'], kind: 'MASALAH_CLASS', cls: 'adilah', sumSaham: total, ashl }] };
  }
  if (total > ashl) {
    if (!VALID_AUL[ashl.toString()]?.includes(total)) throw new Error(`invariant [R09-4]: 'aul ${ashl} → ${total} tidak sah`);
    return {
      base: total, saham, column: 'aul',
      trace: [
        { stage: 'klasifikasi', refs: ['R09-3'], kind: 'MASALAH_CLASS', cls: 'ailah', sumSaham: total, ashl },
        { stage: 'klasifikasi', refs: ['R09-3', 'R09-4'], kind: 'AUL', from: ashl, to: total },
      ],
    };
  }
  if (groups.some(isResidueGroup)) throw new Error('invariant: ada ashabah tetapi saham < ashl');
  return applyRadd(masalah, total, config, hasDzawilArham);
}

function applyRadd(masalah: Masalah, total: bigint, config: MadhhabConfig, hasDzawilArham: boolean): Classified | Unsupported {
  const { ashl, saham, groups } = masalah;
  if (config.residuePolicy === 'baitulMal') {
    return { status: 'UNSUPPORTED', reason: 'Sisa harta ke baitul mal belum didukung output engine.', refs: ['R09-8'] };
  }
  const spouse = groups.find(g => SPOUSE_GROUPS.includes(g.id));
  const receivers = groups.filter(g => g !== spouse);
  if (receivers.length === 0) {
    return hasDzawilArham
      ? { status: 'UNSUPPORTED', reason: 'Sisa harta ke dzawil arham (fase 3); pasangan tidak menerima radd.', refs: ['R09-9', 'R14-4'] }
      : { status: 'UNSUPPORTED', reason: 'Sisa harta ke baitul mal; pasangan tidak menerima radd.', refs: ['R09-9', 'R02-1'] };
  }

  // [R09-7] ashl radd = jumlah saham ahli radd, disederhanakan (satu jenis → per kepala lewat tashih).
  const divisor = receivers.reduce((acc, g) => fpb(acc, saham[g.id]!), 0n);
  const raddSaham: Record<GroupId, bigint> = Object.fromEntries(receivers.map(g => [g.id, saham[g.id]! / divisor]));
  const raddAshl = sum(Object.values(raddSaham));

  if (!spouse) {
    return {
      base: raddAshl, saham: raddSaham, column: 'radd',
      trace: [
        { stage: 'klasifikasi', refs: ['R09-7'], kind: 'MASALAH_CLASS', cls: 'raddA', sumSaham: total, ashl },
        { stage: 'klasifikasi', refs: ['R09-7', 'R09-10'], kind: 'RADD', raddiyyah: { saham: raddSaham, ashl: raddAshl }, result: raddAshl },
      ],
    };
  }

  // [R09-10] mas'alah zawjiyyah dari makhraj fardh pasangan; sisanya dibandingkan dengan ashl radd.
  if (spouse.share.kind !== 'fardh') throw new Error('invariant: pasangan harus fardh');
  const zawjiyyahAshl = spouse.share.fardh.d;
  const spouseSaham = spouse.share.fardh.n;
  const sisa = zawjiyyahAshl - spouseSaham;
  const faktor = fpb(sisa, raddAshl);
  const relation: InkisarRelation = sisa % raddAshl === 0n ? 'habis' : faktor > 1n ? 'tawafuq' : 'tabayun';
  const pengali = raddAshl / faktor;             // habis → 1; tawafuq → wafq ashl radd; tabayun → seluruh ashl radd
  const result = zawjiyyahAshl * pengali;
  const finalSaham: Record<GroupId, bigint> = { [spouse.id]: spouseSaham * pengali };
  for (const g of receivers) finalSaham[g.id] = raddSaham[g.id]! * (sisa / faktor);

  return {
    base: result, saham: finalSaham, column: 'radd',
    trace: [
      { stage: 'klasifikasi', refs: ['R09-7'], kind: 'MASALAH_CLASS', cls: 'raddB', sumSaham: total, ashl },
      { stage: 'klasifikasi', refs: ['R09-10'], kind: 'NISAB_COMPARE', purpose: 'raddVsSisa', a: sisa, b: raddAshl, relation, gcd: faktor, result },
      { stage: 'klasifikasi', refs: ['R09-7', 'R09-10'], kind: 'RADD',
        zawjiyyah: { group: spouse.id, ashl: zawjiyyahAshl, spouseSaham, sisa },
        raddiyyah: { saham: raddSaham, ashl: raddAshl }, result },
    ],
  };
}
