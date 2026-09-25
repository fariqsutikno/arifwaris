// Preferensi per pengguna di perangkat ini: tujuan pemakaian, tur yang sudah dilihat, dan pelajaran yang sudah selesai.
// Bukan bagian Kasus. Bila localStorage tidak bisa dipakai, nilai disimpan di memori selama sesi.

export type Tujuan = 'hitung' | 'belajar';

const KUNCI_TUJUAN = 'arif-waris:tujuan';
const AWALAN_TUR = 'arif-waris:tur:';
const KUNCI_PELAJARAN_SELESAI = 'arif-waris:pelajaran-selesai';
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

export function bacaPelajaranSelesai(): Set<string> {
  try {
    const nilai: unknown = JSON.parse(baca(KUNCI_PELAJARAN_SELESAI) ?? '[]');
    return new Set(Array.isArray(nilai) ? nilai.filter((slug): slug is string => typeof slug === 'string') : []);
  } catch {
    return new Set();
  }
}

export const tandaiPelajaranSelesai = (slug: string): void =>
  simpan(KUNCI_PELAJARAN_SELESAI, JSON.stringify([...bacaPelajaranSelesai().add(slug)]));
