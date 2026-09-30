// Penjelasan kasus khusus bab 13, disusun seperti munasakhat (bagian → bab → baris):
//   jelaskanTaqdir : siapa yang belum pasti & aturannya → tiap kemungkinan (mas'alah, juz'us sahm) → yang diberikan
//                    sekarang, yang ditahan (mauquf), dan rupiahnya.
//   jelaskanGharqa : keadaan wafat bersamaan & hukumnya → pembagian harta tiap anggota (atau tiap skenario urutan).
// Semua kalimat = templat diksi `narasi.taqdir.*` / `narasi.gharqa.*`; jejak engine sudah memuat keputusan fikihnya.

import type { GrafKeluarga, HartaGharqa, HasilGharqa, HasilTaqdir, IdOrang, KeadaanGharqa, NilaiTaqdir, Ruleset, StatusOrang } from '@waris/engine';
import { rupiah } from './format.js';
import type { BagianMunasakhat } from './munasakhat.js';
import { labelPeran, urutanKe } from './people.js';
import { buatBaris, gabungDan, kalimat, susun, tekankan, teksKamus, type BarisPenjelasan, type Kamus, type Penyusun, type Potongan, type Sisipan } from './segments.js';
import { istilahNarasi } from './terms.js';

type TaqdirOk = Extract<HasilTaqdir, { status: 'OK' }>;
type GharqaSelesai = Extract<HasilGharqa, { status: 'OK' | 'MAUQUF' }>;
type Sebut = (id: IdOrang) => Potongan;
type DaftarStatus = Array<{ mayit: IdOrang; statusOrang: Record<IdOrang, StatusOrang> }>;

export interface PenjelasanKasusKhusus { daftarBagian: BagianMunasakhat[] }

const AWALAN_SISA = 'sisaKeluar:';
const JENIS_SUMBER = { dalamKandungan: 'haml', mafqud: 'mafqud' } as const;

const taqdir = (penyusun: Penyusun, kunci: string, sisipan: Record<string, Sisipan> = {}): Potongan[] => susun(penyusun, `narasi.taqdir.${kunci}`, sisipan);
const gharqa = (penyusun: Penyusun, kunci: string, sisipan: Record<string, Sisipan> = {}): Potongan[] => susun(penyusun, `narasi.gharqa.${kunci}`, sisipan);

// ─── Taqdir ───────────────────────────────────────────────────────────────────

export function jelaskanTaqdir(hasil: TaqdirOk, graf: GrafKeluarga, opsi: { kamus: Kamus }): PenjelasanKasusKhusus {
  const penyusun: Penyusun = { kamus: opsi.kamus, bahasa: 'id' };
  const sebut = buatSebut(graf, hasil.daftarDunia.map(dunia => ({ mayit: graf.idPewaris, statusOrang: dunia.statusOrang })), penyusun, id => sebutanSumber(hasil, graf, id, penyusun));
  return { daftarBagian: [
    pembukaanTaqdir(hasil, graf, sebut, penyusun),
    ...(adaKemungkinanLuar(hasil) ? [kemungkinan(hasil, graf, sebut, penyusun)] : []),
    pembagianSekarang(hasil, sebut, penyusun),
  ] };
}

/** Semua sumber dilebur (setengah/terburuk) → satu dunia tanpa taqdir luar: tidak ada tabel kemungkinan. */
const adaKemungkinanLuar = (hasil: TaqdirOk): boolean => hasil.daftarDunia.some(dunia => Object.keys(dunia.taqdir).length > 0);

function pembukaanTaqdir(hasil: TaqdirOk, graf: GrafKeluarga, sebut: Sebut, penyusun: Penyusun): BagianMunasakhat {
  const sumber = daftarSumber(graf);
  const daftarBaris: BarisPenjelasan[] = [
    buatBaris(adaKemungkinanLuar(hasil)
      ? taqdir(penyusun, 'pembukaan.belum_pasti', { siapa: gabungDan(penyusun, sumber.map(id => [sebut(id)])), jumlah: hasil.daftarDunia.length, jamiah: istilahNarasi(penyusun, 'jamiah') })
      : taqdir(penyusun, 'pembukaan.belum_pasti_dilebur', { siapa: gabungDan(penyusun, sumber.map(id => [sebut(id)])) }), ['R13-16'], sumber),
  ];
  for (const id of sumber) {
    const jenis = graf.orang[id]!.khuntsa ? 'khuntsa' : JENIS_SUMBER[graf.orang[id]!.statusHidup as keyof typeof JENIS_SUMBER];
    daftarBaris.push(buatBaris(taqdir(penyusun, `pembukaan.${jenis}`, { siapa: sebut(id), istilah: istilahNarasi(penyusun, jenis === 'khuntsa' ? 'khuntsa-musykil' : jenis) }), [], [id]));
  }
  for (const langkah of hasil.jejak) {
    if (langkah.jenis !== 'TAQDIR_LEBUR') continue;
    daftarBaris.push(buatBaris(langkah.aturan === 'setengah'
      ? taqdir(penyusun, 'pembukaan.setengah', { siapa: gabungDan(penyusun, langkah.sumber.map(id => [sebut(id)])), madzhab: namaMadzhab(penyusun, hasil.ruleset) })
      : taqdir(penyusun, 'pembukaan.terburuk', { siapa: sebut(langkah.sumber[0]!), kemungkinan: teksTaqdir(penyusun, graf, langkah.terpilih ?? {}, sebut) }), langkah.refs, langkah.sumber));
    break;   // aturan lebur sama di semua dunia luar; cukup diceritakan sekali
  }
  if (hasil.daftarDunia.length > 1) daftarBaris.push(buatBaris(taqdir(penyusun, 'pembukaan.aqall', { mauquf: istilahNarasi(penyusun, 'mauquf') }), refsPemberian(hasil)));
  return { judul: teksKamus(penyusun, 'narasi.taqdir.judul.belum_pasti'), daftarBab: [{ judul: teksKamus(penyusun, 'narasi.taqdir.judul.apa_yang_terjadi'), daftarBaris }] };
}

function kemungkinan(hasil: TaqdirOk, graf: GrafKeluarga, sebut: Sebut, penyusun: Penyusun): BagianMunasakhat {
  const langkahDunia = hasil.jejak.filter(langkah => langkah.jenis === 'TAQDIR_DUNIA');
  const daftarBab = hasil.daftarDunia.map((dunia, indeks) => {
    const juzSahm = hasil.jamiah / dunia.masalah;
    const daftarBaris: BarisPenjelasan[] = [
      buatBaris(taqdir(penyusun, 'dunia.jika', { kemungkinan: teksTaqdir(penyusun, graf, dunia.taqdir, sebut) }), [], Object.keys(dunia.taqdir)),
      buatBaris(taqdir(penyusun, 'dunia.masalah', {
        masalah: dunia.masalah, jamiah: hasil.jamiah, juz_sahm: istilahNarasi(penyusun, 'juz-as-sahm'), nilai: juzSahm,
      }), langkahDunia[indeks]?.refs ?? []),
      ...Object.entries(dunia.saham).map(([id, saham]) => buatBaris(kalimat`${sebutPenerima(penyusun, id, sebut)}: ${saham}/${hasil.jamiah}.`, [], [id])),
    ];
    return { judul: teksKamus(penyusun, 'narasi.taqdir.judul.kemungkinan', { nomor: String(indeks + 1) }), daftarBaris };
  });
  return { judul: teksKamus(penyusun, 'narasi.taqdir.judul.semua_kemungkinan'), daftarBab };
}

function pembagianSekarang(hasil: TaqdirOk, sebut: Sebut, penyusun: Penyusun): BagianMunasakhat {
  const tampilkanNominal = hasil.jejak.some(langkah => langkah.jenis === 'TIRKAH' && langkah.kotor > 0n);
  const teksNominal = (uang: bigint | undefined): string => (tampilkanNominal && uang !== undefined ? ` = ${rupiah(uang)}` : '');
  const daftarBaris: BarisPenjelasan[] = [];
  for (const langkah of hasil.jejak) {
    if (langkah.jenis !== 'TAQDIR_PEMBERIAN') continue;
    const siapa = sebutPenerima(penyusun, langkah.idOrang, sebut);
    const kunci = langkah.alasan === 'kelasD' ? 'kelas_d' : langkah.alasan !== 'aqall' ? langkah.alasan
      : langkah.saham === 0n ? (adaKemungkinanLuar(hasil) ? 'gugur' : 'tidak_mendapat') : adaKemungkinanLuar(hasil) ? 'aqall' : 'bagian';
    daftarBaris.push(buatBaris(taqdir(penyusun, `pemberian.${kunci}`, { siapa })
      .concat(langkah.saham > 0n ? kalimat` ${langkah.saham}/${hasil.jamiah}${teksNominal(hasil.nominal[langkah.idOrang])}.` : []), langkah.refs, [langkah.idOrang]));
  }
  daftarBaris.push(tekankan(buatBaris(hasil.mauquf > 0n
    ? taqdir(penyusun, 'pemberian.mauquf', { mauquf: istilahNarasi(penyusun, 'mauquf') }).concat(kalimat` ${hasil.mauquf}/${hasil.jamiah}${teksNominal(hasil.nominalMauquf)}.`)
    : taqdir(penyusun, 'pemberian.tanpa_mauquf'), refsPemberian(hasil)), 'perhatian'));
  if (tampilkanNominal && hasil.pembulatan.sisaPembulatan > 0n) {
    daftarBaris.push(buatBaris(susun(penyusun, 'narasi.umum.selisih_pembulatan', { selisih: rupiah(hasil.pembulatan.sisaPembulatan), satuan: rupiah(hasil.pembulatan.satuan) })));
  }
  return { judul: teksKamus(penyusun, 'narasi.taqdir.judul.dibagi_sekarang'), daftarBab: [{ judul: teksKamus(penyusun, 'narasi.taqdir.judul.bagian_sekarang'), daftarBaris }] };
}

/** "janin lahir dua laki-laki dan orang hilang masih hidup" untuk satu kombinasi taqdir. */
function teksTaqdir(penyusun: Penyusun, graf: GrafKeluarga, taqdirIni: Record<IdOrang, NilaiTaqdir>, sebut: Sebut): Potongan[] {
  return gabungDan(penyusun, Object.entries(taqdirIni).map(([id, nilai]) => {
    const jenis = graf.orang[id]!.khuntsa ? 'khuntsa' : JENIS_SUMBER[graf.orang[id]!.statusHidup as keyof typeof JENIS_SUMBER];
    return taqdir(penyusun, `nilai.${jenis}.${nilai.replace(/[A-Z]/g, huruf => `_${huruf.toLowerCase()}`)}`, { siapa: sebut(id) });
  }));
}

function daftarSumber(graf: GrafKeluarga): IdOrang[] {
  return Object.values(graf.orang).filter(orangIni => orangIni.khuntsa || orangIni.statusHidup === 'dalamKandungan' || orangIni.statusHidup === 'mafqud').map(orangIni => orangIni.id);
}

/** Janin disebut lewat ibunya; khuntsa lewat dua kemungkinan perannya. */
function sebutanSumber(hasil: TaqdirOk, graf: GrafKeluarga, id: IdOrang, penyusun: Penyusun): string | undefined {
  const orangIni = graf.orang[id]!;
  if (orangIni.nama) return undefined;
  if (orangIni.statusHidup === 'dalamKandungan') {
    return teksKamus(penyusun, 'narasi.taqdir.sebut.janin', { ibu: labelDari(graf, hasil.daftarDunia.map(dunia => ({ mayit: graf.idPewaris, statusOrang: dunia.statusOrang })), orangIni.idIbu!, penyusun) });
  }
  if (!orangIni.khuntsa) return undefined;
  // Peran di dunia mana pun (lk atau pr), lalu padanan jenis kelamin lainnya; tanpa padanan (mis. paman) → kerabat.
  const peran = hasil.daftarDunia.map(dunia => dunia.statusOrang[id]).find(status => status && 'peran' in status && status.peran.kunci in PADANAN_KELAMIN);
  if (!peran || !('peran' in peran)) return teksKamus(penyusun, 'narasi.taqdir.sebut.khuntsa', { lk: teksKamus(penyusun, 'narasi.umum.kerabat'), pr: teksKamus(penyusun, 'narasi.umum.kerabat') });
  const padanan = { ...peran.peran, kunci: PADANAN_KELAMIN[peran.peran.kunci as keyof typeof PADANAN_KELAMIN] };
  const [lk, pr] = /_PR$|^SAUDARI_/.test(peran.peran.kunci) ? [padanan, peran.peran] : [peran.peran, padanan];
  return teksKamus(penyusun, 'narasi.taqdir.sebut.khuntsa', { lk: labelPeran(penyusun, lk), pr: labelPeran(penyusun, pr) });
}

// [R13-9] khuntsa hanya di jihah bunuwwah/ukhuwwah/'umumah/wala'; yang punya padanan perempuan ahli waris hanya ini.
const PADANAN_KELAMIN = {
  ANAK_LK: 'ANAK_PR', ANAK_PR: 'ANAK_LK', CUCU_LK: 'CUCU_PR', CUCU_PR: 'CUCU_LK',
  SAUDARA_KANDUNG: 'SAUDARI_KANDUNG', SAUDARI_KANDUNG: 'SAUDARA_KANDUNG', SAUDARA_SEBAPAK: 'SAUDARI_SEBAPAK',
  SAUDARI_SEBAPAK: 'SAUDARA_SEBAPAK', SAUDARA_SEIBU: 'SAUDARI_SEIBU', SAUDARI_SEIBU: 'SAUDARA_SEIBU',
} as const;

function refsPemberian(hasil: TaqdirOk): string[] {
  return hasil.jejak.flatMap(langkah => (langkah.jenis === 'MAUQUF' ? langkah.refs : []));
}

const namaMadzhab = (penyusun: Penyusun, ruleset: Ruleset): string => teksKamus(penyusun, `narasi.taqdir.madzhab.${ruleset}`);

// ─── Gharqa ───────────────────────────────────────────────────────────────────

export function jelaskanGharqa(hasil: GharqaSelesai, graf: GrafKeluarga, keadaan: KeadaanGharqa, opsi: { kamus: Kamus }): PenjelasanKasusKhusus {
  const penyusun: Penyusun = { kamus: opsi.kamus, bahasa: 'id' };
  const semuaHarta = hasil.status === 'OK' ? hasil.harta : hasil.skenario.flatMap(skenario => skenario.harta);
  const sebut = buatSebut(graf, semuaHarta.flatMap(harta => harta.daftarStatus), penyusun);
  const anggota = (hasil.status === 'OK' ? hasil.harta : hasil.skenario[0]!.harta).map(harta => harta.mayit);
  const metode = hasil.status === 'OK' ? hasil.metode : 'mauquf';

  const pembukaan: BagianMunasakhat = {
    judul: teksKamus(penyusun, 'narasi.gharqa.judul.wafat_bersamaan'),
    daftarBab: [{ judul: teksKamus(penyusun, 'narasi.gharqa.judul.apa_yang_terjadi'), daftarBaris: [
      buatBaris(gharqa(penyusun, `keadaan.${keadaan.replace(/[A-Z]/g, huruf => `_${huruf.toLowerCase()}`)}`, { siapa: gabungDan(penyusun, anggota.map(id => [sebut(id)])) }), ['R13-10'], anggota),
      buatBaris(gharqa(penyusun, `metode.${metode}`, metode === 'tilad' ? { tilad: istilahNarasi(penyusun, 'tilad') }
        : metode === 'mauquf' ? { mauquf: istilahNarasi(penyusun, 'mauquf') } : {}), metode === 'tilad' ? ['R13-19'] : ['R13-10']),
    ] }],
  };
  const babHarta = (harta: HartaGharqa) => ({
    judul: teksKamus(penyusun, 'narasi.gharqa.judul.harta', { mayit: teksSebut(sebut(harta.mayit)) }),
    daftarBaris: [
      ...harta.jejak.flatMap(langkah => (langkah.jenis === 'MUNASAKHAT' && langkah.refs.includes('R13-19')
        ? [buatBaris(gharqa(penyusun, 'tharif', { siapa: sebut(langkah.mayit), saham: langkah.saham, masalah: langkah.masalah, jamiah: langkah.jamiah }), langkah.refs, [langkah.mayit])] : [])),
      ...Object.entries(harta.saham).map(([id, saham]) => {
        const nominal = harta.nominal[id] ? ` = ${rupiah(harta.nominal[id]!)}` : '';
        return buatBaris(kalimat`${sebutPenerima(penyusun, id, sebut)}: ${saham}/${harta.jamiah}${nominal}.`, [], [id]);
      }),
    ],
  });
  const daftarBagian = hasil.status === 'OK'
    ? [pembukaan, { judul: teksKamus(penyusun, 'narasi.gharqa.judul.pembagian'), daftarBab: hasil.harta.map(babHarta) }]
    : [pembukaan, ...hasil.skenario.map(skenario => ({
      judul: teksKamus(penyusun, 'narasi.gharqa.judul.skenario', { urutan: skenario.urutan.map(id => teksSebut(sebut(id))).join(' → ') }),
      daftarBab: skenario.harta.map(babHarta),
    }))];
  return { daftarBagian };
}

// ─── Sebutan orang ────────────────────────────────────────────────────────────

/**
 * Nama bila ada; pewaris; peran di mas'alah pertama yang memuatnya ("istri dari anak laki-laki" bila bukan mayit
 * utama); selain itu "kerabat". Sebutan kembar diberi urutan seperti munasakhat.
 */
function buatSebut(graf: GrafKeluarga, daftarStatus: DaftarStatus, penyusun: Penyusun, khusus: (id: IdOrang) => string | undefined = () => undefined): Sebut {
  const label = (id: IdOrang) => khusus(id) ?? labelDari(graf, daftarStatus, id, penyusun);
  const sePeran = new Map<string, IdOrang[]>();
  for (const id of Object.keys(graf.orang)) sePeran.set(label(id), [...(sePeran.get(label(id)) ?? []), id]);
  return id => {
    const teks = label(id);
    const samaDengan = sePeran.get(teks) ?? [id];
    return { jenis: 'orang', daftarIdOrang: [id], teks: samaDengan.length > 1 && !graf.orang[id]?.nama ? `${teks} ${urutanKe(penyusun, samaDengan.indexOf(id))}` : teks };
  };
}

function labelDari(graf: GrafKeluarga, daftarStatus: DaftarStatus, id: IdOrang, penyusun: Penyusun): string {
  const orangIni = graf.orang[id];
  if (orangIni?.nama) return orangIni.nama;
  const labelPewaris = () => teksKamus(penyusun, orangIni?.jenisKelamin === 'P' ? 'narasi.umum.pewaris.p' : 'narasi.umum.pewaris.l');
  const mayitUtama = daftarStatus[0]?.mayit ?? graf.idPewaris;
  if (id === mayitUtama) return labelPewaris();
  for (const { mayit, statusOrang } of daftarStatus) {
    const status = statusOrang[id];
    if (mayit === id || !status || !('peran' in status) || status.peran.kunci === 'BUKAN_AHLI_WARIS') continue;
    const peran = labelPeran(penyusun, status.peran);
    return mayit === mayitUtama ? peran : teksKamus(penyusun, 'narasi.munasakhat.label_dari', { label: peran, mayit: labelDari(graf, daftarStatus, mayit, penyusun) });
  }
  // Anggota gharqa yang tidak mewarisi siapa pun tetap "almarhum", diberi urutan oleh buatSebut.
  return daftarStatus.some(({ mayit }) => mayit === id) ? labelPewaris() : teksKamus(penyusun, 'narasi.umum.kerabat');
}

function sebutPenerima(penyusun: Penyusun, id: string, sebut: Sebut): Potongan[] {
  return id.startsWith(AWALAN_SISA) ? susun(penyusun, 'narasi.munasakhat.sisa_harta', { mayit: sebut(id.slice(AWALAN_SISA.length)) }) : [sebut(id)];
}

const teksSebut = (potongan: Potongan): string => potongan.teks;
