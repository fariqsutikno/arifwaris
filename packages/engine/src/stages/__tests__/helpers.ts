import { input, p } from '../../__tests__/fixtures/bab16.js';
import type { EngineInput, Marriage, Person } from '../../types.js';

export { p };

/**
 * Keluarga dasar: mayit D (lk) dengan ayah F, ibu M, kakek/nenek dari ayah (PGF, PGM) dan dari ibu
 * (MGF, MGM); semuanya wafat/placeholder. Orang tambahan & override lewat `extra`.
 * Nama: S = anak lk, B = anak pr, AK = saudara kandung, AB = sebapak (ibu SM), AU = seibu (ayah SF).
 */
export function keluarga(extra: Record<string, Partial<Person> & Pick<Person, 'sex'>>, marriages: Marriage[] = []): EngineInput {
  const dead = { life: 'dead', isPlaceholder: true } as const;
  const persons: Record<string, Person> = {
    D:   p('D', 'M', { life: 'dead', fatherId: 'F', motherId: 'M' }),
    F:   p('F', 'M', { ...dead, fatherId: 'PGF', motherId: 'PGM' }),
    M:   p('M', 'F', { ...dead, fatherId: 'MGF', motherId: 'MGM' }),
    PGF: p('PGF', 'M', { ...dead, fatherId: 'PPGF', motherId: 'PPGM' }),
    PGM: p('PGM', 'F', dead),
    MGF: p('MGF', 'M', dead),
    MGM: p('MGM', 'F', { ...dead, motherId: 'MMGM' }),
    PPGF: p('PPGF', 'M', dead),
    PPGM: p('PPGM', 'F', dead),
    MMGM: p('MMGM', 'F', dead),
    SM:  p('SM', 'F', dead),   // istri lain ayah → saudara sebapak
    SF:  p('SF', 'M', dead),   // suami lain ibu → saudara seibu
  };
  for (const [id, fields] of Object.entries(extra)) {
    const base = persons[id] ?? p(id, fields.sex);
    // Menimpa orang dasar = menghidupkannya kecuali life diberikan eksplisit.
    persons[id] = { ...base, life: 'alive', isPlaceholder: false, ...fields };
  }
  return input({ deceasedId: 'D', persons, marriages });
}

// Singkatan relasi untuk `keluarga()`.
export const ANAK = { fatherId: 'D' } as const;
export const KANDUNG = { fatherId: 'F', motherId: 'M' } as const;
export const SEBAPAK = { fatherId: 'F', motherId: 'SM' } as const;
export const SEIBU = { fatherId: 'SF', motherId: 'M' } as const;
export const PAMAN_KANDUNG = { fatherId: 'PGF', motherId: 'PGM' } as const;
