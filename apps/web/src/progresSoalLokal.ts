// Isian dan status soal latihan yang setengah dikerjakan, disimpan otomatis di perangkat per idSesi kasus,
// supaya muat ulang (atau buka lagi dari Riwayat) kembali ke soal yang sama. Hidup selama entri riwayat
// kasusnya (30 hari); tidak dikirim ke akun. Satu kunci berisi seluruh peta agar mudah dibersihkan sekaligus.

import type { IsianTabel, KeputusanGharqa } from '@waris/latihan';

const KUNCI_PROGRES_SOAL = 'arif-waris:progres-soal';

export interface ProgresSoalLokal {
  isian: IsianTabel | null;
  pilihanGharqa: KeputusanGharqa | null;
  jawabanTerbuka: boolean;
  sudahMencoba: boolean;
  tebakanBenar: boolean;
  /** Id sesi percobaan, supaya kejadian percobaan tidak ganda setelah muat ulang. */
  idSesiSoal: string;
  /** Revisi soal saat disimpan; beda revisi berarti struktur tabel bisa beda, isian dibuang. */
  revisiSoal: string;
}

export function bacaProgresSoal(idSesi: string, revisiSoal: string): ProgresSoalLokal | null {
  const progres = bacaPeta()[idSesi];
  return adalahProgres(progres) && progres.revisiSoal === revisiSoal ? progres : null;
}

export function simpanProgresSoal(idSesi: string, progres: ProgresSoalLokal): void {
  tulisPeta({ ...bacaPeta(), [idSesi]: progres });
}

export function hapusProgresSoal(idSesi: string): void {
  const { [idSesi]: _dibuang, ...sisa } = bacaPeta();
  tulisPeta(sisa);
}

export function hapusSemuaProgresSoal(): void {
  try {
    localStorage.removeItem(KUNCI_PROGRES_SOAL);
  } catch {
    // Penyimpanan diblokir: tidak ada yang bisa dibersihkan.
  }
}

/** Dipakai kedaluwarsa riwayat: progres tidak hidup lebih lama dari kasusnya. */
export function buangProgresSoalSelain(idSah: ReadonlySet<string>): void {
  const peta = bacaPeta();
  const sisa = Object.fromEntries(Object.entries(peta).filter(([id]) => idSah.has(id)));
  if (Object.keys(sisa).length !== Object.keys(peta).length) tulisPeta(sisa);
}

function bacaPeta(): Record<string, unknown> {
  try {
    const peta: unknown = JSON.parse(localStorage.getItem(KUNCI_PROGRES_SOAL) ?? '{}');
    return peta && typeof peta === 'object' && !Array.isArray(peta) ? (peta as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function tulisPeta(peta: Record<string, unknown>): void {
  try {
    localStorage.setItem(KUNCI_PROGRES_SOAL, JSON.stringify(peta));
  } catch {
    // Mode privat / penyimpanan penuh: isian tidak tersimpan, soal tetap bisa dikerjakan.
  }
}

function adalahProgres(nilai: unknown): nilai is ProgresSoalLokal {
  if (!nilai || typeof nilai !== 'object') return false;
  const progres = nilai as Record<string, unknown>;
  return (progres.isian === null || (typeof progres.isian === 'object' && progres.isian !== null))
    && (progres.pilihanGharqa === null || typeof progres.pilihanGharqa === 'string')
    && typeof progres.jawabanTerbuka === 'boolean' && typeof progres.sudahMencoba === 'boolean' && typeof progres.tebakanBenar === 'boolean'
    && typeof progres.idSesiSoal === 'string' && typeof progres.revisiSoal === 'string';
}
