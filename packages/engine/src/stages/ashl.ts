// Tahap 3 — Ashlul mas'alah (bab 9.1): penyebut bersama, lalu saham tiap kelompok.
//   Masuk : kelompok dengan bagiannya (fardh / ashabah / bagian tetap bab 08).
//   Keluar: ashl, saham per kelompok, jejak perbandingan nisab.
// Alurnya: gabungkan semua penyebut fardh dengan nisab arba' → ashl; tiap fardh jadi saham;
// ashabah mengambil sisa (0 bila habis — kelebihan furudh diurus 'aul di tahap 4).

import { nisab } from '@waris/math';
import type { IdKelompok, LangkahJejak } from '../types.js';
import { pecahanTetapDari, penerimaSisa, jumlahBobot, type Masalah, type KelompokBagian } from './model.js';

const VALID_USUL = [2n, 3n, 4n, 6n, 8n, 12n, 24n];   // [R09-1]

export function hitungAshl(daftarKelompok: KelompokBagian[]): Masalah & { jejak: LangkahJejak[] } {
  const jejak: LangkahJejak[] = [];
  const saham: Record<IdKelompok, bigint> = {};
  const daftarPecahan = daftarKelompok.flatMap(kelompok => {
    const pecahan = pecahanTetapDari(kelompok.bagian);
    return pecahan ? [{ kelompok, pecahan }] : [];
  });

  if (daftarPecahan.length === 0) {
    // [R09-2] semua ashabah: ashl = jumlah ru'us (lk 2, pr 1).
    for (const kelompok of daftarKelompok) saham[kelompok.id] = jumlahBobot(kelompok);
    return { daftarKelompok, ashl: Object.values(saham).reduce((a, b) => a + b, 0n), saham, jejak };
  }

  // [R10-1] penyebut-penyebut digabung dengan nisab arba'; tiap perbandingan dicatat.
  const daftarPenyebut = [...new Set(daftarPecahan.map(({ pecahan }) => pecahan.d))];
  let ashl = daftarPenyebut[0]!;
  for (const penyebut of daftarPenyebut.slice(1)) {
    const { hubungan, fpb, hasil } = nisab(ashl, penyebut);
    jejak.push({ tahap: 'ashl', refs: ['R10-1', 'R09-1'], jenis: 'PERBANDINGAN_NISAB', tujuan: 'ashl', a: ashl, b: penyebut, hubungan, fpb, hasil });
    ashl = hasil;
  }
  // Bagian tetap bab 08 (1/3 sisa, muqasamah) bisa menghasilkan 18, 36, atau penyebut lain → di luar tujuh ashl.
  const kakekDapatBagian = daftarKelompok.some(kelompok => kelompok.bagian.jenis === 'tetap');
  if (!kakekDapatBagian && !VALID_USUL.includes(ashl)) throw new Error(`invariant [R09-1]: ashl ${ashl} di luar tujuh ashl`);

  let sahamTetap = 0n;
  for (const { kelompok, pecahan } of daftarPecahan) {
    const sahamKelompok = pecahan.n * ashl / pecahan.d;
    saham[kelompok.id] = sahamKelompok;
    sahamTetap += sahamKelompok;   // termasuk bagian fardh ayah/kakek (fardhAshabah)
  }
  const sisa = ashl - sahamTetap;
  for (const kelompok of daftarKelompok.filter(penerimaSisa)) {
    saham[kelompok.id] = (saham[kelompok.id] ?? 0n) + (sisa > 0n ? sisa : 0n);
  }
  return { daftarKelompok, ashl, saham, jejak };
}
