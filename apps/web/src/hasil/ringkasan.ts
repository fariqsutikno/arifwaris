// Ringkasan layar hasil: HasilTampil (OK) → data siap tampil untuk sidebar, pohon, tabel, dan modal.
// Semua angka diambil dari engine (tabel, statusOrang, jejak); di sini hanya dipilih, diberi nama, dan diformat.

import type { GrafKeluarga, IdOrang, KunciAhliWaris, LangkahJejak, StatusOrang } from '@waris/engine';
import { fpb } from '@waris/math';
import { jenisDari, type Kelompok } from '../checklist';
import { namaOrang, penyebutAkhir } from '../format';
import { jalankan, type HasilMunasakhatOk, type HasilOk, type HasilTampil } from '../jalankan';
import type { Kasus } from '../kasus';

type LangkahTirkah = Extract<LangkahJejak, { jenis: 'TIRKAH' }>;
type Nisbah = Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }>['hubungan'];

export interface Penerima {
  id: IdOrang;
  nama: string;
  kunci: KunciAhliWaris | undefined;
  kelompok: Kelompok;
  saham: bigint;
  nominal: bigint;
  /** "Bagian tertentu 1/6", "Sisa (ashabah)", ... */
  keterangan: string;
  /** Pecahan fardh kelompoknya bila ada (dipakai mencocokkan ahwal). */
  fardh?: { n: bigint; d: bigint };
  ashabah: boolean;
  /** Kode alasan fardh dari jejak engine (ADA_FARU_WARITS, UMARIYYATAIN, ...), untuk mencocokkan ahwal. */
  kodeAlasan?: string;
}

export interface Terhalang { id: IdOrang; nama: string; kunci: KunciAhliWaris | undefined; kelompok: Kelompok; alasan: string }

export interface TentangKasus {
  kelas?: 'adilah' | 'ailah' | 'raddA' | 'raddB';
  ashl?: { nilai: bigint; hubungan?: Nisbah; penyebut: bigint[] };
  aul?: { dari: bigint; menjadi: bigint };
  tashih?: { dari: bigint; jadi: bigint; hubungan?: Nisbah };
  jamiah?: bigint;
}

export interface RingkasanHasil {
  jenis: 'biasa' | 'munasakhat';
  penerima: Penerima[];
  terhalang: Terhalang[];
  /** Tashih (kasus biasa) atau jami'ah (munasakhat): jumlah semua saham. */
  penyebut: bigint;
  tirkah: LangkahTirkah;
  sisaPembulatan: bigint;
  tentang: TentangKasus;
  statusOrang: Record<IdOrang, StatusOrang>;
}

export function ringkas(kasus: Kasus, tampil: HasilTampil): RingkasanHasil {
  if (tampil.jenis === 'biasa' && tampil.hasil.status === 'OK') return ringkasBiasa(kasus.graf, tampil.hasil);
  if (tampil.jenis === 'munasakhat' && tampil.hasil.status === 'OK') return ringkasMunasakhat(kasus.graf, tampil.hasil);
  throw new Error('ringkas hanya untuk hasil OK');
}

export type BentukPecahan = 'sederhana' | 'sama';

export function pecahanTeks(saham: bigint, penyebut: bigint, bentuk: BentukPecahan): string {
  if (bentuk === 'sama' || saham === 0n) return `${saham}/${penyebut}`;
  const faktor = fpb(saham, penyebut);
  return `${saham / faktor}/${penyebut / faktor}`;
}

/** Persen untuk tampilan saja (dua desimal, format Indonesia); bukan jalur hitung. */
export function persenTeks(saham: bigint, penyebut: bigint): string {
  const perSepuluhRibu = (saham * 10000n * 10n / penyebut + 5n) / 10n;   // dibulatkan ke 0,01%
  return `${(Number(perSepuluhRibu) / 100).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;
}

/** Kartu pembulatan hanya muncul bila, dengan pembulatan Rp 1, ada bagian yang bukan kelipatan Rp 1.000. */
export function adaTidakPas(kasus: Kasus): boolean {
  const tampil = jalankan({ ...kasus, satuanPembulatan: 1n });
  if (tampil.jenis === 'galat' || tampil.hasil.status !== 'OK') return false;
  const nominal = tampil.jenis === 'munasakhat'
    ? Object.values((tampil.hasil as HasilMunasakhatOk).nominal)
    : (tampil.hasil as HasilOk).tabel.baris.flatMap(baris => Object.values(baris.perOrang).map(orang => orang.nominal));
  return nominal.some(nilai => nilai % 1000n !== 0n);
}

// ─── Kasus biasa ──────────────────────────────────────────────────────────────

function ringkasBiasa(graf: GrafKeluarga, hasil: HasilOk): RingkasanHasil {
  const penyebut = penyebutAkhir(hasil.tabel);
  const alasanPerKelompok = new Map(hasil.jejak.flatMap(langkah => (langkah.jenis === 'FARDH' ? [[langkah.kelompok, langkah.alasan.kode] as const] : [])));
  const penerima = hasil.tabel.baris.flatMap(baris => Object.entries(baris.perOrang).map(([id, { saham, nominal }]): Penerima => {
    const kunci = kunciDari(hasil.statusOrang[id]);
    return {
      id, nama: namaOrang(graf, hasil.statusOrang, id), kunci, kelompok: kelompokDari(kunci), saham, nominal,
      keterangan: baris.fardh ? `Bagian tertentu ${baris.fardh.n}/${baris.fardh.d}` : 'Sisa (ashabah)',
      ...(baris.fardh ? { fardh: { n: baris.fardh.n, d: baris.fardh.d } } : {}),
      ashabah: !!baris.ashabah,
      ...(alasanPerKelompok.has(baris.kelompok) ? { kodeAlasan: alasanPerKelompok.get(baris.kelompok)! } : {}),
    };
  }));
  return {
    jenis: 'biasa', penerima, penyebut,
    terhalang: daftarTerhalang(graf, hasil.statusOrang),
    tirkah: langkahTirkah(hasil.jejak),
    sisaPembulatan: hasil.pembulatan.sisaPembulatan,
    tentang: tentangKasus(hasil.jejak),
    statusOrang: hasil.statusOrang,
  };
}

// ─── Munasakhat ───────────────────────────────────────────────────────────────

function ringkasMunasakhat(graf: GrafKeluarga, hasil: HasilMunasakhatOk): RingkasanHasil {
  // Tiap orang dinamai dari mayit tempat ia pertama kali menjadi ahli waris (bukan "kerabat" mayit lain).
  const statusOrang: Record<IdOrang, StatusOrang> = {};
  for (const { hasil: hasilMayit } of hasil.daftarLangkah) {
    for (const [id, status] of Object.entries(hasilMayit.statusOrang)) {
      if (!statusOrang[id] || (statusOrang[id]!.jenis !== 'ahliWaris' && status.jenis === 'ahliWaris')) statusOrang[id] = status;
    }
  }
  const penerima = Object.entries(hasil.saham).filter(([, saham]) => saham > 0n).map(([id, saham]): Penerima => {
    const kunci = kunciDari(statusOrang[id]);
    return {
      id, nama: namaOrang(graf, statusOrang, id), kunci, kelompok: kelompokDari(kunci), saham,
      nominal: hasil.nominal[id] ?? 0n, keterangan: `${saham} dari ${hasil.jamiah} saham jami'ah`, ashabah: false,
    };
  });
  const terhalang = hasil.daftarLangkah.flatMap(({ hasil: hasilMayit }) => daftarTerhalang(graf, hasilMayit.statusOrang))
    .filter((orang, indeks, semua) => semua.findIndex(lain => lain.id === orang.id) === indeks);
  const pertama = hasil.daftarLangkah[0]!.hasil;
  return {
    jenis: 'munasakhat', penerima, terhalang, penyebut: hasil.jamiah,
    tirkah: langkahTirkah(pertama.jejak),
    sisaPembulatan: hasil.pembulatan.sisaPembulatan,
    tentang: { ...tentangKasus(pertama.jejak), jamiah: hasil.jamiah },
    statusOrang,
  };
}

// ─── Bantuan ──────────────────────────────────────────────────────────────────

function tentangKasus(jejak: LangkahJejak[]): TentangKasus {
  const tentang: TentangKasus = {};
  const kelas = jejak.find(langkah => langkah.jenis === 'KELAS_MASALAH');
  if (kelas?.jenis === 'KELAS_MASALAH') tentang.kelas = kelas.kelas;
  const nisbahAshl = jejak.filter((langkah): langkah is Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }> =>
    langkah.jenis === 'PERBANDINGAN_NISAB' && langkah.tujuan === 'ashl');
  const terakhir = nisbahAshl.at(-1);
  if (terakhir) {
    tentang.ashl = { nilai: terakhir.hasil, hubungan: terakhir.hubungan, penyebut: [nisbahAshl[0]!.a, ...nisbahAshl.map(langkah => langkah.b)] };
  } else if (kelas?.jenis === 'KELAS_MASALAH') {
    tentang.ashl = { nilai: kelas.ashl, penyebut: [kelas.ashl] };
  }
  const aul = jejak.find(langkah => langkah.jenis === 'AUL');
  if (aul?.jenis === 'AUL') tentang.aul = { dari: aul.dari, menjadi: aul.menjadi };
  const tashih = jejak.find(langkah => langkah.jenis === 'TASHIH');
  if (tashih?.jenis === 'TASHIH') {
    const inkisar = jejak.find(langkah => langkah.jenis === 'PERBANDINGAN_NISAB' && langkah.tujuan === 'inkisar');
    tentang.tashih = { dari: tashih.dasar, jadi: tashih.hasil, ...(inkisar?.jenis === 'PERBANDINGAN_NISAB' ? { hubungan: inkisar.hubungan } : {}) };
  }
  return tentang;
}

function langkahTirkah(jejak: LangkahJejak[]): LangkahTirkah {
  const langkah = jejak.find((langkahIni): langkahIni is LangkahTirkah => langkahIni.jenis === 'TIRKAH');
  if (!langkah) throw new Error('jejak engine tanpa langkah TIRKAH');
  return langkah;
}

function daftarTerhalang(graf: GrafKeluarga, statusOrang: Record<IdOrang, StatusOrang>): Terhalang[] {
  return Object.entries(statusOrang).flatMap(([id, status]): Terhalang[] => {
    if (graf.orang[id]?.penghubung || (status.jenis !== 'mahjub' && status.jenis !== 'mamnu')) return [];
    const kunci = kunciDari(status);
    const alasan = status.jenis === 'mahjub'
      ? `Terhalang oleh ${status.oleh.map(idLain => namaOrang(graf, statusOrang, idLain)).join(' dan ')}.`
      : `Tidak mewarisi karena ${ALASAN_MANI[status.mani]}.`;
    return [{ id, nama: namaOrang(graf, statusOrang, id), kunci, kelompok: kelompokDari(kunci), alasan }];
  });
}

const ALASAN_MANI: Record<Extract<StatusOrang, { jenis: 'mamnu' }>['mani'], string> = {
  qatl: 'terlibat dalam kematian pewaris', ikhtilafDin: 'berbeda agama dengan pewaris', riqq: 'berstatus budak',
  istibham: 'urutan wafatnya tidak diketahui', daur: 'akan menimbulkan hitungan berputar (daur)',
};

function kunciDari(status: StatusOrang | undefined): KunciAhliWaris | undefined {
  if (!status || !('peran' in status)) return undefined;
  const kunci = status.peran.kunci;
  return kunci === 'DZAWIL_ARHAM' || kunci === 'BUKAN_AHLI_WARIS' ? undefined : kunci;
}

const kelompokDari = (kunci: KunciAhliWaris | undefined): Kelompok => (kunci && jenisDari(kunci)?.kelompok) || 'saudara';
