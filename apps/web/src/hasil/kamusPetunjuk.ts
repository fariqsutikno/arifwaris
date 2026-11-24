// Peta kunci diksi petunjuk dan nama kasus. Kunci t() harus literal (tes diksi memeriksa cakupannya terhadap snapshot),
// jadi pemilihan menurut kunci dari @waris/latihan lewat peta ini, bukan kunci yang dirangkai.

import { t } from '../terjemah';
import type { Fokus, NamaKasus } from '@waris/latihan';

export type Sisipan = Record<string, string | number>;
type Kalimat = (sisipan: Sisipan) => string;

/** Kunci petunjuk dari `petunjukKolom` (camelCase) → kalimat petunjuk 1. */
export const KALIMAT_P1: Record<string, Kalimat> = {
  'pilihan.terhalangKeliru': sisipan => t('hitung.bantuan.p1.pilihan.terhalang_keliru', sisipan),
  'pilihan.mewarisiKeliru': sisipan => t('hitung.bantuan.p1.pilihan.mewarisi_keliru', sisipan),
  'pilihan.caraKeliru': sisipan => t('hitung.bantuan.p1.pilihan.cara_keliru', sisipan),
  'pilihan.besarKeliru': sisipan => t('hitung.bantuan.p1.pilihan.besar_keliru', sisipan),
  'pilihan.kedudukanKeliru': sisipan => t('hitung.bantuan.p1.pilihan.kedudukan_keliru', sisipan),
  'ashl': sisipan => t('hitung.bantuan.p1.ashl', sisipan),
  'saham': sisipan => t('hitung.bantuan.p1.saham', sisipan),
  'ashl.kemungkinan': sisipan => t('hitung.bantuan.p1.ashl.kemungkinan', sisipan),
  'jumlahSaham': sisipan => t('hitung.bantuan.p1.jumlah_saham', sisipan),
  'jumlahSaham.perOrang': sisipan => t('hitung.bantuan.p1.jumlah_saham.per_orang', sisipan),
  'saudariKakek.akhir': sisipan => t('hitung.bantuan.p1.saudari_kakek.akhir', sisipan),
  'bulat': sisipan => t('hitung.bantuan.p1.bulat', sisipan),
  'bulat.perOrang': sisipan => t('hitung.bantuan.p1.bulat.per_orang', sisipan),
  'munasakhat.masalah': sisipan => t('hitung.bantuan.p1.munasakhat.masalah', sisipan),
  'munasakhat.pengali': sisipan => t('hitung.bantuan.p1.munasakhat.pengali', sisipan),
  'munasakhat.jamiah': sisipan => t('hitung.bantuan.p1.munasakhat.jamiah', sisipan),
  'kemungkinan.jamiah': sisipan => t('hitung.bantuan.p1.kemungkinan.jamiah', sisipan),
  'kemungkinan.pemberian': sisipan => t('hitung.bantuan.p1.kemungkinan.pemberian', sisipan),
  'umum': sisipan => t('hitung.bantuan.p1.umum', sisipan),
  'kosong': sisipan => t('hitung.bantuan.p1.kosong', sisipan),
};

/** Kunci petunjuk dari `petunjukKolom` (camelCase) → kalimat petunjuk 2. */
export const KALIMAT_P2: Record<string, Kalimat> = {
  'kontras': sisipan => t('hitung.bantuan.p2.kontras', sisipan),
  'materi': sisipan => t('hitung.bantuan.p2.materi', sisipan),
  'umum': sisipan => t('hitung.bantuan.p2.umum', sisipan),
  'kosong': sisipan => t('hitung.bantuan.p2.kosong', sisipan),
  'ashl': sisipan => t('hitung.bantuan.p2.ashl', sisipan),
  'saham': sisipan => t('hitung.bantuan.p2.saham', sisipan),
  'ashl.kemungkinan': sisipan => t('hitung.bantuan.p2.ashl.kemungkinan', sisipan),
  'jumlahSaham': sisipan => t('hitung.bantuan.p2.jumlah_saham', sisipan),
  'jumlahSaham.perOrang': sisipan => t('hitung.bantuan.p2.jumlah_saham.per_orang', sisipan),
  'saudariKakek.akhir': sisipan => t('hitung.bantuan.p2.saudari_kakek.akhir', sisipan),
  'bulat': sisipan => t('hitung.bantuan.p2.bulat', sisipan),
  'bulat.perOrang': sisipan => t('hitung.bantuan.p2.bulat.per_orang', sisipan),
  'munasakhat.masalah': sisipan => t('hitung.bantuan.p2.munasakhat.masalah', sisipan),
  'munasakhat.pengali': sisipan => t('hitung.bantuan.p2.munasakhat.pengali', sisipan),
  'munasakhat.jamiah': sisipan => t('hitung.bantuan.p2.munasakhat.jamiah', sisipan),
  'kemungkinan.jamiah': sisipan => t('hitung.bantuan.p2.kemungkinan.jamiah', sisipan),
  'kemungkinan.pemberian': sisipan => t('hitung.bantuan.p2.kemungkinan.pemberian', sisipan),
};

export const NAMA_FOKUS: Record<Fokus, () => string> = {
  keturunan: () => t('hitung.bantuan.fokus.keturunan'),
  saudara: () => t('hitung.bantuan.fokus.saudara'),
  keturunanDanSaudara: () => t('hitung.bantuan.fokus.keturunan_dan_saudara'),
  generasiAtas: () => t('hitung.bantuan.fokus.generasi_atas'),
  sederajat: () => t('hitung.bantuan.fokus.sederajat'),
  lebihDekat: () => t('hitung.bantuan.fokus.lebih_dekat'),
  kakekSaudara: () => t('hitung.bantuan.fokus.kakek_saudara'),
  sifatOrang: () => t('hitung.bantuan.fokus.sifat_orang'),
};

export const NAMA_KASUS: Record<NamaKasus, () => string> = {
  aul: () => t('hitung.selesai.nama_kasus.aul'),
  radd: () => t('hitung.selesai.nama_kasus.radd'),
  inkisar: () => t('hitung.selesai.nama_kasus.inkisar'),
  hajb_nuqshan: () => t('hitung.selesai.nama_kasus.hajb_nuqshan'),
  akdariyyah: () => t('hitung.selesai.nama_kasus.akdariyyah'),
  musyarrakah: () => t('hitung.selesai.nama_kasus.musyarrakah'),
  umariyyatain: () => t('hitung.selesai.nama_kasus.umariyyatain'),
};
