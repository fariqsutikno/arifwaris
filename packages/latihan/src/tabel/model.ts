// Tipe tabel faraidh soal latihan (spec tabel B1): kolom, baris, isian pelajar, jangkar, hasil penilaian.
// Murni dan tanpa bahasa: judul kolom berupa id (`idJudul`), kalimatnya milik web (diksi). Pecahan = teks, angka = bigint.

import type { IdOrang } from '@waris/engine';
import type { Dimensi, Tahapan } from './qMatriks.js';

/** Daftar tertutup kolom Bagian (B2). */
export const PILIHAN_BAGIAN = ['1/2', '1/4', '1/8', '2/3', '1/3', '1/6', 'Ashabah', '1/6 + Ashabah', 'Terhalang'] as const;
export const BAGIAN_TERHALANG = 'Terhalang';

export interface KolomSoal {
  id: string;
  /** Id judul kolom ('bagian', 'asalMasalah', 'asalMasalahAkhir', ...); web menerjemahkannya lewat diksi. */
  idJudul: string;
  /** Dari Q-matriks (qDari): tahapan hitung dan dimensi kecakapan yang dibuktikan kolom ini. */
  tahapan: Tahapan;
  dimensi: Dimensi;
  jenis: 'pilih' | 'bulat';
  pilihan?: readonly string[];
  /** Kunci asal masalah/jami'ah; pelajar mengisi kepala kolom, sebanding diterima. */
  kepala?: bigint;
  terkunci?: boolean;
  /** Kolom pilihan acuan untuk menggabungkan sel kelompok (B4). */
  gabungDari?: string;
}

export interface BarisSoal {
  id: IdOrang;
  nama: string;
  /** id kolom → jawaban ('1/8', 'Ashabah', '24'); tidak ada = sel "–" atau diturunkan dari pilihan (Terhalang → 0). */
  kunci: Record<string, string>;
  /** id kolom → id kelompok engine, hanya untuk sel bersama (anggota > 1). */
  kelompok: Record<string, string>;
}

export interface TabelSoal { kolom: KolomSoal[]; baris: BarisSoal[] }
export type SusunanTabel = TabelSoal | { status: 'TIDAK_DIDUKUNG' };

export interface IsianTabel { kepala: Record<string, string>; sel: Record<IdOrang, Record<string, string>> }
export interface Jangkar { idBaris: IdOrang; idKolom: string }

export type HasilNilai =
  | { jenis: 'belumLengkap'; idKolom: string; idJudul: string; kepalaKosong: boolean; idBarisKosong: IdOrang[] }
  | { jenis: 'salah'; idKolom: string; idJudul: string; kepalaSalah: boolean; idBarisSalah: IdOrang[] }
  | { jenis: 'benar'; bentukTerkecil: Array<{ idKolom: string; idJudul: string; diisi: bigint; terkecil: bigint }> };

/** Hasil satu sel. `benarEcf`: benar bila dinilai terhadap isian pelajar sendiri di kolom sebelumnya [KH]; selalu ≥ `benar`. */
export interface HasilSel {
  /** Id baris, atau 'kepala' untuk kotak asal masalah/jami'ah di kepala kolom. */
  idBaris: IdOrang | 'kepala';
  benar: boolean;
  benarEcf: boolean;
  kosong: boolean;
}

export interface HasilKolom {
  idKolom: string;
  idJudul: string;
  status: 'benar' | 'salah' | 'belumLengkap';
  /** Sel bersama sekali (baris pertama kelompok); sel kepala terakhir. */
  sel: HasilSel[];
  /** Hanya bila kolom benar dengan kepala kelipatan kunci. */
  bentuk?: { diisi: bigint; terkecil: bigint };
}
