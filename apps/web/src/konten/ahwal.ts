// Ahwal: semua kemungkinan bagian tiap ahli waris, ditampilkan di modal orang ("Kapan dapat berapa?").
// Baris yang berlaku di kasus ini dicocokkan dengan data engine (fardh di tabel, ashabah, terhalang, kode alasan fardh),
// bukan ditebak UI. SELURUH ISI INI DRAF dan perlu dicek tim keilmuan terhadap KB [SYF] sebelum dipakai sungguhan.

import type { KunciAhliWaris } from '@waris/engine';
import { t } from '../terjemah';

export const AHWAL_PERLU_CEK = true;

/** Syarat cocok: semua kolom yang diisi harus sama dengan data orang itu di hasil engine. */
/** `fardh: null` = harus tanpa bagian tertentu (fardh). */
export interface CocokAhwal { fardh?: string | null; ashabah?: boolean; terhalang?: boolean; kodeAlasan?: string }
export interface BarisAhwal { bagian: string; syarat: string; cocok: CocokAhwal }

export const AHWAL: Partial<Record<KunciAhliWaris, BarisAhwal[]>> = {
  SUAMI: [
    { bagian: '1/2', syarat: t('Almarhumah tidak punya anak atau cucu dari anak laki-laki.'), cocok: { fardh: '1/2' } },
    { bagian: '1/4', syarat: t('Almarhumah punya anak atau cucu dari anak laki-laki.'), cocok: { fardh: '1/4' } },
  ],
  ISTRI: [
    { bagian: '1/4', syarat: t('Almarhum tidak punya anak atau cucu dari anak laki-laki.'), cocok: { fardh: '1/4' } },
    { bagian: '1/8', syarat: t('Almarhum punya anak atau cucu dari anak laki-laki.'), cocok: { fardh: '1/8' } },
  ],
  IBU: [
    { bagian: '1/6', syarat: t('Ada anak/cucu, atau ada dua saudara atau lebih.'), cocok: { fardh: '1/6' } },
    { bagian: '1/3', syarat: t('Tidak ada anak/cucu dan saudaranya kurang dari dua.'), cocok: { fardh: '1/3', kodeAlasan: 'TANPA_FARU_WARITS_DAN_IKHWAH' } },
    { bagian: '1/3 sisa', syarat: t('Hanya bersama ayah dan suami/istri (umariyyatain).'), cocok: { kodeAlasan: 'UMARIYYATAIN' } },
  ],
  AYAH: [
    { bagian: '1/6', syarat: t('Ada anak laki-laki atau cucu laki-laki.'), cocok: { fardh: '1/6', ashabah: false } },
    { bagian: '1/6 + sisa', syarat: t('Hanya ada anak/cucu perempuan.'), cocok: { fardh: '1/6', ashabah: true } },
    { bagian: t('Sisa (ashabah)'), syarat: t('Tidak ada anak maupun cucu.'), cocok: { fardh: null, ashabah: true } },
  ],
  ANAK_LK: [
    { bagian: t('Sisa (ashabah)'), syarat: t('Selalu mewarisi dan tidak pernah terhalang. Bersama anak perempuan: dapat dua kali bagiannya.'), cocok: { ashabah: true } },
  ],
  ANAK_PR: [
    { bagian: '1/2', syarat: t('Sendirian, tanpa anak laki-laki.'), cocok: { fardh: '1/2' } },
    { bagian: '2/3', syarat: t('Dua orang atau lebih, tanpa anak laki-laki.'), cocok: { fardh: '2/3' } },
    { bagian: t('Sisa, 1 : 2'), syarat: t('Bersama anak laki-laki (ashabah bil ghair).'), cocok: { ashabah: true } },
  ],
  SAUDARA_KANDUNG: [
    { bagian: t('Sisa (ashabah)'), syarat: t('Tidak ada anak laki-laki, cucu laki-laki, maupun ayah.'), cocok: { ashabah: true } },
    { bagian: 'Terhalang', syarat: t('Ada anak laki-laki, cucu laki-laki, atau ayah.'), cocok: { terhalang: true } },
  ],
};

export function barisBerlaku(baris: BarisAhwal, data: { fardh?: string; ashabah: boolean; terhalang: boolean; kodeAlasan?: string }): boolean {
  const { cocok } = baris;
  if (cocok.fardh !== undefined && cocok.fardh !== (data.fardh ?? null)) return false;
  if (cocok.ashabah !== undefined && cocok.ashabah !== data.ashabah) return false;
  if (cocok.terhalang !== undefined && cocok.terhalang !== data.terhalang) return false;
  if (cocok.kodeAlasan !== undefined && cocok.kodeAlasan !== data.kodeAlasan) return false;
  return true;
}

export const LANGKAH_SELANJUTNYA = [
  { judul: t('Pastikan biaya jenazah dan hutang sudah beres.'), isi: t('Termasuk hutang yang belum tercatat, misalnya zakat atau nazar.') },
  { judul: t('Tunaikan wasiat.'), isi: t('Maksimal 1/3 dari sisa harta setelah hutang.') },
  { judul: t('Musyawarahkan hasil ini dengan semua ahli waris.'), isi: t('Bagikan file kasus atau tunjukkan layar ini supaya semua melihat angka yang sama.') },
  { judul: t('Sepakati sisa pembulatan dan cara membagi.'), isi: t('Transfer, tunai, atau barang yang dinilai dengan harga saat dibagi.') },
  { judul: t('Urus dokumen yang dibutuhkan.'), isi: t('Misalnya surat keterangan ahli waris untuk balik nama atau pencairan rekening.') },
  { judul: t('Kalau ragu atau ada perselisihan, tanya ahlinya.'), isi: t('Ustadz yang paham faraidh atau lembaga yang berwenang.') },
];
