// Tabel tingkat dan modul soal bank (spec bank soal §4): label → tingkat, label → modul kurikulum.
// Keduanya konstanta tunggal supaya tim mudah menyetel; tidak ada hitungan lain di luar tabel ini.
// Nomor modul mengikuti docs/materi-kit/kerangka-kurikulum.md (15 modul).

import type { Tingkat } from '@waris/content';

const adaToken = (label: string[], token: string) => label.includes(token);
const adaAwalan = (label: string[], awalan: string) => label.some(token => token.startsWith(awalan));

/** Aturan pertama yang cocok menang, dari yang tersulit; tanpa yang cocok = dasar (hanya hajb, fardh, ashabah). */
const ATURAN_TINGKAT: ReadonlyArray<{ tingkat: Tingkat; kalau: (label: string[]) => boolean }> = [
  { tingkat: 'sulit', kalau: label => adaToken(label, 'aul') && adaToken(label, 'tashih') },
  {
    tingkat: 'menengah',
    kalau: label => ['aul', 'radd', 'tashih', 'kakekSaudara', 'ashabahBilGhair', 'ashabahMaalGhair'].some(token => adaToken(label, token))
      || adaAwalan(label, 'bernama:'),
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
