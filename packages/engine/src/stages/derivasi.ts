import type { FamilyGraph, HeirKey, HeirRole, KinshipPosition, MadhhabConfig, Person, PersonId } from '../types.js';

type Lineage = KinshipPosition['lineage'];
type RoleKey = HeirRole['key'];

export interface DerivedRoles {
  roles: Record<PersonId, HeirRole>;
  /** Orang yang sekaligus pasangan dan kerabat pewaris — tidak diatur KB, orkestrator menolak. */
  duaJihah: PersonId[];
}

/**
 * Tahap 1a: turunkan peran tiap orang dari graf (bab 3.1–3.2). Jenis saudara/paman ditentukan dari
 * kesamaan fatherId/motherId, tidak pernah diinput langsung.
 */
export function deriveRoles(graph: FamilyGraph, config: MadhhabConfig): DerivedRoles {
  const deceasedPaths = upwardPaths(graph, graph.deceasedId);
  const roles: Record<PersonId, HeirRole> = {};
  const duaJihah: PersonId[] = [];

  for (const personId of Object.keys(graph.persons)) {
    if (personId === graph.deceasedId) continue;
    const kin = kinshipRole(graph, personId, deceasedPaths);
    const spouse = spouseRole(graph, personId, config);
    if (spouse && kin.key !== 'NON_HEIR' && kin.key !== 'DZAWIL_ARHAM') duaJihah.push(personId);
    roles[personId] = spouse ?? kin;
  }
  return { roles, duaJihah };
}

// ─── Pasangan ─────────────────────────────────────────────────────────────────

function spouseRole(graph: FamilyGraph, personId: PersonId, config: MadhhabConfig): HeirRole | undefined {
  const deceasedId = graph.deceasedId;
  const marriage = graph.marriages.find(m =>
    (m.husbandId === deceasedId && m.wifeId === personId) || (m.wifeId === deceasedId && m.husbandId === personId));
  if (!marriage) return undefined;

  const path = [deceasedId, personId];
  const kinship: KinshipPosition = { ancestorGeneration: 0, descentDepth: 0, lineage: 'full', throughFemale: false };
  // [R02-3] talak ba'in memutus sebab nikah; pengecualian talak di maradh al-maut hanya menurut qaul qadim.
  const inheritsDespiteBain = marriage.talakInMaradh === true && marriage.husbandId === deceasedId
    && config.talakBainInMaradh === 'qaulQadim';
  if (marriage.status === 'talakBain' && !inheritsDespiteBain) return { personId, key: 'NON_HEIR', kinship, path };

  return { personId, key: marriage.husbandId === personId ? 'ZAWJ' : 'ZAWJAH', kinship, path };
}

// ─── Kekerabatan ──────────────────────────────────────────────────────────────

/** Semua leluhur `startId` beserta jalur terpendek [start, ..., leluhur]. */
function upwardPaths(graph: FamilyGraph, startId: PersonId): Map<PersonId, PersonId[]> {
  const paths = new Map<PersonId, PersonId[]>([[startId, [startId]]]);
  const queue: PersonId[][] = [[startId]];
  while (queue.length > 0) {
    const path = queue.shift()!;
    const person = graph.persons[path[path.length - 1]!];
    for (const parentId of [person?.fatherId, person?.motherId]) {
      if (parentId === undefined || paths.has(parentId) || !graph.persons[parentId]) continue;
      const next = [...path, parentId];
      paths.set(parentId, next);
      queue.push(next);
    }
  }
  return paths;
}

function kinshipRole(graph: FamilyGraph, personId: PersonId, deceasedPaths: Map<PersonId, PersonId[]>): HeirRole {
  const ancestorPath = deceasedPaths.get(personId);
  if (ancestorPath) return ascendantRole(graph, personId, ancestorPath);

  const personPaths = upwardPaths(graph, personId);
  const descentPath = personPaths.get(graph.deceasedId);
  if (descentPath) return descendantRole(graph, personId, [...descentPath].reverse());

  return collateralRole(graph, personId, personPaths, deceasedPaths);
}

const sexOf = (graph: FamilyGraph, id: PersonId): Person['sex'] => graph.persons[id]!.sex;
const hasFemale = (graph: FamilyGraph, ids: PersonId[]) => ids.some(id => sexOf(graph, id) === 'F');

/** `path` = [pewaris, ayah/ibu, ..., orang ini]. */
function ascendantRole(graph: FamilyGraph, personId: PersonId, path: PersonId[]): HeirRole {
  const generation = path.length - 1;
  const links = path.slice(1);
  const intermediates = path.slice(1, -1);
  const kinship: KinshipPosition = {
    ancestorGeneration: generation,
    descentDepth: 0,
    lineage: sexOf(graph, links[0]!) === 'M' ? 'paternal' : 'maternal',
    throughFemale: hasFemale(graph, intermediates),
  };

  let key: RoleKey;
  if (sexOf(graph, personId) === 'M') {
    // [R03-1] jadd shahih: ke atas melalui laki-laki saja; selain itu jadd fasid (dzawil arham).
    key = hasFemale(graph, links) ? 'DZAWIL_ARHAM' : generation === 1 ? 'AB' : 'JADD';
  } else if (generation === 1) {
    key = 'UMM';
  } else {
    // [R03-4] [R03-5] nenek shahihah: tidak ada laki-laki diapit dua perempuan → pola jalur L* P*.
    const sexes = intermediates.map(id => sexOf(graph, id));
    const fasidah = sexes.some((sex, i) => sex === 'M' && sexes.slice(0, i).includes('F'));
    key = fasidah ? 'DZAWIL_ARHAM' : kinship.lineage === 'paternal' ? 'JADDAH_AB' : 'JADDAH_UMM';
  }
  return { personId, key, kinship, path };
}

/** `path` = [pewaris, anak, ..., orang ini]. */
function descendantRole(graph: FamilyGraph, personId: PersonId, path: PersonId[]): HeirRole {
  const depth = path.length - 1;
  const throughFemale = hasFemale(graph, path.slice(1, -1));
  const kinship: KinshipPosition = { ancestorGeneration: 0, descentDepth: depth, lineage: 'full', throughFemale };
  const male = sexOf(graph, personId) === 'M';
  // [R14-4] cucu melalui anak perempuan = dzawil arham.
  const key: RoleKey = throughFemale ? 'DZAWIL_ARHAM'
    : depth === 1 ? (male ? 'IBN' : 'BINT')
    : (male ? 'IBN_IBN' : 'BINT_IBN');
  return { personId, key, kinship, path };
}

function siblingLineage(a: Person, b: Person): Lineage | undefined {
  const sameFather = a.fatherId !== undefined && a.fatherId === b.fatherId;
  const sameMother = a.motherId !== undefined && a.motherId === b.motherId;
  if (sameFather && sameMother) return 'full';
  if (sameFather) return 'paternal';
  if (sameMother) return 'maternal';
  return undefined;
}

/**
 * Hawasyi: orang ini (atau leluhurnya, X) bersaudara dengan pewaris atau leluhur pewaris (Y).
 * ancestorGeneration = generasi Y + 1; descentDepth = jarak X → orang ini + 1 (bab 3 / tabel KinshipPosition).
 */
function collateralRole(
  graph: FamilyGraph,
  personId: PersonId,
  personPaths: Map<PersonId, PersonId[]>,
  deceasedPaths: Map<PersonId, PersonId[]>,
): HeirRole {
  let best: { generation: number; depth: number; lineage: Lineage; xPath: PersonId[]; yPath: PersonId[] } | undefined;
  for (const [xId, xPath] of personPaths) {
    for (const [yId, yPath] of deceasedPaths) {
      if (xId === yId) continue;
      const lineage = siblingLineage(graph.persons[xId]!, graph.persons[yId]!);
      if (!lineage) continue;
      const generation = yPath.length;
      const depth = xPath.length;
      if (!best || generation < best.generation || (generation === best.generation && depth < best.depth)) {
        best = { generation, depth, lineage, xPath, yPath };
      }
    }
  }

  if (!best) {
    const kinship: KinshipPosition = { ancestorGeneration: 0, descentDepth: 0, lineage: 'full', throughFemale: false };
    return { personId, key: 'NON_HEIR', kinship, path: [graph.deceasedId, personId] };
  }

  const { generation, depth, lineage, xPath, yPath } = best;
  const downFromSibling = [...xPath].reverse();          // [X, ..., orang ini]
  const path = [...yPath, ...downFromSibling];
  const throughFemale = hasFemale(graph, [...yPath.slice(1), ...downFromSibling.slice(0, -1)]);
  const kinship: KinshipPosition = { ancestorGeneration: generation, descentDepth: depth, lineage, throughFemale };
  const male = sexOf(graph, personId) === 'M';
  const maleLineDown = !hasFemale(graph, downFromSibling);
  const strongLineage = lineage === 'full' ? 'SYQ' : 'AB';

  let key: RoleKey = 'DZAWIL_ARHAM';
  if (generation === 1 && depth === 1) {
    const suffix = lineage === 'full' ? 'SYQ' : lineage === 'paternal' ? 'AB' : 'UMM';
    key = `${male ? 'AKH' : 'UKHT'}_${suffix}` as HeirKey;
  } else if (generation === 1 && lineage !== 'maternal' && maleLineDown) {
    // [R14-4] anak saudari, anak saudara seibu, anak pr saudara → dzawil arham.
    key = strongLineage === 'SYQ' ? 'IBN_AKH_SYQ' : 'IBN_AKH_AB';
  } else if (generation >= 2 && lineage !== 'maternal' && maleLineDown && !hasFemale(graph, yPath.slice(1))) {
    // [R03-2] paman mencakup paman ayah/kakek, asal jalurnya lewat laki-laki; 'ammah & khal = dzawil arham.
    key = depth === 1 ? `AMM_${strongLineage}` as HeirKey : `IBN_AMM_${strongLineage}` as HeirKey;
  }
  return { personId, key, kinship, path };
}
