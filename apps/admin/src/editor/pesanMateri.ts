// Menerjemahkan temuan pemeriksa materi (pesan teknis dari @waris/content dan @waris/latihan) jadi bahasa biasa untuk
// portal: tanpa kode rujukan, nama kunci ahli waris mentah, atau nama berkas. Satu tempat untuk semua pemetaan; pesan
// yang belum dikenal dibersihkan seperlunya (nama blok → nama biasa, kunci → label, kode → "sumber dalil").
import type { Temuan } from '@waris/content';
import { labelKunci } from './kasus';

/** Nama blok seperti yang dikenal penulis, kunci = nama di pagar ```nama. */
export const NAMA_BLOK: Record<string, string> = {
  alur: 'alur', 'cara-berpikir': 'cara berpikir', kasus: 'studi kasus', 'kasus-berkas': 'studi kasus dari berkas', peraga: 'peraga',
  bandingan: 'bandingan', simulasi: 'simulasi', peta: 'peta bab', ingat: 'cara mengingat', dasar: 'sumber', tebak: 'tebak',
  lipat: 'bagian lipat', matriks: 'matriks', video: 'video', soal: 'soal',
};

const DAFTAR_BLOK = Object.keys(NAMA_BLOK).join('|');
const POLA_KUNCI = /\b(?:[A-Z]+(?:_[A-Z]+)+|ISTRI|SUAMI|AYAH|IBU|KAKEK|MUTIQ|MUTIQAH)\b/g;
const POLA_KODE_RUJUKAN = /\[?\bR\d{2}-\d+\b\]?/g;

const TABEL: [RegExp, (cocok: RegExpMatchArray) => string][] = [
  [/^harapan tidak sama dengan engine\. Engine: "(.*)"$/s, c => `Angka contoh tidak sama dengan hasil hitung. Hasil hitung: ${hasilHitung(c[1]!)}.`],
  [/^kasus tidak bisa dihitung: (.*)$/s, c => `Contoh kasus tidak bisa dihitung (${bersihkan(c[1]!)}).`],
  [/^keterangan (\S+) untuk ahli waris yang tidak ada di kasus$/, c => `Keterangan untuk ${labelKunci(c[1]!).toLowerCase()}, padahal ahli waris itu tidak ada di studi kasus.`],
  [/^peraga "(.*)" tidak bisa dihitung: (.*)$/s, c => `Susunan ahli waris pada keadaan "${c[1]}" tidak bisa dihitung (${bersihkan(c[2]!)}).`],
  [/^peraga "(.*)" bertampil aul, .*$/, c => `Keadaan "${c[1]}" dipasang sebagai contoh 'aul, tetapi hasil hitung tidak 'aul.`],
  [/^simulasi: pilihan (\S+) tidak sah.*$/, c => `Pilihan ${labelKunci(c[1]!).toLowerCase()} di simulasi tidak dikenal.`],
  [/^simulasi: susunan awal tidak bisa dihitung \((.*)\)$/s, c => `Susunan awal simulasi tidak bisa dihitung (${bersihkan(c[1]!)}).`],
  [/^kode rujukan \[\S+\] tidak boleh di teks.*$/, () => 'Sumber dalil tidak boleh ditulis di tengah paragraf; taruh di bagian sumber.'],
  [/^kode rujukan (\S+) tidak ada di tabel .*$/, () => 'Sumber dalil tidak dikenali.'],
  [/^rujukan "(.*)" bukan kode .*$/, () => 'Sumber dalil tidak dikenali.'],
  [/^istilah \[\[(.+)\]\] tidak ada di glosarium.*$/, c => `Istilah "${c[1]}" belum ada di glosarium. Tulis dengan huruf miring, atau tambahkan dulu ke glosarium.`],
  [/^bagian #(\S+) tidak ada di pelajaran ini$/, c => `Tautan ke bagian ${c[1]} tidak menuju bagian yang ada di pelajaran ini.`],
  [/^bagian #(\S+) tidak ada di pelajaran (\S+)$/, c => `Tautan ke bagian ${c[1]} di pelajaran lain tidak menuju bagian yang ada.`],
  [/^peta menunjuk bagian #(\S+) yang tidak ada$/, c => `Peta bab menunjuk bagian ${c[1]} yang tidak ada.`],
  [/^pelajaran "(.*)" tidak ada di kerangka kurikulum$/, c => `Tautan ke pelajaran "${c[1]}" tidak menuju pelajaran yang dikenal.`],
  [/^blok alur wajib menjadi blok pertama$/, () => 'Pelajaran harus dibuka dengan bagian alur.'],
  [/^blok alur hanya boleh sekali$/, () => 'Bagian alur cukup satu, di awal pelajaran.'],
  [/^dua bagian terakhir harus .*$/, () => 'Dua bagian terakhir harus bernama "Cek pemahaman" lalu "Ringkasnya".'],
  [/^blok "(.*)" tidak dikenal$/, c => `Jenis blok "${c[1]}" tidak dikenal. Buka "Sintaks blok" untuk daftar yang tersedia.`],
  [/^blok (\S+) tidak ditutup .*$/, c => `Bagian ${namaBlok(c[1]!)} tidak ditutup dengan tiga tanda kutip terbalik.`],
  [/^pagar blok harus .*$/, () => 'Baris pembuka blok hanya boleh berisi tiga tanda kutip terbalik dan nama blok.'],
  [/^tautan web tidak boleh dipakai.*$/, () => 'Tautan web tidak boleh dipakai (kecuali di bagian video).'],
  [/^tanda pisah panjang .*$/, () => 'Tanda pisah panjang tidak dipakai; ganti dengan koma atau pecah kalimatnya.'],
  [/^durasi (\d+) menit jauh dari perkiraan (\d+) menit.*$/, c => `Durasi ${c[1]} menit jauh dari perkiraan ${c[2]} menit menurut panjang teks.`],
];

export function terjemahkanPesan(pesan: string): string {
  for (const [pola, ganti] of TABEL) {
    const cocok = pesan.match(pola);
    if (cocok) return ganti(cocok);
  }
  return bersihkan(pesan);
}

export const terjemahkanTemuan = (temuan: Temuan): Temuan => ({ ...temuan, pesan: terjemahkanPesan(temuan.pesan) });

const namaBlok = (kunci: string) => NAMA_BLOK[kunci] ?? kunci;

/** Pesan di luar tabel: nama blok jadi nama biasa, kunci ahli waris jadi label, kode rujukan jadi "sumber dalil". */
function bersihkan(pesan: string): string {
  const polos = pesan
    .replace(new RegExp(`\\bblok (${DAFTAR_BLOK})\\b`, 'g'), (_, kunci: string) => `bagian ${namaBlok(kunci)}`)
    .replace(POLA_KODE_RUJUKAN, 'sumber dalil')
    .replace(POLA_KUNCI, kunci => labelKunci(kunci).toLowerCase());
  return polos.charAt(0).toUpperCase() + polos.slice(1);
}

/** "ISTRI 3, IBU 4; ashl 24" → "istri 3, ibu 4; penyebut akhir 24". */
const hasilHitung = (teks: string) => bersihkan(teks).replace(/; ashl (\d+)/, '; penyebut akhir $1').replace(/^./, huruf => huruf.toLowerCase());
