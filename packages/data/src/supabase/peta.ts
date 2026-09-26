// packages/data/src/supabase/peta.ts
// Peta baris tabel (snake_case) ↔ tipe antarmuka (camelCase). Satu tempat supaya nama kolom SQL tidak tersebar.
import type { JenisKonten } from '@waris/content';
import type { BarisTerbitMentah } from '../saring.js';
import type { DiksiTerbit, ProgresBelajar, ProgresLatihan, RingkasanRevisi, RingkasanRevisiDiksi, RiwayatTersimpan } from '../antarmuka.js';

type Baris = Record<string, any>;

export const keRevisi = (baris: Baris): RingkasanRevisi => ({
  id: baris.id, entriId: baris.entri_id, status: baris.status, refs: baris.refs, isi: baris.isi, dibuatOleh: baris.dibuat_oleh,
  diperiksaOleh: baris.diperiksa_oleh, catatanReview: baris.catatan_review, dibuatPada: baris.dibuat_pada, diperiksaPada: baris.diperiksa_pada,
});

export const keRevisiDiksi = (baris: Baris): RingkasanRevisiDiksi => ({
  id: baris.id, kunci: baris.kunci, idTeks: baris.id_teks, arTeks: baris.ar_teks, catatan: baris.catatan, status: baris.status,
  dibuatOleh: baris.dibuat_oleh, diperiksaOleh: baris.diperiksa_oleh, catatanReview: baris.catatan_review, dibuatPada: baris.dibuat_pada,
});

/** Baris entri_konten dengan relasi `revisi_terbit:revisi!entri_konten_revisi_terbit_id_fkey(*)`. */
export const keTerbitMentah = (baris: Baris): BarisTerbitMentah => ({
  entriId: baris.id, jenis: baris.jenis as JenisKonten, slug: baris.slug, urutan: baris.urutan,
  revisiId: baris.revisi_terbit.id, isi: baris.revisi_terbit.isi, refs: baris.revisi_terbit.refs, versiTerbit: Number(baris.versi_terbit),
});

export const keDiksiTerbit = (baris: Baris): DiksiTerbit => ({
  kunci: baris.kunci, halaman: baris.halaman, id: baris.revisi_terbit.id_teks, ar: baris.revisi_terbit.ar_teks, versiTerbit: Number(baris.versi_terbit),
});

export const keRiwayat = (baris: Baris): RiwayatTersimpan => ({ id: baris.id, kasus: baris.kasus, judul: baris.judul, disimpanPada: baris.disimpan_pada });
export const keProgresBelajar = (baris: Baris): ProgresBelajar => ({ pelajaranSlug: baris.pelajaran_slug, selesai: baris.selesai, diubahPada: baris.diubah_pada });
export const keProgresLatihan = (baris: Baris): ProgresLatihan => ({
  soalSlug: baris.soal_slug, jenis: baris.jenis, jawabanTerakhir: baris.jawaban_terakhir, benar: baris.benar, jumlahCoba: baris.jumlah_coba, diubahPada: baris.diubah_pada,
});
