// Orkestrator munasakhat (bab 12): ahli waris wafat sebelum harta dibagi.
// Bukan cabang di dalam pipeline, tapi menjalankan pipeline (`hitungDzawilArham`) sekali per mayit:
//   1. Urutkan kejadian menurut waktu wafat; mayit pertama = pewaris asal. Satu kejadian = satu orang,
//      atau satu kelompok gharqa yang wafat bersamaan (langkahGharqa.ts) [R12-6].
//   2. Tiap mayit: hitung mas'alah-nya dengan graf "saat ia wafat".
//      Mayit yang tidak mendapat bagian dari mayit sebelumnya dilewati [R12-1].
//      Mas'alah tiap mayit melewati fase dzawil arham (bab 14) [R12-5].
//   3. Gabungkan ke jami'ah (mas'alah gabungan) memakai metode Keadaan 3,
//      yang berlaku untuk semua keadaan [R12-3].
//   4. Harta mayit pertama dibagi menurut jami'ah; label Keadaan 1/2/3 hanya untuk penjelasan.
// Yang dibagi hanya harta mayit pertama. Hutang, wasiat, dan harta pribadi mayit berikutnya
// diselesaikan terpisah oleh ahli warisnya (bab 12.5).
// Sisa harta mayit yang tidak di-radd ke pasangan [R09-9] ikut jami'ah sebagai baris `sisaKeluar:<mayit>`,
// lalu dipisah dari saham ahli waris di hasil akhir.

import { fpb } from '@waris/math';
import { AWALAN_SISA, gabungkan as gabungkanSaham, idSisaKeluar, periksaInvarian, sahamDari, totalSaham as total, type Saham } from './gabung.js';
import { hitungDzawilArham } from './dzawilArham.js';
import { adalahKelompok, jejakGabung, metodeGharqa, terapkanKelompok, type JejakGabungan } from './langkahGharqa.js';
import { bagikanNominal } from './stages/pembagian.js';
import { hitungTirkah } from './stages/tirkah.js';
import type {
  HasilEngine, GrafKeluarga, InputMunasakhat, HasilMunasakhat, IdOrang, IdSisaKeluar, KejadianWafat, LangkahJejak, TujuanSisa,
} from './types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;

const TANPA_TIRKAH = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

export function hitungMunasakhat(input: InputMunasakhat): HasilMunasakhat {
  const tidakSah = periksaKejadian(input);
  if (tidakSah) return tidakSah;
  const kejadian: KejadianWafat[] = [input.dasar.graf.idPewaris, ...input.urutanWafat];
  const urutan = urutanKematian(input);
  const daftarLangkah: Array<{ mayit: IdOrang; hasil: HasilOk }> = [];
  const jejak: LangkahJejak[] = [];
  const tujuanSisa: Record<IdSisaKeluar, TujuanSisa> = {};
  // Satu entri rantai per mayit atau per anggota kelompok yang diteruskan; `gabungan` kosong hanya untuk mayit pertama.
  const rantai: BagianRantai[] = [];
  let saham: Saham = {};
  let jamiah = 0n;

  for (const [urutanKe, peristiwa] of kejadian.entries()) {
    if (adalahKelompok(peristiwa)) {
      const inputAnggota = (mayit: IdOrang) => ({ ...input.dasar, tirkah: TANPA_TIRKAH, graf: grafPada(input, urutanKe, mayit) });
      const hasilKelompok = terapkanKelompok(saham, jamiah, peristiwa, inputAnggota);
      if ('status' in hasilKelompok) return { ...hasilKelompok, mayit: hasilKelompok.mayit ?? peristiwa.anggota[0]! };
      for (const langkah of hasilKelompok.daftarLangkah) {
        if (langkah.hasil.sisaKeluar) tujuanSisa[idSisaKeluar(langkah.mayit)] = langkah.hasil.sisaKeluar.tujuan;
      }
      daftarLangkah.push(...hasilKelompok.daftarLangkah);
      rantai.push(...hasilKelompok.bagian.map(bagian => ({ langkah: bagian.langkah, dalam: bagian.dalam, gabungan: bagian.utama })));
      jejak.push(...hasilKelompok.jejak);
      ({ saham, jamiah } = hasilKelompok);
      continue;
    }

    const mayit = peristiwa;
    if (urutanKe > 0 && !saham[mayit]) {
      jejak.push({ tahap: 'munasakhat', refs: ['R12-1'], jenis: 'MUNASAKHAT_DILEWATI', mayit });
      continue;
    }
    // Hanya harta mayit pertama yang bernominal; mayit berikutnya cukup mas'alah-nya (bab 12.5).
    const tirkah = urutanKe === 0 ? input.dasar.tirkah : TANPA_TIRKAH;
    const hasil = hitungDzawilArham({ ...input.dasar, tirkah, graf: grafPada(input, urutanKe, mayit) });
    if (hasil.status !== 'OK') return { ...hasil, mayit };
    if (hasil.sisaKeluar) tujuanSisa[idSisaKeluar(mayit)] = hasil.sisaKeluar.tujuan;
    daftarLangkah.push({ mayit, hasil });

    const sahamMasalah = sahamDari(mayit, hasil);
    const masalah = total(sahamMasalah);
    let gabunganIni: JejakGabungan | undefined;
    if (urutanKe === 0) {
      saham = sahamMasalah;
      jamiah = masalah;
    } else {
      const gabungan = gabungkan(saham, jamiah, mayit, sahamMasalah, masalah);
      saham = gabungan.saham;
      jamiah = gabungan.jejak.jamiah;
      jejak.push(gabungan.jejak);
      gabunganIni = gabungan.jejak;
    }
    rantai.push({ langkah: [{ mayit, hasil }], dalam: [], gabungan: gabunganIni });
    periksaInvarian(saham, jamiah, 'munasakhat');
  }

  const tirkah = hitungTirkah(input.dasar.tirkah);
  const nominal = bagikanNominal(saham, jamiah, tirkah.bersih, input.dasar.pembulatan.satuan);
  const adalahSisa = (id: string): id is IdSisaKeluar => id in tujuanSisa;
  const hanyaAhliWaris = <T>(peta: Record<string, T>) => Object.fromEntries(Object.entries(peta).filter(([id]) => !adalahSisa(id)));

  return {
    status: 'OK', daftarLangkah: beriPengali(rantai), jamiah, saham: hanyaAhliWaris(saham),
    sisaKeluar: Object.keys(saham).filter(adalahSisa).map(id => ({
      mayit: id.slice(AWALAN_SISA.length), tujuan: tujuanSisa[id]!, saham: saham[id]!, nominal: nominal.nominal[id]!,
    })),
    urutanWafat: input.urutanWafat,
    keadaan: tentukanKeadaan(input, urutan, daftarLangkah, saham, jamiah),
    ikhtishar: ikhtisharSiham(saham, jamiah),
    nominal: hanyaAhliWaris(nominal.nominal),
    pembulatan: { satuan: input.dasar.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan },
    jejak: [...jejak, tirkah.jejak, ...nominal.jejak],
  };
}

interface BagianRantai { langkah: Array<{ mayit: IdOrang; hasil: HasilOk }>; dalam: JejakGabungan[]; gabungan: JejakGabungan | undefined }

/**
 * [R12-2] Pengali tiap mas'alah, dihitung mundur dari penggabungan terakhir: pengali penggabungan berikutnya
 * (wafq mas'alah mayit berikutnya) mengalikan semua yang sudah ada; wafq saham mengalikan mas'alah mayit yang digabung.
 * Anggota kelompok tilad–tharif [R13-19] punya rantai kecil sendiri (tharif digabung ke tilad) yang dikalikan pengali anggotanya di rantai besar.
 */
function beriPengali(rantai: BagianRantai[]) {
  const pengaliDi = (urutan: JejakGabungan[], awal: JejakGabungan | undefined, ke: number) =>
    urutan.slice(ke).reduce((hasil, gabungan) => hasil * gabungan.wafqMasalah, awal ? awal.wafqSaham : 1n);
  const gabunganBesar = rantai.flatMap(bagian => (bagian.gabungan ? [bagian.gabungan] : []));
  return rantai.flatMap(bagian => {
    const pengaliBagian = pengaliDi(gabunganBesar, bagian.gabungan, bagian.gabungan ? gabunganBesar.indexOf(bagian.gabungan) + 1 : 0);
    return bagian.langkah.map((langkah, urutanDalam) => {
      const pengaliDalam = urutanDalam === 0 ? pengaliDi(bagian.dalam, undefined, 0) : pengaliDi(bagian.dalam, bagian.dalam[urutanDalam - 1], urutanDalam);
      return { ...langkah, masalah: total(sahamDari(langkah.mayit, langkah.hasil)), pengali: pengaliBagian * pengaliDalam };
    });
  });
}

/**
 * [R12-2] Kaidah pembeda tiga keadaan (bab 12.2), diterapkan pada seluruh rantai:
 * - 1: hasil = membagi harta mayit pertama langsung kepada yang masih hidup, seolah yang wafat belakangan tidak ada
 *      (ahli waris mayit berikutnya = baqiyyah ahli waris mayit pertama, bagian tidak berbeda);
 * - 2: lebih dari satu mayit kedua, ahli waris masing-masing tidak mewarisi dari mayit pertama maupun mayit lain;
 * - 3: selain itu.
 */
function tentukanKeadaan(input: InputMunasakhat, urutan: IdOrang[], daftarLangkah: Array<{ mayit: IdOrang; hasil: HasilOk }>,
  saham: Saham, jamiah: bigint): 1 | 2 | 3 {
  const semuaWafat = grafPada(input, 0, urutan[0]!);
  for (const idOrang of urutan) semuaWafat.orang[idOrang] = { ...semuaWafat.orang[idOrang]!, statusHidup: 'wafat' };
  const langsung = hitungDzawilArham({ ...input.dasar, tirkah: TANPA_TIRKAH, graf: semuaWafat });
  if (langsung.status === 'OK' && perbandinganSama(sahamDari(urutan[0]!, langsung), saham, jamiah)) return 1;

  const [langkahPertama, ...langkahBerikutnya] = daftarLangkah;
  const ahliWarisDari = (langkah: { mayit: IdOrang; hasil: HasilOk }) => Object.keys(sahamDari(langkah.mayit, langkah.hasil));
  const daftarIdMayit = new Set(daftarLangkah.map(langkah => langkah.mayit));
  const ahliWarisPertama = new Set(ahliWarisDari(langkahPertama!));
  const ahliWarisTerpisah = langkahBerikutnya.every(langkah => ahliWarisDari(langkah).every(id => !ahliWarisPertama.has(id) && !daftarIdMayit.has(id)));
  return langkahBerikutnya.length > 1 && ahliWarisTerpisah ? 2 : 3;
}

function gabungkan(saham: Saham, jamiah: bigint, mayit: IdOrang, sahamMasalah: Saham, masalah: bigint):
  { saham: Saham; jejak: Extract<LangkahJejak, { jenis: 'MUNASAKHAT' }> } {
  const hasil = gabungkanSaham(saham, jamiah, mayit, sahamMasalah, masalah);
  return { saham: hasil.saham, jejak: jejakGabung(mayit, hasil, ['R12-2']) };
}

function perbandinganSama(langsung: Saham, saham: Saham, jamiah: bigint): boolean {
  const totalLangsung = total(langsung);
  const daftarId = Object.keys(saham);
  return daftarId.length === Object.keys(langsung).length
    && daftarId.every(id => langsung[id] !== undefined && langsung[id]! * jamiah === saham[id]! * totalLangsung);
}

/** Semua orang yang wafat, urut kejadian; anggota satu kelompok berurutan di dalam kejadiannya. */
function urutanKematian(input: InputMunasakhat): IdOrang[] {
  const urutan = [input.dasar.graf.idPewaris, ...input.urutanWafat.flatMap(kejadian => (adalahKelompok(kejadian) ? kejadian.anggota : [kejadian]))];
  if (new Set(urutan).size !== urutan.length) throw new Error('munasakhat: seseorang tercatat wafat dua kali');
  const tidakDiGraf = urutan.find(idMayit => !input.dasar.graf.orang[idMayit]);
  if (tidakDiGraf) throw new Error(`munasakhat: ${tidakDiGraf} di urutan wafat tidak ada di graf`);
  for (const idMayitAcuan of Object.values(input.dikandungSetelahWafat ?? {})) {
    if (!urutan.includes(idMayitAcuan)) throw new Error(`munasakhat: dikandungSetelahWafat merujuk ${idMayitAcuan} yang tidak ada di urutan wafat`);
  }
  return urutan;
}

/** Kelompok gharqa < 2 anggota bukan gharqa [R13-10]; kelompok skenario baru didukung setelah ekspansi (Task 5). */
function periksaKejadian(input: InputMunasakhat): Extract<HasilMunasakhat, { status: 'PERLU_INPUT' | 'TIDAK_DIDUKUNG' }> | undefined {
  for (const kejadian of input.urutanWafat) {
    if (!adalahKelompok(kejadian)) continue;
    const mayit = kejadian.anggota[0]!;
    if (kejadian.anggota.length < 2) {
      return { status: 'PERLU_INPUT', mayit, pertanyaan: [{ idOrang: mayit, isian: 'statusHidup', alasan: 'Gharqa butuh minimal dua orang yang wafat bersamaan.' }] };
    }
    if (metodeGharqa(input.dasar.ruleset, kejadian.keadaan).metode === 'skenario') {
      return { status: 'TIDAK_DIDUKUNG', mayit, refs: ['R13-10'],
        alasan: 'Kelompok gharqa keadaan terlupakan [SYF] ditahan per skenario urutan (R13-10); belum didukung di tengah rantai munasakhat.' };
    }
  }
  return undefined;
}

/**
 * Graf saat kejadian ke-`urutanKe` terjadi, dengan `idPewaris` sebagai mayit yang dihitung:
 * semua orang di kejadian <= `urutanKe` 'wafat' (anggota satu kelompok bersamaan), yang sesudahnya masih 'hidup'.
 */
function grafPada(input: InputMunasakhat, urutanKe: number, idPewaris: IdOrang): GrafKeluarga {
  const { graf } = input.dasar;
  const kejadian = [[graf.idPewaris], ...input.urutanWafat.map(peristiwa => (adalahKelompok(peristiwa) ? peristiwa.anggota : [peristiwa]))];
  const kejadianKe = (idOrang: IdOrang) => kejadian.findIndex(anggota => anggota.includes(idOrang));
  const belumDikandung = new Set(Object.entries(input.dikandungSetelahWafat ?? {})
    .filter(([, idMayitAcuan]) => urutanKe <= kejadianKe(idMayitAcuan))
    .map(([idOrang]) => idOrang));

  const orang = Object.fromEntries(Object.entries(graf.orang).filter(([id]) => !belumDikandung.has(id)));
  for (const [posisi, anggota] of kejadian.entries()) {
    for (const idOrang of anggota) orang[idOrang] = { ...graf.orang[idOrang]!, statusHidup: posisi <= urutanKe ? 'wafat' : 'hidup' };
  }
  const pernikahan = graf.pernikahan.filter(nikah => !belumDikandung.has(nikah.idSuami) && !belumDikandung.has(nikah.idIstri));
  return { idPewaris, orang, pernikahan };
}

/** Bab 12.4 jenis 3: bila semua saham bersekutu, dibagi FPB-nya. Hanya penyajian. */
function ikhtisharSiham(saham: Saham, jamiah: bigint): { jamiah: bigint; saham: Saham } {
  const faktor = Object.values(saham).reduce((acc, nilai) => fpb(acc, nilai), jamiah);
  return {
    jamiah: jamiah / faktor,
    saham: Object.fromEntries(Object.entries(saham).map(([idOrang, nilai]) => [idOrang, nilai / faktor])),
  };
}
