import type { Fraction, Money } from '@waris/math';

// ─── Graf keluarga ────────────────────────────────────────────────────────────

export type PersonId = string;

export interface Person {
  id: PersonId;
  name?: string;
  sex: 'M' | 'F';
  fatherId?: PersonId;
  motherId?: PersonId;
  life: 'alive' | 'dead' | 'unknown';
  religion: 'islam' | 'nonIslam' | 'unknown';
  killedDeceased?: boolean;   // [SYF] semua bentuk pembunuhan (bab 02)
  isPlaceholder?: boolean;    // node penghubung buatan sistem
}

export interface Marriage {
  husbandId: PersonId;
  wifeId: PersonId;
  status: 'intact' | 'talakRajiIddah' | 'talakBain';
  talakInMaradh?: boolean;
}

export interface FamilyGraph {
  deceasedId: PersonId;
  persons: Record<PersonId, Person>;
  marriages: Marriage[];
}

// ─── Peran ahli waris ─────────────────────────────────────────────────────────

// [R03-1] Daftar ahli waris dan kunci peran (bab 3.1–3.2)
export type HeirKey =
  | 'IBN' | 'IBN_IBN' | 'AB' | 'JADD' | 'AKH_SYQ' | 'AKH_AB' | 'AKH_UMM'
  | 'IBN_AKH_SYQ' | 'IBN_AKH_AB' | 'AMM_SYQ' | 'AMM_AB' | 'IBN_AMM_SYQ' | 'IBN_AMM_AB'
  | 'ZAWJ' | 'MUTIQ'
  | 'BINT' | 'BINT_IBN' | 'UMM' | 'JADDAH_UMM' | 'JADDAH_AB'
  | 'UKHT_SYQ' | 'UKHT_AB' | 'UKHT_UMM' | 'ZAWJAH' | 'MUTIQAH';

// Posisi kekerabatan diturunkan dari graf; dipakai untuk urutan ashabah (bab 5.3) dan tanzil (bab 14.5).
export interface KinshipPosition {
  ancestorGeneration: number;
  descentDepth: number;
  lineage: 'full' | 'paternal' | 'maternal';
  throughFemale: boolean;
}

export interface HeirRole {
  personId: PersonId;
  key: HeirKey | 'DZAWIL_ARHAM' | 'NON_HEIR';
  kinship: KinshipPosition;
  path: PersonId[];
}

export type PersonStatus =
  | { kind: 'heir'; role: HeirRole }
  | { kind: 'mahjub'; by: PersonId[]; ruleRef: string }
  | { kind: 'mamnu'; mani: 'qatl' | 'ikhtilafDin' | 'riqq' | 'istibham' | 'daur'; ruleRef: string }
  | { kind: 'nonHeir'; reason: string; ruleRef?: string };

// ─── Konfigurasi ──────────────────────────────────────────────────────────────

export type Ruleset = 'syafii';

export interface MadhhabConfig {
  residuePolicy: 'radd' | 'baitulMal';          // default 'radd'   [R09-8] [R14-5]
  talakBainInMaradh: 'qaulJadid' | 'qaulQadim'; // default 'qaulJadid' [R02-3]
}

export const DEFAULT_CONFIG: MadhhabConfig = {
  residuePolicy: 'radd',
  talakBainInMaradh: 'qaulJadid',
};

// ─── Output tabel ─────────────────────────────────────────────────────────────

export type GroupId = string;

export interface MasalahTable {
  columns: Array<'fardh' | 'ashl' | 'aul' | 'radd' | 'tashih' | 'perPerson' | 'nominal'>;
  rows: Array<{
    group: GroupId;
    members: PersonId[];
    fardh?: Fraction;
    ashabah?: boolean;
    cells: Record<string, bigint>;
  }>;
  excluded: PersonId[];
}

// ─── Trace ────────────────────────────────────────────────────────────────────

export type Nisab = 'tamatsul' | 'tadakhul' | 'tawafuq' | 'tabayun';
export type Stage = 'tirkah' | 'derivasi' | 'mawani' | 'hajb' | 'furudh' | 'ashabah' | 'ashl' | 'klasifikasi' | 'tashih' | 'distribusi';

export type TraceStep = { stage: Stage; refs: string[] } & (
  | { kind: 'MANI'; personId: PersonId; mani: string }
  | { kind: 'HAJB_HIRMAN'; mahjub: PersonId; hajib: PersonId[] }
  | { kind: 'HAJB_NUQSHAN'; affected: PersonId; from: Fraction; to: Fraction; cause: PersonId[] }
  | { kind: 'FARDH'; group: GroupId; fardh: Fraction; condition: string }
  | { kind: 'ASHABAH'; group: GroupId; type: 'binNafsi' | 'bilGhair' | 'maalGhair' }
  | { kind: 'SPECIAL_CASE'; name: 'umariyyatain' | 'musyarrakah' | 'akdariyyah' | 'muaddah' }
  | { kind: 'NISAB_COMPARE'; purpose: 'ashl' | 'raddVsSisa' | 'inkisar' | 'juzSahm';
      a: bigint; b: bigint; relation: Nisab; gcd: bigint; result: bigint }
  | { kind: 'MASALAH_CLASS'; cls: 'adilah' | 'ailah' | 'raddA' | 'raddB'; sumSaham: bigint; ashl: bigint }
  | { kind: 'AUL'; from: bigint; to: bigint }
  | { kind: 'TASHIH'; base: bigint; juzSahm: bigint; result: bigint }
  | { kind: 'DISTRIBUTE'; personId: PersonId; saham: bigint; of: bigint; amount: Money }
);

// ─── Kontrak output utama ─────────────────────────────────────────────────────

export interface Question {
  personId?: PersonId;
  field: keyof Person | 'marriages' | 'rounding';
  reason: string;
}

export type EngineResult =
  | { status: 'NEEDS_INPUT'; questions: Question[] }
  | { status: 'UNSUPPORTED'; reason: string; refs: string[] }
  | { status: 'OK';
      statuses: Record<PersonId, PersonStatus>;
      table: MasalahTable;
      trace: TraceStep[];
      rounding: { unit: bigint; remainder: Money };
      ruleset: Ruleset;
      config: MadhhabConfig;
      kbVersion: string };

// ─── Input engine ─────────────────────────────────────────────────────────────

export interface TirkahInput {
  gross: Money;
  tajhiz: Money;
  hutang: Money;
  wasiat: Money;
}

// Satuan pembulatan nominal, dipilih pengguna (tunai vs transfer bank). Bukan khilaf fikih.
export interface RoundingConfig {
  unit: bigint;
}

export interface EngineInput {
  graph: FamilyGraph;
  tirkah: TirkahInput;
  rounding: RoundingConfig;
  config: MadhhabConfig;
  ruleset: Ruleset;
  kbVersion: string;
}
