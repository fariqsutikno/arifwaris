// scripts/diksi/rencana.ts
// Rencana migrasi t('teks Indonesia') → t('halaman.id'). Menerima isi berkas web dan kamus Arab per halaman,
// memutuskan kunci stabil tiap teks (halaman dari kamus tempat teks itu diterjemahkan, lalu dari jalur berkas),
// menyerahkan peta (dibaca skrip impor) dan penulisan ulang sumber. Teks di berkas konten/* (label, wizard, tur, harta)
// menjadi teks_edukasi, bukan diksi. Fungsi murni: urutan berkas tidak memengaruhi hasil.

export interface ButirDiksi { kunci: string; halaman: string; id: string; ar: string | null }
export interface ButirEdukasi { slug: string; id: string; ar: string | null }
export interface PetaDiksi { diksi: ButirDiksi[]; edukasi: ButirEdukasi[] }
export interface BerkasSumber { jalur: string; isi: string }
export type KamusPerHalaman = Record<string, Record<string, string>>;

export const BERKAS_EDUKASI: Record<string, string> = {
  'konten/ahliWaris.ts': 'ahli_waris', 'konten/harta.ts': 'harta', 'konten/wizard.ts': 'wizard',
  'konten/tur.ts': 'tur', 'konten/umum.ts': 'umum',
};
/** Ahwal dimigrasi sebagai data (jenis ahwal) oleh skrip impor; kamus & terjemah bukan pemakai t. */
const DILEWATI = [/^konten\/ahwal\.ts$/, /^konten\/kamus/, /^konten\/kamusArab\.ts$/, /^terjemah\.ts$/, /^__tests__\//];
/** Urutan pencarian halaman di kamus; umum didahulukan supaya teks bersama punya satu kunci. */
const URUTAN_HALAMAN = ['umum', 'beranda', 'hitung', 'belajar', 'latihan', 'rujukan', 'faq', 'glosarium', 'tanya_jawab', 'bab'];
const HALAMAN_MENURUT_JALUR: [RegExp, string][] = [
  [/^layar\/belajar\//, 'belajar'], [/^layar\/Beranda/, 'beranda'], [/^(layar|hasil)\//, 'hitung'],
];
const MAKS_KATA_SLUG = 6;
const POLA_T = /\bt\((['"])((?:(?!\1)[^\\]|\\.)*)\1/g;

export function ambilTeksT(isi: string): string[] {
  return [...isi.matchAll(POLA_T)].map(cocok => lepasEscape(cocok[2]!));
}

export function slugTeks(teks: string): string {
  const kata = teks.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[{}]/g, ' ').split(/[^a-z0-9]+/).filter(Boolean).slice(0, MAKS_KATA_SLUG);
  return kata.length ? kata.join('_') : 'teks';
}

export function susunPeta(berkas: BerkasSumber[], kamus: KamusPerHalaman): PetaDiksi {
  const terurut = [...berkas].filter(b => !DILEWATI.some(pola => pola.test(b.jalur))).sort((a, b) => a.jalur.localeCompare(b.jalur));
  const diksi = new Map<string, ButirDiksi>();          // `${halaman}\n${teks}` → butir
  const edukasi = new Map<string, ButirEdukasi>();      // `${awalan}\n${teks}` → butir
  const terpakai = new Set<string>();
  const kunciUnik = (awalan: string, teks: string) => {
    const dasar = `${awalan}.${slugTeks(teks)}`;
    let kunci = dasar;
    for (let nomor = 2; terpakai.has(kunci); nomor++) kunci = `${dasar}_${nomor}`;
    terpakai.add(kunci);
    return kunci;
  };
  const arDari = (teks: string) => URUTAN_HALAMAN.map(h => kamus[h]?.[teks]).find(Boolean) ?? null;
  for (const { jalur, isi } of terurut) {
    const awalanEdukasi = BERKAS_EDUKASI[jalur];
    for (const teks of ambilTeksT(isi)) {
      if (awalanEdukasi) {
        const id = `${awalanEdukasi}\n${teks}`;
        if (!edukasi.has(id)) edukasi.set(id, { slug: kunciUnik(awalanEdukasi, teks), id: teks, ar: arDari(teks) });
        continue;
      }
      const halaman = tentukanHalaman(jalur, teks, kamus);
      const id = `${halaman}\n${teks}`;
      if (!diksi.has(id)) diksi.set(id, { kunci: kunciUnik(halaman, teks), halaman, id: teks, ar: kamus[halaman]?.[teks] ?? arDari(teks) });
    }
  }
  return { diksi: [...diksi.values()], edukasi: [...edukasi.values()] };
}

export function tulisUlang(berkas: BerkasSumber, peta: PetaDiksi): string {
  const awalanEdukasi = BERKAS_EDUKASI[berkas.jalur];
  const ganti = (teks: string): string | undefined => awalanEdukasi
    ? peta.edukasi.find(b => b.id === teks && b.slug.startsWith(`${awalanEdukasi}.`))?.slug
    : peta.diksi.find(b => b.id === teks && b.halaman === tentukanHalamanDariPeta(berkas.jalur, teks, peta))?.kunci;
  let hasil = berkas.isi.replace(POLA_T, (utuh, _kutip, mentah: string) => {
    const kunci = ganti(lepasEscape(mentah));
    if (!kunci) return utuh;
    return awalanEdukasi ? `teksEdukasi('${kunci}'` : `t('${kunci}'`;
  });
  if (awalanEdukasi) hasil = gantiImporT(hasil);
  return hasil;
}

function tentukanHalaman(jalur: string, teks: string, kamus: KamusPerHalaman): string {
  return URUTAN_HALAMAN.find(halaman => kamus[halaman]?.[teks] !== undefined)
    ?? HALAMAN_MENURUT_JALUR.find(([pola]) => pola.test(jalur))?.[1] ?? 'umum';
}

/**
 * Saat menulis ulang kamus tidak tersedia, jadi halaman disimpulkan dari peta: teks yang terjemahannya ada di kamus
 * hanya punya satu butir (halaman kamus); teks tanpa terjemahan bisa punya satu butir per halaman-jalur.
 */
function tentukanHalamanDariPeta(jalur: string, teks: string, peta: PetaDiksi): string | undefined {
  const kandidat = peta.diksi.filter(b => b.id === teks).map(b => b.halaman);
  if (kandidat.length <= 1) return kandidat[0];
  const menurutJalur = HALAMAN_MENURUT_JALUR.find(([pola]) => pola.test(jalur))?.[1] ?? 'umum';
  return kandidat.find(halaman => halaman === menurutJalur);
}

/** `import { angka, t } from '../terjemah'` → t diganti teksEdukasi (didefinisikan di terjemah.ts). */
function gantiImporT(isi: string): string {
  return isi.replace(/import \{ ([^}]*) \} from '\.\.\/terjemah';/, (_utuh, daftar: string) => {
    const nama = daftar.split(',').map(n => n.trim()).filter(Boolean).map(n => (n === 't' ? 'teksEdukasi' : n));
    return `import { ${nama.join(', ')} } from '../terjemah';`;
  });
}

const lepasEscape = (teks: string) => teks.replace(/\\(['"\\])/g, '$1');
