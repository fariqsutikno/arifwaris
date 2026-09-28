// Perhitungan murni untuk beranda & daftar konten portal: status ringkas, tab/cari, grup modul, ringkasan beranda,
// pindah urutan, dan waktu relatif. Menerima RingkasanEntri dari repo.konten.daftarEntri; komponen hanya menampilkan.
import type { RingkasanEntri } from '@waris/data';

export type StatusTampil = 'terbit' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit + draf' | 'sampah';
export type TabStatus = 'semua' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit' | 'sampah';
export const TAB_STATUS: readonly TabStatus[] = ['semua', 'draf', 'diajukan', 'dikembalikan', 'terbit', 'sampah'];
export const LABEL_TAB: Record<TabStatus, string> = {
  semua: 'Semua', draf: 'Draf', diajukan: 'Diajukan', dikembalikan: 'Dikembalikan', terbit: 'Terbit', sampah: 'Sampah',
};
export const BATAS_BERANDA = 8;
const FIELD_JUDUL = ['judul', 'pertanyaan', 'istilahId', 'kunci', 'id', 'kode'] as const;

export const diSampah = (entri: RingkasanEntri) => entri.dihapus || entri.dibuang;

/** Entri bisa punya revisi terbit dan draf sekaligus ("terbit + draf"); revisi terakhir yang diajukan/dikembalikan di
 * atas revisi terbit ditampilkan statusnya sendiri (lebih relevan bagi reviewer). Entri di Sampah selalu "sampah". */
export function statusTampil(entri: RingkasanEntri): StatusTampil {
  if (diSampah(entri)) return 'sampah';
  const { revisiTerbitId, revisiTerakhir } = entri;
  // Revisi dikembalikan yang sudah dibuang pembuatnya tidak lagi dihitung.
  if (!revisiTerakhir || revisiTerakhir.diabaikan) return revisiTerbitId ? 'terbit' : 'draf';
  // Disetujui tapi bukan revisi terbit = sesudah rollback; yang menentukan tetap apa yang sedang terbit.
  if (revisiTerakhir.status === 'disetujui') return 'terbit';
  if (revisiTerbitId && revisiTerakhir.status === 'draf') return 'terbit + draf';
  if (revisiTerakhir.status === 'diajukan') return 'diajukan';
  if (revisiTerakhir.status === 'draf') return 'draf';
  return 'dikembalikan';
}

export function judulEntri(entri: Pick<RingkasanEntri, 'slug' | 'revisiTerakhir'>, isi: unknown = entri.revisiTerakhir?.isi): string {
  const kandidat = FIELD_JUDUL.map(kunci => teksDari((isi as Record<string, unknown> | undefined)?.[kunci]))
    .find(nilai => nilai.length > 0);
  return kandidat ?? entri.slug;
}

/** "Semua" tidak memuat Sampah (seperti WordPress); Sampah punya tabnya sendiri. */
export function cocokTab(entri: RingkasanEntri, tab: TabStatus): boolean {
  const status = statusTampil(entri);
  if (tab === 'semua') return status !== 'sampah';
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

// ─── Saring & urut lanjutan daftar konten (tersimpan di URL: #/menu/<menu>/<tab>?status=draf&urut=diubah&…) ───

export type UrutanDaftar = 'manual' | 'diubah' | 'judul' | 'status';
export const LABEL_URUTAN: Record<UrutanDaftar, string> = {
  manual: 'Urutan tampil di web', diubah: 'Terakhir diubah', judul: 'Judul A–Z', status: 'Status',
};
/** Bidang isi yang bisa disaring; tampil hanya untuk jenis yang memilikinya (lihat BIDANG_SARING_JENIS). */
export type BidangSaring = 'bab' | 'tingkat' | 'kelompok';

export interface SaringDaftar {
  status: TabStatus; cari: string; urut: UrutanDaftar; milikSaya: boolean; perluCek: boolean;
  bidang: Partial<Record<BidangSaring, string>>;
}
export const SARING_AWAL: SaringDaftar = { status: 'semua', cari: '', urut: 'manual', milikSaya: false, perluCek: false, bidang: {} };
const BIDANG_SARING: readonly BidangSaring[] = ['bab', 'tingkat', 'kelompok'];

/** Kueri URL → SaringDaftar; nilai tak dikenal diabaikan (jatuh ke bawaan). */
export function bacaSaring(kueri: Readonly<Record<string, string>> = {}): SaringDaftar {
  const status = TAB_STATUS.find(tab => tab === kueri.status) ?? 'semua';
  const urut = (Object.keys(LABEL_URUTAN) as UrutanDaftar[]).find(u => u === kueri.urut) ?? 'manual';
  const bidang = Object.fromEntries(BIDANG_SARING.filter(kunci => kueri[kunci]).map(kunci => [kunci, kueri[kunci]!]));
  return { status, cari: kueri.cari ?? '', urut, milikSaya: kueri.milik === '1', perluCek: kueri.perluCek === '1', bidang };
}

/** Kebalikan bacaSaring; nilai bawaan tidak ditulis supaya URL tetap pendek. */
export function tulisSaring(saring: SaringDaftar): Record<string, string> {
  const kueri: Record<string, string> = {};
  if (saring.status !== 'semua') kueri.status = saring.status;
  if (saring.cari) kueri.cari = saring.cari;
  if (saring.urut !== 'manual') kueri.urut = saring.urut;
  if (saring.milikSaya) kueri.milik = '1';
  if (saring.perluCek) kueri.perluCek = '1';
  for (const kunci of BIDANG_SARING) if (saring.bidang[kunci]) kueri[kunci] = saring.bidang[kunci]!;
  return kueri;
}

/** Nilai satu bidang isi revisi terakhir sebagai teks ('' bila tidak ada). */
export function nilaiIsi(entri: RingkasanEntri, kunci: string): string {
  const nilai = (entri.revisiTerakhir?.isi as Record<string, unknown> | undefined)?.[kunci];
  return typeof nilai === 'string' || typeof nilai === 'number' ? String(nilai) : '';
}

export function terapkanSaring(daftar: RingkasanEntri[], saring: SaringDaftar, userId: string): RingkasanEntri[] {
  return urutkan(saringTanpaStatus(daftar, saring, userId).filter(entri => cocokTab(entri, saring.status)), saring.urut);
}

/** Cari & saring lanjutan tanpa tab status, untuk angka di tiap tab (termasuk Sampah). */
export function saringTanpaStatus(daftar: RingkasanEntri[], saring: SaringDaftar, userId: string): RingkasanEntri[] {
  const kata = saring.cari.trim().toLowerCase();
  return daftar.filter(entri =>
    (!kata || [judulEntri(entri), entri.slug, ...(entri.revisiTerakhir?.refs ?? [])].some(teks => teks.toLowerCase().includes(kata)))
    && (!saring.milikSaya || entri.revisiTerakhir?.dibuatOleh === userId)
    && (!saring.perluCek || (entri.revisiTerakhir?.isi as { perluCek?: unknown } | undefined)?.perluCek === true)
    && Object.entries(saring.bidang).every(([kunci, nilai]) => !nilai || nilaiIsi(entri, kunci) === nilai));
}

const URUTAN_STATUS: Record<StatusTampil, number> = { dikembalikan: 0, draf: 1, 'terbit + draf': 2, diajukan: 3, terbit: 4, sampah: 5 };
const pembandingJudul = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });

/** 'manual' = urutan dari database (sama dengan web); lainnya salinan terurut, stabil. */
export function urutkan(daftar: RingkasanEntri[], urut: UrutanDaftar): RingkasanEntri[] {
  const waktu = (entri: RingkasanEntri) => entri.revisiTerakhir?.dibuatPada ?? '';
  switch (urut) {
    case 'manual': return daftar;
    case 'diubah': return [...daftar].sort((a, b) => waktu(b).localeCompare(waktu(a)));
    case 'judul': return [...daftar].sort((a, b) => pembandingJudul.compare(judulEntri(a), judulEntri(b)));
    case 'status': return [...daftar].sort((a, b) => URUTAN_STATUS[statusTampil(a)] - URUTAN_STATUS[statusTampil(b)]);
  }
}

/** Nilai berbeda satu bidang di seluruh daftar, terurut, untuk isi dropdown saring. */
export function nilaiBerbeda(daftar: RingkasanEntri[], kunci: string): string[] {
  return [...new Set(daftar.map(entri => nilaiIsi(entri, kunci)).filter(Boolean))].sort(pembandingJudul.compare);
}

export interface GrupModul { modul: RingkasanEntri | null; nomor: number | null; judul: string; materi: RingkasanEntri[] }

/** Materi dikelompokkan per isi.modul di bawah modulnya (urut nomor). Nomor & judul modul diambil dari revisi terbitnya
 * (`isiModulTerbit`, entriId → isi) seperti yang dilihat web; modul yang belum pernah terbit memakai revisi terakhir.
 * Modul tanpa materi tetap tampil; materi yang modulnya tidak dikenal atau isinya rusak masuk grup "Tanpa modul" di
 * akhir. Urutan materi dalam grup dipertahankan. */
export function kelompokkanPerModul(
  materi: RingkasanEntri[], modul: RingkasanEntri[], isiModulTerbit: ReadonlyMap<string, unknown> = new Map(),
): GrupModul[] {
  const isiModul = (entri: RingkasanEntri) => isiModulTerbit.get(entri.entriId) ?? entri.revisiTerakhir?.isi;
  const grup: GrupModul[] = modul
    .map(entri => ({ modul: entri, nomor: angkaDari(isiModul(entri), 'nomor'), judul: judulEntri(entri, isiModul(entri)), materi: [] as RingkasanEntri[] }))
    .filter(calon => calon.nomor !== null)
    .sort((a, b) => a.nomor! - b.nomor!);
  const tanpaModul: GrupModul = { modul: null, nomor: null, judul: 'Tanpa modul', materi: [] };
  for (const entri of materi) (grup.find(g => g.nomor === angkaDari(entri.revisiTerakhir?.isi, 'modul')) ?? tanpaModul).materi.push(entri);
  return tanpaModul.materi.length ? [...grup, tanpaModul] : grup;
}

export interface RingkasanBeranda {
  drafSaya: number; menungguReview: number; dikembalikanKeSaya: number; terbit: number;
  lanjutkan: RingkasanEntri[]; antreanTertua: RingkasanEntri[];
}

/** `antreanDiksi` = jumlah revisi diksi yang diajukan, supaya "Menunggu review" sama dengan lencana antrean. */
export function ringkasBeranda(semuaEntri: RingkasanEntri[], userId: string, antreanDiksi = 0): RingkasanBeranda {
  const semua = semuaEntri.filter(entri => !diSampah(entri));
  const milikSaya = (entri: RingkasanEntri) => entri.revisiTerakhir?.dibuatOleh === userId;
  const berstatus = (entri: RingkasanEntri, status: string) => entri.revisiTerakhir?.status === status;
  const waktu = (entri: RingkasanEntri) => entri.revisiTerakhir?.dibuatPada ?? '';
  const drafSaya = semua.filter(entri => milikSaya(entri) && berstatus(entri, 'draf'));
  const dikembalikan = semua.filter(entri => milikSaya(entri) && berstatus(entri, 'dikembalikan'));
  const diajukan = semua.filter(entri => berstatus(entri, 'diajukan'));
  return {
    drafSaya: drafSaya.length,
    menungguReview: diajukan.length + antreanDiksi,
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

/** Hasil seret @dnd-kit (id aktif → id tujuan) sebagai pasangan indeks untuk pindahkan; null bila tidak berpindah. */
export function indeksSeret(ids: readonly string[], aktif: string, tujuan: string | null): [number, number] | null {
  const dari = ids.indexOf(aktif);
  const ke = tujuan === null ? -1 : ids.indexOf(tujuan);
  return dari < 0 || ke < 0 || dari === ke ? null : [dari, ke];
}

const formatTanggal = new Intl.DateTimeFormat('id', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** "27 Sep 2026, 14.05" — untuk tooltip di samping waktu relatif. */
export const tanggalLengkap = (iso: string): string => formatTanggal.format(new Date(iso));

const SATUAN_WAKTU: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86_400], ['hour', 3_600], ['minute', 60]];
const formatWaktu = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

export function waktuRelatif(iso: string, sekarang: Date): string {
  const detik = Math.round((new Date(iso).getTime() - sekarang.getTime()) / 1000);
  if (Math.abs(detik) < 60) return 'baru saja';
  const [satuan, besar] = SATUAN_WAKTU.find(([, ukuran]) => Math.abs(detik) >= ukuran)!;
  return formatWaktu.format(Math.round(detik / besar), satuan);
}

/** Teks polos dari string atau potongan Markdown (pertanyaan soal kuis = [{ jenis, teks }, …]). */
function teksDari(nilai: unknown): string {
  if (typeof nilai === 'string') return nilai;
  if (!Array.isArray(nilai)) return '';
  return nilai.map(potongan => (typeof potongan?.teks === 'string' ? potongan.teks : '')).join('').trim();
}

function angkaDari(isi: unknown, kunci: string): number | null {
  const nilai = (isi as Record<string, unknown> | undefined)?.[kunci];
  return typeof nilai === 'number' && Number.isInteger(nilai) ? nilai : null;
}
