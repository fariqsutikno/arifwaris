// Riwayat hitung: kasus yang pernah sampai ke layar hasil, terakhir dibuka di atas, disimpan di perangkat ini.
// Satu entri per sesi (mulai kasus / impor / buka dari riwayat, materi, atau latihan): mengubah kasus di layar hasil
// memperbarui entri sesinya. Tiap entri mencatat sumbernya. Entri yang tidak dibuka lebih dari 30 hari dibuang.

import type { KunciAhliWaris } from '@waris/engine';
import { hitungIsian, jenisDari } from './checklist';
import { formatRupiah } from './format';
import { dariJson, keJson, type Kasus } from './kasus';
import { LABEL_SEHARI } from './konten/ahliWaris';

const KUNCI_RIWAYAT = 'arif-waris:riwayat';
const HARI = 24 * 60 * 60 * 1000;
export const MASA_SIMPAN = 30 * HARI;
/** Beranda Hitung menampilkan riwayat dua pekan terakhir; sisanya di halaman Riwayat. */
export const MASA_BERANDA = 14 * HARI;

export type SumberRiwayat =
  | { jenis: 'sendiri' }
  | { jenis: 'impor' }
  | { jenis: 'materi' }
  | { jenis: 'latihan'; kode: string };

export interface EntriRiwayat { id: string; waktu: number; sumber: SumberRiwayat; judul: string; keterangan: string; kasus: Kasus }
interface EntriTersimpan { id: string; waktu: number; sumber?: SumberRiwayat; kasus: string }

export function bacaRiwayat(): EntriRiwayat[] {
  return bacaTersimpan().flatMap(entri => {
    const hasil = dariJson(entri.kasus);
    return hasil.berhasil
      ? [{ id: entri.id, waktu: entri.waktu, sumber: entri.sumber ?? { jenis: 'sendiri' }, ...ringkasKasus(hasil.kasus), kasus: hasil.kasus }]
      : [];
  });
}

/** Catat atau perbarui entri sesi `id`; `waktu` = terakhir dibuka/diubah. */
export function catatRiwayat(id: string, kasus: Kasus, waktu: number, sumber: SumberRiwayat): void {
  const json = keJson(kasus);
  // Kasus yang persis sama (mis. dibuka lagi dari riwayat lalu tidak diubah) tidak dicatat dua kali.
  const lain = bacaTersimpan().filter(entri => entri.id !== id && entri.kasus !== json && waktu - entri.waktu <= MASA_SIMPAN);
  simpanTersimpan([{ id, waktu, sumber, kasus: json }, ...lain]);
}

export const hapusRiwayat = (id?: string): void => simpanTersimpan(id ? bacaTersimpan().filter(entri => entri.id !== id) : []);

export function labelSumber(sumber: SumberRiwayat): string {
  switch (sumber.jenis) {
    case 'sendiri': return 'Hitung sendiri';
    case 'impor': return 'Impor file';
    case 'materi': return 'Contoh materi';
    case 'latihan': return `Soal latihan ${sumber.kode}`;
  }
}

/** "Istri, 2 Anak perempuan, Ayah" dan "Rp 120.000.000". */
export function ringkasKasus(kasus: Kasus): { judul: string; keterangan: string } {
  const isian = hitungIsian(kasus.graf, kasus.graf.idPewaris);
  const judul = Object.entries(isian).map(([kunci, daftar]) => {
    const label = LABEL_SEHARI[kunci as KunciAhliWaris] ?? jenisDari(kunci as KunciAhliWaris)?.label ?? kunci;
    return daftar!.length > 1 ? `${daftar!.length} ${label}` : label;
  }).join(', ') || 'Belum ada ahli waris';
  const munasakhat = kasus.urutanWafat.length > 0 ? ' · ada yang wafat sebelum pembagian' : '';
  return { judul, keterangan: `${formatRupiah(kasus.tirkah.kotor)}${munasakhat}` };
}

function bacaTersimpan(): EntriTersimpan[] {
  try {
    const daftar: unknown = JSON.parse(localStorage.getItem(KUNCI_RIWAYAT) ?? '[]');
    return Array.isArray(daftar) ? daftar : [];
  } catch {
    return [];
  }
}

function simpanTersimpan(daftar: EntriTersimpan[]): void {
  try {
    localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(daftar));
  } catch {
    // Mode privat / penyimpanan penuh: riwayat tidak disimpan, aplikasi tetap jalan.
  }
}

/** "baru saja", "5 menit lalu", "kemarin", atau tanggal; hanya untuk tampilan. */
export function waktuRelatif(waktu: number, sekarang: number): string {
  const menit = Math.floor((sekarang - waktu) / 60_000);
  if (menit < 1) return 'baru saja';
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
  if (menit < 60) return rtf.format(-menit, 'minute');
  if (menit < 60 * 24) return rtf.format(-Math.round(menit / 60), 'hour');
  if (menit < 60 * 24 * 7) return rtf.format(-Math.round(menit / (60 * 24)), 'day');
  return new Date(waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
