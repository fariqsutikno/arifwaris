// scripts/materi-cek.ts — `pnpm materi:cek <berkas|folder>... [--json]`
// Memeriksa berkas materi kiriman (docs/materi-kit/format-materi.md) lewat materi-periksa.ts. Galat → kode keluar 1.
import { cetakLaporan, periksaMateriKiriman } from './materi-periksa';

const argumen = process.argv.slice(2);
const modeJson = argumen.includes('--json');
const sasaran = argumen.filter(isi => isi !== '--json' && isi !== '--');
if (!sasaran.length) {
  console.error('pakai: pnpm materi:cek <berkas.md|folder>... [--json]');
  process.exit(2);
}

const { laporan, jumlahGalat, jumlahPeringatan } = periksaMateriKiriman(sasaran);
if (modeJson) {
  console.log(JSON.stringify(laporan, null, 2));
} else {
  cetakLaporan(laporan);
  console.log(`\n${laporan.length} berkas, ${jumlahGalat} galat, ${jumlahPeringatan} peringatan`);
}
process.exit(jumlahGalat ? 1 : 0);
