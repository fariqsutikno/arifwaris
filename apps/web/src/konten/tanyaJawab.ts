// Tanya jawab kasus: satu kasus waris nyata (mis. sengketa keluarga) beserta penyelesaiannya dari ustadz atau
// lembaga fatwa, ditulis sebagai artikel. SELURUH ISI INI PLACEHOLDER: belum ada kasus maupun jawaban sungguhan.
// Isi hanya dengan jawaban yang sumbernya jelas dan sudah dicek tim keilmuan; jangan mengarang hukum di sini.

export const JENIS_TANYA_JAWAB = ['Saran ustadz', 'Fatwa'] as const;
export type JenisTanyaJawab = (typeof JENIS_TANYA_JAWAB)[number];

export interface KasusTanyaJawab {
  slug: string;
  judul: string;
  jenis: JenisTanyaJawab;
  /** Satu kalimat untuk kartu daftar. */
  ringkasan: string;
  /** Paragraf cerita kasus. */
  kasus: string[];
  /** Paragraf penyelesaian dari ustadz / fatwa. */
  penyelesaian: string[];
  /** Siapa yang menjawab: nama ustadz / lembaga fatwa, beserta rujukan terbitnya. */
  sumber: string;
}

export const DAFTAR_TANYA_JAWAB: KasusTanyaJawab[] = [
  { slug: 'contoh-sengketa-rumah', judul: '[Placeholder] Sengketa rumah peninggalan', jenis: 'Saran ustadz',
    ringkasan: 'Ringkasan satu kalimat tentang kasus ini akan ditulis di sini.',
    kasus: ['Cerita kasus akan ditulis di sini: siapa yang wafat, siapa ahli warisnya, dan apa yang dipersengketakan.',
      'Paragraf kedua cerita kasus.'],
    penyelesaian: ['Penyelesaian dari ustadz akan ditulis di sini.', 'Paragraf kedua penyelesaian.'],
    sumber: 'Nama ustadz · sumber (menyusul)' },
  { slug: 'contoh-harta-belum-dibagi', judul: '[Placeholder] Harta belum dibagi bertahun-tahun', jenis: 'Fatwa',
    ringkasan: 'Ringkasan satu kalimat tentang kasus ini akan ditulis di sini.',
    kasus: ['Cerita kasus akan ditulis di sini.'],
    penyelesaian: ['Ringkasan fatwa akan ditulis di sini.'],
    sumber: 'Lembaga fatwa · nomor fatwa (menyusul)' },
];
