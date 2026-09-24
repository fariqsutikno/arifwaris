import { gcd, type Fraction } from '@waris/math';
import type { GroupId, HeirKey, HeirRole, PersonId } from '../types.js';

/** Calon ahli waris: peran yang punya HeirKey (bukan DZAWIL_ARHAM / NON_HEIR). */
export type Heir = HeirRole & { key: HeirKey };

export type Share =
  | { kind: 'fardh'; fardh: Fraction }
  // [R04-5] ayah/kakek bersama far'u warits muannats: 1/6 + sisa.
  | { kind: 'fardhAshabah'; fardh: Fraction }
  | { kind: 'ashabah'; type: 'binNafsi' | 'bilGhair' | 'maalGhair' }
  // Bab 08: bagian kakek/saudari yang ditetapkan sebagai pecahan harta, bukan fardh muqaddarah.
  | { kind: 'fixed'; value: Fraction; basis: 'tsuluts' | 'tsulutsBaqi' | 'muqasamah' | 'muaddah' };

/**
 * Satu baris tabel mas'alah. `weights` = perbandingan bagian antar anggota (2:1 ashabah bil ghair,
 * rata untuk furudh bersama, 0 untuk saudara sebapak dalam mu'addah).
 */
export interface ShareGroup {
  id: GroupId;
  members: PersonId[];
  weights: Record<PersonId, bigint>;
  share: Share;
}

export type Unsupported = { status: 'UNSUPPORTED'; reason: string; refs: string[] };

/** Buat grup; bobot dinormalisasi (dibagi FPB bobot bukan nol) supaya 2:2 tampil sebagai rata. */
export function makeGroup(id: GroupId, weights: Record<PersonId, bigint>, share: Share): ShareGroup {
  const nonZero = Object.values(weights).filter(w => w > 0n);
  const divisor = nonZero.reduce((acc, w) => gcd(acc, w), 0n) || 1n;
  const normalized = Object.fromEntries(Object.entries(weights).map(([id, w]) => [id, w / divisor]));
  return { id, members: Object.keys(weights), weights: normalized, share };
}

/** Bobot rata 1 untuk tiap anggota (furudh bersama: istri-istri, nenek-nenek, anak-anak pr). */
export const equalWeights = (heirs: Array<{ personId: PersonId }>): Record<PersonId, bigint> =>
  Object.fromEntries(heirs.map(h => [h.personId, 1n]));

const MALE_KEYS: HeirKey[] = ['IBN', 'IBN_IBN', 'AB', 'JADD', 'AKH_SYQ', 'AKH_AB', 'AKH_UMM',
  'IBN_AKH_SYQ', 'IBN_AKH_AB', 'AMM_SYQ', 'AMM_AB', 'IBN_AMM_SYQ', 'IBN_AMM_AB', 'ZAWJ', 'MUTIQ'];
export const isMale = (heir: Heir): boolean => MALE_KEYS.includes(heir.key);

/** Unit ru'us ashabah bil ghair: laki-laki 2, perempuan 1 (An-Nisa' 11, 176). */
export const unitOf = (heir: Heir): bigint => (isMale(heir) ? 2n : 1n);
