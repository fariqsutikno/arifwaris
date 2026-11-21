// Kejadian percobaan append-only (spec 2.1) dan kontrak keluaran komponen tabel (spec 6.1).
// Satu aksi pelajar (buka soal, Periksa, Kirim, Lihat jawaban) = satu kejadian; nilai, XP, rekor, dan profil
// nantinya fungsi murni atas daftar kejadian. Tipe saja plus penggabungan himpunan; penyimpanan milik pemanggil.

import type { Ruleset } from '@waris/engine';
import type { IdSoal } from './soal.js';
import type { HasilKolom, IsianTabel, Jangkar } from './tabel/model.js';
import type { KeputusanGharqa } from './tabel/susunGharqa.js';

export type ModeSoal = 'latihan' | 'ujian';
export type JenisSoal = 'biasa' | 'munasakhat' | 'dzawilArham' | 'mafqud' | 'khuntsa' | 'haml' | 'gharqa';

/** Soal gharqa: keputusan pelajar + isian tiap tabel harta yang sudah dikerjakan (server menilai semuanya sekaligus). */
export interface IsianGharqa {
  keputusan: KeputusanGharqa;
  harta: Array<{ mayit: string; isian: IsianTabel; jangkar: Jangkar | null }>;
}

export interface PercobaanTabel {
  mode: ModeSoal;
  aksi: 'periksa' | 'kirim' | 'lihatJawaban';
  isian: IsianTabel;
  jangkar: Jangkar | null;
  /** Hanya soal gharqa; isian/jangkar di atas diabaikan pencatat. */
  gharqa?: IsianGharqa;
  hasilKolom: HasilKolom[];
  benarSemua: boolean;
}

export interface KejadianPercobaan {
  /** uuid buatan klien → kirim ulang tidak dobel. */
  id: string;
  /** Satu "membuka soal" = satu sesi; Periksa berulang berbagi id ini. */
  idSesiSoal: string;
  soalId: IdSoal;
  /** revisi.id konten yang dikerjakan (isi + bobot beku). */
  revisiSoal: string;
  jenisSoal: JenisSoal;
  mode: ModeSoal;
  konteks: { jenis: 'mandiri' } | { jenis: 'tugas'; idTugas: string };
  /** `buka` = soal dibuka (waktu pengerjaan); tanpa isian dan hasil. */
  aksi: 'buka' | PercobaanTabel['aksi'];
  /** null untuk buka, lihatJawaban tanpa isian, dan soal kartu lama (belum bertabel). */
  isian: IsianTabel | null;
  jangkar: Jangkar | null;
  /** Soal gharqa saja: menggantikan isian/jangkar (keduanya null). Di server disimpan di kolom `isian`. */
  gharqa?: IsianGharqa | null;
  /** hasilKolom dan benarSemua hanya untuk tampilan lokal, tidak pernah dianggap kebenaran: server menilai ulang semua kejadian (spec 2.6). */
  hasilKolom: HasilKolom[] | null;
  benarSemua: boolean;
  /** Jam perangkat, hanya informasi (lama mengerjakan); tidak dipercaya. */
  dimulaiPada: string;
  /** Diisi server; satu-satunya waktu yang dipercaya. */
  diterimaPada?: string;
  versi: { engine: string; ruleset: Ruleset; madzhab: string; kunci: string };
}

/** Gabungan himpunan berdasarkan id: kejadian tidak pernah saling menimpa, dua perangkat tidak menggandakan. Urutan: yang pertama dulu. */
export function gabungKejadian(a: readonly KejadianPercobaan[], b: readonly KejadianPercobaan[]): KejadianPercobaan[] {
  const hasil = new Map(a.map(kejadian => [kejadian.id, kejadian]));
  for (const kejadian of b) if (!hasil.has(kejadian.id)) hasil.set(kejadian.id, kejadian);
  return [...hasil.values()];
}
