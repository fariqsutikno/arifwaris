// pnpm bank:kuis [--dari-sapuan] [--batas <n>] [--target <n>]
// Bangun indeks soal kuis angka (spec soal kuis §3.3): sapu kasus bank keluarga biasa, bentuk pertanyaan + pengecoh,
// terapkan kuota (tingkat, jenis pertanyaan, label utama), cetak statistik, tulis .bank/indeks-kuis.jsonl (folder di-gitignore).
// Sumber kasus: .bank/indeks-biasa.jsonl bila ada (keluaran bank:bangun); selain itu, atau dengan --dari-sapuan, penyapu langsung.
// Belum menulis ke basis data: memuat ke bank_soal adalah tahap K5.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  adalahLanjutan, bangunKuis, DAFTAR_ATURAN, sapuKasusBiasa, TARGET_TOTAL_KUIS, uraiKodeSoal, type BarisKuis, type KasusBiasa,
} from '@waris/latihan';

const argumen = process.argv.slice(2);
const nilaiOpsi = (nama: string): number | undefined => {
  const urutan = argumen.indexOf(nama);
  return urutan >= 0 ? Number(argumen[urutan + 1]) : undefined;
};
const BERKAS_BIASA = '.bank/indeks-biasa.jsonl';
const BERKAS_KUIS = '.bank/indeks-kuis.jsonl';
const batas = nilaiOpsi('--batas');
const target = nilaiOpsi('--target') ?? TARGET_TOTAL_KUIS;
const pakaiIndeks = !argumen.includes('--dari-sapuan') && existsSync(BERKAS_BIASA);

const kodeIndeks = pakaiIndeks
  ? readFileSync(BERKAS_BIASA, 'utf8').split('\n').flatMap(baris => /"kode":"(G1-B-[^"]+)"/.exec(baris)?.[1] ?? []).slice(0, batas)
  : [];
function* sumberKasus(): Generator<KasusBiasa> {
  if (!pakaiIndeks) { yield* sapuKasusBiasa(batas); return; }
  for (const kode of kodeIndeks) {
    const urai = uraiKodeSoal(kode);
    if (urai.ok && !adalahLanjutan(urai.kasus)) yield urai.kasus;
  }
}

const mulai = performance.now();
const detik = () => ((performance.now() - mulai) / 1000).toFixed(1);
const hasil = bangunKuis(sumberKasus, target, sudah => console.error(`  ${sudah} kasus, ${detik()} dtk`));

const hitung = (daftar: BarisKuis[], kunci: (baris: BarisKuis) => string[]) => {
  const peta = new Map<string, number>();
  for (const baris of daftar) for (const nama of kunci(baris)) peta.set(nama, (peta.get(nama) ?? 0) + 1);
  return [...peta.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
};
const cetak = (judul: string, baris: Array<[string, number]>) => {
  console.log(`\n${judul}`);
  for (const [nama, jumlah] of baris) console.log(`  ${nama.padEnd(34)} ${String(jumlah).padStart(8)}`);
};

console.log(`Sumber kasus        : ${pakaiIndeks ? BERKAS_BIASA : 'penyapu langsung'}`);
console.log(`Kasus disapu        : ${hasil.kasusDisapu}`);
console.log(`Kasus/soal dibuang  : ${JSON.stringify(hasil.dibuang)}`);
console.log(`Soal lolos (>=2 pengecoh sah): ${hasil.jumlahLolos}`);
console.log(`Setelah kuota       : ${hasil.terpilih.length} (target ${target})`);
cetak('Stok lolos per tingkat', hitungStok(1));
cetak('Stok lolos per jenis pertanyaan', hitungStok(2));
cetak('Pengecoh per aturan (soal lolos, sebelum kuota)', DAFTAR_ATURAN.map(aturan => [aturan, hasil.aturanLolos[aturan] ?? 0]));
cetak('Setelah kuota: per tingkat', hitung(hasil.terpilih, baris => [baris.tingkat]));
cetak('Setelah kuota: per jenis pertanyaan', hitung(hasil.terpilih, baris => [baris.jenis]));
cetak('Setelah kuota: per tingkat/jenis', hitung(hasil.terpilih, baris => [`${baris.tingkat}/${baris.jenis}`]));
cetak('Setelah kuota: per aturan (soal yang memakainya)', hitung(hasil.terpilih, baris => [...new Set(baris.aturan)]));
cetak('Setelah kuota: per tingkat/aturan', hitung(hasil.terpilih, baris => [...new Set(baris.aturan)].map(aturan => `${baris.tingkat}/${aturan}`)));
cetak('Setelah kuota: per modul', hitung(hasil.terpilih, baris => baris.modul.map(modul => `modul ${modul}`)));
console.log(`\nWaktu total ${detik()} dtk`);

mkdirSync('.bank', { recursive: true });
writeFileSync(BERKAS_KUIS, hasil.terpilih.map(isi => `${JSON.stringify({
  kode: isi.kode, jenis: isi.jenis, tingkat: isi.tingkat, modul: isi.modul, label_utama: isi.labelUtama, aturan: isi.aturan,
})}\n`).join(''));
console.log(`Indeks ditulis: ${BERKAS_KUIS} (${hasil.terpilih.length} baris)`);

/** Stok per bagian pertama (tingkat) atau kedua (jenis) kunci `tingkat/jenis/labelUtama`. */
function hitungStok(bagian: 1 | 2): Array<[string, number]> {
  const peta = new Map<string, number>();
  for (const [kunci, jumlah] of hasil.stokPerKelompok) { const nama = kunci.split('/')[bagian - 1]!; peta.set(nama, (peta.get(nama) ?? 0) + jumlah); }
  return [...peta.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}
