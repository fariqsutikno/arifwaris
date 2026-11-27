// Kode soal keluarga lanjutan (spec bank soal §3, G3): munasakhat, gharqa, mafqud, khuntsa, haml, dzawil arham.
// Menerima struktur kasus (KasusLanjutan); menyerahkan `G1-<huruf>-<muatan>` dan sebaliknya, tanpa basis data.
// Kasus berantai (munasakhat, gharqa) = kasus biasa mayit pertama + 1-3 mayit yang masing-masing salah satu
// ahli waris mayit pertama (rujukan = kunci + urutan dalam kunci) dengan ahli waris tambahan sendiri.
// Kasus taqdir = kasus biasa + satu ahli waris yang belum pasti. Dzawil arham = pewaris + pasangan + kerabat jauh.
// Hanya menyusun struktur dan bit; apakah graf-nya bisa dibangun diputuskan bangunKasus.ts.

import type { KeadaanGharqa, KunciAhliWaris } from '@waris/engine';
import { BIT_PER_JUMLAH, periksaKasusBiasa, POLA_KODE_GENERATOR, URUTAN_KUNCI, VERSI_GENERATOR, type KasusBiasa, type KodeGalatSoal } from './kodeBiasa.js';
import { bacaBit, tulisBit } from './bitMuatan.js';

export type Rujukan = { kunci: KunciAhliWaris; urutan: number };
export type AhliWarisTambahan = { pasangan: 0 | 1; anakLk: number; anakPr: number };
export type MayitBerantai = Rujukan & { tambahan: AhliWarisTambahan };

export const HURUF_KELUARGA = { munasakhat: 'M', gharqa: 'G', mafqud: 'Q', khuntsa: 'K', haml: 'H', dzawilArham: 'D' } as const;
export type NamaKeluargaLanjutan = keyof typeof HURUF_KELUARGA;
export const DAFTAR_KELUARGA_LANJUTAN = Object.keys(HURUF_KELUARGA) as NamaKeluargaLanjutan[];

/** Mayit tambahan di luar mayit pertama: munasakhat 1-3 (total 2-4 mayit, spec §2.1); gharqa 1-2 (total 2-3). */
export const MAKS_MAYIT_TAMBAHAN = { munasakhat: 3, gharqa: 2 } as const;
/** Anak tambahan per jenis kelamin per mayit; 2 bit di kode. */
export const MAKS_ANAK_TAMBAHAN = 3;

/**
 * Kerabat jauh keluarga dzawilArham. Urutan = tata letak bit kode `G1-D` (hanya boleh ditambah di akhir).
 * Nama = jalur dari pewaris; cara membangunnya di bangunKasus.ts memakai pembangun graf yang sama dengan checklist.
 */
export const URUTAN_KERABAT_JAUH = [
  'CUCU_LK_ANAK_PR', 'CUCU_PR_ANAK_PR',
  'ANAK_LK_SAUDARI_KANDUNG', 'ANAK_PR_SAUDARI_KANDUNG', 'ANAK_LK_SAUDARI_SEBAPAK', 'ANAK_PR_SAUDARI_SEBAPAK',
  'ANAK_LK_SAUDARI_SEIBU', 'ANAK_PR_SAUDARI_SEIBU',
  'ANAK_PR_SAUDARA_KANDUNG', 'ANAK_PR_SAUDARA_SEBAPAK', 'ANAK_LK_SAUDARA_SEIBU', 'ANAK_PR_SAUDARA_SEIBU',
  'KHAL', 'KHALAH', 'AMMAH', 'PAMAN_SEIBU', 'JADD_RAHIM', 'ANAK_PR_PAMAN_KANDUNG',
] as const;
export type KerabatJauh = typeof URUTAN_KERABAT_JAUH[number];
/** Jumlah per jenis kerabat jauh: 0-2 (2 bit di kode, nilai 3 tidak dipakai). */
export const MAKS_KERABAT_PER_JENIS = 2;

export type KasusLanjutan =
  | { keluarga: 'munasakhat'; dasar: KasusBiasa; mayit: MayitBerantai[] }
  | { keluarga: 'gharqa'; dasar: KasusBiasa; mayit: MayitBerantai[]; keadaan: KeadaanGharqa }
  | { keluarga: 'mafqud' | 'khuntsa' | 'haml'; dasar: KasusBiasa; sasaran: Rujukan }
  | { keluarga: 'dzawilArham'; pewaris: 'L' | 'P'; pasangan: 0 | 1; kerabat: number[] };

export type KasusBank = KasusBiasa | KasusLanjutan;
export const adalahLanjutan = (kasus: KasusBank): kasus is KasusLanjutan => 'keluarga' in kasus;

const URUTAN_KEADAAN: KeadaanGharqa[] = ['serentak', 'terlupakan', 'berurutanTakDiketahui', 'tidakDiketahui'];

// ─── Tata letak bit ───────────────────────────────────────────────────────────

const LEBAR_DASAR = [1, ...URUTAN_KUNCI.map(() => BIT_PER_JUMLAH)];
const LEBAR_RUJUKAN = [5, 3];
const LEBAR_MAYIT = [...LEBAR_RUJUKAN, 1, 2, 2];
const LEBAR_BERANTAI = { munasakhat: [...LEBAR_DASAR, 2, ...Array(MAKS_MAYIT_TAMBAHAN.munasakhat).fill(LEBAR_MAYIT).flat()],
  gharqa: [...LEBAR_DASAR, 2, 2, ...Array(MAKS_MAYIT_TAMBAHAN.gharqa).fill(LEBAR_MAYIT).flat()] } as const;
const LEBAR_TAQDIR = [...LEBAR_DASAR, ...LEBAR_RUJUKAN];
const LEBAR_ARHAM = [1, 1, ...URUTAN_KERABAT_JAUH.map(() => 2)];

const nilaiDasar = (dasar: KasusBiasa) => [dasar.pewaris === 'P' ? 1 : 0, ...URUTAN_KUNCI.map(kunci => dasar.ahliWaris[kunci] ?? 0)];
const dasarDariNilai = (nilai: number[]): KasusBiasa => ({
  pewaris: nilai[0] === 1 ? 'P' : 'L',
  ahliWaris: Object.fromEntries(URUTAN_KUNCI.flatMap((kunci, urutan) => (nilai[urutan + 1]! > 0 ? [[kunci, nilai[urutan + 1]!]] : []))),
});
const nilaiRujukan = (rujukan: Rujukan) => [URUTAN_KUNCI.indexOf(rujukan.kunci), rujukan.urutan];
const nilaiMayit = (mayit: MayitBerantai) => [...nilaiRujukan(mayit), mayit.tambahan.pasangan, mayit.tambahan.anakLk, mayit.tambahan.anakPr];
const rujukanDari = ([kunci, urutan]: number[]): Rujukan => ({ kunci: URUTAN_KUNCI[kunci!]!, urutan: urutan! });
const mayitDari = (nilai: number[]): MayitBerantai =>
  ({ ...rujukanDari(nilai), tambahan: { pasangan: nilai[2] as 0 | 1, anakLk: nilai[3]!, anakPr: nilai[4]! } });
const NILAI_MAYIT_KOSONG = [0, 0, 0, 0, 0];

function nilaiMuatan(kasus: KasusLanjutan): { nilai: number[]; lebar: readonly number[] } {
  switch (kasus.keluarga) {
    case 'munasakhat': case 'gharqa': {
      const maks = MAKS_MAYIT_TAMBAHAN[kasus.keluarga];
      const slot = Array.from({ length: maks }, (_, urutan) => (kasus.mayit[urutan] ? nilaiMayit(kasus.mayit[urutan]!) : NILAI_MAYIT_KOSONG)).flat();
      const awal = kasus.keluarga === 'gharqa' ? [URUTAN_KEADAAN.indexOf(kasus.keadaan), kasus.mayit.length] : [kasus.mayit.length];
      return { nilai: [...nilaiDasar(kasus.dasar), ...awal, ...slot], lebar: LEBAR_BERANTAI[kasus.keluarga] };
    }
    case 'dzawilArham': return { nilai: [kasus.pewaris === 'P' ? 1 : 0, kasus.pasangan, ...kasus.kerabat], lebar: LEBAR_ARHAM };
    default: return { nilai: [...nilaiDasar(kasus.dasar), ...nilaiRujukan(kasus.sasaran)], lebar: LEBAR_TAQDIR };
  }
}

function kasusDariMuatan(keluarga: NamaKeluargaLanjutan, muatan: string): KasusLanjutan | null {
  if (keluarga === 'dzawilArham') {
    const nilai = bacaBit(muatan, LEBAR_ARHAM);
    return nilai && { keluarga, pewaris: nilai[0] === 1 ? 'P' : 'L', pasangan: nilai[1] as 0 | 1, kerabat: nilai.slice(2) };
  }
  if (keluarga === 'munasakhat' || keluarga === 'gharqa') {
    const nilai = bacaBit(muatan, LEBAR_BERANTAI[keluarga]);
    if (!nilai) return null;
    const dasar = dasarDariNilai(nilai.slice(0, LEBAR_DASAR.length));
    const sisa = nilai.slice(LEBAR_DASAR.length);
    const keadaan = keluarga === 'gharqa' ? URUTAN_KEADAAN[sisa.shift()!] : undefined;
    const jumlah = sisa.shift()!;
    const mayit = Array.from({ length: jumlah }, (_, urutan) => mayitDari(sisa.slice(urutan * LEBAR_MAYIT.length, (urutan + 1) * LEBAR_MAYIT.length)));
    if (keluarga === 'gharqa') return keadaan ? { keluarga, dasar, mayit, keadaan } : null;
    return { keluarga, dasar, mayit };
  }
  const nilai = bacaBit(muatan, LEBAR_TAQDIR);
  return nilai && { keluarga, dasar: dasarDariNilai(nilai.slice(0, LEBAR_DASAR.length)), sasaran: rujukanDari(nilai.slice(LEBAR_DASAR.length)) };
}

// ─── Pemeriksaan dan kode ─────────────────────────────────────────────────────

function periksaRujukan(dasar: KasusBiasa, rujukan: Rujukan): boolean {
  const jumlah = dasar.ahliWaris[rujukan.kunci] ?? 0;
  return Number.isInteger(rujukan.urutan) && rujukan.urutan >= 0 && rujukan.urutan < jumlah;
}

const tambahanSah = (tambahan: AhliWarisTambahan) =>
  (tambahan.pasangan === 0 || tambahan.pasangan === 1)
  && [tambahan.anakLk, tambahan.anakPr].every(anak => Number.isInteger(anak) && anak >= 0 && anak <= MAKS_ANAK_TAMBAHAN);

/** Pemeriksaan struktur saja; bisa tidaknya graf dibangun (mis. istri tak boleh menikah lagi) urusan bangunKasus. */
export function periksaKasusLanjutan(kasus: KasusLanjutan): KodeGalatSoal | null {
  if (kasus.keluarga === 'dzawilArham') {
    const sah = kasus.kerabat.length === URUTAN_KERABAT_JAUH.length
      && kasus.kerabat.every(jumlah => Number.isInteger(jumlah) && jumlah >= 0 && jumlah <= MAKS_KERABAT_PER_JENIS)
      && (kasus.pasangan === 0 || kasus.pasangan === 1) && kasus.kerabat.some(jumlah => jumlah > 0);
    return sah ? null : 'KASUS_TIDAK_SAH';
  }
  if (periksaKasusBiasa(kasus.dasar)) return 'KASUS_TIDAK_SAH';
  if (kasus.keluarga !== 'munasakhat' && kasus.keluarga !== 'gharqa') return periksaRujukan(kasus.dasar, kasus.sasaran) ? null : 'KASUS_TIDAK_SAH';
  const dipakai = new Set<string>();
  const jumlahSah = kasus.mayit.length >= 1 && kasus.mayit.length <= MAKS_MAYIT_TAMBAHAN[kasus.keluarga];
  const mayitSah = kasus.mayit.every(mayit => {
    const kunciOrang = `${mayit.kunci}#${mayit.urutan}`;
    if (dipakai.has(kunciOrang)) return false;
    dipakai.add(kunciOrang);
    return periksaRujukan(kasus.dasar, mayit) && tambahanSah(mayit.tambahan);
  });
  return jumlahSah && mayitSah ? null : 'KASUS_TIDAK_SAH';
}

export function buatKodeLanjutan(kasus: KasusLanjutan): string {
  if (periksaKasusLanjutan(kasus)) throw new Error('kasus tidak sah untuk kode soal');
  const { nilai, lebar } = nilaiMuatan(kasus);
  return `G${VERSI_GENERATOR}-${HURUF_KELUARGA[kasus.keluarga]}-${tulisBit(nilai, lebar)}`;
}

export type HasilUraiLanjutan = { ok: true; kasus: KasusLanjutan } | { ok: false; galat: KodeGalatSoal };

export function uraiKodeLanjutan(kode: string): HasilUraiLanjutan {
  const cocok = POLA_KODE_GENERATOR.exec(kode);
  if (!cocok) return { ok: false, galat: 'BUKAN_KODE_GENERATOR' };
  const [, versi, huruf, muatan] = cocok;
  if (Number(versi) !== VERSI_GENERATOR) return { ok: false, galat: 'VERSI_TIDAK_DIKENAL' };
  const keluarga = DAFTAR_KELUARGA_LANJUTAN.find(nama => HURUF_KELUARGA[nama] === huruf);
  if (!keluarga) return { ok: false, galat: 'KELUARGA_TIDAK_DIKENAL' };
  const kasus = kasusDariMuatan(keluarga, muatan!);
  if (!kasus) return { ok: false, galat: 'MUATAN_RUSAK' };
  if (periksaKasusLanjutan(kasus)) return { ok: false, galat: 'KASUS_TIDAK_SAH' };
  // Slot mayit yang tak terpakai wajib nol: satu kasus tepat satu kode.
  const { nilai, lebar } = nilaiMuatan(kasus);
  return tulisBit(nilai, lebar) === muatan ? { ok: true, kasus } : { ok: false, galat: 'MUATAN_RUSAK' };
}
