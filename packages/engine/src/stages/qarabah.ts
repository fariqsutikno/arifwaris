// Tahap qarabah — dzawil arham menurut Ahl al-Qarabah [HNF], KB 14.11 (al-Mabsuth 30/6–7, qaul Muhammad).
//   Masuk : graf + peran hasil derivasi + id dzawil arham hidup yang lolos mawani'.
//   Putus : tiap kerabat dimasukkan ke salah satu dari tujuh shinf; shinf terdahulu menghalangi yang sesudahnya [R14-14].
//           Dalam satu shinf berurutan: derajat ke mayit, anak ahli waris, quwwat al-qarabah [R14-14]; lalu harta dibagi
//           per tingkat ushul: di tingkat pertama yang berbeda sifat (lk 2:1), pihak ayah 2/3 dan pihak ibu 1/3 [R14-15].
//   Keluar: saham per penerima (jami'ah = KPK penyebut), penghalang tiap yang tersisih, dan jejak.
// Bentuk yang tidak dirumuskan KB 14.11 dikembalikan TIDAK_DIDUKUNG, bukan ditebak.

import { kali, kpk, pecahan, tambah, type Pecahan } from '@waris/math';
import { periksaInvarian, type Saham } from '../gabung.js';
import type { GrafKeluarga, IdOrang, LangkahJejak, PeranAhliWaris } from '../types.js';
import type { TidakDidukung } from './model.js';
import { lintasanKeAtas } from './tanzil.js';

export interface HasilQarabah {
  saham: Saham;
  masalah: bigint;
  /** Kerabat yang tersisih → penerima yang menghalanginya. */
  mahjub: Record<IdOrang, IdOrang[]>;
  jejak: LangkahJejak[];
}

/**
 * Token yang dipakai hasil qarabah tetapi belum punya baris "ya" untuk [HNF] di KB 18.4 (gerbang keberlakuan):
 * R14-14/15 khusus Hanafi; R14-4 = batasan dzawil arham [HNF] adalah daftar tujuh shinf 14.11; R09-9 + R14-3 = K09-1 [HNF]
 * "radd (kecuali pasangan) → dzawil arham" dan K14-1 [HNF] ya; R14-12 = 14.9 (pasangan tidak berkurang
 * «على مذهب الفريقين», Nihayat 9/253). Hanya dipakai di cabang dzawil arham, tidak untuk kasus hanafi lain.
 */
export const TERCAKUP_QARABAH: ReadonlySet<string> = new Set(['R09-9', 'R14-3', 'R14-4', 'R14-12', 'R14-14', 'R14-15']);

// ─── Konstanta fikih ─────────────────────────────────────────────────────────

const SHINF_TERAKHIR = 7;                                      // [R14-14] di luar tujuh shinf KB tidak merumuskan
const SHINF_TANPA_PIHAK = new Set([1, 2]);                     // furu' dan anak saudara: pihak ayah/ibu tidak bermakna
const SHINF_BERQUWWAT = new Set([2, 4, 5, 6, 7]);              // yang punya kerabat selevel dengan saudara-saudari (kandung/sebapak/seibu)
const SHINF_SATU_PENERIMA_PER_PIHAK = new Set([3, 6, 7]);      // KB tidak merumuskan pembagian beberapa kakek/nenek fasid dan shinf 6–7
const BOBOT_LAKI_LAKI = 2n;                                    // [R14-15] lk 2 : pr 1
const BOBOT_PEREMPUAN = 1n;
const BAGIAN_PIHAK_AYAH = pecahan(2n, 3n);                     // [R14-15] ijma' sahabat: 'ammah 2/3, khalah 1/3
const BAGIAN_PIHAK_IBU = pecahan(1n, 3n);
const QUWWAT_KANDUNG = 0;
const QUWWAT_SEBAPAK = 1;
const QUWWAT_SEIBU = 2;

const REFS_SHINF = ['R14-14'];
const REFS_DUA_JALUR = ['R14-15', 'K14-2'];

type Sisi = 'ayah' | 'ibu';

/** Satu garis nasab dari mayit ke seorang dzawil arham, sudah digolongkan ke shinf. */
interface JalurNasab {
  kunci: string;
  shinf: number;
  derajat: number;
  sisi?: Sisi;
  /** Dari simpul tingkat pertama sampai penerima ([anak, ..., X]; [saudara, ..., X]; [paman/bibi, ..., X]; [leluhur, ..., X]). */
  garis: IdOrang[];
  /** Induk tempat garis bercabang: mayit (furu', saudara) atau orang tua/kakek mayit (paman/bibi). */
  idInduk: IdOrang;
  /** Orang tua idInduk yang menjadi titik temu: dua = kandung. */
  leluhurBersama: Set<IdOrang>;
}

interface Kerabat {
  idOrang: IdOrang;
  shinf: number;
  derajat: number;
  sisi?: Sisi;
  quwwat?: number;
  /** undefined bila orang tua langsungnya di luar garis (tingkat pertama) atau kerabat ke atas. */
  anakAhliWaris?: boolean;
  daftarGaris: IdOrang[][];
}

const tolak = (alasan: string, refs: string[]): TidakDidukung => ({ status: 'TIDAK_DIDUKUNG', alasan, refs });

// ─── Pintu masuk ──────────────────────────────────────────────────────────────

export function bagiQarabah(graf: GrafKeluarga, daftarPeran: Record<IdOrang, PeranAhliWaris>, calon: IdOrang[]): HasilQarabah | TidakDidukung {
  if (calon.length === 0) throw new Error('invariant: qarabah tanpa dzawil arham [R14-14]');
  const daftarKerabat: Kerabat[] = [];
  for (const idOrang of calon) {
    const kerabat = susunKerabat(graf, daftarPeran, idOrang);
    if ('status' in kerabat) return kerabat;
    daftarKerabat.push(kerabat);
  }
  const pilihan = pilihPenerima(daftarKerabat);
  if ('status' in pilihan) return pilihan;
  const { penerima, tersisih } = pilihan;

  const perPihak = kelompokkanPerPihak(penerima);
  const bagianPihak: Record<Sisi, Pecahan> = { ayah: BAGIAN_PIHAK_AYAH, ibu: BAGIAN_PIHAK_IBU };
  const catatan: CatatanTurun[] = [];
  const bagian = new Map<IdOrang, Pecahan>();
  for (const [pihak, anggota] of perPihak) {
    const bagianKelompok = perPihak.size > 1 && pihak !== 'semua' ? bagianPihak[pihak] : pecahan(1n);
    const hasil = bagiPerTingkat(anggota.flatMap(kerabat => kerabat.daftarGaris), 0, bagianKelompok, graf, catatan);
    for (const [idOrang, nilai] of hasil) bagian.set(idOrang, tambahkan(bagian.get(idOrang), nilai));
  }

  const masalah = [...bagian.values()].reduce((hasilKpk, nilai) => kpk(hasilKpk, nilai.d), 1n);
  const saham = Object.fromEntries([...bagian].map(([idOrang, nilai]) => [idOrang, nilai.n * (masalah / nilai.d)]));
  periksaInvarian(saham, masalah, 'dzawil arham qarabah');

  const penghalang = (kerabat: Kerabat): IdOrang[] => {
    const sepihak = penerima.filter(lain => lain.shinf === kerabat.shinf && lain.sisi === kerabat.sisi);
    return (sepihak.length > 0 ? sepihak : penerima).map(lain => lain.idOrang);
  };
  return {
    saham, masalah,
    mahjub: Object.fromEntries(tersisih.map(kerabat => [kerabat.idOrang, penghalang(kerabat)])),
    jejak: [...jejakTurun(catatan, masalah), ...jejakDuaJalur(penerima)],
  };
}

// ─── Menggolongkan kerabat ke shinf ──────────────────────────────────────────

function susunKerabat(graf: GrafKeluarga, daftarPeran: Record<IdOrang, PeranAhliWaris>, idOrang: IdOrang): Kerabat | TidakDidukung {
  const daftarJalur = kumpulkanJalur(graf, idOrang);
  if (typeof daftarJalur === 'string') return tolak(daftarJalur, REFS_SHINF);
  const [pertama] = daftarJalur;
  if (!pertama) return tolak(`${idOrang} tidak punya garis nasab ke mayit yang dikenal KB 14.11.`, REFS_SHINF);

  // [R14-15] contoh hitung dua jalur hanya di shinf pertama; di luar itu KB tidak merumuskan.
  if (daftarJalur.length > 1 && !daftarJalur.every(jalur => jalur.shinf === 1 && jalur.derajat === pertama.derajat)) {
    return tolak(`${idOrang} mewarisi lewat dua jalur di luar shinf pertama atau berbeda derajat; KB 14.11 hanya mencontohkan shinf pertama.`, REFS_DUA_JALUR);
  }
  const anakAhliWaris = daftarJalur.map(jalur => apakahAnakAhliWaris(daftarPeran, jalur));
  if (new Set(anakAhliWaris).size > 1) {
    return tolak(`${idOrang} lewat dua jalur yang orang tuanya berbeda status (ahli waris / dzawil arham); KB 14.11 tidak merumuskan urutannya.`, REFS_DUA_JALUR);
  }
  return {
    idOrang, shinf: pertama.shinf, derajat: pertama.derajat,
    ...(pertama.sisi ? { sisi: pertama.sisi } : {}),
    ...(SHINF_BERQUWWAT.has(pertama.shinf) ? { quwwat: peringkatQuwwat(graf, pertama) } : {}),
    ...(anakAhliWaris[0] !== undefined ? { anakAhliWaris: anakAhliWaris[0] } : {}),
    daftarGaris: daftarJalur.map(jalur => jalur.garis),
  };
}

/** Semua garis nasab mayit→idOrang lewat leluhur bersama pertama; satu garis yang sama lewat dua leluhur (kandung) digabung. */
function kumpulkanJalur(graf: GrafKeluarga, idOrang: IdOrang): JalurNasab[] | string {
  const naikPewaris = lintasanKeAtas(graf, graf.idPewaris);
  const naikOrang = lintasanKeAtas(graf, idOrang);
  const perKunci = new Map<string, JalurNasab>();
  for (const atas of naikPewaris) {
    for (const bawah of naikOrang) {
      const leluhur = atas.at(-1)!;
      if (leluhur !== bawah.at(-1) || atas.filter(id => bawah.includes(id)).length !== 1) continue;
      const jalur = golongkanJalur(graf, atas, bawah);
      if (typeof jalur === 'string') return jalur;
      const sudahAda = perKunci.get(jalur.kunci);
      if (sudahAda) sudahAda.leluhurBersama.add(leluhur);
      else perKunci.set(jalur.kunci, jalur);
    }
  }
  return [...perKunci.values()];
}

/**
 * [R14-14] Tujuh shinf menurut letak leluhur bersama (`atas` = [mayit..leluhur], `bawah` = [kerabat..leluhur]):
 * 1 furu' (turun) · 2 keturunan saudara · 3 leluhur fasid · 4 paman/bibi · 5 anak paman/bibi ·
 * 6 paman/bibi ayah · 7 anak shinf 6. Shinf 6–7 di KB hanya dari pihak ayah.
 */
function golongkanJalur(graf: GrafKeluarga, atas: IdOrang[], bawah: IdOrang[]): JalurNasab | string {
  const naik = atas.length - 1;
  const turun = bawah.length - 1;
  const idPewaris = graf.idPewaris;
  const sisi: Sisi | undefined = atas.length > 1 ? (atas[1] === graf.orang[idPewaris]?.idAyah ? 'ayah' : 'ibu') : undefined;
  const garisTurun = bawah.slice(0, -1).reverse();
  const buat = (shinf: number, derajat: number, garis: IdOrang[], idInduk: IdOrang, pihak?: Sisi): JalurNasab =>
    ({ kunci: `${idInduk}|${garis.join('>')}`, shinf, derajat, garis, idInduk, leluhurBersama: new Set([atas.at(-1)!]), ...(pihak ? { sisi: pihak } : {}) });

  if (naik === 0) return buat(1, turun, garisTurun, idPewaris);
  if (turun === 0) return buat(3, naik, atas.slice(1), idPewaris, sisi);
  const idInduk = atas[naik - 1]!;
  if (naik === 1) return turun === 1 ? 'Saudara mayit bukan dzawil arham.' : buat(2, naik + turun, garisTurun, idInduk);
  if (naik > 3) return `Kerabat melewati leluhur ke-${naik} berada di luar tujuh shinf KB 14.11.`;
  const shinf = naik === 2 ? (turun === 1 ? 4 : 5) : (turun === 1 ? 6 : 7);
  if (shinf > 5 && sisi !== 'ayah') return 'Shinf 6–7 di KB 14.11 hanya memuat kerabat ayah (paman/bibi seibu, \'ammah, khal, khalah ayah); dari pihak ibu belum dirumuskan.';
  return buat(shinf, naik + turun, garisTurun, idInduk, sisi);
}

/** [R14-14] kandung lalu sebapak lalu seibu, diukur pada simpul tingkat pertama terhadap induknya. */
function peringkatQuwwat(graf: GrafKeluarga, jalur: JalurNasab): number {
  if (jalur.leluhurBersama.size > 1) return QUWWAT_KANDUNG;
  const [leluhur] = jalur.leluhurBersama;
  return graf.orang[jalur.idInduk]?.idAyah === leluhur ? QUWWAT_SEBAPAK : QUWWAT_SEIBU;
}

/** [R14-14] "anak ahli waris": orang tua langsungnya berkedudukan ahli waris (ashabul furudh atau ashabah), bukan dzawil arham. */
function apakahAnakAhliWaris(daftarPeran: Record<IdOrang, PeranAhliWaris>, jalur: JalurNasab): boolean | undefined {
  if (jalur.shinf === 3 || jalur.garis.length < 2) return undefined;
  const kunci = daftarPeran[jalur.garis.at(-2)!]?.kunci;
  return kunci !== undefined && kunci !== 'DZAWIL_ARHAM' && kunci !== 'BUKAN_AHLI_WARIS';
}

// ─── Memilih penerima ────────────────────────────────────────────────────────

/** [R14-14] shinf terdepan menghalangi yang lain; di dalamnya derajat → anak ahli waris → quwwat, per pihak ayah/ibu. */
function pilihPenerima(daftar: Kerabat[]): { penerima: Kerabat[]; tersisih: Kerabat[] } | TidakDidukung {
  const shinfTerdepan = Math.min(...daftar.map(kerabat => kerabat.shinf));
  if (shinfTerdepan > SHINF_TERAKHIR) throw new Error(`invariant: shinf ${shinfTerdepan} > ${SHINF_TERAKHIR} [R14-14]`);
  const terpilihPerPihak = [...kelompokkanPerPihak(daftar.filter(kerabat => kerabat.shinf === shinfTerdepan)).values()].map(saringSatuPihak);

  // Perbandingan derajat/quwwat lintas pihak ayah–ibu: KB hanya menyatakan 2/3 : 1/3 bila keduanya ada, tanpa urutannya.
  const ciri = (kerabat: Kerabat) => `${kerabat.derajat}|${kerabat.quwwat ?? ''}`;
  if (new Set(terpilihPerPihak.map(kelompok => ciri(kelompok[0]!))).size > 1) {
    return tolak('Kerabat pihak ayah dan pihak ibu berbeda derajat/quwwat; KB 14.11 tidak merumuskan perbandingan lintas pihak.', REFS_SHINF);
  }
  if (SHINF_SATU_PENERIMA_PER_PIHAK.has(shinfTerdepan) && terpilihPerPihak.some(kelompok => kelompok.length > 1)) {
    return tolak(`Beberapa kerabat sama kuat di shinf ${shinfTerdepan}; KB 14.11 tidak merumuskan cara membaginya.`, REFS_SHINF);
  }
  const penerima = terpilihPerPihak.flat();
  return { penerima, tersisih: daftar.filter(kerabat => !penerima.includes(kerabat)) };
}

function saringSatuPihak(kerabat: Kerabat[]): Kerabat[] {
  const terdekat = Math.min(...kerabat.map(lain => lain.derajat));
  const sederajat = kerabat.filter(lain => lain.derajat === terdekat);
  const anakAhliWaris = sederajat.filter(lain => lain.anakAhliWaris);
  const sesudahAnak = anakAhliWaris.length > 0 ? anakAhliWaris : sederajat;
  const terkuat = Math.min(...sesudahAnak.map(lain => lain.quwwat ?? QUWWAT_KANDUNG));
  return sesudahAnak.filter(lain => (lain.quwwat ?? QUWWAT_KANDUNG) === terkuat);
}

/** Shinf 1–2 satu kelompok ('semua'); shinf 3–7 dipisah pihak ayah dan pihak ibu. */
function kelompokkanPerPihak(daftar: Kerabat[]): Map<Sisi | 'semua', Kerabat[]> {
  const hasil = new Map<Sisi | 'semua', Kerabat[]>();
  for (const kerabat of daftar) {
    const kunci = SHINF_TANPA_PIHAK.has(kerabat.shinf) || !kerabat.sisi ? 'semua' : kerabat.sisi;
    hasil.set(kunci, [...(hasil.get(kunci) ?? []), kerabat]);
  }
  return hasil;
}

// ─── Membagi per tingkat ushul [R14-15] ──────────────────────────────────────

/** Bagian seorang ushul yang diteruskan ke keturunannya; menjadi satu langkah jejak. */
interface CatatanTurun { simpul: IdOrang; penerima: Map<IdOrang, Pecahan> }

/**
 * Muhammad: bagi di tingkat pertama (mulai dari `mulai`) yang jenis kelamin simpulnya berbeda, per simpul, lk 2 : pr 1;
 * bila tak pernah berbeda, di tingkat badan. Bagian tiap simpul diturunkan ke garis di bawahnya dengan cara yang sama.
 * Satu orang lewat dua garis dihitung pada tiap garisnya, lalu dijumlahkan.
 */
function bagiPerTingkat(daftarGaris: IdOrang[][], mulai: number, bagian: Pecahan, graf: GrafKeluarga, catatan: CatatanTurun[]): Map<IdOrang, Pecahan> {
  const tingkatBadan = daftarGaris[0]!.length - 1;
  const jenisKelamin = (idOrang: IdOrang) => graf.orang[idOrang]!.jenisKelamin;
  let tingkat = mulai;
  while (tingkat < tingkatBadan && new Set(daftarGaris.map(garis => jenisKelamin(garis[tingkat]!))).size === 1) tingkat++;

  const daftarSimpul = [...new Set(daftarGaris.map(garis => garis[tingkat]!))];
  const bobot = (idOrang: IdOrang) => (jenisKelamin(idOrang) === 'L' ? BOBOT_LAKI_LAKI : BOBOT_PEREMPUAN);
  const totalBobot = daftarSimpul.reduce((jumlah, idOrang) => jumlah + bobot(idOrang), 0n);

  const hasil = new Map<IdOrang, Pecahan>();
  for (const simpul of daftarSimpul) {
    const bagianSimpul = kali(bagian, pecahan(bobot(simpul), totalBobot));
    if (tingkat === tingkatBadan) {
      hasil.set(simpul, tambahkan(hasil.get(simpul), bagianSimpul));
      continue;
    }
    const turunan = bagiPerTingkat(daftarGaris.filter(garis => garis[tingkat] === simpul), tingkat + 1, bagianSimpul, graf, catatan);
    catatan.push({ simpul, penerima: turunan });
    for (const [idOrang, nilai] of turunan) hasil.set(idOrang, tambahkan(hasil.get(idOrang), nilai));
  }
  return hasil;
}

const tambahkan = (a: Pecahan | undefined, b: Pecahan): Pecahan => (a ? tambah(a, b) : b);

// ─── Jejak ────────────────────────────────────────────────────────────────────

/** Skala saham = jami'ah mas'alah dzawil arham, supaya Σ saham penerima sebuah simpul tetap terbaca. */
function jejakTurun(catatan: CatatanTurun[], masalah: bigint): LangkahJejak[] {
  return catatan.map((langkah): LangkahJejak => ({
    tahap: 'dzawilArham', refs: ['R14-15'], jenis: 'DZAWIL_ARHAM_TURUN', perantara: langkah.simpul, rasio: 'ikutMasalah', masalah, mahjub: [],
    saham: Object.fromEntries([...langkah.penerima].map(([idOrang, nilai]) => [idOrang, nilai.n * (masalah / nilai.d)])),
  }));
}

/** [R14-15] satu orang lewat dua jalur: perantaranya = orang tua langsung di tiap garis. */
function jejakDuaJalur(penerima: Kerabat[]): LangkahJejak[] {
  return penerima.filter(kerabat => kerabat.daftarGaris.length > 1).map((kerabat): LangkahJejak => ({
    tahap: 'dzawilArham', refs: REFS_DUA_JALUR, jenis: 'DZAWIL_ARHAM_DUA_JALUR', idOrang: kerabat.idOrang,
    perantara: [...new Set(kerabat.daftarGaris.map(garis => garis.at(-2)!))].sort(),
  }));
}
