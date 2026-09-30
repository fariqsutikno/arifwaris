// Mode cerita (default, untuk orang awam). Tiap bab = masalahnya apa → caranya → istilahnya → hasilnya.
// Urutan bab: harta → siapa mewarisi → bagian masing-masing → menyamakan penyebut
//             → 'adilah/'aul/radd → pembulatan (tashih) → hasil akhir.
// Semua kalimat = templat diksi `narasi.cerita.*` (label umum: `narasi.umum.*`); kode hanya memilih kunci & sisipan.

import type { AlasanFardh, PilihanJadd, IdOrang, KodeKhilafOverlay, Ruleset, TujuanSisa } from '@waris/engine';
import { sebutKelompok, sebutSemua, type Konteks, type Langkah } from './context.js';
import { rupiah } from './format.js';
import {
  gabungDan, buatBaris, kalimat, susun, teksKamus, tekankan, type BarisPenjelasan, type Penyusun, type Potongan, type Sisipan,
} from './segments.js';
import { istilah, istilahNarasi, type IdIstilah } from './terms.js';

/** Kolom tabel faraidh yang dibahas bab ini, untuk penyorotan di UI (tidak memengaruhi narasi). */
export type KolomBab = 'ahliWaris' | 'bagian' | 'ashl' | 'penyesuaian' | 'tashih' | 'nominal';
export interface Bab { judul: string; daftarBaris: BarisPenjelasan[]; kolom?: KolomBab }

export function babCerita(konteks: Konteks): Bab[] {
  return [babHarta, babAhliWaris, babBagian, babPenyebut, babPenyesuaian, babPembulatan, babHasil]
    .map(buatBab => buatBab(konteks))
    .filter((bab): bab is Bab => bab !== undefined);
}

// ─── Bantuan ──────────────────────────────────────────────────────────────────

const cerita = (konteks: Konteks, kunci: string, sisipan: Record<string, Sisipan> = {}): Potongan[] =>
  susun(konteks.penyusun, `narasi.cerita.${kunci}`, sisipan);
const judulCerita = (konteks: Konteks, kunci: string): string => teksKamus(konteks.penyusun, `narasi.cerita.${kunci}`);
const istilahUmum = (konteks: Konteks, id: IdIstilah, contoh?: string): Potongan => istilahNarasi(konteks.penyusun, id, contoh);
/** Potongan kalimat tambahan yang menempel pada kalimat sebelumnya (dipisah satu spasi). */
const sambung = (potongan: Potongan[]): Potongan[] => kalimat` ${potongan}`;

const gabungAtau = (konteks: Konteks, daftar: Potongan[][]) => daftar.flatMap((unsur, i) =>
  i === 0 ? unsur : [{ jenis: 'teks' as const, teks: i === daftar.length - 1 ? teksKamus(konteks.penyusun, 'narasi.umum.penghubung.atau') : ', ' }, ...unsur]);

// ─── Langkah: harta ───────────────────────────────────────────────────────────

export function babHarta(konteks: Konteks): Bab | undefined {
  const [langkahTirkah] = konteks.daftarLangkah('TIRKAH');
  if (!langkahTirkah || langkahTirkah.kotor === 0n) return undefined;
  const daftarBaris: BarisPenjelasan[] = [];
  const setelahHutang = langkahTirkah.bersih + langkahTirkah.wasiatDipakai;
  if (langkahTirkah.tajhiz > 0n || langkahTirkah.hutang > 0n) {
    daftarBaris.push(buatBaris([
      ...cerita(konteks, 'harta.biaya_dan_hutang', {
        tirkah: istilahUmum(konteks, 'tirkah'), kotor: rupiah(langkahTirkah.kotor), tajhiz: rupiah(langkahTirkah.tajhiz),
        hutang: rupiah(langkahTirkah.hutang), tersisa: rupiah(setelahHutang),
      }),
      ...(setelahHutang === 0n ? sambung(cerita(konteks, 'harta.hutang_menghabiskan')) : []),
    ], langkahTirkah.refs));
  }
  if (langkahTirkah.wasiatButuhIjazah > 0n) {
    daftarBaris.push(tekankan(buatBaris(cerita(konteks, 'harta.wasiat_melebihi', {
      pewaris: konteks.sebutan.pewaris(), diminta: rupiah(langkahTirkah.wasiatDiminta), batas: rupiah(langkahTirkah.wasiatBatas),
      dipakai: rupiah(langkahTirkah.wasiatDipakai), kelebihan: rupiah(langkahTirkah.wasiatButuhIjazah),
    }), ['R01-4']), 'perhatian'));
  } else if (langkahTirkah.wasiatDiminta > 0n) {
    daftarBaris.push(buatBaris(cerita(konteks, 'harta.wasiat_dijalankan', {
      pewaris: konteks.sebutan.pewaris(), dipakai: rupiah(langkahTirkah.wasiatDipakai), batas: rupiah(langkahTirkah.wasiatBatas),
    }), ['R01-4']));
  }
  daftarBaris.push(buatBaris(cerita(konteks, 'harta.dibagi', { bersih: rupiah(langkahTirkah.bersih) }), ['R11-1']));
  return { judul: judulCerita(konteks, 'harta.judul'), daftarBaris, kolom: 'nominal' };
}

// ─── Langkah: ahli waris ──────────────────────────────────────────────────────

function babAhliWaris(konteks: Konteks): Bab {
  const daftarAhliWaris = Object.entries(konteks.hasil.statusOrang).filter(([, status]) => status.jenis === 'ahliWaris').map(([id]) => id);
  const daftarBaris = [buatBaris(cerita(konteks, 'ahli_waris.daftar', {
    warits: istilahUmum(konteks, 'warits'), pewaris: konteks.sebutan.pewaris(), daftar_ahli_waris: sebutSemua(konteks, daftarAhliWaris),
  }))];

  for (const langkah of konteks.daftarLangkah('MANI')) {
    const sisipan = { siapa: konteks.sebutan.sebut([langkah.idOrang]), pewaris: konteks.sebutan.pewaris(), mani: istilahUmum(konteks, 'mani') };
    daftarBaris.push(buatBaris(cerita(konteks, langkah.mani === 'qatl' ? 'ahli_waris.mani_qatl' : 'ahli_waris.mani_beda_agama', sisipan),
      langkah.refs, [langkah.idOrang]));
  }

  const dikelompokkan = new Map<string, { mahjub: IdOrang[]; langkah: Langkah<'HAJB_HIRMAN'> }>();
  for (const langkah of konteks.daftarLangkah('HAJB_HIRMAN')) {
    const kunci = `${konteks.sebutan.peranDari(langkah.mahjub)?.kunci}|${langkah.hajib.join(',')}`;
    const entri = dikelompokkan.get(kunci) ?? { mahjub: [], langkah };
    entri.mahjub.push(langkah.mahjub);
    dikelompokkan.set(kunci, entri);
  }
  for (const { mahjub, langkah } of dikelompokkan.values()) {
    daftarBaris.push(buatBaris(cerita(konteks, 'ahli_waris.terhalang', {
      mahjub: sebutSemua(konteks, mahjub), hajib: sebutSemua(konteks, langkah.hajib), hajb_hirman: istilahUmum(konteks, 'hajb-hirman'),
    }), langkah.refs, mahjub));
  }
  for (const langkah of konteks.daftarLangkah('KHILAF_MADZHAB')) {
    daftarBaris.push(buatBaris(cerita(konteks, 'ahli_waris.khilaf', {
      madzhab: namaMadzhab(konteks.penyusun, langkah.ruleset), isi: judulCerita(konteks, `ahli_waris.isi_khilaf.${kunciKhilaf(langkah.kode)}`),
    }), langkah.refs, langkah.idOrang));
  }
  return { judul: judulCerita(konteks, 'ahli_waris.judul'), daftarBaris, kolom: 'ahliWaris' };
}

const namaMadzhab = (penyusun: Penyusun, ruleset: Ruleset): string => teksKamus(penyusun, `narasi.umum.madzhab.${ruleset}`);
/** 'K03-1' → 'k03_1' (pola kunci diksi). */
const kunciKhilaf = (kode: KodeKhilafOverlay): string => kode.toLowerCase().replace('-', '_');

/** Baris pembuka bila perhitungan bukan [SYF] (default); dipakai mode cerita dan ringkas. */
export const pembukaanMadzhab = (penyusun: Penyusun, ruleset: Ruleset): BarisPenjelasan | undefined =>
  ruleset === 'syafii' ? undefined : buatBaris(susun(penyusun, 'narasi.umum.pembukaan_madzhab', { madzhab: namaMadzhab(penyusun, ruleset) }));

// ─── Langkah: bagian masing-masing ────────────────────────────────────────────

const KUNCI_OPSI_KAKEK: Record<PilihanJadd, string> = { muqasamah: 'muqasamah', tsuluts: 'tsuluts', tsulutsBaqi: 'tsuluts_baqi', sudus: 'sudus' };

const opsiKakek = (konteks: Konteks, pilihan: PilihanJadd): Potongan[] =>
  cerita(konteks, `bagian.opsi_kakek.${KUNCI_OPSI_KAKEK[pilihan]}`, pilihan === 'muqasamah' ? { muqasamah: istilahUmum(konteks, 'muqasamah') } : {});

function babBagian(konteks: Konteks): Bab {
  const daftarBaris: BarisPenjelasan[] = [];
  const kelompokFardh = new Set(konteks.daftarLangkah('FARDH').map(langkahIni => langkahIni.kelompok));
  let nuqshanDijelaskan = false;
  const catatanNuqshan = (): Potongan[] => {
    if (nuqshanDijelaskan) return [];
    nuqshanDijelaskan = true;
    return sambung(cerita(konteks, 'bagian.catatan_nuqshan', { hajb_nuqshan: istilahUmum(konteks, 'hajb-nuqshan') }));
  };

  for (const langkah of konteks.hasil.jejak) {
    if (langkah.jenis === 'FARDH') {
      const anggota = konteks.anggotaDari(langkah.kelompok);
      const nuqshan = konteks.daftarLangkah('HAJB_NUQSHAN').find(langkahNuqshan => anggota.includes(langkahNuqshan.terdampak));
      const bukan = nuqshan ? kalimat`, ${cerita(konteks, 'bagian.bukan', { dari: nuqshan.dari })},` : [];
      daftarBaris.push(buatBaris(ceritaFardh(konteks, langkah, bukan, nuqshan ? catatanNuqshan : () => []), langkah.refs, anggota));
    } else if (langkah.jenis === 'KASUS_KHUSUS') {
      daftarBaris.push(buatBaris(ceritaKasusKhusus(konteks, langkah.nama), langkah.refs));
    } else if (langkah.jenis === 'ASHABAH' && !kelompokFardh.has(langkah.kelompok)) {
      if (langkah.pilihanJadd) {
        const kakek = konteks.anggotaDari(langkah.kelompok).filter(id => konteks.sebutan.peranDari(id)?.kunci === 'KAKEK');
        daftarBaris.push(buatBaris(ceritaPilihanKakek(konteks, sebutSemua(konteks, kakek), langkah.pilihanJadd), langkah.refs, kakek));
      }
      const anggota = konteks.anggotaDari(langkah.kelompok);
      daftarBaris.push(buatBaris(ceritaAshabah(konteks, langkah), langkah.refs, anggota));
      const kunciPeran = konteks.sebutan.peranDari(anggota[0]!)?.kunci ?? '';
      if (langkah.jenisAshabah === 'binNafsi' && PERAN_BERPENDAHULU.has(kunciPeran)) {
        daftarBaris.push(buatBaris(cerita(konteks, 'bagian.paling_dekat', {
          siapa: sebutKelompok(konteks, langkah.kelompok), lebih_dekat: judulCerita(konteks, `bagian.lebih_dekat_dari.${kunciPeran.toLowerCase()}`),
        }), ['R05-1', 'R05-2', 'R05-3'], anggota));
      }
    }
  }
  return { judul: judulCerita(konteks, 'bagian.judul'), daftarBaris, kolom: 'bagian' };
}

function ceritaFardh(konteks: Konteks, langkah: Langkah<'FARDH'>, bukan: Potongan[], catatanTambahan: () => Potongan[]): Potongan[] {
  const subjek = sebutKelompok(konteks, langkah.kelompok);
  const pecahan = langkah.fardh;
  const pewaris = konteks.sebutan.pewaris();
  const alasan: AlasanFardh = langkah.alasan;
  const faruWarits = istilahUmum(konteks, 'faru-warits');
  const bilangan = (banyaknya: number) => (banyaknya > 1 ? 'jamak' : 'mufrad');
  // Furudh bersama (istri-istri, nenek-nenek) dibagi rata [R04-3] [R04-8].
  const mendapat = cerita(konteks, `fardh.mendapat.${bilangan(konteks.anggotaDari(langkah.kelompok).length)}`, { pecahan, bukan });
  switch (alasan.kode) {
    case 'ADA_FARU_WARITS':
      return [...cerita(konteks, 'fardh.ada_faru_warits', { subjek, mendapat, pewaris, faru_warits: faruWarits, oleh: sebutSemua(konteks, alasan.oleh) }),
        ...catatanTambahan()];
    case 'TANPA_FARU_WARITS':
      return cerita(konteks, 'fardh.tanpa_faru_warits', { subjek, mendapat, pewaris, faru_warits: faruWarits });
    case 'JAM_IKHWAH': {
      const adaYangTerhalang = alasan.oleh.some(id => konteks.hasil.statusOrang[id]?.jenis === 'mahjub');
      return [...cerita(konteks, 'fardh.jam_ikhwah', {
        subjek, pecahan, bukan, pewaris, jam_min_al_ikhwah: istilahUmum(konteks, 'jam-min-al-ikhwah'), oleh: sebutSemua(konteks, alasan.oleh),
      }), ...(adaYangTerhalang ? sambung(cerita(konteks, 'fardh.jam_ikhwah_terhalang')) : []), ...catatanTambahan()];
    }
    case 'TANPA_FARU_WARITS_DAN_IKHWAH':
      return cerita(konteks, 'fardh.tanpa_faru_warits_dan_ikhwah', { subjek, pecahan, pewaris });
    case 'UMARIYYATAIN': {
      const pasangan = konteks.anggotaDari('SUAMI').length > 0 ? sebutKelompok(konteks, 'SUAMI') : sebutKelompok(konteks, 'ISTRI');
      return cerita(konteks, 'fardh.umariyyatain', { subjek, pasangan, fardh_pasangan: alasan.fardhPasangan, pecahan });
    }
    case 'NENEK_TANPA_IBU':
      return cerita(konteks, `fardh.nenek_tanpa_ibu.${bilangan(alasan.banyaknya)}`, { subjek, pecahan });
    case 'TANPA_MUASHSHIB':
      return cerita(konteks, `fardh.tanpa_muashshib.${bilangan(alasan.banyaknya)}`, { subjek, pecahan, muashshib: istilahUmum(konteks, 'muashshib') });
    case 'TAKMILAH':
      return [...cerita(konteks, 'fardh.takmilah', {
        subjek, pecahan, bukan, bersama: sebutSemua(konteks, alasan.bersama), takmilah_tsulutsain: istilahUmum(konteks, 'takmilah-tsulutsain'),
      }), ...catatanTambahan()];
    case 'KALALAH':
      return cerita(konteks, `fardh.kalalah.${bilangan(alasan.banyaknya)}`, { subjek, pecahan, pewaris, kalalah: istilahUmum(konteks, 'kalalah') });
    case 'ADA_FARU_MUDZAKKAR':
      return cerita(konteks, 'fardh.ada_faru_mudzakkar', { subjek, pecahan, oleh: sebutSemua(konteks, alasan.oleh) });
    case 'ADA_FARU_MUANNATS':
      return cerita(konteks, 'fardh.ada_faru_muannats', {
        subjek, pecahan, ashabah: istilahUmum(konteks, 'ashabah'), pewaris, oleh: sebutSemua(konteks, alasan.oleh),
      });
    case 'MUSYARRAKAH':
      return cerita(konteks, 'fardh.musyarrakah', { subjek, pecahan });
    case 'AKDARIYYAH': {
      const anggota = konteks.anggotaDari(langkah.kelompok);
      const adalahKakek = (id: IdOrang) => konteks.sebutan.peranDari(id)?.kunci === 'KAKEK';
      return alasan.porsi === 'jadd'
        ? cerita(konteks, 'fardh.akdariyyah_kakek', { kakek: sebutSemua(konteks, anggota.filter(adalahKakek)) })
        : cerita(konteks, 'fardh.akdariyyah_saudari', { saudari: sebutSemua(konteks, anggota.filter(id => !adalahKakek(id))) });
    }
    case 'JADD_SISA_SEDIKIT':
      return cerita(konteks, 'fardh.jadd_sisa_sedikit', { sisa: alasan.sisa, subjek });
    case 'JADD_WAL_IKHWAH':
      return ceritaPilihanKakek(konteks, subjek, alasan);
  }
}

function ceritaPilihanKakek(konteks: Konteks, kakek: Potongan[], pilihan: Extract<AlasanFardh, { kode: 'JADD_WAL_IKHWAH' }>): Potongan[] {
  const opsi = gabungAtau(konteks, pilihan.opsi.map(opsiIni => kalimat`${opsiKakek(konteks, opsiIni.nama)} = ${opsiIni.nilai}`));
  const terpilih = pilihan.opsi.find(opsiIni => opsiIni.nama === pilihan.terpilih)!;
  return cerita(konteks, 'bagian.pilihan_kakek', { kakek, opsi, terpilih: opsiKakek(konteks, pilihan.terpilih), nilai: terpilih.nilai });
}

function ceritaKasusKhusus(konteks: Konteks, nama: Langkah<'KASUS_KHUSUS'>['nama']): Potongan[] {
  const label = (id: IdIstilah) => istilah(id, judulCerita(konteks, `bagian.istilah_${id}`));
  switch (nama) {
    case 'umariyyatain': case 'musyarrakah': case 'akdariyyah':
      return cerita(konteks, 'bagian.kasus_khusus', { kasus: label(nama) });
    case 'muaddah':
      return cerita(konteks, 'bagian.kasus_khusus_muaddah', { muaddah: label('muaddah') });
  }
}

// [R05-2] urutan ashabah bi nafsihi [SYF]: bunuwwah → ubuwwah → juduwwah & ukhuwwah (sejajar) → bani al-ikhwah
// (gugur oleh kakek) → 'umumah & anaknya; [R05-3] dalam satu jihah yang kandung didahulukan dari yang sebapak.
// Diksi `bagian.lebih_dekat_dari.<peran>` berisi siapa saja yang, bila ada, lebih berhak atas sisa daripada peran ini.
const PERAN_BERPENDAHULU = new Set([
  'CUCU_LK', 'AYAH', 'KAKEK', 'SAUDARA_KANDUNG', 'SAUDARA_SEBAPAK', 'KEPONAKAN_KANDUNG', 'KEPONAKAN_SEBAPAK',
  'PAMAN_KANDUNG', 'PAMAN_SEBAPAK', 'SEPUPU_KANDUNG', 'SEPUPU_SEBAPAK',
]);

function ceritaAshabah(konteks: Konteks, langkah: Langkah<'ASHABAH'>): Potongan[] {
  const subjek = sebutKelompok(konteks, langkah.kelompok);
  switch (langkah.jenisAshabah) {
    case 'binNafsi':
      return cerita(konteks, 'ashabah.bin_nafsi', { subjek, ashabah: istilahUmum(konteks, 'ashabah') });
    case 'bilGhair':
      return cerita(konteks, 'ashabah.bil_ghair', { subjek, bil_ghair: istilahUmum(konteks, 'bil-ghair') });
    case 'maalGhair':
      return cerita(konteks, 'ashabah.maal_ghair', { subjek, maal_ghair: istilahUmum(konteks, 'maal-ghair'), pewaris: konteks.sebutan.pewaris() });
  }
}

// ─── Langkah: menyamakan penyebut ─────────────────────────────────────────────

/** Identifikasi dua bilangan dengan nisab arba' (bab 10.2) dalam kalimat sehari-hari. */
export function ceritaArba(konteks: Konteks, langkah: Langkah<'PERBANDINGAN_NISAB'>, awalan: Potongan[]): Potongan[] {
  const { a, b, fpb, hasil } = langkah;
  const [kecil, besar] = a < b ? [a, b] : [b, a];
  const contoh = judulContoh(konteks, 'penyebut.contoh_arba', { a: String(a), b: String(b), hasil: String(hasil) });
  const istilahNisab = (id: IdIstilah) => istilahUmum(konteks, id, contoh);
  switch (langkah.hubungan) {
    case 'tamatsul':
      return cerita(konteks, 'penyebut.arba.tamatsul', { awalan, tamatsul: istilahNisab('tamatsul'), hasil });
    case 'tadakhul':
      return cerita(konteks, 'penyebut.arba.tadakhul', { awalan, besar, kecil, tadakhul: istilahNisab('tadakhul') });
    case 'tawafuq':
      return cerita(konteks, 'penyebut.arba.tawafuq', { awalan, fpb, tawafuq: istilahNisab('tawafuq'), a, b, hasil });
    case 'tabayun':
      // [R10-5] «كل عدد مع الواحد فهو متباين»
      return cerita(konteks, kecil === 1n ? 'penyebut.arba.tabayun_satu' : 'penyebut.arba.tabayun', { awalan, tabayun: istilahNisab('tabayun'), a, b, hasil });
    default:
      throw new Error(`relasi ${langkah.hubungan} tidak berlaku untuk nisab arba'`);
  }
}

const judulContoh = (konteks: Konteks, kunci: string, sisipan: Record<string, string>): string =>
  teksKamus(konteks.penyusun, `narasi.cerita.${kunci}`, sisipan);

function babPenyebut(konteks: Konteks): Bab {
  const { baris, totalKolom } = konteks.hasil.tabel;
  const ashl = totalKolom.ashl!;
  const daftarBaris: BarisPenjelasan[] = [];
  const istilahAshl = istilahUmum(konteks, 'ashlul-masalah', judulContoh(konteks, 'penyebut.contoh_ashl', { ashl: String(ashl) }));
  const judul = judulCerita(konteks, 'penyebut.judul');

  if (baris.every(barisTabel => barisTabel.fardh === undefined)) {
    daftarBaris.push(buatBaris(cerita(konteks, 'penyebut.semua_ashabah', {
      ashabah: istilahUmum(konteks, 'ashabah'), ruus: istilahUmum(konteks, 'ruus'), ashl, ashlul_masalah: istilahAshl,
    }), ['R09-2']));
    return { judul, daftarBaris, kolom: 'ashl' };
  }

  const pecahan = gabungDan(konteks.penyusun,
    baris.filter(barisTabel => barisTabel.fardh).map(barisTabel => kalimat`${sebutKelompok(konteks, barisTabel.kelompok)} ${barisTabel.fardh!}`));
  const jumlahPecahan = baris.filter(barisTabel => barisTabel.fardh).length;
  const perbandinganAshl = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'ashl');
  if (perbandinganAshl.length === 0) {
    daftarBaris.push(buatBaris(cerita(konteks, `penyebut.sudah_sama.${jumlahPecahan > 1 ? 'jamak' : 'mufrad'}`, {
      pecahan, ashl, ashlul_masalah: istilahAshl,
    }), ['R09-1']));
  } else {
    daftarBaris.push(buatBaris(cerita(konteks, 'penyebut.masih_pecahan', { pecahan, ashlul_masalah: istilahAshl }), ['R09-1']));
    perbandinganAshl.forEach((langkah, i) => {
      const awalan = cerita(konteks, i === 0 ? 'penyebut.awalan_pertama' : 'penyebut.awalan_lanjut', { a: langkah.a, b: langkah.b });
      daftarBaris.push(buatBaris(ceritaArba(konteks, langkah, awalan), langkah.refs));
    });
  }

  const bagianBagian = baris.map(barisTabel => {
    const sahamAshl = barisTabel.sel['ashl']!;
    const siapa = sebutKelompok(konteks, barisTabel.kelompok);
    if (!barisTabel.fardh) return cerita(konteks, 'penyebut.bagian_sisa', { saham: sahamAshl, siapa });
    const porsiFardh = barisTabel.fardh.n * ashl / barisTabel.fardh.d;
    return barisTabel.ashabah
      ? cerita(konteks, 'penyebut.bagian_fardh_dan_sisa', { siapa, fardh: porsiFardh, sisa: sahamAshl - porsiFardh })
      : kalimat`${siapa} ${sahamAshl}`;
  });
  daftarBaris.push(buatBaris(cerita(konteks, 'penyebut.dipotong', {
    ashl, saham: istilahUmum(konteks, 'saham'), bagian: gabungDan(konteks.penyusun, bagianBagian),
  })));
  return { judul, daftarBaris, kolom: 'ashl' };
}

// ─── Langkah: 'adilah / 'aul / radd ───────────────────────────────────────────

function babPenyesuaian(konteks: Konteks): Bab {
  const [kelas] = konteks.daftarLangkah('KELAS_MASALAH');
  const [sisaKeluar] = konteks.daftarLangkah('SISA_KELUAR');
  const judulSisa = judulCerita(konteks, 'penyesuaian.judul_sisa');
  if (sisaKeluar) return { judul: judulSisa, kolom: 'penyesuaian', daftarBaris: [ceritaSisaKeluar(konteks, sisaKeluar)] };
  if (!kelas) throw new Error('jejak tanpa KELAS_MASALAH');
  const baris = konteks.hasil.tabel.baris;
  const rincian = baris.length > 1 ? `${baris.map(barisTabel => barisTabel.sel['ashl']).join(' + ')} = ` : '';
  const { jumlahSaham, ashl } = kelas;

  switch (kelas.kelas) {
    case 'adilah':
      return { judul: judulCerita(konteks, 'penyesuaian.judul_adilah'), kolom: 'penyesuaian', daftarBaris: [buatBaris(
        cerita(konteks, 'penyesuaian.adilah', { rincian, jumlah: jumlahSaham, ashl, adilah: istilahUmum(konteks, 'adilah') }), kelas.refs)] };
    case 'ailah': {
      const aul = istilahUmum(konteks, 'aul', judulContoh(konteks, 'penyesuaian.contoh_aul', { ashl: String(ashl), jumlah: String(jumlahSaham) }));
      return { judul: judulCerita(konteks, 'penyesuaian.judul_aul'), kolom: 'penyesuaian', daftarBaris: [buatBaris(
        cerita(konteks, 'penyesuaian.aul', { rincian, jumlah: jumlahSaham, ashl, aul }),
        konteks.daftarLangkah('AUL')[0]?.refs ?? kelas.refs)] };
    }
    case 'raddA': case 'raddB':
      return { judul: judulSisa, kolom: 'penyesuaian', daftarBaris: ceritaRadd(konteks, kelas, rincian) };
  }
}

const KUNCI_TUJUAN_SISA: Record<TujuanSisa, string> = { dzawilArham: 'dzawil_arham', baitulMal: 'baitul_mal', baitulMalTeratur: 'baitul_mal_teratur' };

/** "untuk dzawil arham", dst.; dipakai hasil akhir cerita dan munasakhat. */
export const teksTujuanSisa = (penyusun: Penyusun, tujuan: TujuanSisa): string =>
  teksKamus(penyusun, `narasi.umum.tujuan_sisa.${KUNCI_TUJUAN_SISA[tujuan]}`);

/** Hanya pasangan yang mewarisi [R09-9]: fardh penuh, sisanya keluar dari ahli waris [R14-3] [R02-1]. */
export function ceritaSisaKeluar(
  konteks: Konteks, langkah: Langkah<'SISA_KELUAR'>, pasangan: IdOrang[] = konteks.hasil.tabel.baris.flatMap(barisTabel => barisTabel.anggota),
): BarisPenjelasan {
  const radd = istilahUmum(konteks, 'radd');
  // [R09-8] kebijakan baitul mal: sisa tidak di-radd ke siapa pun, bukan karena hanya pasangan yang mewarisi.
  if (langkah.tujuan === 'baitulMalTeratur') {
    return buatBaris(cerita(konteks, 'sisa_keluar.baitul_mal_teratur', {
      ashl: langkah.ashl, didapat: langkah.ashl - langkah.saham, sisa: langkah.saham, radd,
    }), langkah.refs);
  }
  const tujuan = cerita(konteks, langkah.tujuan === 'dzawilArham' ? 'sisa_keluar.tujuan_dzawil_arham' : 'sisa_keluar.tujuan_baitul_mal');
  return buatBaris(cerita(konteks, 'sisa_keluar.pasangan', {
    ashl: langkah.ashl, pasangan: sebutSemua(konteks, pasangan), didapat: langkah.ashl - langkah.saham, sisa: langkah.saham, radd, tujuan,
  }), langkah.refs, pasangan);
}

function ceritaRadd(konteks: Konteks, kelas: Langkah<'KELAS_MASALAH'>, rincian: string): BarisPenjelasan[] {
  const [radd] = konteks.daftarLangkah('RADD');
  if (!radd) throw new Error('jejak radd tanpa langkah RADD');
  const kelompokPenerima = Object.keys(radd.raddiyyah.saham);
  const penerima = sebutSemua(konteks, kelompokPenerima.flatMap(idKelompok => konteks.anggotaDari(idKelompok)));
  const zawjiyyah = radd.zawjiyyah;
  const daftarBaris = [buatBaris([
    ...cerita(konteks, 'radd.pembuka', {
      rincian, jumlah: kelas.jumlahSaham, ashl: kelas.ashl, sisa: kelas.ashl - kelas.jumlahSaham,
      ashabah: istilahUmum(konteks, 'ashabah'), penerima, radd: istilahUmum(konteks, 'radd'),
    }),
    ...(zawjiyyah ? sambung(cerita(konteks, 'radd.pasangan_tidak_ikut', { pasangan: sebutKelompok(konteks, zawjiyyah.kelompok) })) : []),
  ], kelas.refs)];

  if (!zawjiyyah) {
    const rincianRadd = kelompokPenerima.map(idKelompok => kalimat`${sebutKelompok(konteks, idKelompok)} ${radd.raddiyyah.saham[idKelompok]!}`);
    daftarBaris.push(buatBaris(cerita(konteks, 'radd.tanpa_pasangan', {
      rincian: gabungDan(konteks.penyusun, rincianRadd), ashl: radd.raddiyyah.ashl,
    }), radd.refs));
    return daftarBaris;
  }

  const barisPasangan = konteks.hasil.tabel.baris.find(barisTabel => barisTabel.kelompok === zawjiyyah.kelompok)!;
  daftarBaris.push(buatBaris(cerita(konteks, 'radd.pasangan_dulu', {
    pasangan: sebutKelompok(konteks, zawjiyyah.kelompok), fardh: barisPasangan.fardh!, ashl: zawjiyyah.ashl,
    saham: zawjiyyah.sahamPasangan, sisa: zawjiyyah.sisa,
  }), radd.refs));
  daftarBaris.push(buatBaris(kelompokPenerima.length > 1
    ? cerita(konteks, 'radd.kedua.jamak', { penerima, perbandingan: Object.values(radd.raddiyyah.saham).join(' : '), ashl: radd.raddiyyah.ashl })
    : cerita(konteks, 'radd.kedua.mufrad', { sisa: zawjiyyah.sisa, penerima }), radd.refs));

  const [bandingkanNisab] = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'raddVsSisa');
  if (bandingkanNisab && kelompokPenerima.length > 1) {
    const { a: sisa, b: ashlRadd, fpb, hasil } = bandingkanNisab;
    daftarBaris.push(buatBaris(bandingkanNisab.hubungan === 'habis'
      ? cerita(konteks, 'radd.ketiga.habis', { sisa, ashl_radd: ashlRadd, hasil })
      : bandingkanNisab.hubungan === 'tawafuq'
        ? cerita(konteks, 'radd.ketiga.tawafuq', { sisa, ashl_radd: ashlRadd, fpb, tawafuq: istilahUmum(konteks, 'tawafuq'), pengali: ashlRadd / fpb, hasil })
        : cerita(konteks, 'radd.ketiga.tabayun', { sisa, ashl_radd: ashlRadd, tabayun: istilahUmum(konteks, 'tabayun'), hasil }), bandingkanNisab.refs));
  }

  const hasilRadd = konteks.hasil.tabel.baris.map(barisTabel => barisTabel.kelompok === zawjiyyah.kelompok
    ? cerita(konteks, 'radd.hasil_pasangan', { siapa: sebutKelompok(konteks, barisTabel.kelompok), saham: barisTabel.sel['radd']!, fardh: barisTabel.fardh! })
    : cerita(konteks, 'radd.hasil_penerima', { siapa: sebutKelompok(konteks, barisTabel.kelompok), saham: barisTabel.sel['radd']! }));
  daftarBaris.push(buatBaris(cerita(konteks, 'radd.hasil', { hasil: gabungDan(konteks.penyusun, hasilRadd) }), radd.refs));
  return daftarBaris;
}

// ─── Langkah: tashih ──────────────────────────────────────────────────────────

function babPembulatan(konteks: Konteks): Bab | undefined {
  const inkisar = konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'inkisar');
  if (inkisar.length === 0) return undefined;
  const daftarBaris: BarisPenjelasan[] = [];
  if (inkisar.some(langkahIni => langkahIni.hubungan !== 'habis')) {
    daftarBaris.push(buatBaris(cerita(konteks, 'tashih.pengantar', {
      inkisar: istilahUmum(konteks, 'inkisar'), tashih: istilahUmum(konteks, 'tashih'),
    }), ['R10-2']));
  }
  for (const langkah of inkisar) {
    const anggota = konteks.anggotaDari(langkah.kelompok!);
    const { a: saham, b: ruus, fpb, hasil } = langkah;
    const untuk = ruus > BigInt(anggota.length)
      ? cerita(konteks, 'tashih.untuk_kepala', { jumlah: ruus, ruus: istilahUmum(konteks, 'ruus') })
      : cerita(konteks, 'tashih.untuk_orang', { jumlah: ruus });
    const siapa = sebutKelompok(konteks, langkah.kelompok!);
    daftarBaris.push(buatBaris(langkah.hubungan === 'habis'
      ? cerita(konteks, 'tashih.inkisar.habis', { siapa, saham, untuk })
      : langkah.hubungan === 'tawafuq'
        ? cerita(konteks, 'tashih.inkisar.tawafuq', { siapa, saham, untuk, ruus, fpb, tawafuq: istilahUmum(konteks, 'tawafuq'), hasil })
        : cerita(konteks, 'tashih.inkisar.tabayun', { siapa, saham, untuk, ruus, tabayun: istilahUmum(konteks, 'tabayun') }), langkah.refs));
  }
  for (const langkah of konteks.daftarLangkah('PERBANDINGAN_NISAB').filter(langkahIni => langkahIni.tujuan === 'juzSahm')) {
    daftarBaris.push(buatBaris(ceritaArba(konteks, langkah, cerita(konteks, 'tashih.awalan_juz_sahm', { a: langkah.a, b: langkah.b })), langkah.refs));
  }
  const [tashih] = konteks.daftarLangkah('TASHIH');
  daftarBaris.push(tashih
    ? buatBaris(cerita(konteks, 'tashih.dikalikan', {
      pengali: tashih.juzSahm, juz_as_sahm: istilahUmum(konteks, 'juz-as-sahm'), dasar: tashih.dasar, hasil: tashih.hasil,
    }), tashih.refs)
    : buatBaris(cerita(konteks, 'tashih.tidak_perlu'), ['R10-2']));
  return { judul: judulCerita(konteks, 'tashih.judul'), daftarBaris, kolom: 'tashih' };
}

// ─── Langkah: hasil ───────────────────────────────────────────────────────────

export function babHasil(konteks: Konteks): Bab {
  const { tabel, pembulatan } = konteks.hasil;
  const penyebut = konteks.penyebutAkhir;
  const nominalBila = (uang: bigint): Potongan[] => (konteks.tampilkanNominal ? kalimat` = ${rupiah(uang)}` : []);
  const daftarBaris = [tekankan(buatBaris(cerita(konteks, 'hasil.pembuka', { penyebut })), 'subjudul')];
  for (const barisTabel of tabel.baris) {
    for (const [id, { saham, nominal }] of Object.entries(barisTabel.perOrang)) {
      const siapa = konteks.sebutan.sebut([id]);
      daftarBaris.push(buatBaris(saham === 0n
        ? cerita(konteks, 'hasil.orang_nol', { siapa })
        : cerita(konteks, 'hasil.orang', { siapa, saham, penyebut, nominal: nominalBila(nominal) }), ['R11-1'], [id]));
    }
  }
  const { sisaKeluar } = konteks.hasil;
  if (sisaKeluar) {
    daftarBaris.push(tekankan(buatBaris(cerita(konteks, 'hasil.sisa', {
      saham: sisaKeluar.saham, penyebut, nominal: nominalBila(sisaKeluar.nominal), tujuan: teksTujuanSisa(konteks.penyusun, sisaKeluar.tujuan),
    }), konteks.daftarLangkah('SISA_KELUAR')[0]?.refs ?? []), 'perhatian'));
  }
  if (konteks.tampilkanNominal && pembulatan.sisaPembulatan > 0n) {
    const perSatuan = pembulatan.satuan > 1n;
    daftarBaris.push(tekankan(buatBaris([
      ...(perSatuan
        ? cerita(konteks, 'hasil.selisih.per_satuan', { satuan: rupiah(pembulatan.satuan), selisih: rupiah(pembulatan.sisaPembulatan) })
        : cerita(konteks, 'hasil.selisih.per_rupiah', { selisih: rupiah(pembulatan.sisaPembulatan) })),
      ...(perSatuan ? sambung(cerita(konteks, 'hasil.saran_transfer')) : []),
    ]), 'perhatian'));
  }
  return { judul: judulCerita(konteks, 'hasil.judul'), daftarBaris, kolom: 'nominal' };
}
