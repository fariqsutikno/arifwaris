// Konteks yang dibawa ke tiap bab penjelasan: hasil engine, cara menyebut orang,
// dan akses cepat ke langkah jejak per jenis.

import type { HasilEngine, GrafKeluarga, IdOrang, LangkahJejak } from '@waris/engine';
import { buatSebutan, type Sebutan } from './people.js';
import { gabungDan, type Potongan } from './segments.js';

export type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
export type Langkah<K extends LangkahJejak['jenis']> = Extract<LangkahJejak, { jenis: K }>;

export interface Konteks {
  hasil: HasilOk;
  sebutan: Sebutan;
  daftarLangkah<K extends LangkahJejak['jenis']>(jenis: K): Array<Langkah<K>>;
  anggotaDari(kelompok: string): IdOrang[];
  /** Penyebut akhir: tashih, lalu radd/'aul, lalu ashl. */
  penyebutAkhir: bigint;
  tampilkanNominal: boolean;
}

export function buatKonteks(hasil: HasilOk, graf: GrafKeluarga): Konteks {
  const { totalKolom } = hasil.tabel;
  return {
    hasil,
    sebutan: buatSebutan(hasil, graf),
    daftarLangkah: <K extends LangkahJejak['jenis']>(jenis: K) => hasil.jejak.filter((langkahIni): langkahIni is Langkah<K> => langkahIni.jenis === jenis),
    anggotaDari: kelompok => hasil.tabel.baris.find(r => r.kelompok === kelompok)?.anggota ?? [],
    penyebutAkhir: totalKolom.tashih ?? totalKolom.radd ?? totalKolom.aul ?? totalKolom.ashl!,
    tampilkanNominal: hasil.jejak.some(langkahIni => langkahIni.jenis === 'TIRKAH' && langkahIni.kotor > 0n),
  };
}

/** Sebut beberapa orang, dikelompokkan per peran ("kedua anak perempuan dan ibu"). */
export function sebutSemua(konteks: Konteks, ids: IdOrang[]): Potongan[] {
  const perPeran = new Map<string, IdOrang[]>();
  for (const id of ids) {
    const kunci = konteks.sebutan.peranDari(id)?.kunci ?? id;
    perPeran.set(kunci, [...(perPeran.get(kunci) ?? []), id]);
  }
  return gabungDan([...perPeran.values()].map(anggota => [konteks.sebutan.sebut(anggota)]));
}

export const sebutKelompok = (konteks: Konteks, idKelompok: string): Potongan[] => sebutSemua(konteks, konteks.anggotaDari(idKelompok));
