// Label sehari-hari untuk isian ahli waris dan pengelompokannya. Istilah fikih (label checklist) tampil sebagai caption.
// Label menyebut hubungannya dengan almarhum supaya tidak perlu menebak. Semua masih draf; `perluCek` sampai dicek tim keilmuan.

import type { KunciAhliWaris } from '@waris/engine';
import { t } from '../terjemah';

export const PERLU_CEK_LABEL = true;

export const LABEL_SEHARI: Partial<Record<KunciAhliWaris, string>> = {
  SUAMI: t('Suami'), ISTRI: t('Istri'), ANAK_LK: t('Anak laki-laki'), ANAK_PR: t('Anak perempuan'), AYAH: t('Ayah'), IBU: t('Ibu'),
  CUCU_LK: t('Cucu laki-laki'), CUCU_PR: t('Cucu perempuan'),
  KAKEK: t('Kakek (dari ayah)'), NENEK_DARI_AYAH: t('Nenek (dari ayah)'), NENEK_DARI_IBU: t('Nenek (dari ibu)'),
  SAUDARA_KANDUNG: t('Kakak/adik laki-laki kandung'), SAUDARI_KANDUNG: t('Kakak/adik perempuan kandung'),
  SAUDARA_SEBAPAK: t('Kakak/adik laki-laki satu ayah'), SAUDARI_SEBAPAK: t('Kakak/adik perempuan satu ayah'),
  SAUDARA_SEIBU: t('Kakak/adik laki-laki satu ibu'), SAUDARI_SEIBU: t('Kakak/adik perempuan satu ibu'),
  KEPONAKAN_KANDUNG: t('Keponakan laki-laki (kandung)'), KEPONAKAN_SEBAPAK: t('Keponakan laki-laki (satu ayah)'),
  PAMAN_KANDUNG: t('Paman (kandung)'), PAMAN_SEBAPAK: t('Paman (satu ayah)'),
  SEPUPU_KANDUNG: t('Sepupu laki-laki (kandung)'), SEPUPU_SEBAPAK: t('Sepupu laki-laki (satu ayah)'),
};

/** Keterangan kecil di bawah label, hanya bila labelnya belum cukup jelas. */
export const KETERANGAN_HUBUNGAN: Partial<Record<KunciAhliWaris, string>> = {
  CUCU_LK: t('dari anak laki-laki'), CUCU_PR: t('dari anak laki-laki'),
  KAKEK: t('ayahnya ayah almarhum'), NENEK_DARI_AYAH: t('ibunya ayah almarhum'), NENEK_DARI_IBU: t('ibunya ibu almarhum'),
  SAUDARA_SEBAPAK: t('ayahnya sama, ibunya beda'), SAUDARI_SEBAPAK: t('ayahnya sama, ibunya beda'),
  SAUDARA_SEIBU: t('ibunya sama, ayahnya beda'), SAUDARI_SEIBU: t('ibunya sama, ayahnya beda'),
  KEPONAKAN_KANDUNG: t('anak dari kakak/adik laki-laki kandung'), KEPONAKAN_SEBAPAK: t('anak dari kakak/adik laki-laki satu ayah'),
  PAMAN_KANDUNG: t('saudara kandung ayah almarhum'), PAMAN_SEBAPAK: t('saudara satu ayah dari ayah almarhum'),
  SEPUPU_KANDUNG: t('anak laki-laki paman kandung'), SEPUPU_SEBAPAK: t('anak laki-laki paman satu ayah'),
};

/** [R14-4] kerabat yang bukan ashabul furudh dan bukan ashabah (bab 14.2): sengaja tidak ada di daftar. */
export const INFO_TIDAK_ADA = {
  judul: t('Kok kakek dari ibu, cucu dari anak perempuan, atau bibi tidak ada?'),
  isi: t('Mereka termasuk dzawil arham: kerabat yang tidak punya bagian tertentu dan bukan penerima sisa. ') +
    t('Contohnya ayahnya ibu, anak dari anak perempuan, anak dari kakak/adik perempuan, paman dari pihak ibu, bibi, dan anak dari kakak/adik seibu. ') +
    t('Mereka baru mewarisi kalau tidak ada ahli waris di daftar ini, dan perhitungannya belum didukung aplikasi.'),
};

/** Keluarga inti: selalu tampil di atas. Pasangan menyesuaikan jenis kelamin almarhum. */
export const KELUARGA_INTI: KunciAhliWaris[] = ['SUAMI', 'ISTRI', 'ANAK_LK', 'ANAK_PR', 'AYAH', 'IBU'];

export interface KelompokKerabat { judul: string; pilihan: KunciAhliWaris[] }

/** Kerabat lain, urut silsilah: kakek-nenek, cucu, kakak/adik, paman & sepupu, keponakan. */
export const KERABAT_LAIN: KelompokKerabat[] = [
  { judul: t('Kakek & nenek'), pilihan: ['KAKEK', 'NENEK_DARI_AYAH', 'NENEK_DARI_IBU'] },
  { judul: t('Cucu'), pilihan: ['CUCU_LK', 'CUCU_PR'] },
  { judul: t('Kakak/adik almarhum'), pilihan: ['SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU'] },
  { judul: t('Paman & sepupu dari pihak ayah'), pilihan: ['PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'] },
  { judul: t('Keponakan'), pilihan: ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK'] },
];

/** "almarhum" → "almarhumah" bila almarhum perempuan. */
export function sebutAlmarhum(teks: string, jenisKelamin: 'L' | 'P'): string {
  return jenisKelamin === 'P' ? teks.replace(/([Aa]lmarhum)\b/g, '$1ah') : teks;
}
