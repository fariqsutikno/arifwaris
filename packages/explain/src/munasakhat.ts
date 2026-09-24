import type { FamilyGraph, HeirKey, MunasakhatResult, PersonId, TraceStep } from '@waris/engine';
import { rupiah } from './format.js';
import { explain, type ExplainSection } from './narasi.js';
import { ROLE_LABEL } from './people.js';
import { joinAnd, line, s, type ExplainLine, type Segment } from './segments.js';
import { term } from './terms.js';

type Ok = Extract<MunasakhatResult, { status: 'OK' }>;
type Combine = Extract<TraceStep, { kind: 'MUNASAKHAT' }>;

export interface MunasakhatPart { title: string; sections: ExplainSection[] }
export interface MunasakhatExplanation { parts: MunasakhatPart[] }

const ORDINAL = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];

/**
 * Penjelasan munasakhat (bab 12): pembukaan + batas cakupan, pembagian tiap mayit (memakai `explain`),
 * penggabungan jami'ah per mayit berikutnya, lalu hasil akhir.
 */
export function explainMunasakhat(result: Ok, graph: FamilyGraph, options: { mode?: 'cerita' | 'ringkas' } = {}): MunasakhatExplanation {
  const mention = makeMention(result, graph);
  const combines = result.trace.filter((st): st is Combine => st.kind === 'MUNASAKHAT');

  const parts: MunasakhatPart[] = [pembukaan(result, mention)];
  for (const [index, step] of result.steps.entries()) {
    // Mayit berikutnya disebut dengan perannya ("anak perempuan"), bukan "almarhumah", supaya jelas siapa yang wafat.
    const named = index === 0 ? graph
      : { ...graph, persons: { ...graph.persons, [step.mayit]: { ...graph.persons[step.mayit]!, name: mention(step.mayit).text } } };
    const sections = explain(step.result, { ...named, deceasedId: step.mayit }, options).sections;
    const combine = combines.find(st => st.mayit === step.mayit);
    if (combine) sections.push(penggabungan(combine, mention));
    parts.push({
      title: index === 0 ? `Pembagian harta ${mention(step.mayit).text}` : `Bagian ${mention(step.mayit).text} diteruskan`,
      sections,
    });
  }
  parts.push(hasilAkhir(result, mention));
  return { parts };
}

// ─── Sebutan orang lintas mayit ───────────────────────────────────────────────

/**
 * Tanpa nama, peran disebut terhadap mayit pertama yang ia warisi: "istri", "anak laki-laki dari istri".
 * Sebutan yang sama untuk dua orang diberi urutan ("anak perempuan pertama").
 */
function makeMention(result: Ok, graph: FamilyGraph): (id: PersonId) => Segment {
  const deceasedId = result.steps[0]!.mayit;
  const heirOf = (id: PersonId) => {
    for (const step of result.steps) {
      const status = step.result.statuses[id];
      if (status?.kind === 'heir' || status?.kind === 'mahjub') return { mayit: step.mayit, key: status.role.key };
    }
    return undefined;
  };
  const baseLabel = (id: PersonId): string => {
    const person = graph.persons[id];
    if (person?.name) return person.name;
    if (id === deceasedId) return person?.sex === 'F' ? 'almarhumah' : 'almarhum';
    const role = heirOf(id);
    if (!role) return 'kerabat';
    const label = ROLE_LABEL[role.key as HeirKey] ?? 'kerabat';
    return role.mayit === deceasedId ? label : `${label} dari ${baseLabel(role.mayit)}`;
  };

  const peers = new Map<string, PersonId[]>();
  for (const id of Object.keys(graph.persons)) {
    if (id !== deceasedId && !heirOf(id)) continue;
    const label = baseLabel(id);
    peers.set(label, [...(peers.get(label) ?? []), id]);
  }
  return id => {
    const label = baseLabel(id);
    const same = peers.get(label) ?? [id];
    const text = same.length > 1 && !graph.persons[id]?.name ? `${label} ${ORDINAL[same.indexOf(id)] ?? `ke-${same.indexOf(id) + 1}`}` : label;
    return { kind: 'person', personIds: [id], text };
  };
}

// ─── Bagian ───────────────────────────────────────────────────────────────────

function pembukaan(result: Ok, mention: (id: PersonId) => Segment): MunasakhatPart {
  const [first, ...later] = [result.steps[0]!.mayit, ...deathsInOrder(result)];
  const deceased = mention(first!);
  const lines: ExplainLine[] = [
    line(s`${deceased} wafat. Sebelum hartanya dibagi, ${joinAnd(later.map(id => [mention(id)]))} ikut wafat, berurutan seperti itu. `
      .concat(s`Kasus seperti ini disebut ${term('munasakhat', 'munasakhat')}: bagian yang sudah menjadi hak orang yang wafat belakangan `,
        s`diteruskan kepada ahli warisnya.`), ['R12-1']),
    line(keadaanText(result.keadaan, deceased), ['R12-2', 'R12-3']),
    line(s`Yang diteruskan hanyalah bagian dari harta ${deceased} yang sampai kepada mereka, bukan pembagian waris atas seluruh harta mereka. `
      .concat(s`Hutang, wasiat, dan harta lain milik mereka diselesaikan oleh ahli warisnya masing-masing.`)),
  ];
  for (const skip of result.trace.filter(st => st.kind === 'MUNASAKHAT_SKIP')) {
    lines.push(line(s`${mention(skip.mayit)} tidak mendapat bagian dari harta ${deceased}, jadi tidak ada yang diteruskan kepada ahli warisnya.`, skip.refs));
  }
  return { title: 'Kematian berantai', sections: [{ title: 'Apa yang terjadi', lines }] };
}

function keadaanText(keadaan: 1 | 2 | 3, deceased: Segment): Segment[] {
  switch (keadaan) {
    case 1:
      return s`Yang wafat belakangan hanya meninggalkan ahli waris yang sama dengan sisa ahli waris ${deceased}, dan bagian mereka `
        .concat(s`tidak berubah (keadaan pertama). Karena itu hasil akhirnya sama dengan membagi harta ${deceased} langsung kepada `,
          s`yang masih hidup, seolah yang wafat belakangan tidak ada. Langkah bertahap di bawah tetap ditampilkan sebagai buktinya.`);
    case 2:
      return s`Ahli waris masing-masing yang wafat belakangan tidak ikut mewarisi dari ${deceased} maupun dari yang lain `
        .concat(s`(keadaan kedua). Kitab menghitungnya dengan satu angka pembagi gabungan sekaligus; langkah bertahap di bawah `,
          s`memberi hasil yang sama.`);
    case 3:
      return s`Susunan ahli warisnya berubah dari satu kematian ke kematian berikutnya (keadaan ketiga), jadi bagian tiap orang `
        .concat(s`yang wafat diteruskan satu per satu.`);
  }
}

/** Urutan wafat setelah mayit pertama, termasuk yang diabaikan karena tidak mendapat bagian. */
function deathsInOrder(result: Ok): PersonId[] {
  return result.trace.flatMap(st => (st.kind === 'MUNASAKHAT' || st.kind === 'MUNASAKHAT_SKIP' ? [st.mayit] : []));
}

function penggabungan(st: Combine, mention: (id: PersonId) => Segment): ExplainSection {
  const who = mention(st.mayit);
  const sebelum = st.jamiah / st.wafqMasalah;
  const lines: ExplainLine[] = [
    line(s`${who} mendapat ${st.saham} dari ${sebelum} bagian. Bagian itu dibagi kepada ahli warisnya, yang pembagiannya memakai ${st.masalah} bagian.`, ['R12-2']),
    line(relationText(st, who), ['R12-2']),
    line(s`Angka pembagi gabungan (${term('jamiah', "jami'ah")}) sekarang ${st.jamiah}:`, ['R12-2']),
    ...Object.entries(st.rincian).map(([id, row]) => {
      const terms = [
        ...(row.sebelum > 0n ? [`${row.sebelum} × ${st.wafqMasalah}`] : []),
        ...(row.dariMayit > 0n ? [`${row.dariMayit} × ${st.wafqSaham}`] : []),
      ];
      return line(s`${mention(id)}: ${terms.join(' + ')} = ${row.sesudah}.`);
    }),
  ];
  return { title: 'Menggabungkan dengan pembagian sebelumnya', lines };
}

function relationText(st: Combine, who: Segment): Segment[] {
  switch (st.relation) {
    case 'habis':
      return st.saham === st.masalah
        ? s`${st.saham} sama dengan ${st.masalah} (${term('tamatsul', 'tamatsul')}), jadi angka pembagi tidak perlu diperbesar.`
        : s`${st.saham} habis dibagi ${st.masalah}, jadi angka pembagi tidak perlu diperbesar; bagian ahli waris ${who} dikali ${st.wafqSaham}.`;
    case 'tawafuq':
      return s`${st.saham} dan ${st.masalah} sama-sama habis dibagi ${st.gcd} (${term('tawafuq', 'tawafuq')}). `
        .concat(s`Angka pembagi sebelumnya dikali ${st.masalah} ÷ ${st.gcd} = ${st.wafqMasalah} (${term('wafq', 'wafq')}), `,
          s`dan bagian ahli waris ${who} dikali ${st.saham} ÷ ${st.gcd} = ${st.wafqSaham}.`);
    case 'tabayun':
      return s`${st.saham} dan ${st.masalah} tidak bisa sama-sama dibagi kecuali oleh 1 (${term('tabayun', 'tabayun')}). `
        .concat(s`Angka pembagi sebelumnya dikali ${st.masalah}, dan bagian ahli waris ${who} dikali ${st.saham}.`);
  }
}

function hasilAkhir(result: Ok, mention: (id: PersonId) => Segment): MunasakhatPart {
  const { ikhtishar, nominal, rounding } = result;
  const showNominal = result.trace.some(st => st.kind === 'TIRKAH' && st.gross > 0n);
  const lines: ExplainLine[] = [];
  const diringkas = ikhtishar.jamiah !== result.jamiah;
  if (diringkas) {
    const faktor = result.jamiah / ikhtishar.jamiah;
    lines.push(line(s`Semua angka bisa diringkas dengan membagi ${faktor}: ${result.jamiah} menjadi ${ikhtishar.jamiah}.`, ['R12-2']));
  }
  for (const [id, saham] of Object.entries(result.saham)) {
    const ringkas = diringkas ? ` (diringkas ${ikhtishar.saham[id]}/${ikhtishar.jamiah})` : '';
    lines.push(line(s`${mention(id)}: ${saham}/${result.jamiah}${ringkas}${showNominal ? ` = ${rupiah(nominal[id]!)}` : ''}.`, ['R11-1']));
  }
  if (showNominal && rounding.remainder > 0n) {
    lines.push(line(s`Selisih pembulatan ${rupiah(rounding.remainder)} (per ${rupiah(rounding.unit)}), belum dibagikan.`));
  }
  return { title: 'Hasil akhir', sections: [{ title: 'Bagian akhir tiap ahli waris', lines }] };
}
