// scripts/materi-periksa.ts
// Pemeriksaan berkas materi kiriman, dipakai bersama `materi:cek` (hanya melapor) dan `materi:impor` (berhenti bila ada galat):
// periksaMateri (@waris/content) untuk sintaks, istilah, rujukan, tautan, gaya; periksaAngkaMateri (@waris/latihan) untuk angka contoh.
// Slug yang sah = kerangka kurikulum + semua berkas di konten/materi; bagian pelajaran lain dicek bila berkasnya ada.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { kodeSoalGanda, nomorBagian, periksaMateri, type Pelajaran, type Temuan } from '@waris/content';
import { periksaAngkaMateri } from '@waris/latihan';

const AKAR = resolve(import.meta.dirname, '..');
const FOLDER_KONTEN = join(AKAR, 'konten/materi');
const KERANGKA = join(AKAR, 'docs/materi-kit/kerangka-kurikulum.md');

export interface LaporanBerkas { berkas: string; temuan: Temuan[] }
export interface HasilPeriksaKiriman {
  laporan: LaporanBerkas[];
  /** Pelajaran dari berkas yang diperiksa (bukan dari konten/materi yang hanya jadi konteks tautan), urut berkas. */
  pelajaran: Pelajaran[];
  jumlahGalat: number;
  jumlahPeringatan: number;
}

/** `sasaran` relatif dibaca dari folder tempat pnpm dipanggil (INIT_CWD). */
export function periksaMateriKiriman(sasaran: string[]): HasilPeriksaKiriman {
  const berkasDiperiksa = sasaran.flatMap(isi => daftarMarkdown(resolve(process.env.INIT_CWD ?? process.cwd(), isi)));
  const semuaBerkas = [...new Set([...daftarMarkdown(FOLDER_KONTEN), ...berkasDiperiksa])];

  // Pelajaran yang terbaca dipakai sebagai konteks tautan antarpelajaran.
  const terbaca = new Map<string, Pelajaran>();
  for (const berkas of semuaBerkas) {
    const hasil = periksaMateri(readFileSync(berkas, 'utf8'), berkas, { slugDikenal: new Set(), bagianPelajaran: new Map() });
    if (hasil.terbaca) terbaca.set(berkas, hasil.pelajaran);
  }
  const slugDikenal = new Set([...slugKerangka(), ...[...terbaca.values()].map(pelajaran => pelajaran.slug)]);
  const bagianPelajaran = new Map([...terbaca.values()].map(pelajaran => [pelajaran.slug, new Set(nomorBagian(pelajaran.blok).map(bagian => bagian.nomor))]));

  const tampilJalur = (berkas: string) => (berkas.startsWith(AKAR) ? relative(AKAR, berkas) : berkas);
  const laporan: LaporanBerkas[] = berkasDiperiksa.map(berkas => {
    const hasil = periksaMateri(readFileSync(berkas, 'utf8'), berkas, { slugDikenal, bagianPelajaran });
    const temuan = hasil.terbaca ? [...hasil.temuan, ...periksaAngkaMateri(hasil.pelajaran.blok, hasil.barisBlok)] : hasil.temuan;
    return { berkas: tampilJalur(berkas), temuan: temuan.sort((a, b) => a.baris - b.baris) };
  });
  for (const { kode, berkas } of kodeSoalGanda([...terbaca].map(([namaBerkas, pelajaran]) => ({ namaBerkas, pelajaran })))) {
    const milik = laporan.find(isi => berkas.some(nama => tampilJalur(nama) === isi.berkas));
    milik?.temuan.push({ tingkat: 'galat', baris: 1, pesan: `kode soal ${kode} dipakai di lebih dari satu tempat: ${berkas.map(tampilJalur).join(', ')}` });
  }

  const semuaTemuan = laporan.flatMap(isi => isi.temuan);
  const jumlahGalat = semuaTemuan.filter(isi => isi.tingkat === 'galat').length;
  return {
    laporan, jumlahGalat, jumlahPeringatan: semuaTemuan.length - jumlahGalat,
    pelajaran: berkasDiperiksa.flatMap(berkas => terbaca.get(berkas) ?? []),
  };
}

export function cetakLaporan(laporan: LaporanBerkas[]): void {
  for (const { berkas, temuan } of laporan) {
    if (!temuan.length) { console.log(`${berkas}: lolos`); continue; }
    for (const isi of temuan) console.log(`${berkas}:${isi.baris}: ${isi.tingkat}: ${isi.pesan}`);
  }
}

function daftarMarkdown(jalur: string): string[] {
  let info;
  try { info = statSync(jalur); } catch { return []; }
  if (info.isFile()) return jalur.endsWith('.md') ? [jalur] : [];
  return readdirSync(jalur).flatMap(nama => (nama === 'LAPORAN.md' ? [] : daftarMarkdown(join(jalur, nama))));
}

/** Kolom pertama tabel kerangka: "| 5-1-hajb (ada) | ..." → 5-1-hajb. */
function slugKerangka(): string[] {
  return [...readFileSync(KERANGKA, 'utf8').matchAll(/^\| (\d+-\d+-[a-z0-9-]+)/gm)].map(cocok => cocok[1]!);
}
