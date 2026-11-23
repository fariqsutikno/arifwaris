// "Kasusmu": satu daftar untuk semua kasus pengguna. Menyatukan dua penyimpanan yang sengaja dipisah di bawahnya:
// riwayat otomatis (riwayat.ts, perangkat ini, 30 hari) dan kasus tersimpan (tersimpan.ts, bernama, permanen, ikut akun).
// Pengguna hanya melihat dua status: Tersimpan dan Sementara. Kasus yang sama (id sama) muncul sekali, sebagai tersimpan.

import type { RepositoriBagikan } from '@waris/data';
import { antre } from './akun/antrean';
import { sudahDibagikan, tandaiDibagikan } from './bagikanLokal';
import type { Kasus } from './kasus';
import { ambilProgresSoal, hapusProgresSoal, simpanProgresSoal, type ProgresSoalLokal } from './progresSoalLokal';
import { MASA_SIMPAN, bacaRiwayat, catatRiwayat, hapusRiwayat, ringkasKasus, type EntriRiwayat, type SumberRiwayat } from './riwayat';
import { bacaTersimpan, hapusTersimpan, simpanKasus } from './tersimpan';

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

/** Isi yang tadi dihapus, untuk Urungkan. Tautan bagikan yang sudah dihentikan tidak ikut kembali. */
export interface CadanganKasus {
  id: string;
  entriRiwayat: EntriRiwayat | null;
  tersimpan: { kasus: Kasus; judul: string } | null;
  progresSoal: ProgresSoalLokal | null;
}

/**
 * Hapus tuntas satu kasus dari perangkat dan akun: riwayat, Tersimpan (+ antrean hapus ke akun), isian soal, dan
 * tautan bagikan bila ada. Satu pintu supaya kasus tidak "hidup lagi" lewat simpanan yang terlewat.
 * Tautan dihentikan tanpa menunggu jaringan; gagal (offline) tidak membatalkan hapus lokal.
 */
export function hapusKasus(id: string, bagikan?: Pick<RepositoriBagikan, 'berhenti'>): CadanganKasus {
  const tersimpan = bacaTersimpan().find(baris => baris.id === id);
  const cadangan: CadanganKasus = {
    id,
    entriRiwayat: bacaRiwayat().find(entri => entri.id === id) ?? null,
    tersimpan: tersimpan ? { kasus: tersimpan.kasus, judul: tersimpan.judul } : null,
    progresSoal: ambilProgresSoal(id),
  };
  hapusRiwayat(id);
  hapusTersimpan(id);
  hapusProgresSoal(id);
  // Tanpa akses akun tautan belum bisa dihentikan, jadi penandanya dibiarkan agar tidak terlupa.
  if (bagikan && sudahDibagikan(id)) {
    tandaiDibagikan(id, false);
    // Luring: perintah berhenti diantre ke akun supaya tautan tidak tertinggal hidup.
    bagikan.berhenti(id).catch(() => antre({ tabel: 'hentikan_bagikan', idRiwayat: id }));
  }
  return cadangan;
}

/** Urungkan hapusKasus: menulis ulang riwayat, Tersimpan (ikut antre ke akun lagi) dan isian soal. */
export function pulihkanKasus(cadangan: CadanganKasus): void {
  const { id, entriRiwayat, tersimpan, progresSoal } = cadangan;
  if (entriRiwayat) catatRiwayat(id, entriRiwayat.kasus, entriRiwayat.waktu, entriRiwayat.sumber);
  if (tersimpan) simpanKasus(id, tersimpan.kasus, tersimpan.judul);
  if (progresSoal) simpanProgresSoal(id, progresSoal);
}

export function hapusSemuaSementara(): void {
  const tersimpan = new Set(bacaTersimpan().map(baris => baris.id));
  bacaRiwayat().filter(entri => !tersimpan.has(entri.id)).forEach(entri => { hapusRiwayat(entri.id); hapusProgresSoal(entri.id); });
}
