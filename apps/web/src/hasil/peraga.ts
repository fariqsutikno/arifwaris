// Peraga hitungan mode fokus: apa yang benar-benar dihitung pada satu ketukan, supaya panel bisa memperagakannya
// bagian demi bagian (bukan sekadar angka yang berjalan). Semua angka diambil dari engine (tabel, jejak
// PERBANDINGAN_NISAB, ringkasan); di sini hanya dipetakan ke baris penjelasan bab yang sedang dibahas.
//   bab penyebut: baris pertama = daftar penyebut, baris tengah = perbandingan nisab arba', baris terakhir = ashl × pecahan.
//   bab hasil akhir: saham/penyebut × harta = nominal per orang.

import type { IdOrang, LangkahJejak } from '@waris/engine';
import type { BabPenjelasan } from '@waris/explain';
import type { HasilOk } from '../jalankan';
import { urutkanBaris, type RingkasanHasil } from './ringkasan';

type LangkahNisab = Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }>;

export interface BarisKali { daftarId: IdOrang[]; nama: string; rumus: string; hasil: bigint }
export interface Hitungan { saham: bigint; penyebut: bigint; harta: bigint; nominal: bigint }

export type Peraga =
  | { jenis: 'penyebut'; daftarPenyebut: bigint[] }
  | { jenis: 'nisab'; langkah: LangkahNisab }
  | { jenis: 'kali'; ashl: bigint; daftar: BarisKali[] }
  | { jenis: 'nominal'; hitungan: Hitungan; id: IdOrang };

/** Jarak antarbagian peraga yang muncul; sengaja pelan supaya tiap hitungan sempat dibaca. */
export const JEDA_BAGIAN = 1200;
/** Setelah bagian terakhir muncul, keadaan akhir ditahan sebelum animasi diulang. */
const DURASI_TAHAN = 3500;

export function peragaKetukan(bab: BabPenjelasan, ketukan: number | null, hasil: HasilOk | null, ringkasan: RingkasanHasil): Peraga | null {
  if (ketukan === null) return null;
  if (bab.kolom === 'nominal') return peragaNominal(bab, ketukan, ringkasan);
  if (bab.kolom !== 'ashl' || !hasil) return null;
  const { baris, totalKolom } = hasil.tabel;
  const ashl = totalKolom.ashl!;
  const daftarFardh = baris.filter(barisTabel => barisTabel.fardh);
  // Semua ashabah: dibagi per kepala, tidak ada penyebut yang disamakan.
  if (daftarFardh.length === 0) return null;
  const terakhir = bab.daftarBaris.length - 1;
  if (ketukan === terakhir) return { jenis: 'kali', ashl, daftar: barisKali(hasil, ringkasan, ashl) };
  if (ketukan === 0) return { jenis: 'penyebut', daftarPenyebut: [...new Set(daftarFardh.map(barisTabel => barisTabel.fardh!.d))] };
  const langkah = hasil.jejak.filter((isi): isi is LangkahNisab => isi.jenis === 'PERBANDINGAN_NISAB' && isi.tujuan === 'ashl')[ketukan - 1];
  return langkah ? { jenis: 'nisab', langkah } : null;
}

/** Berapa bagian yang muncul bergantian: menentukan lama satu putaran animasi. */
export function jumlahBagian(peraga: Peraga | null): number {
  switch (peraga?.jenis) {
    case 'penyebut': return peraga.daftarPenyebut.length + 1;
    case 'nisab': return 4;
    case 'kali': return peraga.daftar.length + 2;
    case 'nominal': return 4;
    default: return 2;
  }
}

export const durasiPutaran = (peraga: Peraga | null) => jumlahBagian(peraga) * JEDA_BAGIAN + DURASI_TAHAN;

/** Kapan angka tiap orang masuk ke selnya di tabel: tepat setelah hitungannya muncul di panel. */
export function tundaSelDari(peraga: Peraga | null): Map<IdOrang, number> | undefined {
  if (peraga?.jenis === 'kali') {
    return new Map(peraga.daftar.flatMap((baris, urutan) => baris.daftarId.map(id => [id, (urutan + 1) * JEDA_BAGIAN + JEDA_BAGIAN / 2] as const)));
  }
  if (peraga?.jenis === 'nominal') return new Map([[peraga.id, 3 * JEDA_BAGIAN]]);
  return undefined;
}

/** Tiap baris tabel: ashl × fardh (ditambah sisa bila ada), atau sisa setelah semua fardh diambil. */
function barisKali(hasil: HasilOk, ringkasan: RingkasanHasil, ashl: bigint): BarisKali[] {
  const nama = new Map(ringkasan.penerima.map(orang => [orang.id, orang.nama]));
  const porsiFardh = (fardh: { n: bigint; d: bigint }) => fardh.n * ashl / fardh.d;
  const jumlahFardh = hasil.tabel.baris.reduce((jumlah, barisTabel) => jumlah + (barisTabel.fardh ? porsiFardh(barisTabel.fardh) : 0n), 0n);
  return urutkanBaris(hasil.tabel.baris, ringkasan.statusOrang).map(barisTabel => {
    const daftarId = Object.keys(barisTabel.perOrang);
    const hasilSel = barisTabel.sel['ashl']!;
    const { fardh } = barisTabel;
    const rumus = !fardh ? `sisa: ${ashl} − ${jumlahFardh}`
      : barisTabel.ashabah && hasilSel > porsiFardh(fardh) ? `${ashl} × ${fardh.n}/${fardh.d} = ${porsiFardh(fardh)}, + sisa ${hasilSel - porsiFardh(fardh)}`
        : `${ashl} × ${fardh.n}/${fardh.d}`;
    return { daftarId, nama: daftarId.map(id => nama.get(id) ?? id).join(' & '), rumus, hasil: hasilSel };
  });
}

/** Baris hasil akhir per orang: saham/penyebut × harta = nominal, dari angka engine (tanpa hitung ulang). */
function peragaNominal(bab: BabPenjelasan, ketukan: number, ringkasan: RingkasanHasil): Peraga | null {
  const subjek = bab.daftarBaris[ketukan]?.subjek;
  if (subjek?.length !== 1) return null;
  const penerima = ringkasan.penerima.find(orang => orang.id === subjek[0]);
  if (!penerima || penerima.saham === 0n) return null;
  return { jenis: 'nominal', id: penerima.id, hitungan: { saham: penerima.saham, penyebut: ringkasan.penyebut, harta: ringkasan.tirkah.bersih, nominal: penerima.nominal } };
}
