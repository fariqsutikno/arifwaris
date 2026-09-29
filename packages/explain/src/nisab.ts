// Narasi perbandingan dua bilangan (mode ringkas); kalimat = diksi `narasi.nisab.*`.
//   ashl & juzSahm      : nisab arba' — tamatsul/tadakhul/tawafuq/tabayun (bab 10.2, [R10-1]).
//   inkisar & raddVsSisa: hanya FPB — habis/tawafuq/tabayun (bab 9.4, 10.3).

import type { LangkahJejak } from '@waris/engine';
import { kalimat, susun, teksKamus, type Penyusun, type Potongan, type Sisipan } from './segments.js';
import { istilahNarasi } from './terms.js';

type LangkahNisab = Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }>;

export function narasiNisab(penyusun: Penyusun, langkah: LangkahNisab, opsi: { berbobot?: boolean } = {}): Potongan[] {
  switch (langkah.tujuan) {
    case 'ashl': return narasiArba(penyusun, langkah, teksKamus(penyusun, 'narasi.nisab.kata_benda.ashl'));
    case 'juzSahm': return narasiArba(penyusun, langkah, teksKamus(penyusun, 'narasi.nisab.kata_benda.juz_sahm'));
    case 'inkisar': return narasiInkisar(penyusun, langkah, opsi.berbobot === true);
    case 'raddVsSisa': return narasiRaddVsSisa(penyusun, langkah);
  }
}

const nisab = (penyusun: Penyusun, kunci: string, sisipan: Record<string, Sisipan>): Potongan[] =>
  susun(penyusun, `narasi.nisab.${kunci}`, sisipan);

function narasiArba(penyusun: Penyusun, { a, b, hubungan, fpb, hasil }: LangkahNisab, kataBenda: string): Potongan[] {
  const [kecil, besar] = a < b ? [a, b] : [b, a];
  switch (hubungan) {
    case 'tamatsul':
      return nisab(penyusun, 'arba.tamatsul', { benda: kataBenda, a, b, tamatsul: istilahNarasi(penyusun, 'tamatsul'), hasil });
    case 'tadakhul':
      return nisab(penyusun, 'arba.tadakhul', { benda: kataBenda, a, b, besar, kecil, tadakhul: istilahNarasi(penyusun, 'tadakhul'), hasil });
    case 'tawafuq':
      return nisab(penyusun, 'arba.tawafuq', {
        benda: kataBenda, a, b, fpb, tawafuq: istilahNarasi(penyusun, 'tawafuq'), wafq: istilahNarasi(penyusun, 'wafq'), hasil,
      });
    case 'tabayun':
      // [R10-5] «كل عدد مع الواحد فهو متباين»
      return nisab(penyusun, kecil === 1n ? 'arba.tabayun_satu' : 'arba.tabayun', { benda: kataBenda, a, b, tabayun: istilahNarasi(penyusun, 'tabayun'), hasil });
    default:
      throw new Error(`relasi ${hubungan} tidak berlaku untuk nisab arba'`);
  }
}

function narasiInkisar(penyusun: Penyusun, { a: saham, b: ruus, hubungan, fpb, hasil }: LangkahNisab, berbobot: boolean): Potongan[] {
  const istilahRuus = istilahNarasi(penyusun, 'ruus');
  const teksRuus = berbobot ? nisab(penyusun, 'inkisar.ruus_berbobot', { ruus: istilahRuus, jumlah: ruus }) : kalimat`${istilahRuus} ${ruus}`;
  switch (hubungan) {
    case 'habis': return nisab(penyusun, 'inkisar.habis', { saham, ruus: teksRuus });
    case 'tawafuq':
      return nisab(penyusun, 'inkisar.tawafuq', {
        saham, ruus: teksRuus, fpb, tawafuq: istilahNarasi(penyusun, 'tawafuq'), wafq: istilahNarasi(penyusun, 'wafq'), jumlah_ruus: ruus, hasil,
      });
    case 'tabayun':
      return nisab(penyusun, 'inkisar.tabayun', { saham, ruus: teksRuus, tabayun: istilahNarasi(penyusun, 'tabayun'), hasil });
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk inkisar`);
  }
}

function narasiRaddVsSisa(penyusun: Penyusun, { a: sisa, b: ashlRadd, hubungan, fpb, hasil }: LangkahNisab): Potongan[] {
  const ashlZawjiyyah = hasil / (ashlRadd / fpb);
  switch (hubungan) {
    case 'habis':
      return nisab(penyusun, 'radd.habis', { sisa, ashl_radd: ashlRadd, hasil });
    case 'tawafuq':
      return nisab(penyusun, 'radd.tawafuq', {
        sisa, ashl_radd: ashlRadd, fpb, tawafuq: istilahNarasi(penyusun, 'tawafuq'), wafq: istilahNarasi(penyusun, 'wafq'),
        ashl_zawjiyyah: ashlZawjiyyah, hasil,
      });
    case 'tabayun':
      return nisab(penyusun, 'radd.tabayun', { sisa, ashl_radd: ashlRadd, tabayun: istilahNarasi(penyusun, 'tabayun'), ashl_zawjiyyah: ashlZawjiyyah, hasil });
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk radd`);
  }
}
