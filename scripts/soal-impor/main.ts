// scripts/soal-impor/main.ts — `pnpm soal:impor <berkas|folder>... [--kering]`
// Memeriksa paket soal (sama dengan soal:cek; paket dengan galat ditolak seluruhnya), lalu menulis tiap soal sebagai revisi
// 'diajukan' ke database lewat akun impor. `--kering`: hanya mencetak rencana (baru/ubah/sama/dilewati), tanpa menulis.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bacaPaketSoal } from '@waris/content';
import { cetakLaporan, daftarMarkdown } from '../materi-periksa';
import { periksaSoalKiriman } from '../soal-periksa';
import { imporSoal, type RepoImpor } from './tulis';

const argumen = process.argv.slice(2);
const kering = argumen.includes('--kering');
const sasaran = argumen.filter(isi => isi !== '--kering' && isi !== '--');
if (!sasaran.length) {
  console.error('pakai: pnpm soal:impor <berkas.md|folder>... [--kering]');
  process.exit(2);
}

const periksa = periksaSoalKiriman(sasaran);
cetakLaporan(periksa.laporan);
if (periksa.jumlahGalat) {
  console.error(`\n${periksa.jumlahGalat} galat: impor dibatalkan`);
  process.exit(1);
}
// Sudah lolos periksa, jadi bacaPaketSoal tidak akan melempar.
const berkas = sasaran.flatMap(isi => daftarMarkdown(resolve(process.env.INIT_CWD ?? process.cwd(), isi)));
const daftarPaket = berkas.map(nama => bacaPaketSoal(readFileSync(nama, 'utf8'), nama));

let repo: RepoImpor;
let tujuan = 'kering';
if (kering) {
  // Repo kosong tanpa jaringan: hanya agar jalur penghitungan sama dengan impor sungguhan.
  const { buatMemori } = await import('@waris/data');
  repo = buatMemori({ sesi: { userId: 'kering', email: 'kering@lokal' }, peran: { kering: 'admin' } });
} else {
  const { masukSebagaiImpor } = await import('../pulihkan/masuk');
  ({ repo, url: tujuan } = await masukSebagaiImpor());
}
const hasil = await imporSoal(repo, daftarPaket, kering);
const cetak = (label: string, daftar: { slug: string }[]) => daftar.forEach(rencana => console.log(`${label}: ${rencana.slug}`));
cetak('baru', hasil.baru);
cetak('ubah', hasil.ubah);
cetak('sama (dilewati)', hasil.sama);
for (const { rencana, status } of hasil.dilewati) console.log(`DILEWATI (revisi '${status}' sedang direview, isinya beda): ${rencana.slug}`);
console.log(`\n${tujuan}: ${hasil.baru.length} baru, ${hasil.ubah.length} ubah, ${hasil.sama.length} sama, ${hasil.dilewati.length} dilewati ${kering ? '(kering, tidak ada yang ditulis)' : '(revisi baru berstatus diajukan)'}`);
