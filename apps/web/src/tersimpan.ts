// Kasus tersimpan: hanya yang pengguna simpan lewat tombol Simpan di layar hasil; tanpa kedaluwarsa; ikut disinkron
// ke akun (spec akun pengguna). Beda dengan riwayat.ts ("Terakhir dibuka") yang otomatis dan hanya di perangkat.
// Disimpan berbentuk RiwayatTersimpan dengan kasus = objek JSON dari keJson (bigint sebagai teks).

import type { RiwayatTersimpan } from '@waris/data';
import { antre } from './akun/antrean';
import { dariJson, keJson, type Kasus } from './kasus';
import { bacaMentah, simpanMentah } from './penyimpanan';
import { ringkasKasus } from './riwayat';

const KUNCI_TERSIMPAN = 'arif-waris:tersimpan';

export function bacaTersimpan(): Array<{ id: string; judul: string; disimpanPada: string; kasus: Kasus }> {
  return semuaTersimpan().flatMap(baris => {
    const hasil = dariJson(JSON.stringify(baris.kasus));
    return hasil.berhasil ? [{ id: baris.id, judul: baris.judul, disimpanPada: baris.disimpanPada, kasus: hasil.kasus }] : [];
  }).sort((a, b) => b.disimpanPada.localeCompare(a.disimpanPada));
}

export function simpanKasus(id: string, kasus: Kasus): void {
  const baris: RiwayatTersimpan = { id, kasus: JSON.parse(keJson(kasus)), judul: ringkasKasus(kasus).judul, disimpanPada: new Date().toISOString() };
  gantiSemuaTersimpan([baris, ...semuaTersimpan().filter(lain => lain.id !== id)]);
  antre({ tabel: 'tersimpan', baris });
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
