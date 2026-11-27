// packages/content/src/ceklisReview.ts
// Butir checklist tahap "diperiksa" untuk soal kuis (spec-soal-kuis-ribuan 5.2). Urutan = nomor butir (1..5) di tabel
// ceklis_review; jumlahnya harus sama dengan jumlah_butir_ceklis() di supabase/migrations/20261127000003.
export const BUTIR_CEKLIS_REVIEW: readonly string[] = [
  'Jawaban benar sesuai KB dan rujukannya cocok.',
  'Setiap pengecoh mewakili salah paham yang masuk akal, alasannya benar.',
  'Kalimat soal jelas, tidak ambigu, tidak menebak dari panjang pilihan.',
  'Tingkat dan modul sesuai.',
  'Bahasa sesuai panduan gaya.',
];

export const JUMLAH_BUTIR_CEKLIS = BUTIR_CEKLIS_REVIEW.length;

/** Nomor butir dihitung dari 1, seperti di database. */
export const ceklisLengkap = (butirDicentang: Iterable<number>): boolean => {
  const dicentang = new Set(butirDicentang);
  return BUTIR_CEKLIS_REVIEW.every((_, indeks) => dicentang.has(indeks + 1));
};
