// scripts/soal-periksa.ts
// Pemeriksaan paket soal pilihan ganda kiriman (docs/soal-kit): periksaPaketSoal (@waris/content) untuk sintaks, rujukan,
// istilah, kode, gaya; periksaAngkaPaketSoal (@waris/latihan) untuk topik dan saham kasus vs engine.
// Kode soal harus unik di seluruh paket yang diperiksa dan semua berkas di konten/soal.
import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { bacaPelajaran, kodeSoalPaketGanda, nomorBagian, periksaPaketSoal, type PaketSoal } from '@waris/content';
import { periksaAngkaPaketSoal } from '@waris/latihan';
import { AKAR, daftarMarkdown, slugKerangka, type LaporanBerkas } from './materi-periksa';

const FOLDER_SOAL = join(AKAR, 'konten/soal');
const FOLDER_MATERI = join(AKAR, 'konten/materi');

export function periksaSoalKiriman(sasaran: string[]): { laporan: LaporanBerkas[]; jumlahGalat: number; jumlahPeringatan: number } {
  const berkasDiperiksa = sasaran.flatMap(isi => daftarMarkdown(resolve(process.env.INIT_CWD ?? process.cwd(), isi)));
  const tampilJalur = (berkas: string) => (berkas.startsWith(AKAR) ? relative(AKAR, berkas) : berkas);
  // Slug tautan [[>slug]] sah = kerangka kurikulum + pelajaran yang sudah ada; nomor bagian dicek bila berkas pelajarannya ada.
  const bagianPelajaran = new Map<string, ReadonlySet<string>>();
  for (const berkas of daftarMarkdown(FOLDER_MATERI)) {
    try {
      const pelajaran = bacaPelajaran(readFileSync(berkas, 'utf8'), berkas);
      bagianPelajaran.set(pelajaran.slug, new Set(nomorBagian(pelajaran.blok).map(bagian => bagian.nomor)));
    } catch { /* berkas materi rusak dilaporkan materi:cek, bukan di sini */ }
  }
  const konteks = { slugDikenal: new Set([...slugKerangka(), ...bagianPelajaran.keys()]), bagianPelajaran };

  const terbaca = new Map<string, PaketSoal>();
  const laporan: LaporanBerkas[] = berkasDiperiksa.map(berkas => {
    const hasil = periksaPaketSoal(readFileSync(berkas, 'utf8'), berkas, konteks);
    if (hasil.terbaca) terbaca.set(berkas, hasil.paket);
    const temuan = hasil.terbaca ? [...hasil.temuan, ...periksaAngkaPaketSoal(hasil.paket)] : hasil.temuan;
    return { berkas: tampilJalur(berkas), temuan: temuan.sort((a, b) => a.baris - b.baris) };
  });

  // Kode yang sudah dipakai paket lain di konten/soal (yang tidak sedang diperiksa) juga dihitung.
  const lain = daftarMarkdown(FOLDER_SOAL).filter(berkas => !berkasDiperiksa.includes(berkas));
  const semua = [...terbaca].map(([namaBerkas, paket]) => ({ namaBerkas, paket }));
  for (const berkas of lain) {
    const hasil = periksaPaketSoal(readFileSync(berkas, 'utf8'), berkas, konteks);
    if (hasil.terbaca) semua.push({ namaBerkas: berkas, paket: hasil.paket });
  }
  for (const { kode, berkas } of kodeSoalPaketGanda(semua)) {
    const milik = laporan.find(isi => berkas.some(nama => tampilJalur(nama) === isi.berkas));
    milik?.temuan.push({ tingkat: 'galat', baris: 1, pesan: `kode soal ${kode} dipakai di lebih dari satu berkas: ${berkas.map(tampilJalur).join(', ')}` });
  }

  const semuaTemuan = laporan.flatMap(isi => isi.temuan);
  const jumlahGalat = semuaTemuan.filter(isi => isi.tingkat === 'galat').length;
  return { laporan, jumlahGalat, jumlahPeringatan: semuaTemuan.length - jumlahGalat };
}
