import type { EngineResult, FamilyGraph, PersonId, TraceStep } from '@waris/engine';
import { makePeople, type People } from './people.js';
import { joinAnd, type Segment } from './segments.js';

export type Ok = Extract<EngineResult, { status: 'OK' }>;
export type Step<K extends TraceStep['kind']> = Extract<TraceStep, { kind: K }>;

export interface Ctx {
  result: Ok;
  people: People;
  steps<K extends TraceStep['kind']>(kind: K): Array<Step<K>>;
  membersOf(group: string): PersonId[];
  /** Penyebut akhir: tashih, lalu radd/'aul, lalu ashl. */
  finalDenominator: bigint;
  showNominal: boolean;
}

export function makeCtx(result: Ok, graph: FamilyGraph): Ctx {
  const { totals } = result.table;
  return {
    result,
    people: makePeople(result, graph),
    steps: <K extends TraceStep['kind']>(kind: K) => result.trace.filter((s): s is Step<K> => s.kind === kind),
    membersOf: group => result.table.rows.find(r => r.group === group)?.members ?? [],
    finalDenominator: totals.tashih ?? totals.radd ?? totals.aul ?? totals.ashl!,
    showNominal: result.trace.some(s => s.kind === 'TIRKAH' && s.gross > 0n),
  };
}

/** Sebut beberapa orang, dikelompokkan per peran ("kedua anak perempuan dan ibu"). */
export function mentionAll(ctx: Ctx, ids: PersonId[]): Segment[] {
  const byRole = new Map<string, PersonId[]>();
  for (const id of ids) {
    const key = ctx.people.roleOf(id)?.key ?? id;
    byRole.set(key, [...(byRole.get(key) ?? []), id]);
  }
  return joinAnd([...byRole.values()].map(members => [ctx.people.mention(members)]));
}

export const group = (ctx: Ctx, groupId: string): Segment[] => mentionAll(ctx, ctx.membersOf(groupId));
