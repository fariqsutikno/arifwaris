// Skrip belajar dzawil arham (bab 14): tanya → dasar (tanzil) → siapa didudukkan di mana → bagi di antara perantara → turun ke kerabat.
// Menerima konteks hasil dzawil arham + penyebut orang (`buatSebutArham`); menyerahkan satu `Bab` untuk linimasa.
// Keputusan fikih (tanzil, jihah, perantara terhalang, rasio, gabung pasangan) dari jejak DZAWIL_ARHAM_*; kalimat lama yang sudah baik dipakai ulang.

import type { IdOrang } from '@waris/engine';
import type { SebutArab } from './arab.js';
import { ceritaSisaKeluar, type Bab } from './cerita.js';
import type { Konteks } from './context.js';
import { barisSkrip, buatBaris, gabungDan, susun, teksKamus, type BarisPenjelasan, type JenisLangkah, type Potongan, type Sisipan } from './segments.js';
import { istilahNarasi } from './terms.js';

type Sisipanku = Record<string, Sisipan>;

const langkah = (konteks: Konteks, jenis: JenisLangkah, nama: string, narasi: Sisipanku, papan: Sisipanku, refs: string[] = []): BarisPenjelasan =>
  barisSkrip(konteks.penyusun, jenis, `dzawil_arham.${nama}`, narasi, papan, refs);
const dariKalimat = (jenis: JenisLangkah, daftarPotongan: Potongan[], refs: string[] = [], subjek?: IdOrang[]): BarisPenjelasan =>
  ({ ...buatBaris(daftarPotongan, refs, subjek), jenis, papan: daftarPotongan });
const lama = (konteks: Konteks, kunci: string, sisipan: Sisipanku = {}): Potongan[] => susun(konteks.penyusun, `narasi.dzawil_arham.${kunci}`, sisipan);

export function babDzawilArhamSkrip(konteks: Konteks, sebut: SebutArab): Bab {
  const { penyusun } = konteks;
  const daftarBaris: BarisPenjelasan[] = [langkah(konteks, 'tanya', 'tanya', {}, {}, ['R14-5', 'R14-6'])];

  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  if (sisaKeluar) {
    // Pada hasil gabungan, tabel memuat juga baris dzawil arham; sisa hanya keluar dari pasangan [R09-9] [R14-3].
    const pasangan = konteks.hasil.tabel.baris.flatMap(barisTabel => barisTabel.anggota)
      .filter(id => konteks.hasil.statusOrang[id]?.jenis === 'ahliWaris' && konteks.sebutan.peranDari(id)?.kunci !== 'DZAWIL_ARHAM');
    const baris = ceritaSisaKeluar(konteks, sisaKeluar, pasangan);
    daftarBaris.push({ ...baris, jenis: 'keluarga', papan: baris.daftarPotongan });
  }
  daftarBaris.push(langkah(konteks, 'dasar', 'dasar', {}, {}, ['R14-5', 'R14-6']));
  for (const khilaf of konteks.daftarLangkah('KHILAF_MADZHAB')) {
    daftarBaris.push(dariKalimat('keluarga', lama(konteks, `khilaf_${khilaf.kode.toLowerCase().replace('-', '_')}`, { madzhab: teksKamus(penyusun, `narasi.umum.madzhab.${khilaf.ruleset}`) }), khilaf.refs, khilaf.idOrang));
  }
  for (const mani of konteks.daftarLangkah('MANI')) {
    const sebab = mani.mani === 'qatl' ? 'qatl' : 'beda_agama';
    daftarBaris.push(dariKalimat('keluarga', susun(penyusun, `narasi.cerita.ahli_waris.mani_${sebab}`, {
      siapa: sebut([mani.idOrang]), pewaris: konteks.sebutan.pewaris(), mani: istilahNarasi(penyusun, 'mani'),
    }), mani.refs, [mani.idOrang]));
  }
  for (const tanzil of konteks.daftarLangkah('DZAWIL_ARHAM_TANZIL')) {
    daftarBaris.push(dariKalimat('keluarga', lama(konteks, 'tanzil', { siapa: sebut([tanzil.idOrang]), perantara: sebut([tanzil.perantara]), langkah: tanzil.langkah }), tanzil.refs, [tanzil.idOrang]));
  }
  for (const terhijab of konteks.daftarLangkah('DZAWIL_ARHAM_TERHIJAB_JIHAH')) {
    daftarBaris.push(dariKalimat('keluarga', lama(konteks, 'terhijab_jihah', { siapa: sebut([terhijab.idOrang]), oleh: sebut(terhijab.oleh) }), terhijab.refs, [terhijab.idOrang]));
  }

  const [masalah] = konteks.daftarLangkah('DZAWIL_ARHAM_MASALAH_PERANTARA');
  if (masalah) {
    daftarBaris.push(langkah(konteks, 'jembatan', 'jembatan_masalah', {}, {}));
    const butir = Object.entries(masalah.saham).map(([id, saham]) => lama(konteks, 'masalah_butir', { perantara: sebut([id]), saham }));
    daftarBaris.push(dariKalimat('hitung', lama(konteks, 'masalah', { rincian: gabungDan(penyusun, butir), masalah: masalah.masalah }), masalah.refs));
    if (masalah.aul !== undefined) daftarBaris.push(dariKalimat('hitung', lama(konteks, 'aul', { ashl: masalah.ashl, aul: masalah.aul }), ['R14-13']));
    for (const id of masalah.mahjub) daftarBaris.push(dariKalimat('keluarga', lama(konteks, 'perantara_terhijab', { perantara: sebut([id]) }), ['R14-10']));
  }

  const daftarTurun = konteks.daftarLangkah('DZAWIL_ARHAM_TURUN');
  if (daftarTurun.length) daftarBaris.push(langkah(konteks, 'jembatan', 'jembatan_turun', {}, {}));
  for (const turun of daftarTurun) {
    const penerima = Object.keys(turun.saham);
    daftarBaris.push(dariKalimat('hitung', lama(konteks, turun.rasio === 'samaRata' ? 'turun_sama_rata' : 'turun', { perantara: sebut([turun.perantara]), penerima: sebut(penerima) }), turun.refs, penerima));
  }
  for (const duaJalur of konteks.daftarLangkah('DZAWIL_ARHAM_DUA_JALUR')) {
    daftarBaris.push(dariKalimat('keluarga', lama(konteks, 'dua_jalur', { siapa: sebut([duaJalur.idOrang]), perantara: sebut(duaJalur.perantara) }), duaJalur.refs, [duaJalur.idOrang]));
  }
  const [gabung] = konteks.daftarLangkah('DZAWIL_ARHAM_GABUNG_PASANGAN');
  if (gabung) daftarBaris.push(dariKalimat('hitung', lama(konteks, 'gabung_pasangan', { saham: gabung.saham, masalah: gabung.masalah, jamiah: gabung.jamiah }), gabung.refs));
  return { judul: teksKamus(penyusun, 'narasi.langkah.dzawil_arham.judul'), daftarBaris, kolom: 'bagian' };
}
