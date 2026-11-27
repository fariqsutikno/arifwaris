// scripts/bank-tulis.ts
// Pengisi bank soal: membaca .bank/indeks-<keluarga>.jsonl (keluaran sapuan bank:bangun) baris demi baris dan menulisnya
// ke repository bank per batch. Upsert idempoten per kode, jadi jalan yang terputus cukup diulang (`--dari-berkas`).
import { createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { UKURAN_BATCH_SIMPAN_BANK, type BarisBankSoal, type RepositoriBankSoal, type TingkatBank } from '@waris/data';

/** Satu baris berkas indeks, seperti yang ditulis bank-bangun.ts. */
export type BarisIndeks = { kode: string; keluarga: string; label: string[]; tingkat: TingkatBank; modul: number[]; jumlah_ahli_waris: number };

const POLA_VERSI = /^G(\d+)-/;
const POLA_MAYIT = /^(?:munasakhat|mayit):(\d+)$/;

/** versi_generator dari awalan kode; jumlah_mayit dari label munasakhat:<n> / mayit:<n> (kasus lain = 1 mayit). */
export function keBarisBank(indeks: BarisIndeks): BarisBankSoal {
  const versi = POLA_VERSI.exec(indeks.kode)?.[1];
  if (!versi) throw new Error(`kode tanpa versi generator: ${indeks.kode}`);
  const jumlahMayit = indeks.label.map(token => POLA_MAYIT.exec(token)?.[1]).find(angka => angka !== undefined);
  return {
    kode: indeks.kode, versiGenerator: Number(versi), keluarga: indeks.keluarga, tingkat: indeks.tingkat, modul: indeks.modul,
    label: indeks.label, jumlahMayit: jumlahMayit ? Number(jumlahMayit) : 1, jumlahAhliWaris: indeks.jumlah_ahli_waris,
  };
}

export const BERKAS_INDEKS_KUIS = '.bank/indeks-kuis.jsonl';
/** Soal kuis angka bersumber kasus keluarga biasa (spec soal kuis 3.3). */
const KELUARGA_KUIS = 'biasa';
const POLA_VERSI_KUIS = /^K(\d+)-/;

/** Satu baris .bank/indeks-kuis.jsonl, seperti yang ditulis bank-kuis.ts. */
export type BarisIndeksKuis = { kode: string; jenis: string; tingkat: TingkatBank; modul: number[]; label_utama: string; aturan: string[] };

export function keBarisKuis(indeks: BarisIndeksKuis): BarisBankSoal {
  const versi = POLA_VERSI_KUIS.exec(indeks.kode)?.[1];
  if (!versi) throw new Error(`kode kuis tanpa versi: ${indeks.kode}`);
  return {
    kode: indeks.kode, versiGenerator: Number(versi), keluarga: KELUARGA_KUIS, tingkat: indeks.tingkat, modul: indeks.modul,
    label: [indeks.label_utama, `jenis:${indeks.jenis}`], jumlahMayit: 1, jumlahAhliWaris: 0, bentuk: 'kuis', aturan: indeks.aturan,
  };
}

export const tulisIndeksKuis = (repo: RepositoriBankSoal, berkas: string, progres?: (ditulis: number) => void) =>
  tulisBerkas(repo, berkas, baris => keBarisKuis(JSON.parse(baris) as BarisIndeksKuis), progres);

export const tulisBerkasIndeks = (repo: RepositoriBankSoal, berkas: string, progres?: (ditulis: number) => void) =>
  tulisBerkas(repo, berkas, baris => keBarisBank(JSON.parse(baris) as BarisIndeks), progres);

async function tulisBerkas(
  repo: RepositoriBankSoal, berkas: string, urai: (baris: string) => BarisBankSoal, progres: (ditulis: number) => void = () => {},
): Promise<number> {
  if (!existsSync(berkas)) throw new Error(`berkas tidak ada: ${berkas} (jalankan pnpm bank:bangun --kering atau pnpm bank:kuis dulu)`);
  let batch: BarisBankSoal[] = [];
  let ditulis = 0;
  const kosongkan = async () => {
    await repo.simpan(batch);
    ditulis += batch.length;
    batch = [];
    progres(ditulis);
  };
  for await (const baris of createInterface({ input: createReadStream(berkas), crlfDelay: Infinity })) {
    if (!baris) continue;
    batch.push(urai(baris));
    if (batch.length >= UKURAN_BATCH_SIMPAN_BANK) await kosongkan();
  }
  if (batch.length) await kosongkan();
  return ditulis;
}
