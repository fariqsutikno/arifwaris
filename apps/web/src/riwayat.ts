// Riwayat hitung: kasus yang pernah sampai ke layar hasil, terbaru di atas, disimpan di perangkat ini.
// Satu entri per sesi (mulai kasus / buka file / buka dari riwayat): mengubah kasus di layar hasil memperbarui
// entri sesinya, bukan menambah entri baru.

import type { KunciAhliWaris } from '@waris/engine';
import { hitungIsian, jenisDari } from './checklist';
import { formatRupiah } from './format';
import { dariJson, keJson, type Kasus } from './kasus';
import { LABEL_SEHARI } from './konten/ahliWaris';

const KUNCI_RIWAYAT = 'arif-waris:riwayat';
const BATAS_RIWAYAT = 30;

export interface EntriRiwayat { id: string; waktu: number; judul: string; keterangan: string; kasus: Kasus }
interface EntriTersimpan { id: string; waktu: number; kasus: string }

export function bacaRiwayat(): EntriRiwayat[] {
  return bacaTersimpan().flatMap(entri => {
    const hasil = dariJson(entri.kasus);
    return hasil.berhasil ? [{ id: entri.id, waktu: entri.waktu, ...ringkasKasus(hasil.kasus), kasus: hasil.kasus }] : [];
  });
}

export function catatRiwayat(id: string, kasus: Kasus, waktu: number): void {
  const json = keJson(kasus);
  // Kasus yang persis sama (mis. dibuka lagi dari riwayat lalu tidak diubah) tidak dicatat dua kali.
  const lain = bacaTersimpan().filter(entri => entri.id !== id && entri.kasus !== json);
  simpanTersimpan([{ id, waktu, kasus: json }, ...lain].slice(0, BATAS_RIWAYAT));
}

export const hapusRiwayat = (id?: string): void => simpanTersimpan(id ? bacaTersimpan().filter(entri => entri.id !== id) : []);

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
