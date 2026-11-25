// Pemeriksa sebaris isi pelajaran di portal. Menerima Markdown isi (bidang "Isi pelajaran") dan slug; membungkusnya
// dengan kepala berkas buatan supaya periksaMateri (@waris/content) dan periksaAngkaMateri (@waris/latihan) bisa
// dipakai apa adanya; menyerahkan Temuan berbahasa biasa dengan nomor baris relatif ke isi (bukan ke berkas buatan).
// Isi gaya lama (tanpa satu pun blok format baru) tidak diperiksa: strukturnya memang tidak memenuhi aturan baru.
import { periksaMateri, tulisBlok, type Blok, type Temuan } from '@waris/content';
import { periksaAngkaMateri } from '@waris/latihan';
import { terjemahkanTemuan } from './pesanMateri';

const BLOK_FORMAT_BARU = /^```(?:alur|cara-berpikir|peraga|bandingan|simulasi|peta|ingat|dasar|tebak|lipat|matriks|soal|kasus-berkas)\s*$/m;
const BARIS_KEPALA = 9;
// ponytail: portal belum membaca kerangka kurikulum, jadi slug tujuan tautan dianggap sah dan nomor bagian di pelajaran
// lain tidak dicek; pnpm materi:cek tetap memeriksanya penuh saat impor.
const SEMUA_SLUG = { has: () => true } as unknown as ReadonlySet<string>;

export const memakaiFormatBaru = (markdown: string) => BLOK_FORMAT_BARU.test(markdown);

export function periksaIsiMateri(markdown: string, slug: string): Temuan[] {
  if (!memakaiFormatBaru(markdown)) return [];
  const slugBuatan = /^\d+-\d+-/.test(slug) ? slug : `1-1-${slug}`;
  const [modul, urutan] = slugBuatan.split('-');
  const kepala = ['---', `slug: ${slugBuatan}`, `modul: ${modul}`, `urutan: ${urutan}`, 'judul: x', 'tujuan: x', 'durasi: 1', 'tahap: semua', '---'];
  const hasil = periksaMateri([...kepala, markdown].join('\n'), `${slugBuatan}.md`, { slugDikenal: SEMUA_SLUG, bagianPelajaran: new Map() });
  const temuan = hasil.terbaca ? [...hasil.temuan, ...periksaAngkaMateri(hasil.pelajaran.blok, hasil.barisBlok)] : hasil.temuan;
  return temuan
    .filter(isi => isi.baris > BARIS_KEPALA)
    .map(isi => terjemahkanTemuan({ ...isi, baris: isi.baris - BARIS_KEPALA }))
    .sort((a, b) => a.baris - b.baris);
}

export const hitungGalat = (daftar: Temuan[]) => daftar.filter(isi => isi.tingkat === 'galat').length;

/** Penjaga Simpan: pesan bila isi pelajaran masih punya galat pemeriksa, null bila boleh disimpan. */
export function galatSimpanMateri(slug: string, blok: Blok[]): string | null {
  const jumlah = hitungGalat(periksaIsiMateri(tulisBlok(blok), slug));
  return jumlah === 0 ? null : `Isi pelajaran masih punya ${jumlah} galat. Lihat daftarnya di bawah kolom isi, perbaiki dulu, lalu simpan lagi.`;
}
