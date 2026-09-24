import type { EngineResult, FamilyGraph, HeirKey, HeirRole, PersonId } from '@waris/engine';

type Ok = Extract<EngineResult, { status: 'OK' }>;

// Padanan sehari-hari untuk kode peran bab 3.1–3.2 (istilah fikih tetap dipakai di kalimat lain).
const ROLE_LABEL: Record<HeirKey, string> = {
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

/** Konteks narasi: nama orang, peran, dan anggota tiap kelompok. */
export interface Ctx {
  result: Ok;
  graph: FamilyGraph;
  roleOf: (id: PersonId) => HeirRole | undefined;
  membersOf: (group: string) => PersonId[];
}

export function makeCtx(result: Ok, graph: FamilyGraph): Ctx {
  const roleOf = (id: PersonId) => {
    const status = result.statuses[id];
    return status && 'role' in status ? status.role : undefined;
  };
  const membersOf = (group: string) => result.table.rows.find(r => r.group === group)?.members ?? [];
  return { result, graph, roleOf, membersOf };
}

const roleLabel = (ctx: Ctx, id: PersonId): string => {
  const key = ctx.roleOf(id)?.key;
  return key && key in ROLE_LABEL ? ROLE_LABEL[key as HeirKey] : 'kerabat';
};
const nameOf = (ctx: Ctx, id: PersonId): string => ctx.graph.persons[id]?.name ?? id;

/** "anak perempuan (Fatimah)"; beberapa orang berperan sama → "2 anak perempuan (A, B)". */
export function listLabel(ctx: Ctx, ids: PersonId[], joiner: ', ' | ' dan ' = ', '): string {
  const byRole = new Map<string, PersonId[]>();
  for (const id of ids) byRole.set(roleLabel(ctx, id), [...(byRole.get(roleLabel(ctx, id)) ?? []), id]);
  const parts = [...byRole].map(([label, members]) =>
    `${members.length > 1 ? `${members.length} ` : ''}${label} (${members.map(id => nameOf(ctx, id)).join(', ')})`);
  return parts.join(joiner === ' dan ' && parts.length > 2 ? ', ' : joiner);
}

export const groupLabel = (ctx: Ctx, group: string): string => listLabel(ctx, ctx.membersOf(group), ' dan ');

export const hasRole = (ctx: Ctx, id: PersonId, keys: HeirKey[]): boolean => keys.includes(ctx.roleOf(id)?.key as HeirKey);
