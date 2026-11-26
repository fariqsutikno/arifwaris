// Penyapu keluarga `biasa` (spec bank soal §2.1, G2): menghasilkan kasus satu mayit secara deterministik, tanpa
// engine. Menerima tidak ada masukan; menyerahkan aliran KasusBiasa yang sah (periksaKasusBiasa) ke saringan
// (bangunBank.ts). Urutan: jumlah kunci hadir naik 1..BATAS_KUNCI_HADIR, per jumlah pewaris L lalu P, kombinasi
// kunci urut leksikografis menurut DAFTAR_JENIS_CHECKLIST, lalu jumlah orang per kunci (odometer).
// Penyapu sengaja tidak memangkas kerabat yang "pasti gugur": itu keputusan hajb, milik engine, dan kasus
// dengan kerabat gugur tambahan tetap soal yang berbeda (menguji hajb).

import { DAFTAR_JENIS_CHECKLIST } from '../grafAhliWaris.js';
import { periksaKasusBiasa, type KasusBiasa } from './kodeSoal.js';

/**
 * Ruang penuh (23 kunci checklist, tiap kunci 0-7) tidak terjangkau. Batas ini memilih ruang yang masih bisa
 * disapu dalam belasan menit (diukur 0,17 ms/soal): jumlah kunci hadir <= 5 menghasilkan 5.718.421 kandidat;
 * 6 kunci menjadi 46,8 juta (sekitar 2,2 jam), 4 kunci hanya 676 ribu.
 */
export const BATAS_KUNCI_HADIR = 5;

/** Kunci yang boleh berbilang dibatasi 0-3 orang; yang punya `maksimal` di checklist (istri 4, lainnya 1) memakai maksimalnya. */
export const BATAS_JUMLAH_BERBILANG = 3;

/** `batas` memotong aliran (uji cepat); tanpa batas = sapuan penuh. */
export function* sapuKasusBiasa(batas = Infinity): Generator<KasusBiasa> {
  let dihasilkan = 0;
  // Jumlah kunci di loop luar supaya `batas` kecil pun memuat kedua pewaris.
  for (let kunciHadir = 1; kunciHadir <= BATAS_KUNCI_HADIR; kunciHadir++) {
    for (const pewaris of ['L', 'P'] as const) {
      const daftarJenis = DAFTAR_JENIS_CHECKLIST.filter(jenis => !jenis.hanyaUntuk || jenis.hanyaUntuk === pewaris);
      const jumlahMaks = daftarJenis.map(jenis => jenis.maksimal ?? BATAS_JUMLAH_BERBILANG);
      for (const posisi of kombinasi(daftarJenis.length, kunciHadir)) {
        for (const jumlah of jumlahPerKunci(posisi.map(indeks => jumlahMaks[indeks]!))) {
          if (dihasilkan >= batas) return;
          const ahliWaris = Object.fromEntries(posisi.map((indeks, urutan) => [daftarJenis[indeks]!.kunci, jumlah[urutan]!]));
          const kasus: KasusBiasa = { pewaris, ahliWaris };
          if (periksaKasusBiasa(kasus)) continue;
          dihasilkan++;
          yield kasus;
        }
      }
    }
  }
}

/** Semua pilihan `ukuran` indeks dari 0..n-1, urut leksikografis. */
function* kombinasi(n: number, ukuran: number): Generator<number[]> {
  const posisi = Array.from({ length: ukuran }, (_, urutan) => urutan);
  while (true) {
    yield [...posisi];
    let ujung = ukuran - 1;
    while (ujung >= 0 && posisi[ujung] === n - ukuran + ujung) ujung--;
    if (ujung < 0) return;
    posisi[ujung]!++;
    for (let berikut = ujung + 1; berikut < ukuran; berikut++) posisi[berikut] = posisi[berikut - 1]! + 1;
  }
}

/** Semua jumlah 1..maks per kunci (odometer: kunci terakhir paling cepat berubah). */
function* jumlahPerKunci(maks: number[]): Generator<number[]> {
  const jumlah = maks.map(() => 1);
  while (true) {
    yield [...jumlah];
    let ujung = maks.length - 1;
    while (ujung >= 0 && jumlah[ujung] === maks[ujung]) jumlah[ujung--] = 1;
    if (ujung < 0) return;
    jumlah[ujung]!++;
  }
}
