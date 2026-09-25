// Preferensi per pengguna di perangkat ini: tujuan pemakaian, tur yang sudah dilihat, dan catatan belajar
// (pelajaran selesai, soal dikerjakan, jawaban kuis).
// Bukan bagian Kasus. Bila localStorage tidak bisa dipakai, nilai disimpan di memori selama sesi.

export type Tujuan = 'hitung' | 'belajar';

const KUNCI_TUJUAN = 'arif-waris:tujuan';
const AWALAN_TUR = 'arif-waris:tur:';
const AWALAN_CATATAN = 'arif-waris:catatan:';
const cadangan = new Map<string, string>();

function baca(kunci: string): string | null {
  try {
    return localStorage.getItem(kunci) ?? cadangan.get(kunci) ?? null;
  } catch {
    return cadangan.get(kunci) ?? null;
  }
}

function simpan(kunci: string, nilai: string): void {
  cadangan.set(kunci, nilai);
  try {
    localStorage.setItem(kunci, nilai);
  } catch {
    // Mode privat / penyimpanan penuh: cukup di memori.
  }
}

export function bacaTujuan(): Tujuan | null {
  const nilai = baca(KUNCI_TUJUAN);
  return nilai === 'hitung' || nilai === 'belajar' ? nilai : null;
}

export const simpanTujuan = (tujuan: Tujuan): void => simpan(KUNCI_TUJUAN, tujuan);
export const sudahLihatTur = (kunci: string): boolean => baca(AWALAN_TUR + kunci) === '1';
export const tandaiTurDilihat = (kunci: string): void => simpan(AWALAN_TUR + kunci, '1');

/** Catatan belajar per kode: pelajaran → 'selesai', soal hitung → 'selesai', kuis → 'benar' / 'salah'. */
export type JenisCatatan = 'pelajaran' | 'soal' | 'kuis';

export function bacaCatatan(jenis: JenisCatatan): Record<string, string> {
  try {
    const nilai: unknown = JSON.parse(baca(AWALAN_CATATAN + jenis) ?? '{}');
    return nilai && typeof nilai === 'object' && !Array.isArray(nilai)
      ? Object.fromEntries(Object.entries(nilai).filter((isi): isi is [string, string] => typeof isi[1] === 'string')) : {};
  } catch {
    return {};
  }
}

export const simpanCatatan = (jenis: JenisCatatan, kode: string, nilai: string): void =>
  simpan(AWALAN_CATATAN + jenis, JSON.stringify({ ...bacaCatatan(jenis), [kode]: nilai }));

export const bacaPelajaranSelesai = (): Set<string> => new Set(Object.keys(bacaCatatan('pelajaran')));
export const tandaiPelajaranSelesai = (slug: string): void => simpanCatatan('pelajaran', slug, 'selesai');
