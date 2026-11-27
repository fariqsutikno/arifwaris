// packages/data/src/bank.ts
// Batas ke bank soal generator (tabel bank_soal + RPC cari_soal): tipe, validasi masukan di pintu masuk,
// dan antarmuka repository. Implementasi: memori/bank.ts (tes) dan supabase/bank.ts.

export type TingkatBank = 'dasar' | 'menengah' | 'sulit';
const DAFTAR_TINGKAT: readonly TingkatBank[] = ['dasar', 'menengah', 'sulit'];

/** 'hitung' = kasus untuk tabel isian (G4); 'kuis' = soal pilihan ganda buatan mesin (K5), hanya yang aturannya disetujui keilmuan. */
export type BentukBank = 'hitung' | 'kuis';
const DAFTAR_BENTUK: readonly BentukBank[] = ['hitung', 'kuis'];

export const BATAS_JUMLAH_CARI_SOAL = 200;
const BATAS_PANJANG_BENIH = 200;
const BATAS_TOKEN_PER_DAFTAR = 50;
const BATAS_PANJANG_TOKEN = 100;
export const UKURAN_BATCH_SIMPAN_BANK = 2000;

/** Satu baris indeks. Tanpa kasus dan kunci jawaban: kode bisa diurai balik oleh packages/latihan. */
export interface BarisBankSoal {
  kode: string; versiGenerator: number; keluarga: string; tingkat: TingkatBank;
  modul: number[]; label: string[]; jumlahMayit: number; jumlahAhliWaris: number;
  /** Bawaan 'hitung'. */
  bentuk?: BentukBank;
  /** Aturan pengecoh soal kuis; kosong untuk soal hitung. */
  aturan?: string[];
}

export interface CariSoal {
  tingkat?: TingkatBank;
  modul?: number;
  keluarga?: string;
  label?: { semua?: string[]; salahSatu?: string[]; tanpa?: string[] };
  /** Bawaan 'hitung', jadi pemanggil lama tetap mendapat soal hitung saja. */
  bentuk?: BentukBank;
  jumlah: number;
  /** Benih sama + isi bank sama = kode sama; benih berbeda = jendela soal berbeda. */
  benih: string;
}

export interface RepositoriBankSoal {
  /** Kode soal acak tapi deterministik terhadap benih. Galat masukan = Error berpesan Indonesia. */
  cariSoal(masukan: CariSoal): Promise<string[]>;
  /** Upsert per kode (idempoten), per batch. Hanya peran impor (admin); anon/penulis ditolak RLS. */
  simpan(baris: BarisBankSoal[]): Promise<void>;
}

/** Persetujuan aturan pengecoh oleh tim keilmuan (per aturan, bukan per soal) dan contoh soalnya untuk diperiksa. */
export interface RepositoriAturanPengecoh {
  daftarDisetujui(): Promise<string[]>;
  /** Hanya keilmuan/admin; idempoten. */
  setujui(aturan: string): Promise<void>;
  cabut(aturan: string): Promise<void>;
  /** Kode soal kuis yang memakai aturan itu, acak deterministik terhadap benih, tanpa melihat status persetujuan. */
  contohSoal(aturan: string, jumlah: number, benih: string): Promise<string[]>;
}

export const BATAS_JUMLAH_CONTOH_SOAL = 20;

export function periksaContohSoal(aturan: string, jumlah: number, benih: string): void {
  if (typeof aturan !== 'string' || aturan.length < 1 || aturan.length > BATAS_PANJANG_TOKEN) throw new Error('aturan tidak sah');
  if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > BATAS_JUMLAH_CONTOH_SOAL) throw new Error(`jumlah harus bilangan bulat 1..${BATAS_JUMLAH_CONTOH_SOAL}`);
  if (typeof benih !== 'string' || benih.length < 1 || benih.length > BATAS_PANJANG_BENIH) throw new Error(`benih harus teks 1..${BATAS_PANJANG_BENIH} karakter`);
}

export function periksaCariSoal(masukan: CariSoal): void {
  const { tingkat, modul, keluarga, label, jumlah, benih, bentuk } = masukan;
  if (bentuk !== undefined && !DAFTAR_BENTUK.includes(bentuk)) throw new Error(`bentuk harus salah satu dari ${DAFTAR_BENTUK.join(', ')}`);
  if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > BATAS_JUMLAH_CARI_SOAL) throw new Error(`jumlah harus bilangan bulat 1..${BATAS_JUMLAH_CARI_SOAL}`);
  if (typeof benih !== 'string' || benih.length < 1 || benih.length > BATAS_PANJANG_BENIH) throw new Error(`benih harus teks 1..${BATAS_PANJANG_BENIH} karakter`);
  if (tingkat !== undefined && !DAFTAR_TINGKAT.includes(tingkat)) throw new Error(`tingkat harus salah satu dari ${DAFTAR_TINGKAT.join(', ')}`);
  if (modul !== undefined && (!Number.isInteger(modul) || modul < 1 || modul > 99)) throw new Error('modul harus bilangan bulat 1..99');
  if (keluarga !== undefined && (typeof keluarga !== 'string' || keluarga.length < 1 || keluarga.length > BATAS_PANJANG_TOKEN)) throw new Error('keluarga tidak sah');
  for (const [nama, daftar] of Object.entries(label ?? {})) {
    if (!Array.isArray(daftar) || daftar.length > BATAS_TOKEN_PER_DAFTAR) throw new Error(`label.${nama} harus daftar paling banyak ${BATAS_TOKEN_PER_DAFTAR} token`);
    if (daftar.some(token => typeof token !== 'string' || token.length < 1 || token.length > BATAS_PANJANG_TOKEN)) throw new Error(`label.${nama} berisi token tidak sah`);
  }
}
