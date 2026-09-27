// Diff baris (murni) untuk antrean review: teksBanding mengubah isi revisi jadi teks yang enak dibandingkan
// (materi: meta JSON + '---' + Markdown blok; jenis lain JSON indentasi 2), lalu diffBaris membandingkan dua teks
// per baris lewat LCS (tabel panjang, jalan balik). Hasilnya dirender AntreanReview sebagai baris sama/tambah/hapus.
import { bacaIsi, keJson, tulisBlok, type JenisKonten } from '@waris/content';

export type BarisDiff = { jenis: 'sama' | 'tambah' | 'hapus'; teks: string };

export function diffBaris(lama: string, baru: string): BarisDiff[] {
  const a = lama === '' ? [] : lama.split('\n');
  const b = baru === '' ? [] : baru.split('\n');
  // panjang[i][j] = panjang LCS a[i..] dan b[j..]
  const panjang = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      panjang[i]![j] = a[i] === b[j] ? panjang[i + 1]![j + 1]! + 1 : Math.max(panjang[i + 1]![j]!, panjang[i]![j + 1]!);
    }
  }
  const hasil: BarisDiff[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { hasil.push({ jenis: 'sama', teks: a[i]! }); i++; j++; }
    else if (panjang[i + 1]![j]! >= panjang[i]![j + 1]!) hasil.push({ jenis: 'hapus', teks: a[i++]! });
    else hasil.push({ jenis: 'tambah', teks: b[j++]! });
  }
  while (i < a.length) hasil.push({ jenis: 'hapus', teks: a[i++]! });
  while (j < b.length) hasil.push({ jenis: 'tambah', teks: b[j++]! });
  return hasil;
}

export function teksBanding(jenis: JenisKonten, isi: unknown): string {
  if (jenis === 'materi') {
    const hasil = bacaIsi('materi', isi);
    if (hasil.ok) {
      const { blok, ...meta } = keJson('materi', hasil.isi) as Record<string, unknown>;
      void blok;
      return `${JSON.stringify(meta, null, 2)}\n---\n${tulisBlok(hasil.isi.blok)}`;
    }
  }
  return JSON.stringify(isi, null, 2);
}

export type BagianDiff = { jenis: 'baris'; baris: BarisDiff } | { jenis: 'lipat'; baris: BarisDiff[] };
const KONTEKS_DIFF = 3;

/** Baris sama yang berjarak lebih dari `konteks` dari perubahan mana pun dilipat jadi satu bagian, supaya perubahan
 * kecil di materi panjang langsung terlihat. Lipatan satu baris tidak ada gunanya, jadi dibiarkan tampil. */
export function lipatDiff(daftar: BarisDiff[], konteks = KONTEKS_DIFF): BagianDiff[] {
  const dekatPerubahan = daftar.map((_, i) =>
    daftar.slice(Math.max(0, i - konteks), i + konteks + 1).some(baris => baris.jenis !== 'sama'));
  const hasil: BagianDiff[] = [];
  let lipatan: BarisDiff[] = [];
  const tutupLipatan = () => {
    if (lipatan.length === 1) hasil.push({ jenis: 'baris', baris: lipatan[0]! });
    else if (lipatan.length > 1) hasil.push({ jenis: 'lipat', baris: lipatan });
    lipatan = [];
  };
  daftar.forEach((baris, i) => {
    if (dekatPerubahan[i]) { tutupLipatan(); hasil.push({ jenis: 'baris', baris }); }
    else lipatan.push(baris);
  });
  tutupLipatan();
  return hasil;
}
