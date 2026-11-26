// pnpm bank:bangun [--kering | --dari-berkas | --ke-lokal | --ya] [--keluarga <nama|semua>] [--batas <n>] [--target <n>]
// Sapu keluarga (biasa, munasakhat, gharqa, mafqud, khuntsa, haml, dzawilArham; bawaan semua), saring lewat engine,
// terapkan kuota, cetak statistik, dan tulis indeks lokal per keluarga ke .bank/indeks-<keluarga>.jsonl (folder di-gitignore).
//   --kering       berhenti di berkas indeks, tidak menyentuh basis data.
//   (tanpa --kering) lalu tulis berkas itu ke tabel bank_soal lewat peran impor (upsert per batch, idempoten).
//   --dari-berkas  lewati sapuan, tulis langsung dari berkas yang sudah ada; cara melanjutkan jalan yang terputus.
//   --ke-lokal     wajib Supabase lokal (SUPABASE_URL localhost/127.0.0.1); tanpa ini dan tanpa --ya, tujuan jarak jauh ditolak.
// `--batas` memotong sapuan tiap keluarga (uji cepat); `--target` = target total keluarga biasa (lanjutan: KUOTA_KELUARGA_LANJUTAN).
import { closeSync, mkdirSync, openSync, writeSync } from 'node:fs';
import {
  bangunBankDariKode, DAFTAR_KELUARGA_LANJUTAN, keKandidat, KELUARGA_BIASA_NAMA, KUOTA_KELUARGA_LANJUTAN, sapuKasusBiasa, sapuKasusLanjutan,
  TARGET_TOTAL_SOAL, type BarisBank, type KandidatKode, type NamaKeluargaLanjutan,
} from '@waris/latihan';

const argumen = process.argv.slice(2);
const nilaiTeks = (nama: string): string | undefined => {
  const urutan = argumen.indexOf(nama);
  return urutan >= 0 ? argumen[urutan + 1] : undefined;
};
const nilaiOpsi = (nama: string): number | undefined => {
  const teks = nilaiTeks(nama);
  return teks === undefined ? undefined : Number(teks);
};

const SEMUA_KELUARGA = [KELUARGA_BIASA_NAMA, ...DAFTAR_KELUARGA_LANJUTAN];
const keluargaOpsi = nilaiTeks('--keluarga') ?? 'semua';
const kering = argumen.includes('--kering');
const dariBerkas = argumen.includes('--dari-berkas');
if ((kering && dariBerkas) || (keluargaOpsi !== 'semua' && !SEMUA_KELUARGA.includes(keluargaOpsi))) {
  console.error(`Pakai: pnpm bank:bangun [--kering | --dari-berkas] [--ke-lokal | --ya] [--keluarga ${['semua', ...SEMUA_KELUARGA].join('|')}] [--batas n] [--target n]`);
  process.exit(1);
}
const keluargaDisapu = keluargaOpsi === 'semua' ? SEMUA_KELUARGA : [keluargaOpsi];
const batas = nilaiOpsi('--batas');

function* sapuDipilih(): Generator<KandidatKode> {
  for (const keluarga of keluargaDisapu) {
    if (keluarga === KELUARGA_BIASA_NAMA) for (const kasus of sapuKasusBiasa(batas)) yield keKandidat(kasus);
    else yield* sapuKasusLanjutan(keluarga as NamaKeluargaLanjutan, batas);
  }
}

function sapuKeBerkas() {
  const mulai = performance.now();
  const detik = () => ((performance.now() - mulai) / 1000).toFixed(1);
  const memoriMb = () => Math.round(process.memoryUsage().rss / 1048576);
  let puncakMemoriMb = 0;
  const target = nilaiOpsi('--target') ?? TARGET_TOTAL_SOAL;
  const { terpilih, kandidat, jumlahLolos, dibuang, stokPerKelompok, perKeluarga } = bangunBankDariKode(
    sapuDipilih, target,
    sudah => { puncakMemoriMb = Math.max(puncakMemoriMb, memoriMb()); console.error(`  ${sudah} kandidat, ${detik()} dtk, rss ${memoriMb()} MB`); },
  );
  puncakMemoriMb = Math.max(puncakMemoriMb, memoriMb());

  const hitung = (daftar: BarisBank[], kunci: (baris: BarisBank) => string[]) => {
    const peta = new Map<string, number>();
    for (const baris of daftar) for (const nama of kunci(baris)) peta.set(nama, (peta.get(nama) ?? 0) + 1);
    return [...peta.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  };
  const cetak = (judul: string, baris: [string, number][]) => {
    console.log(`\n${judul}`);
    for (const [nama, jumlah] of baris) console.log(`  ${nama.padEnd(28)} ${String(jumlah).padStart(9)}`);
  };
  const stokPerTingkat = new Map<string, number>();
  for (const [kunci, jumlah] of stokPerKelompok) { const tingkat = kunci.split('/')[0]!; stokPerTingkat.set(tingkat, (stokPerTingkat.get(tingkat) ?? 0) + jumlah); }
  const stokTerurut = [...stokPerKelompok.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));

  console.log(`Keluarga disapu     : ${keluargaDisapu.join(', ')}`);
  console.log(`Kandidat disapu     : ${kandidat}`);
  console.log(`Lolos engine        : ${jumlahLolos}`);
  console.log(`Dibuang per alasan  : ${JSON.stringify(dibuang)}`);
  console.log(`Setelah kuota       : ${terpilih.length} (target ${target})`);
  cetak('Per keluarga: stok lolos engine', [...perKeluarga].map(([nama, isi]) => [nama, isi.stok] as [string, number]));
  cetak('Per keluarga: setelah kuota', [...perKeluarga].map(([nama, isi]) => [nama, isi.terpilih] as [string, number]));
  console.log(`  (kuota lanjutan: ${JSON.stringify(KUOTA_KELUARGA_LANJUTAN)})`);
  cetak('Sebaran tingkat (lolos engine)', [...stokPerTingkat.entries()]);
  cetak('Sebaran tingkat (setelah kuota)', hitung(terpilih, baris => [baris.tingkat]));
  cetak('Sebaran modul (setelah kuota)', hitung(terpilih, baris => baris.modul.map(modul => `modul ${modul}`)));
  cetak('20 label teratas (setelah kuota)', hitung(terpilih, baris => baris.label.filter(token => !token.startsWith('jumlahAhliWaris:'))).slice(0, 20));
  cetak('Label utama (lolos engine), 20 teratas', stokTerurut.slice(0, 20));
  cetak('Label utama (setelah kuota), 20 teratas', hitung(terpilih, baris => [`${baris.tingkat}/${baris.labelUtama}`]).slice(0, 20));
  console.log(`\nWaktu total ${detik()} dtk, puncak rss yang teramati ${puncakMemoriMb} MB`);

  mkdirSync('.bank', { recursive: true });
  const UKURAN_POTONGAN_TULIS = 50_000;
  for (const keluarga of keluargaDisapu) {
    const baris = terpilih.filter(isi => isi.keluarga === keluarga);
    const berkas = openSync(BERKAS_INDEKS(keluarga), 'w');
    for (let awal = 0; awal < baris.length; awal += UKURAN_POTONGAN_TULIS) {
      writeSync(berkas, baris.slice(awal, awal + UKURAN_POTONGAN_TULIS).map(isi => JSON.stringify({
        kode: isi.kode, keluarga: isi.keluarga, label: isi.label, tingkat: isi.tingkat, modul: isi.modul, jumlah_ahli_waris: isi.jumlahAhliWaris,
      }) + '\n').join(''));
    }
    closeSync(berkas);
    console.log(`Indeks ditulis: ${BERKAS_INDEKS(keluarga)} (${baris.length} baris)`);
  }
}

const BERKAS_INDEKS = (keluarga: string) => `.bank/indeks-${keluarga}.jsonl`;
const HOST_LOKAL = ['localhost', '127.0.0.1', '[::1]'];

async function tulisKeBasisData() {
  const { masukSebagaiImpor } = await import('./pulihkan/masuk');
  const { buatBankSupabase } = await import('@waris/data');
  const { tulisBerkasIndeks } = await import('./bank-tulis');
  // Cek tujuan sebelum akun impor disiapkan; env dimuat masuk.ts (shell menang atas scripts/.env).
  const periksaTujuan = (tujuan: string) => {
    const host = new URL(tujuan).hostname;
    const lokal = HOST_LOKAL.includes(host);
    if (argumen.includes('--ke-lokal') && !lokal) throw new Error(`--ke-lokal tetapi SUPABASE_URL mengarah ke ${host}`);
    if (!lokal && !argumen.includes('--ya')) throw new Error(`tujuan jarak jauh (${host}): ulangi dengan --ya bila memang sengaja`);
  };
  const { url, klien } = await masukSebagaiImpor(periksaTujuan);
  const repo = buatBankSupabase(klien);
  console.log(`Menulis ke ${url}`);
  for (const keluarga of keluargaDisapu) {
    const ditulis = await tulisBerkasIndeks(repo, BERKAS_INDEKS(keluarga), sudah => process.stderr.write(`\r  ${keluarga}: ${sudah} baris`));
    console.log(`\n${keluarga}: ${ditulis} baris ditulis`);
  }
}

if (!dariBerkas) sapuKeBerkas();
if (!kering) await tulisKeBasisData();
