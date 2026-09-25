// Label sehari-hari untuk isian ahli waris dan pengelompokannya. Istilah fikih (label checklist) tampil sebagai caption.
// Label menyebut hubungannya dengan pewaris supaya tidak perlu menebak. Semua masih draf; `perluCek` sampai dicek tim keilmuan.

import type { KunciAhliWaris } from '@waris/engine';

export const PERLU_CEK_LABEL = true;

export const LABEL_SEHARI: Partial<Record<KunciAhliWaris, string>> = {
  SUAMI: 'Suami', ISTRI: 'Istri', ANAK_LK: 'Anak laki-laki', ANAK_PR: 'Anak perempuan', AYAH: 'Ayah', IBU: 'Ibu',
  CUCU_LK: 'Cucu laki-laki (dari anak laki-laki)', CUCU_PR: 'Cucu perempuan (dari anak laki-laki)',
  KAKEK: 'Kakek (ayahnya ayah pewaris)', NENEK_DARI_AYAH: 'Nenek (ibunya ayah pewaris)', NENEK_DARI_IBU: 'Nenek (ibunya ibu pewaris)',
  SAUDARA_KANDUNG: 'Kakak/adik laki-laki kandung', SAUDARI_KANDUNG: 'Kakak/adik perempuan kandung',
  SAUDARA_SEBAPAK: 'Kakak/adik laki-laki satu ayah', SAUDARI_SEBAPAK: 'Kakak/adik perempuan satu ayah',
  SAUDARA_SEIBU: 'Kakak/adik laki-laki satu ibu', SAUDARI_SEIBU: 'Kakak/adik perempuan satu ibu',
  KEPONAKAN_KANDUNG: 'Keponakan laki-laki (anak kakak/adik laki-laki kandung)', KEPONAKAN_SEBAPAK: 'Keponakan laki-laki (anak kakak/adik laki-laki satu ayah)',
  PAMAN_KANDUNG: 'Paman (saudara kandung ayah pewaris)', PAMAN_SEBAPAK: 'Paman (saudara satu ayah dari ayah pewaris)',
  SEPUPU_KANDUNG: 'Sepupu laki-laki (anak paman kandung)', SEPUPU_SEBAPAK: 'Sepupu laki-laki (anak paman satu ayah)',
};

/** Tambah cepat: kerabat yang paling sering ada. Pasangan menyesuaikan jenis kelamin mayit. */
export const TAMBAH_CEPAT: KunciAhliWaris[] = ['SUAMI', 'ISTRI', 'ANAK_LK', 'ANAK_PR', 'AYAH', 'IBU'];

export interface KelompokLain { judul: string; catatan?: string; pilihan: KunciAhliWaris[] }

/** Urutan "Tambah kerabat lain": dari atas ke bawah silsilah — kakek-nenek, cucu, kakak/adik, paman & sepupu, keponakan. */
export type BagianKerabatLain = { jenis: 'kelompok'; kelompok: KelompokLain } | { jenis: 'saudara' } | { jenis: 'paman' };
export const URUTAN_KERABAT_LAIN: BagianKerabatLain[] = [
  { jenis: 'kelompok', kelompok: { judul: 'Kakek & nenek', pilihan: ['KAKEK', 'NENEK_DARI_AYAH', 'NENEK_DARI_IBU'] } },
  { jenis: 'kelompok', kelompok: { judul: 'Cucu', catatan: 'Hanya cucu dari anak laki-laki.', pilihan: ['CUCU_LK', 'CUCU_PR'] } },
  { jenis: 'saudara' },
  { jenis: 'paman' },
  { jenis: 'kelompok', kelompok: { judul: 'Keponakan', catatan: 'Anak laki-laki dari kakak/adik laki-laki pewaris.', pilihan: ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK'] } },
];

/** Kakak/adik ditanya bertahap: jenis kelamin → hubungan orang tua → kunci. */
export const HUBUNGAN_SAUDARA = [
  { nilai: 'kandung', label: 'Satu ayah satu ibu', L: 'SAUDARA_KANDUNG', P: 'SAUDARI_KANDUNG' },
  { nilai: 'sebapak', label: 'Satu ayah saja (beda ibu)', L: 'SAUDARA_SEBAPAK', P: 'SAUDARI_SEBAPAK' },
  { nilai: 'seibu', label: 'Satu ibu saja (beda ayah)', L: 'SAUDARA_SEIBU', P: 'SAUDARI_SEIBU' },
] as const satisfies ReadonlyArray<{ nilai: string; label: string; L: KunciAhliWaris; P: KunciAhliWaris }>;

/** Paman & sepupu (pihak ayah) ditanya bertahap: siapa → hubungan paman dengan ayah pewaris → kunci. */
export const HUBUNGAN_PAMAN = [
  { nilai: 'kandung', label: 'Paman adalah saudara kandung ayah pewaris', ringkas: 'kandung', PAMAN: 'PAMAN_KANDUNG', SEPUPU: 'SEPUPU_KANDUNG' },
  { nilai: 'sebapak', label: 'Paman hanya satu ayah dengan ayah pewaris (satu ayah saja)', ringkas: 'satu ayah saja', PAMAN: 'PAMAN_SEBAPAK', SEPUPU: 'SEPUPU_SEBAPAK' },
] as const satisfies ReadonlyArray<{ nilai: string; label: string; ringkas: string; PAMAN: KunciAhliWaris; SEPUPU: KunciAhliWaris }>;
