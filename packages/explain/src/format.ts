// Format angka untuk teks: pecahan "1/6" dan rupiah "Rp46.666.000".

import type { Pecahan, Uang } from '@waris/math';

export const tulisPecahan = (pecahanIni: Pecahan): string => `${pecahanIni.n}/${pecahanIni.d}`;

/** Rp dengan titik ribuan: 46666000n → "Rp46.666.000". */
export const rupiah = (besaran: Uang): string => `Rp${besaran.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export const kapitalAwal = (teks: string): string => teks.charAt(0).toUpperCase() + teks.slice(1);
export const hurufKecilAwal = (teks: string): string => teks.charAt(0).toLowerCase() + teks.slice(1);
