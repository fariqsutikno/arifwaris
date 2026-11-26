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
const PROGRES_SETIAP_KANDIDAT = 100_000;

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
    if (setiapSekian && jumlah % PROGRES_SETIAP_KANDIDAT === 0) setiapSekian(jumlah);
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
 * Water-filling: jatah tingkat dibagi rata ke kelompok (label utama); jatah yang tidak terpakai kelompok kecil
 * pindah ke kelompok yang lebih besar. Murni atas ukuran kelompok, jadi dipakai versi memori dan versi mengalir.
 */
function bagiJatah(ukuran: Map<string, number>, jatahTingkat: number): Map<string, number> {
  const urut = [...ukuran.entries()].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1));
  const ambil = new Map<string, number>();
  let sisaJatah = jatahTingkat;
  urut.forEach(([label, besar], urutan) => {
    const jatah = Math.min(besar, Math.floor(sisaJatah / (urut.length - urutan)));
    ambil.set(label, jatah);
    sisaJatah -= jatah;
  });
  return ambil;
}

const jatahTingkat = (tingkat: Tingkat, targetTotal: number) => Math.floor(targetTotal * PORSI_TINGKAT[tingkat]);

/**
 * Kuota (versi memori, acuan uji dan sapuan kecil): target tiap tingkat = target total x porsi; di dalam tingkat
 * dibagi rata ke label utama (bagiJatah). Dalam satu kelompok diambil N kode dengan hash terkecil. Bila stok suatu
 * tingkat kurang dari targetnya, yang tersedia diambil semua.
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
    const ambil = bagiJatah(new Map([...perLabel].map(([label, anggota]) => [label, anggota.length])), jatahTingkat(tingkat, targetTotal));
    for (const [label, anggota] of perLabel) {
      anggota.sort((a, b) => hashKode(a.kode) - hashKode(b.kode) || (a.kode < b.kode ? -1 : 1));
      for (const baris of anggota.slice(0, ambil.get(label))) terpilih.push(baris); // bukan push(...): spread jutaan elemen melebihi batas tumpukan
    }
  }
  return terpilih.sort((a, b) => (a.kode < b.kode ? -1 : 1));
}

/** Larik bilangan bulat tak bertanda yang tumbuh berlipat ganda: 4 byte per entri, bukan objek per kandidat. */
class DaftarPadat {
  private isi = new Uint32Array(1 << 20);
  panjang = 0;
  tambah(nilai: number) {
    if (this.panjang === this.isi.length) { const lebih = new Uint32Array(this.isi.length * 2); lebih.set(this.isi); this.isi = lebih; }
    this.isi[this.panjang++] = nilai;
  }
  ambil(urutan: number) { return this.isi[urutan]!; }
}

export type HasilBank = {
  terpilih: BarisBank[]; kandidat: number; jumlahLolos: number; dibuang: Record<string, number>;
  /** Ukuran stok (lolos engine) per `tingkat/labelUtama`, untuk statistik. */
  stokPerKelompok: Map<string, number>;
};

/**
 * Pembangun mengalir (G2): memori sebanding jumlah lolos x 12 byte, bukan x objek. Dua pass atas sapuan yang sama:
 * pass 1 menjalankan engine sekali per kandidat dan hanya mencatat (hash kode, nomor profil, nomor sapuan);
 * lalu kuota dihitung dari ukuran kelompok; pass 2 mengulang sapuan (murah, tanpa engine) untuk mengambil kode yang terpilih.
 * Hasil sama dengan saringKandidat + terapkanKuota, kecuali dua kode berhash sama pada batas kuota: di sini yang
 * lebih awal disapu menang, di versi memori kode yang lebih kecil.
 * `sapu` dipanggil dua kali dan harus menghasilkan aliran yang identik.
 */
export function bangunBank(
  sapu: () => Iterable<KasusBiasa>, targetTotal = TARGET_TOTAL_SOAL, progres?: (sudah: number) => void,
): HasilBank {
  const profil: Array<Pick<BarisBank, 'label' | 'tingkat' | 'modul' | 'labelUtama'>> = [];
  const nomorProfil = new Map<string, number>();
  const hash = new DaftarPadat(), profilPerLolos = new DaftarPadat(), nomorSapuan = new DaftarPadat();
  const dibuang: Record<string, number> = {};
  let kandidat = 0;
  for (const kasus of sapu()) {
    kandidat++;
    if (progres && kandidat % PROGRES_SETIAP_KANDIDAT === 0) progres(kandidat);
    const kode = buatKodeSoal(kasus);
    const soal = soalDariKode(kode);
    if (!soal.ok) { dibuang[soal.galat] = (dibuang[soal.galat] ?? 0) + 1; continue; }
    const kunciProfil = `${soal.tingkat}|${soal.label.join(' ')}`;
    let nomor = nomorProfil.get(kunciProfil);
    if (nomor === undefined) {
      nomor = profil.length;
      profil.push({ label: soal.label, tingkat: soal.tingkat, modul: soal.modul, labelUtama: labelUtama(soal.label) });
      nomorProfil.set(kunciProfil, nomor);
    }
    hash.tambah(hashKode(kode));
    profilPerLolos.tambah(nomor);
    nomorSapuan.tambah(kandidat - 1);
  }

  const jumlahLolos = hash.panjang;
  const indeksPerKelompok = new Map<string, number[]>();
  for (let urutan = 0; urutan < jumlahLolos; urutan++) {
    const { tingkat, labelUtama: utama } = profil[profilPerLolos.ambil(urutan)]!;
    const kunci = `${tingkat}/${utama}`;
    const daftar = indeksPerKelompok.get(kunci);
    if (daftar) daftar.push(urutan); else indeksPerKelompok.set(kunci, [urutan]);
  }
  const stokPerKelompok = new Map([...indeksPerKelompok].map(([kunci, daftar]) => [kunci, daftar.length]));

  const dipilih = new Uint8Array(jumlahLolos);
  for (const tingkat of URUTAN_TINGKAT) {
    const awalan = `${tingkat}/`;
    const ukuran = new Map([...stokPerKelompok].filter(([kunci]) => kunci.startsWith(awalan)));
    const ambil = bagiJatah(ukuran, jatahTingkat(tingkat, targetTotal));
    for (const [kunci, jatah] of ambil) {
      const daftar = indeksPerKelompok.get(kunci)!;
      daftar.sort((a, b) => hash.ambil(a) - hash.ambil(b) || a - b);
      for (let urutan = 0; urutan < jatah; urutan++) dipilih[daftar[urutan]!] = 1;
    }
  }

  const terpilih: BarisBank[] = [];
  let lolosBerikut = 0, nomorKandidat = 0;
  for (const kasus of sapu()) {
    if (lolosBerikut === jumlahLolos) break;
    if (nomorSapuan.ambil(lolosBerikut) === nomorKandidat++) {
      if (dipilih[lolosBerikut]) {
        terpilih.push({
          kode: buatKodeSoal(kasus), ...profil[profilPerLolos.ambil(lolosBerikut)]!,
          jumlahAhliWaris: Object.values(kasus.ahliWaris).reduce((total, banyak) => total + banyak, 0),
        });
      }
      lolosBerikut++;
    }
  }
  terpilih.sort((a, b) => (a.kode < b.kode ? -1 : 1));
  return { terpilih, kandidat, jumlahLolos, dibuang, stokPerKelompok };
}
