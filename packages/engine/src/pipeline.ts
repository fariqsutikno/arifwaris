import { assignShares } from './stages/bagian.js';
import { deriveRoles } from './stages/derivasi.js';
import { applyHajb } from './stages/hajb.js';
import { applyMawani } from './stages/mawani.js';
import type { Heir, ShareGroup } from './stages/model.js';
import { validateInput } from './stages/validasi.js';
import type { EngineInput, EngineResult, HeirRole, PersonId, PersonStatus, TraceStep } from './types.js';

type EarlyExit = Extract<EngineResult, { status: 'NEEDS_INPUT' | 'UNSUPPORTED' }>;

export interface HeirStagesResult {
  status: 'HEIRS';
  statuses: Record<PersonId, PersonStatus>;
  groups: ShareGroup[];
  trace: TraceStep[];
}

const isHeirKey = (role: HeirRole): role is Heir => role.key !== 'NON_HEIR' && role.key !== 'DZAWIL_ARHAM';

/** Tahap 1–2: derivasi peran → validasi → mawani' → hajb → furudh/ashabah (+ bab 07/08). */
export function runHeirStages(input: EngineInput): HeirStagesResult | EarlyExit {
  const { graph, config } = input;
  const deceased = graph.persons[graph.deceasedId];
  if (!deceased) throw new Error(`deceasedId ${graph.deceasedId} tidak ada di graf`);
  if (deceased.religion === 'nonIslam') {
    return { status: 'UNSUPPORTED', reason: 'Pewaris non-muslim di luar cakupan platform.', refs: ['R02-4'] };
  }

  const { roles, duaJihah } = deriveRoles(graph, config);
  const questions = validateInput(input, roles);
  if (questions.length > 0) return { status: 'NEEDS_INPUT', questions };
  if (duaJihah.length > 0) {
    return { status: 'UNSUPPORTED', reason: `Ahli waris dengan dua jihah (pasangan sekaligus kerabat): ${duaJihah.join(', ')}.`, refs: [] };
  }

  const mawani = applyMawani(graph, roles);
  const candidates = Object.values(mawani.statuses)
    .flatMap(s => (s.kind === 'heir' && isHeirKey(s.role) ? [s.role] : []));
  if (candidates.length === 0) {
    const hasDzawilArham = Object.values(roles).some(r => r.key === 'DZAWIL_ARHAM');
    return hasDzawilArham
      ? { status: 'UNSUPPORTED', reason: 'Tidak ada ashabul furudh/ashabah; pewarisan dzawil arham (fase 3).', refs: ['R14-4'] }
      : { status: 'UNSUPPORTED', reason: 'Tidak ada ahli waris; harta ke baitul mal.', refs: ['R02-1'] };
  }

  const hajb = applyHajb(candidates);
  const statuses = { ...mawani.statuses };
  for (const [personId, { by, ruleRef }] of Object.entries(hajb.mahjub)) {
    statuses[personId] = { kind: 'mahjub', by, ruleRef };
  }

  const shares = assignShares(hajb.effective, candidates);
  if ('status' in shares) return shares;

  return { status: 'HEIRS', statuses, groups: shares.groups, trace: [...mawani.trace, ...hajb.trace, ...shares.trace] };
}

export function compute(input: EngineInput): EngineResult {
  const heirs = runHeirStages(input);
  if (heirs.status !== 'HEIRS') return heirs;
  throw new Error('compute: tahap 3–6 (ashl, aul/radd, tashih, nominal) belum diimplementasikan');
}
