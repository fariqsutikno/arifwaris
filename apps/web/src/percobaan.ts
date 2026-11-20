// Kejadian percobaan lokal (spec S4): append-only, 500 terakhir, plus antrean ke akun yang melewati pengirim sampai
// tabel server ada. Menerima KejadianPercobaan dari layar; menyerahkannya ke penyimpanan lokal dan antrean.

import type { KejadianPercobaan, TabelSoal } from '@waris/latihan';
import { tabelKanonik } from '@waris/latihan';
import { antre } from './akun/antrean';
import { bacaMentah, simpanMentah } from './penyimpanan';

const KUNCI_PERCOBAAN = 'arif-waris:percobaan';
export const BATAS_PERCOBAAN_LOKAL = 500;

export function bacaPercobaan(): KejadianPercobaan[] {
  try {
    const daftar: unknown = JSON.parse(bacaMentah(KUNCI_PERCOBAAN) ?? '[]');
    return Array.isArray(daftar) ? daftar : [];
  } catch {
    return [];
  }
}

/** Menambah di akhir, membuang yang tertua bila lebih dari batas, dan mengantre ke akun (bila ada). */
export function catatPercobaan(kejadian: KejadianPercobaan): void {
  const daftar = [...bacaPercobaan(), kejadian].slice(-BATAS_PERCOBAAN_LOKAL);
  simpanMentah(KUNCI_PERCOBAAN, JSON.stringify(daftar));
  antre({ tabel: 'percobaan', baris: kejadian });
}

/** `versi.kunci`: 16 karakter heks pertama SHA-256 dari tabel kanonik. Kosong bila peramban tak punya crypto.subtle. */
export async function ringkasKunciTabel(tabel: TabelSoal): Promise<string> {
  if (!globalThis.crypto?.subtle) return '';
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(tabelKanonik(tabel)));
  return [...new Uint8Array(hash)].slice(0, 8).map(bita => bita.toString(16).padStart(2, '0')).join('');
}
