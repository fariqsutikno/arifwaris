// Paket soal pilihan ganda kiriman (docs/soal-kit/format-soal.md): kepala paket, lalu deretan blok `soal` yang sama
// dengan blok soal materi, ditambah isian untuk pemeriksa (topik, kasus, harapan). Bagian ini tanpa engine: sintaks,
// rujukan KB, istilah, kode soal, dan gaya pilihan. Topik dan angka kasus dicocokkan engine oleh periksaAngkaPaketSoal (@waris/latihan).
import { bacaBlokBerbaris, bacaDaftarAhliWaris, bacaHarapan, POLA_KODE_SOAL_PAKET, semuaPotongan, type ContohKasus, type SoalMateri } from './materi.js';
import { KATA_TIDAK_BAKU, periksaRujukanBlok, periksaSatuPotongan, periksaTeksMentah, teksPolos, type KonteksPeriksa, type Lapor, type Temuan } from './periksaMateri.js';

/** Kasus satu soal: kode bank generator, atau pewaris + ahli waris. `harapan` = saham akhir yang dicocokkan engine. */
export interface KasusPaket { kodeBank?: string; pewaris?: 'L' | 'P'; ahliWaris?: string[]; harapan?: ContohKasus['harapan'] }

export interface ButirPaket {
  soal: SoalMateri;
  rujukan: string[];
  baris: number;
  /** Token label bank soal (labelSoal.ts); dicek engine terhadap kasus bila ada. */
  topik: string[];
  kasus?: KasusPaket;
  /** Alasan soal menyebut angka tanpa kasus engine (mis. wasiat 1/3); tampil sebagai peringatan. */
  tanpaKasus?: string;
}

export interface PaketSoal { paket: string; modul: number; sumber: string; butir: ButirPaket[] }

export type HasilPeriksaPaket = { terbaca: true; paket: PaketSoal; temuan: Temuan[] } | { terbaca: false; temuan: Temuan[] };

const MODUL_MAKS = 15;
const ISIAN_PAKET = ['topik', 'pewaris', 'ahli waris', 'kode-bank', 'harapan', 'tanpa-kasus'] as const;
const POLA_ANGKA = /\d+\/\d+|\bashl\b|\bsaham\b/i;
const FRASA_SEMUA = ['semua benar', 'semua salah', 'semua jawaban', 'jawaban di atas', 'tidak ada yang benar'];
/** Pilihan benar yang lebih panjang dari rasio ini terhadap rata-rata pilihan salah menjadi petunjuk jawaban. */
const RASIO_PANJANG_PETUNJUK = 1.6;
const MIN_SOAL_UNTUK_SEBARAN = 4;

/** Melempar Error `berkas:baris: pesan` seperti bacaPelajaran. */
export function bacaPaketSoal(teks: string, namaBerkas = 'paket'): PaketSoal {
  const daftarBaris = teks.replace(/\r\n/g, '\n').split('\n');
  const galat = (nomor: number, pesan: string) => new Error(`${namaBerkas}:${nomor}: ${pesan}`);
  if (daftarBaris[0]?.trim() !== '---') throw galat(1, 'berkas harus diawali kepala "---"');
  const akhir = daftarBaris.indexOf('---', 1);
  if (akhir < 0) throw galat(1, 'kepala berkas tidak ditutup "---"');
  const kepala = new Map<string, string>();
  daftarBaris.slice(1, akhir).forEach((baris, i) => {
    if (baris.trim() === '') return;
    const cocok = /^([a-z]+):\s*(.*)$/.exec(baris.trim());
    if (!cocok) throw galat(i + 2, `baris kepala "${baris}" bukan "kunci: nilai"`);
    kepala.set(cocok[1]!, cocok[2]!);
  });
  const wajib = (kunci: string) => {
    const nilai = kepala.get(kunci);
    if (!nilai) throw galat(1, `kepala berkas butuh "${kunci}"`);
    return nilai;
  };
  const modul = Number(wajib('modul'));
  if (!Number.isInteger(modul) || modul < 1 || modul > MODUL_MAKS) throw galat(1, `"modul" harus angka 1–${MODUL_MAKS}`);

  const butir: ButirPaket[] = [];
  for (let indeks = akhir + 1; indeks < daftarBaris.length; indeks++) {
    if (daftarBaris[indeks]!.trim() === '') continue;
    if (daftarBaris[indeks]!.trim() !== '```soal') throw galat(indeks + 1, 'di luar kepala, berkas hanya berisi blok ```soal');
    const awal = indeks;
    const penutup = daftarBaris.findIndex((baris, i) => i > awal && baris.startsWith('```'));
    if (penutup < 0) throw galat(awal + 1, 'blok soal tidak ditutup ```');
    butir.push(bacaButir(namaBerkas, daftarBaris.slice(awal, penutup + 1), awal + 1, galat));
    indeks = penutup;
  }
  if (!butir.length) throw galat(1, 'paket tanpa soal');
  return { paket: wajib('paket'), modul, sumber: wajib('sumber'), butir };
}

/** Isian pemeriksa dilepas (diganti baris kosong supaya nomor baris tetap benar); sisanya dibaca bacaSoal. */
function bacaButir(namaBerkas: string, barisBlok: string[], nomorPagar: number, galat: (nomor: number, pesan: string) => Error): ButirPaket {
  const isian = new Map<string, string>();
  const bersih = barisBlok.map((teks, i) => {
    const cocok = /^([a-z][a-z-]*(?: [a-z]+)?):\s*(.*)$/.exec(teks.trim());
    if (!cocok || !(ISIAN_PAKET as readonly string[]).includes(cocok[1]!)) return teks;
    if (isian.has(cocok[1]!)) throw galat(nomorPagar + i, `"${cocok[1]}" ditulis dua kali`);
    isian.set(cocok[1]!, cocok[2]!.trim());
    return '';
  });
  const { blok } = bacaBlokBerbaris(namaBerkas, bersih.join('\n'), nomorPagar);
  const soal = blok[0];
  if (soal?.jenis !== 'soal') throw galat(nomorPagar, 'blok soal tidak terbaca');
  const topik = (isian.get('topik') ?? '').split(',').map(isi => isi.trim()).filter(Boolean);
  if (!topik.length) throw galat(nomorPagar, `soal ${soal.soal.kode} butuh "topik"`);

  const kasus = bacaKasus(isian, nomorPagar, galat);
  return { soal: soal.soal, rujukan: soal.rujukan, baris: nomorPagar, topik, ...(kasus ? { kasus } : {}), ...(isian.has('tanpa-kasus') ? { tanpaKasus: isian.get('tanpa-kasus')! } : {}) };
}

function bacaKasus(isian: Map<string, string>, nomor: number, galat: (nomor: number, pesan: string) => Error): KasusPaket | undefined {
  const kodeBank = isian.get('kode-bank');
  const pewaris = isian.get('pewaris');
  const ahliWaris = isian.get('ahli waris');
  const harapan = isian.get('harapan');
  if (!kodeBank && !pewaris && !ahliWaris) {
    if (harapan) throw galat(nomor, '"harapan" butuh kasus ("kode-bank" atau "pewaris" + "ahli waris")');
    return undefined;
  }
  if (isian.has('tanpa-kasus')) throw galat(nomor, '"tanpa-kasus" tidak boleh bersama kasus');
  if (kodeBank && (pewaris || ahliWaris)) throw galat(nomor, 'pilih "kode-bank" atau "pewaris" + "ahli waris", bukan keduanya');
  const salah = (pesan: string) => galat(nomor, pesan);
  if (kodeBank) return { kodeBank, ...(harapan ? { harapan: bacaHarapan(harapan, salah) } : {}) };
  if (pewaris !== 'L' && pewaris !== 'P') throw galat(nomor, '"pewaris" harus L atau P');
  if (!ahliWaris) throw galat(nomor, 'kasus butuh "ahli waris"');
  return { pewaris, ahliWaris: bacaDaftarAhliWaris(ahliWaris, salah), ...(harapan ? { harapan: bacaHarapan(harapan, salah) } : {}) };
}

export function periksaPaketSoal(teks: string, namaBerkas: string, konteks: KonteksPeriksa): HasilPeriksaPaket {
  let paket: PaketSoal;
  try {
    paket = bacaPaketSoal(teks, namaBerkas);
  } catch (kesalahan) {
    const pesan = (kesalahan as Error).message;
    const [, baris = '1', isi = pesan] = /^[^:]+:(\d+): (.*)$/s.exec(pesan) ?? [];
    return { terbaca: false, temuan: [{ tingkat: 'galat', baris: Number(baris), pesan: isi }] };
  }
  const temuan: Temuan[] = [];
  const galat: Lapor = (baris, pesan) => temuan.push({ tingkat: 'galat', baris, pesan });
  const peringatan: Lapor = (baris, pesan) => temuan.push({ tingkat: 'peringatan', baris, pesan });

  const namaDasar = namaBerkas.split('/').at(-1)!.replace(/\.md$/, '');
  if (namaDasar !== paket.paket) galat(1, `paket "${paket.paket}" tidak sama dengan nama berkas "${namaDasar}"`);
  const kodeDilihat = new Set<string>();
  for (const butir of paket.butir) periksaButir(butir, paket, konteks, kodeDilihat, galat, peringatan);
  periksaSebaranJawaban(paket, peringatan);
  periksaTeksMentah(teks, galat, peringatan);
  return { terbaca: true, paket, temuan };
}

function periksaButir(butir: ButirPaket, paket: PaketSoal, konteks: KonteksPeriksa, kodeDilihat: Set<string>, galat: Lapor, peringatan: Lapor) {
  const { soal, baris } = butir;
  if (!POLA_KODE_SOAL_PAKET.test(soal.kode)) galat(baris, `kode ${soal.kode} harus P-<modul 2 angka>-<nomor 3 angka>, mis. P-05-001`);
  else if (Number(soal.kode.slice(2, 4)) !== paket.modul) galat(baris, `kode ${soal.kode} tidak sama dengan modul ${paket.modul} di kepala`);
  if (kodeDilihat.has(soal.kode)) galat(baris, `kode ${soal.kode} dipakai dua kali di berkas ini`);
  kodeDilihat.add(soal.kode);

  const blok = { jenis: 'soal', soal, rujukan: butir.rujukan } as const;
  for (const potongan of semuaPotongan([blok])) {
    if (potongan.jenis === 'tautanBagian') galat(baris, `soal ${soal.kode}: tautan [[#${potongan.bagian}]] tidak berlaku di paket soal; pakai [[>slug#bagian]]`);
    else periksaSatuPotongan(potongan, baris, new Set(), konteks, galat);
  }
  periksaRujukanBlok([blok], [baris], galat);

  const teksSoal = teksPolos([...soal.pertanyaan, ...soal.pilihan.flat(), ...soal.alasanPilihan.flat(), ...soal.pembahasan]);
  if (POLA_ANGKA.test(teksSoal) && !butir.kasus) {
    if (butir.tanpaKasus) peringatan(baris, `soal ${soal.kode}: angka tidak diperiksa engine (${butir.tanpaKasus})`);
    else galat(baris, `soal ${soal.kode} menyebut angka bagian tetapi tanpa kasus; tambahkan "pewaris" + "ahli waris" + "harapan" (atau "kode-bank"), atau "tanpa-kasus: alasan"`);
  }
  periksaGayaSoal(butir, teksSoal, galat, peringatan);
}

function periksaGayaSoal(butir: ButirPaket, teksSoal: string, galat: Lapor, peringatan: Lapor) {
  const { soal, baris } = butir;
  const kecil = teksSoal.toLowerCase();
  for (const frasa of FRASA_SEMUA) if (kecil.includes(frasa)) galat(baris, `soal ${soal.kode}: pilihan "${frasa}" tidak dipakai`);
  for (const kata of KATA_TIDAK_BAKU) if (new RegExp(`\\b${kata}\\b`).test(kecil)) peringatan(baris, `soal ${soal.kode}: kata tidak baku "${kata}"`);
  const panjang = soal.pilihan.map(pilihan => teksPolos(pilihan).length);
  const salah = panjang.filter((_, i) => i !== soal.indeksBenar);
  const rataSalah = salah.reduce((jumlah, nilai) => jumlah + nilai, 0) / salah.length;
  if (panjang[soal.indeksBenar]! > rataSalah * RASIO_PANJANG_PETUNJUK) peringatan(baris, `soal ${soal.kode}: pilihan benar jauh lebih panjang dari pilihan lain (petunjuk jawaban)`);
}

function periksaSebaranJawaban(paket: PaketSoal, peringatan: Lapor) {
  if (paket.butir.length < MIN_SOAL_UNTUK_SEBARAN) return;
  if (new Set(paket.butir.map(butir => butir.soal.indeksBenar)).size === 1) peringatan(1, 'semua soal berjawaban benar di urutan yang sama; acak letak jawaban');
}

/** Kode soal paket yang dipakai lebih dari satu berkas (berkas yang sama sudah dicek per paket). */
export function kodeSoalPaketGanda(daftar: { namaBerkas: string; paket: PaketSoal }[]): { kode: string; berkas: string[] }[] {
  const pemakai = new Map<string, string[]>();
  for (const { namaBerkas, paket } of daftar) {
    for (const kode of new Set(paket.butir.map(butir => butir.soal.kode))) pemakai.set(kode, [...(pemakai.get(kode) ?? []), namaBerkas]);
  }
  return [...pemakai].filter(([, berkas]) => berkas.length > 1).map(([kode, berkas]) => ({ kode, berkas }));
}
