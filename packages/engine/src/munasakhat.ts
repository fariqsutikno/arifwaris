// Orkestrator munasakhat (bab 12): ahli waris wafat sebelum harta dibagi.
// Bukan cabang di dalam pipeline, tapi menjalankan pipeline (`hitung`) sekali per mayit:
//   1. Urutkan mayit menurut waktu wafat; mayit pertama = pewaris asal.
//   2. Tiap mayit: hitung mas'alah-nya dengan graf "saat ia wafat".
//      Mayit yang tidak mendapat bagian dari mayit sebelumnya dilewati [R12-1].
//   3. Gabungkan ke jami'ah (mas'alah gabungan) memakai metode Keadaan 3,
//      yang berlaku untuk semua keadaan [R12-3].
//   4. Harta mayit pertama dibagi menurut jami'ah; label Keadaan 1/2/3 hanya untuk penjelasan.
// Yang dibagi hanya harta mayit pertama. Hutang, wasiat, dan harta pribadi mayit berikutnya
// diselesaikan terpisah oleh ahli warisnya (bab 12.5).
// Sisa harta mayit yang tidak di-radd ke pasangan [R09-9] ikut jami'ah sebagai baris `sisaKeluar:<mayit>`,
// lalu dipisah dari saham ahli waris di hasil akhir.

import { fpb } from '@waris/math';
import { AWALAN_SISA, gabungkan as gabungkanSaham, idSisaKeluar, periksaInvarian, sahamDari, totalSaham as total, type Saham } from './gabung.js';
import { hitung } from './pipeline.js';
import { bagikanNominal } from './stages/pembagian.js';
import { hitungTirkah } from './stages/tirkah.js';
import type {
  HasilEngine, GrafKeluarga, InputMunasakhat, HasilMunasakhat, IdOrang, IdSisaKeluar, LangkahJejak, TujuanSisa,
} from './types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;

const TANPA_TIRKAH = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

export function hitungMunasakhat(input: InputMunasakhat): HasilMunasakhat {
  const urutan = urutanKematian(input);
  const daftarLangkah: Array<{ mayit: IdOrang; hasil: HasilOk }> = [];
  const jejak: LangkahJejak[] = [];
  const tujuanSisa: Record<IdSisaKeluar, TujuanSisa> = {};
  let saham: Saham = {};
  let jamiah = 0n;

  for (const [urutanKe, mayit] of urutan.entries()) {
    if (urutanKe > 0 && !saham[mayit]) {
      jejak.push({ tahap: 'munasakhat', refs: ['R12-1'], jenis: 'MUNASAKHAT_DILEWATI', mayit });
      continue;
    }
    // Hanya harta mayit pertama yang bernominal; mayit berikutnya cukup mas'alah-nya (bab 12.5).
    const tirkah = urutanKe === 0 ? input.dasar.tirkah : TANPA_TIRKAH;
    const hasil = hitung({ ...input.dasar, tirkah, graf: grafPada(input, urutan, urutanKe) });
    if (hasil.status !== 'OK') return { ...hasil, mayit };
    if (hasil.sisaKeluar) tujuanSisa[idSisaKeluar(mayit)] = hasil.sisaKeluar.tujuan;
    daftarLangkah.push({ mayit, hasil });

    const sahamMasalah = sahamDari(mayit, hasil);
    const masalah = total(sahamMasalah);
    if (urutanKe === 0) {
      saham = sahamMasalah;
      jamiah = masalah;
    } else {
      const gabungan = gabungkan(saham, jamiah, mayit, sahamMasalah, masalah);
      saham = gabungan.saham;
      jamiah = gabungan.jejak.jamiah;
      jejak.push(gabungan.jejak);
    }
    periksaInvarian(saham, jamiah, 'munasakhat');
  }

  const tirkah = hitungTirkah(input.dasar.tirkah);
  const nominal = bagikanNominal(saham, jamiah, tirkah.bersih, input.dasar.pembulatan.satuan);
  const adalahSisa = (id: string): id is IdSisaKeluar => id in tujuanSisa;
  const hanyaAhliWaris = <T>(peta: Record<string, T>) => Object.fromEntries(Object.entries(peta).filter(([id]) => !adalahSisa(id)));

  return {
    status: 'OK', daftarLangkah, jamiah, saham: hanyaAhliWaris(saham),
    sisaKeluar: Object.keys(saham).filter(adalahSisa).map(id => ({
      mayit: id.slice(AWALAN_SISA.length), tujuan: tujuanSisa[id]!, saham: saham[id]!, nominal: nominal.nominal[id]!,
    })),
    keadaan: tentukanKeadaan(input, urutan, daftarLangkah, saham, jamiah),
    ikhtishar: ikhtisharSiham(saham, jamiah),
    nominal: hanyaAhliWaris(nominal.nominal),
    pembulatan: { satuan: input.dasar.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan },
    jejak: [...jejak, tirkah.jejak, ...nominal.jejak],
  };
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
  const semuaWafat = grafPada(input, urutan, 0);
  for (const idOrang of input.urutanWafat) semuaWafat.orang[idOrang] = { ...semuaWafat.orang[idOrang]!, statusHidup: 'wafat' };
  const langsung = hitung({ ...input.dasar, tirkah: TANPA_TIRKAH, graf: semuaWafat });
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
  return {
    saham: hasil.saham,
    jejak: { tahap: 'munasakhat', refs: ['R12-2'], jenis: 'MUNASAKHAT', mayit, saham: hasil.sahamMayit, masalah, hubungan: hasil.hubungan,
      fpb: hasil.fpb, wafqMasalah: hasil.wafqMasalah, wafqSaham: hasil.wafqSaham, jamiah: hasil.jamiah, rincian: hasil.rincian },
  };
}

function perbandinganSama(langsung: Saham, saham: Saham, jamiah: bigint): boolean {
  const totalLangsung = total(langsung);
  const daftarId = Object.keys(saham);
  return daftarId.length === Object.keys(langsung).length
    && daftarId.every(id => langsung[id] !== undefined && langsung[id]! * jamiah === saham[id]! * totalLangsung);
}

function urutanKematian(input: InputMunasakhat): IdOrang[] {
  const urutan = [input.dasar.graf.idPewaris, ...input.urutanWafat];
  if (new Set(urutan).size !== urutan.length) throw new Error('munasakhat: seseorang tercatat wafat dua kali');
  const tidakDiGraf = urutan.find(idMayit => !input.dasar.graf.orang[idMayit]);
  if (tidakDiGraf) throw new Error(`munasakhat: ${tidakDiGraf} di urutan wafat tidak ada di graf`);
  for (const idMayitAcuan of Object.values(input.dikandungSetelahWafat ?? {})) {
    if (!urutan.includes(idMayitAcuan)) throw new Error(`munasakhat: dikandungSetelahWafat merujuk ${idMayitAcuan} yang tidak ada di urutan wafat`);
  }
  return urutan;
}

/** Graf saat mayit ke-`urutanKe` wafat: yang wafat lebih dulu 'wafat', yang wafat belakangan masih 'hidup'. */
function grafPada(input: InputMunasakhat, urutan: IdOrang[], urutanKe: number): GrafKeluarga {
  const { graf } = input.dasar;
  const belumDikandung = new Set(Object.entries(input.dikandungSetelahWafat ?? {})
    .filter(([, idMayitAcuan]) => urutanKe <= urutan.indexOf(idMayitAcuan))
    .map(([idOrang]) => idOrang));

  const orang = Object.fromEntries(Object.entries(graf.orang).filter(([id]) => !belumDikandung.has(id)));
  for (const [posisi, idOrang] of urutan.entries()) {
    orang[idOrang] = { ...graf.orang[idOrang]!, statusHidup: posisi <= urutanKe ? 'wafat' : 'hidup' };
  }
  const pernikahan = graf.pernikahan.filter(nikah => !belumDikandung.has(nikah.idSuami) && !belumDikandung.has(nikah.idIstri));
  return { idPewaris: urutan[urutanKe]!, orang, pernikahan };
}

/** Bab 12.4 jenis 3: bila semua saham bersekutu, dibagi FPB-nya. Hanya penyajian. */
function ikhtisharSiham(saham: Saham, jamiah: bigint): { jamiah: bigint; saham: Saham } {
  const faktor = Object.values(saham).reduce((acc, nilai) => fpb(acc, nilai), jamiah);
  return {
    jamiah: jamiah / faktor,
    saham: Object.fromEntries(Object.entries(saham).map(([idOrang, nilai]) => [idOrang, nilai / faktor])),
  };
}
