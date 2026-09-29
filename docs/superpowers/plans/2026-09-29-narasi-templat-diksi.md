# Narasi Explain sebagai Templat Diksi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Semua kalimat narasi `packages/explain` dibaca dari diksi (DB → `snapshot.json`) lewat kamus yang diberikan sebagai argumen, dengan keluaran identik seperti sebelumnya.

**Architecture:** Helper `susun(penyusun, kunci, sisipan)` menggantikan `kalimat\`…\``; `Penyusun = { kamus, bahasa }` dibawa `Konteks`. Teks masuk `apps/web/src/snapshot.json` (halaman `narasi`) lewat skrip kecil; DB diisi dari snapshot dengan `pnpm konten:pulihkan` yang sudah ada. Snapshot keluaran "emas" dibekukan sebelum migrasi dan menjadi pengaman tiap task.

**Tech Stack:** TypeScript, vitest (`toMatchFileSnapshot`), Supabase Postgres + pgTAP, pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-09-29-narasi-templat-diksi-design.md`

## Global Constraints

- Nama variabel/fungsi/komentar bahasa Indonesia; tidak ada nama 1 huruf kecuali index loop (CLAUDE.md).
- `packages/explain` tidak boleh mengimpor `@waris/data` atau `apps/*` di kode non-tes.
- Pola kunci diksi: `^[a-z0-9_]+(\.[a-z0-9_]+)+$`; kunci narasi: `narasi.<gaya>.<bab>.<kalimat>[.<varian>]`, gaya ∈ `cerita|ringkas|arab|munasakhat|umum`.
- Sisipan di templat: `{nama}` dengan `nama` = `\w+`.
- Tidak ada perubahan redaksi: keluaran `__snapshots__/emas.json` wajib identik setelah tiap task (kecuali Task 4 yang hanya boleh mengganti nama mode di kunci kasus, bukan isi).
- Potongan yang hanya tanda baca/spasi boleh tetap literal di kode; apa pun yang berisi huruf wajib lewat diksi.
- Redaksi Arab tetap draf (`PERLU_CEK_ARAB`); `id_teks` untuk kunci `narasi.arab.*` = terjemahan Indonesia buatan implementer.
- Tiap task diakhiri commit (pesan diakhiri `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`), hanya file task itu.

## Review Focus

1. Admin mengedit kalimat narasi dan menghapus/mengganti nama `{sisipan}` → harus ditolak saat menyimpan, bukan membuat halaman penjelasan error di produksi. (Task 2)
2. Kunci narasi baru di kode tapi belum ada di `snapshot.json` → tes gagal dengan nama kuncinya, bukan tampil kunci mentah. (Task 3, Task 9)
3. Kunci ada di cache pengguna lama yang belum punya kunci `narasi.*` → `pilihAwal` sudah mengambil kunci baru dari snapshot bawaan; tes Task 8 memastikan narasi tetap tampil. (Task 8)
4. Kalimat yang dibuka sisipan orang/istilah → huruf kapital awal tetap diterapkan `buatBaris` seperti sebelumnya (emas menangkap). (Task 3)
5. Bahasa `ar` pada kunci tanpa `ar` → jatuh ke `id`, tidak melempar. (Task 3)

---

### Task 1: Bekukan keluaran emas

**Files:**
- Create: `packages/explain/src/__tests__/emas.test.ts`
- Create (dihasilkan): `packages/explain/src/__tests__/__snapshots__/emas.json`

**Interfaces:**
- Produces: `emas.json` — pengaman identik untuk Task 3–9.

- [ ] **Step 1: Tulis tes**

```ts
// Keluaran narasi dibekukan sebelum migrasi ke templat diksi: semua kasus × semua mode harus identik setelah tiap task.
import { hitung, hitungMunasakhat } from '@waris/engine';
import { expect, test } from 'vitest';
import * as bab16 from '../../../engine/src/__tests__/fixtures/bab16.js';
import { KASUS_MADZHAB } from '../../../engine/src/__tests__/fixtures/madzhab.js';
import { MUNASAKHAT_FIXTURES } from '../../../engine/src/__tests__/fixtures/munasakhat.js';
import { jelaskan, jelaskanMunasakhat } from '../index.js';

const MODE = ['cerita', 'ringkas', 'arab'] as const;

test('keluaran narasi identik dengan emas', async () => {
  const hasil: Record<string, unknown> = {};
  const daftarKasus = [
    ...Object.entries(bab16).filter(([, kasus]) => typeof kasus === 'object' && kasus && 'input' in kasus)
      .map(([nama, kasus]) => [nama, (kasus as { input: Parameters<typeof hitung>[0] }).input] as const),
    ...KASUS_MADZHAB.map(kasus => [`madzhab:${kasus.nama}`, kasus.input] as const),
  ];
  for (const [nama, input] of daftarKasus) {
    const hasilHitung = hitung(input);
    if (hasilHitung.status !== 'OK') continue;
    for (const mode of MODE) hasil[`${nama}/${mode}`] = jelaskan(hasilHitung, input.graf, { mode });
  }
  for (const fixture of MUNASAKHAT_FIXTURES) {
    const hasilHitung = hitungMunasakhat(fixture.input);
    if (hasilHitung.status !== 'OK') continue;
    for (const mode of ['cerita', 'ringkas'] as const) {
      hasil[`munasakhat:${fixture.nama}/${mode}`] = jelaskanMunasakhat(hasilHitung, fixture.input.dasar.graf, { mode });
    }
  }
  await expect(JSON.stringify(hasil, null, 1)).toMatchFileSnapshot('./__snapshots__/emas.json');
});
```

Periksa nama field fixture sebelum menjalankan: `KasusMadzhab` dan `MunasakhatFixture` mungkin memakai field selain `nama`/`input` (lihat `packages/engine/src/__tests__/fixtures/madzhab.ts:8` dan `munasakhat.ts`); sesuaikan akses field, jangan ubah fixture. Jumlah entri harus > 100.

- [ ] **Step 2: Jalankan untuk membuat emas**

Run: `pnpm --filter @waris/explain test -- emas`
Expected: PASS, file `__snapshots__/emas.json` terbuat. Cek `grep -c '"judul"' packages/explain/src/__tests__/__snapshots__/emas.json` > 300.

- [ ] **Step 3: Jalankan sekali lagi**

Run: `pnpm --filter @waris/explain test`
Expected: semua PASS (emas stabil/deterministik).

- [ ] **Step 4: Commit**

```bash
git add packages/explain/src/__tests__/emas.test.ts packages/explain/src/__tests__/__snapshots__/emas.json
git commit -m "explain: bekukan keluaran narasi (emas) sebelum migrasi templat diksi"
```

---

### Task 2: Penjaga sisipan diksi (DB + memori)

**Files:**
- Create: `supabase/migrations/20260929000001_jaga_sisipan_diksi.sql`
- Create: `supabase/tests/database/11_sisipan_diksi.test.sql`
- Modify: `packages/data/src/memori/konten.ts` (`buatDraf`, `perbaruiAjuan` di repositori diksi, ±baris 312–360)
- Test: `packages/data/src/__tests__/` (file tes repositori diksi memori yang ada; cari dengan `grep -ln "buatDraf" packages/data/src/__tests__`)

**Interfaces:**
- Produces: galat dengan pesan `Teks harus tetap memuat bagian otomatis: {a}, {b}` bila himpunan sisipan berbeda.

- [ ] **Step 1: Tes pgTAP yang gagal**

```sql
-- supabase/tests/database/11_sisipan_diksi.test.sql
-- Revisi diksi tidak boleh mengubah himpunan {sisipan} dari teks terbit kuncinya (narasi & t() bergantung padanya).
begin;
select plan(4);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000b', 'penulis2@tes.local');
insert into diksi (kunci, halaman) values ('narasi.tes.contoh', 'narasi');
insert into revisi_diksi (id, kunci, id_teks, status, dibuat_oleh)
  values ('20000000-0000-0000-0000-000000000001', 'narasi.tes.contoh', 'Harta {jumlah} untuk {orang}.', 'terbit', '00000000-0000-0000-0000-00000000000b');
update diksi set revisi_terbit_id = '20000000-0000-0000-0000-000000000001' where kunci = 'narasi.tes.contoh';

select lives_ok(
  $$insert into revisi_diksi (kunci, id_teks, dibuat_oleh) values ('narasi.tes.contoh', 'Untuk {orang}: {jumlah}.', '00000000-0000-0000-0000-00000000000b')$$,
  'urutan sisipan boleh berubah');
select throws_ok(
  $$insert into revisi_diksi (kunci, id_teks, dibuat_oleh) values ('narasi.tes.contoh', 'Harta untuk {orang}.', '00000000-0000-0000-0000-00000000000b')$$,
  'P0001', 'Teks harus tetap memuat bagian otomatis: {jumlah}, {orang}', 'sisipan hilang ditolak');
select throws_ok(
  $$insert into revisi_diksi (kunci, id_teks, ar_teks, dibuat_oleh) values ('narasi.tes.contoh', 'Harta {jumlah} untuk {orang}.', 'لـ{orang}', '00000000-0000-0000-0000-00000000000b')$$,
  'P0001', 'Teks harus tetap memuat bagian otomatis: {jumlah}, {orang}', 'sisipan hilang di teks Arab ditolak');
select lives_ok(
  $$insert into revisi_diksi (kunci, id_teks, dibuat_oleh) values ('narasi.tes.contoh', 'Harta {jumlah} untuk {orang}.', '00000000-0000-0000-0000-00000000000b')$$,
  'ar kosong tidak diperiksa');

select * from finish();
rollback;
```

Sesuaikan kolom insert `revisi_diksi` bila constraint transisi (`20260926000002_transisi.sql`) melarang insert langsung berstatus `terbit`; jika dilarang, buat revisi draf lalu jalankan transisi seperti di `09_ajuan_diksi.test.sql`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm db:reset && pnpm db:tes`
Expected: 11_sisipan_diksi FAIL (sisipan hilang tidak ditolak).

- [ ] **Step 3: Migrasi trigger**

```sql
-- supabase/migrations/20260929000001_jaga_sisipan_diksi.sql
-- Revisi diksi wajib mempertahankan himpunan {sisipan} teks terbit kuncinya (urutan bebas). Kunci tanpa teks terbit
-- bebas. Explain & t() mengisi sisipan dari kode; sisipan yang hilang/berganti nama merusak halaman di produksi.
create function sisipan_teks(teks text) returns text[] language sql immutable as $$
  select coalesce(array_agg(distinct cocok[1] order by cocok[1]), '{}') from regexp_matches(teks, '\{(\w+)\}', 'g') as cocok
$$;

create function jaga_sisipan_diksi() returns trigger language plpgsql as $$
declare
  teks_terbit text;
  harapan text[];
begin
  select r.id_teks into teks_terbit from diksi d join revisi_diksi r on r.id = d.revisi_terbit_id where d.kunci = new.kunci;
  if teks_terbit is null then return new; end if;
  harapan := sisipan_teks(teks_terbit);
  if sisipan_teks(new.id_teks) <> harapan or (new.ar_teks is not null and sisipan_teks(new.ar_teks) <> harapan) then
    raise exception 'Teks harus tetap memuat bagian otomatis: %',
      (select string_agg('{' || nama || '}', ', ') from unnest(harapan) as nama);
  end if;
  return new;
end $$;

create trigger jaga_sisipan_diksi before insert or update of id_teks, ar_teks on revisi_diksi
  for each row execute function jaga_sisipan_diksi();
```

- [ ] **Step 4: Jalankan**

Run: `pnpm db:reset && pnpm db:tes`
Expected: semua PASS.

- [ ] **Step 5: Tes memori yang gagal**

Tambahkan ke file tes repositori diksi memori:

```ts
test('revisi diksi yang mengubah himpunan sisipan ditolak', async () => {
  // siapkan kunci 'narasi.tes.contoh' terbit dengan teks 'Harta {jumlah} untuk {orang}.' memakai helper yang dipakai tes lain di file ini
  await expect(repo.diksi.buatDraf('narasi.tes.contoh', 'Harta untuk {orang}.', null, null))
    .rejects.toThrow('Teks harus tetap memuat bagian otomatis: {jumlah}, {orang}');
  await expect(repo.diksi.buatDraf('narasi.tes.contoh', 'Untuk {orang}: {jumlah}.', null, null)).resolves.toBeTypeOf('string');
});
```

Run: `pnpm --filter @waris/data test` → FAIL.

- [ ] **Step 6: Implementasi memori**

Di `packages/data/src/memori/konten.ts`, tambahkan helper di bagian bawah file dan panggil di awal `buatDraf` dan `perbaruiAjuan` (setelah `wajibPeran`):

```ts
/** Cermin trigger jaga_sisipan_diksi: himpunan {sisipan} revisi = himpunan teks terbit (urutan bebas). */
function jagaSisipan(teksTerbit: string | undefined, idTeks: string, arTeks: string | null): void {
  if (teksTerbit === undefined) return;
  const himpunan = (teks: string) => [...new Set([...teks.matchAll(/\{(\w+)\}/g)].map(cocok => cocok[1]!))].sort().join(',');
  const harapan = himpunan(teksTerbit);
  if (himpunan(idTeks) === harapan && (arTeks === null || himpunan(arTeks) === harapan)) return;
  throw new Error(`Teks harus tetap memuat bagian otomatis: ${harapan.split(',').filter(Boolean).map(nama => `{${nama}}`).join(', ')}`);
}
```

Teks terbit: `const baris = kunciDiksi.get(kunci); const teksTerbit = baris?.revisiTerbitId ? revisiDiksi.get(baris.revisiTerbitId)?.idTeks : undefined;` (untuk `perbaruiAjuan`, ambil `kunci` dari revisinya).

- [ ] **Step 7: Jalankan & commit**

Run: `pnpm --filter @waris/data test && pnpm --filter @waris/admin test`
Expected: PASS.

```bash
git add supabase/migrations/20260929000001_jaga_sisipan_diksi.sql supabase/tests/database/11_sisipan_diksi.test.sql packages/data/src
git commit -m "data: revisi diksi wajib mempertahankan {sisipan} teks terbit (trigger + repositori memori)"
```

---

### Task 3: `susun`, `Kamus`, skrip tambah diksi, kamus tes

**Files:**
- Modify: `packages/explain/src/segments.ts`
- Create: `scripts/tambah-diksi.ts`
- Modify: `scripts/package.json` (script `diksi:tambah`), root `package.json` (`"diksi:tambah": "pnpm --filter @waris/skrip diksi:tambah"`; cek nama paket di `scripts/package.json`)
- Create: `packages/explain/src/__tests__/kamus.ts`
- Test: `packages/explain/src/__tests__/susun.test.ts`

**Interfaces:**
- Produces (dari `segments.ts`, diekspor `index.ts`):
  ```ts
  export type Bahasa = 'id' | 'ar';
  export type Kamus = (kunci: string) => { id: string; ar?: string | null } | undefined;
  export interface Penyusun { kamus: Kamus; bahasa: Bahasa }
  export function susun(penyusun: Penyusun, kunci: string, sisipan?: Record<string, Sisipan>): Potongan[];
  export function teksKamus(penyusun: Penyusun, kunci: string, sisipan?: Record<string, string>): string;
  ```
- Produces (tes): `kamusSnapshot: Kamus`, `penyusunTes(bahasa?: Bahasa): Penyusun`, `kunciTerpakai: Set<string>` dari `__tests__/kamus.ts`.
- Produces (skrip): `pnpm diksi:tambah <file.json>` — file berisi `[{ "kunci": string, "id": string, "ar"?: string }]`.

- [ ] **Step 1: Tes yang gagal**

```ts
// packages/explain/src/__tests__/susun.test.ts
import { describe, expect, test } from 'vitest';
import { istilah } from '../terms.js';
import { susun, teksKamus, type Kamus } from '../segments.js';

const KAMUS: Record<string, { id: string; ar?: string | null }> = {
  'narasi.tes.harta': { id: 'Harta ({tirkah}) {jumlah} untuk {orang}.', ar: 'التركة {jumlah}' },
  'narasi.tes.polos': { id: 'Tanpa sisipan.' },
};
const kamus: Kamus = kunci => KAMUS[kunci];
const orang = { jenis: 'orang' as const, daftarIdOrang: ['a'], teks: 'istri' };

describe('susun', () => {
  test('sisipan teks, istilah, orang; teks bersebelahan digabung', () => {
    expect(susun({ kamus, bahasa: 'id' }, 'narasi.tes.harta', { tirkah: istilah('tirkah', 'tirkah'), jumlah: 'Rp10', orang })).toEqual([
      { jenis: 'teks', teks: 'Harta (' }, { jenis: 'istilah', istilah: 'tirkah', teks: 'tirkah' },
      { jenis: 'teks', teks: ') Rp10 untuk ' }, orang, { jenis: 'teks', teks: '.' },
    ]);
  });
  test('bahasa ar memakai ar; ar kosong → id', () => {
    expect(teksKamus({ kamus, bahasa: 'ar' }, 'narasi.tes.harta', { jumlah: '١٠' })).toBe('التركة ١٠');
    expect(teksKamus({ kamus, bahasa: 'ar' }, 'narasi.tes.polos')).toBe('Tanpa sisipan.');
  });
  test('kunci tidak ada → throw', () => {
    expect(() => susun({ kamus, bahasa: 'id' }, 'narasi.tes.hilang')).toThrow('kunci narasi tidak ada: narasi.tes.hilang');
  });
  test('sisipan kurang atau berlebih → throw', () => {
    expect(() => susun({ kamus, bahasa: 'id' }, 'narasi.tes.harta', { jumlah: '1', orang })).toThrow('sisipan {tirkah} tidak disediakan untuk narasi.tes.harta');
    expect(() => susun({ kamus, bahasa: 'id' }, 'narasi.tes.polos', { lebih: '1' })).toThrow('sisipan tidak dipakai templat narasi.tes.polos: lebih');
  });
});
```

Catatan: pada `bahasa: 'ar'` templat Arab boleh memakai sebagian sisipan saja? **Tidak** — pengecekan dua arah berlaku per teks yang dipilih. Karena itu tes di atas memberi `{ jumlah }` saja untuk `ar`. Penjaga DB (Task 2) memastikan `ar` dan `id` punya himpunan sama untuk teks yang diedit admin; kunci `narasi.arab.*` dibuat dengan himpunan yang sama sejak awal.

Run: `pnpm --filter @waris/explain test -- susun` → FAIL (`susun` belum ada).

- [ ] **Step 2: Implementasi di `segments.ts`**

Tambahkan di bawah `kalimat` (ubah `type Sisipan` jadi `export type Sisipan`):

```ts
export type Bahasa = 'id' | 'ar';
/** Pembaca diksi terbit; web membangunnya dari snapshot, tes dari snapshot.json. Explain tidak tahu asal datanya. */
export type Kamus = (kunci: string) => { id: string; ar?: string | null } | undefined;
export interface Penyusun { kamus: Kamus; bahasa: Bahasa }

const POLA_SISIPAN = /\{(\w+)\}/g;

/** Templat diksi → Potongan[]. Kunci/sisipan yang tidak cocok dilempar supaya tidak tampil kalimat rusak diam-diam. */
export function susun(penyusun: Penyusun, kunci: string, sisipan: Record<string, Sisipan> = {}): Potongan[] {
  const templat = pilihTeks(penyusun, kunci);
  const dipakai = new Set([...templat.matchAll(POLA_SISIPAN)].map(cocok => cocok[1]!));
  for (const nama of dipakai) if (!(nama in sisipan)) throw new Error(`sisipan {${nama}} tidak disediakan untuk ${kunci}`);
  const lebih = Object.keys(sisipan).filter(nama => !dipakai.has(nama));
  if (lebih.length) throw new Error(`sisipan tidak dipakai templat ${kunci}: ${lebih.join(', ')}`);
  const [teksAwal = '', ...sisa] = templat.split(POLA_SISIPAN);
  // split dengan grup tangkap: [teks, nama, teks, nama, teks, …] → bentuk argumen template bertag.
  const daftarTeks = [teksAwal, ...sisa.filter((_, i) => i % 2 === 1)];
  const daftarSisipan = sisa.filter((_, i) => i % 2 === 0).map(nama => sisipan[nama]!);
  return kalimat(Object.assign([...daftarTeks], { raw: daftarTeks }) as TemplateStringsArray, ...daftarSisipan);
}

/** Teks polos dari kamus (judul bab, label, penggalan yang dipilih kode). */
export function teksKamus(penyusun: Penyusun, kunci: string, sisipan: Record<string, string> = {}): string {
  return susun(penyusun, kunci, sisipan).map(potonganIni => potonganIni.teks).join('');
}

function pilihTeks({ kamus, bahasa }: Penyusun, kunci: string): string {
  const butir = kamus(kunci);
  if (!butir) throw new Error(`kunci narasi tidak ada: ${kunci}`);
  return (bahasa === 'ar' ? butir.ar : undefined) ?? butir.id;
}
```

Ekspor dari `index.ts`: `export { keTeksBiasa, susun, teksKamus, type Bahasa, type Kamus, type Penyusun, type BarisPenjelasan, type Potongan } from './segments.js';`

Run: `pnpm --filter @waris/explain test -- susun` → PASS.

- [ ] **Step 3: Kamus tes dari snapshot**

```ts
// packages/explain/src/__tests__/kamus.ts
// Kamus narasi untuk tes = diksi snapshot bawaan web (sumber tunggal, spec keputusan 3). Mencatat kunci yang dibaca
// supaya tes cakupan bisa melaporkan kunci narasi yang tidak pernah dipakai.
import snapshot from '../../../../apps/web/src/snapshot.json';
import type { Bahasa, Kamus, Penyusun } from '../segments.js';

const peta = new Map(snapshot.diksi.map(butir => [butir.kunci, butir]));
export const kunciTerpakai = new Set<string>();
export const kamusSnapshot: Kamus = kunci => {
  kunciTerpakai.add(kunci);
  return peta.get(kunci);
};
export const penyusunTes = (bahasa: Bahasa = 'id'): Penyusun => ({ kamus: kamusSnapshot, bahasa });
```

- [ ] **Step 4: Skrip tambah diksi**

```ts
// scripts/tambah-diksi.ts
// Menambah kunci diksi baru ke apps/web/src/snapshot.json (sumber build web; DB diisi darinya lewat konten:pulihkan).
// Masukan: file JSON [{ kunci, id, ar? }]. Halaman = segmen pertama kunci. Kunci yang sudah ada ditolak.
import { readFileSync, writeFileSync } from 'node:fs';

const jalurSnapshot = new URL('../apps/web/src/snapshot.json', import.meta.url);
const [jalurMasukan] = process.argv.slice(2);
if (!jalurMasukan) throw new Error('pakai: pnpm diksi:tambah <file.json>');

const snapshot = JSON.parse(readFileSync(jalurSnapshot, 'utf8'));
const masukan: Array<{ kunci: string; id: string; ar?: string }> = JSON.parse(readFileSync(jalurMasukan, 'utf8'));
const ada = new Set(snapshot.diksi.map((butir: { kunci: string }) => butir.kunci));
for (const { kunci } of masukan) {
  if (!/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(kunci)) throw new Error(`kunci tidak sah: ${kunci}`);
  if (ada.has(kunci)) throw new Error(`kunci sudah ada: ${kunci}`);
  ada.add(kunci);
}
snapshot.diksi.push(...masukan.map(({ kunci, id, ar }) =>
  ({ kunci, halaman: kunci.split('.')[0], id, ar: ar ?? null, versiTerbit: snapshot.versi })));
writeFileSync(jalurSnapshot, `${JSON.stringify(snapshot, null, 1)}\n`);
console.log(`${masukan.length} kunci ditambahkan`);
```

Cek indentasi `snapshot.json` yang ada (`head -c 200 apps/web/src/snapshot.json`) dan samakan argumen `JSON.stringify` supaya diff hanya berisi baris baru. Tambah ke `scripts/package.json` → `"diksi:tambah": "vite-node tambah-diksi.ts"` dan ke root `package.json`.

Uji cepat: buat `$SCRATCH/coba.json` berisi `[{"kunci":"narasi.tes.coba","id":"coba"}]`, jalankan `pnpm diksi:tambah $SCRATCH/coba.json`, pastikan muncul di snapshot, lalu `git checkout apps/web/src/snapshot.json`.

- [ ] **Step 5: Jalankan & commit**

Run: `pnpm --filter @waris/explain test`
Expected: PASS (emas tidak berubah).

```bash
git add packages/explain/src/segments.ts packages/explain/src/index.ts packages/explain/src/__tests__/susun.test.ts packages/explain/src/__tests__/kamus.ts scripts/tambah-diksi.ts scripts/package.json package.json
git commit -m "explain: susun() templat diksi + skrip diksi:tambah"
```

---

### Task 4: API `jelaskan` baru (gaya, bahasa, kamus) — tanpa memindah teks

**Files:**
- Modify: `packages/explain/src/context.ts`, `narasi.ts`, `munasakhat.ts`
- Modify: `packages/explain/src/__tests__/explain.test.ts`, `munasakhat.test.ts`, `emas.test.ts`
- Modify: `apps/web/src/layar/Penjelasan.tsx:22` dan pemanggil `jelaskanMunasakhat` di web (`grep -rn "jelaskanMunasakhat(" apps/web/src`)
- Create: `apps/web/src/konten/kamusNarasi.ts`

**Interfaces:**
- Consumes: `Penyusun`, `Kamus`, `Bahasa` (Task 3).
- Produces:
  ```ts
  export interface OpsiPenjelasan { gaya?: 'cerita' | 'ringkas'; bahasa?: Bahasa; kamus: Kamus }
  export function jelaskan(hasil, graf, opsi: OpsiPenjelasan): Penjelasan; // bahasa 'ar' → pohon kalimat arab.ts
  export function jelaskanMunasakhat(hasil, graf, opsi: { gaya?: 'cerita' | 'ringkas'; kamus: Kamus }): PenjelasanMunasakhat;
  export function buatKonteks(hasil: HasilOk, graf: GrafKeluarga, penyusun: Penyusun): Konteks; // Konteks.penyusun
  ```
  Web: `export const kamusNarasi: Kamus` dari `apps/web/src/konten/kamusNarasi.ts`.

- [ ] **Step 1: Ubah tes ke API baru (gagal kompilasi/jalan)**

Di `explain.test.ts` ganti helper:

```ts
function jelaskanKasus(input: InputEngine, mode?: 'cerita' | 'ringkas' | 'arab'): Penjelasan {
  const hasil = hitung(input);
  if (hasil.status !== 'OK') throw new Error(hasil.status);
  return jelaskan(hasil, input.graf, opsiMode(mode));
}
const opsiMode = (mode?: 'cerita' | 'ringkas' | 'arab') =>
  mode === 'arab' ? { bahasa: 'ar' as const, kamus: kamusSnapshot } : { gaya: mode, kamus: kamusSnapshot };
```

dan semua panggilan `jelaskan(…, { mode })` langsung di file itu diganti `jelaskan(…, opsiMode(mode))`. Lakukan hal yang sama di `emas.test.ts` (kunci entri emas **tetap** `${nama}/${mode}` supaya file emas tidak berubah) dan `munasakhat.test.ts` (`{ gaya: mode, kamus: kamusSnapshot }`).

Run: `pnpm --filter @waris/explain test` → FAIL (opsi baru belum dikenal / `kamus` belum dipakai → tipe salah; vitest tetap jalan, jadi pastikan `pnpm --filter @waris/explain exec tsc --noEmit` gagal).

- [ ] **Step 2: Implementasi**

`context.ts`: tambah `penyusun: Penyusun` ke `Konteks`, `buatKonteks(hasil, graf, penyusun)` mengembalikan `penyusun`.

`narasi.ts`:

```ts
export interface OpsiPenjelasan { gaya?: 'cerita' | 'ringkas'; bahasa?: Bahasa; kamus: Kamus }

/**
 * Gaya 'cerita' (default) untuk orang awam; 'ringkas' untuk pelajar/ustadz. Bahasa 'ar' = pohon kalimat bergaya kitab
 * (arab.ts; gaya diabaikan). Nama berubah → panggil ulang (murah).
 */
export function jelaskan(hasil: HasilOk, graf: GrafKeluarga, opsi: OpsiPenjelasan): Penjelasan {
  const bahasa = opsi.bahasa ?? 'id';
  const konteks = buatKonteks(hasil, graf, { kamus: opsi.kamus, bahasa });
  const arab = bahasa === 'ar';
  const daftarBab = arab ? babArab(konteks, graf) : opsi.gaya === 'ringkas' ? babRingkas(konteks) : babCerita(konteks);
  // …sisanya sama, `opsi.mode === 'arab'` diganti `arab`
}
```

`munasakhat.ts`: opsi `{ gaya?: 'cerita' | 'ringkas'; kamus: Kamus }`, teruskan ke `jelaskan(…, { gaya: opsi.gaya, kamus: opsi.kamus })`.

Web `apps/web/src/konten/kamusNarasi.ts`:

```ts
// Kamus narasi explain dari diksi terbit (snapshot/cache yang sama dengan t()).
import type { Kamus } from '@waris/explain';
import { cariDiksi } from './sumber';

export const kamusNarasi: Kamus = kunci => cariDiksi(kunci);
```

`Penjelasan.tsx:22`: `jelaskan(tampil.hasil, kasus.graf, { bahasa, kamus: kamusNarasi })` (pertahankan pilihan gaya bila layar punya; cek variabel di sekitarnya). Pemanggil `jelaskanMunasakhat` di web: tambah `kamus: kamusNarasi`, `mode` → `gaya`.

- [ ] **Step 3: Jalankan**

Run: `pnpm --filter @waris/explain exec tsc --noEmit && pnpm --filter @waris/explain test && pnpm --filter @waris/web test`
Expected: PASS; `emas.json` tidak berubah (`git diff --stat packages/explain/src/__tests__/__snapshots__` kosong).

- [ ] **Step 4: Commit**

```bash
git add packages/explain apps/web/src
git commit -m "explain: jelaskan({ gaya, bahasa, kamus }); Konteks membawa penyusun; web memberi kamus dari diksi"
```

---

### Tata cara migrasi (berlaku untuk Task 5–8)

Untuk setiap fungsi di file yang dimigrasi, dari atas ke bawah:

1. Setiap `kalimat\`…\`` yang berisi huruf → satu kunci. Sisipan `${x}` → `{nama}` dengan nama deskriptif Indonesia (`{kotor}`, `{pewaris}`, `{tirkah}`, `{daftar_ahli_waris}`). Contoh dari `cerita.ts` babHarta:

   Sebelum:
   ```ts
   daftarBaris.push(buatBaris(kalimat`Harta yang dibagi kepada ahli waris: ${rupiah(langkahTirkah.bersih)}.`, ['R11-1']));
   ```
   Sesudah:
   ```ts
   daftarBaris.push(buatBaris(susun(konteks.penyusun, 'narasi.cerita.harta.dibagi', { bersih: rupiah(langkahTirkah.bersih) }), ['R11-1']));
   ```
   Masukan diksi: `{ "kunci": "narasi.cerita.harta.dibagi", "id": "Harta yang dibagi kepada ahli waris: {bersih}." }`.

2. Istilah bertooltip: label teksnya ikut templat istilah → sisipan berisi `istilah(id, teksKamus(penyusun, kunciLabel))`. Label memakai `narasi.umum.istilah.<slug_underscore>` bila teksnya persis sama di semua pemakaian dalam gaya itu; selain itu kunci lokal `narasi.<gaya>.<bab>.istilah_<slug>`. Kapitalisasi awal kalimat tetap dikerjakan `buatBaris`, jadi label disimpan huruf kecil kecuali memang selalu kapital.
3. Penggalan yang dipilih kode (`langkah.mani === 'qatl' ? 'qatl' : 'ikhtilaf ad-din'`, `OPSI_KAKEK`, peta label) → satu kunci per nilai, dibaca dengan `teksKamus`. Peta konstanta diganti fungsi `(penyusun, nilai) => teksKamus(penyusun, \`narasi.….${nilai_snake}\`)`.
4. Kalimat yang disambung bersyarat (`.concat(cond ? kalimat… : kalimat\`.\`)`) → tiap cabang satu kunci; cabang yang hanya tanda baca tetap literal `[{ jenis: 'teks', teks: '.' }]`.
5. Varian bilangan/gender dipilih kode dengan akhiran `.mufrad/.mutsanna/.jamak` atau `.mudzakkar/.muannats` (spec keputusan 1) — hanya bila kode sekarang memang bercabang begitu.
6. Kumpulkan semua masukan diksi task itu di `$SCRATCH/narasi-<file>.json` (satu array), jalankan `pnpm diksi:tambah $SCRATCH/narasi-<file>.json`.
7. Setelah file selesai: `grep -n 'kalimat\`' <file>` hanya boleh menyisakan literal tanpa huruf; hapus impor `kalimat` bila tidak terpakai.
8. Jalankan `pnpm --filter @waris/explain test`. Emas harus PASS tanpa `-u`. **Jangan pernah** menjalankan vitest dengan `-u`/`--update` di task 5–9; beda emas = bug migrasi.

---

### Task 5: Migrasi `cerita.ts`, `people.ts`, `narasi.ts`

**Files:**
- Modify: `packages/explain/src/cerita.ts`, `people.ts`, `narasi.ts`, `context.ts` (bila `sebutSemua`/`gabungDan` memakai "dan")
- Modify: `packages/explain/src/segments.ts` (`gabungDan` menerima penghubung dari kamus)
- Modify: `apps/web/src/snapshot.json` (lewat `pnpm diksi:tambah`)

**Interfaces:**
- Consumes: `susun`, `teksKamus`, `Konteks.penyusun`.
- Produces: `gabungDan(penyusun: Penyusun, daftar: Potongan[][]): Potongan[]` membaca `narasi.umum.penghubung.dan` (" dan ") dan `narasi.umum.penghubung.dan_terakhir` (", dan "); `buatSebutan(hasil, graf, penyusun)`; kunci `narasi.umum.ahli_waris.<kunci_huruf_kecil>`, `narasi.umum.urutan_ke.<n>`, `narasi.umum.kolektif.<n>`, `narasi.umum.pewaris.l|p`, `narasi.umum.langkah` ("Langkah {nomor}"), `narasi.umum.pembukaan_madzhab.<ruleset>`.

- [ ] **Step 1:** Ubah `people.ts`: `LABEL_PERAN`, `LELUHUR_PEWARIS`, `URUTAN_KE`, `KOLEKTIF`, "almarhum/almarhumah", "kerabat", "leluhur ke-{n}", "ke-{n}" → diksi `narasi.umum.*` sesuai Tata cara 3; `buatSebutan` menerima `penyusun`. Perhatikan `labelPeran` diekspor — cek pemakai (`grep -rn "labelPeran" packages apps --include='*.ts*'`) dan teruskan `penyusun`.
- [ ] **Step 2:** Ubah `gabungDan` sesuai Interfaces; perbarui semua pemanggil (`grep -rn "gabungDan(" packages/explain/src`). `gabungAtau` di `cerita.ts` → `narasi.umum.penghubung.atau` (", atau ") dan `narasi.umum.penghubung.koma` (", ").
- [ ] **Step 3:** Migrasi `cerita.ts` fungsi demi fungsi mengikuti Tata cara (babHarta → babAhliWaris → babBagian → babPenyebut → babPenyesuaian → babPembulatan → babHasil → pembukaanMadzhab), termasuk semua `judul`.
- [ ] **Step 4:** `narasi.ts`: `Langkah ${i + 1}` → `teksKamus(penyusun, 'narasi.umum.langkah', { nomor: String(i + 1) })` untuk bahasa id. (Nomor Arab ditangani Task 7.)
- [ ] **Step 5:** `pnpm diksi:tambah $SCRATCH/narasi-cerita.json`, lalu `pnpm --filter @waris/explain test && pnpm --filter @waris/web test`. Expected: PASS, emas identik.
- [ ] **Step 6: Commit**

```bash
git add packages/explain/src apps/web/src/snapshot.json
git commit -m "explain: narasi cerita, sebutan orang, dan penghubung dibaca dari diksi narasi.*"
```

---

### Task 6: Migrasi `ringkas.ts` dan `nisab.ts`

**Files:**
- Modify: `packages/explain/src/ringkas.ts`, `nisab.ts`, `apps/web/src/snapshot.json`
- Modify: pemakai `narasiNisab` (`grep -rn "narasiNisab(" packages apps --include='*.ts*'`)

**Interfaces:**
- Produces: `narasiNisab(penyusun: Penyusun, langkah: LangkahNisab, opsi?: { berbobot?: boolean }): Potongan[]`; kunci `narasi.ringkas.*`, `narasi.nisab.*`.

- [ ] **Step 1:** Migrasi `ringkas.ts` (babHarta … babHasil, `OPSI_KAKEK`, `pilihanJadd`, `alasanFardh`) mengikuti Tata cara.
- [ ] **Step 2:** Migrasi `nisab.ts` (`narasiArba`, `narasiInkisar`, `narasiRaddVsSisa`; kata benda hubungan tamatsul/tadakhul/tawafuq/tabayun sebagai kunci per nilai), tambah parameter `penyusun`, perbarui pemanggil termasuk web (web memberi `{ kamus: kamusNarasi, bahasa: 'id' }`).
- [ ] **Step 3:** `pnpm diksi:tambah $SCRATCH/narasi-ringkas.json`, lalu `pnpm --filter @waris/explain test && pnpm --filter @waris/web test`. Expected: PASS, emas identik.
- [ ] **Step 4: Commit**

```bash
git add packages/explain/src apps/web/src
git commit -m "explain: narasi ringkas dan nisab dibaca dari diksi narasi.*"
```

---

### Task 7: Migrasi `arab.ts` (+ `LABEL_ARAB`, `NAMA_FARDH`)

**Files:**
- Modify: `packages/explain/src/arab.ts`, `narasi.ts`, `index.ts`, `apps/web/src/snapshot.json`
- Modify: `apps/web/src/layar/LangkahAhliWaris.tsx:11,99`

**Interfaces:**
- Produces: `labelArab(penyusun: Penyusun, kunci: KunciAhliWaris): string` (menggantikan ekspor `LABEL_ARAB`); kunci `narasi.arab.*`. Tiap kunci arab: `ar` = redaksi Arab persis seperti di kode, `id` = terjemahan Indonesia (draf). Label/nama fardh: `narasi.arab.ahli_waris.<kunci_huruf_kecil>`, `narasi.arab.fardh.<n>_<d>`, `narasi.arab.penghubung.wa` (" و"), `narasi.arab.qarib` ("قريب"), `narasi.arab.langkah` ("الخطوة {nomor}"), `narasi.arab.uang` ("{jumlah} روبية").

- [ ] **Step 1:** Migrasi `arab.ts` fungsi demi fungsi. `baris()` tetap menerapkan `angkaArab` ke semua potongan (setelah `susun`). Dhamir `هم/هن` = sisipan yang dipilih kode lewat kunci `narasi.arab.dhamir.mudzakkar|muannats`. `babArab` memakai `konteks.penyusun` (bahasa sudah 'ar').
- [ ] **Step 2:** `narasi.ts`: `الخطوة ${angkaArab(…)}` dan `pembukaanMadzhabArab` → kunci arab.
- [ ] **Step 3:** Web `LangkahAhliWaris.tsx`: `LABEL_ARAB[kunci]` → `labelArab({ kamus: kamusNarasi, bahasa: 'ar' }, kunci)`. Hapus ekspor `LABEL_ARAB` dari `index.ts`.
- [ ] **Step 4:** Tes tambahan di `explain.test.ts`:

```ts
test('kunci narasi.arab punya ar dan id', () => {
  const arab = snapshot.diksi.filter(butir => butir.kunci.startsWith('narasi.arab.'));
  expect(arab.length).toBeGreaterThan(50);
  expect(arab.filter(butir => !butir.ar || !butir.id || /[؀-ۿ]/.test(butir.id)).map(butir => butir.kunci)).toEqual([]);
});
```
(impor `snapshot` dari `'../../../../apps/web/src/snapshot.json'`.)

- [ ] **Step 5:** `pnpm diksi:tambah $SCRATCH/narasi-arab.json`, lalu `pnpm --filter @waris/explain test && pnpm --filter @waris/web test`. Expected: PASS, emas identik.
- [ ] **Step 6: Commit**

```bash
git add packages/explain/src apps/web/src
git commit -m "explain: narasi Arab (kitab) dibaca dari diksi narasi.arab.* dengan terjemahan Indonesia; labelArab menggantikan LABEL_ARAB"
```

---

### Task 8: Migrasi `munasakhat.ts` + ketahanan cache lama

**Files:**
- Modify: `packages/explain/src/munasakhat.ts`, `apps/web/src/snapshot.json`
- Test: `packages/data/src/__tests__/` (tes `pilihAwal` yang ada; `grep -ln "pilihAwal" packages/data/src/__tests__`)

**Interfaces:**
- Produces: kunci `narasi.munasakhat.*`.

- [ ] **Step 1:** Migrasi `munasakhat.ts` (`pembukaan`, `teksKeadaan`, `penggabungan`, `teksHubungan`, `hasilAkhir`, `buatSebut`) mengikuti Tata cara.
- [ ] **Step 2:** Tes cache lama: tambahkan ke tes `pilihAwal`:

```ts
test('cache lebih baru tanpa kunci narasi tetap mendapat kunci narasi dari bawaan', () => {
  const bawaan = { versi: 1, konten: [], diksi: [{ kunci: 'narasi.cerita.harta.dibagi', halaman: 'narasi', id: 'x', ar: null, versiTerbit: 1 }] };
  const cache = { versi: 2, konten: [], diksi: [] };
  expect(pilihAwal(bawaan, cache).diksi.map(butir => butir.kunci)).toContain('narasi.cerita.harta.dibagi');
});
```
Bila sudah lolos tanpa perubahan kode (perilaku yang ada, lihat komentar `packages/data/src/snapshot.ts:12-14`), biarkan sebagai pengaman.

- [ ] **Step 3:** `pnpm diksi:tambah $SCRATCH/narasi-munasakhat.json`, lalu `pnpm test`. Expected: seluruh workspace PASS, emas identik.
- [ ] **Step 4: Commit**

```bash
git add packages/explain/src packages/data/src apps/web/src/snapshot.json
git commit -m "explain: narasi munasakhat dibaca dari diksi narasi.munasakhat.*"
```

---

### Task 9: Tes cakupan dan pembersihan

**Files:**
- Create: `packages/explain/src/__tests__/cakupan.test.ts`, `packages/explain/src/__tests__/kasus.ts`
- Modify: `packages/explain/src/__tests__/emas.test.ts`
- Modify: `apps/web/src/__tests__/diksi.test.ts` (tes "kunci snapshot yang tidak dipakai kode" mengecualikan `narasi.`)
- Modify: `packages/explain/src/segments.ts` (hapus `kalimat` dari ekspor publik bila tidak dipakai di luar `segments.ts`)

- [ ] **Step 1: Tes cakupan**

```ts
// Semua teks narasi lewat diksi: tidak ada kalimat berhuruf tersisa di kode, dan kunci narasi.* di snapshot terpakai.
import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from 'vitest';
import snapshot from '../../../../apps/web/src/snapshot.json';
import { kunciTerpakai } from './kamus.js';

const DIR = new URL('..', import.meta.url);
const SUMBER = readdirSync(DIR).filter(nama => nama.endsWith('.ts')).map(nama => [nama, readFileSync(new URL(nama, DIR), 'utf8')] as const);

test('tidak ada kalimat`…` berhuruf di kode explain', () => {
  const sisa = SUMBER.flatMap(([nama, isi]) => [...isi.matchAll(/kalimat`([^`]*)`/g)]
    .filter(cocok => /\p{L}/u.test(cocok[1]!.replace(/\$\{[^}]*\}/g, ''))).map(cocok => `${nama}: ${cocok[1]}`));
  expect(sisa).toEqual([]);
});

test('setiap kunci narasi.* di snapshot dipakai oleh kasus emas', () => {
  semuaPenjelasan();
  const narasi = snapshot.diksi.map(butir => butir.kunci).filter(kunci => kunci.startsWith('narasi.'));
  const tidakDipakai = narasi.filter(kunci => !kunciTerpakai.has(kunci));
  if (tidakDipakai.length) console.warn(`kunci narasi tidak terjangkau kasus uji (${tidakDipakai.length}):`, tidakDipakai);
});
```

Tambahkan `import { semuaPenjelasan } from './kasus.js';`. Buat `__tests__/kasus.ts` dengan memindahkan pengumpul kasus dari
`emas.test.ts` ke `export function semuaPenjelasan(): Record<string, unknown>` (isi = badan tes emas sebelum `expect`),
lalu `emas.test.ts` cukup `await expect(JSON.stringify(semuaPenjelasan(), null, 1)).toMatchFileSnapshot(…)`. Emas harus
tetap identik. Tes kedua sengaja `console.warn` (bukan gagal), sama dengan kebijakan web untuk diksi tak terpakai: kunci
yang hanya dijangkau cabang langka tidak boleh memblokir.

- [ ] **Step 2:** `diksi.test.ts`: `.filter(kunci => !KUNCI_T.has(kunci) && !kunci.startsWith('narasi.'))`.
- [ ] **Step 3:** Jalankan `pnpm test`. Expected: seluruh workspace PASS, warn daftar kunci tak terjangkau (catat jumlahnya di pesan commit).
- [ ] **Step 4:** Perbarui memori proyek `urutan-kerja-engine.md` (langkah 2 selesai) dan CLAUDE.md bagian `packages/explain` bila perlu: "narasi = templat diksi `narasi.*`; teks baru lewat `pnpm diksi:tambah`".
- [ ] **Step 5: Commit**

```bash
git add packages/explain apps/web/src/__tests__/diksi.test.ts CLAUDE.md
git commit -m "explain: tes cakupan narasi diksi; tidak ada kalimat hardcode tersisa"
```

Setelah Task 9: jalankan `pnpm konten:pulihkan` ke Supabase lokal (`pnpm db:mulai` dulu) dan pastikan kunci `narasi.*` muncul di portal admin halaman "Teks aplikasi". Laporkan ke pengguna; push ke DB produksi hanya atas izin pengguna.
