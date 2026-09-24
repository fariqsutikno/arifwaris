// Tahap 1c — Hajb hirman [R06-3]: siapa yang terhalang sepenuhnya oleh ahli waris yang lebih dekat.
//   Masuk : kandidat ahli waris (sudah lolos mawani').
//   Keluar: `efektif` (yang tetap mewarisi), `mahjub` (yang terhalang + oleh siapa), dan jejak.
// Caranya: urutkan kandidat dari penghalang terkuat (bab 6.7 no. 2), lalu periksa satu per satu.
// Setiap orang cukup dibandingkan dengan yang sudah pasti tidak terhalang (`efektif`).

import type { IdOrang, KunciAhliWaris, LangkahJejak } from '../types.js';
import type { AhliWaris } from './model.js';

export interface Mahjub { oleh: IdOrang[]; rujukanAturan: string }

const FARU_MUDZAKKAR: KunciAhliWaris[] = ['ANAK_LK', 'CUCU_LK'];
const FARU_WARITS: KunciAhliWaris[] = ['ANAK_LK', 'ANAK_PR', 'CUCU_LK', 'CUCU_PR'];
const HAWASYI_ASHABAH: KunciAhliWaris[] = ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK', 'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'];

export function terapkanHajb(kandidat: AhliWaris[]): { mahjub: Record<IdOrang, Mahjub>; efektif: AhliWaris[]; jejak: LangkahJejak[] } {
  const efektif: AhliWaris[] = [];
  const mahjub: Record<IdOrang, Mahjub> = {};
  const jejak: LangkahJejak[] = [];

  const urutPenghalangTerkuat = [...kandidat].sort((a, b) => bandingkanUrutan(urutanEvaluasi(a), urutanEvaluasi(b)));
  for (const ahliWaris of urutPenghalangTerkuat) {
    const penghalang = cariHajib(ahliWaris, efektif);
    if (penghalang) {
      mahjub[ahliWaris.idOrang] = penghalang;
      jejak.push({ tahap: 'hajb', refs: [penghalang.rujukanAturan], jenis: 'HAJB_HIRMAN', mahjub: ahliWaris.idOrang, hajib: penghalang.oleh });
    } else {
      efektif.push(ahliWaris);
    }
  }
  return { mahjub, efektif, jejak };
}

// ─── Siapa menghalangi siapa ──────────────────────────────────────────────────

function cariHajib(ahliWaris: AhliWaris, efektif: AhliWaris[]): Mahjub | undefined {
  const { generasiLeluhur: generasi, kedalamanKeturunan: kedalaman } = ahliWaris.kekerabatan;
  const faruMudzakkar = denganKunci(efektif, FARU_MUDZAKKAR);
  const ayah = denganKunci(efektif, ['AYAH']);
  const kakek = denganKunci(efektif, ['KAKEK']);

  switch (ahliWaris.kunci) {
    case 'CUCU_LK':
      return hajibDari(faruMudzakkar.filter(lk => lk.kekerabatan.kedalamanKeturunan < kedalaman), 'R06-3');

    case 'CUCU_PR': {
      const lakiLakiDiAtas = faruMudzakkar.filter(lk => lk.kekerabatan.kedalamanKeturunan < kedalaman);
      if (lakiLakiDiAtas.length > 0) return hajibDari(lakiLakiDiAtas, 'R06-3');
      // [R04-13] 2+ perempuan di atasnya menghabiskan 2/3, kecuali ada mu'ashshib sederajat/lebih rendah.
      const perempuanDiAtas = denganKunci(efektif, ['ANAK_PR', 'CUCU_PR']).filter(pr => pr.kekerabatan.kedalamanKeturunan < kedalaman);
      const adaMuashshib = denganKunci(efektif, ['CUCU_LK']).some(lk => lk.kekerabatan.kedalamanKeturunan >= kedalaman);
      return perempuanDiAtas.length >= 2 && !adaMuashshib ? hajibDari(perempuanDiAtas, 'R04-13') : undefined;
    }

    case 'KAKEK':
      return hajibDari([...ayah, ...kakek.filter(lebihDekat => lebihDekat.kekerabatan.generasiLeluhur < generasi)], 'R06-3');

    case 'NENEK_DARI_IBU': case 'NENEK_DARI_AYAH': {
      const pihak = ahliWaris.kunci;
      const penghalang = [
        ...denganKunci(efektif, ['IBU']),
        ...(pihak === 'NENEK_DARI_AYAH' ? ayah : []),                                 // [R04-10]
        ...kakek.filter(kakekIni => ahliWaris.lintasan.includes(kakekIni.idOrang)),                // [R04-6] hanya nenek yang lewat kakek itu
        // [R04-9] [SYF]: nenek dekat sepihak menghijab yang jauh; nenek dekat pihak ibu juga menghijab
        // nenek jauh pihak ayah, tidak sebaliknya.
        ...denganKunci(efektif, ['NENEK_DARI_IBU', 'NENEK_DARI_AYAH']).filter(nenek =>
          nenek.kekerabatan.generasiLeluhur < generasi && (nenek.kunci === pihak || nenek.kunci === 'NENEK_DARI_IBU')),
      ];
      return hajibDari(penghalang, 'R04-9');
    }

    case 'SAUDARA_KANDUNG': case 'SAUDARI_KANDUNG':
      return hajibDari([...faruMudzakkar, ...ayah], 'R06-4');

    case 'SAUDARA_SEBAPAK': case 'SAUDARI_SEBAPAK': {
      const penghalangDasar = [...faruMudzakkar, ...ayah];
      // [R08-4] bersama kakek, saudara sebapak tidak digugurkan kandung di sini; mu'addah (bab 08) yang mengatur.
      if (kakek.length > 0) return hajibDari(penghalangDasar, 'R06-3');
      const olehKandung = [...denganKunci(efektif, ['SAUDARA_KANDUNG']), ...saudariMaalGhair(efektif, 'SAUDARI_KANDUNG')];
      const saudariKandung = denganKunci(efektif, ['SAUDARI_KANDUNG']);
      const adaSaudaraSebapak = denganKunci(efektif, ['SAUDARA_SEBAPAK']).length > 0;
      // [R04-14] saudari sebapak gugur oleh 2+ saudari kandung, kecuali diashabahkan saudara lk sebapak.
      const olehDuaSaudari = ahliWaris.kunci === 'SAUDARI_SEBAPAK' && saudariKandung.length >= 2 && !adaSaudaraSebapak ? saudariKandung : [];
      return hajibDari(tanpaDuplikat([...penghalangDasar, ...olehKandung, ...olehDuaSaudari]), 'R06-3');
    }

    case 'SAUDARA_SEIBU': case 'SAUDARI_SEIBU':
      return hajibDari([...denganKunci(efektif, FARU_WARITS), ...ayah, ...kakek], 'R06-5');

    default: {
      // Ayah, ibu, anak, pasangan tidak pernah terkena hajb hirman [R06-2].
      if (!HAWASYI_ASHABAH.includes(ahliWaris.kunci)) return undefined;
      // Keponakan, paman, sepupu: kalah oleh ashabah mana pun yang peringkatnya lebih kuat [R05-3].
      const peringkat = peringkatAshabah(ahliWaris);
      const lebihKuat = [
        ...denganKunci(efektif, ['ANAK_LK', 'CUCU_LK', 'AYAH', 'KAKEK', 'SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', ...HAWASYI_ASHABAH]),
        ...saudariMaalGhair(efektif, 'SAUDARI_KANDUNG'),
        ...saudariMaalGhair(efektif, 'SAUDARI_SEBAPAK'),
      ].filter(ashabah => bandingkanUrutan(peringkatAshabah(ashabah), peringkat) < 0);
      return hajibDari(lebihKuat, 'R05-3');
    }
  }
}

/** [R05-5] saudari menjadi ashabah ma'al ghair bersama far'u warits perempuan, tanpa saudara lk sederajat. */
function saudariMaalGhair(efektif: AhliWaris[], kunciSaudari: 'SAUDARI_KANDUNG' | 'SAUDARI_SEBAPAK'): AhliWaris[] {
  const kunciSaudaraLk = kunciSaudari === 'SAUDARI_KANDUNG' ? 'SAUDARA_KANDUNG' : 'SAUDARA_SEBAPAK';
  const adaFaruMuannats = denganKunci(efektif, ['ANAK_PR', 'CUCU_PR']).length > 0;
  const adaSaudaraLk = denganKunci(efektif, [kunciSaudaraLk]).length > 0;
  return adaFaruMuannats && !adaSaudaraLk ? denganKunci(efektif, [kunciSaudari]) : [];
}

// ─── Urutan pemeriksaan ───────────────────────────────────────────────────────
// Urutan = tuple angka, dibandingkan dari kiri (kecil = diperiksa lebih dulu).
// Yang tidak pernah terhalang (ayah, ibu, anak, pasangan) diperiksa pertama.

const URUTAN = {
  TIDAK_PERNAH_TERHALANG: 0,
  CUCU_LK: 1,
  CUCU_PR: 2,
  KAKEK: 3,
  NENEK: 4,
  GARIS_KANDUNG: 5,
  GARIS_SEBAPAK: 6,
  SAUDARA_SEIBU: 7,
  HAWASYI: 8,
} as const;

// Dalam satu garis saudara, yang laki-laki diperiksa lebih dulu karena ia menentukan
// apakah saudarinya menjadi ashabah bil ghair.
const LAKI_LAKI_DULU = 0;
const PEREMPUAN_SETELAHNYA = 1;

function urutanEvaluasi(ahliWaris: AhliWaris): number[] {
  const { generasiLeluhur: generasi, kedalamanKeturunan: kedalaman } = ahliWaris.kekerabatan;
  switch (ahliWaris.kunci) {
    case 'CUCU_LK': return [URUTAN.CUCU_LK, kedalaman];
    case 'CUCU_PR': return [URUTAN.CUCU_PR, kedalaman];
    case 'KAKEK': return [URUTAN.KAKEK, generasi];
    case 'NENEK_DARI_IBU': case 'NENEK_DARI_AYAH': return [URUTAN.NENEK, generasi];
    case 'SAUDARA_KANDUNG': return [URUTAN.GARIS_KANDUNG, LAKI_LAKI_DULU];
    case 'SAUDARI_KANDUNG': return [URUTAN.GARIS_KANDUNG, PEREMPUAN_SETELAHNYA];
    case 'SAUDARA_SEBAPAK': return [URUTAN.GARIS_SEBAPAK, LAKI_LAKI_DULU];
    case 'SAUDARI_SEBAPAK': return [URUTAN.GARIS_SEBAPAK, PEREMPUAN_SETELAHNYA];
    case 'SAUDARA_SEIBU': case 'SAUDARI_SEIBU': return [URUTAN.SAUDARA_SEIBU, 0];
    default:
      return HAWASYI_ASHABAH.includes(ahliWaris.kunci)
        ? [URUTAN.HAWASYI, ...peringkatAshabah(ahliWaris)]
        : [URUTAN.TIDAK_PERNAH_TERHALANG];
  }
}

// [R05-2] [R05-3] urutan ashabah bi nafsihi [SYF]: jihah → darajah → quwwah.
const JIHAH = { BUNUWWAH: 0, UBUWWAH: 1, JUDUWWAH_DAN_UKHUWWAH: 2, BANI_AL_IKHWAH: 3, UMUMAH: 4 } as const;

function peringkatAshabah(ahliWaris: AhliWaris): number[] {
  const { generasiLeluhur: generasi, kedalamanKeturunan: kedalaman, jalur } = ahliWaris.kekerabatan;
  const quwwah = jalur === 'kandung' ? 0 : 1;   // kandung lebih kuat dari sebapak
  switch (ahliWaris.kunci) {
    case 'ANAK_LK': case 'CUCU_LK': return [JIHAH.BUNUWWAH, kedalaman];
    case 'AYAH': return [JIHAH.UBUWWAH];
    case 'KAKEK': case 'SAUDARA_KANDUNG': case 'SAUDARA_SEBAPAK': case 'SAUDARI_KANDUNG': case 'SAUDARI_SEBAPAK':
      return [JIHAH.JUDUWWAH_DAN_UKHUWWAH];
    case 'KEPONAKAN_KANDUNG': case 'KEPONAKAN_SEBAPAK': return [JIHAH.BANI_AL_IKHWAH, kedalaman, quwwah];
    default: return [JIHAH.UMUMAH, generasi, kedalaman, quwwah];   // paman & sepupu
  }
}

function bandingkanUrutan(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const selisih = (a[i] ?? 0) - (b[i] ?? 0);
    if (selisih !== 0) return selisih;
  }
  return 0;
}

// ─── Bantuan kecil ────────────────────────────────────────────────────────────

const denganKunci = (daftar: AhliWaris[], kunci: KunciAhliWaris[]) => daftar.filter(ahliWaris => kunci.includes(ahliWaris.kunci));

const hajibDari = (penghalang: AhliWaris[], rujukanAturan: string): Mahjub | undefined =>
  penghalang.length > 0 ? { oleh: penghalang.map(ahliWaris => ahliWaris.idOrang), rujukanAturan } : undefined;

const tanpaDuplikat = (daftar: AhliWaris[]): AhliWaris[] =>
  daftar.filter((ahliWaris, i) => daftar.findIndex(lain => lain.idOrang === ahliWaris.idOrang) === i);
