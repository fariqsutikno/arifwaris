// packages/data/src/memori/pengguna.ts
// Data pengguna & akun di memori, berbagi sesi dan peran dengan buatMemori. Tiap simpan = upsert per kunci baris,
// sama dengan primary key tabel di supabase/migrations/20260926000003_pengguna.sql.
import type { Preferensi, ProgresBelajar, ProgresLatihan, RepositoriAkun, RepositoriPengguna, RiwayatTersimpan } from '../antarmuka.js';
import type { MemoriBersama } from './konten.js';

export function buatMemoriPengguna(bersama: MemoriBersama): { pengguna: RepositoriPengguna; akun: RepositoriAkun } {
  const riwayat = new Map<string, RiwayatTersimpan>();
  const belajar = new Map<string, ProgresBelajar>();
  const latihan = new Map<string, ProgresLatihan>();
  const preferensi = new Map<string, Preferensi>();

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
    async bacaPreferensi() { return preferensi.get(kunci()) ?? null; },
    async simpanPreferensi(baris) { preferensi.set(kunci(), baris); },
  };

  // akun kini satu sumber di buatMemori (bersama), supaya aturPeran berbasis email tidak diduplikasi di sini.
  const akun: RepositoriAkun = bersama.akun;

  return { pengguna, akun };
}
