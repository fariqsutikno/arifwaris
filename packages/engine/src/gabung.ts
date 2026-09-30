// Penggabungan mas'alah bertingkat (bab 12.3): saham seorang "mayit" di jami'ah dibandingkan dengan mas'alah-nya
// (habis / tawafuq / tabayun), lalu jami'ah diperbesar. Dipakai munasakhat dan dzawil arham (bagian perantara →
// penerimanya; sisa pasangan → mas'alah dzawil arham [R14-12]).

import { fpb } from '@waris/math';
import type { HasilEngine, HubunganInkisar, IdOrang, IdSisaKeluar } from './types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
export type Saham = Record<string, bigint>;

export const AWALAN_SISA = 'sisaKeluar:';
export const idSisaKeluar = (mayit: IdOrang): IdSisaKeluar => `${AWALAN_SISA}${mayit}`;

/** Saham mas'alah seorang mayit, termasuk sisa yang keluar [R09-9] supaya jumlahnya = tashih. */
export function sahamDari(mayit: IdOrang, hasil: HasilOk): Saham {
  const saham: Saham = {};
  for (const barisTabel of hasil.tabel.baris) {
    for (const [idOrang, selOrang] of Object.entries(barisTabel.perOrang)) {
      if (selOrang.saham > 0n) saham[idOrang] = selOrang.saham;
    }
  }
  if (hasil.sisaKeluar) saham[idSisaKeluar(mayit)] = hasil.sisaKeluar.saham;
  return saham;
}

export const totalSaham = (saham: Saham): bigint => Object.values(saham).reduce((a, b) => a + b, 0n);

export interface HasilGabung {
  saham: Saham;
  sahamMayit: bigint;
  masalah: bigint;
  hubungan: HubunganInkisar;
  fpb: bigint;
  wafqMasalah: bigint;
  wafqSaham: bigint;
  jamiah: bigint;
  /** Per orang: saham sebelum × wafqMasalah + saham dari mayit × wafqSaham = sesudah. */
  rincian: Record<string, { sebelum: bigint; dariMayit: bigint; sesudah: bigint }>;
}

/**
 * [R12-2] Saham mayit di jami'ah sejauh ini vs mas'alah-nya: habis / tawafuq / tabayun, tanpa tadakhul.
 * Jami'ah baru = jami'ah × wafq mas'alah; saham mas'alah mayit × wafq saham.
 */
export function gabungkan(saham: Saham, jamiah: bigint, mayit: string, sahamMasalah: Saham, masalah: bigint): HasilGabung {
  const sahamMayit = saham[mayit]!;
  const faktor = fpb(sahamMayit, masalah);
  const wafqMasalah = masalah / faktor;
  const wafqSaham = sahamMayit / faktor;
  const hubungan: HubunganInkisar = sahamMayit % masalah === 0n ? 'habis' : faktor === 1n ? 'tabayun' : 'tawafuq';

  const rincian: HasilGabung['rincian'] = {};
  for (const [idOrang, nilai] of Object.entries(saham)) {
    if (idOrang !== mayit) rincian[idOrang] = { sebelum: nilai, dariMayit: 0n, sesudah: nilai * wafqMasalah };
  }
  for (const [idOrang, nilai] of Object.entries(sahamMasalah)) {
    const rincianOrang = rincian[idOrang] ?? { sebelum: 0n, dariMayit: 0n, sesudah: 0n };
    rincian[idOrang] = { ...rincianOrang, dariMayit: nilai, sesudah: rincianOrang.sesudah + nilai * wafqSaham };
  }
  const sahamBaru: Saham = Object.fromEntries(Object.entries(rincian).map(([idOrang, rincianOrang]) => [idOrang, rincianOrang.sesudah]));
  return { saham: sahamBaru, sahamMayit, masalah, hubungan, fpb: faktor, wafqMasalah, wafqSaham, jamiah: jamiah * wafqMasalah, rincian };
}

export function periksaInvarian(saham: Saham, jamiah: bigint, konteks: string): void {
  if (totalSaham(saham) !== jamiah) throw new Error(`invariant ${konteks}: Σ saham ${totalSaham(saham)} ≠ jami'ah ${jamiah}`);
  if (Object.values(saham).some(nilai => nilai <= 0n)) throw new Error(`invariant ${konteks}: ada saham ≤ 0`);
}
