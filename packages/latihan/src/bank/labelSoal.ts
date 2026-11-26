// Label soal dari hasil engine (spec bank soal §4): token tetap yang dibaca dari jejak dan statusOrang (data,
// bukan teks), dipakai penyaring bank dan UI. Murni; tidak menebak dari pola susunan ahli waris.
//   `bernama:minbariyyah` belum ada: jejak engine tidak menandainya (hanya umariyyatain, musyarrakah,
//   akdariyyah, muaddah), jadi tidak dipancarkan sampai engine menambahkan penandanya.

import type { LangkahJejak } from '@waris/engine';
import type { HasilOk } from '../jalankan.js';

/** Bentuk token dan arti dalam bahasa biasa (untuk filter UI; token mentah tidak ditampilkan ke pengguna). */
export const ARTI_TOKEN_LABEL: ReadonlyArray<{ bentuk: string; arti: string }> = [
  { bentuk: 'aul', arti: 'Bagian-bagian melebihi harta, jadi semuanya dikecilkan bersama (\'aul)' },
  { bentuk: 'aul:<dari>><menjadi>', arti: 'Penyebut naik dari angka pertama ke angka kedua karena \'aul' },
  { bentuk: 'radd', arti: 'Harta bersisa dan dikembalikan ke ahli waris (radd)' },
  { bentuk: 'tashih', arti: 'Saham dikalikan supaya setiap orang mendapat bilangan bulat (tashih)' },
  { bentuk: 'inkisar:<n>', arti: 'Jumlah kelompok yang sahamnya tidak habis dibagi jumlah kepalanya (inkisar)' },
  { bentuk: 'hajb:<KUNCI>', arti: 'Ahli waris jenis ini gugur karena terhalang (hajb)' },
  { bentuk: 'bernama:umariyyatain', arti: 'Kasus al-\'Umariyyatain: ibu mendapat sepertiga sisa' },
  { bentuk: 'bernama:musyarrakah', arti: 'Kasus al-Musyarrakah: saudara kandung berbagi sepertiga dengan saudara seibu' },
  { bentuk: 'bernama:akdariyyah', arti: 'Kasus al-Akdariyyah: suami, ibu, kakek, dan saudari' },
  { bentuk: 'bernama:muaddah', arti: 'Kasus al-Mu\'addah: saudara sebapak ikut dihitung lalu tidak mendapat bagian' },
  { bentuk: 'kakekSaudara', arti: 'Kakek bersama saudara kandung atau sebapak' },
  { bentuk: 'ashabahBilGhair', arti: 'Ada ashabah bil ghair (perempuan jadi ashabah bersama laki-laki sederajat)' },
  { bentuk: 'ashabahMaalGhair', arti: 'Ada ashabah ma\'al ghair (saudari jadi ashabah bersama anak atau cucu perempuan)' },
  { bentuk: 'jumlahAhliWaris:<n>', arti: 'Banyaknya ahli waris dalam soal, termasuk yang gugur' },
];

/** Hasil engine satu mayit → token, terurut supaya dua kasus yang sama berlabel sama. */
export function labelSoal(hasil: HasilOk): string[] {
  const label = new Set<string>();
  let kelompokInkisar = 0;
  for (const langkah of hasil.jejak) {
    const baru = labelDariLangkah(langkah, hasil);
    baru.forEach(token => label.add(token));
    if (langkah.jenis === 'PERBANDINGAN_NISAB' && langkah.tujuan === 'inkisar' && langkah.hubungan !== 'habis') kelompokInkisar++;
  }
  if (kelompokInkisar > 0) label.add(`inkisar:${kelompokInkisar}`);
  const jumlahAhliWaris = Object.values(hasil.statusOrang).filter(status => status.jenis !== 'bukanAhliWaris').length;
  label.add(`jumlahAhliWaris:${jumlahAhliWaris}`);
  return [...label].sort();
}

function labelDariLangkah(langkah: LangkahJejak, hasil: HasilOk): string[] {
  switch (langkah.jenis) {
    case 'AUL': return ['aul', `aul:${langkah.dari}>${langkah.menjadi}`];
    case 'RADD': return ['radd'];
    case 'TASHIH': return ['tashih'];
    case 'HAJB_HIRMAN': {
      const status = hasil.statusOrang[langkah.mahjub];
      return status && 'peran' in status ? [`hajb:${status.peran.kunci}`] : [];
    }
    // Mu'addah dan akdariyyah hanya terjadi pada kakek bersama saudara.
    case 'KASUS_KHUSUS': return [`bernama:${langkah.nama}`, ...(langkah.nama === 'muaddah' || langkah.nama === 'akdariyyah' ? ['kakekSaudara'] : [])];
    case 'FARDH': return langkah.alasan.kode === 'JADD_SISA_SEDIKIT' || langkah.alasan.kode === 'JADD_WAL_IKHWAH' ? ['kakekSaudara'] : [];
    case 'ASHABAH': return [
      ...(langkah.pilihanJadd ? ['kakekSaudara'] : []),
      ...(langkah.jenisAshabah === 'bilGhair' ? ['ashabahBilGhair'] : langkah.jenisAshabah === 'maalGhair' ? ['ashabahMaalGhair'] : []),
    ];
    default: return [];
  }
}
