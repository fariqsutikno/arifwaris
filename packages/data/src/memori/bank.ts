// packages/data/src/memori/bank.ts
// Bank soal di memori untuk tes. Kontrak sama dengan RPC cari_soal (filter, batas, determinisme terhadap benih);
// urutan acaknya TIDAK sama dengan SQL (md5 di SQL, FNV-1a di sini), jadi jangan membandingkan kode antar implementasi.
import { periksaCariSoal, periksaContohSoal, type BarisBankSoal, type CariSoal, type RepositoriAturanPengecoh, type RepositoriBankSoal } from '../bank.js';

const BASIS_FNV = 0x811c9dc5;
const KALI_FNV = 0x01000193;
function hashFnv(teks: string): number {
  let nilai = BASIS_FNV;
  for (let urutan = 0; urutan < teks.length; urutan++) nilai = Math.imul(nilai ^ teks.charCodeAt(urutan), KALI_FNV);
  return nilai >>> 0;
}

export function buatMemoriBank(): RepositoriBankSoal & RepositoriAturanPengecoh {
  const tabel = new Map<string, BarisBankSoal>();
  const disetujui = new Set<string>();
  const urutAcak = (daftar: BarisBankSoal[], benih: string, jumlah: number) => daftar
    .map(baris => ({ kode: baris.kode, urut: hashFnv(benih + '|' + baris.kode) }))
    .sort((a, b) => a.urut - b.urut || (a.kode < b.kode ? -1 : 1)).slice(0, jumlah).map(baris => baris.kode);
  const cocok = (baris: BarisBankSoal, { tingkat, modul, keluarga, label, bentuk = 'hitung' }: CariSoal) =>
    (baris.bentuk ?? 'hitung') === bentuk && (bentuk === 'hitung' || (baris.aturan ?? []).every(isi => disetujui.has(isi)))
    && (tingkat === undefined || baris.tingkat === tingkat) && (keluarga === undefined || baris.keluarga === keluarga)
    && (modul === undefined || baris.modul.includes(modul))
    && (label?.semua ?? []).every(token => baris.label.includes(token))
    && (!label?.salahSatu?.length || label.salahSatu.some(token => baris.label.includes(token)))
    && !(label?.tanpa ?? []).some(token => baris.label.includes(token));
  return {
    async cariSoal(masukan) {
      periksaCariSoal(masukan);
      return urutAcak([...tabel.values()].filter(baris => cocok(baris, masukan)), masukan.benih, masukan.jumlah);
    },
    async daftarDisetujui() { return [...disetujui].sort(); },
    async setujui(aturan) { disetujui.add(aturan); },
    async cabut(aturan) { disetujui.delete(aturan); },
    async contohSoal(aturan, jumlah, benih) {
      periksaContohSoal(aturan, jumlah, benih);
      return urutAcak([...tabel.values()].filter(baris => baris.bentuk === 'kuis' && (baris.aturan ?? []).includes(aturan)), benih, jumlah);
    },
    async simpan(baris) { for (const isi of baris) tabel.set(isi.kode, { ...isi }); },
  };
}
