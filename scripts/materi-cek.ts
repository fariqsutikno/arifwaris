// scripts/materi-cek.ts — `pnpm materi:cek <berkas|folder>... [--json]`
// Memeriksa berkas materi kiriman (docs/materi-kit/format-materi.md): periksaMateri (@waris/content) untuk sintaks,
// istilah, rujukan, tautan, gaya; periksaAngkaMateri (@waris/latihan) untuk angka contoh. Galat → kode keluar 1.
// Slug yang sah = kerangka kurikulum + semua berkas di konten/materi; bagian pelajaran lain dicek bila berkasnya ada.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { kodeSoalGanda, nomorBagian, periksaMateri, type Pelajaran, type Temuan } from '@waris/content';
import { periksaAngkaMateri } from '@waris/latihan';

const AKAR = resolve(import.meta.dirname, '..');
const FOLDER_KONTEN = join(AKAR, 'konten/materi');
const KERANGKA = join(AKAR, 'docs/materi-kit/kerangka-kurikulum.md');

const argumen = process.argv.slice(2);
const modeJson = argumen.includes('--json');
const sasaran = argumen.filter(isi => isi !== '--json' && isi !== '--');
if (!sasaran.length) {
  console.error('pakai: pnpm materi:cek <berkas.md|folder>... [--json]');
  process.exit(2);
}

const berkasDiperiksa = sasaran.flatMap(isi => daftarMarkdown(resolve(process.env.INIT_CWD ?? process.cwd(), isi)));
const berkasKonten = daftarMarkdown(FOLDER_KONTEN);
const semuaBerkas = [...new Set([...berkasKonten, ...berkasDiperiksa])];

// Pelajaran yang terbaca dipakai sebagai konteks tautan antarpelajaran.
const terbaca = new Map<string, Pelajaran>();
for (const berkas of semuaBerkas) {
  const hasil = periksaMateri(readFileSync(berkas, 'utf8'), berkas, { slugDikenal: new Set(), bagianPelajaran: new Map() });
  if (hasil.terbaca) terbaca.set(berkas, hasil.pelajaran);
}
const slugDikenal = new Set([...slugKerangka(), ...[...terbaca.values()].map(pelajaran => pelajaran.slug)]);
const bagianPelajaran = new Map([...terbaca.values()].map(pelajaran => [pelajaran.slug, new Set(nomorBagian(pelajaran.blok).map(bagian => bagian.nomor))]));

const tampilJalur = (berkas: string) => (berkas.startsWith(AKAR) ? relative(AKAR, berkas) : berkas);

const laporan: { berkas: string; temuan: Temuan[] }[] = berkasDiperiksa.map(berkas => {
  const hasil = periksaMateri(readFileSync(berkas, 'utf8'), berkas, { slugDikenal, bagianPelajaran });
  const temuan = hasil.terbaca ? [...hasil.temuan, ...periksaAngkaMateri(hasil.pelajaran.blok, hasil.barisBlok)] : hasil.temuan;
  return { berkas: tampilJalur(berkas), temuan: temuan.sort((a, b) => a.baris - b.baris) };
});
for (const { kode, berkas } of kodeSoalGanda([...terbaca].map(([namaBerkas, pelajaran]) => ({ namaBerkas, pelajaran })))) {
  const milik = laporan.find(isi => berkas.some(nama => tampilJalur(nama) === isi.berkas));
  milik?.temuan.push({ tingkat: 'galat', baris: 1, pesan: `kode soal ${kode} dipakai di lebih dari satu tempat: ${berkas.map(tampilJalur).join(', ')}` });
}

const jumlahGalat = laporan.flatMap(isi => isi.temuan).filter(isi => isi.tingkat === 'galat').length;
if (modeJson) {
  console.log(JSON.stringify(laporan, null, 2));
} else {
  for (const { berkas, temuan } of laporan) {
    if (!temuan.length) { console.log(`${berkas}: lolos`); continue; }
    for (const isi of temuan) console.log(`${berkas}:${isi.baris}: ${isi.tingkat}: ${isi.pesan}`);
  }
  const jumlahPeringatan = laporan.flatMap(isi => isi.temuan).length - jumlahGalat;
  console.log(`\n${laporan.length} berkas, ${jumlahGalat} galat, ${jumlahPeringatan} peringatan`);
}
process.exit(jumlahGalat ? 1 : 0);

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
