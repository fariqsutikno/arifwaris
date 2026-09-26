// Label sehari-hari untuk isian ahli waris dan pengelompokannya. Istilah fikih (label checklist) tampil sebagai caption.
// Label menyebut hubungannya dengan almarhum supaya tidak perlu menebak. Semua masih draf; `perluCek` sampai dicek tim keilmuan.

import type { KunciAhliWaris } from '@waris/engine';

export const PERLU_CEK_LABEL = true;

export const LABEL_SEHARI: Partial<Record<KunciAhliWaris, string>> = {
  SUAMI: 'Suami', ISTRI: 'Istri', ANAK_LK: 'Anak laki-laki', ANAK_PR: 'Anak perempuan', AYAH: 'Ayah', IBU: 'Ibu',
  CUCU_LK: 'Cucu laki-laki', CUCU_PR: 'Cucu perempuan',
  KAKEK: 'Kakek (dari ayah)', NENEK_DARI_AYAH: 'Nenek (dari ayah)', NENEK_DARI_IBU: 'Nenek (dari ibu)',
  SAUDARA_KANDUNG: 'Kakak/adik laki-laki kandung', SAUDARI_KANDUNG: 'Kakak/adik perempuan kandung',
  SAUDARA_SEBAPAK: 'Kakak/adik laki-laki satu ayah', SAUDARI_SEBAPAK: 'Kakak/adik perempuan satu ayah',
  SAUDARA_SEIBU: 'Kakak/adik laki-laki satu ibu', SAUDARI_SEIBU: 'Kakak/adik perempuan satu ibu',
  KEPONAKAN_KANDUNG: 'Keponakan laki-laki (kandung)', KEPONAKAN_SEBAPAK: 'Keponakan laki-laki (satu ayah)',
  PAMAN_KANDUNG: 'Paman (kandung)', PAMAN_SEBAPAK: 'Paman (satu ayah)',
  SEPUPU_KANDUNG: 'Sepupu laki-laki (kandung)', SEPUPU_SEBAPAK: 'Sepupu laki-laki (satu ayah)',
};

/**
 * Padanan Arab untuk mode 'id+ar', ditulis dari transliterasi di tabel KB bab 3.1–3.2 [R03-1].
 * Tanpa harakat (keputusan 2026-09-26). Draf: `perluCek` sampai dicek tim keilmuan.
 */
export const LABEL_ARAB: Record<KunciAhliWaris, string> = {
  ANAK_LK: 'الابن', CUCU_LK: 'ابن الابن', AYAH: 'الأب', KAKEK: 'الجد', SAUDARA_KANDUNG: 'الأخ الشقيق',
  SAUDARA_SEBAPAK: 'الأخ لأب', SAUDARA_SEIBU: 'الأخ لأم', KEPONAKAN_KANDUNG: 'ابن الأخ الشقيق', KEPONAKAN_SEBAPAK: 'ابن الأخ لأب',
  PAMAN_KANDUNG: 'العم الشقيق', PAMAN_SEBAPAK: 'العم لأب', SEPUPU_KANDUNG: 'ابن العم الشقيق', SEPUPU_SEBAPAK: 'ابن العم لأب',
  SUAMI: 'الزوج', MUTIQ: 'المعتق',
  ANAK_PR: 'البنت', CUCU_PR: 'بنت الابن', IBU: 'الأم', NENEK_DARI_IBU: 'أم الأم', NENEK_DARI_AYAH: 'أم الأب',
  SAUDARI_KANDUNG: 'الأخت الشقيقة', SAUDARI_SEBAPAK: 'الأخت لأب', SAUDARI_SEIBU: 'الأخت لأم', ISTRI: 'الزوجة', MUTIQAH: 'المعتقة',
};

/** Keterangan kecil di bawah label, hanya bila labelnya belum cukup jelas. */
export const KETERANGAN_HUBUNGAN: Partial<Record<KunciAhliWaris, string>> = {
  CUCU_LK: 'dari anak laki-laki', CUCU_PR: 'dari anak laki-laki',
  KAKEK: 'ayahnya ayah almarhum', NENEK_DARI_AYAH: 'ibunya ayah almarhum', NENEK_DARI_IBU: 'ibunya ibu almarhum',
  SAUDARA_SEBAPAK: 'ayahnya sama, ibunya beda', SAUDARI_SEBAPAK: 'ayahnya sama, ibunya beda',
  SAUDARA_SEIBU: 'ibunya sama, ayahnya beda', SAUDARI_SEIBU: 'ibunya sama, ayahnya beda',
  KEPONAKAN_KANDUNG: 'anak dari kakak/adik laki-laki kandung', KEPONAKAN_SEBAPAK: 'anak dari kakak/adik laki-laki satu ayah',
  PAMAN_KANDUNG: 'saudara kandung ayah almarhum', PAMAN_SEBAPAK: 'saudara satu ayah dari ayah almarhum',
  SEPUPU_KANDUNG: 'anak laki-laki paman kandung', SEPUPU_SEBAPAK: 'anak laki-laki paman satu ayah',
};

/** [R14-4] kerabat yang bukan ashabul furudh dan bukan ashabah (bab 14.2): sengaja tidak ada di daftar. */
export const INFO_TIDAK_ADA = {
  judul: 'Kok kakek dari ibu, cucu dari anak perempuan, atau bibi tidak ada?',
  isi: 'Mereka termasuk dzawil arham: kerabat yang tidak punya bagian tertentu dan bukan penerima sisa. ' +
    'Contohnya ayahnya ibu, anak dari anak perempuan, anak dari kakak/adik perempuan, paman dari pihak ibu, bibi, dan anak dari kakak/adik seibu. ' +
    'Mereka baru mewarisi kalau tidak ada ahli waris di daftar ini, dan perhitungannya belum didukung aplikasi.',
};

/** Keluarga inti: selalu tampil di atas. Pasangan menyesuaikan jenis kelamin almarhum. */
export const KELUARGA_INTI: KunciAhliWaris[] = ['SUAMI', 'ISTRI', 'ANAK_LK', 'ANAK_PR', 'AYAH', 'IBU'];

export interface KelompokKerabat { judul: string; pilihan: KunciAhliWaris[] }

/** Kerabat lain, urut silsilah: kakek-nenek, cucu, kakak/adik, paman & sepupu, keponakan. */
export const KERABAT_LAIN: KelompokKerabat[] = [
  { judul: 'Kakek & nenek', pilihan: ['KAKEK', 'NENEK_DARI_AYAH', 'NENEK_DARI_IBU'] },
  { judul: 'Cucu', pilihan: ['CUCU_LK', 'CUCU_PR'] },
  { judul: 'Kakak/adik almarhum', pilihan: ['SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU'] },
  { judul: 'Paman & sepupu dari pihak ayah', pilihan: ['PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'] },
  { judul: 'Keponakan', pilihan: ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK'] },
];

/** "almarhum" → "almarhumah" bila almarhum perempuan. */
export function sebutAlmarhum(teks: string, jenisKelamin: 'L' | 'P'): string {
  return jenisKelamin === 'P' ? teks.replace(/([Aa]lmarhum)\b/g, '$1ah') : teks;
}
