// Ruleset overlay (bab 18): tiap madzhab = sekumpulan flag, satu per titik matriks 18.2 yang disentuh waris dasar.
// Tahap pipeline menerima `AturanMadzhab` sebagai argumen dan bercabang pada flag-nya; tidak ada tahap yang
// memeriksa nama madzhab langsung. Titik di luar matriks dijaga gerbang (gerbang.ts + KB 18.4).
import type { KonfigurasiMadzhab, Ruleset } from '../types.js';

export const DAFTAR_RULESET: readonly Ruleset[] = ['syafii', 'hanbali', 'hanafi', 'maliki'];

export interface AturanMadzhab {
  ruleset: Ruleset;
  /** [K03-1] banyaknya laki-laki paling banyak di jalur nenek pihak ayah; undefined = tak dibatasi. */
  batasLakiLakiJalurNenek?: number;
  /** [K04-1] nenek yang lebih dekat menghijab yang lebih jauh dari pihak mana pun. */
  nenekDekatMenghijabMutlak: boolean;
  /** [K04-2] ummul ab terhijab oleh ayah. */
  ummulAbTerhijabAyah: boolean;
  /** [K07-1] musyarrakah: saudara kandung digabung dengan saudara seibu. */
  tasyrik: boolean;
  /** [K05-1] [K08-1] kakek menghijab saudara kandung/sebapak seperti ayah. */
  kakekMenghijabSaudara: boolean;
  /** [K09-1] kebijakan sisa yang sah untuk madzhab ini. */
  kebijakanSisaSah: ReadonlyArray<KonfigurasiMadzhab['kebijakanSisa']>;
}

export const ATURAN: Record<Ruleset, AturanMadzhab> = {
  syafii: {
    ruleset: 'syafii', nenekDekatMenghijabMutlak: false, ummulAbTerhijabAyah: true, tasyrik: true,
    kakekMenghijabSaudara: false, kebijakanSisaSah: ['radd', 'baitulMal'],
  },
  // [K03-1] Mughni 6/300–301: tiga nenek (ummul umm, ummul ab, ummul jadd) → paling banyak 2 laki-laki (ayah, kakek).
  hanbali: {
    ruleset: 'hanbali', batasLakiLakiJalurNenek: 2, nenekDekatMenghijabMutlak: true, ummulAbTerhijabAyah: false, tasyrik: false,
    kakekMenghijabSaudara: false, kebijakanSisaSah: ['radd'],
  },
  hanafi: {
    ruleset: 'hanafi', nenekDekatMenghijabMutlak: true, ummulAbTerhijabAyah: true, tasyrik: false,
    kakekMenghijabSaudara: true, kebijakanSisaSah: ['radd'],
  },
  // [K03-1] 'Iqd 3/1239–1240: hanya ummul umm dan ummul ab (ke atas lewat perempuan) → paling banyak 1 laki-laki (ayah).
  maliki: {
    ruleset: 'maliki', batasLakiLakiJalurNenek: 1, nenekDekatMenghijabMutlak: false, ummulAbTerhijabAyah: true, tasyrik: true,
    kakekMenghijabSaudara: false, kebijakanSisaSah: ['radd', 'baitulMal'],
  },
};

/** Titik yang ada di matriks 18: [SYF] memakai token bab asal, madzhab lain memakai kode matriks (sel madzhab itu). */
export const rujukanTitik = (aturan: AturanMadzhab, kodeKhilaf: string, tokenSyafii: string): string =>
  aturan.ruleset === 'syafii' ? tokenSyafii : kodeKhilaf;
