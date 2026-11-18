// Ringkasan layar hasil: HasilTampil (OK) → data siap tampil untuk sidebar, pohon, tabel, dan modal.
// Semua angka diambil dari engine (tabel, statusOrang, jejak); di sini hanya dipilih, diberi nama, dan diformat.

import { hitungTirkah, type DuniaTaqdir, type GrafKeluarga, type HartaGharqa, type HasilGharqa, type HasilTaqdir, type IdOrang, type InputTirkah, type KeadaanGharqa, type KunciAhliWaris, type LangkahJejak, type StatusOrang } from '@waris/engine';
import { fpb } from '@waris/math';
import { jenisDari, type Kelompok } from '../checklist';
import { formatRupiahRingkas, namaOrang, penyebutAkhir } from '../format';
import { jalankan, type HasilMunasakhatOk, type HasilOk, type HasilTampil } from '../jalankan';
import type { Kasus } from '../kasus';
import { namaSingkat } from '../keadaanOrang';
import { angka, bahasaArab, t } from '../terjemah';

type LangkahTirkah = Extract<LangkahJejak, { jenis: 'TIRKAH' }>;
type Nisbah = Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }>['hubungan'];

export interface Penerima {
  id: IdOrang;
  nama: string;
  kunci: KunciAhliWaris | undefined;
  kelompok: Kelompok;
  saham: bigint;
  nominal: bigint;
  /** "Bagian tertentu 1/6", "Sisa (ashabah)", ... */
  keterangan: string;
  /** Pecahan fardh kelompoknya bila ada (dipakai mencocokkan ahwal). */
  fardh?: { n: bigint; d: bigint };
  ashabah: boolean;
  /** Kode alasan fardh dari jejak engine (ADA_FARU_WARITS, UMARIYYATAIN, ...), untuk mencocokkan ahwal. */
  kodeAlasan?: string;
  /** Gharqa: rincian per harta, menggantikan pecahan di daftar ("Rp 37,5 jt dari Ahmad + Rp 8,3 jt dari Budi"). */
  rincian?: string;
}

/** Kenapa bagian seseorang ditahan (13.0b): menunggu kelahiran, kabar, kepastian, atau ingatan urutan wafat (gharqa keadaan 3). */
export type SebabDitahan = 'bayi' | 'kabar' | 'bersamaBayi' | 'kepastian' | 'urutan';
export interface OrangDitahan { id: IdOrang; nama: string; kunci: KunciAhliWaris | undefined; kelompok: Kelompok; sebab: SebabDitahan }
export type JenisBelumPasti = 'haml' | 'mafqud' | 'khuntsa';

/** Satu harta anggota gharqa, dibagi sendiri (13d). */
export interface HartaRingkas { mayit: IdOrang; nama: string; bersih: bigint; jamiah: bigint; saham: Record<string, bigint>; nominal: Record<string, bigint>; nominalMauquf: bigint }

export interface Terhalang { id: IdOrang; nama: string; kunci: KunciAhliWaris | undefined; kelompok: Kelompok; alasan: string }

export interface TentangKasus {
  kelas?: 'adilah' | 'ailah' | 'raddA' | 'raddB';
  ashl?: { nilai: bigint; hubungan?: Nisbah; penyebut: bigint[] };
  aul?: { dari: bigint; menjadi: bigint };
  tashih?: { dari: bigint; jadi: bigint; hubungan?: Nisbah };
  jamiah?: bigint;
  /** Taqdir: jami'ah semua kemungkinan, yang diberikan sekarang, dan yang ditahan (saham). */
  kemungkinan?: { jumlah: number; jamiah: bigint; diberikan: bigint; mauquf: bigint };
  /** Gharqa: mas'alah (jami'ah) tiap harta. */
  perHarta?: Array<{ nama: string; jamiah: bigint }>;
}

export interface RingkasanHasil {
  jenis: 'biasa' | 'munasakhat' | 'taqdir' | 'menunggu' | 'gharqa';
  penerima: Penerima[];
  terhalang: Terhalang[];
  /** Tashih (kasus biasa) atau jami'ah (munasakhat): jumlah semua saham. */
  penyebut: bigint;
  tirkah: LangkahTirkah;
  sisaPembulatan: bigint;
  /** Hanya pasangan yang mewarisi: sisa harta keluar dari ahli waris (engine `sisaKeluar`). Munasakhat: satu per mayit. */
  /** `ditahan`: bagian mauquf (13.0b); tidak jadi baris di daftar (orangnya ada di kelompok Ditahan), hanya di penjumlahan. */
  daftarSisaKeluar: Array<{ id: string; saham: bigint; nominal: bigint; judul: string; keterangan: string; ditahan?: true }>;
  tentang: TentangKasus;
  statusOrang: Record<IdOrang, StatusOrang>;
  /** Taqdir/gharqa: harta (rupiah) yang ditahan dan siapa yang menunggu. */
  ditahan?: { nominal: bigint; orang: OrangDitahan[] };
  taqdir?: { daftarDunia: DuniaTaqdir[]; diberikan: Record<IdOrang, bigint>; mauquf: bigint; sumber: Array<{ id: IdOrang; nama: string; jenis: JenisBelumPasti }> };
  gharqa?: { keadaan: KeadaanGharqa; anggota: IdOrang[]; harta: HartaRingkas[]; skenario?: Array<{ urutan: IdOrang[]; harta: HartaRingkas[] }> };
}

/** Hanya hasil biasa/munasakhat yang OK punya satu tabel bagian; taqdir, gharqa, menunggu, galat tidak. */
export const bisaDiringkas = (tampil: HasilTampil): boolean =>
  (tampil.jenis === 'biasa' || tampil.jenis === 'munasakhat') && tampil.hasil.status === 'OK';

export function ringkas(kasus: Kasus, tampil: HasilTampil): RingkasanHasil {
  if (tampil.jenis === 'biasa' && tampil.hasil.status === 'OK') return ringkasBiasa(kasus.graf, tampil.hasil);
  if (tampil.jenis === 'munasakhat' && tampil.hasil.status === 'OK') return ringkasMunasakhat(kasus.graf, tampil.hasil);
  if ((tampil.jenis === 'taqdir' || tampil.jenis === 'menunggu') && tampil.hasil.status === 'OK') return ringkasTaqdir(kasus, tampil.hasil, tampil.jenis);
  if (tampil.jenis === 'gharqa' && (tampil.hasil.status === 'OK' || tampil.hasil.status === 'MAUQUF')) return ringkasGharqa(kasus, tampil.hasil);
  throw new Error('ringkas hanya untuk hasil OK');
}

export type BentukPecahan = 'sederhana' | 'sama';

export function pecahanTeks(saham: bigint, penyebut: bigint, bentuk: BentukPecahan): string {
  if (bentuk === 'sama' || saham === 0n) return angka(`${saham}/${penyebut}`);
  const faktor = fpb(saham, penyebut);
  return angka(`${saham / faktor}/${penyebut / faktor}`);
}

/** Persen untuk tampilan saja (dua desimal, format Indonesia); bukan jalur hitung. */
export function persenTeks(saham: bigint, penyebut: bigint): string {
  const perSepuluhRibu = (saham * 10000n * 10n / penyebut + 5n) / 10n;   // dibulatkan ke 0,01%
  return `${(Number(perSepuluhRibu) / 100).toLocaleString(bahasaArab() ? 'ar-u-nu-arab' : 'id-ID', { maximumFractionDigits: 2 })}%`;
}

/** Kartu pembulatan hanya muncul bila pembagian dengan pembulatan Rp 1 masih menyisakan sisa (tidak habis dibagi). */
export function adaTidakPas(kasus: Kasus): boolean {
  const tampil = jalankan({ ...kasus, satuanPembulatan: 1n });
  if ((tampil.jenis !== 'biasa' && tampil.jenis !== 'munasakhat') || tampil.hasil.status !== 'OK') return false;
  return tampil.hasil.pembulatan.sisaPembulatan > 0n;
}

// [R09-9] pasangan tidak menerima radd; sisa ke dzawil arham [R14-3], bila tidak ada ke baitul mal [R02-1].
const TEKS_SISA_KELUAR = {
  dzawilArham: { judul: t('hitung.sisa_untuk_dzawil_arham'), keterangan: t('hitung.suami_istri_tidak_menerima_sisa') },
  baitulMal: { judul: t('hitung.sisa_dzawil_arham_baitul_mal'), keterangan: t('hitung.untuk_dzawil_arham_bila_ada_bila') },
  // [R09-8] kebijakan sisa ke baitul mal teratur (K09-1).
  baitulMalTeratur: { judul: t('hitung.sisa_untuk_baitul_mal'), keterangan: t('hitung.baitul_mal_teratur') },
} as const;

// ─── Kasus biasa ──────────────────────────────────────────────────────────────

// ─── Urutan tampil ───────────────────────────────────────────────────────────
// Sama di tabel faraidh, kartu pembagian, tebakan, dan daftar terhalang: fardh saja → fardh + sisa → ashabah;
// di dalamnya pasangan → ashl warits (leluhur) → far'u warits (keturunan) → hawasyi (saudara, paman, dst.).
const URUTAN_KELOMPOK: Record<Kelompok, number> = { pasangan: 0, leluhur: 1, keturunan: 2, saudara: 3 };
const golongan = (baris: { fardh?: unknown; ashabah?: unknown }) => (baris.fardh ? (baris.ashabah ? 1 : 0) : 2);

/** Baris tabel engine diurutkan untuk tampilan; isi (saham, sel) tidak diubah. */
export function urutkanBaris<T extends HasilOk['tabel']['baris'][number]>(daftar: T[], statusOrang: Record<IdOrang, StatusOrang>): T[] {
  const kelompokBaris = (baris: T) => URUTAN_KELOMPOK[kelompokDari(kunciDari(statusOrang[Object.keys(baris.perOrang)[0] ?? '']))];
  return [...daftar].sort((a, b) => golongan(a) - golongan(b) || kelompokBaris(a) - kelompokBaris(b));
}

const menurutKelompok = <T extends { kelompok: Kelompok }>(daftar: T[]): T[] =>
  [...daftar].sort((a, b) => URUTAN_KELOMPOK[a.kelompok] - URUTAN_KELOMPOK[b.kelompok]);

function ringkasBiasa(graf: GrafKeluarga, hasil: HasilOk): RingkasanHasil {
  const penyebut = penyebutAkhir(hasil.tabel);
  const alasanPerKelompok = new Map(hasil.jejak.flatMap(langkah => (langkah.jenis === 'FARDH' ? [[langkah.kelompok, langkah.alasan.kode] as const] : [])));
  const penerima = urutkanBaris(hasil.tabel.baris, hasil.statusOrang).flatMap(baris => Object.entries(baris.perOrang).map(([id, { saham, nominal }]): Penerima => {
    const kunci = kunciDari(hasil.statusOrang[id]);
    return {
      id, nama: namaOrang(graf, hasil.statusOrang, id), kunci, kelompok: kelompokDari(kunci), saham, nominal,
      keterangan: (baris.fardh ? t('hitung.bagian_tertentu_fardh', { fardh: angka(`${baris.fardh.n}/${baris.fardh.d}`) }) : adalahDzawilArham(hasil.statusOrang[id]) ? t('hitung.dzawil_arham') : t('hitung.sisa_ashabah')) + asalInduk(graf, hasil.statusOrang, id, kunci),
      ...(baris.fardh ? { fardh: { n: baris.fardh.n, d: baris.fardh.d } } : {}),
      ashabah: !!baris.ashabah,
      ...(alasanPerKelompok.has(baris.kelompok) ? { kodeAlasan: alasanPerKelompok.get(baris.kelompok)! } : {}),
    };
  }));
  return {
    jenis: 'biasa', penerima, penyebut,
    terhalang: menurutKelompok(daftarTerhalang(graf, hasil.statusOrang)),
    tirkah: langkahTirkah(hasil.jejak),
    sisaPembulatan: hasil.pembulatan.sisaPembulatan,
    daftarSisaKeluar: hasil.sisaKeluar
      ? [{ id: 'sisaKeluar', saham: hasil.sisaKeluar.saham, nominal: hasil.sisaKeluar.nominal, ...TEKS_SISA_KELUAR[hasil.sisaKeluar.tujuan] }] : [],
    tentang: tentangKasus(hasil.jejak),
    statusOrang: hasil.statusOrang,
  };
}

/** Cucu/keponakan/sepupu: " · dari Ahmad" supaya jelas dari cabang mana, termasuk induk yang sudah wafat. */
function asalInduk(graf: GrafKeluarga, statusOrang: Record<IdOrang, StatusOrang>, id: IdOrang, kunci: KunciAhliWaris | undefined): string {
  const idInduk = kunci && jenisDari(kunci)?.kunciInduk ? graf.orang[id]?.idAyah : undefined;
  if (!idInduk) return '';
  const induk = graf.orang[idInduk]!;
  return t('hitung.dari_nama', { nama: namaOrang(graf, statusOrang, idInduk) }) + (induk.penghubung || induk.statusHidup === 'wafat' ? t('hitung.sudah_wafat') : '');
}

// ─── Munasakhat ───────────────────────────────────────────────────────────────

function ringkasMunasakhat(graf: GrafKeluarga, hasil: HasilMunasakhatOk): RingkasanHasil {
  // Tiap orang dinamai dari mayit tempat ia pertama kali menjadi ahli waris (bukan "kerabat" mayit lain).
  const statusOrang = gabungStatus(hasil.daftarLangkah.map(langkah => langkah.hasil.statusOrang));
  const penerima = menurutKelompok(Object.entries(hasil.saham).filter(([, saham]) => saham > 0n).map(([id, saham]): Penerima => {
    const kunci = kunciDari(statusOrang[id]);
    return {
      id, nama: namaOrang(graf, statusOrang, id), kunci, kelompok: kelompokDari(kunci), saham,
      nominal: hasil.nominal[id] ?? 0n, keterangan: t('hitung.saham_dari_jamiah_saham_jami_ah', { saham, jamiah: hasil.jamiah }), ashabah: false,
    };
  }));
  // Terhalang di satu mas'alah tapi menerima dari mayit lain (mis. cucu dari harta kakek, anak dari harta ayahnya) bukan "tidak mendapat".
  const mayit = new Set(hasil.daftarLangkah.map(langkah => langkah.mayit));
  const terhalang = menurutKelompok(hasil.daftarLangkah.flatMap(({ hasil: hasilMayit }) => daftarTerhalang(graf, hasilMayit.statusOrang))
    .filter((orang, indeks, semua) => !((hasil.saham[orang.id] ?? 0n) > 0n) && !mayit.has(orang.id) && semua.findIndex(lain => lain.id === orang.id) === indeks));
  const pertama = hasil.daftarLangkah[0]!.hasil;
  return {
    jenis: 'munasakhat', penerima, terhalang, penyebut: hasil.jamiah,
    daftarSisaKeluar: hasil.sisaKeluar.map(sisa => ({
      id: `sisaKeluar:${sisa.mayit}`, saham: sisa.saham, nominal: sisa.nominal,
      judul: TEKS_SISA_KELUAR[sisa.tujuan].judul, keterangan: t('hitung.dari_nama', { nama: namaOrang(graf, statusOrang, sisa.mayit) }),
    })),
    tirkah: langkahTirkah(pertama.jejak),
    sisaPembulatan: hasil.pembulatan.sisaPembulatan,
    tentang: { ...tentangKasus(pertama.jejak), jamiah: hasil.jamiah },
    statusOrang,
  };
}

// ─── Taqdir dan menunggu kelahiran (13a–c) ────────────────────────────────────

type TaqdirOk = Extract<HasilTaqdir, { status: 'OK' }>;

// [R13-4] yang tetap di semua kemungkinan diberi sekarang (aqall); sisanya mauquf. Menunggu [R13-17]: angka sama, belum dibagi.
function ringkasTaqdir(kasus: Kasus, hasil: TaqdirOk, jenis: 'taqdir' | 'menunggu'): RingkasanHasil {
  const { graf } = kasus;
  const statusOrang = gabungStatus(hasil.daftarDunia.map(dunia => dunia.statusOrang));
  const orang = (id: IdOrang) => { const kunci = kunciDari(statusOrang[id]); return { id, nama: namaOrang(graf, statusOrang, id), kunci, kelompok: kelompokDari(kunci) }; };
  const penerima = menurutKelompok(Object.entries(hasil.diberikan).filter(([id, saham]) => saham > 0n && orangNyata(graf, id))
    .map(([id, saham]): Penerima => ({ ...orang(id), saham, nominal: hasil.nominal[id] ?? 0n, keterangan: '', ashabah: false })));
  const ditahan = orangDitahan(graf, hasil.daftarDunia, hasil.diberikan, hasil.jejak).map(({ id, sebab }) => ({ ...orang(id), sebab }));
  const tidakMenerima = new Set([...penerima, ...ditahan].map(o => o.id));
  if (!hasil.daftarDunia.length) throw new Error('invarian taqdir: tanpa kemungkinan');
  const diberikanTotal = penerima.map(o => o.saham).reduce((jumlah, saham) => jumlah + saham, 0n);
  return {
    jenis, penerima, penyebut: hasil.jamiah,
    // Terhalang hanya bila terhalang di semua kemungkinan.
    terhalang: menurutKelompok(daftarTerhalang(graf, hasil.daftarDunia[0]!.statusOrang).filter(o => !tidakMenerima.has(o.id)
      && hasil.daftarDunia.every(dunia => ['mahjub', 'mamnu'].includes(dunia.statusOrang[o.id]?.jenis ?? '')))),
    tirkah: langkahTirkah(hasil.jejak),
    sisaPembulatan: hasil.pembulatan.sisaPembulatan,
    daftarSisaKeluar: hasil.mauquf > 0n ? [{ id: 'mauquf', saham: hasil.mauquf, nominal: hasil.nominalMauquf, judul: t('hasil.ditahan.ditahan'), keterangan: '', ditahan: true }] : [],
    // Menunggu: belum ada yang diberikan atau ditahan, jadi tanpa hitungan (acuan: kasus Menunggu lahir).
    tentang: jenis === 'menunggu' ? {} : { kemungkinan: { jumlah: hasil.daftarDunia.length, jamiah: hasil.jamiah, diberikan: diberikanTotal, mauquf: hasil.mauquf } },
    statusOrang,
    ditahan: { nominal: hasil.nominalMauquf, orang: ditahan },
    taqdir: {
      daftarDunia: hasil.daftarDunia, diberikan: hasil.diberikan, mauquf: hasil.mauquf,
      sumber: Object.keys(hasil.daftarDunia[0]!.taqdir).filter(id => orangNyata(graf, id)).map(id => ({ id, nama: namaOrang(graf, statusOrang, id), jenis: jenisBelumPasti(graf, id) })),
    },
  };
}

const jenisBelumPasti = (graf: GrafKeluarga, id: IdOrang): JenisBelumPasti =>
  (graf.orang[id]?.statusHidup === 'dalamKandungan' ? 'haml' : graf.orang[id]?.statusHidup === 'mafqud' ? 'mafqud' : 'khuntsa');

/** Yang belum menerima apa pun padahal punya bagian di salah satu kemungkinan, ditambah sumber ketidakpastian itu sendiri. */
function orangDitahan(graf: GrafKeluarga, daftarDunia: DuniaTaqdir[], diberikan: Record<IdOrang, bigint>, jejak: LangkahJejak[]): Array<{ id: IdOrang; sebab: SebabDitahan }> {
  const alasan = new Map(jejak.flatMap(langkah => (langkah.jenis === 'TAQDIR_PEMBERIAN' ? [[langkah.idOrang, langkah.alasan] as const] : [])));
  const sumber = Object.keys(daftarDunia[0]?.taqdir ?? {});
  const punyaBagian = [...new Set(daftarDunia.flatMap(dunia => Object.keys(dunia.saham).filter(id => dunia.saham[id]! > 0n)))];
  // Sumber ketidakpastian selalu disebut (mis. khuntsa/mafqud yang sudah diberi aqall tetap menunggu sisanya).
  return [...new Set([...sumber, ...punyaBagian.filter(id => !((diberikan[id] ?? 0n) > 0n))])].filter(id => orangNyata(graf, id)).map(id => ({
    id,
    sebab: graf.orang[id]?.statusHidup === 'dalamKandungan' ? 'bayi' : graf.orang[id]?.statusHidup === 'mafqud' ? 'kabar'
      // [R13-15] [SYF] mitra ashabah haml tidak diberi apa pun (13a.4).
      : alasan.get(id) === 'kelasD' ? 'bersamaBayi' : 'kepastian',
  }));
}

// ─── Gharqa (13d) ─────────────────────────────────────────────────────────────

type GharqaSelesai = Extract<HasilGharqa, { status: 'OK' | 'MAUQUF' }>;

// [R13-10] tidak saling mewarisi: tiap harta dibagi sendiri; daftar memakai total per orang dengan rincian per harta.
// Keadaan 3 [SYF]: semua harta ditahan, tiap urutan yang mungkin hanya bahan musyawarah.
function ringkasGharqa(kasus: Kasus, hasil: GharqaSelesai): RingkasanHasil {
  const { graf } = kasus;
  const semuaHarta = hasil.status === 'OK' ? hasil.harta : hasil.skenario.flatMap(skenario => skenario.harta);
  const statusOrang = gabungStatus(semuaHarta.flatMap(harta => harta.daftarStatus.map(mas => mas.statusOrang)));
  const orang = (id: IdOrang) => { const kunci = kunciDari(statusOrang[id]); return { id, nama: namaOrang(graf, statusOrang, id), kunci, kelompok: kelompokDari(kunci) }; };
  const namaMayit = (id: IdOrang) => namaSingkat(kasus, id);
  const tirkahMayit = (id: IdOrang) => hitungTirkah(tirkahGharqa(kasus, id)).jejak;
  const susun = (harta: HartaGharqa): HartaRingkas => ({
    mayit: harta.mayit, nama: namaMayit(harta.mayit), bersih: tirkahMayit(harta.mayit).bersih, jamiah: harta.jamiah,
    saham: harta.saham, nominal: harta.nominal, nominalMauquf: harta.nominalMauquf,
  });
  const anggota = kasus.gharqa?.anggota ?? [];
  const tirkah = jumlahTirkah(anggota.map(tirkahMayit));
  const dasar = {
    jenis: 'gharqa' as const, statusOrang, tirkah, daftarSisaKeluar: [] as RingkasanHasil['daftarSisaKeluar'], tentang: {} as TentangKasus,
  };
  if (hasil.status === 'MAUQUF') {
    const skenario = hasil.skenario.map(({ urutan, harta }) => ({ urutan, harta: harta.map(susun) }));
    const ids = [...new Set(skenario.flatMap(sk => sk.harta.flatMap(h => Object.keys(h.nominal).filter(id => orangNyata(graf, id) && h.nominal[id]! > 0n))))];
    return {
      ...dasar, penerima: [], terhalang: [], penyebut: 1n, sisaPembulatan: 0n,
      ditahan: { nominal: tirkah.bersih, orang: menurutKelompok(ids.map(id => ({ ...orang(id), sebab: 'urutan' as const }))) },
      gharqa: { keadaan: kasus.gharqa!.keadaan, anggota, harta: [], skenario },
    };
  }
  const harta = hasil.harta.map(susun);
  const uang = (nilai: bigint) => formatRupiahRingkas(nilai);
  const penerima = menurutKelompok([...new Set(harta.flatMap(h => Object.keys(h.nominal)))].filter(id => orangNyata(graf, id)).flatMap((id): Penerima[] => {
    const dari = harta.filter(h => (h.saham[id] ?? 0n) > 0n);
    const nominal = dari.reduce((jumlah, h) => jumlah + (h.nominal[id] ?? 0n), 0n);
    if (!dari.length) return [];
    const [satu] = dari;
    return [{
      ...orang(id), saham: nominal, nominal, keterangan: '', ashabah: false,
      rincian: dari.length === 1 ? t('hasil.gharqa.pecahan_dari_harta', { pecahan: pecahanTeks(satu!.saham[id]!, satu!.jamiah, 'sederhana'), nama: satu!.nama })
        : dari.map(h => t('hasil.gharqa.rupiah_dari', { uang: uang(h.nominal[id] ?? 0n), nama: h.nama })).join(' + '),
    }];
  }));
  const terima = new Set(penerima.map(o => o.id));
  const nominalMauquf = harta.reduce((jumlah, h) => jumlah + h.nominalMauquf, 0n);
  const dibagi = penerima.reduce((jumlah, o) => jumlah + o.nominal, 0n);
  const daftarDunia = hasil.harta.flatMap(h => h.daftarDunia ?? []);
  const diberikan = Object.fromEntries(penerima.map(o => [o.id, harta.reduce((jumlah, h) => jumlah + (h.saham[o.id] ?? 0n), 0n)]));
  const jejakSemua = hasil.harta.flatMap(h => h.jejak);
  return {
    ...dasar, penerima, penyebut: tirkah.bersih > 0n ? tirkah.bersih : 1n,
    terhalang: menurutKelompok(harta.flatMap(h => daftarTerhalang(graf, statusOrangHarta(hasil.harta, h.mayit)))
      .filter((o, indeks, semua) => !terima.has(o.id) && semua.findIndex(lain => lain.id === o.id) === indeks)),
    sisaPembulatan: tirkah.bersih - dibagi - nominalMauquf,
    daftarSisaKeluar: nominalMauquf > 0n ? [{ id: 'mauquf', saham: nominalMauquf, nominal: nominalMauquf, judul: t('hasil.ditahan.ditahan'), keterangan: '', ditahan: true }] : [],
    tentang: { perHarta: harta.map(h => ({ nama: h.nama, jamiah: h.jamiah })) },
    ...(nominalMauquf > 0n ? { ditahan: { nominal: nominalMauquf, orang: orangDitahan(graf, daftarDunia, diberikan, jejakSemua).filter(o => !terima.has(o.id)).map(({ id, sebab }) => ({ ...orang(id), sebab })) } } : {}),
    gharqa: { keadaan: kasus.gharqa!.keadaan, anggota, harta },
  };
}

const TANPA_TIRKAH: InputTirkah = { kotor: 0n, tajhiz: 0n, hutang: 0n, wasiat: 0n };
/** Tirkah tiap anggota gharqa: pewaris dari isian utama, anggota lain dari isian gharqa (tanpa isian = 0, sama dengan jalankan). */
export const tirkahGharqa = (kasus: Kasus, mayit: IdOrang): InputTirkah =>
  (mayit === kasus.graf.idPewaris ? kasus.tirkah : kasus.gharqa?.tirkah[mayit] ?? TANPA_TIRKAH);

function jumlahTirkah(daftar: LangkahTirkah[]): LangkahTirkah {
  const [pertama, ...lain] = daftar;
  if (!pertama) throw new Error('invarian gharqa: tanpa anggota');
  const BIDANG = ['kotor', 'tajhiz', 'hutang', 'wasiatDiminta', 'wasiatBatas', 'wasiatDipakai', 'wasiatButuhIjazah', 'bersih'] as const;
  return lain.reduce((jumlah, satu) => ({ ...jumlah, ...Object.fromEntries(BIDANG.map(bidang => [bidang, jumlah[bidang] + satu[bidang]])) }), pertama!);
}

const statusOrangHarta = (daftarHarta: HartaGharqa[], mayit: IdOrang) => daftarHarta.find(h => h.mayit === mayit)?.daftarStatus[0]?.statusOrang ?? {};

// ─── Bantuan ──────────────────────────────────────────────────────────────────

/** Status gabungan beberapa mas'alah: yang pernah jadi ahli waris memakai status ahli warisnya. */
function gabungStatus(daftar: Array<Record<IdOrang, StatusOrang>>): Record<IdOrang, StatusOrang> {
  const statusOrang: Record<IdOrang, StatusOrang> = {};
  for (const satu of daftar) {
    for (const [id, status] of Object.entries(satu)) {
      if (!statusOrang[id] || (statusOrang[id]!.jenis !== 'ahliWaris' && status.jenis === 'ahliWaris')) statusOrang[id] = status;
    }
  }
  return statusOrang;
}

const orangNyata = (graf: GrafKeluarga, id: IdOrang): boolean => !!graf.orang[id] && !graf.orang[id]!.penghubung;

function tentangKasus(jejak: LangkahJejak[]): TentangKasus {
  const tentang: TentangKasus = {};
  const kelas = jejak.find(langkah => langkah.jenis === 'KELAS_MASALAH');
  if (kelas?.jenis === 'KELAS_MASALAH') tentang.kelas = kelas.kelas;
  const nisbahAshl = jejak.filter((langkah): langkah is Extract<LangkahJejak, { jenis: 'PERBANDINGAN_NISAB' }> =>
    langkah.jenis === 'PERBANDINGAN_NISAB' && langkah.tujuan === 'ashl');
  const terakhir = nisbahAshl.at(-1);
  if (terakhir) {
    tentang.ashl = { nilai: terakhir.hasil, hubungan: terakhir.hubungan, penyebut: [nisbahAshl[0]!.a, ...nisbahAshl.map(langkah => langkah.b)] };
  } else if (kelas?.jenis === 'KELAS_MASALAH') {
    tentang.ashl = { nilai: kelas.ashl, penyebut: [kelas.ashl] };
  }
  const aul = jejak.find(langkah => langkah.jenis === 'AUL');
  if (aul?.jenis === 'AUL') tentang.aul = { dari: aul.dari, menjadi: aul.menjadi };
  const tashih = jejak.find(langkah => langkah.jenis === 'TASHIH');
  if (tashih?.jenis === 'TASHIH') {
    const inkisar = jejak.find(langkah => langkah.jenis === 'PERBANDINGAN_NISAB' && langkah.tujuan === 'inkisar');
    tentang.tashih = { dari: tashih.dasar, jadi: tashih.hasil, ...(inkisar?.jenis === 'PERBANDINGAN_NISAB' ? { hubungan: inkisar.hubungan } : {}) };
  }
  return tentang;
}

function langkahTirkah(jejak: LangkahJejak[]): LangkahTirkah {
  const langkah = jejak.find((langkahIni): langkahIni is LangkahTirkah => langkahIni.jenis === 'TIRKAH');
  if (!langkah) throw new Error('jejak engine tanpa langkah TIRKAH');
  return langkah;
}

function daftarTerhalang(graf: GrafKeluarga, statusOrang: Record<IdOrang, StatusOrang>): Terhalang[] {
  return Object.entries(statusOrang).flatMap(([id, status]): Terhalang[] => {
    if (graf.orang[id]?.penghubung || (status.jenis !== 'mahjub' && status.jenis !== 'mamnu')) return [];
    const kunci = kunciDari(status);
    const alasan = status.jenis === 'mahjub'
      ? t('hitung.terhalang_oleh_oleh', { oleh: status.oleh.map(idLain => namaOrang(graf, statusOrang, idLain)).join(t('umum.dan')) })
      : t('hitung.tidak_mewarisi_karena_alasan', { alasan: ALASAN_MANI[status.mani] });
    return [{ id, nama: namaOrang(graf, statusOrang, id), kunci, kelompok: kelompokDari(kunci), alasan }];
  });
}

const ALASAN_MANI: Record<Extract<StatusOrang, { jenis: 'mamnu' }>['mani'], string> = {
  qatl: t('hitung.terlibat_dalam_penyebab_kematian_almarhum'), ikhtilafDin: t('hitung.berbeda_agama_dengan_almarhum'), riqq: t('hitung.berstatus_budak'),
  istibham: t('hitung.urutan_wafatnya_tidak_diketahui'), daur: t('hitung.akan_menimbulkan_hitungan_berputar_daur'),
};

/** Bab 14 vs bab 5: baris tabel tanpa fardh bisa ashabah (bab 5) atau dzawil arham (bab 14); yang membedakan hanya peran di statusOrang. */
export const adalahDzawilArham = (status: StatusOrang | undefined): boolean =>
  status?.jenis === 'ahliWaris' && status.peran.kunci === 'DZAWIL_ARHAM';

export function kunciDari(status: StatusOrang | undefined): KunciAhliWaris | undefined {
  if (!status || !('peran' in status)) return undefined;
  const kunci = status.peran.kunci;
  return kunci === 'DZAWIL_ARHAM' || kunci === 'BUKAN_AHLI_WARIS' ? undefined : kunci;
}

const kelompokDari = (kunci: KunciAhliWaris | undefined): Kelompok => (kunci && jenisDari(kunci)?.kelompok) || 'saudara';
