import { fpb } from '@waris/math';
import { hitung } from './pipeline.js';
import { bagikanNominal } from './stages/pembagian.js';
import { hitungTirkah } from './stages/tirkah.js';
import type {
  HasilEngine, GrafKeluarga, HubunganInkisar, InputMunasakhat, HasilMunasakhat, IdOrang, LangkahJejak,
} from './types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
type Saham = Record<IdOrang, bigint>;

const NO_TIRKAH = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };

/**
 * Orkestrator munasakhat (bab 12) di atas pipeline: tiap mayit dihitung dengan `hitung`, lalu digabung
 * bertahap memakai metode Keadaan 3, yang berlaku untuk semua keadaan [R12-3].
 * Yang dibagi hanya harta mayit pertama; bagian yang diteruskan ke mayit berikutnya adalah harta yang ia dapat
 * dari mayit pertama, bukan pembagian waris atas seluruh hartanya. Hutang, wasiat, dan harta pribadinya
 * diselesaikan terpisah oleh ahli warisnya (bab 12.5).
 */
export function hitungMunasakhat(input: InputMunasakhat): HasilMunasakhat {
  const urutan = deathOrder(input);
  const langkahLangkah: Array<{ mayit: IdOrang; hasil: HasilOk }> = [];
  const jejak: LangkahJejak[] = [];
  let saham: Saham = {};
  let jamiah = 0n;

  for (const [index, mayit] of urutan.entries()) {
    if (index > 0 && !saham[mayit]) {
      jejak.push({ tahap: 'munasakhat', refs: ['R12-1'], jenis: 'MUNASAKHAT_DILEWATI', mayit });
      continue;
    }
    // Hanya harta mayit pertama yang bernominal; mayit berikutnya cukup mas'alah-nya (bab 12.5).
    const tirkah = index === 0 ? input.dasar.tirkah : NO_TIRKAH;
    const hasil = hitung({ ...input.dasar, tirkah, graf: graphAt(input, urutan, index) });
    if (hasil.status !== 'OK') return { ...hasil, mayit };
    langkahLangkah.push({ mayit, hasil });

    const masalahSaham = sahamOf(hasil);
    const masalah = total(masalahSaham);
    if (index === 0) {
      saham = masalahSaham;
      jamiah = masalah;
    } else {
      const step = combine(saham, jamiah, mayit, masalahSaham, masalah);
      saham = step.saham;
      jamiah = step.jejak.jamiah;
      jejak.push(step.jejak);
    }
    assertInvariants(saham, jamiah);
  }

  const tirkah = hitungTirkah(input.dasar.tirkah);
  const nominal = bagikanNominal(saham, jamiah, tirkah.bersih, input.dasar.pembulatan.satuan);

  return {
    status: 'OK', langkahLangkah, jamiah, saham,
    keadaan: classifyKeadaan(input, urutan, langkahLangkah, saham, jamiah),
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
function classifyKeadaan(input: InputMunasakhat, urutan: IdOrang[], langkahLangkah: Array<{ mayit: IdOrang; hasil: HasilOk }>,
  saham: Saham, jamiah: bigint): 1 | 2 | 3 {
  const allDead = graphAt(input, urutan, 0);
  for (const idOrang of input.urutanWafat) allDead.orang[idOrang] = { ...allDead.orang[idOrang]!, statusHidup: 'wafat' };
  const direct = hitung({ ...input.dasar, tirkah: NO_TIRKAH, graf: allDead });
  if (direct.status === 'OK' && sameFractions(sahamOf(direct), saham, jamiah)) return 1;

  const [first, ...later] = langkahLangkah;
  const heirsOf = (step: { mayit: IdOrang; hasil: HasilOk }) => Object.keys(sahamOf(step.hasil));
  const mayitIds = new Set(langkahLangkah.map(step => step.mayit));
  const firstHeirs = new Set(heirsOf(first!));
  const disjoint = later.every(step => heirsOf(step).every(id => !firstHeirs.has(id) && !mayitIds.has(id)));
  return later.length > 1 && disjoint ? 2 : 3;
}

function sameFractions(direct: Saham, saham: Saham, jamiah: bigint): boolean {
  const directTotal = total(direct);
  const ids = Object.keys(saham);
  return ids.length === Object.keys(direct).length
    && ids.every(id => direct[id] !== undefined && direct[id]! * jamiah === saham[id]! * directTotal);
}

function deathOrder(input: InputMunasakhat): IdOrang[] {
  const urutan = [input.dasar.graf.idPewaris, ...input.urutanWafat];
  if (new Set(urutan).size !== urutan.length) throw new Error('munasakhat: seseorang tercatat wafat dua kali');
  for (const after of Object.values(input.lahirSetelahWafat ?? {})) {
    if (!urutan.includes(after)) throw new Error(`munasakhat: lahirSetelahWafat merujuk ${after} yang tidak ada di urutan wafat`);
  }
  return urutan;
}

/** Graf saat mayit ke-`index` wafat: yang wafat lebih dulu 'wafat', yang wafat belakangan masih 'hidup'. */
function graphAt(input: InputMunasakhat, urutan: IdOrang[], index: number): GrafKeluarga {
  const { graf } = input.dasar;
  const unborn = new Set(Object.entries(input.lahirSetelahWafat ?? {})
    .filter(([, after]) => index <= urutan.indexOf(after))
    .map(([idOrang]) => idOrang));

  const orang = Object.fromEntries(Object.entries(graf.orang).filter(([id]) => !unborn.has(id)));
  for (const [position, idOrang] of urutan.entries()) {
    orang[idOrang] = { ...graf.orang[idOrang]!, statusHidup: position <= index ? 'wafat' : 'hidup' };
  }
  const pernikahan = graf.pernikahan.filter(m => !unborn.has(m.idSuami) && !unborn.has(m.idIstri));
  return { idPewaris: urutan[index]!, orang, pernikahan };
}

function sahamOf(hasil: HasilOk): Saham {
  const saham: Saham = {};
  for (const barisTabel of hasil.tabel.baris) {
    for (const [idOrang, cell] of Object.entries(barisTabel.perOrang)) {
      if (cell.saham > 0n) saham[idOrang] = cell.saham;
    }
  }
  return saham;
}

const total = (saham: Saham): bigint => Object.values(saham).reduce((a, b) => a + b, 0n);

/**
 * [R12-2] Saham mayit di jami'ah sejauh ini vs mas'alah-nya: habis / tawafuq / tabayun, tanpa tadakhul.
 * Jami'ah baru = jami'ah × wafq mas'alah; saham mas'alah mayit × wafq saham.
 */
function combine(saham: Saham, jamiah: bigint, mayit: IdOrang, masalahSaham: Saham, masalah: bigint):
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
  for (const [idOrang, nilai] of Object.entries(masalahSaham)) {
    const barisTabel = rincian[idOrang] ?? { sebelum: 0n, dariMayit: 0n, sesudah: 0n };
    rincian[idOrang] = { ...barisTabel, dariMayit: nilai, sesudah: barisTabel.sesudah + nilai * wafqSaham };
  }
  const next: Saham = Object.fromEntries(Object.entries(rincian).map(([idOrang, barisTabel]) => [idOrang, barisTabel.sesudah]));
  return {
    saham: next,
    jejak: { tahap: 'munasakhat', refs: ['R12-2'], jenis: 'MUNASAKHAT', mayit, saham: sahamMayit, masalah, hubungan,
      fpb: faktor, wafqMasalah, wafqSaham, jamiah: jamiah * wafqMasalah, rincian },
  };
}

function assertInvariants(saham: Saham, jamiah: bigint): void {
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
