// Bagian pemeriksa materi yang butuh engine: blok kasus (harapan = hasil engine), peraga ('aul hanya bila engine
// benar-benar 'aul), dan simulasi (kunci ahli waris sah). Sisi tanpa engine ada di periksaMateri (@waris/content).
import type { Blok, Temuan } from '@waris/content';
import { jalankan } from './jalankan.js';
import { kasusDariSoal } from './soal.js';

const HARTA_PERAGA = 120_000_000n;
const URUTAN_PENYEBUT = ['tashih', 'radd', 'aul', 'ashl'] as const;

export type HitungContoh =
  | { ok: true; saham: Record<string, bigint>; ashlAkhir: bigint; aul: boolean }
  | { ok: false; pesan: string };

/** Satu kasus satu mayit lewat engine → saham akhir per kunci (yang > 0) dan penyebut akhir. */
export function hitungContoh(pewaris: 'L' | 'P', ahliWaris: string[], harta: bigint = HARTA_PERAGA): HitungContoh {
  let tampil: ReturnType<typeof jalankan>;
  try {
    tampil = jalankan(kasusDariSoal({ pewaris, ahliWaris, harta, harapan: { saham: {}, ashlAkhir: 0n } }));
  } catch (galat) {
    return { ok: false, pesan: (galat as Error).message };
  }
  if (tampil.jenis !== 'biasa') return { ok: false, pesan: tampil.jenis === 'galat' ? tampil.pesan : `kasus ${tampil.jenis}, bukan satu mayit biasa` };
  if (tampil.hasil.status !== 'OK') return { ok: false, pesan: `engine: ${tampil.hasil.status}` };
  const { tabel, statusOrang } = tampil.hasil;
  const saham: Record<string, bigint> = {};
  for (const baris of tabel.baris) {
    for (const [id, bagian] of Object.entries(baris.perOrang)) {
      const status = statusOrang[id];
      const kunci = status && 'peran' in status ? status.peran.kunci : id;
      if (bagian.saham > 0n) saham[kunci] = (saham[kunci] ?? 0n) + bagian.saham;
    }
  }
  const kolomAkhir = URUTAN_PENYEBUT.find(kolom => tabel.totalKolom[kolom] !== undefined)!;
  return { ok: true, saham, ashlAkhir: tabel.totalKolom[kolomAkhir]!, aul: tabel.totalKolom.aul !== undefined };
}

export function periksaAngkaMateri(blok: Blok[], barisBlok: number[]): Temuan[] {
  const temuan: Temuan[] = [];
  const galat = (baris: number, pesan: string) => temuan.push({ tingkat: 'galat', baris, pesan });
  blok.forEach((isi, i) => {
    const baris = barisBlok[i]!;
    if (isi.jenis === 'kasus') periksaKasus(isi, baris, galat);
    else if (isi.jenis === 'peraga') periksaPeraga(isi, baris, galat);
    else if (isi.jenis === 'simulasi') periksaSimulasi(isi, baris, galat);
  });
  return temuan;
}

type Lapor = (baris: number, pesan: string) => void;

function periksaKasus(blok: Extract<Blok, { jenis: 'kasus' }>, baris: number, galat: Lapor) {
  const { pewaris, ahliWaris, harta, harapan } = blok.kasus;
  const hasil = hitungContoh(pewaris, ahliWaris, harta);
  if (!hasil.ok) { galat(baris, `kasus tidak bisa dihitung: ${hasil.pesan}`); return; }
  const tulis = (saham: Record<string, bigint>, ashl: bigint) =>
    `${Object.entries(saham).map(([kunci, nilai]) => `${kunci} ${nilai}`).join(', ')}; ashl ${ashl}`;
  const sama = hasil.ashlAkhir === harapan.ashlAkhir && Object.keys(hasil.saham).length === Object.keys(harapan.saham).length
    && Object.entries(hasil.saham).every(([kunci, nilai]) => harapan.saham[kunci] === nilai);
  if (!sama) galat(baris, `harapan tidak sama dengan engine. Engine: "${tulis(hasil.saham, hasil.ashlAkhir)}"`);
  for (const kunci of Object.keys(blok.keterangan ?? {})) {
    if (!ahliWaris.includes(kunci)) galat(baris, `keterangan ${kunci} untuk ahli waris yang tidak ada di kasus`);
  }
}

function periksaPeraga(blok: Extract<Blok, { jenis: 'peraga' }>, baris: number, galat: Lapor) {
  for (const keadaan of blok.keadaan) {
    const hasil = hitungContoh(keadaan.pewaris, keadaan.ahliWaris);
    if (!hasil.ok) galat(baris, `peraga "${keadaan.label}" tidak bisa dihitung: ${hasil.pesan}`);
    else if (blok.tampil === 'aul' && !hasil.aul) galat(baris, `peraga "${keadaan.label}" bertampil aul, tetapi engine tidak menghasilkan 'aul`);
  }
}

function periksaSimulasi(blok: Extract<Blok, { jenis: 'simulasi' }>, baris: number, galat: Lapor) {
  for (const kunci of blok.pilihan) {
    const hasil = hitungContoh(blok.pewaris, [kunci]);
    if (!hasil.ok) galat(baris, `simulasi: pilihan ${kunci} tidak sah (${hasil.pesan})`);
  }
  if (blok.awal.length) {
    const hasil = hitungContoh(blok.pewaris, blok.awal);
    if (!hasil.ok) galat(baris, `simulasi: susunan awal tidak bisa dihitung (${hasil.pesan})`);
  }
}
