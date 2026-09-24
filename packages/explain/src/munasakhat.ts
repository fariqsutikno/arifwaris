// Penjelasan munasakhat (bab 12), disusun dari penjelasan biasa:
//   1. pembukaan + batas cakupan
//   2. per mayit: penjelasan pembagiannya (memakai `jelaskan`) + penggabungan ke jami'ah
//   3. hasil akhir per orang

import type { GrafKeluarga, HasilMunasakhat, IdOrang, LangkahJejak } from '@waris/engine';
import { rupiah } from './format.js';
import { jelaskan, type BabPenjelasan } from './narasi.js';
import { labelPeran } from './people.js';
import { gabungDan, buatBaris, kalimat, type BarisPenjelasan, type Potongan } from './segments.js';
import { istilah } from './terms.js';

type HasilOk = Extract<HasilMunasakhat, { status: 'OK' }>;
type LangkahGabungan = Extract<LangkahJejak, { jenis: 'MUNASAKHAT' }>;

export interface BagianMunasakhat { judul: string; daftarBab: BabPenjelasan[] }
export interface PenjelasanMunasakhat { daftarBagian: BagianMunasakhat[] }

const URUTAN_KE = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];

export function jelaskanMunasakhat(hasil: HasilOk, graf: GrafKeluarga, opsi: { mode?: 'cerita' | 'ringkas' } = {}): PenjelasanMunasakhat {
  const sebut = buatSebut(hasil, graf);
  const daftarGabungan = hasil.jejak.filter((langkahIni): langkahIni is LangkahGabungan => langkahIni.jenis === 'MUNASAKHAT');

  const daftarBagian: BagianMunasakhat[] = [pembukaan(hasil, sebut)];
  for (const [urutanKe, langkah] of hasil.daftarLangkah.entries()) {
    // Mayit berikutnya disebut dengan perannya ("anak perempuan"), bukan "almarhumah", supaya jelas siapa yang wafat.
    const bernama = urutanKe === 0 ? graf
      : { ...graf, orang: { ...graf.orang, [langkah.mayit]: { ...graf.orang[langkah.mayit]!, nama: sebut(langkah.mayit).teks } } };
    const daftarBab = jelaskan(langkah.hasil, { ...bernama, idPewaris: langkah.mayit }, opsi).daftarBab;
    const gabunganMayit = daftarGabungan.find(langkahIni => langkahIni.mayit === langkah.mayit);
    if (gabunganMayit) daftarBab.push(penggabungan(gabunganMayit, sebut));
    daftarBagian.push({
      judul: urutanKe === 0 ? `Pembagian harta ${sebut(langkah.mayit).teks}` : `Bagian ${sebut(langkah.mayit).teks} diteruskan`,
      daftarBab,
    });
  }
  daftarBagian.push(hasilAkhir(hasil, sebut));
  return { daftarBagian };
}

// ─── Sebutan orang lintas mayit ───────────────────────────────────────────────

/**
 * Tanpa nama, peran disebut terhadap mayit pertama yang ia warisi: "istri", "anak laki-laki dari istri".
 * Sebutan yang sama untuk dua orang diberi urutan ("anak perempuan pertama").
 */
function buatSebut(hasil: HasilOk, graf: GrafKeluarga): (id: IdOrang) => Potongan {
  const idPewaris = hasil.daftarLangkah[0]!.mayit;
  const ahliWarisDari = (id: IdOrang) => {
    for (const langkah of hasil.daftarLangkah) {
      const status = langkah.hasil.statusOrang[id];
      if (status?.jenis === 'ahliWaris' || status?.jenis === 'mahjub') return { mayit: langkah.mayit, peran: status.peran };
    }
    return undefined;
  };
  const labelDasar = (id: IdOrang): string => {
    const orangIni = graf.orang[id];
    if (orangIni?.nama) return orangIni.nama;
    if (id === idPewaris) return orangIni?.jenisKelamin === 'P' ? 'almarhumah' : 'almarhum';
    const peran = ahliWarisDari(id);
    if (!peran) return 'kerabat';
    const label = labelPeran(peran.peran);
    return peran.mayit === idPewaris ? label : `${label} dari ${labelDasar(peran.mayit)}`;
  };

  const sePeran = new Map<string, IdOrang[]>();
  for (const id of Object.keys(graf.orang)) {
    if (id !== idPewaris && !ahliWarisDari(id)) continue;
    const label = labelDasar(id);
    sePeran.set(label, [...(sePeran.get(label) ?? []), id]);
  }
  return id => {
    const label = labelDasar(id);
    const samaDengan = sePeran.get(label) ?? [id];
    const teks = samaDengan.length > 1 && !graf.orang[id]?.nama ? `${label} ${URUTAN_KE[samaDengan.indexOf(id)] ?? `ke-${samaDengan.indexOf(id) + 1}`}` : label;
    return { jenis: 'orang', daftarIdOrang: [id], teks };
  };
}

// ─── Bagian ───────────────────────────────────────────────────────────────────

function pembukaan(hasil: HasilOk, sebut: (id: IdOrang) => Potongan): BagianMunasakhat {
  const [pertama, ...berikutnya] = [hasil.daftarLangkah[0]!.mayit, ...urutanWafatSebenarnya(hasil)];
  const pewaris = sebut(pertama!);
  const daftarBaris: BarisPenjelasan[] = [
    buatBaris(kalimat`${pewaris} wafat. Sebelum hartanya dibagi, ${gabungDan(berikutnya.map(id => [sebut(id)]))} ikut wafat, berurutan seperti itu. `
      .concat(kalimat`Kasus seperti ini disebut ${istilah('munasakhat', 'munasakhat')}: bagian yang sudah menjadi hak orang yang wafat belakangan `,
        kalimat`diteruskan kepada ahli warisnya.`), ['R12-1']),
    buatBaris(teksKeadaan(hasil.keadaan, pewaris), ['R12-2', 'R12-3']),
    buatBaris(kalimat`Yang diteruskan hanyalah bagian dari harta ${pewaris} yang sampai kepada mereka, bukan pembagian waris atas seluruh harta mereka. `
      .concat(kalimat`Hutang, wasiat, dan harta lain milik mereka diselesaikan oleh ahli warisnya masing-masing.`)),
  ];
  for (const skip of hasil.jejak.filter(langkahIni => langkahIni.jenis === 'MUNASAKHAT_DILEWATI')) {
    daftarBaris.push(buatBaris(kalimat`${sebut(skip.mayit)} tidak mendapat bagian dari harta ${pewaris}, jadi tidak ada yang diteruskan kepada ahli warisnya.`, skip.refs));
  }
  return { judul: 'Kematian berantai', daftarBab: [{ judul: 'Apa yang terjadi', daftarBaris }] };
}

function teksKeadaan(keadaan: 1 | 2 | 3, pewaris: Potongan): Potongan[] {
  switch (keadaan) {
    case 1:
      return kalimat`Yang wafat belakangan hanya meninggalkan ahli waris yang sama dengan sisa ahli waris ${pewaris}, dan bagian mereka `
        .concat(kalimat`tidak berubah (keadaan pertama). Karena itu hasil akhirnya sama dengan membagi harta ${pewaris} langsung kepada `,
          kalimat`yang masih hidup, seolah yang wafat belakangan tidak ada. Langkah bertahap di bawah tetap ditampilkan sebagai buktinya.`);
    case 2:
      return kalimat`Ahli waris masing-masing yang wafat belakangan tidak ikut mewarisi dari ${pewaris} maupun dari yang lain `
        .concat(kalimat`(keadaan kedua). Kitab menghitungnya dengan satu angka pembagi gabungan sekaligus; langkah bertahap di bawah `,
          kalimat`memberi hasil yang sama.`);
    case 3:
      return kalimat`Susunan ahli warisnya berubah dari satu kematian ke kematian berikutnya (keadaan ketiga), jadi bagian tiap orang `
        .concat(kalimat`yang wafat diteruskan satu per satu.`);
  }
}

/** Urutan wafat setelah mayit pertama, termasuk yang diabaikan karena tidak mendapat bagian. */
function urutanWafatSebenarnya(hasil: HasilOk): IdOrang[] {
  return hasil.jejak.flatMap(langkahIni => (langkahIni.jenis === 'MUNASAKHAT' || langkahIni.jenis === 'MUNASAKHAT_DILEWATI' ? [langkahIni.mayit] : []));
}

function penggabungan(langkahIni: LangkahGabungan, sebut: (id: IdOrang) => Potongan): BabPenjelasan {
  const siapa = sebut(langkahIni.mayit);
  const sebelum = langkahIni.jamiah / langkahIni.wafqMasalah;
  const daftarBaris: BarisPenjelasan[] = [
    buatBaris(kalimat`${siapa} mendapat ${langkahIni.saham} dari ${sebelum} bagian. Bagian itu dibagi kepada ahli warisnya, yang pembagiannya memakai ${langkahIni.masalah} bagian.`, ['R12-2']),
    buatBaris(teksHubungan(langkahIni, siapa), ['R12-2']),
    buatBaris(kalimat`Angka pembagi gabungan (${istilah('jamiah', "jami'ah")}) sekarang ${langkahIni.jamiah}:`, ['R12-2']),
    ...Object.entries(langkahIni.rincian).map(([id, rincianOrang]) => {
      const istilahIstilah = [
        ...(rincianOrang.sebelum > 0n ? [`${rincianOrang.sebelum} × ${langkahIni.wafqMasalah}`] : []),
        ...(rincianOrang.dariMayit > 0n ? [`${rincianOrang.dariMayit} × ${langkahIni.wafqSaham}`] : []),
      ];
      return buatBaris(kalimat`${sebut(id)}: ${istilahIstilah.join(' + ')} = ${rincianOrang.sesudah}.`);
    }),
  ];
  return { judul: 'Menggabungkan dengan pembagian sebelumnya', daftarBaris };
}

function teksHubungan(langkahIni: LangkahGabungan, siapa: Potongan): Potongan[] {
  switch (langkahIni.hubungan) {
    case 'habis':
      return langkahIni.saham === langkahIni.masalah
        ? kalimat`${langkahIni.saham} sama dengan ${langkahIni.masalah} (${istilah('tamatsul', 'tamatsul')}), jadi angka pembagi tidak perlu diperbesar.`
        : kalimat`${langkahIni.saham} habis dibagi ${langkahIni.masalah}, jadi angka pembagi tidak perlu diperbesar; bagian ahli waris ${siapa} dikali ${langkahIni.wafqSaham}.`;
    case 'tawafuq':
      return kalimat`${langkahIni.saham} dan ${langkahIni.masalah} sama-sama habis dibagi ${langkahIni.fpb} (${istilah('tawafuq', 'tawafuq')}). `
        .concat(kalimat`Angka pembagi sebelumnya dikali ${langkahIni.masalah} ÷ ${langkahIni.fpb} = ${langkahIni.wafqMasalah} (${istilah('wafq', 'wafq')}), `,
          kalimat`dan bagian ahli waris ${siapa} dikali ${langkahIni.saham} ÷ ${langkahIni.fpb} = ${langkahIni.wafqSaham}.`);
    case 'tabayun':
      return kalimat`${langkahIni.saham} dan ${langkahIni.masalah} tidak bisa sama-sama dibagi kecuali oleh 1 (${istilah('tabayun', 'tabayun')}). `
        .concat(kalimat`Angka pembagi sebelumnya dikali ${langkahIni.masalah}, dan bagian ahli waris ${siapa} dikali ${langkahIni.saham}.`);
  }
}

function hasilAkhir(hasil: HasilOk, sebut: (id: IdOrang) => Potongan): BagianMunasakhat {
  const { ikhtishar, nominal, pembulatan } = hasil;
  const tampilkanNominal = hasil.jejak.some(langkahIni => langkahIni.jenis === 'TIRKAH' && langkahIni.kotor > 0n);
  const daftarBaris: BarisPenjelasan[] = [];
  const diringkas = ikhtishar.jamiah !== hasil.jamiah;
  if (diringkas) {
    const faktor = hasil.jamiah / ikhtishar.jamiah;
    daftarBaris.push(buatBaris(kalimat`Semua angka bisa diringkas dengan membagi ${faktor}: ${hasil.jamiah} menjadi ${ikhtishar.jamiah}.`, ['R12-2']));
  }
  for (const [id, saham] of Object.entries(hasil.saham)) {
    const ringkas = diringkas ? ` (diringkas ${ikhtishar.saham[id]}/${ikhtishar.jamiah})` : '';
    daftarBaris.push(buatBaris(kalimat`${sebut(id)}: ${saham}/${hasil.jamiah}${ringkas}${tampilkanNominal ? ` = ${rupiah(nominal[id]!)}` : ''}.`, ['R11-1']));
  }
  if (tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    daftarBaris.push(buatBaris(kalimat`Selisih pembulatan ${rupiah(pembulatan.sisaPembulatan)} (per ${rupiah(pembulatan.satuan)}), belum dibagikan.`));
  }
  return { judul: 'Hasil akhir', daftarBab: [{ judul: 'Bagian akhir tiap ahli waris', daftarBaris }] };
}
