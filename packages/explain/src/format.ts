import type { Fraction, Money } from '@waris/math';

export const fr = (f: Fraction): string => `${f.n}/${f.d}`;

/** Rp dengan titik ribuan: 46666000n → "Rp46.666.000". */
export const rupiah = (amount: Money): string => `Rp${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
export const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);
