// Tipe tanya jawab (isinya konten jenis tanya_jawab di database): kasus nyata beserta penyelesaian dari ustadz/lembaga
// fatwa, kasus & penyelesaian berupa blok Markdown terbatas yang sama dengan materi.
import type { Blok } from './materi.js';

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
