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
export const panahMundur = (): string => (bahasaArab() ? '→' : '←');

export function t(teks: string, sisipan: Record<string, string | number | bigint> = {}): string {
  const arab = bahasaArab() ? KAMUS_ARAB[teks] : undefined;
  const hasil = (arab ?? teks).replace(/\{(\w+)\}/g, (utuh: string, nama: string) => (nama in sisipan ? String(sisipan[nama]) : utuh));
  return arab ? angkaArab(hasil) : hasil;
}

/** Konten (judul, isi materi, soal, tanya jawab, glosarium) tampil apa adanya; versi Arabnya diatur di konten masing-masing, bukan dicari di kamus. */
export const terjemahIsi = (teks: string): string => teks;
