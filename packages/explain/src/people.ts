import type { EngineResult, FamilyGraph, HeirKey, HeirRole, PersonId } from '@waris/engine';
import { joinAnd, type Segment } from './segments.js';

type Ok = Extract<EngineResult, { status: 'OK' }>;

// Padanan sehari-hari kode peran bab 3.1–3.2.
export const ROLE_LABEL: Record<HeirKey, string> = {
  IBN: 'anak laki-laki', IBN_IBN: 'cucu laki-laki dari anak laki-laki', AB: 'ayah', JADD: 'kakek',
  AKH_SYQ: 'saudara laki-laki kandung', AKH_AB: 'saudara laki-laki sebapak', AKH_UMM: 'saudara laki-laki seibu',
  IBN_AKH_SYQ: 'anak laki-laki saudara kandung', IBN_AKH_AB: 'anak laki-laki saudara sebapak',
  AMM_SYQ: 'paman kandung', AMM_AB: 'paman sebapak', IBN_AMM_SYQ: 'anak laki-laki paman kandung',
  IBN_AMM_AB: 'anak laki-laki paman sebapak', ZAWJ: 'suami', MUTIQ: "mu'tiq",
  BINT: 'anak perempuan', BINT_IBN: 'cucu perempuan dari anak laki-laki', UMM: 'ibu',
  JADDAH_UMM: 'nenek dari pihak ibu', JADDAH_AB: 'nenek dari pihak ayah',
  UKHT_SYQ: 'saudara perempuan kandung', UKHT_AB: 'saudara perempuan sebapak', UKHT_UMM: 'saudara perempuan seibu',
  ZAWJAH: 'istri', MUTIQAH: "mu'tiqah",
};

// [R03-2] paman & anak paman mencakup paman ayah/kakek (ancestorGeneration 3, 4, …); «عم أب» = paman ayah.
const ANCESTOR_OF_DECEASED = ['', '', '', 'ayah', 'kakek'];

/** Sebutan peran; paman/anak paman di atas generasi ayah diberi keterangan leluhurnya ("paman kandung ayah"). */
export function roleLabel(role: HeirRole): string {
  const base = role.key in ROLE_LABEL ? ROLE_LABEL[role.key as HeirKey] : 'kerabat';
  const generation = role.kinship.ancestorGeneration;
  if (!/^(IBN_)?AMM_/.test(role.key) || generation < 3) return base;
  return `${base} ${ANCESTOR_OF_DECEASED[generation] ?? `leluhur ke-${generation - 1}`}`;
}

const ORDINAL = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];
const COLLECTIVE = ['', '', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];

export interface People {
  /** Sebutan satu/beberapa orang. Sebutan pertama orang bernama memperkenalkan perannya. */
  mention(ids: PersonId[]): Segment;
  deceased(): Segment;
  roleOf(id: PersonId): HeirRole | undefined;
}

/**
 * Sebutan orang untuk narasi; id internal tidak pernah tampil.
 * - Bernama: "Fatimah (anak perempuan)" lalu "Fatimah".
 * - Tanpa nama: "anak perempuan" bila perannya tunggal, "anak perempuan kedua" bila lebih dari satu (urutan input);
 *   seluruh anggota satu peran sekaligus → "kedua anak perempuan".
 */
export function makePeople(result: Ok, graph: FamilyGraph): People {
  const roleOf = (id: PersonId) => {
    const status = result.statuses[id];
    return status && 'role' in status ? status.role : undefined;
  };
  const labelOf = (id: PersonId) => {
    const role = roleOf(id);
    return role ? roleLabel(role) : 'kerabat';
  };
  const sameRole = new Map<string, PersonId[]>();
  for (const id of Object.keys(graph.persons)) {
    if (!roleOf(id)) continue;
    sameRole.set(labelOf(id), [...(sameRole.get(labelOf(id)) ?? []), id]);
  }
  const mentioned = new Set<PersonId>();

  const single = (id: PersonId): string => {
    const name = graph.persons[id]?.name;
    const label = labelOf(id);
    if (name) return mentioned.has(id) ? name : `${name} (${label})`;
    const peers = sameRole.get(label) ?? [id];
    return peers.length === 1 ? label : `${label} ${ORDINAL[peers.indexOf(id)] ?? `ke-${peers.indexOf(id) + 1}`}`;
  };

  const mention = (ids: PersonId[]): Segment => {
    const label = labelOf(ids[0]!);
    const peers = sameRole.get(label) ?? [];
    const wholeRole = ids.length > 1 && ids.length === peers.length && ids.every(id => labelOf(id) === label)
      && ids.every(id => !graph.persons[id]?.name);
    const text = wholeRole
      ? `${COLLECTIVE[ids.length] ?? ids.length} ${label}`
      : joinAnd(ids.map(id => [{ kind: 'text' as const, text: single(id) }])).map(p => p.text).join('');
    ids.forEach(id => mentioned.add(id));
    return { kind: 'person', personIds: ids, text };
  };

  const deceased = (): Segment => {
    const person = graph.persons[graph.deceasedId]!;
    return { kind: 'person', personIds: [person.id], text: person.name ?? (person.sex === 'M' ? 'almarhum' : 'almarhumah') };
  };

  return { mention, deceased, roleOf };
}
