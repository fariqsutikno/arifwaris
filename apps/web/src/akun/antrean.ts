// Antrean perubahan data pengguna yang belum terkirim ke akun (spec akun pengguna "Sinkron"). Hanya aktif bila perangkat
// memegang data sebuah akun (akunLokal). Satu entri per kunci baris: perubahan baru menimpa yang lama, jadi antrean tidak
// membengkak saat luring. Kegiatan (log_kegiatan) berkunci id-nya sendiri, jadi tidak pernah saling menimpa.
// Menerima entri dari progres/tersimpan/preferensi; menyerahkannya ke RepositoriPengguna lewat kirimAntrean.

import type { Kegiatan, Preferensi, ProgresBelajar, ProgresLatihan, RepositoriPengguna, RiwayatTersimpan } from '@waris/data';
import { bacaMentah, hapusMentah, simpanMentah } from '../penyimpanan';

export type EntriAntrean =
  | { tabel: 'tersimpan'; baris: RiwayatTersimpan }
  | { tabel: 'hapus_tersimpan'; id: string }
  | { tabel: 'belajar'; baris: ProgresBelajar }
  | { tabel: 'latihan'; baris: ProgresLatihan }
  | { tabel: 'preferensi'; baris: Preferensi }
  | { tabel: 'kegiatan'; baris: Kegiatan };

const KUNCI_ANTREAN = 'arif-waris:antrean';
const KUNCI_AKUN = 'arif-waris:akun';
let pengirim: (() => void) | null = null;

export const akunLokal = (): string | null => bacaMentah(KUNCI_AKUN);
export const aturAkunLokal = (userId: string | null): void => (userId ? simpanMentah(KUNCI_AKUN, userId) : hapusMentah(KUNCI_AKUN));
/** Dipasang sinkron.ts: dipanggil tiap ada entri baru supaya langsung dicoba kirim. */
export const aturPengirim = (kirim: (() => void) | null): void => { pengirim = kirim; };

export function antre(entri: EntriAntrean): void {
  if (!akunLokal()) return;
  const kunci = kunciEntri(entri);
  // Hapus & simpan tersimpan berbagi kunci: yang terakhir yang berlaku.
  tulis([...bacaAntrean().filter(lama => kunciEntri(lama) !== kunci), entri]);
  pengirim?.();
}

export function bacaAntrean(): EntriAntrean[] {
  try {
    const daftar: unknown = JSON.parse(bacaMentah(KUNCI_ANTREAN) ?? '[]');
    return Array.isArray(daftar) ? daftar.filter((entri): entri is EntriAntrean => typeof entri?.tabel === 'string') : [];
  } catch {
    return [];
  }
}

/** Kirim berurutan; berhenti di kegagalan pertama supaya urutan terjaga. Mengembalikan jumlah entri yang tersisa. */
export async function kirimAntrean(pengguna: RepositoriPengguna): Promise<number> {
  for (const entri of bacaAntrean()) {
    try {
      await kirimSatu(pengguna, entri);
    } catch (galat) {
      console.warn('kirim perubahan akun gagal, dicoba lagi nanti:', galat);
      return bacaAntrean().length;
    }
    // Entri bisa sudah ditimpa versi baru selama menunggu: hanya buang bila masih sama persis.
    tulis(bacaAntrean().filter(sisa => JSON.stringify(sisa) !== JSON.stringify(entri)));
  }
  return bacaAntrean().length;
}

function kirimSatu(pengguna: RepositoriPengguna, entri: EntriAntrean): Promise<void> {
  switch (entri.tabel) {
    case 'tersimpan': return pengguna.simpanRiwayat(entri.baris);
    case 'hapus_tersimpan': return pengguna.hapusRiwayat(entri.id);
    case 'belajar': return pengguna.simpanProgresBelajar(entri.baris);
    case 'latihan': return pengguna.simpanProgresLatihan(entri.baris);
    case 'preferensi': return pengguna.simpanPreferensi(entri.baris);
    case 'kegiatan': return pengguna.catatKegiatan(entri.baris);
  }
}

function kunciEntri(entri: EntriAntrean): string {
  switch (entri.tabel) {
    case 'tersimpan': return `tersimpan:${entri.baris.id}`;
    case 'hapus_tersimpan': return `tersimpan:${entri.id}`;
    case 'belajar': return `belajar:${entri.baris.pelajaranSlug}`;
    case 'latihan': return `latihan:${entri.baris.jenis}:${entri.baris.soalSlug}`;
    case 'preferensi': return 'preferensi';
    case 'kegiatan': return `kegiatan:${entri.baris.id}`;
  }
}

const tulis = (daftar: EntriAntrean[]): void => simpanMentah(KUNCI_ANTREAN, JSON.stringify(daftar));
