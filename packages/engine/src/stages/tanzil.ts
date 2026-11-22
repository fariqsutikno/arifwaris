// Tahap tanzil (bab 14.5, 14.7) — dzawil arham didudukkan pada posisi ahli waris perantaranya.
//   Masuk : graf + peran hasil derivasi + id seorang dzawil arham.
//   Putus : tiap lintasan orang itu ke pewaris dinaikkan derajat demi derajat sampai posisi ahli waris (perantara);
//           dalam satu shinf, yang lebih dulu sampai ke ahli waris menghijab yang lain (apa pun jihahnya) [R14-10].
//           Antar-shinf tidak ada sabq: semua lolos, hajb antar-perantara diputus di tahap mas'alah perantara.
//   Keluar: rute yang lolos → mas'alah perantara (stages/perantara.ts).

import type { TidakDidukung } from './model.js';
import type { GrafKeluarga, IdOrang, Jihah, KunciAhliWaris, LangkahJejak, PeranAhliWaris, Shinf } from '../types.js';

export interface RuteTanzil {
  idOrang: IdOrang;
  /** [pewaris, ..., idOrang] */
  lintasan: IdOrang[];
  perantara: IdOrang;
  kunciPerantara: KunciAhliWaris;
  /** Dasar sabq [HNB] dan kata kunci narasi jalur; [SYF] membandingkan per shinf [R14-10]. */
  jihah: Jihah;
  shinf: Shinf;
  /** Banyaknya derajat dari orang ini ke perantara. */
  langkah: number;
}

// Pasangan dan wala' bukan kekerabatan nasab, jadi tidak pernah menjadi perantara.
const BUKAN_PERANTARA = new Set<PeranAhliWaris['kunci']>(['DZAWIL_ARHAM', 'BUKAN_AHLI_WARIS', 'SUAMI', 'ISTRI', 'MUTIQ', 'MUTIQAH']);
// [R14-10] bunuwwah = lewat anak mayit; umumah = lewat ibu (termasuk anak ibu dan ibunya ibu); sisanya ubuwwah.
const JIHAH_BUNUWWAH = new Set<KunciAhliWaris>(['ANAK_LK', 'ANAK_PR', 'CUCU_LK', 'CUCU_PR']);
const JIHAH_UMUMAH = new Set<KunciAhliWaris>(['IBU', 'NENEK_DARI_IBU', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU']);

export function cariRuteTanzil(graf: GrafKeluarga, daftarPeran: Record<IdOrang, PeranAhliWaris>, idOrang: IdOrang): RuteTanzil[] | TidakDidukung {
  const { lintasan: semua, terlewat } = kumpulkanLintasan(graf, idOrang);
  // [R14-11] KB tidak mengatur kerabat yang sekaligus keturunan saudara leluhur pewaris (leluhur yang juga paman); jangan dibuang diam-diam.
  if (terlewat) return { status: 'TIDAK_DIDUKUNG', alasan: 'kekerabatan ganda lewat leluhur pewaris (pernikahan antarkerabat) belum didukung', refs: ['R14-11'] };
  const daftarRute = semua.flatMap(lintasan => {
    const rute = naikKePerantara(graf, daftarPeran, idOrang, lintasan);
    return rute ? [rute] : [];
  });
  // Tiap lintasan memuat orang tua/anak/saudara pewaris (semuanya ahli waris), jadi mustahil kosong.
  if (daftarRute.length === 0) throw new Error(`invariant: dzawil arham ${idOrang} tanpa perantara [R14-7]`);
  return daftarRute;
}

/** Satuan perbandingan sabq: [SYF] per shinf (Raudhah); [HNB] per jihah (Lahim hlm. 192–194), kerangka tiga jihah. */
export type DasarSabq = 'shinf' | 'jihah';

export const kelompokSabq = (rute: RuteTanzil, dasar: DasarSabq): string => rute[dasar];

/**
 * [R14-7] [R14-10] [SYF] Raudhah 6/46, 6/49, 6/51, 6/54: dalam satu shinf, rute dengan langkah paling sedikit
 * ("man sabaqa ila warits") menghijab yang lain, tanpa melihat jihah perantaranya. Lintas shinf tidak ada sabq.
 * [HNB] memakai jihah sebagai satuan yang sama (Lahim).
 */
export function saringJihah(daftarRute: RuteTanzil[], dasar: DasarSabq): { lolos: RuteTanzil[]; tersisih: RuteTanzil[]; jejak: LangkahJejak[] } {
  const terdekat = new Map<string, number>();
  for (const rute of daftarRute) {
    const kelompok = kelompokSabq(rute, dasar);
    terdekat.set(kelompok, Math.min(terdekat.get(kelompok) ?? Infinity, rute.langkah));
  }
  const lolos = daftarRute.filter(rute => rute.langkah === terdekat.get(kelompokSabq(rute, dasar)));
  const tersisih = daftarRute.filter(rute => rute.langkah !== terdekat.get(kelompokSabq(rute, dasar)));
  const penghijab = (rute: RuteTanzil) => [...new Set(lolos
    .filter(pemenang => kelompokSabq(pemenang, dasar) === kelompokSabq(rute, dasar) && pemenang.idOrang !== rute.idOrang).map(pemenang => pemenang.idOrang))];
  const jejak: LangkahJejak[] = [
    ...lolos.map((rute): LangkahJejak => ({ tahap: 'dzawilArham', refs: ['R14-7', 'R14-10'], jenis: 'DZAWIL_ARHAM_TANZIL',
      idOrang: rute.idOrang, perantara: rute.perantara, kunciPerantara: rute.kunciPerantara, jihah: rute.jihah, langkah: rute.langkah })),
    // [R14-11] jalur yang kalah hanya oleh jalur lain orang itu sendiri bukan terhijab: ia mewarisi dengan jalur terdekat.
    ...tersisih.flatMap((rute): LangkahJejak[] => {
      const oleh = penghijab(rute);
      return oleh.length === 0 ? [] : [{ tahap: 'dzawilArham', refs: ['R14-7', 'R14-10'], jenis: 'DZAWIL_ARHAM_TERHIJAB_JIHAH',
        idOrang: rute.idOrang, perantara: rute.perantara, oleh }];
    }),
  ];
  return { lolos, tersisih, jejak };
}

/**
 * Semua lintasan [pewaris, ..., idOrang] tanpa simpul berulang: keturunan, leluhur, dan hawasyi. Lintasan hawasyi
 * melompat dari Y (pewaris/leluhurnya) ke X (saudaranya), bukan lewat orang tua bersama — sehingga khal/khalah
 * langsung sampai ke ibu dan 'ammah ke ayah (pengecualian 14.5 langkah 1).
 */
export function semuaLintasan(graf: GrafKeluarga, idOrang: IdOrang): IdOrang[][] {
  return kumpulkanLintasan(graf, idOrang).lintasan;
}

/** `terlewat`: lintasan hawasyi tanpa simpul berulang yang sengaja tidak dipakai karena X-nya leluhur pewaris. */
function kumpulkanLintasan(graf: GrafKeluarga, idOrang: IdOrang): { lintasan: IdOrang[][]; terlewat: boolean } {
  const { idPewaris } = graf;
  const naikPewaris = lintasanKeAtas(graf, idPewaris);
  const naikOrang = lintasanKeAtas(graf, idOrang);
  const leluhurPewaris = new Set(naikPewaris.map(lintasan => lintasan.at(-1)!));
  const hasil = new Map<string, IdOrang[]>();
  const tanpaUlang = (lintasan: IdOrang[]) => new Set(lintasan).size === lintasan.length;
  const simpan = (lintasan: IdOrang[]) => {
    if (tanpaUlang(lintasan)) hasil.set(lintasan.join('>'), lintasan);
  };
  const dilewati = new Map<string, IdOrang[]>();

  for (const naik of naikOrang) if (naik.at(-1) === idPewaris) simpan([...naik].reverse());
  for (const naik of naikPewaris) if (naik.at(-1) === idOrang) simpan(naik);
  for (const naik of naikOrang) {
    if (naik.length < 2) continue;
    const idX = naik.at(-2)!;
    for (const jalurY of naikPewaris) {
      if (jalurY.length < 2 || jalurY.at(-1) !== naik.at(-1)) continue;
      const gabungan = [...jalurY.slice(0, -1), ...naik.slice(0, -1).reverse()];
      if (!leluhurPewaris.has(idX)) simpan(gabungan);
      else if (tanpaUlang(gabungan)) dilewati.set(gabungan.join('>'), gabungan);
    }
  }
  return { lintasan: [...hasil.values()], terlewat: [...dilewati.keys()].some(kunci => !hasil.has(kunci)) };
}

// ─── Bantuan ──────────────────────────────────────────────────────────────────

/** [R14-7] naik satu derajat demi satu derajat sampai bertemu ahli waris. */
function naikKePerantara(graf: GrafKeluarga, daftarPeran: Record<IdOrang, PeranAhliWaris>, idOrang: IdOrang, lintasan: IdOrang[]): RuteTanzil | undefined {
  for (let i = lintasan.length - 2; i >= 1; i--) {
    const kunci = daftarPeran[lintasan[i]!]?.kunci;
    if (kunci === undefined || BUKAN_PERANTARA.has(kunci)) continue;
    const kunciPerantara = kunci as KunciAhliWaris;
    return { idOrang, lintasan, perantara: lintasan[i]!, kunciPerantara, jihah: jihahDari(kunciPerantara), shinf: shinfDari(graf, lintasan), langkah: lintasan.length - 1 - i };
  }
  return undefined;
}

/**
 * [R14-10] Shinf menurut Raudhah 6/46–55, dibaca dari bentuk lintasan [pewaris, n1, ...]:
 * n1 anak pewaris → awlad al-banat; naik murni lewat orang tua → ajdad/jaddat saqithun;
 * n1 orang tua tapi lintasan melompat ke saudaranya → 'ammat/akhwal/khalat dan keturunannya (termasuk banat al-a'mam);
 * n1 saudara pewaris → bani al-ikhwah dan awlad al-akhawat (satu shinf walau jihahnya ubuwwah dan umumah).
 */
function shinfDari(graf: GrafKeluarga, lintasan: IdOrang[]): Shinf {
  const orangTuaDari = (id: IdOrang) => [graf.orang[id]?.idAyah, graf.orang[id]?.idIbu];
  const pewaris = lintasan[0]!;
  const pertama = lintasan[1]!;
  if (orangTuaDari(pertama).includes(pewaris)) return 'banat';
  if (lintasan.every((id, i) => i === 0 || orangTuaDari(lintasan[i - 1]!).includes(id))) return 'ajdad';
  return orangTuaDari(pewaris).includes(pertama) ? 'ammatKhalat' : 'baniIkhwah';
}

const jihahDari = (kunci: KunciAhliWaris): Jihah =>
  JIHAH_BUNUWWAH.has(kunci) ? 'bunuwwah' : JIHAH_UMUMAH.has(kunci) ? 'umumah' : 'ubuwwah';

/** Semua lintasan [idAwal, ..., leluhur] lewat idAyah/idIbu, termasuk [idAwal]. */
// ponytail: eksponensial pada pernikahan antarkerabat berlapis; cukup untuk graf keluarga, memoisasi bila perlu.
function lintasanKeAtas(graf: GrafKeluarga, idAwal: IdOrang): IdOrang[][] {
  const hasil: IdOrang[][] = [];
  const telusuri = (lintasan: IdOrang[]) => {
    hasil.push(lintasan);
    const orangIni = graf.orang[lintasan.at(-1)!];
    for (const idOrangTua of [orangIni?.idAyah, orangIni?.idIbu]) {
      if (idOrangTua !== undefined && graf.orang[idOrangTua] && !lintasan.includes(idOrangTua)) telusuri([...lintasan, idOrangTua]);
    }
  };
  telusuri([idAwal]);
  return hasil;
}
