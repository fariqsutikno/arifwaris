import type { Uang } from '@waris/math';
import type { TirkahInput, TraceStep } from '../types.js';

const nonNegative = (x: Uang): Uang => (x < 0n ? 0n : x);

/**
 * Tahap 0 [R01-1]: tajhiz → hutang → wasiat → irts. Bab 1.5: hutang ≥ tirkah → tidak ada pembagian.
 * Hak yang terkait 'ain tirkah belum ada di input (bab 1.4 no. 1).
 */
export function computeTirkah(tirkah: TirkahInput): { bersih: Uang; trace: Extract<TraceStep, { kind: 'TIRKAH' }> } {
  const setelahHutang = nonNegative(nonNegative(tirkah.gross - tirkah.tajhiz) - tirkah.hutang);
  // [R01-4] wasiat maksimal 1/3 sisa setelah hutang; dibulatkan ke bawah ke rupiah [KH].
  const wasiatBatas = setelahHutang / 3n;
  const wasiatDipakai = tirkah.wasiat < wasiatBatas ? tirkah.wasiat : wasiatBatas;
  // Kelebihan hanya berlaku dengan ijazah ahli waris; aturan ijazah [R01-7] belum diverifikasi → tidak diterapkan.
  const wasiatButuhIjazah = tirkah.wasiat - wasiatDipakai;
  const bersih = setelahHutang - wasiatDipakai;
  return {
    bersih,
    trace: {
      stage: 'tirkah', refs: ['R01-1', 'R01-4'], kind: 'TIRKAH',
      gross: tirkah.gross, tajhiz: tirkah.tajhiz, hutang: tirkah.hutang,
      wasiatDiminta: tirkah.wasiat, wasiatBatas, wasiatDipakai, wasiatButuhIjazah, bersih,
    },
  };
}
