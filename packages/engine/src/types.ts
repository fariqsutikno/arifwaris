// Kontrak data engine, dibaca dari atas ke bawah mengikuti alur:
//   graf keluarga (input) → peran & status tiap orang → konfigurasi → tabel mas'alah
//   → jejak keputusan → hasil engine → input engine → munasakhat.

import type { Pecahan, Uang, Nisab } from '@waris/math';

// ─── Graf keluarga ────────────────────────────────────────────────────────────

export type IdOrang = string;

export interface Orang {
  id: IdOrang;
  nama?: string;
  jenisKelamin: 'L' | 'P';
  idAyah?: IdOrang;
  idIbu?: IdOrang;
  statusHidup: 'hidup' | 'wafat' | 'tidakDiketahui';
  agama: 'islam' | 'nonIslam' | 'tidakDiketahui';
  membunuhPewaris?: boolean;   // [SYF] semua bentuk pembunuhan (bab 02)
  penghubung?: boolean;    // node penghubung buatan sistem
}

export interface Pernikahan {
  idSuami: IdOrang;
  idIstri: IdOrang;
  status: 'utuh' | 'talakRajiIddah' | 'talakBain';
  talakSaatMaradh?: boolean;
}

export interface GrafKeluarga {
  idPewaris: IdOrang;
  orang: Record<IdOrang, Orang>;
  pernikahan: Pernikahan[];
}

// ─── Peran ahli waris ─────────────────────────────────────────────────────────

// [R03-1] Daftar ahli waris dan kunci peran (bab 3.1–3.2)
export type KunciAhliWaris =
  | 'ANAK_LK' | 'CUCU_LK' | 'AYAH' | 'KAKEK' | 'SAUDARA_KANDUNG' | 'SAUDARA_SEBAPAK' | 'SAUDARA_SEIBU'
  | 'KEPONAKAN_KANDUNG' | 'KEPONAKAN_SEBAPAK' | 'PAMAN_KANDUNG' | 'PAMAN_SEBAPAK' | 'SEPUPU_KANDUNG' | 'SEPUPU_SEBAPAK'
  | 'SUAMI' | 'MUTIQ'
  | 'ANAK_PR' | 'CUCU_PR' | 'IBU' | 'NENEK_DARI_IBU' | 'NENEK_DARI_AYAH'
  | 'SAUDARI_KANDUNG' | 'SAUDARI_SEBAPAK' | 'SAUDARI_SEIBU' | 'ISTRI' | 'MUTIQAH';

// Posisi kekerabatan diturunkan dari graf; dipakai untuk urutan ashabah (bab 5.3) dan tanzil (bab 14.5).
export interface PosisiKekerabatan {
  generasiLeluhur: number;
  kedalamanKeturunan: number;
  jalur: 'kandung' | 'sebapak' | 'seibu';
  lewatPerempuan: boolean;
}

export interface PeranAhliWaris {
  idOrang: IdOrang;
  kunci: KunciAhliWaris | 'DZAWIL_ARHAM' | 'BUKAN_AHLI_WARIS';
  kekerabatan: PosisiKekerabatan;
  lintasan: IdOrang[];
}

export type StatusOrang =
  | { jenis: 'ahliWaris'; peran: PeranAhliWaris }
  | { jenis: 'mahjub'; peran: PeranAhliWaris; oleh: IdOrang[]; rujukanAturan: string }
  | { jenis: 'mamnu'; peran: PeranAhliWaris; mani: 'qatl' | 'ikhtilafDin' | 'riqq' | 'istibham' | 'daur'; rujukanAturan: string }
  | { jenis: 'bukanAhliWaris'; alasan: string; rujukanAturan?: string };

// ─── Konfigurasi ──────────────────────────────────────────────────────────────

export type Ruleset = 'syafii';

export interface KonfigurasiMadzhab {
  kebijakanSisa: 'radd' | 'baitulMal';          // default 'radd'   [R09-8] [R14-5]
  talakBainSaatMaradh: 'qaulJadid' | 'qaulQadim'; // default 'qaulJadid' [R02-3]
}

export const KONFIGURASI_BAWAAN: KonfigurasiMadzhab = {
  kebijakanSisa: 'radd',
  talakBainSaatMaradh: 'qaulJadid',
};

// ─── Output tabel ─────────────────────────────────────────────────────────────

export type IdKelompok = string;

/** [R14-3] ada dzawil arham → mereka; tidak ada → baitul mal [R02-1]. */
export type TujuanSisa = 'dzawilArham' | 'baitulMal';

export interface TabelMasalah {
  kolom: Array<'fardh' | 'ashl' | 'aul' | 'radd' | 'tashih' | 'perOrang' | 'nominal'>;
  /** Penyebut tiap kolom: ashl, lalu 'aul/radd/tashih bila terjadi. */
  totalKolom: Partial<Record<'ashl' | 'aul' | 'radd' | 'tashih', bigint>>;
  baris: Array<{
    kelompok: IdKelompok;
    anggota: IdOrang[];
    fardh?: Pecahan;
    ashabah?: boolean;
    /** Saham kelompok per kolom (ashl/aul/radd/tashih). */
    sel: Record<string, bigint>;
    /** Per orang: dalam kelompok 2:1 bagian anggota bisa berbeda. */
    perOrang: Record<IdOrang, { saham: bigint; nominal: Uang }>;
  }>;
  dikecualikan: IdOrang[];
}

// ─── Jejak: tiap keputusan sebagai data (dinarasikan di packages/explain) ─────

export type { Nisab };
export type Tahap = 'tirkah' | 'derivasi' | 'mawani' | 'hajb' | 'furudh' | 'ashabah' | 'ashl' | 'klasifikasi' | 'tashih' | 'distribusi' | 'munasakhat';
/** Saham vs ru'us (inkisar) dan sisa zawjiyyah vs ashl radd hanya memakai FPB: habis / tawafuq / tabayun (bab 9.4, 10.3). */
export type HubunganInkisar = 'habis' | 'tawafuq' | 'tabayun';

export type PilihanJadd = 'muqasamah' | 'tsuluts' | 'tsulutsBaqi' | 'sudus';

/**
 * Alasan sebuah fardh — data, bukan kalimat; `packages/jelaskan` yang menarasikan
 * (mis. `oleh` diubah jadi nama orang: "karena ada anak perempuan (Fatimah)").
 */
export type AlasanFardh =
  | { kode: 'ADA_FARU_WARITS'; oleh: IdOrang[] }              // pasangan turun, ibu 1/6
  | { kode: 'TANPA_FARU_WARITS' }                            // pasangan 1/2 atau 1/4
  | { kode: 'JAM_IKHWAH'; oleh: IdOrang[] }                   // ibu 1/6 karena 2+ saudara (termasuk yang mahjub)
  | { kode: 'TANPA_FARU_WARITS_DAN_IKHWAH' }                 // ibu 1/3
  | { kode: 'UMARIYYATAIN'; fardhPasangan: Pecahan }          // ibu 1/3 sisa
  | { kode: 'NENEK_TANPA_IBU'; banyaknya: number }
  | { kode: 'TANPA_MUASHSHIB'; banyaknya: number }               // anak/cucu pr: 1 → 1/2, 2+ → 2/3
  | { kode: 'TAKMILAH'; bersama: IdOrang[] }                   // 1/6 penyempurna 2/3
  | { kode: 'KALALAH'; banyaknya: number }                       // saudari atau anak ibu tanpa far'u & ashl mudzakkar
  | { kode: 'ADA_FARU_MUDZAKKAR'; oleh: IdOrang[] }           // ayah/kakek 1/6 saja
  | { kode: 'ADA_FARU_MUANNATS'; oleh: IdOrang[] }            // ayah/kakek 1/6 + sisa
  | { kode: 'MUSYARRAKAH' }
  | { kode: 'AKDARIYYAH'; porsi: 'jadd' | 'ukht' }
  | { kode: 'JADD_SISA_SEDIKIT'; sisa: Pecahan }            // sisa ≤ 1/6 → kakek 1/6, saudara gugur
  | { kode: 'JADD_WAL_IKHWAH'; sisa: Pecahan; opsi: Array<{ nama: PilihanJadd; nilai: Pecahan }>; terpilih: PilihanJadd };

export type LangkahJejak = { tahap: Tahap; refs: string[] } & (
  | { jenis: 'MANI'; idOrang: IdOrang; mani: string }
  | { jenis: 'HAJB_HIRMAN'; mahjub: IdOrang; hajib: IdOrang[] }
  | { jenis: 'HAJB_NUQSHAN'; terdampak: IdOrang; dari: Pecahan; menjadi: Pecahan; penyebab: IdOrang[] }
  | { jenis: 'FARDH'; kelompok: IdKelompok; fardh: Pecahan; alasan: AlasanFardh }
  | { jenis: 'ASHABAH'; kelompok: IdKelompok; jenisAshabah: 'binNafsi' | 'bilGhair' | 'maalGhair';
      // Diisi bila kakek memilih muqasamah bersama saudara (tidak ada langkah FARDH untuknya).
      pilihanJadd?: Extract<AlasanFardh, { kode: 'JADD_WAL_IKHWAH' }> }
  | { jenis: 'KASUS_KHUSUS'; nama: 'umariyyatain' | 'musyarrakah' | 'akdariyyah' | 'muaddah' }
  | { jenis: 'TIRKAH'; kotor: Uang; tajhiz: Uang; hutang: Uang; wasiatDiminta: Uang; wasiatBatas: Uang;
      wasiatDipakai: Uang; wasiatButuhIjazah: Uang; bersih: Uang }
  // ashl/juzSahm: nisab arba' (a = hasil sejauh ini, b = bilangan berikutnya).
  // inkisar: a = saham kelompok, b = ru'us, hasil = simpanan (ru'us ÷ FPB; 1 bila habis).
  // raddVsSisa: a = sisa zawjiyyah, b = ashl radd, hasil = ashl akhir.
  | { jenis: 'PERBANDINGAN_NISAB'; tujuan: 'ashl' | 'raddVsSisa' | 'inkisar' | 'juzSahm'; kelompok?: IdKelompok;
      a: bigint; b: bigint; hubungan: Nisab | HubunganInkisar; fpb: bigint; hasil: bigint }
  | { jenis: 'KELAS_MASALAH'; kelas: 'adilah' | 'ailah' | 'raddA' | 'raddB'; jumlahSaham: bigint; ashl: bigint }
  | { jenis: 'AUL'; dari: bigint; menjadi: bigint }
  // [R09-9] hanya pasangan: pasangan tidak menerima radd; sisa keluar dari pembagian ahli waris [R14-3] [R02-1].
  | { jenis: 'SISA_KELUAR'; saham: bigint; ashl: bigint; tujuan: TujuanSisa }
  | { jenis: 'RADD';
      zawjiyyah?: { kelompok: IdKelompok; ashl: bigint; sahamPasangan: bigint; sisa: bigint };   // hanya raddB
      raddiyyah: { saham: Record<IdKelompok, bigint>; ashl: bigint };
      hasil: bigint }
  | { jenis: 'TASHIH'; dasar: bigint; juzSahm: bigint; hasil: bigint }
  | { jenis: 'DISTRIBUSI'; idOrang: IdOrang; saham: bigint; dariTashih: bigint; besaran: Uang }
  // Bab 12.3: saham mayit berikutnya di jami'ah sejauh ini vs mas'alah-nya (tanpa tadakhul).
  | { jenis: 'MUNASAKHAT'; mayit: IdOrang; saham: bigint; masalah: bigint; hubungan: HubunganInkisar;
      fpb: bigint; wafqMasalah: bigint; wafqSaham: bigint; jamiah: bigint;
      /** Per orang: saham sebelum × wafqMasalah + saham dari mayit × wafqSaham = sesudah. */
      rincian: Record<IdOrang, { sebelum: bigint; dariMayit: bigint; sesudah: bigint }> }
  // Yang wafat tidak mendapat bagian dari mayit sebelumnya → tidak ada yang diteruskan; diabaikan [R12-1].
  | { jenis: 'MUNASAKHAT_DILEWATI'; mayit: IdOrang }
);

// ─── Kontrak output utama ─────────────────────────────────────────────────────

export interface Pertanyaan {
  idOrang?: IdOrang;
  isian: keyof Orang | 'pernikahan' | 'pembulatan';
  alasan: string;
}

export type HasilEngine =
  | { status: 'PERLU_INPUT'; pertanyaan: Pertanyaan[] }
  | { status: 'TIDAK_DIDUKUNG'; alasan: string; refs: string[] }
  | { status: 'OK';
      statusOrang: Record<IdOrang, StatusOrang>;
      tabel: TabelMasalah;
      jejak: LangkahJejak[];
      pembulatan: { satuan: bigint; sisaPembulatan: Uang };
      /** Hanya pasangan yang mewarisi: sisa tidak dibagi ke ahli waris, tapi ke dzawil arham / baitul mal. */
      sisaKeluar?: { tujuan: TujuanSisa; saham: bigint; nominal: Uang };
      ruleset: Ruleset;
      konfigurasi: KonfigurasiMadzhab;
      versiKb: string };

// ─── Input engine ─────────────────────────────────────────────────────────────

export interface InputTirkah {
  kotor: Uang;
  tajhiz: Uang;
  hutang: Uang;
  wasiat: Uang;
}

// Satuan pembulatan nominal, dipilih pengguna (tunai vs transfer bank). Bukan khilaf fikih.
export interface KonfigurasiPembulatan {
  satuan: bigint;
}

export interface InputEngine {
  graf: GrafKeluarga;
  tirkah: InputTirkah;
  pembulatan: KonfigurasiPembulatan;
  konfigurasi: KonfigurasiMadzhab;
  ruleset: Ruleset;
  versiKb: string;
}

// ─── Munasakhat (bab 12) ──────────────────────────────────────────────────────

export interface InputMunasakhat {
  /** Mayit pertama = `dasar.graf.idPewaris`. */
  dasar: InputEngine;
  /**
   * Ahli waris yang wafat sebelum pembagian, urut waktu wafat (bab 12.7). Yang dibagi hanya harta mayit pertama;
   * harta pribadi, hutang, dan wasiat mereka sendiri bukan bagian munasakhat (bab 12.5).
   */
  urutanWafat: IdOrang[];
  /** Orang yang lahir setelah wafatnya mayit tertentu: belum ada saat mayit itu dan sebelumnya wafat. */
  lahirSetelahWafat?: Record<IdOrang, IdOrang>;
}

type HasilOk = Extract<HasilEngine, { status: 'OK' }>;

export type HasilMunasakhat =
  | (Extract<HasilEngine, { status: 'PERLU_INPUT' | 'TIDAK_DIDUKUNG' }> & { mayit: IdOrang })
  | { status: 'OK';
      /** Hasil pipeline tiap mayit, urut wafat. */
      daftarLangkah: Array<{ mayit: IdOrang; hasil: HasilOk }>;
      /** Bab 12.2: label untuk telusur-balik & penjelasan; tidak menentukan jalur hitung [R12-3]. */
      keadaan: 1 | 2 | 3;
      jamiah: bigint;
      saham: Record<IdOrang, bigint>;
      /** Ikhtishar as-siham (bab 12.4 jenis 3): semua saham ÷ FPB-nya; untuk penyajian. */
      ikhtishar: { jamiah: bigint; saham: Record<IdOrang, bigint> };
      nominal: Record<IdOrang, Uang>;
      pembulatan: { satuan: bigint; sisaPembulatan: Uang };
      jejak: LangkahJejak[] };
