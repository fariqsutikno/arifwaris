// Soal → Kasus: membangun kasus dari yang tertulis di bank soal, dan mengenali/memuat soal lewat IdSoal.
//   Bentuk lama (pewaris + kunci ahli waris + harta): graf dibangun pembangun checklist yang sama dengan wizard.
//   Bentuk berkas: berkas "Simpan ke berkas" kalkulator, divalidasi bacaBerkasKasus (semua jenis kasus).
// Murni; pencarian soal disuntikkan (`cari`), jadi web memakai snapshot dan server memakai basis data.

import type { KasusSoal } from '@waris/content';
import type { KunciAhliWaris } from '@waris/engine';
import { tambahAhliWaris } from './grafAhliWaris.js';
import { bacaBerkasKasus, kasusBaru, type Kasus } from './kasus.js';

/** Soal kurasi = slug ('H-01'); soal pola = `${slugPola}@${versi}#${benih}` (fase P4b, belum didukung). */
export type IdSoal = string;

/** Melempar GalatKasus bila berkas tidak sah, atau Error bila kunci ahli waris bukan ahli waris di checklist. */
export function kasusDariSoal(soal: KasusSoal): Kasus {
  if ('bentuk' in soal) {
    const hasil = bacaBerkasKasus(JSON.stringify(soal.berkas));
    if (!hasil.berhasil) throw hasil.galat;
    return { ...hasil.kasus, jenisKasus: 'latihan' };
  }
  const dasar = kasusBaru(soal.pewaris, 'latihan');
  // Kunci yang bukan ahli waris di checklist membuat tambahAhliWaris melempar galat; uji konten menangkapnya.
  const graf = soal.ahliWaris.reduce((grafIni, kunci) => tambahAhliWaris(grafIni, dasar.graf.idPewaris, kunci as KunciAhliWaris), dasar.graf);
  return { ...dasar, graf, tirkah: { ...dasar.tirkah, kotor: soal.harta } };
}

export type IdSoalTerbaca =
  | { jenis: 'kurasi'; slug: string }
  | { jenis: 'pola'; slugPola: string; versi: number; benih: number };

const POLA_ID = /^([^@#\s]+)@(\d+)#(\d+)$/;
const KURASI_ID = /^[^@#\s]+$/;

export function bacaIdSoal(id: string): IdSoalTerbaca | null {
  const pola = POLA_ID.exec(id);
  if (pola) return { jenis: 'pola', slugPola: pola[1]!, versi: Number(pola[2]), benih: Number(pola[3]) };
  return KURASI_ID.test(id) ? { jenis: 'kurasi', slug: id } : null;
}

export const tulisIdSoal = (id: IdSoalTerbaca): IdSoal =>
  id.jenis === 'kurasi' ? id.slug : `${id.slugPola}@${id.versi}#${id.benih}`;

export interface PencarianSoal { soal: (slug: string) => { kasus: KasusSoal; revisiId: string } | undefined }

export type HasilMuatSoal =
  | { ok: true; kasus: Kasus; revisiId: string }
  | { ok: false; alasan: 'TIDAK_ADA' | 'TIDAK_DIDUKUNG' };

/** Soal pola → TIDAK_DIDUKUNG sampai fase P4b; kasus yang tak terbaca juga TIDAK_DIDUKUNG (bukan melempar). */
export function muatSoal(id: IdSoal, cari: PencarianSoal): HasilMuatSoal {
  const terbaca = bacaIdSoal(id);
  if (!terbaca) return { ok: false, alasan: 'TIDAK_ADA' };
  if (terbaca.jenis === 'pola') return { ok: false, alasan: 'TIDAK_DIDUKUNG' };
  const ditemukan = cari.soal(terbaca.slug);
  if (!ditemukan) return { ok: false, alasan: 'TIDAK_ADA' };
  try {
    return { ok: true, kasus: kasusDariSoal(ditemukan.kasus), revisiId: ditemukan.revisiId };
  } catch {
    return { ok: false, alasan: 'TIDAK_DIDUKUNG' };
  }
}
