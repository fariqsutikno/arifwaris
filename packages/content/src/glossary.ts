/// <reference path="./raw.d.ts" />
import glosariumMd from '../../../docs/kb/15_glosarium.md?raw';

export interface GlossaryEntry {
  /** Slug istilah pertama; dipakai `packages/explain` sebagai TermId. */
  id: string;
  /** Slug semua sinonim di kolom Istilah ("Ta'shib / 'Ashabah" → tashib, ashabah). */
  aliases: string[];
  istilah: string;
  arab: string;
  makna: string;
  /** Padanan bahasa sehari-hari untuk tooltip; kosong bila belum ditulis di KB. */
  artiAwam?: string;
}

export const slug = (istilah: string): string =>
  istilah.toLowerCase().replace(/['’ʿ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Parse tabel glosarium (bab 15): | Istilah | Arab | Makna | Arti awam |. */
export function parseGlossary(markdown: string): GlossaryEntry[] {
  return markdown.split('\n')
    .filter(line => line.startsWith('| ') && !line.startsWith('| Istilah'))
    .map(line => {
      const [istilah = '', arab = '', makna = '', artiAwam = ''] = line.split('|').slice(1, -1).map(cell => cell.trim());
      const aliases = istilah.split('/').map(slug);
      return { id: aliases[0]!, aliases, istilah, arab, makna, ...(artiAwam ? { artiAwam } : {}) };
    });
}

export const GLOSSARY: GlossaryEntry[] = parseGlossary(glosariumMd);

const byAlias = new Map(GLOSSARY.flatMap(entry => entry.aliases.map(alias => [alias, entry] as const)));
export const findTerm = (id: string): GlossaryEntry | undefined => byAlias.get(id);
