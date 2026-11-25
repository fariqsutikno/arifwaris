// Peraga dan simulasi di materi menjalankan engine untuk satu susunan ahli waris (satu mayit), lalu membaca hasilnya
// lewat ringkas() yang sama dengan layar Hasil. Tidak ada aturan fikih di sini: siapa gugur dan berapa bagiannya
// selalu dari engine.
import { jalankan, kasusDariSoal, type HasilOk } from '@waris/latihan';
import type { KunciAhliWaris } from '@waris/engine';
import { DAFTAR_JENIS } from '../../../checklist';
import { ringkas, type RingkasanHasil } from '../../../hasil/ringkasan';

/** Harta peraga hanya untuk menjalankan engine; angka rupiahnya tidak ditampilkan. */
const HARTA_PERAGA = 120_000_000n;

export interface PenerimaKunci { kunci: string; label: string; jumlahOrang: number; saham: bigint }
export interface HasilContoh {
  ringkasan: RingkasanHasil;
  hasil: HasilOk;
  /** Penerima digabung per kunci (dua anak perempuan = satu baris), urutan sesuai tampilan Hasil. */
  perKunci: PenerimaKunci[];
  /** Kunci yang hadir tetapi tidak menerima apa pun (gugur atau tidak kebagian sisa). */
  tidakMenerima: string[];
}

export const labelKunci = (kunci: string): string => DAFTAR_JENIS.find(jenis => jenis.kunci === kunci)?.label ?? kunci;

export function hitungContoh(pewaris: 'L' | 'P', ahliWaris: string[]): HasilContoh | undefined {
  try {
    const kasus = kasusDariSoal({ pewaris, ahliWaris, harta: HARTA_PERAGA, harapan: { saham: {}, ashlAkhir: 0n } });
    const tampil = jalankan(kasus);
    if (tampil.jenis !== 'biasa' || tampil.hasil.status !== 'OK') return undefined;
    const ringkasan = ringkas(kasus, tampil);
    const perKunci: PenerimaKunci[] = [];
    for (const orang of ringkasan.penerima) {
      if (!orang.kunci || orang.saham === 0n) continue;
      const ada = perKunci.find(isi => isi.kunci === orang.kunci);
      if (ada) { ada.saham += orang.saham; ada.jumlahOrang++; } else perKunci.push({ kunci: orang.kunci, label: labelKunci(orang.kunci), jumlahOrang: 1, saham: orang.saham });
    }
    const menerima = new Set(perKunci.map(isi => isi.kunci));
    const tidakMenerima = [...new Set(ahliWaris.filter(kunci => !menerima.has(kunci as KunciAhliWaris)))];
    return { ringkasan, hasil: tampil.hasil as HasilOk, perKunci, tidakMenerima };
  } catch {
    return undefined;
  }
}
