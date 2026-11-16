// Bahasa manusia untuk templat narasi: pengelompokan per tahap penjelasan, nama & contoh {sisipan}, dan pemeriksaan
// bahwa suntingan tidak merusak sisipan. Menerima kunci diksi / teks templat; menyerahkan label ke layar Penjelasan hasil
// dan dialog sunting. Kunci tidak pernah ditampilkan.

/** Urutan tahap = urutan tampil. Kunci: `cerita.<tahap>` atau segmen kedua kunci diksi. */
const TAHAP: ReadonlyArray<readonly [string, string]> = [
  ['cerita.harta', 'Harta'], ['cerita.ahli_waris', 'Ahli waris'], ['cerita.bagian', 'Bagian ahli waris'],
  ['cerita.fardh', 'Bagian tetap'], ['cerita.ashabah', 'Penerima sisa (ashabah)'], ['cerita.penyebut', 'Penyebut pecahan'],
  ['cerita.penyesuaian', 'Penyesuaian bagian'], ['cerita.sisa_keluar', 'Sisa harta'], ['cerita.radd', 'Sisa dikembalikan'],
  ['cerita.tashih', 'Pembulatan saham'], ['cerita.hasil', 'Hasil akhir'],
  ['ringkas', 'Versi ringkas'], ['umum', 'Nama dan istilah umum'], ['nisab', 'Hitungan pecahan'],
  ['taqdir', 'Kemungkinan (janin/hilang/khuntsa)'], ['munasakhat', 'Wafat berlapis'], ['gharqa', 'Wafat bersamaan'],
  ['dzawil_arham', 'Kerabat jauh (dzawil arham)'],
];
const JUDUL_LAINNYA = 'Lainnya';
const JUDUL_ARAB = 'Bahasa Arab';
const AWALAN_NARASI = 'narasi.';

export interface KelompokNarasi { judul: string; kunci: string[] }

/** Hanya kunci `narasi.*`; urutan dalam tahap mengikuti urutan masuk. */
export function kelompokkanNarasi(daftarKunci: readonly string[]): KelompokNarasi[] {
  const urutan = [...TAHAP.map(([, judul]) => judul), JUDUL_LAINNYA, JUDUL_ARAB];
  const peta = new Map(urutan.map(judul => [judul, [] as string[]]));
  for (const kunci of daftarKunci.filter(k => k.startsWith(AWALAN_NARASI))) peta.get(judulTahap(kunci))!.push(kunci);
  return urutan.filter(judul => peta.get(judul)!.length).map(judul => ({ judul, kunci: peta.get(judul)! }));
}

function judulTahap(kunci: string): string {
  const [, tahap = '', bagian = ''] = kunci.split('.');
  if (tahap === 'arab') return JUDUL_ARAB;
  const cocok = TAHAP.find(([id]) => id === `${tahap}.${bagian}` || id === tahap);
  return cocok ? cocok[1] : JUDUL_LAINNYA;
}

// Sisipan yang isinya istilah fikih bertautan (tooltip di aplikasi): bagi admin cukup "rujukan".
const NAMA_RUJUKAN = 'rujukan';
const SISIPAN_RUJUKAN = new Set([
  'tirkah', 'warits', 'hajb_hirman', 'hajb_nuqshan', 'mani', 'mahjub_hirman', 'muqasamah', 'muaddah', 'musyarrakah', 'akdariyyah',
  'umariyyatain', 'kalalah', 'aul', 'radd', 'tamatsul', 'tadakhul', 'tawafuq', 'tabayun', 'inkisar', 'wafq', 'tilad',
  'jam_min_al_ikhwah', 'takmilah_tsulutsain', 'bil_ghair', 'maal_ghair', 'muashshib', 'mahjub', 'hajib', 'ashabah',
]);
const NAMA_SISIPAN: Readonly<Record<string, string>> = {
  pewaris: 'nama almarhum', mayit: 'nama almarhum', siapa: 'nama orang', subjek: 'nama orang', pecahan: 'pecahan bagian',
  saham: 'jumlah saham', ashl: 'pokok masalah', ruus: 'jumlah kepala', hasil: 'hasil hitung', jumlah: 'jumlah',
};
const CONTOH_SISIPAN: Readonly<Record<string, string>> = {
  pewaris: 'Budi', mayit: 'Budi', siapa: 'Ahmad', subjek: 'Ahmad', pecahan: '1/6', saham: '4', ashl: '12', ruus: '5',
  hasil: '12', jumlah: '3',
};
const POLA_SISIPAN = /\{(\w+)\}/g;

export function namaSisipan(kunci: string): string {
  if (SISIPAN_RUJUKAN.has(kunci)) return NAMA_RUJUKAN;
  return NAMA_SISIPAN[kunci] ?? kunci.replace(/_/g, ' ');
}

export const sisipanDari = (teks: string): string[] => [...new Set([...teks.matchAll(POLA_SISIPAN)].map(cocok => cocok[1]!))];

/** Sisipan templat asal yang hilang dan yang baru muncul di templat suntingan (nama manusiawi, tanpa duplikat). */
export function sisipanBerubah(asal: string, suntingan: string): { hilang: string[]; baru: string[] } {
  const ada = new Set(sisipanDari(suntingan));
  const dulu = new Set(sisipanDari(asal));
  const nama = (daftar: string[]) => [...new Set(daftar.map(namaSisipan))];
  return { hilang: nama([...dulu].filter(k => !ada.has(k))), baru: nama([...ada].filter(k => !dulu.has(k))) };
}

export const contohSisipan = (kunci: string): string | undefined =>
  SISIPAN_RUJUKAN.has(kunci) ? NAMA_RUJUKAN : CONTOH_SISIPAN[kunci];

/** Kalimat dengan nilai contoh; sisipan tanpa contoh tampil sebagai namanya. */
export const contohKalimat = (teks: string): string =>
  teks.replace(POLA_SISIPAN, (_, kunci: string) => contohSisipan(kunci) ?? namaSisipan(kunci));
