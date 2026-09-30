// Penjelasan berbahasa Arab untuk santri (keputusan 2026-09-26, docs/design/dwibahasa.md).
// Menerima konteks yang sama dengan mode ringkas → bab-bab bergaya kitab: angka Arab (٠١٢), tanpa harakat,
// nama fardh (النصف، السدس) alih-alih "1/2". Urutan bab & `kolom` sama dengan cerita supaya sorotan UI tetap jalan.
// Kalimat = diksi `narasi.arab.*` (ar = redaksi kitab, id = terjemahan draf); konteks.penyusun berbahasa 'ar'.
// Semua redaksi Arab di sini draf: perlu dicek tim keilmuan (bukan hukum baru; hukumnya tetap dari jejak engine).

import type { AlasanFardh, GrafKeluarga, IdOrang, KodeKhilafOverlay, KunciAhliWaris, PilihanJadd, Ruleset, TujuanSisa } from '@waris/engine';
import type { Pecahan } from '@waris/math';
import type { Bab } from './cerita.js';
import type { Konteks, Langkah } from './context.js';
import { kalimat, susun, teksKamus, type BarisPenjelasan, type Penyusun, type Potongan, type Sisipan } from './segments.js';
import { istilah, type IdIstilah } from './terms.js';

export const PERLU_CEK_ARAB = true;

const KUNCI_BERLABEL_ARAB = new Set<string>([
  'ANAK_LK', 'CUCU_LK', 'AYAH', 'KAKEK', 'SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', 'SAUDARA_SEIBU', 'KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK',
  'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK', 'SUAMI', 'MUTIQ', 'ANAK_PR', 'CUCU_PR', 'IBU', 'NENEK_DARI_IBU',
  'NENEK_DARI_AYAH', 'SAUDARI_KANDUNG', 'SAUDARI_SEBAPAK', 'SAUDARI_SEIBU', 'ISTRI', 'MUTIQAH',
] satisfies KunciAhliWaris[]);

/** Padanan Arab kunci ahli waris (diksi `narasi.arab.ahli_waris.*`, dari transliterasi tabel KB bab 3.1–3.2 [R03-1]). */
export const labelArab = (penyusun: Penyusun, kunci: KunciAhliWaris): string =>
  teksKamus(penyusun, `narasi.arab.ahli_waris.${kunci.toLowerCase()}`);

export function babArab(konteks: Konteks, graf: GrafKeluarga): Bab[] {
  const sebut = buatSebutArab(konteks, graf);
  return [babTirkah, babWaratsah, babFurudh, babAshl, babKelas, babTashih, babHasil]
    .map(buatBab => buatBab(konteks, sebut))
    .filter((bab): bab is Bab => bab !== undefined);
}

// ─── Bantuan ──────────────────────────────────────────────────────────────────

export type SebutArab = (ids: IdOrang[]) => Potongan;

const ANGKA_ARAB = '٠١٢٣٤٥٦٧٨٩';
export const angkaArab = (teks: string): string => teks.replace(/\d/g, digit => ANGKA_ARAB[Number(digit)]!);

const arab = (penyusun: Penyusun, kunci: string, sisipan: Record<string, Sisipan> = {}): Potongan[] =>
  susun(penyusun, `narasi.arab.${kunci}`, sisipan);
const teksArab = (penyusun: Penyusun, kunci: string, sisipan: Record<string, string> = {}): string =>
  teksKamus(penyusun, `narasi.arab.${kunci}`, sisipan);
const istilahArab = (penyusun: Penyusun, id: IdIstilah, kunci: string): Potongan => istilah(id, teksArab(penyusun, `istilah.${kunci}`));

const FARDH_BERNAMA = new Set(['1/2', '1/4', '1/8', '2/3', '1/3', '1/6']);
/** Nama fardh (النصف، السدس); pecahan lain tetap angka. */
const fardh = (penyusun: Penyusun, pecahan: Pecahan): string => {
  const teks = `${pecahan.n}/${pecahan.d}`;
  return FARDH_BERNAMA.has(teks) ? teksArab(penyusun, `fardh.${pecahan.n}_${pecahan.d}`) : teks;
};

const uang = (penyusun: Penyusun, besaran: bigint): string =>
  teksArab(penyusun, 'uang', { jumlah: besaran.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬') });

/** Baris Arab: angka Latin di teks diganti angka Arab; sebutan orang & istilah tetap berjenis. */
function baris(daftarPotongan: Potongan[], refs: string[] = [], subjek?: IdOrang[]): BarisPenjelasan {
  const potonganArab = daftarPotongan.map(potongan => ({ ...potongan, teks: angkaArab(potongan.teks) }));
  return { daftarPotongan: potonganArab, refs, ...(subjek ? { subjek } : {}) };
}

/** "و" sebagai penghubung, seperti kebiasaan kitab: «الأب والأم والبنت». */
export const gabungWa = (penyusun: Penyusun, daftar: Potongan[][]): Potongan[] => {
  const wa = teksArab(penyusun, 'penghubung.wa');
  return daftar.flatMap((unsur, i) => (i === 0 ? unsur : [{ jenis: 'teks' as const, teks: wa }, ...unsur]));
};

export function buatSebutArab(konteks: Konteks, graf: GrafKeluarga): SebutArab {
  const { penyusun } = konteks;
  const wa = teksArab(penyusun, 'penghubung.wa');
  const labelDari = (id: IdOrang) => {
    const kunci = konteks.sebutan.peranDari(id)?.kunci;
    // ponytail: paman/anak paman ayah-kakek (R03-2) tidak diberi keterangan leluhur; tambah bila tim keilmuan memberi redaksinya.
    return kunci && KUNCI_BERLABEL_ARAB.has(kunci) ? labelArab(penyusun, kunci as KunciAhliWaris) : teksArab(penyusun, 'qarib');
  };
  const warits = Object.entries(konteks.hasil.statusOrang).filter(([, status]) => status.jenis === 'ahliWaris').map(([id]) => id);
  const nomorDalamPeran = (id: IdOrang) => {
    const sePeran = warits.filter(lain => labelDari(lain) === labelDari(id));
    return sePeran.length > 1 ? ` ${sePeran.indexOf(id) + 1}` : '';
  };
  return ids => {
    const perLabel = new Map<string, IdOrang[]>();
    for (const id of ids) perLabel.set(labelDari(id), [...(perLabel.get(labelDari(id)) ?? []), id]);
    const teks = [...perLabel].map(([label, anggota]) => {
      const bernama = anggota.map(id => graf.orang[id]?.nama).filter((nama): nama is string => !!nama);
      if (bernama.length === anggota.length) return `${bernama.join(wa)} (${label})`;
      return anggota.length === 1 ? `${label}${nomorDalamPeran(anggota[0]!)}` : `${label} ×${anggota.length}`;
    }).join(wa);
    return { jenis: 'orang', daftarIdOrang: ids, teks };
  };
}

const KUNCI_PEREMPUAN = new Set(['ANAK_PR', 'CUCU_PR', 'IBU', 'NENEK_DARI_IBU', 'NENEK_DARI_AYAH', 'SAUDARI_KANDUNG', 'SAUDARI_SEBAPAK', 'SAUDARI_SEIBU', 'ISTRI', 'MUTIQAH']);

const semuaAnggota = (konteks: Konteks, idKelompok: string) => konteks.anggotaDari(idKelompok);

// ─── Bab ──────────────────────────────────────────────────────────────────────

function babTirkah(konteks: Konteks): Bab | undefined {
  const { penyusun } = konteks;
  const [tirkah] = konteks.daftarLangkah('TIRKAH');
  if (!tirkah || tirkah.kotor === 0n) return undefined;
  const daftarBaris: BarisPenjelasan[] = [];
  if (tirkah.tajhiz > 0n || tirkah.hutang > 0n) {
    daftarBaris.push(baris(arab(penyusun, 'tirkah.potongan', {
      tirkah: istilahArab(penyusun, 'tirkah', 'tirkah'), kotor: uang(penyusun, tirkah.kotor), tajhiz: uang(penyusun, tirkah.tajhiz),
      hutang: uang(penyusun, tirkah.hutang), tersisa: uang(penyusun, tirkah.bersih + tirkah.wasiatDipakai),
    }), tirkah.refs));
  }
  if (tirkah.wasiatDiminta > 0n) {
    const sisipan = { diminta: uang(penyusun, tirkah.wasiatDiminta), batas: uang(penyusun, tirkah.wasiatBatas), dipakai: uang(penyusun, tirkah.wasiatDipakai) };
    daftarBaris.push(baris(tirkah.wasiatButuhIjazah > 0n
      ? arab(penyusun, 'tirkah.wasiat.lebih', { ...sisipan, kelebihan: uang(penyusun, tirkah.wasiatButuhIjazah) })
      : arab(penyusun, 'tirkah.wasiat.cukup', sisipan), ['R01-4']));
  }
  daftarBaris.push(baris(arab(penyusun, 'tirkah.dibagi', { bersih: uang(penyusun, tirkah.bersih) }), ['R11-1']));
  return { judul: teksArab(penyusun, 'judul.tirkah'), daftarBaris, kolom: 'nominal' };
}

function babWaratsah(konteks: Konteks, sebut: SebutArab): Bab {
  const { penyusun } = konteks;
  const daftarWarits = Object.entries(konteks.hasil.statusOrang).filter(([, status]) => status.jenis === 'ahliWaris').map(([id]) => id);
  const daftarBaris = [baris(arab(penyusun, 'waratsah.daftar', {
    warits: istilahArab(penyusun, 'warits', 'warits'), daftar: gabungWa(penyusun, daftarWarits.map(id => [sebut([id])])),
  }))];
  for (const langkah of konteks.daftarLangkah('MANI')) {
    daftarBaris.push(baris(arab(penyusun, 'waratsah.mani', {
      siapa: sebut([langkah.idOrang]), mani: istilahArab(penyusun, 'mani', 'mani'),
      sebab: teksArab(penyusun, langkah.mani === 'qatl' ? 'waratsah.sebab_mani.qatl' : 'waratsah.sebab_mani.beda_agama'),
    }), langkah.refs, [langkah.idOrang]));
  }
  for (const langkah of konteks.daftarLangkah('HAJB_HIRMAN')) {
    daftarBaris.push(baris(arab(penyusun, 'waratsah.terhalang', {
      siapa: sebut([langkah.mahjub]), mahjub_hirman: istilahArab(penyusun, 'hajb-hirman', 'mahjub_hirman'), hajib: sebut(langkah.hajib),
    }), langkah.refs, [langkah.mahjub]));
  }
  for (const langkah of konteks.daftarLangkah('KHILAF_MADZHAB')) {
    daftarBaris.push(baris(arab(penyusun, 'waratsah.khilaf', {
      madzhab: namaMadzhabArab(penyusun, langkah.ruleset), isi: teksArab(penyusun, `waratsah.isi_khilaf.${kunciKhilaf(langkah.kode)}`),
    }), langkah.refs, langkah.idOrang));
  }
  return { judul: teksArab(penyusun, 'judul.waratsah'), daftarBaris, kolom: 'ahliWaris' };
}

const namaMadzhabArab = (penyusun: Penyusun, ruleset: Ruleset): string => teksArab(penyusun, `madzhab.${ruleset}`);
const kunciKhilaf = (kode: KodeKhilafOverlay): string => kode.toLowerCase().replace('-', '_');

export const pembukaanMadzhabArab = (penyusun: Penyusun, ruleset: Ruleset): BarisPenjelasan | undefined =>
  ruleset === 'syafii' ? undefined : baris(arab(penyusun, 'pembukaan_madzhab', { madzhab: namaMadzhabArab(penyusun, ruleset) }));

const KUNCI_OPSI_JADD: Record<PilihanJadd, string> = { muqasamah: 'muqasamah', tsuluts: 'tsuluts', tsulutsBaqi: 'tsuluts_baqi', sudus: 'sudus' };
const opsiJadd = (penyusun: Penyusun, pilihan: PilihanJadd): string => teksArab(penyusun, `opsi_jadd.${KUNCI_OPSI_JADD[pilihan]}`);

function pilihanJadd(penyusun: Penyusun, pilihan: Extract<AlasanFardh, { kode: 'JADD_WAL_IKHWAH' }>): Potongan[] {
  const daftarOpsi = pilihan.opsi.map(opsi => `${opsiJadd(penyusun, opsi.nama)} ${opsi.nilai.n}/${opsi.nilai.d}`).join('، ');
  return arab(penyusun, 'pilihan_jadd', { opsi: daftarOpsi, terpilih: opsiJadd(penyusun, pilihan.terpilih) });
}

// Redaksi sebab tiap fardh; kodenya dari engine (hukumnya sudah diputuskan di sana).
function sebabFardh(penyusun: Penyusun, alasan: AlasanFardh, sebut: SebutArab): Potongan[] {
  const sebab = (kunci: string, sisipan: Record<string, Sisipan> = {}) => arab(penyusun, `sebab.${kunci}`, sisipan);
  const bilangan = (banyaknya: number) => (banyaknya === 1 ? 'mufrad' : 'jamak');
  switch (alasan.kode) {
    case 'ADA_FARU_WARITS': return sebab('ada_faru_warits', { faru_warits: istilahArab(penyusun, 'faru-warits', 'faru_warits'), oleh: sebut(alasan.oleh) });
    case 'TANPA_FARU_WARITS': return sebab('tanpa_faru_warits', { faru_warits: istilahArab(penyusun, 'faru-warits', 'faru_warits') });
    case 'JAM_IKHWAH': return sebab('jam_ikhwah', { jam_min_al_ikhwah: istilahArab(penyusun, 'jam-min-al-ikhwah', 'jam_min_al_ikhwah'), oleh: sebut(alasan.oleh) });
    case 'TANPA_FARU_WARITS_DAN_IKHWAH': return sebab('tanpa_faru_warits_dan_ikhwah');
    case 'UMARIYYATAIN':
      return sebab('umariyyatain', { umariyyatain: istilahArab(penyusun, 'umariyyatain', 'umariyyatain'), fardh_pasangan: fardh(penyusun, alasan.fardhPasangan) });
    case 'NENEK_TANPA_IBU': return sebab('nenek_tanpa_ibu');
    case 'TANPA_MUASHSHIB': return sebab(`tanpa_muashshib.${bilangan(alasan.banyaknya)}`, { muashshib: istilahArab(penyusun, 'muashshib', 'muashshib') });
    case 'TAKMILAH':
      return sebab('takmilah', { takmilah_tsulutsain: istilahArab(penyusun, 'takmilah-tsulutsain', 'takmilah_tsulutsain'), bersama: sebut(alasan.bersama) });
    case 'KALALAH': return sebab(`kalalah.${bilangan(alasan.banyaknya)}`, { kalalah: istilahArab(penyusun, 'kalalah', 'kalalah') });
    case 'ADA_FARU_MUDZAKKAR': return sebab('ada_faru_mudzakkar', { oleh: sebut(alasan.oleh) });
    case 'ADA_FARU_MUANNATS': return sebab('ada_faru_muannats', { oleh: sebut(alasan.oleh) });
    case 'MUSYARRAKAH': return sebab('musyarrakah', { musyarrakah: istilahArab(penyusun, 'musyarrakah', 'musyarrakah') });
    case 'AKDARIYYAH':
      return sebab(alasan.porsi === 'jadd' ? 'akdariyyah.kakek' : 'akdariyyah.saudari', { akdariyyah: istilahArab(penyusun, 'akdariyyah', 'akdariyyah') });
    case 'JADD_SISA_SEDIKIT': return sebab('jadd_sisa_sedikit', { sisa: alasan.sisa });
    case 'JADD_WAL_IKHWAH': return pilihanJadd(penyusun, alasan);
  }
}

function babFurudh(konteks: Konteks, sebut: SebutArab): Bab {
  const { penyusun } = konteks;
  const daftarBaris: BarisPenjelasan[] = [];
  const kelompokFardh = new Set(konteks.daftarLangkah('FARDH').map(langkah => langkah.kelompok));
  for (const langkah of konteks.hasil.jejak) {
    if (langkah.jenis === 'FARDH') {
      const anggota = semuaAnggota(konteks, langkah.kelompok);
      daftarBaris.push(baris(kalimat`${sebut(anggota)}: ${fardh(penyusun, langkah.fardh)}، ${sebabFardh(penyusun, langkah.alasan, sebut)}.`, langkah.refs, anggota));
    } else if (langkah.jenis === 'HAJB_NUQSHAN') {
      daftarBaris.push(baris(arab(penyusun, 'furudh.nuqshan', {
        hajb_nuqshan: istilahArab(penyusun, 'hajb-nuqshan', 'hajb_nuqshan'), siapa: sebut([langkah.terdampak]),
        dari: fardh(penyusun, langkah.dari), menjadi: fardh(penyusun, langkah.menjadi),
      }), langkah.refs, [langkah.terdampak]));
    } else if (langkah.jenis === 'ASHABAH' && !kelompokFardh.has(langkah.kelompok)) {
      const anggota = semuaAnggota(konteks, langkah.kelompok);
      const jenis = langkah.jenisAshabah === 'binNafsi' ? istilahArab(penyusun, 'bi-nafsihi', 'bi_nafsihi')
        : langkah.jenisAshabah === 'bilGhair' ? istilahArab(penyusun, 'bil-ghair', 'bil_ghair') : istilahArab(penyusun, 'maal-ghair', 'maal_ghair');
      const penutup = langkah.pilihanJadd
        ? kalimat`، ${arab(penyusun, 'furudh.ashabah_jadd', { pilihan: pilihanJadd(penyusun, langkah.pilihanJadd) })}` : kalimat`.`;
      daftarBaris.push(baris(kalimat`${sebut(anggota)}: ${jenis}${penutup}`, langkah.refs, anggota));
    }
  }
  return { judul: teksArab(penyusun, 'judul.furudh'), daftarBaris, kolom: 'bagian' };
}

function babAshl(konteks: Konteks, sebut: SebutArab): Bab {
  const { penyusun } = konteks;
  const { baris: daftarBarisTabel, totalKolom } = konteks.hasil.tabel;
  const daftarBaris: BarisPenjelasan[] = konteks.daftarLangkah('PERBANDINGAN_NISAB')
    .filter(langkah => langkah.tujuan === 'ashl')
    .map(langkah => baris(nisabArba(penyusun, langkah, teksArab(penyusun, 'nisab.kata_benda.ashl')), langkah.refs));
  const rincian = daftarBarisTabel.map(barisTabel => kalimat`${sebut(barisTabel.anggota)} ${barisTabel.sel['ashl']!}`)
    .flatMap((potongan, i) => (i ? [...kalimat`، `, ...potongan] : potongan));
  daftarBaris.push(baris(arab(penyusun, 'ashl.rincian', {
    ashl: istilahArab(penyusun, 'ashlul-masalah', 'ashlul_masalah'), nilai: totalKolom.ashl!, saham: istilahArab(penyusun, 'saham', 'saham'), rincian,
  })));
  return { judul: teksArab(penyusun, 'judul.ashl'), daftarBaris, kolom: 'ashl' };
}

function babKelas(konteks: Konteks, sebut: SebutArab): Bab {
  const { penyusun } = konteks;
  const judul = teksArab(penyusun, 'judul.kelas');
  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  if (sisaKeluar) return { judul, daftarBaris: [barisSisaKeluar(konteks, sebut, sisaKeluar)], kolom: 'penyesuaian' };
  const [kelas] = konteks.daftarLangkah('KELAS_MASALAH');
  if (!kelas) throw new Error('jejak tanpa KELAS_MASALAH');
  const daftarBaris: BarisPenjelasan[] = [];
  const jumlahDanAshl = { jumlah: kelas.jumlahSaham, ashl: kelas.ashl };
  if (kelas.kelas === 'adilah') daftarBaris.push(baris(arab(penyusun, 'kelas.adilah', { ...jumlahDanAshl, adilah: istilahArab(penyusun, 'adilah', 'adilah') }), kelas.refs));
  if (kelas.kelas === 'ailah') daftarBaris.push(baris(arab(penyusun, 'kelas.aul', { ...jumlahDanAshl, aul: istilahArab(penyusun, 'aul', 'aul') }), kelas.refs));
  if (kelas.kelas === 'raddA' || kelas.kelas === 'raddB') daftarBaris.push(...barisRadd(konteks, sebut, kelas));
  return { judul, daftarBaris, kolom: 'penyesuaian' };
}

function barisRadd(konteks: Konteks, sebut: SebutArab, kelas: Langkah<'KELAS_MASALAH'>): BarisPenjelasan[] {
  const { penyusun } = konteks;
  const daftarBaris = [baris(arab(penyusun, kelas.kelas === 'raddB' ? 'kelas.radd.b' : 'kelas.radd.a', {
    jumlah: kelas.jumlahSaham, ashl: kelas.ashl, radd: istilahArab(penyusun, 'radd', 'radd'),
  }), kelas.refs)];
  const [radd] = konteks.daftarLangkah('RADD');
  if (radd?.zawjiyyah) {
    const zawjiyyah = radd.zawjiyyah;
    daftarBaris.push(baris(arab(penyusun, 'kelas.zawjiyyah', {
      ashl: zawjiyyah.ashl, pasangan: sebut(semuaAnggota(konteks, zawjiyyah.kelompok)), saham: zawjiyyah.sahamPasangan, sisa: zawjiyyah.sisa,
      perbandingan: Object.values(radd.raddiyyah.saham).join(' : '), ashl_radd: radd.raddiyyah.ashl,
    }), radd.refs));
  } else if (radd) {
    daftarBaris.push(baris(arab(penyusun, 'kelas.tanpa_zawjiyyah', { ashl_radd: radd.raddiyyah.ashl }), radd.refs));
  }
  for (const langkah of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkah => langkah.tujuan === 'raddVsSisa')) {
    daftarBaris.push(baris(nisabRadd(penyusun, langkah), langkah.refs));
  }
  return daftarBaris;
}

const KUNCI_TUJUAN_SISA: Record<TujuanSisa, string> = { dzawilArham: 'dzawil_arham', baitulMal: 'baitul_mal', baitulMalTeratur: 'baitul_mal_teratur' };

export function barisSisaKeluar(
  konteks: Konteks, sebut: SebutArab, langkah: Langkah<'SISA_KELUAR'>,
  pasangan: IdOrang[] = konteks.hasil.tabel.baris.flatMap(barisTabel => barisTabel.anggota),
): BarisPenjelasan {
  const { penyusun } = konteks;
  const tujuan = teksArab(penyusun, `tujuan_sisa.${KUNCI_TUJUAN_SISA[langkah.tujuan]}`);
  if (langkah.tujuan === 'baitulMalTeratur') {
    return baris(arab(penyusun, 'sisa_keluar.teratur', { ashl: langkah.ashl, didapat: langkah.ashl - langkah.saham, sisa: langkah.saham, tujuan }), langkah.refs);
  }
  return baris(arab(penyusun, 'sisa_keluar.pasangan', {
    ashl: langkah.ashl, pasangan: sebut(pasangan), didapat: langkah.ashl - langkah.saham, sisa: langkah.saham, tujuan,
  }), langkah.refs, pasangan);
}

function babTashih(konteks: Konteks, sebut: SebutArab): Bab | undefined {
  const { penyusun } = konteks;
  const inkisar = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkah => langkah.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const daftarBaris = inkisar.map(langkah => {
    const anggota = semuaAnggota(konteks, langkah.kelompok!);
    const semuaPerempuan = anggota.every(id => KUNCI_PEREMPUAN.has(konteks.sebutan.peranDari(id)?.kunci ?? ''));
    const dhamir = teksArab(penyusun, semuaPerempuan ? 'dhamir.muannats' : 'dhamir.mudzakkar');
    return baris(kalimat`${sebut(anggota)}: `.concat(nisabInkisar(penyusun, langkah, langkah.b > BigInt(anggota.length), dhamir)), langkah.refs);
  });
  for (const langkah of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkah => langkah.tujuan === 'juzSahm')) {
    daftarBaris.push(baris(nisabArba(penyusun, langkah, teksArab(penyusun, 'nisab.kata_benda.juz_sahm')), langkah.refs));
  }
  const [tashih] = konteks.daftarLangkah('TASHIH');
  daftarBaris.push(tashih
    ? baris(arab(penyusun, 'tashih.dikalikan', {
      juz_as_sahm: istilahArab(penyusun, 'juz-as-sahm', 'juz_as_sahm'), pengali: tashih.juzSahm, tashih: istilahArab(penyusun, 'tashih', 'tashih'),
      dasar: tashih.dasar, hasil: tashih.hasil,
    }), tashih.refs)
    : baris(arab(penyusun, 'tashih.tidak_perlu', { inkisar: istilahArab(penyusun, 'inkisar', 'inkisar') }), ['R10-2']));
  return { judul: teksArab(penyusun, 'judul.tashih'), daftarBaris, kolom: 'tashih' };
}

function babHasil(konteks: Konteks, sebut: SebutArab): Bab {
  const { penyusun } = konteks;
  const { tabel, pembulatan } = konteks.hasil;
  const daftarBaris: BarisPenjelasan[] = [];
  for (const barisTabel of tabel.baris) {
    for (const [id, { saham, nominal }] of Object.entries(barisTabel.perOrang) as Array<[IdOrang, { saham: bigint; nominal: bigint }]>) {
      daftarBaris.push(baris(arab(penyusun, 'hasil.orang', {
        siapa: sebut([id]), saham, penyebut: konteks.penyebutAkhir, nominal: konteks.tampilkanNominal ? ` = ${uang(penyusun, nominal)}` : '',
      }), ['R11-1'], [id]));
    }
  }
  if (konteks.tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    daftarBaris.push({ ...baris(arab(penyusun, 'hasil.selisih', {
      selisih: uang(penyusun, pembulatan.sisaPembulatan), satuan: uang(penyusun, pembulatan.satuan),
    })), penekanan: 'perhatian' });
  }
  return { judul: teksArab(penyusun, 'judul.hasil'), daftarBaris, kolom: 'nominal' };
}

// ─── Nisab arba' (bab 10.2 [R10-1]) ──────────────────────────────────────────

type LangkahNisab = Langkah<'PERBANDINGAN_NISAB'>;

function nisabArba(penyusun: Penyusun, { a, b, hubungan, fpb, hasil }: LangkahNisab, kataBenda: string): Potongan[] {
  const arba = (kunci: string, sisipan: Record<string, Sisipan>) => arab(penyusun, `nisab.arba.${kunci}`, { benda: kataBenda, a, b, hasil, ...sisipan });
  switch (hubungan) {
    case 'tamatsul': return arba('tamatsul', { tamatsul: istilahArab(penyusun, 'tamatsul', 'mutamatsilan') });
    case 'tadakhul': return arba('tadakhul', { tadakhul: istilahArab(penyusun, 'tadakhul', 'mutadakhilan') });
    case 'tawafuq': return arba('tawafuq', { tawafuq: istilahArab(penyusun, 'tawafuq', 'mutawafiqan'), fpb, wafq: istilahArab(penyusun, 'wafq', 'wafq') });
    // [R10-5] «كل عدد مع الواحد فهو متباين»
    case 'tabayun': return arba('tabayun', { tabayun: istilahArab(penyusun, 'tabayun', 'mutabayinan') });
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk nisab arba'`);
  }
}

/** `dhamir`: هم / هن (kelompok perempuan saja), supaya «سهامهن ... رؤوسهن» sesuai jenisnya. */
function nisabInkisar(penyusun: Penyusun, { a: saham, b: ruus, hubungan, fpb, hasil }: LangkahNisab, berbobot: boolean, dhamir: string): Potongan[] {
  const istilahRuus = istilah('ruus', teksArab(penyusun, 'istilah.ruus', { dhamir }));
  const teksRuus = berbobot ? arab(penyusun, 'nisab.inkisar.ruus_berbobot', { ruus: istilahRuus, jumlah: ruus }) : kalimat`${istilahRuus} ${ruus}`;
  switch (hubungan) {
    case 'habis': return arab(penyusun, 'nisab.inkisar.habis', { dhamir, saham, ruus: teksRuus });
    case 'tawafuq':
      return arab(penyusun, 'nisab.inkisar.tawafuq', {
        dhamir, saham, ruus: teksRuus, muwafaqah: istilahArab(penyusun, 'tawafuq', 'muwafaqah'), fpb,
        wafq: istilahArab(penyusun, 'wafq', 'wafq'), jumlah_ruus: ruus, hasil,
      });
    case 'tabayun':
      return arab(penyusun, 'nisab.inkisar.tabayun', { dhamir, saham, ruus: teksRuus, mubayanah: istilahArab(penyusun, 'tabayun', 'mubayanah'), hasil });
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk inkisar`);
  }
}

function nisabRadd(penyusun: Penyusun, { a: sisa, b: ashlRadd, hubungan, fpb, hasil }: LangkahNisab): Potongan[] {
  const ashlZawjiyyah = hasil / (ashlRadd / fpb);
  switch (hubungan) {
    case 'habis': return arab(penyusun, 'nisab.radd.habis', { sisa, ashl_radd: ashlRadd, hasil });
    case 'tawafuq':
      return arab(penyusun, 'nisab.radd.tawafuq', {
        sisa, ashl_radd: ashlRadd, tawafuq: istilahArab(penyusun, 'tawafuq', 'mutawafiqan'), fpb, ashl_zawjiyyah: ashlZawjiyyah, hasil,
      });
    case 'tabayun':
      return arab(penyusun, 'nisab.radd.tabayun', {
        sisa, ashl_radd: ashlRadd, tabayun: istilahArab(penyusun, 'tabayun', 'mutabayinan'), ashl_zawjiyyah: ashlZawjiyyah, hasil,
      });
    default: throw new Error(`relasi ${hubungan} tidak berlaku untuk radd`);
  }
}

export { babTirkah as babTirkahArab, babHasil as babHasilArab };
