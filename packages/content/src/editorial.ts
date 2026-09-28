// packages/content/src/editorial.ts
// Aturan alur editorial (spec bagian "Alur editorial") sebagai fungsi murni. Menerima status revisi, aksi, dan siapa
// pelakunya; memutuskan boleh/tidak dan status berikutnya. Dipakai repository `memori/`; Postgres menegakkan aturan
// yang sama di fungsi transisi + RLS (supabase/migrations). Kalau salah satu diubah, ubah keduanya.
import { wajibRef, type JenisKonten } from './skema.js';

export type Peran = 'admin' | 'penulis' | 'reviewer';
export type StatusRevisi = 'draf' | 'diajukan' | 'disetujui' | 'dikembalikan';
/** tarik: pembuat menarik kembali pengajuannya (diajukan → draf). terbitkan: admin menerbitkan draf tanpa antrean.
 * perbarui: pembuat (atau admin) mengganti isi ajuannya yang masih menunggu; tetap diajukan. */
export type AksiEditorial = 'ajukan' | 'setujui' | 'kembalikan' | 'tarik' | 'terbitkan' | 'perbarui';

interface Pelaku { peran: Peran | null; pelakuId: string; pembuatId: string }
type HasilTransisi = { ok: true; status: StatusRevisi } | { ok: false; galat: string };

export function transisiRevisi(p: Pelaku & { status: StatusRevisi; aksi: AksiEditorial; catatan?: string }): HasilTransisi {
  if (p.peran === null) return { ok: false, galat: 'belum punya peran' };
  if (p.aksi === 'ajukan') {
    if (p.status !== 'draf') return { ok: false, galat: `hanya draf yang bisa diajukan (sekarang ${p.status})` };
    if (!milikSendiriAtauAdmin(p)) return { ok: false, galat: 'hanya pembuat draf yang bisa mengajukan' };
    return { ok: true, status: 'diajukan' };
  }
  if (p.aksi === 'terbitkan') {
    if (p.peran !== 'admin') return { ok: false, galat: 'hanya admin yang bisa menerbitkan langsung' };
    if (p.status !== 'draf') return { ok: false, galat: 'hanya draf yang bisa diterbitkan langsung' };
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
  if (p.status !== 'diajukan') return { ok: false, galat: `hanya revisi diajukan yang bisa diperiksa (sekarang ${p.status})` };
  if (p.peran === 'penulis') return { ok: false, galat: 'penulis tidak bisa memeriksa revisi' };
  if (p.peran === 'reviewer' && p.pelakuId === p.pembuatId) return { ok: false, galat: 'reviewer tidak bisa memeriksa revisinya sendiri' };
  if (p.aksi === 'setujui') return { ok: true, status: 'disetujui' };
  if (!p.catatan?.trim()) return { ok: false, galat: 'mengembalikan revisi wajib disertai catatan' };
  return { ok: true, status: 'dikembalikan' };
}

export const bolehSuntingDraf = (p: Pelaku & { status: StatusRevisi }): boolean =>
  p.peran !== null && p.peran !== 'reviewer' && p.status === 'draf' && milikSendiriAtauAdmin(p);

/** Ajuan yang masih menunggu review boleh disunting pembuatnya (atau admin) tanpa ditarik dulu. */
export const bolehPerbaruiAjuan = (p: Pelaku & { status: StatusRevisi }): boolean =>
  p.peran !== null && p.peran !== 'reviewer' && p.status === 'diajukan' && milikSendiriAtauAdmin(p);

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
