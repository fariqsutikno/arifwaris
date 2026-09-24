import { input, p } from '../../__tests__/fixtures/bab16.js';
import type { InputEngine, Pernikahan, Orang } from '../../types.js';

export { p };

/**
 * Keluarga dasar: mayit D (lk) dengan ayah F, ibu M, kakek/nenek dari ayah (PGF, PGM) dan dari ibu
 * (MGF, MGM); semuanya wafat/placeholder. Orang tambahan & override lewat `extra`.
 * Nama: S = anak lk, B = anak pr, AK = saudara kandung, AYAH = sebapak (ibu SM), AU = seibu (ayah SF).
 */
export function keluarga(extra: Record<string, Partial<Orang> & Pick<Orang, 'jenisKelamin'>>, pernikahan: Pernikahan[] = []): InputEngine {
  const wafat = { statusHidup: 'wafat', penghubung: true } as const;
  const orang: Record<string, Orang> = {
    D:   p('D', 'L', { statusHidup: 'wafat', idAyah: 'F', idIbu: 'M' }),
    F:   p('F', 'L', { ...wafat, idAyah: 'PGF', idIbu: 'PGM' }),
    M:   p('M', 'P', { ...wafat, idAyah: 'MGF', idIbu: 'MGM' }),
    PGF: p('PGF', 'L', { ...wafat, idAyah: 'PPGF', idIbu: 'PPGM' }),
    PGM: p('PGM', 'P', wafat),
    MGF: p('MGF', 'L', wafat),
    MGM: p('MGM', 'P', { ...wafat, idIbu: 'MMGM' }),
    PPGF: p('PPGF', 'L', wafat),
    PPGM: p('PPGM', 'P', wafat),
    MMGM: p('MMGM', 'P', wafat),
    SM:  p('SM', 'P', wafat),   // istri lain ayah → saudara sebapak
    SF:  p('SF', 'L', wafat),   // suami lain ibu → saudara seibu
  };
  for (const [id, fields] of Object.entries(extra)) {
    const dasar = orang[id] ?? p(id, fields.jenisKelamin);
    // Menimpa orang dasar = menghidupkannya kecuali statusHidup diberikan eksplisit.
    orang[id] = { ...dasar, statusHidup: 'hidup', penghubung: false, ...fields };
  }
  return input({ idPewaris: 'D', orang, pernikahan });
}

// Singkatan relasi untuk `keluarga()`.
export const ANAK = { idAyah: 'D' } as const;
export const KANDUNG = { idAyah: 'F', idIbu: 'M' } as const;
export const SEBAPAK = { idAyah: 'F', idIbu: 'SM' } as const;
export const SEIBU = { idAyah: 'SF', idIbu: 'M' } as const;
export const ANAK_KAKEK = { idAyah: 'PGF', idIbu: 'PGM' } as const;
