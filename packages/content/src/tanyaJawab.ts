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
  /** Versi Arab di berkas yang sama: baris `judul-ar:`/`ringkasan-ar:`/`sumber-ar:` dan bagian `### Kasus (ar)`/`### Penyelesaian (ar)`. */
  ar?: { judul: string; ringkasan: string; sumber: string; kasus?: Blok[]; penyelesaian?: Blok[] };
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
    const isiOpsional = (nama: string) => {
      const ditemukan = subbagian.find(teks => teks.split('\n')[0]!.trim() === nama);
      return ditemukan === undefined ? undefined : bacaBlok(`tanya jawab ${judul}`, ditemukan.split('\n').slice(1).join('\n'));
    };
    const isi = (nama: string) => isiOpsional(nama) ?? (() => { throw galat(`bagian ### ${nama} tidak ada`); })();
    const kolomOpsional = (nama: string) => barisKepala.find(baris => baris.startsWith(`${nama}:`))?.slice(nama.length + 1).trim();
    const kasusArab = isiOpsional('Kasus (ar)');
    const penyelesaianArab = isiOpsional('Penyelesaian (ar)');
    const ada = kolomOpsional('judul-ar') || kolomOpsional('ringkasan-ar') || kolomOpsional('sumber-ar') || kasusArab || penyelesaianArab;
    const kolomArab = (nama: string) => kolomOpsional(`${nama}-ar`) || (() => { throw galat(`baris ${nama}-ar: kosong padahal ada versi Arab`); })();
    const jenis = kolom('jenis');
    if (!(JENIS_TANYA_JAWAB as readonly string[]).includes(jenis)) throw galat(`jenis "${jenis}" tidak dikenal`);
    return {
      slug: slug(judul), judul, jenis: jenis as JenisTanyaJawab, ringkasan: kolom('ringkasan'),
      kasus: isi('Kasus'), penyelesaian: isi('Penyelesaian'), sumber: kolom('sumber'),
      ...(ada ? { ar: {
        judul: kolomArab('judul'), ringkasan: kolomArab('ringkasan'), sumber: kolomArab('sumber'),
        ...(kasusArab ? { kasus: kasusArab } : {}), ...(penyelesaianArab ? { penyelesaian: penyelesaianArab } : {}),
      } } : {}),
    };
  });
}

export const DAFTAR_TANYA_JAWAB: KasusTanyaJawab[] = bacaTanyaJawab(tanyaJawabMd);
