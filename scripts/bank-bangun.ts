// pnpm bank:bangun --kering [--batas <n>] [--target <n>]
// Sapu keluarga biasa, saring lewat engine, terapkan kuota, cetak statistik, dan tulis indeks lokal ke
// .bank/indeks-biasa.jsonl (bahan G4; folder di-gitignore). Belum menyentuh basis data: hanya mode --kering.
import { mkdirSync, writeFileSync } from 'node:fs';
import { sapuKasusBiasa, saringKandidat, terapkanKuota, TARGET_TOTAL_SOAL, type BarisBank } from '@waris/latihan';

const argumen = process.argv.slice(2);
const nilaiOpsi = (nama: string): number | undefined => {
  const urutan = argumen.indexOf(nama);
  return urutan >= 0 ? Number(argumen[urutan + 1]) : undefined;
};

if (!argumen.includes('--kering')) {
  console.error('Baru mode --kering yang ada (tanpa tulis basis data). Pakai: pnpm bank:bangun --kering [--batas n] [--target n]');
  process.exit(1);
}

const mulai = performance.now();
const detik = () => ((performance.now() - mulai) / 1000).toFixed(1);
const { lolos, kandidat, dibuang } = saringKandidat(sapuKasusBiasa(nilaiOpsi('--batas')), sudah => console.error(`  ${sudah} kandidat, ${detik()} dtk`));
const waktuSaring = detik();
const terpilih = terapkanKuota(lolos, nilaiOpsi('--target') ?? TARGET_TOTAL_SOAL);

const hitung = (daftar: BarisBank[], kunci: (baris: BarisBank) => string[]) => {
  const peta = new Map<string, number>();
  for (const baris of daftar) for (const nama of kunci(baris)) peta.set(nama, (peta.get(nama) ?? 0) + 1);
  return [...peta.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
};
const cetak = (judul: string, baris: [string, number][]) => {
  console.log(`\n${judul}`);
  for (const [nama, jumlah] of baris) console.log(`  ${nama.padEnd(28)} ${String(jumlah).padStart(9)}`);
};

console.log(`Kandidat disapu     : ${kandidat}`);
console.log(`Lolos engine        : ${lolos.length}`);
console.log(`Dibuang per alasan  : ${JSON.stringify(dibuang)}`);
console.log(`Setelah kuota       : ${terpilih.length} (target ${nilaiOpsi('--target') ?? TARGET_TOTAL_SOAL})`);
cetak('Sebaran tingkat (lolos engine)', hitung(lolos, baris => [baris.tingkat]));
cetak('Sebaran tingkat (setelah kuota)', hitung(terpilih, baris => [baris.tingkat]));
cetak('Sebaran modul (setelah kuota)', hitung(terpilih, baris => baris.modul.map(modul => `modul ${modul}`)));
cetak('20 label teratas (setelah kuota)', hitung(terpilih, baris => baris.label.filter(token => !token.startsWith('jumlahAhliWaris:'))).slice(0, 20));
cetak('Label utama (lolos engine), 20 teratas', hitung(lolos, baris => [`${baris.tingkat}/${baris.labelUtama}`]).slice(0, 20));
console.log(`\nWaktu: saring ${waktuSaring} dtk, total ${detik()} dtk`);

mkdirSync('.bank', { recursive: true });
writeFileSync('.bank/indeks-biasa.jsonl', terpilih.map(baris => JSON.stringify({
  kode: baris.kode, label: baris.label, tingkat: baris.tingkat, modul: baris.modul, jumlah_ahli_waris: baris.jumlahAhliWaris,
})).join('\n') + '\n');
console.log(`Indeks ditulis: .bank/indeks-biasa.jsonl (${terpilih.length} baris)`);
