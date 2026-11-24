// Penilai sisi server (spec 2.6): menerima kiriman mentah klien (hanya isian dan klik pelajar), memeriksa bentuknya,
// menyusun tabel sendiri dari soal, memeriksa isian terhadap tabel itu, lalu menilai. Murni: soal, versi engine, dan
// hash kunci disuntik pemanggil (edge function `catat-percobaan` yang mengurus identitas, basis data, urutan, dan laju).
// Tidak ada koreksi diam-diam: kiriman yang melanggar ditolak utuh dengan kode galat.

import type { KasusSoal } from '@waris/content';
import type { Ruleset } from '@waris/engine';
import { angkaLatin } from './angka.js';
import { jalankan, jenisSoalDari } from './jalankan.js';
import { kasusDariSoal } from './soal.js';
import type { IsianGharqa, JenisSoal, ModeSoal } from './kejadian.js';
import { calonJangkar } from './tabel/jangkar.js';
import type { HasilKolom, IsianTabel, Jangkar, TabelSoal } from './tabel/model.js';
import { nilaiSemuaKolom } from './tabel/nilai.js';
import { susunTabelSoal } from './tabel/susun.js';
import { susunSoalGharqa, type KeputusanGharqa, type SoalGharqa } from './tabel/susunGharqa.js';

export const UKURAN_BADAN_MAKS_BAYT = 32_000;
const PANJANG_ISIAN_MAKS = 40;
const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POLA_SOAL_KURASI = /^[A-Za-z0-9-]{1,40}$/;
const POLA_SOAL_POLA = /^[a-z0-9-]{1,60}@\d{1,4}#\d{1,10}$/;
const POLA_BULAT = /^\d{0,6}$/;
const AKSI_SAH = ['buka', 'periksa', 'kirim', 'lihatJawaban', 'petunjuk', 'bukaKolom'] as const;
const MODE_SAH = ['latihan', 'ujian'] as const;
const KUNCI_SAH = ['id', 'idSesiSoal', 'soalId', 'revisiSoal', 'mode', 'aksi', 'isian', 'jangkar', 'gharqa', 'bantuan', 'dimulaiPada'];
const KEPUTUSAN_SAH: readonly KeputusanGharqa[] = ['terakhirMewarisi', 'tidakSalingMewarisi', 'ditahan'];
const HARTA_GHARQA_MAKS = 10;
const PANJANG_ID_ORANG_MAKS = 60;

export type AksiKiriman = (typeof AKSI_SAH)[number];
export interface Kiriman {
  id: string; idSesiSoal: string; soalId: string; revisiSoal: string;
  mode: ModeSoal; aksi: AksiKiriman; isian: IsianTabel | null; jangkar: Jangkar | null; gharqa: IsianGharqa | null;
  /** Hanya aksi petunjuk dan bukaKolom (tangga bantuan, mode latihan). */
  bantuan: BantuanKiriman | null; dimulaiPada: string | null;
}
/** `tingkat` hanya untuk petunjuk. `idKolom` = id kolom tabel, atau `pengali` untuk baris pengali munasakhat. */
export interface BantuanKiriman { idKolom: string; tingkat?: 1 | 2 }
const AKSI_BANTUAN: readonly AksiKiriman[] = ['petunjuk', 'bukaKolom'];
const PANJANG_ID_KOLOM_MAKS = 60;
export type GalatKiriman = { status: 400 | 409; kode: string };
export type HasilCatat<T> = ({ ok: true } & T) | ({ ok: false } & GalatKiriman);
const tolak = (kode: string): { ok: false } & GalatKiriman => ({ ok: false, status: 400, kode });

const adalahObjek = (nilai: unknown): nilai is Record<string, unknown> => typeof nilai === 'object' && nilai !== null && !Array.isArray(nilai);
const adalahTeks = (nilai: unknown, pola: RegExp): nilai is string => typeof nilai === 'string' && pola.test(nilai);

/** Bentuk saja (spec 2.6 butir 2); isi isian diperiksa terhadap tabel di `nilaiKiriman`. */
export function bacaKiriman(mentah: unknown, ukuranBadan: number): HasilCatat<{ kiriman: Kiriman }> {
  if (ukuranBadan > UKURAN_BADAN_MAKS_BAYT) return tolak('BADAN_TERLALU_BESAR');
  if (!adalahObjek(mentah)) return tolak('BENTUK_TIDAK_SAH');
  if ('user_id' in mentah || 'userId' in mentah) return tolak('USER_ID_DILARANG');
  if (Object.keys(mentah).some(kunci => !KUNCI_SAH.includes(kunci))) return tolak('KUNCI_TIDAK_DIKENAL');
  const { id, idSesiSoal, revisiSoal, soalId, mode, aksi, isian, jangkar, gharqa, bantuan, dimulaiPada } = mentah;
  if (!adalahTeks(id, POLA_UUID) || !adalahTeks(idSesiSoal, POLA_UUID) || !adalahTeks(revisiSoal, POLA_UUID)) return tolak('ID_TIDAK_SAH');
  if (typeof soalId !== 'string' || !(POLA_SOAL_KURASI.test(soalId) || POLA_SOAL_POLA.test(soalId))) return tolak('SOAL_ID_TIDAK_SAH');
  if (!MODE_SAH.includes(mode as ModeSoal)) return tolak('MODE_TIDAK_SAH');
  if (!AKSI_SAH.includes(aksi as AksiKiriman)) return tolak('AKSI_TIDAK_SAH');
  if (dimulaiPada !== undefined && dimulaiPada !== null && (typeof dimulaiPada !== 'string' || Number.isNaN(Date.parse(dimulaiPada)))) return tolak('WAKTU_TIDAK_SAH');
  const isianSah = bacaIsian(isian);
  const jangkarSah = bacaJangkar(jangkar);
  const gharqaSah = bacaGharqa(gharqa);
  if (!isianSah.ok) return isianSah;
  if (!jangkarSah.ok) return jangkarSah;
  if (!gharqaSah.ok) return gharqaSah;
  const bantuanSah = bacaBantuan(bantuan, aksi as AksiKiriman, mode as ModeSoal);
  if (!bantuanSah.ok) return bantuanSah;
  // Gharqa menggantikan isian/jangkar tunggal; keduanya tidak boleh sekaligus.
  if (gharqaSah.nilai && (isianSah.nilai !== null || jangkarSah.nilai !== null)) return tolak('GHARQA_DAN_ISIAN');
  const adaIsian = isianSah.nilai !== null || gharqaSah.nilai !== null;
  // `buka` tidak membawa isian; periksa dan kirim wajib; lihatJawaban boleh tanpa.
  if ((aksi === 'buka' || AKSI_BANTUAN.includes(aksi as AksiKiriman)) && (adaIsian || jangkarSah.nilai !== null)) return tolak('BUKA_TANPA_ISIAN');
  if ((aksi === 'periksa' || aksi === 'kirim') && !adaIsian) return tolak('ISIAN_WAJIB');
  return { ok: true, kiriman: { id, idSesiSoal, soalId, revisiSoal, mode: mode as ModeSoal, aksi: aksi as AksiKiriman,
    isian: isianSah.nilai, jangkar: jangkarSah.nilai, gharqa: gharqaSah.nilai, bantuan: bantuanSah.nilai, dimulaiPada: (dimulaiPada as string | null | undefined) ?? null } };
}

/** Bantuan wajib untuk petunjuk (dengan tingkat 1|2) dan bukaKolom (tanpa tingkat), terlarang untuk aksi lain; hanya mode latihan. */
function bacaBantuan(mentah: unknown, aksi: AksiKiriman, mode: ModeSoal): HasilCatat<{ nilai: BantuanKiriman | null }> {
  const butuh = AKSI_BANTUAN.includes(aksi);
  if (mentah === undefined || mentah === null) return butuh ? tolak('BANTUAN_WAJIB') : { ok: true, nilai: null };
  if (!butuh) return tolak('BANTUAN_TIDAK_SESUAI_AKSI');
  if (mode !== 'latihan') return tolak('BANTUAN_HANYA_LATIHAN');
  if (!adalahObjek(mentah) || typeof mentah.idKolom !== 'string' || mentah.idKolom === '' || mentah.idKolom.length > PANJANG_ID_KOLOM_MAKS) return tolak('BANTUAN_TIDAK_SAH');
  const { tingkat, ...lain } = mentah;
  if (Object.keys(lain).length !== 1) return tolak('BANTUAN_TIDAK_SAH');
  if (aksi === 'bukaKolom') return tingkat === undefined ? { ok: true, nilai: { idKolom: mentah.idKolom } } : tolak('BANTUAN_TIDAK_SAH');
  return tingkat === 1 || tingkat === 2 ? { ok: true, nilai: { idKolom: mentah.idKolom, tingkat } } : tolak('BANTUAN_TIDAK_SAH');
}

function bacaIsian(mentah: unknown): HasilCatat<{ nilai: IsianTabel | null }> {
  if (mentah === undefined || mentah === null) return { ok: true, nilai: null };
  if (!adalahObjek(mentah) || Object.keys(mentah).some(kunci => !['kepala', 'sel', 'pengali'].includes(kunci))) return tolak('ISIAN_TIDAK_SAH');
  const { kepala, sel, pengali } = mentah;
  const petaTeks = (nilai: unknown): nilai is Record<string, string> =>
    adalahObjek(nilai) && Object.values(nilai).every(teks => typeof teks === 'string' && teks.length <= PANJANG_ISIAN_MAKS);
  if (!petaTeks(kepala) || !adalahObjek(sel) || !Object.values(sel).every(petaTeks)) return tolak('ISIAN_TIDAK_SAH');
  if (pengali !== undefined && !petaTeks(pengali)) return tolak('ISIAN_TIDAK_SAH');
  return { ok: true, nilai: { kepala, sel: sel as Record<string, Record<string, string>>, ...(pengali ? { pengali } : {}) } };
}

function bacaGharqa(mentah: unknown): HasilCatat<{ nilai: IsianGharqa | null }> {
  if (mentah === undefined || mentah === null) return { ok: true, nilai: null };
  if (!adalahObjek(mentah) || Object.keys(mentah).length !== 2 || !KEPUTUSAN_SAH.includes(mentah.keputusan as KeputusanGharqa)
    || !Array.isArray(mentah.harta) || mentah.harta.length > HARTA_GHARQA_MAKS) return tolak('GHARQA_TIDAK_SAH');
  const harta: IsianGharqa['harta'] = [];
  for (const butir of mentah.harta as unknown[]) {
    if (!adalahObjek(butir) || Object.keys(butir).length !== 3 || typeof butir.mayit !== 'string' || butir.mayit.length > PANJANG_ID_ORANG_MAKS
      || harta.some(sudah => sudah.mayit === butir.mayit)) return tolak('GHARQA_TIDAK_SAH');
    const isian = bacaIsian(butir.isian);
    const jangkar = bacaJangkar(butir.jangkar);
    if (!isian.ok) return isian;
    if (!jangkar.ok) return jangkar;
    if (isian.nilai === null) return tolak('GHARQA_TIDAK_SAH');
    harta.push({ mayit: butir.mayit, isian: isian.nilai, jangkar: jangkar.nilai });
  }
  return { ok: true, nilai: { keputusan: mentah.keputusan as KeputusanGharqa, harta } };
}

function bacaJangkar(mentah: unknown): HasilCatat<{ nilai: Jangkar | null }> {
  if (mentah === undefined || mentah === null) return { ok: true, nilai: null };
  if (!adalahObjek(mentah) || typeof mentah.idBaris !== 'string' || typeof mentah.idKolom !== 'string'
    || Object.keys(mentah).length !== 2) return tolak('JANGKAR_TIDAK_SAH');
  return { ok: true, nilai: { idBaris: mentah.idBaris, idKolom: mentah.idKolom } };
}

export interface SoalDimuat { kasus: KasusSoal; revisiId: string }
export interface Penilaian {
  jenisSoal: JenisSoal;
  ruleset: Ruleset;
  /** Satu tabel untuk soal biasa; satu per harta untuk gharqa (urutan soal). */
  daftarTabel: TabelSoal[];
  /** Hanya gharqa: keputusan yang benar; ikut membentuk `versi.kunci`. */
  keputusanSoal: KeputusanGharqa | null;
  /** null untuk buka, petunjuk, bukaKolom, dan lihatJawaban tanpa isian. */
  hasilKolom: HasilKolom[] | null;
  benarSemua: boolean;
}

/** Spec 2.6 butir 3 dan 5: tabel disusun server, isian diperiksa terhadapnya, lalu dinilai. */
export function nilaiKiriman(kiriman: Kiriman, soal: SoalDimuat, versiEngine: string): HasilCatat<{ penilaian: Penilaian }> {
  let kasus;
  try { kasus = kasusDariSoal(soal.kasus); } catch { return tolak('SOAL_TIDAK_DIDUKUNG'); }
  const tampil = jalankan(kasus, versiEngine);
  if (tampil.jenis === 'galat' || tampil.jenis === 'menunggu') return tolak('SOAL_TIDAK_DIDUKUNG');
  const namaDari = (id: string) => kasus.graf.orang[id]?.nama ?? id;
  const ruleset = kasus.madzhab ?? 'syafii';
  if (tampil.jenis === 'gharqa') {
    const soalGharqa = susunSoalGharqa(tampil.hasil, namaDari);
    return 'status' in soalGharqa ? tolak('SOAL_TIDAK_DIDUKUNG') : nilaiGharqa(kiriman, soalGharqa, ruleset);
  }
  if (kiriman.gharqa) return tolak('GHARQA_BUKAN_SOAL_INI');
  const susunan = susunTabelSoal(tampil.hasil, namaDari);
  if ('status' in susunan) return tolak('SOAL_TIDAK_DIDUKUNG');
  const jenisSoal = jenisSoalDari(kasus, tampil);
  const dasar = { jenisSoal, ruleset, daftarTabel: [susunan], keputusanSoal: null };
  if (kiriman.bantuan && !kolomAda([susunan], kiriman.bantuan.idKolom)) return tolak('KOLOM_TIDAK_ADA');
  if (kiriman.aksi === 'buka' || kiriman.bantuan || (kiriman.aksi === 'lihatJawaban' && kiriman.isian === null))
    return { ok: true, penilaian: { ...dasar, hasilKolom: null, benarSemua: false } };
  const isian = kiriman.isian!;
  const galat = periksaIsian(susunan, isian, kiriman.jangkar);
  if (galat) return tolak(galat);
  const hasilKolom = nilaiSemuaKolom(susunan, isian, kiriman.jangkar);
  return { ok: true, penilaian: { ...dasar, hasilKolom, benarSemua: hasilKolom.every(kolom => kolom.status === 'benar') } };
}

/** [B7] keputusan dinilai dulu; tabel harta baru dihitung bila keputusan benar. benarSemua = keputusan benar dan SEMUA harta terkirim dan benar. */
function nilaiGharqa(kiriman: Kiriman, soal: SoalGharqa, ruleset: Ruleset): HasilCatat<{ penilaian: Penilaian }> {
  const dasar = { jenisSoal: 'gharqa' as const, ruleset, daftarTabel: soal.harta.map(harta => harta.tabel), keputusanSoal: soal.keputusan };
  if (kiriman.isian !== null || kiriman.jangkar !== null) return tolak('GHARQA_ISIAN_TIDAK_SESUAI');
  if (kiriman.bantuan) {
    // Tangga hanya di tabel harta; langkah keputusan tanpa bantuan.
    return kolomAda(dasar.daftarTabel, kiriman.bantuan.idKolom) ? { ok: true, penilaian: { ...dasar, hasilKolom: null, benarSemua: false } } : tolak('KOLOM_TIDAK_ADA');
  }
  const jawaban = kiriman.gharqa;
  if (!jawaban) return { ok: true, penilaian: { ...dasar, hasilKolom: null, benarSemua: false } };
  if (jawaban.keputusan !== soal.keputusan) return { ok: true, penilaian: { ...dasar, hasilKolom: [], benarSemua: false } };
  const hasilKolom: HasilKolom[] = [];
  const benarPerHarta = new Map<string, boolean>();
  for (const { mayit, isian, jangkar } of jawaban.harta) {
    const harta = soal.harta.find(kandidat => kandidat.mayit === mayit);
    if (!harta) return tolak('HARTA_TIDAK_ADA');
    const galat = periksaIsian(harta.tabel, isian, jangkar);
    if (galat) return tolak(galat);
    const kolom = nilaiSemuaKolom(harta.tabel, isian, jangkar);
    hasilKolom.push(...kolom);
    benarPerHarta.set(mayit, kolom.every(hasil => hasil.status === 'benar'));
  }
  return { ok: true, penilaian: { ...dasar, hasilKolom, benarSemua: soal.harta.every(harta => benarPerHarta.get(harta.mayit)) } };
}

const kolomAda = (daftarTabel: readonly TabelSoal[], idKolom: string): boolean =>
  daftarTabel.some(tabel => tabel.kolom.some(kolom => kolom.id === idKolom) || (idKolom === 'pengali' && tabel.pengali !== undefined));

/** Kode galat pertama yang ditemukan, atau null bila isian sah. */
function periksaIsian(tabel: TabelSoal, isian: IsianTabel, jangkar: Jangkar | null): string | null {
  if (jangkar && !calonJangkar(tabel).some(calon => calon.idBaris === jangkar.idBaris && calon.idKolom === jangkar.idKolom)) return 'JANGKAR_BUKAN_CALON';
  const kolomPerId = new Map(tabel.kolom.map(kolom => [kolom.id, kolom]));
  for (const [idKolom, nilai] of Object.entries(isian.kepala)) {
    if (kolomPerId.get(idKolom)?.kepala === undefined) return 'KEPALA_TIDAK_ADA';
    if (!POLA_BULAT.test(angkaLatin(nilai).trim())) return 'ISIAN_BUKAN_BULAT';
  }
  for (const [idBaris, baris] of Object.entries(isian.sel)) {
    const soalBaris = tabel.baris.find(kandidat => kandidat.id === idBaris);
    if (!soalBaris) return 'BARIS_TIDAK_ADA';
    for (const [idKolom, nilai] of Object.entries(baris)) {
      const kolom = kolomPerId.get(idKolom);
      if (!kolom) return 'KOLOM_TIDAK_ADA';
      if (kolom.terkunci) return 'SEL_TERKUNCI';
      if (soalBaris.kunci[idKolom] === undefined) return 'SEL_TANPA_KUNCI';
      if (jangkar?.idBaris === idBaris && jangkar.idKolom === idKolom) return 'SEL_JANGKAR_DIISI';
      if (kolom.jenis === 'pilih' ? nilai.trim() !== '' && !kolom.pilihan?.includes(nilai.trim()) : !POLA_BULAT.test(angkaLatin(nilai).trim())) return kolom.jenis === 'pilih' ? 'PILIHAN_DI_LUAR_DAFTAR' : 'ISIAN_BUKAN_BULAT';
    }
  }
  const idPengali = Object.keys(tabel.pengali?.kunci ?? {});
  for (const [idKolom, nilai] of Object.entries(isian.pengali ?? {})) {
    if (!idPengali.includes(idKolom)) return 'PENGALI_TIDAK_ADA';
    if (!POLA_BULAT.test(angkaLatin(nilai).trim())) return 'ISIAN_BUKAN_BULAT';
  }
  return null;
}

// ── Kuis konsep dan pelajaran lewat fungsi yang sama (spec 2.6 akhir; audit T2): benar/salah kuis dihitung server. ──
const KUNCI_KEGIATAN = { kuis: ['jenis', 'id', 'slug', 'indeksPilihan'], pelajaran: ['jenis', 'id', 'slug'] } as const;
const POLA_SLUG = /^[A-Za-z0-9-]{1,60}$/;
export type KirimanKegiatan = { jenis: 'kuis'; id: string; slug: string; indeksPilihan: number } | { jenis: 'pelajaran'; id: string; slug: string };

/** Mengenali kiriman kuis/pelajaran (`jenis` ada); kiriman soal tabel tidak punya kunci `jenis` → null. */
export function bacaKirimanKegiatan(mentah: unknown, ukuranBadan: number): HasilCatat<{ kegiatan: KirimanKegiatan }> | null {
  if (!adalahObjek(mentah) || !('jenis' in mentah)) return null;
  if (ukuranBadan > UKURAN_BADAN_MAKS_BAYT) return tolak('BADAN_TERLALU_BESAR');
  const jenis = mentah.jenis;
  if (jenis !== 'kuis' && jenis !== 'pelajaran') return tolak('JENIS_TIDAK_SAH');
  if (Object.keys(mentah).some(kunci => !(KUNCI_KEGIATAN[jenis] as readonly string[]).includes(kunci))) return tolak('KUNCI_TIDAK_DIKENAL');
  if (!adalahTeks(mentah.id, POLA_UUID)) return tolak('ID_TIDAK_SAH');
  if (!adalahTeks(mentah.slug, POLA_SLUG)) return tolak('SLUG_TIDAK_SAH');
  if (jenis === 'pelajaran') return { ok: true, kegiatan: { jenis, id: mentah.id, slug: mentah.slug } };
  const indeks = mentah.indeksPilihan;
  if (typeof indeks !== 'number' || !Number.isInteger(indeks) || indeks < 0 || indeks > 9) return tolak('PILIHAN_TIDAK_SAH');
  return { ok: true, kegiatan: { jenis, id: mentah.id, slug: mentah.slug, indeksPilihan: indeks } };
}

/** Null bila indeks di luar daftar pilihan (kiriman karangan, ditolak). */
export const nilaiKuis = (kuis: { pilihan: readonly unknown[]; indeksBenar: number }, indeksPilihan: number): boolean | null =>
  indeksPilihan < kuis.pilihan.length ? indeksPilihan === kuis.indeksBenar : null;
