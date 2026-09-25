// Label sehari-hari untuk isian ahli waris dan pengelompokannya. Istilah fikih (label checklist) tampil sebagai caption.
// Semua label sehari-hari masih draf; `perluCek` sampai dicek tim keilmuan.

import type { KunciAhliWaris } from '@waris/engine';

export const PERLU_CEK_LABEL = true;

export const LABEL_SEHARI: Partial<Record<KunciAhliWaris, string>> = {
  SUAMI: 'Suami', ISTRI: 'Istri', ANAK_LK: 'Anak laki-laki', ANAK_PR: 'Anak perempuan', AYAH: 'Ayah', IBU: 'Ibu',
  CUCU_LK: 'Cucu laki-laki dari putra', CUCU_PR: 'Cucu perempuan dari putra',
  KAKEK: 'Kakek (ayahnya ayah)', NENEK_DARI_AYAH: 'Nenek (ibunya ayah)', NENEK_DARI_IBU: 'Nenek (ibunya ibu)',
  SAUDARA_KANDUNG: 'Kakak/adik laki-laki kandung', SAUDARI_KANDUNG: 'Kakak/adik perempuan kandung',
  SAUDARA_SEBAPAK: 'Kakak/adik laki-laki satu ayah', SAUDARI_SEBAPAK: 'Kakak/adik perempuan satu ayah',
  SAUDARA_SEIBU: 'Kakak/adik laki-laki satu ibu', SAUDARI_SEIBU: 'Kakak/adik perempuan satu ibu',
  KEPONAKAN_KANDUNG: 'Keponakan laki-laki (dari kakak/adik kandung)', KEPONAKAN_SEBAPAK: 'Keponakan laki-laki (dari kakak/adik satu ayah)',
  PAMAN_KANDUNG: 'Paman (kakak/adik kandung ayah)', PAMAN_SEBAPAK: 'Paman (kakak/adik ayah, beda nenek)',
  SEPUPU_KANDUNG: 'Sepupu laki-laki (anak paman kandung)', SEPUPU_SEBAPAK: 'Sepupu laki-laki (anak paman beda nenek)',
};

/** Tambah cepat: kerabat yang paling sering ada. Pasangan menyesuaikan jenis kelamin mayit. */
export const TAMBAH_CEPAT: KunciAhliWaris[] = ['SUAMI', 'ISTRI', 'ANAK_LK', 'ANAK_PR', 'AYAH', 'IBU'];

export interface KelompokLain { judul: string; catatan?: string; pilihan: KunciAhliWaris[] }

export const KELOMPOK_LAIN: KelompokLain[] = [
  { judul: 'Cucu', catatan: 'Hanya cucu dari anak laki-laki. Cucu dari anak perempuan tidak termasuk ahli waris di sini.', pilihan: ['CUCU_LK', 'CUCU_PR'] },
  { judul: 'Kakek & nenek', catatan: 'Kakek dari pihak ibu tidak termasuk ahli waris di sini.', pilihan: ['KAKEK', 'NENEK_DARI_AYAH', 'NENEK_DARI_IBU'] },
  { judul: 'Keponakan', catatan: 'Anak laki-laki dari kakak/adik laki-laki almarhum.', pilihan: ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK'] },
  { judul: 'Paman & sepupu', catatan: 'Dari pihak ayah.', pilihan: ['PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'] },
];

/** Kakak/adik ditanya bertahap: jenis kelamin → hubungan orang tua → kunci. */
export const HUBUNGAN_SAUDARA = [
  { nilai: 'kandung', label: 'Satu ayah satu ibu', L: 'SAUDARA_KANDUNG', P: 'SAUDARI_KANDUNG' },
  { nilai: 'sebapak', label: 'Satu ayah saja (beda ibu)', L: 'SAUDARA_SEBAPAK', P: 'SAUDARI_SEBAPAK' },
  { nilai: 'seibu', label: 'Satu ibu saja (beda ayah)', L: 'SAUDARA_SEIBU', P: 'SAUDARI_SEIBU' },
] as const satisfies ReadonlyArray<{ nilai: string; label: string; L: KunciAhliWaris; P: KunciAhliWaris }>;
