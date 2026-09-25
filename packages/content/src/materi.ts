/// <reference path="./raw.d.ts" />
// Materi pembelajaran dari `docs/materi/*.md` (versi ajar dari KB, bukan hukum baru).
// Satu berkas = satu pelajaran: frontmatter (judul, modul, urutan, tujuan, perluCek) + isi Markdown terbatas:
//   ## / ###, paragraf, daftar (- / 1.), catatan (>), tabel, **tebal**, *miring*,
//   [[id-istilah]] atau [[id-istilah|teks]] → istilah glosarium, [R04-2] → tautan dalil,
//   blok ```kasus → contoh yang dihitung engine di aplikasi (harapan dicek oleh test, tidak ditampilkan).
// Daftar modul diambil dari tabel `docs/materi/00-modul.md`.
import { barisTabelBagian } from './refs.js';

export type Potongan =
  | { jenis: 'teks'; teks: string }
  | { jenis: 'tebal'; teks: string }
  | { jenis: 'miring'; teks: string }
  | { jenis: 'istilah'; id: string; teks: string }
  | { jenis: 'rujukan'; kode: string };

export interface ContohKasus {
  pewaris: 'L' | 'P';
  /** Kunci ahli waris (ISTRI, ANAK_LK, ...), satu entri per orang. */
  ahliWaris: string[];
  harta: bigint;
  /** Jumlah saham per kunci dan ashl akhir; hanya untuk test, supaya angka di teks pelajaran tidak menyimpang dari engine. */
  harapan: { saham: Record<string, bigint>; ashlAkhir: bigint };
}

export type Blok =
  | { jenis: 'judul'; tingkat: 2 | 3; isi: Potongan[] }
  | { jenis: 'paragraf'; isi: Potongan[] }
  | { jenis: 'daftar'; berurut: boolean; butir: Potongan[][] }
  | { jenis: 'catatan'; isi: Potongan[] }
  | { jenis: 'tabel'; kepala: Potongan[][]; baris: Potongan[][][] }
  | { jenis: 'kasus'; kasus: ContohKasus };

export interface Pelajaran {
  slug: string;
  judul: string;
  modul: number;
  urutan: number;
  tujuan: string;
  perluCek: boolean;
  blok: Blok[];
}

export interface Modul { nomor: number; judul: string; ringkas: string }

export function bacaPelajaran(slug: string, teksMarkdown: string): Pelajaran {
  const cocok = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(teksMarkdown);
  if (!cocok) throw new Error(`${slug}: frontmatter tidak ada`);
  const meta = Object.fromEntries(cocok[1]!.split('\n').map(baris => {
    const pemisah = baris.indexOf(':');
    return [baris.slice(0, pemisah).trim(), baris.slice(pemisah + 1).trim()];
  }));
  for (const kunci of ['judul', 'modul', 'urutan', 'tujuan']) if (!meta[kunci]) throw new Error(`${slug}: frontmatter "${kunci}" kosong`);
  return {
    slug, judul: meta.judul!, modul: Number(meta.modul), urutan: Number(meta.urutan), tujuan: meta.tujuan!,
    perluCek: meta.perluCek !== 'false', blok: bacaBlok(slug, cocok[2]!),
  };
}

export function bacaBlok(slug: string, isi: string): Blok[] {
  const daftarBlok: Blok[] = [];
  const daftarBaris = isi.split('\n');
  for (let indeks = 0; indeks < daftarBaris.length;) {
    const baris = daftarBaris[indeks]!;
    const ambilSelama = (syarat: (teks: string) => boolean) => {
      const diambil: string[] = [];
      while (indeks < daftarBaris.length && syarat(daftarBaris[indeks]!)) diambil.push(daftarBaris[indeks++]!);
      return diambil;
    };
    if (baris.trim() === '') { indeks++; continue; }
    if (baris.startsWith('```kasus')) {
      indeks++;
      const isiKasus = ambilSelama(teks => !teks.startsWith('```'));
      indeks++;
      daftarBlok.push({ jenis: 'kasus', kasus: bacaKasus(slug, isiKasus) });
    } else if (/^#{2,3} /.test(baris)) {
      const tingkat = baris.startsWith('### ') ? 3 : 2;
      daftarBlok.push({ jenis: 'judul', tingkat, isi: bacaPotongan(baris.slice(tingkat + 1)) });
      indeks++;
    } else if (baris.startsWith('> ')) {
      daftarBlok.push({ jenis: 'catatan', isi: bacaPotongan(ambilSelama(teks => teks.startsWith('> ')).map(teks => teks.slice(2)).join(' ')) });
    } else if (baris.startsWith('|')) {
      const [kepala = '', , ...sisa] = ambilSelama(teks => teks.startsWith('|'));
      daftarBlok.push({ jenis: 'tabel', kepala: selTabel(kepala).map(bacaPotongan), baris: sisa.map(teks => selTabel(teks).map(bacaPotongan)) });
    } else if (/^(- |\d+\. )/.test(baris)) {
      const berurut = !baris.startsWith('- ');
      // Butir boleh bersambung ke baris berikutnya yang menjorok.
      const butir = ambilSelama(teks => /^(- |\d+\. )/.test(teks) || /^\s+\S/.test(teks))
        .reduce<string[]>((kumpulan, teks) => (/^\s/.test(teks) ? [...kumpulan.slice(0, -1), `${kumpulan.at(-1)} ${teks.trim()}`] : [...kumpulan, teks]), [])
        .map(teks => bacaPotongan(teks.replace(/^(- |\d+\. )/, '')));
      daftarBlok.push({ jenis: 'daftar', berurut, butir });
    } else {
      const paragraf = ambilSelama(teks => teks.trim() !== '' && !/^(#{2,3} |> |\||- |\d+\. |```)/.test(teks));
      daftarBlok.push({ jenis: 'paragraf', isi: bacaPotongan(paragraf.join(' ')) });
    }
  }
  return daftarBlok;
}

const POLA_SEBARIS = /\*\*(.+?)\*\*|\*(.+?)\*|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[(R\d{2}-\d+)\]/g;

export function bacaPotongan(teks: string): Potongan[] {
  const hasil: Potongan[] = [];
  let posisi = 0;
  for (const cocok of teks.matchAll(POLA_SEBARIS)) {
    if (cocok.index > posisi) hasil.push({ jenis: 'teks', teks: teks.slice(posisi, cocok.index) });
    const [, tebal, miring, idIstilah, teksIstilah, kode] = cocok;
    if (tebal !== undefined) hasil.push({ jenis: 'tebal', teks: tebal });
    else if (miring !== undefined) hasil.push({ jenis: 'miring', teks: miring });
    else if (idIstilah !== undefined) hasil.push({ jenis: 'istilah', id: idIstilah.trim(), teks: (teksIstilah ?? idIstilah).trim() });
    else hasil.push({ jenis: 'rujukan', kode: kode! });
    posisi = cocok.index + cocok[0].length;
  }
  if (posisi < teks.length) hasil.push({ jenis: 'teks', teks: teks.slice(posisi) });
  return hasil;
}

/** Semua potongan di pelajaran (judul, paragraf, daftar, catatan, tabel); dipakai test untuk mengecek rujukan & istilah. */
export function semuaPotongan(pelajaran: Pelajaran): Potongan[] {
  return pelajaran.blok.flatMap(blok => {
    switch (blok.jenis) {
      case 'judul': case 'paragraf': case 'catatan': return blok.isi;
      case 'daftar': return blok.butir.flat();
      case 'tabel': return [...blok.kepala, ...blok.baris.flat()].flat();
      case 'kasus': return [];
    }
  });
}

const selTabel = (baris: string) => baris.split('|').slice(1, -1).map(isi => isi.trim());

/**
 * Blok kasus:
 *   pewaris: L
 *   ahli waris: ISTRI, 2 ANAK_PR, AYAH
 *   harta: 120.000.000
 *   harapan: ISTRI 3, ANAK_PR 16, AYAH 4; ashl 24
 */
function bacaKasus(slug: string, daftarBaris: string[]): ContohKasus {
  const isian = Object.fromEntries(daftarBaris.map(baris => {
    const pemisah = baris.indexOf(':');
    return [baris.slice(0, pemisah).trim(), baris.slice(pemisah + 1).trim()];
  }));
  const galat = (pesan: string) => new Error(`${slug}: blok kasus ${pesan}`);
  if (isian.pewaris !== 'L' && isian.pewaris !== 'P') throw galat('butuh "pewaris: L" atau "pewaris: P"');
  if (!isian['ahli waris'] || !isian.harta || !isian.harapan) throw galat('butuh "ahli waris", "harta", dan "harapan"');
  return {
    pewaris: isian.pewaris, ahliWaris: bacaDaftarAhliWaris(isian['ahli waris'], galat),
    harta: BigInt(isian.harta.replace(/\D/g, '')), harapan: bacaHarapan(isian.harapan, galat),
  };
}

/** "ISTRI, 2 ANAK_PR" → ['ISTRI', 'ANAK_PR', 'ANAK_PR']. Dipakai juga oleh bank soal. */
export function bacaDaftarAhliWaris(teks: string, galat: (pesan: string) => Error): string[] {
  return teks.split(',').flatMap(butir => {
    const [, jumlah = '1', kunci] = /^\s*(?:(\d+)\s+)?([A-Z_]+)\s*$/.exec(butir) ?? [];
    if (!kunci) throw galat(`ahli waris "${butir.trim()}" tidak terbaca`);
    return Array.from({ length: Number(jumlah) }, () => kunci);
  });
}

/** "ISTRI 3, ANAK_PR 16; ashl 24" → saham per kunci (hanya yang > 0) dan ashl akhir. */
export function bacaHarapan(teks: string, galat: (pesan: string) => Error): ContohKasus['harapan'] {
  const [bagianSaham = '', bagianAshl = ''] = teks.split(';');
  const saham = Object.fromEntries(bagianSaham.split(',').map(butir => {
    const [, kunci, nilai] = /^\s*([A-Z_]+)\s+(\d+)\s*$/.exec(butir) ?? [];
    if (!kunci) throw galat(`harapan "${butir.trim()}" tidak terbaca`);
    return [kunci, BigInt(nilai!)];
  }));
  const ashl = /^\s*ashl\s+(\d+)\s*$/.exec(bagianAshl);
  if (!ashl) throw galat('harapan harus diakhiri "; ashl N"');
  return { saham, ashlAkhir: BigInt(ashl[1]!) };
}

export function bacaDaftarModul(teksMarkdown: string): Modul[] {
  return barisTabelBagian(teksMarkdown, 'Daftar Modul')
    .map(([nomor = '', judul = '', ringkas = '']) => ({ nomor: Number(nomor), judul, ringkas }));
}

// ─── Data dari docs/materi ────────────────────────────────────────────────────

const BERKAS = import.meta.glob('../../../docs/materi/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const namaBerkas = (jalur: string) => jalur.split('/').pop()!.replace(/\.md$/, '');

export const DAFTAR_MODUL: Modul[] = bacaDaftarModul(BERKAS['../../../docs/materi/00-modul.md'] ?? '');
export const DAFTAR_PELAJARAN: Pelajaran[] = Object.entries(BERKAS)
  .filter(([jalur]) => !jalur.endsWith('00-modul.md'))
  .map(([jalur, teks]) => bacaPelajaran(namaBerkas(jalur), teks))
  .sort((a, b) => a.modul - b.modul || a.urutan - b.urutan);

export const cariPelajaran = (slug: string): Pelajaran | undefined => DAFTAR_PELAJARAN.find(pelajaran => pelajaran.slug === slug);
