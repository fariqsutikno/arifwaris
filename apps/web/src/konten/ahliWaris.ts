// Label sehari-hari untuk isian ahli waris dan pengelompokannya. Istilah fikih (label checklist) tampil sebagai caption.
// Label menyebut hubungannya dengan almarhum supaya tidak perlu menebak.

import type { KunciAhliWaris } from '@waris/engine';
import { teksEdukasi } from '../terjemah';


export const LABEL_SEHARI: Partial<Record<KunciAhliWaris, string>> = {
  SUAMI: teksEdukasi('ahli_waris.suami'), ISTRI: teksEdukasi('ahli_waris.istri'), ANAK_LK: teksEdukasi('ahli_waris.anak_laki_laki'), ANAK_PR: teksEdukasi('ahli_waris.anak_perempuan'), AYAH: teksEdukasi('ahli_waris.ayah'), IBU: teksEdukasi('ahli_waris.ibu'),
  CUCU_LK: teksEdukasi('ahli_waris.cucu_laki_laki'), CUCU_PR: teksEdukasi('ahli_waris.cucu_perempuan'),
  KAKEK: teksEdukasi('ahli_waris.kakek_dari_ayah'), NENEK_DARI_AYAH: teksEdukasi('ahli_waris.nenek_dari_ayah'), NENEK_DARI_IBU: teksEdukasi('ahli_waris.nenek_dari_ibu'),
  SAUDARA_KANDUNG: teksEdukasi('ahli_waris.kakak_adik_laki_laki_kandung'), SAUDARI_KANDUNG: teksEdukasi('ahli_waris.kakak_adik_perempuan_kandung'),
  SAUDARA_SEBAPAK: teksEdukasi('ahli_waris.kakak_adik_laki_laki_satu_ayah'), SAUDARI_SEBAPAK: teksEdukasi('ahli_waris.kakak_adik_perempuan_satu_ayah'),
  SAUDARA_SEIBU: teksEdukasi('ahli_waris.kakak_adik_laki_laki_satu_ibu'), SAUDARI_SEIBU: teksEdukasi('ahli_waris.kakak_adik_perempuan_satu_ibu'),
  KEPONAKAN_KANDUNG: teksEdukasi('ahli_waris.keponakan_laki_laki_kandung'), KEPONAKAN_SEBAPAK: teksEdukasi('ahli_waris.keponakan_laki_laki_satu_ayah'),
  PAMAN_KANDUNG: teksEdukasi('ahli_waris.paman_kandung'), PAMAN_SEBAPAK: teksEdukasi('ahli_waris.paman_satu_ayah'),
  SEPUPU_KANDUNG: teksEdukasi('ahli_waris.sepupu_laki_laki_kandung'), SEPUPU_SEBAPAK: teksEdukasi('ahli_waris.sepupu_laki_laki_satu_ayah'),
};

/** Keterangan kecil di bawah label, hanya bila labelnya belum cukup jelas. */
export const KETERANGAN_HUBUNGAN: Partial<Record<KunciAhliWaris, string>> = {
  CUCU_LK: teksEdukasi('ahli_waris.dari_anak_laki_laki'), CUCU_PR: teksEdukasi('ahli_waris.dari_anak_laki_laki'),
  KAKEK: teksEdukasi('ahli_waris.ayahnya_ayah_almarhum'), NENEK_DARI_AYAH: teksEdukasi('ahli_waris.ibunya_ayah_almarhum'), NENEK_DARI_IBU: teksEdukasi('ahli_waris.ibunya_ibu_almarhum'),
  SAUDARA_SEBAPAK: teksEdukasi('ahli_waris.ayahnya_sama_ibunya_beda'), SAUDARI_SEBAPAK: teksEdukasi('ahli_waris.ayahnya_sama_ibunya_beda'),
  SAUDARA_SEIBU: teksEdukasi('ahli_waris.ibunya_sama_ayahnya_beda'), SAUDARI_SEIBU: teksEdukasi('ahli_waris.ibunya_sama_ayahnya_beda'),
  KEPONAKAN_KANDUNG: teksEdukasi('ahli_waris.anak_dari_kakak_adik_laki_laki'), KEPONAKAN_SEBAPAK: teksEdukasi('ahli_waris.anak_dari_kakak_adik_laki_laki_2'),
  PAMAN_KANDUNG: teksEdukasi('ahli_waris.saudara_kandung_ayah_almarhum'), PAMAN_SEBAPAK: teksEdukasi('ahli_waris.saudara_satu_ayah_dari_ayah_almarhum'),
  SEPUPU_KANDUNG: teksEdukasi('ahli_waris.anak_laki_laki_paman_kandung'), SEPUPU_SEBAPAK: teksEdukasi('ahli_waris.anak_laki_laki_paman_satu_ayah'),
};

/** [R14-4] kerabat yang bukan ashabul furudh dan bukan ashabah (bab 14.2): sengaja tidak ada di daftar. */
export const INFO_TIDAK_ADA = {
  judul: teksEdukasi('ahli_waris.kok_kakek_dari_ibu_cucu_dari'),
  isi: teksEdukasi('ahli_waris.mereka_termasuk_dzawil_arham_kerabat_yang') +
    teksEdukasi('ahli_waris.contohnya_ayahnya_ibu_anak_dari_anak') +
    teksEdukasi('ahli_waris.mereka_baru_mewarisi_kalau_tidak_ada'),
};

/** Keluarga inti: selalu tampil di atas. Pasangan menyesuaikan jenis kelamin almarhum. */
export const KELUARGA_INTI: KunciAhliWaris[] = ['SUAMI', 'ISTRI', 'ANAK_LK', 'ANAK_PR', 'AYAH', 'IBU'];

export interface KelompokKerabat { judul: string; pilihan: KunciAhliWaris[] }

/** Kerabat lain, urut silsilah: kakek-nenek, cucu, kakak/adik, paman & sepupu, keponakan. */
export const KERABAT_LAIN: KelompokKerabat[] = [
  { judul: teksEdukasi('ahli_waris.kakek_nenek'), pilihan: ['KAKEK', 'NENEK_DARI_AYAH', 'NENEK_DARI_IBU'] },
  { judul: teksEdukasi('ahli_waris.cucu'), pilihan: ['CUCU_LK', 'CUCU_PR'] },
  { judul: teksEdukasi('ahli_waris.kakak_adik_almarhum'), pilihan: ['SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU'] },
  { judul: teksEdukasi('ahli_waris.paman_sepupu_dari_pihak_ayah'), pilihan: ['PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'] },
  { judul: teksEdukasi('ahli_waris.keponakan'), pilihan: ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK'] },
];

/** "almarhum" → "almarhumah" bila almarhum perempuan. */
export function sebutAlmarhum(teks: string, jenisKelamin: 'L' | 'P'): string {
  return jenisKelamin === 'P' ? teks.replace(/([Aa]lmarhum)\b/g, '$1ah') : teks;
}
