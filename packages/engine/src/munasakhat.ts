import { add, compare, floorShare, fraction, gcd, mul, sub, type Fraction, type Money } from '@waris/math';
import { compute } from './pipeline.js';
import { distributeNominal } from './stages/pembagian.js';
import { computeTirkah } from './stages/tirkah.js';
import type {
  EngineResult, FamilyGraph, InkisarRelation, MunasakhatInput, MunasakhatResult, MunasakhatTirkah, PersonId, TraceStep,
} from './types.js';

type EngineOk = Extract<EngineResult, { status: 'OK' }>;
type Saham = Record<PersonId, bigint>;

const ZERO = fraction(0n);
const NO_DEDUCTION: MunasakhatTirkah = { pribadi: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

/**
 * Orkestrator munasakhat (bab 12) di atas pipeline: tiap mayit dihitung dengan `compute`, lalu digabung
 * bertahap memakai metode Keadaan 3, yang berlaku untuk semua keadaan [R12-3].
 */
export function computeMunasakhat(input: MunasakhatInput): MunasakhatResult {
  const order = deathOrder(input);
  const steps: Array<{ mayit: PersonId; result: EngineOk }> = [];
  const trace: TraceStep[] = [];
  let saham: Saham = {};
  let jamiah = 0n;

  for (const [index, mayit] of order.entries()) {
    if (index > 0 && !saham[mayit]) {
      return { status: 'UNSUPPORTED', mayit, refs: ['R12-1'],
        reason: 'Yang wafat tidak mendapat bagian dari mayit sebelumnya, jadi bukan munasakhat.' };
    }
    const result = compute({ ...input.base, graph: graphAt(input, order, index) });
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

  const nominal = input.deaths.some(death => death.tirkah)
    ? chainedNominal(input, steps)
    : jamiahNominal(input, saham, jamiah);

  return {
    status: 'OK', steps, jamiah, saham,
    ikhtishar: ikhtisharSiham(saham, jamiah),
    nominal: nominal.nominal,
    rounding: { unit: input.base.rounding.unit, remainder: nominal.remainder },
    trace: [...trace, ...nominal.trace],
  };
}

function deathOrder(input: MunasakhatInput): PersonId[] {
  const order = [input.base.graph.deceasedId, ...input.deaths.map(death => death.personId)];
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
  const faktor = gcd(sahamMayit, masalah);
  const wafqMasalah = masalah / faktor;
  const wafqSaham = sahamMayit / faktor;
  const relation: InkisarRelation = sahamMayit % masalah === 0n ? 'habis' : faktor === 1n ? 'tabayun' : 'tawafuq';

  const next: Saham = {};
  for (const [personId, value] of Object.entries(saham)) {
    if (personId !== mayit) next[personId] = value * wafqMasalah;
  }
  for (const [personId, value] of Object.entries(masalahSaham)) {
    next[personId] = (next[personId] ?? 0n) + value * wafqSaham;
  }
  return {
    saham: next,
    trace: { stage: 'munasakhat', refs: ['R12-2'], kind: 'MUNASAKHAT', mayit, saham: sahamMayit, masalah, relation,
      gcd: faktor, wafqMasalah, wafqSaham, jamiah: jamiah * wafqMasalah },
  };
}

function assertInvariants(saham: Saham, jamiah: bigint): void {
  if (total(saham) !== jamiah) throw new Error(`munasakhat: Σ saham ${total(saham)} ≠ jami'ah ${jamiah}`);
  if (Object.values(saham).some(value => value <= 0n)) throw new Error('munasakhat: ada saham ≤ 0');
}

/** Bab 12.4 jenis 3: bila semua saham bersekutu, dibagi FPB-nya. Hanya penyajian. */
function ikhtisharSiham(saham: Saham, jamiah: bigint): { jamiah: bigint; saham: Saham } {
  const faktor = Object.values(saham).reduce((acc, value) => gcd(acc, value), jamiah);
  return {
    jamiah: jamiah / faktor,
    saham: Object.fromEntries(Object.entries(saham).map(([personId, value]) => [personId, value / faktor])),
  };
}

/** Default bab 12.5: urusan harta mayit berikutnya dianggap sudah beres → tirkah mayit 1 dibagi menurut jami'ah. */
function jamiahNominal(input: MunasakhatInput, saham: Saham, jamiah: bigint) {
  const tirkah = computeTirkah(input.base.tirkah);
  const nominal = distributeNominal(saham, jamiah, tirkah.bersih, input.base.rounding.unit);
  return { nominal: nominal.nominal, remainder: nominal.remainder, trace: [tirkah.trace, ...nominal.trace] };
}

/**
 * Bab 12.5 [Keputusan Penerapan Prinsip Umum]: tiap mayit berikutnya menjalani bab 01 atas warisannya + harta
 * pribadinya. Dihitung dengan pecahan eksak; dibulatkan ke bawah per orang hanya di akhir.
 */
function chainedNominal(input: MunasakhatInput, steps: Array<{ mayit: PersonId; result: EngineOk }>) {
  const tirkah = computeTirkah(input.base.tirkah);
  const trace: TraceStep[] = [tirkah.trace];
  const amounts: Record<PersonId, Fraction> = {};
  const distribute = (bersih: Fraction, result: EngineOk) => {
    const masalahSaham = sahamOf(result);
    const masalah = total(masalahSaham);
    for (const [personId, value] of Object.entries(masalahSaham)) {
      amounts[personId] = add(amounts[personId] ?? ZERO, mul(bersih, fraction(value, masalah)));
    }
  };

  distribute(fraction(tirkah.bersih), steps[0]!.result);
  for (const [index, death] of input.deaths.entries()) {
    const warisan = amounts[death.personId]!;
    delete amounts[death.personId];
    const potongan = death.tirkah ?? NO_DEDUCTION;
    const setelahHutang = nonNegative(sub(sub(add(warisan, fraction(potongan.pribadi)), fraction(potongan.tajhiz)), fraction(potongan.hutang)));
    // [R01-4] wasiat maksimal 1/3 sisa setelah hutang; batas dibulatkan ke bawah ke rupiah seperti tahap 0 [KH].
    const wasiatBatas = fraction(floorShare(1n, mul(setelahHutang, fraction(1n, 3n)), 1n));
    const wasiatDipakai = compare(fraction(potongan.wasiat), wasiatBatas) < 0 ? fraction(potongan.wasiat) : wasiatBatas;
    const bersih = sub(setelahHutang, wasiatDipakai);
    trace.push({ stage: 'munasakhat', refs: ['R01-1', 'R01-4', 'R12-1'], kind: 'MUNASAKHAT_TIRKAH', mayit: death.personId,
      warisan, pribadi: potongan.pribadi, tajhiz: potongan.tajhiz, hutang: potongan.hutang,
      wasiatDiminta: potongan.wasiat, wasiatDipakai, bersih });
    distribute(bersih, steps[index + 1]!.result);
  }

  const unit = input.base.rounding.unit;
  const nominal: Record<PersonId, Money> = {};
  let exactTotal = ZERO;
  for (const [personId, amount] of Object.entries(amounts)) {
    nominal[personId] = floorShare(1n, amount, unit);
    exactTotal = add(exactTotal, amount);
  }
  const remainder = floorShare(1n, exactTotal, 1n) - Object.values(nominal).reduce((a, b) => a + b, 0n);
  return { nominal, remainder, trace };
}

const nonNegative = (x: Fraction): Fraction => (compare(x, ZERO) < 0 ? ZERO : x);
