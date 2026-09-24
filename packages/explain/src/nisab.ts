// Narasi perbandingan dua bilangan (mode ringkas).
//   ashl & juzSahm      : nisab arba' — tamatsul/tadakhul/tawafuq/tabayun (bab 10.2, [R10-1]).
//   inkisar & raddVsSisa: hanya FPB — habis/tawafuq/tabayun (bab 9.4, 10.3).

import type { LangkahJejak } from '@waris/engine';
import { kalimat, type Potongan } from './segments.js';
import { istilah } from './terms.js';

type LangkahNisab = Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }>;

export function narasiNisab(langkah: LangkahNisab, opsi: { berbobot?: boolean } = {}): Potongan[] {
  switch (langkah.tujuan) {
    case 'ashl': return narasiArba(langkah, 'Penyebut');
    case 'juzSahm': return narasiArba(langkah, 'Simpanan');
    case 'inkisar': return narasiInkisar(langkah, opsi.berbobot === true);
    case 'raddVsSisa': return narasiRaddVsSisa(langkah);
  }
}

function narasiArba({ a, b, hubungan, fpb, hasil }: LangkahNisab, kataBenda: string): Potongan[] {
  const [kecil, besar] = a < b ? [a, b] : [b, a];
  switch (hubungan) {
    case 'tamatsul':
      return kalimat`${kataBenda} ${a} dan ${b} sama → ${istilah('tamatsul', 'tamatsul')}. Ambil salah satunya: ${hasil}.`;
    case 'tadakhul':
      return kalimat`${kataBenda} ${a} dan ${b}: ${besar} habis dibagi ${kecil} → ${istilah('tadakhul', 'tadakhul')}. Ambil yang besar: ${hasil}.`;
    case 'tawafuq':
      return kalimat`${kataBenda} ${a} dan ${b}: tidak saling habis membagi, FPB ${fpb} → ${istilah('tawafuq', 'tawafuq')}. `
        .concat(kalimat`Kalikan salah satu dengan ${istilah('wafq', 'wafq')} yang lain: ${a} × (${b} ÷ ${fpb}) = ${hasil}.`);
    case 'tabayun':
      // [R10-5] «كل عدد مع الواحد فهو متباين»
      return kecil === 1n
        ? kalimat`${kataBenda} ${a} dan ${b}: setiap bilangan bertemu 1 dihukumi ${istilah('tabayun', 'tabayun')}. Kalikan keduanya: ${a} × ${b} = ${hasil}.`
        : kalimat`${kataBenda} ${a} dan ${b}: FPB 1 → ${istilah('tabayun', 'tabayun')}. Kalikan keduanya: ${a} × ${b} = ${hasil}.`;
    default:
      throw new Error(`relasi ${hubungan} tidak berlaku untuk nisab arba'`);
  }
}

function narasiInkisar({ a: saham, b: ruus, hubungan, fpb, hasil }: LangkahNisab, berbobot: boolean): Potongan[] {
  const teksRuus = kalimat`${istilah('ruus', "ru'us")} ${ruus}${berbobot ? ' (laki-laki dihitung 2)' : ''}`;
  switch (hubungan) {
    case 'habis': return kalimat`Saham ${saham} habis dibagi ${teksRuus} → tidak perlu dikoreksi.`;
    case 'tawafuq':
      return kalimat`Saham ${saham} tidak habis dibagi ${teksRuus}, FPB ${fpb} → ${istilah('tawafuq', 'tawafuq')}. Simpan ${istilah('wafq', 'wafq')} ru'us: ${ruus} ÷ ${fpb} = ${hasil}.`;
    case 'tabayun':
      return kalimat`Saham ${saham} tidak habis dibagi ${teksRuus}, FPB 1 → ${istilah('tabayun', 'tabayun')}. Simpan seluruh ru'us: ${hasil}.`;
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk inkisar`);
  }
}

function narasiRaddVsSisa({ a: sisa, b: ashlRadd, hubungan, fpb, hasil }: LangkahNisab): Potongan[] {
  const ashlZawjiyyah = hasil / (ashlRadd / fpb);
  switch (hubungan) {
    case 'habis':
      return kalimat`Sisa ${sisa} habis dibagi ashl radd ${ashlRadd} → cukup dengan ashl zawjiyyah: ${hasil}.`;
    case 'tawafuq':
      return kalimat`Sisa ${sisa} dibanding ashl radd ${ashlRadd}: FPB ${fpb} → ${istilah('tawafuq', 'tawafuq')}. `
        .concat(kalimat`Kalikan ashl zawjiyyah dengan ${istilah('wafq', 'wafq')} ashl radd: ${ashlZawjiyyah} × (${ashlRadd} ÷ ${fpb}) = ${hasil}.`);
    case 'tabayun':
      return kalimat`Sisa ${sisa} dibanding ashl radd ${ashlRadd}: FPB 1 → ${istilah('tabayun', 'tabayun')}. `
        .concat(kalimat`Kalikan ashl zawjiyyah dengan seluruh ashl radd: ${ashlZawjiyyah} × ${ashlRadd} = ${hasil}.`);
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk radd`);
  }
}
