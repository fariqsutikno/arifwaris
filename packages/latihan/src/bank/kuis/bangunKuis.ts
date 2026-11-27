// Pembangun bank soal kuis angka (spec soal kuis §3.3). Menerima aliran kasus bank biasa (indeks bank atau penyapu);
// menyerahkan daftar baris indeks kuis (kode `K1-…`, tingkat, modul, jenis, aturan pengecoh yang dipakai).
// Dua pass atas sumber yang sama, seperti bangunBankDariKode: pass 1 menjalankan engine sekali per kasus dan hanya
// mencatat angka (hash, kelompok, nomor kasus, nomor pertanyaan); kuota water-filling dihitung dari ukuran kelompok;
// pass 2 membangun ulang hanya kasus yang terpilih. Kelompok kuota = (tingkat, jenis pertanyaan, label utama).

import type { Tingkat } from '@waris/content';
import { bagiJatah, DaftarPadat, hashKode, labelUtama, PORSI_TINGKAT } from '../bangunBank.js';
import type { KasusBiasa } from '../kodeBiasa.js';
import { analisisKasus, tingkatKuis } from './analisis.js';
import type { AturanPengecoh } from './aturanPengecoh.js';
import { daftarPertanyaan } from './fakta.js';
import { buatKodeKuis, type JenisPertanyaan } from './kodeKuis.js';
import { rakitPilihan } from './rakitPilihan.js';

/** Target awal spec soal kuis §3.3; bisa dinaikkan. */
export const TARGET_TOTAL_KUIS = 30_000;

const URUTAN_TINGKAT: readonly Tingkat[] = ['dasar', 'menengah', 'sulit'];
const PROGRES_SETIAP_KASUS = 100_000;

export type BarisKuis = {
  kode: string; jenis: JenisPertanyaan; tingkat: Tingkat; modul: number[]; labelUtama: string; aturan: AturanPengecoh[];
};

export type HasilKuis = {
  terpilih: BarisKuis[];
  kasusDisapu: number;
  /** Kasus yang tak bisa jadi soal kuis angka, per alasan. */
  dibuang: Record<string, number>;
  /** Soal yang lolos (>= 2 pengecoh sah), sebelum kuota. */
  jumlahLolos: number;
  /** Ukuran stok per `tingkat/jenis/labelUtama`. */
  stokPerKelompok: Map<string, number>;
  /** Berapa kali tiap aturan menjadi pengecoh di soal yang lolos (sebelum kuota). */
  aturanLolos: Record<AturanPengecoh, number>;
};

const kunciKelompok = (tingkat: Tingkat, jenis: JenisPertanyaan, utama: string) => `${tingkat}/${jenis}/${utama}`;

export function bangunKuis(sumber: () => Iterable<KasusBiasa>, target = TARGET_TOTAL_KUIS, progres?: (sudah: number) => void): HasilKuis {
  const hash = new DaftarPadat(), nomorKelompok = new DaftarPadat(), nomorKasus = new DaftarPadat(), nomorTanya = new DaftarPadat();
  const kelompok: Array<{ kunci: string; tingkat: Tingkat }> = [];
  const idKelompok = new Map<string, number>();
  const dibuang: Record<string, number> = {};
  const aturanLolos = {} as Record<AturanPengecoh, number>;
  let kasusDisapu = 0;

  for (const dasar of sumber()) {
    const nomor = kasusDisapu++;
    if (progres && kasusDisapu % PROGRES_SETIAP_KASUS === 0) progres(kasusDisapu);
    const analisis = analisisKasus(dasar);
    if (!analisis.ok) { dibuang[analisis.galat] = (dibuang[analisis.galat] ?? 0) + 1; continue; }
    const utama = labelUtama(analisis.label);
    daftarPertanyaan(analisis.fakta).forEach((tanya, urutan) => {
      const kode = buatKodeKuis(dasar, tanya);
      const pilihan = rakitPilihan(kode, analisis.fakta, tanya);
      if (!pilihan) { dibuang.PENGECOH_KURANG = (dibuang.PENGECOH_KURANG ?? 0) + 1; return; }
      const tingkat = tingkatKuis(analisis.tingkat, tanya.jenis);
      const kunci = kunciKelompok(tingkat, tanya.jenis, utama);
      let id = idKelompok.get(kunci);
      if (id === undefined) { id = kelompok.length; kelompok.push({ kunci, tingkat }); idKelompok.set(kunci, id); }
      for (const isi of pilihan.pengecoh) aturanLolos[isi.aturan] = (aturanLolos[isi.aturan] ?? 0) + 1;
      hash.tambah(hashKode(kode)); nomorKelompok.tambah(id); nomorKasus.tambah(nomor); nomorTanya.tambah(urutan);
    });
  }

  const jumlahLolos = hash.panjang;
  const anggota: number[][] = kelompok.map(() => []);
  for (let urutan = 0; urutan < jumlahLolos; urutan++) anggota[nomorKelompok.ambil(urutan)]!.push(urutan);
  const stokPerKelompok = new Map(kelompok.map((isi, id) => [isi.kunci, anggota[id]!.length]));

  // Dalam tiap tingkat: jatah tingkat dibagi rata ke kelompok (water-filling), lalu diambil kode dengan hash terkecil.
  const dipilih = new Map<number, number[]>();
  for (const tingkat of URUTAN_TINGKAT) {
    const ukuran = new Map(kelompok.flatMap((isi, id) => (isi.tingkat === tingkat ? [[id, anggota[id]!.length] as const] : [])));
    const jatah = bagiJatah(new Map([...ukuran].map(([id, besar]) => [String(id), besar])), Math.floor(target * PORSI_TINGKAT[tingkat]));
    for (const [teksId, banyak] of jatah) {
      const daftar = anggota[Number(teksId)]!;
      daftar.sort((a, b) => hash.ambil(a) - hash.ambil(b) || a - b);
      for (const urutan of daftar.slice(0, banyak)) {
        const ada = dipilih.get(nomorKasus.ambil(urutan));
        if (ada) ada.push(nomorTanya.ambil(urutan)); else dipilih.set(nomorKasus.ambil(urutan), [nomorTanya.ambil(urutan)]);
      }
    }
  }

  const terpilih: BarisKuis[] = [];
  let nomor = 0;
  for (const dasar of sumber()) {
    const urutanTerpilih = dipilih.get(nomor++);
    if (!urutanTerpilih) continue;
    const analisis = analisisKasus(dasar);
    if (!analisis.ok) continue;
    const semua = daftarPertanyaan(analisis.fakta);
    for (const urutan of urutanTerpilih) {
      const tanya = semua[urutan]!;
      const kode = buatKodeKuis(dasar, tanya);
      const pilihan = rakitPilihan(kode, analisis.fakta, tanya)!;
      terpilih.push({
        kode, jenis: tanya.jenis, tingkat: tingkatKuis(analisis.tingkat, tanya.jenis), modul: analisis.modul,
        labelUtama: labelUtama(analisis.label), aturan: pilihan.pengecoh.map(isi => isi.aturan),
      });
    }
  }
  terpilih.sort((a, b) => (a.kode < b.kode ? -1 : 1));
  return { terpilih, kasusDisapu, dibuang, jumlahLolos, stokPerKelompok, aturanLolos };
}
