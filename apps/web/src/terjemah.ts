// Terjemahan UI untuk bahasa 'ar'. Kunci kamus = teks Indonesia apa adanya, supaya komponen tetap terbaca
// dan teks yang belum diterjemahkan jatuh kembali ke Indonesia (bisa dicicil). `{nama}` = sisipan.
// Ganti bahasa memuat ulang halaman (Kepala.tsx), jadi `t` boleh dipakai juga di konstanta modul `konten/*`.

import { angkaArab } from '@waris/explain';
import { KAMUS_ARAB } from './konten/kamusArab';
import { bacaBahasa } from './preferensi';

export const bahasaArab = (): boolean => bacaBahasa() === 'ar';

/** Angka Arab (٠١٢) bila bahasa Arab (keputusan 2026-09-26). */
export const angka = (teks: string): string => (bahasaArab() ? angkaArab(teks) : teks);

/** Isian dari keyboard Arab (٠١٢ atau ۰۱۲ Persia) → angka Latin, supaya parser angka tetap satu jalur. */
export const angkaLatin = (teks: string): string =>
  teks.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) % 16)).replace(/٬/g, '.');

/** Panah "maju": di tampilan kanan-ke-kiri arahnya berbalik. */
export const panah = (): string => (bahasaArab() ? '←' : '→');

export function t(teks: string, sisipan: Record<string, string | number | bigint> = {}): string {
  const arab = bahasaArab() ? KAMUS_ARAB[teks] : undefined;
  const hasil = (arab ?? teks).replace(/\{(\w+)\}/g, (utuh: string, nama: string) => (nama in sisipan ? String(sisipan[nama]) : utuh));
  return arab ? angkaArab(hasil) : hasil;
}

/** Istilah ahli waris di teks bebas (soal, pembahasan) → Arab; kata lain tetap Indonesia. Panjang dulu supaya "anak laki-laki" menang atas "anak". */
const ISTILAH_WARIS: Array<[string, string]> = [
  ['anak laki-laki', 'الابن'], ['anak perempuan', 'البنت'], ['cucu laki-laki', 'ابن الابن'], ['cucu perempuan', 'بنت الابن'],
  ['saudara laki-laki kandung', 'الأخ الشقيق'], ['saudara perempuan kandung', 'الأخت الشقيقة'],
  ['saudara kandung', 'الأخ الشقيق'], ['saudari kandung', 'الأخت الشقيقة'], ['saudara seibu', 'الأخ لأم'], ['saudari seibu', 'الأخت لأم'],
  ['saudara sebapak', 'الأخ لأب'], ['saudari sebapak', 'الأخت لأب'],
  ['ahli waris', 'الوارث'], ['suami', 'الزوج'], ['istri', 'الزوجة'], ['ayah', 'الأب'], ['ibu', 'الأم'], ['kakek', 'الجد'], ['nenek', 'الجدة'],
  ['anak', 'الولد'], ['cucu', 'الحفيد'], ['paman', 'العم'], ['keponakan', 'ابن الأخ'], ['almarhum', 'المتوفى'],
];
const POLA_WARIS = new RegExp(`(?<![\\p{L}])(${ISTILAH_WARIS.map(([indonesia]) => indonesia).join('|')})(?![\\p{L}-])`, 'giu');
const ARAB_WARIS = new Map(ISTILAH_WARIS);

export const terjemahIsi = (teks: string): string => {
  if (!bahasaArab()) return teks;
  const utuh = KAMUS_ARAB[teks];
  if (utuh) return angkaArab(utuh);
  return angkaArab(teks.replace(POLA_WARIS, kata => ARAB_WARIS.get(kata.toLowerCase()) ?? kata));
};
