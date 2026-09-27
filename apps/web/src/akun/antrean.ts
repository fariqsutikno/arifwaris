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
  | { tabel: 'hapus_latihan' }
  | { tabel: 'preferensi'; baris: Preferensi }
  | { tabel: 'kegiatan'; baris: Kegiatan };

const KUNCI_ANTREAN = 'arif-waris:antrean';
/** Dipancarkan di window setelah ≥1 kegiatan sampai server: XP & streak bisa dimuat ulang (StreakKepala). */
export const PERISTIWA_KEGIATAN_TERKIRIM = 'arif-waris:kegiatan-terkirim';
const KUNCI_AKUN = 'arif-waris:akun';
let pengirim: (() => void) | null = null;
let jumlahAntre = 0;

/** Naik tiap antre(); sinkron.ts membandingkannya untuk tahu ada perubahan lokal meski entrinya sudah terkirim. */
export const versiAntrean = (): number => jumlahAntre;

export const akunLokal = (): string | null => bacaMentah(KUNCI_AKUN);
export const aturAkunLokal = (userId: string | null): void => (userId ? simpanMentah(KUNCI_AKUN, userId) : hapusMentah(KUNCI_AKUN));
/** Dipasang sinkron.ts: dipanggil tiap ada entri baru supaya langsung dicoba kirim. */
export const aturPengirim = (kirim: (() => void) | null): void => { pengirim = kirim; };

export function antre(entri: EntriAntrean): void {
  if (!akunLokal()) return;
  jumlahAntre++;
  const kunci = kunciEntri(entri);
  // Hapus & simpan tersimpan berbagi kunci: yang terakhir yang berlaku.
  tulis([...bacaAntrean().filter(lama => kunciEntri(lama) !== kunci), entri]);
  pengirim?.();
}

export function bacaAntrean(): EntriAntrean[] {
  try {
    const daftar: unknown = JSON.parse(bacaMentah(KUNCI_ANTREAN) ?? '[]');
    return Array.isArray(daftar) ? daftar.filter(entriUtuh) : [];
  } catch {
    return [];
  }
}

const TABEL_BERBARIS = ['tersimpan', 'belajar', 'latihan', 'preferensi', 'kegiatan'];
// Isi localStorage bisa rusak/versi lama; entri cacat dibuang supaya kunciEntri tidak melempar dari antre().
const entriUtuh = (entri: any): entri is EntriAntrean =>
  entri?.tabel === 'hapus_tersimpan' ? typeof entri.id === 'string'
    : entri?.tabel === 'hapus_latihan' ? true
    : TABEL_BERBARIS.includes(entri?.tabel) && typeof entri.baris === 'object' && entri.baris !== null;

/** Kirim berurutan; berhenti di kegagalan pertama supaya urutan terjaga. Mengembalikan jumlah entri yang tersisa. */
export async function kirimAntrean(pengguna: RepositoriPengguna): Promise<number> {
  let adaKegiatanTerkirim = false;
  const kabari = () => { if (adaKegiatanTerkirim) window.dispatchEvent(new Event(PERISTIWA_KEGIATAN_TERKIRIM)); };
  for (const entri of bacaAntrean()) {
    try {
      await kirimSatu(pengguna, entri);
    } catch (galat) {
      console.warn('kirim perubahan akun gagal, dicoba lagi nanti:', galat);
      kabari();
      return bacaAntrean().length;
    }
    if (entri.tabel === 'kegiatan') adaKegiatanTerkirim = true;
    // Entri bisa sudah ditimpa versi baru selama menunggu: hanya buang bila masih sama persis.
    tulis(bacaAntrean().filter(sisa => JSON.stringify(sisa) !== JSON.stringify(entri)));
  }
  kabari();
  return bacaAntrean().length;
}

function kirimSatu(pengguna: RepositoriPengguna, entri: EntriAntrean): Promise<void> {
  switch (entri.tabel) {
    case 'tersimpan': return pengguna.simpanRiwayat(entri.baris);
    case 'hapus_tersimpan': return pengguna.hapusRiwayat(entri.id);
    case 'belajar': return pengguna.simpanProgresBelajar(entri.baris);
    case 'latihan': return pengguna.simpanProgresLatihan(entri.baris);
    case 'hapus_latihan': return pengguna.hapusSemuaProgresLatihan();
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
    case 'hapus_latihan': return 'hapus_latihan';
    case 'preferensi': return 'preferensi';
    case 'kegiatan': return `kegiatan:${entri.baris.id}`;
  }
}

const tulis = (daftar: EntriAntrean[]): void => simpanMentah(KUNCI_ANTREAN, JSON.stringify(daftar));
