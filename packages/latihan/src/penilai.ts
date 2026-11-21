// Penilai sisi server (spec 2.6): menerima kiriman mentah klien (hanya isian dan klik pelajar), memeriksa bentuknya,
// menyusun tabel sendiri dari soal, memeriksa isian terhadap tabel itu, lalu menilai. Murni: soal, versi engine, dan
// hash kunci disuntik pemanggil (edge function `catat-percobaan` yang mengurus identitas, basis data, urutan, dan laju).
// Tidak ada koreksi diam-diam: kiriman yang melanggar ditolak utuh dengan kode galat.

import type { KasusSoal } from '@waris/content';
import { angkaLatin } from './angka.js';
import { jalankan, jenisSoalDari } from './jalankan.js';
import { kasusDariSoal } from './soal.js';
import type { JenisSoal, ModeSoal } from './kejadian.js';
import { calonJangkar } from './tabel/jangkar.js';
import type { HasilKolom, IsianTabel, Jangkar, TabelSoal } from './tabel/model.js';
import { nilaiSemuaKolom } from './tabel/nilai.js';
import { susunTabelSoal } from './tabel/susun.js';

export const UKURAN_BADAN_MAKS_BAYT = 32_000;
const PANJANG_ISIAN_MAKS = 40;
const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POLA_SOAL_KURASI = /^[A-Za-z0-9-]{1,40}$/;
const POLA_SOAL_POLA = /^[a-z0-9-]{1,60}@\d{1,4}#\d{1,10}$/;
const POLA_BULAT = /^\d{0,6}$/;
const AKSI_SAH = ['buka', 'periksa', 'kirim', 'lihatJawaban'] as const;
const MODE_SAH = ['latihan', 'ujian'] as const;
const KUNCI_SAH = ['id', 'idSesiSoal', 'soalId', 'revisiSoal', 'mode', 'aksi', 'isian', 'jangkar', 'dimulaiPada'];

export type AksiKiriman = (typeof AKSI_SAH)[number];
export interface Kiriman {
  id: string; idSesiSoal: string; soalId: string; revisiSoal: string;
  mode: ModeSoal; aksi: AksiKiriman; isian: IsianTabel | null; jangkar: Jangkar | null; dimulaiPada: string | null;
}
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
  const { id, idSesiSoal, revisiSoal, soalId, mode, aksi, isian, jangkar, dimulaiPada } = mentah;
  if (!adalahTeks(id, POLA_UUID) || !adalahTeks(idSesiSoal, POLA_UUID) || !adalahTeks(revisiSoal, POLA_UUID)) return tolak('ID_TIDAK_SAH');
  if (typeof soalId !== 'string' || !(POLA_SOAL_KURASI.test(soalId) || POLA_SOAL_POLA.test(soalId))) return tolak('SOAL_ID_TIDAK_SAH');
  if (!MODE_SAH.includes(mode as ModeSoal)) return tolak('MODE_TIDAK_SAH');
  if (!AKSI_SAH.includes(aksi as AksiKiriman)) return tolak('AKSI_TIDAK_SAH');
  if (dimulaiPada !== undefined && dimulaiPada !== null && (typeof dimulaiPada !== 'string' || Number.isNaN(Date.parse(dimulaiPada)))) return tolak('WAKTU_TIDAK_SAH');
  const isianSah = bacaIsian(isian);
  const jangkarSah = bacaJangkar(jangkar);
  if (!isianSah.ok) return isianSah;
  if (!jangkarSah.ok) return jangkarSah;
  // `buka` tidak membawa isian; periksa dan kirim wajib; lihatJawaban boleh tanpa.
  if (aksi === 'buka' && (isianSah.nilai !== null || jangkarSah.nilai !== null)) return tolak('BUKA_TANPA_ISIAN');
  if ((aksi === 'periksa' || aksi === 'kirim') && isianSah.nilai === null) return tolak('ISIAN_WAJIB');
  return { ok: true, kiriman: { id, idSesiSoal, soalId, revisiSoal, mode: mode as ModeSoal, aksi: aksi as AksiKiriman,
    isian: isianSah.nilai, jangkar: jangkarSah.nilai, dimulaiPada: (dimulaiPada as string | null | undefined) ?? null } };
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

function bacaJangkar(mentah: unknown): HasilCatat<{ nilai: Jangkar | null }> {
  if (mentah === undefined || mentah === null) return { ok: true, nilai: null };
  if (!adalahObjek(mentah) || typeof mentah.idBaris !== 'string' || typeof mentah.idKolom !== 'string'
    || Object.keys(mentah).length !== 2) return tolak('JANGKAR_TIDAK_SAH');
  return { ok: true, nilai: { idBaris: mentah.idBaris, idKolom: mentah.idKolom } };
}

export interface SoalDimuat { kasus: KasusSoal; revisiId: string }
export interface Penilaian {
  jenisSoal: JenisSoal;
  tabel: TabelSoal;
  /** null untuk buka dan lihatJawaban tanpa isian. */
  hasilKolom: HasilKolom[] | null;
  benarSemua: boolean;
}

/** Spec 2.6 butir 3 dan 5: tabel disusun server, isian diperiksa terhadapnya, lalu dinilai. */
export function nilaiKiriman(kiriman: Kiriman, soal: SoalDimuat, versiEngine: string): HasilCatat<{ penilaian: Penilaian }> {
  let kasus;
  try { kasus = kasusDariSoal(soal.kasus); } catch { return tolak('SOAL_TIDAK_DIDUKUNG'); }
  const tampil = jalankan(kasus, versiEngine);
  // Gharqa membawa keputusan + beberapa tabel; kontrak kiriman untuk itu menyusul (belum ada jalur server).
  if (tampil.jenis === 'galat' || tampil.jenis === 'menunggu' || tampil.jenis === 'gharqa') return tolak('SOAL_TIDAK_DIDUKUNG');
  const susunan = susunTabelSoal(tampil.hasil, id => kasus.graf.orang[id]?.nama ?? id);
  if ('status' in susunan) return tolak('SOAL_TIDAK_DIDUKUNG');
  const jenisSoal = jenisSoalDari(kasus, tampil);
  if (kiriman.aksi === 'buka' || (kiriman.aksi === 'lihatJawaban' && kiriman.isian === null))
    return { ok: true, penilaian: { jenisSoal, tabel: susunan, hasilKolom: null, benarSemua: false } };
  const isian = kiriman.isian!;
  const galat = periksaIsian(susunan, isian, kiriman.jangkar);
  if (galat) return tolak(galat);
  const hasilKolom = nilaiSemuaKolom(susunan, isian, kiriman.jangkar);
  return { ok: true, penilaian: { jenisSoal, tabel: susunan, hasilKolom, benarSemua: hasilKolom.every(kolom => kolom.status === 'benar') } };
}

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
