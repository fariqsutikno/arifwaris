import { compare, fraction, mul, sub, type Fraction } from '@waris/math';
import type { PersonId, TraceStep } from '../types.js';
import { isMale, makeGroup, unitOf, type Heir, type ShareGroup, type Unsupported } from './model.js';

const ONE = fraction(1n);
const SUDUS = fraction(1n, 6n);
const NISF = fraction(1n, 2n);
const TSULUTS = fraction(1n, 3n);

type Pilihan = 'muqasamah' | 'tsuluts' | 'tsulutsBaqi' | 'sudus';

const fmt = (f: Fraction) => `${f.n}/${f.d}`;
const unitWeights = (heirs: Heir[]): Record<PersonId, bigint> => Object.fromEntries(heirs.map(h => [h.personId, unitOf(h)]));
const ashabahType = (heirs: Heir[]) => (heirs.some(h => !isMale(h)) ? 'bilGhair' as const : 'binNafsi' as const);

/**
 * Bab 08 [SYF], algoritma 8.6: kakek bersama saudara kandung/sebapak. Dipanggil setelah semua furudh
 * lain ditetapkan; `furudhSum` = jumlahnya. Akdariyyah ditangani pemanggil (pola furudh khusus).
 */
export function jaddWalIkhwah(
  jadd: Heir,
  siblings: Heir[],
  furudhSum: Fraction,
  hasFaruMuannats: boolean,
): { groups: ShareGroup[]; trace: TraceStep[] } | Unsupported {
  if (hasFaruMuannats && !siblings.some(isMale)) {
    return {
      status: 'UNSUPPORTED',
      reason: "Kakek bersama saudari yang menjadi ashabah ma'al ghair (ada anak/cucu pr) belum dirinci KB bab 08.",
      refs: ['R08-3'],
    };
  }

  const groups: ShareGroup[] = [];
  const trace: TraceStep[] = [];
  const sisa = sub(ONE, furudhSum);
  const units = siblings.reduce((sum, h) => sum + unitOf(h), 0n);

  // [R08-3] sisa ≤ 1/6: kakek 1/6 (dengan 'aul bila perlu), saudara gugur — tetap dicatat sebagai ashabah tanpa sisa.
  if (furudhSum.n > 0n && compare(sisa, SUDUS) <= 0) {
    groups.push(makeGroup('JADD', { [jadd.personId]: 1n }, { kind: 'fardh', fardh: SUDUS }));
    trace.push({ stage: 'furudh', refs: ['R08-3'], kind: 'FARDH', group: 'JADD', fardh: SUDUS,
      condition: `jadd wal ikhwah: sisa ${fmt(sisa)} ≤ 1/6 → kakek 1/6, saudara gugur` });
    groups.push(makeGroup('IKHWAH', unitWeights(siblings), { kind: 'ashabah', type: ashabahType(siblings) }));
    trace.push({ stage: 'ashabah', refs: ['R08-3'], kind: 'ASHABAH', group: 'IKHWAH', type: ashabahType(siblings) });
    return { groups, trace };
  }

  // [R08-2] tanpa furudh: terbaik dari muqasamah dan 1/3; [R08-3] dengan furudh: + 1/3 sisa dan 1/6.
  // Seri → muqasamah didahulukan (bab 8.2 "pilih muqasamah secara default").
  const muqasamah = mul(sisa, fraction(2n, 2n + units));
  const options: Array<[Pilihan, Fraction]> = furudhSum.n === 0n
    ? [['muqasamah', muqasamah], ['tsuluts', TSULUTS]]
    : [['muqasamah', muqasamah], ['tsulutsBaqi', mul(sisa, TSULUTS)], ['sudus', SUDUS]];
  const [pilihan, bagianKakek] = options.reduce((best, opt) => (compare(opt[1], best[1]) > 0 ? opt : best));
  const condition = `jadd wal ikhwah: ${options.map(([name, value]) => `${name} ${fmt(value)}`).join(', ')} → ${pilihan}`;
  const refs = [furudhSum.n === 0n ? 'R08-2' : 'R08-3'];

  const kandung = siblings.filter(h => h.key === 'AKH_SYQ' || h.key === 'UKHT_SYQ');
  const sebapak = siblings.filter(h => h.key === 'AKH_AB' || h.key === 'UKHT_AB');
  const muaddah = kandung.length > 0 && sebapak.length > 0;

  if (pilihan === 'muqasamah' && !muaddah) {
    // Kakek dihitung sebagai satu saudara lk dalam ashabah yang sama.
    const members = [jadd, ...siblings];
    groups.push(makeGroup('JADD_IKHWAH', unitWeights(members), { kind: 'ashabah', type: ashabahType(siblings) }));
    trace.push({ stage: 'ashabah', refs, kind: 'ASHABAH', group: 'JADD_IKHWAH', type: ashabahType(siblings) });
    return { groups, trace };
  }

  groups.push(makeGroup('JADD', { [jadd.personId]: 1n }, pilihan === 'sudus'
    ? { kind: 'fardh', fardh: SUDUS }
    : { kind: 'fixed', value: bagianKakek, basis: pilihan }));
  trace.push({ stage: 'furudh', refs, kind: 'FARDH', group: 'JADD', fardh: bagianKakek, condition });

  if (!muaddah) {
    groups.push(makeGroup('IKHWAH', unitWeights(siblings), { kind: 'ashabah', type: ashabahType(siblings) }));
    trace.push({ stage: 'ashabah', refs, kind: 'ASHABAH', group: 'IKHWAH', type: ashabahType(siblings) });
    return { groups, trace };
  }

  // [R08-4] mu'addah: sebapak ikut dihitung melawan kakek, lalu bagiannya kembali ke kandung.
  trace.push({ stage: 'ashabah', refs: ['R08-4'], kind: 'SPECIAL_CASE', name: 'muaddah' });
  const [onlyKandung] = kandung;
  if (kandung.length === 1 && onlyKandung && !isMale(onlyKandung)) {
    // [R08-4] saudari kandung tunggal mengambil hingga 1/2; lebihnya untuk sebapak.
    const bagianSaudara = sub(sisa, bagianKakek);
    const bagianUkht = compare(bagianSaudara, NISF) < 0 ? bagianSaudara : NISF;
    groups.push(makeGroup('UKHT_SYQ', { [onlyKandung.personId]: 1n }, { kind: 'fixed', value: bagianUkht, basis: 'muaddah' }));
    groups.push(makeGroup('IKHWAH', unitWeights(sebapak), { kind: 'ashabah', type: ashabahType(sebapak) }));
    trace.push({ stage: 'ashabah', refs: ['R08-4'], kind: 'ASHABAH', group: 'IKHWAH', type: ashabahType(sebapak) });
    return { groups, trace };
  }

  const weights = { ...unitWeights(kandung), ...Object.fromEntries(sebapak.map(h => [h.personId, 0n])) };
  groups.push(makeGroup('IKHWAH', weights, { kind: 'ashabah', type: ashabahType(kandung) }));
  trace.push({ stage: 'ashabah', refs: ['R08-4'], kind: 'ASHABAH', group: 'IKHWAH', type: ashabahType(kandung) });
  return { groups, trace };
}
