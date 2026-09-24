import type { PersonId } from '@waris/engine';
import type { Fraction } from '@waris/math';
import type { TermId } from './terms.js';

/**
 * Satu baris penjelasan = potongan berjenis. UI menampilkan `term` bergaris bawah + tooltip glosarium,
 * `person` sebagai sebutan orang (bisa di-hover); `text` apa adanya.
 */
export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'person'; personIds: PersonId[]; text: string }
  | { kind: 'term'; term: TermId; text: string; example?: string };

export interface ExplainLine { segments: Segment[]; refs: string[] }

export const toPlainText = (line: ExplainLine): string => line.segments.map(s => s.text).join('');

type Part = string | number | bigint | Fraction | Segment | Segment[];

const isFraction = (part: object): part is Fraction => 'n' in part && 'd' in part;

/** Template bertag: `s\`${person} mendapat ${fraction}\`` → Segment[]; teks berdampingan digabung. */
export function s(strings: TemplateStringsArray, ...parts: Part[]): Segment[] {
  const out: Segment[] = [];
  const pushText = (text: string) => {
    if (text === '') return;
    const last = out[out.length - 1];
    if (last?.kind === 'text') out[out.length - 1] = { kind: 'text', text: last.text + text };
    else out.push({ kind: 'text', text });
  };
  strings.forEach((str, i) => {
    pushText(str);
    if (i >= parts.length) return;
    const part = parts[i]!;
    if (typeof part !== 'object') pushText(String(part));
    else if (Array.isArray(part)) part.forEach(p => (p.kind === 'text' ? pushText(p.text) : out.push(p)));
    else if ('kind' in part) (part.kind === 'text' ? pushText(part.text) : out.push(part));
    else if (isFraction(part)) pushText(`${part.n}/${part.d}`);
  });
  return out;
}

/** Baris kalimat: potongan yang membuka kalimat (awal baris atau setelah ". ") diberi huruf kapital. */
export function line(segments: Segment[], refs: string[] = []): ExplainLine {
  const capitalize = (seg: Segment): Segment => ({ ...seg, text: seg.text.charAt(0).toUpperCase() + seg.text.slice(1) });
  const merged = s`${segments}`;   // satukan teks bersebelahan dari beberapa template
  const out = merged.map((seg, i) => {
    const previous = merged[i - 1];
    const opensSentence = i === 0 || (previous?.kind === 'text' && /[.!?]\s$/.test(previous.text));
    return opensSentence ? capitalize(seg) : seg;
  });
  return { segments: out, refs };
}

/** "a", "a dan b", "a, b, dan c" — untuk daftar Segment[]. */
export function joinAnd(items: Segment[][]): Segment[] {
  return items.flatMap((item, i) => {
    if (i === 0) return item;
    const sep = i === items.length - 1 ? (items.length > 2 ? ', dan ' : ' dan ') : ', ';
    return [{ kind: 'text' as const, text: sep }, ...item];
  });
}
