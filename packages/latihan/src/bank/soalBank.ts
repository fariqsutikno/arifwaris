// Soal bank di layar soal hitung: kode generator → kasus siap kerja + apakah bisa dinilai.
// `soalDariKode` hanya menjamin engine memberi hasil; di sini ditambah syarat layar soal: ada tabel isian
// (atau tabel gharqa) yang kuncinya bisa dipilih pelajar, karena soal tanpa tabel tak bisa dinilai penilai.
// Kasus dikemas sebagai berkas supaya jalur penilai (kasusDariSoal/nilaiKiriman) tak perlu tahu soal ini dari bank.

import type { SoalHitung } from '@waris/content';
import { jalankan } from '../jalankan.js';
import { keJson, type Kasus } from '../kasus.js';
import { susunSoalGharqa } from '../tabel/susunGharqa.js';
import { susunTabelSoal } from '../tabel/susun.js';
import { soalDariKode, type SoalDariKode } from './soalDariKode.js';

/** Penanda revisi untuk soal bank: tak ada baris `revisi` (kode bisa diurai); server belum menerima percobaan soal bank. */
export const REVISI_SOAL_BANK = 'bank';

/** Soal bank tak punya bab KB; layar memakai nama "Soal dari bank" menggantikan judul bab. */
const BAB_SOAL_BANK = 0;

export function bisaDinilai(kasus: Kasus): boolean {
  const tampil = jalankan(kasus);
  const idSaja = (id: string) => id;
  switch (tampil.jenis) {
    case 'gharqa': return !('status' in susunSoalGharqa(tampil.hasil, idSaja));
    case 'biasa': case 'munasakhat': case 'taqdir': return tampil.hasil.status === 'OK' && !('status' in susunTabelSoal(tampil.hasil, idSaja));
    default: return false; // menunggu kelahiran dan galat tak punya tabel
  }
}

/** Soal siap kerja dari satu kode bank; null bila kode tak terbaca, engine tak mendukung, atau soal tak bisa dinilai. `judul` dibuat pemanggil dari kasus (bahasa ada di web). */
export function soalHitungDariKode(kode: string, judul: (kasus: Kasus) => string): (SoalHitung & { label: string[]; modul: number[] }) | null {
  const soal: SoalDariKode = soalDariKode(kode);
  if (!soal.ok || !bisaDinilai(soal.kasus)) return null;
  return {
    kode, bab: BAB_SOAL_BANK, tingkat: soal.tingkat, judul: judul(soal.kasus), topik: soal.label.join(', '), sumber: 'bank',
    kasus: { bentuk: 'berkas', berkas: JSON.parse(keJson(soal.kasus)) as Record<string, unknown> },
    label: soal.label, modul: soal.modul,
  };
}
