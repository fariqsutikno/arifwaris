// Status langkah Keluarga untuk bar bawah (spec kanvas 5.9). Menerima Kasus; menyerahkan berapa bagian yang belum lengkap,
// bagian pertama yang belum lengkap (tujuan gulir saat aksi utama diklik terlalu dini), dan kalimat statusnya.
// Baris "Datang dari Periksa" ditambahkan rencana 4.

import type { Kasus } from './kasus';
import { bagianLengkap, daftarBagian, type Bagian } from './kelompok';
import { t } from './terjemah';

export interface StatusKeluarga { sisa: number; pertama: Bagian | null; status: string }

export function statusKeluarga(kasus: Kasus): StatusKeluarga {
  const belumLengkap = daftarBagian(kasus).filter(bagian => !bagianLengkap(kasus, bagian));
  const status = belumLengkap.length > 0
    ? t('hitung.kanvas.status_sisa', { n: belumLengkap.length })
    : t('hitung.kanvas.status_lengkap');
  return { sisa: belumLengkap.length, pertama: belumLengkap[0] ?? null, status };
}
