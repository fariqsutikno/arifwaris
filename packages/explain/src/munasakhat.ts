// Penjelasan munasakhat (bab 12), disusun dari penjelasan biasa:
//   1. pembukaan + batas cakupan
//   2. per mayit: penjelasan pembagiannya (memakai `jelaskan`) + penggabungan ke jami'ah
//   3. hasil akhir per orang

import type { GrafKeluarga, HasilMunasakhat, IdOrang, LangkahJejak } from '@waris/engine';
import { teksTujuanSisa } from './cerita.js';
import { rupiah } from './format.js';
import { jelaskan, type BabPenjelasan } from './narasi.js';
import { labelPeran, urutanKe } from './people.js';
import {
  gabungDan, buatBaris, kalimat, susun, tekankan, teksKamus, type BarisPenjelasan, type Kamus, type Penyusun, type Potongan, type Sisipan,
} from './segments.js';
import { istilahNarasi } from './terms.js';

type HasilOk = Extract<HasilMunasakhat, { status: 'OK' }>;
type LangkahGabungan = Extract<LangkahJejak, { jenis: 'MUNASAKHAT' }>;

export interface BagianMunasakhat { judul: string; daftarBab: BabPenjelasan[] }
export interface PenjelasanMunasakhat { daftarBagian: BagianMunasakhat[] }

const AWALAN_SISA = 'sisaKeluar:';

export function jelaskanMunasakhat(hasil: HasilOk, graf: GrafKeluarga, opsi: { gaya?: 'cerita' | 'ringkas' | undefined; kamus: Kamus }): PenjelasanMunasakhat {
  const penyusun: Penyusun = { kamus: opsi.kamus, bahasa: 'id' };
  const sebut = buatSebut(hasil, graf, penyusun);
  const daftarGabungan = hasil.jejak.filter((langkahIni): langkahIni is LangkahGabungan => langkahIni.jenis === 'MUNASAKHAT');

  const daftarBagian: BagianMunasakhat[] = [pembukaan(hasil, sebut, penyusun)];
  const judulMayit = (kunci: string, mayit: IdOrang) => teksKamus(penyusun, `narasi.munasakhat.judul.${kunci}`, { mayit: sebut(mayit).teks });
  for (const [urutanKe, langkah] of hasil.daftarLangkah.entries()) {
    // Mayit berikutnya disebut dengan perannya ("anak perempuan"), bukan "almarhumah", supaya jelas siapa yang wafat.
    const bernama = urutanKe === 0 ? graf
      : { ...graf, orang: { ...graf.orang, [langkah.mayit]: { ...graf.orang[langkah.mayit]!, nama: sebut(langkah.mayit).teks } } };
    const daftarBab = jelaskan(langkah.hasil, { ...bernama, idPewaris: langkah.mayit }, { gaya: opsi.gaya, kamus: opsi.kamus }).daftarBab;
    const gabunganMayit = daftarGabungan.find(langkahIni => langkahIni.mayit === langkah.mayit);
    if (gabunganMayit) daftarBab.push(penggabungan(gabunganMayit, sebut, penyusun));
    daftarBagian.push({
      judul: judulMayit(urutanKe === 0 ? 'pembagian_pertama' : 'diteruskan', langkah.mayit),
      daftarBab,
    });
  }
  daftarBagian.push(hasilAkhir(hasil, sebut, penyusun));
  return { daftarBagian };
}

// ─── Sebutan orang lintas mayit ───────────────────────────────────────────────

/**
 * Tanpa nama, peran disebut terhadap mayit pertama yang ia warisi: "istri", "anak laki-laki dari istri".
 * Sebutan yang sama untuk dua orang diberi urutan ("anak perempuan pertama").
 */
function buatSebut(hasil: HasilOk, graf: GrafKeluarga, penyusun: Penyusun): (id: IdOrang) => Potongan {
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
    if (id === idPewaris) return teksKamus(penyusun, orangIni?.jenisKelamin === 'P' ? 'narasi.umum.pewaris.p' : 'narasi.umum.pewaris.l');
    const peran = ahliWarisDari(id);
    if (!peran) return teksKamus(penyusun, 'narasi.umum.kerabat');
    const label = labelPeran(penyusun, peran.peran);
    return peran.mayit === idPewaris ? label : teksKamus(penyusun, 'narasi.munasakhat.label_dari', { label, mayit: labelDasar(peran.mayit) });
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
    const teks = samaDengan.length > 1 && !graf.orang[id]?.nama ? `${label} ${urutanKe(penyusun, samaDengan.indexOf(id))}` : label;
    return { jenis: 'orang', daftarIdOrang: [id], teks };
  };
}

/** Penerima di jami'ah: orang, atau baris sisa harta seorang mayit (kunci `sisaKeluar:<mayit>`, IdSisaKeluar engine). */
function sebutPenerima(penyusun: Penyusun, id: string, sebut: (id: IdOrang) => Potongan): Potongan[] {
  return id.startsWith(AWALAN_SISA) ? munasakhat(penyusun, 'sisa_harta', { mayit: sebut(id.slice(AWALAN_SISA.length)) }) : [sebut(id)];
}

const munasakhat = (penyusun: Penyusun, kunci: string, sisipan: Record<string, Sisipan> = {}): Potongan[] =>
  susun(penyusun, `narasi.munasakhat.${kunci}`, sisipan);
const judulMunasakhat = (penyusun: Penyusun, kunci: string): string => teksKamus(penyusun, `narasi.munasakhat.${kunci}`);

// ─── Bagian ───────────────────────────────────────────────────────────────────

function pembukaan(hasil: HasilOk, sebut: (id: IdOrang) => Potongan, penyusun: Penyusun): BagianMunasakhat {
  const [pertama, ...berikutnya] = [hasil.daftarLangkah[0]!.mayit, ...urutanWafatSebenarnya(hasil)];
  const pewaris = sebut(pertama!);
  const daftarBaris: BarisPenjelasan[] = [
    buatBaris(munasakhat(penyusun, 'pembukaan.wafat_berantai', {
      pewaris, berikutnya: gabungDan(penyusun, berikutnya.map(id => [sebut(id)])), munasakhat: istilahNarasi(penyusun, 'munasakhat'),
    }), ['R12-1']),
    buatBaris(munasakhat(penyusun, `pembukaan.keadaan.${hasil.keadaan}`, hasil.keadaan === 3 ? {} : { pewaris }), ['R12-2', 'R12-3']),
    buatBaris(munasakhat(penyusun, 'pembukaan.hanya_bagian', { pewaris })),
  ];
  for (const skip of hasil.jejak.filter(langkahIni => langkahIni.jenis === 'MUNASAKHAT_DILEWATI')) {
    daftarBaris.push(buatBaris(munasakhat(penyusun, 'pembukaan.dilewati', { siapa: sebut(skip.mayit), pewaris }), skip.refs));
  }
  return { judul: judulMunasakhat(penyusun, 'judul.kematian_berantai'), daftarBab: [{ judul: judulMunasakhat(penyusun, 'judul.apa_yang_terjadi'), daftarBaris }] };
}

/** Urutan wafat setelah mayit pertama, termasuk yang diabaikan karena tidak mendapat bagian. */
function urutanWafatSebenarnya(hasil: HasilOk): IdOrang[] {
  return hasil.jejak.flatMap(langkahIni => (langkahIni.jenis === 'MUNASAKHAT' || langkahIni.jenis === 'MUNASAKHAT_DILEWATI' ? [langkahIni.mayit] : []));
}

function penggabungan(langkahIni: LangkahGabungan, sebut: (id: IdOrang) => Potongan, penyusun: Penyusun): BabPenjelasan {
  const siapa = sebut(langkahIni.mayit);
  const sebelum = langkahIni.jamiah / langkahIni.wafqMasalah;
  const daftarBaris: BarisPenjelasan[] = [
    buatBaris(munasakhat(penyusun, 'penggabungan.bagian_mayit', { siapa, saham: langkahIni.saham, sebelum, masalah: langkahIni.masalah }), ['R12-2']),
    buatBaris(teksHubungan(penyusun, langkahIni, siapa), ['R12-2']),
    buatBaris(munasakhat(penyusun, 'penggabungan.jamiah', { jamiah: istilahNarasi(penyusun, 'jamiah'), nilai: langkahIni.jamiah }), ['R12-2']),
    ...Object.entries(langkahIni.rincian).map(([id, rincianOrang]) => {
      const istilahIstilah = [
        ...(rincianOrang.sebelum > 0n ? [`${rincianOrang.sebelum} × ${langkahIni.wafqMasalah}`] : []),
        ...(rincianOrang.dariMayit > 0n ? [`${rincianOrang.dariMayit} × ${langkahIni.wafqSaham}`] : []),
      ];
      return buatBaris(kalimat`${sebutPenerima(penyusun, id, sebut)}: ${istilahIstilah.join(' + ')} = ${rincianOrang.sesudah}.`);
    }),
  ];
  return { judul: judulMunasakhat(penyusun, 'judul.penggabungan'), daftarBaris };
}

function teksHubungan(penyusun: Penyusun, langkahIni: LangkahGabungan, siapa: Potongan): Potongan[] {
  const { saham, masalah, fpb, wafqMasalah, wafqSaham } = langkahIni;
  switch (langkahIni.hubungan) {
    case 'habis':
      return saham === masalah
        ? munasakhat(penyusun, 'hubungan.tamatsul', { saham, masalah, tamatsul: istilahNarasi(penyusun, 'tamatsul') })
        : munasakhat(penyusun, 'hubungan.habis', { saham, masalah, siapa, wafq_saham: wafqSaham });
    case 'tawafuq':
      return munasakhat(penyusun, 'hubungan.tawafuq', {
        saham, masalah, fpb, tawafuq: istilahNarasi(penyusun, 'tawafuq'), wafq_masalah: wafqMasalah, wafq: istilahNarasi(penyusun, 'wafq'), siapa, wafq_saham: wafqSaham,
      });
    case 'tabayun':
      return munasakhat(penyusun, 'hubungan.tabayun', { saham, masalah, tabayun: istilahNarasi(penyusun, 'tabayun'), siapa });
  }
}

function hasilAkhir(hasil: HasilOk, sebut: (id: IdOrang) => Potongan, penyusun: Penyusun): BagianMunasakhat {
  const { ikhtishar, nominal, pembulatan } = hasil;
  const tampilkanNominal = hasil.jejak.some(langkahIni => langkahIni.jenis === 'TIRKAH' && langkahIni.kotor > 0n);
  const daftarBaris: BarisPenjelasan[] = [];
  const diringkas = ikhtishar.jamiah !== hasil.jamiah;
  if (diringkas) {
    const faktor = hasil.jamiah / ikhtishar.jamiah;
    daftarBaris.push(buatBaris(munasakhat(penyusun, 'hasil.diringkas_semua', { faktor, jamiah: hasil.jamiah, ringkas: ikhtishar.jamiah }), ['R12-2']));
  }
  const teksRingkas = (id: string): Potongan[] => (diringkas
    ? kalimat` (${munasakhat(penyusun, 'hasil.diringkas', { saham: ikhtishar.saham[id]!, jamiah: ikhtishar.jamiah })})` : []);
  const teksNominal = (uang: bigint): string => (tampilkanNominal ? ` = ${rupiah(uang)}` : '');
  for (const [id, saham] of Object.entries(hasil.saham)) {
    const ringkas = teksRingkas(id);
    daftarBaris.push(buatBaris(kalimat`${sebut(id)}: ${saham}/${hasil.jamiah}${ringkas}${teksNominal(nominal[id]!)}.`, ['R11-1']));
  }
  for (const sisa of hasil.sisaKeluar) {
    const id = `${AWALAN_SISA}${sisa.mayit}`;
    const ringkas = teksRingkas(id);
    daftarBaris.push(tekankan(buatBaris(kalimat`${sebutPenerima(penyusun, id, sebut)}: ${sisa.saham}/${hasil.jamiah}${ringkas}${teksNominal(sisa.nominal)}, `
      .concat(kalimat`${teksTujuanSisa(penyusun, sisa.tujuan)}.`), ['R09-9']), 'perhatian'));
  }
  if (tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    daftarBaris.push(buatBaris(susun(penyusun, 'narasi.umum.selisih_pembulatan', {
      selisih: rupiah(pembulatan.sisaPembulatan), satuan: rupiah(pembulatan.satuan),
    })));
  }
  return { judul: judulMunasakhat(penyusun, 'judul.hasil_akhir'), daftarBab: [{ judul: judulMunasakhat(penyusun, 'judul.bagian_akhir'), daftarBaris }] };
}
