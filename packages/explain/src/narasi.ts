import type { EngineResult, FamilyGraph } from '@waris/engine';
import { ceritaSections, type Section } from './cerita.js';
import { makeCtx } from './context.js';
import { ringkasSections } from './ringkas.js';

export type ExplainSection = Section;
export interface Explanation { sections: ExplainSection[] }

/**
 * Lapis 2 engine-contract: langkah perhitungan dari trace + tabel. Tiap baris = potongan berjenis
 * (teks, orang, istilah bertooltip) + `refs` untuk lapis dalil. Nama berubah → panggil ulang (murah, tanpa engine).
 * - 'cerita' (default): untuk orang awam, bertutur langkah demi langkah.
 * - 'ringkas': untuk pelajar/ustadz, istilah dulu lalu angka.
 */
export function explain(
  result: Extract<EngineResult, { status: 'OK' }>,
  graph: FamilyGraph,
  options: { mode?: 'cerita' | 'ringkas' } = {},
): Explanation {
  const ctx = makeCtx(result, graph);
  const sections = options.mode === 'ringkas' ? ringkasSections(ctx) : ceritaSections(ctx);
  return { sections: sections.map((section, i) => ({ ...section, title: `Langkah ${i + 1} — ${section.title}` })) };
}
