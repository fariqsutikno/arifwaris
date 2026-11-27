// Penyaringan pengecoh dan urutan pilihan (spec soal kuis §3.2). Menerima kode kuis + fakta + pertanyaan; menyerahkan
// jawaban benar, pengecoh terpilih (2-3), dan urutan pilihan, semuanya deterministik dari kode (FNV, bukan Math.random).
// Soal dibuang (null) bila pengecoh sah kurang dari 2.

import { hashKode } from '../bangunBank.js';
import { semuaPengecoh, type Pengecoh } from './aturanPengecoh.js';
import { jawabanBenar, kunciJawaban, type FaktaKasus, type Jawaban } from './fakta.js';
import type { PertanyaanKuis } from './kodeKuis.js';

export const MIN_PENGECOH = 2;
export const MAKS_PENGECOH = 3;

export type PilihanKuis = { benar: Jawaban; pengecoh: Pengecoh[]; urutan: Array<{ jawaban: Jawaban; pengecoh?: Pengecoh }> };

export function rakitPilihan(kode: string, fakta: FaktaKasus, tanya: PertanyaanKuis): PilihanKuis | null {
  const benar = jawabanBenar(fakta, tanya);
  const sudahAda = new Set([kunciJawaban(benar)]);
  const sah = semuaPengecoh(fakta, tanya).filter(isi => {
    const kunci = kunciJawaban(isi.jawaban);
    if (sudahAda.has(kunci)) return false;
    sudahAda.add(kunci);
    return true;
  });
  if (sah.length < MIN_PENGECOH) return null;
  // Pengecoh yang dipakai dipilih dari hash kode supaya tiap aturan kebagian soal, bukan yang di depan tabel saja.
  const hashPengecoh = (isi: Pengecoh) => hashKode(`${kode}|${isi.aturan}|${kunciJawaban(isi.jawaban)}`);
  const pengecoh = [...sah].sort((a, b) => hashPengecoh(a) - hashPengecoh(b)).slice(0, MAKS_PENGECOH);
  const urutan = [{ jawaban: benar }, ...pengecoh.map(isi => ({ jawaban: isi.jawaban, pengecoh: isi }))]
    .sort((a, b) => hashKode(`${kode}|pilihan|${kunciJawaban(a.jawaban)}`) - hashKode(`${kode}|pilihan|${kunciJawaban(b.jawaban)}`));
  return { benar, pengecoh, urutan };
}
