// Preferensi per pengguna di perangkat ini: tujuan pemakaian, tur yang sudah dilihat, dan jejak belajar terbaru.
// Catatan belajar (pelajaran selesai, latihan, skor kuis) pindah ke progres.ts. Akses penyimpanan mentah ada di
// penyimpanan.ts. Bukan bagian Kasus.

import { useSyncExternalStore } from 'react';
import type { Preferensi } from '@waris/data';
import { antre } from './akun/antrean';
import { bacaMentah, daftarKunci, hapusMentah, simpanMentah } from './penyimpanan';

export type Tujuan = 'hitung' | 'belajar';

const KUNCI_TUJUAN = 'arif-waris:tujuan';
const AWALAN_TUR = 'arif-waris:tur:';
const AWALAN_PILIHAN = 'arif-waris:pilihan:';
const KUNCI_PREFERENSI_DIUBAH = 'arif-waris:preferensi-diubah';

/** Preferensi yang ikut ke akun (spec "Data lokal"); aktivitas & skor paket tetap di perangkat. */
const ikutAkun = (kunci: string) =>
  [KUNCI_TUJUAN, KUNCI_BAHASA, KUNCI_UKURAN_BACA].includes(kunci) || kunci.startsWith(AWALAN_TUR) || kunci.startsWith(AWALAN_PILIHAN);

/** Tulis satu kunci preferensi; bila termasuk yang disinkron, antre bentuk terbarunya. */
function simpanPreferensi(kunci: string, nilai: string): void {
  // Nilai sama tidak dianggap perubahan: kalau dicap waktu, perangkat ini jadi "terbaru" dan menimpa perangkat lain.
  if (bacaMentah(kunci) === nilai) return;
  simpanMentah(kunci, nilai);
  if (ikutAkun(kunci)) {
    simpanMentah(KUNCI_PREFERENSI_DIUBAH, new Date().toISOString());
    const baris = kumpulPreferensi();
    if (baris) antre({ tabel: 'preferensi', baris });
  }
}

/** Semua preferensi yang ikut akun, sebagai satu baris; null bila belum pernah diubah. */
export function kumpulPreferensi(): Preferensi | null {
  const diubahPada = bacaMentah(KUNCI_PREFERENSI_DIUBAH);
  if (!diubahPada) return null;
  const isi = Object.fromEntries(daftarKunci('arif-waris:').filter(ikutAkun).map(kunci => [kunci, bacaMentah(kunci)]));
  return { isi, diubahPada };
}

/** Tulis kembali preferensi dari akun (saat masuk/tarik); tidak mengantre balik. */
export function terapkanPreferensi(p: Preferensi | null): void {
  if (!p) return;
  daftarKunci('arif-waris:').filter(ikutAkun).forEach(hapusMentah);
  Object.entries(p.isi).forEach(([kunci, nilai]) => simpanMentah(kunci, nilai as string));
  simpanMentah(KUNCI_PREFERENSI_DIUBAH, p.diubahPada);
  pendengarBahasa.forEach(dengar => dengar());
}

export function bacaTujuan(): Tujuan | null {
  const nilai = bacaMentah(KUNCI_TUJUAN);
  return nilai === 'hitung' || nilai === 'belajar' ? nilai : null;
}

export const simpanTujuan = (tujuan: Tujuan): void => simpanPreferensi(KUNCI_TUJUAN, tujuan);
export const sudahLihatTur = (kunci: string): boolean => bacaMentah(AWALAN_TUR + kunci) === '1';
export const tandaiTurDilihat = (kunci: string): void => simpanPreferensi(AWALAN_TUR + kunci, '1');

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
export const bacaPilihan = (kunci: string): string | null => bacaMentah(AWALAN_PILIHAN + kunci);
export const simpanPilihan = (kunci: string, nilai: string): void => simpanPreferensi(AWALAN_PILIHAN + kunci, nilai);

/** Ukuran huruf artikel (px) yang dipilih pembaca lewat tombol A−/A+. */
const KUNCI_UKURAN_BACA = 'arif-waris:ukuran-baca';
export const UKURAN_BACA = [15, 16, 18, 20, 22] as const;
export function bacaUkuranBaca(): number {
  const nilai = Number(bacaMentah(KUNCI_UKURAN_BACA));
  return (UKURAN_BACA as readonly number[]).includes(nilai) ? nilai : 18;
}
export const simpanUkuranBaca = (ukuran: number): void => simpanPreferensi(KUNCI_UKURAN_BACA, String(ukuran));

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
  simpanPreferensi(KUNCI_BAHASA, bahasa);
  pendengarBahasa.forEach(dengar => dengar());
}

/** Bahasa aktif sebagai state React: semua komponen ikut berganti saat tombol bahasa ditekan. */
export const useBahasa = (): Bahasa => useSyncExternalStore(dengar => {
  pendengarBahasa.add(dengar);
  return () => pendengarBahasa.delete(dengar);
}, bacaBahasa);
