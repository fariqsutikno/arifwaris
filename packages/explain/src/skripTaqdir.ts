// Skrip belajar taqdir (bab 13: haml, mafqud, khuntsa): "ahli waris yang belum pasti" → "semua kemungkinan" → "yang diberikan sekarang".
// Pola sama dengan skrip.ts (tanya → dasar → keluarga → logika → hitung → jembatan; narasi dan papan). Keputusan fikih (aqall, ditahan,
// lebur, kelas D) tetap dari jejak engine dan templat `narasi.taqdir.*`; di sini hanya urutan ajarnya.

import type { GrafKeluarga, IdOrang } from '@waris/engine';
import type { Bab } from './cerita.js';
import { rupiah } from './format.js';
import {
  JENIS_SUMBER, adaKemungkinanLuar, barisPemberian, daftarSumber, namaMadzhab, refsPemberian, teksTaqdir, type TaqdirOk,
} from './kasusKhusus.js';
import { sebutPenerima } from './munasakhat.js';
import { barisSkrip, buatBaris, gabungDan, kalimat, susun, teksKamus, tekankan, type BarisPenjelasan, type JenisLangkah, type Penyusun, type Potongan, type Sisipan } from './segments.js';
import { istilahNarasi } from './terms.js';

type Sebut = (id: IdOrang) => Potongan;
type Sisipanku = Record<string, Sisipan>;

const kunci = (nama: string) => `taqdir.${nama}`;
const langkah = (
  penyusun: Penyusun, jenis: JenisLangkah, nama: string, narasi: Sisipanku, papan: Sisipanku, refs: string[] = [], subjek?: IdOrang[],
): BarisPenjelasan => barisSkrip(penyusun, jenis, kunci(nama), narasi, papan, refs, subjek);
/** Kalimat dari templat taqdir lama yang sudah baik (satu ide), dipakai sebagai langkah skrip. */
const langkahLama = (penyusun: Penyusun, jenis: JenisLangkah, nama: string, sisipan: Sisipanku, refs: string[] = [], subjek?: IdOrang[]): BarisPenjelasan => {
  const kalimatLama = susun(penyusun, `narasi.taqdir.${nama}`, sisipan);
  return { ...buatBaris(kalimatLama, refs, subjek), jenis, papan: kalimatLama };
};

export function babBelumPastiSkrip(hasil: TaqdirOk, graf: GrafKeluarga, sebut: Sebut, penyusun: Penyusun): Bab {
  const sumber = daftarSumber(graf);
  const siapa = gabungDan(penyusun, sumber.map(id => [sebut(id)]));
  // Khuntsa dijelaskan dengan bahasa awam di pertanyaan pembuka, sebelum istilahnya muncul di sebutan.
  const semuaKhuntsa = sumber.every(id => graf.orang[id]!.khuntsa);
  const daftarBaris = [langkah(penyusun, 'tanya', semuaKhuntsa ? 'belum.tanya_khuntsa' : 'belum.tanya', { siapa }, {}, ['R13-16'], sumber)];
  if (hasil.daftarDunia.length > 1) {
    daftarBaris.push(langkah(penyusun, 'dasar', 'belum.dasar', { mauquf: istilahNarasi(penyusun, 'mauquf') }, {}, refsPemberian(hasil)));
  }
  for (const id of sumber) {
    const jenis = graf.orang[id]!.khuntsa ? 'khuntsa' : JENIS_SUMBER[graf.orang[id]!.statusHidup as keyof typeof JENIS_SUMBER];
    daftarBaris.push(langkahLama(penyusun, 'keluarga', `pembukaan.${jenis}`, { siapa: sebut(id), istilah: istilahNarasi(penyusun, jenis === 'khuntsa' ? 'khuntsa-musykil' : jenis) }, [], [id]));
  }
  for (const satu of hasil.jejak) {
    if (satu.jenis !== 'TAQDIR_LEBUR') continue;
    daftarBaris.push(satu.aturan === 'setengah'
      ? langkahLama(penyusun, 'logika', 'pembukaan.setengah', { siapa: gabungDan(penyusun, satu.sumber.map(id => [sebut(id)])), madzhab: namaMadzhab(penyusun, hasil.ruleset) }, satu.refs, satu.sumber)
      : langkahLama(penyusun, 'logika', 'pembukaan.terburuk', { siapa: sebut(satu.sumber[0]!), kemungkinan: teksTaqdir(penyusun, graf, satu.terpilih ?? {}, sebut) }, satu.refs, satu.sumber));
    break;   // aturan lebur sama di semua dunia luar; cukup diceritakan sekali
  }
  return { judul: teksKamus(penyusun, 'narasi.taqdir.judul.belum_pasti'), daftarBaris };
}

/** Pengantar (taqdir, jumlah kemungkinan) + satu kelompok baris per dunia; baris pertama tiap dunia membawa sorotan meja di linimasa. */
export function babKemungkinanSkrip(hasil: TaqdirOk, graf: GrafKeluarga, sebut: Sebut, penyusun: Penyusun): { judul: string; pengantar: BarisPenjelasan[]; dunia: BarisPenjelasan[][] } {
  const langkahDunia = hasil.jejak.filter(satu => satu.jenis === 'TAQDIR_DUNIA');
  const jumlah = hasil.daftarDunia.length;
  const pengantar = [
    langkah(penyusun, 'dasar', 'kemungkinan.dasar', {}, {}, ['R13-16']),
    langkah(penyusun, 'logika', 'kemungkinan.banyak', { jumlah, jamiah: istilahNarasi(penyusun, 'jamiah') }, { jumlah }),
    langkah(penyusun, 'jembatan', 'kemungkinan.jembatan', {}, {}),
  ];
  const dunia = hasil.daftarDunia.map((satuDunia, indeks) => {
    const juzSahm = hasil.jamiah / satuDunia.masalah;
    return [
      langkah(penyusun, 'keluarga', 'dunia.jika', { nomor: indeks + 1, kemungkinan: teksTaqdir(penyusun, graf, satuDunia.taqdir, sebut) }, { nomor: indeks + 1 }, [], Object.keys(satuDunia.taqdir)),
      langkah(penyusun, 'hitung', 'dunia.masalah', {
        masalah: satuDunia.masalah, jamiah: hasil.jamiah, juz_sahm: istilahNarasi(penyusun, 'juz-as-sahm'), nilai: juzSahm,
      }, { masalah: satuDunia.masalah, jamiah: hasil.jamiah, nilai: juzSahm }, langkahDunia[indeks]?.refs ?? []),
      ...Object.entries(satuDunia.saham).map(([id, saham]) => {
        const kalimatOrang = kalimat`${sebutPenerima(penyusun, id, sebut)}: ${saham}/${hasil.jamiah}.`;
        return { ...buatBaris(kalimatOrang, [], [id]), jenis: 'hitung' as const, papan: kalimatOrang };
      }),
    ];
  });
  return { judul: teksKamus(penyusun, 'narasi.taqdir.judul.semua_kemungkinan'), pengantar, dunia };
}

export function babPemberianSkrip(hasil: TaqdirOk, sebut: Sebut, penyusun: Penyusun): Bab {
  const tampilkanNominal = hasil.jejak.some(satu => satu.jenis === 'TIRKAH' && satu.kotor > 0n);
  const teksNominal = (uang: bigint | undefined): string => (tampilkanNominal && uang !== undefined ? ` = ${rupiah(uang)}` : '');
  const daftarBaris = [
    langkah(penyusun, 'tanya', 'pemberian.tanya', {}, {}),
    ...barisPemberian({ ...hasil, adaKemungkinanLuar: adaKemungkinanLuar(hasil), teksNominal }, sebut, penyusun)
      .map(baris => ({ ...baris, jenis: 'hitung' as const, papan: baris.daftarPotongan })),
  ];
  if (hasil.mauquf > 0n) {
    const kalimatTahan = susun(penyusun, 'narasi.taqdir.pemberian.mauquf', { mauquf: istilahNarasi(penyusun, 'mauquf') }).concat(kalimat` ${hasil.mauquf}/${hasil.jamiah}${teksNominal(hasil.nominalMauquf)}.`);
    daftarBaris.push(tekankan({ ...buatBaris(kalimatTahan, refsPemberian(hasil)), jenis: 'hitung', papan: kalimatTahan }, 'perhatian'));
  }
  if (tampilkanNominal && hasil.pembulatan.sisaPembulatan > 0n) {
    const kalimatSelisih = susun(penyusun, 'narasi.umum.selisih_pembulatan', { selisih: rupiah(hasil.pembulatan.sisaPembulatan), satuan: rupiah(hasil.pembulatan.satuan) });
    daftarBaris.push({ ...buatBaris(kalimatSelisih), jenis: 'hitung', papan: kalimatSelisih });
  }
  const sisipan = { diberikan: hasil.jamiah - hasil.mauquf, ditahan: hasil.mauquf, jamiah: hasil.jamiah };
  daftarBaris.push(hasil.mauquf > 0n
    ? langkah(penyusun, 'ringkas', 'pemberian.ringkas', sisipan, sisipan, refsPemberian(hasil))
    : langkah(penyusun, 'ringkas', 'pemberian.ringkas_semua', {}, {}, refsPemberian(hasil)));
  return { judul: teksKamus(penyusun, 'narasi.taqdir.judul.dibagi_sekarang'), daftarBaris };
}
