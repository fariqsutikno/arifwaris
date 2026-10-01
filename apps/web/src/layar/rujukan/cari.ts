// Pencarian dan penyaringan layar Rujukan: fungsi murni atas konten KB. Menerima kata cari atau daftar dalil,
// menyerahkan hasil yang siap dirender oleh Awal, Kategori, dan DetailDalil.

import { DAFTAR_AYAT, DAFTAR_KITAB, RUJUKAN, cariRujukan, type EntriRujukan } from '@waris/content';
import { daftarSyahid } from '../../konten/sumber';
import { namaSurah } from '../../konten/judulBab';
import { tautanRujukan } from '../../rute';

export interface HasilCari { judul: string; keterangan: string; tautan: string }

const HURUF_MINIMAL = 2;
const TAUTAN_KITAB = tautanRujukan('kitab');
const TAUTAN_QURAN = tautanRujukan('quran');

const baku = (teks: string) => teks.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function cariRujukanTeks(kata: string): HasilCari[] {
  const kunci = baku(kata);
  if (kunci.length < HURUF_MINIMAL) return [];
  const dalil = RUJUKAN.filter(isi => baku(`${isi.klaim} ${isi.sumber}`).includes(kunci))
    .map(isi => ({ judul: isi.klaim, keterangan: isi.sumber, tautan: tautanRujukan(isi.kode) }));
  const ayat = DAFTAR_AYAT.filter(isi => baku(`${namaSurah(isi.surah)} ${isi.ayat}`).includes(kunci))
    .map(isi => ({ judul: `${namaSurah(isi.surah)} : ${isi.ayat}`, keterangan: isi.teks, tautan: TAUTAN_QURAN }));
  const kitab = DAFTAR_KITAB.filter(isi => baku(`${isi.judul} ${isi.penulis}`).includes(kunci))
    .map(isi => ({ judul: isi.judul, keterangan: isi.penulis, tautan: TAUTAN_KITAB }));
  return [...dalil, ...ayat, ...kitab];
}

export const saringBab = (daftar: EntriRujukan[], bab?: number): EntriRujukan[] =>
  (bab === undefined ? daftar : daftar.filter(isi => isi.bab === bab));

export const daftarBabDi = (daftar: EntriRujukan[]): number[] => [...new Set(daftar.map(isi => isi.bab))].sort((a, b) => a - b);

/** Tempat dalil dipakai: babnya dan hukum syahid ayat yang bersandar padanya. */
export function penggunaanDalil(kode: string): { bab: number | undefined; hukum: string[] } {
  return { bab: cariRujukan(kode)?.bab, hukum: daftarSyahid().filter(isi => isi.rujukan === kode).map(isi => isi.hukum) };
}
