// Skrip belajar gharqa (bab 13d, wafat bersamaan): "Wafat bersamaan" → satu tahap per harta (atau per harta di tiap skenario urutan).
// Pola sama dengan skrip.ts (tanya → dasar → keluarga → logika → hitung → jembatan → ringkas); keputusan fikih (tidak saling mewarisi, tilad,
// mauquf, tharif) tetap dari jejak engine dan templat `narasi.gharqa.*`.

import type { GrafKeluarga, HartaGharqa, IdOrang, KeadaanGharqa } from '@waris/engine';
import type { Bab } from './cerita.js';
import { rupiah } from './format.js';
import { barisPemberian, namaMadzhab, teksSebut, type GharqaSelesai } from './kasusKhusus.js';
import { sebutPenerima } from './munasakhat.js';
import { barisSkrip, buatBaris, denganHitungan, gabungDan, kalimat, susun, teksKamus, tekankan, type BarisPenjelasan, type JenisLangkah, type Penyusun, type Potongan, type Sisipan } from './segments.js';
import { istilahNarasi } from './terms.js';

const BATAS_PENERIMA_RINGKASAN = 4;

type Sebut = (id: IdOrang) => Potongan;
type Sisipanku = Record<string, Sisipan>;

const langkah = (
  penyusun: Penyusun, jenis: JenisLangkah, nama: string, narasi: Sisipanku, papan: Sisipanku, refs: string[] = [], subjek?: IdOrang[],
): BarisPenjelasan => barisSkrip(penyusun, jenis, `gharqa.${nama}`, narasi, papan, refs, subjek);
const dariKalimat = (jenis: JenisLangkah, daftarPotongan: Potongan[], refs: string[] = [], subjek?: IdOrang[]): BarisPenjelasan =>
  ({ ...buatBaris(daftarPotongan, refs, subjek), jenis, papan: daftarPotongan });

export function babPembukaanGharqaSkrip(hasil: GharqaSelesai, keadaan: KeadaanGharqa, sebut: Sebut, penyusun: Penyusun): Bab {
  const anggota = (hasil.status === 'OK' ? hasil.harta : hasil.skenario[0]!.harta).map(harta => harta.mayit);
  const metode = hasil.status === 'OK' ? hasil.metode : 'mauquf';
  const siapa = gabungDan(penyusun, anggota.map(id => [sebut(id)]));
  const sisipanMetode = metode === 'tilad' ? { tilad: istilahNarasi(penyusun, 'tilad') } : metode === 'mauquf' ? { mauquf: istilahNarasi(penyusun, 'mauquf') } : {};
  const kunciKeadaan = keadaan.replace(/[A-Z]/g, huruf => `_${huruf.toLowerCase()}`);
  return {
    judul: teksKamus(penyusun, 'narasi.gharqa.judul.wafat_bersamaan'),
    daftarBaris: [
      langkah(penyusun, 'tanya', 'pembukaan.tanya', { siapa }, {}, ['R13-10'], anggota),
      dariKalimat('keluarga', susun(penyusun, `narasi.gharqa.keadaan.${kunciKeadaan}`, { siapa }), ['R13-10'], anggota),
      dariKalimat('logika', susun(penyusun, `narasi.gharqa.metode.${metode}`, sisipanMetode), metode === 'tilad' ? ['R13-19'] : ['R13-10']),
      langkah(penyusun, 'jembatan', metode === 'mauquf' ? 'pembukaan.jembatan_skenario' : 'pembukaan.jembatan', {}, {}),
    ],
  };
}

/** Satu harta (satu mayit): tanya, tharif (bila ada), pemberian per orang, yang ditahan, ringkasan. */
export function babHartaGharqaSkrip(harta: HartaGharqa, sebut: Sebut, penyusun: Penyusun): Bab {
  const mayit = teksSebut(sebut(harta.mayit));
  const daftarBaris: BarisPenjelasan[] = [langkah(penyusun, 'tanya', 'harta.tanya', { mayit }, { mayit })];
  for (const satu of harta.jejak) {
    if (satu.jenis !== 'MUNASAKHAT' || !satu.refs.includes('R13-19')) continue;
    const sisipan = { siapa: sebut(satu.mayit), saham: satu.saham, masalah: satu.masalah, jamiah: satu.jamiah };
    daftarBaris.push(langkah(penyusun, 'logika', 'harta.tharif', sisipan, sisipan, satu.refs, [satu.mayit]));
  }
  const teksNominal = (uang: bigint | undefined): string => (uang ? ` = ${rupiah(uang)}` : '');
  if (harta.daftarDunia) {
    daftarBaris.push(...barisPemberian({ ...harta, adaKemungkinanLuar: harta.daftarDunia.some(dunia => Object.keys(dunia.taqdir).length > 0), teksNominal }, sebut, penyusun)
      .map(baris => ({ ...baris, jenis: 'hitung' as const, papan: baris.daftarPotongan })));
  } else {
    for (const [id, saham] of Object.entries(harta.saham)) {
      const siapaIni = sebutPenerima(penyusun, id, sebut);
      daftarBaris.push(denganHitungan(dariKalimat('hitung', kalimat`${siapaIni}: ${saham}/${harta.jamiah}${teksNominal(harta.nominal[id])}.`, [], [id]), siapaIni, `${saham}/${harta.jamiah}${teksNominal(harta.nominal[id])}`));
    }
  }
  if (harta.mauqufSemua) {
    daftarBaris.push(tekankan(dariKalimat('hitung', susun(penyusun, 'narasi.gharqa.harta_mauquf_semua', { madzhab: namaMadzhab(penyusun, harta.mauqufSemua.ruleset) }), harta.mauqufSemua.refs), 'perhatian'));
  } else if (harta.mauquf > 0n) {
    const kalimatTahan = susun(penyusun, 'narasi.taqdir.pemberian.mauquf', { mauquf: istilahNarasi(penyusun, 'mauquf') }).concat(kalimat` ${harta.mauquf}/${harta.jamiah}${teksNominal(harta.nominalMauquf)}.`);
    daftarBaris.push(tekankan(dariKalimat('hitung', kalimatTahan, ['R13-4']), 'perhatian'));
  }
  const penerima = Object.entries(harta.saham).filter(([, saham]) => saham > 0n);
  // Daftar penerima yang panjang tidak diulang sebagai ringkasan; barisnya sendiri sudah cukup.
  if (!harta.mauqufSemua && penerima.length > 0 && penerima.length <= BATAS_PENERIMA_RINGKASAN) {
    const rincian = gabungDan(penyusun, penerima.map(([id, saham]) =>
      susun(penyusun, 'narasi.langkah.gharqa.harta.ringkas_orang', { siapa: sebutPenerima(penyusun, id, sebut), saham, jamiah: harta.jamiah })));
    daftarBaris.push(langkah(penyusun, 'ringkas', 'harta.ringkas', { mayit, rincian }, { rincian }));
  }
  return { judul: teksKamus(penyusun, 'narasi.gharqa.judul.harta', { mayit }), daftarBaris };
}
