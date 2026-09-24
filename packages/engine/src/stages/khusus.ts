import type { KunciAhliWaris } from '../types.js';
import type { AhliWaris } from './model.js';

const banyaknya = (daftarAhliWaris: AhliWaris[], keys: KunciAhliWaris[]) => daftarAhliWaris.filter(h => keys.includes(h.kunci)).length;

/**
 * [R07-1] 'Umariyyatain: salah satu pasangan + ayah + ibu, tanpa ahli waris lain.
 * Dengan 2+ saudara (walau mahjub) ibu sudah 1/6 lewat nuqshan, bukan 'Umariyyatain.
 */
export function adalahUmariyyatain(efektif: AhliWaris[], banyakIkhwah: number): boolean {
  const onlyThese = efektif.every(h => ['SUAMI', 'ISTRI', 'AYAH', 'IBU'].includes(h.kunci));
  return onlyThese && banyaknya(efektif, ['SUAMI', 'ISTRI']) > 0 && banyaknya(efektif, ['AYAH']) === 1
    && banyaknya(efektif, ['IBU']) === 1 && banyakIkhwah < 2;
}

/**
 * [R07-2] Musyarrakah, empat rukun: suami; ibu atau nenek; 2+ anak ibu; saudara lk kandung.
 * Saudara sebapak/kakek/far'u warits otomatis menggugurkan pola ini lewat hajb [R07-3].
 */
export function adalahMusyarrakah(efektif: AhliWaris[]): boolean {
  return banyaknya(efektif, ['SUAMI']) === 1
    && banyaknya(efektif, ['IBU', 'NENEK_DARI_IBU', 'NENEK_DARI_AYAH']) > 0
    && banyaknya(efektif, ['SAUDARA_SEIBU', 'SAUDARI_SEIBU']) >= 2
    && banyaknya(efektif, ['SAUDARA_KANDUNG']) > 0;
}

/**
 * [R08-5] Akdariyyah: tepat suami, ibu, kakek, dan satu saudari (kandung/sebapak).
 * Ibu diganti nenek, saudari 2+, atau ada saudara lk → kembali ke kaidah 8.3.
 */
export function adalahAkdariyyah(efektif: AhliWaris[]): boolean {
  return efektif.length === 4 && banyaknya(efektif, ['SUAMI']) === 1 && banyaknya(efektif, ['IBU']) === 1
    && banyaknya(efektif, ['KAKEK']) === 1 && banyaknya(efektif, ['SAUDARI_KANDUNG', 'SAUDARI_SEBAPAK']) === 1;
}
