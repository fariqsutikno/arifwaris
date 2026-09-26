# Database Tahap 2 — Migrasi Konten & Diksi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Semua konten edukasi dan diksi UI pindah ke database; web membaca lewat snapshot → cache IndexedDB → Supabase;
`t()` memakai ID stabil; berkas konten lama dihapus.

**Architecture:** Skrip sekali jalan (`scripts/`, jadi paket workspace `@waris/skrip`) membaca berkas lama dengan parser
yang sudah ada, memvalidasi (Zod + konsistensi KB), lalu menulis lewat `RepositoriEditorial`/`RepositoriDiksi` (tahap 1).
`ekspor-konten` membaca konten terbit → `apps/web/src/snapshot.json` (di-commit) + Markdown lampiran. Web memegang satu
modul `konten/sumber.ts` (getter sinkron atas snapshot yang sedang terpasang); `main.tsx` memasang cache dulu lalu
mengimpor `Aplikasi` secara dinamis, supaya konstanta tingkat-modul yang memanggil `t()` sudah melihat data terbaru.
Sinkron latar belakang hanya menulis cache; perubahan tampil di muat berikutnya.

**Tech Stack:** TypeScript, Vitest 2, Zod 3, `@supabase/supabase-js` 2, `vite-node`, IndexedDB (API bawaan browser).

**Spec:** `docs/superpowers/specs/2026-09-26-database-portal-admin-design.md` (bagian "Migrasi konten lama", "Diksi",
"Alur data di web pengguna", "Urutan kerja" tahap 2). Plan tahap 1: `docs/superpowers/plans/2026-09-26-database-tahap1-fondasi.md`.

## Global Constraints

- Nama variabel/fungsi/tipe, komentar: bahasa Indonesia; istilah fikih sesuai `docs/kb/15_glosarium.md`.
- Tiap file dibuka komentar pendek: menerima apa, memutuskan apa, menyerahkan apa.
- Ref `[Rxx-y]` TIDAK BOLEH dikarang. Entri fikih tanpa ref → dilaporkan, diisi manusia dari KB.
- Kunci diksi cocok `^[a-z0-9_]+(\.[a-z0-9_]+)+$` (constraint tabel `diksi`).
- `packages/data` tidak mengimpor engine; web tetap jalan tanpa login dan offline; tanpa env Supabase = tanpa sinkron.
- `localStorage`/IndexedDB selalu dibungkus try/catch; gagal = jalan dari snapshot.
- Tes yang ada tetap hijau di akhir tiap task (angka boleh berubah bila tes dipindah, bukan dihapus diam-diam).
- Commit setelah tiap task (refactor `t()` satu commit per kelompok halaman); hanya berkas milik task itu.
  Akhiri pesan dengan `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Keputusan yang sudah diambil (diskusi 2026-09-26)

1. **Impor draf = terbit + antrean.** Tiap entri yang sekarang draf diimpor dua revisi: revisi 1 `disetujui` apa adanya
   (web tidak berubah; lencana "Draf" materi tetap tampil), revisi 2 identik berstatus `diajukan` (untuk `materi`:
   `perluCek: false`). Menyetujui revisi 2 = "sudah dicek tim keilmuan". Diksi: sama, revisi 2 hanya untuk kunci yang punya `ar`.
   Yang dianggap draf: semua kecuali `modul`, `kitab`, `cheatsheet`.
2. **Teks di `konten/ahliWaris|harta|wizard|tur|umum.ts` = jenis `teks_edukasi`**, dibaca `teksEdukasi('harta.tabungan_kas')`.
   Diksi (`t('halaman.id')`) hanya untuk teks UI murni.
3. **Ref kosong diisi manual** di `scripts/impor/refs-manual.json` (23 soal hitung, 5 FAQ "Pakai aplikasi", ahwal, dst.).
   Impor gagal selama masih ada entri fikih tanpa ref.

## Keputusan kecil plan ini

- `IsiAhwal.baris[]` mendapat `ar?: { bagian: string; syarat: string }` (Arab ahwal sekarang datang dari kamus lewat `t()`).
- Snapshot `{ versi, konten: BarisTerbitMentah[], diksi: DiksiTerbit[] }`; `isi` dalam bentuk `keJson` (bigint = string digit).
  Saat boot dipilih yang `versi`-nya lebih tinggi antara snapshot bawaan dan cache (deploy baru bisa lebih baru dari cache).
- Impor idempoten lewat `bacaTerbit` (entri/kunci yang sudah punya revisi terbit dilewati). ponytail: entri yang
  terputus di tengah (dibuat tanpa revisi terbit) tidak dipulihkan; jalankan `pnpm db:reset` lalu impor ulang.
- Slug: `modul` = nomor; `materi` = slug berkas; soal = kode; `faq` = id; `tanya_jawab` = slug; `kitab`/`cheatsheet` =
  `slug(judul)`; `syahid` = `slug(surah-ayat-hukum)`; `glosarium_ar` = `slug(istilah)`; `ahwal` = kunci ahli waris;
  `teks_edukasi` = kunci dari peta diksi. `urutan` = urutan di berkas asal (materi: `modul*100+urutan`).
- Uji konsistensi konten ↔ KB (ref ada, istilah ada, syahid cocok ayat, kuis di materi ada) pindah dari tes berkas
  `packages/content` ke fungsi murni `periksaKonsistensi` yang dipakai skrip impor, tes snapshot web, dan portal nanti.
- `DAFTAR_CHEATSHEET.berkas` (jalur lokal) → `tautan` (URL Google Drive), sekarang semua `null`.
- Parser berkas (`bacaPelajaran`, `bacaSoalKuis`, `bacaFaq`, dst.) dihapus di Task 10 bersama berkasnya; `bacaBlok`,
  `bacaPotongan`, `semuaPotongan` tetap (portal menyunting blok sebagai Markdown). `tulisBlok` (kebalikannya) ditambah.

## Review Focus

1. **Cache lebih lama dari snapshot bawaan setelah deploy**: harus dipakai snapshot (versi lebih tinggi), bukan cache. Diuji di Task 5.
2. **Supabase mati / env kosong / jaringan putus saat sinkron**: web tetap jalan, cache tidak rusak, tidak ada galat tak tertangkap. Diuji di Task 5 (repo yang melempar).
3. **Kunci diksi yang dipakai kode tapi tidak ada di snapshot**: tes gagal (bukan tampil kunci mentah ke pengguna). Diuji di Task 9.
4. **Dua teks berbeda menghasilkan slug sama di halaman yang sama**: dapat akhiran `_2`, deterministik. Diuji di Task 3.
5. **Impor dijalankan dua kali**: tidak menggandakan entri/revisi. Diuji di Task 4.

---

## Peta berkas

```
pnpm-workspace.yaml                         + 'scripts'
scripts/package.json                        BARU @waris/skrip (vitest, vite-node)
scripts/daftar-refs.ts                      tetap (dipanggil dari root)
scripts/diksi/rencana.ts (+ .test.ts)       susun peta ID diksi & teks edukasi, tulis ulang sumber
scripts/diksi/main.ts                       CLI: peta | tulis <awalan>
scripts/diksi/peta.json                     hasil, di-commit (dihapus di Task 10)
scripts/impor/kumpul.ts (+ .test.ts)        berkas lama → BarisImpor[] + galat
scripts/impor/tulis.ts (+ .test.ts)         BarisImpor[] → repository (idempoten, terbit + antrean)
scripts/impor/refs-manual.json              ref yang diisi manusia
scripts/impor/main.ts                       CLI
scripts/ekspor/susun.ts (+ .test.ts)        konten terbit → Snapshot + Markdown
scripts/ekspor/main.ts                      CLI
packages/content/src/skema.ts               + ar di baris ahwal
packages/content/src/konsistensi.ts         BARU ambilRefs, periksaKonsistensi
packages/content/src/tulisBlok.ts           BARU Blok[] → Markdown terbatas
packages/data/src/snapshot.ts (+ test)      BARU Snapshot, pilihAwal, gabungSnapshot, sinkronkan
apps/web/src/snapshot.json                  BARU hasil ekspor
apps/web/src/konten/sumber.ts               BARU getter konten & diksi terbit
apps/web/src/konten/cache.ts                BARU IndexedDB
apps/web/src/main.tsx                       boot: cache → pasang → import('./Aplikasi') → sinkron latar
apps/web/src/terjemah.ts                    t() membaca diksi, teksEdukasi()
```

---

### Task 1: `packages/content` — ahwal Arab, `ambilRefs`, `periksaKonsistensi`

**Files:**
- Modify: `packages/content/src/skema.ts` (IsiAhwal + skema ahwal)
- Create: `packages/content/src/konsistensi.ts`
- Modify: `packages/content/src/index.ts`
- Test: `packages/content/src/__tests__/konsistensi.test.ts`

**Interfaces:**
- Produces:
  - `interface BarisAhwal { bagian: string; syarat: string; cocok: CocokAhwal; ar?: { bagian: string; syarat: string } }`, `IsiAhwal = { kunci: string; baris: BarisAhwal[] }` (export `BarisAhwal` juga).
  - `ambilRefs(isi: unknown): string[]` — kode unik terurut dari potongan `{jenis:'rujukan',kode}` dan pola `R\d{2}-\d+` di string mana pun.
  - `interface BarisKonten { jenis: JenisKonten; slug: string; isi: unknown }` (isi = hasil `bacaIsi`, bukan JSON mentah)
  - `periksaKonsistensi(daftar: BarisKonten[]): string[]` — pesan `jenis/slug: ...`; `[]` = konsisten.

- [ ] **Step 1: Tulis tes gagal**

```ts
// packages/content/src/__tests__/konsistensi.test.ts
import { describe, expect, test } from 'vitest';
import {
  DAFTAR_FAQ, DAFTAR_MODUL, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, DAFTAR_SYAHID, DAFTAR_TANYA_JAWAB,
  SUMBER_KITAB, GLOSARIUM, ambilRefs, bacaIsi, periksaKonsistensi, type BarisKonten,
} from '../index.js';

const semuaSekarang = (): BarisKonten[] => [
  ...DAFTAR_MODUL.map(isi => ({ jenis: 'modul' as const, slug: String(isi.nomor), isi })),
  ...DAFTAR_PELAJARAN.map(isi => ({ jenis: 'materi' as const, slug: isi.slug, isi })),
  ...DAFTAR_SOAL_KUIS.map(isi => ({ jenis: 'soal_kuis' as const, slug: isi.kode, isi })),
  ...DAFTAR_SOAL_HITUNG.map(isi => ({ jenis: 'soal_hitung' as const, slug: isi.kode, isi })),
  ...DAFTAR_TANYA_JAWAB.map(isi => ({ jenis: 'tanya_jawab' as const, slug: isi.slug, isi })),
  ...DAFTAR_FAQ.map(isi => ({ jenis: 'faq' as const, slug: isi.id, isi })),
  ...SUMBER_KITAB.map(isi => ({ jenis: 'kitab' as const, slug: isi.judul, isi })),
  ...DAFTAR_SYAHID.map((isi, i) => ({ jenis: 'syahid' as const, slug: String(i), isi })),
  ...GLOSARIUM.filter(e => e.ar).map(e => ({ jenis: 'glosarium_ar' as const, slug: e.id, isi: { istilahId: e.istilah, ...e.ar! } })),
];

describe('ambilRefs', () => {
  test('dari potongan rujukan dan teks bebas, unik & terurut', () => {
    expect(ambilRefs({ blok: [{ jenis: 'paragraf', isi: [{ jenis: 'rujukan', kode: 'R09-7' }] }], sumber: 'lihat R04-2 dan R09-7' }))
      .toEqual(['R04-2', 'R09-7']);
    expect(ambilRefs({ judul: 'tanpa kode' })).toEqual([]);
  });
});

describe('periksaKonsistensi', () => {
  test('konten sekarang konsisten dengan KB', () => {
    expect(periksaKonsistensi(semuaSekarang())).toEqual([]);
  });
  test('ref tak dikenal, istilah tak dikenal, kuis hilang, istilah glosarium_ar di luar KB', () => {
    const pelajaran = { ...DAFTAR_PELAJARAN[0]!, blok: [
      { jenis: 'paragraf' as const, isi: [{ jenis: 'rujukan' as const, kode: 'R99-1' }, { jenis: 'istilah' as const, id: 'tak-ada', teks: 'x' }] },
      { jenis: 'kuis' as const, daftarKode: ['K-999'] },
    ] };
    const galat = periksaKonsistensi([
      { jenis: 'materi', slug: 'uji', isi: pelajaran },
      { jenis: 'glosarium_ar', slug: 'x', isi: { istilahId: 'Bukan Istilah KB', makna: 'م' } },
    ]);
    expect(galat.join('\n')).toMatch(/materi\/uji: ref R99-1/);
    expect(galat.join('\n')).toMatch(/materi\/uji: istilah tak-ada/);
    expect(galat.join('\n')).toMatch(/materi\/uji: kuis K-999/);
    expect(galat.join('\n')).toMatch(/glosarium_ar\/x: istilah "Bukan Istilah KB"/);
  });
  test('syahid yang tidak ada di teks ayat KB ditolak', () => {
    const [syahid] = DAFTAR_SYAHID;
    expect(periksaKonsistensi([{ jenis: 'syahid', slug: 's', isi: { ...syahid!, syahid: 'ليس في الآية' } }])[0]).toMatch(/syahid\/s/);
  });
});

test('ahwal menerima versi Arab per baris', () => {
  const isi = { kunci: 'SUAMI', baris: [{ bagian: '1/2', syarat: 'x', cocok: { fardh: '1/2' }, ar: { bagian: '١/٢', syarat: 'س' } }] };
  expect(bacaIsi('ahwal', isi).ok).toBe(true);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/content test konsistensi`
Expected: FAIL — `ambilRefs`/`periksaKonsistensi` tidak diekspor.

- [ ] **Step 3: Implementasi**

`skema.ts`: ganti `IsiAhwal` dan skema `ahwal`:

```ts
export interface BarisAhwal { bagian: string; syarat: string; cocok: CocokAhwal; ar?: { bagian: string; syarat: string } }
export interface IsiAhwal { kunci: string; baris: BarisAhwal[] }
// di SKEMA.ahwal, objek baris:
//   bagian: z.string(), syarat: z.string(), cocok: ..., ar: z.object({ bagian: z.string(), syarat: z.string() }).optional(),
```

```ts
// packages/content/src/konsistensi.ts
// Pemeriksa konten ↔ KB yang tidak bisa dijaga Zod: ref ada di KB, istilah ada di glosarium bab 15, kuis yang disisipkan
// di materi ada di bank kuis, syahid persis ada di teks ayat, kitab ada di bab 17.2, dan terjemahan glosarium menunjuk
// istilah KB. Dipakai skrip impor, tes snapshot web, dan portal sebelum menyimpan. Mengembalikan daftar pesan, tidak melempar.
import { cariIstilah, GLOSARIUM } from './glossary.js';
import type { Pelajaran } from './materi.js';
import { cariRujukan, DAFTAR_AYAT, DAFTAR_KITAB, JUDUL_BAB } from './refs.js';
import type { JenisKonten } from './skema.js';
import type { Syahid, SumberKitab } from './pustaka.js';

export interface BarisKonten { jenis: JenisKonten; slug: string; isi: unknown }

const POLA_REF = /\bR\d{2}-\d+\b/g;

export function ambilRefs(isi: unknown): string[] {
  const kode = new Set<string>();
  jelajahi(isi, nilai => {
    if (typeof nilai === 'string') for (const cocok of nilai.matchAll(POLA_REF)) kode.add(cocok[0]);
    else if (adalahObjek(nilai) && nilai.jenis === 'rujukan' && typeof nilai.kode === 'string') kode.add(nilai.kode);
  });
  return [...kode].sort();
}

export function periksaKonsistensi(daftar: BarisKonten[]): string[] {
  const kodeKuis = new Set(daftar.filter(baris => baris.jenis === 'soal_kuis').map(baris => (baris.isi as { kode: string }).kode));
  return daftar.flatMap(baris => periksaSatu(baris, kodeKuis).map(pesan => `${baris.jenis}/${baris.slug}: ${pesan}`));
}

function periksaSatu({ jenis, isi }: BarisKonten, kodeKuis: Set<string>): string[] {
  const galat = periksaPotongan(isi);
  if (jenis === 'materi') galat.push(...periksaKuisDiMateri(isi as Pelajaran, kodeKuis));
  if ((jenis === 'soal_kuis' || jenis === 'soal_hitung') && !JUDUL_BAB[(isi as { bab: number }).bab]) galat.push(`bab ${(isi as { bab: number }).bab} tidak ada di KB`);
  if (jenis === 'syahid') galat.push(...periksaSyahid(isi as Syahid));
  if (jenis === 'kitab' && !DAFTAR_KITAB.some(kitab => kitab.judul === (isi as SumberKitab).judul)) galat.push(`kitab "${(isi as SumberKitab).judul}" tidak ada di bab 17.2`);
  if (jenis === 'glosarium_ar' && !GLOSARIUM.some(entri => entri.istilah === (isi as { istilahId: string }).istilahId)) {
    galat.push(`istilah "${(isi as { istilahId: string }).istilahId}" tidak ada di KB bab 15`);
  }
  return galat;
}

/** [R..] di teks dan potongan rujukan harus ada di KB; potongan istilah harus ada di glosarium. */
function periksaPotongan(isi: unknown): string[] {
  const galat = ambilRefs(isi).filter(kode => !cariRujukan(kode)).map(kode => `ref ${kode} tidak ada di KB`);
  jelajahi(isi, nilai => {
    if (adalahObjek(nilai) && nilai.jenis === 'istilah' && typeof nilai.id === 'string' && !cariIstilah(nilai.id)) {
      galat.push(`istilah ${nilai.id} tidak ada di glosarium`);
    }
  });
  return galat;
}

function periksaKuisDiMateri(pelajaran: Pelajaran, kodeKuis: Set<string>): string[] {
  return pelajaran.blok.flatMap(blok => (blok.jenis === 'kuis' ? blok.daftarKode : []))
    .filter(kode => !kodeKuis.has(kode)).map(kode => `kuis ${kode} tidak ada di bank kuis`);
}

function periksaSyahid(syahid: Syahid): string[] {
  const ayat = DAFTAR_AYAT.find(ayatIni => ayatIni.surah === syahid.surah && ayatIni.ayat === syahid.ayat);
  return ayat?.teks.includes(syahid.syahid) ? [] : [`syahid tidak ada persis di ${syahid.surah} ${syahid.ayat} (KB bab 1.2)`];
}

const adalahObjek = (nilai: unknown): nilai is Record<string, unknown> => typeof nilai === 'object' && nilai !== null;

function jelajahi(nilai: unknown, kunjungi: (nilai: unknown) => void): void {
  kunjungi(nilai);
  if (Array.isArray(nilai)) nilai.forEach(anak => jelajahi(anak, kunjungi));
  else if (adalahObjek(nilai)) Object.values(nilai).forEach(anak => jelajahi(anak, kunjungi));
}
```

Catatan: `syahid.rujukan` berisi kode `Rxx-y` sehingga ikut diperiksa `periksaPotongan`. Bila `JUDUL_BAB`, `DAFTAR_AYAT`,
`DAFTAR_KITAB` belum diekspor dengan nama itu dari `refs.ts`, pakai nama yang ada di `index.ts` (semua sudah diekspor).

`index.ts`: tambah `export { ambilRefs, periksaKonsistensi, type BarisKonten } from './konsistensi.js';` dan `type BarisAhwal` di baris ekspor skema.

- [ ] **Step 4: Jalankan tes & typecheck**

Run: `pnpm --filter @waris/content test && pnpm --filter @waris/content exec tsc --noEmit -p .`
Expected: semua hijau. Bila tes "konten sekarang konsisten" gagal, itu temuan nyata di berkas konten: laporkan ke pengguna, jangan dilonggarkan.

- [ ] **Step 5: Commit**

```bash
git add packages/content/src/skema.ts packages/content/src/konsistensi.ts packages/content/src/index.ts packages/content/src/__tests__/konsistensi.test.ts
git commit -m "content: periksaKonsistensi konten-KB, ambilRefs, versi Arab ahwal"
```

---

### Task 2: `packages/content` — `tulisBlok` (Blok[] → Markdown terbatas)

Dipakai ekspor Markdown (lampiran TA) sekarang dan editor portal di tahap 3.

**Files:**
- Create: `packages/content/src/tulisBlok.ts`
- Modify: `packages/content/src/index.ts`
- Test: `packages/content/src/__tests__/tulisBlok.test.ts`

**Interfaces:**
- Produces: `tulisBlok(daftar: Blok[]): string`, `tulisPotongan(daftar: Potongan[]): string`. Hukum: `bacaBlok(x, tulisBlok(b))` deep-equal `b`.

- [ ] **Step 1: Tulis tes gagal**

```ts
// packages/content/src/__tests__/tulisBlok.test.ts
import { expect, test } from 'vitest';
import { DAFTAR_FAQ, DAFTAR_PELAJARAN, DAFTAR_TANYA_JAWAB, bacaBlok, bacaPotongan, tulisBlok, tulisPotongan } from '../index.js';

test.each(DAFTAR_PELAJARAN.map(p => [p.slug, p.blok] as const))('bolak-balik materi %s', (slug, blok) => {
  expect(bacaBlok(slug, tulisBlok(blok))).toEqual(blok);
});

test('bolak-balik FAQ dan tanya jawab', () => {
  for (const entri of DAFTAR_FAQ) expect(bacaBlok(entri.id, tulisBlok(entri.jawaban))).toEqual(entri.jawaban);
  for (const entri of DAFTAR_TANYA_JAWAB) {
    expect(bacaBlok(entri.slug, tulisBlok(entri.kasus))).toEqual(entri.kasus);
    expect(bacaBlok(entri.slug, tulisBlok(entri.penyelesaian))).toEqual(entri.penyelesaian);
  }
});

test('potongan: tebal, miring, istilah bertautan teks, rujukan', () => {
  const teks = 'Istri dapat **1/8** *fardh* [[ashabah|sisa]] [R04-2].';
  expect(tulisPotongan(bacaPotongan(teks))).toBe(teks);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/content test tulisBlok` → FAIL (`tulisBlok` tidak ada).

- [ ] **Step 3: Implementasi**

Baca dulu `bacaBlok`/`bacaPotongan` dan helper blok `kasus`/`video`/`kuis` di `packages/content/src/materi.ts`
(bentuk isi pagar ```kasus: `pewaris:`, `ahli waris:`, `harta:`, `harapan:`). `tulisBlok` menulis persis sintaks yang
diterima parser itu, satu blok dipisah baris kosong:

```ts
// packages/content/src/tulisBlok.ts
// Kebalikan bacaBlok/bacaPotongan: Blok[] → Markdown terbatas yang sama dengan docs/materi. Dipakai ekspor lampiran
// dan editor portal (sunting sebagai Markdown, simpan sebagai Blok[]). Hukum: bacaBlok(tulisBlok(b)) = b.
import type { Blok, ContohKasus, Potongan } from './materi.js';

export function tulisBlok(daftar: Blok[]): string {
  return daftar.map(tulisSatuBlok).join('\n\n') + '\n';
}

export function tulisPotongan(daftar: Potongan[]): string {
  return daftar.map(potongan => {
    switch (potongan.jenis) {
      case 'teks': return potongan.teks;
      case 'tebal': return `**${potongan.teks}**`;
      case 'miring': return `*${potongan.teks}*`;
      case 'istilah': return potongan.teks === potongan.id ? `[[${potongan.id}]]` : `[[${potongan.id}|${potongan.teks}]]`;
      case 'rujukan': return `[${potongan.kode}]`;
    }
  }).join('');
}

function tulisSatuBlok(blok: Blok): string {
  switch (blok.jenis) {
    case 'judul': return `${'#'.repeat(blok.tingkat)} ${tulisPotongan(blok.isi)}`;
    case 'paragraf': return tulisPotongan(blok.isi);
    case 'catatan': return `> ${tulisPotongan(blok.isi)}`;
    case 'daftar': return blok.butir.map((butir, i) => `${blok.berurut ? `${i + 1}.` : '-'} ${tulisPotongan(butir)}`).join('\n');
    case 'tabel': return [
      baris(blok.kepala), `|${blok.kepala.map(() => '---').join('|')}|`, ...blok.baris.map(baris),
    ].join('\n');
    case 'kasus': return '```kasus\n' + tulisKasus(blok.kasus) + '\n```';
    case 'video': return '```video\n' + `${blok.idYoutube} ${blok.judul}` + '\n```';
    case 'kuis': return '```kuis\n' + blok.daftarKode.join(', ') + '\n```';
  }
}

const baris = (sel: Potongan[][]) => `| ${sel.map(tulisPotongan).join(' | ')} |`;

function tulisKasus(kasus: ContohKasus): string {
  const saham = Object.entries(kasus.harapan.saham).map(([kunci, nilai]) => `${kunci} ${nilai}`).join(', ');
  return [`pewaris: ${kasus.pewaris}`, `ahli waris: ${ringkasAhliWaris(kasus.ahliWaris)}`, `harta: ${kasus.harta}`,
    `harapan: ${saham}; ashl ${kasus.harapan.ashlAkhir}`].join('\n');
}
```

Sesuaikan detail yang berbeda dengan parser nyata (mis. `istilah` ditulis `[[id]]` bila parser mengisi `teks` dengan
teks glosarium; format isi ```video; `ringkasAhliWaris` = kebalikan `bacaDaftarAhliWaris`, mis. `ANAK_LK x2` bila parser
menerima jumlah). Tes bolak-balik atas semua konten nyata adalah penentunya; ubah `tulisBlok`, bukan parsernya.

`index.ts`: `export { tulisBlok, tulisPotongan } from './tulisBlok.js';`

- [ ] **Step 4: Jalankan tes** — `pnpm --filter @waris/content test` → hijau.

- [ ] **Step 5: Commit**

```bash
git add packages/content/src/tulisBlok.ts packages/content/src/index.ts packages/content/src/__tests__/tulisBlok.test.ts
git commit -m "content: tulisBlok, kebalikan parser blok Markdown"
```

---

### Task 3: Paket `@waris/skrip` + peta ID diksi & teks edukasi

**Files:**
- Modify: `pnpm-workspace.yaml`, `package.json` (root: pindahkan `db:refs`, tambah script pintasan)
- Create: `scripts/package.json`, `scripts/tsconfig.json`, `scripts/vitest.config.ts`
- Modify (normalisasi `t()` dinamis): berkas web yang ditemukan di Step 2
- Create: `scripts/diksi/rencana.ts`, `scripts/diksi/rencana.test.ts`, `scripts/diksi/main.ts`, `scripts/diksi/peta.json` (hasil)

**Interfaces:**
- Produces (`scripts/diksi/rencana.ts`):
  ```ts
  export interface ButirDiksi { kunci: string; halaman: string; id: string; ar: string | null }
  export interface ButirEdukasi { slug: string; id: string; ar: string | null }
  export interface PetaDiksi { diksi: ButirDiksi[]; edukasi: ButirEdukasi[] }
  export interface BerkasSumber { jalur: string; isi: string }   // jalur relatif ke apps/web/src, pakai '/'
  export type KamusPerHalaman = Record<string, Record<string, string>>  // halaman → (teks Indonesia → Arab)
  export const BERKAS_EDUKASI: Record<string, string>  // jalur → awalan slug
  export function ambilTeksT(isi: string): string[]
  export function slugTeks(teks: string): string
  export function susunPeta(berkas: BerkasSumber[], kamus: KamusPerHalaman): PetaDiksi
  export function tulisUlang(berkas: BerkasSumber, peta: PetaDiksi): string
  ```
- `scripts/diksi/peta.json` dibaca Task 4 (impor) dan Task 9 (tulis ulang).

- [ ] **Step 1: Kerangka paket**

`pnpm-workspace.yaml` packages: tambah `- 'scripts'`.

```json
// scripts/package.json
{
  "name": "@waris/skrip",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "diksi:peta": "vite-node diksi/main.ts peta",
    "diksi:tulis": "vite-node diksi/main.ts tulis",
    "impor": "vite-node impor/main.ts",
    "impor:periksa": "vite-node impor/main.ts --periksa",
    "ekspor": "vite-node ekspor/main.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.117.1",
    "@waris/content": "workspace:*",
    "@waris/data": "workspace:*"
  },
  "devDependencies": { "@types/node": "^22.0.0", "typescript": "^5.5.0", "vite-node": "^2.1.9", "vitest": "^2.0.0" }
}
```

`scripts/tsconfig.json`: extends `../tsconfig.base.json`, `noEmit: true`, `composite: false`, `types: ["node", "vite/client"]`,
`include: [".", "../packages/content/src/raw.d.ts"]`. `scripts/vitest.config.ts`: `defineConfig({ test: { environment: 'node' } })`.
Root `package.json`: `"db:refs"` tetap; tambah `"konten:impor": "pnpm --filter @waris/skrip impor"`, `"konten:ekspor": "pnpm --filter @waris/skrip ekspor"`.
Run: `pnpm install`.

- [ ] **Step 2: Normalisasi `t()` dinamis (sebelum peta dibuat)**

Peta hanya bisa melihat `t('literal')`. Cari semua pemanggilan non-literal:

Run: `grep -rnE "\bt\([^'\"]" apps/web/src | grep -v __tests__ | grep -v konten/kamus | grep -v "terjemah.ts"`

Ubah tiap temuan tanpa mengubah teks yang tampil (kamus Arab lama tetap berlaku, tes `kamusArab.test.ts` harus tetap hijau):
- Ternary di dalam `t(...)` → `t` di tiap cabang: `t(a ? 'X' : 'Y')` → `a ? t('X') : t('Y')` (KuisKonsep, Belajar, Rujukan tab, dll.).
- Nilai enum/data kecil → peta literal di berkas pemakai, mis. di `AwalHitung.tsx`:
  `const TEKS_TINGKAT = (): Record<Tingkat, string> => ({ dasar: t('dasar'), menengah: t('menengah'), sulit: t('sulit') });`
  lalu `TEKS_TINGKAT()[soal.tingkat]`. Sama untuk jenis tanya jawab (`'Saran ustadz' | 'Fatwa'`), kelompok FAQ
  (`TEKS_KELOMPOK_FAQ` dengan fallback teks asli), `kelompok` di ModalOrang, `KATEGORI[].judul` di Rujukan (bungkus di definisinya).
- Prop yang diterjemahkan di dalam komponen (`Bagikan` `t(label)`) → pemanggil yang mengirim `t('...')`, komponen tidak memanggil `t`.
- Judul bab KB (`t(JUDUL_BAB[bab] ?? '')`) dan nama surah (`t(ayat.surah)`) → `apps/web/src/konten/judulBab.ts`:
  ```ts
  // Judul bab KB dan nama surah sebagai teks UI berterjemah. Satu baris literal per entri JUDUL_BAB/surah, supaya
  // kunci diksinya terlihat oleh pemeriksa cakupan (t dinamis tidak bisa dicek).
  import { JUDUL_BAB } from '@waris/content';
  import { t } from '../terjemah';
  export const judulBab = (bab: number): string => (({ /* 1: t('Pendahuluan dan Hak-hak atas Tirkah'), ... salin persis dari JUDUL_BAB */ }) as Record<number, string>)[bab] ?? JUDUL_BAB[bab] ?? '';
  export const namaSurah = (surah: string): string => (({ /* 'An-Nisa': t('An-Nisa'), ... dari DAFTAR_AYAT */ }) as Record<string, string>)[surah] ?? surah;
  ```
  Isi komentar `/* ... */` dengan baris sungguhan (cetak nilainya dulu: `pnpm --filter @waris/skrip exec vite-node -e "import('@waris/content').then(m => console.log(m.JUDUL_BAB, [...new Set(m.DAFTAR_AYAT.map(a => a.surah))]))"`).

Ulangi grep sampai kosong. Run: `pnpm --filter @waris/web test` → hijau (termasuk `kamusArab.test.ts`).

- [ ] **Step 3: Tulis tes gagal**

```ts
// scripts/diksi/rencana.test.ts
import { describe, expect, test } from 'vitest';
import { ambilTeksT, slugTeks, susunPeta, tulisUlang } from './rencana';

const KAMUS = { umum: { Batal: 'إلغاء' }, hitung: { 'Harta peninggalan': 'التركة' }, belajar: {} };

describe('ambilTeksT', () => {
  test('literal kutip tunggal & ganda, escape', () => {
    expect(ambilTeksT(`t('Batal') + t("Al-Qur'an") + t('Kalau \\'ragu\\'', { a: 1 }) + t(x)`)).toEqual(['Batal', "Al-Qur'an", "Kalau 'ragu'"]);
  });
});

describe('slugTeks', () => {
  test('huruf kecil, tanpa diakritik, maksimal 6 kata, sisipan jadi kata', () => {
    expect(slugTeks('Berapa harta peninggalannya?')).toBe('berapa_harta_peninggalannya');
    expect(slugTeks('Soal {nomor}, {status}')).toBe('soal_nomor_status');
    expect(slugTeks("Ma'al ghair — sisa bersama anak perempuan sekali lagi")).toBe('ma_al_ghair_sisa_bersama_anak');
    expect(slugTeks('← →')).toBe('teks');
  });
});

describe('susunPeta', () => {
  const berkas = [
    { jalur: 'ui/Tombol.tsx', isi: `t('Batal'); t('Batal')` },
    { jalur: 'layar/wizard/LangkahHarta.tsx', isi: `t('Harta peninggalan'); t('Harta peninggalan!')` },
    { jalur: 'layar/belajar/Materi.tsx', isi: `t('Batal'); t('Materi baru')` },
    { jalur: 'konten/harta.ts', isi: `t('Tabungan & kas')` },
    { jalur: 'konten/ahwal.ts', isi: `t('Diabaikan')` },
  ];
  const peta = susunPeta(berkas, KAMUS);
  test('teks di KAMUS_UMUM → halaman umum, satu kunci meski dipakai banyak berkas', () => {
    expect(peta.diksi.filter(b => b.id === 'Batal')).toEqual([{ kunci: 'umum.batal', halaman: 'umum', id: 'Batal', ar: 'إلغاء' }]);
  });
  test('halaman dari kamus, lalu dari jalur; tabrakan slug dapat akhiran _2', () => {
    expect(peta.diksi.find(b => b.id === 'Harta peninggalan')?.kunci).toBe('hitung.harta_peninggalan');
    expect(peta.diksi.find(b => b.id === 'Harta peninggalan!')?.kunci).toBe('hitung.harta_peninggalan_2');
    expect(peta.diksi.find(b => b.id === 'Materi baru')).toMatchObject({ kunci: 'belajar.materi_baru', ar: null });
  });
  test('berkas konten → edukasi; ahwal.ts dilewati', () => {
    expect(peta.edukasi).toEqual([{ slug: 'harta.tabungan_kas', id: 'Tabungan & kas', ar: null }]);
    expect(peta.diksi.some(b => b.id === 'Diabaikan')).toBe(false);
  });
  test('deterministik', () => {
    expect(susunPeta([...berkas].reverse(), KAMUS)).toEqual(peta);
  });
  test('tulisUlang: t diksi → kunci; berkas edukasi → teksEdukasi + impor', () => {
    expect(tulisUlang(berkas[1]!, peta)).toBe(`t('hitung.harta_peninggalan'); t('hitung.harta_peninggalan_2')`);
    const edukasi = tulisUlang({ jalur: 'konten/harta.ts', isi: `import { angka, t } from '../terjemah';\nx = t('Tabungan & kas');` }, peta);
    expect(edukasi).toBe(`import { angka, teksEdukasi } from '../terjemah';\nx = teksEdukasi('harta.tabungan_kas');`);
  });
});
```

- [ ] **Step 4: Jalankan, pastikan gagal** — `pnpm --filter @waris/skrip test` → FAIL (modul tidak ada).

- [ ] **Step 5: Implementasi**

```ts
// scripts/diksi/rencana.ts
// Rencana migrasi t('teks Indonesia') → t('halaman.id'). Menerima isi berkas web dan kamus Arab per halaman,
// memutuskan kunci stabil tiap teks (halaman dari kamus tempat teks itu diterjemahkan, lalu dari jalur berkas),
// menyerahkan peta (dibaca skrip impor) dan penulisan ulang sumber. Teks di berkas konten/* (label, wizard, tur, harta)
// menjadi teks_edukasi, bukan diksi. Fungsi murni: urutan berkas tidak memengaruhi hasil.

export interface ButirDiksi { kunci: string; halaman: string; id: string; ar: string | null }
export interface ButirEdukasi { slug: string; id: string; ar: string | null }
export interface PetaDiksi { diksi: ButirDiksi[]; edukasi: ButirEdukasi[] }
export interface BerkasSumber { jalur: string; isi: string }
export type KamusPerHalaman = Record<string, Record<string, string>>;

export const BERKAS_EDUKASI: Record<string, string> = {
  'konten/ahliWaris.ts': 'ahli_waris', 'konten/harta.ts': 'harta', 'konten/wizard.ts': 'wizard',
  'konten/tur.ts': 'tur', 'konten/umum.ts': 'umum',
};
/** Ahwal dimigrasi sebagai data (jenis ahwal) oleh skrip impor; kamus & terjemah bukan pemakai t. */
const DILEWATI = [/^konten\/ahwal\.ts$/, /^konten\/kamus/, /^konten\/kamusArab\.ts$/, /^terjemah\.ts$/, /^__tests__\//];
/** Urutan pencarian halaman di kamus; umum didahulukan supaya teks bersama punya satu kunci. */
const URUTAN_HALAMAN = ['umum', 'beranda', 'hitung', 'belajar', 'latihan', 'rujukan', 'faq', 'glosarium', 'tanya_jawab', 'bab'];
const HALAMAN_MENURUT_JALUR: [RegExp, string][] = [
  [/^layar\/belajar\//, 'belajar'], [/^layar\/Beranda/, 'beranda'], [/^(layar|hasil)\//, 'hitung'],
];
const MAKS_KATA_SLUG = 6;
const POLA_T = /\bt\((['"])((?:(?!\1)[^\\]|\\.)*)\1/g;

export function ambilTeksT(isi: string): string[] {
  return [...isi.matchAll(POLA_T)].map(cocok => lepasEscape(cocok[2]!));
}

export function slugTeks(teks: string): string {
  const kata = teks.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[{}]/g, ' ').split(/[^a-z0-9]+/).filter(Boolean).slice(0, MAKS_KATA_SLUG);
  return kata.length ? kata.join('_') : 'teks';
}

export function susunPeta(berkas: BerkasSumber[], kamus: KamusPerHalaman): PetaDiksi {
  const terurut = [...berkas].filter(b => !DILEWATI.some(pola => pola.test(b.jalur))).sort((a, b) => a.jalur.localeCompare(b.jalur));
  const diksi = new Map<string, ButirDiksi>();          // `${halaman}\n${teks}` → butir
  const edukasi = new Map<string, ButirEdukasi>();      // `${awalan}\n${teks}` → butir
  const terpakai = new Set<string>();
  const kunciUnik = (awalan: string, teks: string) => {
    const dasar = `${awalan}.${slugTeks(teks)}`;
    let kunci = dasar;
    for (let nomor = 2; terpakai.has(kunci); nomor++) kunci = `${dasar}_${nomor}`;
    terpakai.add(kunci);
    return kunci;
  };
  const arDari = (teks: string) => URUTAN_HALAMAN.map(h => kamus[h]?.[teks]).find(Boolean) ?? null;
  for (const { jalur, isi } of terurut) {
    const awalanEdukasi = BERKAS_EDUKASI[jalur];
    for (const teks of ambilTeksT(isi)) {
      if (awalanEdukasi) {
        const id = `${awalanEdukasi}\n${teks}`;
        if (!edukasi.has(id)) edukasi.set(id, { slug: kunciUnik(awalanEdukasi, teks), id: teks, ar: arDari(teks) });
        continue;
      }
      const halaman = tentukanHalaman(jalur, teks, kamus);
      const id = `${halaman}\n${teks}`;
      if (!diksi.has(id)) diksi.set(id, { kunci: kunciUnik(halaman, teks), halaman, id: teks, ar: kamus[halaman]?.[teks] ?? arDari(teks) });
    }
  }
  return { diksi: [...diksi.values()], edukasi: [...edukasi.values()] };
}

export function tulisUlang(berkas: BerkasSumber, peta: PetaDiksi): string {
  const awalanEdukasi = BERKAS_EDUKASI[berkas.jalur];
  const ganti = (teks: string): string | undefined => awalanEdukasi
    ? peta.edukasi.find(b => b.id === teks && b.slug.startsWith(`${awalanEdukasi}.`))?.slug
    : peta.diksi.find(b => b.id === teks && b.halaman === tentukanHalamanDariPeta(berkas.jalur, teks, peta))?.kunci;
  let hasil = berkas.isi.replace(POLA_T, (utuh, _kutip, mentah: string) => {
    const kunci = ganti(lepasEscape(mentah));
    if (!kunci) return utuh;
    return awalanEdukasi ? `teksEdukasi('${kunci}'` : `t('${kunci}'`;
  });
  if (awalanEdukasi) hasil = gantiImporT(hasil);
  return hasil;
}

function tentukanHalaman(jalur: string, teks: string, kamus: KamusPerHalaman): string {
  return URUTAN_HALAMAN.find(halaman => kamus[halaman]?.[teks] !== undefined)
    ?? HALAMAN_MENURUT_JALUR.find(([pola]) => pola.test(jalur))?.[1] ?? 'umum';
}

/**
 * Saat menulis ulang kamus tidak tersedia, jadi halaman disimpulkan dari peta: teks yang terjemahannya ada di kamus
 * hanya punya satu butir (halaman kamus); teks tanpa terjemahan bisa punya satu butir per halaman-jalur.
 */
function tentukanHalamanDariPeta(jalur: string, teks: string, peta: PetaDiksi): string | undefined {
  const kandidat = peta.diksi.filter(b => b.id === teks).map(b => b.halaman);
  if (kandidat.length <= 1) return kandidat[0];
  const menurutJalur = HALAMAN_MENURUT_JALUR.find(([pola]) => pola.test(jalur))?.[1] ?? 'umum';
  return kandidat.find(halaman => halaman === menurutJalur);
}

/** `import { angka, t } from '../terjemah'` → t diganti teksEdukasi (didefinisikan di terjemah.ts). */
function gantiImporT(isi: string): string {
  return isi.replace(/import \{ ([^}]*) \} from '\.\.\/terjemah';/, (_utuh, daftar: string) => {
    const nama = daftar.split(',').map(n => n.trim()).filter(Boolean).map(n => (n === 't' ? 'teksEdukasi' : n));
    return `import { ${nama.join(', ')} } from '../terjemah';`;
  });
}

const lepasEscape = (teks: string) => teks.replace(/\\(['"\\])/g, '$1');
```


```ts
// scripts/diksi/main.ts
// CLI: `peta` → scripts/diksi/peta.json dari apps/web/src + kamus Arab; `tulis <awalan>` → tulis ulang berkas web
// yang jalurnya diawali <awalan> (relatif ke apps/web/src) memakai peta.json. Dijalankan per kelompok halaman.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { KAMUS_UMUM } from '../../apps/web/src/konten/kamus/umum';
import { KAMUS_BERANDA } from '../../apps/web/src/konten/kamus/beranda';
import { KAMUS_HITUNG } from '../../apps/web/src/konten/kamus/hitung';
import { KAMUS_BELAJAR } from '../../apps/web/src/konten/kamus/belajar';
import { KAMUS_LATIHAN } from '../../apps/web/src/konten/kamus/latihan';
import { KAMUS_RUJUKAN } from '../../apps/web/src/konten/kamus/rujukan';
import { KAMUS_FAQ } from '../../apps/web/src/konten/kamus/faq';
import { KAMUS_GLOSARIUM } from '../../apps/web/src/konten/kamus/glosarium';
import { KAMUS_TANYA_JAWAB } from '../../apps/web/src/konten/kamus/tanyaJawab';
import { KAMUS_BAB } from '../../apps/web/src/konten/kamus/bab';
import { susunPeta, tulisUlang, type BerkasSumber, type PetaDiksi } from './rencana';

const AKAR_WEB = new URL('../../apps/web/src/', import.meta.url).pathname;
const BERKAS_PETA = new URL('./peta.json', import.meta.url).pathname;
const KAMUS = { umum: KAMUS_UMUM, beranda: KAMUS_BERANDA, hitung: KAMUS_HITUNG, belajar: KAMUS_BELAJAR, latihan: KAMUS_LATIHAN,
  rujukan: KAMUS_RUJUKAN, faq: KAMUS_FAQ, glosarium: KAMUS_GLOSARIUM, tanya_jawab: KAMUS_TANYA_JAWAB, bab: KAMUS_BAB };

const semuaBerkas = (): BerkasSumber[] => (readdirSync(AKAR_WEB, { recursive: true }) as string[])
  .filter(nama => /\.tsx?$/.test(nama))
  .map(nama => ({ jalur: relative(AKAR_WEB, join(AKAR_WEB, nama)).split(sep).join('/'), isi: readFileSync(join(AKAR_WEB, nama), 'utf8') }));

const [perintah, awalan = ''] = process.argv.slice(2);
if (perintah === 'peta') {
  const peta = susunPeta(semuaBerkas(), KAMUS);
  writeFileSync(BERKAS_PETA, JSON.stringify(peta, null, 2) + '\n');
  console.log(`diksi ${peta.diksi.length}, teks edukasi ${peta.edukasi.length}`);
} else if (perintah === 'tulis') {
  const peta = JSON.parse(readFileSync(BERKAS_PETA, 'utf8')) as PetaDiksi;
  const diubah = semuaBerkas().filter(b => b.jalur.startsWith(awalan)).flatMap(berkas => {
    const baru = tulisUlang(berkas, peta);
    if (baru === berkas.isi) return [];
    writeFileSync(join(AKAR_WEB, berkas.jalur), baru);
    return [berkas.jalur];
  });
  console.log(`ditulis ulang: ${diubah.length} berkas`);
} else {
  console.error('pakai: peta | tulis <awalan-jalur>');
  process.exit(1);
}
```

- [ ] **Step 6: Jalankan tes, buat peta, periksa manual**

Run: `pnpm --filter @waris/skrip test` → hijau.
Run: `pnpm --filter @waris/skrip diksi:peta` → mencetak jumlah.
Periksa `scripts/diksi/peta.json` sekilas: kunci terbaca, tidak ada `teks`/`_2` yang janggal untuk teks yang sering dipakai.
Kunci jelek boleh diperbaiki langsung di `peta.json` (peta itu yang dipakai seterusnya); pastikan tetap cocok regex dan unik:
`node -e "const p=require('./scripts/diksi/peta.json');const k=p.diksi.map(b=>b.kunci);console.log(k.length===new Set(k).size, k.every(x=>/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(x)))"` → `true true`.

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml package.json scripts/package.json scripts/tsconfig.json scripts/vitest.config.ts scripts/diksi apps/web/src
git commit -m "skrip: paket @waris/skrip, peta ID diksi & teks edukasi; t() dinamis dinormalisasi"
```

---

### Task 4: Skrip impor konten lama

**Files:**
- Create: `scripts/impor/kumpul.ts`, `scripts/impor/kumpul.test.ts`, `scripts/impor/tulis.ts`, `scripts/impor/tulis.test.ts`,
  `scripts/impor/refs-manual.json`, `scripts/impor/main.ts`

**Interfaces:**
- Consumes: `PetaDiksi`, `ButirDiksi` (Task 3); `ambilRefs`, `periksaKonsistensi`, `bacaIsi`, `keJson`, `JENIS_FIKIH`, `slug` (content);
  `RepositoriKonten`, `RepositoriEditorial`, `RepositoriDiksi`, `buatMemori`, `buatRepositoriSupabase` (data).
- Produces:
  ```ts
  export interface BarisImpor { jenis: JenisKonten; slug: string; urutan: number; isi: IsiKonten[JenisKonten]; refs: string[]; perluCek: boolean }
  export function kumpulkanKontenLama(peta: PetaDiksi, refsManual: Record<string, string[]>): { baris: BarisImpor[]; galat: string[] }
  export function kunciRefsManual(jenis: JenisKonten, slug: string): string   // `${jenis}/${slug}`
  export async function tulisKeRepositori(repo: { konten: RepositoriKonten; editorial: RepositoriEditorial; diksi: RepositoriDiksi },
    baris: BarisImpor[], diksi: ButirDiksi[]): Promise<{ dibuat: number; dilewati: number }>
  ```

- [ ] **Step 1: Tulis tes gagal**

```ts
// scripts/impor/kumpul.test.ts
import { expect, test } from 'vitest';
import { DAFTAR_FAQ, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, JENIS_FIKIH, bacaIsi, keJson } from '@waris/content';
import peta from '../diksi/peta.json';
import { kumpulkanKontenLama, kunciRefsManual } from './kumpul';

const { baris, galat } = kumpulkanKontenLama(peta, {});
const jumlah = (jenis: string) => baris.filter(b => b.jenis === jenis).length;

test('jumlah per jenis = jumlah di berkas lama', () => {
  expect(jumlah('materi')).toBe(DAFTAR_PELAJARAN.length);
  expect(jumlah('soal_kuis')).toBe(DAFTAR_SOAL_KUIS.length);
  expect(jumlah('soal_hitung')).toBe(DAFTAR_SOAL_HITUNG.length);
  expect(jumlah('faq')).toBe(DAFTAR_FAQ.length);
  expect(jumlah('teks_edukasi')).toBe(peta.edukasi.length + 12); // + 6 langkah selanjutnya × (judul, isi)
  expect(jumlah('cheatsheet')).toBe(4);
  expect(jumlah('ahwal')).toBeGreaterThan(0);
});

test('slug unik per jenis; semua isi lolos Zod setelah keJson', () => {
  const kunci = baris.map(b => `${b.jenis}/${b.slug}`);
  expect(new Set(kunci).size).toBe(kunci.length);
  for (const b of baris) expect(bacaIsi(b.jenis, keJson(b.jenis, b.isi)).ok, `${b.jenis}/${b.slug}`).toBe(true);
});

test('ref diambil dari isi; entri fikih tanpa ref dilaporkan, bukan dikarang', () => {
  const materi = baris.find(b => b.jenis === 'materi')!;
  expect(materi.refs.length).toBeGreaterThan(0);
  const tanpaRef = baris.filter(b => JENIS_FIKIH.includes(b.jenis) && b.refs.length === 0);
  for (const b of tanpaRef) expect(galat).toContain(`${kunciRefsManual(b.jenis, b.slug)}: jenis fikih tanpa ref, isi di refs-manual.json`);
});

test('refs manual digabung; ref manual yang tak dikenal KB dilaporkan', () => {
  const soal = baris.find(b => b.jenis === 'soal_hitung')!;
  const hasil = kumpulkanKontenLama(peta, { [kunciRefsManual('soal_hitung', soal.slug)]: ['R09-7', 'R99-9'] });
  expect(hasil.baris.find(b => b.jenis === 'soal_hitung' && b.slug === soal.slug)!.refs).toEqual(['R09-7', 'R99-9']);
  expect(hasil.galat.join('\n')).toMatch(/R99-9/);
});

test('draf: semua perluCek kecuali modul, kitab, cheatsheet', () => {
  for (const b of baris) expect(b.perluCek, b.jenis).toBe(!['modul', 'kitab', 'cheatsheet'].includes(b.jenis));
});

test('ahwal membawa Arab dari kamus', () => {
  const suami = baris.find(b => b.jenis === 'ahwal' && b.slug === 'SUAMI')!.isi as { baris: { ar?: unknown }[] };
  expect(suami.baris[0]!.ar).toBeDefined();
});
```

```ts
// scripts/impor/tulis.test.ts
import { expect, test } from 'vitest';
import { RUJUKAN } from '@waris/content';
import { buatMemori } from '@waris/data';
import type { ButirDiksi } from '../diksi/rencana';
import { tulisKeRepositori, type BarisImpor } from './tulis';

const ADMIN = { userId: 'admin', email: 'admin@lokal' };
const buatRepo = () => buatMemori({ refs: RUJUKAN.map(r => r.kode), sesi: ADMIN, peran: { admin: 'admin' } });
const baris: BarisImpor[] = [
  { jenis: 'faq', slug: 'a', urutan: 0, isi: { id: 'a', kelompok: 'Fikih', pertanyaan: 'A?', jawaban: [] }, refs: ['R09-7'], perluCek: true },
  { jenis: 'kitab', slug: 'k', urutan: 0, isi: { judul: 'K' }, refs: [], perluCek: false },
];
const diksi: ButirDiksi[] = [
  { kunci: 'umum.batal', halaman: 'umum', id: 'Batal', ar: 'إلغاء' },
  { kunci: 'umum.baru', halaman: 'umum', id: 'Baru', ar: null },
];

test('terbit + antrean: draf punya revisi terbit dan revisi diajukan', async () => {
  const repo = buatRepo();
  expect(await tulisKeRepositori(repo, baris, diksi)).toEqual({ dibuat: 4, dilewati: 0 });
  expect((await repo.konten.bacaTerbit()).map(b => b.slug).sort()).toEqual(['a', 'k']);
  const antrean = await repo.editorial.antreanReview();
  expect(antrean).toHaveLength(1);                                   // hanya faq (kitab bukan draf)
  expect((await repo.diksi.bacaTerbit()).map(d => d.kunci).sort()).toEqual(['umum.batal', 'umum.baru']);
  expect((await repo.diksi.daftarRevisi('umum.batal')).map(r => r.status).sort()).toEqual(['diajukan', 'disetujui']);
  expect((await repo.diksi.daftarRevisi('umum.baru')).map(r => r.status)).toEqual(['disetujui']);
});

test('materi: revisi diajukan tanpa lencana draf', async () => {
  const repo = buatRepo();
  const pelajaran = { slug: 'p', judul: 'P', modul: 1, urutan: 1, tujuan: 't', perluCek: true, blok: [] };
  await tulisKeRepositori(repo, [{ jenis: 'materi', slug: 'p', urutan: 101, isi: pelajaran, refs: ['R01-1'], perluCek: true }], []);
  const [diajukan] = await repo.editorial.antreanReview();
  expect((diajukan!.isi as { perluCek: boolean }).perluCek).toBe(false);
  expect(((await repo.konten.bacaTerbit())[0]!.isi as { perluCek: boolean }).perluCek).toBe(true);
});

test('idempoten: jalan kedua tidak membuat apa pun', async () => {
  const repo = buatRepo();
  await tulisKeRepositori(repo, baris, diksi);
  expect(await tulisKeRepositori(repo, baris, diksi)).toEqual({ dibuat: 0, dilewati: 4 });
  expect(await repo.editorial.antreanReview()).toHaveLength(1);
});
```

Catatan: `scripts/tsconfig.json` butuh `"resolveJsonModule": true` untuk `import peta from '../diksi/peta.json'`.

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/skrip test impor` → FAIL.

- [ ] **Step 3: Implementasi `kumpul.ts`**

```ts
// scripts/impor/kumpul.ts
// Sekali jalan: berkas konten lama (docs/*.md lewat parser packages/content, konten/*.ts web, kamus Arab) → baris impor
// per (jenis, slug). Memutuskan slug, urutan, refs (dari isi + refs-manual.json; tidak pernah dikarang), dan status draf.
// Menyerahkan baris + daftar galat (Zod, ref kosong/tak dikenal, konsistensi KB) ke main.ts; ada galat = tidak menulis apa pun.
import {
  DAFTAR_FAQ, DAFTAR_MODUL, DAFTAR_PELAJARAN, DAFTAR_SOAL_HITUNG, DAFTAR_SOAL_KUIS, DAFTAR_SYAHID, DAFTAR_TANYA_JAWAB,
  GLOSARIUM, JENIS_FIKIH, SUMBER_KITAB, ambilRefs, bacaIsi, cariRujukan, keJson, periksaKonsistensi, slug,
  type IsiKonten, type JenisKonten,
} from '@waris/content';
import { AHWAL, LANGKAH_SELANJUTNYA } from '../../apps/web/src/konten/ahwal';
import { KAMUS_ARAB } from '../../apps/web/src/konten/kamusArab';
import type { PetaDiksi } from '../diksi/rencana';

export interface BarisImpor { jenis: JenisKonten; slug: string; urutan: number; isi: IsiKonten[JenisKonten]; refs: string[]; perluCek: boolean }

/** Bukan klaim fikih dan tidak ditandai draf di berkas asalnya. */
const BUKAN_DRAF: JenisKonten[] = ['modul', 'kitab', 'cheatsheet'];
const URUTAN_PER_MODUL = 100;
/** Dari Belajar.tsx (DAFTAR_CHEATSHEET); tautan Google Drive diisi lewat portal. */
const CHEATSHEET = ['Tabel furudh & ahli waris', 'Peta hajb', "Ashl, 'aul & radd", 'Langkah menghitung'];

export const kunciRefsManual = (jenis: JenisKonten, slugEntri: string) => `${jenis}/${slugEntri}`;

export function kumpulkanKontenLama(peta: PetaDiksi, refsManual: Record<string, string[]>) {
  const mentah = barisMentah(peta);
  const baris = mentah.map(({ jenis, slug: slugEntri, urutan, isi }): BarisImpor => ({
    jenis, slug: slugEntri, urutan, isi,
    refs: [...new Set([...ambilRefs(isi), ...(refsManual[kunciRefsManual(jenis, slugEntri)] ?? [])])].sort(),
    perluCek: !BUKAN_DRAF.includes(jenis),
  }));
  return { baris, galat: periksa(baris) };
}

function periksa(baris: BarisImpor[]): string[] {
  const galat = baris.flatMap(b => {
    const kunci = kunciRefsManual(b.jenis, b.slug);
    const zod = bacaIsi(b.jenis, keJson(b.jenis, b.isi));
    return [
      ...(zod.ok ? [] : [`${kunci}: ${zod.galat}`]),
      ...(JENIS_FIKIH.includes(b.jenis) && b.refs.length === 0 ? [`${kunci}: jenis fikih tanpa ref, isi di refs-manual.json`] : []),
      ...b.refs.filter(kode => !cariRujukan(kode)).map(kode => `${kunci}: ref ${kode} tidak ada di KB`),
    ];
  });
  const kunci = baris.map(b => kunciRefsManual(b.jenis, b.slug));
  const ganda = kunci.filter((k, i) => kunci.indexOf(k) !== i).map(k => `${k}: slug ganda`);
  return [...galat, ...ganda, ...periksaKonsistensi(baris)];
}

type Mentah = Omit<BarisImpor, 'refs' | 'perluCek'>;

function barisMentah(peta: PetaDiksi): Mentah[] {
  const ar = (teks: string) => KAMUS_ARAB[teks];
  return [
    ...DAFTAR_MODUL.map(isi => ({ jenis: 'modul' as const, slug: String(isi.nomor), urutan: isi.nomor, isi })),
    ...DAFTAR_PELAJARAN.map(isi => ({ jenis: 'materi' as const, slug: isi.slug, urutan: isi.modul * URUTAN_PER_MODUL + isi.urutan, isi })),
    ...DAFTAR_SOAL_KUIS.map((isi, i) => ({ jenis: 'soal_kuis' as const, slug: isi.kode, urutan: i, isi })),
    ...DAFTAR_SOAL_HITUNG.map((isi, i) => ({ jenis: 'soal_hitung' as const, slug: isi.kode, urutan: i, isi })),
    ...DAFTAR_TANYA_JAWAB.map((isi, i) => ({ jenis: 'tanya_jawab' as const, slug: isi.slug, urutan: i, isi })),
    ...DAFTAR_FAQ.map((isi, i) => ({ jenis: 'faq' as const, slug: isi.id, urutan: i, isi })),
    ...SUMBER_KITAB.map((isi, i) => ({ jenis: 'kitab' as const, slug: slug(isi.judul), urutan: i, isi })),
    ...DAFTAR_SYAHID.map((isi, i) => ({ jenis: 'syahid' as const, slug: slug(`${isi.surah} ${isi.ayat} ${isi.hukum}`), urutan: i, isi })),
    ...GLOSARIUM.filter(entri => entri.ar).map((entri, i) => ({
      jenis: 'glosarium_ar' as const, slug: entri.id, urutan: i, isi: { istilahId: entri.istilah, ...entri.ar! },
    })),
    ...Object.entries(AHWAL).map(([kunci, daftar], i) => ({
      jenis: 'ahwal' as const, slug: kunci, urutan: i,
      isi: { kunci, baris: daftar!.map(b => ({ ...b, ...(ar(b.syarat) || ar(b.bagian) ? { ar: { bagian: ar(b.bagian) ?? b.bagian, syarat: ar(b.syarat) ?? b.syarat } } : {}) })) },
    })),
    ...peta.edukasi.map((butir, i) => ({
      jenis: 'teks_edukasi' as const, slug: butir.slug, urutan: i, isi: { id: butir.id, ...(butir.ar ? { ar: butir.ar } : {}) },
    })),
    ...LANGKAH_SELANJUTNYA.flatMap((langkah, i) => (['judul', 'isi'] as const).map(bagian => ({
      jenis: 'teks_edukasi' as const, slug: `selanjutnya.langkah_${i + 1}_${bagian}`, urutan: peta.edukasi.length + i * 2,
      isi: { id: langkah[bagian], ...(ar(langkah[bagian]) ? { ar: ar(langkah[bagian])! } : {}) },
    }))),
    ...CHEATSHEET.map((judul, i) => ({
      jenis: 'cheatsheet' as const, slug: slug(judul), urutan: i, isi: { judul, ...(ar(judul) ? { judulAr: ar(judul)! } : {}), deskripsi: '', tautan: null },
    })),
  ];
}
```

Catatan: `AHWAL` dievaluasi dengan bahasa Indonesia (tanpa localStorage di Node, `bacaBahasa()` = `'id'`), jadi `t()` di
dalamnya mengembalikan teks Indonesia. Bila `urutan` langkah-selanjutnya bertabrakan secara visual tidak masalah; `urutan`
hanya dipakai mengurutkan dalam satu jenis.

- [ ] **Step 4: Implementasi `tulis.ts`**

```ts
// scripts/impor/tulis.ts
// Menulis baris impor & diksi lewat repository (sebagai admin). Keputusan 2026-09-26 "terbit + antrean": revisi 1
// disetujui apa adanya supaya web tidak berubah; bila draf, revisi 2 identik (materi: perluCek false) diajukan sebagai
// antrean review. Idempoten: entri/kunci yang sudah punya revisi terbit dilewati.
import type { RepositoriDiksi, RepositoriEditorial, RepositoriKonten } from '@waris/data';
import type { ButirDiksi } from '../diksi/rencana';
import type { BarisImpor } from './kumpul';
export type { BarisImpor } from './kumpul';

interface Repo { konten: RepositoriKonten; editorial: RepositoriEditorial; diksi: RepositoriDiksi }

export async function tulisKeRepositori(repo: Repo, baris: BarisImpor[], diksi: ButirDiksi[]) {
  const sudahKonten = new Set((await repo.konten.bacaTerbit()).map(b => `${b.jenis}/${b.slug}`));
  const sudahDiksi = new Set((await repo.diksi.bacaTerbit()).map(d => d.kunci));
  let dibuat = 0;
  for (const b of baris) {
    if (sudahKonten.has(`${b.jenis}/${b.slug}`)) continue;
    await imporKonten(repo.editorial, b);
    dibuat++;
  }
  for (const butir of diksi) {
    if (sudahDiksi.has(butir.kunci)) continue;
    await imporDiksi(repo.diksi, butir);
    dibuat++;
  }
  return { dibuat, dilewati: baris.length + diksi.length - dibuat };
}

async function imporKonten(editorial: RepositoriEditorial, b: BarisImpor) {
  const entriId = await editorial.buatEntri(b.jenis, b.slug, b.urutan);
  const terbit = await editorial.buatDraf(entriId, b.jenis, b.isi, b.refs);
  await editorial.ajukan(terbit);
  await editorial.setujui(terbit);
  if (!b.perluCek) return;
  const isiReview = b.jenis === 'materi' ? { ...b.isi, perluCek: false } : b.isi;
  await editorial.ajukan(await editorial.buatDraf(entriId, b.jenis, isiReview, b.refs));
}

async function imporDiksi(diksi: RepositoriDiksi, butir: ButirDiksi) {
  await diksi.buatKunci(butir.kunci, butir.halaman);
  const terbit = await diksi.buatDraf(butir.kunci, butir.id, butir.ar, null);
  await diksi.ajukan(terbit);
  await diksi.setujui(terbit);
  // Terjemahan Arab kamus masih draf (PERLU_CEK_KAMUS): diajukan ulang untuk dicek tim keilmuan.
  if (butir.ar) await diksi.ajukan(await diksi.buatDraf(butir.kunci, butir.id, butir.ar, 'impor: terjemahan Arab perlu dicek'));
}
```

`scripts/impor/refs-manual.json`: `{}`.

```ts
// scripts/impor/main.ts
// CLI impor. `--periksa`: cetak galat saja, tanpa DB. Tanpa flag: butuh SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY; memastikan akun impor ber-peran admin (kata sandi acak per jalan), masuk, lalu menulis.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buatRepositoriSupabase } from '@waris/data';
import type { PetaDiksi } from '../diksi/rencana';
import { kumpulkanKontenLama } from './kumpul';
import { tulisKeRepositori } from './tulis';

const bacaJson = <T>(jalur: string): T => JSON.parse(readFileSync(new URL(jalur, import.meta.url), 'utf8')) as T;
const peta = bacaJson<PetaDiksi>('../diksi/peta.json');
const { baris, galat } = kumpulkanKontenLama(peta, bacaJson<Record<string, string[]>>('./refs-manual.json'));
if (galat.length) {
  console.error(galat.join('\n'));
  console.error(`\n${galat.length} galat; tidak ada yang ditulis.`);
  process.exit(1);
}
if (process.argv.includes('--periksa')) {
  console.log(`siap: ${baris.length} konten, ${peta.diksi.length} diksi`);
  process.exit(0);
}

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: servis } = process.env;
if (!url || !anon || !servis) throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY wajib diisi');
const EMAIL_IMPOR = 'impor@arif-waris.local';
const sandi = randomUUID();
const admin = createClient(url, servis, { auth: { persistSession: false } });
const { data: daftar } = await admin.auth.admin.listUsers();
const ada = daftar?.users.find(u => u.email === EMAIL_IMPOR);
const userId = ada
  ? (await admin.auth.admin.updateUserById(ada.id, { password: sandi })).data.user!.id
  : (await admin.auth.admin.createUser({ email: EMAIL_IMPOR, password: sandi, email_confirm: true })).data.user!.id;
await admin.from('peran_pengguna').upsert({ user_id: userId, peran: 'admin' });

const klien = createClient(url, anon, { auth: { persistSession: false } });
const { error } = await klien.auth.signInWithPassword({ email: EMAIL_IMPOR, password: sandi });
if (error) throw error;
console.log(await tulisKeRepositori(buatRepositoriSupabase(klien), baris, peta.diksi));
```

- [ ] **Step 5: Jalankan tes** — `pnpm --filter @waris/skrip test` → `tulis.test.ts` hijau; `kumpul.test.ts` hijau
(tes "entri fikih tanpa ref dilaporkan" lolos walau galat masih ada, karena memeriksa pelaporannya).

- [ ] **Step 6: BERHENTI — minta pengguna mengisi refs manual**

Run: `pnpm --filter @waris/skrip impor:periksa`
Kirim daftar galat "jenis fikih tanpa ref" ke pengguna. JANGAN mengisi kode sendiri. Pengguna/tim keilmuan mengisi
`scripts/impor/refs-manual.json` (`{ "soal_hitung/H-01": ["R05-3"], ... }`) dari KB. Galat lain (Zod, konsistensi)
diperbaiki di berkas asal lalu dilaporkan ke pengguna. Ulangi sampai: `siap: N konten, M diksi`.

- [ ] **Step 7: Commit**

```bash
git add scripts/impor scripts/tsconfig.json
git commit -m "skrip: impor konten lama (terbit + antrean review), refs manual dari tim"
```

---

### Task 5: `packages/data` — snapshot, pilih awal, gabung, sinkron

**Files:**
- Create: `packages/data/src/snapshot.ts`, `packages/data/src/__tests__/snapshot.test.ts`
- Modify: `packages/data/package.json` (exports `"./snapshot"`), `packages/data/src/index.ts`

**Interfaces:**
- Consumes: `BarisTerbitMentah`, `saringValid` (saring.ts), `RepositoriKonten`, `RepositoriDiksi`, `DiksiTerbit`.
- Produces (juga lewat `@waris/data/snapshot`, tanpa menarik supabase-js ke bundel utama web):
  ```ts
  export interface Snapshot { versi: number; konten: BarisTerbitMentah[]; diksi: DiksiTerbit[] }
  export function pilihAwal(bawaan: Snapshot, cache: Snapshot | null): Snapshot
  export function gabungSnapshot(lama: Snapshot, versi: number, konten: BarisTerbitMentah[], diksi: DiksiTerbit[]): Snapshot
  export async function sinkronkan(repo: { konten: RepositoriKonten; diksi: RepositoriDiksi }, lokal: Snapshot): Promise<Snapshot | null>
  export { saringValid, type BarisTerbitMentah } from './saring.js';
  ```
  `sinkronkan` → `null` bila tidak ada perubahan atau gagal (galat dicatat `console.warn`, tidak dilempar).

- [ ] **Step 1: Tulis tes gagal**

```ts
// packages/data/src/__tests__/snapshot.test.ts
import { describe, expect, test, vi } from 'vitest';
import { buatMemori } from '../memori/konten.js';
import { gabungSnapshot, pilihAwal, sinkronkan, type Snapshot } from '../snapshot.js';

const kosong: Snapshot = { versi: 0, konten: [], diksi: [] };
const baris = (slug: string, versiTerbit: number, judul = slug) => ({
  entriId: `e-${slug}`, jenis: 'kitab' as const, slug, urutan: 0, revisiId: `r-${slug}-${versiTerbit}`, isi: { judul }, refs: [], versiTerbit,
});

describe('pilihAwal', () => {
  test('cache lebih baru → cache; snapshot bawaan lebih baru (deploy baru) → bawaan; tanpa cache → bawaan', () => {
    const lama = { ...kosong, versi: 3 }, baru = { ...kosong, versi: 5 };
    expect(pilihAwal(lama, baru)).toBe(baru);
    expect(pilihAwal(baru, lama)).toBe(baru);
    expect(pilihAwal(lama, null)).toBe(lama);
  });
});

describe('gabungSnapshot', () => {
  test('mengganti per entriId dan per kunci diksi, menambah yang baru, versi naik', () => {
    const lama: Snapshot = { versi: 1, konten: [baris('a', 1), baris('b', 1)], diksi: [{ kunci: 'u.a', halaman: 'u', id: 'A', ar: null, versiTerbit: 1 }] };
    const hasil = gabungSnapshot(lama, 2, [baris('a', 2, 'A baru'), baris('c', 2)], [{ kunci: 'u.a', halaman: 'u', id: 'A2', ar: 'ا', versiTerbit: 2 }]);
    expect(hasil.versi).toBe(2);
    expect(hasil.konten.map(b => [b.slug, (b.isi as { judul: string }).judul])).toEqual([['a', 'A baru'], ['b', 'b'], ['c', 'c']]);
    expect(hasil.diksi).toEqual([{ kunci: 'u.a', halaman: 'u', id: 'A2', ar: 'ا', versiTerbit: 2 }]);
  });
});

describe('sinkronkan', () => {
  const siapkan = async () => {
    const memori = buatMemori({ sesi: { userId: 'x', email: 'x' }, peran: { x: 'admin' } });
    const entri = await memori.editorial.buatEntri('kitab', 'k', 0);
    const revisi = await memori.editorial.buatDraf(entri, 'kitab', { judul: 'K' }, []);
    await memori.editorial.ajukan(revisi);
    await memori.editorial.setujui(revisi);
    return memori;
  };
  test('unduh yang berubah sejak versi lokal', async () => {
    const memori = await siapkan();
    const hasil = await sinkronkan(memori, kosong);
    expect(hasil?.versi).toBe(1);
    expect(hasil?.konten.map(b => b.slug)).toEqual(['k']);
    expect(await sinkronkan(memori, hasil!)).toBeNull();
  });
  test('repo mati → null, tidak melempar', async () => {
    const peringatan = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mati = { versiSekarang: () => Promise.reject(new Error('jaringan')) };
    expect(await sinkronkan({ konten: mati as never, diksi: {} as never }, kosong)).toBeNull();
    expect(peringatan).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/data test snapshot` → FAIL.

- [ ] **Step 3: Implementasi**

```ts
// packages/data/src/snapshot.ts
// Konten & diksi terbit yang dibawa web: snapshot bawaan hasil build (scripts/ekspor), lalu cache perangkat, lalu
// pembaruan dari server sejak versi lokal (spec "Alur data di web pengguna"). isi disimpan mentah (bentuk keJson) dan
// divalidasi saat dipasang lewat saringValid. Tidak bergantung pada supabase-js supaya bundel utama web tetap ringan.
import type { DiksiTerbit, KontenTerbit, RepositoriDiksi, RepositoriKonten } from './antarmuka.js';
import { keJson, type JenisKonten } from '@waris/content';
import type { BarisTerbitMentah } from './saring.js';
export { saringValid, type BarisTerbitMentah } from './saring.js';

export interface Snapshot { versi: number; konten: BarisTerbitMentah[]; diksi: DiksiTerbit[] }

/** Cache dipakai hanya bila lebih baru dari snapshot bawaan; deploy baru bisa membawa versi lebih tinggi dari cache lama. */
export const pilihAwal = (bawaan: Snapshot, cache: Snapshot | null): Snapshot =>
  cache && cache.versi > bawaan.versi ? cache : bawaan;

export function gabungSnapshot(lama: Snapshot, versi: number, konten: BarisTerbitMentah[], diksi: DiksiTerbit[]): Snapshot {
  const menurutEntri = new Map(lama.konten.map(baris => [baris.entriId, baris]));
  for (const baris of konten) menurutEntri.set(baris.entriId, baris);
  const menurutKunci = new Map(lama.diksi.map(butir => [butir.kunci, butir]));
  for (const butir of diksi) menurutKunci.set(butir.kunci, butir);
  return { versi, konten: [...menurutEntri.values()], diksi: [...menurutKunci.values()] };
}

export async function sinkronkan(repo: { konten: RepositoriKonten; diksi: RepositoriDiksi }, lokal: Snapshot): Promise<Snapshot | null> {
  try {
    const versi = await repo.konten.versiSekarang();
    if (versi <= lokal.versi) return null;
    const [konten, diksi] = await Promise.all([repo.konten.bacaTerbit({ sejakVersi: lokal.versi }), repo.diksi.bacaTerbit(lokal.versi)]);
    return gabungSnapshot(lokal, versi, konten.map(keMentah), diksi);
  } catch (galat) {
    console.warn('sinkron konten gagal, tetap memakai versi lokal:', galat);
    return null;
  }
}

export const keMentah = (baris: KontenTerbit): BarisTerbitMentah => ({ ...baris, isi: keJson(baris.jenis as JenisKonten, baris.isi as never) });
```

`package.json` exports: `".": "./src/index.ts", "./snapshot": "./src/snapshot.ts"`.
`index.ts`: `export { gabungSnapshot, keMentah, pilihAwal, sinkronkan, type Snapshot } from './snapshot.js';`

- [ ] **Step 4: Jalankan tes & typecheck** — `pnpm --filter @waris/data test && pnpm --filter @waris/data exec tsc --noEmit -p .` → hijau.

- [ ] **Step 5: Commit**

```bash
git add packages/data/src/snapshot.ts packages/data/src/__tests__/snapshot.test.ts packages/data/package.json packages/data/src/index.ts
git commit -m "data: snapshot konten (pilih awal, gabung, sinkron sejak versi)"
```

---

### Task 6: Skrip ekspor + jalankan impor → ekspor ke Supabase lokal

**Files:**
- Create: `scripts/ekspor/susun.ts`, `scripts/ekspor/susun.test.ts`, `scripts/ekspor/main.ts`
- Create (hasil): `apps/web/src/snapshot.json`, `docs/lampiran-konten/*.md`

**Interfaces:**
- Consumes: `Snapshot`, `keMentah` (Task 5); `tulisBlok`, `tulisPotongan` (Task 2).
- Produces:
  ```ts
  export function susunSnapshot(versi: number, konten: KontenTerbit[], diksi: DiksiTerbit[]): Snapshot  // terurut stabil
  export function keMarkdown(konten: KontenTerbit[]): Record<string, string>  // nama berkas `${jenis}.md` → isi
  ```

- [ ] **Step 1: Tulis tes gagal**

```ts
// scripts/ekspor/susun.test.ts
import { expect, test } from 'vitest';
import type { KontenTerbit } from '@waris/data';
import { keMarkdown, susunSnapshot } from './susun';

const faq: KontenTerbit = { entriId: 'e1', jenis: 'faq', slug: 'b', urutan: 1, revisiId: 'r1', refs: ['R01-1'], versiTerbit: 1,
  isi: { id: 'b', kelompok: 'Fikih', pertanyaan: 'Apa itu tirkah?', jawaban: [{ jenis: 'paragraf', isi: [{ jenis: 'teks', teks: 'Harta.' }] }] } };
const soal: KontenTerbit = { entriId: 'e2', jenis: 'soal_hitung', slug: 'H-01', urutan: 0, revisiId: 'r2', refs: ['R09-7'], versiTerbit: 2,
  isi: { kode: 'H-01', bab: 4, tingkat: 'dasar', judul: 'J', topik: 't', sumber: 's',
    kasus: { pewaris: 'L', ahliWaris: ['ISTRI'], harta: 120_000_000n, harapan: { saham: { ISTRI: 1n }, ashlAkhir: 4n } } } };

test('snapshot: urut jenis, urutan, slug; bigint jadi string digit', () => {
  const snap = susunSnapshot(7, [soal, faq], [{ kunci: 'u.b', halaman: 'u', id: 'B', ar: null, versiTerbit: 1 }, { kunci: 'u.a', halaman: 'u', id: 'A', ar: null, versiTerbit: 1 }]);
  expect(snap.versi).toBe(7);
  expect(snap.konten.map(b => b.jenis)).toEqual(['faq', 'soal_hitung']);
  expect((snap.konten[1]!.isi as { kasus: { harta: unknown } }).kasus.harta).toBe('120000000');
  expect(snap.diksi.map(d => d.kunci)).toEqual(['u.a', 'u.b']);
});

test('markdown: satu berkas per jenis, blok ditulis Markdown, refs tercantum', () => {
  const md = keMarkdown([faq, soal]);
  expect(Object.keys(md).sort()).toEqual(['faq.md', 'soal_hitung.md']);
  expect(md['faq.md']).toContain('## Apa itu tirkah?');
  expect(md['faq.md']).toContain('Harta.');
  expect(md['faq.md']).toContain('R01-1');
  expect(md['soal_hitung.md']).toContain('"harta": "120000000"');
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/skrip test ekspor` → FAIL.

- [ ] **Step 3: Implementasi**

```ts
// scripts/ekspor/susun.ts
// Konten terbit → (1) snapshot JSON yang dibawa web saat build dan jadi cadangan, (2) Markdown per jenis untuk lampiran TA.
// Urutan stabil supaya diff snapshot di git hanya menunjukkan yang benar-benar berubah.
import { tulisBlok, type Blok, type JenisKonten } from '@waris/content';
import { keMentah, type DiksiTerbit, type KontenTerbit, type Snapshot } from '@waris/data';

const urutStabil = (a: KontenTerbit, b: KontenTerbit) => a.jenis.localeCompare(b.jenis) || a.urutan - b.urutan || a.slug.localeCompare(b.slug);

export function susunSnapshot(versi: number, konten: KontenTerbit[], diksi: DiksiTerbit[]): Snapshot {
  return { versi, konten: [...konten].sort(urutStabil).map(keMentah), diksi: [...diksi].sort((a, b) => a.kunci.localeCompare(b.kunci)) };
}

export function keMarkdown(konten: KontenTerbit[]): Record<string, string> {
  const perJenis = new Map<JenisKonten, KontenTerbit[]>();
  for (const baris of [...konten].sort(urutStabil)) perJenis.set(baris.jenis, [...(perJenis.get(baris.jenis) ?? []), baris]);
  return Object.fromEntries([...perJenis].map(([jenis, daftar]) =>
    [`${jenis}.md`, `# ${jenis}\n\n${daftar.map(tulisEntri).join('\n')}`]));
}

/** Entri berblok (materi, faq, tanya jawab) ditulis sebagai Markdown terbatas; jenis lain sebagai JSON berpagar. */
function tulisEntri(baris: KontenTerbit): string {
  const isi = baris.isi as Record<string, unknown>;
  const judul = String(isi.judul ?? isi.pertanyaan ?? baris.slug);
  const refs = baris.refs.length ? `Rujukan: ${baris.refs.join(', ')}\n\n` : '';
  const blok = (['blok', 'jawaban', 'kasus', 'penyelesaian'] as const).filter(kunci => Array.isArray(isi[kunci]) && baris.jenis !== 'soal_hitung');
  const badan = blok.length
    ? blok.map(kunci => tulisBlok(isi[kunci] as Blok[])).join('\n')
    : '```json\n' + JSON.stringify(keMentah(baris).isi, null, 2) + '\n```\n';
  return `## ${judul}\n\n${refs}${badan}`;
}
```

```ts
// scripts/ekspor/main.ts
// CLI: baca konten & diksi terbit sebagai anonim (sama seperti web) → apps/web/src/snapshot.json + docs/lampiran-konten/.
// Versi dibaca lebih dulu: bila ada yang terbit di tengah jalan, sinkron web berikutnya tetap mengunduhnya.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buatRepositoriSupabase } from '@waris/data';
import { keMarkdown, susunSnapshot } from './susun';

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anon } = process.env;
if (!url || !anon) throw new Error('SUPABASE_URL dan SUPABASE_ANON_KEY wajib diisi');
const repo = buatRepositoriSupabase(createClient(url, anon, { auth: { persistSession: false } }));
const versi = await repo.konten.versiSekarang();
const [konten, diksi] = await Promise.all([repo.konten.bacaTerbit(), repo.diksi.bacaTerbit()]);
writeFileSync(new URL('../../apps/web/src/snapshot.json', import.meta.url), JSON.stringify(susunSnapshot(versi, konten, diksi), null, 1) + '\n');
const folder = new URL('../../docs/lampiran-konten/', import.meta.url);
mkdirSync(folder, { recursive: true });
for (const [nama, isi] of Object.entries(keMarkdown(konten))) writeFileSync(new URL(nama, folder), isi);
console.log(`versi ${versi}: ${konten.length} konten, ${diksi.length} diksi`);
```

- [ ] **Step 4: Jalankan tes** — `pnpm --filter @waris/skrip test` → hijau.

- [ ] **Step 5: Impor & ekspor sungguhan (Supabase lokal)**

```bash
pnpm db:mulai
pnpm db:reset
npx supabase status -o env | grep = > /tmp/env-supabase
set -a; . /tmp/env-supabase; set +a
export SUPABASE_URL=$API_URL SUPABASE_ANON_KEY=$ANON_KEY SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
pnpm konten:impor
pnpm konten:impor      # kedua kali: dibuat 0
pnpm konten:ekspor
```

Expected: impor pertama `{ dibuat: N, dilewati: 0 }`, kedua `{ dibuat: 0, dilewati: N }`; ekspor mencetak jumlah konten =
jumlah baris impor dan jumlah diksi = `peta.diksi.length` (verifikasi spec "jumlah entri DB = jumlah dari berkas").

- [ ] **Step 6: Commit**

```bash
git add scripts/ekspor apps/web/src/snapshot.json docs/lampiran-konten
git commit -m "skrip: ekspor konten terbit ke snapshot web & lampiran Markdown; snapshot awal"
```

---

### Task 7: Web membaca konten dari snapshot (`konten/sumber.ts`)

Diksi dan teks edukasi belum dipindah di task ini (Task 9); `t()` masih memakai kamus.

**Files:**
- Modify: `apps/web/package.json` (+ `@waris/data`), `apps/web/tsconfig.json` (`"resolveJsonModule": true`)
- Create: `apps/web/src/konten/sumber.ts`, `apps/web/src/__tests__/snapshot.test.ts`
- Modify: semua pemakai `DAFTAR_*`/`GLOSARIUM`/`SUMBER_KITAB`/`DAFTAR_SYAHID`/`cariPelajaran`/`cariSoalHitung`/`cariIstilah`
  (glosarium dengan Arab) di `apps/web/src` (daftar: `grep -rln "DAFTAR_MODUL\|DAFTAR_PELAJARAN\|DAFTAR_SOAL\|DAFTAR_FAQ\|DAFTAR_TANYA_JAWAB\|DAFTAR_SYAHID\|SUMBER_KITAB\|GLOSARIUM\|cariPelajaran\|cariSoalHitung\|cariIstilah\|DAFTAR_CHEATSHEET\|AHWAL\b" apps/web/src`),
  `apps/web/src/konten/ahwal.ts` (sisakan `barisBerlaku`, tipe, `LANGKAH_SELANJUTNYA` sementara), `hasil/ModalOrang.tsx`, `layar/belajar/Belajar.tsx`.

**Interfaces:**
- Consumes: `Snapshot`, `saringValid` dari `@waris/data/snapshot`; `IsiKonten`, `JenisKonten`, `GLOSARIUM` (KB), `EntriGlosarium`.
- Produces (`apps/web/src/konten/sumber.ts`):
  ```ts
  export function pasangSnapshot(snapshot: Snapshot): void
  export function snapshotTerpasang(): Snapshot
  export function daftarKonten<J extends JenisKonten>(jenis: J): IsiKonten[J][]   // urut urutan, lalu slug
  export const daftarModul, daftarPelajaran, daftarSoalKuis, daftarSoalHitung, daftarFaq, daftarTanyaJawab, daftarSyahid, sumberKitab, daftarCheatsheet: () => IsiKonten[..][]
  export function cariPelajaran(slug: string): Pelajaran | undefined
  export function cariSoalHitung(kode: string): SoalHitung | undefined
  export function glosarium(): EntriGlosarium[]            // KB bab 15 + ar dari glosarium_ar
  export function cariIstilah(id: string): EntriGlosarium | undefined
  export function ahwalUntuk(kunci: string): BarisAhwal[] | undefined
  export function cariDiksi(kunci: string): DiksiTerbit | undefined          // dipakai Task 9
  export function teksEdukasiMentah(slug: string): IsiTeksEdukasi | undefined // dipakai Task 9
  ```

- [ ] **Step 1: Tulis tes gagal**

```ts
// apps/web/src/__tests__/snapshot.test.ts
// Snapshot bawaan = sumber konten saat offline; pengganti tes data di packages/content (yang berkasnya dihapus).
import { expect, test } from 'vitest';
import { periksaKonsistensi } from '@waris/content';
import { saringValid, type Snapshot } from '@waris/data/snapshot';
import bawaan from '../snapshot.json';
import { cariIstilah, cariPelajaran, daftarKonten, daftarPelajaran, glosarium, pasangSnapshot, snapshotTerpasang } from '../konten/sumber';

test('semua baris snapshot lolos skema (tidak ada yang dibuang)', () => {
  expect(saringValid((bawaan as Snapshot).konten)).toHaveLength((bawaan as Snapshot).konten.length);
});

test('snapshot konsisten dengan KB', () => {
  const baris = saringValid((bawaan as Snapshot).konten).map(({ jenis, slug, isi }) => ({ jenis, slug, isi }));
  expect(periksaKonsistensi(baris)).toEqual([]);
});

test('getter terurut dan bigint terbaca', () => {
  const pelajaran = daftarPelajaran();
  expect(pelajaran.length).toBeGreaterThan(0);
  expect(pelajaran.map(p => p.modul * 100 + p.urutan)).toEqual([...pelajaran].map(p => p.modul * 100 + p.urutan).sort((a, b) => a - b));
  expect(cariPelajaran(pelajaran[0]!.slug)).toBe(pelajaran[0]);
  expect(typeof daftarKonten('soal_hitung')[0]!.kasus.harta).toBe('bigint');
});

test('glosarium KB mendapat Arab dari glosarium_ar', () => {
  const terjemahan = daftarKonten('glosarium_ar');
  expect(terjemahan.length).toBeGreaterThan(0);
  for (const isi of terjemahan) expect(glosarium().find(e => e.istilah === isi.istilahId)?.ar?.makna).toBe(isi.makna);
  expect(cariIstilah(glosarium()[0]!.id)).toBe(glosarium()[0]);
});

test('pasangSnapshot mengganti isi getter', () => {
  const asli = snapshotTerpasang();
  pasangSnapshot({ versi: 99, konten: [], diksi: [] });
  expect(daftarPelajaran()).toEqual([]);
  pasangSnapshot(asli);
});
```

(Bila ada tes web yang memeriksa contoh kasus materi/soal hitung terhadap engine lewat `DAFTAR_*`, ubah ke getter yang sama.)

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/web test snapshot` → FAIL.

- [ ] **Step 3: Implementasi `sumber.ts`**

```ts
// apps/web/src/konten/sumber.ts
// Satu-satunya pintu web ke konten & diksi terbit. Menerima snapshot (bawaan build, atau cache yang dipasang main.tsx
// sebelum Aplikasi diimpor), memvalidasinya sekali, dan menyerahkan getter sinkron ke komponen. Glosarium = KB bab 15
// (tetap di repo) + terjemahan Arab dari konten glosarium_ar.
import { GLOSARIUM, type BarisAhwal, type EntriGlosarium, type IsiKonten, type IsiTeksEdukasi, type JenisKonten, type Pelajaran, type SoalHitung } from '@waris/content';
import type { DiksiTerbit, KontenTerbit } from '@waris/data';
import { saringValid, type Snapshot } from '@waris/data/snapshot';
import bawaan from '../snapshot.json';

let terpasang: Snapshot;
let perJenis = new Map<JenisKonten, KontenTerbit[]>();
let diksi = new Map<string, DiksiTerbit>();
let glosariumTergabung: EntriGlosarium[] = [];
let istilahMenurutSinonim = new Map<string, EntriGlosarium>();

export function pasangSnapshot(snapshot: Snapshot): void {
  terpasang = snapshot;
  perJenis = new Map();
  for (const baris of saringValid(snapshot.konten)) perJenis.set(baris.jenis, [...(perJenis.get(baris.jenis) ?? []), baris]);
  for (const daftar of perJenis.values()) daftar.sort((a, b) => a.urutan - b.urutan || a.slug.localeCompare(b.slug));
  diksi = new Map(snapshot.diksi.map(butir => [butir.kunci, butir]));
  glosariumTergabung = gabungGlosarium();
  istilahMenurutSinonim = new Map(glosariumTergabung.flatMap(entri => entri.sinonim.map(sinonim => [sinonim, entri] as const)));
}
pasangSnapshot(bawaan as Snapshot);

export const snapshotTerpasang = (): Snapshot => terpasang;
export const daftarKonten = <J extends JenisKonten>(jenis: J): IsiKonten[J][] =>
  (perJenis.get(jenis) ?? []).map(baris => baris.isi as IsiKonten[J]);

export const daftarModul = () => daftarKonten('modul');
export const daftarPelajaran = () => daftarKonten('materi');
export const daftarSoalKuis = () => daftarKonten('soal_kuis');
export const daftarSoalHitung = () => daftarKonten('soal_hitung');
export const daftarFaq = () => daftarKonten('faq');
export const daftarTanyaJawab = () => daftarKonten('tanya_jawab');
export const daftarSyahid = () => daftarKonten('syahid');
export const sumberKitab = () => daftarKonten('kitab');
export const daftarCheatsheet = () => daftarKonten('cheatsheet');
export const cariPelajaran = (slug: string): Pelajaran | undefined => daftarPelajaran().find(p => p.slug === slug);
export const cariSoalHitung = (kode: string): SoalHitung | undefined => daftarSoalHitung().find(s => s.kode === kode);
export const glosarium = (): EntriGlosarium[] => glosariumTergabung;
export const cariIstilah = (id: string): EntriGlosarium | undefined => istilahMenurutSinonim.get(id);
export const ahwalUntuk = (kunci: string): BarisAhwal[] | undefined => daftarKonten('ahwal').find(a => a.kunci === kunci)?.baris;
export const cariDiksi = (kunci: string): DiksiTerbit | undefined => diksi.get(kunci);
export const teksEdukasiMentah = (slug: string): IsiTeksEdukasi | undefined =>
  perJenis.get('teks_edukasi')?.find(baris => baris.slug === slug)?.isi as IsiTeksEdukasi | undefined;

function gabungGlosarium(): EntriGlosarium[] {
  const arab = new Map(daftarKonten('glosarium_ar').map(isi => [isi.istilahId, isi]));
  return GLOSARIUM.map(entri => {
    const terjemahan = arab.get(entri.istilah);
    if (!terjemahan) return entri;
    const { istilahId: _istilah, ...ar } = terjemahan;
    return { ...entri, ar };
  });
}
```

Pastikan `GLOSARIUM` di content masih membawa `ar` dari `glosarium-ar.md` sampai Task 10; `gabungGlosarium` menimpanya dengan
nilai dari snapshot (sama isinya). Di Task 10 `ar` dari berkas dihapus dari content.

- [ ] **Step 4: Ganti pemakai**

Mekanis, per berkas dari grep di atas: impor dari `../konten/sumber` (jalur relatif sesuai letak) alih-alih `@waris/content`,
`DAFTAR_PELAJARAN` → `daftarPelajaran()`, `DAFTAR_SOAL_HITUNG` → `daftarSoalHitung()`, `SUMBER_KITAB` → `sumberKitab()`,
`GLOSARIUM` → `glosarium()`, `cariIstilah` (Tooltip, Glosarium) → dari `sumber`. Tipe (`Pelajaran`, `Blok`, ...) dan fungsi KB
(`cariRujukan`, `JUDUL_BAB`, `dalilUntuk`, `semuaPotongan`) tetap dari `@waris/content`.
Pemakaian di tingkat modul (mis. `const X = DAFTAR_...` di luar komponen) → pindahkan ke dalam komponen atau jadikan fungsi.
- `ModalOrang.tsx`: `AHWAL[kunci]` → `ahwalUntuk(kunci)`; tampilkan `bahasaArab() && baris.ar ? baris.ar.bagian/syarat : baris.bagian/syarat`.
- `konten/ahwal.ts`: hapus `AHWAL`, `AHWAL_PERLU_CEK`, `CocokAhwal`/`BarisAhwal` lokal (pakai tipe dari content); sisakan `barisBerlaku` dan `LANGKAH_SELANJUTNYA`.
- `Belajar.tsx`: `DAFTAR_CHEATSHEET` → `daftarCheatsheet()`; `lembar.berkas` → `lembar.tautan` (tautan luar: `target="_blank" rel="noopener"`, bukan `download`); judul `bahasaArab() && lembar.judulAr ? lembar.judulAr : lembar.judul`.
- Tes web lama yang mengimpor `DAFTAR_*` dari content → getter dari `sumber`.

- [ ] **Step 5: Jalankan tes & build**

Run: `pnpm --filter @waris/web test && pnpm --filter @waris/web build` → hijau.
Run: `grep -rn "DAFTAR_PELAJARAN\|DAFTAR_SOAL\|DAFTAR_FAQ\|DAFTAR_TANYA_JAWAB\|DAFTAR_SYAHID\|SUMBER_KITAB\|DAFTAR_MODUL\|GLOSARIUM\b" apps/web/src` → kosong (kecuali `sumber.ts` `GLOSARIUM`).

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "web: konten dibaca dari snapshot lewat konten/sumber.ts"
```

---

### Task 8: Web — cache IndexedDB, boot, sinkron latar belakang

**Files:**
- Create: `apps/web/src/konten/cache.ts`, `apps/web/.env.example`
- Modify: `apps/web/src/main.tsx`, `apps/web/package.json` (+ `@supabase/supabase-js`)
- Test: `apps/web/src/__tests__/cache.test.ts`

**Interfaces:**
- Consumes: `pilihAwal`, `sinkronkan`, `Snapshot` (Task 5); `pasangSnapshot`, `snapshotTerpasang` (Task 7).
- Produces: `bacaCache(): Promise<Snapshot | null>`, `simpanCache(snapshot: Snapshot): Promise<void>` — tidak pernah melempar.

- [ ] **Step 1: Tulis tes gagal**

```ts
// apps/web/src/__tests__/cache.test.ts
import { expect, test } from 'vitest';
import { bacaCache, simpanCache } from '../konten/cache';

test('tanpa IndexedDB (jsdom): baca null, simpan tidak melempar', async () => {
  expect(await bacaCache()).toBeNull();
  await expect(simpanCache({ versi: 1, konten: [], diksi: [] })).resolves.toBeUndefined();
});
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/web test cache` → FAIL.

- [ ] **Step 3: Implementasi**

```ts
// apps/web/src/konten/cache.ts
// Cache snapshot konten di IndexedDB (localStorage terlalu kecil untuk materi). Satu kunci, satu nilai. Semua kegagalan
// (mode privat, kuota, API tidak ada) = null / diam, web jatuh ke snapshot bawaan.
import type { Snapshot } from '@waris/data/snapshot';

const NAMA_DB = 'arif-waris-konten';
const TOKO = 'snapshot';
const KUNCI = 'terakhir';

export async function bacaCache(): Promise<Snapshot | null> {
  try {
    const db = await buka();
    return await permintaan<Snapshot | undefined>(db.transaction(TOKO).objectStore(TOKO).get(KUNCI)).then(nilai => nilai ?? null);
  } catch {
    return null;
  }
}

export async function simpanCache(snapshot: Snapshot): Promise<void> {
  try {
    const db = await buka();
    await permintaan(db.transaction(TOKO, 'readwrite').objectStore(TOKO).put(snapshot, KUNCI));
  } catch {
    // Tanpa cache: muat berikutnya memakai snapshot bawaan lalu sinkron lagi.
  }
}

function buka(): Promise<IDBDatabase> {
  const minta = indexedDB.open(NAMA_DB, 1);
  minta.onupgradeneeded = () => minta.result.createObjectStore(TOKO);
  return permintaan(minta);
}

function permintaan<T>(minta: IDBRequest<T>): Promise<T> {
  return new Promise((selesai, gagal) => {
    minta.onsuccess = () => selesai(minta.result);
    minta.onerror = () => gagal(minta.error);
  });
}
```

```tsx
// apps/web/src/main.tsx
// Titik masuk: pasang konten terbaru yang ada di perangkat (cache vs snapshot bawaan), baru impor <Aplikasi/> supaya
// konstanta tingkat-modul yang memakai t()/konten melihat data itu. Sinkron dengan server berjalan di latar dan hanya
// mengisi cache; perubahan tampil di muat berikutnya (tidak mengganti teks di tengah pemakaian).
import './gaya/token.css';
import './gaya/komponen.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pilihAwal, sinkronkan, type Snapshot } from '@waris/data/snapshot';
import { bacaCache, simpanCache } from './konten/cache';
import { pasangSnapshot, snapshotTerpasang } from './konten/sumber';

pasangSnapshot(pilihAwal(snapshotTerpasang(), await bacaCache()));
const [{ Aplikasi }, { PenyediaPenjaga }] = await Promise.all([import('./Aplikasi'), import('./ui/Penjaga')]);
createRoot(document.getElementById('akar')!).render(<StrictMode><PenyediaPenjaga><Aplikasi /></PenyediaPenjaga></StrictMode>);
void sinkronLatar(snapshotTerpasang());

async function sinkronLatar(lokal: Snapshot): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const kunci = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !kunci || !navigator.onLine) return;
  const [{ createClient }, { buatRepositoriSupabase }] = await Promise.all([import('@supabase/supabase-js'), import('@waris/data')]);
  const baru = await sinkronkan(buatRepositoriSupabase(createClient(url, kunci, { auth: { persistSession: false } })), lokal);
  if (baru) await simpanCache(baru);
}
```

Top-level `await` butuh target build `es2022` (cek `vite.config.ts` `build.target`; tambahkan `build: { target: 'es2022' }` bila perlu).
`apps/web/.env.example`: `VITE_SUPABASE_URL=` dan `VITE_SUPABASE_ANON_KEY=` dengan komentar "kosong = tanpa sinkron, web jalan dari snapshot".

- [ ] **Step 4: Jalankan tes, build, dan cek di browser**

Run: `pnpm --filter @waris/web test && pnpm --filter @waris/web build` → hijau.
Buka dev server (preview), pastikan beranda & satu materi tampil, konsol tanpa galat. Dengan env Supabase lokal terisi:
setujui satu revisi di DB (mis. lewat tes integrasi atau SQL sebagai admin), muat ulang dua kali → perubahan tampil di muat kedua.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/konten/cache.ts apps/web/src/main.tsx apps/web/src/__tests__/cache.test.ts apps/web/.env.example apps/web/package.json apps/web/vite.config.ts pnpm-lock.yaml
git commit -m "web: cache konten IndexedDB, boot dari cache/snapshot, sinkron latar"
```

---

### Task 9: `t()` ke ID stabil + teks edukasi dari konten

**Files:**
- Modify: `apps/web/src/terjemah.ts` (+ `teksEdukasi`)
- Modify (tulis ulang skrip): semua berkas web pemakai `t('...')`, `konten/ahliWaris|harta|wizard|tur|umum.ts`,
  `konten/ahwal.ts` (`LANGKAH_SELANJUTNYA`), `hasil/KartuLain.tsx`
- Replace test: `apps/web/src/__tests__/kamusArab.test.ts` → `apps/web/src/__tests__/diksi.test.ts`

**Interfaces:**
- Consumes: `cariDiksi`, `teksEdukasiMentah` (Task 7); `scripts/diksi/peta.json` + `diksi:tulis` (Task 3).
- Produces: `t(kunci: string, sisipan?)` — kunci diksi; `teksEdukasi(slug: string): string` (di `terjemah.ts`).
  Keduanya: Arab bila bahasa Arab dan `ar` ada (angka Arab), selain itu Indonesia, bila tidak ada → kunci mentah (tertangkap tes).

- [ ] **Step 1: Tulis tes gagal**

```ts
// apps/web/src/__tests__/diksi.test.ts
// Spec "Diksi": ID di kode ⊆ ID di snapshot; ID di snapshot yang tidak dipakai kode dilaporkan.
import { expect, test } from 'vitest';
import { snapshotTerpasang } from '../konten/sumber';

const SUMBER = (import.meta as unknown as { glob: (pola: string[], opsi: object) => Record<string, string> })
  .glob(['../**/*.ts', '../**/*.tsx', '!../__tests__/**'], { query: '?raw', import: 'default', eager: true });
const ambil = (pola: RegExp) => new Set(Object.values(SUMBER).flatMap(isi => [...isi.matchAll(pola)].map(c => c[1]!)));
const KUNCI_T = ambil(/\bt\('([a-z0-9_]+(?:\.[a-z0-9_]+)+)'/g);
const SLUG_EDUKASI = ambil(/\bteksEdukasi\('([^']+)'\)/g);

test('tidak ada lagi t() berisi teks Indonesia', () => {
  const sisa = Object.entries(SUMBER).flatMap(([jalur, isi]) =>
    [...isi.matchAll(/\bt\((['"])(.*?)\1/g)].filter(c => !/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(c[2]!)).map(c => `${jalur}: ${c[2]}`));
  expect(sisa).toEqual([]);
});

test('setiap kunci diksi di kode ada di snapshot', () => {
  const ada = new Set(snapshotTerpasang().diksi.map(d => d.kunci));
  expect([...KUNCI_T].filter(kunci => !ada.has(kunci))).toEqual([]);
});

test('setiap teksEdukasi di kode ada di snapshot', () => {
  const ada = new Set(snapshotTerpasang().konten.filter(b => b.jenis === 'teks_edukasi').map(b => b.slug));
  expect([...SLUG_EDUKASI].filter(slug => !ada.has(slug))).toEqual([]);
});

test('kunci snapshot yang tidak dipakai kode dilaporkan', () => {
  const tidakDipakai = snapshotTerpasang().diksi.map(d => d.kunci).filter(kunci => !KUNCI_T.has(kunci));
  if (tidakDipakai.length) console.warn(`diksi tidak dipakai kode (${tidakDipakai.length}):`, tidakDipakai);
});
```

Pindahkan tes "isian dengan angka Arab dibaca sama" dari `kamusArab.test.ts` ke `diksi.test.ts` apa adanya, lalu hapus `kamusArab.test.ts`.

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/web test diksi` → FAIL (masih ada `t('teks Indonesia')`).

- [ ] **Step 3: `t()` dan `teksEdukasi` membaca snapshot**

```ts
// apps/web/src/terjemah.ts — ganti t() dan komentar kepala; fungsi angka/panah tetap
// Terjemahan UI. `t('halaman.id')` membaca diksi terbit (portal → DB → snapshot/cache); bahasa 'ar' memakai teks Arab
// bila ada, selain itu Indonesia. `{nama}` = sisipan. Kunci yang tidak dikenal tampil apa adanya dan ditangkap tes diksi.
// Ganti bahasa memuat ulang halaman (Kepala.tsx), jadi `t` boleh dipakai di konstanta modul.
import { angkaArab } from '@waris/explain';
import { cariDiksi } from './konten/sumber';
import { bacaBahasa } from './preferensi';

export function t(kunci: string, sisipan: Record<string, string | number | bigint> = {}): string {
  const diksi = cariDiksi(kunci);
  const arab = bahasaArab() ? diksi?.ar ?? undefined : undefined;
  const hasil = sisipkan(arab ?? diksi?.id ?? kunci, sisipan);
  return arab ? angkaArab(hasil) : hasil;
}

export const sisipkan = (teks: string, sisipan: Record<string, string | number | bigint>): string =>
  teks.replace(/\{(\w+)\}/g, (utuh: string, nama: string) => (nama in sisipan ? String(sisipan[nama]) : utuh));
```

Hapus impor `KAMUS_ARAB` dan fungsi `terjemahIsi` (pemakainya: ganti `terjemahIsi(x)` → `x`).
`teksEdukasi` diletakkan di `terjemah.ts` (bukan `sumber.ts`) supaya `sumber.ts` tidak mengimpor `terjemah.ts` (siklus);
`tulisUlang` Task 3 sudah menulis impornya dari `'../terjemah'`. Tambah `teksEdukasiMentah` ke impor dari `./konten/sumber`:

```ts
// apps/web/src/terjemah.ts
/** Teks edukasi (label ahli waris, wizard, tur, harta) dari konten teks_edukasi; aturan bahasanya sama dengan t(). */
export function teksEdukasi(slug: string): string {
  const isi = teksEdukasiMentah(slug);
  const arab = bahasaArab() ? isi?.ar : undefined;
  return arab ? angkaArab(arab) : isi?.id ?? slug;
}
```

- [ ] **Step 4: Tulis ulang per kelompok halaman, satu commit per kelompok**

Urutan (tiap baris = jalankan, tes, commit):

```bash
pnpm --filter @waris/skrip diksi:tulis konten/          # teks edukasi
pnpm --filter @waris/skrip diksi:tulis ui/
pnpm --filter @waris/skrip diksi:tulis tur/
pnpm --filter @waris/skrip diksi:tulis layar/wizard/
pnpm --filter @waris/skrip diksi:tulis hasil/
pnpm --filter @waris/skrip diksi:tulis layar/belajar/
pnpm --filter @waris/skrip diksi:tulis layar/
pnpm --filter @waris/skrip diksi:tulis ""               # sisa: Aplikasi.tsx, format.ts, riwayat.ts, dst.
```

Setelah tiap perintah: `pnpm --filter @waris/web exec tsc --noEmit -p . && pnpm --filter @waris/web test` (tes `diksi.test.ts`
baru hijau setelah kelompok terakhir; tes lain harus hijau tiap kali), lalu
`git add apps/web/src && git commit -m "web: t() ke ID stabil — <kelompok>"`.
Tes yang mencari teks lewat `getByText('Teks Indonesia')` tetap bekerja karena bahasa default Indonesia.

Tangani manual di kelompok `konten/`:
- `LANGKAH_SELANJUTNYA` (ahwal.ts) → `[1..6].map(n => ({ judul: teksEdukasi(\`selanjutnya.langkah_${n}_judul\`), isi: ... }))`
  ditulis literal enam baris (supaya tes cakupan melihat slug-nya), dan dipakai `KartuLain.tsx` seperti sebelumnya.
- Hapus konstanta `PERLU_CEK_LABEL`, `TEKS_HARTA.perluCek`, `TEKS_KEWAJIBAN.perluCek`, `TeksLangkah.perluCek`, `PERLU_CEK_KAMUS`
  (status review kini di DB); hapus pemakainya bila ada.

- [ ] **Step 5: Periksa tampilan Arab**

Preview dev server, pilih bahasa Arab: beranda, wizard, hasil (modal orang: ahwal Arab), satu materi, glosarium tampil Arab
seperti sebelum migrasi; screenshot untuk pengguna.

- [ ] **Step 6: Commit penutup** (bila ada sisa: terjemah.ts, tes diksi, penghapusan kamusArab.test.ts)

```bash
git add apps/web/src scripts/diksi
git commit -m "web: t() membaca diksi terbit, teksEdukasi dari konten; tes cakupan diksi"
```

---

### Task 10: Hapus berkas konten lama

**Files:**
- Delete: `docs/materi/`, `docs/soal/`, `docs/faq.md`, `docs/tanya-jawab.md`, `docs/rujukan/`, `docs/glosarium-ar.md`,
  `apps/web/src/konten/kamus/`, `apps/web/src/konten/kamusArab.ts`, `scripts/impor/`, `scripts/diksi/` (sekali pakai; ada di git)
- Modify: `packages/content/src/{materi,soal,faq,tanyaJawab,pustaka,glossary,index}.ts`, tes content yang memakai data berkas,
  `packages/data/src/__tests__/*.test.ts` (pakai fixture sebaris alih-alih `DAFTAR_SOAL_HITUNG[0]`/`DAFTAR_FAQ[0]`),
  `packages/content/src/__tests__/{konsistensi,tulisBlok,skema}.test.ts` (data dari `apps/web/src/snapshot.json` tidak boleh
  diimpor lintas paket → pakai fixture kecil; cakupan data nyata sudah di `apps/web/src/__tests__/snapshot.test.ts`)
- Modify: `scripts/package.json` (hapus script `diksi:*`, `impor*`), root `package.json` (`konten:impor`), `docs/panduan-tim-keilmuan.md`
  (arahkan ke portal; sebut berkas lama sudah dihapus)

- [ ] **Step 1: Hapus loader & parser berkas di content**

- `materi.ts`: hapus `BERKAS`, `DAFTAR_MODUL`, `DAFTAR_PELAJARAN`, `cariPelajaran`, `bacaPelajaran`, `bacaVersiArab`, `bacaDaftarModul`
  dan konstanta penanda Arab; sisakan tipe, `bacaBlok`, `bacaPotongan`, `semuaPotongan`, `bacaDaftarAhliWaris`, `bacaHarapan`.
- `soal.ts`: sisakan tipe `SoalHitung`, `SoalKuis`, `Tingkat`. `faq.ts`: sisakan `EntriFaq`. `tanyaJawab.ts`: sisakan tipe dan
  `JENIS_TANYA_JAWAB`. `pustaka.ts`: sisakan tipe `Syahid`, `SumberKitab`.
- `glossary.ts`: `bacaGlosarium(teksMarkdown)` tanpa parameter Arab; hapus `bacaGlosariumArab` dan impor `glosarium-ar.md`
  (field `ar?` di `EntriGlosarium` tetap, diisi web dari `glosarium_ar`).
- `index.ts`: hapus ekspor yang hilang.
- `glob.d.ts`: hapus bila `import.meta.glob` tidak dipakai lagi.

- [ ] **Step 2: Sesuaikan tes, lalu hapus berkas**

```bash
git rm -r docs/materi docs/soal docs/faq.md docs/tanya-jawab.md docs/rujukan docs/glosarium-ar.md \
  apps/web/src/konten/kamus apps/web/src/konten/kamusArab.ts scripts/impor scripts/diksi
```

Tes parser yang memakai string sebaris (mis. `bacaBlok('uji', '| A | B |...')`) tetap. Tes yang memeriksa data berkas
dipindah/diganti: konsistensi → `snapshot.test.ts` web (sudah ada), bolak-balik skema & `tulisBlok` → fixture sebaris yang
mencakup tiap jenis blok (judul, paragraf, daftar berurut/tidak, catatan, tabel, kasus, video, kuis) dan tiap jenis potongan.

- [ ] **Step 3: Tidak ada rujukan tersisa**

Run: `grep -rn "docs/materi\|docs/soal\|docs/faq\|tanya-jawab.md\|docs/rujukan\|glosarium-ar\|KAMUS_\|kamusArab\|DAFTAR_PELAJARAN\|DAFTAR_SOAL\|DAFTAR_FAQ" --exclude-dir=node_modules --exclude-dir=superpowers --exclude-dir=lampiran-konten . `
Expected: kosong (dokumen di `docs/superpowers` boleh menyebut sejarahnya).

- [ ] **Step 4: Semua tes & build**

Run: `env -u SUPABASE_URL pnpm test && pnpm --filter @waris/web build` → hijau.

- [ ] **Step 5: Commit**

```bash
git add -A packages/content packages/data scripts apps/web docs/panduan-tim-keilmuan.md package.json
git commit -m "hapus berkas konten lama: konten & diksi kini di database (snapshot di web)"
```

---

### Task 11: Verifikasi tahap 2

- [ ] **Step 1: Tes JS tanpa jaringan** — `env -u SUPABASE_URL pnpm test` → semua hijau; catat angka per paket.
- [ ] **Step 2: DB dari nol + ekspor ulang stabil** — `pnpm db:reset && pnpm db:tes` → ok. Snapshot tidak bisa diimpor ulang
  (berkas lama dihapus); cukup pastikan `git status` bersih.
- [ ] **Step 3: Tes integrasi data dengan Supabase lokal** — seperti tahap 1 (`SUPABASE_URL=$API_URL ... pnpm --filter @waris/data test`) → semua lolos.
- [ ] **Step 4: Build & tampilan** — `pnpm --filter @waris/web build`; preview: bahasa Indonesia & Arab, offline (matikan jaringan di
  devtools) tetap memuat dari cache/snapshot.
- [ ] **Step 5: Centang plan & commit**

```bash
git add docs/superpowers/plans/2026-09-26-database-tahap2-migrasi-konten.md
git commit -m "docs: centang plan database tahap 2 migrasi konten"
```
