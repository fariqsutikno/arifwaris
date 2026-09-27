// Blok ```kasus di materi → Kasus kalkulator. Dipakai untuk menampilkan contoh (dihitung engine) dan tombol
// "Coba di kalkulator"; pembentukan graf memakai checklist yang sama dengan wizard. hitungHarapan menjumlah saham
// per kunci dari hasil engine [SYF]: dipakai tes materi dan portal admin (kunci jawaban soal hitung dihitung otomatis) supaya jalurnya satu.

import type { ContohKasus } from '@waris/content';
import type { KunciAhliWaris } from '@waris/engine';
import { ringkas } from '../../hasil/ringkasan';
import { jalankan } from '../../jalankan';
import { DAFTAR_JENIS, tambahAhliWaris } from '../../checklist';
import { kasusBaru, type Kasus } from '../../kasus';

export function kasusDariContoh(contoh: ContohKasus): Kasus {
  const dasar = kasusBaru(contoh.pewaris);
  // Kunci yang bukan ahli waris di checklist membuat tambahAhliWaris melempar galat; test materi menangkapnya.
  const graf = contoh.ahliWaris.reduce((grafIni, kunci) => tambahAhliWaris(grafIni, dasar.graf.idPewaris, kunci as KunciAhliWaris), dasar.graf);
  return { ...dasar, graf, tirkah: { ...dasar.tirkah, kotor: contoh.harta } };
}

export type HasilHarapan = { ok: true; harapan: ContohKasus['harapan'] } | { ok: false; galat: string };

/** Galat ditulis sebagai kalimat utuh untuk penulis konten (alasan engine diteruskan, bukan kode status). */
export function hitungHarapan(contoh: ContohKasus): HasilHarapan {
  if (contoh.ahliWaris.length === 0) return { ok: false, galat: 'Pilih minimal satu ahli waris.' };
  let kasus: Kasus;
  try {
    kasus = kasusDariContoh(contoh);
  } catch (e) {
    return { ok: false, galat: `Kalkulator tidak bisa menyusun kasus ini: ${e instanceof Error ? e.message : String(e)}` };
  }
  const tampil = jalankan(kasus);
  if (tampil.jenis === 'galat') return { ok: false, galat: `Kalkulator gagal menghitung kasus ini: ${tampil.pesan}` };
  if (tampil.jenis !== 'biasa') return { ok: false, galat: 'Kasus dengan ahli waris yang wafat sebelum pembagian belum bisa dipakai sebagai contoh.' };
  const hasil = tampil.hasil;
  if (hasil.status === 'TIDAK_DIDUKUNG') return { ok: false, galat: `Kalkulator belum mendukung kasus ini: ${hasil.alasan}` };
  if (hasil.status === 'PERLU_INPUT') return { ok: false, galat: `Data kasus belum lengkap: ${hasil.pertanyaan.map(p => p.alasan).join('; ')}` };
  const { penerima, penyebut } = ringkas(kasus, tampil);
  const saham: Record<string, bigint> = {};
  for (const orang of penerima) if (orang.saham > 0n && orang.kunci) saham[orang.kunci] = (saham[orang.kunci] ?? 0n) + orang.saham;
  return { ok: true, harapan: { saham, ashlAkhir: penyebut } };
}

/** Kunci ahli waris yang bisa dipakai contoh (sama dengan checklist wizard), berikut label, kelompok, batas jumlah & jenis kelamin pewaris. */
export const KUNCI_CONTOH = DAFTAR_JENIS.map(({ kunci, label, kelompok, maksimal, hanyaUntuk }) => ({ kunci, label, kelompok, maksimal, hanyaUntuk }));
