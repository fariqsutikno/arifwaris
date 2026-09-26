// packages/content/src/skema.ts
// Skema Zod isi konten per `jenis`, dipakai database (kolom `revisi.isi` jsonb), portal (validasi sebelum simpan),
// dan web (validasi saat baca). Bentuk isi = tipe domain yang sudah ada; bigint disimpan sebagai string digit
// karena JSON tidak punya bigint. `keJson` → simpan, `bacaIsi` → baca & validasi.
import { z } from 'zod';
import type { EntriFaq } from './faq.js';
import type { Blok, ContohKasus, Modul, Pelajaran, Potongan, VersiArab } from './materi.js';
import type { SumberKitab, Syahid } from './pustaka.js';
import type { SoalHitung, SoalKuis } from './soal.js';
import type { KasusTanyaJawab } from './tanyaJawab.js';

export const JENIS_KONTEN = [
  'modul', 'materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'kitab', 'syahid',
  'glosarium_ar', 'ahwal', 'teks_edukasi', 'cheatsheet',
] as const;
export type JenisKonten = (typeof JENIS_KONTEN)[number];
/** Jenis yang memuat klaim fikih: wajib punya minimal satu ref `[Rxx-y]`. */
export const JENIS_FIKIH: readonly JenisKonten[] = ['materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'ahwal', 'syahid'];

export interface CocokAhwal { fardh?: string | null; ashabah?: boolean; terhalang?: boolean; kodeAlasan?: string }
export interface BarisAhwal { bagian: string; syarat: string; cocok: CocokAhwal; ar?: { bagian: string; syarat: string } }
export interface IsiAhwal { kunci: string; baris: BarisAhwal[] }
export interface IsiTeksEdukasi { id: string; ar?: string }
export interface IsiCheatsheet { judul: string; judulAr?: string; deskripsi: string; tautan: string | null }
export interface IsiGlosariumAr { istilahId: string; makna: string; artiAwam?: string; contoh?: string }

export interface IsiKonten {
  modul: Modul; materi: Pelajaran; soal_kuis: SoalKuis; soal_hitung: SoalHitung; tanya_jawab: KasusTanyaJawab;
  faq: EntriFaq; kitab: SumberKitab; syahid: Syahid; glosarium_ar: IsiGlosariumAr; ahwal: IsiAhwal;
  teks_edukasi: IsiTeksEdukasi; cheatsheet: IsiCheatsheet;
}

export function keJson<J extends JenisKonten>(_jenis: J, isi: IsiKonten[J]): unknown {
  return JSON.parse(JSON.stringify(isi, (_kunci, nilai) => (typeof nilai === 'bigint' ? nilai.toString() : nilai)));
}

export function bacaIsi<J extends JenisKonten>(jenis: J, json: unknown):
  { ok: true; isi: IsiKonten[J] } | { ok: false; galat: string } {
  const hasil = SKEMA[jenis].safeParse(json);
  return hasil.success
    ? { ok: true, isi: hasil.data as IsiKonten[J] }
    : { ok: false, galat: hasil.error.issues.map(isu => `${isu.path.join('.')}: ${isu.message}`).join('; ') };
}

// --- skema ---

const bigintTeks = z.string().regex(/^-?\d+$/).transform(BigInt);

const potongan: z.ZodType<Potongan> = z.discriminatedUnion('jenis', [
  z.object({ jenis: z.literal('teks'), teks: z.string() }),
  z.object({ jenis: z.literal('tebal'), teks: z.string() }),
  z.object({ jenis: z.literal('miring'), teks: z.string() }),
  z.object({ jenis: z.literal('istilah'), id: z.string(), teks: z.string() }),
  z.object({ jenis: z.literal('rujukan'), kode: z.string() }),
]);

const contohKasus = z.object({
  pewaris: z.enum(['L', 'P']),
  ahliWaris: z.array(z.string()),
  harta: bigintTeks,
  harapan: z.object({ saham: z.record(bigintTeks), ashlAkhir: bigintTeks }),
}) as unknown as z.ZodType<ContohKasus>;

const blok: z.ZodType<Blok> = z.discriminatedUnion('jenis', [
  z.object({ jenis: z.literal('judul'), tingkat: z.union([z.literal(2), z.literal(3)]), isi: z.array(potongan) }),
  z.object({ jenis: z.literal('paragraf'), isi: z.array(potongan) }),
  z.object({ jenis: z.literal('daftar'), berurut: z.boolean(), butir: z.array(z.array(potongan)) }),
  z.object({ jenis: z.literal('catatan'), isi: z.array(potongan) }),
  z.object({ jenis: z.literal('tabel'), kepala: z.array(z.array(potongan)), baris: z.array(z.array(z.array(potongan))) }),
  z.object({ jenis: z.literal('kasus'), kasus: contohKasus }),
  z.object({ jenis: z.literal('video'), idYoutube: z.string().regex(/^[\w-]{11}$/), judul: z.string() }),
  z.object({ jenis: z.literal('kuis'), daftarKode: z.array(z.string()) }),
]) as unknown as z.ZodType<Blok>;

const versiArab: z.ZodType<VersiArab> = z.object({ judul: z.string(), tujuan: z.string(), blok: z.array(blok).optional() }) as z.ZodType<VersiArab>;
const tingkat = z.enum(['dasar', 'menengah', 'sulit']);

const SKEMA: Record<JenisKonten, z.ZodTypeAny> = {
  modul: z.object({ nomor: z.number().int(), judul: z.string(), ringkas: z.string(), ar: z.object({ judul: z.string(), ringkas: z.string() }).optional() }),
  materi: z.object({
    slug: z.string(), judul: z.string(), modul: z.number().int(), urutan: z.number().int(), tujuan: z.string(),
    perluCek: z.boolean(), blok: z.array(blok), ar: versiArab.optional(),
  }),
  soal_kuis: z.object({
    kode: z.string(), bab: z.number().int(), pertanyaan: z.array(potongan), pilihan: z.array(z.array(potongan)).min(2),
    indeksBenar: z.number().int().nonnegative(), pembahasan: z.array(potongan),
  }).refine(soal => soal.indeksBenar < soal.pilihan.length, { message: 'indeksBenar di luar pilihan' }),
  soal_hitung: z.object({
    kode: z.string(), bab: z.number().int(), tingkat, judul: z.string(), kasus: contohKasus, topik: z.string(), sumber: z.string(),
  }),
  tanya_jawab: z.object({
    slug: z.string(), judul: z.string(), jenis: z.enum(['Saran ustadz', 'Fatwa']), ringkasan: z.string(),
    kasus: z.array(blok), penyelesaian: z.array(blok), sumber: z.string(),
    ar: z.object({ judul: z.string(), ringkasan: z.string(), sumber: z.string(), kasus: z.array(blok).optional(), penyelesaian: z.array(blok).optional() }).optional(),
  }),
  faq: z.object({ id: z.string(), kelompok: z.string(), pertanyaan: z.string(), jawaban: z.array(blok) }),
  kitab: z.object({ judul: z.string(), tautan: z.string().optional(), pdf: z.string().optional() }),
  syahid: z.object({ surah: z.string(), ayat: z.number().int(), hukum: z.string(), syahid: z.string(), rujukan: z.string() }),
  glosarium_ar: z.object({ istilahId: z.string().min(1), makna: z.string(), artiAwam: z.string().optional(), contoh: z.string().optional() }),
  ahwal: z.object({
    kunci: z.string().min(1),
    baris: z.array(z.object({
      bagian: z.string(), syarat: z.string(),
      cocok: z.object({ fardh: z.string().nullable().optional(), ashabah: z.boolean().optional(), terhalang: z.boolean().optional(), kodeAlasan: z.string().optional() }),
      ar: z.object({ bagian: z.string(), syarat: z.string() }).optional(),
    })),
  }),
  teks_edukasi: z.object({ id: z.string().min(1), ar: z.string().optional() }),
  cheatsheet: z.object({ judul: z.string().min(1), judulAr: z.string().optional(), deskripsi: z.string(), tautan: z.string().url().nullable() }),
};
