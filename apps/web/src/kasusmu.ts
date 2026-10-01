// "Kasusmu": satu daftar untuk semua kasus pengguna. Menyatukan dua penyimpanan yang sengaja dipisah di bawahnya:
// riwayat otomatis (riwayat.ts, perangkat ini, 30 hari) dan kasus tersimpan (tersimpan.ts, bernama, permanen, ikut akun).
// Pengguna hanya melihat dua status: Tersimpan dan Sementara. Kasus yang sama (id sama) muncul sekali, sebagai tersimpan.

import type { Kasus } from './kasus';
import { MASA_SIMPAN, bacaRiwayat, hapusRiwayat, ringkasKasus, type SumberRiwayat } from './riwayat';
import { bacaTersimpan, hapusTersimpan } from './tersimpan';

const HARI = 24 * 60 * 60 * 1000;

export interface KasusKu {
  id: string;
  /** Tersimpan: nama pilihan pengguna (bawaan: daftar ahli waris). Sementara: daftar ahli waris. */
  judul: string;
  keterangan: string;
  lengkap: boolean;
  tersimpan: boolean;
  /** Terakhir dibuka atau disimpan. */
  waktu: number;
  /** Hari tersisa sebelum dihapus otomatis; null untuk yang tersimpan. */
  sisaHari: number | null;
  sumber: SumberRiwayat;
  kasus: Kasus;
}

/** Tersimpan di depan, lalu yang sementara; masing-masing terbaru dulu. */
export function bacaKasusKu(sekarang = Date.now()): KasusKu[] {
  const riwayat = bacaRiwayat();
  const tersimpan = bacaTersimpan().map((baris): KasusKu => {
    const dariRiwayat = riwayat.find(entri => entri.id === baris.id);
    return {
      id: baris.id, judul: baris.judul, ...pakaiRingkasan(baris.kasus), tersimpan: true,
      waktu: Math.max(Date.parse(baris.disimpanPada), dariRiwayat?.waktu ?? 0), sisaHari: null,
      sumber: dariRiwayat?.sumber ?? { jenis: 'sendiri' }, kasus: baris.kasus,
    };
  });
  const sudahTersimpan = new Set(tersimpan.map(kasus => kasus.id));
  const sementara = riwayat.filter(entri => !sudahTersimpan.has(entri.id)).map((entri): KasusKu => ({
    id: entri.id, judul: entri.judul, keterangan: entri.keterangan, lengkap: entri.lengkap, tersimpan: false, waktu: entri.waktu,
    sisaHari: Math.max(1, Math.ceil((entri.waktu + MASA_SIMPAN - sekarang) / HARI)), sumber: entri.sumber, kasus: entri.kasus,
  }));
  const terbaru = (a: KasusKu, b: KasusKu) => b.waktu - a.waktu;
  return [...tersimpan.sort(terbaru), ...sementara.sort(terbaru)];
}

const pakaiRingkasan = (kasus: Kasus) => {
  const { keterangan, lengkap } = ringkasKasus(kasus);
  return { keterangan, lengkap };
};

/** Hapus dari riwayat dan dari tersimpan sekaligus; kalau tidak, kasus yang dihapus muncul lagi sebagai sementara. */
export function hapusKasus(id: string): void {
  hapusRiwayat(id);
  hapusTersimpan(id);
}

export function hapusSemuaSementara(): void {
  const tersimpan = new Set(bacaTersimpan().map(baris => baris.id));
  bacaRiwayat().filter(entri => !tersimpan.has(entri.id)).forEach(entri => hapusRiwayat(entri.id));
}
