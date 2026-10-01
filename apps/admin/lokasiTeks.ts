/// <reference types="node" />
// Lokasi teks aplikasi ("Tampil di: Beranda · Hasil hitung"), dihitung saat build dari kode web: tiap panggilan
// t('kunci') / teksEdukasi('kunci') dicatat bersama nama layar berkasnya. Disajikan ke portal sebagai modul virtual
// `virtual:lokasi-teks` (plugin Vite di bawah), jadi selalu mengikuti kode web tanpa berkas hasil yang bisa basi.
// Kunci yang dibentuk dinamis (t(`hitung.${x}`)) tidak terdeteksi; portal menulisnya "belum diketahui".
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

// Awalan jalur berkas (relatif apps/web/src) → nama layar untuk manusia; yang lebih spesifik ditulis lebih dulu.
const LAYAR_BERKAS: readonly [string, string][] = [
  ['layar/Beranda', 'Beranda'], ['layar/AwalHitung', 'Kalkulator'], ['layar/wizard/LangkahPewaris', 'Kalkulator · Pewaris'],
  ['layar/LangkahAhliWaris', 'Kalkulator · Ahli waris'], ['layar/LangkahKondisi', 'Kalkulator · Ahli waris'],
  ['layar/wizard/LangkahHarta', 'Kalkulator · Harta'], ['layar/wizard/LangkahKewajiban', 'Kalkulator · Harta'],
  ['layar/wizard', 'Kalkulator'], ['layar/Wizard', 'Kalkulator'], ['checklist', 'Kalkulator · Ahli waris'],
  ['layar/Hasil', 'Hasil hitung'], ['hasil/', 'Hasil hitung'], ['layar/Penjelasan', 'Hasil hitung'],
  ['layar/Riwayat', 'Riwayat hitung'], ['riwayat', 'Riwayat hitung'], ['layar/Peringkat', 'Peringkat'],
  ['layar/belajar/Belajar', 'Belajar'], ['layar/belajar/Materi', 'Materi'], ['layar/belajar/Latihan', 'Latihan'],
  ['layar/belajar/KuisKonsep', 'Latihan'], ['layar/belajar/KartuSoalKuis', 'Latihan'], ['layar/belajar/Faq', 'FAQ'],
  ['layar/belajar/TanyaJawab', 'Tanya jawab'], ['layar/belajar/Glosarium', 'Glosarium'], ['layar/rujukan/', 'Rujukan'],
  ['layar/belajar/ChipDalil', 'Materi'], ['konten/tur', 'Tur pengenalan'], ['tur/', 'Tur pengenalan'],
  ['akun/', 'Akun'], ['layar/Kepala', 'Kepala halaman'], ['ui/', 'Umum'], ['Aplikasi', 'Umum'],
  ['konten/ahliWaris', 'Kalkulator · Ahli waris'], ['konten/ahwal', 'Hasil hitung'], ['konten/harta', 'Kalkulator · Harta'],
  ['konten/wizard', 'Kalkulator'], ['kasus', 'Kalkulator'], ['layar/KonfirmasiKasusBaru', 'Kalkulator'],
  ['konten/judulBab', 'Belajar'], ['konten/umum', 'Umum'],
];
const PANGGILAN_TEKS = /\b(?:t|teksEdukasi)\(\s*['"]([\w.]+)['"]/g;

export function layarBerkas(jalur: string): string {
  return LAYAR_BERKAS.find(([awalan]) => jalur.startsWith(awalan))?.[1] ?? 'Lainnya';
}

/** Kunci → daftar layar tempat kunci itu dipanggil (urut, tanpa duplikat). */
export function pindaiLokasi(berkas: readonly { jalur: string; isi: string }[]): Record<string, string[]> {
  const lokasi: Record<string, Set<string>> = {};
  for (const { jalur, isi } of berkas) {
    for (const [, kunci] of isi.matchAll(PANGGILAN_TEKS)) (lokasi[kunci!] ??= new Set()).add(layarBerkas(jalur));
  }
  return Object.fromEntries(Object.entries(lokasi).map(([kunci, layar]) => [kunci, [...layar].sort()]));
}

function bacaBerkasWeb(akar: string): { jalur: string; isi: string }[] {
  return readdirSync(akar, { recursive: true, encoding: 'utf8' })
    .filter(jalur => /\.tsx?$/.test(jalur) && !jalur.includes('__tests__'))
    .map(jalur => ({ jalur: relative(akar, join(akar, jalur)).replaceAll('\\', '/'), isi: readFileSync(join(akar, jalur), 'utf8') }));
}

export function pluginLokasiTeks(akarWeb: string): Plugin {
  const ID = 'virtual:lokasi-teks';
  return {
    name: 'lokasi-teks',
    resolveId: id => (id === ID ? `\0${ID}` : undefined),
    load: id => (id === `\0${ID}` ? `export default ${JSON.stringify(pindaiLokasi(bacaBerkasWeb(akarWeb)))};` : undefined),
  };
}
