// Saringan dan kuota bank soal (spec bank soal §2.2-2.3 dan §4, G2). Menerima aliran KasusBiasa dari penyapu;
// memutuskan mana yang lolos engine dan berapa yang diambil per (tingkat, label utama); menyerahkan daftar
// baris indeks (kode + label + tingkat + modul) ke pemanggil (CLI bank:bangun, nanti G4 yang menulis ke basis data).
//
// Kesetaraan (§2.3): dua kandidat setara hanya bila kasus ternormalkannya sama, yaitu kode yang sama; penyapu
// sudah menjamin itu satu-satu. Jumlah orang yang berbeda TIDAK digabung walau hasil bagiannya sama, karena
// susunan ahli waris yang gugur berbeda adalah soal hajb yang berbeda. Bila ragu, tidak digabung.

import type { Tingkat } from '@waris/content';
import { buatKodeSoal, type KasusBiasa } from './kodeSoal.js';
import { soalDariKode } from './soalDariKode.js';

/** Target awal spec §9 butir 1; bisa dinaikkan. */
export const TARGET_TOTAL_SOAL = 1_000_000;

/** Usulan spec §9 butir 1: dasar 40%, menengah 40%, sulit 20%. */
export const PORSI_TINGKAT: Readonly<Record<Tingkat, number>> = { dasar: 0.4, menengah: 0.4, sulit: 0.2 };

const URUTAN_TINGKAT: readonly Tingkat[] = ['dasar', 'menengah', 'sulit'];
const TOKEN_UTAMA_TETAP = ['tashih', 'radd', 'kakekSaudara', 'ashabahBilGhair', 'ashabahMaalGhair'];
const LABEL_UTAMA_POLOS = 'dasar';

export type BarisBank = {
  kode: string; label: string[]; tingkat: Tingkat; modul: number[]; jumlahAhliWaris: number; labelUtama: string;
};

/**
 * Label utama = satu token yang mewakili soal untuk kuota. Prioritas dari yang paling jarang/spesifik:
 * kasus bernama, 'aul (dengan angka), inkisar (dengan angka), tashih, radd, kakek bersama saudara, ashabah bil ghair,
 * ashabah ma'al ghair, hajb (per kunci), lalu `dasar`. Token yang sama bisa muncul di tingkat berbeda; kuota per pasangan.
 */
export function labelUtama(label: string[]): string {
  const berawalan = (awalan: string) => label.find(token => token.startsWith(awalan));
  return berawalan('bernama:') ?? berawalan('aul:') ?? berawalan('inkisar:')
    ?? TOKEN_UTAMA_TETAP.find(token => label.includes(token)) ?? berawalan('hajb:') ?? LABEL_UTAMA_POLOS;
}

export type HasilSaring = { lolos: BarisBank[]; kandidat: number; dibuang: Record<string, number> };

/** Satu pintu ke engine: hanya status OK yang lolos; yang lain dihitung per alasan, tidak dikarang. */
export function saringKandidat(kandidat: Iterable<KasusBiasa>, setiapSekian?: (sudah: number) => void): HasilSaring {
  const lolos: BarisBank[] = [];
  const dibuang: Record<string, number> = {};
  const profilSama = new Map<string, Pick<BarisBank, 'label' | 'tingkat' | 'modul' | 'labelUtama'>>();
  let jumlah = 0;
  for (const kasus of kandidat) {
    jumlah++;
    if (setiapSekian && jumlah % 500_000 === 0) setiapSekian(jumlah);
    const kode = buatKodeSoal(kasus);
    const soal = soalDariKode(kode);
    if (!soal.ok) { dibuang[soal.galat] = (dibuang[soal.galat] ?? 0) + 1; continue; }
    // Himpunan label berulang jutaan kali: satu salinan per himpunan menjaga memori.
    const kunciProfil = `${soal.tingkat}|${soal.label.join(' ')}`;
    let profil = profilSama.get(kunciProfil);
    if (!profil) {
      profil = { label: soal.label, tingkat: soal.tingkat, modul: soal.modul, labelUtama: labelUtama(soal.label) };
      profilSama.set(kunciProfil, profil);
    }
    const jumlahAhliWaris = Object.values(kasus.ahliWaris).reduce((total, banyak) => total + banyak, 0);
    lolos.push({ kode, ...profil, jumlahAhliWaris });
  }
  return { lolos, kandidat: jumlah, dibuang };
}

/** FNV-1a 32 bit: sebar deterministik tanpa Math.random; kode terpaut urutan sapuan, hash memecah keterpautan itu. */
export function hashKode(kode: string): number {
  let hash = 0x811c9dc5;
  for (let urutan = 0; urutan < kode.length; urutan++) hash = Math.imul(hash ^ kode.charCodeAt(urutan), 0x01000193) >>> 0;
  return hash;
}

/**
 * Kuota: target tiap tingkat = target total x porsi; di dalam tingkat dibagi rata ke label utama, dan jatah
 * yang tidak terpakai label kecil dipindah ke label yang lebih besar (water-filling). Dalam satu kelompok yang
 * diambil N kode dengan hash terkecil. Bila stok suatu tingkat kurang dari targetnya, yang tersedia diambil semua.
 */
export function terapkanKuota(lolos: BarisBank[], targetTotal = TARGET_TOTAL_SOAL): BarisBank[] {
  const terpilih: BarisBank[] = [];
  for (const tingkat of URUTAN_TINGKAT) {
    const perLabel = new Map<string, BarisBank[]>();
    for (const baris of lolos) {
      if (baris.tingkat !== tingkat) continue;
      const anggota = perLabel.get(baris.labelUtama) ?? [];
      anggota.push(baris);
      perLabel.set(baris.labelUtama, anggota);
    }
    const kelompok = [...perLabel.entries()].sort((a, b) => a[1].length - b[1].length || (a[0] < b[0] ? -1 : 1));
    let sisaJatah = Math.floor(targetTotal * PORSI_TINGKAT[tingkat]);
    kelompok.forEach(([, anggota], urutan) => {
      const ambil = Math.min(anggota.length, Math.floor(sisaJatah / (kelompok.length - urutan)));
      anggota.sort((a, b) => hashKode(a.kode) - hashKode(b.kode) || (a.kode < b.kode ? -1 : 1));
      for (const baris of anggota.slice(0, ambil)) terpilih.push(baris); // bukan push(...): spread jutaan elemen melebihi batas tumpukan
      sisaJatah -= ambil;
    });
  }
  return terpilih.sort((a, b) => (a.kode < b.kode ? -1 : 1));
}
