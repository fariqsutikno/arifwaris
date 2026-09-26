/// <reference path="./raw.d.ts" />
// Tanya jawab dari `docs/tanya-jawab.md`: `## judul`, baris `jenis:`/`ringkasan:`/`sumber:`, lalu `### Kasus` dan
// `### Penyelesaian` berisi blok Markdown terbatas yang sama dengan materi. Isi rusak = galat, bukan diam-diam.
import tanyaJawabMd from '../../../docs/tanya-jawab.md?raw';
import { slug } from './glossary.js';
import { bacaBlok, type Blok } from './materi.js';

export const JENIS_TANYA_JAWAB = ['Saran ustadz', 'Fatwa'] as const;
export type JenisTanyaJawab = (typeof JENIS_TANYA_JAWAB)[number];

export interface KasusTanyaJawab {
  slug: string;
  judul: string;
  jenis: JenisTanyaJawab;
  /** Satu kalimat untuk kartu daftar. */
  ringkasan: string;
  kasus: Blok[];
  penyelesaian: Blok[];
  /** Siapa yang menjawab: nama ustadz / lembaga fatwa, beserta rujukan terbitnya. */
  sumber: string;
}

export function bacaTanyaJawab(teksMarkdown: string): KasusTanyaJawab[] {
  return teksMarkdown.split(/^## /m).slice(1).map(bagian => {
    const [kepala = '', ...subbagian] = bagian.split(/^### /m);
    const [judulMentah = '', ...barisKepala] = kepala.split('\n');
    const judul = judulMentah.trim();
    const galat = (pesan: string) => new Error(`tanya jawab "${judul}": ${pesan}`);
    const kolom = (nama: string) => {
      const nilai = barisKepala.find(baris => baris.startsWith(`${nama}:`))?.slice(nama.length + 1).trim();
      if (!nilai) throw galat(`baris ${nama}: kosong`);
      return nilai;
    };
    const isi = (nama: string) => {
      const ditemukan = subbagian.find(teks => teks.split('\n')[0]!.trim() === nama);
      if (!ditemukan) throw galat(`bagian ### ${nama} tidak ada`);
      return bacaBlok(`tanya jawab ${judul}`, ditemukan.split('\n').slice(1).join('\n'));
    };
    const jenis = kolom('jenis');
    if (!(JENIS_TANYA_JAWAB as readonly string[]).includes(jenis)) throw galat(`jenis "${jenis}" tidak dikenal`);
    return {
      slug: slug(judul), judul, jenis: jenis as JenisTanyaJawab, ringkasan: kolom('ringkasan'),
      kasus: isi('Kasus'), penyelesaian: isi('Penyelesaian'), sumber: kolom('sumber'),
    };
  });
}

export const DAFTAR_TANYA_JAWAB: KasusTanyaJawab[] = bacaTanyaJawab(tanyaJawabMd);
