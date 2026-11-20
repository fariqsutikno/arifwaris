// Kontrak keluaran komponen tabel (spec 6.1): satu percobaan = isian + hasil SEMUA kolom, apa pun modenya.
// Pemanggil (layar) memutuskan XP, confetti, dan pencatatan memakai ini; komponen tidak memutuskan apa-apa.

import type { HasilKolom, IsianTabel, Jangkar } from './tabel/model.js';

export type ModeSoal = 'latihan' | 'ujian';

export interface PercobaanTabel {
  mode: ModeSoal;
  aksi: 'periksa' | 'kirim' | 'lihatJawaban';
  isian: IsianTabel;
  jangkar: Jangkar | null;
  hasilKolom: HasilKolom[];
  benarSemua: boolean;
}
