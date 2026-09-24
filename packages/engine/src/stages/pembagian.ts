import { floorShare, fraction, type Money } from '@waris/math';
import type { MasalahTable, PersonId, PersonStatus, TraceStep } from '../types.js';
import type { Classified } from './klasifikasi.js';
import { fixedFractionOf, isResidueGroup, type Masalah } from './model.js';
import type { Tashih } from './tashih.js';

/**
 * Tahap 6 (bab 11.1): nominal = saham ÷ tashih × tirkah bersih, dibulatkan ke bawah ke kelipatan
 * `unit` per orang; selisihnya dilaporkan, tidak dibagikan diam-diam (engine-contract Tahap 6).
 */
export function distributeNominal(perPerson: Record<PersonId, bigint>, tashih: bigint, bersih: Money, unit: bigint):
  { nominal: Record<PersonId, Money>; remainder: Money; trace: TraceStep[] } {
  const nominal: Record<PersonId, Money> = {};
  const trace: TraceStep[] = [];
  for (const [personId, saham] of Object.entries(perPerson)) {
    const amount = floorShare(bersih, fraction(saham, tashih), unit);
    nominal[personId] = amount;
    trace.push({ stage: 'distribusi', refs: ['R11-1'], kind: 'DISTRIBUTE', personId, saham, of: tashih, amount });
  }
  const remainder = bersih - Object.values(nominal).reduce((a, b) => a + b, 0n);
  return { nominal, remainder, trace };
}

/** Tabel mas'alah: kolom 'aul/radd/tashih hanya muncul bila terjadi; yang mahjub/mamnu tetap tampil di `excluded`. */
export function buildTable(
  masalah: Masalah,
  classified: Classified,
  tashih: Tashih,
  nominal: Record<PersonId, Money>,
  statuses: Record<PersonId, PersonStatus>,
): MasalahTable {
  const adaTashih = tashih.juzSahm > 1n;
  const columns: MasalahTable['columns'] = ['fardh', 'ashl'];
  if (classified.column) columns.push(classified.column);
  if (adaTashih) columns.push('tashih');
  columns.push('perPerson', 'nominal');

  const totals: MasalahTable['totals'] = { ashl: masalah.ashl };
  if (classified.column) totals[classified.column] = classified.base;
  if (adaTashih) totals.tashih = tashih.tashih;

  const rows = masalah.groups.map(group => {
    const cells: Record<string, bigint> = { ashl: masalah.saham[group.id]! };
    if (classified.column) cells[classified.column] = classified.saham[group.id]!;
    if (adaTashih) cells['tashih'] = tashih.groupSaham[group.id]!;
    const fardh = fixedFractionOf(group.share);
    return {
      group: group.id,
      members: group.members,
      ...(fardh ? { fardh } : {}),
      ...(isResidueGroup(group) ? { ashabah: true } : {}),
      cells,
      perPerson: Object.fromEntries(group.members.map(id => [id, { saham: tashih.perPerson[id]!, nominal: nominal[id]! }])),
    };
  });

  const excluded = Object.entries(statuses).filter(([, s]) => s.kind === 'mahjub' || s.kind === 'mamnu').map(([id]) => id);
  return { columns, totals, rows, excluded };
}
