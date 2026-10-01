// Antarmuka repository (spec "Arsitektur"). App hanya mengenal antarmuka ini; implementasinya memori/ (tes & snapshot)
// dan supabase/ (sekarang), nanti http/ (VPS). Pesan galat dari semua implementasi = Error berpesan Indonesia.
import type { IsiKonten, JenisKonten, Peran, StatusRevisi } from '@waris/content';

/** `nama` & `avatar` dari metadata Google, hanya untuk nilai bawaan profil (spec tahap 5). */
export interface Sesi { userId: string; email: string; nama?: string | null; avatar?: string | null }
export interface KontenTerbit<J extends JenisKonten = JenisKonten> {
  entriId: string; jenis: J; slug: string; urutan: number; revisiId: string; isi: IsiKonten[J]; refs: string[]; versiTerbit: number;
}
/** `diabaikan` = revisi dikembalikan yang dibuang pembuatnya: tetap di riwayat, tidak lagi dianggap revisi terbaru.
 * `hapus` = revisi penghapusan: isinya salinan revisi terbit; bila disetujui, entri hilang dari web. */
export interface RingkasanRevisi {
  id: string; entriId: string; status: StatusRevisi; hapus: boolean; diabaikan: boolean; refs: string[]; isi: unknown; dibuatOleh: string;
  diperiksaOleh: string | null; catatanReview: string | null; dibuatPada: string; diperiksaPada: string | null;
}
export interface DiksiTerbit { kunci: string; halaman: string; id: string; ar: string | null; versiTerbit: number }
export interface RingkasanRevisiDiksi {
  id: string; kunci: string; idTeks: string; arTeks: string | null; catatan: string | null; status: StatusRevisi; diabaikan: boolean;
  dibuatOleh: string; diperiksaOleh: string | null; catatanReview: string | null; dibuatPada: string; diperiksaPada: string | null;
}
/** Revisi konten milik pengguna yang sedang masuk, beserta entrinya (menu Ajuan saya). */
export interface AjuanKonten extends RingkasanRevisi { jenis: JenisKonten; slug: string }
/** Entri di Sampah bila `dihapus` (revisi terbitnya revisi penghapusan; tidak tampil di web walau revisiTerbitId
 * terisi) atau `dibuang` (belum pernah terbit, dibuang langsung). */
export interface RingkasanEntri {
  entriId: string; jenis: JenisKonten; slug: string; urutan: number;
  revisiTerbitId: string | null; dihapus: boolean; dibuang: boolean; revisiTerakhir: RingkasanRevisi | null;
  /** Ditarik dari web tanpa dibuang; isi & revisi tetap. */
  diarsipkan: boolean;
  /** Isi revisi tayang, hanya terisi bila revisiTerakhir sudah dibuang (`diabaikan`): isinya bukan lagi yang berlaku. */
  isiTerbit?: unknown;
}
/** Kejadian Sampah & Arsip satu entri (tabel jejak_entri); suntingan & review tercatat di revisinya sendiri. */
export interface JejakEntri {
  id: string; entriId: string; aksi: 'dibuang' | 'buang_diajukan' | 'dipulihkan' | 'diarsipkan' | 'dikeluarkan_arsip'; pelaku: string; pada: string; catatan: string | null;
}
export interface RingkasanKunciDiksi {
  kunci: string; halaman: string; terbit: DiksiTerbit | null; revisiTerakhir: RingkasanRevisiDiksi | null;
}
export interface PeranPengguna { userId: string; email: string; nama: string | null; peran: Peran }

export interface RepositoriKonten {
  versiSekarang(): Promise<number>;
  /** Hanya revisi terbit, tanpa entri yang dihapus/diarsipkan; isi tidak valid dibuang (console.warn), tidak melempar. */
  bacaTerbit(saring?: { jenis?: JenisKonten; sejakVersi?: number }): Promise<KontenTerbit[]>;
  /** entriId yang penghapusan/pengarsipannya terbit sejak `sejakVersi`, supaya cache web membuangnya. */
  bacaDihapus(sejakVersi: number): Promise<string[]>;
  daftarRevisi(entriId: string): Promise<RingkasanRevisi[]>;
  daftarJejak(entriId: string): Promise<JejakEntri[]>;
  /** Untuk portal admin: entri satu jenis (tanpa jenis = semua jenis, satu kueri), urut `urutan` lalu slug,
   * dengan revisi terakhir & terbit. */
  daftarEntri(jenis?: JenisKonten): Promise<RingkasanEntri[]>;
  daftarRefs(): Promise<{ kode: string; bab: number }[]>;
}
export interface RepositoriEditorial {
  buatEntri(jenis: JenisKonten, slug: string, urutan: number): Promise<string>;
  /** Seret di portal: urutan = posisi * 10, tanpa revisi; semua id satu jenis. admin/penulis. */
  aturUrutan(entriIds: string[]): Promise<void>;
  /** Validasi isi (Zod) & refs sebelum simpan; melempar Error berpesan Indonesia bila tidak sah. */
  buatDraf<J extends JenisKonten>(entriId: string, jenis: J, isi: IsiKonten[J], refs: string[]): Promise<string>;
  ubahDraf<J extends JenisKonten>(revisiId: string, jenis: J, isi: IsiKonten[J], refs: string[]): Promise<void>;
  ajukan(revisiId: string): Promise<void>;
  setujui(revisiId: string): Promise<void>;
  kembalikan(revisiId: string, catatan: string): Promise<void>;
  terbitkanUlang(revisiId: string): Promise<void>;
  antreanReview(): Promise<RingkasanRevisi[]>;
  /** Revisi buatan `userId` yang sudah dikirim (bukan draf), terbaru dulu, paling banyak BATAS_AJUAN_SAYA. */
  revisiSaya(userId: string): Promise<AjuanKonten[]>;
  /** Pembuat (atau admin) menarik kembali pengajuannya: diajukan → draf (pengajuan ke Sampah: ditutup). */
  tarik(revisiId: string): Promise<void>;
  /** Pembuat (atau admin) membuang revisi yang dikembalikan tanpa menyuntingnya; riwayat tetap. */
  abaikan(revisiId: string): Promise<void>;
  /** Admin: draf langsung terbit tanpa antrean. */
  terbitkanLangsung(revisiId: string): Promise<void>;
  /** Pembuat (atau admin) mengganti isi ajuannya yang masih menunggu; tetap di antrean. */
  perbaruiAjuan<J extends JenisKonten>(revisiId: string, jenis: J, isi: IsiKonten[J], refs: string[]): Promise<void>;
  /** Pindah ke Sampah (tidak ada hapus permanen). 'diajukan' = penulis pada entri terbit, menunggu review;
   * 'dibuang' = langsung masuk Sampah. */
  buangEntri(entriId: string, alasan?: string): Promise<'dibuang' | 'diajukan'>;
  pulihkanEntri(entriId: string): Promise<void>;
  /** Semua peran, langsung tanpa review: tarik dari web (arsipkan) / tayangkan lagi (keluarkan). */
  arsipkanEntri(entriId: string, alasan?: string): Promise<void>;
  keluarkanArsipEntri(entriId: string): Promise<void>;
}
export interface RepositoriDiksi {
  bacaTerbit(sejakVersi?: number): Promise<DiksiTerbit[]>;
  buatKunci(kunci: string, halaman: string): Promise<void>;
  buatDraf(kunci: string, idTeks: string, arTeks: string | null, catatan: string | null): Promise<string>;
  ajukan(revisiId: string): Promise<void>;
  setujui(revisiId: string): Promise<void>;
  kembalikan(revisiId: string, catatan: string): Promise<void>;
  terbitkanUlang(revisiId: string): Promise<void>;
  /** Pembuat (atau admin) membuang revisi teks yang dikembalikan; teks tayang & riwayat tetap. */
  abaikan(revisiId: string): Promise<void>;
  /** Admin: draf langsung terbit tanpa antrean. */
  terbitkanLangsung(revisiId: string): Promise<void>;
  /** Pembuat (atau admin) mengganti teks ajuannya yang masih menunggu; tetap di antrean. */
  perbaruiAjuan(revisiId: string, idTeks: string, arTeks: string | null): Promise<void>;
  daftarRevisi(kunci: string): Promise<RingkasanRevisiDiksi[]>;
  /** Untuk portal admin: semua kunci, urut halaman lalu kunci, dengan revisi terakhir & terbit. */
  daftarKunci(): Promise<RingkasanKunciDiksi[]>;
  antreanReview(): Promise<RingkasanRevisiDiksi[]>;
  /** Revisi teks buatan `userId` yang sudah dikirim (bukan draf), terbaru dulu, paling banyak BATAS_AJUAN_SAYA. */
  revisiSaya(userId: string): Promise<RingkasanRevisiDiksi[]>;
}

// ponytail: batas jumlah, bukan rentang waktu; cukup untuk kabar terbaru. Tambah paging bila ada yang mencari ajuan lama.
export const BATAS_AJUAN_SAYA = 100;

export interface RiwayatTersimpan { id: string; kasus: unknown; judul: string; disimpanPada: string }
export interface ProgresBelajar { pelajaranSlug: string; selesai: boolean; diubahPada: string }
export interface ProgresLatihan {
  soalSlug: string; jenis: 'kuis' | 'hitung'; jawabanTerakhir: unknown; benar: boolean; jumlahCoba: number; diubahPada: string;
}
export interface Preferensi { isi: Record<string, unknown>; diubahPada: string }
/** Satu kegiatan belajar selesai (spec akun: dasar streak tahap 5). `id` dibuat klien supaya kirim ulang tidak dobel. */
export interface Kegiatan { id: string; jenis: 'pelajaran' | 'soal' | 'kuis'; slug: string; benar: boolean | null }

/** Profil untuk papan peringkat (spec tahap 5). Tanpa baris = tidak ikut papan, zona Asia/Jakarta. */
export interface Profil {
  namaTampilan: string; ikutPapanPeringkat: boolean; tampilkanAvatar: boolean; zonaWaktu: string;
  /** Sakelar push per jenis (bawaan menyala di server); tidak ada = tidak diubah. */
  pushStreak?: boolean; pushPeringkat?: boolean;
}
/** Langganan Web Push satu perangkat; endpoint rahasia, hanya pemiliknya yang boleh membaca. */
export interface LanggananPush { endpoint: string; p256dh: string; auth: string; bahasa: 'id' | 'ar' }
/** Kabar yang sudah dikirim server lewat push (log kirim_push), untuk dimasukkan ke kotak masuk saat aplikasi dibuka. */
export interface KabarPush { kunci: string; jenis: 'streak_terancam' | 'peringkat_pekan'; judul: string; isi: string; tautan: string | null; mendesak: boolean; dikirimPada: string }
export interface RingkasanPeringkat {
  xpTotal: number; xpMingguIni: number; streakSekarang: number; streakTerpanjang: number; aktifHariIni: boolean;
}
export type PeriodePeringkat = 'minggu' | 'semua';
export interface BarisPeringkat {
  peringkat: number; namaTampilan: string; avatar: string | null; xp: number; streakSekarang: number; saya: boolean;
}

/** Semua operasi milik pengguna yang sedang masuk; melempar 'belum masuk' bila tanpa sesi. */
export interface RepositoriPengguna {
  bacaRiwayat(): Promise<RiwayatTersimpan[]>;
  simpanRiwayat(riwayat: RiwayatTersimpan): Promise<void>;
  hapusRiwayat(id: string): Promise<void>;
  bacaProgresBelajar(): Promise<ProgresBelajar[]>;
  simpanProgresBelajar(progres: ProgresBelajar): Promise<void>;
  bacaProgresLatihan(): Promise<ProgresLatihan[]>;
  simpanProgresLatihan(progres: ProgresLatihan): Promise<void>;
  /** Reset progres: hapus semua progres latihan milik pengguna. */
  hapusSemuaProgresLatihan(): Promise<void>;
  bacaPreferensi(): Promise<Preferensi | null>;
  simpanPreferensi(preferensi: Preferensi): Promise<void>;
  catatKegiatan(kegiatan: Kegiatan): Promise<void>;
  bacaProfil(): Promise<Profil | null>;
  /** Langsung ke server, tidak lewat antrean: profil hanya dipakai di halaman yang butuh jaringan. */
  simpanProfil(profil: Profil): Promise<void>;
  /** Idempoten per endpoint: memperbarui kunci bila perangkat berlangganan ulang. */
  simpanLangganan(langganan: LanggananPush): Promise<void>;
  hapusLangganan(endpoint: string): Promise<void>;
  /** Kabar push milik pengguna yang dikirim setelah `sejak` (ISO), terbaru dulu. */
  bacaKabarPush(sejak: string): Promise<KabarPush[]>;
}
/** Streak, XP & papan dihitung server dari log_kegiatan (supabase/migrations/20260927000006_peringkat.sql). */
export interface RepositoriPeringkat {
  /** Melempar 'belum masuk' bila tanpa sesi. */
  ringkasanSaya(): Promise<RingkasanPeringkat>;
  /** Tanpa login pun bisa; hanya pengguna yang ikut. Baris pemanggil ditambahkan bila di luar `batas`. */
  papan(periode: PeriodePeringkat, batas?: number): Promise<BarisPeringkat[]>;
}
// Bantuan AI lewat Edge Function ai-bantu (supabase/functions/ai-bantu/logika.ts memegang aturan & validasinya).
export interface RujukanKonteksAi { kode: string; klaim: string; sumber: string; kutipan: string }
export type PermintaanAi =
  | { fitur: 'rapikan'; teks: string }
  | { fitur: 'drafKuis'; bab: number; judulBab: string; rujukan: RujukanKonteksAi[]; pertanyaan: string }
  | { fitur: 'saran'; jenis: 'materi' | 'faq'; judul: string; tujuan?: string | undefined; teks: string };
export interface DrafKuisAi {
  pertanyaan: string; pilihan: string[]; indeksBenar: number; alasanPilihan: string[]; pembahasan: string; rujukan: string[];
}
export type HasilAi =
  | { fitur: 'rapikan'; teks: string }
  | { fitur: 'drafKuis'; draf: DrafKuisAi }
  | { fitur: 'saran'; saran: string[] };
export interface RepositoriAi {
  /** Melempar Error berpesan Indonesia (kuota habis, AI belum aktif, jawaban ditolak pemeriksa). */
  bantu(permintaan: PermintaanAi): Promise<{ hasil: HasilAi; sisaKuota: number }>;
}

export interface RepositoriAkun {
  sesi(): Promise<Sesi | null>;
  /** Mengarahkan ke Google; kembali ke `alamatKembali`. */
  masukGoogle(alamatKembali: string): Promise<void>;
  keluar(): Promise<void>;
  peranSaya(): Promise<Peran | null>;
  /** Admin saja. `null` = cabut peran. Melempar 'akun belum pernah masuk' bila email tak dikenal. */
  aturPeran(email: string, peran: Peran | null): Promise<void>;
  /** Admin saja. */
  daftarPeran(): Promise<PeranPengguna[]>;
  /** Nama anggota tim (tanpa email) untuk riwayat; semua pengguna berperan. */
  daftarNamaTim(): Promise<{ userId: string; nama: string }[]>;
}
