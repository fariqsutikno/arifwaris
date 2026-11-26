// packages/data/src/memori/bank.ts
// Bank soal di memori untuk tes. Kontrak sama dengan RPC cari_soal (filter, batas, determinisme terhadap benih);
// urutan acaknya TIDAK sama dengan SQL (md5 di SQL, FNV-1a di sini), jadi jangan membandingkan kode antar implementasi.
import { periksaCariSoal, type BarisBankSoal, type CariSoal, type RepositoriBankSoal } from '../bank.js';

const BASIS_FNV = 0x811c9dc5;
const KALI_FNV = 0x01000193;
function hashFnv(teks: string): number {
  let nilai = BASIS_FNV;
  for (let urutan = 0; urutan < teks.length; urutan++) nilai = Math.imul(nilai ^ teks.charCodeAt(urutan), KALI_FNV);
  return nilai >>> 0;
}

export function buatMemoriBank(): RepositoriBankSoal {
  const tabel = new Map<string, BarisBankSoal>();
  const cocok = (baris: BarisBankSoal, { tingkat, modul, keluarga, label }: CariSoal) =>
    (tingkat === undefined || baris.tingkat === tingkat) && (keluarga === undefined || baris.keluarga === keluarga)
    && (modul === undefined || baris.modul.includes(modul))
    && (label?.semua ?? []).every(token => baris.label.includes(token))
    && (!label?.salahSatu?.length || label.salahSatu.some(token => baris.label.includes(token)))
    && !(label?.tanpa ?? []).some(token => baris.label.includes(token));
  return {
    async cariSoal(masukan) {
      periksaCariSoal(masukan);
      return [...tabel.values()].filter(baris => cocok(baris, masukan))
        .map(baris => ({ kode: baris.kode, urut: hashFnv(masukan.benih + '|' + baris.kode) }))
        .sort((a, b) => a.urut - b.urut || (a.kode < b.kode ? -1 : 1)).slice(0, masukan.jumlah).map(baris => baris.kode);
    },
    async simpan(baris) { for (const isi of baris) tabel.set(isi.kode, { ...isi }); },
  };
}
