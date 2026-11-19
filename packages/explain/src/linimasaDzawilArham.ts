// Linimasa mode "Langkah demi langkah" untuk dzawil arham (bab 14): harta → harta untuk kerabat jauh (tanzil, perantara, turun) → hasil.
// Bab pipeline fardh/ashl/tashih tidak berlaku (pembagi berasal dari tanzil), jadi tanpa tabel bertahap. Kalimat dari skripDzawilArham.ts
// dan skrip hasil; tidak ada hitungan fikih di sini.

import type { GrafKeluarga } from '@waris/engine';
import { babHarta, babHasil, type Bab } from './cerita.js';
import { buatKonteks, type HasilOk, type Konteks } from './context.js';
import { buatSebutArham } from './dzawilArham.js';
import type { IdTahap, Langkah, Linimasa, Tahap } from './linimasa.js';
import { LAMA, babHartaSkrip, babHasilSkrip, type HasilSkrip } from './skrip.js';
import { babDzawilArhamSkrip } from './skripDzawilArham.js';
import { papanDari, type BarisPenjelasan, type Kamus } from './segments.js';

export function susunLinimasaDzawilArham(hasil: HasilOk, graf: GrafKeluarga, opsi: { kamus: Kamus }): Linimasa {
  const dasar = buatKonteks(hasil, graf, { kamus: opsi.kamus, bahasa: 'id' });
  const sebut = buatSebutArham(dasar, graf, ids => dasar.sebutan.sebut(ids));
  const konteks: Konteks = { ...dasar, sebutan: { ...dasar.sebutan, sebut } };
  const pilih = (skrip: HasilSkrip, lama: () => Bab | undefined): Bab | undefined => (skrip === LAMA ? lama() : skrip);
  const daftar: Array<[IdTahap, Bab | undefined]> = [
    ['harta', pilih(babHartaSkrip(konteks), () => babHarta(konteks))],
    ['dzawilArham', babDzawilArhamSkrip(konteks, sebut)],
    ['hasil', pilih(babHasilSkrip(konteks), () => babHasil(konteks))],
  ];
  const tahap: Tahap[] = daftar.flatMap(([id, bab]) => (bab ? [{ id, judul: bab.judul, langkah: bab.daftarBaris.map(langkahDariBaris) }] : []));
  return { tahap, tabel: [] };
}

const langkahDariBaris = (baris: BarisPenjelasan): Langkah => ({
  bagian: baris.subjek?.length ? 'keluarga' : 'hitung', ...(baris.jenis ? { jenis: baris.jenis } : {}), ...(baris.hitungan ? { hitungan: baris.hitungan } : {}), narasi: baris, papan: papanDari(baris), refs: baris.refs,
});
