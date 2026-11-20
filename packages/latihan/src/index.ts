// Jalur murni soal → kasus → engine → tabel → nilai. Dipakai web dan (nanti) edge function penilaian.
// Aturan fikih tetap di @waris/engine; paket ini hanya cara aplikasi memakai engine untuk soal.

export * from './kasus.js';
export * from './grafAhliWaris.js';
export * from './jalankan.js';
export * from './soal.js';
export * from './kejadian.js';
export * from './angka.js';
export * from './tabel/model.js';
export * from './tabel/susun.js';
export * from './tabel/jangkar.js';
export * from './tabel/nilai.js';
