// Bab jejak sisa hak (bab 11.3 [KH]): tahap ini menerima langkah SISA_HAK dan sebutan orang, memutuskan apa yang
// ditampilkan (ringkasan, satu baris per kelebihan, dan kas kurang bila ada), lalu menyerahkan satu bab penjelasan.
// Hanya dipakai bila kasus punya penerimaan di muka; caller yang memutuskan kapan bab ini ditampilkan.

import type { IdOrang, LangkahJejak } from '@waris/engine';
import { rupiah } from './format.js';
import type { Konteks } from './context.js';
import type { BabPenjelasan } from './narasi.js';
import { buatBaris, susun, teksKamus, type Penyusun, type Potongan } from './segments.js';

export type LangkahSisaHak = Extract<LangkahJejak, { jenis: 'SISA_HAK' }>;

const REFS_SISA_HAK = ['R11-5', 'KH'];

export function babSisaHak(langkah: LangkahSisaHak, sebut: (id: IdOrang) => Potongan, penyusun: Penyusun): BabPenjelasan {
  const daftarBaris = [
    buatBaris(susun(penyusun, 'narasi.sisa_hak.ringkasan', { sisa: rupiah(langkah.sisaKas) }), REFS_SISA_HAK),
    ...langkah.kelebihan.map(id => buatBaris(
      susun(penyusun, 'narasi.sisa_hak.kelebihan', {
        nama: sebut(id),
        diterima: rupiah(langkah.perOrang[id]!.sudahDiterima),
        bagian: rupiah(langkah.perOrang[id]!.nominal),
      }),
      REFS_SISA_HAK, [id])),
    ...(langkah.kasKurang ? [buatBaris(susun(penyusun, 'narasi.sisa_hak.kas_kurang'), REFS_SISA_HAK)] : []),
  ];
  return { judul: teksKamus(penyusun, 'narasi.sisa_hak.judul'), daftarBaris };
}

/** Bab untuk jelaskan()/linimasa: ada hanya bila jejak memuat SISA_HAK (caller menambahkannya hanya bila kasus punya sudahDiterima). */
export function babSisaHakDariKonteks(konteks: Konteks): BabPenjelasan | undefined {
  const [langkah] = konteks.daftarLangkah('SISA_HAK');
  return langkah && babSisaHak(langkah, id => konteks.sebutan.sebut([id]), konteks.penyusun);
}
