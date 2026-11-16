// Status bar bawah langkah Periksa nyata (spec kanvas 7.1, keputusan P1). Menerima Kasus; menyerahkan aksi utama yang
// berlaku dan kalimat statusnya, menurut urutan prioritas: Keluarga belum lengkap, urutan tertunda, belum tahu, siap.

import type { IdOrang } from '@waris/engine';
import { bisaDihitungDenganKemungkinan, daftarBelumPasti, type HalBelumPastiTampil } from './belumPasti';
import type { Kasus } from './kasus';
import { namaSingkat } from './keadaanOrang';
import { judulPendek } from './ringkasanBagian';
import { statusKeluarga } from './statusKeluarga';
import { t } from './terjemah';

export type AksiPeriksa =
  | { jenis: 'keluarga'; idBagian: string }
  | { jenis: 'urutan'; a: IdOrang; b: IdOrang }
  | { jenis: 'kemungkinan' }
  | { jenis: 'hitung' };

export interface StatusPeriksa { aksi: AksiPeriksa; status: string | null }

export function statusPeriksa(kasus: Kasus): StatusPeriksa {
  const { pertama } = statusKeluarga(kasus);
  if (pertama) return { aksi: { jenis: 'keluarga', idBagian: pertama.id }, status: t('hitung.periksa.keluarga_belum_lengkap', { bagian: judulPendek(kasus, pertama) }) };
  const belumPasti = daftarBelumPasti(kasus);
  const urutan = belumPasti.find((hal): hal is Extract<HalBelumPastiTampil, { jenis: 'urutan' }> => hal.jenis === 'urutan');
  if (urutan && !bisaDihitungDenganKemungkinan(kasus)) {
    return { aksi: { jenis: 'urutan', a: urutan.a, b: urutan.b }, status: t('hitung.periksa.pastikan_urutan', { a: namaSingkat(kasus, urutan.a), b: namaSingkat(kasus, urutan.b) }) };
  }
  if (belumPasti.length > 0) return { aksi: { jenis: 'kemungkinan' }, status: t('hitung.periksa.n_belum', { jumlah: belumPasti.length }) };
  return { aksi: { jenis: 'hitung' }, status: null };
}
