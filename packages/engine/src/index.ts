export type * from './types.js';

export { hitung } from './pipeline.js';
export { tambahKerabat, bolehUbahJenisKelamin, opsiRelasi, type Relasi } from './graf.js';
export { hitungMunasakhat } from './munasakhat.js';
export { KONFIGURASI_BAWAAN } from './types.js';
// Dipakai UI untuk menghitung isi checklist relatif ke seorang mayit (bukan untuk menghitung bagian).
export { turunkanPeran } from './stages/derivasi.js';
// Dipakai UI untuk hitungan berjalan "yang akan dibagi" di langkah Kewajiban (batas wasiat 1/3 tetap diputuskan engine).
export { hitungTirkah } from './stages/tirkah.js';
