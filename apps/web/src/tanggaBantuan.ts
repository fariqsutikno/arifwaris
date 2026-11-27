// Aturan tangga bantuan soal hitung di sisi layar (spec tangga-bantuan-soal bagian 4, 5, 7).
//   Menerima: hasil per kolom (nilaiSemuaKolom), kolom yang sudah dibuka, dan isian pelajar.
//   Memutuskan: kolom sasaran tangga, isian efektif (kolom dibuka dianggap benar), predikat soal, penanda XP.
//   Menyerahkan: nilai murni ke TabelLatihan dan Hasil; XP sebenarnya tetap dihitung server (xp_soal_baru).

import { pecahXp, type HasilKolom, type IsianTabel, type TabelSoal } from '@waris/latihan';

/** Usaha (Periksa salah/belum lengkap) sebelum tautan "Butuh petunjuk?" muncul di kolom pertama. */
export const USAHA_SEBELUM_PETUNJUK = 2;
/** Periksa salah sebelum benar pertama yang masih menyisakan bonus mandiri; sama dengan SQL dan `xpSoal`. */
export const SALAH_MAKS_MANDIRI = 3;
export const KATA_HANGUS = 'hangus';
export const ID_KOLOM_PENGALI = 'pengali';

export type PredikatSoal = 'mandiri' | 'petunjuk' | 'dibuka';

/** Kolom pertama yang belum benar dan belum dibuka; null = tidak ada lagi yang perlu bantuan. */
export function kolomSasaran(hasil: readonly HasilKolom[], dibuka: ReadonlySet<string>): string | null {
  return hasil.find(kolom => kolom.status !== 'benar' && !dibuka.has(kolom.idKolom))?.idKolom ?? null;
}

/** Isian dengan kunci kolom-kolom yang dibuka, supaya penilaian menganggap kolom itu benar. Isian pelajar sendiri tidak diubah. */
export function isianDenganKolomDibuka(tabel: TabelSoal, isian: IsianTabel, dibuka: ReadonlySet<string>): IsianTabel {
  if (dibuka.size === 0) return isian;
  const sel = { ...isian.sel };
  const kepala = { ...isian.kepala };
  let pengali = isian.pengali;
  for (const idKolom of dibuka) {
    if (idKolom === ID_KOLOM_PENGALI && tabel.pengali) {
      pengali = { ...pengali, ...Object.fromEntries(Object.entries(tabel.pengali.kunci).map(([id, nilai]) => [id, String(nilai)])) };
      continue;
    }
    const kolom = tabel.kolom.find(kandidat => kandidat.id === idKolom);
    if (!kolom) continue;
    for (const baris of tabel.baris) if (baris.kunci[idKolom] !== undefined) sel[baris.id] = { ...sel[baris.id], [idKolom]: baris.kunci[idKolom]! };
    if (kolom.kepala !== undefined && !kolom.terkunci) kepala[idKolom] = String(kolom.kepala);
  }
  return { kepala, sel, ...(pengali ? { pengali } : {}) };
}

export const semuaKolomTabel = (tabel: TabelSoal): string[] => [...tabel.kolom.filter(kolom => !kolom.terkunci).map(kolom => kolom.id), ...(tabel.pengali ? [ID_KOLOM_PENGALI] : [])];

export const predikatDari = (bantuan: { petunjuk: boolean; dibuka: boolean }): PredikatSoal => (bantuan.dibuka ? 'dibuka' : bantuan.petunjuk ? 'petunjuk' : 'mandiri');

export type PenandaXp = { jenis: 'bonus'; dasar: number; bonus: number } | { jenis: 'bonusLepas'; dasar: number } | { jenis: 'hangus' };

/** Penanda di kepala tabel; null bila XP sudah didapat sebelumnya (tidak ada yang dipertaruhkan). */
export function penandaXp(bobotXp: number, keadaan: { xpMasihAda: boolean; xpHangus: boolean; petunjuk: boolean; salah: number }): PenandaXp | null {
  // Bobot 0 = soal tanpa XP (soal bank, sampai XP-nya tercatat di server): tidak ada penanda sama sekali.
  if (bobotXp <= 0) return null;
  if (keadaan.xpHangus) return { jenis: 'hangus' };
  if (!keadaan.xpMasihAda) return null;
  const { dasar, bonus } = pecahXp(bobotXp);
  return keadaan.petunjuk || keadaan.salah > SALAH_MAKS_MANDIRI ? { jenis: 'bonusLepas', dasar } : { jenis: 'bonus', dasar, bonus };
}

/** Samakan dengan `xp_konten` di SQL: bobot mengikuti tingkat bila soal tidak menyebut bobotXp. */
const BOBOT_XP_TINGKAT = { dasar: 10, menengah: 20, sulit: 30 } as const;
export const bobotXpSoal = (soal: { bobotXp?: number | undefined; tingkat: keyof typeof BOBOT_XP_TINGKAT }): number => soal.bobotXp ?? BOBOT_XP_TINGKAT[soal.tingkat];
