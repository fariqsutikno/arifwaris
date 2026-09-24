import type { LangkahJejak } from '@waris/engine';
import { s, type Segment } from './segments.js';
import { term } from './terms.js';

type NisabStep = Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }>;

/**
 * Mode ringkas: identifikasi dua bilangan beserta kaidahnya, dengan istilah sebagai potongan tooltip.
 * ashl & juzSahm: nisab arba' (bab 10.2, [R10-1]); inkisar & raddVsSisa: hanya FPB (bab 9.4, 10.3).
 */
export function narrateNisab(step: NisabStep, opsi: { weighted?: boolean } = {}): Segment[] {
  switch (step.tujuan) {
    case 'ashl': return narrateArba(step, 'Penyebut');
    case 'juzSahm': return narrateArba(step, 'Simpanan');
    case 'inkisar': return narrateInkisar(step, opsi.weighted === true);
    case 'raddVsSisa': return narrateRaddVsSisa(step);
  }
}

function narrateArba({ a, b, hubungan, fpb, hasil }: NisabStep, noun: string): Segment[] {
  const [small, big] = a < b ? [a, b] : [b, a];
  switch (hubungan) {
    case 'tamatsul':
      return s`${noun} ${a} dan ${b} sama → ${term('tamatsul', 'tamatsul')}. Ambil salah satunya: ${hasil}.`;
    case 'tadakhul':
      return s`${noun} ${a} dan ${b}: ${big} habis dibagi ${small} → ${term('tadakhul', 'tadakhul')}. Ambil yang besar: ${hasil}.`;
    case 'tawafuq':
      return s`${noun} ${a} dan ${b}: tidak saling habis membagi, FPB ${fpb} → ${term('tawafuq', 'tawafuq')}. `
        .concat(s`Kalikan salah satu dengan ${term('wafq', 'wafq')} yang lain: ${a} × (${b} ÷ ${fpb}) = ${hasil}.`);
    case 'tabayun':
      // [R10-5] «كل عدد مع الواحد فهو متباين»
      return small === 1n
        ? s`${noun} ${a} dan ${b}: setiap bilangan bertemu 1 dihukumi ${term('tabayun', 'tabayun')}. Kalikan keduanya: ${a} × ${b} = ${hasil}.`
        : s`${noun} ${a} dan ${b}: FPB 1 → ${term('tabayun', 'tabayun')}. Kalikan keduanya: ${a} × ${b} = ${hasil}.`;
    default:
      throw new Error(`relasi ${hubungan} tidak berlaku untuk nisab arba'`);
  }
}

function narrateInkisar({ a: saham, b: ruus, hubungan, fpb, hasil }: NisabStep, weighted: boolean): Segment[] {
  const ruusText = s`${term('ruus', "ru'us")} ${ruus}${weighted ? ' (laki-laki dihitung 2)' : ''}`;
  switch (hubungan) {
    case 'habis': return s`Saham ${saham} habis dibagi ${ruusText} → tidak perlu dikoreksi.`;
    case 'tawafuq':
      return s`Saham ${saham} tidak habis dibagi ${ruusText}, FPB ${fpb} → ${term('tawafuq', 'tawafuq')}. Simpan ${term('wafq', 'wafq')} ru'us: ${ruus} ÷ ${fpb} = ${hasil}.`;
    case 'tabayun':
      return s`Saham ${saham} tidak habis dibagi ${ruusText}, FPB 1 → ${term('tabayun', 'tabayun')}. Simpan seluruh ru'us: ${hasil}.`;
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk inkisar`);
  }
}

function narrateRaddVsSisa({ a: sisa, b: ashlRadd, hubungan, fpb, hasil }: NisabStep): Segment[] {
  const ashlZawjiyyah = hasil / (ashlRadd / fpb);
  switch (hubungan) {
    case 'habis':
      return s`Sisa ${sisa} habis dibagi ashl radd ${ashlRadd} → cukup dengan ashl zawjiyyah: ${hasil}.`;
    case 'tawafuq':
      return s`Sisa ${sisa} dibanding ashl radd ${ashlRadd}: FPB ${fpb} → ${term('tawafuq', 'tawafuq')}. `
        .concat(s`Kalikan ashl zawjiyyah dengan ${term('wafq', 'wafq')} ashl radd: ${ashlZawjiyyah} × (${ashlRadd} ÷ ${fpb}) = ${hasil}.`);
    case 'tabayun':
      return s`Sisa ${sisa} dibanding ashl radd ${ashlRadd}: FPB 1 → ${term('tabayun', 'tabayun')}. `
        .concat(s`Kalikan ashl zawjiyyah dengan seluruh ashl radd: ${ashlZawjiyyah} × ${ashlRadd} = ${hasil}.`);
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk radd`);
  }
}
