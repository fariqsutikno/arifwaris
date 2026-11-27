// packages/content/src/editorial.ts
// Aturan alur editorial (spec bagian "Alur editorial") sebagai fungsi murni. Menerima status revisi, aksi, dan siapa
// pelakunya; memutuskan boleh/tidak dan status berikutnya. Dipakai repository `memori/`; Postgres menegakkan aturan
// yang sama di fungsi transisi + RLS (supabase/migrations). Kalau salah satu diubah, ubah keduanya.
import { ceklisLengkap } from './ceklisReview.js';
import { wajibRef, type JenisKonten } from './skema.js';

export type Peran = 'admin' | 'penulis' | 'reviewer' | 'keilmuan';
export type StatusRevisi = 'draf' | 'diajukan' | 'diperiksa' | 'disetujui' | 'dikembalikan';
/** tarik: pembuat menarik kembali pengajuannya (diajukan → draf). terbitkan: admin menerbitkan draf tanpa antrean.
 * perbarui: pembuat (atau admin) mengganti isi ajuannya yang masih menunggu; tetap diajukan.
 * periksa: tahap 1 soal kuis (diajukan → diperiksa), checklist wajib lengkap. */
export type AksiEditorial = 'ajukan' | 'setujui' | 'kembalikan' | 'tarik' | 'terbitkan' | 'perbarui' | 'periksa';

interface Pelaku { peran: Peran | null; pelakuId: string; pembuatId: string }
type HasilTransisi = { ok: true; status: StatusRevisi } | { ok: false; galat: string };

/** Hanya admin dan penulis yang menulis/menyunting; reviewer dan keilmuan hanya memeriksa. */
export const bisaMenulis = (peran: Peran | null): boolean => peran === 'admin' || peran === 'penulis';

/** `duaTahap` = revisi soal kuis (bukan penanda hapus): harus lewat diperiksa dulu (spec-soal-kuis-ribuan 5.1).
 * `butirDicentang` hanya dibaca untuk aksi periksa. Aturan sama dengan supabase/migrations/20261127000003. */
export function transisiRevisi(
  p: Pelaku & { status: StatusRevisi; aksi: AksiEditorial; catatan?: string; duaTahap?: boolean; butirDicentang?: Iterable<number> },
): HasilTransisi {
  if (p.peran === null) return { ok: false, galat: 'belum punya peran' };
  if (p.aksi === 'ajukan') {
    if (p.status !== 'draf') return { ok: false, galat: `hanya draf yang bisa diajukan (sekarang ${p.status})` };
    if (!milikSendiriAtauAdmin(p)) return { ok: false, galat: 'hanya pembuat draf yang bisa mengajukan' };
    return { ok: true, status: 'diajukan' };
  }
  if (p.aksi === 'terbitkan') {
    if (p.peran !== 'admin') return { ok: false, galat: 'hanya admin yang bisa menerbitkan langsung' };
    if (p.status !== 'draf') return { ok: false, galat: 'hanya draf yang bisa diterbitkan langsung' };
    if (p.duaTahap) return { ok: false, galat: 'soal kuis harus diperiksa dan disetujui keilmuan; tidak bisa diterbitkan langsung' };
    return { ok: true, status: 'disetujui' };
  }
  if (p.aksi === 'tarik') {
    if (p.status !== 'diajukan' || p.peran === 'reviewer' || !milikSendiriAtauAdmin(p)) return { ok: false, galat: 'revisi ini tidak bisa ditarik kembali' };
    return { ok: true, status: 'draf' };
  }
  if (p.aksi === 'perbarui') {
    if (!bolehPerbaruiAjuan({ ...p, status: p.status })) return { ok: false, galat: 'ajuan ini tidak bisa diperbarui' };
    return { ok: true, status: 'diajukan' };
  }
  // Status 'diperiksa' hanya ada di jalur dua tahap, jadi cukup untuk menandainya walau duaTahap tidak diisi.
  const duaTahap = p.duaTahap === true || p.status === 'diperiksa';
  if (p.aksi === 'periksa') return transisiPeriksa(p, duaTahap);
  if (p.status !== 'diajukan' && !(duaTahap && p.status === 'diperiksa')) {
    return { ok: false, galat: `hanya revisi diajukan yang bisa diperiksa (sekarang ${p.status})` };
  }
  if (p.peran === 'penulis') return { ok: false, galat: 'penulis tidak bisa memeriksa revisi' };
  if ((p.peran === 'reviewer' || p.peran === 'keilmuan') && p.pelakuId === p.pembuatId) {
    return { ok: false, galat: 'pemeriksa tidak bisa memeriksa revisinya sendiri' };
  }
  if (p.aksi === 'setujui') {
    if (!duaTahap) return p.peran === 'keilmuan' ? { ok: false, galat: 'keilmuan hanya menyetujui soal kuis' } : { ok: true, status: 'disetujui' };
    if (p.status !== 'diperiksa') return { ok: false, galat: 'soal kuis harus diperiksa dulu sebelum disetujui' };
    if (p.peran !== 'admin' && p.peran !== 'keilmuan') return { ok: false, galat: 'hanya keilmuan atau admin yang bisa menyetujui soal kuis' };
    return { ok: true, status: 'disetujui' };
  }
  if (p.status === 'diajukan' && p.peran === 'keilmuan') return { ok: false, galat: 'keilmuan hanya mengembalikan soal yang sudah diperiksa' };
  if (!p.catatan?.trim()) return { ok: false, galat: 'mengembalikan revisi wajib disertai catatan' };
  return { ok: true, status: 'dikembalikan' };
}

function transisiPeriksa(p: Pelaku & { status: StatusRevisi; butirDicentang?: Iterable<number> }, duaTahap: boolean): HasilTransisi {
  if (!duaTahap) return { ok: false, galat: 'hanya soal kuis yang melewati tahap diperiksa' };
  if (p.status !== 'diajukan') return { ok: false, galat: `hanya revisi diajukan yang bisa diperiksa (sekarang ${p.status})` };
  if (p.peran !== 'admin' && p.peran !== 'reviewer') return { ok: false, galat: 'hanya reviewer atau admin yang bisa memeriksa soal kuis' };
  if (p.peran === 'reviewer' && p.pelakuId === p.pembuatId) return { ok: false, galat: 'pemeriksa tidak bisa memeriksa revisinya sendiri' };
  if (!ceklisLengkap(p.butirDicentang ?? [])) return { ok: false, galat: 'checklist review belum lengkap' };
  return { ok: true, status: 'diperiksa' };
}

export const bolehSuntingDraf = (p: Pelaku & { status: StatusRevisi }): boolean =>
  bisaMenulis(p.peran) && p.status === 'draf' && milikSendiriAtauAdmin(p);

/** Revisi yang dikembalikan boleh dibuang pembuatnya (atau admin) tanpa disunting; riwayatnya tetap ada (supabase/migrations/20260928000004). */
export const bolehAbaikanRevisi = (p: Pelaku & { status: StatusRevisi }): boolean =>
  bisaMenulis(p.peran) && p.status === 'dikembalikan' && milikSendiriAtauAdmin(p);

/** Ajuan yang masih menunggu review boleh disunting pembuatnya (atau admin) tanpa ditarik dulu. */
export const bolehPerbaruiAjuan = (p: Pelaku & { status: StatusRevisi }): boolean =>
  bisaMenulis(p.peran) && p.status === 'diajukan' && milikSendiriAtauAdmin(p);

/** Keadaan entri yang dibutuhkan aturan Sampah (supabase/migrations/20260927000007_sampah_editor.sql). */
export interface KeadaanSampah {
  pernahTerbit: boolean; diSampah: boolean; buangSedangDiajukan: boolean; pembuatRevisi: readonly string[];
}
export type CaraBuangEntri = { ok: true; cara: 'langsung' | 'ajukan' } | { ok: false; galat: string };

/** Tidak ada hapus permanen. Belum terbit → langsung ke Sampah (penulis hanya bila semua revisinya miliknya);
 * pernah terbit → penulis mengajukan untuk direview, admin langsung. */
export function caraBuangEntri(p: { peran: Peran | null; pelakuId: string } & KeadaanSampah): CaraBuangEntri {
  if (p.peran !== 'admin' && p.peran !== 'penulis') return { ok: false, galat: 'perlu peran admin/penulis' };
  if (p.diSampah) return { ok: false, galat: 'entri sudah di Sampah' };
  if (p.pernahTerbit) {
    if (p.buangSedangDiajukan) return { ok: false, galat: 'pemindahan ke Sampah sudah diajukan' };
    return { ok: true, cara: p.peran === 'admin' ? 'langsung' : 'ajukan' };
  }
  if (p.peran === 'penulis' && bukanMilikSendiri(p)) return { ok: false, galat: 'entri ini memuat revisi orang lain; hanya admin yang bisa membuangnya' };
  return { ok: true, cara: 'langsung' };
}

/** Pulihkan dari Sampah: entri belum terbit oleh pembuatnya/admin; entri pernah terbit oleh reviewer/admin. */
export function bolehPulihkanEntri(p: { peran: Peran | null; pelakuId: string } & KeadaanSampah): { ok: true } | { ok: false; galat: string } {
  if (!p.diSampah) return { ok: false, galat: 'entri tidak ada di Sampah' };
  if (p.peran === null) return { ok: false, galat: 'belum punya peran' };
  if (p.pernahTerbit) {
    return p.peran === 'penulis' ? { ok: false, galat: 'hanya reviewer atau admin yang bisa memulihkan entri yang pernah terbit' } : { ok: true };
  }
  if (p.peran === 'reviewer' || (p.peran === 'penulis' && bukanMilikSendiri(p))) {
    return { ok: false, galat: 'hanya pembuat entri atau admin yang bisa memulihkannya' };
  }
  return { ok: true };
}

const bukanMilikSendiri = (p: { pelakuId: string; pembuatRevisi: readonly string[] }) => p.pembuatRevisi.some(pembuat => pembuat !== p.pelakuId);

export function periksaRefs(jenis: JenisKonten, isi: unknown, refs: string[], refsDikenal: ReadonlySet<string>): string | null {
  const takDikenal = refs.filter(kode => !refsDikenal.has(kode));
  if (takDikenal.length > 0) return `ref tidak ada di KB: ${takDikenal.join(', ')}`;
  if (wajibRef(jenis, isi) && refs.length === 0) return `${jenis} wajib punya minimal satu ref`;
  return null;
}

const milikSendiriAtauAdmin = (p: Pelaku) => p.peran === 'admin' || p.pelakuId === p.pembuatId;
