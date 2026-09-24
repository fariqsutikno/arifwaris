import type { HeirKey } from '../types.js';
import type { Heir } from './model.js';

const count = (heirs: Heir[], keys: HeirKey[]) => heirs.filter(h => keys.includes(h.key)).length;

/**
 * [R07-1] 'Umariyyatain: salah satu pasangan + ayah + ibu, tanpa ahli waris lain.
 * Dengan 2+ saudara (walau mahjub) ibu sudah 1/6 lewat nuqshan, bukan 'Umariyyatain.
 */
export function isUmariyyatain(effective: Heir[], ikhwahCount: number): boolean {
  const onlyThese = effective.every(h => ['ZAWJ', 'ZAWJAH', 'AB', 'UMM'].includes(h.key));
  return onlyThese && count(effective, ['ZAWJ', 'ZAWJAH']) > 0 && count(effective, ['AB']) === 1
    && count(effective, ['UMM']) === 1 && ikhwahCount < 2;
}

/**
 * [R07-2] Musyarrakah, empat rukun: suami; ibu atau nenek; 2+ anak ibu; saudara lk kandung.
 * Saudara sebapak/kakek/far'u warits otomatis menggugurkan pola ini lewat hajb [R07-3].
 */
export function isMusyarrakah(effective: Heir[]): boolean {
  return count(effective, ['ZAWJ']) === 1
    && count(effective, ['UMM', 'JADDAH_UMM', 'JADDAH_AB']) > 0
    && count(effective, ['AKH_UMM', 'UKHT_UMM']) >= 2
    && count(effective, ['AKH_SYQ']) > 0;
}

/**
 * [R08-5] Akdariyyah: tepat suami, ibu, kakek, dan satu saudari (kandung/sebapak).
 * Ibu diganti nenek, saudari 2+, atau ada saudara lk → kembali ke kaidah 8.3.
 */
export function isAkdariyyah(effective: Heir[]): boolean {
  return effective.length === 4 && count(effective, ['ZAWJ']) === 1 && count(effective, ['UMM']) === 1
    && count(effective, ['JADD']) === 1 && count(effective, ['UKHT_SYQ', 'UKHT_AB']) === 1;
}
