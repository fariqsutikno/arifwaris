// Skor kuis "benar/total" → persen, predikat, dan capaian terbaik per paket. Murni (tanpa I/O): dipakai papan kuis,
// layar hasil, dan penyimpanan rekor. Persen dibulatkan ke bawah supaya 89,5% tidak tampil 90% tanpa predikat Sangat baik.

export type Predikat = 'perlu_diulang' | 'cukup' | 'baik' | 'sangat_baik';

/** Urut dari terendah; `dari` = persen minimal predikat itu. */
export const TANGGA_PREDIKAT: ReadonlyArray<{ predikat: Predikat; dari: number }> = [
  { predikat: 'perlu_diulang', dari: 0 },
  { predikat: 'cukup', dari: 50 },
  { predikat: 'baik', dari: 70 },
  { predikat: 'sangat_baik', dari: 90 },
];

export interface Skor { benar: number; total: number }

export function bacaSkor(teks: string): Skor | null {
  const cocok = /^(\d+)\/(\d+)$/.exec(teks);
  if (!cocok) return null;
  const [benar, total] = [Number(cocok[1]), Number(cocok[2])];
  return total > 0 && benar <= total ? { benar, total } : null;
}

export const persenBulat = ({ benar, total }: Skor): number => Math.floor((benar * 100) / total);

export const predikatDari = (persen: number): Predikat =>
  [...TANGGA_PREDIKAT].reverse().find(tingkat => persen >= tingkat.dari)!.predikat;

/** Predikat di atas persen ini; kosong bila sudah tertinggi. */
export const targetBerikut = (persen: number): { predikat: Predikat; dari: number } | null =>
  TANGGA_PREDIKAT.find(tingkat => tingkat.dari > persen) ?? null;

/** Skor yang lebih baik dari dua skor (sama kuat → yang pertama); skor rusak kalah. */
export function skorTerbaik(lama: string | undefined, baru: string): string {
  const [skorLama, skorBaru] = [lama ? bacaSkor(lama) : null, bacaSkor(baru)];
  if (!skorBaru) return lama ?? baru;
  if (!skorLama) return baru;
  return skorBaru.benar * skorLama.total > skorLama.benar * skorBaru.total ? baru : lama!;
}

export interface Capaian {
  terbaik: string;
  persenTerbaik: number;
  /** Nilai sesi ini melampaui nilai terbaik sebelumnya (percobaan pertama selalu dihitung terbaik baru). */
  terbaikBaru: boolean;
  persenSebelumnya: number | null;
  /** Predikat naik ke tingkat lebih tinggi dibanding sebelum sesi ini. */
  predikatNaik: Predikat | null;
}

export function capaianKuis(terbaikSebelumnya: string | undefined, skorSesi: string): Capaian {
  const terbaik = skorTerbaik(terbaikSebelumnya, skorSesi);
  const sebelumnya = terbaikSebelumnya ? bacaSkor(terbaikSebelumnya) : null;
  const persenSebelumnya = sebelumnya ? persenBulat(sebelumnya) : null;
  const persenTerbaik = persenBulat(bacaSkor(terbaik) ?? { benar: 0, total: 1 });
  const terbaikBaru = terbaik === skorSesi && (persenSebelumnya === null || persenTerbaik > persenSebelumnya);
  const naik = persenSebelumnya === null || predikatDari(persenTerbaik) !== predikatDari(persenSebelumnya);
  return { terbaik, persenTerbaik, terbaikBaru, persenSebelumnya, predikatNaik: terbaikBaru && naik ? predikatDari(persenTerbaik) : null };
}
