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

import { fpb } from '@waris/math';
import { hitung } from './pipeline.js';
import { bagikanNominal } from './stages/pembagian.js';
import { hitungTirkah } from './stages/tirkah.js';
import type {
  HasilEngine, GrafKeluarga, HubunganInkisar, InputMunasakhat, HasilMunasakhat, IdOrang, LangkahJejak,
} from './types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
type Saham = Record<IdOrang, bigint>;

const TANPA_TIRKAH = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

export function hitungMunasakhat(input: InputMunasakhat): HasilMunasakhat {
  const urutan = urutanKematian(input);
  const daftarLangkah: Array<{ mayit: IdOrang; hasil: HasilOk }> = [];
  const jejak: LangkahJejak[] = [];
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
    daftarLangkah.push({ mayit, hasil });

    const sahamMasalah = sahamDari(hasil);
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
    periksaInvarian(saham, jamiah);
  }

  const tirkah = hitungTirkah(input.dasar.tirkah);
  const nominal = bagikanNominal(saham, jamiah, tirkah.bersih, input.dasar.pembulatan.satuan);

  return {
    status: 'OK', daftarLangkah, jamiah, saham,
    keadaan: tentukanKeadaan(input, urutan, daftarLangkah, saham, jamiah),
    ikhtishar: ikhtisharSiham(saham, jamiah),
    nominal: nominal.nominal,
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
  if (langsung.status === 'OK' && perbandinganSama(sahamDari(langsung), saham, jamiah)) return 1;

  const [langkahPertama, ...langkahBerikutnya] = daftarLangkah;
  const ahliWarisDari = (langkah: { mayit: IdOrang; hasil: HasilOk }) => Object.keys(sahamDari(langkah.hasil));
  const daftarIdMayit = new Set(daftarLangkah.map(langkah => langkah.mayit));
  const ahliWarisPertama = new Set(ahliWarisDari(langkahPertama!));
  const ahliWarisTerpisah = langkahBerikutnya.every(langkah => ahliWarisDari(langkah).every(id => !ahliWarisPertama.has(id) && !daftarIdMayit.has(id)));
  return langkahBerikutnya.length > 1 && ahliWarisTerpisah ? 2 : 3;
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
  for (const idMayitAcuan of Object.values(input.lahirSetelahWafat ?? {})) {
    if (!urutan.includes(idMayitAcuan)) throw new Error(`munasakhat: lahirSetelahWafat merujuk ${idMayitAcuan} yang tidak ada di urutan wafat`);
  }
  return urutan;
}

/** Graf saat mayit ke-`urutanKe` wafat: yang wafat lebih dulu 'wafat', yang wafat belakangan masih 'hidup'. */
function grafPada(input: InputMunasakhat, urutan: IdOrang[], urutanKe: number): GrafKeluarga {
  const { graf } = input.dasar;
  const belumLahir = new Set(Object.entries(input.lahirSetelahWafat ?? {})
    .filter(([, idMayitAcuan]) => urutanKe <= urutan.indexOf(idMayitAcuan))
    .map(([idOrang]) => idOrang));

  const orang = Object.fromEntries(Object.entries(graf.orang).filter(([id]) => !belumLahir.has(id)));
  for (const [posisi, idOrang] of urutan.entries()) {
    orang[idOrang] = { ...graf.orang[idOrang]!, statusHidup: posisi <= urutanKe ? 'wafat' : 'hidup' };
  }
  const pernikahan = graf.pernikahan.filter(nikah => !belumLahir.has(nikah.idSuami) && !belumLahir.has(nikah.idIstri));
  return { idPewaris: urutan[urutanKe]!, orang, pernikahan };
}

function sahamDari(hasil: HasilOk): Saham {
  const saham: Saham = {};
  for (const barisTabel of hasil.tabel.baris) {
    for (const [idOrang, selOrang] of Object.entries(barisTabel.perOrang)) {
      if (selOrang.saham > 0n) saham[idOrang] = selOrang.saham;
    }
  }
  return saham;
}

const total = (saham: Saham): bigint => Object.values(saham).reduce((a, b) => a + b, 0n);

/**
 * [R12-2] Saham mayit di jami'ah sejauh ini vs mas'alah-nya: habis / tawafuq / tabayun, tanpa tadakhul.
 * Jami'ah baru = jami'ah × wafq mas'alah; saham mas'alah mayit × wafq saham.
 */
function gabungkan(saham: Saham, jamiah: bigint, mayit: IdOrang, sahamMasalah: Saham, masalah: bigint):
  { saham: Saham; jejak: Extract<LangkahJejak, { jenis: 'MUNASAKHAT' }> } {
  const sahamMayit = saham[mayit]!;
  const faktor = fpb(sahamMayit, masalah);
  const wafqMasalah = masalah / faktor;
  const wafqSaham = sahamMayit / faktor;
  const hubungan: HubunganInkisar = sahamMayit % masalah === 0n ? 'habis' : faktor === 1n ? 'tabayun' : 'tawafuq';

  const rincian: Extract<LangkahJejak, { jenis: 'MUNASAKHAT' }>['rincian'] = {};
  for (const [idOrang, nilai] of Object.entries(saham)) {
    if (idOrang !== mayit) rincian[idOrang] = { sebelum: nilai, dariMayit: 0n, sesudah: nilai * wafqMasalah };
  }
  for (const [idOrang, nilai] of Object.entries(sahamMasalah)) {
    const rincianOrang = rincian[idOrang] ?? { sebelum: 0n, dariMayit: 0n, sesudah: 0n };
    rincian[idOrang] = { ...rincianOrang, dariMayit: nilai, sesudah: rincianOrang.sesudah + nilai * wafqSaham };
  }
  const sahamBaru: Saham = Object.fromEntries(Object.entries(rincian).map(([idOrang, rincianOrang]) => [idOrang, rincianOrang.sesudah]));
  return {
    saham: sahamBaru,
    jejak: { tahap: 'munasakhat', refs: ['R12-2'], jenis: 'MUNASAKHAT', mayit, saham: sahamMayit, masalah, hubungan,
      fpb: faktor, wafqMasalah, wafqSaham, jamiah: jamiah * wafqMasalah, rincian },
  };
}

function periksaInvarian(saham: Saham, jamiah: bigint): void {
  if (total(saham) !== jamiah) throw new Error(`munasakhat: Σ saham ${total(saham)} ≠ jami'ah ${jamiah}`);
  if (Object.values(saham).some(nilai => nilai <= 0n)) throw new Error('munasakhat: ada saham ≤ 0');
}

/** Bab 12.4 jenis 3: bila semua saham bersekutu, dibagi FPB-nya. Hanya penyajian. */
function ikhtisharSiham(saham: Saham, jamiah: bigint): { jamiah: bigint; saham: Saham } {
  const faktor = Object.values(saham).reduce((acc, nilai) => fpb(acc, nilai), jamiah);
  return {
    jamiah: jamiah / faktor,
    saham: Object.fromEntries(Object.entries(saham).map(([idOrang, nilai]) => [idOrang, nilai / faktor])),
  };
}
