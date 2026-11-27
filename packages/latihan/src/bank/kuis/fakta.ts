// Fakta satu kasus bank biasa yang dibaca dari hasil engine (data, bukan kalimat): baris tabel, penyebut tiap tahap,
// siapa yang gugur dan oleh siapa. Dari sini lahir pertanyaan, jawaban benar, dan bahan aturan pengecoh.
// Menerima KasusBiasa + HasilOk; menyerahkan FaktaKasus (atau null bila kasus tak cocok jadi soal kuis angka).

import type { AlasanFardh, KunciAhliWaris, LangkahJejak } from '@waris/engine';
import { pecahan, type Pecahan } from '@waris/math';
import type { HasilOk } from '../../jalankan.js';
import { URUTAN_KUNCI, type KasusBiasa } from '../kodeBiasa.js';
import type { PertanyaanKuis } from './kodeKuis.js';

export type BarisFakta = {
  id: string;
  kunci: KunciAhliWaris[];
  /** Banyak orang tiap kunci di baris ini. */
  orang: Partial<Record<KunciAhliWaris, number>>;
  /** Saham akhir (kolom terakhir) per kunci, dan saham baris di kolom ashl. */
  sahamAkhir: Partial<Record<KunciAhliWaris, bigint>>;
  sahamAshl: bigint;
  fardh: Pecahan | undefined;
  alasanFardh: AlasanFardh['kode'] | undefined;
  ashabah: 'binNafsi' | 'bilGhair' | 'maalGhair' | undefined;
};

export type FaktaKasus = {
  kasus: KasusBiasa;
  baris: BarisFakta[];
  ashl: bigint;
  aul: bigint | undefined;
  radd: bigint | undefined;
  tashih: bigint | undefined;
  penyebutAkhir: bigint;
  /** Satu entri per kunci yang gugur (hajb hirman), dengan kunci penghalangnya. */
  mahjub: Array<{ kunci: KunciAhliWaris; hajib: KunciAhliWaris[] }>;
  idPerKunci: Partial<Record<KunciAhliWaris, string[]>>;
  /** Kakek bersama saudara dan kasus bernama: hisab ulang pengecoh tidak dibuat untuk ini. */
  istimewa: boolean;
};

export type Jawaban =
  | { tipe: 'pecahan'; nilai: Pecahan }
  | { tipe: 'penyebut'; nilai: bigint }
  | { tipe: 'kunci'; nilai: KunciAhliWaris[] };

export const kunciJawaban = (jawaban: Jawaban): string =>
  jawaban.tipe === 'pecahan' ? `${jawaban.nilai.n}/${jawaban.nilai.d}` : jawaban.tipe === 'penyebut' ? `${jawaban.nilai}` : `kunci:${jawaban.nilai.join('+')}`;

export const urutKunci = (daftar: Iterable<KunciAhliWaris>): KunciAhliWaris[] =>
  [...new Set(daftar)].sort((a, b) => URUTAN_KUNCI.indexOf(a as never) - URUTAN_KUNCI.indexOf(b as never));

const adalahKunci = (kunci: string | undefined): kunci is KunciAhliWaris => !!kunci && (URUTAN_KUNCI as readonly string[]).includes(kunci);

/** null bila ada sisa yang keluar dari ahli waris (baitul mal, dzawil arham) atau peran di luar kunci checklist. */
export function faktaDariHasil(kasus: KasusBiasa, hasil: HasilOk): FaktaKasus | null {
  if (hasil.sisaKeluar || hasil.tanzil) return null;
  const kunciDari: Record<string, KunciAhliWaris> = {};
  const idPerKunci: FaktaKasus['idPerKunci'] = {};
  for (const [id, status] of Object.entries(hasil.statusOrang)) {
    if (status.jenis === 'bukanAhliWaris') continue;
    if (!adalahKunci(status.peran.kunci)) return null;
    kunciDari[id] = status.peran.kunci;
    (idPerKunci[status.peran.kunci] ??= []).push(id);
  }
  const { totalKolom } = hasil.tabel;
  const ashl = totalKolom.ashl;
  if (ashl === undefined) return null;
  const penyebutAkhir = totalKolom.tashih ?? totalKolom.radd ?? totalKolom.aul ?? ashl;

  const alasanDari = (kelompok: string) => {
    const fardh = hasil.jejak.filter((langkah): langkah is Extract<LangkahJejak, { jenis: 'FARDH' }> => langkah.jenis === 'FARDH' && langkah.kelompok === kelompok);
    return fardh.length === 1 ? fardh[0]!.alasan.kode : undefined;
  };
  const baris: BarisFakta[] = hasil.tabel.baris.map(isi => {
    const orang: BarisFakta['orang'] = {};
    const sahamAkhir: BarisFakta['sahamAkhir'] = {};
    for (const [id, bagian] of Object.entries(isi.perOrang)) {
      const kunci = kunciDari[id]!;
      orang[kunci] = (orang[kunci] ?? 0) + 1;
      sahamAkhir[kunci] = (sahamAkhir[kunci] ?? 0n) + bagian.saham;
    }
    const jenisAshabah = hasil.jejak.find((langkah): langkah is Extract<LangkahJejak, { jenis: 'ASHABAH' }> => langkah.jenis === 'ASHABAH' && langkah.kelompok === isi.kelompok)?.jenisAshabah;
    return {
      id: isi.kelompok, kunci: urutKunci(Object.keys(orang) as KunciAhliWaris[]), orang, sahamAkhir, sahamAshl: isi.sel['ashl'] ?? 0n,
      fardh: isi.fardh, alasanFardh: alasanDari(isi.kelompok), ashabah: isi.ashabah ? jenisAshabah ?? 'binNafsi' : undefined,
    };
  });

  const mahjub = new Map<KunciAhliWaris, Set<KunciAhliWaris>>();
  for (const langkah of hasil.jejak) {
    if (langkah.jenis !== 'HAJB_HIRMAN') continue;
    const kunci = kunciDari[langkah.mahjub];
    const penghalang = mahjub.get(kunci!) ?? new Set<KunciAhliWaris>();
    for (const id of langkah.hajib) if (kunciDari[id]) penghalang.add(kunciDari[id]!);
    if (kunci) mahjub.set(kunci, penghalang);
  }
  const istimewa = hasil.jejak.some(langkah => langkah.jenis === 'KASUS_KHUSUS' || (langkah.jenis === 'ASHABAH' && !!langkah.pilihanJadd)
    || (langkah.jenis === 'FARDH' && /^(JADD|AKDARIYYAH|MUSYARRAKAH|UMARIYYATAIN)/.test(langkah.alasan.kode)));
  return {
    kasus, baris, ashl, aul: totalKolom.aul, radd: totalKolom.radd, tashih: totalKolom.tashih, penyebutAkhir, idPerKunci, istimewa,
    mahjub: [...mahjub].map(([kunci, penghalang]) => ({ kunci, hajib: urutKunci(penghalang) })),
  };
}

export const sahamKunci = (fakta: FaktaKasus, kunci: KunciAhliWaris): bigint =>
  fakta.baris.reduce((total, isi) => total + (isi.sahamAkhir[kunci] ?? 0n), 0n);

export const bagianKunci = (fakta: FaktaKasus, kunci: KunciAhliWaris): Pecahan => pecahan(sahamKunci(fakta, kunci), fakta.penyebutAkhir);

/** Kunci pada baris ashabah yang benar-benar mendapat saham. */
export const kunciAshabah = (fakta: FaktaKasus): KunciAhliWaris[] =>
  urutKunci(fakta.baris.filter(isi => isi.ashabah && Object.values(isi.sahamAkhir).some(saham => saham > 0n)).flatMap(isi => isi.kunci.filter(kunci => (isi.sahamAkhir[kunci] ?? 0n) > 0n)));

/** Pertanyaan yang sah untuk kasus ini: bagian tiap penerima, penyebut akhir, satu kelompok gugur, ashabah. */
export function daftarPertanyaan(fakta: FaktaKasus): PertanyaanKuis[] {
  const penerima = urutKunci(fakta.baris.flatMap(isi => isi.kunci)).filter(kunci => sahamKunci(fakta, kunci) > 0n);
  return [
    ...penerima.map((kunci): PertanyaanKuis => ({ jenis: 'bagian', kunci })),
    { jenis: 'ashlAkhir' },
    ...(fakta.mahjub.length === 1 ? [{ jenis: 'gugur' } as const] : []),
    ...(kunciAshabah(fakta).length > 0 ? [{ jenis: 'ashabah' } as const] : []),
  ];
}

export function jawabanBenar(fakta: FaktaKasus, tanya: PertanyaanKuis): Jawaban {
  switch (tanya.jenis) {
    case 'bagian': return { tipe: 'pecahan', nilai: bagianKunci(fakta, tanya.kunci) };
    case 'ashlAkhir': return { tipe: 'penyebut', nilai: fakta.penyebutAkhir };
    case 'gugur': return { tipe: 'kunci', nilai: [fakta.mahjub[0]!.kunci] };
    case 'ashabah': return { tipe: 'kunci', nilai: kunciAshabah(fakta) };
  }
}
