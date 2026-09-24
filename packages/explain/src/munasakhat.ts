import type { GrafKeluarga, HasilMunasakhat, IdOrang, LangkahJejak } from '@waris/engine';
import { rupiah } from './format.js';
import { jelaskan, type ExplainSection } from './narasi.js';
import { roleLabel } from './people.js';
import { joinAnd, line, s, type ExplainLine, type Segment } from './segments.js';
import { term } from './terms.js';

type Ok = Extract<HasilMunasakhat, { status: 'OK' }>;
type Combine = Extract<LangkahJejak, { jenis: 'MUNASAKHAT' }>;

export interface MunasakhatPart { title: string; sections: ExplainSection[] }
export interface MunasakhatExplanation { parts: MunasakhatPart[] }

const ORDINAL = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];

/**
 * Penjelasan munasakhat (bab 12): pembukaan + batas cakupan, pembagian tiap mayit (memakai `jelaskan`),
 * penggabungan jami'ah per mayit berikutnya, lalu hasil akhir.
 */
export function jelaskanMunasakhat(hasil: Ok, graf: GrafKeluarga, opsi: { mode?: 'cerita' | 'ringkas' } = {}): MunasakhatExplanation {
  const mention = makeMention(hasil, graf);
  const combines = hasil.jejak.filter((st): st is Combine => st.jenis === 'MUNASAKHAT');

  const parts: MunasakhatPart[] = [pembukaan(hasil, mention)];
  for (const [index, step] of hasil.langkahLangkah.entries()) {
    // Mayit berikutnya disebut dengan perannya ("anak perempuan"), bukan "almarhumah", supaya jelas siapa yang wafat.
    const named = index === 0 ? graf
      : { ...graf, orang: { ...graf.orang, [step.mayit]: { ...graf.orang[step.mayit]!, nama: mention(step.mayit).text } } };
    const sections = jelaskan(step.hasil, { ...named, idPewaris: step.mayit }, opsi).sections;
    const combine = combines.find(st => st.mayit === step.mayit);
    if (combine) sections.push(penggabungan(combine, mention));
    parts.push({
      title: index === 0 ? `Pembagian harta ${mention(step.mayit).text}` : `Bagian ${mention(step.mayit).text} diteruskan`,
      sections,
    });
  }
  parts.push(hasilAkhir(hasil, mention));
  return { parts };
}

// ─── Sebutan orang lintas mayit ───────────────────────────────────────────────

/**
 * Tanpa nama, peran disebut terhadap mayit pertama yang ia warisi: "istri", "anak laki-laki dari istri".
 * Sebutan yang sama untuk dua orang diberi urutan ("anak perempuan pertama").
 */
function makeMention(hasil: Ok, graf: GrafKeluarga): (id: IdOrang) => Segment {
  const idPewaris = hasil.langkahLangkah[0]!.mayit;
  const heirOf = (id: IdOrang) => {
    for (const step of hasil.langkahLangkah) {
      const status = step.hasil.statusOrang[id];
      if (status?.jenis === 'ahliWaris' || status?.jenis === 'mahjub') return { mayit: step.mayit, peran: status.peran };
    }
    return undefined;
  };
  const baseLabel = (id: IdOrang): string => {
    const person = graf.orang[id];
    if (person?.nama) return person.nama;
    if (id === idPewaris) return person?.jenisKelamin === 'P' ? 'almarhumah' : 'almarhum';
    const peran = heirOf(id);
    if (!peran) return 'kerabat';
    const label = roleLabel(peran.peran);
    return peran.mayit === idPewaris ? label : `${label} dari ${baseLabel(peran.mayit)}`;
  };

  const peers = new Map<string, IdOrang[]>();
  for (const id of Object.keys(graf.orang)) {
    if (id !== idPewaris && !heirOf(id)) continue;
    const label = baseLabel(id);
    peers.set(label, [...(peers.get(label) ?? []), id]);
  }
  return id => {
    const label = baseLabel(id);
    const same = peers.get(label) ?? [id];
    const text = same.length > 1 && !graf.orang[id]?.nama ? `${label} ${ORDINAL[same.indexOf(id)] ?? `ke-${same.indexOf(id) + 1}`}` : label;
    return { jenis: 'person', idOrangOrang: [id], text };
  };
}

// ─── Bagian ───────────────────────────────────────────────────────────────────

function pembukaan(hasil: Ok, mention: (id: IdOrang) => Segment): MunasakhatPart {
  const [first, ...later] = [hasil.langkahLangkah[0]!.mayit, ...deathsInOrder(hasil)];
  const pewaris = mention(first!);
  const lines: ExplainLine[] = [
    line(s`${pewaris} wafat. Sebelum hartanya dibagi, ${joinAnd(later.map(id => [mention(id)]))} ikut wafat, berurutan seperti itu. `
      .concat(s`Kasus seperti ini disebut ${term('munasakhat', 'munasakhat')}: bagian yang sudah menjadi hak orang yang wafat belakangan `,
        s`diteruskan kepada ahli warisnya.`), ['R12-1']),
    line(keadaanText(hasil.keadaan, pewaris), ['R12-2', 'R12-3']),
    line(s`Yang diteruskan hanyalah bagian dari harta ${pewaris} yang sampai kepada mereka, bukan pembagian waris atas seluruh harta mereka. `
      .concat(s`Hutang, wasiat, dan harta lain milik mereka diselesaikan oleh ahli warisnya masing-masing.`)),
  ];
  for (const skip of hasil.jejak.filter(st => st.jenis === 'MUNASAKHAT_DILEWATI')) {
    lines.push(line(s`${mention(skip.mayit)} tidak mendapat bagian dari harta ${pewaris}, jadi tidak ada yang diteruskan kepada ahli warisnya.`, skip.refs));
  }
  return { title: 'Kematian berantai', sections: [{ title: 'Apa yang terjadi', lines }] };
}

function keadaanText(keadaan: 1 | 2 | 3, pewaris: Segment): Segment[] {
  switch (keadaan) {
    case 1:
      return s`Yang wafat belakangan hanya meninggalkan ahli waris yang sama dengan sisa ahli waris ${pewaris}, dan bagian mereka `
        .concat(s`tidak berubah (keadaan pertama). Karena itu hasil akhirnya sama dengan membagi harta ${pewaris} langsung kepada `,
          s`yang masih hidup, seolah yang wafat belakangan tidak ada. Langkah bertahap di bawah tetap ditampilkan sebagai buktinya.`);
    case 2:
      return s`Ahli waris masing-masing yang wafat belakangan tidak ikut mewarisi dari ${pewaris} maupun dari yang lain `
        .concat(s`(keadaan kedua). Kitab menghitungnya dengan satu angka pembagi gabungan sekaligus; langkah bertahap di bawah `,
          s`memberi hasil yang sama.`);
    case 3:
      return s`Susunan ahli warisnya berubah dari satu kematian ke kematian berikutnya (keadaan ketiga), jadi bagian tiap orang `
        .concat(s`yang wafat diteruskan satu per satu.`);
  }
}

/** Urutan wafat setelah mayit pertama, termasuk yang diabaikan karena tidak mendapat bagian. */
function deathsInOrder(hasil: Ok): IdOrang[] {
  return hasil.jejak.flatMap(st => (st.jenis === 'MUNASAKHAT' || st.jenis === 'MUNASAKHAT_DILEWATI' ? [st.mayit] : []));
}

function penggabungan(st: Combine, mention: (id: IdOrang) => Segment): ExplainSection {
  const who = mention(st.mayit);
  const sebelum = st.jamiah / st.wafqMasalah;
  const lines: ExplainLine[] = [
    line(s`${who} mendapat ${st.saham} dari ${sebelum} bagian. Bagian itu dibagi kepada ahli warisnya, yang pembagiannya memakai ${st.masalah} bagian.`, ['R12-2']),
    line(relationText(st, who), ['R12-2']),
    line(s`Angka pembagi gabungan (${term('jamiah', "jami'ah")}) sekarang ${st.jamiah}:`, ['R12-2']),
    ...Object.entries(st.rincian).map(([id, barisTabel]) => {
      const terms = [
        ...(barisTabel.sebelum > 0n ? [`${barisTabel.sebelum} × ${st.wafqMasalah}`] : []),
        ...(barisTabel.dariMayit > 0n ? [`${barisTabel.dariMayit} × ${st.wafqSaham}`] : []),
      ];
      return line(s`${mention(id)}: ${terms.join(' + ')} = ${barisTabel.sesudah}.`);
    }),
  ];
  return { title: 'Menggabungkan dengan pembagian sebelumnya', lines };
}

function relationText(st: Combine, who: Segment): Segment[] {
  switch (st.hubungan) {
    case 'habis':
      return st.saham === st.masalah
        ? s`${st.saham} sama dengan ${st.masalah} (${term('tamatsul', 'tamatsul')}), jadi angka pembagi tidak perlu diperbesar.`
        : s`${st.saham} habis dibagi ${st.masalah}, jadi angka pembagi tidak perlu diperbesar; bagian ahli waris ${who} dikali ${st.wafqSaham}.`;
    case 'tawafuq':
      return s`${st.saham} dan ${st.masalah} sama-sama habis dibagi ${st.fpb} (${term('tawafuq', 'tawafuq')}). `
        .concat(s`Angka pembagi sebelumnya dikali ${st.masalah} ÷ ${st.fpb} = ${st.wafqMasalah} (${term('wafq', 'wafq')}), `,
          s`dan bagian ahli waris ${who} dikali ${st.saham} ÷ ${st.fpb} = ${st.wafqSaham}.`);
    case 'tabayun':
      return s`${st.saham} dan ${st.masalah} tidak bisa sama-sama dibagi kecuali oleh 1 (${term('tabayun', 'tabayun')}). `
        .concat(s`Angka pembagi sebelumnya dikali ${st.masalah}, dan bagian ahli waris ${who} dikali ${st.saham}.`);
  }
}

function hasilAkhir(hasil: Ok, mention: (id: IdOrang) => Segment): MunasakhatPart {
  const { ikhtishar, nominal, pembulatan } = hasil;
  const showNominal = hasil.jejak.some(st => st.jenis === 'TIRKAH' && st.kotor > 0n);
  const lines: ExplainLine[] = [];
  const diringkas = ikhtishar.jamiah !== hasil.jamiah;
  if (diringkas) {
    const faktor = hasil.jamiah / ikhtishar.jamiah;
    lines.push(line(s`Semua angka bisa diringkas dengan membagi ${faktor}: ${hasil.jamiah} menjadi ${ikhtishar.jamiah}.`, ['R12-2']));
  }
  for (const [id, saham] of Object.entries(hasil.saham)) {
    const ringkas = diringkas ? ` (diringkas ${ikhtishar.saham[id]}/${ikhtishar.jamiah})` : '';
    lines.push(line(s`${mention(id)}: ${saham}/${hasil.jamiah}${ringkas}${showNominal ? ` = ${rupiah(nominal[id]!)}` : ''}.`, ['R11-1']));
  }
  if (showNominal && pembulatan.sisaPembulatan > 0n) {
    lines.push(line(s`Selisih pembulatan ${rupiah(pembulatan.sisaPembulatan)} (per ${rupiah(pembulatan.satuan)}), belum dibagikan.`));
  }
  return { title: 'Hasil akhir', sections: [{ title: 'Bagian akhir tiap ahli waris', lines }] };
}
