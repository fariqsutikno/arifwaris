/// <reference path="./raw.d.ts" />
// Glosarium diambil langsung dari tabel KB bab 15 (Istilah | Arab | Makna | Arti awam | Contoh).
// Tiap istilah diberi id slug; sinonim di kolom Istilah ("Ta'shib / 'Ashabah") ikut bisa dicari.
import glosariumMd from '../../../docs/kb/15_glosarium.md?raw';

export interface EntriGlosarium {
  /** Slug istilah pertama; dipakai `packages/jelaskan` sebagai TermId. */
  id: string;
  /** Slug semua sinonim di kolom Istilah ("Ta'shib / 'Ashabah" → tashib, ashabah). */
  sinonim: string[];
  istilah: string;
  arab: string;
  makna: string;
  /** Padanan bahasa sehari-hari untuk tooltip; kosong bila belum ditulis di KB. */
  artiAwam?: string;
  /** Contoh dari kasus uji bab 16 (draf, perlu review); kosong bila belum ada kasus yang pas. */
  contoh?: string;
}

export const slug = (istilah: string): string =>
  istilah.toLowerCase().replace(/['’ʿ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Parse tabel glosarium (bab 15): | Istilah | Arab | Makna | Arti awam | Contoh |. */
export function bacaGlosarium(teksMarkdown: string): EntriGlosarium[] {
  return teksMarkdown.split('\n')
    .filter(baris => baris.startsWith('| ') && !baris.startsWith('| Istilah'))
    .map(baris => {
      const [istilah = '', arab = '', makna = '', artiAwam = '', contoh = ''] = baris.split('|').slice(1, -1).map(isi => isi.trim());
      const sinonim = istilah.split('/').map(slug);
      return { id: sinonim[0]!, sinonim, istilah, arab, makna, ...(artiAwam ? { artiAwam } : {}), ...(contoh ? { contoh } : {}) };
    });
}

export const GLOSARIUM: EntriGlosarium[] = bacaGlosarium(glosariumMd);

const menurutSinonim = new Map(GLOSARIUM.flatMap(entri => entri.sinonim.map(sinonimIni => [sinonimIni, entri] as const)));
export const cariIstilah = (id: string): EntriGlosarium | undefined => menurutSinonim.get(id);
