// Kasus tersimpan: hanya yang pengguna simpan lewat tombol Simpan di layar hasil; tanpa kedaluwarsa; ikut disinkron
// ke akun (spec akun pengguna). Beda dengan riwayat.ts ("Terakhir dibuka") yang otomatis dan hanya di perangkat.
// Disimpan berbentuk RiwayatTersimpan dengan kasus = objek JSON dari keJson (bigint sebagai teks).

import type { RiwayatTersimpan } from '@waris/data';
import { antre } from './akun/antrean';
import { dariJson, keJson, type Kasus } from './kasus';
import { bacaMentah, simpanMentah } from './penyimpanan';
import { ringkasKasus } from './riwayat';

const KUNCI_TERSIMPAN = 'arif-waris:tersimpan';

export const BATAS_JUDUL = 80;

export function bacaTersimpan(): Array<{ id: string; judul: string; disimpanPada: string; disematkan: boolean; kasus: Kasus }> {
  return semuaTersimpan().flatMap(baris => {
    const hasil = dariJson(JSON.stringify(baris.kasus));
    return hasil.berhasil ? [{ id: baris.id, judul: baris.judul, disimpanPada: baris.disimpanPada, disematkan: baris.disematkan ?? false, kasus: hasil.kasus }] : [];
  }).sort((a, b) => b.disimpanPada.localeCompare(a.disimpanPada));
}

/** Simpan kasus. Nama dan sematan buatan pengguna dipertahankan saat disimpan ulang (mis. simpan otomatis kasus khusus). */
export function simpanKasus(id: string, kasus: Kasus, judul?: string): void {
  const lama = semuaTersimpan().find(baris => baris.id === id);
  tulis({
    id, kasus: JSON.parse(keJson(kasus)), disimpanPada: waktuMaju(lama?.disimpanPada),
    judul: judul !== undefined ? bersihkanJudul(judul, kasus) : lama?.judul ?? ringkasKasus(kasus).judul,
    disematkan: lama?.disematkan ?? false,
  });
}

export function ubahJudul(id: string, judul: string): void {
  const lama = semuaTersimpan().find(baris => baris.id === id);
  if (!lama) return;
  const kasus = dariJson(JSON.stringify(lama.kasus));
  tulis({ ...lama, judul: bersihkanJudul(judul, kasus.berhasil ? kasus.kasus : undefined, lama.judul), disimpanPada: waktuMaju(lama.disimpanPada) });
}

export function sematkan(id: string, nilai: boolean): void {
  const lama = semuaTersimpan().find(baris => baris.id === id);
  if (lama) tulis({ ...lama, disematkan: nilai, disimpanPada: waktuMaju(lama.disimpanPada) });
}

function tulis(baris: RiwayatTersimpan): void {
  gantiSemuaTersimpan([baris, ...semuaTersimpan().filter(lain => lain.id !== baris.id)]);
  antre({ tabel: 'tersimpan', baris });
}

/** Nama kosong → ringkasan otomatis; panjang dibatasi. */
function bersihkanJudul(judul: string, kasus: Kasus | undefined, cadangan = ''): string {
  const bersih = judul.trim().slice(0, BATAS_JUDUL);
  return bersih || (kasus ? ringkasKasus(kasus).judul : cadangan);
}

/** Waktu sekarang, tapi tidak pernah <= waktu lama (trigger server menolak waktu yang tidak lebih baru). */
function waktuMaju(lama?: string): string {
  const lamaMs = lama ? Date.parse(lama) : 0;
  return new Date(Math.max(Date.now(), lamaMs + 1)).toISOString();
}

export function hapusTersimpan(id: string): void {
  gantiSemuaTersimpan(semuaTersimpan().filter(baris => baris.id !== id));
  antre({ tabel: 'hapus_tersimpan', id });
}

export const sudahTersimpan = (id: string, kasus: Kasus): boolean =>
  semuaTersimpan().some(baris => baris.id === id && JSON.stringify(baris.kasus) === keJson(kasus));

export function semuaTersimpan(): RiwayatTersimpan[] {
  try {
    const daftar: unknown = JSON.parse(bacaMentah(KUNCI_TERSIMPAN) ?? '[]');
    return Array.isArray(daftar) ? daftar.filter((baris): baris is RiwayatTersimpan => typeof baris?.id === 'string') : [];
  } catch {
    return [];
  }
}

export const gantiSemuaTersimpan = (daftar: RiwayatTersimpan[]): void => simpanMentah(KUNCI_TERSIMPAN, JSON.stringify(daftar));
