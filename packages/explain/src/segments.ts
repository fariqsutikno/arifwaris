import type { IdOrang } from '@waris/engine';
import type { Pecahan } from '@waris/math';
import type { TermId } from './terms.js';

/**
 * Satu baris penjelasan = potongan berjenis. UI menampilkan `term` bergaris bawah + tooltip glosarium,
 * `orangIni` sebagai sebutan orang (bisa di-hover); `text` apa adanya.
 */
export type Segment =
  | { jenis: 'text'; text: string }
  | { jenis: 'orangIni'; daftarIdOrang: IdOrang[]; text: string }
  | { jenis: 'term'; term: TermId; text: string; example?: string };

export interface ExplainLine { segments: Segment[]; refs: string[] }

export const toPlainText = (line: ExplainLine): string => line.segments.map(s => s.text).join('');

type Part = string | number | bigint | Pecahan | Segment | Segment[];

const isFraction = (porsi: object): porsi is Pecahan => 'n' in porsi && 'd' in porsi;

/** Template bertag: `s\`${orangIni} mendapat ${fraction}\`` → Segment[]; teks berdampingan digabung. */
export function s(strings: TemplateStringsArray, ...parts: Part[]): Segment[] {
  const out: Segment[] = [];
  const pushText = (text: string) => {
    if (text === '') return;
    const last = out[out.length - 1];
    if (last?.jenis === 'text') out[out.length - 1] = { jenis: 'text', text: last.text + text };
    else out.push({ jenis: 'text', text });
  };
  strings.forEach((str, i) => {
    pushText(str);
    if (i >= parts.length) return;
    const porsi = parts[i]!;
    if (typeof porsi !== 'object') pushText(String(porsi));
    else if (Array.isArray(porsi)) porsi.forEach(p => (p.jenis === 'text' ? pushText(p.text) : out.push(p)));
    else if ('jenis' in porsi) (porsi.jenis === 'text' ? pushText(porsi.text) : out.push(porsi));
    else if (isFraction(porsi)) pushText(`${porsi.n}/${porsi.d}`);
  });
  return out;
}

/** Baris kalimat: potongan yang membuka kalimat (awal baris atau setelah ". ") diberi huruf kapital. */
export function line(segments: Segment[], refs: string[] = []): ExplainLine {
  const capitalize = (seg: Segment): Segment => ({ ...seg, text: seg.text.charAt(0).toUpperCase() + seg.text.slice(1) });
  const merged = s`${segments}`;   // satukan teks bersebelahan dari beberapa template
  const out = merged.map((seg, i) => {
    const previous = merged[i - 1];
    const opensSentence = i === 0 || (previous?.jenis === 'text' && /[.!?]\s$/.test(previous.text));
    return opensSentence ? capitalize(seg) : seg;
  });
  return { segments: out, refs };
}

/** "a", "a dan b", "a, b, dan c" — untuk daftar Segment[]. */
export function joinAnd(items: Segment[][]): Segment[] {
  return items.flatMap((item, i) => {
    if (i === 0) return item;
    const sep = i === items.length - 1 ? (items.length > 2 ? ', dan ' : ' dan ') : ', ';
    return [{ jenis: 'text' as const, text: sep }, ...item];
  });
}
