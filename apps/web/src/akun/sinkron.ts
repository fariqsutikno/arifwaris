// Sinkron data pengguna dengan akun (spec akun pengguna "Penggabungan", "Sinkron", "Keluar").
// Saat dibuka: tanpa sesi → tidak ada apa-apa. Akun pertama kali masuk di perangkat ini → gabung data lokal dengan
// server sekali. Sesudahnya → kirim antrean; bila kosong, data lokal diganti data server (semua perubahan lokal sudah
// lewat antrean, jadi tidak ada yang hilang, dan hapus di perangkat lain tidak hidup lagi).
// Semua kegagalan jaringan hanya dicatat: web tetap jalan dari data lokal.

import type { RepositoriAkun, RepositoriPengguna, Sesi } from '@waris/data';
import { gantiSemuaProgres, semuaProgres } from '../progres';
import { kumpulPreferensi, terapkanPreferensi } from '../preferensi';
import { gantiSemuaTersimpan, semuaTersimpan } from '../tersimpan';
import { hapusSemuaMentah } from '../penyimpanan';
import { akunLokal, antre, aturAkunLokal, aturPengirim, bacaAntrean, kirimAntrean } from './antrean';
import { gabung, type DataPengguna } from './gabung';

export interface RepoAkun { akun: RepositoriAkun; pengguna: RepositoriPengguna }
const AWALAN_DATA = 'arif-waris:';
const BATAS_KIRIM_KELUAR_MS = 3000;

export async function mulaiSinkron(repo: RepoAkun, saatDataBerubah: () => void): Promise<Sesi | null> {
  try {
    const sesi = await repo.akun.sesi();
    if (!sesi) return null;
    const pemilikLokal = akunLokal();
    if (pemilikLokal !== sesi.userId) {
      if (pemilikLokal) bersihkanPerangkat();
      const { hasil, kirim } = gabung(dataLokal(), await dataServer(repo.pengguna));
      tulisLokal(hasil);
      aturAkunLokal(sesi.userId);
      kirim.forEach(antre);
    }
    pasangPengirim(repo.pengguna);
    if (await kirimAntrean(repo.pengguna) === 0) {
      const server = await dataServer(repo.pengguna);
      // Perubahan lokal baru bisa masuk antrean selagi dataServer menunggu jaringan; jangan timpa bila begitu.
      if (bacaAntrean().length === 0) tulisLokal(server);
    }
    saatDataBerubah();
    return sesi;
  } catch (galat) {
    console.warn('sinkron akun gagal, memakai data perangkat:', galat);
    return null;
  }
}

export async function kirimSebelumKeluar(repo: RepoAkun, batasMs = BATAS_KIRIM_KELUAR_MS): Promise<number> {
  const batas = new Promise<number>(selesai => setTimeout(() => selesai(-1), batasMs));
  const sisa = await Promise.race([kirimAntrean(repo.pengguna), batas]);
  return sisa === -1 ? Math.max(1, bacaAntrean().length) : sisa;
}

export async function keluarDanBersihkan(repo: RepoAkun): Promise<void> {
  aturPengirim(null);
  try {
    await repo.akun.keluar();
  } finally {
    bersihkanPerangkat();
  }
}

let pendengarOnline: (() => void) | null = null;

function pasangPengirim(pengguna: RepositoriPengguna): void {
  let sedangKirim = false;
  const kirim = () => {
    if (sedangKirim) return;
    sedangKirim = true;
    void kirimAntrean(pengguna).finally(() => { sedangKirim = false; });
  };
  aturPengirim(kirim);
  if (pendengarOnline) window.removeEventListener('online', pendengarOnline);
  pendengarOnline = kirim;
  window.addEventListener('online', kirim);
}

const dataLokal = (): DataPengguna => ({ tersimpan: semuaTersimpan(), ...semuaProgres(), preferensi: kumpulPreferensi() });

function tulisLokal(data: DataPengguna): void {
  gantiSemuaTersimpan(data.tersimpan);
  gantiSemuaProgres(data);
  if (data.preferensi) terapkanPreferensi(data.preferensi);
}

/** Waktu dari Postgres dinormalkan ke toISOString supaya bisa dibandingkan sebagai teks dengan waktu lokal. */
async function dataServer(pengguna: RepositoriPengguna): Promise<DataPengguna> {
  const iso = (waktu: string) => new Date(waktu).toISOString();
  const [tersimpan, belajar, latihan, preferensi] = await Promise.all([
    pengguna.bacaRiwayat(), pengguna.bacaProgresBelajar(), pengguna.bacaProgresLatihan(), pengguna.bacaPreferensi(),
  ]);
  return {
    tersimpan: tersimpan.map(baris => ({ ...baris, disimpanPada: iso(baris.disimpanPada) })),
    belajar: belajar.map(baris => ({ ...baris, diubahPada: iso(baris.diubahPada) })),
    latihan: latihan.map(baris => ({ ...baris, diubahPada: iso(baris.diubahPada) })),
    preferensi: preferensi && { ...preferensi, diubahPada: iso(preferensi.diubahPada) },
  };
}

const bersihkanPerangkat = (): void => hapusSemuaMentah(AWALAN_DATA);
