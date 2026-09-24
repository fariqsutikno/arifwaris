import type { Fraction, Money, Nisab } from '@waris/math';

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
  | { kind: 'mahjub'; role: HeirRole; by: PersonId[]; ruleRef: string }
  | { kind: 'mamnu'; role: HeirRole; mani: 'qatl' | 'ikhtilafDin' | 'riqq' | 'istibham' | 'daur'; ruleRef: string }
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
  /** Penyebut tiap kolom: ashl, lalu 'aul/radd/tashih bila terjadi. */
  totals: Partial<Record<'ashl' | 'aul' | 'radd' | 'tashih', bigint>>;
  rows: Array<{
    group: GroupId;
    members: PersonId[];
    fardh?: Fraction;
    ashabah?: boolean;
    /** Saham kelompok per kolom (ashl/aul/radd/tashih). */
    cells: Record<string, bigint>;
    /** Per orang: dalam kelompok 2:1 bagian anggota bisa berbeda. */
    perPerson: Record<PersonId, { saham: bigint; nominal: Money }>;
  }>;
  excluded: PersonId[];
}

// ─── Trace ────────────────────────────────────────────────────────────────────

export type { Nisab };
export type Stage = 'tirkah' | 'derivasi' | 'mawani' | 'hajb' | 'furudh' | 'ashabah' | 'ashl' | 'klasifikasi' | 'tashih' | 'distribusi' | 'munasakhat';
/** Saham vs ru'us (inkisar) dan sisa zawjiyyah vs ashl radd hanya memakai FPB: habis / tawafuq / tabayun (bab 9.4, 10.3). */
export type InkisarRelation = 'habis' | 'tawafuq' | 'tabayun';

export type JaddOption = 'muqasamah' | 'tsuluts' | 'tsulutsBaqi' | 'sudus';

/**
 * Alasan sebuah fardh — data, bukan kalimat; `packages/explain` yang menarasikan
 * (mis. `by` diubah jadi nama orang: "karena ada anak perempuan (Fatimah)").
 */
export type FardhReason =
  | { code: 'ADA_FARU_WARITS'; by: PersonId[] }              // pasangan turun, ibu 1/6
  | { code: 'TANPA_FARU_WARITS' }                            // pasangan 1/2 atau 1/4
  | { code: 'JAM_IKHWAH'; by: PersonId[] }                   // ibu 1/6 karena 2+ saudara (termasuk yang mahjub)
  | { code: 'TANPA_FARU_WARITS_DAN_IKHWAH' }                 // ibu 1/3
  | { code: 'UMARIYYATAIN'; spouseFardh: Fraction }          // ibu 1/3 sisa
  | { code: 'NENEK_TANPA_IBU'; count: number }
  | { code: 'TANPA_MUASHSHIB'; count: number }               // anak/cucu pr: 1 → 1/2, 2+ → 2/3
  | { code: 'TAKMILAH'; with: PersonId[] }                   // 1/6 penyempurna 2/3
  | { code: 'KALALAH'; count: number }                       // saudari atau anak ibu tanpa far'u & ashl mudzakkar
  | { code: 'ADA_FARU_MUDZAKKAR'; by: PersonId[] }           // ayah/kakek 1/6 saja
  | { code: 'ADA_FARU_MUANNATS'; by: PersonId[] }            // ayah/kakek 1/6 + sisa
  | { code: 'MUSYARRAKAH' }
  | { code: 'AKDARIYYAH'; part: 'jadd' | 'ukht' }
  | { code: 'JADD_SISA_SEDIKIT'; sisa: Fraction }            // sisa ≤ 1/6 → kakek 1/6, saudara gugur
  | { code: 'JADD_WAL_IKHWAH'; sisa: Fraction; options: Array<{ name: JaddOption; value: Fraction }>; chosen: JaddOption };

export type TraceStep = { stage: Stage; refs: string[] } & (
  | { kind: 'MANI'; personId: PersonId; mani: string }
  | { kind: 'HAJB_HIRMAN'; mahjub: PersonId; hajib: PersonId[] }
  | { kind: 'HAJB_NUQSHAN'; affected: PersonId; from: Fraction; to: Fraction; cause: PersonId[] }
  | { kind: 'FARDH'; group: GroupId; fardh: Fraction; reason: FardhReason }
  | { kind: 'ASHABAH'; group: GroupId; type: 'binNafsi' | 'bilGhair' | 'maalGhair';
      // Diisi bila kakek memilih muqasamah bersama saudara (tidak ada langkah FARDH untuknya).
      jaddChoice?: Extract<FardhReason, { code: 'JADD_WAL_IKHWAH' }> }
  | { kind: 'SPECIAL_CASE'; name: 'umariyyatain' | 'musyarrakah' | 'akdariyyah' | 'muaddah' }
  | { kind: 'TIRKAH'; gross: Money; tajhiz: Money; hutang: Money; wasiatDiminta: Money; wasiatBatas: Money;
      wasiatDipakai: Money; wasiatButuhIjazah: Money; bersih: Money }
  // ashl/juzSahm: nisab arba' (a = hasil sejauh ini, b = bilangan berikutnya).
  // inkisar: a = saham kelompok, b = ru'us, result = simpanan (ru'us ÷ FPB; 1 bila habis).
  // raddVsSisa: a = sisa zawjiyyah, b = ashl radd, result = ashl akhir.
  | { kind: 'NISAB_COMPARE'; purpose: 'ashl' | 'raddVsSisa' | 'inkisar' | 'juzSahm'; group?: GroupId;
      a: bigint; b: bigint; relation: Nisab | InkisarRelation; gcd: bigint; result: bigint }
  | { kind: 'MASALAH_CLASS'; cls: 'adilah' | 'ailah' | 'raddA' | 'raddB'; sumSaham: bigint; ashl: bigint }
  | { kind: 'AUL'; from: bigint; to: bigint }
  | { kind: 'RADD';
      zawjiyyah?: { group: GroupId; ashl: bigint; spouseSaham: bigint; sisa: bigint };   // hanya raddB
      raddiyyah: { saham: Record<GroupId, bigint>; ashl: bigint };
      result: bigint }
  | { kind: 'TASHIH'; base: bigint; juzSahm: bigint; result: bigint }
  | { kind: 'DISTRIBUTE'; personId: PersonId; saham: bigint; of: bigint; amount: Money }
  // Bab 12.3: saham mayit berikutnya di jami'ah sejauh ini vs mas'alah-nya (tanpa tadakhul).
  | { kind: 'MUNASAKHAT'; mayit: PersonId; saham: bigint; masalah: bigint; relation: InkisarRelation;
      gcd: bigint; wafqMasalah: bigint; wafqSaham: bigint; jamiah: bigint;
      /** Per orang: saham sebelum × wafqMasalah + saham dari mayit × wafqSaham = sesudah. */
      rincian: Record<PersonId, { sebelum: bigint; dariMayit: bigint; sesudah: bigint }> }
  // Yang wafat tidak mendapat bagian dari mayit sebelumnya → tidak ada yang diteruskan; diabaikan [R12-1].
  | { kind: 'MUNASAKHAT_SKIP'; mayit: PersonId }
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

// ─── Munasakhat (bab 12) ──────────────────────────────────────────────────────

export interface MunasakhatInput {
  /** Mayit pertama = `base.graph.deceasedId`. */
  base: EngineInput;
  /**
   * Ahli waris yang wafat sebelum pembagian, urut waktu wafat (bab 12.7). Yang dibagi hanya harta mayit pertama;
   * harta pribadi, hutang, dan wasiat mereka sendiri bukan bagian munasakhat (bab 12.5).
   */
  deaths: PersonId[];
  /** Orang yang lahir setelah wafatnya mayit tertentu: belum ada saat mayit itu dan sebelumnya wafat. */
  bornAfterDeathOf?: Record<PersonId, PersonId>;
}

type EngineOk = Extract<EngineResult, { status: 'OK' }>;

export type MunasakhatResult =
  | (Extract<EngineResult, { status: 'NEEDS_INPUT' | 'UNSUPPORTED' }> & { mayit: PersonId })
  | { status: 'OK';
      /** Hasil pipeline tiap mayit, urut wafat. */
      steps: Array<{ mayit: PersonId; result: EngineOk }>;
      /** Bab 12.2: label untuk telusur-balik & penjelasan; tidak menentukan jalur hitung [R12-3]. */
      keadaan: 1 | 2 | 3;
      jamiah: bigint;
      saham: Record<PersonId, bigint>;
      /** Ikhtishar as-siham (bab 12.4 jenis 3): semua saham ÷ FPB-nya; untuk penyajian. */
      ikhtishar: { jamiah: bigint; saham: Record<PersonId, bigint> };
      nominal: Record<PersonId, Money>;
      rounding: { unit: bigint; remainder: Money };
      trace: TraceStep[] };
