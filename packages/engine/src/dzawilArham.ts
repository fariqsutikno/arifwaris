// Orkestrator dzawil arham (bab 14) di atas pipeline, pola sama dengan munasakhat.ts.
//   Masuk : InputEngine — tanda tangan sama dengan hitung(), supaya orkestrator taqdir bab 13 (dan munasakhat)
//           cukup menerima fungsi hitung sebagai argumen.
//   Putus : ambil alih hanya bila pipeline berhenti di fase dzawil arham, atau hanya pasangan yang mewarisi dan
//           sisanya untuk dzawil arham. Lalu: saring mawani' → tanzil & jihah → mas'alah perantara → turun ke penerima
//           (rekursif: perantara sebagai pewaris) → gabung dengan mas'alah zaujiyyah bila ada pasangan.
//   Keluar: HasilEngine OK dengan saham per orang asli; jejak DZAWIL_ARHAM_* + refs R14-x.

import { gabungkan, idSisaKeluar, periksaInvarian, sahamDari, totalSaham, type Saham } from './gabung.js';
import { hitungDenganTercakup } from './pipeline.js';
import { periksaKeberlakuan } from './rulesets/gerbang.js';
import { ATURAN } from './rulesets/madzhab.js';
import { turunkanPeran } from './stages/derivasi.js';
import { maniDari, terapkanMawani } from './stages/mawani.js';
import { bagikanNominal } from './stages/pembagian.js';
import { RADD_TERCAKUP_TANZIL, bagiAntarPerantara, hitungPosisi, penerimaSatuKelompok, samakanDalamSatuKelompok } from './stages/perantara.js';
import { cariRuteTanzil, saringJihah, type RuteTanzil } from './stages/tanzil.js';
import { hitungTirkah } from './stages/tirkah.js';
import type {
  HasilEngine, IdOrang, InputEngine, KunciAhliWaris, LangkahJejak, PeranAhliWaris, Pertanyaan, Ruleset, StatusOrang, TabelMasalah,
} from './types.js';
import type { Uang } from '@waris/math';

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;
type BukanOk = Exclude<HasilEngine, { status: 'OK' }>;

interface HasilArham {
  saham: Saham;
  masalah: bigint;
  statusArham: Record<IdOrang, StatusOrang>;
  jejak: LangkahJejak[];
}

// [R14-8] cabang perantara yang aslinya sama rata (anak ibu) dibagi sama rata.
const PERANTARA_SAMA_RATA_SYF = new Set<KunciAhliWaris>(['SAUDARA_SEIBU', 'SAUDARI_SEIBU']);
// [K14-3] khal/khalah = saudara/saudari ibu (perantara ibu memandang mereka sebagai saudaranya).
const SAUDARA_KANDUNG_SEBAPAK = new Set<PeranAhliWaris['kunci']>(['SAUDARA_KANDUNG', 'SAUDARI_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARI_SEBAPAK']);
const SAUDARA_IBU = new Set<PeranAhliWaris['kunci']>([...SAUDARA_KANDUNG_SEBAPAK, 'SAUDARA_SEIBU', 'SAUDARI_SEIBU']);

export function hitungDzawilArham(input: InputEngine): HasilEngine {
  return hitungDzawilArhamDenganTercakup(input, new Set());
}

/** `tercakup` diteruskan ke gerbang 18.4: kosong di tingkat teratas, RADD_TERCAKUP_TANZIL pada rekursi turun [R14-9]. */
function hitungDzawilArhamDenganTercakup(input: InputEngine, tercakup: ReadonlySet<string>): HasilEngine {
  const hasilPipeline = hitungDenganTercakup(input, tercakup);
  const denganPasangan = hasilPipeline.status === 'OK' && hasilPipeline.sisaKeluar?.tujuan === 'dzawilArham' ? hasilPipeline : undefined;
  const tanpaAhliWaris = hasilPipeline.status === 'TIDAK_DIDUKUNG' && hasilPipeline.kode === 'FASE_DZAWIL_ARHAM';
  if (!denganPasangan && !tanpaAhliWaris) return hasilPipeline;

  const ditolak = gerbangMadzhab(input);
  if (ditolak) return ditolak;

  const arham = bagiDzawilArham(input);
  if ('status' in arham) return arham;

  const hasil = denganPasangan ? gabungDenganPasangan(input, denganPasangan, arham) : tanpaPasangan(input, arham);
  return periksaKeberlakuan(input.ruleset, hasil, tercakup) ?? hasil;
}

// ─── Gerbang madzhab (K14-1, K14-2) ───────────────────────────────────────────

function gerbangMadzhab(input: InputEngine): BukanOk | undefined {
  // [R14-5] [SYF] / [K14-1] [MLK]: selama baitul mal tegak, dzawil arham tidak mewarisi.
  if (input.konfigurasi.kebijakanSisa === 'baitulMal') {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Dzawil arham tidak mewarisi selama baitul mal tegak; harta ke baitul mal.',
      refs: [input.ruleset === 'syafii' ? 'R14-5' : 'K14-1'] };
  }
  // [K14-2] [HNF] metode qarabah belum diimplementasikan; [MLK] metodenya belum ada di matriks.
  if (input.ruleset === 'hanafi' || input.ruleset === 'maliki') {
    return { status: 'TIDAK_DIDUKUNG', alasan: 'Metode pembagian dzawil arham untuk madzhab ini belum didukung.', refs: ['K14-2'] };
  }
  return undefined;
}

// ─── Inti tanzil ──────────────────────────────────────────────────────────────

function bagiDzawilArham(input: InputEngine): HasilArham | BukanOk {
  const { graf } = input;
  const { daftarPeran } = turunkanPeran(graf, input.konfigurasi, ATURAN[input.ruleset]);
  const calon = Object.values(daftarPeran)
    .filter(peran => peran.kunci === 'DZAWIL_ARHAM' && graf.orang[peran.idOrang]!.statusHidup === 'hidup' && !graf.orang[peran.idOrang]!.penghubung);

  const saring = saringMawani(input, calon);
  if ('status' in saring) return saring;

  const semuaRute: RuteTanzil[] = [];
  for (const peran of saring.boleh) {
    const rute = cariRuteTanzil(graf, daftarPeran, peran.idOrang);
    // [R14-11] kekerabatan ganda lewat leluhur pewaris belum diatur KB → hentikan, jangan buang jalurnya.
    if ('status' in rute) return rute;
    semuaRute.push(...rute);
  }
  const { lolos, jejak: jejakTanzil } = saringJihah(semuaRute);

  const perantara = bagiAntarPerantara(input, lolos);
  if ('status' in perantara) return perantara;

  let saham = perantara.saham;
  let masalah = perantara.masalah;
  const jejakTurun: LangkahJejak[] = [];
  for (const idPerantara of Object.keys(perantara.saham).sort()) {
    const turun = turunkanKePenerima(input, idPerantara, lolos.filter(rute => rute.perantara === idPerantara));
    if ('status' in turun) return turun;
    const gabung = gabungkan(saham, masalah, idPerantara, turun.saham, turun.masalah);
    saham = gabung.saham;
    masalah = gabung.jamiah;
    jejakTurun.push(...turun.jejak);
  }
  periksaInvarian(saham, masalah, 'dzawil arham');

  return {
    saham, masalah,
    statusArham: statusDzawilArham(daftarPeran, saring.statusMani, semuaRute, lolos, saham, perantara.mahjub),
    jejak: [...saring.jejak, ...jejakTanzil, perantara.jejak, ...jejakTurun, ...jejakDuaJalur(lolos)],
  };
}

/** Mawani' (bab 02) berlaku bagi dzawil arham sendiri, sebelum tanzil, supaya yang terhalang tidak menempati kursi perantara. */
function saringMawani(input: InputEngine, calon: PeranAhliWaris[]):
  { boleh: PeranAhliWaris[]; statusMani: Record<IdOrang, StatusOrang>; jejak: LangkahJejak[] } | BukanOk {
  const pertanyaan: Pertanyaan[] = calon
    .filter(peran => input.graf.orang[peran.idOrang]!.agama === 'tidakDiketahui')
    .map(peran => ({ idOrang: peran.idOrang, isian: 'agama', alasan: 'Agama belum diisi; beda agama menghalangi waris (bab 2.4).' }));
  if (pertanyaan.length > 0) return { status: 'PERLU_INPUT', pertanyaan };

  const boleh: PeranAhliWaris[] = [];
  const statusMani: Record<IdOrang, StatusOrang> = {};
  const jejak: LangkahJejak[] = [];
  for (const peran of calon) {
    const mani = maniDari(input.graf.orang[peran.idOrang]!);
    if (!mani) { boleh.push(peran); continue; }
    statusMani[peran.idOrang] = { jenis: 'mamnu', peran, mani: mani.mani, rujukanAturan: mani.rujukanAturan };
    jejak.push({ tahap: 'mawani', refs: [mani.rujukanAturan], jenis: 'MANI', idOrang: peran.idOrang, mani: mani.mani });
  }
  return { boleh, statusMani, jejak };
}

/**
 * [R14-5 langkah 4] Bagian perantara diberikan kepada penerimanya seolah perantara wafat meninggalkan mereka:
 * hitungDzawilArham rekursif dengan perantara sebagai pewaris (cabang yang dzawil arham bagi perantara ikut tertangani).
 */
function turunkanKePenerima(input: InputEngine, idPerantara: IdOrang, rute: RuteTanzil[]):
  { saham: Saham; masalah: bigint; jejak: LangkahJejak[] } | BukanOk {
  const penerima = [...new Set(rute.map(ruteIni => ruteIni.idOrang))].sort();
  const kunciPerantara = rute[0]!.kunciPerantara;
  const hasil = hitungPosisi(input, idPerantara, penerima, masukan => hitungDzawilArhamDenganTercakup(masukan, RADD_TERCAKUP_TANZIL));
  if (hasil.status !== 'OK') return hasil;

  let saham = sahamDari(idPerantara, hasil);
  let masalah = totalSaham(saham);
  const mahjub = penerima.filter(id => !saham[id]);
  const rasio = rasioTurun(input.ruleset, kunciPerantara, hasil);
  // [K14-3] [HNB] khal/khalah di luar satu kelompok saudara kandung/sebapak ibu: rinciannya belum ada di KB.
  if (rasio === 'belumDidukung') return { status: 'TIDAK_DIDUKUNG', alasan: 'Pembagian khal/khalah dzawil arham ini belum didukung.', refs: ['K14-3'] };
  const samaRata = rasio === 'samaRata';
  const jejak: LangkahJejak[] = [];
  if (samaRata) {
    const rata = samakanDalamSatuKelompok(hasil);
    // [K14-3] rincian sama rata lintas kelompok belum ada di KB.
    if (!rata) return { status: 'TIDAK_DIDUKUNG', alasan: 'Pembagian sama rata dzawil arham lintas kelompok belum didukung.', refs: ['K14-3'] };
    saham = rata.saham;
    masalah = rata.masalah;
    if (input.ruleset === 'hanbali') {
      jejak.push({ tahap: 'dzawilArham', refs: ['K14-3'], jenis: 'KHILAF_MADZHAB', kode: 'K14-3', ruleset: 'hanbali', idOrang: Object.keys(saham) });
    }
  }
  jejak.unshift({ tahap: 'dzawilArham', refs: [input.ruleset === 'hanbali' ? 'K14-3' : 'R14-8'], jenis: 'DZAWIL_ARHAM_TURUN',
    perantara: idPerantara, rasio: samaRata ? 'samaRata' : 'ikutMasalah', saham, masalah, mahjub });
  return { saham, masalah, jejak };
}

/**
 * [R14-8] [SYF] 2:1 (ikut mas'alah) kecuali cabang perantara seibu (sama rata).
 * [K14-3] [HNB] sama rata, kecuali khal 2/3 & khalah 1/3 di bawah ibu (Mughni 6/324). KB tidak merinci jenis saudara,
 * jadi 2:1 hanya bila penerima bersaham satu kelompok saudara/saudari kandung atau sebapak ibu; selain itu belum didukung.
 */
function rasioTurun(ruleset: Ruleset, kunciPerantara: KunciAhliWaris, hasil: HasilOk): 'ikutMasalah' | 'samaRata' | 'belumDidukung' {
  if (ruleset !== 'hanbali') return PERANTARA_SAMA_RATA_SYF.has(kunciPerantara) ? 'samaRata' : 'ikutMasalah';
  const kunciPenerima = Object.values(hasil.statusOrang)
    .flatMap(status => (status.jenis === 'ahliWaris' && SAUDARA_IBU.has(status.peran.kunci) ? [status.peran.kunci] : []));
  if (kunciPerantara !== 'IBU' || kunciPenerima.length === 0) return 'samaRata';
  const satuKelompok = penerimaSatuKelompok(hasil) !== undefined;
  return satuKelompok && kunciPenerima.every(kunci => SAUDARA_KANDUNG_SEBAPAK.has(kunci)) ? 'ikutMasalah' : 'belumDidukung';
}

/** [R14-11] satu orang lewat dua jalur yang lolos: bagiannya dari tiap jalur dijumlahkan (gabungkan sudah menjumlah). */
function jejakDuaJalur(lolos: RuteTanzil[]): LangkahJejak[] {
  const perOrang = new Map<IdOrang, Set<IdOrang>>();
  for (const rute of lolos) perOrang.set(rute.idOrang, (perOrang.get(rute.idOrang) ?? new Set()).add(rute.perantara));
  return [...perOrang].filter(([, perantara]) => perantara.size > 1)
    .map(([idOrang, perantara]) => ({ tahap: 'dzawilArham', refs: ['R14-11'], jenis: 'DZAWIL_ARHAM_DUA_JALUR', idOrang, perantara: [...perantara].sort() }));
}

function statusDzawilArham(
  daftarPeran: Record<IdOrang, PeranAhliWaris>, statusMani: Record<IdOrang, StatusOrang>,
  semuaRute: RuteTanzil[], lolos: RuteTanzil[], saham: Saham, mahjubPerantara: Record<IdOrang, IdOrang[]>,
): Record<IdOrang, StatusOrang> {
  const status: Record<IdOrang, StatusOrang> = { ...statusMani };
  for (const idOrang of new Set(semuaRute.map(rute => rute.idOrang))) {
    const peran = daftarPeran[idOrang]!;
    if (saham[idOrang]) { status[idOrang] = { jenis: 'ahliWaris', peran }; continue; }
    const ruteLolos = lolos.filter(rute => rute.idOrang === idOrang);
    status[idOrang] = ruteLolos.length === 0
      // [R14-7] kalah cepat dalam jihah yang sama.
      ? { jenis: 'mahjub', peran, oleh: [...new Set(lolos.filter(rute => semuaRute.some(r => r.idOrang === idOrang && r.jihah === rute.jihah)).map(rute => rute.idOrang))], rujukanAturan: 'R14-7' }
      // [R14-10] perantaranya terhijab (atau ia terhijab di bawah perantaranya).
      : { jenis: 'mahjub', peran, oleh: ruteLolos.flatMap(rute => mahjubPerantara[rute.perantara] ?? []), rujukanAturan: 'R14-10' };
  }
  return status;
}

// ─── Menyusun hasil ───────────────────────────────────────────────────────────

function tanpaPasangan(input: InputEngine, arham: HasilArham): HasilOk {
  const tirkah = hitungTirkah(input.tirkah);
  const { daftarPeran } = turunkanPeran(input.graf, input.konfigurasi, ATURAN[input.ruleset]);
  const statusOrang = { ...terapkanMawani(input.graf, daftarPeran, input.ruleset).statusOrang, ...arham.statusArham };
  const nominal = bagikanNominal(arham.saham, arham.masalah, tirkah.bersih, input.pembulatan.satuan);
  return {
    status: 'OK', statusOrang,
    tabel: susunTabel(arham.saham, arham.masalah, nominal.nominal, statusOrang, []),
    jejak: [tirkah.jejak, ...arham.jejak, ...nominal.jejak],
    pembulatan: { satuan: input.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan },
    ruleset: input.ruleset, konfigurasi: input.konfigurasi, versiKb: input.versiKb,
  };
}

/** [R14-12] mas'alah zaujiyyah = mas'alah pertama; sisa pasangan = saham "mayit kedua" (munasakhat keadaan 3). */
function gabungDenganPasangan(input: InputEngine, pasangan: HasilOk, arham: HasilArham): HasilOk {
  const idSisa = idSisaKeluar(input.graf.idPewaris);
  const sahamZaujiyyah = sahamDari(input.graf.idPewaris, pasangan);
  const gabung = gabungkan(sahamZaujiyyah, totalSaham(sahamZaujiyyah), idSisa, arham.saham, arham.masalah);
  periksaInvarian(gabung.saham, gabung.jamiah, 'dzawil arham + pasangan');

  const bersih = pasangan.jejak.find(langkah => langkah.jenis === 'TIRKAH')!.bersih;
  const nominal = bagikanNominal(gabung.saham, gabung.jamiah, bersih, input.pembulatan.satuan);
  const statusOrang = { ...pasangan.statusOrang, ...arham.statusArham };
  const barisPasangan = pasangan.tabel.baris.filter(baris => Object.values(baris.perOrang).some(sel => sel.saham > 0n));
  return {
    status: 'OK', statusOrang,
    tabel: susunTabel(gabung.saham, gabung.jamiah, nominal.nominal, statusOrang, barisPasangan),
    jejak: [
      ...pasangan.jejak.filter(langkah => langkah.jenis !== 'DISTRIBUSI'),
      ...arham.jejak,
      { tahap: 'dzawilArham', refs: ['R14-12', 'R12-2'], jenis: 'DZAWIL_ARHAM_GABUNG_PASANGAN',
        saham: gabung.sahamMayit, masalah: gabung.masalah, hubungan: gabung.hubungan, jamiah: gabung.jamiah },
      ...nominal.jejak,
    ],
    pembulatan: { satuan: input.pembulatan.satuan, sisaPembulatan: nominal.sisaPembulatan },
    ruleset: input.ruleset, konfigurasi: input.konfigurasi, versiKb: input.versiKb,
  };
}

/** Satu baris per penerima; pasangan tetap satu baris kelompoknya dengan fardh-nya. */
function susunTabel(saham: Saham, jamiah: bigint, nominal: Record<IdOrang, Uang>, statusOrang: Record<IdOrang, StatusOrang>,
  barisPasangan: TabelMasalah['baris']): TabelMasalah {
  const anggotaPasangan = new Set(barisPasangan.flatMap(baris => baris.anggota));
  const sel = (id: IdOrang) => ({ saham: saham[id] ?? 0n, nominal: nominal[id] ?? 0n });
  const baris: TabelMasalah['baris'] = [
    ...barisPasangan.map(barisAsal => ({
      kelompok: barisAsal.kelompok, anggota: barisAsal.anggota, ...(barisAsal.fardh ? { fardh: barisAsal.fardh } : {}),
      sel: { tashih: barisAsal.anggota.reduce((jumlah, id) => jumlah + (saham[id] ?? 0n), 0n) },
      perOrang: Object.fromEntries(barisAsal.anggota.map(id => [id, sel(id)])),
    })),
    ...Object.keys(saham).filter(id => !anggotaPasangan.has(id)).sort()
      .map(id => ({ kelompok: id, anggota: [id], sel: { tashih: saham[id]! }, perOrang: { [id]: sel(id) } })),
  ];
  const dikecualikan = Object.entries(statusOrang)
    .filter(([id, status]) => (status.jenis === 'mahjub' || status.jenis === 'mamnu') && !saham[id]).map(([id]) => id).sort();
  return { kolom: barisPasangan.length ? ['fardh', 'tashih', 'perOrang', 'nominal'] : ['tashih', 'perOrang', 'nominal'],
    totalKolom: { tashih: jamiah }, baris, dikecualikan };
}
