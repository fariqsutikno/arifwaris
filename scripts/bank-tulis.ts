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

export async function tulisBerkasIndeks(
  repo: RepositoriBankSoal, berkas: string, progres: (ditulis: number) => void = () => {},
): Promise<number> {
  if (!existsSync(berkas)) throw new Error(`berkas tidak ada: ${berkas} (jalankan pnpm bank:bangun --kering dulu)`);
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
    batch.push(keBarisBank(JSON.parse(baris) as BarisIndeks));
    if (batch.length >= UKURAN_BATCH_SIMPAN_BANK) await kosongkan();
  }
  if (batch.length) await kosongkan();
  return ditulis;
}
