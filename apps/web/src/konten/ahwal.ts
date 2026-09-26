// Ahwal (isinya konten jenis `ahwal`, lewat konten/sumber): semua kemungkinan bagian tiap ahli waris di modal orang.
// Baris yang berlaku di kasus ini dicocokkan dengan data engine (fardh di tabel, ashabah, terhalang, kode alasan fardh),
// bukan ditebak UI. SELURUH ISI INI DRAF dan perlu dicek tim keilmuan terhadap KB [SYF] sebelum dipakai sungguhan.

import type { BarisAhwal } from '@waris/content';
import { teksEdukasi } from '../terjemah';

export function barisBerlaku(baris: BarisAhwal, data: { fardh?: string; ashabah: boolean; terhalang: boolean; kodeAlasan?: string }): boolean {
  const { cocok } = baris;
  if (cocok.fardh !== undefined && cocok.fardh !== (data.fardh ?? null)) return false;
  if (cocok.ashabah !== undefined && cocok.ashabah !== data.ashabah) return false;
  if (cocok.terhalang !== undefined && cocok.terhalang !== data.terhalang) return false;
  if (cocok.kodeAlasan !== undefined && cocok.kodeAlasan !== data.kodeAlasan) return false;
  return true;
}

// Satu baris literal per langkah, supaya tes cakupan melihat slug teks edukasinya.
export const LANGKAH_SELANJUTNYA = [
  { judul: teksEdukasi('selanjutnya.langkah_1_judul'), isi: teksEdukasi('selanjutnya.langkah_1_isi') },
  { judul: teksEdukasi('selanjutnya.langkah_2_judul'), isi: teksEdukasi('selanjutnya.langkah_2_isi') },
  { judul: teksEdukasi('selanjutnya.langkah_3_judul'), isi: teksEdukasi('selanjutnya.langkah_3_isi') },
  { judul: teksEdukasi('selanjutnya.langkah_4_judul'), isi: teksEdukasi('selanjutnya.langkah_4_isi') },
  { judul: teksEdukasi('selanjutnya.langkah_5_judul'), isi: teksEdukasi('selanjutnya.langkah_5_isi') },
  { judul: teksEdukasi('selanjutnya.langkah_6_judul'), isi: teksEdukasi('selanjutnya.langkah_6_isi') },
];
