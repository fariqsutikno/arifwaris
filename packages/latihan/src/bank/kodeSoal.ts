// Satu pintu kode soal generator: kasus (biasa atau lanjutan) ⇄ `G<versi>-<huruf keluarga>-<muatan>`.
// Keluarga `B` di kodeBiasa.ts (tata letak bit beku), keluarga lanjutan di kodeLanjutan.ts.

import { buatKodeBiasa, KELUARGA_BIASA, POLA_KODE_GENERATOR, uraiKodeBiasa, type KodeGalatSoal } from './kodeBiasa.js';
import { adalahLanjutan, buatKodeLanjutan, uraiKodeLanjutan, type KasusBank } from './kodeLanjutan.js';

export { adalahKodeGenerator, periksaKasusBiasa, POLA_KODE_GENERATOR, URUTAN_KUNCI, VERSI_GENERATOR, type KasusBiasa, type KodeGalatSoal } from './kodeBiasa.js';

/** Melempar Error bila kasus tidak sah: pemanggil (penyapu) memang tidak boleh menghasilkan kasus seperti itu. */
export const buatKodeSoal = (kasus: KasusBank): string => (adalahLanjutan(kasus) ? buatKodeLanjutan(kasus) : buatKodeBiasa(kasus));

export type HasilUraiKode = { ok: true; kasus: KasusBank } | { ok: false; galat: KodeGalatSoal };

export function uraiKodeSoal(kode: string): HasilUraiKode {
  const cocok = POLA_KODE_GENERATOR.exec(kode);
  return cocok && cocok[2] === KELUARGA_BIASA ? uraiKodeBiasa(kode) : uraiKodeLanjutan(kode);
}

