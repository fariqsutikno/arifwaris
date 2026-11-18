// Peta warna per orang: satu sumber untuk avatar, kotak pohon, kotak warna di tabel, pita bagian, dan (nanti) kotak harta
// di mode Langkah demi langkah. Penerima diberi warna menurut urutan tampil di ringkasan, jadi dua penerima dalam satu kasus
// tidak pernah berwarna sama (sampai palet habis); yang tidak menerima berwarna netral.

import type { IdOrang } from '@waris/engine';
import type { RingkasanHasil } from './ringkasan';

/** Cukup gelap untuk huruf putih di avatar (acuan-hasil-final.html). */
const PALET_ORANG = ['#b5653a', '#7d3c98', '#3f6b2a', '#2b6f8a', '#a0567a', '#c0503a', '#5a6826', '#226a88', '#9c5219', '#3a58b8'] as const;
export const WARNA_NETRAL = '#9aa59e';

const petaPerRingkasan = new WeakMap<RingkasanHasil, Map<IdOrang, string>>();

export function warnaOrang(ringkasan: RingkasanHasil, id: IdOrang): string {
  let peta = petaPerRingkasan.get(ringkasan);
  if (!peta) {
    peta = new Map(ringkasan.penerima.map((orang, urutan) => [orang.id, PALET_ORANG[urutan % PALET_ORANG.length]!]));
    petaPerRingkasan.set(ringkasan, peta);
  }
  return peta.get(id) ?? WARNA_NETRAL;
}

/** Di luar layar hasil (belum ada ringkasan): warna tetap per nama, FNV-1a supaya nama mirip tetap berbeda. */
const acak = (teks: string) => [...teks].reduce((nilai, huruf) => Math.imul(nilai ^ huruf.codePointAt(0)!, 16777619) >>> 0, 2166136261);
export const warnaDariNama = (nama: string): string => PALET_ORANG[(acak(nama.trim()) >>> 13) % PALET_ORANG.length]!;

/** Peraga langkah menampilkan juga orang yang bukan penerima (janin, hilang, mitra kelas D): warna dari nama, kecuali bagian ditahan (netral). */
export function warnaPeraga(ringkasan: RingkasanHasil, id: IdOrang, nama: string): string {
  const warna = warnaOrang(ringkasan, id);
  return warna === WARNA_NETRAL && id !== 'ditahan' && !id.startsWith('sisaKeluar:') ? warnaDariNama(nama) : warna;
}
