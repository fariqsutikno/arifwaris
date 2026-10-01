// Kotak masuk notifikasi di perangkat: daftar kabar (streak, peringkat, konten baru, kemajuan, kasus) yang disimpan lokal.
// Menerima: catatNotifikasi dari sumber (SumberNotifikasi); menyerahkan: daftar ke lonceng, dan peristiwa ke notifikasi perangkat.
// Id yang sama dicatat sekali saja, jadi sumber boleh memanggilnya berulang (tiap muat halaman) tanpa menggandakan kabar.
// Maksimal satu notifikasi per hari (keputusan 2026-10-02): kandidat kedua di hari yang sama hanya menang bila lebih penting,
// dan menggantikan yang pertama; selain itu dibuang.

import { bacaMentah, hapusMentah, simpanMentah } from '../penyimpanan';

export type JenisNotifikasi = 'streak' | 'peringkat' | 'konten' | 'belajar' | 'kasus';
/** `prioritas` lebih tinggi = lebih penting; dipakai memilih satu-satunya notifikasi per hari. */
export interface Notifikasi { id: string; jenis: JenisNotifikasi; judul: string; isi: string; prioritas?: number; waktu: number; dibaca: boolean; tautan?: string }
export type NotifikasiBaru = Omit<Notifikasi, 'waktu' | 'dibaca' | 'prioritas'> & { prioritas: number };

const KUNCI = 'arif-waris:notifikasi';
const BATAS_TERSIMPAN = 40;
export const PERISTIWA_NOTIFIKASI = 'arif-waris:notifikasi';
export const PERISTIWA_NOTIFIKASI_BARU = 'arif-waris:notifikasi-baru';

export function bacaNotifikasi(): Notifikasi[] {
  try {
    const mentah = bacaMentah(KUNCI);
    const daftar: unknown = mentah ? JSON.parse(mentah) : [];
    return Array.isArray(daftar) ? daftar.filter(ini => ini && typeof ini.id === 'string') as Notifikasi[] : [];
  } catch {
    return [];
  }
}

const simpan = (daftar: Notifikasi[]) => {
  simpanMentah(KUNCI, JSON.stringify(daftar.slice(0, BATAS_TERSIMPAN)));
  window.dispatchEvent(new Event(PERISTIWA_NOTIFIKASI));
};

const sehari = (a: number, b: number): boolean => new Date(a).toDateString() === new Date(b).toDateString();

/** Mengembalikan true bila notifikasi baru dicatat (false: id sudah ada, atau kalah penting dari kabar hari ini). */
export function catatNotifikasi(baru: NotifikasiBaru, sekarang = Date.now()): boolean {
  let daftar = bacaNotifikasi();
  if (daftar.some(ini => ini.id === baru.id)) return false;
  const kabarHariIni = daftar.find(ini => sehari(ini.waktu, sekarang));
  if (kabarHariIni) {
    if (baru.prioritas <= (kabarHariIni.prioritas ?? 0)) return false;
    daftar = daftar.filter(ini => ini !== kabarHariIni);
  }
  const lengkap: Notifikasi = { ...baru, waktu: sekarang, dibaca: false };
  simpan([lengkap, ...daftar]);
  window.dispatchEvent(new CustomEvent(PERISTIWA_NOTIFIKASI_BARU, { detail: lengkap }));
  return true;
}

export const jumlahBelumDibaca = (): number => bacaNotifikasi().filter(ini => !ini.dibaca).length;
export const tandaiSemuaDibaca = (): void => simpan(bacaNotifikasi().map(ini => ({ ...ini, dibaca: true })));
export function hapusSemuaNotifikasi(): void {
  hapusMentah(KUNCI);
  window.dispatchEvent(new Event(PERISTIWA_NOTIFIKASI));
}
