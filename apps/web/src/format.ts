// Format tampilan: uang, pecahan, nama orang. Tidak ada hitungan waris di sini.

import { fpb } from '@waris/math';
import type { GrafKeluarga, IdOrang, StatusOrang, TabelMasalah } from '@waris/engine';
import { jenisDari } from './checklist';

const ANGKA_INDONESIA = new Intl.NumberFormat('id-ID');
const URUTAN_PENYEBUT = ['ashl', 'aul', 'radd', 'tashih'] as const;

export const formatRupiah = (nilai: bigint): string => `Rp ${ANGKA_INDONESIA.format(nilai)}`;

/** Isian uang dari pengguna: digit dan titik ribuan saja. Kosong = 0. */
export function bacaInputUang(teks: string): bigint | null {
  const bersih = teks.replace(/\./g, '').trim();
  if (bersih === '') return 0n;
  return /^\d+$/.test(bersih) ? BigInt(bersih) : null;
}

/** Selalu disederhanakan (2/6 → 1/3) untuk tampilan. */
export function teksPecahan({ n, d }: { n: bigint; d: bigint }): string {
  const faktor = n === 0n ? d : fpb(n, d);
  return `${n / faktor}/${d / faktor}`;
}

/** Penyebut kolom terakhir tabel (tashih bila ada, lalu radd/'aul/ashl). */
export function penyebutAkhir(tabel: TabelMasalah): bigint {
  for (const kolom of [...URUTAN_PENYEBUT].reverse()) {
    const nilai = tabel.totalKolom[kolom];
    if (nilai !== undefined) return nilai;
  }
  throw new Error('tabel tanpa penyebut');
}

/** Nama tampil: nama isian bila ada, kalau tidak label peran + urutan ("Anak laki-laki 2"). */
export function namaOrang(graf: GrafKeluarga, statusOrang: Record<IdOrang, StatusOrang>, idOrang: IdOrang): string {
  const nama = graf.orang[idOrang]?.nama;
  if (nama) return nama;
  const label = labelDari(statusOrang[idOrang]);
  const sePeran = Object.keys(statusOrang).filter(id => labelDari(statusOrang[id]) === label && !graf.orang[id]?.penghubung);
  return sePeran.length > 1 ? `${label} ${sePeran.indexOf(idOrang) + 1}` : label;
}

function labelDari(status: StatusOrang | undefined): string {
  if (!status || !('peran' in status)) return 'Kerabat';
  const kunci = status.peran.kunci;
  return kunci === 'DZAWIL_ARHAM' || kunci === 'BUKAN_AHLI_WARIS' ? 'Kerabat' : jenisDari(kunci)?.label ?? 'Kerabat';
}
