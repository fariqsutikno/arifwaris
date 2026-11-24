// Aturan XP satu soal (spec 3.1; tangga bantuan bagian 5) sebagai fungsi murni atas kejadian terurut menurut waktu server. Dipakai tampilan;
// kebenaran ada di SQL (`xp_soal_baru`, migrasi xp_server). Keduanya dijaga sama oleh `__tests__/xp-kasus.json`.

export interface KejadianXp {
  aksi: 'buka' | 'periksa' | 'kirim' | 'lihatJawaban' | 'petunjuk' | 'bukaKolom';
  mode: 'latihan' | 'ujian';
  /** Hasil hitungan server; null untuk buka dan lihatJawaban tanpa isian. */
  benarSemua: boolean | null;
  /** Kolom benar dan total kolom (hanya Kirim Ujian), untuk XP parsial. */
  kolomBenar?: number;
  kolomTotal?: number;
}

const adalahBenarPenuh = (k: KejadianXp): boolean =>
  ((k.aksi === 'periksa' && k.mode === 'latihan') || (k.aksi === 'kirim' && k.mode === 'ujian')) && k.benarSemua === true;

const PERSEN_XP_DASAR = 60;
/** XP dasar dan bonus mandiri (tangga bantuan bagian 5). Dasar dibulatkan ke bawah; bonus = sisanya, jadi jumlahnya tepat bobot. */
export function pecahXp(bobotXp: number): { dasar: number; bonus: number } {
  const dasar = Math.floor((bobotXp * PERSEN_XP_DASAR) / 100);
  return { dasar, bonus: bobotXp - dasar };
}
/** Periksa salah paling banyak sebanyak ini sebelum benar pertama masih dihitung mandiri. */
const BATAS_PERIKSA_SALAH_MANDIRI = 3;

/** Total XP satu soal; `bobotXp` dari revisi yang dikerjakan. Ulang soal yang sudah benar = 0 tambahan. */
export function xpSoal(kejadian: readonly KejadianXp[], bobotXp: number): number {
  const indeksLihat = kejadian.findIndex(k => k.aksi === 'lihatJawaban' || k.aksi === 'bukaKolom');
  const indeksBenar = kejadian.findIndex(adalahBenarPenuh);
  const indeksKirim = kejadian.findIndex(k => k.aksi === 'kirim' && k.mode === 'ujian');
  const sebelumLihat = (indeks: number) => indeks >= 0 && (indeksLihat < 0 || indeksLihat > indeks);
  let xp = 0;
  if (sebelumLihat(indeksKirim)) {
    const kirim = kejadian[indeksKirim]!;
    xp += Math.floor((bobotXp * (kirim.kolomBenar ?? 0)) / Math.max(kirim.kolomTotal ?? 0, 1));
  }
  if (sebelumLihat(indeksBenar)) {
    const sebelum = kejadian.slice(0, indeksBenar);
    const mandiri = !sebelum.some(k => k.aksi === 'petunjuk')
      && sebelum.filter(k => k.aksi === 'periksa' && k.mode === 'latihan' && k.benarSemua !== true).length <= BATAS_PERIKSA_SALAH_MANDIRI;
    const berhak = mandiri ? bobotXp : pecahXp(bobotXp).dasar;
    xp += Math.max(berhak - xp, 0);
  }
  return xp;
}
