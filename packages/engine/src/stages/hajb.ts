import type { HeirKey, PersonId, TraceStep } from '../types.js';
import type { Heir } from './model.js';

export interface Mahjub { by: PersonId[]; ruleRef: string }

const FARU_MUDZAKKAR: HeirKey[] = ['IBN', 'IBN_IBN'];
const FARU_WARITS: HeirKey[] = ['IBN', 'BINT', 'IBN_IBN', 'BINT_IBN'];
const HAWASYI_ASHABAH: HeirKey[] = ['IBN_AKH_SYQ', 'IBN_AKH_AB', 'AMM_SYQ', 'AMM_AB', 'IBN_AMM_SYQ', 'IBN_AMM_AB'];

/**
 * Tahap 1c: hajb hirman [R06-3]. Kandidat diproses dari hajib terkuat (bab 6.7 no. 2) sehingga
 * setiap orang hanya dibandingkan dengan yang sudah pasti tidak terhijab.
 */
export function applyHajb(candidates: Heir[]): { mahjub: Record<PersonId, Mahjub>; effective: Heir[]; trace: TraceStep[] } {
  const effective: Heir[] = [];
  const mahjub: Record<PersonId, Mahjub> = {};
  const trace: TraceStep[] = [];

  for (const heir of [...candidates].sort((a, b) => compareTuple(evaluationOrder(a), evaluationOrder(b)))) {
    const blocked = hajibOf(heir, effective);
    if (blocked && blocked.by.length > 0) {
      mahjub[heir.personId] = blocked;
      trace.push({ stage: 'hajb', refs: [blocked.ruleRef], kind: 'HAJB_HIRMAN', mahjub: heir.personId, hajib: blocked.by });
    } else {
      effective.push(heir);
    }
  }
  return { mahjub, effective, trace };
}

// ─── Urutan evaluasi ──────────────────────────────────────────────────────────

function evaluationOrder(heir: Heir): number[] {
  const { ancestorGeneration: gen, descentDepth: depth } = heir.kinship;
  switch (heir.key) {
    case 'IBN_IBN': return [1, depth];
    case 'BINT_IBN': return [2, depth];
    case 'JADD': return [3, gen];
    case 'JADDAH_UMM': case 'JADDAH_AB': return [4, gen];
    case 'AKH_SYQ': return [5, 0];
    case 'UKHT_SYQ': return [5, 1];
    case 'AKH_AB': return [6, 0];         // sebelum UKHT_AB: menentukan apakah ia diashabahkan
    case 'UKHT_AB': return [6, 1];
    case 'AKH_UMM': case 'UKHT_UMM': return [7, 0];
    default:
      return HAWASYI_ASHABAH.includes(heir.key) ? [8, ...ashabahRank(heir)] : [0];
  }
}

function compareTuple(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * [R05-2] [R05-3] urutan ashabah bi nafsihi [SYF]: jihah → darajah → quwwah.
 * Jihah: bunuwwah 0, ubuwwah 1, juduwwah & ukhuwwah 2, bani al-ikhwah 3, 'umumah 4.
 */
function ashabahRank(heir: Heir): number[] {
  const { ancestorGeneration: gen, descentDepth: depth, lineage } = heir.kinship;
  const quwwah = lineage === 'full' ? 0 : 1;
  switch (heir.key) {
    case 'IBN': case 'IBN_IBN': return [0, depth];
    case 'AB': return [1];
    case 'JADD': case 'AKH_SYQ': case 'AKH_AB': case 'UKHT_SYQ': case 'UKHT_AB': return [2];
    case 'IBN_AKH_SYQ': case 'IBN_AKH_AB': return [3, depth, quwwah];
    default: return [4, gen, depth, quwwah];   // AMM_*, IBN_AMM_*
  }
}

// ─── Aturan hajib per jenis ───────────────────────────────────────────────────

const ids = (heirs: Heir[]) => heirs.map(h => h.personId);
const withKey = (heirs: Heir[], keys: HeirKey[]) => heirs.filter(h => keys.includes(h.key));
const rule = (by: Heir[], ruleRef: string): Mahjub | undefined => (by.length > 0 ? { by: ids(by), ruleRef } : undefined);

/** [R05-5] saudari menjadi ashabah ma'al ghair bersama far'u warits perempuan, tanpa saudara lk sederajat. */
function maalGhairSisters(effective: Heir[], sisterKey: 'UKHT_SYQ' | 'UKHT_AB'): Heir[] {
  const brotherKey = sisterKey === 'UKHT_SYQ' ? 'AKH_SYQ' : 'AKH_AB';
  const hasFaruMuannats = withKey(effective, ['BINT', 'BINT_IBN']).length > 0;
  const hasBrother = withKey(effective, [brotherKey]).length > 0;
  return hasFaruMuannats && !hasBrother ? withKey(effective, [sisterKey]) : [];
}

function hajibOf(heir: Heir, effective: Heir[]): Mahjub | undefined {
  const { ancestorGeneration: gen, descentDepth: depth } = heir.kinship;
  const faruMudzakkar = withKey(effective, FARU_MUDZAKKAR);
  const ab = withKey(effective, ['AB']);
  const jadd = withKey(effective, ['JADD']);

  switch (heir.key) {
    case 'IBN_IBN':
      return rule(faruMudzakkar.filter(h => h.kinship.descentDepth < depth), 'R06-3');

    case 'BINT_IBN': {
      const maleAbove = faruMudzakkar.filter(h => h.kinship.descentDepth < depth);
      if (maleAbove.length > 0) return rule(maleAbove, 'R06-3');
      // [R04-13] 2+ perempuan di atasnya menghabiskan 2/3, kecuali ada mu'ashshib sederajat/lebih rendah.
      const femalesAbove = withKey(effective, ['BINT', 'BINT_IBN']).filter(h => h.kinship.descentDepth < depth);
      const muashshib = withKey(effective, ['IBN_IBN']).some(h => h.kinship.descentDepth >= depth);
      return femalesAbove.length >= 2 && !muashshib ? rule(femalesAbove, 'R04-13') : undefined;
    }

    case 'JADD':
      return rule([...ab, ...jadd.filter(h => h.kinship.ancestorGeneration < gen)], 'R06-3');

    case 'JADDAH_UMM': case 'JADDAH_AB': {
      const side = heir.key;
      const by = [
        ...withKey(effective, ['UMM']),
        ...(side === 'JADDAH_AB' ? ab : []),                          // [R04-10]
        ...jadd.filter(j => heir.path.includes(j.personId)),          // [R04-6] hanya nenek yang lewat kakek itu
        // [R04-9] [SYF]: nenek dekat sepihak menghijab yang jauh; nenek dekat pihak ibu juga menghijab
        // nenek jauh pihak ayah, tidak sebaliknya.
        ...withKey(effective, ['JADDAH_UMM', 'JADDAH_AB']).filter(k =>
          k.kinship.ancestorGeneration < gen && (k.key === side || k.key === 'JADDAH_UMM')),
      ];
      return rule(by, 'R04-9');
    }

    case 'AKH_SYQ': case 'UKHT_SYQ':
      return rule([...faruMudzakkar, ...ab], 'R06-4');

    case 'AKH_AB': case 'UKHT_AB': {
      const base = [...faruMudzakkar, ...ab];
      // [R08-4] bersama kakek, saudara sebapak tidak digugurkan kandung di sini; mu'addah (bab 08) yang mengatur.
      if (jadd.length > 0) return rule(base, 'R06-3');
      const byKandung = [...withKey(effective, ['AKH_SYQ']), ...maalGhairSisters(effective, 'UKHT_SYQ')];
      const kandungSisters = withKey(effective, ['UKHT_SYQ']);
      const hasBrotherAb = withKey(effective, ['AKH_AB']).length > 0;
      // [R04-14] saudari sebapak gugur oleh 2+ saudari kandung, kecuali diashabahkan saudara lk sebapak.
      const byTwoSisters = heir.key === 'UKHT_AB' && kandungSisters.length >= 2 && !hasBrotherAb ? kandungSisters : [];
      return rule(unique([...base, ...byKandung, ...byTwoSisters]), 'R06-3');
    }

    case 'AKH_UMM': case 'UKHT_UMM':
      return rule([...withKey(effective, FARU_WARITS), ...ab, ...jadd], 'R06-5');

    default: {
      if (!HAWASYI_ASHABAH.includes(heir.key)) return undefined;   // ayah, ibu, anak, pasangan: tidak pernah hirman [R06-2]
      const rank = ashabahRank(heir);
      const stronger = [
        ...withKey(effective, ['IBN', 'IBN_IBN', 'AB', 'JADD', 'AKH_SYQ', 'AKH_AB', ...HAWASYI_ASHABAH]),
        ...maalGhairSisters(effective, 'UKHT_SYQ'),
        ...maalGhairSisters(effective, 'UKHT_AB'),
      ].filter(h => compareTuple(ashabahRank(h), rank) < 0);
      return rule(stronger, 'R05-3');
    }
  }
}

function unique(heirs: Heir[]): Heir[] {
  return heirs.filter((h, i) => heirs.findIndex(o => o.personId === h.personId) === i);
}
