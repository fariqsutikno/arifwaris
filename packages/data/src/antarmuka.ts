// Antarmuka repository (spec "Arsitektur"). App hanya mengenal antarmuka ini; implementasinya memori/ (tes & snapshot)
// dan supabase/ (sekarang), nanti http/ (VPS). Pesan galat dari semua implementasi = Error berpesan Indonesia.
import type { IsiKonten, JenisKonten, StatusRevisi } from '@waris/content';

export interface Sesi { userId: string; email: string }
export interface KontenTerbit<J extends JenisKonten = JenisKonten> {
  entriId: string; jenis: J; slug: string; urutan: number; revisiId: string; isi: IsiKonten[J]; refs: string[]; versiTerbit: number;
}
export interface RingkasanRevisi {
  id: string; entriId: string; status: StatusRevisi; refs: string[]; isi: unknown; dibuatOleh: string;
  diperiksaOleh: string | null; catatanReview: string | null; dibuatPada: string; diperiksaPada: string | null;
}
export interface DiksiTerbit { kunci: string; halaman: string; id: string; ar: string | null; versiTerbit: number }
export interface RingkasanRevisiDiksi {
  id: string; kunci: string; idTeks: string; arTeks: string | null; catatan: string | null; status: StatusRevisi;
  dibuatOleh: string; diperiksaOleh: string | null; catatanReview: string | null; dibuatPada: string;
}

export interface RepositoriKonten {
  versiSekarang(): Promise<number>;
  /** Hanya revisi terbit; isi tidak valid dibuang (console.warn), tidak melempar. */
  bacaTerbit(saring?: { jenis?: JenisKonten; sejakVersi?: number }): Promise<KontenTerbit[]>;
  daftarRevisi(entriId: string): Promise<RingkasanRevisi[]>;
}
export interface RepositoriEditorial {
  buatEntri(jenis: JenisKonten, slug: string, urutan: number): Promise<string>;
  /** Validasi isi (Zod) & refs sebelum simpan; melempar Error berpesan Indonesia bila tidak sah. */
  buatDraf<J extends JenisKonten>(entriId: string, jenis: J, isi: IsiKonten[J], refs: string[]): Promise<string>;
  ubahDraf<J extends JenisKonten>(revisiId: string, jenis: J, isi: IsiKonten[J], refs: string[]): Promise<void>;
  ajukan(revisiId: string): Promise<void>;
  setujui(revisiId: string): Promise<void>;
  kembalikan(revisiId: string, catatan: string): Promise<void>;
  terbitkanUlang(revisiId: string): Promise<void>;
  antreanReview(): Promise<RingkasanRevisi[]>;
}
export interface RepositoriDiksi {
  bacaTerbit(sejakVersi?: number): Promise<DiksiTerbit[]>;
  buatKunci(kunci: string, halaman: string): Promise<void>;
  buatDraf(kunci: string, idTeks: string, arTeks: string | null, catatan: string | null): Promise<string>;
  ajukan(revisiId: string): Promise<void>;
  setujui(revisiId: string): Promise<void>;
  kembalikan(revisiId: string, catatan: string): Promise<void>;
  terbitkanUlang(revisiId: string): Promise<void>;
  daftarRevisi(kunci: string): Promise<RingkasanRevisiDiksi[]>;
}
