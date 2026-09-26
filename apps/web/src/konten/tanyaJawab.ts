// Tanya jawab kasus: satu kasus waris nyata (mis. sengketa keluarga) beserta penyelesaiannya dari ustadz atau
// lembaga fatwa. SELURUH ISI INI PLACEHOLDER: belum ada kasus maupun jawaban sungguhan. Isi hanya dengan jawaban
// yang sumbernya jelas dan sudah dicek tim keilmuan; jangan mengarang hukum di sini.

export interface KasusTanyaJawab {
  id: string;
  judul: string;
  kasus: string;
  penyelesaian: string;
  /** Siapa yang menjawab: nama ustadz / lembaga fatwa, beserta rujukan terbitnya. */
  sumber: string;
  jenis: 'Saran ustadz' | 'Fatwa';
}

export const DAFTAR_TANYA_JAWAB: KasusTanyaJawab[] = [
  { id: 'contoh-sengketa-rumah', judul: '[Placeholder] Sengketa rumah peninggalan', jenis: 'Saran ustadz',
    kasus: 'Cerita kasus akan ditulis di sini: siapa yang wafat, siapa ahli warisnya, dan apa yang dipersengketakan.',
    penyelesaian: 'Penyelesaian dari ustadz akan ditulis di sini.', sumber: 'Nama ustadz · sumber (menyusul)' },
  { id: 'contoh-harta-belum-dibagi', judul: '[Placeholder] Harta belum dibagi bertahun-tahun', jenis: 'Fatwa',
    kasus: 'Cerita kasus akan ditulis di sini.',
    penyelesaian: 'Ringkasan fatwa akan ditulis di sini.', sumber: 'Lembaga fatwa · nomor fatwa (menyusul)' },
];
