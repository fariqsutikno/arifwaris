// Linimasa mode "Langkah demi langkah" (docs/design/rencana-integrasi-langkah-demi-langkah.md bagian 2–3).
// Menerima hasil engine OK + graf; menyerahkan deretan tahap, tiap tahap berisi langkah kecil { bagian, narasi, papan,
// visual, refs }. Tampilan Teks, Sinema, dan rekaman memutar data yang sama.
// Kalimat diambil dari bab cerita (cerita.ts, semuanya templat diksi `narasi.cerita.*`): satu bab = satu tahap, satu baris = satu
// langkah. Visual diturunkan dari jejak dan tabel engine; tidak ada aturan fikih yang dihitung ulang di sini.
// Belum: templat tanya/logika/jembatan per tahap, munasakhat, taqdir, gharqa (PR berikutnya di rencana).

import type { GrafKeluarga, IdOrang } from '@waris/engine';
import { babAhliWaris, babBagian, babHarta, babHasil, babPembulatan, babPenyebut, babPenyesuaian, persamaanKotakAshl, type Bab } from './cerita.js';
import { buatKonteks, type HasilOk, type Konteks } from './context.js';
import { adaDzawilArham } from './dzawilArham.js';
import { babSisaHakDariKonteks } from './sisaHak.js';
import { susunLinimasaDzawilArham } from './linimasaDzawilArham.js';
import { LAMA, babAhliWarisSkrip, babBagianSkrip, babHartaSkrip, babHasilSkrip, babPembulatanSkrip, babPenyebutSkrip, babPenyesuaianSkrip, langkahPeta, type HasilSkrip } from './skrip.js';
import { papanDari, type BarisPenjelasan, type Hitungan, type JenisLangkah, type Kamus } from './segments.js';

export type IdTahap = 'harta' | 'ahliWaris' | 'bagian' | 'ashl' | 'penyesuaian' | 'tashih' | 'sisaHak' | 'hasil' | 'berantai' | 'menyambung' | 'hasilAkhir'
  | 'belumPasti' | 'kemungkinan' | 'pemberian' | 'wafatBersamaan' | 'dzawilArham';
export type BagianLangkah = 'keluarga' | 'hitung';
export type KolomLinimasa = 'bagian' | 'ashl' | 'aul' | 'radd' | 'tashih' | 'nominal';
/** `kolom:idOrang`, sel tabel yang terisi pada langkah itu. */
export type KodeSel = `${KolomLinimasa}:${IdOrang}`;
export type PeranPohon = 'pewaris' | 'ahliWaris' | 'mahjub' | 'bukan';
/** Baris hitungan harta; label teksnya milik UI (kode tetap, bukan kalimat). */
export interface BarisHarta { kode: 'kotor' | 'tajhiz' | 'hutang' | 'wasiat' | 'bersih'; nilai: bigint }
export interface IsiKotak { kelompok: string; anggota: IdOrang[]; jumlah: bigint }

export type Visual =
  | { jenis: 'harta'; baris: BarisHarta[] }
  | { jenis: 'pohon'; sorot: Record<IdOrang, PeranPohon> }
  /** Meja taqdir: tiap dunia (jika terbukti X) = satu batang saham pada jami'ah yang sama; `sorot` = indeks dunia yang sedang dibahas. */
  | { jenis: 'meja'; jamiah: bigint; dunia: Array<{ masalah: bigint; isi: IsiKotak[] }>; sorot?: number }
  /** Kotak wakil: `jumlah` kotak, tiap kotak dibelah `potong`; `isi` dalam satuan potongan (Σ isi = jumlah × potong). */
  | {
    jenis: 'kotak'; jumlah: bigint; potong: bigint; isi: IsiKotak[];
    /** Ukuran kotak sebelum 'aul/radd (satuan sama). jumlah > bingkai = 'aul (kotak di luar bingkai tidak muat); < = radd (kotak kosong hilang). */
    bingkai?: bigint;
  };

/** `sel`: sel tabel yang terisi pada langkah ini (tabel dibangun bertahap, terpisah dari visual tengah). */
type VisualKotak = Extract<Visual, { jenis: 'kotak' }>;

/** `hitungan`: baris hitung berlabel (label + isi) untuk tampilan fokus; `papan` tetap cadangan. */
export interface Langkah { bagian: BagianLangkah; jenis?: JenisLangkah; hitungan?: Hitungan; narasi: BarisPenjelasan; papan: BarisPenjelasan; visual?: Visual; sel?: KodeSel[]; refs: string[] }
/** `babak`: indeks tabel (satu mayit = satu babak) yang dibangun tahap ini; kosong = tahap tanpa tabel (pembukaan, penyambungan, hasil akhir). */
export interface Tahap { id: IdTahap; judul: string; langkah: Langkah[]; babak?: number }
export interface KolomTabel { kolom: KolomLinimasa; total?: bigint }
/** `tabel[babak]`: kolom tabel tiap babak (kasus biasa satu babak, munasakhat satu per mayit). `nama`: sebutan orang yang menimpa nama dari ringkasan (lintas mayit). */
export interface Linimasa { tahap: Tahap[]; tabel: KolomTabel[][]; nama?: Record<string, string> }

/** Riset 29e: kotak digambar paling banyak sebanyak ini; bilangan lebih besar diwakili kotak yang dibelah. */
export const BATAS_KOTAK = 24n;

export function susunLinimasa(hasil: HasilOk, graf: GrafKeluarga, opsi: { kamus: Kamus }): Linimasa {
  // Dzawil arham: pembagi dari tanzil, bukan pipeline fardh/ashl; linimasanya sendiri (tanpa tabel bertahap).
  if (adaDzawilArham(hasil)) return susunLinimasaDzawilArham(hasil, graf, opsi);
  const konteks = buatKonteks(hasil, graf, { kamus: opsi.kamus, bahasa: 'id' });
  const tahap = tahapBiasa(konteks, 0);
  const [pertama] = tahap;
  const [langkahPertama] = pertama?.langkah ?? [];
  if (pertama && langkahPertama) {
    const peta = langkahPeta(konteks);
    // Visual tahap pertama sudah tampil sejak langkah pembuka.
    pertama.langkah.unshift({ bagian: 'hitung', jenis: 'peta', narasi: peta, papan: papanDari(peta), refs: [], ...(langkahPertama.visual ? { visual: langkahPertama.visual } : {}) });
  }
  return { tahap, tabel: [kolomTabel(hasil)] };
}

const pilihBab = (skrip: HasilSkrip, lama: () => Bab | undefined): Bab | undefined => (skrip === LAMA ? lama() : skrip);

/** Tahap pembagian satu mayit (satu pipeline); `babak` = indeks tabelnya. Munasakhat memanggilnya per mayit. */
export function tahapBiasa(konteks: Konteks, babak: number): Tahap[] {
  const daftarTahap: Array<[IdTahap, Bab | undefined]> = [
    ['harta', pilihBab(babHartaSkrip(konteks), () => babHarta(konteks))],
    ['ahliWaris', pilihBab(babAhliWarisSkrip(konteks), () => babAhliWaris(konteks))],
    ['bagian', pilihBab(babBagianSkrip(konteks), () => babBagian(konteks))],
    ['ashl', pilihBab(babPenyebutSkrip(konteks), () => babPenyebut(konteks))],
    ['penyesuaian', pilihBab(babPenyesuaianSkrip(konteks), () => babPenyesuaian(konteks))],
    ['tashih', pilihBab(babPembulatanSkrip(konteks), () => babPembulatan(konteks))],
    ['sisaHak', babSisaHakDariKonteks(konteks)],
    ['hasil', pilihBab(babHasilSkrip(konteks), () => babHasil(konteks))],
  ];
  return daftarTahap.flatMap(([id, bab]) => (bab ? [{ ...susunTahap(konteks, id, bab), babak }] : []));
}

/** Kotak wakil untuk sebuah penyebut: ≤ BATAS_KOTAK digambar apa adanya; lebih besar = kotak lebih sedikit yang dibelah. */
export function kotakWakil(penyebut: bigint): { jumlah: bigint; potong: bigint } {
  if (penyebut <= BATAS_KOTAK) return { jumlah: penyebut, potong: 1n };
  for (let potong = 2n; potong <= penyebut; potong++) {
    if (penyebut % potong === 0n && penyebut / potong <= BATAS_KOTAK) return { jumlah: penyebut / potong, potong };
  }
  return { jumlah: penyebut, potong: 1n };
}

// ─── Tahap ────────────────────────────────────────────────────────────────────

function susunTahap(konteks: Konteks, id: IdTahap, bab: Bab): Tahap {
  const kolom = kolomTahap(konteks.hasil, id);
  const langkah: Langkah[] = bab.daftarBaris.map(baris => {
    const subjek = baris.subjek?.filter(idOrang => adaDiTabel(konteks.hasil, idOrang)) ?? [];
    const sel = kolom && subjek.length ? subjek.map(idOrang => kodeSel(kolom, idOrang)) : undefined;
    return { bagian: subjek.length ? 'keluarga' : 'hitung', ...(baris.jenis ? { jenis: baris.jenis } : {}), ...(baris.hitungan ? { hitungan: baris.hitungan } : {}), narasi: baris, papan: papanDari(baris), refs: baris.refs, ...(sel ? { sel } : {}) };
  });
  const visualTahap = visualAwal(konteks, id);
  const persamaan = id === 'ashl' && visualTahap?.jenis === 'kotak' ? persamaanKotakAshl(konteks) : [];
  if (persamaan.length && visualTahap?.jenis === 'kotak') {
    // Kotak kosong dulu, lalu terisi satu kelompok per langkah; langkah penutup (kalimat "dipotong") tetap di akhir.
    let isi: IsiKotak[] = [];
    const bertahap = persamaan.map(satu => {
      isi = [...isi, { kelompok: satu.kelompok, anggota: satu.anggota, jumlah: satu.jumlah }];
      const sel = kolom ? satu.anggota.map(idOrang => kodeSel(kolom, idOrang)) : undefined;
      return { bagian: 'keluarga' as const, ...(satu.baris.jenis ? { jenis: satu.baris.jenis } : {}), ...(satu.baris.hitungan ? { hitungan: satu.baris.hitungan } : {}), narasi: satu.baris, papan: papanDari(satu.baris), refs: satu.baris.refs, visual: { ...visualTahap, isi }, ...(sel ? { sel } : {}) };
    });
    langkah.splice(Math.max(langkah.length - 1, 0), 0, ...bertahap);
    langkah[0] = { ...langkah[0]!, visual: { ...visualTahap, isi: [] } };
  } else if (visualTahap && langkah[0]) langkah[0] = { ...langkah[0], visual: visualTahap };
  // Kolom yang dibahas tahap ini terisi penuh sebelum tahap selesai, walau narasinya tidak menyebut tiap orang.
  const terakhir = langkah.at(-1);
  if (kolom && terakhir) {
    const sudah = new Set(langkah.flatMap(satu => satu.sel ?? []));
    const sisa = semuaPenerima(konteks.hasil).map(idOrang => kodeSel(kolom, idOrang)).filter(kode => !sudah.has(kode));
    if (sisa.length) langkah[langkah.length - 1] = { ...terakhir, sel: [...(terakhir.sel ?? []), ...sisa] };
  }
  return { id, judul: bab.judul, langkah };
}

function visualAwal(konteks: Konteks, id: IdTahap): Visual | undefined {
  const { hasil } = konteks;
  if (id === 'harta') return visualHarta(konteks);
  if (id === 'ahliWaris') return visualPohon(hasil);
  if (id === 'ashl') return visualKotak(hasil, 'ashl', kotakWakil(hasil.tabel.totalKolom.ashl!));
  if (id === 'penyesuaian') return visualPenyesuaian(hasil);
  if (id === 'tashih' && hasil.tabel.totalKolom.tashih !== undefined) {
    // Kotak tetap sama dengan sebelumnya (asal masalah atau hasil 'aul/radd); tashih memotong ulang tiap kotak.
    const dasar = kotakWakil(hasil.tabel.totalKolom.aul ?? hasil.tabel.totalKolom.radd ?? hasil.tabel.totalKolom.ashl!);
    if (hasil.tabel.totalKolom.tashih % dasar.jumlah !== 0n) throw new Error('tashih tidak habis dibagi jumlah kotak dasar');
    return visualKotak(hasil, 'tashih', { jumlah: dasar.jumlah, potong: hasil.tabel.totalKolom.tashih / dasar.jumlah });
  }
  return undefined;
}

function visualHarta(konteks: Konteks): Visual | undefined {
  const [tirkah] = konteks.daftarLangkah('TIRKAH');
  if (!tirkah) return undefined;
  const potongan: BarisHarta[] = [
    { kode: 'tajhiz', nilai: tirkah.tajhiz }, { kode: 'hutang', nilai: tirkah.hutang }, { kode: 'wasiat', nilai: tirkah.wasiatDipakai },
  ];
  return { jenis: 'harta', baris: [{ kode: 'kotor', nilai: tirkah.kotor }, ...potongan.filter(baris => baris.nilai > 0n), { kode: 'bersih', nilai: tirkah.bersih }] };
}

function visualPohon(hasil: HasilOk): Visual {
  const sorot: Record<IdOrang, PeranPohon> = {};
  for (const [id, status] of Object.entries(hasil.statusOrang)) {
    if (status.jenis === 'ahliWaris') sorot[id] = 'ahliWaris';
    else if (status.jenis === 'mahjub') sorot[id] = 'mahjub';
    else if (status.jenis === 'mamnu') sorot[id] = 'bukan';
  }
  return { jenis: 'pohon', sorot };
}

function visualKotak(hasil: HasilOk, kolomSel: 'ashl' | 'aul' | 'radd' | 'tashih', ukuran: { jumlah: bigint; potong: bigint }): VisualKotak {
  // Isi dalam satuan potongan: saham kelompok di kolom itu dikali sisa belahan (ashl ≤ 24 → belahan 1, isi = saham).
  const potongan = ukuran.jumlah * ukuran.potong;
  const penyebut = hasil.tabel.totalKolom[kolomSel]!;
  if (potongan % penyebut !== 0n) throw new Error(`kotak ${kolomSel} tidak pas: ${potongan} potongan untuk penyebut ${penyebut}`);
  const belahanPerSaham = potongan / penyebut;
  const isi = hasil.tabel.baris.map(baris => ({ kelompok: baris.kelompok, anggota: baris.anggota, jumlah: baris.sel[kolomSel]! * belahanPerSaham }));
  return { jenis: 'kotak', ...ukuran, isi };
}

/**
 * [R09-4] 'aul / [R09-7] radd: kotak digambar menurut penyebut baru. Bingkai lama hanya digambar bila saham tiap kelompok
 * tidak berubah satuannya (sel = sel asal masalah): 'aul dan radd tanpa pasangan. Radd dengan pasangan [R09-9] membentuk
 * masalah baru dengan satuan lain, jadi tampil sebagai kotak baru tanpa bingkai.
 */
function visualPenyesuaian(hasil: HasilOk): Visual | undefined {
  const { totalKolom, baris } = hasil.tabel;
  const kolom = totalKolom.aul !== undefined ? 'aul' : totalKolom.radd !== undefined ? 'radd' : undefined;
  if (!kolom) return undefined;
  const ukuran = kotakWakil(totalKolom[kolom]!);
  const visual = visualKotak(hasil, kolom, ukuran);
  const sesatuan = baris.every(satu => satu.sel[kolom] === satu.sel.ashl);
  const ashl = totalKolom.ashl!;
  return sesatuan && ashl % ukuran.potong === 0n ? { ...visual, bingkai: ashl / ukuran.potong } : visual;
}

// ─── Tabel ────────────────────────────────────────────────────────────────────

export function kolomTabel(hasil: HasilOk): KolomTabel[] {
  const { totalKolom } = hasil.tabel;
  const daftar: KolomTabel[] = [{ kolom: 'bagian' }, { kolom: 'ashl', total: totalKolom.ashl! }];
  if (totalKolom.aul !== undefined) daftar.push({ kolom: 'aul', total: totalKolom.aul });
  if (totalKolom.radd !== undefined) daftar.push({ kolom: 'radd', total: totalKolom.radd });
  if (totalKolom.tashih !== undefined) daftar.push({ kolom: 'tashih', total: totalKolom.tashih });
  return [...daftar, { kolom: 'nominal' }];
}

function kolomTahap(hasil: HasilOk, id: IdTahap): KolomLinimasa | undefined {
  if (id === 'bagian') return 'bagian';
  if (id === 'ashl') return 'ashl';
  if (id === 'penyesuaian') return hasil.tabel.totalKolom.aul !== undefined ? 'aul' : hasil.tabel.totalKolom.radd !== undefined ? 'radd' : undefined;
  if (id === 'tashih') return hasil.tabel.totalKolom.tashih !== undefined ? 'tashih' : undefined;
  if (id === 'hasil') return 'nominal';
  return undefined;
}

const kodeSel = (kolom: KolomLinimasa, idOrang: IdOrang): KodeSel => `${kolom}:${idOrang}`;
const semuaPenerima = (hasil: HasilOk): IdOrang[] => hasil.tabel.baris.flatMap(baris => baris.anggota);
const adaDiTabel = (hasil: HasilOk, idOrang: IdOrang): boolean => hasil.tabel.baris.some(baris => baris.anggota.includes(idOrang));
