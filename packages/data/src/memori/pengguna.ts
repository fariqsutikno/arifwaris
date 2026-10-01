// packages/data/src/memori/pengguna.ts
// Data pengguna & akun di memori, berbagi sesi dan peran dengan buatMemori. Tiap simpan = upsert per kunci baris,
// sama dengan primary key tabel di supabase/migrations/20260926000003_pengguna.sql.
// Streak/XP/papan dihitung SQL (diuji pgTAP 06_peringkat); di memori hanya nilai yang diset tes lewat aturPeringkat.
import type {
  BacaBagikan, BarisPeringkat, KabarPush, Kegiatan, LanggananPush, PeriodePeringkat, Preferensi, Profil, ProgresBelajar, ProgresLatihan, RepositoriAkun,
  RepositoriBagikan, RepositoriPengguna, RepositoriPeringkat, RingkasanPeringkat, RiwayatTersimpan,
} from '../antarmuka.js';
import { GALAT_TAUTAN_DIPAKAI } from '../antarmuka.js';
import type { MemoriBersama } from './konten.js';

export interface NilaiPeringkat { ringkasan: RingkasanPeringkat; papan: Record<PeriodePeringkat, BarisPeringkat[]> }

export function buatMemoriPengguna(bersama: MemoriBersama): {
  pengguna: RepositoriPengguna; akun: RepositoriAkun; peringkat: RepositoriPeringkat; bagikan: RepositoriBagikan;
  aturPeringkat(nilai: NilaiPeringkat | null): void;
  /** Hanya untuk tes: menaruh kabar push milik pengguna tertentu (di produksi ditulis Edge Function). */
  aturKabarPush(userId: string, kabar: KabarPush[]): void;
} {
  const riwayat = new Map<string, RiwayatTersimpan>();
  const belajar = new Map<string, ProgresBelajar>();
  const latihan = new Map<string, ProgresLatihan>();
  const preferensi = new Map<string, Preferensi>();
  const kegiatan = new Map<string, Kegiatan>();
  const profil = new Map<string, Profil>();
  const langgananPush = new Map<string, LanggananPush>();
  const kabarPush = new Map<string, KabarPush[]>();
  let nilaiPeringkat: NilaiPeringkat | null = null;

  const pemilik = () => {
    const sesi = bersama.sesiSekarang();
    if (!sesi) throw new Error('belum masuk');
    return sesi.userId;
  };
  const kunci = (...bagian: string[]) => [pemilik(), ...bagian].join('\u0000');
  const milikSaya = <T>(peta: Map<string, T>) => {
    const awalan = pemilik() + '\u0000';
    return [...peta.entries()].filter(([kunciBaris]) => kunciBaris.startsWith(awalan)).map(([, nilai]) => nilai);
  };

  const pengguna: RepositoriPengguna = {
    async bacaRiwayat() { return milikSaya(riwayat); },
    async simpanRiwayat(baris) { riwayat.set(kunci(baris.id), baris); },
    async hapusRiwayat(id) { riwayat.delete(kunci(id)); },
    async bacaProgresBelajar() { return milikSaya(belajar); },
    async simpanProgresBelajar(baris) { belajar.set(kunci(baris.pelajaranSlug), baris); },
    async bacaProgresLatihan() { return milikSaya(latihan); },
    async simpanProgresLatihan(baris) { latihan.set(kunci(baris.jenis, baris.soalSlug), baris); },
    async hapusSemuaProgresLatihan() { milikSaya(latihan).forEach(baris => latihan.delete(kunci(baris.jenis, baris.soalSlug))); },
    async bacaPreferensi() { return preferensi.get(kunci()) ?? null; },
    async simpanPreferensi(baris) { preferensi.set(kunci(), baris); },
    async catatKegiatan(baris) { if (!kegiatan.has(kunci(baris.id))) kegiatan.set(kunci(baris.id), baris); },
    async bacaProfil() { return profil.get(kunci()) ?? null; },
    async simpanProfil(baris) { profil.set(kunci(), { ...baris, namaTampilan: baris.namaTampilan.trim() }); },
    async simpanLangganan(baris) { langgananPush.set(kunci(baris.endpoint), baris); },
    async hapusLangganan(endpoint) { langgananPush.delete(kunci(endpoint)); },
    async bacaKabarPush(sejak) { return (kabarPush.get(pemilik()) ?? []).filter(isi => isi.dikirimPada > sejak); },
  };

  // null = layanan tak terjangkau, supaya tes bisa memeriksa tampilan saat gagal.
  const layanan = () => {
    if (!nilaiPeringkat) throw new Error('layanan peringkat tidak tersedia');
    return nilaiPeringkat;
  };
  const peringkat: RepositoriPeringkat = {
    async ringkasanSaya() { pemilik(); return layanan().ringkasan; },
    async papan(periode, batas = 50) {
      const semua = layanan().papan[periode];
      return semua.filter((baris, urutan) => urutan < batas || baris.saya);
    },
  };

  // Meniru kasus_dibagikan + baca_kasus_dibagikan (diuji pgTAP 15_bagikan).
  const dibagikan = new Map<string, { pemilik: string; idRiwayat: string; slug: string; akses: 'privat' | 'tautan' | 'email'; email: string[]; kasus: unknown }>();
  const barisSaya = (idRiwayat: string) => dibagikan.get(kunci(idRiwayat));
  const bagikan: RepositoriBagikan = {
    async bacaPengaturan(idRiwayat) {
      const baris = barisSaya(idRiwayat);
      return baris ? { slug: baris.slug, akses: baris.akses, email: baris.email } : null;
    },
    async simpan(idRiwayat, pengaturan, kasus) {
      if ([...dibagikan.values()].some(baris => baris.slug === pengaturan.slug && !(baris.pemilik === pemilik() && baris.idRiwayat === idRiwayat))) {
        throw new Error(GALAT_TAUTAN_DIPAKAI);
      }
      dibagikan.set(kunci(idRiwayat), { pemilik: pemilik(), idRiwayat, ...pengaturan, kasus });
    },
    async perbaruiKasus(idRiwayat, kasus) { const baris = barisSaya(idRiwayat); if (baris) baris.kasus = kasus; },
    async berhenti(idRiwayat) { dibagikan.delete(kunci(idRiwayat)); },
    async baca(slug): Promise<BacaBagikan> {
      const sesi = bersama.sesiSekarang();
      const baris = [...dibagikan.values()].find(isi => isi.slug === slug);
      const milikSendiri = !!sesi && baris?.pemilik === sesi.userId;
      if (!baris || (baris.akses === 'privat' && !milikSendiri)) return { status: 'tidak_ada' };
      const diizinkan = milikSendiri || baris.akses === 'tautan'
        || (baris.akses === 'email' && !!sesi && baris.email.some(surel => surel.toLowerCase() === sesi.email.toLowerCase()));
      if (!diizinkan) return { status: sesi ? 'tidak_boleh' : 'perlu_masuk' };
      return { status: 'ok', kasus: baris.kasus, akses: baris.akses, milikSendiri };
    },
  };

  // akun kini satu sumber di buatMemori (bersama), supaya aturPeran berbasis email tidak diduplikasi di sini.
  const akun: RepositoriAkun = bersama.akun;

  return { pengguna, akun, peringkat, bagikan, aturPeringkat: nilai => { nilaiPeringkat = nilai; }, aturKabarPush: (userId, kabar) => { kabarPush.set(userId, kabar); } };
}
