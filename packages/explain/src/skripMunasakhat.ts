// Skrip belajar munasakhat (bab 12): pembukaan berantai, "menyambung bagian" ke jami'ah, hasil akhir.
// Pola sama dengan skrip.ts: tanya → dasar → keluarga → logika → hitung → jembatan; dua teks per langkah (narasi, papan).
// Menerima hasil munasakhat + penyebut sebutan orang lintas mayit; menyerahkan `Bab`. Hisab (jami'ah, wafq) dari jejak engine.

import type { IdOrang } from '@waris/engine';
import { teksTujuanSisa, type Bab } from './cerita.js';
import { rupiah } from './format.js';
import {
  AWALAN_SISA, sebutPenerima, urutanWafatSebenarnya, type HasilMunasakhatOk, type LangkahGabungan,
} from './munasakhat.js';
import { barisSkrip, buatBaris, denganHitungan, gabungDan, kalimat, labelHitung, susun, teksKamus, tekankan, type BarisPenjelasan, type JenisLangkah, type Penyusun, type Potongan, type Sisipan } from './segments.js';
import { istilahNarasi } from './terms.js';

type Sebut = (id: IdOrang) => Potongan;
type Sisipanku = Record<string, Sisipan>;

const kunci = (nama: string) => `munasakhat.${nama}`;
const judul = (penyusun: Penyusun, nama: string) => teksKamus(penyusun, `narasi.munasakhat.judul.${nama}`);
const teks = (isi: string): Potongan => ({ jenis: 'teks', teks: isi });
const langkah = (
  penyusun: Penyusun, jenis: JenisLangkah, nama: string | [string, string], narasi: Sisipanku, papan: Sisipanku, refs: string[] = [],
): BarisPenjelasan => barisSkrip(penyusun, jenis, typeof nama === 'string' ? kunci(nama) : [kunci(nama[0]), kunci(nama[1])], narasi, papan, refs);

export function babPembukaanSkrip(hasil: HasilMunasakhatOk, sebut: Sebut, penyusun: Penyusun): Bab {
  const [pertama, ...berikutnya] = [hasil.daftarLangkah[0]!.mayit, ...urutanWafatSebenarnya(hasil)];
  const pewaris = sebut(pertama!);
  const urutan = [pertama!, ...berikutnya].flatMap((id, indeks) => [...(indeks ? [teks(' → ')] : []), sebut(id)]);
  const daftarBaris = [
    langkah(penyusun, 'tanya', 'pembukaan.tanya', { pewaris, berikutnya: gabungDan(penyusun, berikutnya.map(id => [sebut(id)])) }, { urutan }, ['R12-1']),
    langkah(penyusun, 'dasar', 'pembukaan.dasar', { munasakhat: istilahNarasi(penyusun, 'munasakhat') }, {}, ['R12-1']),
    langkah(penyusun, 'logika', 'pembukaan.batas', { pewaris }, { pewaris }, ['R12-1']),
    ...barisKeadaan(penyusun, hasil.keadaan, pewaris),
  ];
  for (const lewat of hasil.jejak.filter(satu => satu.jenis === 'MUNASAKHAT_DILEWATI')) {
    const siapa = sebut(lewat.mayit);
    daftarBaris.push(langkah(penyusun, 'keluarga', 'pembukaan.dilewati', { siapa, pewaris }, { siapa }, lewat.refs));
  }
  daftarBaris.push(langkah(penyusun, 'jembatan', 'pembukaan.mulai', { pewaris }, { pewaris }));
  return { judul: judul(penyusun, 'kematian_berantai'), daftarBaris };
}

/** Tiga keadaan munasakhat (R12-2, R12-3) dalam bahasa sehari-hari. */
function barisKeadaan(penyusun: Penyusun, keadaan: HasilMunasakhatOk['keadaan'], pewaris: Potongan): BarisPenjelasan[] {
  const refs = ['R12-2', 'R12-3'];
  if (keadaan === 1) {
    return [langkah(penyusun, 'keluarga', 'pembukaan.keadaan1', { pewaris }, {}, refs), langkah(penyusun, 'hitung', 'pembukaan.keadaan1_lanjut', { pewaris }, {}, refs)];
  }
  if (keadaan === 2) {
    return [langkah(penyusun, 'keluarga', 'pembukaan.keadaan2', { pewaris }, {}, refs), langkah(penyusun, 'hitung', 'pembukaan.keadaan2_lanjut', {}, {}, refs)];
  }
  return [langkah(penyusun, 'keluarga', 'pembukaan.keadaan3', {}, {}, refs)];
}

/** `berikut`: mayit berikutnya (bila ada) untuk jembatan; tanpa itu jembatan menuju hasil akhir. */
export function babSambungSkrip(gabungan: LangkahGabungan, sebut: Sebut, penyusun: Penyusun, berikut: IdOrang | undefined): Bab {
  const siapa = sebut(gabungan.mayit);
  const { saham, masalah, wafqMasalah, wafqSaham, jamiah } = gabungan;
  const sebelum = jamiah / wafqMasalah;
  const refs = ['R12-2'];
  const daftarBaris = [
    langkah(penyusun, 'tanya', 'sambung.tanya', { siapa, saham, sebelum, masalah }, { saham, sebelum, masalah }, refs),
    ...barisHubungan(penyusun, gabungan, siapa, refs),
    denganHitungan(langkah(penyusun, 'hitung', 'sambung.jamiah', { jamiah: istilahNarasi(penyusun, 'jamiah'), nilai: jamiah }, { nilai: jamiah }, refs), istilahNarasi(penyusun, 'jamiah'), String(jamiah)),
    ...Object.entries(gabungan.rincian).map(([id, rincian]) => {
      const bagian = [
        ...(rincian.sebelum > 0n ? [`${rincian.sebelum} × ${wafqMasalah}`] : []),
        ...(rincian.dariMayit > 0n ? [`${rincian.dariMayit} × ${wafqSaham}`] : []),
      ];
      const siapaIni = sebutPenerima(penyusun, id, sebut);
      const kalimatOrang = kalimat`${siapaIni}: ${bagian.join(' + ')} = ${rincian.sesudah}.`;
      return denganHitungan({ ...buatBaris(kalimatOrang), jenis: 'hitung' as const, papan: kalimatOrang }, siapaIni, `${bagian.join(' + ')} = ${rincian.sesudah}`);
    }),
    berikut
      ? langkah(penyusun, 'jembatan', 'sambung.jembatan_berikut', { berikut: sebut(berikut) }, { berikut: sebut(berikut) })
      : langkah(penyusun, 'jembatan', 'sambung.jembatan_akhir', {}, {}),
  ];
  return { judul: judul(penyusun, 'penggabungan'), daftarBaris };
}

function barisHubungan(penyusun: Penyusun, gabungan: LangkahGabungan, siapa: Potongan, refs: string[]): BarisPenjelasan[] {
  const { saham, masalah, fpb, wafqMasalah, wafqSaham } = gabungan;
  switch (gabungan.hubungan) {
    case 'habis': {
      if (saham === masalah) {
        return [langkah(penyusun, 'logika', 'sambung.tamatsul', { saham, masalah, tamatsul: istilahNarasi(penyusun, 'tamatsul') }, { saham, masalah }, refs)];
      }
      return [
        langkah(penyusun, 'logika', 'sambung.habis', { saham, masalah }, { saham, masalah }, refs),
        langkah(penyusun, 'logika', 'sambung.kali_saham', { siapa, wafq_saham: wafqSaham }, { siapa, wafq_saham: wafqSaham }, refs),
      ];
    }
    case 'tawafuq':
      return [
        langkah(penyusun, 'logika', 'sambung.tawafuq', {
          saham, masalah, fpb, tawafuq: istilahNarasi(penyusun, 'tawafuq'), wafq_saham: wafqSaham, wafq_masalah: wafqMasalah, wafq: istilahNarasi(penyusun, 'wafq'),
        }, { saham, masalah, wafq_saham: wafqSaham, wafq_masalah: wafqMasalah }, refs),
        langkah(penyusun, 'logika', 'sambung.kali', { wafq_masalah: wafqMasalah, siapa, wafq_saham: wafqSaham }, { wafq_masalah: wafqMasalah, siapa, wafq_saham: wafqSaham }, refs),
      ];
    case 'tabayun':
      return [
        langkah(penyusun, 'logika', 'sambung.tabayun', { saham, masalah, tabayun: istilahNarasi(penyusun, 'tabayun') }, { saham, masalah }, refs),
        langkah(penyusun, 'logika', 'sambung.kali', { wafq_masalah: wafqMasalah, siapa, wafq_saham: wafqSaham }, { wafq_masalah: wafqMasalah, siapa, wafq_saham: wafqSaham }, refs),
      ];
  }
}

export function babAkhirSkrip(hasil: HasilMunasakhatOk, sebut: Sebut, penyusun: Penyusun): Bab {
  const { ikhtishar, nominal, pembulatan } = hasil;
  const tampilkanNominal = hasil.jejak.some(satu => satu.jenis === 'TIRKAH' && satu.kotor > 0n);
  const diringkas = ikhtishar.jamiah !== hasil.jamiah;
  const daftarBaris: BarisPenjelasan[] = [langkah(penyusun, 'tanya', 'akhir.tanya', {}, {})];
  if (diringkas) {
    const kalimatRingkas = susun(penyusun, 'narasi.munasakhat.hasil.diringkas_semua', { faktor: hasil.jamiah / ikhtishar.jamiah, jamiah: hasil.jamiah, ringkas: ikhtishar.jamiah });
    daftarBaris.push({ ...buatBaris(kalimatRingkas, ['R12-2']), jenis: 'hitung', papan: kalimatRingkas });
  }
  const teksRingkas = (id: string): Potongan[] => (diringkas
    ? kalimat` (${susun(penyusun, 'narasi.munasakhat.hasil.diringkas', { saham: ikhtishar.saham[id]!, jamiah: ikhtishar.jamiah })})` : []);
  const teksNominal = (uang: bigint): string => (tampilkanNominal ? ` = ${rupiah(uang)}` : '');
  for (const [id, saham] of Object.entries(hasil.saham)) {
    const kalimatOrang = kalimat`${sebut(id)}: ${saham}/${hasil.jamiah}${teksRingkas(id)}${teksNominal(nominal[id]!)}.`;
    daftarBaris.push(denganHitungan({ ...buatBaris(kalimatOrang, ['R11-1']), jenis: 'hitung', papan: kalimatOrang }, sebut(id), `${saham}/${hasil.jamiah}${teksNominal(nominal[id]!)}`));
  }
  for (const sisa of hasil.sisaKeluar) {
    const id = `${AWALAN_SISA}${sisa.mayit}`;
    const kalimatSisa = kalimat`${sebutPenerima(penyusun, id, sebut)}: ${sisa.saham}/${hasil.jamiah}${teksRingkas(id)}${teksNominal(sisa.nominal)}, `
      .concat(kalimat`${teksTujuanSisa(penyusun, sisa.tujuan)}.`);
    daftarBaris.push(tekankan({ ...buatBaris(kalimatSisa, ['R09-9']), jenis: 'hitung', papan: kalimatSisa }, 'perhatian'));
  }
  if (tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    const kalimatSelisih = susun(penyusun, 'narasi.umum.selisih_pembulatan', { selisih: rupiah(pembulatan.sisaPembulatan), satuan: rupiah(pembulatan.satuan) });
    daftarBaris.push(denganHitungan({ ...buatBaris(kalimatSelisih), jenis: 'hitung', papan: kalimatSelisih }, labelHitung(penyusun, 'selisih_pembulatan'), rupiah(pembulatan.sisaPembulatan)));
  }
  const rincian = gabungDan(penyusun, Object.entries(diringkas ? ikhtishar.saham : hasil.saham).filter(([, saham]) => saham > 0n)
    .map(([id, saham]) => susun(penyusun, 'narasi.langkah.munasakhat.akhir.ringkas_orang', { siapa: sebut(id), saham, jamiah: ikhtishar.jamiah })));
  const pewaris = sebut(hasil.daftarLangkah[0]!.mayit);
  daftarBaris.push(langkah(penyusun, 'ringkas', 'akhir.ringkas', { rincian, pewaris }, { rincian }));
  return { judul: judul(penyusun, 'hasil_akhir'), daftarBaris };
}
