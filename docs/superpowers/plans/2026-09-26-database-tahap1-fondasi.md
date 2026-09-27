# Database Tahap 1 — Fondasi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skema Postgres + RLS + fungsi transisi editorial, skema Zod isi konten, aturan editorial murni, `packages/data` (antarmuka + `memori/` + `supabase/`), dan `scripts/daftar-refs.ts`. UI belum berubah.

**Architecture:** Postgres (Supabase lokal via Docker) memegang data; aturan akses dijaga RLS dan fungsi `security definer`
untuk transisi status (atomik). `packages/content` menambah skema Zod per `jenis` dan aturan editorial murni yang
dipakai implementasi `memori/`. `packages/data` = antarmuka repository + dua implementasi; app nanti hanya mengenal
antarmuka.

**Tech Stack:** TypeScript, Vitest 2, Zod 3, Supabase CLI (Postgres 15, pgTAP via `supabase test db`), `@supabase/supabase-js` 2, `vite-node` (menjalankan skrip yang mengimpor `?raw`).

**Spec:** `docs/superpowers/specs/2026-09-26-database-portal-admin-design.md` (bagian "Urutan kerja" tahap 1)

## Global Constraints

- Nama variabel/fungsi/tipe/kolom SQL, komentar: bahasa Indonesia; istilah fikih sesuai `docs/kb/15_glosarium.md`.
- Tiap file dibuka komentar pendek: menerima apa, memutuskan apa, menyerahkan apa.
- Fitur khusus Supabase (Edge Functions, Realtime, Storage) TIDAK dipakai. Migrasi = SQL Postgres biasa di `supabase/migrations/`.
- `packages/data` tidak mengimpor `@waris/engine`. Arah: `data` → `content`.
- Peran: `'admin' | 'penulis' | 'reviewer'`. Status revisi: `'draf' | 'diajukan' | 'disetujui' | 'dikembalikan'`.
- Jenis konten: `modul, materi, soal_kuis, soal_hitung, tanya_jawab, faq, kitab, syahid, glosarium_ar, ahwal, teks_edukasi, cheatsheet`.
- Jenis fikih (wajib ≥1 ref): `materi, soal_kuis, soal_hitung, tanya_jawab, faq, ahwal, syahid`.
- Revisi tidak pernah diedit setelah diajukan. Rollback = menerbitkan ulang revisi `disetujui` lama.
- Tes yang ada (math 19, content 48, engine 166, explain 36, web 193) tetap hijau.
- Commit setelah tiap task; hanya berkas milik task itu. Akhiri pesan dengan `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **`bigint` di `isi` jsonb** (`ContohKasus.harta`, `harapan.saham`, `ashlAkhir`): JSON tidak punya bigint. Harus
   bolak-balik tanpa kehilangan nilai (disimpan string digit). Diuji di Task 1 (round-trip semua konten sekarang).
2. **Reviewer menyetujui revisinya sendiri lewat pemanggilan RPC langsung** (bukan lewat UI): harus ditolak DB. Diuji di Task 4.
3. **Penulis mengubah `status` langsung dengan `update revisi set status='disetujui'`** (melewati fungsi): harus ditolak RLS. Diuji di Task 5.
4. **Ref yang tidak ada di `daftar_refs` atau jenis fikih tanpa ref**: insert ditolak, bukan tersimpan diam-diam. Diuji di Task 3.
5. **Isi tidak valid di baris terbit** (mis. disunting manual di SQL): `bacaTerbit` membuang entri itu + `console.warn`, tidak melempar. Diuji di Task 7.

---

## Keputusan kecil yang diambil plan ini (bukan di spec)

- `isi` = tipe domain yang sudah ada apa adanya (versi Arab sudah jadi field `ar` di dalam tipe). Bigint disimpan sebagai string digit.
- Tipe baru kecil untuk jenis yang sekarang tinggal di `apps/web`:
  `IsiAhwal = { kunci: string; baris: { bagian: string; syarat: string; cocok: {...} }[] }`,
  `IsiTeksEdukasi = { id: string; ar?: string }` (satu teks per entri, slug = kunci stabil mis. `harta.tabungan.label`),
  `IsiCheatsheet = { judul: string; judulAr?: string; deskripsi: string; tautan: string | null }`,
  `IsiGlosariumAr = { istilahId: string; makna: string; artiAwam?: string; contoh?: string }`.
- `entri_konten.versi_terbit` & `diksi.versi_terbit` (bigint) = nilai `versi_konten` saat terakhir diterbitkan; dipakai untuk "unduh yang berubah sejak versi N".
- Admin boleh menyetujui revisinya sendiri ("Admin: semua"); reviewer tidak.
- `peran_pengguna.user_id` primary key: satu peran per orang.

## Peta berkas

```
package.json                                   + devDeps supabase, vite-node; script db:*
supabase/config.toml                           hasil `supabase init`
supabase/migrations/20260926000001_konten.sql  tabel konten, diksi, refs, versi, peran + trigger
supabase/migrations/20260926000002_transisi.sql fungsi transisi (revisi & revisi_diksi)
supabase/migrations/20260926000003_pengguna.sql tabel data pengguna
supabase/migrations/20260926000004_rls.sql     RLS semua tabel
supabase/seed.sql                              hasil scripts/daftar-refs.ts (di-commit)
supabase/tests/database/*.test.sql             pgTAP
scripts/daftar-refs.ts                         docs/kb → supabase/seed.sql
packages/content/src/skema.ts                  skema Zod per jenis + serialisasi bigint
packages/content/src/editorial.ts              aturan editorial murni
packages/data/                                 BARU: antarmuka, memori/, supabase/
```

---

### Task 1: Skema Zod isi konten per jenis

**Files:**
- Modify: `packages/content/package.json` (dependency `zod`)
- Create: `packages/content/src/skema.ts`
- Modify: `packages/content/src/index.ts` (ekspor)
- Test: `packages/content/src/__tests__/skema.test.ts`

**Interfaces:**
- Produces:
  - `JENIS_KONTEN` (tuple const 12 jenis), `type JenisKonten`, `JENIS_FIKIH: readonly JenisKonten[]`
  - `type IsiKonten = { modul: Modul; materi: Pelajaran; soal_kuis: SoalKuis; soal_hitung: SoalHitung; tanya_jawab: KasusTanyaJawab; faq: EntriFaq; kitab: SumberKitab; syahid: Syahid; glosarium_ar: IsiGlosariumAr; ahwal: IsiAhwal; teks_edukasi: IsiTeksEdukasi; cheatsheet: IsiCheatsheet }`
  - `keJson<J extends JenisKonten>(jenis: J, isi: IsiKonten[J]): unknown` — bigint → string, hasil aman untuk `JSON.stringify`
  - `bacaIsi<J extends JenisKonten>(jenis: J, json: unknown): { ok: true; isi: IsiKonten[J] } | { ok: false; galat: string }`
  - tipe `IsiAhwal`, `IsiTeksEdukasi`, `IsiCheatsheet`, `IsiGlosariumAr`

- [x] **Step 1: Pasang zod**

Run: `pnpm --filter @waris/content add zod@^3.23.0`

- [x] **Step 2: Tulis tes gagal**

```ts
// packages/content/src/__tests__/skema.test.ts
import { describe, expect, test } from 'vitest';
import {
  DAFTAR_FAQ, DAFTAR_MODUL, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, DAFTAR_SYAHID, DAFTAR_TANYA_JAWAB,
  SUMBER_KITAB, bacaIsi, keJson, type IsiKonten, type JenisKonten,
} from '../index.js';

const bolakBalik = <J extends JenisKonten>(jenis: J, isi: IsiKonten[J]) => {
  const json = JSON.parse(JSON.stringify(keJson(jenis, isi)));
  const hasil = bacaIsi(jenis, json);
  if (!hasil.ok) throw new Error(`${jenis}: ${hasil.galat}`);
  expect(hasil.isi).toEqual(isi);
};

describe('skema isi konten', () => {
  test('semua konten sekarang lolos dan bolak-balik JSON tanpa berubah (termasuk bigint)', () => {
    DAFTAR_MODUL.forEach(isi => bolakBalik('modul', isi));
    DAFTAR_PELAJARAN.forEach(isi => bolakBalik('materi', isi));
    DAFTAR_SOAL_KUIS.forEach(isi => bolakBalik('soal_kuis', isi));
    DAFTAR_SOAL_HITUNG.forEach(isi => bolakBalik('soal_hitung', isi));
    DAFTAR_TANYA_JAWAB.forEach(isi => bolakBalik('tanya_jawab', isi));
    DAFTAR_FAQ.forEach(isi => bolakBalik('faq', isi));
    SUMBER_KITAB.forEach(isi => bolakBalik('kitab', isi));
    DAFTAR_SYAHID.forEach(isi => bolakBalik('syahid', isi));
  });

  test('bigint disimpan sebagai string digit', () => {
    const soal = DAFTAR_SOAL_HITUNG[0]!;
    const json = keJson('soal_hitung', soal) as { kasus: { harta: unknown } };
    expect(json.kasus.harta).toBe(soal.kasus.harta.toString());
  });

  test('isi rusak ditolak dengan pesan, tidak melempar', () => {
    expect(bacaIsi('faq', { id: 'x' }).ok).toBe(false);
    expect(bacaIsi('soal_hitung', { ...keJson('soal_hitung', DAFTAR_SOAL_HITUNG[0]!) as object, kasus: { harta: '12a' } }).ok).toBe(false);
    expect(bacaIsi('cheatsheet', { judul: 'A', deskripsi: '', tautan: 'bukan-url' }).ok).toBe(false);
  });

  test('jenis baru kecil', () => {
    expect(bacaIsi('teks_edukasi', { id: 'Tabungan & kas' }).ok).toBe(true);
    expect(bacaIsi('ahwal', { kunci: 'SUAMI', baris: [{ bagian: '1/2', syarat: 'x', cocok: { fardh: '1/2' } }] }).ok).toBe(true);
    expect(bacaIsi('ahwal', { kunci: 'SUAMI', baris: [{ bagian: '1/2', syarat: 'x', cocok: { fardh: null } }] }).ok).toBe(true);
    expect(bacaIsi('cheatsheet', { judul: 'Peta hajb', deskripsi: '', tautan: null }).ok).toBe(true);
    expect(bacaIsi('glosarium_ar', { istilahId: 'ashabah', makna: 'عصبة' }).ok).toBe(true);
  });
});
```

- [x] **Step 3: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/content test -- skema`
Expected: FAIL, `bacaIsi` tidak diekspor.

- [x] **Step 4: Implementasi**

```ts
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
export interface IsiAhwal { kunci: string; baris: { bagian: string; syarat: string; cocok: CocokAhwal }[] }
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
    })),
  }),
  teks_edukasi: z.object({ id: z.string().min(1), ar: z.string().optional() }),
  cheatsheet: z.object({ judul: z.string().min(1), judulAr: z.string().optional(), deskripsi: z.string(), tautan: z.string().url().nullable() }),
};
```

Tambahkan ke `packages/content/src/index.ts`:

```ts
export {
  JENIS_KONTEN, JENIS_FIKIH, keJson, bacaIsi,
  type JenisKonten, type IsiKonten, type IsiAhwal, type CocokAhwal, type IsiTeksEdukasi, type IsiCheatsheet, type IsiGlosariumAr,
} from './skema.js';
```

Catatan untuk pelaksana: `exactOptionalPropertyTypes` aktif. Zod `.optional()` menghasilkan `T | undefined`, dan
`toEqual` mengabaikan kunci `undefined`, jadi tes tetap lolos; cast `as IsiKonten[J]` di `bacaIsi` menutup selisih tipe.
Bila ada konten nyata yang gagal (mis. `tautan` kitab bukan URL, `idYoutube` bukan 11 karakter), JANGAN longgarkan
skema diam-diam — laporkan ke pengguna jenis/slug dan galatnya.

- [x] **Step 5: Jalankan tes & typecheck**

Run: `pnpm --filter @waris/content test && pnpm --filter @waris/content exec tsc --noEmit -p .`
Expected: semua PASS (48 lama + 4 baru), tanpa galat tipe.

- [x] **Step 6: Commit**

```bash
git add packages/content pnpm-lock.yaml
git commit -m "content: skema Zod isi konten per jenis + serialisasi bigint"
```

---

### Task 2: Aturan editorial murni

**Files:**
- Create: `packages/content/src/editorial.ts`
- Modify: `packages/content/src/index.ts`
- Test: `packages/content/src/__tests__/editorial.test.ts`

**Interfaces:**
- Consumes: `JenisKonten`, `JENIS_FIKIH` (Task 1)
- Produces:
  - `type Peran = 'admin' | 'penulis' | 'reviewer'`
  - `type StatusRevisi = 'draf' | 'diajukan' | 'disetujui' | 'dikembalikan'`
  - `type AksiEditorial = 'ajukan' | 'setujui' | 'kembalikan'`
  - `transisiRevisi(p: { status: StatusRevisi; aksi: AksiEditorial; peran: Peran | null; pelakuId: string; pembuatId: string; catatan?: string }): { ok: true; status: StatusRevisi } | { ok: false; galat: string }`
  - `bolehSuntingDraf(p: { status: StatusRevisi; peran: Peran | null; pelakuId: string; pembuatId: string }): boolean`
  - `periksaRefs(jenis: JenisKonten, refs: string[], refsDikenal: ReadonlySet<string>): string | null` — `null` = sah, selain itu pesan galat

- [x] **Step 1: Tulis tes gagal**

```ts
// packages/content/src/__tests__/editorial.test.ts
import { describe, expect, test } from 'vitest';
import { bolehSuntingDraf, periksaRefs, transisiRevisi } from '../index.js';

const dasar = { pelakuId: 'a', pembuatId: 'a' } as const;

describe('transisi revisi', () => {
  test('penulis mengajukan drafnya sendiri', () => {
    expect(transisiRevisi({ ...dasar, status: 'draf', aksi: 'ajukan', peran: 'penulis' })).toEqual({ ok: true, status: 'diajukan' });
  });
  test('penulis tidak bisa mengajukan draf orang lain', () => {
    expect(transisiRevisi({ status: 'draf', aksi: 'ajukan', peran: 'penulis', pelakuId: 'a', pembuatId: 'b' }).ok).toBe(false);
  });
  test('penulis tidak bisa menyetujui', () => {
    expect(transisiRevisi({ status: 'diajukan', aksi: 'setujui', peran: 'penulis', pelakuId: 'a', pembuatId: 'b' }).ok).toBe(false);
  });
  test('reviewer menyetujui revisi orang lain, bukan revisinya sendiri', () => {
    expect(transisiRevisi({ status: 'diajukan', aksi: 'setujui', peran: 'reviewer', pelakuId: 'r', pembuatId: 'p' })).toEqual({ ok: true, status: 'disetujui' });
    expect(transisiRevisi({ status: 'diajukan', aksi: 'setujui', peran: 'reviewer', pelakuId: 'r', pembuatId: 'r' }).ok).toBe(false);
  });
  test('admin boleh menyetujui revisinya sendiri', () => {
    expect(transisiRevisi({ ...dasar, status: 'diajukan', aksi: 'setujui', peran: 'admin' }).ok).toBe(true);
  });
  test('kembalikan wajib catatan', () => {
    const p = { status: 'diajukan', aksi: 'kembalikan', peran: 'reviewer', pelakuId: 'r', pembuatId: 'p' } as const;
    expect(transisiRevisi(p).ok).toBe(false);
    expect(transisiRevisi({ ...p, catatan: '   ' }).ok).toBe(false);
    expect(transisiRevisi({ ...p, catatan: 'Rujukan R09-7 kurang' })).toEqual({ ok: true, status: 'dikembalikan' });
  });
  test('status akhir tidak bisa ditransisikan lagi', () => {
    for (const status of ['disetujui', 'dikembalikan'] as const) {
      for (const aksi of ['ajukan', 'setujui', 'kembalikan'] as const) {
        expect(transisiRevisi({ status, aksi, peran: 'admin', pelakuId: 'a', pembuatId: 'b', catatan: 'x' }).ok).toBe(false);
      }
    }
  });
  test('tanpa peran ditolak', () => {
    expect(transisiRevisi({ ...dasar, status: 'draf', aksi: 'ajukan', peran: null }).ok).toBe(false);
  });
});

describe('sunting draf', () => {
  test('hanya pembuat (atau admin) dan hanya selagi draf', () => {
    expect(bolehSuntingDraf({ status: 'draf', peran: 'penulis', pelakuId: 'a', pembuatId: 'a' })).toBe(true);
    expect(bolehSuntingDraf({ status: 'draf', peran: 'penulis', pelakuId: 'a', pembuatId: 'b' })).toBe(false);
    expect(bolehSuntingDraf({ status: 'diajukan', peran: 'penulis', pelakuId: 'a', pembuatId: 'a' })).toBe(false);
    expect(bolehSuntingDraf({ status: 'draf', peran: 'admin', pelakuId: 'a', pembuatId: 'b' })).toBe(true);
  });
});

describe('periksa refs', () => {
  const dikenal = new Set(['R09-7', 'R04-2']);
  test('jenis fikih wajib minimal satu ref', () => {
    expect(periksaRefs('materi', [], dikenal)).toMatch(/minimal satu/);
    expect(periksaRefs('materi', ['R09-7'], dikenal)).toBeNull();
  });
  test('jenis non-fikih boleh tanpa ref', () => {
    expect(periksaRefs('cheatsheet', [], dikenal)).toBeNull();
  });
  test('ref tak dikenal ditolak dan disebut', () => {
    expect(periksaRefs('faq', ['R09-7', 'R99-1'], dikenal)).toMatch(/R99-1/);
  });
});
```

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/content test -- editorial`
Expected: FAIL, `transisiRevisi` tidak diekspor.

- [x] **Step 3: Implementasi**

```ts
// packages/content/src/editorial.ts
// Aturan alur editorial (spec bagian "Alur editorial") sebagai fungsi murni. Menerima status revisi, aksi, dan siapa
// pelakunya; memutuskan boleh/tidak dan status berikutnya. Dipakai repository `memori/`; Postgres menegakkan aturan
// yang sama di fungsi transisi + RLS (supabase/migrations). Kalau salah satu diubah, ubah keduanya.
import { JENIS_FIKIH, type JenisKonten } from './skema.js';

export type Peran = 'admin' | 'penulis' | 'reviewer';
export type StatusRevisi = 'draf' | 'diajukan' | 'disetujui' | 'dikembalikan';
export type AksiEditorial = 'ajukan' | 'setujui' | 'kembalikan';

interface Pelaku { peran: Peran | null; pelakuId: string; pembuatId: string }
type HasilTransisi = { ok: true; status: StatusRevisi } | { ok: false; galat: string };

export function transisiRevisi(p: Pelaku & { status: StatusRevisi; aksi: AksiEditorial; catatan?: string }): HasilTransisi {
  if (p.peran === null) return { ok: false, galat: 'belum punya peran' };
  if (p.aksi === 'ajukan') {
    if (p.status !== 'draf') return { ok: false, galat: `hanya draf yang bisa diajukan (sekarang ${p.status})` };
    if (!milikSendiriAtauAdmin(p)) return { ok: false, galat: 'hanya pembuat draf yang bisa mengajukan' };
    return { ok: true, status: 'diajukan' };
  }
  if (p.status !== 'diajukan') return { ok: false, galat: `hanya revisi diajukan yang bisa diperiksa (sekarang ${p.status})` };
  if (p.peran === 'penulis') return { ok: false, galat: 'penulis tidak bisa memeriksa revisi' };
  if (p.peran === 'reviewer' && p.pelakuId === p.pembuatId) return { ok: false, galat: 'reviewer tidak bisa memeriksa revisinya sendiri' };
  if (p.aksi === 'setujui') return { ok: true, status: 'disetujui' };
  if (!p.catatan?.trim()) return { ok: false, galat: 'mengembalikan revisi wajib disertai catatan' };
  return { ok: true, status: 'dikembalikan' };
}

export const bolehSuntingDraf = (p: Pelaku & { status: StatusRevisi }): boolean =>
  p.peran !== null && p.peran !== 'reviewer' && p.status === 'draf' && milikSendiriAtauAdmin(p);

export function periksaRefs(jenis: JenisKonten, refs: string[], refsDikenal: ReadonlySet<string>): string | null {
  const takDikenal = refs.filter(kode => !refsDikenal.has(kode));
  if (takDikenal.length > 0) return `ref tidak ada di KB: ${takDikenal.join(', ')}`;
  if (JENIS_FIKIH.includes(jenis) && refs.length === 0) return `${jenis} wajib punya minimal satu ref`;
  return null;
}

const milikSendiriAtauAdmin = (p: Pelaku) => p.peran === 'admin' || p.pelakuId === p.pembuatId;
```

Tambahkan ke `index.ts`:

```ts
export { transisiRevisi, bolehSuntingDraf, periksaRefs, type Peran, type StatusRevisi, type AksiEditorial } from './editorial.js';
```

- [x] **Step 4: Jalankan tes**

Run: `pnpm --filter @waris/content test`
Expected: PASS semua.

- [x] **Step 5: Commit**

```bash
git add packages/content/src/editorial.ts packages/content/src/index.ts packages/content/src/__tests__/editorial.test.ts
git commit -m "content: aturan editorial murni (transisi revisi, sunting draf, periksa refs)"
```

---

### Task 3: Supabase lokal + migrasi tabel konten/diksi/refs + trigger

**Files:**
- Modify: `package.json` (root: devDeps `supabase`, script)
- Create: `supabase/config.toml` (via `supabase init`), `supabase/migrations/20260926000001_konten.sql`
- Test: `supabase/tests/database/01_skema.test.sql`

**Interfaces:**
- Produces (dipakai Task 4–9): tabel `daftar_refs(kode, bab)`, `entri_konten(id, jenis, slug, urutan, revisi_terbit_id, versi_terbit)`,
  `revisi(id, entri_id, isi, refs, status, dibuat_oleh, diperiksa_oleh, catatan_review, dibuat_pada, diperiksa_pada)`,
  `diksi(kunci, halaman, revisi_terbit_id, versi_terbit)`, `revisi_diksi(id, kunci, id_teks, ar_teks, catatan, status, dibuat_oleh, diperiksa_oleh, catatan_review, dibuat_pada, diperiksa_pada)`,
  `versi_konten(satu, angka)`, `peran_pengguna(user_id, peran)`, enum `status_revisi`, enum `peran`,
  fungsi `peran_saya() returns peran`.

- [x] **Step 1: Pasang CLI dan inisialisasi**

```bash
pnpm add -Dw supabase@^2 vite-node@^2
pnpm exec supabase init
```

Tambahkan script di root `package.json`:

```json
"scripts": {
  "test": "pnpm -r test",
  "db:mulai": "supabase start",
  "db:reset": "supabase db reset",
  "db:tes": "supabase test db",
  "db:refs": "vite-node scripts/daftar-refs.ts"
}
```

Tambahkan `supabase/.temp/` dan `supabase/.branches/` ke `.gitignore` bila `supabase init` tidak menambahkannya sendiri.

Run: `pnpm db:mulai`
Expected: menampilkan `API URL: http://127.0.0.1:54321`, `DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres`, `anon key`, `service_role key`.

- [x] **Step 2: Tulis tes pgTAP gagal**

```sql
-- supabase/tests/database/01_skema.test.sql
-- Tabel & constraint dasar: refs harus dikenal, jenis fikih wajib ref, revisi beku setelah diajukan.
begin;
select plan(8);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local');
insert into daftar_refs (kode, bab) values ('R09-7', 9), ('R04-2', 4);
insert into entri_konten (id, jenis, slug) values
  ('10000000-0000-0000-0000-000000000001', 'faq', 'contoh'),
  ('10000000-0000-0000-0000-000000000002', 'cheatsheet', 'peta-hajb');

select throws_ok(
  $$insert into entri_konten (jenis, slug) values ('bukan_jenis', 'x')$$, '23514', null, 'jenis tak dikenal ditolak');
select throws_ok(
  $$insert into entri_konten (jenis, slug) values ('faq', 'contoh')$$, '23505', null, 'slug unik per jenis');
select throws_ok(
  $$insert into revisi (entri_id, isi, refs, dibuat_oleh) values ('10000000-0000-0000-0000-000000000001', '{}', '{R99-1}', '00000000-0000-0000-0000-00000000000a')$$,
  'P0001', 'ref tidak ada di KB: R99-1', 'ref tak dikenal ditolak');
select throws_ok(
  $$insert into revisi (entri_id, isi, refs, dibuat_oleh) values ('10000000-0000-0000-0000-000000000001', '{}', '{}', '00000000-0000-0000-0000-00000000000a')$$,
  'P0001', 'faq wajib punya minimal satu ref', 'jenis fikih tanpa ref ditolak');
select lives_ok(
  $$insert into revisi (entri_id, isi, refs, dibuat_oleh) values ('10000000-0000-0000-0000-000000000002', '{}', '{}', '00000000-0000-0000-0000-00000000000a')$$,
  'jenis non-fikih boleh tanpa ref');

insert into revisi (id, entri_id, isi, refs, status, dibuat_oleh) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"a":1}', '{R09-7}', 'diajukan', '00000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$update revisi set isi = '{"a":2}' where id = '20000000-0000-0000-0000-000000000001'$$,
  'P0001', 'revisi yang sudah diajukan tidak bisa diubah', 'isi revisi beku setelah diajukan');
select throws_ok(
  $$update revisi set refs = '{R04-2}' where id = '20000000-0000-0000-0000-000000000001'$$,
  'P0001', 'revisi yang sudah diajukan tidak bisa diubah', 'refs revisi beku setelah diajukan');
select is((select angka from versi_konten), 0::bigint, 'versi_konten mulai dari 0');

select * from finish();
rollback;
```

- [x] **Step 3: Jalankan, pastikan gagal**

Run: `pnpm db:tes`
Expected: FAIL, `relation "daftar_refs" does not exist`.

- [x] **Step 4: Tulis migrasi**

```sql
-- supabase/migrations/20260926000001_konten.sql
-- Konten edukasi & diksi yang dikelola portal (spec "Model data"). Tiap entri punya banyak revisi; yang tampil ke
-- publik hanya revisi yang ditunjuk revisi_terbit_id. SQL Postgres biasa; satu-satunya ketergantungan Supabase
-- adalah auth.users dan auth.uid(), yang di VPS diganti tabel/fungsi setara.

create type status_revisi as enum ('draf', 'diajukan', 'disetujui', 'dikembalikan');
create type peran as enum ('admin', 'penulis', 'reviewer');

-- Diisi dari docs/kb oleh scripts/daftar-refs.ts (supabase/seed.sql); tidak disunting dari portal.
create table daftar_refs (
  kode text primary key check (kode ~ '^R\d{2}-\d+$'),
  bab int not null
);

-- Satu baris; naik tiap ada revisi terbit (konten atau diksi) supaya web cukup mengunduh yang berubah.
create table versi_konten (
  satu boolean primary key default true check (satu),
  angka bigint not null default 0
);
insert into versi_konten default values;

create table entri_konten (
  id uuid primary key default gen_random_uuid(),
  jenis text not null check (jenis in (
    'modul', 'materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'kitab', 'syahid',
    'glosarium_ar', 'ahwal', 'teks_edukasi', 'cheatsheet')),
  slug text not null,
  urutan int not null default 0,
  revisi_terbit_id uuid,
  versi_terbit bigint,
  unique (jenis, slug)
);

create table revisi (
  id uuid primary key default gen_random_uuid(),
  entri_id uuid not null references entri_konten on delete cascade,
  isi jsonb not null,
  refs text[] not null default '{}',
  status status_revisi not null default 'draf',
  dibuat_oleh uuid not null default auth.uid() references auth.users,
  diperiksa_oleh uuid references auth.users,
  catatan_review text,
  dibuat_pada timestamptz not null default now(),
  diperiksa_pada timestamptz
);
create index on revisi (entri_id);
alter table entri_konten add foreign key (revisi_terbit_id) references revisi;

create table diksi (
  kunci text primary key check (kunci ~ '^[a-z0-9_]+(\.[a-z0-9_]+)+$'),
  halaman text not null,
  revisi_terbit_id uuid,
  versi_terbit bigint
);

create table revisi_diksi (
  id uuid primary key default gen_random_uuid(),
  kunci text not null references diksi on delete cascade,
  id_teks text not null,
  ar_teks text,
  catatan text,
  status status_revisi not null default 'draf',
  dibuat_oleh uuid not null default auth.uid() references auth.users,
  diperiksa_oleh uuid references auth.users,
  catatan_review text,
  dibuat_pada timestamptz not null default now(),
  diperiksa_pada timestamptz
);
create index on revisi_diksi (kunci);
alter table diksi add foreign key (revisi_terbit_id) references revisi_diksi;

create table peran_pengguna (
  user_id uuid primary key references auth.users on delete cascade,
  peran peran not null
);

-- security definer supaya kebijakan RLS bisa membaca peran tanpa rekursi ke RLS peran_pengguna.
create function peran_saya() returns peran
language sql stable security definer set search_path = public as $$
  select peran from peran_pengguna where user_id = auth.uid()
$$;

-- Aturan yang sama dengan periksaRefs di packages/content/src/editorial.ts.
create function periksa_refs_revisi() returns trigger
language plpgsql set search_path = public as $$
declare
  jenis_entri text;
  tak_dikenal text;
begin
  select string_agg(kode, ', ') into tak_dikenal
    from unnest(new.refs) as kode where kode not in (select d.kode from daftar_refs d);
  if tak_dikenal is not null then raise exception 'ref tidak ada di KB: %', tak_dikenal; end if;
  select jenis into jenis_entri from entri_konten where id = new.entri_id;
  if jenis_entri in ('materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq', 'ahwal', 'syahid')
     and cardinality(new.refs) = 0 then
    raise exception '% wajib punya minimal satu ref', jenis_entri;
  end if;
  return new;
end $$;
create trigger periksa_refs before insert or update of refs, entri_id on revisi
  for each row execute function periksa_refs_revisi();

-- Revisi tidak pernah diedit setelah diajukan; perubahan = revisi baru.
create function bekukan_revisi() returns trigger
language plpgsql as $$
begin
  if old.status <> 'draf' and (to_jsonb(new) - array['status', 'diperiksa_oleh', 'catatan_review', 'diperiksa_pada'])
                              is distinct from (to_jsonb(old) - array['status', 'diperiksa_oleh', 'catatan_review', 'diperiksa_pada']) then
    raise exception 'revisi yang sudah diajukan tidak bisa diubah';
  end if;
  return new;
end $$;
create trigger bekukan before update on revisi for each row execute function bekukan_revisi();
create trigger bekukan before update on revisi_diksi for each row execute function bekukan_revisi();
```

- [x] **Step 5: Terapkan & jalankan tes**

Run: `pnpm db:reset && pnpm db:tes`
Expected: `01_skema.test.sql .. ok`, 8/8.

(Bila `db:reset` mengeluh `seed.sql` tidak ada: buat `supabase/seed.sql` kosong berisi komentar `-- diisi scripts/daftar-refs.ts`; Task 6 menimpanya.)

- [x] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore supabase/config.toml supabase/seed.sql supabase/migrations/20260926000001_konten.sql supabase/tests/database/01_skema.test.sql
git commit -m "db: supabase lokal, tabel konten/diksi/refs/peran dengan trigger refs dan revisi beku"
```

---

### Task 4: Fungsi transisi editorial di Postgres

**Files:**
- Create: `supabase/migrations/20260926000002_transisi.sql`
- Test: `supabase/tests/database/02_transisi.test.sql`

**Interfaces:**
- Consumes: tabel Task 3, `peran_saya()`
- Produces (dipanggil `supabase.rpc` di Task 9):
  - `ajukan_revisi(p_id uuid)`, `setujui_revisi(p_id uuid)`, `kembalikan_revisi(p_id uuid, p_catatan text)`, `terbitkan_ulang_revisi(p_id uuid)`
  - `ajukan_revisi_diksi(p_id uuid)`, `setujui_revisi_diksi(p_id uuid)`, `kembalikan_revisi_diksi(p_id uuid, p_catatan text)`, `terbitkan_ulang_revisi_diksi(p_id uuid)`
  - semuanya `returns void`, melempar `P0001` dengan pesan Indonesia bila ditolak.

- [x] **Step 1: Tulis tes pgTAP gagal**

```sql
-- supabase/tests/database/02_transisi.test.sql
-- Transisi status lewat fungsi: aturan peran sama dengan transisiRevisi di packages/content, dan penerbitan atomik.
begin;
select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer'),
  ('00000000-0000-0000-0000-00000000000c', 'admin');
insert into daftar_refs values ('R09-7', 9);
insert into entri_konten (id, jenis, slug) values ('10000000-0000-0000-0000-000000000001', 'faq', 'contoh');
insert into revisi (id, entri_id, isi, refs, dibuat_oleh) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"v":1}', '{R09-7}', '00000000-0000-0000-0000-00000000000a'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '{"v":2}', '{R09-7}', '00000000-0000-0000-0000-00000000000b');
insert into diksi (kunci, halaman) values ('hitung.lanjut', 'hitung');
insert into revisi_diksi (id, kunci, id_teks, dibuat_oleh) values
  ('30000000-0000-0000-0000-000000000001', 'hitung.lanjut', 'Lanjut', '00000000-0000-0000-0000-00000000000a');

set local role authenticated;

-- penulis
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select lives_ok($$select ajukan_revisi('20000000-0000-0000-0000-000000000001')$$, 'penulis mengajukan drafnya');
select throws_ok($$select ajukan_revisi('20000000-0000-0000-0000-000000000002')$$, 'P0001', null, 'penulis tidak bisa mengajukan draf orang lain');
select throws_ok($$select setujui_revisi('20000000-0000-0000-0000-000000000001')$$, 'P0001', null, 'penulis tidak bisa menyetujui');
select lives_ok($$select ajukan_revisi_diksi('30000000-0000-0000-0000-000000000001')$$, 'penulis mengajukan draf diksi');

-- reviewer
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select lives_ok($$select ajukan_revisi('20000000-0000-0000-0000-000000000002')$$, 'reviewer mengajukan drafnya sendiri');
select throws_ok($$select setujui_revisi('20000000-0000-0000-0000-000000000002')$$, 'P0001', null, 'reviewer tidak bisa menyetujui revisinya sendiri');
select throws_ok($$select kembalikan_revisi('20000000-0000-0000-0000-000000000001', '  ')$$, 'P0001', null, 'kembalikan tanpa catatan ditolak');
select lives_ok($$select setujui_revisi('20000000-0000-0000-0000-000000000001')$$, 'reviewer menyetujui revisi penulis');
select lives_ok($$select setujui_revisi_diksi('30000000-0000-0000-0000-000000000001')$$, 'reviewer menyetujui diksi');

reset role;
select is((select revisi_terbit_id from entri_konten where id = '10000000-0000-0000-0000-000000000001'),
          '20000000-0000-0000-0000-000000000001'::uuid, 'setujui menunjuk revisi terbit');
select is((select angka from versi_konten), 2::bigint, 'versi_konten naik sekali per penerbitan');
select is((select versi_terbit from entri_konten where id = '10000000-0000-0000-0000-000000000001'), 1::bigint, 'entri mencatat versi terbitnya');

-- rollback: admin menyetujui revisi reviewer, lalu menerbitkan ulang revisi lama
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select setujui_revisi('20000000-0000-0000-0000-000000000002');
select terbitkan_ulang_revisi('20000000-0000-0000-0000-000000000001');
reset role;
select is((select revisi_terbit_id from entri_konten where id = '10000000-0000-0000-0000-000000000001'),
          '20000000-0000-0000-0000-000000000001'::uuid, 'rollback menerbitkan ulang revisi lama');

select * from finish();
rollback;
```

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm db:tes`
Expected: FAIL, `function ajukan_revisi(unknown) does not exist`.

- [x] **Step 3: Tulis migrasi**

```sql
-- supabase/migrations/20260926000002_transisi.sql
-- Transisi status revisi (spec "Alur editorial"). Satu-satunya jalan mengubah status: RLS melarang update status
-- langsung. security definer supaya penerbitan (status, revisi_terbit_id, versi_konten) terjadi dalam satu transaksi.
-- Aturan peran sama dengan transisiRevisi di packages/content/src/editorial.ts.

-- Naikkan versi_konten dan kembalikan angka barunya.
create function naikkan_versi_konten() returns bigint
language sql security definer set search_path = public as $$
  update versi_konten set angka = angka + 1 returning angka
$$;

create function periksa_boleh_memeriksa(p_pembuat uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if peran_saya() is null or peran_saya() = 'penulis' then
    raise exception 'hanya reviewer atau admin yang bisa memeriksa revisi';
  end if;
  if peran_saya() = 'reviewer' and p_pembuat = auth.uid() then
    raise exception 'reviewer tidak bisa memeriksa revisinya sendiri';
  end if;
end $$;

-- ===== revisi konten =====

create function ajukan_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update revisi set status = 'diajukan'
   where id = p_id and status = 'draf' and peran_saya() is not null
     and (dibuat_oleh = auth.uid() or peran_saya() = 'admin');
  if not found then raise exception 'revisi % tidak bisa diajukan', p_id; end if;
end $$;

create function setujui_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  select * into r from revisi where id = p_id and status = 'diajukan' for update;
  if not found then raise exception 'revisi % tidak sedang diajukan', p_id; end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi set status = 'disetujui', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = p_id;
  update entri_konten set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where id = r.entri_id;
end $$;

create function kembalikan_revisi(p_id uuid, p_catatan text) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  if coalesce(btrim(p_catatan), '') = '' then raise exception 'mengembalikan revisi wajib disertai catatan'; end if;
  select * into r from revisi where id = p_id and status = 'diajukan' for update;
  if not found then raise exception 'revisi % tidak sedang diajukan', p_id; end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi set status = 'dikembalikan', diperiksa_oleh = auth.uid(), diperiksa_pada = now(), catatan_review = p_catatan
   where id = p_id;
end $$;

-- Rollback: menunjuk ulang revisi yang dulu pernah disetujui.
create function terbitkan_ulang_revisi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi;
begin
  if peran_saya() is null or peran_saya() = 'penulis' then raise exception 'hanya reviewer atau admin yang bisa rollback'; end if;
  select * into r from revisi where id = p_id and status = 'disetujui';
  if not found then raise exception 'hanya revisi disetujui yang bisa diterbitkan ulang'; end if;
  update entri_konten set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where id = r.entri_id;
end $$;

-- ===== revisi diksi (aturan sama, tabel lain) =====

create function ajukan_revisi_diksi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update revisi_diksi set status = 'diajukan'
   where id = p_id and status = 'draf' and peran_saya() is not null
     and (dibuat_oleh = auth.uid() or peran_saya() = 'admin');
  if not found then raise exception 'revisi diksi % tidak bisa diajukan', p_id; end if;
end $$;

create function setujui_revisi_diksi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi_diksi;
begin
  select * into r from revisi_diksi where id = p_id and status = 'diajukan' for update;
  if not found then raise exception 'revisi diksi % tidak sedang diajukan', p_id; end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi_diksi set status = 'disetujui', diperiksa_oleh = auth.uid(), diperiksa_pada = now() where id = p_id;
  update diksi set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where kunci = r.kunci;
end $$;

create function kembalikan_revisi_diksi(p_id uuid, p_catatan text) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi_diksi;
begin
  if coalesce(btrim(p_catatan), '') = '' then raise exception 'mengembalikan revisi wajib disertai catatan'; end if;
  select * into r from revisi_diksi where id = p_id and status = 'diajukan' for update;
  if not found then raise exception 'revisi diksi % tidak sedang diajukan', p_id; end if;
  perform periksa_boleh_memeriksa(r.dibuat_oleh);
  update revisi_diksi set status = 'dikembalikan', diperiksa_oleh = auth.uid(), diperiksa_pada = now(), catatan_review = p_catatan
   where id = p_id;
end $$;

create function terbitkan_ulang_revisi_diksi(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r revisi_diksi;
begin
  if peran_saya() is null or peran_saya() = 'penulis' then raise exception 'hanya reviewer atau admin yang bisa rollback'; end if;
  select * into r from revisi_diksi where id = p_id and status = 'disetujui';
  if not found then raise exception 'hanya revisi disetujui yang bisa diterbitkan ulang'; end if;
  update diksi set revisi_terbit_id = p_id, versi_terbit = naikkan_versi_konten() where kunci = r.kunci;
end $$;

-- naikkan_versi_konten & periksa_boleh_memeriksa hanya untuk dipakai fungsi di atas.
revoke execute on function naikkan_versi_konten(), periksa_boleh_memeriksa(uuid) from public, anon, authenticated;
```

- [x] **Step 4: Terapkan & jalankan tes**

Run: `pnpm db:reset && pnpm db:tes`
Expected: `01_skema` 8/8, `02_transisi` 13/13.

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/20260926000002_transisi.sql supabase/tests/database/02_transisi.test.sql
git commit -m "db: fungsi transisi editorial atomik (ajukan, setujui, kembalikan, terbitkan ulang)"
```

---

### Task 5: Tabel data pengguna + RLS semua tabel

**Files:**
- Create: `supabase/migrations/20260926000003_pengguna.sql`, `supabase/migrations/20260926000004_rls.sql`
- Test: `supabase/tests/database/03_rls.test.sql`

**Interfaces:**
- Produces: tabel `riwayat_hitung(id, user_id, kasus, judul, disimpan_pada)`, `progres_belajar(user_id, pelajaran_slug, selesai, diubah_pada)`,
  `progres_latihan(user_id, soal_slug, jenis, jawaban_terakhir, benar, jumlah_coba, diubah_pada)`, `preferensi(user_id, isi, diubah_pada)`.
  RLS aktif di semua tabel `public`.

- [x] **Step 1: Tulis tes pgTAP gagal**

```sql
-- supabase/tests/database/03_rls.test.sql
-- RLS (spec "Dijaga RLS"): anonim hanya melihat yang terbit; penulis tidak bisa mengubah status langsung;
-- pengguna A tidak bisa membaca data pengguna B.
begin;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local'),
  ('00000000-0000-0000-0000-00000000000d', 'biasa-a@tes.local'),
  ('00000000-0000-0000-0000-00000000000e', 'biasa-b@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer');
insert into daftar_refs values ('R09-7', 9);
insert into entri_konten (id, jenis, slug) values
  ('10000000-0000-0000-0000-000000000001', 'faq', 'terbit'),
  ('10000000-0000-0000-0000-000000000002', 'faq', 'belum');
insert into revisi (id, entri_id, isi, refs, status, dibuat_oleh) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{}', '{R09-7}', 'disetujui', '00000000-0000-0000-0000-00000000000a'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{}', '{R09-7}', 'draf', '00000000-0000-0000-0000-00000000000a');
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000001' where id = '10000000-0000-0000-0000-000000000001';
insert into progres_belajar values ('00000000-0000-0000-0000-00000000000e', 'ashabah-1', true, now());

-- anonim
set local role anon;
select is((select count(*) from revisi), 1::bigint, 'anonim hanya melihat revisi terbit');
select is((select count(*) from entri_konten), 1::bigint, 'anonim hanya melihat entri yang punya revisi terbit');
select is((select count(*) from daftar_refs), 1::bigint, 'anonim bisa membaca daftar_refs');
select throws_ok($$insert into entri_konten (jenis, slug) values ('faq', 'x')$$, '42501', null, 'anonim tidak bisa menulis');

-- penulis
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*) from revisi), 2::bigint, 'penulis melihat semua revisi');
select lives_ok($$insert into revisi (entri_id, isi, refs) values ('10000000-0000-0000-0000-000000000002', '{}', '{R09-7}')$$, 'penulis membuat draf');
update revisi set status = 'disetujui' where id = '20000000-0000-0000-0000-000000000002';
select is((select status from revisi where id = '20000000-0000-0000-0000-000000000002'), 'draf'::status_revisi,
          'penulis tidak bisa mengubah status langsung');
select throws_ok($$update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000002'$$, '42501', null,
                 'penulis tidak bisa menunjuk revisi terbit langsung');

-- reviewer tidak bisa update revisi langsung
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
update revisi set status = 'disetujui' where id = '20000000-0000-0000-0000-000000000002';
select is((select status from revisi where id = '20000000-0000-0000-0000-000000000002'), 'draf'::status_revisi,
          'reviewer juga harus lewat fungsi transisi');

-- pengguna biasa
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';
select is((select count(*) from progres_belajar), 0::bigint, 'A tidak melihat progres B');
select throws_ok($$insert into progres_belajar values ('00000000-0000-0000-0000-00000000000e', 'x', true, now())$$, '42501', null,
                 'A tidak bisa menulis atas nama B');
select lives_ok($$insert into preferensi (user_id, isi) values ('00000000-0000-0000-0000-00000000000d', '{"bahasa":"ar"}')$$,
                'A menulis preferensinya sendiri');

select * from finish();
rollback;
```

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm db:tes`
Expected: FAIL, `relation "progres_belajar" does not exist`.

- [x] **Step 3: Migrasi tabel pengguna**

```sql
-- supabase/migrations/20260926000003_pengguna.sql
-- Data milik pengguna yang login (spec "Data pengguna"). Konflik antar perangkat: yang terakhir menang per baris
-- berdasarkan diubah_pada (ditangani klien). Hasil hitung tidak pernah masuk ke sini kecuali pengguna menekan "Simpan".

create table riwayat_hitung (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kasus jsonb not null,
  judul text not null,
  disimpan_pada timestamptz not null default now(),
  primary key (user_id, id)
);

create table progres_belajar (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  pelajaran_slug text not null,
  selesai boolean not null,
  diubah_pada timestamptz not null default now(),
  primary key (user_id, pelajaran_slug)
);

create table progres_latihan (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  soal_slug text not null,
  jenis text not null check (jenis in ('kuis', 'hitung')),
  jawaban_terakhir jsonb,
  benar boolean not null,
  jumlah_coba int not null check (jumlah_coba >= 1),
  diubah_pada timestamptz not null default now(),
  primary key (user_id, jenis, soal_slug)
);

create table preferensi (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  isi jsonb not null,
  diubah_pada timestamptz not null default now()
);
```

(`riwayat_hitung.id` = id kasus dari klien, bertipe `text`, supaya gabung-duplikat berdasarkan id kasus di tahap 4 cukup `upsert`.)

- [x] **Step 4: Migrasi RLS**

```sql
-- supabase/migrations/20260926000004_rls.sql
-- Siapa boleh apa (spec "Dijaga RLS"). Status revisi dan revisi_terbit_id hanya berubah lewat fungsi transisi
-- (security definer), jadi tidak ada kebijakan update yang mengizinkannya.

alter table daftar_refs enable row level security;
alter table versi_konten enable row level security;
alter table entri_konten enable row level security;
alter table revisi enable row level security;
alter table diksi enable row level security;
alter table revisi_diksi enable row level security;
alter table peran_pengguna enable row level security;
alter table riwayat_hitung enable row level security;
alter table progres_belajar enable row level security;
alter table progres_latihan enable row level security;
alter table preferensi enable row level security;

-- ===== baca publik =====
create policy baca on daftar_refs for select using (true);
create policy baca on versi_konten for select using (true);
create policy baca on entri_konten for select using (revisi_terbit_id is not null or peran_saya() is not null);
create policy baca on revisi for select
  using (peran_saya() is not null or id in (select revisi_terbit_id from entri_konten where revisi_terbit_id is not null));
create policy baca on diksi for select using (revisi_terbit_id is not null or peran_saya() is not null);
create policy baca on revisi_diksi for select
  using (peran_saya() is not null or id in (select revisi_terbit_id from diksi where revisi_terbit_id is not null));

-- ===== tim konten =====
-- Entri baru: penulis/admin. Ubah urutan/slug & hapus: admin saja. Kolom revisi_terbit_id/versi_terbit tidak
-- diberikan ke authenticated sama sekali (lihat revoke di bawah).
create policy tambah on entri_konten for insert to authenticated
  with check (peran_saya() in ('admin', 'penulis') and revisi_terbit_id is null);
create policy ubah on entri_konten for update to authenticated using (peran_saya() = 'admin');
create policy hapus on entri_konten for delete to authenticated using (peran_saya() = 'admin');
create policy tambah on diksi for insert to authenticated
  with check (peran_saya() in ('admin', 'penulis') and revisi_terbit_id is null);
create policy ubah on diksi for update to authenticated using (peran_saya() = 'admin');

-- Draf: dibuat & disunting pembuatnya (atau admin) selama masih draf. Reviewer tidak menulis draf lewat tabel.
create policy tambah on revisi for insert to authenticated
  with check (peran_saya() in ('admin', 'penulis') and status = 'draf' and dibuat_oleh = auth.uid());
create policy ubah_draf on revisi for update to authenticated
  using (status = 'draf' and (dibuat_oleh = auth.uid() or peran_saya() = 'admin') and peran_saya() in ('admin', 'penulis'))
  with check (status = 'draf');
create policy hapus_draf on revisi for delete to authenticated
  using (status = 'draf' and (dibuat_oleh = auth.uid() or peran_saya() = 'admin'));
create policy tambah on revisi_diksi for insert to authenticated
  with check (peran_saya() in ('admin', 'penulis') and status = 'draf' and dibuat_oleh = auth.uid());
create policy ubah_draf on revisi_diksi for update to authenticated
  using (status = 'draf' and (dibuat_oleh = auth.uid() or peran_saya() = 'admin') and peran_saya() in ('admin', 'penulis'))
  with check (status = 'draf');
create policy hapus_draf on revisi_diksi for delete to authenticated
  using (status = 'draf' and (dibuat_oleh = auth.uid() or peran_saya() = 'admin'));

-- Penunjuk terbit hanya berubah lewat fungsi transisi.
revoke update (revisi_terbit_id, versi_terbit) on entri_konten from anon, authenticated;
revoke update (revisi_terbit_id, versi_terbit) on diksi from anon, authenticated;
revoke insert, update, delete on daftar_refs, versi_konten from anon, authenticated;

-- ===== peran =====
create policy baca on peran_pengguna for select to authenticated using (user_id = auth.uid() or peran_saya() = 'admin');
create policy kelola on peran_pengguna for all to authenticated using (peran_saya() = 'admin') with check (peran_saya() = 'admin');

-- ===== data pengguna: hanya pemiliknya =====
create policy milik_sendiri on riwayat_hitung for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy milik_sendiri on progres_belajar for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy milik_sendiri on progres_latihan for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy milik_sendiri on preferensi for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
```

Catatan: tes "penulis tidak bisa menunjuk revisi terbit" mengharapkan `42501` (permission denied) dari `revoke update (kolom)`.
Tes "tidak bisa mengubah status langsung" memakai `update` biasa; karena `with check (status = 'draf')` gagal, Postgres melempar
`42501` "new row violates row-level security policy". Bila itu yang terjadi, ganti dua tes `update ... ; select is(...)`
tersebut menjadi `throws_ok($$update revisi set status = 'disetujui' where id = '...'$$, '42501', null, '...')` — keduanya
membuktikan hal yang sama; pilih yang cocok dengan perilaku nyata dan jangan longgarkan kebijakannya. Untuk reviewer,
`using` tidak cocok sehingga update diam-diam 0 baris dan `select is(...)` benar.

- [x] **Step 5: Terapkan & jalankan tes**

Run: `pnpm db:reset && pnpm db:tes`
Expected: tiga berkas tes ok (8 + 13 + 12). Jalankan ulang `02_transisi` juga harus tetap lolos dengan RLS aktif (fungsi security definer).

- [x] **Step 6: Commit**

```bash
git add supabase/migrations/20260926000003_pengguna.sql supabase/migrations/20260926000004_rls.sql supabase/tests/database/03_rls.test.sql
git commit -m "db: tabel data pengguna dan RLS semua tabel"
```

---

### Task 6: `scripts/daftar-refs.ts` → `supabase/seed.sql`

**Files:**
- Create: `scripts/daftar-refs.ts`
- Modify: `supabase/seed.sql` (dihasilkan)
- Test: `packages/content/src/__tests__/refs.test.ts` (tambah satu tes untuk fungsi SQL-nya)

**Interfaces:**
- Consumes: `RUJUKAN` dari `@waris/content` (`kode`, `bab`)
- Produces: `sqlDaftarRefs(daftar: { kode: string; bab: number }[]): string` di `packages/content/src/refs.ts`; `supabase/seed.sql` berisi `insert into daftar_refs ... on conflict do nothing`.

- [x] **Step 1: Tes gagal**

Tambahkan di `packages/content/src/__tests__/refs.test.ts`:

```ts
import { RUJUKAN, sqlDaftarRefs } from '../index.js';

test('sqlDaftarRefs: satu baris per kode, terurut, idempoten', () => {
  const sql = sqlDaftarRefs([{ kode: 'R09-7', bab: 9 }, { kode: 'R04-2', bab: 4 }, { kode: 'R04-2', bab: 4 }]);
  expect(sql).toBe(
    "insert into daftar_refs (kode, bab) values\n  ('R04-2', 4),\n  ('R09-7', 9)\non conflict (kode) do update set bab = excluded.bab;\n");
});

test('semua kode RUJUKAN cocok dengan pola kolom daftar_refs', () => {
  for (const rujukan of RUJUKAN) expect(rujukan.kode).toMatch(/^R\d{2}-\d+$/);
});
```

(Gabungkan `import` dengan impor yang sudah ada di berkas itu.)

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/content test -- refs`
Expected: FAIL, `sqlDaftarRefs` tidak diekspor.

- [x] **Step 3: Implementasi**

Di akhir `packages/content/src/refs.ts`:

```ts
/** Isi tabel `daftar_refs` (supabase/seed.sql) dari kode rujukan KB; urut & tanpa duplikat supaya diff seed stabil. */
export function sqlDaftarRefs(daftar: { kode: string; bab: number }[]): string {
  const unik = [...new Map(daftar.map(rujukan => [rujukan.kode, rujukan.bab])).entries()]
    .sort(([kodeA], [kodeB]) => kodeA.localeCompare(kodeB, 'en', { numeric: true }));
  const baris = unik.map(([kode, bab]) => `  ('${kode}', ${bab})`).join(',\n');
  return `insert into daftar_refs (kode, bab) values\n${baris}\non conflict (kode) do update set bab = excluded.bab;\n`;
}
```

Ekspor dari `index.ts` di baris ekspor `refs.js` yang sudah ada: tambahkan `sqlDaftarRefs`.

```ts
// scripts/daftar-refs.ts
// docs/kb (tabel "Dasar dan Rujukan" tiap bab) → supabase/seed.sql. Dijalankan dengan vite-node karena
// packages/content mengimpor berkas KB lewat `?raw`. Jalankan ulang setiap KB berubah, lalu `pnpm db:reset`.
import { writeFileSync } from 'node:fs';
import { RUJUKAN, sqlDaftarRefs } from '@waris/content';

const KEPALA = '-- DIHASILKAN scripts/daftar-refs.ts dari docs/kb. Jangan disunting manual.\n';
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), KEPALA + sqlDaftarRefs(RUJUKAN));
console.log(`daftar_refs: ${new Set(RUJUKAN.map(rujukan => rujukan.kode)).size} kode`);
```

Agar `@waris/content` bisa diimpor dari root: `pnpm add -Dw @waris/content@workspace:*`.

- [x] **Step 4: Jalankan tes, skrip, dan reset DB**

```bash
pnpm --filter @waris/content test
pnpm db:refs
pnpm db:reset
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "select count(*) from daftar_refs"
```

Expected: tes PASS; skrip mencetak `daftar_refs: N kode`; `count` = N. Lalu `pnpm db:tes` tetap lolos
(tes pgTAP memakai `insert ... values ('R09-7', 9)` → sekarang bentrok karena seed sudah mengisinya).
**Ubah** setiap `insert into daftar_refs ...` di ketiga berkas tes menjadi `... on conflict do nothing;`, dan di
`01_skema.test.sql` ganti `select is((select count(*) from daftar_refs), 1::bigint, ...)` bila ada — di `03_rls` ganti
menjadi `select ok((select count(*) from daftar_refs) >= 1, 'anonim bisa membaca daftar_refs');`.

Run: `pnpm db:tes`
Expected: semua ok.

- [x] **Step 5: Commit**

```bash
git add scripts/daftar-refs.ts supabase/seed.sql supabase/tests packages/content/src/refs.ts packages/content/src/index.ts packages/content/src/__tests__/refs.test.ts package.json pnpm-lock.yaml
git commit -m "db: daftar_refs dihasilkan dari docs/kb lewat scripts/daftar-refs.ts"
```

---

### Task 7: `packages/data` — antarmuka + `memori/` untuk konten, editorial, diksi

**Files:**
- Create: `packages/data/package.json`, `packages/data/tsconfig.json`, `packages/data/vitest.config.ts`
- Create: `packages/data/src/antarmuka.ts`, `packages/data/src/saring.ts`, `packages/data/src/memori/konten.ts`, `packages/data/src/index.ts`
- Test: `packages/data/src/__tests__/memori-konten.test.ts`

**Interfaces:**
- Consumes: `JenisKonten`, `IsiKonten`, `keJson`, `bacaIsi`, `transisiRevisi`, `bolehSuntingDraf`, `periksaRefs`, `Peran`, `StatusRevisi` (Task 1–2)
- Produces (dipakai Task 8–9 dan tahap 2–4):

```ts
export interface Sesi { userId: string; email: string }
export interface KontenTerbit<J extends JenisKonten = JenisKonten> {
  entriId: string; jenis: J; slug: string; urutan: number; revisiId: string; isi: IsiKonten[J]; refs: string[]; versiTerbit: number;
}
export interface RingkasanRevisi {
  id: string; entriId: string; status: StatusRevisi; refs: string[]; isi: unknown; dibuatOleh: string;
  diperiksaOleh: string | null; catatanReview: string | null; dibuatPada: string; diperiksaPada: string | null;
}
export interface DiksiTerbit { kunci: string; halaman: string; id: string; ar: string | null; versiTerbit: number }
export interface RingkasanRevisiDiksi {
  id: string; kunci: string; idTeks: string; arTeks: string | null; catatan: string | null; status: StatusRevisi;
  dibuatOleh: string; diperiksaOleh: string | null; catatanReview: string | null; dibuatPada: string;
}

export interface RepositoriKonten {
  versiSekarang(): Promise<number>;
  /** Hanya revisi terbit; isi tidak valid dibuang (console.warn), tidak melempar. */
  bacaTerbit(saring?: { jenis?: JenisKonten; sejakVersi?: number }): Promise<KontenTerbit[]>;
  daftarRevisi(entriId: string): Promise<RingkasanRevisi[]>;
}
export interface RepositoriEditorial {
  buatEntri(jenis: JenisKonten, slug: string, urutan: number): Promise<string>;
  /** Validasi isi (Zod) & refs sebelum simpan; melempar Error berpesan Indonesia bila tidak sah. */
  buatDraf<J extends JenisKonten>(entriId: string, jenis: J, isi: IsiKonten[J], refs: string[]): Promise<string>;
  ubahDraf<J extends JenisKonten>(revisiId: string, jenis: J, isi: IsiKonten[J], refs: string[]): Promise<void>;
  ajukan(revisiId: string): Promise<void>;
  setujui(revisiId: string): Promise<void>;
  kembalikan(revisiId: string, catatan: string): Promise<void>;
  terbitkanUlang(revisiId: string): Promise<void>;
  antreanReview(): Promise<RingkasanRevisi[]>;
}
export interface RepositoriDiksi {
  bacaTerbit(sejakVersi?: number): Promise<DiksiTerbit[]>;
  buatKunci(kunci: string, halaman: string): Promise<void>;
  buatDraf(kunci: string, idTeks: string, arTeks: string | null, catatan: string | null): Promise<string>;
  ajukan(revisiId: string): Promise<void>;
  setujui(revisiId: string): Promise<void>;
  kembalikan(revisiId: string, catatan: string): Promise<void>;
  terbitkanUlang(revisiId: string): Promise<void>;
  daftarRevisi(kunci: string): Promise<RingkasanRevisiDiksi[]>;
}
```

  - `saringValid(baris: { jenis: JenisKonten; slug: string; isi: unknown }[]): KontenTerbit[]` di `saring.ts` (bentuk lengkap di kode)
  - `buatMemori(awal?: { refs?: string[]; sesi?: Sesi | null; peran?: Record<string, Peran> }): MemoriBersama` di `memori/konten.ts`,
    dengan `MemoriBersama = { konten: RepositoriKonten; editorial: RepositoriEditorial; diksi: RepositoriDiksi; masukSebagai(sesi: Sesi | null): void; aturPeranLangsung(userId: string, peran: Peran | null): void; isiRevisiMentah(revisiId: string, isi: unknown): void }`

- [x] **Step 1: Kerangka paket**

```json
// packages/data/package.json
{
  "name": "@waris/data",
  "version": "0.0.1",
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run" },
  "dependencies": { "@waris/content": "workspace:*" },
  "devDependencies": { "typescript": "^5.5.0", "vitest": "^2.0.0" }
}
```

`tsconfig.json` dan `vitest.config.ts`: salin persis dari `packages/content/` (content memakai `?raw`; salin juga
`/// <reference path>` tidak perlu — vitest menangani `?raw` saat content diimpor).

Run: `pnpm install`

- [x] **Step 2: Tulis tes gagal**

```ts
// packages/data/src/__tests__/memori-konten.test.ts
import { describe, expect, test, vi } from 'vitest';
import { DAFTAR_FAQ, DAFTAR_SOAL_HITUNG } from '@waris/content';
import { buatMemori } from '../index.js';

const PENULIS = { userId: 'p', email: 'p@tes.local' };
const REVIEWER = { userId: 'r', email: 'r@tes.local' };
const siapkan = () => buatMemori({ refs: ['R09-7', 'R04-2'], peran: { p: 'penulis', r: 'reviewer' }, sesi: PENULIS });

describe('memori: konten & editorial', () => {
  test('alur lengkap: draf → ajukan → setujui → terbit, versi naik', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ[0]!, ['R09-7']);
    expect(await db.konten.bacaTerbit()).toEqual([]);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    expect((await db.editorial.antreanReview()).map(revisi => revisi.id)).toEqual([revisiId]);
    await db.editorial.setujui(revisiId);
    const terbit = await db.konten.bacaTerbit();
    expect(terbit).toHaveLength(1);
    expect(terbit[0]!.isi).toEqual(DAFTAR_FAQ[0]);
    expect(await db.konten.versiSekarang()).toBe(1);
  });

  test('bigint tetap bigint setelah disimpan dan dibaca', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('soal_hitung', 'H-01', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'soal_hitung', DAFTAR_SOAL_HITUNG[0]!, ['R09-7']);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.editorial.setujui(revisiId);
    const [soal] = await db.konten.bacaTerbit({ jenis: 'soal_hitung' });
    expect(soal!.isi).toEqual(DAFTAR_SOAL_HITUNG[0]);
  });

  test('sejakVersi hanya mengembalikan yang terbit setelahnya', async () => {
    const db = siapkan();
    for (const [indeks, faq] of DAFTAR_FAQ.slice(0, 2).entries()) {
      db.masukSebagai(PENULIS);
      const entriId = await db.editorial.buatEntri('faq', `f${indeks}`, indeks);
      const revisiId = await db.editorial.buatDraf(entriId, 'faq', faq, ['R09-7']);
      await db.editorial.ajukan(revisiId);
      db.masukSebagai(REVIEWER);
      await db.editorial.setujui(revisiId);
    }
    expect((await db.konten.bacaTerbit({ sejakVersi: 1 })).map(konten => konten.slug)).toEqual(['f1']);
  });

  test('aturan ditolak dengan Error', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    await expect(db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ[0]!, [])).rejects.toThrow(/minimal satu ref/);
    await expect(db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ[0]!, ['R99-1'])).rejects.toThrow(/R99-1/);
    await expect(db.editorial.buatDraf(entriId, 'faq', { id: 'x' } as never, ['R09-7'])).rejects.toThrow(/tidak sah/);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ[0]!, ['R09-7']);
    await expect(db.editorial.setujui(revisiId)).rejects.toThrow();
    await db.editorial.ajukan(revisiId);
    await expect(db.editorial.ubahDraf(revisiId, 'faq', DAFTAR_FAQ[1]!, ['R09-7'])).rejects.toThrow();
    db.masukSebagai(REVIEWER);
    await expect(db.editorial.kembalikan(revisiId, '')).rejects.toThrow(/catatan/);
  });

  test('rollback menerbitkan ulang revisi lama', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiIds: string[] = [];
    for (const faq of DAFTAR_FAQ.slice(0, 2)) {
      db.masukSebagai(PENULIS);
      const revisiId = await db.editorial.buatDraf(entriId, 'faq', faq, ['R09-7']);
      await db.editorial.ajukan(revisiId);
      db.masukSebagai(REVIEWER);
      await db.editorial.setujui(revisiId);
      revisiIds.push(revisiId);
    }
    await db.editorial.terbitkanUlang(revisiIds[0]!);
    expect((await db.konten.bacaTerbit())[0]!.isi).toEqual(DAFTAR_FAQ[0]);
    expect(await db.konten.daftarRevisi(entriId)).toHaveLength(2);
  });

  test('isi tidak valid di baris terbit dibuang dengan peringatan, bukan crash', async () => {
    const db = siapkan();
    const entriId = await db.editorial.buatEntri('faq', 'contoh', 1);
    const revisiId = await db.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ[0]!, ['R09-7']);
    await db.editorial.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.editorial.setujui(revisiId);
    db.isiRevisiMentah(revisiId, { rusak: true });
    const peringatan = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await db.konten.bacaTerbit()).toEqual([]);
    expect(peringatan).toHaveBeenCalledWith(expect.stringContaining('faq/contoh'));
    peringatan.mockRestore();
  });

  test('diksi: draf → terbit; ar kosong = null', async () => {
    const db = siapkan();
    await db.diksi.buatKunci('hitung.lanjut', 'hitung');
    const revisiId = await db.diksi.buatDraf('hitung.lanjut', 'Lanjut', null, null);
    await db.diksi.ajukan(revisiId);
    db.masukSebagai(REVIEWER);
    await db.diksi.setujui(revisiId);
    expect(await db.diksi.bacaTerbit()).toEqual([{ kunci: 'hitung.lanjut', halaman: 'hitung', id: 'Lanjut', ar: null, versiTerbit: 1 }]);
  });
});
```

- [x] **Step 3: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/data test`
Expected: FAIL, `buatMemori` tidak ada.

- [x] **Step 4: Implementasi antarmuka, saring, memori**

`packages/data/src/antarmuka.ts`: tempel persis blok antarmuka di bagian **Interfaces** di atas, dibuka dengan:

```ts
// Antarmuka repository (spec "Arsitektur"). App hanya mengenal antarmuka ini; implementasinya memori/ (tes & snapshot)
// dan supabase/ (sekarang), nanti http/ (VPS). Pesan galat dari semua implementasi = Error berpesan Indonesia.
import type { IsiKonten, JenisKonten, Peran, StatusRevisi } from '@waris/content';
```

(`Peran` dipakai `RepositoriAkun` di Task 8; tambahkan antarmuka itu di Task 8.)

```ts
// packages/data/src/saring.ts
// Validasi baris konten terbit dari sumber mana pun (DB, cache, snapshot). Yang tidak lolos skema dibuang dan dicatat,
// supaya satu entri rusak tidak menjatuhkan seluruh web.
import { bacaIsi, type JenisKonten } from '@waris/content';
import type { KontenTerbit } from './antarmuka.js';

export type BarisTerbitMentah = Omit<KontenTerbit, 'isi'> & { isi: unknown };

export function saringValid(daftar: BarisTerbitMentah[]): KontenTerbit[] {
  return daftar.flatMap(baris => {
    const hasil = bacaIsi(baris.jenis as JenisKonten, baris.isi);
    if (hasil.ok) return [{ ...baris, isi: hasil.isi } as KontenTerbit];
    console.warn(`konten ${baris.jenis}/${baris.slug} dibuang: ${hasil.galat}`);
    return [];
  });
}
```

```ts
// packages/data/src/memori/konten.ts
// Repository di memori untuk tes dan snapshot build. Menegakkan aturan yang sama dengan Postgres (fungsi transisi + RLS)
// lewat aturan murni di packages/content, supaya tes app tanpa jaringan tetap setia pada perilaku DB.
// Isi disimpan dalam bentuk JSON (keJson) seperti di jsonb, lalu dibaca ulang lewat saringValid.
import {
  bolehSuntingDraf, keJson, periksaRefs, transisiRevisi, bacaIsi,
  type AksiEditorial, type IsiKonten, type JenisKonten, type Peran, type StatusRevisi,
} from '@waris/content';
import type {
  DiksiTerbit, RepositoriDiksi, RepositoriEditorial, RepositoriKonten, RingkasanRevisi, RingkasanRevisiDiksi, Sesi,
} from '../antarmuka.js';
import { saringValid } from '../saring.js';

interface EntriMemori { id: string; jenis: JenisKonten; slug: string; urutan: number; revisiTerbitId: string | null; versiTerbit: number | null }
interface KunciDiksiMemori { kunci: string; halaman: string; revisiTerbitId: string | null; versiTerbit: number | null }

export interface MemoriBersama {
  konten: RepositoriKonten;
  editorial: RepositoriEditorial;
  diksi: RepositoriDiksi;
  masukSebagai(sesi: Sesi | null): void;
  aturPeranLangsung(userId: string, peran: Peran | null): void;
  /** Hanya untuk tes: meniru baris jsonb yang disunting manual di DB. */
  isiRevisiMentah(revisiId: string, isi: unknown): void;
}

export function buatMemori(awal: { refs?: string[]; sesi?: Sesi | null; peran?: Record<string, Peran> } = {}): MemoriBersama {
  const refsDikenal = new Set(awal.refs ?? []);
  const peran = new Map(Object.entries(awal.peran ?? {}));
  let sesi = awal.sesi ?? null;
  let versi = 0;
  let nomorId = 0;
  const idBaru = () => `m-${++nomorId}`;
  const sekarang = () => new Date(0).toISOString(); // ponytail: waktu tetap di memori; urutan cukup dari id berurutan
  const entri = new Map<string, EntriMemori>();
  const revisi = new Map<string, RingkasanRevisi>();
  const kunciDiksi = new Map<string, KunciDiksiMemori>();
  const revisiDiksi = new Map<string, RingkasanRevisiDiksi>();

  const pelaku = () => {
    if (!sesi) throw new Error('belum masuk');
    return { pelakuId: sesi.userId, peran: peran.get(sesi.userId) ?? null };
  };
  const wajibPeran = (...boleh: Peran[]) => {
    const { peran: peranSaya } = pelaku();
    if (!peranSaya || !boleh.includes(peranSaya)) throw new Error(`perlu peran ${boleh.join('/')}`);
  };
  const ambil = <T>(peta: Map<string, T>, id: string, nama: string): T => {
    const nilai = peta.get(id);
    if (!nilai) throw new Error(`${nama} ${id} tidak ditemukan`);
    return nilai;
  };
  const periksaIsi = <J extends JenisKonten>(jenis: J, isi: IsiKonten[J], refs: string[]) => {
    const json = keJson(jenis, isi);
    const hasil = bacaIsi(jenis, json);
    if (!hasil.ok) throw new Error(`isi ${jenis} tidak sah: ${hasil.galat}`);
    const galatRefs = periksaRefs(jenis, refs, refsDikenal);
    if (galatRefs) throw new Error(galatRefs);
    return json;
  };
  const jalankanTransisi = (
    target: { status: StatusRevisi; dibuatOleh: string; diperiksaOleh: string | null; catatanReview: string | null },
    aksi: AksiEditorial, catatan?: string,
  ) => {
    const hasil = transisiRevisi({ ...pelaku(), pembuatId: target.dibuatOleh, status: target.status, aksi, ...(catatan === undefined ? {} : { catatan }) });
    if (!hasil.ok) throw new Error(hasil.galat);
    target.status = hasil.status;
    if (aksi !== 'ajukan') target.diperiksaOleh = pelaku().pelakuId;
    if (aksi === 'kembalikan') target.catatanReview = catatan ?? null;
  };
  const wajibPemeriksa = () => wajibPeran('admin', 'reviewer');

  const konten: RepositoriKonten = {
    async versiSekarang() { return versi; },
    async bacaTerbit(saring = {}) {
      const mentah = [...entri.values()]
        .filter(baris => baris.revisiTerbitId && (!saring.jenis || baris.jenis === saring.jenis)
          && (saring.sejakVersi === undefined || (baris.versiTerbit ?? 0) > saring.sejakVersi))
        .sort((a, b) => a.urutan - b.urutan)
        .map(baris => {
          const terbit = revisi.get(baris.revisiTerbitId!)!;
          return { entriId: baris.id, jenis: baris.jenis, slug: baris.slug, urutan: baris.urutan, revisiId: terbit.id, isi: terbit.isi, refs: terbit.refs, versiTerbit: baris.versiTerbit! };
        });
      return saringValid(mentah);
    },
    async daftarRevisi(entriId) { return [...revisi.values()].filter(baris => baris.entriId === entriId); },
  };

  const editorial: RepositoriEditorial = {
    async buatEntri(jenis, slug, urutan) {
      wajibPeran('admin', 'penulis');
      if ([...entri.values()].some(baris => baris.jenis === jenis && baris.slug === slug)) throw new Error(`${jenis}/${slug} sudah ada`);
      const id = idBaru();
      entri.set(id, { id, jenis, slug, urutan, revisiTerbitId: null, versiTerbit: null });
      return id;
    },
    async buatDraf(entriId, jenis, isi, refs) {
      wajibPeran('admin', 'penulis');
      ambil(entri, entriId, 'entri');
      const id = idBaru();
      revisi.set(id, {
        id, entriId, status: 'draf', refs: [...refs], isi: periksaIsi(jenis, isi, refs), dibuatOleh: pelaku().pelakuId,
        diperiksaOleh: null, catatanReview: null, dibuatPada: sekarang(), diperiksaPada: null,
      });
      return id;
    },
    async ubahDraf(revisiId, jenis, isi, refs) {
      const target = ambil(revisi, revisiId, 'revisi');
      if (!bolehSuntingDraf({ ...pelaku(), pembuatId: target.dibuatOleh, status: target.status })) throw new Error('draf ini tidak bisa disunting');
      target.isi = periksaIsi(jenis, isi, refs);
      target.refs = [...refs];
    },
    async ajukan(revisiId) { jalankanTransisi(ambil(revisi, revisiId, 'revisi'), 'ajukan'); },
    async setujui(revisiId) {
      const target = ambil(revisi, revisiId, 'revisi');
      jalankanTransisi(target, 'setujui');
      const tujuan = ambil(entri, target.entriId, 'entri');
      tujuan.revisiTerbitId = revisiId;
      tujuan.versiTerbit = ++versi;
    },
    async kembalikan(revisiId, catatan) { jalankanTransisi(ambil(revisi, revisiId, 'revisi'), 'kembalikan', catatan); },
    async terbitkanUlang(revisiId) {
      wajibPemeriksa();
      const target = ambil(revisi, revisiId, 'revisi');
      if (target.status !== 'disetujui') throw new Error('hanya revisi disetujui yang bisa diterbitkan ulang');
      const tujuan = ambil(entri, target.entriId, 'entri');
      tujuan.revisiTerbitId = revisiId;
      tujuan.versiTerbit = ++versi;
    },
    async antreanReview() { return [...revisi.values()].filter(baris => baris.status === 'diajukan'); },
  };

  const diksi: RepositoriDiksi = {
    async bacaTerbit(sejakVersi) {
      return [...kunciDiksi.values()]
        .filter(baris => baris.revisiTerbitId && (sejakVersi === undefined || (baris.versiTerbit ?? 0) > sejakVersi))
        .map((baris): DiksiTerbit => {
          const terbit = revisiDiksi.get(baris.revisiTerbitId!)!;
          return { kunci: baris.kunci, halaman: baris.halaman, id: terbit.idTeks, ar: terbit.arTeks, versiTerbit: baris.versiTerbit! };
        });
    },
    async buatKunci(kunci, halaman) {
      wajibPeran('admin', 'penulis');
      if (!/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(kunci)) throw new Error(`kunci diksi tidak sah: ${kunci}`);
      kunciDiksi.set(kunci, { kunci, halaman, revisiTerbitId: null, versiTerbit: null });
    },
    async buatDraf(kunci, idTeks, arTeks, catatan) {
      wajibPeran('admin', 'penulis');
      ambil(kunciDiksi, kunci, 'kunci diksi');
      const id = idBaru();
      revisiDiksi.set(id, {
        id, kunci, idTeks, arTeks, catatan, status: 'draf', dibuatOleh: pelaku().pelakuId,
        diperiksaOleh: null, catatanReview: null, dibuatPada: sekarang(),
      });
      return id;
    },
    async ajukan(revisiId) { jalankanTransisi(ambil(revisiDiksi, revisiId, 'revisi diksi'), 'ajukan'); },
    async setujui(revisiId) {
      const target = ambil(revisiDiksi, revisiId, 'revisi diksi');
      jalankanTransisi(target, 'setujui');
      const tujuan = ambil(kunciDiksi, target.kunci, 'kunci diksi');
      tujuan.revisiTerbitId = revisiId;
      tujuan.versiTerbit = ++versi;
    },
    async kembalikan(revisiId, catatan) { jalankanTransisi(ambil(revisiDiksi, revisiId, 'revisi diksi'), 'kembalikan', catatan); },
    async terbitkanUlang(revisiId) {
      wajibPemeriksa();
      const target = ambil(revisiDiksi, revisiId, 'revisi diksi');
      if (target.status !== 'disetujui') throw new Error('hanya revisi disetujui yang bisa diterbitkan ulang');
      const tujuan = ambil(kunciDiksi, target.kunci, 'kunci diksi');
      tujuan.revisiTerbitId = revisiId;
      tujuan.versiTerbit = ++versi;
    },
    async daftarRevisi(kunci) { return [...revisiDiksi.values()].filter(baris => baris.kunci === kunci); },
  };

  return {
    konten, editorial, diksi,
    masukSebagai(sesiBaru) { sesi = sesiBaru; },
    aturPeranLangsung(userId, peranBaru) { if (peranBaru) peran.set(userId, peranBaru); else peran.delete(userId); },
    isiRevisiMentah(revisiId, isi) { ambil(revisi, revisiId, 'revisi').isi = isi; },
  };
}
```

```ts
// packages/data/src/index.ts
export * from './antarmuka.js';
export { saringValid, type BarisTerbitMentah } from './saring.js';
export { buatMemori, type MemoriBersama } from './memori/konten.js';
```

Catatan: `saringValid` memanggil `bacaIsi` pada JSON tersimpan, sehingga bigint di `soal_hitung` kembali jadi bigint —
itulah yang diuji tes "bigint tetap bigint".

- [x] **Step 5: Jalankan tes & typecheck**

Run: `pnpm --filter @waris/data test && pnpm --filter @waris/data exec tsc --noEmit -p .`
Expected: 7 PASS, tanpa galat tipe.

- [x] **Step 6: Commit**

```bash
git add packages/data pnpm-lock.yaml
git commit -m "data: antarmuka repository konten/editorial/diksi + implementasi memori"
```

---

### Task 8: `packages/data` — antarmuka + `memori/` untuk pengguna & akun

**Files:**
- Modify: `packages/data/src/antarmuka.ts`, `packages/data/src/index.ts`
- Create: `packages/data/src/memori/pengguna.ts`
- Test: `packages/data/src/__tests__/memori-pengguna.test.ts`

**Interfaces:**
- Consumes: `Sesi`, `Peran`
- Produces:

```ts
export interface RiwayatTersimpan { id: string; kasus: unknown; judul: string; disimpanPada: string }
export interface ProgresBelajar { pelajaranSlug: string; selesai: boolean; diubahPada: string }
export interface ProgresLatihan {
  soalSlug: string; jenis: 'kuis' | 'hitung'; jawabanTerakhir: unknown; benar: boolean; jumlahCoba: number; diubahPada: string;
}
export interface Preferensi { isi: Record<string, unknown>; diubahPada: string }

/** Semua operasi milik pengguna yang sedang masuk; melempar 'belum masuk' bila tanpa sesi. */
export interface RepositoriPengguna {
  bacaRiwayat(): Promise<RiwayatTersimpan[]>;
  simpanRiwayat(riwayat: RiwayatTersimpan): Promise<void>;
  hapusRiwayat(id: string): Promise<void>;
  bacaProgresBelajar(): Promise<ProgresBelajar[]>;
  simpanProgresBelajar(progres: ProgresBelajar): Promise<void>;
  bacaProgresLatihan(): Promise<ProgresLatihan[]>;
  simpanProgresLatihan(progres: ProgresLatihan): Promise<void>;
  bacaPreferensi(): Promise<Preferensi | null>;
  simpanPreferensi(preferensi: Preferensi): Promise<void>;
}
export interface RepositoriAkun {
  sesi(): Promise<Sesi | null>;
  /** Mengarahkan ke Google; kembali ke `alamatKembali`. */
  masukGoogle(alamatKembali: string): Promise<void>;
  keluar(): Promise<void>;
  peranSaya(): Promise<Peran | null>;
  /** Admin saja. `null` = cabut peran. */
  aturPeran(userId: string, peran: Peran | null): Promise<void>;
  /** Admin saja. */
  daftarPeran(): Promise<{ userId: string; peran: Peran }[]>;
}
```

  - `buatMemoriPengguna(bersama: MemoriBersama): { pengguna: RepositoriPengguna; akun: RepositoriAkun }` — memakai sesi & peran dari `MemoriBersama`.
    Untuk itu `MemoriBersama` mendapat dua fungsi baca: `sesiSekarang(): Sesi | null` dan `peranDari(userId: string): Peran | null`, serta `daftarPeranSemua(): { userId: string; peran: Peran }[]`.

- [x] **Step 1: Tulis tes gagal**

```ts
// packages/data/src/__tests__/memori-pengguna.test.ts
import { describe, expect, test } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '../index.js';

const A = { userId: 'a', email: 'a@tes.local' };
const B = { userId: 'b', email: 'b@tes.local' };

describe('memori: pengguna & akun', () => {
  test('data tiap pengguna terpisah', async () => {
    const bersama = buatMemori({ sesi: A });
    const { pengguna } = buatMemoriPengguna(bersama);
    await pengguna.simpanProgresBelajar({ pelajaranSlug: 'ashabah-1', selesai: true, diubahPada: '2026-09-26T00:00:00Z' });
    bersama.masukSebagai(B);
    expect(await pengguna.bacaProgresBelajar()).toEqual([]);
    bersama.masukSebagai(A);
    expect(await pengguna.bacaProgresBelajar()).toHaveLength(1);
  });

  test('simpan = upsert per kunci baris', async () => {
    const bersama = buatMemori({ sesi: A });
    const { pengguna } = buatMemoriPengguna(bersama);
    const dasar = { soalSlug: 'K-01', jenis: 'kuis' as const, jawabanTerakhir: 1, diubahPada: '2026-09-26T00:00:00Z' };
    await pengguna.simpanProgresLatihan({ ...dasar, benar: false, jumlahCoba: 1 });
    await pengguna.simpanProgresLatihan({ ...dasar, benar: true, jumlahCoba: 2 });
    expect(await pengguna.bacaProgresLatihan()).toEqual([{ ...dasar, benar: true, jumlahCoba: 2 }]);
    await pengguna.simpanRiwayat({ id: 'k1', kasus: {}, judul: 'x', disimpanPada: '2026-09-26T00:00:00Z' });
    await pengguna.hapusRiwayat('k1');
    expect(await pengguna.bacaRiwayat()).toEqual([]);
  });

  test('tanpa sesi ditolak', async () => {
    const { pengguna, akun } = buatMemoriPengguna(buatMemori());
    expect(await akun.sesi()).toBeNull();
    await expect(pengguna.bacaPreferensi()).rejects.toThrow(/belum masuk/);
  });

  test('peran: hanya admin yang bisa mengatur', async () => {
    const bersama = buatMemori({ sesi: A, peran: { a: 'penulis' } });
    const { akun } = buatMemoriPengguna(bersama);
    expect(await akun.peranSaya()).toBe('penulis');
    await expect(akun.aturPeran('b', 'reviewer')).rejects.toThrow(/admin/);
    bersama.aturPeranLangsung('a', 'admin');
    await akun.aturPeran('b', 'reviewer');
    expect(await akun.daftarPeran()).toEqual(expect.arrayContaining([{ userId: 'b', peran: 'reviewer' }]));
  });

  test('keluar menghapus sesi', async () => {
    const bersama = buatMemori({ sesi: A });
    const { akun } = buatMemoriPengguna(bersama);
    await akun.keluar();
    expect(await akun.sesi()).toBeNull();
  });
});
```

- [x] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/data test -- pengguna`
Expected: FAIL, `buatMemoriPengguna` tidak ada.

- [x] **Step 3: Implementasi**

Tempel blok antarmuka di **Interfaces** ke akhir `antarmuka.ts`.

Di `memori/konten.ts`, tambahkan ke `MemoriBersama` dan objek kembaliannya:

```ts
  sesiSekarang(): Sesi | null;
  peranDari(userId: string): Peran | null;
  daftarPeranSemua(): { userId: string; peran: Peran }[];
```
```ts
    sesiSekarang: () => sesi,
    peranDari: userId => peran.get(userId) ?? null,
    daftarPeranSemua: () => [...peran.entries()].map(([userId, peranPengguna]) => ({ userId, peran: peranPengguna })),
```

```ts
// packages/data/src/memori/pengguna.ts
// Data pengguna & akun di memori, berbagi sesi dan peran dengan buatMemori. Tiap simpan = upsert per kunci baris,
// sama dengan primary key tabel di supabase/migrations/20260926000003_pengguna.sql.
import type { Peran } from '@waris/content';
import type {
  Preferensi, ProgresBelajar, ProgresLatihan, RepositoriAkun, RepositoriPengguna, RiwayatTersimpan,
} from '../antarmuka.js';
import type { MemoriBersama } from './konten.js';

export function buatMemoriPengguna(bersama: MemoriBersama): { pengguna: RepositoriPengguna; akun: RepositoriAkun } {
  const riwayat = new Map<string, RiwayatTersimpan>();
  const belajar = new Map<string, ProgresBelajar>();
  const latihan = new Map<string, ProgresLatihan>();
  const preferensi = new Map<string, Preferensi>();

  const pemilik = () => {
    const sesi = bersama.sesiSekarang();
    if (!sesi) throw new Error('belum masuk');
    return sesi.userId;
  };
  const kunci = (...bagian: string[]) => [pemilik(), ...bagian].join('\u0000');
  const milikSaya = <T>(peta: Map<string, T>) => {
    const awalan = pemilik() + '\u0000';
    return [...peta.entries()].filter(([kunciBaris]) => kunciBaris.startsWith(awalan)).map(([, nilai]) => nilai);
  };
  const wajibAdmin = () => {
    if (bersama.peranDari(pemilik()) !== 'admin') throw new Error('perlu peran admin');
  };

  const pengguna: RepositoriPengguna = {
    async bacaRiwayat() { return milikSaya(riwayat); },
    async simpanRiwayat(baris) { riwayat.set(kunci(baris.id), baris); },
    async hapusRiwayat(id) { riwayat.delete(kunci(id)); },
    async bacaProgresBelajar() { return milikSaya(belajar); },
    async simpanProgresBelajar(baris) { belajar.set(kunci(baris.pelajaranSlug), baris); },
    async bacaProgresLatihan() { return milikSaya(latihan); },
    async simpanProgresLatihan(baris) { latihan.set(kunci(baris.jenis, baris.soalSlug), baris); },
    async bacaPreferensi() { return preferensi.get(kunci()) ?? null; },
    async simpanPreferensi(baris) { preferensi.set(kunci(), baris); },
  };

  const akun: RepositoriAkun = {
    async sesi() { return bersama.sesiSekarang(); },
    async masukGoogle() { throw new Error('memori: pakai masukSebagai() di tes'); },
    async keluar() { bersama.masukSebagai(null); },
    async peranSaya() { const sesi = bersama.sesiSekarang(); return sesi ? bersama.peranDari(sesi.userId) : null; },
    async aturPeran(userId: string, peran: Peran | null) { wajibAdmin(); bersama.aturPeranLangsung(userId, peran); },
    async daftarPeran() { wajibAdmin(); return bersama.daftarPeranSemua(); },
  };

  return { pengguna, akun };
}
```

Tambahkan ke `index.ts`: `export { buatMemoriPengguna } from './memori/pengguna.js';`

- [x] **Step 4: Jalankan tes & typecheck**

Run: `pnpm --filter @waris/data test && pnpm --filter @waris/data exec tsc --noEmit -p .`
Expected: 12 PASS.

- [x] **Step 5: Commit**

```bash
git add packages/data
git commit -m "data: antarmuka + memori untuk data pengguna dan akun"
```

---

### Task 9: `packages/data/supabase/` + tes integrasi ke Supabase lokal

**Files:**
- Modify: `packages/data/package.json` (dependency `@supabase/supabase-js`)
- Create: `packages/data/src/supabase/index.ts`, `packages/data/src/supabase/peta.ts`
- Modify: `packages/data/src/index.ts`
- Test: `packages/data/src/__tests__/supabase.test.ts` (dilewati bila `SUPABASE_URL` tidak di-set)

**Interfaces:**
- Consumes: semua antarmuka Task 7–8, `keJson`, `periksaRefs`/`bacaIsi` (validasi sebelum simpan), `saringValid`
- Produces: `buatRepositoriSupabase(klien: SupabaseClient): { konten: RepositoriKonten; editorial: RepositoriEditorial; diksi: RepositoriDiksi; pengguna: RepositoriPengguna; akun: RepositoriAkun }`

- [x] **Step 1: Pasang dependensi**

Run: `pnpm --filter @waris/data add @supabase/supabase-js@^2`

- [x] **Step 2: Tulis tes integrasi gagal**

```ts
// packages/data/src/__tests__/supabase.test.ts
// Tes integrasi ke Supabase lokal. Jalankan: `pnpm db:mulai && pnpm db:reset`, lalu
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... pnpm --filter @waris/data test
// (nilai kunci dari `supabase status`). Tanpa variabel itu, tes dilewati supaya `pnpm test` tetap tanpa jaringan.
import { createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, test } from 'vitest';
import { DAFTAR_FAQ, DAFTAR_SOAL_HITUNG } from '@waris/content';
import { buatRepositoriSupabase } from '../index.js';

const URL_DB = process.env.SUPABASE_URL;
const KUNCI_ANON = process.env.SUPABASE_ANON_KEY ?? '';
const KUNCI_SERVIS = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
// Kata sandi uji lokal saja (akun dibuat di tes ini, di Supabase lokal).
const SANDI_UJI = 'sandi-uji-lokal-123';
const akhiran = Date.now().toString(36);

async function masuk(email: string) {
  const klien = createClient(URL_DB!, KUNCI_ANON, { auth: { persistSession: false } });
  const { error } = await klien.auth.signInWithPassword({ email, password: SANDI_UJI });
  if (error) throw error;
  return buatRepositoriSupabase(klien);
}

describe.skipIf(!URL_DB)('supabase lokal', () => {
  const email = { penulis: `penulis-${akhiran}@tes.local`, reviewer: `reviewer-${akhiran}@tes.local`, biasa: `biasa-${akhiran}@tes.local` };

  beforeAll(async () => {
    const servis = createClient(URL_DB!, KUNCI_SERVIS, { auth: { persistSession: false } });
    for (const [peran, alamat] of Object.entries(email)) {
      const { data, error } = await servis.auth.admin.createUser({ email: alamat, password: SANDI_UJI, email_confirm: true });
      if (error) throw error;
      if (peran !== 'biasa') await servis.from('peran_pengguna').insert({ user_id: data.user.id, peran });
    }
  });

  test('alur editorial end-to-end dan bigint utuh', async () => {
    const penulis = await masuk(email.penulis);
    const entriId = await penulis.editorial.buatEntri('soal_hitung', `uji-${akhiran}`, 1);
    const revisiId = await penulis.editorial.buatDraf(entriId, 'soal_hitung', DAFTAR_SOAL_HITUNG[0]!, ['R09-7']);
    await expect(penulis.editorial.setujui(revisiId)).rejects.toThrow();
    await penulis.editorial.ajukan(revisiId);

    const reviewer = await masuk(email.reviewer);
    const versiSebelum = await reviewer.konten.versiSekarang();
    await reviewer.editorial.setujui(revisiId);
    expect(await reviewer.konten.versiSekarang()).toBe(versiSebelum + 1);

    const anonim = buatRepositoriSupabase(createClient(URL_DB!, KUNCI_ANON, { auth: { persistSession: false } }));
    const terbit = await anonim.konten.bacaTerbit({ jenis: 'soal_hitung', sejakVersi: versiSebelum });
    expect(terbit.find(baris => baris.revisiId === revisiId)?.isi).toEqual(DAFTAR_SOAL_HITUNG[0]);
  });

  test('draf tidak terlihat anonim; ref tak dikenal ditolak dengan pesan', async () => {
    const penulis = await masuk(email.penulis);
    const entriId = await penulis.editorial.buatEntri('faq', `draf-${akhiran}`, 1);
    await expect(penulis.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ[0]!, ['R99-1'])).rejects.toThrow(/R99-1/);
    await penulis.editorial.buatDraf(entriId, 'faq', DAFTAR_FAQ[0]!, ['R09-7']);
    const anonim = buatRepositoriSupabase(createClient(URL_DB!, KUNCI_ANON, { auth: { persistSession: false } }));
    expect((await anonim.konten.bacaTerbit({ jenis: 'faq' })).some(baris => baris.entriId === entriId)).toBe(false);
  });

  test('data pengguna terpisah antar akun', async () => {
    const biasa = await masuk(email.biasa);
    await biasa.pengguna.simpanProgresBelajar({ pelajaranSlug: 'ashabah-1', selesai: true, diubahPada: new Date().toISOString() });
    expect(await biasa.pengguna.bacaProgresBelajar()).toHaveLength(1);
    const penulis = await masuk(email.penulis);
    expect(await penulis.pengguna.bacaProgresBelajar()).toEqual([]);
    expect(await biasa.akun.peranSaya()).toBeNull();
    expect(await penulis.akun.peranSaya()).toBe('penulis');
  });
});
```

Catatan: `R09-7` harus ada di `supabase/seed.sql` (Task 6). Bila tidak, pakai kode pertama dari seed.

- [x] **Step 3: Jalankan, pastikan gagal**

```bash
pnpm db:reset
eval "$(pnpm exec supabase status -o env | sed 's/^API_URL=/SUPABASE_URL=/; s/^ANON_KEY=/SUPABASE_ANON_KEY=/; s/^SERVICE_ROLE_KEY=/SUPABASE_SERVICE_ROLE_KEY=/; s/^/export /')"
pnpm --filter @waris/data test -- supabase
```

Expected: FAIL, `buatRepositoriSupabase` tidak ada. (Periksa nama variabel keluaran `supabase status -o env` di versi CLI terpasang; sesuaikan `sed` bila berbeda.)

- [x] **Step 4: Implementasi**

```ts
// packages/data/src/supabase/peta.ts
// Peta baris tabel (snake_case) ↔ tipe antarmuka (camelCase). Satu tempat supaya nama kolom SQL tidak tersebar.
import type { JenisKonten } from '@waris/content';
import type { BarisTerbitMentah } from '../saring.js';
import type { DiksiTerbit, ProgresBelajar, ProgresLatihan, RingkasanRevisi, RingkasanRevisiDiksi, RiwayatTersimpan } from '../antarmuka.js';

type Baris = Record<string, any>;

export const keRevisi = (baris: Baris): RingkasanRevisi => ({
  id: baris.id, entriId: baris.entri_id, status: baris.status, refs: baris.refs, isi: baris.isi, dibuatOleh: baris.dibuat_oleh,
  diperiksaOleh: baris.diperiksa_oleh, catatanReview: baris.catatan_review, dibuatPada: baris.dibuat_pada, diperiksaPada: baris.diperiksa_pada,
});

export const keRevisiDiksi = (baris: Baris): RingkasanRevisiDiksi => ({
  id: baris.id, kunci: baris.kunci, idTeks: baris.id_teks, arTeks: baris.ar_teks, catatan: baris.catatan, status: baris.status,
  dibuatOleh: baris.dibuat_oleh, diperiksaOleh: baris.diperiksa_oleh, catatanReview: baris.catatan_review, dibuatPada: baris.dibuat_pada,
});

/** Baris entri_konten dengan relasi `revisi_terbit:revisi!entri_konten_revisi_terbit_id_fkey(*)`. */
export const keTerbitMentah = (baris: Baris): BarisTerbitMentah => ({
  entriId: baris.id, jenis: baris.jenis as JenisKonten, slug: baris.slug, urutan: baris.urutan,
  revisiId: baris.revisi_terbit.id, isi: baris.revisi_terbit.isi, refs: baris.revisi_terbit.refs, versiTerbit: Number(baris.versi_terbit),
});

export const keDiksiTerbit = (baris: Baris): DiksiTerbit => ({
  kunci: baris.kunci, halaman: baris.halaman, id: baris.revisi_terbit.id_teks, ar: baris.revisi_terbit.ar_teks, versiTerbit: Number(baris.versi_terbit),
});

export const keRiwayat = (baris: Baris): RiwayatTersimpan => ({ id: baris.id, kasus: baris.kasus, judul: baris.judul, disimpanPada: baris.disimpan_pada });
export const keProgresBelajar = (baris: Baris): ProgresBelajar => ({ pelajaranSlug: baris.pelajaran_slug, selesai: baris.selesai, diubahPada: baris.diubah_pada });
export const keProgresLatihan = (baris: Baris): ProgresLatihan => ({
  soalSlug: baris.soal_slug, jenis: baris.jenis, jawabanTerakhir: baris.jawaban_terakhir, benar: baris.benar, jumlahCoba: baris.jumlah_coba, diubahPada: baris.diubah_pada,
});
```

```ts
// packages/data/src/supabase/index.ts
// Implementasi repository di atas Supabase (Postgres + Auth). Hanya tabel & fungsi SQL di supabase/migrations yang
// dipakai; tidak ada Edge Functions/Realtime/Storage, supaya pindah VPS cukup menambah implementasi http/.
// Aturan akses ditegakkan DB (RLS + fungsi transisi); di sini hanya validasi isi (Zod) sebelum simpan agar pesan
// galat ramah, dan saringValid saat baca.
import type { SupabaseClient } from '@supabase/supabase-js';
import { bacaIsi, keJson, type IsiKonten, type JenisKonten, type Peran } from '@waris/content';
import type { RepositoriAkun, RepositoriDiksi, RepositoriEditorial, RepositoriKonten, RepositoriPengguna } from '../antarmuka.js';
import { saringValid } from '../saring.js';
import { keDiksiTerbit, keProgresBelajar, keProgresLatihan, keRevisi, keRevisiDiksi, keRiwayat, keTerbitMentah } from './peta.js';

const RELASI_TERBIT = 'revisi_terbit:revisi!entri_konten_revisi_terbit_id_fkey(id, isi, refs)';
const RELASI_TERBIT_DIKSI = 'revisi_terbit:revisi_diksi!diksi_revisi_terbit_id_fkey(id_teks, ar_teks)';

export function buatRepositoriSupabase(klien: SupabaseClient) {
  const hasil = async <T>(janji: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> => {
    const { data, error } = await janji;
    if (error) throw new Error(error.message);
    return data;
  };
  const rpc = (nama: string, argumen: Record<string, unknown>) => hasil(klien.rpc(nama, argumen)).then(() => undefined);
  const userId = async () => {
    const { data } = await klien.auth.getUser();
    if (!data.user) throw new Error('belum masuk');
    return data.user.id;
  };
  const isiSah = <J extends JenisKonten>(jenis: J, isi: IsiKonten[J]) => {
    const json = keJson(jenis, isi);
    const periksa = bacaIsi(jenis, json);
    if (!periksa.ok) throw new Error(`isi ${jenis} tidak sah: ${periksa.galat}`);
    return json;
  };

  const konten: RepositoriKonten = {
    async versiSekarang() {
      const baris = await hasil(klien.from('versi_konten').select('angka').single());
      return Number((baris as { angka: number }).angka);
    },
    async bacaTerbit(saring = {}) {
      let kueri = klien.from('entri_konten').select(`id, jenis, slug, urutan, versi_terbit, ${RELASI_TERBIT}`)
        .not('revisi_terbit_id', 'is', null).order('urutan');
      if (saring.jenis) kueri = kueri.eq('jenis', saring.jenis);
      if (saring.sejakVersi !== undefined) kueri = kueri.gt('versi_terbit', saring.sejakVersi);
      return saringValid((await hasil(kueri) as any[]).map(keTerbitMentah));
    },
    async daftarRevisi(entriId) {
      return (await hasil(klien.from('revisi').select('*').eq('entri_id', entriId).order('dibuat_pada')) as any[]).map(keRevisi);
    },
  };

  const editorial: RepositoriEditorial = {
    async buatEntri(jenis, slug, urutan) {
      const baris = await hasil(klien.from('entri_konten').insert({ jenis, slug, urutan }).select('id').single());
      return (baris as { id: string }).id;
    },
    async buatDraf(entriId, jenis, isi, refs) {
      const baris = await hasil(klien.from('revisi').insert({ entri_id: entriId, isi: isiSah(jenis, isi), refs }).select('id').single());
      return (baris as { id: string }).id;
    },
    async ubahDraf(revisiId, jenis, isi, refs) {
      const baris = await hasil(klien.from('revisi').update({ isi: isiSah(jenis, isi), refs }).eq('id', revisiId).select('id'));
      if ((baris as unknown[]).length === 0) throw new Error('draf ini tidak bisa disunting');
    },
    ajukan: revisiId => rpc('ajukan_revisi', { p_id: revisiId }),
    setujui: revisiId => rpc('setujui_revisi', { p_id: revisiId }),
    kembalikan: (revisiId, catatan) => rpc('kembalikan_revisi', { p_id: revisiId, p_catatan: catatan }),
    terbitkanUlang: revisiId => rpc('terbitkan_ulang_revisi', { p_id: revisiId }),
    async antreanReview() {
      return (await hasil(klien.from('revisi').select('*').eq('status', 'diajukan').order('dibuat_pada')) as any[]).map(keRevisi);
    },
  };

  const diksi: RepositoriDiksi = {
    async bacaTerbit(sejakVersi) {
      let kueri = klien.from('diksi').select(`kunci, halaman, versi_terbit, ${RELASI_TERBIT_DIKSI}`).not('revisi_terbit_id', 'is', null);
      if (sejakVersi !== undefined) kueri = kueri.gt('versi_terbit', sejakVersi);
      return (await hasil(kueri) as any[]).map(keDiksiTerbit);
    },
    async buatKunci(kunci, halaman) { await hasil(klien.from('diksi').insert({ kunci, halaman })); },
    async buatDraf(kunci, idTeks, arTeks, catatan) {
      const baris = await hasil(klien.from('revisi_diksi').insert({ kunci, id_teks: idTeks, ar_teks: arTeks, catatan }).select('id').single());
      return (baris as { id: string }).id;
    },
    ajukan: revisiId => rpc('ajukan_revisi_diksi', { p_id: revisiId }),
    setujui: revisiId => rpc('setujui_revisi_diksi', { p_id: revisiId }),
    kembalikan: (revisiId, catatan) => rpc('kembalikan_revisi_diksi', { p_id: revisiId, p_catatan: catatan }),
    terbitkanUlang: revisiId => rpc('terbitkan_ulang_revisi_diksi', { p_id: revisiId }),
    async daftarRevisi(kunci) {
      return (await hasil(klien.from('revisi_diksi').select('*').eq('kunci', kunci).order('dibuat_pada')) as any[]).map(keRevisiDiksi);
    },
  };

  const pengguna: RepositoriPengguna = {
    async bacaRiwayat() { return (await hasil(klien.from('riwayat_hitung').select('*').order('disimpan_pada', { ascending: false })) as any[]).map(keRiwayat); },
    async simpanRiwayat(baris) {
      await hasil(klien.from('riwayat_hitung').upsert({ user_id: await userId(), id: baris.id, kasus: baris.kasus, judul: baris.judul, disimpan_pada: baris.disimpanPada }));
    },
    async hapusRiwayat(id) { await hasil(klien.from('riwayat_hitung').delete().eq('id', id)); },
    async bacaProgresBelajar() { return (await hasil(klien.from('progres_belajar').select('*')) as any[]).map(keProgresBelajar); },
    async simpanProgresBelajar(baris) {
      await hasil(klien.from('progres_belajar').upsert({ user_id: await userId(), pelajaran_slug: baris.pelajaranSlug, selesai: baris.selesai, diubah_pada: baris.diubahPada }));
    },
    async bacaProgresLatihan() { return (await hasil(klien.from('progres_latihan').select('*')) as any[]).map(keProgresLatihan); },
    async simpanProgresLatihan(baris) {
      await hasil(klien.from('progres_latihan').upsert({
        user_id: await userId(), soal_slug: baris.soalSlug, jenis: baris.jenis, jawaban_terakhir: baris.jawabanTerakhir,
        benar: baris.benar, jumlah_coba: baris.jumlahCoba, diubah_pada: baris.diubahPada,
      }));
    },
    async bacaPreferensi() {
      const baris = await hasil(klien.from('preferensi').select('*').maybeSingle()) as any;
      return baris ? { isi: baris.isi, diubahPada: baris.diubah_pada } : null;
    },
    async simpanPreferensi(baris) {
      await hasil(klien.from('preferensi').upsert({ user_id: await userId(), isi: baris.isi, diubah_pada: baris.diubahPada }));
    },
  };

  const akun: RepositoriAkun = {
    async sesi() {
      const { data } = await klien.auth.getUser();
      return data.user ? { userId: data.user.id, email: data.user.email ?? '' } : null;
    },
    async masukGoogle(alamatKembali) {
      const { error } = await klien.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: alamatKembali } });
      if (error) throw new Error(error.message);
    },
    async keluar() { await klien.auth.signOut(); },
    async peranSaya() {
      const baris = await hasil(klien.from('peran_pengguna').select('peran').eq('user_id', await userId()).maybeSingle()) as { peran: Peran } | null;
      return baris?.peran ?? null;
    },
    async aturPeran(targetId: string, peran: Peran | null) {
      if (peran) await hasil(klien.from('peran_pengguna').upsert({ user_id: targetId, peran }));
      else await hasil(klien.from('peran_pengguna').delete().eq('user_id', targetId));
    },
    async daftarPeran() {
      return (await hasil(klien.from('peran_pengguna').select('user_id, peran')) as any[]).map(baris => ({ userId: baris.user_id, peran: baris.peran }));
    },
  };

  return { konten, editorial, diksi, pengguna, akun };
}
```

Catatan: `peranSaya` untuk pengguna tanpa sesi akan melempar `belum masuk`; untuk pengguna biasa (tanpa baris) mengembalikan `null`.
`aturPeran`/`daftarPeran` oleh non-admin: RLS membuat upsert gagal (`42501`) → `Error`; `daftarPeran` non-admin hanya melihat barisnya sendiri —
dokumentasikan di JSDoc antarmuka bahwa pemeriksaan admin untuk baca dilakukan RLS (tidak melempar, hanya menyaring).

Tambahkan ke `index.ts`: `export { buatRepositoriSupabase } from './supabase/index.js';`

- [x] **Step 5: Jalankan tes (lokal + tanpa jaringan) & typecheck**

```bash
pnpm --filter @waris/data test -- supabase        # dengan env dari Step 3: 3 PASS
env -u SUPABASE_URL pnpm --filter @waris/data test # tanpa env: 12 PASS, 3 skipped
pnpm --filter @waris/data exec tsc --noEmit -p .
```

- [x] **Step 6: Commit**

```bash
git add packages/data pnpm-lock.yaml
git commit -m "data: implementasi repository supabase + tes integrasi ke supabase lokal"
```

---

### Task 10: Verifikasi seluruh fondasi

**Files:** tidak ada yang baru (kecuali perbaikan bila ada yang merah).

- [x] **Step 1: Semua tes JS tanpa jaringan**

Run: `env -u SUPABASE_URL pnpm test`
Expected: math 19, content 48 + tes baru, engine 166, explain 36, web 193, data 12 (+3 skipped) — semua hijau.

- [x] **Step 2: Semua tes DB dari nol**

Run: `pnpm db:reset && pnpm db:tes`
Expected: `01_skema`, `02_transisi`, `03_rls` semuanya ok.

- [x] **Step 3: Build web tidak berubah**

Run: `pnpm --filter @waris/web build`
Expected: sukses (UI belum menyentuh `packages/data`).

- [x] **Step 4: Centang checklist tahap 1 di spec bila perlu & commit**

```bash
git add docs/superpowers/plans/2026-09-26-database-tahap1-fondasi.md
git commit -m "docs: centang plan database tahap 1 fondasi"
```
