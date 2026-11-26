// Penyapu keluarga lanjutan (spec bank soal §2.1, G3): munasakhat, gharqa, mafqud, khuntsa, haml, dzawil arham.
// Tanpa engine: menyusun struktur kasus (kodeLanjutan.ts) secara deterministik dari sapuan kasus biasa kecil,
// memeriksa bahwa graf-nya bisa dibangun, lalu menyerahkan kode ke saringan (bangunBank.ts).
// Ruang lanjutan meledak (mayit bertumpuk x ahli waris tambahan), jadi tiap sapuan memakai ruang dasar kecil dan
// `pembagi`: hanya kandidat yang nomor urutnya lolos pengacak deterministik (bukan stride, supaya tidak
// terpola oleh odometer sapuan) yang dilanjutkan. Pemeriksaan engine tetap mahal; pengacakan sebelum itu murah.

import { URUTAN_KUNCI, type KasusBiasa } from './kodeBiasa.js';
import {
  buatKodeLanjutan, MAKS_ANAK_TAMBAHAN, MAKS_KERABAT_PER_JENIS, URUTAN_KERABAT_JAUH,
  type AhliWarisTambahan, type KasusLanjutan, type MayitBerantai, type NamaKeluargaLanjutan,
} from './kodeLanjutan.js';
import { bangunKasusLanjutan } from './bangunKasus.js';
import { sapuKasusBiasa, type RuangSapuan } from './penyapu.js';
import type { KeadaanGharqa } from '@waris/engine';

export type KandidatKode = { kode: string; jumlahOrang: number };

type TahapSapuan = { ruang: RuangSapuan; anakTambahanMaks: number; pembagi: number };

/**
 * Konfigurasi sapuan per keluarga; `pembagi` N = mempertahankan sekitar 1 dari N kandidat. Angka dipilih agar tiap
 * keluarga menghasilkan puluhan sampai ratusan ribu kandidat (stok jauh di atas kuota, sapuan beberapa menit; angka
 * nyata di spec §8, catatan G3). Munasakhat per jumlah mayit tambahan 1/2/3 (total 2/3/4 mayit) memakai ruang dasar
 * makin kecil karena pilihan mayit dan ahli waris tambahannya berlipat per mayit.
 */
export const SAPUAN_LANJUTAN = {
  munasakhat: [
    { ruang: { kunciHadirMaks: 3, jumlahBerbilangMaks: 2, kecilkanMaksimal: true }, anakTambahanMaks: 2, pembagi: 4 },
    { ruang: { kunciHadirMaks: 2, jumlahBerbilangMaks: 2, kecilkanMaksimal: true }, anakTambahanMaks: 1, pembagi: 4 },
    // Tiga mayit tambahan butuh dasar dengan >= 3 orang: tiga kunci masing-masing satu orang.
    { ruang: { kunciHadirMaks: 3, jumlahBerbilangMaks: 1, kecilkanMaksimal: true }, anakTambahanMaks: 1, pembagi: 100 },
  ],
  gharqa: [
    { ruang: { kunciHadirMaks: 3, jumlahBerbilangMaks: 2, kecilkanMaksimal: true }, anakTambahanMaks: 2, pembagi: 80 },
    { ruang: { kunciHadirMaks: 2, jumlahBerbilangMaks: 2, kecilkanMaksimal: true }, anakTambahanMaks: 1, pembagi: 80 },
  ],
  mafqud: { ruang: { kunciHadirMaks: 4, jumlahBerbilangMaks: 2, kecilkanMaksimal: true }, pembagi: 8 },
  khuntsa: { ruang: { kunciHadirMaks: 4, jumlahBerbilangMaks: 2, kecilkanMaksimal: true }, pembagi: 8 },
  // Haml hanya sah bila ibunya hidup (istri tunggal atau ibu), jadi sebagian besar kandidat gugur sebelum engine.
  haml: { ruang: { kunciHadirMaks: 4, jumlahBerbilangMaks: 2, kecilkanMaksimal: true }, pembagi: 1 },
  dzawilArham: { jenisKerabatMaks: 4, pembagi: 1 },
} as const satisfies Record<string, unknown>;

const KEADAAN_GHARQA: KeadaanGharqa[] = ['serentak', 'terlupakan', 'berurutanTakDiketahui', 'tidakDiketahui'];

/** Pengacak bilangan bulat murni (finalizer murmur3); menggantikan Math.random supaya sapuan deterministik. */
function acak(nomor: number, benih: number): number {
  let hash = (nomor ^ Math.imul(benih, 0x9e3779b1)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** Struktur → kandidat bila graf-nya bisa dibangun; yang tak bisa dibangun bukan kandidat (seperti kasus tak sah di penyapu biasa). */
function kandidatDari(struktur: KasusLanjutan): KandidatKode | undefined {
  try {
    const { graf } = bangunKasusLanjutan(struktur);
    const jumlahOrang = Object.values(graf.orang).filter(orang => !orang.penghubung && orang.id !== graf.idPewaris).length;
    return { kode: buatKodeLanjutan(struktur), jumlahOrang };
  } catch {
    return undefined;
  }
}

type Susunan = { struktur: KasusLanjutan; pembagi: number };

function* jarangkan(sumber: Iterable<Susunan>, benih: number, batas: number): Generator<KandidatKode> {
  let nomor = 0;
  let sisa = batas;
  for (const { struktur, pembagi } of sumber) {
    if (sisa <= 0) return;
    if (acak(nomor++, benih) % pembagi !== 0) continue;
    const kandidat = kandidatDari(struktur);
    if (!kandidat) continue;
    sisa--;
    yield kandidat;
  }
}

// ─── Susunan per keluarga ─────────────────────────────────────────────────────

function paketTambahan(anakMaks: number): AhliWarisTambahan[] {
  const paket: AhliWarisTambahan[] = [];
  for (const pasangan of [0, 1] as const) {
    for (let anakLk = 0; anakLk <= Math.min(anakMaks, MAKS_ANAK_TAMBAHAN); anakLk++) {
      for (let anakPr = 0; anakPr <= Math.min(anakMaks, MAKS_ANAK_TAMBAHAN); anakPr++) paket.push({ pasangan, anakLk, anakPr });
    }
  }
  return paket;
}

/**
 * Urutan mayit tambahan: tiap mayit satu ahli waris mayit pertama. Dalam satu kunci, orang dipilih berurutan
 * (urutan = banyaknya mayit sekunci sebelumnya) karena orang sekunci setara; ahli waris tambahan yang membedakan.
 */
function* urutanMayit(dasar: KasusBiasa, jumlah: number, paket: AhliWarisTambahan[]): Generator<MayitBerantai[]> {
  const kunciHadir = URUTAN_KUNCI.filter(kunci => dasar.ahliWaris[kunci]);
  const dipakai: Partial<Record<string, number>> = {};
  function* langkah(sudah: MayitBerantai[]): Generator<MayitBerantai[]> {
    if (sudah.length === jumlah) { yield sudah; return; }
    for (const kunci of kunciHadir) {
      const urutan = dipakai[kunci] ?? 0;
      if (urutan >= dasar.ahliWaris[kunci]!) continue;
      for (const tambahan of paket) {
        dipakai[kunci] = urutan + 1;
        yield* langkah([...sudah, { kunci, urutan, tambahan }]);
        dipakai[kunci] = urutan;
      }
    }
  }
  yield* langkah([]);
}

function* susunMunasakhat(): Generator<Susunan> {
  for (const [indeks, tahap] of SAPUAN_LANJUTAN.munasakhat.entries()) {
    const paket = paketTambahan(tahap.anakTambahanMaks);
    for (const dasar of sapuKasusBiasa(Infinity, tahap.ruang)) {
      for (const mayit of urutanMayit(dasar, indeks + 1, paket)) yield { struktur: { keluarga: 'munasakhat', dasar, mayit }, pembagi: tahap.pembagi };
    }
  }
}

function* susunGharqa(): Generator<Susunan> {
  for (const [indeks, tahap] of SAPUAN_LANJUTAN.gharqa.entries()) {
    const paket = paketTambahan(tahap.anakTambahanMaks);
    for (const dasar of sapuKasusBiasa(Infinity, tahap.ruang)) {
      for (const mayit of urutanMayit(dasar, indeks + 1, paket)) {
        for (const keadaan of KEADAAN_GHARQA) yield { struktur: { keluarga: 'gharqa', dasar, mayit, keadaan }, pembagi: tahap.pembagi };
      }
    }
  }
}

/** Satu orang belum pasti per kasus (dua orang belum didukung sapuan). Orang sekunci setara, jadi urutan 0 saja. */
function* susunTaqdir(keluarga: 'mafqud' | 'khuntsa' | 'haml'): Generator<Susunan> {
  for (const dasar of sapuKasusBiasa(Infinity, SAPUAN_LANJUTAN[keluarga].ruang)) {
    for (const kunci of URUTAN_KUNCI.filter(kunciIni => dasar.ahliWaris[kunciIni])) yield { struktur: { keluarga, dasar, sasaran: { kunci, urutan: 0 } }, pembagi: SAPUAN_LANJUTAN[keluarga].pembagi };
  }
}

function* susunDzawilArham(): Generator<Susunan> {
  const jenis = URUTAN_KERABAT_JAUH.length;
  function* pilih(dari: number, kerabat: number[], sisaJenis: number): Generator<number[]> {
    if (kerabat.some(jumlah => jumlah > 0)) yield kerabat;
    if (sisaJenis === 0) return;
    for (let urutan = dari; urutan < jenis; urutan++) {
      for (let jumlah = 1; jumlah <= MAKS_KERABAT_PER_JENIS; jumlah++) {
        yield* pilih(urutan + 1, kerabat.map((isi, posisi) => (posisi === urutan ? jumlah : isi)), sisaJenis - 1);
      }
    }
  }
  for (const kerabat of pilih(0, Array(jenis).fill(0), SAPUAN_LANJUTAN.dzawilArham.jenisKerabatMaks)) {
    for (const pewaris of ['L', 'P'] as const) {
      for (const pasangan of [0, 1] as const) yield { struktur: { keluarga: 'dzawilArham', pewaris, pasangan, kerabat }, pembagi: SAPUAN_LANJUTAN.dzawilArham.pembagi };
    }
  }
}

const BENIH_KELUARGA: Record<NamaKeluargaLanjutan, number> = { munasakhat: 11, gharqa: 14, mafqud: 22, khuntsa: 23, haml: 24, dzawilArham: 12 };

const SUSUNAN: Record<NamaKeluargaLanjutan, () => Generator<Susunan>> = {
  munasakhat: susunMunasakhat, gharqa: susunGharqa, dzawilArham: susunDzawilArham,
  mafqud: () => susunTaqdir('mafqud'), khuntsa: () => susunTaqdir('khuntsa'), haml: () => susunTaqdir('haml'),
};

/** `batas` memotong aliran (uji cepat). Deterministik: dua sapuan menghasilkan aliran kode identik. */
export const sapuKasusLanjutan = (keluarga: NamaKeluargaLanjutan, batas = Infinity): Generator<KandidatKode> =>
  jarangkan(SUSUNAN[keluarga](), BENIH_KELUARGA[keluarga], batas);
