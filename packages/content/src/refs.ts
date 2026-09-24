/// <reference path="./raw.d.ts" />
import bab01 from '../../../docs/kb/01_pendahuluan_dan_tirkah.md?raw';
import bab02 from '../../../docs/kb/02_asas_kewarisan.md?raw';
import bab03 from '../../../docs/kb/03_daftar_ahli_waris.md?raw';
import bab04 from '../../../docs/kb/04_ashabul_furudh.md?raw';
import bab05 from '../../../docs/kb/05_ashabah.md?raw';
import bab06 from '../../../docs/kb/06_hajb.md?raw';
import bab07 from '../../../docs/kb/07_masalah_khusus_furudh.md?raw';
import bab08 from '../../../docs/kb/08_jadd_wal_ikhwah.md?raw';
import bab09 from '../../../docs/kb/09_hisab_ashl_aul_radd.md?raw';
import bab10 from '../../../docs/kb/10_tashih.md?raw';
import bab11 from '../../../docs/kb/11_qismah_dan_takharuj.md?raw';
import bab12 from '../../../docs/kb/12_munasakhat.md?raw';
import bab13 from '../../../docs/kb/13_kasus_khusus.md?raw';
import bab14 from '../../../docs/kb/14_dzawil_arham.md?raw';
import bab16 from '../../../docs/kb/16_kasus_uji.md?raw';
import bab17 from '../../../docs/kb/17_daftar_rujukan.md?raw';

/** Kode jenis dalil KB (bab 00 konvensi 3). */
export type RefType = 'Q' | 'H' | 'A' | 'IJ' | 'RDH' | 'KH';

export interface ParsedRef {
  kode: string;
  bab: number;
  claim: string;
  /** Isi kolom Jenis apa adanya, mis. "Q + RDH", "H (dha'if)", "—". */
  jenis: string;
  types: RefType[];
  source: string;
  kutipan: string;
  /** Teks dalam «…» dari kolom Kutipan — teks Arab dari KB, bukan dari luar. */
  arab: string[];
}

export interface RefEntry extends ParsedRef {
  /** 'needsVerification' bila tercantum di tabel bab 17.4. */
  status: 'verified' | 'needsVerification';
  dhaif: boolean;
}

const REF_TYPES: RefType[] = ['Q', 'H', 'A', 'IJ', 'RDH', 'KH'];
const sel = (line: string) => line.split('|').slice(1, -1).map(cell => cell.trim());

/** Baris tabel di bagian "## Dasar dan Rujukan" sebuah bab (sampai heading `##` berikutnya). */
export function parseRefs(markdown: string, bab: number): ParsedRef[] {
  const refs: ParsedRef[] = [];
  let inSection = false;
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) inSection = line.startsWith('## Dasar dan Rujukan');
    if (!inSection || !/^\| R\d{2}-\d+ /.test(line)) continue;
    const [kode = '', claim = '', jenis = '', source = '', kutipan = ''] = sel(line);
    const types = jenis.split('+').map(t => t.trim().split(/[\s(]/)[0] as RefType).filter(t => REF_TYPES.includes(t));
    const arab = [...kutipan.matchAll(/«([^»]*)»/g)].map(m => m[1]!);
    refs.push({ kode, bab, claim, jenis, types, source, kutipan, arab });
  }
  return refs;
}

/** Kode di tabel bab 17.4 ("Titik yang Masih Ditandai [perlu verifikasi lanjut]"). */
export function parseNeedsVerification(markdown: string): string[] {
  let inSection = false;
  const codes: string[] = [];
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) inSection = line.startsWith('## 17.4');
    if (inSection && /^\| R\d{2}-\d+ /.test(line)) codes.push(sel(line)[0]!);
  }
  return codes;
}

const CHAPTERS: Array<[number, string]> = [
  [1, bab01], [2, bab02], [3, bab03], [4, bab04], [5, bab05], [6, bab06], [7, bab07], [8, bab08],
  [9, bab09], [10, bab10], [11, bab11], [12, bab12], [13, bab13], [14, bab14], [16, bab16],
];
const needsVerification = new Set(parseNeedsVerification(bab17));

export const REFS: RefEntry[] = CHAPTERS.flatMap(([bab, md]) => parseRefs(md, bab)).map(ref => ({
  ...ref,
  status: needsVerification.has(ref.kode) ? 'needsVerification' : 'verified',
  dhaif: ref.jenis.includes("dha'if"),
}));

const byCode = new Map(REFS.map(ref => [ref.kode, ref]));
export const findRef = (kode: string): RefEntry | undefined => byCode.get(kode);

// ─── Teks ayat (KB bab 1.2) ───────────────────────────────────────────────────

export interface Ayat { surah: string; ayat: number; text: string }

/** Blok ayat bab 1.2: baris `**Surah: N** ...` diikuti kutipan `> teks`. */
export function parseAyat(markdown: string): Ayat[] {
  const lines = markdown.split('\n');
  return lines.flatMap((line, i) => {
    const heading = /^\*\*([A-Z][\w'-]*): (\d+)\*\*/.exec(line);
    const next = lines[i + 1];
    return heading && next?.startsWith('> ') ? [{ surah: heading[1]!, ayat: Number(heading[2]), text: next.slice(2).trim() }] : [];
  });
}

export const AYAT: Ayat[] = parseAyat(bab01);

/** Bagian Al-Qur'an di kolom Sumber (sebelum "·"): "An-Nisa' 11, 12, 176", "Al-Anfal 75; Al-Ahzab 6". */
export function ayatRefs(source: string): Array<{ surah: string; ayat: number }> {
  return source.split('·')[0]!.split(';').flatMap(porsi => {
    const match = /^\s*([A-Z][A-Za-z'-]+)\s+([\d,\s]+?)\s*$/.exec(porsi);
    return match ? match[2]!.split(',').map(n => ({ surah: match[1]!, ayat: Number(n.trim()) })) : [];
  });
}

const surahKey = (surah: string) => surah.replace(/['’]/g, '').toLowerCase();
const findAyat = (surah: string, ayat: number) => AYAT.find(a => surahKey(a.surah) === surahKey(surah) && a.ayat === ayat);

// ─── Lapis 3: dalil per baris penjelasan ──────────────────────────────────────

const TYPE_LABEL: Record<RefType, string> = {
  Q: "Al-Qur'an", H: 'Hadits', A: 'Atsar sahabat', IJ: "Ijma'", RDH: 'Raudhah ath-Thalibin (an-Nawawi)', KH: 'Kaidah hisab',
};

export interface DalilView {
  kode: string;
  claim: string;
  labels: string[];
  source: string;
  arab: string[];
  /** Untuk dalil Al-Qur'an: teks ayat dari KB bab 1.2; `text` kosong bila belum ada di KB. */
  ayat: Array<{ label: string; text?: string }>;
  kutipan: string;
  warnings: string[];
}

/**
 * Engine-contract lapis 3: `KH` dilabeli kaidah hisab, `needsVerification` diberi peringatan,
 * baris tanpa rujukan KB ditandai.
 */
export function dalilFor(codes: string[]): { entries: DalilView[]; notes: string[] } {
  if (codes.length === 0) return { entries: [], notes: ['Langkah ini belum punya rujukan di KB.'] };
  const entries: DalilView[] = [];
  const notes: string[] = [];
  for (const kode of codes) {
    const ref = findRef(kode);
    if (!ref) {
      notes.push(`Rujukan ${kode} belum tersedia di KB.`);
      continue;
    }
    const warnings: string[] = [];
    if (ref.types.length === 1 && ref.types[0] === 'KH') warnings.push("Kaidah hisab (cara menghitung), bukan dalil syar'i.");
    if (ref.types.length === 0) warnings.push('Keterangan tambahan, bukan dalil.');
    if (ref.status === 'needsVerification') warnings.push('Dasar ini belum dicek ke teks aslinya (bab 17.4).');
    if (ref.dhaif) warnings.push("Sanad hadits ini dha'if (lemah).");
    const ayat = ref.types.includes('Q')
      ? ayatRefs(ref.source).map(({ surah, ayat: n }) => {
        const found = findAyat(surah, n);
        return { label: `${surah} ${n}`, ...(found ? { text: found.text } : {}) };
      })
      : [];
    const tanpaTeks = ayat.filter(a => a.text === undefined).map(a => a.label);
    if (tanpaTeks.length > 0) warnings.push(`Teks ayat ${tanpaTeks.join(', ')} belum ada di KB.`);
    entries.push({
      kode, claim: ref.claim, labels: ref.types.map(t => TYPE_LABEL[t]), source: ref.source,
      arab: ref.arab, ayat, kutipan: ref.kutipan, warnings,
    });
  }
  return { entries, notes };
}
