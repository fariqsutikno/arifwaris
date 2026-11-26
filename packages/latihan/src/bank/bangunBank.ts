// Saringan dan kuota bank soal (spec bank soal §2.2-2.3 dan §4, G2-G3). Menerima aliran kode dari penyapu (biasa dan lanjutan);
// memutuskan mana yang lolos engine dan berapa yang diambil per (tingkat, label utama); menyerahkan daftar
// baris indeks (kode + label + tingkat + modul) ke pemanggil (CLI bank:bangun, nanti G4 yang menulis ke basis data).
//
// Kesetaraan (§2.3): dua kandidat setara hanya bila kasus ternormalkannya sama, yaitu kode yang sama; penyapu
// sudah menjamin itu satu-satu. Jumlah orang yang berbeda TIDAK digabung walau hasil bagiannya sama, karena
// susunan ahli waris yang gugur berbeda adalah soal hajb yang berbeda. Bila ragu, tidak digabung.

import type { Tingkat } from '@waris/content';
import { buatKodeSoal, type KasusBiasa } from './kodeSoal.js';
import { keluargaDariLabel, type KeluargaLanjutan } from './labelSoal.js';
import type { KandidatKode } from './penyapuLanjutan.js';
import { soalDariKode } from './soalDariKode.js';

/** Target awal spec §9 butir 1; bisa dinaikkan. */
export const TARGET_TOTAL_SOAL = 1_000_000;

/** Usulan spec §9 butir 1: dasar 40%, menengah 40%, sulit 20%. */
export const PORSI_TINGKAT: Readonly<Record<Tingkat, number>> = { dasar: 0.4, menengah: 0.4, sulit: 0.2 };

/**
 * Kuota keluarga lanjutan (G3): batas jumlah soal per keluarga, di luar target keluarga biasa di atas. Tiap keluarga
 * dibatasi jauh di bawah 1 juta supaya bank tidak didominasi satu keluarga (terutama munasakhat, yang ruangnya
 * paling besar); di dalam keluarga, jatah dibagi rata ke label utama (water-filling yang sama). Semuanya tingkat
 * sulit atau menengah, jadi stok sulit yang kurang di keluarga biasa (spec §8 G2) terisi dari sini.
 */
export const KUOTA_KELUARGA_LANJUTAN: Readonly<Record<KeluargaLanjutan, number>> = {
  munasakhat: 60_000, gharqa: 30_000, mafqud: 30_000, khuntsa: 20_000, haml: 15_000, dzawilArham: 30_000,
};

export const KELUARGA_BIASA_NAMA = 'biasa';

const URUTAN_TINGKAT: readonly Tingkat[] = ['dasar', 'menengah', 'sulit'];
const TOKEN_UTAMA_TETAP = ['tashih', 'radd', 'kakekSaudara', 'ashabahBilGhair', 'ashabahMaalGhair'];
const LABEL_UTAMA_POLOS = 'dasar';
const PROGRES_SETIAP_KANDIDAT = 100_000;

export type BarisBank = {
  kode: string; label: string[]; tingkat: Tingkat; modul: number[]; jumlahAhliWaris: number; labelUtama: string;
  /** `biasa` atau nama keluarga lanjutan; kuota dihitung per keluarga. */
  keluarga: string;
};

/**
 * Label utama = satu token yang mewakili soal untuk kuota. Prioritas dari yang paling jarang/spesifik:
 * kasus bernama, 'aul (dengan angka), inkisar (dengan angka), tashih, radd, kakek bersama saudara, ashabah bil ghair,
 * ashabah ma'al ghair, hajb (per kunci), lalu `dasar`. Token yang sama bisa muncul di tingkat berbeda; kuota per pasangan.
 */
export function labelUtama(label: string[]): string {
  const keluarga = keluargaDariLabel(label);
  return keluarga ? labelUtamaLanjutan(keluarga, label) : labelUtamaBiasa(label);
}

const berawalan = (label: string[], awalan: string) => label.find(token => token.startsWith(awalan));

function labelUtamaBiasa(label: string[]): string {
  return berawalan(label, 'bernama:') ?? berawalan(label, 'aul:') ?? berawalan(label, 'inkisar:')
    ?? TOKEN_UTAMA_TETAP.find(token => label.includes(token)) ?? berawalan(label, 'hajb:') ?? LABEL_UTAMA_POLOS;
}

/** Keluarga lanjutan: awalan = ciri keluarga dari jejak (jumlah mayit, keadaan, dunia), lalu kaidah hisab utamanya. */
function labelUtamaLanjutan(keluarga: KeluargaLanjutan, label: string[]): string {
  const ciri = (...awalan: string[]) => awalan.map(depan => berawalan(label, depan) ?? '-').join('/');
  switch (keluarga) {
    case 'munasakhat': return `${ciri('munasakhat:', 'keadaan:')}/${labelUtamaBiasa(label)}`;
    case 'gharqa': return `${ciri('gharqa:', 'mayit:')}/${labelUtamaBiasa(label)}`;
    case 'dzawilArham': return `${keluarga}/${ciri('dzawilArham:')}/${label.filter(token => token.startsWith('tanzil:')).map(token => token.slice('tanzil:'.length)).join('+') || '-'}`;
    default: return `${keluarga}/${ciri('sasaran:', 'dunia:')}/${label.includes('mauquf') ? 'mauquf' : 'tanpaMauquf'}${label.includes('kelasD') ? '/kelasD' : ''}`;
  }
}

export type HasilSaring = { lolos: BarisBank[]; kandidat: number; dibuang: Record<string, number> };

export const keKandidat = (kasus: KasusBiasa): KandidatKode =>
  ({ kode: buatKodeSoal(kasus), jumlahOrang: Object.values(kasus.ahliWaris).reduce((total, banyak) => total + banyak, 0) });

type ProfilBaris = Pick<BarisBank, 'label' | 'tingkat' | 'modul' | 'labelUtama' | 'keluarga'>;
const profilDari = (soal: { label: string[]; tingkat: Tingkat; modul: number[] }): ProfilBaris => {
  const label = soal.label;
  return { label, tingkat: soal.tingkat, modul: soal.modul, labelUtama: labelUtama(label), keluarga: keluargaDariLabel(label) ?? KELUARGA_BIASA_NAMA };
};

/** Satu pintu ke engine: hanya yang lolos soalDariKode; yang lain dihitung per alasan, tidak dikarang. */
export function saringKandidat(kandidat: Iterable<KasusBiasa>, setiapSekian?: (sudah: number) => void): HasilSaring {
  return saringKode((function* () { for (const kasus of kandidat) yield keKandidat(kasus); })(), setiapSekian);
}

export function saringKode(kandidat: Iterable<KandidatKode>, setiapSekian?: (sudah: number) => void): HasilSaring {
  const lolos: BarisBank[] = [];
  const dibuang: Record<string, number> = {};
  const profilSama = new Map<string, ProfilBaris>();
  let jumlah = 0;
  for (const { kode, jumlahOrang } of kandidat) {
    jumlah++;
    if (setiapSekian && jumlah % PROGRES_SETIAP_KANDIDAT === 0) setiapSekian(jumlah);
    const soal = soalDariKode(kode);
    if (!soal.ok) { dibuang[soal.galat] = (dibuang[soal.galat] ?? 0) + 1; continue; }
    // Himpunan label berulang jutaan kali: satu salinan per himpunan menjaga memori.
    const kunciProfil = `${soal.tingkat}|${soal.label.join(' ')}`;
    let profil = profilSama.get(kunciProfil);
    if (!profil) { profil = profilDari(soal); profilSama.set(kunciProfil, profil); }
    lolos.push({ kode, ...profil, jumlahAhliWaris: jumlahOrang });
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

type Kelompok = { keluarga: string; tingkat: Tingkat; ukuran: number };
const kunciKelompok = (tingkat: Tingkat, utama: string) => `${tingkat}/${utama}`;

/**
 * Jatah per kelompok (`tingkat/labelUtama`). Keluarga biasa: target tiap tingkat = target total x porsi, dibagi rata
 * ke label utama. Keluarga lanjutan: jatah keluarga = KUOTA_KELUARGA_LANJUTAN, dibagi rata ke labelnya.
 * Stok yang kurang dari jatah diambil semua, tidak ditambal dari kelompok lain.
 */
function jatahKelompok(kelompok: Map<string, Kelompok>, targetTotal: number): Map<string, number> {
  const ukuranDari = (saring: (isi: Kelompok) => boolean) => new Map([...kelompok].filter(([, isi]) => saring(isi)).map(([kunci, isi]) => [kunci, isi.ukuran]));
  const jatah = new Map<string, number>();
  for (const tingkat of URUTAN_TINGKAT) {
    const bagian = bagiJatah(ukuranDari(isi => isi.keluarga === KELUARGA_BIASA_NAMA && isi.tingkat === tingkat), jatahTingkat(tingkat, targetTotal));
    bagian.forEach((nilai, kunci) => jatah.set(kunci, nilai));
  }
  for (const [keluarga, kuota] of Object.entries(KUOTA_KELUARGA_LANJUTAN)) {
    bagiJatah(ukuranDari(isi => isi.keluarga === keluarga), kuota).forEach((nilai, kunci) => jatah.set(kunci, nilai));
  }
  return jatah;
}

/**
 * Kuota (versi memori, acuan uji dan sapuan kecil): lihat jatahKelompok. Dalam satu kelompok diambil N kode dengan
 * hash terkecil.
 */
export function terapkanKuota(lolos: BarisBank[], targetTotal = TARGET_TOTAL_SOAL): BarisBank[] {
  const perKelompok = new Map<string, BarisBank[]>();
  for (const baris of lolos) {
    const kunci = kunciKelompok(baris.tingkat, baris.labelUtama);
    const anggota = perKelompok.get(kunci) ?? [];
    anggota.push(baris);
    perKelompok.set(kunci, anggota);
  }
  const ukuran = new Map([...perKelompok].map(([kunci, anggota]) => [kunci, { keluarga: anggota[0]!.keluarga, tingkat: anggota[0]!.tingkat, ukuran: anggota.length }]));
  const jatah = jatahKelompok(ukuran, targetTotal);
  const terpilih: BarisBank[] = [];
  for (const [kunci, anggota] of perKelompok) {
    anggota.sort((a, b) => hashKode(a.kode) - hashKode(b.kode) || (a.kode < b.kode ? -1 : 1));
    for (const baris of anggota.slice(0, jatah.get(kunci))) terpilih.push(baris); // bukan push(...): spread jutaan elemen melebihi batas tumpukan
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
  /** Stok dan hasil kuota per keluarga (`biasa` atau lanjutan), untuk laporan. */
  perKeluarga: Map<string, { stok: number; terpilih: number }>;
};

/** Pembungkus keluarga biasa; lihat bangunBankDariKode. */
export function bangunBank(sapu: () => Iterable<KasusBiasa>, targetTotal = TARGET_TOTAL_SOAL, progres?: (sudah: number) => void): HasilBank {
  return bangunBankDariKode(function* () { for (const kasus of sapu()) yield keKandidat(kasus); }, targetTotal, progres);
}

/**
 * Pembangun mengalir (G2): memori sebanding jumlah lolos x 12 byte, bukan x objek. Dua pass atas sapuan yang sama:
 * pass 1 menjalankan engine sekali per kandidat dan hanya mencatat (hash kode, nomor profil, nomor sapuan);
 * lalu kuota dihitung dari ukuran kelompok; pass 2 mengulang sapuan (murah, tanpa engine) untuk mengambil kode yang terpilih.
 * Hasil sama dengan saringKandidat + terapkanKuota, kecuali dua kode berhash sama pada batas kuota: di sini yang
 * lebih awal disapu menang, di versi memori kode yang lebih kecil.
 * `sapu` dipanggil dua kali dan harus menghasilkan aliran yang identik.
 */
export function bangunBankDariKode(
  sapu: () => Iterable<KandidatKode>, targetTotal = TARGET_TOTAL_SOAL, progres?: (sudah: number) => void,
): HasilBank {
  const profil: ProfilBaris[] = [];
  const nomorProfil = new Map<string, number>();
  const hash = new DaftarPadat(), profilPerLolos = new DaftarPadat(), nomorSapuan = new DaftarPadat();
  const dibuang: Record<string, number> = {};
  let kandidat = 0;
  for (const { kode } of sapu()) {
    kandidat++;
    if (progres && kandidat % PROGRES_SETIAP_KANDIDAT === 0) progres(kandidat);
    const soal = soalDariKode(kode);
    if (!soal.ok) { dibuang[soal.galat] = (dibuang[soal.galat] ?? 0) + 1; continue; }
    const kunciProfil = `${soal.tingkat}|${soal.label.join(' ')}`;
    let nomor = nomorProfil.get(kunciProfil);
    if (nomor === undefined) {
      nomor = profil.length;
      profil.push(profilDari(soal));
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
    const kunci = kunciKelompok(tingkat, utama);
    const daftar = indeksPerKelompok.get(kunci);
    if (daftar) daftar.push(urutan); else indeksPerKelompok.set(kunci, [urutan]);
  }
  const stokPerKelompok = new Map([...indeksPerKelompok].map(([kunci, daftar]) => [kunci, daftar.length]));
  const kelompok = new Map<string, Kelompok>();
  for (const [kunci, daftar] of indeksPerKelompok) {
    const { tingkat, keluarga } = profil[profilPerLolos.ambil(daftar[0]!)]!;
    kelompok.set(kunci, { keluarga, tingkat, ukuran: daftar.length });
  }

  const dipilih = new Uint8Array(jumlahLolos);
  for (const [kunci, jatah] of jatahKelompok(kelompok, targetTotal)) {
    const daftar = indeksPerKelompok.get(kunci)!;
    daftar.sort((a, b) => hash.ambil(a) - hash.ambil(b) || a - b);
    for (let urutan = 0; urutan < jatah; urutan++) dipilih[daftar[urutan]!] = 1;
  }

  const terpilih: BarisBank[] = [];
  let lolosBerikut = 0, nomorKandidat = 0;
  for (const { kode, jumlahOrang } of sapu()) {
    if (lolosBerikut === jumlahLolos) break;
    if (nomorSapuan.ambil(lolosBerikut) === nomorKandidat++) {
      if (dipilih[lolosBerikut]) terpilih.push({ kode, ...profil[profilPerLolos.ambil(lolosBerikut)]!, jumlahAhliWaris: jumlahOrang });
      lolosBerikut++;
    }
  }
  terpilih.sort((a, b) => (a.kode < b.kode ? -1 : 1));
  const perKeluarga = new Map<string, { stok: number; terpilih: number }>();
  for (const isi of kelompok.values()) perKeluarga.set(isi.keluarga, { stok: (perKeluarga.get(isi.keluarga)?.stok ?? 0) + isi.ukuran, terpilih: 0 });
  for (const baris of terpilih) perKeluarga.get(baris.keluarga)!.terpilih++;
  return { terpilih, kandidat, jumlahLolos, dibuang, stokPerKelompok, perKeluarga };
}
