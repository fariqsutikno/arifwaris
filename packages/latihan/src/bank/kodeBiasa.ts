// Kode soal generator keluarga `biasa` (spec bank soal §3): kasus satu mayit ⇄ string, tanpa basis data.
//   Dispatcher semua keluarga ada di kodeSoal.ts; keluarga lanjutan (G3) di kodeLanjutan.ts.
//   Bentuk `G<versi>-<keluarga>-<muatan>`. Keluarga `B` (biasa): muatan = pewaris (1 bit) + jumlah tiap kunci
//   ahli waris (3 bit per kunci, urutan tetap), dibulatkan ke 80 bit lalu ditulis 16 huruf base32 Crockford
//   (tanpa I, L, O, U). Keluarga lain (G3) menambah huruf keluarga sendiri; muatan `B` tidak pernah berubah,
//   perubahan aturan normalisasi menaikkan versi.

import type { KunciAhliWaris } from '@waris/engine';
import { jenisChecklistDari } from '../grafAhliWaris.js';

export type KasusBiasa = { pewaris: 'L' | 'P'; ahliWaris: Partial<Record<KunciAhliWaris, number>> };

export type KodeGalatSoal =
  | 'BUKAN_KODE_GENERATOR' | 'VERSI_TIDAK_DIKENAL' | 'KELUARGA_TIDAK_DIKENAL' | 'MUATAN_RUSAK' | 'KASUS_TIDAK_SAH';

export const VERSI_GENERATOR = 1;
export const KELUARGA_BIASA = 'B';

/** Hanya boleh ditambah di akhir: urutan ini adalah tata letak bit kode `G1-B` yang sudah beredar. */
export const URUTAN_KUNCI = [
  'ANAK_LK', 'CUCU_LK', 'AYAH', 'KAKEK', 'SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARA_SEIBU',
  'KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK', 'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK',
  'SUAMI', 'MUTIQ',
  'ANAK_PR', 'CUCU_PR', 'IBU', 'NENEK_DARI_IBU', 'NENEK_DARI_AYAH',
  'SAUDARI_KANDUNG', 'SAUDARI_SEBAPAK', 'SAUDARI_SEIBU', 'ISTRI', 'MUTIQAH',
] as const satisfies readonly KunciAhliWaris[];

export const BIT_PER_JUMLAH = 3;
export const JUMLAH_MAKS = 2 ** BIT_PER_JUMLAH - 1;
const PANJANG_MUATAN = 16;
const BIT_PER_HURUF = 5;
const BIT_PENUTUP = PANJANG_MUATAN * BIT_PER_HURUF - 1 - URUTAN_KUNCI.length * BIT_PER_JUMLAH;
const ABJAD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Tiga bentuk kode soal hidup berdampingan (kurasi `H-01`, pola `x@1#2`); bentuk ini yang berawalan G<angka>-. */
export const POLA_KODE_GENERATOR = /^G(\d+)-([A-Z])-([0-9A-HJKMNP-TV-Z]+)$/;

export const adalahKodeGenerator = (kode: string): boolean => POLA_KODE_GENERATOR.test(kode);

export function periksaKasusBiasa(kasus: KasusBiasa): KodeGalatSoal | null {
  const entri = Object.entries(kasus.ahliWaris) as [KunciAhliWaris, number][];
  if (!entri.some(([, jumlah]) => jumlah > 0)) return 'KASUS_TIDAK_SAH';
  for (const [kunci, jumlah] of entri) {
    const jenis = jenisChecklistDari(kunci);
    // MUTIQ/MUTIQAH punya bit di kode tetapi belum bisa dibangun dari checklist (soalDariKode tak bisa memuatnya).
    if (!jenis || !URUTAN_KUNCI.includes(kunci) || !Number.isInteger(jumlah) || jumlah < 0 || jumlah > JUMLAH_MAKS) return 'KASUS_TIDAK_SAH';
    if (jumlah > (jenis.maksimal ?? JUMLAH_MAKS)) return 'KASUS_TIDAK_SAH';
    if (jumlah > 0 && jenis.hanyaUntuk && jenis.hanyaUntuk !== kasus.pewaris) return 'KASUS_TIDAK_SAH';
  }
  return null;
}

/** Melempar Error bila kasus tidak sah: pemanggil (penyapu) memang tidak boleh menghasilkan kasus seperti itu. */
export function buatKodeBiasa(kasus: KasusBiasa): string {
  if (periksaKasusBiasa(kasus)) throw new Error('kasus tidak sah untuk kode soal');
  let bit = kasus.pewaris === 'P' ? 1n : 0n;
  for (const kunci of URUTAN_KUNCI) bit = (bit << BigInt(BIT_PER_JUMLAH)) | BigInt(kasus.ahliWaris[kunci] ?? 0);
  bit <<= BigInt(BIT_PENUTUP);
  let muatan = '';
  for (let urutan = PANJANG_MUATAN - 1; urutan >= 0; urutan--) muatan += ABJAD[Number((bit >> BigInt(urutan * BIT_PER_HURUF)) & 31n)];
  return `G${VERSI_GENERATOR}-${KELUARGA_BIASA}-${muatan}`;
}

export type HasilUraiBiasa = { ok: true; kasus: KasusBiasa } | { ok: false; galat: KodeGalatSoal };

export function uraiKodeBiasa(kode: string): HasilUraiBiasa {
  const cocok = POLA_KODE_GENERATOR.exec(kode);
  if (!cocok) return { ok: false, galat: 'BUKAN_KODE_GENERATOR' };
  const [, versi, keluarga, muatan] = cocok;
  if (Number(versi) !== VERSI_GENERATOR) return { ok: false, galat: 'VERSI_TIDAK_DIKENAL' };
  if (keluarga !== KELUARGA_BIASA) return { ok: false, galat: 'KELUARGA_TIDAK_DIKENAL' };
  if (muatan!.length !== PANJANG_MUATAN) return { ok: false, galat: 'MUATAN_RUSAK' };

  let bit = 0n;
  for (const huruf of muatan!) bit = (bit << BigInt(BIT_PER_HURUF)) | BigInt(ABJAD.indexOf(huruf));
  // Bit penutup harus nol: tanpa ini dua kode berbeda bisa menunjuk kasus yang sama.
  if (bit & ((1n << BigInt(BIT_PENUTUP)) - 1n)) return { ok: false, galat: 'MUATAN_RUSAK' };
  bit >>= BigInt(BIT_PENUTUP);

  const ahliWaris: KasusBiasa['ahliWaris'] = {};
  for (const kunci of [...URUTAN_KUNCI].reverse()) {
    const jumlah = Number(bit & BigInt(JUMLAH_MAKS));
    bit >>= BigInt(BIT_PER_JUMLAH);
    if (jumlah > 0) ahliWaris[kunci] = jumlah;
  }
  const kasus: KasusBiasa = { pewaris: bit === 1n ? 'P' : 'L', ahliWaris };
  return periksaKasusBiasa(kasus) ? { ok: false, galat: 'KASUS_TIDAK_SAH' } : { ok: true, kasus };
}
