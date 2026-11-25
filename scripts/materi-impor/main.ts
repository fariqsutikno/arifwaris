// scripts/materi-impor/main.ts — `pnpm materi:impor <folder>... [--kering]`
// Memeriksa materi (sama dengan materi:cek; berhenti bila ada galat), lalu menulis revisi draf ke database lewat akun impor.
// `--kering`: hanya mencetak yang akan ditulis, tanpa masuk ke database.
import { cetakLaporan, periksaMateriKiriman } from '../materi-periksa';
import { imporMateri, type RepoImpor } from './tulis';

const argumen = process.argv.slice(2);
const kering = argumen.includes('--kering');
const sasaran = argumen.filter(isi => isi !== '--kering' && isi !== '--');
if (!sasaran.length) {
  console.error('pakai: pnpm materi:impor <folder|berkas.md>... [--kering]');
  process.exit(2);
}

const periksa = periksaMateriKiriman(sasaran);
cetakLaporan(periksa.laporan);
if (periksa.jumlahGalat) {
  console.error(`\n${periksa.jumlahGalat} galat: impor dibatalkan`);
  process.exit(1);
}

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
const hasil = await imporMateri(repo, periksa.pelajaran, kering);
const jumlah = (jenis: string) => hasil.ditulis.filter(rencana => rencana.jenis === jenis).length;
for (const rencana of hasil.ditulis) console.log(`${kering ? 'akan ditulis' : 'draf'}: ${rencana.jenis}/${rencana.slug} (${rencana.refs.length} ref)`);
for (const rencana of hasil.dilewati) console.log(`dilewati (isi sama): ${rencana.jenis}/${rencana.slug}`);
console.log(`\n${tujuan}: ${jumlah('materi')} pelajaran, ${jumlah('soal_kuis')} soal ${kering ? 'akan ditulis (kering, tidak ada yang ditulis)' : 'ditulis sebagai draf'}; ${hasil.dilewati.length} dilewati`);
