/// <reference path="./raw.d.ts" />
// Bank soal dari `docs/soal/`:
//   hitung.md → soal kasus (dibuka di kalkulator mode Belajar), tabel "Daftar Soal Hitung";
//   kuis.md   → pilihan ganda konsep dengan pembahasan, satu soal per judul `## K-nn`.
// Dikelompokkan per bab KB. Kunci soal hitung (`harapan`) hanya untuk test, dicocokkan dengan engine.
import hitungMd from '../../../docs/soal/hitung.md?raw';
import kuisMd from '../../../docs/soal/kuis.md?raw';
import { bacaDaftarAhliWaris, bacaHarapan, bacaPotongan, type ContohKasus, type Potongan } from './materi.js';
import { barisTabelBagian } from './refs.js';

export type Tingkat = 'dasar' | 'menengah' | 'sulit';
const DAFTAR_TINGKAT: Tingkat[] = ['dasar', 'menengah', 'sulit'];
/** Harta seragam untuk semua soal hitung; yang diuji pembagiannya, bukan nominalnya. */
const HARTA_SOAL = 120_000_000n;

export interface SoalHitung {
  kode: string;
  bab: number;
  tingkat: Tingkat;
  judul: string;
  kasus: ContohKasus;
  /** Konsep yang diuji; baru ditampilkan setelah soal dikerjakan. */
  topik: string;
  sumber: string;
}

export interface SoalKuis {
  kode: string;
  bab: number;
  pertanyaan: Potongan[];
  pilihan: Potongan[][];
  indeksBenar: number;
  pembahasan: Potongan[];
}

export function bacaSoalHitung(teksMarkdown: string): SoalHitung[] {
  return barisTabelBagian(teksMarkdown, 'Daftar Soal Hitung').map(([kode = '', bab = '', tingkat = '', judul = '', pewaris = '', ahliWaris = '', harapan = '', topik = '', sumber = '']) => {
    const galat = (pesan: string) => new Error(`soal ${kode}: ${pesan}`);
    if (!DAFTAR_TINGKAT.includes(tingkat as Tingkat)) throw galat(`tingkat "${tingkat}" bukan dasar/menengah/sulit`);
    if (pewaris !== 'L' && pewaris !== 'P') throw galat('pewaris harus L atau P');
    return {
      kode, bab: Number(bab), tingkat: tingkat as Tingkat, judul, topik, sumber,
      kasus: { pewaris, ahliWaris: bacaDaftarAhliWaris(ahliWaris, galat), harta: HARTA_SOAL, harapan: bacaHarapan(harapan, galat) },
    };
  });
}

export function bacaSoalKuis(teksMarkdown: string): SoalKuis[] {
  return teksMarkdown.split(/^## /m).slice(1).map(bagian => {
    const [kode = '', ...daftarBaris] = bagian.trim().split('\n');
    const galat = (pesan: string) => new Error(`kuis ${kode}: ${pesan}`);
    const isian = (kunci: string) => daftarBaris.find(baris => baris.startsWith(`${kunci}:`))?.slice(kunci.length + 1).trim();
    const pilihan = daftarBaris.filter(baris => /^- \[[ x]\] /.test(baris));
    const indeksBenar = pilihan.findIndex(baris => baris.startsWith('- [x]'));
    const [bab, pertanyaan, pembahasan] = [isian('bab'), isian('pertanyaan'), isian('pembahasan')];
    if (!bab || !pertanyaan || !pembahasan) throw galat('butuh bab, pertanyaan, dan pembahasan');
    if (pilihan.length < 2 || indeksBenar < 0 || pilihan.filter(baris => baris.startsWith('- [x]')).length !== 1) {
      throw galat('butuh minimal 2 pilihan dengan tepat satu [x]');
    }
    return {
      kode: kode.trim(), bab: Number(bab), pertanyaan: bacaPotongan(pertanyaan), indeksBenar,
      pilihan: pilihan.map(baris => bacaPotongan(baris.slice('- [ ] '.length))), pembahasan: bacaPotongan(pembahasan),
    };
  });
}

export const DAFTAR_SOAL_HITUNG: SoalHitung[] = bacaSoalHitung(hitungMd);
export const DAFTAR_SOAL_KUIS: SoalKuis[] = bacaSoalKuis(kuisMd);
export const cariSoalHitung = (kode: string): SoalHitung | undefined => DAFTAR_SOAL_HITUNG.find(soal => soal.kode === kode);
