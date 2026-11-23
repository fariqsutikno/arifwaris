// Isian dan status soal latihan yang setengah dikerjakan, disimpan otomatis di perangkat per idSesi kasus,
// supaya muat ulang (atau buka lagi dari Riwayat) kembali ke soal yang sama. Hidup selama entri riwayat
// kasusnya (30 hari); tidak dikirim ke akun. Satu kunci berisi seluruh peta agar mudah dibersihkan sekaligus.

import type { IsianTabel, KeputusanGharqa } from '@waris/latihan';
import { bacaMentah, hapusMentah, simpanMentah } from './penyimpanan';

const KUNCI_PROGRES_SOAL = 'arif-waris:progres-soal';

export interface ProgresSoalLokal {
  isian: IsianTabel | null;
  pilihanGharqa: KeputusanGharqa | null;
  /** Gharqa: satu tabel per harta (kunci = id mayit). */
  isianHarta?: Record<string, IsianTabel>;
  jawabanTerbuka: boolean;
  sudahMencoba: boolean;
  tebakanBenar: boolean;
  /** Id sesi percobaan, supaya kejadian percobaan tidak ganda setelah muat ulang. */
  idSesiSoal: string;
  /** Revisi soal saat disimpan; beda revisi berarti struktur tabel bisa beda, isian dibuang. */
  revisiSoal: string;
}

export function bacaProgresSoal(idSesi: string, revisiSoal: string): ProgresSoalLokal | null {
  const progres = ambilProgresSoal(idSesi);
  return progres?.revisiSoal === revisiSoal ? progres : null;
}

/** Tanpa pemeriksaan revisi: untuk cadangan sebelum dihapus. */
export function ambilProgresSoal(idSesi: string): ProgresSoalLokal | null {
  const progres = bacaPeta()[idSesi];
  return adalahProgres(progres) ? progres : null;
}

export function simpanProgresSoal(idSesi: string, progres: ProgresSoalLokal): void {
  tulisPeta({ ...bacaPeta(), [idSesi]: progres });
}

export function hapusProgresSoal(idSesi: string): void {
  const { [idSesi]: _dibuang, ...sisa } = bacaPeta();
  tulisPeta(sisa);
}

export const hapusSemuaProgresSoal = (): void => hapusMentah(KUNCI_PROGRES_SOAL);

/** Dipakai kedaluwarsa riwayat: progres tidak hidup lebih lama dari kasusnya. */
export function buangProgresSoalSelain(idSah: ReadonlySet<string>): void {
  const peta = bacaPeta();
  const sisa = Object.fromEntries(Object.entries(peta).filter(([id]) => idSah.has(id)));
  if (Object.keys(sisa).length !== Object.keys(peta).length) tulisPeta(sisa);
}

function bacaPeta(): Record<string, unknown> {
  try {
    const peta: unknown = JSON.parse(bacaMentah(KUNCI_PROGRES_SOAL) ?? '{}');
    return peta && typeof peta === 'object' && !Array.isArray(peta) ? (peta as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Mode privat / penyimpanan penuh: simpanMentah jatuh ke memori, soal tetap bisa dikerjakan selama sesi.
const tulisPeta = (peta: Record<string, unknown>): void => void simpanMentah(KUNCI_PROGRES_SOAL, JSON.stringify(peta));

function adalahProgres(nilai: unknown): nilai is ProgresSoalLokal {
  if (!nilai || typeof nilai !== 'object') return false;
  const progres = nilai as Record<string, unknown>;
  return (progres.isian === null || (typeof progres.isian === 'object' && progres.isian !== null))
    && (progres.pilihanGharqa === null || typeof progres.pilihanGharqa === 'string')
    && (progres.isianHarta === undefined || (typeof progres.isianHarta === 'object' && progres.isianHarta !== null))
    && typeof progres.jawabanTerbuka === 'boolean' && typeof progres.sudahMencoba === 'boolean' && typeof progres.tebakanBenar === 'boolean'
    && typeof progres.idSesiSoal === 'string' && typeof progres.revisiSoal === 'string';
}
