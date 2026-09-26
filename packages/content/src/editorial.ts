// packages/content/src/editorial.ts
// Aturan alur editorial (spec bagian "Alur editorial") sebagai fungsi murni. Menerima status revisi, aksi, dan siapa
// pelakunya; memutuskan boleh/tidak dan status berikutnya. Dipakai repository `memori/`; Postgres menegakkan aturan
// yang sama di fungsi transisi + RLS (supabase/migrations). Kalau salah satu diubah, ubah keduanya.
import { JENIS_FIKIH, type JenisKonten } from './skema.js';

export type Peran = 'admin' | 'penulis' | 'reviewer';
export type StatusRevisi = 'draf' | 'diajukan' | 'disetujui' | 'dikembalikan';
export type AksiEditorial = 'ajukan' | 'setujui' | 'kembalikan';

interface Pelaku { peran: Peran | null; pelakuId: string; pembuatId: string }
type HasilTransisi = { ok: true; status: StatusRevisi } | { ok: false; galat: string };

export function transisiRevisi(p: Pelaku & { status: StatusRevisi; aksi: AksiEditorial; catatan?: string }): HasilTransisi {
  if (p.peran === null) return { ok: false, galat: 'belum punya peran' };
  if (p.aksi === 'ajukan') {
    if (p.status !== 'draf') return { ok: false, galat: `hanya draf yang bisa diajukan (sekarang ${p.status})` };
    if (!milikSendiriAtauAdmin(p)) return { ok: false, galat: 'hanya pembuat draf yang bisa mengajukan' };
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

export function periksaRefs(jenis: JenisKonten, refs: string[], refsDikenal: ReadonlySet<string>): string | null {
  const takDikenal = refs.filter(kode => !refsDikenal.has(kode));
  if (takDikenal.length > 0) return `ref tidak ada di KB: ${takDikenal.join(', ')}`;
  if (JENIS_FIKIH.includes(jenis) && refs.length === 0) return `${jenis} wajib punya minimal satu ref`;
  return null;
}

const milikSendiriAtauAdmin = (p: Pelaku) => p.peran === 'admin' || p.pelakuId === p.pembuatId;
