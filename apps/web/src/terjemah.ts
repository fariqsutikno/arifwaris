// Terjemahan UI. `t(kunci)` (kunci = "halaman.id") membaca diksi terbit (portal → DB → snapshot/cache); bahasa 'ar' memakai teks Arab
// bila ada, selain itu Indonesia. `{nama}` = sisipan. Kunci yang tidak dikenal tampil apa adanya dan ditangkap tes diksi.
// Ganti bahasa memuat ulang halaman (Kepala.tsx), jadi `t` boleh dipakai di konstanta modul.

import { angkaArab } from '@waris/explain';
import { cariDiksi, teksEdukasiMentah } from './konten/sumber';
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

export function t(kunci: string, sisipan: Record<string, string | number | bigint> = {}): string {
  const diksi = cariDiksi(kunci);
  const arab = bahasaArab() ? diksi?.ar ?? undefined : undefined;
  const hasil = sisipkan(arab ?? diksi?.id ?? kunci, sisipan);
  return arab ? angkaArab(hasil) : hasil;
}

export const sisipkan = (teks: string, sisipan: Record<string, string | number | bigint>): string =>
  teks.replace(/\{(\w+)\}/g, (utuh: string, nama: string) => (nama in sisipan ? String(sisipan[nama]) : utuh));

/** Teks edukasi (label ahli waris, wizard, tur, harta) dari konten teks_edukasi; aturan bahasanya sama dengan t(). */
export function teksEdukasi(slug: string): string {
  const isi = teksEdukasiMentah(slug);
  const arab = bahasaArab() ? isi?.ar : undefined;
  return arab ? angkaArab(arab) : isi?.id ?? slug;
}

