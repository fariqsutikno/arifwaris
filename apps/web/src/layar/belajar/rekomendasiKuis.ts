// Paket kuis yang paling pantas dikerjakan berikutnya: yang belum pernah dicoba (urut bab), lalu yang nilai terbaiknya
// terendah. Paket yang sudah Sangat baik tidak disarankan; bila semuanya begitu, tidak ada rekomendasi.

import { bacaSkor, persenBulat, TANGGA_PREDIKAT } from '../../skorKuis';

export interface PaketKuis { kode: string; bab: number; jumlahSoal: number }
export type AlasanRekomendasi = 'belum_dicoba' | 'nilai_terendah';

const AMBANG_TUNTAS = TANGGA_PREDIKAT[TANGGA_PREDIKAT.length - 1]!.dari;

export function rekomendasiPaket(
  daftar: PaketKuis[], rekor: Record<string, { terbaik: string } | undefined>,
): { paket: PaketKuis; alasan: AlasanRekomendasi } | null {
  const urut = [...daftar].sort((a, b) => a.bab - b.bab);
  const belum = urut.find(paket => !rekor[paket.kode]);
  if (belum) return { paket: belum, alasan: 'belum_dicoba' };
  const persen = (paket: PaketKuis) => persenBulat(bacaSkor(rekor[paket.kode]!.terbaik) ?? { benar: 0, total: 1 });
  const terendah = urut.filter(paket => persen(paket) < AMBANG_TUNTAS).sort((a, b) => persen(a) - persen(b))[0];
  return terendah ? { paket: terendah, alasan: 'nilai_terendah' } : null;
}
