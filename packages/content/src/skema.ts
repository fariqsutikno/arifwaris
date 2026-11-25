// packages/content/src/skema.ts
// Skema Zod isi konten per `jenis`, dipakai database (kolom `revisi.isi` jsonb), portal (validasi sebelum simpan),
// dan web (validasi saat baca). Bentuk isi = tipe domain yang sudah ada; bigint disimpan sebagai string digit
// karena JSON tidak punya bigint. `keJson` → simpan, `bacaIsi` → baca & validasi.
import { z } from 'zod';
import type { EntriFaq } from './faq.js';
import { TAHAP_ALUR, TAMPIL_PERAGA, type Blok, type ContohKasus, type Modul, type Pelajaran, type Potongan, type SimpulPeta, type VersiArab } from './materi.js';
import type { SumberKitab, Syahid } from './pustaka.js';
import type { KasusSoal, SoalHitung, SoalKuis } from './soal.js';
import type { KasusTanyaJawab } from './tanyaJawab.js';

export const JENIS_KONTEN = [
  'modul', 'materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'kitab', 'syahid',
  'glosarium_ar', 'ahwal', 'teks_edukasi', 'cheatsheet',
] as const;
export type JenisKonten = (typeof JENIS_KONTEN)[number];
/** Jenis yang memuat klaim fikih: wajib punya minimal satu ref `[Rxx-y]`. */
export const JENIS_FIKIH: readonly JenisKonten[] = ['materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'ahwal', 'syahid'];
/** FAQ kelompok ini menjawab cara pakai aplikasi, bukan klaim fikih (keputusan 2026-09-26). Sama dengan trigger periksa_refs_revisi. */
export const KELOMPOK_FAQ_NON_FIKIH = 'Pakai aplikasi';

export const wajibRef = (jenis: JenisKonten, isi: unknown): boolean =>
  JENIS_FIKIH.includes(jenis)
  && !(jenis === 'faq' && (isi as { kelompok?: unknown } | null)?.kelompok === KELOMPOK_FAQ_NON_FIKIH);

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
  const skema: z.ZodTypeAny | undefined = SKEMA[jenis];
  if (!skema) return { ok: false, galat: `jenis konten tidak dikenal: ${jenis}` };
  const hasil = skema.safeParse(json);
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
  z.object({ jenis: z.literal('tautanPelajaran'), slug: z.string(), bagian: z.string().optional(), teks: z.string().optional() }),
  z.object({ jenis: z.literal('tautanBagian'), bagian: z.string(), teks: z.string().optional() }),
]) as unknown as z.ZodType<Potongan>;
const teksPotongan = z.array(potongan);

const tingkat = z.enum(['dasar', 'menengah', 'sulit']);
const pewaris = z.enum(['L', 'P']);
const contohKasus = z.object({
  pewaris,
  ahliWaris: z.array(z.string()),
  harta: bigintTeks,
  harapan: z.object({ saham: z.record(bigintTeks), ashlAkhir: bigintTeks }),
}) as unknown as z.ZodType<ContohKasus>;

const nilaiBagian = z.object({
  pecahan: z.tuple([bigintTeks, bigintTeks]).optional(),
  sisa: z.literal(true).optional(), sepertigaSisa: z.literal(true).optional(), gugur: z.literal(true).optional(),
});
const simpulPeta: z.ZodType<SimpulPeta> = z.lazy(() => z.object({
  judul: z.string(), keterangan: z.string().optional(), tujuan: z.string().optional(), anak: z.array(simpulPeta),
})) as unknown as z.ZodType<SimpulPeta>;
const soalMateri = z.object({
  kode: z.string(), bab: z.number().int(), tingkat, pertanyaan: teksPotongan, pilihan: z.array(teksPotongan).min(2),
  indeksBenar: z.number().int().nonnegative(), pembahasan: teksPotongan, alasanPilihan: z.array(teksPotongan),
});

const kasusBerkas = z.object({
  bentuk: z.literal('berkas'),
  berkas: z.record(z.unknown()).refine(berkas => typeof berkas.versi === 'number', { message: 'berkas kasus harus punya versi' }),
});
const kasusSoal = z.union([contohKasus, kasusBerkas]) as unknown as z.ZodType<KasusSoal>;

const tahapAlur = z.enum(TAHAP_ALUR);
// z.lazy: blok `lipat` memuat blok lain.
const blok: z.ZodType<Blok> = z.lazy(() => z.discriminatedUnion('jenis', [
  z.object({ jenis: z.literal('judul'), tingkat: z.union([z.literal(2), z.literal(3)]), isi: teksPotongan }),
  z.object({ jenis: z.literal('paragraf'), isi: teksPotongan }),
  z.object({ jenis: z.literal('daftar'), berurut: z.boolean(), butir: z.array(teksPotongan) }),
  z.object({ jenis: z.literal('catatan'), isi: teksPotongan }),
  z.object({ jenis: z.literal('tabel'), kepala: z.array(teksPotongan), baris: z.array(z.array(teksPotongan)) }),
  z.object({ jenis: z.literal('kasus'), kasus: contohKasus, judul: z.string().optional(), cerita: teksPotongan.optional(), keterangan: z.record(teksPotongan).optional() }),
  z.object({ jenis: z.literal('kasusBerkas'), berkas: z.string(), judul: z.string().optional(), cerita: teksPotongan.optional() }),
  z.object({ jenis: z.literal('video'), idYoutube: z.string().regex(/^[\w-]{11}$/), judul: z.string() }),
  z.object({ jenis: z.literal('videoMenyusul'), rencana: z.string() }),
  z.object({ jenis: z.literal('kuis'), daftarKode: z.array(z.string()) }),
  z.object({ jenis: z.literal('alur'), tahap: tahapAlur, tanya: teksPotongan, bekal: teksPotongan.optional(), hasil: teksPotongan }),
  z.object({ jenis: z.literal('caraBerpikir'), judul: z.string().optional(), langkah: z.array(z.object({ tanya: teksPotongan, akibat: teksPotongan })) }),
  z.object({
    jenis: z.literal('peraga'), judul: z.string().optional(), pengantar: teksPotongan.optional(), tampil: z.enum(TAMPIL_PERAGA),
    keadaan: z.array(z.object({ label: z.string(), pewaris, ahliWaris: z.array(z.string()), penjelasan: teksPotongan })),
  }),
  z.object({
    jenis: z.literal('bandingan'), judul: z.string().optional(), kolom: z.array(z.string()),
    baris: z.array(z.object({ nama: z.string(), nilai: z.array(nilaiBagian) })), catatan: teksPotongan.optional(),
  }),
  z.object({
    jenis: z.literal('simulasi'), judul: z.string().optional(), pewaris, pilihan: z.array(z.string()), awal: z.array(z.string()),
    tampil: z.enum(['status', 'bagian']),
  }),
  z.object({ jenis: z.literal('peta'), akar: simpulPeta }),
  z.object({
    jenis: z.literal('ingat'), judul: z.string().optional(), butir: z.array(z.object({ kunci: z.string(), penjelasan: teksPotongan })),
    penutup: teksPotongan.optional(),
  }),
  z.object({ jenis: z.literal('dasar'), isi: teksPotongan, rujukan: z.array(z.string()) }),
  z.object({ jenis: z.literal('tebak'), tanya: teksPotongan, jawab: teksPotongan }),
  z.object({ jenis: z.literal('lipat'), judul: z.string(), blok: z.array(blok) }),
  z.object({ jenis: z.literal('matriks'), kolom: z.array(z.string()), baris: z.array(z.object({ label: z.string(), sel: z.array(teksPotongan) })) }),
  z.object({ jenis: z.literal('soal'), soal: soalMateri, rujukan: z.array(z.string()) }),
])) as unknown as z.ZodType<Blok>;

const versiArab: z.ZodType<VersiArab> = z.object({ judul: z.string(), tujuan: z.string(), blok: z.array(blok).optional() }) as z.ZodType<VersiArab>;

const SKEMA: Record<JenisKonten, z.ZodTypeAny> = {
  modul: z.object({ nomor: z.number().int(), judul: z.string(), ringkas: z.string(), ar: z.object({ judul: z.string(), ringkas: z.string() }).optional() }),
  materi: z.object({
    slug: z.string(), judul: z.string(), modul: z.number().int(), urutan: z.number().int(), tujuan: z.string(),
    durasi: z.number().int().optional(), tahap: tahapAlur.optional(), prasyarat: z.array(z.string()).optional(), singgung: z.array(z.string()).optional(),
    perluCek: z.boolean(), blok: z.array(blok), ar: versiArab.optional(),
  }),
  soal_kuis: z.object({
    kode: z.string(), bab: z.number().int(), tingkat: tingkat.optional(), pertanyaan: z.array(potongan), pilihan: z.array(z.array(potongan)).min(2),
    indeksBenar: z.number().int().nonnegative(), pembahasan: z.array(potongan),
    alasanPilihan: z.array(z.array(potongan)).optional(), catatan: z.array(potongan).optional(), dibantuAi: z.boolean().optional(), sumber: z.string().optional(),
    // Bentuk lama: satu teks "kenapa pilihan lain salah" untuk semua pilihan; dibaca lalu digabung ke pembahasan.
    pengecoh: z.array(potongan).optional(),
  })
    .refine(soal => soal.indeksBenar < soal.pilihan.length, { message: 'indeksBenar di luar pilihan' })
    .refine(soal => !soal.alasanPilihan || (soal.alasanPilihan.length === soal.pilihan.length && soal.alasanPilihan.every(alasan => alasan.length > 0)),
      { message: 'penjelasan per pilihan harus ada untuk semua pilihan', path: ['alasanPilihan'] })
    .transform(({ pengecoh, ...soal }) => (pengecoh?.length ? { ...soal, pembahasan: [...soal.pembahasan, { jenis: 'teks' as const, teks: ' ' }, ...pengecoh] } : soal)),
  soal_hitung: z.object({
    kode: z.string(), bab: z.number().int(), tingkat, judul: z.string(), kasus: kasusSoal, topik: z.string(), sumber: z.string(),
    bobotXp: z.number().int().min(1).max(200).optional(),
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
