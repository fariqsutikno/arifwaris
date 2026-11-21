// Aturan XP satu soal (spec 3.1) sebagai fungsi murni atas kejadian terurut menurut waktu server. Dipakai tampilan;
// kebenaran ada di SQL (`xp_soal_baru`, migrasi xp_server). Keduanya dijaga sama oleh `__tests__/xp-kasus.json`.

export interface KejadianXp {
  aksi: 'buka' | 'periksa' | 'kirim' | 'lihatJawaban';
  mode: 'latihan' | 'ujian';
  /** Hasil hitungan server; null untuk buka dan lihatJawaban tanpa isian. */
  benarSemua: boolean | null;
  /** Kolom benar dan total kolom (hanya Kirim Ujian), untuk XP parsial. */
  kolomBenar?: number;
  kolomTotal?: number;
}

const adalahBenarPenuh = (k: KejadianXp): boolean =>
  ((k.aksi === 'periksa' && k.mode === 'latihan') || (k.aksi === 'kirim' && k.mode === 'ujian')) && k.benarSemua === true;

/** Total XP satu soal; `bobotXp` dari revisi yang dikerjakan. Ulang soal yang sudah benar = 0 tambahan. */
export function xpSoal(kejadian: readonly KejadianXp[], bobotXp: number): number {
  const indeksLihat = kejadian.findIndex(k => k.aksi === 'lihatJawaban');
  const indeksBenar = kejadian.findIndex(adalahBenarPenuh);
  const indeksKirim = kejadian.findIndex(k => k.aksi === 'kirim' && k.mode === 'ujian');
  const sebelumLihat = (indeks: number) => indeks >= 0 && (indeksLihat < 0 || indeksLihat > indeks);
  let xp = 0;
  if (sebelumLihat(indeksKirim)) {
    const kirim = kejadian[indeksKirim]!;
    xp += Math.floor((bobotXp * (kirim.kolomBenar ?? 0)) / Math.max(kirim.kolomTotal ?? 0, 1));
  }
  if (sebelumLihat(indeksBenar)) xp += Math.max(bobotXp - xp, 0);
  return xp;
}
