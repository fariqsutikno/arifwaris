// scripts/soal-cek.ts — `pnpm soal:cek <berkas|folder>... [--json]`
// Memeriksa paket soal pilihan ganda kiriman (docs/soal-kit/format-soal.md) lewat soal-periksa.ts. Galat → kode keluar 1.
import { cetakLaporan } from './materi-periksa';
import { periksaSoalKiriman } from './soal-periksa';

const argumen = process.argv.slice(2);
const modeJson = argumen.includes('--json');
const sasaran = argumen.filter(isi => isi !== '--json' && isi !== '--');
if (!sasaran.length) {
  console.error('pakai: pnpm soal:cek <berkas.md|folder>... [--json]');
  process.exit(2);
}

const { laporan, jumlahGalat, jumlahPeringatan } = periksaSoalKiriman(sasaran);
if (modeJson) {
  console.log(JSON.stringify(laporan, null, 2));
} else {
  cetakLaporan(laporan);
  console.log(`\n${laporan.length} berkas, ${jumlahGalat} galat, ${jumlahPeringatan} peringatan`);
}
process.exit(jumlahGalat ? 1 : 0);
