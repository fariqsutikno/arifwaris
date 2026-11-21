// Soal gharqa (spec B7): langkah keputusan lebih dulu, lalu satu tabel biasa per harta bila tidak saling mewarisi.
//   Masuk : HasilGharqa dari engine (hitungGharqa).
//   Putus : keputusan dari `metode`/status engine, tiap harta dari tabel mas'alah biasa yang sudah dihitung engine.
//   Keluar: SoalGharqa; keputusan dinilai dulu, tabel harta baru dinilai bila keputusan benar (urutan dijaga web).
//   [HNB] tilad–tharif belum punya tabel (desain dan mockup sendiri) → TIDAK_DIDUKUNG.

import type { HasilGharqa, IdOrang } from '@waris/engine';
import type { TabelSoal } from './model.js';
import { susunTabelSoal } from './susun.js';

export type KeputusanGharqa = 'terakhirMewarisi' | 'tidakSalingMewarisi' | 'ditahan';
export interface SoalGharqa { keputusan: KeputusanGharqa; harta: Array<{ mayit: IdOrang; tabel: TabelSoal }> }
export type SusunanGharqa = SoalGharqa | { status: 'TIDAK_DIDUKUNG' };

export function susunSoalGharqa(hasil: HasilGharqa, namaDari: (id: IdOrang) => string): SusunanGharqa {
  // [R13-10] [SYF] keadaan 3: ditahan sampai ingat atau ishtilah; tanpa angka.
  if (hasil.status === 'MAUQUF') return { keputusan: 'ditahan', harta: [] };
  // [R13-10] [K13d-1] jumhur: harta tiap orang untuk ahli warisnya yang hidup saja.
  if (hasil.status !== 'OK' || hasil.metode !== 'terpisah') return { status: 'TIDAK_DIDUKUNG' };
  const harta: SoalGharqa['harta'] = [];
  for (const { mayit, hasilBiasa } of hasil.harta) {
    const tabel = hasilBiasa ? susunTabelSoal(hasilBiasa, namaDari) : undefined;
    if (!tabel || 'status' in tabel) return { status: 'TIDAK_DIDUKUNG' };
    harta.push({ mayit, tabel });
  }
  return { keputusan: 'tidakSalingMewarisi', harta };
}
