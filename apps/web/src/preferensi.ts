// Preferensi per pengguna di perangkat ini: tujuan pemakaian, tur yang sudah dilihat, dan jejak belajar terbaru.
// Catatan belajar (pelajaran selesai, latihan, skor kuis) pindah ke progres.ts. Akses penyimpanan mentah ada di
// penyimpanan.ts. Bukan bagian Kasus.

import { useSyncExternalStore } from 'react';
import { bacaMentah, simpanMentah } from './penyimpanan';

export type Tujuan = 'hitung' | 'belajar';

const KUNCI_TUJUAN = 'arif-waris:tujuan';
const AWALAN_TUR = 'arif-waris:tur:';

export function bacaTujuan(): Tujuan | null {
  const nilai = bacaMentah(KUNCI_TUJUAN);
  return nilai === 'hitung' || nilai === 'belajar' ? nilai : null;
}

export const simpanTujuan = (tujuan: Tujuan): void => simpanMentah(KUNCI_TUJUAN, tujuan);
export const sudahLihatTur = (kunci: string): boolean => bacaMentah(AWALAN_TUR + kunci) === '1';
export const tandaiTurDilihat = (kunci: string): void => simpanMentah(AWALAN_TUR + kunci, '1');

/** Jejak belajar terbaru untuk beranda Belajar ("Terakhir kamu…"). Terbaru di atas, satu entri per jenis+kode. */
export interface Aktivitas { jenis: 'pelajaran' | 'soal' | 'kuis'; kode: string; judul: string; waktu: number; hasil?: string }
const KUNCI_AKTIVITAS = 'arif-waris:aktivitas';
const BATAS_AKTIVITAS = 20;

export function bacaAktivitas(): Aktivitas[] {
  try {
    const daftar: unknown = JSON.parse(bacaMentah(KUNCI_AKTIVITAS) ?? '[]');
    return Array.isArray(daftar) ? daftar.filter((isi): isi is Aktivitas => typeof isi?.kode === 'string' && typeof isi?.waktu === 'number') : [];
  } catch {
    return [];
  }
}

export function catatAktivitas(aktivitas: Aktivitas): void {
  const lain = bacaAktivitas().filter(isi => isi.jenis !== aktivitas.jenis || isi.kode !== aktivitas.kode);
  simpanMentah(KUNCI_AKTIVITAS, JSON.stringify([aktivitas, ...lain].slice(0, BATAS_AKTIVITAS)));
}

/** Hapus satu jejak (jenis+kode), atau semua jejak bila tanpa argumen. */
export function hapusAktivitas(aktivitas?: Pick<Aktivitas, 'jenis' | 'kode'>): void {
  const sisa = aktivitas ? bacaAktivitas().filter(isi => isi.jenis !== aktivitas.jenis || isi.kode !== aktivitas.kode) : [];
  simpanMentah(KUNCI_AKTIVITAS, JSON.stringify(sisa));
}

/** Pilihan kecil yang diingat per perangkat (mis. mode pembahasan kuis). */
export const bacaPilihan = (kunci: string): string | null => bacaMentah(`arif-waris:pilihan:${kunci}`);
export const simpanPilihan = (kunci: string, nilai: string): void => simpanMentah(`arif-waris:pilihan:${kunci}`, nilai);

/** Ukuran huruf artikel (px) yang dipilih pembaca lewat tombol A−/A+. */
const KUNCI_UKURAN_BACA = 'arif-waris:ukuran-baca';
export const UKURAN_BACA = [15, 16, 18, 20, 22] as const;
export function bacaUkuranBaca(): number {
  const nilai = Number(bacaMentah(KUNCI_UKURAN_BACA));
  return (UKURAN_BACA as readonly number[]).includes(nilai) ? nilai : 18;
}
export const simpanUkuranBaca = (ukuran: number): void => simpanMentah(KUNCI_UKURAN_BACA, String(ukuran));

/**
 * Bahasa tampilan untuk santri: 'id+ar' = istilah & ahli waris diberi padanan Arab;
 * 'ar' = tampilan Arab kanan-ke-kiri + penjelasan langkah berbahasa Arab (materi/FAQ/soal masih Indonesia).
 */
export type Bahasa = 'id' | 'id+ar' | 'ar';
export const DAFTAR_BAHASA: Array<{ nilai: Bahasa; label: string }> = [
  { nilai: 'id', label: 'Indonesia' }, { nilai: 'id+ar', label: 'Indonesia + istilah Arab' }, { nilai: 'ar', label: 'العربية' },
];
const KUNCI_BAHASA = 'arif-waris:bahasa';
const pendengarBahasa = new Set<() => void>();

export function bacaBahasa(): Bahasa {
  const nilai = bacaMentah(KUNCI_BAHASA);
  return DAFTAR_BAHASA.some(bahasa => bahasa.nilai === nilai) ? nilai as Bahasa : 'id';
}
export function simpanBahasa(bahasa: Bahasa): void {
  simpanMentah(KUNCI_BAHASA, bahasa);
  pendengarBahasa.forEach(dengar => dengar());
}

/** Bahasa aktif sebagai state React: semua komponen ikut berganti saat tombol bahasa ditekan. */
export const useBahasa = (): Bahasa => useSyncExternalStore(dengar => {
  pendengarBahasa.add(dengar);
  return () => pendengarBahasa.delete(dengar);
}, bacaBahasa);
