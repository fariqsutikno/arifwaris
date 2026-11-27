// Pembantu layar review soal kuis: membaca isi revisi menjadi soal, menyusun pilihan saring (bab, tingkat, status, paket)
// dan menyaring antrean. Menerima butir antrean soal kuis; menyerahkan daftar yang sudah disaring ke AntreanSoalKuis.
import { bacaIsi, JUDUL_BAB, transisiRevisi, BUTIR_CEKLIS_REVIEW, type Peran, type SoalKuis, type StatusRevisi, type Tingkat } from '@waris/content';
import { teksRujukan } from './rujukan';

export interface ButirKuis {
  id: string;
  entriId: string;
  status: StatusRevisi;
  dibuatOleh: string;
  dibuatPada: string;
  refs: string[];
  isi: unknown;
}
export interface SaringKuis { bab: string; tingkat: string; status: string; paket: string }
export const SARING_KUIS_KOSONG: SaringKuis = { bab: '', tingkat: '', status: '', paket: '' };

const TANPA_PAKET = 'tanpa';
export const LABEL_STATUS_KUIS: Partial<Record<StatusRevisi, string>> = { diajukan: 'Menunggu pemeriksaan', diperiksa: 'Menunggu persetujuan keilmuan' };

export const bacaSoalKuis = (isi: unknown): { ok: true; soal: SoalKuis } | { ok: false; galat: string } => {
  const hasil = bacaIsi('soal_kuis', isi);
  return hasil.ok ? { ok: true, soal: hasil.isi } : { ok: false, galat: hasil.galat };
};

const sumberDari = (isi: unknown): string | undefined => (isi as { sumber?: string } | null)?.sumber;
const babDari = (isi: unknown): number | undefined => (isi as { bab?: number } | null)?.bab;
const tingkatDari = (isi: unknown): Tingkat => (isi as { tingkat?: Tingkat } | null)?.tingkat ?? 'dasar';

/** "paket:K-dasar-1" → "K-dasar-1"; soal tulisan tangan atau dari materi → satu kelompok "Tanpa paket". */
export const paketDari = (isi: unknown): string => {
  const sumber = sumberDari(isi);
  return sumber?.startsWith('paket:') ? sumber.slice('paket:'.length) : TANPA_PAKET;
};
export const labelPaket = (paket: string) => (paket === TANPA_PAKET ? 'Tanpa paket' : paket);
export const labelBab = (bab: number) => `Bab ${bab}${JUDUL_BAB[bab] ? ` · ${JUDUL_BAB[bab]}` : ''}`;

export function saringKuis(daftar: readonly ButirKuis[], saring: SaringKuis): ButirKuis[] {
  return daftar.filter(butir =>
    (!saring.bab || String(babDari(butir.isi)) === saring.bab)
    && (!saring.tingkat || tingkatDari(butir.isi) === saring.tingkat)
    && (!saring.status || butir.status === saring.status)
    && (!saring.paket || paketDari(butir.isi) === saring.paket));
}

/** Nilai yang ada di antrean untuk tiap saring, supaya pilihan tidak menawarkan yang kosong. */
export function pilihanSaring(daftar: readonly ButirKuis[]) {
  const unik = <T,>(ambil: (butir: ButirKuis) => T | undefined) => [...new Set(daftar.map(ambil).filter((nilai): nilai is T => nilai !== undefined))];
  return {
    bab: unik(butir => babDari(butir.isi)).sort((a, b) => a - b),
    tingkat: (['dasar', 'menengah', 'sulit'] as const).filter(t => daftar.some(butir => tingkatDari(butir.isi) === t)),
    paket: unik(butir => paketDari(butir.isi)).sort((a, b) => a.localeCompare(b)),
  };
}

/** Rujukan sebagai kalimat manusia (klaim KB), bukan kode Rxx-y. */
export const rujukanManusia = (refs: readonly string[]): string[] => refs.map(teksRujukan);

const SEMUA_BUTIR = BUTIR_CEKLIS_REVIEW.map((_, indeks) => indeks + 1);
/** Lencana & penanda antrean: ada aksi yang bisa dilakukan peran ini (periksa dihitung seolah checklist lengkap). */
export function adaYangBisaDilakukan(
  peran: Peran, pelakuId: string, revisi: { dibuatOleh: string; status: StatusRevisi; hapus?: boolean; jenis?: string },
): boolean {
  const dasar = { peran, pelakuId, pembuatId: revisi.dibuatOleh, status: revisi.status, duaTahap: revisi.jenis === 'soal_kuis' && !revisi.hapus, butirDicentang: SEMUA_BUTIR };
  return (['setujui', 'periksa'] as const).some(aksi => transisiRevisi({ ...dasar, aksi }).ok);
}
