// Sebutan hubungan satu orang terhadap pusat yang sedang dilihat ("ibu", "besan", "anak laki-laki dari sepupu").
// Menerima graf + id pusat + id orang; menyerahkan satu frasa dari diksi `narasi.hubungan.*`.
// Penyajian saja, bukan fikih: peran ahli waris tetap dari engine (`labelPeran`).
// Jalur terpendek lewat orang tua / anak / pasangan dicocokkan ke tabel nama hubungan; bila tak ada nama baku,
// nama terpanjang yang cocok dipakai lalu dibungkus langkah sisa ("anak laki-laki dari sepupu").

import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { teksKamus, type Penyusun } from './segments.js';

// Satu langkah = satu huruf: a ayah, i ibu, k anak laki-laki, p anak perempuan, s suami, r istri (menurut orang yang dituju).
type Langkah = 'a' | 'i' | 'k' | 'p' | 's' | 'r';
const URUTAN_LANGKAH: Langkah[] = ['a', 'i', 'k', 'p', 's', 'r']; // urutan coba tetap supaya hasilnya deterministik
const LANGKAH_KE_KUNCI: Record<Langkah, string> = { a: 'ayah', i: 'ibu', k: 'anak.lk', p: 'anak.pr', s: 'suami', r: 'istri' };

// Pola dicoba berurutan untuk jalur utuh; yang pertama cocok dipakai.
const NAMA_HUBUNGAN: Array<[RegExp, string]> = [
  [/^[ai][ai][ai]$/, 'buyut'], [/^aa$/, 'kakek.ayah'], [/^ai$/, 'nenek.ayah'], [/^ia$/, 'kakek.ibu'], [/^ii$/, 'nenek.ibu'],
  [/^[kp][kp][kp]$/, 'cicit'], [/^[kp][kp]$/, 'cucu'],
  [/^[ai]k$/, 'saudara.lk'], [/^[ai]p$/, 'saudara.pr'],
  [/^[ai][ai]k$/, 'paman'], [/^[ai][ai]p$/, 'bibi'], [/^[ai][kp][kp]$/, 'keponakan'], [/^[ai][ai][kp][kp]$/, 'sepupu'],
  [/^[sr][ai]$/, 'mertua'], [/^[kp][sr]$/, 'menantu'], [/^[kp][sr][ai]$/, 'besan'], [/^[kp][kp][sr]$/, 'cucu_menantu'],
  [/^[sr][ai][kp]$/, 'ipar'], [/^[ai][kp][sr]$/, 'ipar'],
  [/^[sr][kp]$/, 'anak_tiri'], [/^a[r]$/, 'ibu_tiri'], [/^[ai][sr][kp]$/, 'saudara_tiri'],
  [/^[sr]$/, 'pasangan_saja'],
];

/** Sebutan `idOrang` dari sisi `idPusat`; undefined bila keduanya tidak terhubung di graf. */
export function sebutanHubungan(penyusun: Penyusun, graf: GrafKeluarga, idPusat: IdOrang, idOrang: IdOrang): string | undefined {
  if (idPusat === idOrang) return teksKamus(penyusun, 'narasi.hubungan.diri');
  const jalur = cariJalur(graf, idPusat, idOrang);
  if (!jalur) return undefined;
  for (let panjang = jalur.length; panjang >= 1; panjang--) {
    const nama = namaUntuk(jalur.slice(0, panjang).join(''));
    if (!nama) continue;
    let sebutan = teksKamus(penyusun, `narasi.hubungan.${nama}`);
    for (const langkah of jalur.slice(panjang)) {
      sebutan = teksKamus(penyusun, 'narasi.hubungan.dari', { peran: teksKamus(penyusun, `narasi.hubungan.${LANGKAH_KE_KUNCI[langkah]}`), sebutan });
    }
    return sebutan;
  }
  return undefined;
}

function namaUntuk(jalur: string): string | undefined {
  if (jalur.length === 1) return LANGKAH_KE_KUNCI[jalur as Langkah];
  const cocok = NAMA_HUBUNGAN.find(([pola]) => pola.test(jalur))?.[1];
  return cocok === 'pasangan_saja' ? undefined : cocok;
}

/** Jalur terpendek (BFS, tetangga dalam urutan tetap) dari pusat ke orang, atau undefined. */
function cariJalur(graf: GrafKeluarga, dari: IdOrang, ke: IdOrang): Langkah[] | undefined {
  const jalurKe = new Map<IdOrang, Langkah[]>([[dari, []]]);
  const antrean = [dari];
  while (antrean.length > 0) {
    const id = antrean.shift()!;
    for (const [tetangga, langkah] of tetanggaDari(graf, id)) {
      if (jalurKe.has(tetangga)) continue;
      jalurKe.set(tetangga, [...jalurKe.get(id)!, langkah]);
      if (tetangga === ke) return jalurKe.get(tetangga);
      antrean.push(tetangga);
    }
  }
  return undefined;
}

function tetanggaDari(graf: GrafKeluarga, id: IdOrang): Array<[IdOrang, Langkah]> {
  const orang = graf.orang[id]!;
  const hasil: Array<[IdOrang, Langkah]> = [];
  if (orang.idAyah && graf.orang[orang.idAyah]) hasil.push([orang.idAyah, 'a']);
  if (orang.idIbu && graf.orang[orang.idIbu]) hasil.push([orang.idIbu, 'i']);
  for (const anak of Object.values(graf.orang)) {
    if (anak.idAyah === id || anak.idIbu === id) hasil.push([anak.id, anak.jenisKelamin === 'L' ? 'k' : 'p']);
  }
  for (const nikah of graf.pernikahan) {
    if (nikah.idSuami === id && graf.orang[nikah.idIstri]) hasil.push([nikah.idIstri, 'r']);
    if (nikah.idIstri === id && graf.orang[nikah.idSuami]) hasil.push([nikah.idSuami, 's']);
  }
  return hasil.sort((x, y) => URUTAN_LANGKAH.indexOf(x[1]) - URUTAN_LANGKAH.indexOf(y[1]));
}
