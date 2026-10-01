// Kotak masuk notifikasi di perangkat: daftar kabar (streak, peringkat, konten baru, kemajuan, kasus) yang disimpan lokal.
// Menerima: catatNotifikasi dari sumber (SumberNotifikasi); menyerahkan: daftar ke lonceng, dan peristiwa ke notifikasi perangkat.
// Id yang sama dicatat sekali saja, jadi sumber boleh memanggilnya berulang (tiap muat halaman) tanpa menggandakan kabar.

import { bacaMentah, hapusMentah, simpanMentah } from '../penyimpanan';

export type JenisNotifikasi = 'streak' | 'peringkat' | 'konten' | 'belajar' | 'kasus';
export interface Notifikasi { id: string; jenis: JenisNotifikasi; judul: string; isi: string; waktu: number; dibaca: boolean; tautan?: string }
export type NotifikasiBaru = Omit<Notifikasi, 'waktu' | 'dibaca'>;

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

/** Mengembalikan true bila notifikasi baru dicatat (false: id sudah pernah dicatat). */
export function catatNotifikasi(baru: NotifikasiBaru, sekarang = Date.now()): boolean {
  const daftar = bacaNotifikasi();
  if (daftar.some(ini => ini.id === baru.id)) return false;
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
