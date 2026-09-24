import type { FamilyGraph, HeirRole, PersonId, PersonStatus, TraceStep } from '../types.js';

/**
 * Tahap 1b: status awal tiap orang. Yang terkena mani' dianggap tidak ada dan tidak menghijab
 * siapa pun [R06-6]; sisanya (status 'heir') masuk ke tahap hajb.
 */
export function applyMawani(
  graph: FamilyGraph,
  roles: Record<PersonId, HeirRole>,
): { statuses: Record<PersonId, PersonStatus>; trace: TraceStep[] } {
  const statuses: Record<PersonId, PersonStatus> = {};
  const trace: TraceStep[] = [];

  for (const [personId, role] of Object.entries(roles)) {
    const person = graph.persons[personId]!;
    if (role.key === 'NON_HEIR') {
      statuses[personId] = isTalakBain(graph, personId)
        ? { kind: 'nonHeir', reason: "talak ba'in memutus sebab nikah", ruleRef: 'R02-3' }
        : { kind: 'nonHeir', reason: 'tidak ada sebab waris' };
    } else if (role.key === 'DZAWIL_ARHAM') {
      statuses[personId] = { kind: 'nonHeir', reason: 'dzawil arham', ruleRef: 'R14-4' };
    } else if (person.life !== 'alive') {
      // Syarat 2 (bab 2.2): warits harus hidup saat muwarrits wafat.
      statuses[personId] = { kind: 'nonHeir', reason: 'tidak hidup saat pewaris wafat' };
    } else if (person.religion === 'nonIslam') {
      statuses[personId] = { kind: 'mamnu', mani: 'ikhtilafDin', ruleRef: 'R02-4' };
      trace.push({ stage: 'mawani', refs: ['R02-4'], kind: 'MANI', personId, mani: 'ikhtilafDin' });
    } else if (person.killedDeceased === true) {
      // [R02-9] [SYF] semua bentuk pembunuhan menghalangi.
      statuses[personId] = { kind: 'mamnu', mani: 'qatl', ruleRef: 'R02-9' };
      trace.push({ stage: 'mawani', refs: ['R02-9'], kind: 'MANI', personId, mani: 'qatl' });
    } else {
      statuses[personId] = { kind: 'heir', role };
    }
  }
  return { statuses, trace };
}

function isTalakBain(graph: FamilyGraph, personId: PersonId): boolean {
  const { deceasedId } = graph;
  return graph.marriages.some(m => m.status === 'talakBain'
    && ((m.husbandId === deceasedId && m.wifeId === personId) || (m.wifeId === deceasedId && m.husbandId === personId)));
}
