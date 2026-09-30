// Tahap tanzil (bab 14.5, 14.7) — dzawil arham didudukkan pada posisi ahli waris perantaranya.
//   Masuk : graf + peran hasil derivasi + id seorang dzawil arham.
//   Putus : tiap lintasan orang itu ke pewaris dinaikkan derajat demi derajat sampai posisi ahli waris (perantara);
//           dalam jihah yang sama, yang lebih dulu sampai menghijab yang lain.
//   Keluar: rute yang lolos → mas'alah perantara (stages/perantara.ts).

import type { TidakDidukung } from './model.js';
import type { GrafKeluarga, IdOrang, Jihah, KunciAhliWaris, LangkahJejak, PeranAhliWaris } from '../types.js';

export interface RuteTanzil {
  idOrang: IdOrang;
  /** [pewaris, ..., idOrang] */
  lintasan: IdOrang[];
  perantara: IdOrang;
  kunciPerantara: KunciAhliWaris;
  jihah: Jihah;
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
    const rute = naikKePerantara(daftarPeran, idOrang, lintasan);
    return rute ? [rute] : [];
  });
  // Tiap lintasan memuat orang tua/anak/saudara pewaris (semuanya ahli waris), jadi mustahil kosong.
  if (daftarRute.length === 0) throw new Error(`invariant: dzawil arham ${idOrang} tanpa perantara [R14-7]`);
  return daftarRute;
}

/** [R14-7] [R14-10] Dalam jihah yang sama, rute dengan langkah paling sedikit menghijab yang lain; lintas jihah tidak. */
export function saringJihah(daftarRute: RuteTanzil[]): { lolos: RuteTanzil[]; tersisih: RuteTanzil[]; jejak: LangkahJejak[] } {
  const terdekat = new Map<Jihah, number>();
  for (const rute of daftarRute) terdekat.set(rute.jihah, Math.min(terdekat.get(rute.jihah) ?? Infinity, rute.langkah));
  const lolos = daftarRute.filter(rute => rute.langkah === terdekat.get(rute.jihah));
  const tersisih = daftarRute.filter(rute => rute.langkah !== terdekat.get(rute.jihah));
  const penghijab = (rute: RuteTanzil) => [...new Set(lolos
    .filter(pemenang => pemenang.jihah === rute.jihah && pemenang.idOrang !== rute.idOrang).map(pemenang => pemenang.idOrang))];
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
function naikKePerantara(daftarPeran: Record<IdOrang, PeranAhliWaris>, idOrang: IdOrang, lintasan: IdOrang[]): RuteTanzil | undefined {
  for (let i = lintasan.length - 2; i >= 1; i--) {
    const kunci = daftarPeran[lintasan[i]!]?.kunci;
    if (kunci === undefined || BUKAN_PERANTARA.has(kunci)) continue;
    const kunciPerantara = kunci as KunciAhliWaris;
    return { idOrang, lintasan, perantara: lintasan[i]!, kunciPerantara, jihah: jihahDari(kunciPerantara), langkah: lintasan.length - 1 - i };
  }
  return undefined;
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
