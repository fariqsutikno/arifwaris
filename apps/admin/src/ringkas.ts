// Perhitungan murni untuk beranda & daftar konten portal: status ringkas, tab/cari, grup modul, ringkasan beranda,
// pindah urutan, dan waktu relatif. Menerima RingkasanEntri dari repo.konten.daftarEntri; komponen hanya menampilkan.
import type { RingkasanEntri } from '@waris/data';

export type StatusTampil = 'terbit' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit + draf';
export type TabStatus = 'semua' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit';
export const TAB_STATUS: readonly TabStatus[] = ['semua', 'draf', 'diajukan', 'dikembalikan', 'terbit'];
export const LABEL_TAB: Record<TabStatus, string> = {
  semua: 'Semua', draf: 'Draf', diajukan: 'Diajukan', dikembalikan: 'Dikembalikan', terbit: 'Terbit',
};
export const BATAS_BERANDA = 8;
const FIELD_JUDUL = ['judul', 'pertanyaan', 'istilahId', 'kunci', 'id', 'kode'] as const;

/** Entri bisa punya revisi terbit dan draf baru sekaligus ("terbit + draf"); revisi terakhir yang diajukan/
 * dikembalikan di atas revisi terbit ditampilkan statusnya sendiri (lebih relevan bagi reviewer). */
export function statusTampil(entri: RingkasanEntri): StatusTampil {
  const { revisiTerbitId, revisiTerakhir } = entri;
  if (!revisiTerakhir) return revisiTerbitId ? 'terbit' : 'draf';
  if (revisiTerbitId && revisiTerakhir.id === revisiTerbitId) return 'terbit';
  if (revisiTerbitId && revisiTerakhir.status === 'draf') return 'terbit + draf';
  if (revisiTerakhir.status === 'diajukan') return 'diajukan';
  if (revisiTerakhir.status === 'draf') return 'draf';
  return 'dikembalikan';
}

export function judulEntri(entri: RingkasanEntri): string {
  const isi = entri.revisiTerakhir?.isi as Record<string, unknown> | undefined;
  const kandidat = FIELD_JUDUL.map(kunci => isi?.[kunci]).find(nilai => typeof nilai === 'string' && nilai.length > 0);
  return typeof kandidat === 'string' ? kandidat : entri.slug;
}

export function cocokTab(entri: RingkasanEntri, tab: TabStatus): boolean {
  const status = statusTampil(entri);
  if (tab === 'semua') return true;
  if (status === 'terbit + draf') return tab === 'draf' || tab === 'terbit';
  return status === tab;
}

export const jumlahPerTab = (daftar: RingkasanEntri[]): Record<TabStatus, number> =>
  Object.fromEntries(TAB_STATUS.map(tab => [tab, daftar.filter(entri => cocokTab(entri, tab)).length])) as Record<TabStatus, number>;

export function saringDaftar(daftar: RingkasanEntri[], tab: TabStatus, cari: string): RingkasanEntri[] {
  const kata = cari.trim().toLowerCase();
  return daftar.filter(entri => cocokTab(entri, tab) && (!kata || [judulEntri(entri), entri.slug, ...(entri.revisiTerakhir?.refs ?? [])]
    .some(teks => teks.toLowerCase().includes(kata))));
}

export interface GrupModul { modul: RingkasanEntri | null; nomor: number | null; judul: string; materi: RingkasanEntri[] }

/** Materi dikelompokkan per isi.modul di bawah modulnya (urut nomor). Modul tanpa materi tetap tampil; materi yang
 * modulnya tidak dikenal atau isinya rusak masuk grup "Tanpa modul" di akhir. Urutan materi dalam grup dipertahankan. */
export function kelompokkanPerModul(materi: RingkasanEntri[], modul: RingkasanEntri[]): GrupModul[] {
  const nomorModul = (entri: RingkasanEntri) => angkaDari(entri, 'nomor');
  const grup: GrupModul[] = modul
    .filter(entri => nomorModul(entri) !== null)
    .sort((a, b) => nomorModul(a)! - nomorModul(b)!)
    .map(entri => ({ modul: entri, nomor: nomorModul(entri), judul: judulEntri(entri), materi: [] }));
  const tanpaModul: GrupModul = { modul: null, nomor: null, judul: 'Tanpa modul', materi: [] };
  for (const entri of materi) (grup.find(g => g.nomor === angkaDari(entri, 'modul')) ?? tanpaModul).materi.push(entri);
  return tanpaModul.materi.length ? [...grup, tanpaModul] : grup;
}

export interface RingkasanBeranda {
  drafSaya: number; menungguReview: number; dikembalikanKeSaya: number; terbit: number;
  lanjutkan: RingkasanEntri[]; antreanTertua: RingkasanEntri[];
}

export function ringkasBeranda(semua: RingkasanEntri[], userId: string): RingkasanBeranda {
  const milikSaya = (entri: RingkasanEntri) => entri.revisiTerakhir?.dibuatOleh === userId;
  const berstatus = (entri: RingkasanEntri, status: string) => entri.revisiTerakhir?.status === status;
  const waktu = (entri: RingkasanEntri) => entri.revisiTerakhir?.dibuatPada ?? '';
  const drafSaya = semua.filter(entri => milikSaya(entri) && berstatus(entri, 'draf'));
  const dikembalikan = semua.filter(entri => milikSaya(entri) && berstatus(entri, 'dikembalikan'));
  const diajukan = semua.filter(entri => berstatus(entri, 'diajukan'));
  return {
    drafSaya: drafSaya.length,
    menungguReview: diajukan.length,
    dikembalikanKeSaya: dikembalikan.length,
    terbit: semua.filter(entri => entri.revisiTerbitId).length,
    lanjutkan: [...dikembalikan, ...drafSaya].sort((a, b) => waktu(b).localeCompare(waktu(a))).slice(0, BATAS_BERANDA),
    antreanTertua: [...diajukan].sort((a, b) => waktu(a).localeCompare(waktu(b))).slice(0, BATAS_BERANDA),
  };
}

export function pindahkan<T>(daftar: readonly T[], dari: number, ke: number): T[] {
  const hasil = [...daftar];
  if (dari < 0 || dari >= hasil.length || ke < 0 || ke >= hasil.length) return hasil;
  const [dipindah] = hasil.splice(dari, 1);
  hasil.splice(ke, 0, dipindah!);
  return hasil;
}

const SATUAN_WAKTU: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86_400], ['hour', 3_600], ['minute', 60]];
const formatWaktu = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

export function waktuRelatif(iso: string, sekarang: Date): string {
  const detik = Math.round((new Date(iso).getTime() - sekarang.getTime()) / 1000);
  if (Math.abs(detik) < 60) return 'baru saja';
  const [satuan, besar] = SATUAN_WAKTU.find(([, ukuran]) => Math.abs(detik) >= ukuran)!;
  return formatWaktu.format(Math.round(detik / besar), satuan);
}

function angkaDari(entri: RingkasanEntri, kunci: string): number | null {
  const nilai = (entri.revisiTerakhir?.isi as Record<string, unknown> | undefined)?.[kunci];
  return typeof nilai === 'number' && Number.isInteger(nilai) ? nilai : null;
}
