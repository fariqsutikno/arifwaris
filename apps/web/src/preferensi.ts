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

/** Jejak belajar terbaru untuk beranda Belajar ("Terakhir kamu…"). Terbaru di atas, satu entri per jenis+kode. */
export interface Aktivitas { jenis: 'pelajaran' | 'soal' | 'kuis'; kode: string; judul: string; waktu: number; hasil?: string }
const KUNCI_AKTIVITAS = 'arif-waris:aktivitas';
const BATAS_AKTIVITAS = 20;

export function bacaAktivitas(): Aktivitas[] {
  try {
    const daftar: unknown = JSON.parse(baca(KUNCI_AKTIVITAS) ?? '[]');
    return Array.isArray(daftar) ? daftar.filter((isi): isi is Aktivitas => typeof isi?.kode === 'string' && typeof isi?.waktu === 'number') : [];
  } catch {
    return [];
  }
}

export function catatAktivitas(aktivitas: Aktivitas): void {
  const lain = bacaAktivitas().filter(isi => isi.jenis !== aktivitas.jenis || isi.kode !== aktivitas.kode);
  simpan(KUNCI_AKTIVITAS, JSON.stringify([aktivitas, ...lain].slice(0, BATAS_AKTIVITAS)));
}

/** Hapus satu jejak (jenis+kode), atau semua jejak bila tanpa argumen. */
export function hapusAktivitas(aktivitas?: Pick<Aktivitas, 'jenis' | 'kode'>): void {
  const sisa = aktivitas ? bacaAktivitas().filter(isi => isi.jenis !== aktivitas.jenis || isi.kode !== aktivitas.kode) : [];
  simpan(KUNCI_AKTIVITAS, JSON.stringify(sisa));
}

/** Reset progres belajar: pelajaran selesai, soal hitung, skor kuis, dan jejak belajar. Riwayat hitung tidak tersentuh. */
export function resetProgresBelajar(): void {
  (['pelajaran', 'soal', 'kuis'] as const).forEach(jenis => simpan(AWALAN_CATATAN + jenis, '{}'));
  hapusAktivitas();
}

/** Pilihan kecil yang diingat per perangkat (mis. mode pembahasan kuis). */
export const bacaPilihan = (kunci: string): string | null => baca(`arif-waris:pilihan:${kunci}`);
export const simpanPilihan = (kunci: string, nilai: string): void => simpan(`arif-waris:pilihan:${kunci}`, nilai);

/** Ukuran huruf artikel (px) yang dipilih pembaca lewat tombol A−/A+. */
const KUNCI_UKURAN_BACA = 'arif-waris:ukuran-baca';
export const UKURAN_BACA = [15, 16, 18, 20, 22] as const;
export function bacaUkuranBaca(): number {
  const nilai = Number(baca(KUNCI_UKURAN_BACA));
  return (UKURAN_BACA as readonly number[]).includes(nilai) ? nilai : 18;
}
export const simpanUkuranBaca = (ukuran: number): void => simpan(KUNCI_UKURAN_BACA, String(ukuran));
