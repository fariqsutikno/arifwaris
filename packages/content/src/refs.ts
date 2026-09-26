/// <reference path="./raw.d.ts" />
// Rujukan fikih diambil langsung dari tabel "Dasar dan Rujukan" tiap bab KB (tidak disalin manual):
//   1. bacaRujukan         → baris R01-1, R04-2, ... dari markdown tiap bab
//   2. bacaPerluVerifikasi → kode yang masih ditandai di bab 17.4
//   3. bacaAyat            → teks ayat dari bab 1.2
//   4. dalilUntuk          → gabungan ketiganya untuk ditampilkan di bawah tiap baris penjelasan
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
export type JenisDalil = 'Q' | 'H' | 'A' | 'IJ' | 'RDH' | 'KH';

export interface RujukanTerbaca {
  kode: string;
  bab: number;
  klaim: string;
  /** Isi kolom Jenis apa adanya, mis. "Q + RDH", "H (dha'if)", "—". */
  jenis: string;
  daftarJenis: JenisDalil[];
  sumber: string;
  kutipan: string;
  /** Teks dalam «…» dari kolom Kutipan — teks Arab dari KB, bukan dari luar. */
  arab: string[];
}

export interface EntriRujukan extends RujukanTerbaca {
  /** 'perluVerifikasi' bila tercantum di tabel bab 17.4. */
  status: 'terverifikasi' | 'perluVerifikasi';
  dhaif: boolean;
}

const JENIS_DALIL: JenisDalil[] = ['Q', 'H', 'A', 'IJ', 'RDH', 'KH'];
const sel = (baris: string) => baris.split('|').slice(1, -1).map(isi => isi.trim());

/** Baris tabel di bagian "## Dasar dan Rujukan" sebuah bab (sampai judul `##` berikutnya). */
export function bacaRujukan(teksMarkdown: string, bab: number): RujukanTerbaca[] {
  const refs: RujukanTerbaca[] = [];
  let diDalamBagian = false;
  for (const baris of teksMarkdown.split('\n')) {
    if (baris.startsWith('## ')) diDalamBagian = baris.startsWith('## Dasar dan Rujukan');
    if (!diDalamBagian || !/^\| R\d{2}-\d+ /.test(baris)) continue;
    const [kode = '', klaim = '', jenis = '', sumberTertulis = '', kutipan = ''] = sel(baris);
    // "Idem" / "Idem, far'" di KB = sumber sama dengan baris di atasnya.
    const sumber = sumberTertulis.startsWith('Idem') && refs.length > 0
      ? refs[refs.length - 1]!.sumber + sumberTertulis.slice('Idem'.length) : sumberTertulis;
    const daftarJenis = jenis.split('+').map(kodeJenis => kodeJenis.trim().split(/[\s(]/)[0] as JenisDalil).filter(kodeJenis => JENIS_DALIL.includes(kodeJenis));
    const arab = [...kutipan.matchAll(/«([^»]*)»/g)].map(hasilCocok => hasilCocok[1]!);
    refs.push({ kode, bab, klaim, jenis, daftarJenis, sumber, kutipan, arab });
  }
  return refs;
}

/** Sel tiap baris tabel di bagian `## <awalanJudul>…` sampai judul `##` berikutnya, tanpa baris kepala & pemisah. */
export function barisTabelBagian(teksMarkdown: string, awalanJudul: string): string[][] {
  let diDalamBagian = false;
  const daftarBaris: string[][] = [];
  let sudahLewatKepala = false;
  for (const baris of teksMarkdown.split('\n')) {
    if (baris.startsWith('## ')) { diDalamBagian = baris.startsWith(`## ${awalanJudul}`); sudahLewatKepala = false; }
    if (!diDalamBagian || !baris.startsWith('|')) continue;
    if (/^\|[\s|:-]+\|$/.test(baris)) { sudahLewatKepala = true; continue; }
    if (sudahLewatKepala) daftarBaris.push(sel(baris));
  }
  return daftarBaris;
}

/** Kode di tabel bab 17.4 ("Titik yang Masih Ditandai [perlu verifikasi lanjut]"). */
export const bacaPerluVerifikasi = (teksMarkdown: string): string[] =>
  barisTabelBagian(teksMarkdown, '17.4').map(([kode = '']) => kode).filter(kode => /^R\d{2}-\d+$/.test(kode));

const DAFTAR_BAB: Array<[number, string]> = [
  [1, bab01], [2, bab02], [3, bab03], [4, bab04], [5, bab05], [6, bab06], [7, bab07], [8, bab08],
  [9, bab09], [10, bab10], [11, bab11], [12, bab12], [13, bab13], [14, bab14], [16, bab16],
];
const perluVerifikasi = new Set(bacaPerluVerifikasi(bab17));

/** Judul bab dari frontmatter `judul:` tiap berkas KB. */
export const JUDUL_BAB: Record<number, string> = Object.fromEntries(
  DAFTAR_BAB.map(([bab, teksBab]) => [bab, /^judul: (.+)$/m.exec(teksBab)?.[1] ?? `Bab ${bab}`]),
);

// ─── Daftar pustaka (KB bab 17) ───────────────────────────────────────────────

export interface Kitab { kode: string; judul: string; penulis: string; keterangan: string }
export interface Hadits { hadits: string; takhrij: string; status: string }
export interface TitikDikaji { kode: string; topik: string; yangDibutuhkan: string }

const tanpaMiring = (teks: string) => teks.replace(/^\*(.*)\*$/, '$1');
export const DAFTAR_KITAB: Kitab[] = barisTabelBagian(bab17, '17.2')
  .map(([kode = '', judul = '', penulis = '', keterangan = '']) => ({ kode, judul: tanpaMiring(judul), penulis, keterangan }));
export const DAFTAR_HADITS: Hadits[] = barisTabelBagian(bab17, '17.3')
  .map(([hadits = '', takhrij = '', status = '']) => ({ hadits, takhrij, status }));
export const TITIK_DIKAJI: TitikDikaji[] = barisTabelBagian(bab17, '17.4')
  .map(([kode = '', topik = '', yangDibutuhkan = '']) => ({ kode, topik, yangDibutuhkan }));

export const RUJUKAN: EntriRujukan[] = DAFTAR_BAB.flatMap(([bab, teksBab]) => bacaRujukan(teksBab, bab)).map(rujukan => ({
  ...rujukan,
  status: perluVerifikasi.has(rujukan.kode) ? 'perluVerifikasi' : 'terverifikasi',
  dhaif: rujukan.jenis.includes("dha'if"),
}));

const menurutKode = new Map(RUJUKAN.map(rujukan => [rujukan.kode, rujukan]));
export const cariRujukan = (kode: string): EntriRujukan | undefined => menurutKode.get(kode);

// ─── Teks ayat (KB bab 1.2) ───────────────────────────────────────────────────

export interface Ayat { surah: string; ayat: number; teks: string }

/** Blok ayat bab 1.2: baris `**Surah: N** ...` diikuti kutipan `> teks`. */
export function bacaAyat(teksMarkdown: string): Ayat[] {
  const daftarBaris = teksMarkdown.split('\n');
  return daftarBaris.flatMap((baris, indeks) => {
    const judul = /^\*\*([A-Z][\w'-]*): (\d+)\*\*/.exec(baris);
    const barisBerikutnya = daftarBaris[indeks + 1];
    return judul && barisBerikutnya?.startsWith('> ') ? [{ surah: judul[1]!, ayat: Number(judul[2]), teks: barisBerikutnya.slice(2).trim() }] : [];
  });
}

export const DAFTAR_AYAT: Ayat[] = bacaAyat(bab01);

/** Bagian Al-Qur'an di kolom Sumber (sebelum "·"): "An-Nisa' 11, 12, 176", "Al-Anfal 75; Al-Ahzab 6". */
export function rujukanAyat(sumber: string): Array<{ surah: string; ayat: number }> {
  return sumber.split('·')[0]!.split(';').flatMap(porsi => {
    const cocok = /^\s*([A-Z][A-Za-z'-]+)\s+([\d,\s]+?)\s*$/.exec(porsi);
    return cocok ? cocok[2]!.split(',').map(nomor => ({ surah: cocok[1]!, ayat: Number(nomor.trim()) })) : [];
  });
}

const kunciSurah = (surah: string) => surah.replace(/['’]/g, '').toLowerCase();
const cariAyat = (surah: string, ayat: number) => DAFTAR_AYAT.find(ayatIni => kunciSurah(ayatIni.surah) === kunciSurah(surah) && ayatIni.ayat === ayat);

// ─── Lapis 3: dalil per baris penjelasan ──────────────────────────────────────

const LABEL_JENIS: Record<JenisDalil, string> = {
  Q: "Al-Qur'an", H: 'Hadits', A: 'Atsar sahabat', IJ: "Ijma'", RDH: 'Raudhah ath-Thalibin (an-Nawawi)', KH: 'Kaidah hisab',
};

export interface TampilanDalil {
  kode: string;
  klaim: string;
  label: string[];
  sumber: string;
  arab: string[];
  /** Untuk dalil Al-Qur'an: teks ayat dari KB bab 1.2; `teks` kosong bila belum ada di KB. */
  ayat: Array<{ label: string; teks?: string }>;
  kutipan: string;
  peringatan: string[];
}

/**
 * Engine-contract lapis 3: `KH` dilabeli kaidah hisab, `perluVerifikasi` diberi peringatan,
 * baris tanpa rujukan KB ditandai.
 */
export function dalilUntuk(daftarKode: string[]): { daftarEntri: TampilanDalil[]; catatan: string[] } {
  if (daftarKode.length === 0) return { daftarEntri: [], catatan: ['Langkah ini belum punya rujukan di KB.'] };
  const daftarEntri: TampilanDalil[] = [];
  const catatan: string[] = [];
  for (const kode of daftarKode) {
    const rujukan = cariRujukan(kode);
    if (!rujukan) {
      catatan.push(`Rujukan ${kode} belum tersedia di KB.`);
      continue;
    }
    const peringatan: string[] = [];
    if (rujukan.daftarJenis.length === 1 && rujukan.daftarJenis[0] === 'KH') peringatan.push("Kaidah hisab (cara menghitung), bukan dalil syar'i.");
    if (rujukan.daftarJenis.length === 0) peringatan.push('Keterangan tambahan, bukan dalil.');
    if (rujukan.status === 'perluVerifikasi') peringatan.push('Dasar ini belum dicek ke teks aslinya (bab 17.4).');
    if (rujukan.dhaif) peringatan.push("Sanad hadits ini dha'if (lemah).");
    const ayat = rujukan.daftarJenis.includes('Q')
      ? rujukanAyat(rujukan.sumber).map(({ surah, ayat: nomor }) => {
        const ketemu = cariAyat(surah, nomor);
        return { label: `${surah} ${nomor}`, ...(ketemu ? { teks: ketemu.teks } : {}) };
      })
      : [];
    const tanpaTeks = ayat.filter(ayatIni => ayatIni.teks === undefined).map(ayatIni => ayatIni.label);
    if (tanpaTeks.length > 0) peringatan.push(`Teks ayat ${tanpaTeks.join(', ')} belum ada di KB.`);
    daftarEntri.push({
      kode, klaim: rujukan.klaim, label: rujukan.daftarJenis.map(kodeJenis => LABEL_JENIS[kodeJenis]), sumber: rujukan.sumber,
      arab: rujukan.arab, ayat, kutipan: rujukan.kutipan, peringatan,
    });
  }
  return { daftarEntri, catatan };
}

/** Isi tabel `daftar_refs` (supabase/seed.sql) dari kode rujukan KB; urut & tanpa duplikat supaya diff seed stabil. */
export function sqlDaftarRefs(daftar: { kode: string; bab: number }[]): string {
  const unik = [...new Map(daftar.map(rujukan => [rujukan.kode, rujukan.bab])).entries()]
    .sort(([kodeA], [kodeB]) => kodeA.localeCompare(kodeB, 'en', { numeric: true }));
  const baris = unik.map(([kode, bab]) => `  ('${kode}', ${bab})`).join(',\n');
  return `insert into daftar_refs (kode, bab) values\n${baris}\non conflict (kode) do update set bab = excluded.bab;\n`;
}
