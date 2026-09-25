// Ahwal: semua kemungkinan bagian tiap ahli waris, ditampilkan di modal orang ("Kapan dapat berapa?").
// Baris yang berlaku di kasus ini dicocokkan dengan data engine (fardh di tabel, ashabah, terhalang, kode alasan fardh),
// bukan ditebak UI. SELURUH ISI INI DRAF dan perlu dicek tim keilmuan terhadap KB [SYF] sebelum dipakai sungguhan.

import type { KunciAhliWaris } from '@waris/engine';

export const AHWAL_PERLU_CEK = true;

/** Syarat cocok: semua kolom yang diisi harus sama dengan data orang itu di hasil engine. */
/** `fardh: null` = harus tanpa bagian pasti. */
export interface CocokAhwal { fardh?: string | null; ashabah?: boolean; terhalang?: boolean; kodeAlasan?: string }
export interface BarisAhwal { bagian: string; syarat: string; cocok: CocokAhwal }

export const AHWAL: Partial<Record<KunciAhliWaris, BarisAhwal[]>> = {
  SUAMI: [
    { bagian: '1/2', syarat: 'Almarhumah tidak punya anak atau cucu dari anak laki-laki.', cocok: { fardh: '1/2' } },
    { bagian: '1/4', syarat: 'Almarhumah punya anak atau cucu dari anak laki-laki.', cocok: { fardh: '1/4' } },
  ],
  ISTRI: [
    { bagian: '1/4', syarat: 'Almarhum tidak punya anak atau cucu dari anak laki-laki.', cocok: { fardh: '1/4' } },
    { bagian: '1/8', syarat: 'Almarhum punya anak atau cucu dari anak laki-laki.', cocok: { fardh: '1/8' } },
  ],
  IBU: [
    { bagian: '1/6', syarat: 'Ada anak/cucu, atau ada dua saudara atau lebih.', cocok: { fardh: '1/6' } },
    { bagian: '1/3', syarat: 'Tidak ada anak/cucu dan saudaranya kurang dari dua.', cocok: { fardh: '1/3', kodeAlasan: 'TANPA_FARU_WARITS_DAN_IKHWAH' } },
    { bagian: '1/3 sisa', syarat: 'Hanya bersama ayah dan suami/istri (umariyyatain).', cocok: { kodeAlasan: 'UMARIYYATAIN' } },
  ],
  AYAH: [
    { bagian: '1/6', syarat: 'Ada anak laki-laki atau cucu laki-laki.', cocok: { fardh: '1/6', ashabah: false } },
    { bagian: '1/6 + sisa', syarat: 'Hanya ada anak/cucu perempuan.', cocok: { fardh: '1/6', ashabah: true } },
    { bagian: 'Sisa (ashabah)', syarat: 'Tidak ada anak maupun cucu.', cocok: { fardh: null, ashabah: true } },
  ],
  ANAK_LK: [
    { bagian: 'Sisa (ashabah)', syarat: 'Selalu mewarisi dan tidak pernah terhalang. Bersama anak perempuan: dapat dua kali bagiannya.', cocok: { ashabah: true } },
  ],
  ANAK_PR: [
    { bagian: '1/2', syarat: 'Sendirian, tanpa anak laki-laki.', cocok: { fardh: '1/2' } },
    { bagian: '2/3', syarat: 'Dua orang atau lebih, tanpa anak laki-laki.', cocok: { fardh: '2/3' } },
    { bagian: 'Sisa, 1 : 2', syarat: 'Bersama anak laki-laki (ashabah bil ghair).', cocok: { ashabah: true } },
  ],
  SAUDARA_KANDUNG: [
    { bagian: 'Sisa (ashabah)', syarat: 'Tidak ada anak laki-laki, cucu laki-laki, maupun ayah.', cocok: { ashabah: true } },
    { bagian: 'Terhalang', syarat: 'Ada anak laki-laki, cucu laki-laki, atau ayah.', cocok: { terhalang: true } },
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
  { judul: 'Pastikan biaya jenazah dan hutang sudah beres.', isi: 'Termasuk hutang yang belum tercatat, misalnya zakat atau nazar.' },
  { judul: 'Tunaikan wasiat.', isi: 'Maksimal 1/3 dari sisa harta setelah hutang.' },
  { judul: 'Musyawarahkan hasil ini dengan semua ahli waris.', isi: 'Bagikan file kasus atau tunjukkan layar ini supaya semua melihat angka yang sama.' },
  { judul: 'Sepakati sisa pembulatan dan cara membagi.', isi: 'Transfer, tunai, atau barang yang dinilai dengan harga saat dibagi.' },
  { judul: 'Urus dokumen yang dibutuhkan.', isi: 'Misalnya surat keterangan ahli waris untuk balik nama atau pencairan rekening.' },
  { judul: 'Kalau ragu atau ada perselisihan, tanya ahlinya.', isi: 'Ustadz yang paham faraidh atau lembaga yang berwenang.' },
];
