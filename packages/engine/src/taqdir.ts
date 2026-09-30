// Orkestrator taqdir bab 13 (haml, mafqud, khuntsa) di atas pipeline, pola sama dengan munasakhat.ts.
//   Masuk : InputEngine yang grafnya memuat node belum pasti (statusHidup dalamKandungan/mafqud, field khuntsa),
//           opsional urutan wafat munasakhat (13.0b butir 2).
//   Putus : tiap sumber → himpunan taqdir menurut madzhab; dunia = hasil kali kartesius. Sumber setengah/terburuk
//           dilebur di dalam tiap dunia luar, lalu tiap orang diberi aqall atas dunia luar (13.0b butir 5) [R13-4].
//   Keluar: jami'ah, yang diberikan sekarang, mauquf, dan tabel "jika terbukti X" per dunia luar.

import { fpb, kpk } from '@waris/math';
import { hitungDzawilArham } from './dzawilArham.js';
import { idSisaKeluar, sahamDari, totalSaham, type Saham } from './gabung.js';
import { hitungMunasakhat } from './munasakhat.js';
import { bagikanNominal } from './stages/pembagian.js';
import { hitungTirkah } from './stages/tirkah.js';
import type {
  DuniaTaqdir, GrafKeluarga, HasilEngine, HasilTaqdir, IdOrang, InputEngine, InputMunasakhat, LangkahJejak, NilaiTaqdir, Orang, Pertanyaan, Ruleset,
} from './types.js';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
type Gagal = Extract<HasilTaqdir, { status: 'PERLU_INPUT' | 'TIDAK_DIDUKUNG' | 'MAUQUF_SEMUA' }>;
type Taqdir = Record<IdOrang, NilaiTaqdir>;
type Pemberian = 'aqall' | 'setengah' | 'terburuk';

interface Sumber { id: IdOrang; jenis: 'haml' | 'mafqud' | 'khuntsa'; taqdir: NilaiTaqdir[]; pemberian: Pemberian }
interface HasilDunia { saham: Saham; masalah: bigint; statusOrang: HasilOk['statusOrang']; mitraAshabahHaml: Set<IdOrang>; mitraFardhHaml: Set<IdOrang> }

export interface OpsiTaqdir {
  urutanWafat?: IdOrang[];
  dikandungSetelahWafat?: InputMunasakhat['dikandungSetelahWafat'];
  /** Penghitung satu dunia pasti selain pipeline/munasakhat, mis. tilad–tharif gharqa [HNB] (13.0b butir 2). */
  hitungDuniaPasti?: HitungDuniaPasti;
}
export type HitungDuniaPasti = (input: InputEngine) => { saham: Saham; daftarHasil: HasilOk[] } | Gagal;

// Batas keras kombinatorik (CLAUDE.md): lewat batas → PERLU_INPUT, bukan macet.
export const BATAS_DUNIA = 256;
const AKHIRAN_KEMBAR = '~2';
const KUNCI_MAUQUF = 'mauquf:';

// [R13-3] enam taqdir operasional; [SYF] jumlah janin tak dibatasi ditangani kelas D [R13-15].
const ENAM_TAQDIR_HAML: NilaiTaqdir[] = ['mati', 'lk', 'pr', 'duaLk', 'duaPr', 'lkPr'];
const TAQDIR_HAML: Record<Ruleset, NilaiTaqdir[] | undefined> = {
  syafii: ENAM_TAQDIR_HAML,
  hanbali: ENAM_TAQDIR_HAML,        // [K13a-3] dua lk atau dua pr
  hanafi: ['mati', 'lk', 'pr'],     // [K13a-3] fatwa: bagian satu anak
  maliki: undefined,                // [K13a-2] tidak dibagi sampai lahir
};

export function hitungTaqdir(input: InputEngine, opsi: OpsiTaqdir = {}): HasilTaqdir {
  const tidakSah = periksaSumber(input.graf);
  if (tidakSah) return tidakSah;
  const sumber = kumpulkanSumber(input);
  if (!Array.isArray(sumber)) return sumber;

  const luar = sumber.filter(sumberIni => sumberIni.pemberian === 'aqall');
  const dalam = sumber.filter(sumberIni => sumberIni.pemberian !== 'aqall');
  const banyakDunia = sumber.reduce((hasil, sumberIni) => hasil * sumberIni.taqdir.length, 1);
  if (banyakDunia > BATAS_DUNIA) {
    return { status: 'PERLU_INPUT', pertanyaan: sumber.map(sumberIni => ({ idOrang: sumberIni.id, isian: 'statusHidup' as const,
      alasan: `Terlalu banyak kemungkinan (${banyakDunia} > ${BATAS_DUNIA}); pastikan status sebagian orang dulu.` })) };
  }

  const jejak: LangkahJejak[] = [];
  const mentah: Array<{ taqdir: Taqdir } & HasilDunia> = [];
  for (const taqdirLuar of kartesius(luar)) {
    const dunia = leburDalam(input, opsi, taqdirLuar, dalam, jejak);
    if ('status' in dunia) return dunia;
    mentah.push({ ...dunia, taqdir: taqdirLuar });
  }

  // [R13-15] [SYF] mitra ashabah haml tidak diberi apa pun; mitra fardh sekelompok tidak ada di KB.
  const kelasD = input.ruleset === 'syafii' ? new Set(mentah.flatMap(dunia => [...dunia.mitraAshabahHaml])) : new Set<IdOrang>();
  const mitraFardh = mentah.flatMap(dunia => [...dunia.mitraFardhHaml]).filter(id => !kelasD.has(id));
  if (input.ruleset === 'syafii' && mitraFardh.length > 0) {
    return { status: 'TIDAK_DIDUKUNG', alasan: `Berbagi fardh sekelompok dengan janin (${[...new Set(mitraFardh)].join(', ')}) belum diatur KB [SYF].`, refs: ['R13-4', 'R13-15'] };
  }

  const jamiah = mentah.reduce((hasil, dunia) => kpk(hasil, dunia.masalah), 1n);
  const daftarDunia: DuniaTaqdir[] = mentah.map(dunia => {
    const juzSahm = jamiah / dunia.masalah;
    jejak.push({ tahap: 'taqdir', refs: ['R13-16'], jenis: 'TAQDIR_DUNIA', taqdir: dunia.taqdir, masalah: dunia.masalah, juzSahm, jamiah });
    return { taqdir: dunia.taqdir, masalah: dunia.masalah, statusOrang: dunia.statusOrang, saham: Object.fromEntries(Object.entries(dunia.saham).map(([id, nilai]) => [id, nilai * juzSahm])) };
  });

  const ditahan = new Set(sumber.filter(sumberIni => sumberIni.jenis !== 'khuntsa').map(sumberIni => sumberIni.id));
  const diberikan = beriAqall(daftarDunia, ditahan, kelasD, refsPemberian(input.ruleset, sumber), jejak);
  const mauquf = jamiah - totalSaham(diberikan);
  periksaInvarianTaqdir(diberikan, mauquf, daftarDunia);
  jejak.push({ tahap: 'taqdir', refs: refsPemberian(input.ruleset, sumber), jenis: 'MAUQUF', saham: mauquf, jamiah });

  const tirkah = hitungTirkah(input.tirkah);
  const nominal = bagikanNominal({ ...diberikan, [KUNCI_MAUQUF]: mauquf }, jamiah, tirkah.bersih, input.pembulatan.satuan);
  const { [KUNCI_MAUQUF]: nominalMauquf = 0n, ...nominalOrang } = nominal.nominal;
  return {
    status: 'OK', jamiah, diberikan, mauquf, daftarDunia, nominal: nominalOrang, nominalMauquf,
    pembulatan: { satuan: input.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan },
    jejak: [tirkah.jejak, ...jejak, ...nominal.jejak.filter(langkah => langkah.jenis !== 'DISTRIBUSI' || langkah.idOrang !== KUNCI_MAUQUF)],
    ruleset: input.ruleset,
  };
}

// ─── Sumber ketidakpastian ────────────────────────────────────────────────────

/** [R13-9] khuntsa hanya di jihah bunuwwah/ukhuwwah/'umumah/wala': bukan pasangan, bukan orang tua. Haml wajib ber-ibu. */
function periksaSumber(graf: GrafKeluarga): Gagal | undefined {
  const pertanyaan: Pertanyaan[] = [];
  const orangTua = new Set(Object.values(graf.orang).flatMap(orangIni => [orangIni.idAyah, orangIni.idIbu]));
  const pasangan = new Set(graf.pernikahan.flatMap(nikah => [nikah.idSuami, nikah.idIstri]));
  for (const orangIni of Object.values(graf.orang)) {
    if (orangIni.khuntsa && (orangTua.has(orangIni.id) || pasangan.has(orangIni.id))) {
      pertanyaan.push({ idOrang: orangIni.id, isian: 'khuntsa', alasan: 'Khuntsa musykil tidak mungkin menjadi pasangan atau orang tua (13c.1).' });
    }
    if (orangIni.statusHidup === 'dalamKandungan' && !orangIni.idIbu) {
      pertanyaan.push({ idOrang: orangIni.id, isian: 'idIbu', alasan: 'Janin harus punya ibu yang mengandungnya (13a.1).' });
    }
  }
  return pertanyaan.length > 0 ? { status: 'PERLU_INPUT', pertanyaan } : undefined;
}

function kumpulkanSumber(input: InputEngine): Sumber[] | Gagal {
  const sumber: Sumber[] = [];
  for (const orangIni of Object.values(input.graf.orang)) {
    if (orangIni.statusHidup === 'dalamKandungan') {
      const taqdir = TAQDIR_HAML[input.ruleset];
      if (!taqdir) return { status: 'MAUQUF_SEMUA', alasan: 'Tirkah tidak dibagi sampai janin lahir.', refs: ['K13a-2'] };
      sumber.push({ id: orangIni.id, jenis: 'haml', taqdir, pemberian: 'aqall' });
    } else if (orangIni.statusHidup === 'mafqud') {
      sumber.push({ id: orangIni.id, jenis: 'mafqud', taqdir: ['hidup', 'mati'], pemberian: 'aqall' });   // [R13-8] al-aswa'
    } else if (orangIni.khuntsa) {
      sumber.push({ id: orangIni.id, jenis: 'khuntsa', taqdir: ['lk', 'pr'], pemberian: pemberianKhuntsa(input.ruleset, orangIni) });
    }
  }
  // [K13c-1] [HNF] "paling merugikan" hanya dikenal untuk satu khuntsa; gabungan beberapa khuntsa tidak ada di KB.
  if (sumber.filter(sumberIni => sumberIni.pemberian === 'terburuk').length > 1) {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Lebih dari satu khuntsa dalam madzhab Hanafi belum diatur KB.', refs: ['K13c-1'] };
  }
  return sumber;
}

/** [K13c-1] [SYF] aqall; [HNB] aqall bila diharapkan jelas, selain itu setengah; [HNF] terburuk; [MLK] setengah. */
function pemberianKhuntsa(ruleset: Ruleset, orangIni: Orang): Pemberian {
  if (ruleset === 'hanafi') return 'terburuk';
  if (ruleset === 'maliki') return 'setengah';
  if (ruleset === 'hanbali' && orangIni.khuntsa === 'tidakDiharapkanJelas') return 'setengah';
  return 'aqall';
}

function refsPemberian(ruleset: Ruleset, sumber: Sumber[]): string[] {
  const kode: Record<Sumber['jenis'], string> = ruleset === 'syafii'
    ? { haml: 'R13-4', mafqud: 'R13-8', khuntsa: 'R13-9' }
    : { haml: 'K13a-3', mafqud: 'K13b-2', khuntsa: 'K13c-1' };
  return [...new Set(sumber.map(sumberIni => kode[sumberIni.jenis]))];
}

// ─── Satu dunia ───────────────────────────────────────────────────────────────

/** 13.0b butir 5: sumber setengah/terburuk dilebur di dalam dunia luar ini. */
function leburDalam(input: InputEngine, opsi: OpsiTaqdir, taqdirLuar: Taqdir, dalam: Sumber[], jejak: LangkahJejak[]): HasilDunia | Gagal {
  const daftarHasil: Array<{ taqdir: Taqdir } & HasilDunia> = [];
  for (const taqdirDalam of kartesius(dalam)) {
    const hasil = hitungDunia(input, opsi, { ...taqdirLuar, ...taqdirDalam });
    if ('status' in hasil) return hasil;
    daftarHasil.push({ ...hasil, taqdir: taqdirDalam });
  }
  if (dalam.length === 0) return daftarHasil[0]!;

  const idDalam = dalam.map(sumberIni => sumberIni.id);
  if (dalam[0]!.pemberian === 'terburuk') {
    // [K13c-1] [HNF] pilih taqdir yang memberi khuntsa paling sedikit; ahli waris lain mengikuti taqdir itu.
    const khuntsa = idDalam[0]!;
    const porsi = (hasil: HasilDunia) => ({ n: hasil.saham[khuntsa] ?? 0n, d: hasil.masalah });
    const terpilih = daftarHasil.reduce((a, b) => (porsi(b).n * porsi(a).d < porsi(a).n * porsi(b).d ? b : a));
    jejak.push({ tahap: 'taqdir', refs: ['K13c-1'], jenis: 'TAQDIR_LEBUR', aturan: 'terburuk', sumber: idDalam, terpilih: terpilih.taqdir });
    return terpilih;
  }

  // [K13c-1] setengah-setengah: jami'ah × banyak taqdir, bagian = jumlah nashib di semua taqdir (13c.3).
  const jamiahDalam = daftarHasil.reduce((hasil, dunia) => kpk(hasil, dunia.masalah), 1n);
  const saham: Saham = {};
  for (const dunia of daftarHasil) {
    for (const [id, nilai] of Object.entries(dunia.saham)) saham[id] = (saham[id] ?? 0n) + nilai * (jamiahDalam / dunia.masalah);
  }
  jejak.push({ tahap: 'taqdir', refs: ['K13c-1'], jenis: 'TAQDIR_LEBUR', aturan: 'setengah', sumber: idDalam });
  return {
    saham, masalah: jamiahDalam * BigInt(daftarHasil.length), statusOrang: daftarHasil[0]!.statusOrang,
    mitraAshabahHaml: new Set(daftarHasil.flatMap(dunia => [...dunia.mitraAshabahHaml])),
    mitraFardhHaml: new Set(daftarHasil.flatMap(dunia => [...dunia.mitraFardhHaml])),
  };
}

/** 13.0b butir 2: dunia pasti → pipeline biasa (dengan dzawil arham) atau munasakhat. */
function hitungDunia(input: InputEngine, opsi: OpsiTaqdir, taqdir: Taqdir): HasilDunia | Gagal {
  const graf = grafPasti(input.graf, taqdir);
  const inputDunia = { ...input, graf };
  const haml = new Set(Object.entries(taqdir).filter(([id]) => input.graf.orang[id]!.statusHidup === 'dalamKandungan')
    .flatMap(([id]) => [id, id + AKHIRAN_KEMBAR]));

  let daftarHasil: HasilOk[];
  let saham: Saham;
  if (opsi.hitungDuniaPasti) {
    const hasil = opsi.hitungDuniaPasti(inputDunia);
    if ('status' in hasil) return hasil;
    ({ saham, daftarHasil } = hasil);
  } else if (opsi.urutanWafat) {
    const hasil = hitungMunasakhat({ dasar: inputDunia, urutanWafat: opsi.urutanWafat, ...(opsi.dikandungSetelahWafat ? { dikandungSetelahWafat: opsi.dikandungSetelahWafat } : {}) });
    if (hasil.status !== 'OK') return hasil;
    daftarHasil = hasil.daftarLangkah.map(langkah => langkah.hasil);
    saham = { ...hasil.saham, ...Object.fromEntries(hasil.sisaKeluar.map(sisa => [idSisaKeluar(sisa.mayit), sisa.saham])) };
  } else {
    const hasil = hitungDzawilArham(inputDunia);
    if (hasil.status !== 'OK') return hasil;
    daftarHasil = [hasil];
    saham = tanpaTashihJanin(gabungKembar(sahamDari(graf.idPewaris, hasil)), hasil, haml);
  }
  return { saham: gabungKembar(saham), masalah: totalSaham(saham), statusOrang: daftarHasil[0]!.statusOrang, ...mitraHaml(daftarHasil, haml) };
}

/**
 * [KH] Kelompok yang anggotanya janin saja tidak perlu di-tashih: bagiannya ditahan utuh (13a.7 H3, Lahim hlm. 149).
 * Juz' as-sahm dihitung ulang tanpa kelompok itu; pecahan tiap orang tidak berubah, hanya angka mas'alah.
 */
function tanpaTashihJanin(saham: Saham, hasil: HasilOk, haml: Set<IdOrang>): Saham {
  const { totalKolom, baris } = hasil.tabel;
  const kolomDasar = totalKolom.aul !== undefined ? 'aul' : totalKolom.radd !== undefined ? 'radd' : 'ashl';
  if (haml.size === 0 || totalKolom.tashih === undefined || totalSaham(saham) !== totalKolom.tashih) return saham;
  let juzTanpaJanin = 1n;
  for (const barisIni of baris) {
    if (barisIni.anggota.every(id => haml.has(id))) continue;
    const bobot = Object.values(barisIni.perOrang).map(selOrang => selOrang.saham);
    const faktor = bobot.reduce((a, b) => fpb(a, b), 0n);
    if (faktor === 0n) continue;
    const ruus = bobot.reduce((a, b) => a + b, 0n) / faktor;
    juzTanpaJanin = kpk(juzTanpaJanin, ruus / fpb(barisIni.sel[kolomDasar]!, ruus));
  }
  const pembagi = totalKolom.tashih / totalKolom[kolomDasar]! / juzTanpaJanin;
  if (Object.values(saham).some(nilai => nilai % pembagi !== 0n)) throw new Error('invariant taqdir: saham tidak habis dibagi saat melepas tashih janin');
  return Object.fromEntries(Object.entries(saham).map(([id, nilai]) => [id, nilai / pembagi]));
}

/** Node belum pasti diganti status pastinya; janin kembar = node klon `id~2` dengan orang tua yang sama. */
function grafPasti(graf: GrafKeluarga, taqdir: Taqdir): GrafKeluarga {
  const orang: Record<IdOrang, Orang> = { ...graf.orang };
  for (const [id, nilai] of Object.entries(taqdir)) {
    const { khuntsa: _abaikan, ...asal } = graf.orang[id]!;
    const sebagai = (jenisKelamin: 'L' | 'P', idBaru = id): Orang => ({ ...asal, id: idBaru, jenisKelamin, statusHidup: 'hidup' });
    if (nilai === 'mati') orang[id] = { ...asal, statusHidup: 'wafat' };
    else if (nilai === 'hidup') orang[id] = { ...asal, statusHidup: 'hidup' };
    else if (nilai === 'lk' || nilai === 'pr') orang[id] = sebagai(nilai === 'lk' ? 'L' : 'P');
    else {
      const [pertama, kedua] = nilai === 'duaLk' ? ['L', 'L'] as const : nilai === 'duaPr' ? ['P', 'P'] as const : ['L', 'P'] as const;
      orang[id] = sebagai(pertama);
      orang[id + AKHIRAN_KEMBAR] = sebagai(kedua, id + AKHIRAN_KEMBAR);
    }
  }
  return { ...graf, orang };
}

function gabungKembar(saham: Saham): Saham {
  const hasil: Saham = {};
  for (const [id, nilai] of Object.entries(saham)) {
    const idAsal = id.endsWith(AKHIRAN_KEMBAR) ? id.slice(0, -AKHIRAN_KEMBAR.length) : id;
    hasil[idAsal] = (hasil[idAsal] ?? 0n) + nilai;
  }
  return hasil;
}

/** Orang (bukan janin) yang satu baris tabel dengan janin: ashabah → kelas D [R13-15]; fardh → belum diatur. */
function mitraHaml(daftarHasil: HasilOk[], haml: Set<IdOrang>): Pick<HasilDunia, 'mitraAshabahHaml' | 'mitraFardhHaml'> {
  const mitraAshabahHaml = new Set<IdOrang>();
  const mitraFardhHaml = new Set<IdOrang>();
  for (const baris of daftarHasil.flatMap(hasil => hasil.tabel.baris)) {
    if (!baris.anggota.some(id => haml.has(id))) continue;
    for (const id of baris.anggota.filter(idAnggota => !haml.has(idAnggota))) (baris.ashabah ? mitraAshabahHaml : mitraFardhHaml).add(id);
  }
  return { mitraAshabahHaml, mitraFardhHaml };
}

// ─── Pemberian ────────────────────────────────────────────────────────────────

/** [R13-4] tiap orang diberi yang terkecil di semua dunia; haml/mafqud ditahan; kelas D [R13-15] → 0. */
function beriAqall(daftarDunia: DuniaTaqdir[], ditahan: Set<IdOrang>, kelasD: Set<IdOrang>, refs: string[], jejak: LangkahJejak[]): Record<IdOrang, bigint> {
  const semuaPenerima = [...new Set(daftarDunia.flatMap(dunia => Object.keys(dunia.saham)))];
  const diberikan: Record<IdOrang, bigint> = {};
  for (const id of semuaPenerima) {
    const alasan = ditahan.has(id) ? 'ditahan' : kelasD.has(id) ? 'kelasD' : 'aqall';
    const aqall = daftarDunia.reduce((terkecil, dunia) => (dunia.saham[id] ?? 0n) < terkecil ? (dunia.saham[id] ?? 0n) : terkecil, daftarDunia[0]!.saham[id] ?? 0n);
    diberikan[id] = alasan === 'aqall' ? aqall : 0n;
    jejak.push({ tahap: 'taqdir', refs: alasan === 'kelasD' ? ['R13-15'] : refs, jenis: 'TAQDIR_PEMBERIAN', idOrang: id, alasan, saham: diberikan[id]! });
  }
  return diberikan;
}

function periksaInvarianTaqdir(diberikan: Record<IdOrang, bigint>, mauquf: bigint, daftarDunia: DuniaTaqdir[]): void {
  if (mauquf < 0n) throw new Error(`invariant taqdir: mauquf ${mauquf} < 0`);
  for (const dunia of daftarDunia) {
    for (const [id, nilai] of Object.entries(diberikan)) {
      if (nilai > (dunia.saham[id] ?? 0n)) throw new Error(`invariant taqdir: ${id} diberi ${nilai} > haknya di satu taqdir`);
    }
  }
}

/** Semua kombinasi taqdir sumber (hasil kali kartesius, 13.0b butir 1). Tanpa sumber → satu kombinasi kosong. */
function kartesius(sumber: Sumber[]): Taqdir[] {
  return sumber.reduce<Taqdir[]>(
    (kombinasi, sumberIni) => kombinasi.flatMap(taqdir => sumberIni.taqdir.map(nilai => ({ ...taqdir, [sumberIni.id]: nilai }))),
    [{}],
  );
}
