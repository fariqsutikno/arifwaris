// Menyusun kalimat petunjuk dari data pemilih (`petunjukKolom` di @waris/latihan) dan kamus diksi `hitung.bantuan.*`.
// Tidak ada kalimat fikih di sini: kalimatnya milik diksi; file ini hanya memilih kunci dan mengisi sisipan.

import type { PetunjukKolom } from '@waris/latihan';
import { t } from '../terjemah';

/** Nama-nama yang hanya diketahui layar (judul kolom, orang, kemungkinan); diberikan pemanggil supaya file ini tetap murni. */
export interface BahanKalimat {
  judulKolom: (idKolom: string) => string;
  namaKemungkinan: (kemungkinan: string | undefined) => string;
  namaMayit: (idMayit: string) => string;
  labelPeran: (kunciPeran: string) => string;
  labelBagian: (bagian: string) => string;
}
export interface IsiPetunjuk { teks: string; /** Hanya p2.materi: nomor bab untuk tautan materi. */ bab?: string }

/** Kunci diksi memakai snake_case (skrip tambah-diksi menolak huruf besar). */
const keSnake = (kunci: string): string => kunci.replace(/[A-Z]/g, huruf => `_${huruf.toLowerCase()}`);
const awalKecil = (teks: string): string => teks.charAt(0).toLowerCase() + teks.slice(1);

export function kalimatPetunjuk(tingkat: 1 | 2, petunjuk: PetunjukKolom, bahan: BahanKalimat): IsiPetunjuk {
  const { kunci, parameter } = tingkat === 1 ? petunjuk.p1 : petunjuk.p2;
  const sisipan: Record<string, string> = {
    nama: parameter.nama ?? t('hitung.bantuan.nama_ini'),
    ...(parameter.kolom ? { kolom: bahan.judulKolom(parameter.kolom) } : {}),
    ...(parameter.kemungkinan ? { kemungkinan: bahan.namaKemungkinan(parameter.kemungkinan) } : {}),
    ...(parameter.mayit ? { mayit: bahan.namaMayit(parameter.mayit) } : {}),
    ...(parameter.kelompok ? { kelompok: parameter.kelompok } : {}),
    ...(parameter.kakek ? { kakek: parameter.kakek } : {}),
    ...(parameter.saudari ? { saudari: parameter.saudari } : {}),
    ...(parameter.bab ? { bab: parameter.bab } : {}),
    ...(kunci === 'kontras' ? sisipanKontras(parameter, bahan) : {}),
  };
  const dasar = t(`hitung.bantuan.p${tingkat}.${keSnake(kunci)}`, sisipan);
  if (tingkat === 2) return { teks: dasar, ...(kunci === 'materi' ? { bab: parameter.bab! } : {}) };
  if (!kunci.startsWith('pilihan.')) return { teks: dasar };
  const awal = parameter.kemungkinan ? t('hitung.bantuan.pada_kemungkinan', { kemungkinan: sisipan.kemungkinan! }) + awalKecil(dasar) : dasar;
  const { fokus } = petunjuk.p1;
  const arah = fokus.length > 0 ? t('hitung.bantuan.fokus_kalimat', { kategori: fokus.map(kategori => t(`hitung.bantuan.fokus.${keSnake(kategori)}`)).join(t('hitung.bantuan.fokus_dan')) }) : '';
  const perantara = parameter.perantara ? t('hitung.bantuan.perantara') : '';
  return { teks: [awal, arah, perantara].filter(Boolean).join(' ') };
}

function sisipanKontras(parameter: Record<string, string>, bahan: BahanKalimat): Record<string, string> {
  const keluarga = (susunan: string | undefined) => (susunan ?? '').split(',').filter(Boolean).map(bahan.labelPeran).join(', ');
  return {
    peran: bahan.labelPeran(parameter.peran ?? ''), kasusA: keluarga(parameter.susunanA), kasusB: keluarga(parameter.susunanB),
    bagianA: bahan.labelBagian(parameter.bagianA ?? ''), bagianB: bahan.labelBagian(parameter.bagianB ?? ''),
  };
}
