// Tahap 0 — Tirkah [R01-1]: harta yang dibagi = tirkah − tajhiz − hutang − wasiat (maks. 1/3).
// Urutan potongan itu wajib. Hutang ≥ tirkah → tidak ada yang dibagi (bab 1.5).
// Hak yang terkait 'ain tirkah belum ada di input (bab 1.4 no. 1).

import type { Uang } from '@waris/math';
import type { InputTirkah, LangkahJejak } from '../types.js';

const minimalNol = (x: Uang): Uang => (x < 0n ? 0n : x);

export function hitungTirkah(tirkah: InputTirkah): { bersih: Uang; jejak: Extract<LangkahJejak, { jenis: 'TIRKAH' }> } {
  const setelahHutang = minimalNol(minimalNol(tirkah.kotor - tirkah.tajhiz) - tirkah.hutang);
  // [R01-4] wasiat maksimal 1/3 sisa setelah hutang; dibulatkan ke bawah ke rupiah [KH].
  const wasiatBatas = setelahHutang / 3n;
  const wasiatDipakai = tirkah.wasiat < wasiatBatas ? tirkah.wasiat : wasiatBatas;
  // Kelebihan hanya berlaku dengan ijazah ahli waris; aturan ijazah [R01-7] belum diverifikasi → tidak diterapkan.
  const wasiatButuhIjazah = tirkah.wasiat - wasiatDipakai;
  const bersih = setelahHutang - wasiatDipakai;
  return {
    bersih,
    jejak: {
      tahap: 'tirkah', refs: ['R01-1', 'R01-4'], jenis: 'TIRKAH',
      kotor: tirkah.kotor, tajhiz: tirkah.tajhiz, hutang: tirkah.hutang,
      wasiatDiminta: tirkah.wasiat, wasiatBatas, wasiatDipakai, wasiatButuhIjazah, bersih,
    },
  };
}
