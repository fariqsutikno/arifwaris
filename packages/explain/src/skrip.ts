// Skrip belajar untuk kasus biasa (riset-narasi-pengajar bagian 5): tiap tahap = pertanyaan → dasar → di keluarga ini →
// logika → hitungan → jembatan, dengan dua teks per langkah (narasi dibacakan, papan ringkas).
// Menerima konteks (hasil engine + jejak); menyerahkan `Bab` berisi baris berjenis ke `linimasa.ts`.
// Tahap yang kasusnya belum dipetakan mengembalikan LAMA, lalu linimasa memakai bab cerita seperti sebelumnya.
// Tidak ada aturan fikih baru: tiap kalimat memakai angka dan sebab dari jejak, dan rujukan [Rxx-y] dari jejak itu.

import type { IdOrang } from '@waris/engine';
import { PERAN_BERPENDAHULU, ceritaArba, persamaanKotakAshl, type Bab } from './cerita.js';
import { sebutKelompok, sebutSemua, type Konteks, type Langkah } from './context.js';
import { rupiah, tulisPecahan } from './format.js';
import { barisSkrip, buatBaris, gabungDan, susun, teksKamus, tekankan, type BarisPenjelasan, type JenisLangkah, type Potongan, type Sisipan } from './segments.js';
import { istilahNarasi, type IdIstilah } from './terms.js';

/** Kasus tahap ini belum dipetakan ke skrip; pakai bab cerita. */
export const LAMA = Symbol('lama');
export type HasilSkrip = Bab | undefined | typeof LAMA;

type Sisipanku = Record<string, Sisipan>;

const kunciKamus = (kunci: string) => `narasi.langkah.${kunci}`;
const judulSkrip = (konteks: Konteks, kunci: string): string => teksKamus(konteks.penyusun, kunciKamus(kunci));
const istilahUmum = (konteks: Konteks, id: IdIstilah): Potongan => istilahNarasi(konteks.penyusun, id);
const teks = (isi: string): Potongan => ({ jenis: 'teks', teks: isi });
const gabungPlus = (angka: Array<string | bigint>): Potongan[] => [teks(angka.join(' + '))];

function langkah(
  konteks: Konteks, jenis: JenisLangkah, kunci: string | [string, string], narasi: Sisipanku, papan: Sisipanku, refs: string[] = [], subjek?: IdOrang[],
): BarisPenjelasan {
  return barisSkrip(konteks.penyusun, jenis, kunci, narasi, papan, refs, subjek);
}

// ─── Peta: pembuka seluruh penjelasan ─────────────────────────────────────────

export function langkahPeta(konteks: Konteks): BarisPenjelasan {
  return langkah(konteks, 'peta', konteks.tampilkanNominal ? 'peta.tiga' : 'peta.dua', {}, {});
}

// ─── Harta ────────────────────────────────────────────────────────────────────

export function babHartaSkrip(konteks: Konteks): HasilSkrip {
  const [tirkah] = konteks.daftarLangkah('TIRKAH');
  if (!tirkah || tirkah.kotor === 0n) return undefined;
  if (tirkah.tajhiz > 0n || tirkah.hutang > 0n || tirkah.wasiatDiminta > 0n) return LAMA;
  const kotor = rupiah(tirkah.kotor);
  const baris = langkah(konteks, 'keluarga', 'harta.tanpa_potongan', { pewaris: konteks.sebutan.pewaris(), kotor }, { kotor }, ['R11-1']);
  return { judul: judulSkrip(konteks, 'harta.judul'), daftarBaris: [baris], kolom: 'nominal' };
}

// ─── Siapa yang mewarisi ──────────────────────────────────────────────────────

export function babAhliWarisSkrip(konteks: Konteks): HasilSkrip {
  if (konteks.daftarLangkah('MANI').length || konteks.daftarLangkah('KHILAF_MADZHAB').length) return LAMA;
  const { statusOrang } = konteks.hasil;
  const idKerabat = Object.keys(statusOrang).filter(id => statusOrang[id]!.jenis === 'ahliWaris' || statusOrang[id]!.jenis === 'mahjub');
  const idAhliWaris = idKerabat.filter(id => statusOrang[id]!.jenis === 'ahliWaris');
  if (idKerabat.length === 0 || idAhliWaris.length === 0) return LAMA;

  const pewaris = konteks.sebutan.pewaris();
  const bentuk = idKerabat.length > 1 ? 'jamak' : 'mufrad';
  const kerabat = sebutSemua(konteks, idKerabat);
  const daftarBaris = [langkah(konteks, 'tanya', `ahli_waris.tanya.${bentuk}`, { pewaris, kerabat }, bentuk === 'jamak' ? { jumlah: idKerabat.length } : {})];

  const kelompokHajb = new Map<string, { mahjub: IdOrang[]; hajib: IdOrang[]; refs: string[] }>();
  for (const hajb of konteks.daftarLangkah('HAJB_HIRMAN')) {
    const kunci = `${konteks.sebutan.peranDari(hajb.mahjub)?.kunci}|${hajb.hajib.join(',')}`;
    const entri = kelompokHajb.get(kunci) ?? { mahjub: [], hajib: hajb.hajib, refs: hajb.refs };
    entri.mahjub.push(hajb.mahjub);
    kelompokHajb.set(kunci, entri);
  }
  if (kelompokHajb.size === 0) {
    daftarBaris.push(langkah(konteks, 'keluarga', [`ahli_waris.tidak_terhalang.${bentuk}.narasi`, 'ahli_waris.tidak_terhalang.papan'], {}, {}));
    return { judul: judulSkrip(konteks, 'ahli_waris.judul'), daftarBaris, kolom: 'ahliWaris' };
  }

  const [pertama] = [...kelompokHajb.values()];
  daftarBaris.push(langkah(konteks, 'dasar', 'ahli_waris.dasar_hajb', { hajb_hirman: istilahUmum(konteks, 'hajb-hirman') }, {}, pertama!.refs));
  for (const { mahjub, hajib, refs } of kelompokHajb.values()) {
    const sebutMahjub = sebutSemua(konteks, mahjub);
    const sebutHajib = sebutSemua(konteks, hajib);
    daftarBaris.push(langkah(konteks, 'keluarga', 'ahli_waris.terhalang', { mahjub: sebutMahjub, hajib: sebutHajib }, { hajib: sebutHajib, mahjub: sebutMahjub }, refs, mahjub));
  }
  const daftar = sebutSemua(konteks, idAhliWaris);
  daftarBaris.push(langkah(konteks, 'hitung', 'ahli_waris.tinggal', { jumlah: idAhliWaris.length, daftar }, { daftar }));
  return { judul: judulSkrip(konteks, 'ahli_waris.judul'), daftarBaris, kolom: 'ahliWaris' };
}

// ─── Bagian awal ──────────────────────────────────────────────────────────────

const ALASAN_FARDH_DIPETAKAN = new Set(['ADA_FARU_WARITS', 'TANPA_FARU_WARITS', 'KALALAH', 'TANPA_MUASHSHIB']);
const PERAN_PASANGAN = new Set(['SUAMI', 'ISTRI']);

export function babBagianSkrip(konteks: Konteks): HasilSkrip {
  const kelompokFardh = new Set(konteks.daftarLangkah('FARDH').map(satu => satu.kelompok));
  const adaAshabah = konteks.hasil.jejak.some(satu => satu.jenis === 'ASHABAH' && !kelompokFardh.has(satu.kelompok));
  const dipetakan = konteks.hasil.jejak.every(satu => {
    if (satu.jenis === 'FARDH') return ALASAN_FARDH_DIPETAKAN.has(satu.alasan.kode);
    if (satu.jenis === 'KASUS_KHUSUS') return false;
    if (satu.jenis !== 'ASHABAH' || kelompokFardh.has(satu.kelompok)) return true;
    if (satu.pilihanJadd || satu.jenisAshabah === 'maalGhair') return false;
    const kunciPeran = konteks.sebutan.peranDari(konteks.anggotaDari(satu.kelompok)[0]!)?.kunci ?? '';
    return satu.jenisAshabah === 'bilGhair' || !PERAN_BERPENDAHULU.has(kunciPeran);
  });
  if (!dipetakan) return LAMA;

  const daftarBaris: BarisPenjelasan[] = [];
  const pewaris = konteks.sebutan.pewaris();
  if (adaAshabah && kelompokFardh.size > 0) daftarBaris.push(langkah(konteks, 'dasar', 'bagian.dasar_fardh', {}, {}));
  for (const satu of konteks.hasil.jejak) {
    if (satu.jenis === 'FARDH') daftarBaris.push(...barisFardh(konteks, satu, pewaris));
    else if (satu.jenis === 'ASHABAH' && !kelompokFardh.has(satu.kelompok)) daftarBaris.push(barisAshabah(konteks, satu));
  }
  daftarBaris.push(jembatanBagian(konteks, adaAshabah));
  return { judul: judulSkrip(konteks, 'bagian.judul'), daftarBaris, kolom: 'bagian' };
}

function barisFardh(konteks: Konteks, satu: Langkah<'FARDH'>, pewaris: Potongan): BarisPenjelasan[] {
  const anggota = konteks.anggotaDari(satu.kelompok);
  const subjek = sebutKelompok(konteks, satu.kelompok);
  const pecahan = satu.fardh;
  const mendapat = susun(konteks.penyusun, kunciKamus(`bagian.mendapat.${anggota.length > 1 ? 'jamak' : 'mufrad'}`), { pecahan });
  const papanBiasa = { subjek, pecahan };
  const baris = (kunci: string | [string, string], narasi: Sisipanku, papan: Sisipanku, jenis: JenisLangkah = 'keluarga') =>
    langkah(konteks, jenis, kunci, narasi, papan, satu.refs, jenis === 'keluarga' ? anggota : undefined);
  const { alasan } = satu;
  switch (alasan.kode) {
    case 'ADA_FARU_WARITS': {
      const nuqshan = konteks.daftarLangkah('HAJB_NUQSHAN').find(langkahIni => anggota.includes(langkahIni.terdampak));
      const oleh = sebutSemua(konteks, alasan.oleh);
      if (!nuqshan) return [baris(['bagian.ada_faru_tanpa_dari.narasi', 'bagian.fardh.papan'], { pewaris, oleh, subjek, mendapat }, papanBiasa)];
      const dari = nuqshan.dari;
      const dasar = PERAN_PASANGAN.has(konteks.sebutan.peranDari(anggota[0]!)?.kunci ?? '')
        ? [baris('bagian.dasar_faru', { subjek, dari, pewaris, pecahan }, { subjek, dari, pecahan }, 'dasar')] : [];
      return [...dasar, baris('bagian.ada_faru', { pewaris, oleh, subjek, mendapat, dari }, { subjek, dari, pecahan, hajb_nuqshan: istilahUmum(konteks, 'hajb-nuqshan') })];
    }
    case 'TANPA_FARU_WARITS':
      return [baris(['bagian.tanpa_faru.narasi', 'bagian.fardh.papan'], { pewaris, subjek, mendapat }, papanBiasa)];
    case 'KALALAH':
      return [baris('bagian.kalalah', { pewaris, subjek, mendapat }, { ...papanBiasa, kalalah: istilahUmum(konteks, 'kalalah') })];
    case 'TANPA_MUASHSHIB':
      return [baris([`bagian.tanpa_muashshib.${alasan.banyaknya > 1 ? 'jamak' : 'mufrad'}.narasi`, 'bagian.tanpa_muashshib.papan'],
        { subjek, mendapat }, { ...papanBiasa, muashshib: istilahUmum(konteks, 'muashshib') })];
    default:
      throw new Error(`alasan fardh ${alasan.kode} belum dipetakan ke skrip`);
  }
}

function barisAshabah(konteks: Konteks, satu: Langkah<'ASHABAH'>): BarisPenjelasan {
  const subjek = sebutKelompok(konteks, satu.kelompok);
  const anggota = konteks.anggotaDari(satu.kelompok);
  const ashabah = istilahUmum(konteks, 'ashabah');
  return satu.jenisAshabah === 'bilGhair'
    ? langkah(konteks, 'keluarga', 'bagian.ashabah_bil_ghair', { subjek, ashabah }, { subjek, bil_ghair: istilahUmum(konteks, 'bil-ghair') }, satu.refs, anggota)
    : langkah(konteks, 'keluarga', 'bagian.ashabah_bin_nafsi', { subjek, ashabah }, { subjek }, satu.refs, anggota);
}

function jembatanBagian(konteks: Konteks, adaAshabah: boolean): BarisPenjelasan {
  const berpecahan = konteks.hasil.tabel.baris.filter(barisTabel => barisTabel.fardh);
  const bedaPenyebut = konteks.daftarLangkah('PERBANDINGAN_NISAB').some(satu => satu.tujuan === 'ashl');
  if (bedaPenyebut) {
    const pecahan = gabungDan(konteks.penyusun, berpecahan.map(barisTabel => [teks(tulisPecahan(barisTabel.fardh!))]));
    return langkah(konteks, 'jembatan', 'bagian.jembatan.beda_penyebut', { pecahan }, { jumlahan: gabungPlus(berpecahan.map(barisTabel => tulisPecahan(barisTabel.fardh!))) });
  }
  return langkah(konteks, 'jembatan', adaAshabah ? 'bagian.jembatan.ada_sisa' : 'bagian.jembatan.umum', {}, {});
}

// ─── Memotong harta (asal masalah) ────────────────────────────────────────────

export function babPenyebutSkrip(konteks: Konteks): HasilSkrip {
  const { baris, totalKolom } = konteks.hasil.tabel;
  if (baris.every(barisTabel => barisTabel.fardh === undefined) || persamaanKotakAshl(konteks).length === 0) return LAMA;
  const ashl = totalKolom.ashl!;
  const perbandingan = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(satu => satu.tujuan === 'ashl');
  const daftarBaris = [perbandingan.length === 0
    ? langkah(konteks, 'logika', 'ashl.potong_sama', { ashl }, { ashl })
    : langkah(konteks, 'logika', 'ashl.potong_beda', {}, {})];
  perbandingan.forEach((satu, urutan) => {
    const awalan = susun(konteks.penyusun, `narasi.cerita.penyebut.${urutan === 0 ? 'awalan_pertama' : 'awalan_lanjut'}`, { a: satu.a, b: satu.b });
    const kalimatNisab = ceritaArba(konteks, satu, awalan);
    daftarBaris.push({ ...buatBaris(kalimatNisab, satu.refs), jenis: 'logika', papan: kalimatNisab });
  });
  // Baris "8 ÷ 8 = 1 kotak untuk istri" per kelompok disisipkan `linimasa.ts` di sini, sebelum kalimat penutup.
  daftarBaris.push(langkah(konteks, 'hitung', 'ashl.jadi', { ashl }, { ashl, ashlul_masalah: istilahUmum(konteks, 'ashlul-masalah') }, ['R09-1']));
  return { judul: judulSkrip(konteks, 'ashl.judul'), daftarBaris, kolom: 'ashl' };
}

// ─── Memeriksa jumlah bagian ('adilah) ────────────────────────────────────────

export function babPenyesuaianSkrip(konteks: Konteks): HasilSkrip {
  const [kelas] = konteks.daftarLangkah('KELAS_MASALAH');
  if (!kelas || kelas.kelas !== 'adilah' || konteks.daftarLangkah('SISA_KELUAR').length) return LAMA;
  const { baris } = konteks.hasil.tabel;
  const rincian = baris.length > 1 ? `${baris.map(barisTabel => barisTabel.sel['ashl']).join(' + ')} = ` : '';
  const daftarBaris = [
    langkah(konteks, 'tanya', 'cek.tanya', {}, { ashl: kelas.ashl }),
    langkah(konteks, 'hitung', 'cek.pas', { rincian, jumlah: kelas.jumlahSaham }, { rincian, jumlah: kelas.jumlahSaham, adilah: istilahUmum(konteks, 'adilah') }, kelas.refs),
  ];
  return { judul: judulSkrip(konteks, 'cek.judul'), daftarBaris, kolom: 'penyesuaian' };
}

// ─── Supaya bagian jadi bulat (tashih) ────────────────────────────────────────

export function babPembulatanSkrip(konteks: Konteks): HasilSkrip {
  const inkisar = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(satu => satu.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  if (konteks.daftarLangkah('KELAS_MASALAH')[0]?.kelas !== 'adilah') return LAMA;
  const [tashih] = konteks.daftarLangkah('TASHIH');
  const penutup = langkah(konteks, 'jembatan', `tashih.jembatan.${konteks.tampilkanNominal ? 'rupiah' : 'ringkas'}`, {}, {});
  const judul = judulSkrip(konteks, 'tashih.judul');
  if (!tashih) {
    if (inkisar.some(satu => satu.hubungan !== 'habis')) return LAMA;
    return { judul, kolom: 'tashih', daftarBaris: [...barisBagiRata(konteks, inkisar), penutup] };
  }
  const [satu] = inkisar;
  if (inkisar.length !== 1 || satu!.hubungan === 'habis' || konteks.daftarLangkah('PERBANDINGAN_NISAB').some(lain => lain.tujuan === 'juzSahm')) return LAMA;
  return { judul, kolom: 'tashih', daftarBaris: [...barisTashih(konteks, satu!, tashih), penutup] };
}

type Inkisar = Langkah<'PERBANDINGAN_NISAB'>;

const satuanPembagi = (konteks: Konteks, ruus: bigint, jumlahAnggota: number): string =>
  teksKamus(konteks.penyusun, kunciKamus(ruus > BigInt(jumlahAnggota) ? 'tashih.satuan.jatah' : 'tashih.satuan.orang'));

function barisBagiRata(konteks: Konteks, inkisar: Inkisar[]): BarisPenjelasan[] {
  const daftarBaris = [langkah(konteks, 'tanya', 'tashih.rata.tanya', {}, {})];
  for (const satu of inkisar) {
    const { a: saham, b: ruus } = satu;
    const satuan = satuanPembagi(konteks, ruus, konteks.anggotaDari(satu.kelompok!).length);
    daftarBaris.push(langkah(konteks, 'hitung', 'tashih.rata.pas', { siapa: sebutKelompok(konteks, satu.kelompok!), saham, ruus, satuan },
      { saham, ruus, hasil_bagi: saham / ruus }, satu.refs));
  }
  daftarBaris.push(langkah(konteks, 'hitung', 'tashih.rata.semua', {}, {}, ['R10-2']));
  return daftarBaris;
}

function barisTashih(konteks: Konteks, satu: Inkisar, tashih: Langkah<'TASHIH'>): BarisPenjelasan[] {
  const { a: saham, b: ruus } = satu;
  const anggota = konteks.anggotaDari(satu.kelompok!);
  const kelompok = sebutKelompok(konteks, satu.kelompok!);
  const satuan = satuanPembagi(konteks, ruus, anggota.length);
  const pengali = tashih.juzSahm;
  const potongKelompok = saham * pengali;
  const perSatuan = potongKelompok / ruus;
  const daftarBaris: BarisPenjelasan[] = [];
  if (ruus > BigInt(anggota.length)) daftarBaris.push(langkah(konteks, 'keluarga', 'tashih.jatah', { siapa: kelompok, ruus }, { ruus, ruus_istilah: istilahUmum(konteks, 'ruus') }, ['R10-2']));
  daftarBaris.push(
    langkah(konteks, 'keluarga', 'tashih.tidak_habis', { saham, ruus, satuan, hasil_bagi: saham / ruus, sisa: saham % ruus },
      { saham, ruus, hasil_bagi: saham / ruus, sisa: saham % ruus, hubungan: istilahUmum(konteks, satu.hubungan === 'tawafuq' ? 'tawafuq' : 'tabayun') }, satu.refs),
    langkah(konteks, 'logika', 'tashih.potong', { pengali, dasar: tashih.dasar, hasil: tashih.hasil },
      { pengali, dasar: tashih.dasar, hasil: tashih.hasil, tashih: istilahUmum(konteks, 'tashih') }, tashih.refs),
    langkah(konteks, 'logika', 'tashih.habis_dibagi', { saham, potong_kelompok: potongKelompok, ruus },
      { saham, pengali, potong_kelompok: potongKelompok, ruus, per: perSatuan }, tashih.refs),
  );
  const contoh = konteks.hasil.tabel.baris.find(barisTabel => barisTabel.kelompok !== satu.kelompok && barisTabel.fardh && !barisTabel.ashabah);
  if (contoh) {
    const kotak = contoh.sel['ashl']!;
    const sisipan = { siapa: sebutKelompok(konteks, contoh.kelompok), kotak, potong: kotak * pengali, pecahan: contoh.fardh!, hasil: tashih.hasil };
    daftarBaris.push(langkah(konteks, 'logika', 'tashih.nilai_tetap', sisipan, sisipan, tashih.refs));
  }
  const barisKelompok = konteks.hasil.tabel.baris.find(barisTabel => barisTabel.kelompok === satu.kelompok)!;
  const rincian = gabungDan(konteks.penyusun, anggota.map(id =>
    susun(konteks.penyusun, kunciKamus('tashih.rincian_orang'), { siapa: konteks.sebutan.sebut([id]), saham: barisKelompok.perOrang[id]!.saham })));
  const bagianAkhir = konteks.hasil.tabel.baris.flatMap(barisTabel => Object.values(barisTabel.perOrang).map(orang => orang.saham)).filter(angka => angka > 0n);
  daftarBaris.push(
    langkah(konteks, 'hitung', 'tashih.dibagi', { kelompok, saham, pengali, total: potongKelompok, ruus, satuan, per: perSatuan, rincian },
      { total: potongKelompok, ruus, per: perSatuan, satuan }, tashih.refs),
    langkah(konteks, 'hitung', 'tashih.cek', { daftar: gabungDan(konteks.penyusun, bagianAkhir.map(angka => [teks(String(angka))])), hasil: tashih.hasil },
      { jumlahan: gabungPlus(bagianAkhir), hasil: tashih.hasil }, tashih.refs),
  );
  return daftarBaris;
}

// ─── Hasil akhir dan ringkasan ────────────────────────────────────────────────

export function babHasilSkrip(konteks: Konteks): HasilSkrip {
  if (konteks.hasil.sisaKeluar) return LAMA;
  const { tabel, pembulatan } = konteks.hasil;
  const penyebut = konteks.penyebutAkhir;
  const [tirkah] = konteks.daftarLangkah('TIRKAH');
  const daftarBaris: BarisPenjelasan[] = [];
  const bersih = tirkah ? rupiah(tirkah.bersih) : '';
  if (konteks.tampilkanNominal && tirkah && pembulatan.satuan === 1n && tirkah.bersih % penyebut === 0n) {
    const sisipan = { bersih, penyebut, nilai: rupiah(tirkah.bersih / penyebut) };
    daftarBaris.push(langkah(konteks, 'hitung', 'hasil.satu_potong', sisipan, sisipan, ['R11-1']));
  }
  const ringkasan: Potongan[][] = [];
  for (const barisTabel of tabel.baris) {
    for (const [id, { saham, nominal }] of Object.entries(barisTabel.perOrang)) {
      const siapa = konteks.sebutan.sebut([id]);
      ringkasan.push(susun(konteks.penyusun, kunciKamus('hasil.ringkas_orang'), { siapa, saham, penyebut }));
      if (saham === 0n) {
        const nol = susun(konteks.penyusun, 'narasi.cerita.hasil.orang_nol', { siapa });
        daftarBaris.push({ ...buatBaris(nol, ['R11-1'], [id]), jenis: 'hitung', papan: nol });
      } else if (konteks.tampilkanNominal) {
        const uang = rupiah(nominal);
        daftarBaris.push(langkah(konteks, 'hitung', 'hasil.orang_rupiah', { siapa, saham, nominal: uang }, { siapa, saham, penyebut, nominal: uang }, ['R11-1'], [id]));
      } else {
        const sisipan = { siapa, saham, penyebut };
        daftarBaris.push(langkah(konteks, 'hitung', 'hasil.orang_saham', sisipan, sisipan, ['R11-1'], [id]));
      }
    }
  }
  if (konteks.tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    const perSatuan = pembulatan.satuan > 1n;
    const sisipan = { satuan: rupiah(pembulatan.satuan), selisih: rupiah(pembulatan.sisaPembulatan) };
    const selisih = perSatuan
      ? [...susun(konteks.penyusun, 'narasi.cerita.hasil.selisih.per_satuan', sisipan), teks(' '), ...susun(konteks.penyusun, 'narasi.cerita.hasil.saran_transfer')]
      : susun(konteks.penyusun, 'narasi.cerita.hasil.selisih.per_rupiah', { selisih: sisipan.selisih });
    daftarBaris.push(tekankan({ ...buatBaris(selisih), jenis: 'hitung', papan: selisih }, 'perhatian'));
  } else if (konteks.tampilkanNominal && tirkah) {
    daftarBaris.push(langkah(konteks, 'hitung', 'hasil.cek_pas', { bersih }, { bersih }));
  }
  const rincian = gabungDan(konteks.penyusun, ringkasan);
  daftarBaris.push(langkah(konteks, 'ringkas', 'hasil.ringkas', { rincian }, { rincian }));
  return { judul: judulSkrip(konteks, konteks.tampilkanNominal ? 'hasil.judul_rupiah' : 'hasil.judul_saham'), daftarBaris, kolom: 'nominal' };
}
