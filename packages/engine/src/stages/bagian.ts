// Tahap 2 — Bagian tiap ahli waris: furudh (bab 04), ashabah (bab 05), kasus khusus (bab 07 & 08).
//   Masuk : `efektif` (lolos hajb) dan `kandidat` (sebelum hajb; saudara yang mahjub tetap
//           mengurangi bagian ibu [R06-6]).
//   Keluar: daftar kelompok (satu baris tabel mas'alah per kelompok) + jejak tiap keputusan.
// Urutan pemeriksaan mengikuti KB: pasangan → ibu → nenek → keturunan → ayah → saudara seibu
// → kakek → saudara kandung/sebapak → hawasyi lain. Urutan ini juga urutan baris tabel.

import { bandingkan, kali, kurang, pecahan, tambah, type Pecahan } from '@waris/math';
import type { AlasanFardh, IdKelompok, IdOrang, KunciAhliWaris, LangkahJejak } from '../types.js';
import { jaddWalIkhwah } from './jaddWalIkhwah.js';
import { adalahAkdariyyah, adalahMusyarrakah, adalahUmariyyatain } from './khusus.js';
import { bobotRata, buatKelompok, penerimaSisa, satuanRuus, type AhliWaris, type KelompokBagian, type TidakDidukung } from './model.js';

const NOL = pecahan(0n);
const SATU = pecahan(1n);
const NISF = pecahan(1n, 2n);
const RUBU = pecahan(1n, 4n);
const TSUMUN = pecahan(1n, 8n);
const TSULUTSAN = pecahan(2n, 3n);
const TSULUTS = pecahan(1n, 3n);
const SUDUS = pecahan(1n, 6n);

const KUNCI_SAUDARA: KunciAhliWaris[] = ['SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK', 'SAUDARA_SEIBU', 'SAUDARI_SEIBU'];
const HAWASYI_ASHABAH: KunciAhliWaris[] = ['KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK', 'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK'];

type JenisAshabah = 'binNafsi' | 'bilGhair' | 'maalGhair';
type HasilTahapBagian = { daftarKelompok: KelompokBagian[]; jejak: LangkahJejak[] };

export function tetapkanBagian(efektif: AhliWaris[], kandidat: AhliWaris[]): HasilTahapBagian | TidakDidukung {
  const penyusun = buatPenyusun(efektif, kandidat);

  const fardhPasangan = bagianPasangan(penyusun);
  bagianIbu(penyusun, fardhPasangan);
  bagianNenek(penyusun);
  bagianKeturunan(penyusun);
  const [ayah] = penyusun.dari('AYAH');
  if (ayah) bagianAyahAtauKakek(penyusun, 'AYAH', ayah, ['R04-5']);
  const musyarrakah = bagianSaudaraSeibu(penyusun);
  const [kakek] = penyusun.dari('KAKEK');
  if (kakek) {
    const tidakDidukung = bagianKakek(penyusun, kakek);
    if (tidakDidukung) return tidakDidukung;
  }
  // Bersama kakek, bagian saudara kandung/sebapak sudah diatur bab 08 di atas.
  if (!kakek && !musyarrakah) {
    const saudariKandungBerfardh = bagianGarisSaudara(penyusun, 'kandung', undefined);
    bagianGarisSaudara(penyusun, 'sebapak', saudariKandungBerfardh);
  }
  bagianHawasyi(penyusun);

  const kelompokPenerimaSisa = penyusun.daftarKelompok.filter(penerimaSisa);
  if (kelompokPenerimaSisa.length > 1) {
    throw new Error(`invariant: lebih dari satu kelompok ashabah (${kelompokPenerimaSisa.map(kelompok => kelompok.id)})`);
  }
  return { daftarKelompok: penyusun.daftarKelompok, jejak: penyusun.jejak };
}

// ─── Pasangan [R04-2] [R04-3] ─────────────────────────────────────────────────

/** Mengembalikan fardh pasangan (0 bila tidak ada), dipakai 'umariyyatain. */
function bagianPasangan(penyusun: Penyusun): Pecahan {
  const { faruWarits } = penyusun;
  const adaFaruWarits = faruWarits.length > 0;
  const alasan: AlasanFardh = adaFaruWarits ? { kode: 'ADA_FARU_WARITS', oleh: ids(faruWarits) } : { kode: 'TANPA_FARU_WARITS' };
  let fardhPasangan = NOL;

  const suami = penyusun.dari('SUAMI');
  if (suami.length > 0) {
    fardhPasangan = adaFaruWarits ? RUBU : NISF;
    penyusun.tambahFardh('SUAMI', suami, fardhPasangan, alasan, ['R04-2']);
    if (adaFaruWarits) penyusun.catatNuqshan(suami, NISF, RUBU, faruWarits, ['R04-2']);
  }
  const istri = penyusun.dari('ISTRI');
  if (istri.length > 0) {
    fardhPasangan = adaFaruWarits ? TSUMUN : RUBU;
    penyusun.tambahFardh('ISTRI', istri, fardhPasangan, alasan, ['R04-2', 'R04-3']);
    if (adaFaruWarits) penyusun.catatNuqshan(istri, RUBU, TSUMUN, faruWarits, ['R04-2']);
  }
  return fardhPasangan;
}

// ─── Ibu [R04-4] ──────────────────────────────────────────────────────────────

function bagianIbu(penyusun: Penyusun, fardhPasangan: Pecahan): void {
  const ibu = penyusun.dari('IBU');
  if (ibu.length === 0) return;
  const { faruWarits, ikhwah } = penyusun;

  if (adalahUmariyyatain(penyusun.efektif, ikhwah.length)) {
    // [R07-1] ibu 1/3 dari sisa setelah pasangan, supaya ayah tidak kurang dari ibu.
    penyusun.jejak.push({ tahap: 'furudh', refs: ['R07-1'], jenis: 'KASUS_KHUSUS', nama: 'umariyyatain' });
    penyusun.tambahFardh('IBU', ibu, kali(TSULUTS, kurang(SATU, fardhPasangan)), { kode: 'UMARIYYATAIN', fardhPasangan }, ['R07-1', 'R04-4']);
    return;
  }

  // Ibu turun dari 1/3 ke 1/6 karena ada far'u warits, atau 2+ saudara (termasuk yang mahjub).
  const penyebabTurun = faruWarits.length > 0 ? faruWarits : ikhwah.length >= 2 ? ikhwah : [];
  const alasan: AlasanFardh = faruWarits.length > 0 ? { kode: 'ADA_FARU_WARITS', oleh: ids(faruWarits) }
    : penyebabTurun.length > 0 ? { kode: 'JAM_IKHWAH', oleh: ids(ikhwah) }
    : { kode: 'TANPA_FARU_WARITS_DAN_IKHWAH' };
  penyusun.tambahFardh('IBU', ibu, penyebabTurun.length > 0 ? SUDUS : TSULUTS, alasan, ['R04-4']);
  if (penyebabTurun.length > 0) penyusun.catatNuqshan(ibu, TSULUTS, SUDUS, penyebabTurun, ['R04-4', 'R06-6']);
}

// ─── Nenek [R04-7] [R04-8] ────────────────────────────────────────────────────

function bagianNenek(penyusun: Penyusun): void {
  // Semua nenek yang lolos hajb berbagi 1/6.
  const nenek = penyusun.dari('NENEK_DARI_IBU', 'NENEK_DARI_AYAH');
  if (nenek.length > 0) penyusun.tambahFardh('JADDAH', nenek, SUDUS, { kode: 'NENEK_TANPA_IBU', banyaknya: nenek.length }, ['R04-7', 'R04-8']);
}

// ─── Keturunan [R04-11] [R04-12] [R04-13] ─────────────────────────────────────

/**
 * Anak/cucu perempuan diproses per lapis (anak, cucu, cicit, ...), dari yang terdekat:
 *   - ada laki-laki sederajat/lebih atas, atau 2/3 sudah habis → ikut ashabah laki-laki;
 *   - lapis pertama yang berfardh → 1/2 (sendiri) atau 2/3 (2+);
 *   - lapis berikutnya setelah 1/2 → 1/6 takmilah (penyempurna 2/3).
 */
function bagianKeturunan(penyusun: Penyusun): void {
  const { faruMudzakkar } = penyusun;
  const perempuanIkutAshabah: AhliWaris[] = [];
  const kedalamanLakiLaki = faruMudzakkar[0]?.kekerabatan.kedalamanKeturunan ?? Number.POSITIVE_INFINITY;
  let tsulutsanTerpakai = NOL;
  let lapisDiAtas: AhliWaris[] = [];

  const keturunanPerempuan = penyusun.dari('ANAK_PR', 'CUCU_PR');
  const daftarLapis = [...new Set(keturunanPerempuan.map(pr => pr.kekerabatan.kedalamanKeturunan))].sort((a, b) => a - b);
  for (const kedalaman of daftarLapis) {
    const perempuan = keturunanPerempuan.filter(pr => pr.kekerabatan.kedalamanKeturunan === kedalaman);
    const idKelompok = kedalaman === 1 ? 'ANAK_PR' : `CUCU_PR_${kedalaman}`;
    if (kedalaman >= kedalamanLakiLaki || bandingkan(tsulutsanTerpakai, TSULUTSAN) === 0) {
      // Diashabahkan laki-laki sederajat, atau qarib mubarak ketika 2/3 sudah habis.
      perempuanIkutAshabah.push(...perempuan);
    } else if (tsulutsanTerpakai.n === 0n) {
      tsulutsanTerpakai = perempuan.length === 1 ? NISF : TSULUTSAN;
      penyusun.tambahFardh(idKelompok, perempuan, tsulutsanTerpakai, { kode: 'TANPA_MUASHSHIB', banyaknya: perempuan.length },
        [kedalaman === 1 ? 'R04-11' : 'R04-12']);
    } else {
      penyusun.tambahFardh(idKelompok, perempuan, SUDUS, { kode: 'TAKMILAH', bersama: ids(lapisDiAtas) }, ['R04-12']);
      penyusun.catatNuqshan(perempuan, perempuan.length === 1 ? NISF : TSULUTSAN, SUDUS, lapisDiAtas, ['R04-12']);
      tsulutsanTerpakai = TSULUTSAN;
    }
    lapisDiAtas = perempuan;
  }

  if (faruMudzakkar.length > 0) {
    const adaPerempuanDiAtasLakiLaki = perempuanIkutAshabah.some(pr => pr.kekerabatan.kedalamanKeturunan < kedalamanLakiLaki);
    penyusun.tambahAshabah('ASHABAH', [...faruMudzakkar, ...perempuanIkutAshabah], perempuanIkutAshabah.length > 0 ? 'bilGhair' : 'binNafsi',
      adaPerempuanDiAtasLakiLaki ? ['R05-4', 'R04-13'] : ['R05-4']);
  } else if (perempuanIkutAshabah.length > 0) {
    throw new Error("invariant: cucu pr tanpa fardh dan tanpa mu'ashshib seharusnya terhijab [R04-13]");
  }
}

// ─── Ayah [R04-5] / kakek tanpa saudara [R04-6] ───────────────────────────────

/** Ada anak/cucu lk → 1/6; hanya anak/cucu pr → 1/6 + sisa; tanpa keturunan → ashabah. */
function bagianAyahAtauKakek(penyusun: Penyusun, idKelompok: IdKelompok, ahliWaris: AhliWaris, refs: string[]): void {
  const { faruMudzakkar, faruWarits } = penyusun;
  if (faruMudzakkar.length > 0) {
    penyusun.tambahFardh(idKelompok, [ahliWaris], SUDUS, { kode: 'ADA_FARU_MUDZAKKAR', oleh: ids(faruMudzakkar) }, refs);
  } else if (faruWarits.length > 0) {
    penyusun.daftarKelompok.push(buatKelompok(idKelompok, { [ahliWaris.idOrang]: 1n }, { jenis: 'fardhAshabah', fardh: SUDUS }));
    penyusun.jejak.push({ tahap: 'furudh', refs, jenis: 'FARDH', kelompok: idKelompok, fardh: SUDUS, alasan: { kode: 'ADA_FARU_MUANNATS', oleh: ids(faruWarits) } });
    penyusun.jejak.push({ tahap: 'ashabah', refs, jenis: 'ASHABAH', kelompok: idKelompok, jenisAshabah: 'binNafsi' });
  } else {
    penyusun.tambahAshabah(idKelompok, [ahliWaris], 'binNafsi', refs);
  }
}

// ─── Saudara seibu [R04-16], musyarrakah [R07-2] ──────────────────────────────

/** Mengembalikan true bila musyarrakah (saudara kandung ikut berbagi 1/3 dengan saudara seibu). */
function bagianSaudaraSeibu(penyusun: Penyusun): boolean {
  const awladUmm = penyusun.dari('SAUDARA_SEIBU', 'SAUDARI_SEIBU');
  if (adalahMusyarrakah(penyusun.efektif)) {
    penyusun.jejak.push({ tahap: 'furudh', refs: ['R07-2'], jenis: 'KASUS_KHUSUS', nama: 'musyarrakah' });
    penyusun.tambahFardh('MUSYARRAKAH', [...awladUmm, ...penyusun.dari('SAUDARA_KANDUNG', 'SAUDARI_KANDUNG')], TSULUTS, { kode: 'MUSYARRAKAH' }, ['R07-2']);
    return true;
  }
  if (awladUmm.length > 0) {
    penyusun.tambahFardh('AWLAD_UMM', awladUmm, awladUmm.length === 1 ? SUDUS : TSULUTS, { kode: 'KALALAH', banyaknya: awladUmm.length }, ['R04-16']);
  }
  return false;
}

// ─── Kakek [R04-6] dan bab 08 ─────────────────────────────────────────────────

function bagianKakek(penyusun: Penyusun, kakek: AhliWaris): TidakDidukung | undefined {
  const saudaraBersamaKakek = penyusun.dari('SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK');

  if (adalahAkdariyyah(penyusun.efektif)) {
    // [R08-5] kakek 1/6 dan saudari 1/2 → 'aul, lalu keduanya dibagi 2:1 dari gabungan saham (tashih).
    const [saudari] = saudaraBersamaKakek;
    penyusun.jejak.push({ tahap: 'furudh', refs: ['R08-5'], jenis: 'KASUS_KHUSUS', nama: 'akdariyyah' });
    penyusun.jejak.push({ tahap: 'furudh', refs: ['R08-5'], jenis: 'FARDH', kelompok: 'AKDARIYYAH', fardh: SUDUS, alasan: { kode: 'AKDARIYYAH', porsi: 'jadd' } });
    penyusun.tambahFardh('AKDARIYYAH', [kakek, saudari!], tambah(SUDUS, NISF), { kode: 'AKDARIYYAH', porsi: 'ukht' },
      ['R08-5'], { [kakek.idOrang]: 2n, [saudari!.idOrang]: 1n });
    return undefined;
  }

  if (saudaraBersamaKakek.length === 0) {
    bagianAyahAtauKakek(penyusun, 'KAKEK', kakek, ['R04-6']);
    return undefined;
  }

  // Bab 08: kakek bersama saudara — dihitung setelah semua furudh lain diketahui.
  const jumlahFurudh = penyusun.daftarKelompok.reduce(
    (jumlah, kelompok) => (kelompok.bagian.jenis === 'fardh' ? tambah(jumlah, kelompok.bagian.fardh) : jumlah), NOL);
  const hasil = jaddWalIkhwah(kakek, saudaraBersamaKakek, jumlahFurudh, penyusun.adaFaruMuannats);
  if ('status' in hasil) return hasil;
  penyusun.daftarKelompok.push(...hasil.daftarKelompok);
  penyusun.jejak.push(...hasil.jejak);
  return undefined;
}

// ─── Saudara kandung / sebapak tanpa kakek [R04-14] [R05-5] ───────────────────

/**
 * Satu garis saudara. Urutan kemungkinan:
 *   ada saudara lk → semua ashabah (bil ghair bila ada saudari);
 *   hanya saudari + ada anak/cucu pr → ashabah ma'al ghair;
 *   saudari sebapak + tepat satu saudari kandung berfardh → 1/6 takmilah;
 *   selain itu → 1/2 (sendiri) atau 2/3 (2+).
 * Mengembalikan saudari yang mendapat fardh, untuk takmilah garis sebapak.
 */
function bagianGarisSaudara(penyusun: Penyusun, garis: 'kandung' | 'sebapak', saudariKandungBerfardh: AhliWaris[] | undefined): AhliWaris[] {
  const saudaraLk = penyusun.dari(garis === 'kandung' ? 'SAUDARA_KANDUNG' : 'SAUDARA_SEBAPAK');
  const saudari = penyusun.dari(garis === 'kandung' ? 'SAUDARI_KANDUNG' : 'SAUDARI_SEBAPAK');

  if (saudaraLk.length > 0) {
    penyusun.tambahAshabah('ASHABAH', [...saudaraLk, ...saudari], saudari.length > 0 ? 'bilGhair' : 'binNafsi', ['R05-4']);
    return [];
  }
  if (saudari.length === 0) return [];
  if (penyusun.adaFaruMuannats) {
    penyusun.tambahAshabah('ASHABAH', saudari, 'maalGhair', ['R05-5']);
    return [];
  }
  if (garis === 'sebapak' && saudariKandungBerfardh?.length === 1) {
    // [R04-14] saudari sebapak bersama satu saudari kandung: 1/6 takmilah.
    penyusun.tambahFardh('SAUDARI_SEBAPAK', saudari, SUDUS, { kode: 'TAKMILAH', bersama: ids(saudariKandungBerfardh) }, ['R04-14']);
    penyusun.catatNuqshan(saudari, saudari.length === 1 ? NISF : TSULUTSAN, SUDUS, saudariKandungBerfardh, ['R04-14']);
    return [];
  }
  penyusun.tambahFardh(garis === 'kandung' ? 'SAUDARI_KANDUNG' : 'SAUDARI_SEBAPAK', saudari, saudari.length === 1 ? NISF : TSULUTSAN,
    { kode: 'KALALAH', banyaknya: saudari.length }, ['R04-14']);
  return saudari;
}

// ─── Hawasyi lain: bani al-ikhwah, 'umumah [R05-3] ────────────────────────────

function bagianHawasyi(penyusun: Penyusun): void {
  // Hajb sudah menyisakan paling banyak satu tingkat hawasyi, jadi mereka satu kelompok ashabah.
  const hawasyi = penyusun.dari(...HAWASYI_ASHABAH);
  if (hawasyi.length > 0) penyusun.tambahAshabah('ASHABAH', hawasyi, 'binNafsi', ['R05-3']);
}

// ─── Penyusun: tempat menampung kelompok & jejak selama tahap ini ─────────────

type Penyusun = ReturnType<typeof buatPenyusun>;

function buatPenyusun(efektif: AhliWaris[], kandidat: AhliWaris[]) {
  const daftarKelompok: KelompokBagian[] = [];
  const jejak: LangkahJejak[] = [];
  const dari = (...kunci: KunciAhliWaris[]) => efektif.filter(ahliWaris => kunci.includes(ahliWaris.kunci));
  const faruWarits = dari('ANAK_LK', 'ANAK_PR', 'CUCU_LK', 'CUCU_PR');
  const faruMudzakkar = dari('ANAK_LK', 'CUCU_LK');

  return {
    efektif, daftarKelompok, jejak, dari,
    faruWarits,
    faruMudzakkar,
    adaFaruMuannats: faruWarits.length > 0 && faruMudzakkar.length === 0,
    ikhwah: kandidat.filter(ahliWaris => KUNCI_SAUDARA.includes(ahliWaris.kunci)),

    tambahFardh(idKelompok: IdKelompok, anggota: AhliWaris[], fardh: Pecahan, alasan: AlasanFardh, refs: string[],
      bobot: Record<IdOrang, bigint> = bobotRata(anggota)): void {
      daftarKelompok.push(buatKelompok(idKelompok, bobot, { jenis: 'fardh', fardh }));
      jejak.push({ tahap: 'furudh', refs, jenis: 'FARDH', kelompok: idKelompok, fardh, alasan });
    },

    tambahAshabah(idKelompok: IdKelompok, anggota: AhliWaris[], jenisAshabah: JenisAshabah, refs: string[]): void {
      // Bil ghair: laki-laki 2 bagian, perempuan 1. Selain itu rata.
      const bobot = jenisAshabah === 'bilGhair'
        ? Object.fromEntries(anggota.map(ahliWaris => [ahliWaris.idOrang, satuanRuus(ahliWaris)]))
        : bobotRata(anggota);
      daftarKelompok.push(buatKelompok(idKelompok, bobot, { jenis: 'ashabah', jenisAshabah }));
      jejak.push({ tahap: 'ashabah', refs, jenis: 'ASHABAH', kelompok: idKelompok, jenisAshabah });
    },

    /** Hajb nuqshan: bagian turun dari `dari` ke `menjadi` karena `penyebab`. Hanya dicatat di jejak. */
    catatNuqshan(terdampak: AhliWaris[], dari: Pecahan, menjadi: Pecahan, penyebab: AhliWaris[], refs: string[]): void {
      for (const ahliWaris of terdampak) {
        jejak.push({ tahap: 'furudh', refs, jenis: 'HAJB_NUQSHAN', terdampak: ahliWaris.idOrang, dari, menjadi, penyebab: ids(penyebab) });
      }
    },
  };
}

const ids = (daftar: AhliWaris[]) => daftar.map(ahliWaris => ahliWaris.idOrang);
