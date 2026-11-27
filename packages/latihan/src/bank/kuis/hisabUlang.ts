// Hisab ulang dunia yang keliru: bagian tiap baris dan penyebut akhir bila satu fardh diganti (salah paham pelajar).
// Menerima FaktaKasus + fardh pengganti per baris; menyerahkan hasil, atau null bila dunia keliru itu butuh radd
// atau kaidah lain yang tidak dihitung di sini (tidak ditebak). Hanya hisab furudh dan 'aul; hukumnya tetap milik engine.
// Uji kesetaraan: tanpa pengganti, hasilnya harus sama dengan engine (hisabUlang.test.ts).

import { kpk, kurang, pecahan, tambah, bagi, bandingkan, type Pecahan } from '@waris/math';
import type { FaktaKasus } from './fakta.js';

/** [R09-4] ashl yang boleh 'aul dan penyebut hasilnya. */
const AUL_SAH: Readonly<Record<string, readonly bigint[]>> = { 6: [7n, 8n, 9n, 10n], 12: [13n, 15n, 17n], 24: [27n] };

export type HasilHisab = { bagianBaris: Map<string, Pecahan>; penyebut: bigint };

const NOL = pecahan(0n);
const SATU = pecahan(1n);

export function hisabUlang(fakta: FaktaKasus, pengganti: Record<string, Pecahan> = {}): HasilHisab | null {
  if (fakta.istimewa) return null;
  const fardhBaru = fakta.baris.map(isi => pengganti[isi.id] ?? isi.fardh);
  const daftarFardh = fardhBaru.filter((fardh): fardh is Pecahan => !!fardh);
  if (daftarFardh.length === 0) return null;
  const barisAshabah = fakta.baris.filter(isi => isi.ashabah);
  if (barisAshabah.length > 1) return null;

  const jumlah = daftarFardh.reduce(tambah, NOL);
  const ashlBaru = daftarFardh.reduce((hasil, fardh) => kpk(hasil, fardh.d), 1n);
  const adaAshabah = barisAshabah.length === 1;
  const urutan = bandingkan(jumlah, SATU);
  // Sisa zawjiyyah dan radd tidak dihitung di sini: dunia keliru yang butuh radd tidak dipakai.
  if (urutan < 0 && !adaAshabah) return null;

  let penyebut = ashlBaru;
  if (urutan > 0) {
    penyebut = ashlBaru * jumlah.n / jumlah.d;
    if (!AUL_SAH[String(ashlBaru)]?.includes(penyebut)) return null;
  }
  const skala = urutan > 0 ? jumlah : SATU;
  const sisa = urutan < 0 ? kurang(SATU, jumlah) : NOL;
  const bagianBaris = new Map(fakta.baris.map((isi, urutanBaris) => {
    const fardh = fardhBaru[urutanBaris] ?? NOL;
    return [isi.id, bagi(tambah(fardh, isi.ashabah ? sisa : NOL), skala)] as const;
  }));
  return { bagianBaris, penyebut };
}
