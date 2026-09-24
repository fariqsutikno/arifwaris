import type { KunciAhliWaris, IdOrang, LangkahJejak } from '../types.js';
import type { AhliWaris } from './model.js';

export interface Mahjub { oleh: IdOrang[]; rujukanAturan: string }

const FARU_MUDZAKKAR: KunciAhliWaris[] = ['ANAK_LK', 'CUCU_LK'];
const FARU_WARITS: KunciAhliWaris[] = ['ANAK_LK', 'ANAK_PR', 'CUCU_LK', 'CUCU_PR'];
const HAWASYI_ASHABAH: KunciAhliWaris[] = ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK', 'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'];

/**
 * Tahap 1c: hajb hirman [R06-3]. Kandidat diproses dari hajib terkuat (bab 6.7 no. 2) sehingga
 * setiap orang hanya dibandingkan dengan yang sudah pasti tidak terhijab.
 */
export function terapkanHajb(kandidat: AhliWaris[]): { mahjub: Record<IdOrang, Mahjub>; efektif: AhliWaris[]; jejak: LangkahJejak[] } {
  const efektif: AhliWaris[] = [];
  const mahjub: Record<IdOrang, Mahjub> = {};
  const jejak: LangkahJejak[] = [];

  for (const ahliWaris of [...kandidat].sort((a, b) => compareTuple(evaluationOrder(a), evaluationOrder(b)))) {
    const terhalang = hajibOf(ahliWaris, efektif);
    if (terhalang && terhalang.oleh.length > 0) {
      mahjub[ahliWaris.idOrang] = terhalang;
      jejak.push({ tahap: 'hajb', refs: [terhalang.rujukanAturan], jenis: 'HAJB_HIRMAN', mahjub: ahliWaris.idOrang, hajib: terhalang.oleh });
    } else {
      efektif.push(ahliWaris);
    }
  }
  return { mahjub, efektif, jejak };
}

// ─── Urutan evaluasi ──────────────────────────────────────────────────────────

function evaluationOrder(ahliWaris: AhliWaris): number[] {
  const { generasiLeluhur: generasi, kedalamanKeturunan: kedalaman } = ahliWaris.kekerabatan;
  switch (ahliWaris.kunci) {
    case 'CUCU_LK': return [1, kedalaman];
    case 'CUCU_PR': return [2, kedalaman];
    case 'KAKEK': return [3, generasi];
    case 'NENEK_DARI_IBU': case 'NENEK_DARI_AYAH': return [4, generasi];
    case 'SAUDARA_KANDUNG': return [5, 0];
    case 'SAUDARI_KANDUNG': return [5, 1];
    case 'SAUDARA_SEBAPAK': return [6, 0];         // sebelum SAUDARI_SEBAPAK: menentukan apakah ia diashabahkan
    case 'SAUDARI_SEBAPAK': return [6, 1];
    case 'SAUDARA_SEIBU': case 'SAUDARI_SEIBU': return [7, 0];
    default:
      return HAWASYI_ASHABAH.includes(ahliWaris.kunci) ? [8, ...ashabahRank(ahliWaris)] : [0];
  }
}

function compareTuple(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * [R05-2] [R05-3] urutan ashabah bi nafsihi [SYF]: jihah → darajah → quwwah.
 * Jihah: bunuwwah 0, ubuwwah 1, juduwwah & ukhuwwah 2, bani al-ikhwah 3, 'umumah 4.
 */
function ashabahRank(ahliWaris: AhliWaris): number[] {
  const { generasiLeluhur: generasi, kedalamanKeturunan: kedalaman, jalur } = ahliWaris.kekerabatan;
  const quwwah = jalur === 'kandung' ? 0 : 1;
  switch (ahliWaris.kunci) {
    case 'ANAK_LK': case 'CUCU_LK': return [0, kedalaman];
    case 'AYAH': return [1];
    case 'KAKEK': case 'SAUDARA_KANDUNG': case 'SAUDARA_SEBAPAK': case 'SAUDARI_KANDUNG': case 'SAUDARI_SEBAPAK': return [2];
    case 'KEPONAKAN_KANDUNG': case 'KEPONAKAN_SEBAPAK': return [3, kedalaman, quwwah];
    default: return [4, generasi, kedalaman, quwwah];   // AMM_*, IBN_AMM_*
  }
}

// ─── Aturan hajib per jenis ───────────────────────────────────────────────────

const ids = (daftarAhliWaris: AhliWaris[]) => daftarAhliWaris.map(h => h.idOrang);
const withKey = (daftarAhliWaris: AhliWaris[], keys: KunciAhliWaris[]) => daftarAhliWaris.filter(h => keys.includes(h.kunci));
const rule = (oleh: AhliWaris[], rujukanAturan: string): Mahjub | undefined => (oleh.length > 0 ? { oleh: ids(oleh), rujukanAturan } : undefined);

/** [R05-5] saudari menjadi ashabah ma'al ghair bersama far'u warits perempuan, tanpa saudara lk sederajat. */
function maalGhairSisters(efektif: AhliWaris[], sisterKey: 'SAUDARI_KANDUNG' | 'SAUDARI_SEBAPAK'): AhliWaris[] {
  const brotherKey = sisterKey === 'SAUDARI_KANDUNG' ? 'SAUDARA_KANDUNG' : 'SAUDARA_SEBAPAK';
  const hasFaruMuannats = withKey(efektif, ['ANAK_PR', 'CUCU_PR']).length > 0;
  const hasBrother = withKey(efektif, [brotherKey]).length > 0;
  return hasFaruMuannats && !hasBrother ? withKey(efektif, [sisterKey]) : [];
}

function hajibOf(ahliWaris: AhliWaris, efektif: AhliWaris[]): Mahjub | undefined {
  const { generasiLeluhur: generasi, kedalamanKeturunan: kedalaman } = ahliWaris.kekerabatan;
  const faruMudzakkar = withKey(efektif, FARU_MUDZAKKAR);
  const ab = withKey(efektif, ['AYAH']);
  const jadd = withKey(efektif, ['KAKEK']);

  switch (ahliWaris.kunci) {
    case 'CUCU_LK':
      return rule(faruMudzakkar.filter(h => h.kekerabatan.kedalamanKeturunan < kedalaman), 'R06-3');

    case 'CUCU_PR': {
      const maleAbove = faruMudzakkar.filter(h => h.kekerabatan.kedalamanKeturunan < kedalaman);
      if (maleAbove.length > 0) return rule(maleAbove, 'R06-3');
      // [R04-13] 2+ perempuan di atasnya menghabiskan 2/3, kecuali ada mu'ashshib sederajat/lebih rendah.
      const femalesAbove = withKey(efektif, ['ANAK_PR', 'CUCU_PR']).filter(h => h.kekerabatan.kedalamanKeturunan < kedalaman);
      const muashshib = withKey(efektif, ['CUCU_LK']).some(h => h.kekerabatan.kedalamanKeturunan >= kedalaman);
      return femalesAbove.length >= 2 && !muashshib ? rule(femalesAbove, 'R04-13') : undefined;
    }

    case 'KAKEK':
      return rule([...ab, ...jadd.filter(h => h.kekerabatan.generasiLeluhur < generasi)], 'R06-3');

    case 'NENEK_DARI_IBU': case 'NENEK_DARI_AYAH': {
      const side = ahliWaris.kunci;
      const oleh = [
        ...withKey(efektif, ['IBU']),
        ...(side === 'NENEK_DARI_AYAH' ? ab : []),                          // [R04-10]
        ...jadd.filter(j => ahliWaris.lintasan.includes(j.idOrang)),          // [R04-6] hanya nenek yang lewat kakek itu
        // [R04-9] [SYF]: nenek dekat sepihak menghijab yang jauh; nenek dekat pihak ibu juga menghijab
        // nenek jauh pihak ayah, tidak sebaliknya.
        ...withKey(efektif, ['NENEK_DARI_IBU', 'NENEK_DARI_AYAH']).filter(k =>
          k.kekerabatan.generasiLeluhur < generasi && (k.kunci === side || k.kunci === 'NENEK_DARI_IBU')),
      ];
      return rule(oleh, 'R04-9');
    }

    case 'SAUDARA_KANDUNG': case 'SAUDARI_KANDUNG':
      return rule([...faruMudzakkar, ...ab], 'R06-4');

    case 'SAUDARA_SEBAPAK': case 'SAUDARI_SEBAPAK': {
      const dasar = [...faruMudzakkar, ...ab];
      // [R08-4] bersama kakek, saudara sebapak tidak digugurkan kandung di sini; mu'addah (bab 08) yang mengatur.
      if (jadd.length > 0) return rule(dasar, 'R06-3');
      const byKandung = [...withKey(efektif, ['SAUDARA_KANDUNG']), ...maalGhairSisters(efektif, 'SAUDARI_KANDUNG')];
      const kandungSisters = withKey(efektif, ['SAUDARI_KANDUNG']);
      const hasBrotherAb = withKey(efektif, ['SAUDARA_SEBAPAK']).length > 0;
      // [R04-14] saudari sebapak gugur oleh 2+ saudari kandung, kecuali diashabahkan saudara lk sebapak.
      const byTwoSisters = ahliWaris.kunci === 'SAUDARI_SEBAPAK' && kandungSisters.length >= 2 && !hasBrotherAb ? kandungSisters : [];
      return rule(unique([...dasar, ...byKandung, ...byTwoSisters]), 'R06-3');
    }

    case 'SAUDARA_SEIBU': case 'SAUDARI_SEIBU':
      return rule([...withKey(efektif, FARU_WARITS), ...ab, ...jadd], 'R06-5');

    default: {
      if (!HAWASYI_ASHABAH.includes(ahliWaris.kunci)) return undefined;   // ayah, ibu, anak, pasangan: tidak pernah hirman [R06-2]
      const rank = ashabahRank(ahliWaris);
      const stronger = [
        ...withKey(efektif, ['ANAK_LK', 'CUCU_LK', 'AYAH', 'KAKEK', 'SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', ...HAWASYI_ASHABAH]),
        ...maalGhairSisters(efektif, 'SAUDARI_KANDUNG'),
        ...maalGhairSisters(efektif, 'SAUDARI_SEBAPAK'),
      ].filter(h => compareTuple(ashabahRank(h), rank) < 0);
      return rule(stronger, 'R05-3');
    }
  }
}

function unique(daftarAhliWaris: AhliWaris[]): AhliWaris[] {
  return daftarAhliWaris.filter((h, i) => daftarAhliWaris.findIndex(o => o.idOrang === h.idOrang) === i);
}
