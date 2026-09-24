import { fpb } from '@waris/math';
import { compute } from './pipeline.js';
import { distributeNominal } from './stages/pembagian.js';
import { computeTirkah } from './stages/tirkah.js';
import type {
  EngineResult, FamilyGraph, InkisarRelation, MunasakhatInput, MunasakhatResult, PersonId, TraceStep,
} from './types.js';

type EngineOk = Extract<EngineResult, { status: 'OK' }>;
type Saham = Record<PersonId, bigint>;

const NO_TIRKAH = { gross: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

/**
 * Orkestrator munasakhat (bab 12) di atas pipeline: tiap mayit dihitung dengan `compute`, lalu digabung
 * bertahap memakai metode Keadaan 3, yang berlaku untuk semua keadaan [R12-3].
 * Yang dibagi hanya harta mayit pertama; bagian yang diteruskan ke mayit berikutnya adalah harta yang ia dapat
 * dari mayit pertama, bukan pembagian waris atas seluruh hartanya. Hutang, wasiat, dan harta pribadinya
 * diselesaikan terpisah oleh ahli warisnya (bab 12.5).
 */
export function computeMunasakhat(input: MunasakhatInput): MunasakhatResult {
  const order = deathOrder(input);
  const steps: Array<{ mayit: PersonId; result: EngineOk }> = [];
  const trace: TraceStep[] = [];
  let saham: Saham = {};
  let jamiah = 0n;

  for (const [index, mayit] of order.entries()) {
    if (index > 0 && !saham[mayit]) {
      trace.push({ stage: 'munasakhat', refs: ['R12-1'], kind: 'MUNASAKHAT_SKIP', mayit });
      continue;
    }
    // Hanya harta mayit pertama yang bernominal; mayit berikutnya cukup mas'alah-nya (bab 12.5).
    const tirkah = index === 0 ? input.base.tirkah : NO_TIRKAH;
    const result = compute({ ...input.base, tirkah, graph: graphAt(input, order, index) });
    if (result.status !== 'OK') return { ...result, mayit };
    steps.push({ mayit, result });

    const masalahSaham = sahamOf(result);
    const masalah = total(masalahSaham);
    if (index === 0) {
      saham = masalahSaham;
      jamiah = masalah;
    } else {
      const step = combine(saham, jamiah, mayit, masalahSaham, masalah);
      saham = step.saham;
      jamiah = step.trace.jamiah;
      trace.push(step.trace);
    }
    assertInvariants(saham, jamiah);
  }

  const tirkah = computeTirkah(input.base.tirkah);
  const nominal = distributeNominal(saham, jamiah, tirkah.bersih, input.base.rounding.unit);

  return {
    status: 'OK', steps, jamiah, saham,
    keadaan: classifyKeadaan(input, order, steps, saham, jamiah),
    ikhtishar: ikhtisharSiham(saham, jamiah),
    nominal: nominal.nominal,
    rounding: { unit: input.base.rounding.unit, remainder: nominal.remainder },
    trace: [...trace, tirkah.trace, ...nominal.trace],
  };
}

/**
 * [R12-2] Kaidah pembeda tiga keadaan (bab 12.2), diterapkan pada seluruh rantai:
 * - 1: hasil = membagi harta mayit pertama langsung kepada yang masih hidup, seolah yang wafat belakangan tidak ada
 *      (ahli waris mayit berikutnya = baqiyyah ahli waris mayit pertama, bagian tidak berbeda);
 * - 2: lebih dari satu mayit kedua, ahli waris masing-masing tidak mewarisi dari mayit pertama maupun mayit lain;
 * - 3: selain itu.
 */
function classifyKeadaan(input: MunasakhatInput, order: PersonId[], steps: Array<{ mayit: PersonId; result: EngineOk }>,
  saham: Saham, jamiah: bigint): 1 | 2 | 3 {
  const allDead = graphAt(input, order, 0);
  for (const personId of input.deaths) allDead.persons[personId] = { ...allDead.persons[personId]!, life: 'dead' };
  const direct = compute({ ...input.base, tirkah: NO_TIRKAH, graph: allDead });
  if (direct.status === 'OK' && sameFractions(sahamOf(direct), saham, jamiah)) return 1;

  const [first, ...later] = steps;
  const heirsOf = (step: { mayit: PersonId; result: EngineOk }) => Object.keys(sahamOf(step.result));
  const mayitIds = new Set(steps.map(step => step.mayit));
  const firstHeirs = new Set(heirsOf(first!));
  const disjoint = later.every(step => heirsOf(step).every(id => !firstHeirs.has(id) && !mayitIds.has(id)));
  return later.length > 1 && disjoint ? 2 : 3;
}

function sameFractions(direct: Saham, saham: Saham, jamiah: bigint): boolean {
  const directTotal = total(direct);
  const ids = Object.keys(saham);
  return ids.length === Object.keys(direct).length
    && ids.every(id => direct[id] !== undefined && direct[id]! * jamiah === saham[id]! * directTotal);
}

function deathOrder(input: MunasakhatInput): PersonId[] {
  const order = [input.base.graph.deceasedId, ...input.deaths];
  if (new Set(order).size !== order.length) throw new Error('munasakhat: seseorang tercatat wafat dua kali');
  for (const after of Object.values(input.bornAfterDeathOf ?? {})) {
    if (!order.includes(after)) throw new Error(`munasakhat: bornAfterDeathOf merujuk ${after} yang tidak ada di urutan wafat`);
  }
  return order;
}

/** Graf saat mayit ke-`index` wafat: yang wafat lebih dulu 'dead', yang wafat belakangan masih 'alive'. */
function graphAt(input: MunasakhatInput, order: PersonId[], index: number): FamilyGraph {
  const { graph } = input.base;
  const unborn = new Set(Object.entries(input.bornAfterDeathOf ?? {})
    .filter(([, after]) => index <= order.indexOf(after))
    .map(([personId]) => personId));

  const persons = Object.fromEntries(Object.entries(graph.persons).filter(([id]) => !unborn.has(id)));
  for (const [position, personId] of order.entries()) {
    persons[personId] = { ...graph.persons[personId]!, life: position <= index ? 'dead' : 'alive' };
  }
  const marriages = graph.marriages.filter(m => !unborn.has(m.husbandId) && !unborn.has(m.wifeId));
  return { deceasedId: order[index]!, persons, marriages };
}

function sahamOf(result: EngineOk): Saham {
  const saham: Saham = {};
  for (const row of result.table.rows) {
    for (const [personId, cell] of Object.entries(row.perPerson)) {
      if (cell.saham > 0n) saham[personId] = cell.saham;
    }
  }
  return saham;
}

const total = (saham: Saham): bigint => Object.values(saham).reduce((a, b) => a + b, 0n);

/**
 * [R12-2] Saham mayit di jami'ah sejauh ini vs mas'alah-nya: habis / tawafuq / tabayun, tanpa tadakhul.
 * Jami'ah baru = jami'ah × wafq mas'alah; saham mas'alah mayit × wafq saham.
 */
function combine(saham: Saham, jamiah: bigint, mayit: PersonId, masalahSaham: Saham, masalah: bigint):
  { saham: Saham; trace: Extract<TraceStep, { kind: 'MUNASAKHAT' }> } {
  const sahamMayit = saham[mayit]!;
  const faktor = fpb(sahamMayit, masalah);
  const wafqMasalah = masalah / faktor;
  const wafqSaham = sahamMayit / faktor;
  const relation: InkisarRelation = sahamMayit % masalah === 0n ? 'habis' : faktor === 1n ? 'tabayun' : 'tawafuq';

  const rincian: Extract<TraceStep, { kind: 'MUNASAKHAT' }>['rincian'] = {};
  for (const [personId, value] of Object.entries(saham)) {
    if (personId !== mayit) rincian[personId] = { sebelum: value, dariMayit: 0n, sesudah: value * wafqMasalah };
  }
  for (const [personId, value] of Object.entries(masalahSaham)) {
    const row = rincian[personId] ?? { sebelum: 0n, dariMayit: 0n, sesudah: 0n };
    rincian[personId] = { ...row, dariMayit: value, sesudah: row.sesudah + value * wafqSaham };
  }
  const next: Saham = Object.fromEntries(Object.entries(rincian).map(([personId, row]) => [personId, row.sesudah]));
  return {
    saham: next,
    trace: { stage: 'munasakhat', refs: ['R12-2'], kind: 'MUNASAKHAT', mayit, saham: sahamMayit, masalah, relation,
      gcd: faktor, wafqMasalah, wafqSaham, jamiah: jamiah * wafqMasalah, rincian },
  };
}

function assertInvariants(saham: Saham, jamiah: bigint): void {
  if (total(saham) !== jamiah) throw new Error(`munasakhat: Σ saham ${total(saham)} ≠ jami'ah ${jamiah}`);
  if (Object.values(saham).some(value => value <= 0n)) throw new Error('munasakhat: ada saham ≤ 0');
}

/** Bab 12.4 jenis 3: bila semua saham bersekutu, dibagi FPB-nya. Hanya penyajian. */
function ikhtisharSiham(saham: Saham, jamiah: bigint): { jamiah: bigint; saham: Saham } {
  const faktor = Object.values(saham).reduce((acc, value) => fpb(acc, value), jamiah);
  return {
    jamiah: jamiah / faktor,
    saham: Object.fromEntries(Object.entries(saham).map(([personId, value]) => [personId, value / faktor])),
  };
}
