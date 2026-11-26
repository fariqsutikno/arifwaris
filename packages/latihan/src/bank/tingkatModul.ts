// Tabel tingkat dan modul soal bank (spec bank soal §4): label → tingkat, label → modul kurikulum.
// Keduanya konstanta tunggal supaya tim mudah menyetel; tidak ada hitungan lain di luar tabel ini.
// Nomor modul mengikuti docs/materi-kit/kerangka-kurikulum.md (15 modul).

import type { Tingkat } from '@waris/content';

const adaToken = (label: string[], token: string) => label.includes(token);
const adaAwalan = (label: string[], awalan: string) => label.some(token => token.startsWith(awalan));

/** Kaidah hisab lanjutan: yang mengubah penyebut atau saham (bukan sekadar membagi sisa). */
const KAIDAH_HISAB_LANJUTAN = ['aul', 'radd', 'tashih'];

/** Jumlah kelompok inkisar dari token `inkisar:<n>`; 0 bila tidak ada. */
const jumlahKelompokInkisar = (label: string[]) => Number(label.find(token => token.startsWith('inkisar:'))?.slice('inkisar:'.length) ?? 0);

const BATAS_INKISAR_SULIT = 3;
const BATAS_INKISAR_MENENGAH = 2;

/**
 * Aturan pertama yang cocok menang, dari yang tersulit (keputusan pemilik 2026-11-26).
 * Sulit: dua kaidah hisab lanjutan sekaligus, atau inkisar >= 3 kelompok, atau kasus bernama.
 * Menengah: satu kaidah ('aul, radd), tashih dengan inkisar >= 2, kakek bersama saudara, ashabah bil/ma'al ghair.
 * Dasar: selebihnya (fardh, ashabah, hajb; tashih ringan 1 kelompok).
 */
const ATURAN_TINGKAT: ReadonlyArray<{ tingkat: Tingkat; kalau: (label: string[]) => boolean }> = [
  {
    tingkat: 'sulit',
    kalau: label => KAIDAH_HISAB_LANJUTAN.filter(token => adaToken(label, token)).length >= 2
      || jumlahKelompokInkisar(label) >= BATAS_INKISAR_SULIT || adaAwalan(label, 'bernama:'),
  },
  {
    tingkat: 'menengah',
    kalau: label => ['aul', 'radd', 'kakekSaudara', 'ashabahBilGhair', 'ashabahMaalGhair'].some(token => adaToken(label, token))
      || jumlahKelompokInkisar(label) >= BATAS_INKISAR_MENENGAH,
  },
];

export const tingkatSoal = (label: string[]): Tingkat => ATURAN_TINGKAT.find(aturan => aturan.kalau(label))?.tingkat ?? 'dasar';

/** Tanpa label kaidah lanjutan, soal hanya menguji bagian pasti dan ashabah. */
const MODUL_BAGIAN_DAN_ASHABAH = [3, 4];

const ATURAN_MODUL: ReadonlyArray<{ kalau: (label: string[]) => boolean; modul: number }> = [
  { kalau: label => adaAwalan(label, 'hajb:'), modul: 5 },
  { kalau: label => adaToken(label, 'ashabahBilGhair') || adaToken(label, 'ashabahMaalGhair'), modul: 4 },
  { kalau: label => adaToken(label, 'aul') || adaToken(label, 'radd'), modul: 6 },
  { kalau: label => adaToken(label, 'tashih'), modul: 7 },
  { kalau: label => adaToken(label, 'bernama:umariyyatain') || adaToken(label, 'bernama:musyarrakah'), modul: 9 },
  { kalau: label => adaToken(label, 'kakekSaudara') || adaToken(label, 'bernama:muaddah') || adaToken(label, 'bernama:akdariyyah'), modul: 10 },
];

export function modulSoal(label: string[]): number[] {
  const modul = ATURAN_MODUL.filter(aturan => aturan.kalau(label)).map(aturan => aturan.modul);
  return modul.length > 0 ? modul.sort((a, b) => a - b) : MODUL_BAGIAN_DAN_ASHABAH;
}
