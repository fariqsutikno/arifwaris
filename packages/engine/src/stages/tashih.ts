import { fpb, nisab } from '@waris/math';
import type { IdKelompok, HubunganInkisar, IdOrang, LangkahJejak } from '../types.js';
import { jumlahBobot, type KelompokBagian } from './model.js';

const MAX_KELOMPOK_INKISAR = 4;   // [R10-3]

export interface Tashih {
  tashih: bigint;
  juzSahm: bigint;
  sahamKelompokIni: Record<IdKelompok, bigint>;
  perOrang: Record<IdOrang, bigint>;
  jejak: LangkahJejak[];
}

/**
 * Tahap 5 (bab 10.3): saham kelompok vs ru'us hanya lewat FPB (habis/tawafuq/tabayun); simpanan
 * digabung dengan nisab arba' → juz' as-sahm; tashih = dasar × juz'.
 */
export function terapkanTashih(daftarKelompok: KelompokBagian[], saham: Record<IdKelompok, bigint>, dasar: bigint): Tashih {
  const jejak: LangkahJejak[] = [];
  const simpanan: bigint[] = [];

  for (const kelompok of daftarKelompok) {
    const sahamKelompok = saham[kelompok.id]!;
    const ruus = jumlahBobot(kelompok);
    if (sahamKelompok === 0n || ruus <= 1n) continue;
    const faktor = fpb(sahamKelompok, ruus);
    const hubungan: HubunganInkisar = sahamKelompok % ruus === 0n ? 'habis' : faktor > 1n ? 'tawafuq' : 'tabayun';
    // Tawafuq → wafq ru'us; tabayun → seluruh ru'us (rumus sama: ru'us ÷ FPB).
    const disimpan = ruus / faktor;
    jejak.push({ tahap: 'tashih', refs: ['R10-2'], jenis: 'PERBANDINGAN_NISAB', tujuan: 'inkisar', kelompok: kelompok.id,
      a: sahamKelompok, b: ruus, hubungan, fpb: faktor, hasil: disimpan });
    if (hubungan !== 'habis') simpanan.push(disimpan);
  }
  if (simpanan.length > MAX_KELOMPOK_INKISAR) throw new Error(`invariant [R10-3]: inkisar pada ${simpanan.length} kelompok`);

  let juzSahm = simpanan[0] ?? 1n;
  for (const next of simpanan.slice(1)) {
    const { hubungan: hubungan, fpb: faktor, hasil: hasil } = nisab(juzSahm, next);
    jejak.push({ tahap: 'tashih', refs: ['R10-2', 'R10-1'], jenis: 'PERBANDINGAN_NISAB', tujuan: 'juzSahm', a: juzSahm, b: next, hubungan, fpb: faktor, hasil });
    juzSahm = hasil;
  }
  const tashih = dasar * juzSahm;
  if (juzSahm > 1n) jejak.push({ tahap: 'tashih', refs: ['R10-2'], jenis: 'TASHIH', dasar, juzSahm, hasil: tashih });

  const sahamKelompokIni: Record<IdKelompok, bigint> = {};
  const perOrang: Record<IdOrang, bigint> = {};
  for (const kelompok of daftarKelompok) {
    const total = saham[kelompok.id]! * juzSahm;
    const ruus = jumlahBobot(kelompok);
    sahamKelompokIni[kelompok.id] = total;
    for (const [idOrang, bobot] of Object.entries(kelompok.bobot)) {
      if ((total * bobot) % ruus !== 0n) throw new Error(`invariant: saham ${idOrang} tidak bulat setelah tashih`);
      perOrang[idOrang] = total * bobot / ruus;
    }
  }
  const jumlah = Object.values(perOrang).reduce((a, b) => a + b, 0n);
  if (jumlah !== tashih) throw new Error(`invariant (bab 10.5): Σ saham individu ${jumlah} ≠ tashih ${tashih}`);
  return { tashih, juzSahm, sahamKelompokIni, perOrang, jejak };
}
