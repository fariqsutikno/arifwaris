// packages/data/src/memori/konten.ts
// Repository di memori untuk tes dan snapshot build. Menegakkan aturan yang sama dengan Postgres (fungsi transisi + RLS)
// lewat aturan murni di packages/content, supaya tes app tanpa jaringan tetap setia pada perilaku DB.
// Isi disimpan dalam bentuk JSON (keJson) seperti di jsonb, lalu dibaca ulang lewat saringValid.
import {
  bolehSuntingDraf, keJson, periksaRefs, transisiRevisi, bacaIsi,
  type AksiEditorial, type IsiKonten, type JenisKonten, type Peran, type StatusRevisi,
} from '@waris/content';
import type {
  DiksiTerbit, RepositoriDiksi, RepositoriEditorial, RepositoriKonten, RingkasanRevisi, RingkasanRevisiDiksi, Sesi,
} from '../antarmuka.js';
import { saringValid } from '../saring.js';

interface EntriMemori { id: string; jenis: JenisKonten; slug: string; urutan: number; revisiTerbitId: string | null; versiTerbit: number | null }
interface KunciDiksiMemori { kunci: string; halaman: string; revisiTerbitId: string | null; versiTerbit: number | null }

export interface MemoriBersama {
  konten: RepositoriKonten;
  editorial: RepositoriEditorial;
  diksi: RepositoriDiksi;
  masukSebagai(sesi: Sesi | null): void;
  aturPeranLangsung(userId: string, peran: Peran | null): void;
  /** Hanya untuk tes: meniru baris jsonb yang disunting manual di DB. */
  isiRevisiMentah(revisiId: string, isi: unknown): void;
}

export function buatMemori(awal: { refs?: string[]; sesi?: Sesi | null; peran?: Record<string, Peran> } = {}): MemoriBersama {
  const refsDikenal = new Set(awal.refs ?? []);
  const peran = new Map(Object.entries(awal.peran ?? {}));
  let sesi = awal.sesi ?? null;
  let versi = 0;
  let nomorId = 0;
  const idBaru = () => `m-${++nomorId}`;
  const sekarang = () => new Date(0).toISOString(); // ponytail: waktu tetap di memori; urutan cukup dari id berurutan
  const entri = new Map<string, EntriMemori>();
  const revisi = new Map<string, RingkasanRevisi>();
  const kunciDiksi = new Map<string, KunciDiksiMemori>();
  const revisiDiksi = new Map<string, RingkasanRevisiDiksi>();

  const pelaku = () => {
    if (!sesi) throw new Error('belum masuk');
    return { pelakuId: sesi.userId, peran: peran.get(sesi.userId) ?? null };
  };
  const wajibPeran = (...boleh: Peran[]) => {
    const { peran: peranSaya } = pelaku();
    if (!peranSaya || !boleh.includes(peranSaya)) throw new Error(`perlu peran ${boleh.join('/')}`);
  };
  const ambil = <T>(peta: Map<string, T>, id: string, nama: string): T => {
    const nilai = peta.get(id);
    if (!nilai) throw new Error(`${nama} ${id} tidak ditemukan`);
    return nilai;
  };
  const periksaIsi = <J extends JenisKonten>(jenis: J, isi: IsiKonten[J], refs: string[]) => {
    const json = keJson(jenis, isi);
    const hasil = bacaIsi(jenis, json);
    if (!hasil.ok) throw new Error(`isi ${jenis} tidak sah: ${hasil.galat}`);
    const galatRefs = periksaRefs(jenis, refs, refsDikenal);
    if (galatRefs) throw new Error(galatRefs);
    return json;
  };
  const jalankanTransisi = (
    target: { status: StatusRevisi; dibuatOleh: string; diperiksaOleh: string | null; catatanReview: string | null },
    aksi: AksiEditorial, catatan?: string,
  ) => {
    const hasil = transisiRevisi({ ...pelaku(), pembuatId: target.dibuatOleh, status: target.status, aksi, ...(catatan === undefined ? {} : { catatan }) });
    if (!hasil.ok) throw new Error(hasil.galat);
    target.status = hasil.status;
    if (aksi !== 'ajukan') target.diperiksaOleh = pelaku().pelakuId;
    if (aksi === 'kembalikan') target.catatanReview = catatan ?? null;
  };
  const wajibPemeriksa = () => wajibPeran('admin', 'reviewer');

  const konten: RepositoriKonten = {
    async versiSekarang() { return versi; },
    async bacaTerbit(saring = {}) {
      const mentah = [...entri.values()]
        .filter(baris => baris.revisiTerbitId && (!saring.jenis || baris.jenis === saring.jenis)
          && (saring.sejakVersi === undefined || (baris.versiTerbit ?? 0) > saring.sejakVersi))
        .sort((a, b) => a.urutan - b.urutan)
        .map(baris => {
          const terbit = revisi.get(baris.revisiTerbitId!)!;
          return { entriId: baris.id, jenis: baris.jenis, slug: baris.slug, urutan: baris.urutan, revisiId: terbit.id, isi: terbit.isi, refs: terbit.refs, versiTerbit: baris.versiTerbit! };
        });
      return saringValid(mentah);
    },
    async daftarRevisi(entriId) { return [...revisi.values()].filter(baris => baris.entriId === entriId); },
  };

  const editorial: RepositoriEditorial = {
    async buatEntri(jenis, slug, urutan) {
      wajibPeran('admin', 'penulis');
      if ([...entri.values()].some(baris => baris.jenis === jenis && baris.slug === slug)) throw new Error(`${jenis}/${slug} sudah ada`);
      const id = idBaru();
      entri.set(id, { id, jenis, slug, urutan, revisiTerbitId: null, versiTerbit: null });
      return id;
    },
    async buatDraf(entriId, jenis, isi, refs) {
      wajibPeran('admin', 'penulis');
      ambil(entri, entriId, 'entri');
      const id = idBaru();
      revisi.set(id, {
        id, entriId, status: 'draf', refs: [...refs], isi: periksaIsi(jenis, isi, refs), dibuatOleh: pelaku().pelakuId,
        diperiksaOleh: null, catatanReview: null, dibuatPada: sekarang(), diperiksaPada: null,
      });
      return id;
    },
    async ubahDraf(revisiId, jenis, isi, refs) {
      const target = ambil(revisi, revisiId, 'revisi');
      if (!bolehSuntingDraf({ ...pelaku(), pembuatId: target.dibuatOleh, status: target.status })) throw new Error('draf ini tidak bisa disunting');
      target.isi = periksaIsi(jenis, isi, refs);
      target.refs = [...refs];
    },
    async ajukan(revisiId) { jalankanTransisi(ambil(revisi, revisiId, 'revisi'), 'ajukan'); },
    async setujui(revisiId) {
      const target = ambil(revisi, revisiId, 'revisi');
      jalankanTransisi(target, 'setujui');
      const tujuan = ambil(entri, target.entriId, 'entri');
      tujuan.revisiTerbitId = revisiId;
      tujuan.versiTerbit = ++versi;
    },
    async kembalikan(revisiId, catatan) { jalankanTransisi(ambil(revisi, revisiId, 'revisi'), 'kembalikan', catatan); },
    async terbitkanUlang(revisiId) {
      wajibPemeriksa();
      const target = ambil(revisi, revisiId, 'revisi');
      if (target.status !== 'disetujui') throw new Error('hanya revisi disetujui yang bisa diterbitkan ulang');
      const tujuan = ambil(entri, target.entriId, 'entri');
      tujuan.revisiTerbitId = revisiId;
      tujuan.versiTerbit = ++versi;
    },
    async antreanReview() { return [...revisi.values()].filter(baris => baris.status === 'diajukan'); },
  };

  const diksi: RepositoriDiksi = {
    async bacaTerbit(sejakVersi) {
      return [...kunciDiksi.values()]
        .filter(baris => baris.revisiTerbitId && (sejakVersi === undefined || (baris.versiTerbit ?? 0) > sejakVersi))
        .map((baris): DiksiTerbit => {
          const terbit = revisiDiksi.get(baris.revisiTerbitId!)!;
          return { kunci: baris.kunci, halaman: baris.halaman, id: terbit.idTeks, ar: terbit.arTeks, versiTerbit: baris.versiTerbit! };
        });
    },
    async buatKunci(kunci, halaman) {
      wajibPeran('admin', 'penulis');
      if (!/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(kunci)) throw new Error(`kunci diksi tidak sah: ${kunci}`);
      kunciDiksi.set(kunci, { kunci, halaman, revisiTerbitId: null, versiTerbit: null });
    },
    async buatDraf(kunci, idTeks, arTeks, catatan) {
      wajibPeran('admin', 'penulis');
      ambil(kunciDiksi, kunci, 'kunci diksi');
      const id = idBaru();
      revisiDiksi.set(id, {
        id, kunci, idTeks, arTeks, catatan, status: 'draf', dibuatOleh: pelaku().pelakuId,
        diperiksaOleh: null, catatanReview: null, dibuatPada: sekarang(),
      });
      return id;
    },
    async ajukan(revisiId) { jalankanTransisi(ambil(revisiDiksi, revisiId, 'revisi diksi'), 'ajukan'); },
    async setujui(revisiId) {
      const target = ambil(revisiDiksi, revisiId, 'revisi diksi');
      jalankanTransisi(target, 'setujui');
      const tujuan = ambil(kunciDiksi, target.kunci, 'kunci diksi');
      tujuan.revisiTerbitId = revisiId;
      tujuan.versiTerbit = ++versi;
    },
    async kembalikan(revisiId, catatan) { jalankanTransisi(ambil(revisiDiksi, revisiId, 'revisi diksi'), 'kembalikan', catatan); },
    async terbitkanUlang(revisiId) {
      wajibPemeriksa();
      const target = ambil(revisiDiksi, revisiId, 'revisi diksi');
      if (target.status !== 'disetujui') throw new Error('hanya revisi disetujui yang bisa diterbitkan ulang');
      const tujuan = ambil(kunciDiksi, target.kunci, 'kunci diksi');
      tujuan.revisiTerbitId = revisiId;
      tujuan.versiTerbit = ++versi;
    },
    async daftarRevisi(kunci) { return [...revisiDiksi.values()].filter(baris => baris.kunci === kunci); },
  };

  return {
    konten, editorial, diksi,
    masukSebagai(sesiBaru) { sesi = sesiBaru; },
    aturPeranLangsung(userId, peranBaru) { if (peranBaru) peran.set(userId, peranBaru); else peran.delete(userId); },
    isiRevisiMentah(revisiId, isi) { ambil(revisi, revisiId, 'revisi').isi = isi; },
  };
}
