// Progres belajar (pelajaran selesai) dan latihan (kuis & soal hitung) di perangkat, berbentuk sama dengan tabel
// progres_belajar / progres_latihan supaya bisa disinkron apa adanya (spec akun pengguna "Data lokal").
// Catatan format lama ('selesai' / 'benar' / 'salah' / skor paket) dimigrasi sekali saat pertama dibaca.
// Skor terakhir per paket kuis hanya untuk tampilan dan tetap lokal.

import type { ProgresBelajar, ProgresLatihan } from '@waris/data';
import { hapusMentah, bacaMentah, simpanMentah } from './penyimpanan';
import { hapusAktivitas } from './preferensi';

type JenisLatihan = ProgresLatihan['jenis'];

const KUNCI_BELAJAR = 'arif-waris:progres-belajar';
const KUNCI_LATIHAN = 'arif-waris:progres-latihan';
const KUNCI_SKOR_PAKET = 'arif-waris:skor-paket';
const AWALAN_CATATAN_LAMA = 'arif-waris:catatan:';
/** Data hasil migrasi kalah dari data mana pun yang punya waktu (spec: diubahPada = 0). */
const WAKTU_LAMA = new Date(0).toISOString();

export function bacaProgresBelajar(): Record<string, ProgresBelajar> {
  migrasiCatatanLama();
  return bacaObjek<ProgresBelajar>(KUNCI_BELAJAR);
}

export const bacaPelajaranSelesai = (): Set<string> =>
  new Set(Object.values(bacaProgresBelajar()).filter(progres => progres.selesai).map(progres => progres.pelajaranSlug));

export function tandaiPelajaranSelesai(slug: string): void {
  const baris: ProgresBelajar = { pelajaranSlug: slug, selesai: true, diubahPada: new Date().toISOString() };
  simpanMentah(KUNCI_BELAJAR, JSON.stringify({ ...bacaProgresBelajar(), [slug]: baris }));
}

export function bacaProgresLatihan(jenis: JenisLatihan): Record<string, ProgresLatihan> {
  migrasiCatatanLama();
  return Object.fromEntries(Object.values(bacaObjek<ProgresLatihan>(KUNCI_LATIHAN))
    .filter(progres => progres.jenis === jenis).map(progres => [progres.soalSlug, progres]));
}

export function catatLatihan(jenis: JenisLatihan, soalSlug: string, benar: boolean, jawaban: unknown): void {
  const semua = bacaObjek<ProgresLatihan>(KUNCI_LATIHAN);
  const sebelumnya = semua[kunciLatihan(jenis, soalSlug)];
  const baris: ProgresLatihan = {
    soalSlug, jenis, benar, jawabanTerakhir: jawaban ?? null,
    jumlahCoba: (sebelumnya?.jumlahCoba ?? 0) + 1, diubahPada: new Date().toISOString(),
  };
  simpanMentah(KUNCI_LATIHAN, JSON.stringify({ ...semua, [kunciLatihan(jenis, soalSlug)]: baris }));
}

export const bacaSkorPaket = (): Record<string, string> => bacaObjek<string>(KUNCI_SKOR_PAKET);
export const simpanSkorPaket = (paket: string, skor: string): void =>
  simpanMentah(KUNCI_SKOR_PAKET, JSON.stringify({ ...bacaSkorPaket(), [paket]: skor }));

/** Reset progres belajar: pelajaran selesai, latihan, skor paket, dan jejak belajar. Riwayat hitung tidak tersentuh. */
export function resetProgresBelajar(): void {
  [KUNCI_BELAJAR, KUNCI_LATIHAN, KUNCI_SKOR_PAKET].forEach(kunci => simpanMentah(kunci, '{}'));
  hapusAktivitas();
}

/** Untuk sinkron akun: semua baris progres di perangkat. */
export const semuaProgres = (): { belajar: ProgresBelajar[]; latihan: ProgresLatihan[] } => ({
  belajar: Object.values(bacaProgresBelajar()), latihan: Object.values(bacaObjek<ProgresLatihan>(KUNCI_LATIHAN)),
});

export function gantiSemuaProgres(data: { belajar: ProgresBelajar[]; latihan: ProgresLatihan[] }): void {
  simpanMentah(KUNCI_BELAJAR, JSON.stringify(Object.fromEntries(data.belajar.map(baris => [baris.pelajaranSlug, baris]))));
  simpanMentah(KUNCI_LATIHAN, JSON.stringify(Object.fromEntries(data.latihan.map(baris => [kunciLatihan(baris.jenis, baris.soalSlug), baris]))));
}

const kunciLatihan = (jenis: JenisLatihan, soalSlug: string) => `${jenis}:${soalSlug}`;

function bacaObjek<T>(kunci: string): Record<string, T> {
  try {
    const nilai: unknown = JSON.parse(bacaMentah(kunci) ?? '{}');
    return nilai && typeof nilai === 'object' && !Array.isArray(nilai) ? nilai as Record<string, T> : {};
  } catch {
    return {};
  }
}

function migrasiCatatanLama(): void {
  const lama = (jenis: 'pelajaran' | 'soal' | 'kuis') => bacaObjek<string>(AWALAN_CATATAN_LAMA + jenis);
  const [pelajaran, soal, kuis] = [lama('pelajaran'), lama('soal'), lama('kuis')];
  if (!Object.keys(pelajaran).length && !Object.keys(soal).length && !Object.keys(kuis).length) return;

  const belajar = Object.keys(pelajaran).map((slug): ProgresBelajar => ({ pelajaranSlug: slug, selesai: true, diubahPada: WAKTU_LAMA }));
  const latihanLama = (jenis: JenisLatihan, soalSlug: string, benar: boolean): ProgresLatihan =>
    ({ soalSlug, jenis, benar, jawabanTerakhir: null, jumlahCoba: 1, diubahPada: WAKTU_LAMA });
  // Soal hitung lama hanya mencatat "jawaban dibuka" → dianggap benar (spec "Data lokal").
  const latihan = [
    ...Object.keys(soal).map(slug => latihanLama('hitung', slug, true)),
    ...Object.entries(kuis).filter(([, nilai]) => nilai === 'benar' || nilai === 'salah')
      .map(([slug, nilai]) => latihanLama('kuis', slug, nilai === 'benar')),
  ];
  const skorPaket = Object.fromEntries(Object.entries(kuis).filter(([, nilai]) => nilai.includes('/')));

  gantiSemuaProgres({
    belajar: [...belajar, ...Object.values(bacaObjek<ProgresBelajar>(KUNCI_BELAJAR))],
    latihan: [...latihan, ...Object.values(bacaObjek<ProgresLatihan>(KUNCI_LATIHAN))],
  });
  simpanMentah(KUNCI_SKOR_PAKET, JSON.stringify({ ...skorPaket, ...bacaSkorPaket() }));
  (['pelajaran', 'soal', 'kuis'] as const).forEach(jenis => hapusMentah(AWALAN_CATATAN_LAMA + jenis));
}
