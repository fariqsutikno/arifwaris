// Label soal dari hasil engine (spec bank soal §4): token tetap yang dibaca dari jejak dan statusOrang (data,
// bukan teks), dipakai penyaring bank dan UI. Murni; tidak menebak dari pola susunan ahli waris.
//   `bernama:minbariyyah` belum ada: jejak engine tidak menandainya (hanya umariyyatain, musyarrakah,
//   akdariyyah, muaddah), jadi tidak dipancarkan sampai engine menambahkan penandanya.

import type { HasilGharqa, HasilTaqdir, KeadaanGharqa, LangkahJejak } from '@waris/engine';
import type { HasilMunasakhatOk, HasilOk } from '../jalankan.js';

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
  { bentuk: 'munasakhat', arti: 'Ada ahli waris yang wafat sebelum harta dibagi (munasakhat)' },
  { bentuk: 'munasakhat:<n>', arti: 'Banyaknya mayit yang bertumpuk dalam munasakhat, termasuk pewaris pertama' },
  { bentuk: 'keadaan:<1|2|3>', arti: 'Keadaan munasakhat menurut penggabungan mas\'alahnya (bab 12.2)' },
  { bentuk: 'ikhtishar', arti: 'Jami\'ah munasakhat bisa diringkas (ikhtishar as-siham)' },
  { bentuk: 'gharqa', arti: 'Beberapa orang wafat bersamaan atau urutan wafatnya tidak diketahui (gharqa)' },
  { bentuk: 'gharqa:<keadaan>', arti: 'Keadaan wafat bersamaan: serentak, terlupakan, berurutanTakDiketahui, tidakDiketahui' },
  { bentuk: 'mayit:<n>', arti: 'Banyaknya orang yang wafat bersamaan' },
  { bentuk: 'ditahan', arti: 'Harta ditahan sampai keadaannya jelas' },
  { bentuk: 'mafqud', arti: 'Ada ahli waris yang hilang tidak diketahui kabarnya (mafqud)' },
  { bentuk: 'khuntsa', arti: 'Ada ahli waris berkelamin ganda musykil (khuntsa)' },
  { bentuk: 'haml', arti: 'Ada ahli waris yang masih dalam kandungan (haml)' },
  { bentuk: 'dunia:<n>', arti: 'Banyaknya kemungkinan keadaan yang dihitung pada soal yang belum pasti' },
  { bentuk: 'sasaran:<KUNCI>', arti: 'Jenis ahli waris yang belum pasti (hilang, khuntsa, atau janin)' },
  { bentuk: 'mauquf', arti: 'Ada bagian yang ditahan menunggu kepastian' },
  { bentuk: 'kelasD', arti: 'Ashabah yang berbagi dengan janin tidak diberi bagian sekarang' },
  { bentuk: 'dzawilArham', arti: 'Harta jatuh ke kerabat dzawil arham' },
  { bentuk: 'tanzil:<KUNCI>', arti: 'Kerabat didudukkan sebagai perantara berjenis ini (tanzil)' },
  { bentuk: 'dzawilArham:pasangan', arti: 'Dzawil arham bersama pasangan yang menerima bagiannya lebih dulu' },
  { bentuk: 'dzawilArham:duaJalur', arti: 'Satu kerabat mewarisi lewat dua jalur' },
  { bentuk: 'dzawilArham:samaRata', arti: 'Bagian perantara dibagi sama rata kepada keturunannya' },
];

/** Token keluarga lanjutan (G3); soal tanpa salah satunya = keluarga biasa. */
export const TOKEN_KELUARGA_LANJUTAN = ['munasakhat', 'gharqa', 'mafqud', 'khuntsa', 'haml', 'dzawilArham'] as const;
export type KeluargaLanjutan = typeof TOKEN_KELUARGA_LANJUTAN[number];
export const keluargaDariLabel = (label: string[]): KeluargaLanjutan | undefined =>
  TOKEN_KELUARGA_LANJUTAN.find(token => label.includes(token));

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

// ─── Keluarga lanjutan ────────────────────────────────────────────────────────

/** Hitungan per mas'alah tidak bermakna bila digabung dari banyak mas'alah, jadi tidak ikut. */
const tanpaHitungan = (token: string) => !token.startsWith('jumlahAhliWaris:') && !token.startsWith('inkisar:');
const gabungKaidah = (daftarHasil: HasilOk[]) => daftarHasil.flatMap(hasil => labelSoal(hasil).filter(tanpaHitungan));
const urut = (token: string[]) => [...new Set(token)].sort();

/** `keadaan` dan ikhtishar dari engine; kaidah (aul, radd, tashih, hajb, kasus bernama) gabungan tiap mas'alah. */
export function labelMunasakhat(hasil: HasilMunasakhatOk): string[] {
  return urut([
    'munasakhat', `munasakhat:${hasil.daftarLangkah.length}`, `keadaan:${hasil.keadaan}`,
    ...(hasil.ikhtishar.jamiah !== hasil.jamiah ? ['ikhtishar'] : []),
    ...gabungKaidah(hasil.daftarLangkah.map(langkah => langkah.hasil)),
  ]);
}

/** Kaidah dari mas'alah biasa tiap harta bila ada; hasil ditahan (MAUQUF) cukup bertanda `ditahan`. */
export function labelGharqa(hasil: Extract<HasilGharqa, { status: 'OK' | 'MAUQUF' }>, keadaan: KeadaanGharqa, jumlahAnggota: number): string[] {
  const dasar = ['gharqa', `gharqa:${keadaan}`, `mayit:${jumlahAnggota}`];
  if (hasil.status === 'MAUQUF') return urut([...dasar, 'ditahan']);
  return urut([...dasar, ...gabungKaidah(hasil.harta.flatMap(harta => (harta.hasilBiasa ? [harta.hasilBiasa] : [])))]);
}

/** Jumlah dunia, bagian ditahan, dan kelas D (mitra ashabah haml tidak diberi apa pun [R13-15]) dibaca dari hasil taqdir. */
export function labelTaqdir(hasil: Extract<HasilTaqdir, { status: 'OK' }>, jenis: 'mafqud' | 'khuntsa' | 'haml'): string[] {
  // Jenis ahli waris yang belum pasti, dari peran yang ditetapkan engine (bukan dari tebakan susunan).
  const sasaran = Object.keys(hasil.daftarDunia[0]?.taqdir ?? {}).flatMap(id => {
    const status = hasil.daftarDunia[0]!.statusOrang[id];
    return status && 'peran' in status ? [`sasaran:${status.peran.kunci}`] : [];
  });
  return urut([
    jenis, `dunia:${hasil.daftarDunia.length}`, ...sasaran,
    ...(hasil.mauquf > 0n ? ['mauquf'] : []),
    ...(hasil.jejak.some(langkah => langkah.jenis === 'TAQDIR_PEMBERIAN' && langkah.alasan === 'kelasD') ? ['kelasD'] : []),
  ]);
}

export function labelDzawilArham(hasil: HasilOk): string[] {
  const token = ['dzawilArham'];
  for (const langkah of hasil.jejak) {
    if (langkah.jenis === 'DZAWIL_ARHAM_TANZIL') token.push(`tanzil:${langkah.kunciPerantara}`);
    else if (langkah.jenis === 'DZAWIL_ARHAM_GABUNG_PASANGAN') token.push('dzawilArham:pasangan');
    else if (langkah.jenis === 'DZAWIL_ARHAM_DUA_JALUR') token.push('dzawilArham:duaJalur');
    else if (langkah.jenis === 'DZAWIL_ARHAM_TURUN' && langkah.rasio === 'samaRata') token.push('dzawilArham:samaRata');
  }
  return urut([...token, ...labelSoal(hasil).filter(tanpaHitungan)]);
}
