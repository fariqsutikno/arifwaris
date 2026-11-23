// Catatan "kalau menurut KHI" (hukum positif, bukan fikih): bahan catatan dari KB (packages/content) → bagian-bagian siap tampil.
// Kerangka kalimat (judul bagian, label tingkat, jalan keluar, penutup) lewat diksi narasi.khi.*; isi butir (bunyi pasal,
// praktik PA, fikih per madzhab) sudah teks dari KB dan dikutip apa adanya. Tanpa angka hasil, tanpa kode teknis.
import { teksKamus, type Kamus, type Penyusun } from './segments.js';

export type MadzhabKhi = 'syafii' | 'hanbali' | 'hanafi' | 'maliki';

/** Bentuk minimal CatatanKhi dari @waris/content (explain tidak bergantung pada content saat berjalan). */
export interface BahanCatatanKhi {
  id: string;
  judul: string;
  pasal: string;
  tingkat: 'beda' | 'sama' | 'celah';
  bunyiKhi: readonly string[];
  praktikPa: readonly { teks: string; peran: 'pegangan' | 'catatan' }[];
  fikih: { syafii: readonly string[]; hanbali?: readonly string[]; hanafi?: readonly string[]; maliki?: readonly string[] };
  belumTersedia: readonly string[];
  jalanKeluar: readonly string[];
  peringatan?: string;
}

export interface BagianCatatanKhi {
  jenis: 'bunyi' | 'praktik' | 'fikih' | 'belum' | 'jalan' | 'peringatan';
  judul: string;
  butir: string[];
}

export interface PenjelasanCatatanKhi {
  id: string;
  judul: string;
  pasalLabel: string;
  tingkatLabel: string;
  /** "Hukum positif, bukan fikih": selalu tampil. */
  penanda: string;
  bagian: BagianCatatanKhi[];
  penutup: string;
}

export interface OpsiCatatanKhi { madzhab: MadzhabKhi; kamus: Kamus }

const PEMBANDING = 'syafii' as const;

export function jelaskanCatatanKhi(bahan: BahanCatatanKhi, opsi: OpsiCatatanKhi): PenjelasanCatatanKhi {
  const penyusun: Penyusun = { kamus: opsi.kamus, bahasa: 'id' };
  const teks = (kunci: string, sisipan: Record<string, string> = {}) => teksKamus(penyusun, `narasi.khi.${kunci}`, sisipan);
  const namaMadzhab = (madzhab: MadzhabKhi) => teksKamus(penyusun, `narasi.umum.madzhab.${madzhab}`);

  const bagian: BagianCatatanKhi[] = [{ jenis: 'bunyi', judul: teks('label.bunyi'), butir: [...bahan.bunyiKhi] }];
  if (bahan.praktikPa.length > 0) bagian.push({ jenis: 'praktik', judul: teks('label.praktik'), butir: butirPraktik(bahan, teks) });
  bagian.push(bagianFikih(bahan, opsi.madzhab, teks, namaMadzhab));
  if (bahan.belumTersedia.length > 0) bagian.push({ jenis: 'belum', judul: teks('label.belum'), butir: [...bahan.belumTersedia] });
  if (bahan.jalanKeluar.length > 0) {
    bagian.push({ jenis: 'jalan', judul: teks('label.jalan'), butir: bahan.jalanKeluar.map(jalan => teks(`jalan.${keSnake(jalan)}`)) });
  }
  if (bahan.peringatan !== undefined) bagian.push({ jenis: 'peringatan', judul: teks('label.peringatan'), butir: [bahan.peringatan] });

  return {
    id: bahan.id, judul: bahan.judul, pasalLabel: teks('label.pasal', { nomor: bahan.pasal }),
    tingkatLabel: teks(`tingkat.${bahan.tingkat}`), penanda: teks('label.hukum_positif'), bagian, penutup: teks('penutup'),
  };
}

/** Pegangan lebih dulu; catatan (tidak dijadikan acuan) diberi awalan. */
function butirPraktik(bahan: BahanCatatanKhi, teks: (kunci: string, sisipan?: Record<string, string>) => string): string[] {
  const pegangan = bahan.praktikPa.filter(butir => butir.peran === 'pegangan').map(butir => butir.teks);
  const catatan = bahan.praktikPa.filter(butir => butir.peran === 'catatan').map(butir => teks('label.catatan_awalan', { isi: butir.teks }));
  return [...pegangan, ...catatan];
}

/** Madzhab tanpa isi pada butir ini jatuh ke madzhab pembanding (Syafi'i) dengan keterangan di judul bagian. */
function bagianFikih(
  bahan: BahanCatatanKhi, madzhab: MadzhabKhi,
  teks: (kunci: string, sisipan?: Record<string, string>) => string, namaMadzhab: (madzhab: MadzhabKhi) => string,
): BagianCatatanKhi {
  const isi = bahan.fikih[madzhab];
  if (isi) return { jenis: 'fikih', judul: teks('label.fikih', { madzhab: namaMadzhab(madzhab) }), butir: [...isi] };
  return {
    jenis: 'fikih',
    judul: teks('label.fikih_cadangan', { madzhab: namaMadzhab(madzhab), pembanding: namaMadzhab(PEMBANDING) }),
    butir: [...bahan.fikih[PEMBANDING]],
  };
}

/** wasiatSukarela → wasiat_sukarela (kunci diksi hanya huruf kecil, angka, garis bawah). */
const keSnake = (nama: string): string => nama.replace(/[A-Z]/g, huruf => `_${huruf.toLowerCase()}`);
