// Angka Arab-Hindi/Persia (٠١٢ ۰۱۲) → angka Latin, supaya parser isian tetap satu jalur. Murni; salinan dari web/terjemah.ts.

export const angkaLatin = (teks: string): string =>
  teks.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) % 16)).replace(/٬/g, '.');
