// Ahwal (isinya konten jenis `ahwal`, lewat konten/sumber): semua kemungkinan bagian tiap ahli waris di modal orang.
// Baris yang berlaku di kasus ini dicocokkan dengan data engine (fardh di tabel, ashabah, terhalang, kode alasan fardh),
// bukan ditebak UI. SELURUH ISI INI DRAF dan perlu dicek tim keilmuan terhadap KB [SYF] sebelum dipakai sungguhan.

import type { BarisAhwal } from '@waris/content';
import { t } from '../terjemah';

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
