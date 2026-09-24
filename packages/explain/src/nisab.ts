import type { TraceStep } from '@waris/engine';

type NisabStep = Extract<TraceStep, { kind: 'NISAB_COMPARE' }>;

/**
 * Identifikasi hubungan dua bilangan beserta kaidahnya.
 * ashl & juzSahm: nisab arba' (bab 10.2, [R10-1]); inkisar & raddVsSisa: hanya FPB (bab 9.4, 10.3).
 * `weighted`: ru'us kelompok memakai hitungan laki-laki 2 (ashabah bil ghair, akdariyyah).
 */
export function narrateNisab(step: NisabStep, options: { weighted?: boolean } = {}): string {
  switch (step.purpose) {
    case 'ashl': return narrateArba(step, 'Penyebut');
    case 'juzSahm': return narrateArba(step, 'Simpanan');
    case 'inkisar': return narrateInkisar(step, options.weighted === true);
    case 'raddVsSisa': return narrateRaddVsSisa(step);
  }
}

function narrateArba({ a, b, relation, gcd, result }: NisabStep, noun: string): string {
  const [small, big] = a < b ? [a, b] : [b, a];
  switch (relation) {
    case 'tamatsul':
      return `${noun} ${a} dan ${b} sama → tamatsul. Ambil salah satunya: ${result}.`;
    case 'tadakhul':
      return `${noun} ${a} dan ${b}: ${big} habis dibagi ${small} → tadakhul. Ambil yang besar: ${result}.`;
    case 'tawafuq':
      return `${noun} ${a} dan ${b}: tidak saling habis membagi, FPB ${gcd} → tawafuq. `
        + `Kalikan salah satu dengan wafq yang lain: ${a} × (${b} ÷ ${gcd}) = ${result}.`;
    case 'tabayun':
      // [R10-5] «كل عدد مع الواحد فهو متباين»
      return small === 1n
        ? `${noun} ${a} dan ${b}: setiap bilangan bertemu 1 dihukumi tabayun. Kalikan keduanya: ${a} × ${b} = ${result}.`
        : `${noun} ${a} dan ${b}: FPB 1 → tabayun. Kalikan keduanya: ${a} × ${b} = ${result}.`;
    default:
      throw new Error(`relasi ${relation} tidak berlaku untuk nisab arba'`);
  }
}

function narrateInkisar({ a: saham, b: ruus, relation, gcd, result }: NisabStep, weighted: boolean): string {
  const ruusText = `ru'us ${ruus}${weighted ? ' (laki-laki dihitung 2)' : ''}`;
  switch (relation) {
    case 'habis': return `Saham ${saham} habis dibagi ${ruusText} → tidak perlu dikoreksi.`;
    case 'tawafuq': return `Saham ${saham} tidak habis dibagi ${ruusText}, FPB ${gcd} → tawafuq. Simpan wafq ru'us: ${ruus} ÷ ${gcd} = ${result}.`;
    case 'tabayun': return `Saham ${saham} tidak habis dibagi ${ruusText}, FPB 1 → tabayun. Simpan seluruh ru'us: ${result}.`;
    default: throw new Error(`relasi ${relation} tidak berlaku untuk inkisar`);
  }
}

function narrateRaddVsSisa({ a: sisa, b: ashlRadd, relation, gcd, result }: NisabStep): string {
  const ashlZawjiyyah = result / (ashlRadd / gcd);
  switch (relation) {
    case 'habis':
      return `Sisa ${sisa} habis dibagi ashl radd ${ashlRadd} → cukup dengan ashl zawjiyyah: ${result}.`;
    case 'tawafuq':
      return `Sisa ${sisa} dibanding ashl radd ${ashlRadd}: FPB ${gcd} → tawafuq. `
        + `Kalikan ashl zawjiyyah dengan wafq ashl radd: ${ashlZawjiyyah} × (${ashlRadd} ÷ ${gcd}) = ${result}.`;
    case 'tabayun':
      return `Sisa ${sisa} dibanding ashl radd ${ashlRadd}: FPB 1 → tabayun. `
        + `Kalikan ashl zawjiyyah dengan seluruh ashl radd: ${ashlZawjiyyah} × ${ashlRadd} = ${result}.`;
    default: throw new Error(`relasi ${relation} tidak berlaku untuk radd`);
  }
}
