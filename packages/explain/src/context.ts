import type { HasilEngine, GrafKeluarga, IdOrang, LangkahJejak } from '@waris/engine';
import { makePeople, type People } from './people.js';
import { joinAnd, type Segment } from './segments.js';

export type Ok = Extract<HasilEngine, { status: 'OK' }>;
export type Step<K extends LangkahJejak['jenis']> = Extract<LangkahJejak, { jenis: K }>;

export interface Ctx {
  hasil: Ok;
  people: People;
  langkahLangkah<K extends LangkahJejak['jenis']>(jenis: K): Array<Step<K>>;
  membersOf(kelompok: string): IdOrang[];
  /** Penyebut akhir: tashih, lalu radd/'aul, lalu ashl. */
  finalDenominator: bigint;
  showNominal: boolean;
}

export function makeCtx(hasil: Ok, graf: GrafKeluarga): Ctx {
  const { totalKolom } = hasil.tabel;
  return {
    hasil,
    people: makePeople(hasil, graf),
    langkahLangkah: <K extends LangkahJejak['jenis']>(jenis: K) => hasil.jejak.filter((s): s is Step<K> => s.jenis === jenis),
    membersOf: kelompok => hasil.tabel.baris.find(r => r.kelompok === kelompok)?.anggota ?? [],
    finalDenominator: totalKolom.tashih ?? totalKolom.radd ?? totalKolom.aul ?? totalKolom.ashl!,
    showNominal: hasil.jejak.some(s => s.jenis === 'TIRKAH' && s.kotor > 0n),
  };
}

/** Sebut beberapa orang, dikelompokkan per peran ("kedua anak perempuan dan ibu"). */
export function mentionAll(ctx: Ctx, ids: IdOrang[]): Segment[] {
  const byRole = new Map<string, IdOrang[]>();
  for (const id of ids) {
    const kunci = ctx.people.roleOf(id)?.kunci ?? id;
    byRole.set(kunci, [...(byRole.get(kunci) ?? []), id]);
  }
  return joinAnd([...byRole.values()].map(anggota => [ctx.people.mention(anggota)]));
}

export const kelompok = (ctx: Ctx, groupId: string): Segment[] => mentionAll(ctx, ctx.membersOf(groupId));
