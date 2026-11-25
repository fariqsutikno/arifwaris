// Tahap 6c — piutang pewaris pada ahli waris (bab 11.4 [R11-4], hanya [SYF]).
// Menerima: hasil `hitung` OK yang dihitung atas tirkah bersih = barang + piutang, dan per penghutang:
// hutangnya (H) serta apakah ia setuju dipotong. S = nominal si penghutang dari SELURUH tirkah.
// Menyerahkan: per ahli waris uang yang benar-benar diterima, hutang yang dipotong, dan yang dibayar.
// Saham/ashl/tashih tidak disentuh. Tidak bercampur dengan `sudahDiterima` (bab 11.3): itu uang diterima, ini utang.

import type { Uang } from '@waris/math';
import type { HasilEngine, IdOrang, LangkahJejak, Pertanyaan } from '../types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
type PerluInput = Extract<HasilEngine, { status: 'PERLU_INPUT' }>;
type TidakDidukung = Extract<HasilEngine, { status: 'TIDAK_DIDUKUNG' }>;

/** [R11-4] syarat pemotongan: rela / menolak mengakui atau pailit sah; mengakui dan mampu tetapi tidak rela tidak sah sepihak. */
export type PersetujuanPemotongan = 'setuju' | 'menolakAtauPailit' | 'mengakuiMampuTidakSetuju';

export interface PenghutangAhliWaris {
  idOrang: IdOrang;
  hutangKePewaris: Uang;
  /** Kosong = belum ditanyakan → PERLU_INPUT. */
  persetujuan?: PersetujuanPemotongan;
}

export interface PiutangAhliWaris {
  status: 'OK';
  perOrang: Record<IdOrang, {
    /** S: bagian dari seluruh tirkah (barang + piutang). */
    bagian: Uang;
    /** Hutang yang dipotong dari bagiannya (min(S, H)); 0 bila bukan penghutang. */
    hutangDipotong: Uang;
    /** Uang yang diterimanya (dari barang dan dari pembayaran penghutang): S − hutangDipotong. */
    uangDiterima: Uang;
    /** H − S bila S < H, selain itu 0. */
    membayar: Uang;
  }>;
  /** Σ membayar: kas tambahan yang dibagi ke ahli waris lain sesuai saham. */
  totalPembayaran: Uang;
  /** Bagian yang bukan milik ahli waris mana pun (selisih pembulatan, sisa pasangan): tirkah − Σ bagian. */
  sisaLainnya: Uang;
  jejak: LangkahJejak[];
}

export function hitungPiutangAhliWaris(
  hasil: HasilOk,
  barang: Uang,
  piutang: Uang,
  penghutang: PenghutangAhliWaris[],
): PiutangAhliWaris | PerluInput | TidakDidukung {
  // [R11-4] hanya [SYF] terverifikasi; overlay lain belum dikaji (bab 18.4).
  if (hasil.ruleset !== 'syafii') {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Piutang pada ahli waris baru dikaji untuk madzhab Syafi\'i.', refs: ['R11-4'] };
  }
  const bagian = ambilNominal(hasil);
  const masalah = periksaMasukan(bagian, piutang, penghutang);
  if (masalah.length > 0) return { status: 'PERLU_INPUT', pertanyaan: masalah };
  // [R11-4] mengakui dan mampu: ahli waris lain tidak boleh mengambil sepihak, harus saling rela.
  if (penghutang.some(orang => orang.persetujuan === 'mengakuiMampuTidakSetuju')) {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Penghutang mengakui dan mampu membayar tetapi tidak setuju dipotong: harus saling rela, tidak bisa dipotong sepihak.', refs: ['R11-4'] };
  }
  const tirkahBersih = barang + piutang;
  if (tirkahBersih !== ambilTirkahBersih(hasil)) throw new Error('Invarian piutang dilanggar: barang + piutang ≠ tirkah bersih hasil hitung');

  const perOrang: PiutangAhliWaris['perOrang'] = {};
  for (const [idOrang, sahamUang] of Object.entries(bagian)) perOrang[idOrang] = { bagian: sahamUang, hutangDipotong: 0n, uangDiterima: sahamUang, membayar: 0n };
  const jejak: LangkahJejak[] = [];
  for (const { idOrang, hutangKePewaris } of penghutang) {
    if (hutangKePewaris === 0n) continue;
    const baris = perOrang[idOrang]!;
    const keadaan = bandingkan(baris.bagian, hutangKePewaris);
    // [R11-4] S ≥ H: hutang dipotong dari bagian, sisanya (S − H) dari barang; S < H: bagian seluruhnya habis untuk hutang, selisihnya dibayar.
    baris.hutangDipotong = keadaan === 'kurang' ? baris.bagian : hutangKePewaris;
    baris.uangDiterima = baris.bagian - baris.hutangDipotong;
    baris.membayar = hutangKePewaris - baris.hutangDipotong;
    jejak.push({ tahap: 'distribusi', refs: ['R11-4'], jenis: 'PIUTANG_AHLI_WARIS', idOrang, keadaan, bagian: baris.bagian, hutang: hutangKePewaris,
      uangDiterima: baris.uangDiterima, membayar: baris.membayar });
  }
  const totalPembayaran = jumlah(Object.values(perOrang).map(orang => orang.membayar));
  const sisaLainnya = tirkahBersih - jumlah(Object.values(bagian));
  // Invarian [R11-4]: uang yang dibagikan = barang + pembayaran penghutang.
  if (jumlah(Object.values(perOrang).map(orang => orang.uangDiterima)) + sisaLainnya !== barang + totalPembayaran) {
    throw new Error('Invarian piutang dilanggar: Σ uang diterima + sisaLainnya ≠ barang + Σ pembayaran');
  }
  return { status: 'OK', perOrang, totalPembayaran, sisaLainnya, jejak };
}

function bandingkan(bagian: Uang, hutang: Uang): 'sama' | 'lebih' | 'kurang' {
  return bagian === hutang ? 'sama' : bagian > hutang ? 'lebih' : 'kurang';
}

function periksaMasukan(bagian: Record<IdOrang, Uang>, piutang: Uang, penghutang: PenghutangAhliWaris[]): Pertanyaan[] {
  const masalah: Pertanyaan[] = [];
  for (const { idOrang, hutangKePewaris, persetujuan } of penghutang) {
    if (!(idOrang in bagian)) masalah.push({ idOrang, isian: 'hutangKePewaris', alasan: 'Orang ini bukan ahli waris yang mendapat bagian.' });
    else if (hutangKePewaris < 0n) masalah.push({ idOrang, isian: 'hutangKePewaris', alasan: 'Hutang kepada pewaris tidak boleh negatif.' });
    else if (hutangKePewaris > 0n && persetujuan === undefined) masalah.push({ idOrang, isian: 'persetujuanPiutang', alasan: 'Penghutang setuju dipotong?' });
  }
  // Piutang pada orang di luar daftar ahli waris tidak punya aturan di KB; jumlah harus tertutup oleh hutang yang diinput.
  if (masalah.length === 0 && jumlah(penghutang.map(orang => orang.hutangKePewaris)) !== piutang) {
    masalah.push({ isian: 'hutangKePewaris', alasan: 'Jumlah hutang ahli waris harus sama dengan total piutang pewaris.' });
  }
  return masalah;
}

function ambilNominal(hasil: HasilOk): Record<IdOrang, Uang> {
  const nominal: Record<IdOrang, Uang> = {};
  for (const baris of hasil.tabel.baris) {
    for (const [idOrang, sel] of Object.entries(baris.perOrang)) nominal[idOrang] = sel.nominal;
  }
  return nominal;
}

function ambilTirkahBersih(hasil: HasilOk): Uang {
  const langkah = hasil.jejak.find(item => item.jenis === 'TIRKAH');
  if (langkah?.jenis !== 'TIRKAH') throw new Error('Hasil hitung tanpa jejak TIRKAH');
  return langkah.bersih;
}

const jumlah = (daftar: Uang[]): Uang => daftar.reduce((a, b) => a + b, 0n);
