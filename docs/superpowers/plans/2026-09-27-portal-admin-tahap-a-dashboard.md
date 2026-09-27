# Portal Admin Tahap A — Kerangka Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portal admin tampil sebagai dashboard rapi (sidebar berkelompok, beranda, daftar konten dengan tab/cari/grup modul) dan urutan entri bisa diatur dengan seret tanpa membuat revisi.

**Architecture:** Satu konstanta `MENU_PORTAL` memetakan menu → jenis konten dan dipakai sidebar, rute, dan daftar. Perhitungan (ringkasan beranda, saring tab/cari, grup modul, pindah urutan) berupa fungsi murni di `apps/admin/src/ringkas.ts`; komponen hanya menampilkan. Urutan disimpan lewat fungsi Postgres baru `atur_urutan` (security definer, hanya kolom `urutan`) yang dibungkus `RepositoriEditorial.aturUrutan`.

**Tech Stack:** React 18, Vite, Vitest + Testing Library (jsdom), `@waris/data` (memori & Supabase), Supabase Postgres + pgTAP, CSS token Arif Waris v4.

**Spec:** `docs/superpowers/specs/2026-09-27-portal-admin-dashboard-design.md`

## Global Constraints

- Tanpa emoji di UI; pakai komponen `Ikon` (`apps/web/src/ui/Ikon.tsx`), selalu disertai label teks.
- Gaya: `@waris/web/gaya/token.css` + `komponen.css` + satu `apps/admin/src/admin.css`; warna hanya lewat token (`var(--…)`).
- Tanpa dependency baru (seret = HTML drag-and-drop bawaan + tombol naik/turun).
- Seret boleh: admin & penulis. Reviewer: tanpa pegangan seret dan tanpa tombol buat.
- Seret tidak membuat revisi dan tidak mengubah status; policy `ubah` `entri_konten` tetap admin saja.
- Nama variabel/fungsi/komentar bahasa Indonesia; tiap file dibuka komentar pendek (menerima apa, memutuskan apa, menyerahkan apa).
- Editor entri, diksi, review, peran: layar lama, hanya dibungkus kerangka baru.
- Commit setelah tiap task, hanya file milik task itu; pesan commit diakhiri `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Seret materi mengacak urutan global.** Web memilih "pelajaran berikutnya" dari urutan global materi (`apps/web/src/layar/belajar/Belajar.tsx:38`), jadi seret di satu modul harus mengirim urutan *semua* materi (grup modul berurutan), bukan hanya modul itu → Task 8 menguji ini.
2. **Tab/cari aktif saat seret.** Urutan dari daftar tersaring tidak bermakna; pegangan & tombol naik/turun harus hilang bila tab ≠ Semua atau ada kata cari → Task 8.
3. **Simpan urutan gagal (jaringan/RLS).** Urutan di layar kembali ke semula dan pesan galat tampil → Task 8.
4. **Entri tanpa revisi / isi rusak.** `revisiTerakhir` bisa `null` dan `isi.modul` bisa bukan angka; daftar tetap tampil (judul = slug, materi masuk "Tanpa modul") → Task 4.
5. **Layar sempit.** Sidebar jadi laci yang bisa dibuka/ditutup, dan menutup setelah memilih menu → Task 5.

---

## Struktur berkas

| Berkas | Tanggung jawab |
|---|---|
| `supabase/migrations/20260927000004_atur_urutan.sql` (baru) | fungsi `atur_urutan` |
| `supabase/tests/database/05_urutan.test.sql` (baru) | pgTAP `atur_urutan` |
| `packages/data/src/antarmuka.ts` | `RepositoriEditorial.aturUrutan` |
| `packages/data/src/memori/konten.ts`, `packages/data/src/supabase/index.ts` | implementasi |
| `apps/admin/src/navigasi.ts` (baru) | `MENU_PORTAL`, label jenis, cari menu |
| `apps/admin/src/rute.ts` | rute `beranda` & `menu` (ganti `konten`/`diksi`) |
| `apps/admin/src/ringkas.ts` (baru) | fungsi murni beranda/daftar/urutan |
| `apps/web/src/ui/Ikon.tsx` | jalur ikon baru |
| `apps/admin/src/admin.css` (baru) | gaya portal |
| `apps/admin/src/Kerangka.tsx` (baru) | sidebar, laci, akun |
| `apps/admin/src/Portal.tsx` | pakai Kerangka, rute baru |
| `apps/admin/src/layar/Beranda.tsx` (baru) | beranda |
| `apps/admin/src/layar/DaftarKonten.tsx` | ditulis ulang: menu bertab, daftar, grup modul, seret |

---

### Task 1: Fungsi database `atur_urutan`

**Files:**
- Create: `supabase/migrations/20260927000004_atur_urutan.sql`
- Test: `supabase/tests/database/05_urutan.test.sql`

**Interfaces:**
- Produces: RPC `atur_urutan(p_entri uuid[]) returns void`. Melempar (`P0001`) bila peran bukan admin/penulis, id campur jenis, id ganda/tak dikenal, atau array kosong. Mengisi `urutan = posisi * 10` (posisi mulai 1); entri terbit dalam daftar mendapat satu `versi_terbit` baru bersama.

- [ ] **Step 1: Tulis tes pgTAP**

```sql
-- supabase/tests/database/05_urutan.test.sql
-- atur_urutan: admin & penulis boleh, reviewer ditolak, satu jenis saja, status revisi tak berubah, entri terbit naik versi.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'penulis@tes.local'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer@tes.local'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@tes.local');
insert into peran_pengguna values
  ('00000000-0000-0000-0000-00000000000a', 'penulis'),
  ('00000000-0000-0000-0000-00000000000b', 'reviewer'),
  ('00000000-0000-0000-0000-00000000000c', 'admin');
insert into daftar_refs values ('R09-7', 9) on conflict do nothing;
insert into entri_konten (id, jenis, slug, urutan) values
  ('10000000-0000-0000-0000-000000000001', 'faq', 'satu', 10),
  ('10000000-0000-0000-0000-000000000002', 'faq', 'dua', 20),
  ('10000000-0000-0000-0000-000000000003', 'kitab', 'kitab', 10);
insert into revisi (id, entri_id, isi, refs, dibuat_oleh, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '{"v":1}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'disetujui'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '{"v":2}', '{R09-7}', '00000000-0000-0000-0000-00000000000a', 'draf');
update entri_konten set revisi_terbit_id = '20000000-0000-0000-0000-000000000001', versi_terbit = 1
  where id = '10000000-0000-0000-0000-000000000001';

set local role authenticated;

set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select throws_ok($$select atur_urutan(array['10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001']::uuid[])$$,
  'P0001', null, 'reviewer tidak boleh mengatur urutan');

set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok($$select atur_urutan(array['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003']::uuid[])$$,
  'P0001', null, 'campur jenis ditolak');
select throws_ok($$select atur_urutan(array['10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001']::uuid[])$$,
  'P0001', null, 'id ganda ditolak');
select throws_ok($$select atur_urutan(array[]::uuid[])$$, 'P0001', null, 'daftar kosong ditolak');
select lives_ok($$select atur_urutan(array['10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001']::uuid[])$$,
  'penulis mengatur urutan');

reset role;
select results_eq($$select slug, urutan from entri_konten where jenis = 'faq' order by urutan$$,
  $$values ('dua'::text, 10), ('satu'::text, 20)$$, 'urutan = posisi * 10');
select results_eq($$select status::text from revisi order by id$$, $$values ('disetujui'), ('draf')$$, 'status revisi tidak berubah');
select ok((select versi_terbit > 1 from entri_konten where id = '10000000-0000-0000-0000-000000000001'), 'entri terbit naik versi_terbit');

select * from finish();
rollback;
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm db:reset && pnpm db:tes` (butuh `pnpm db:mulai` bila Supabase lokal belum jalan)
Expected: `05_urutan.test.sql` FAIL, `function atur_urutan(uuid[]) does not exist`.

- [ ] **Step 3: Tulis migrasi**

```sql
-- supabase/migrations/20260927000004_atur_urutan.sql
-- Urutan entri diatur dengan seret di portal tanpa membuat revisi (spec portal admin tahap A "Urutan seret").
-- admin & penulis boleh; policy `ubah` entri_konten tetap admin saja, jadi penulis lewat fungsi security definer ini
-- yang hanya menyentuh kolom urutan. Entri yang sedang terbit mendapat versi_terbit baru supaya web mengambil urutannya.
create function atur_urutan(p_entri uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_jumlah_jenis int;
  v_jumlah_ada int;
  v_versi bigint;
begin
  if peran_saya() is null or peran_saya() not in ('admin', 'penulis') then
    raise exception 'perlu peran admin/penulis';
  end if;
  if coalesce(array_length(p_entri, 1), 0) = 0 then raise exception 'daftar entri kosong'; end if;
  if (select count(distinct x) from unnest(p_entri) x) <> array_length(p_entri, 1) then raise exception 'ada entri ganda'; end if;
  select count(distinct jenis), count(*) into v_jumlah_jenis, v_jumlah_ada from entri_konten where id = any(p_entri);
  if v_jumlah_ada <> array_length(p_entri, 1) then raise exception 'ada entri yang tidak dikenal'; end if;
  if v_jumlah_jenis <> 1 then raise exception 'urutan hanya untuk entri satu jenis'; end if;

  if exists (select 1 from entri_konten where id = any(p_entri) and revisi_terbit_id is not null) then
    v_versi := naikkan_versi_konten();
  end if;
  update entri_konten e
    set urutan = u.posisi * 10,
        versi_terbit = case when e.revisi_terbit_id is null then e.versi_terbit else v_versi end
    from unnest(p_entri) with ordinality as u(id, posisi)
    where e.id = u.id;
end $$;
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm db:reset && pnpm db:tes`
Expected: semua berkas pgTAP PASS (termasuk 01–04 yang sudah ada).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260927000004_atur_urutan.sql supabase/tests/database/05_urutan.test.sql
git commit -m "db: atur_urutan untuk seret urutan tanpa revisi"
```

---

### Task 2: `RepositoriEditorial.aturUrutan`

**Files:**
- Modify: `packages/data/src/antarmuka.ts` (interface `RepositoriEditorial`)
- Modify: `packages/data/src/memori/konten.ts` (objek `editorial`, setelah `buatEntri`)
- Modify: `packages/data/src/supabase/index.ts` (objek `editorial`, setelah `buatEntri`)
- Test: `packages/data/src/__tests__/memori-portal.test.ts`

**Interfaces:**
- Consumes: RPC `atur_urutan(p_entri uuid[])` (Task 1).
- Produces: `aturUrutan(entriIds: string[]): Promise<void>` — aturan sama dengan Task 1; di memori `urutan = (indeks + 1) * 10`, entri terbit mendapat satu `versiTerbit = ++versi` bersama.

- [ ] **Step 1: Tulis tes gagal** (tambahkan di akhir `memori-portal.test.ts`)

```ts
test('aturUrutan: urutan = posisi * 10, status tetap, entri terbit naik versi', async () => {
  const m = siapkan();
  const a = await m.editorial.buatEntri('soal_hitung', 'a', 10);
  const b = await m.editorial.buatEntri('soal_hitung', 'b', 20);
  const r = await m.editorial.buatDraf(a, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  await m.editorial.ajukan(r);
  await m.editorial.setujui(r);
  const versiSebelum = await m.konten.versiSekarang();
  await m.editorial.aturUrutan([b, a]);
  const daftar = await m.konten.daftarEntri('soal_hitung');
  expect(daftar.map(e => [e.slug, e.urutan])).toEqual([['b', 10], ['a', 20]]);
  expect(daftar[1]!.revisiTerakhir?.status).toBe('disetujui');
  expect(await m.konten.versiSekarang()).toBe(versiSebelum + 1);
  const [terbit] = await m.konten.bacaTerbit({ jenis: 'soal_hitung' });
  expect(terbit!.versiTerbit).toBe(versiSebelum + 1);
});

test('aturUrutan: reviewer, campur jenis, ganda, kosong ditolak', async () => {
  const m = siapkan();
  const a = await m.editorial.buatEntri('soal_hitung', 'a', 10);
  const k = await m.editorial.buatEntri('kitab', 'k', 10);
  await expect(m.editorial.aturUrutan([a, k])).rejects.toThrow('satu jenis');
  await expect(m.editorial.aturUrutan([a, a])).rejects.toThrow('ganda');
  await expect(m.editorial.aturUrutan([])).rejects.toThrow('kosong');
  m.aturPeranLangsung('u-admin', 'reviewer');
  await expect(m.editorial.aturUrutan([a])).rejects.toThrow('perlu peran');
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/data test -- memori-portal`
Expected: FAIL, `m.editorial.aturUrutan is not a function` (dan galat tipe).

- [ ] **Step 3: Implementasi**

`antarmuka.ts`, di `RepositoriEditorial` setelah `buatEntri`:

```ts
  /** Seret di portal: urutan = posisi * 10, tanpa revisi; semua id satu jenis. admin/penulis. */
  aturUrutan(entriIds: string[]): Promise<void>;
```

`memori/konten.ts`, di objek `editorial` setelah `buatEntri`:

```ts
    // [supabase/migrations/20260927000004_atur_urutan.sql] aturan disamakan dengan fungsi database.
    async aturUrutan(entriIds) {
      wajibPeran('admin', 'penulis');
      if (entriIds.length === 0) throw new Error('daftar entri kosong');
      if (new Set(entriIds).size !== entriIds.length) throw new Error('ada entri ganda');
      const daftar = entriIds.map(id => ambil(entri, id, 'entri'));
      if (new Set(daftar.map(baris => baris.jenis)).size !== 1) throw new Error('urutan hanya untuk entri satu jenis');
      const versiBaru = daftar.some(baris => baris.revisiTerbitId) ? ++versi : null;
      daftar.forEach((baris, indeks) => {
        baris.urutan = (indeks + 1) * 10;
        if (baris.revisiTerbitId) baris.versiTerbit = versiBaru;
      });
    },
```

`supabase/index.ts`, di objek `editorial` setelah `buatEntri`:

```ts
    aturUrutan: entriIds => rpc('atur_urutan', { p_entri: entriIds }),
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/data test && pnpm --filter @waris/data exec tsc --noEmit`
Expected: PASS, tanpa galat tipe.

- [ ] **Step 5: Commit**

```bash
git add packages/data/src/antarmuka.ts packages/data/src/memori/konten.ts packages/data/src/supabase/index.ts packages/data/src/__tests__/memori-portal.test.ts
git commit -m "data: aturUrutan di repositori editorial"
```

---

### Task 3: `MENU_PORTAL` dan rute baru

**Files:**
- Create: `apps/admin/src/navigasi.ts`
- Modify: `apps/admin/src/rute.ts` (seluruh berkas)
- Modify: `apps/admin/src/Portal.tsx:62-92` (sementara: link lama `konten`/`diksi` diganti rute `menu` supaya tetap terkompilasi; Task 5 mengganti navigasi ini sepenuhnya)
- Test: `apps/admin/src/__tests__/navigasi.test.ts` (baru), `apps/admin/src/__tests__/rute.test.ts`

**Interfaces:**
- Produces (`navigasi.ts`):
  ```ts
  export type IsiMenu = JenisKonten | 'diksi';
  export type KunciMenu = 'materi' | 'soal_kuis' | 'soal_hitung' | 'tanya_jawab' | 'faq' | 'pustaka' | 'kamus' | 'aplikasi';
  export type GrupMenu = 'Belajar' | 'Bank soal' | 'Tanya jawab' | 'Pustaka' | 'Aplikasi';
  export interface Menu { kunci: KunciMenu; label: string; grup: GrupMenu; ikon: NamaIkon; isi: readonly IsiMenu[] }
  export const MENU_PORTAL: readonly Menu[];
  export const LABEL_ISI: Record<IsiMenu, string>;
  export function menuDari(kunci: string): Menu | undefined;
  export function menuUntukJenis(jenis: IsiMenu): Menu;
  ```
  `isi[0]` = tab bawaan. Menu `materi` punya `isi: ['materi', 'modul']` dan ditampilkan sebagai grup modul (bukan tab).
- Produces (`rute.ts`):
  ```ts
  export type Rute =
    | { layar: 'beranda' }
    | { layar: 'menu'; menu: KunciMenu; tab: IsiMenu }
    | { layar: 'entri'; entriId: string }
    | { layar: 'entriBaru'; jenis: JenisKonten }
    | { layar: 'review' }
    | { layar: 'peran' };
  ```
  Hash: `#/` beranda, `#/menu/<kunci>/<tab>`, `#/entri/<id>`, `#/baru/<jenis>`, `#/review`, `#/peran`. Tak dikenal → beranda. `#/menu/<kunci>` tanpa tab / tab bukan milik menu → tab bawaan.

  Ikon `NamaIkon` yang dipakai `MENU_PORTAL` (`pelajaran`, `kuis`, `hitung`, `tanya`, `pustaka`, `glosarium`, `aplikasi`) — `pustaka` dan `aplikasi` baru ada di Task 5; di task ini tambahkan dulu dua jalur itu ke `Ikon.tsx` (lihat Step 3) supaya tipe lolos.

- [ ] **Step 1: Tulis tes gagal**

`apps/admin/src/__tests__/navigasi.test.ts`:

```ts
import { expect, test } from 'vitest';
import { JENIS_KONTEN } from '@waris/content';
import { LABEL_ISI, MENU_PORTAL, menuDari, menuUntukJenis } from '../navigasi';

test('tiap jenis konten + diksi muncul tepat sekali di MENU_PORTAL', () => {
  const semua = MENU_PORTAL.flatMap(menu => menu.isi);
  expect([...semua].sort()).toEqual([...JENIS_KONTEN, 'diksi'].sort());
});
test('semua isi punya label manusiawi', () => {
  for (const isi of [...JENIS_KONTEN, 'diksi'] as const) expect(LABEL_ISI[isi]).toMatch(/^[A-Z]/);
});
test('menuUntukJenis & menuDari', () => {
  expect(menuUntukJenis('modul').kunci).toBe('materi');
  expect(menuUntukJenis('diksi').kunci).toBe('aplikasi');
  expect(menuDari('pustaka')?.isi).toEqual(['kitab', 'syahid']);
  expect(menuDari('bukan')).toBeUndefined();
});
```

`apps/admin/src/__tests__/rute.test.ts` (ganti seluruh isi):

```ts
import { expect, test } from 'vitest';
import { bacaRute, tulisRute, type Rute } from '../rute';

const CONTOH: Rute[] = [
  { layar: 'beranda' }, { layar: 'menu', menu: 'pustaka', tab: 'syahid' }, { layar: 'entri', entriId: 'abc' },
  { layar: 'entriBaru', jenis: 'faq' }, { layar: 'review' }, { layar: 'peran' },
];
test.each(CONTOH)('bolak-balik %o', rute => expect(bacaRute(tulisRute(rute))).toEqual(rute));
test('hash kosong / tak dikenal / jenis tak sah → beranda', () => {
  expect(bacaRute('')).toEqual({ layar: 'beranda' });
  expect(bacaRute('#/konten/faq')).toEqual({ layar: 'beranda' });
  expect(bacaRute('#/baru/bukan_jenis')).toEqual({ layar: 'beranda' });
  expect(bacaRute('#/menu/bukan')).toEqual({ layar: 'beranda' });
});
test('menu tanpa tab / tab bukan miliknya → tab bawaan', () => {
  expect(bacaRute('#/menu/aplikasi')).toEqual({ layar: 'menu', menu: 'aplikasi', tab: 'teks_edukasi' });
  expect(bacaRute('#/menu/pustaka/faq')).toEqual({ layar: 'menu', menu: 'pustaka', tab: 'kitab' });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/admin test -- navigasi rute`
Expected: FAIL, `Cannot find module '../navigasi'`.

- [ ] **Step 3: Implementasi**

Tambahkan ke `JALUR` di `apps/web/src/ui/Ikon.tsx` (sebelum `} as const;`):

```tsx
  pustaka: <><path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="M15.5 5.2l3.9-1 3.1 14.6-3.9 1z" /></>,
  aplikasi: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>,
```

`apps/admin/src/navigasi.ts`:

```ts
// Peta menu portal: satu sumber untuk sidebar (Kerangka), rute (#/menu/<kunci>/<tab>), dan daftar konten.
// Menerima JENIS_KONTEN + diksi, mengelompokkannya menjadi menu berlabel manusiawi (spec tahap A "Kerangka & navigasi").
// isi[0] = tab bawaan; menu materi menampilkan modul sebagai kepala grup, bukan tab.
import type { JenisKonten } from '@waris/content';
import type { NamaIkon } from '@waris/web/ui/Ikon';

export type IsiMenu = JenisKonten | 'diksi';
export type KunciMenu = 'materi' | 'soal_kuis' | 'soal_hitung' | 'tanya_jawab' | 'faq' | 'pustaka' | 'kamus' | 'aplikasi';
export type GrupMenu = 'Belajar' | 'Bank soal' | 'Tanya jawab' | 'Pustaka' | 'Aplikasi';
export interface Menu { kunci: KunciMenu; label: string; grup: GrupMenu; ikon: NamaIkon; isi: readonly IsiMenu[] }

export const MENU_PORTAL: readonly Menu[] = [
  { kunci: 'materi', label: 'Modul & Materi', grup: 'Belajar', ikon: 'pelajaran', isi: ['materi', 'modul'] },
  { kunci: 'soal_kuis', label: 'Soal kuis', grup: 'Bank soal', ikon: 'kuis', isi: ['soal_kuis'] },
  { kunci: 'soal_hitung', label: 'Soal hitung', grup: 'Bank soal', ikon: 'hitung', isi: ['soal_hitung'] },
  { kunci: 'tanya_jawab', label: 'Kasus tanya jawab', grup: 'Tanya jawab', ikon: 'tanya', isi: ['tanya_jawab'] },
  { kunci: 'faq', label: 'FAQ', grup: 'Tanya jawab', ikon: 'daftar', isi: ['faq'] },
  { kunci: 'pustaka', label: 'Kitab & syahid', grup: 'Pustaka', ikon: 'pustaka', isi: ['kitab', 'syahid'] },
  { kunci: 'kamus', label: 'Glosarium & ahwal', grup: 'Pustaka', ikon: 'glosarium', isi: ['glosarium_ar', 'ahwal'] },
  { kunci: 'aplikasi', label: 'Teks aplikasi', grup: 'Aplikasi', ikon: 'aplikasi', isi: ['teks_edukasi', 'diksi', 'cheatsheet'] },
];

export const LABEL_ISI: Record<IsiMenu, string> = {
  modul: 'Modul', materi: 'Materi', soal_kuis: 'Soal kuis', soal_hitung: 'Soal hitung', tanya_jawab: 'Kasus tanya jawab',
  faq: 'FAQ', kitab: 'Kitab', syahid: 'Syahid', glosarium_ar: 'Glosarium', ahwal: 'Ahwal', teks_edukasi: 'Teks edukasi',
  cheatsheet: 'Cheatsheet', diksi: 'Diksi',
};

export const menuDari = (kunci: string): Menu | undefined => MENU_PORTAL.find(menu => menu.kunci === kunci);

export function menuUntukJenis(jenis: IsiMenu): Menu {
  const menu = MENU_PORTAL.find(calon => calon.isi.includes(jenis));
  if (!menu) throw new Error(`jenis ${jenis} tidak ada di MENU_PORTAL`);
  return menu;
}
```

`apps/admin/src/rute.ts` (ganti seluruh isi):

```ts
// Rute portal admin ↔ location.hash. bacaRute mem-parse hash menjadi Rute (tak dikenal/tak sah → beranda);
// tulisRute kebalikannya, dipakai untuk href navigasi. Menu & tab divalidasi terhadap MENU_PORTAL.
import { JENIS_KONTEN, type JenisKonten } from '@waris/content';
import { menuDari, type IsiMenu, type KunciMenu } from './navigasi';

export type Rute =
  | { layar: 'beranda' }
  | { layar: 'menu'; menu: KunciMenu; tab: IsiMenu }
  | { layar: 'entri'; entriId: string }
  | { layar: 'entriBaru'; jenis: JenisKonten }
  | { layar: 'review' }
  | { layar: 'peran' };

const BERANDA: Rute = { layar: 'beranda' };
const jenisSah = (teks: string | undefined): teks is JenisKonten => !!teks && (JENIS_KONTEN as readonly string[]).includes(teks);

export function bacaRute(hash: string): Rute {
  const [segmenA, segmenB, segmenC] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (segmenA) {
    case 'menu': {
      const menu = segmenB ? menuDari(segmenB) : undefined;
      if (!menu) return BERANDA;
      const tab = menu.isi.find(isi => isi === segmenC) ?? menu.isi[0]!;
      return { layar: 'menu', menu: menu.kunci, tab };
    }
    case 'entri': return segmenB ? { layar: 'entri', entriId: segmenB } : BERANDA;
    case 'baru': return jenisSah(segmenB) ? { layar: 'entriBaru', jenis: segmenB } : BERANDA;
    case 'review': return { layar: 'review' };
    case 'peran': return { layar: 'peran' };
    default: return BERANDA;
  }
}

export function tulisRute(rute: Rute): string {
  switch (rute.layar) {
    case 'beranda': return '#/';
    case 'menu': return `#/menu/${rute.menu}/${rute.tab}`;
    case 'entri': return `#/entri/${rute.entriId}`;
    case 'entriBaru': return `#/baru/${rute.jenis}`;
    case 'review': return '#/review';
    case 'peran': return '#/peran';
  }
}
```

Di `apps/admin/src/Portal.tsx`, sementara (Task 5 menggantinya):
- `NavigasiPortal`: ganti map `JENIS_KONTEN` dengan map `MENU_PORTAL` → `<a key={menu.kunci} href={tulisRute({ layar: 'menu', menu: menu.kunci, tab: menu.isi[0]! })}>{menu.label}</a>`; hapus link Diksi.
- `LayarRute`: ganti cabang `konten` dan `diksi` dengan
  `if (rute.layar === 'menu') return rute.tab === 'diksi' ? <EditorDiksi /> : <DaftarKonten jenis={rute.tab} />;`
  dan cabang terakhir `return <p>Segera</p>;` tetap untuk `beranda` sampai Task 6.
- Hapus impor `JENIS_KONTEN` yang tak terpakai; impor `MENU_PORTAL` dari `./navigasi`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p .`
Expected: PASS (tes `gerbang` tetap lulus: link "Antrean review" & tombol "Keluar" masih ada).

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/navigasi.ts apps/admin/src/rute.ts apps/admin/src/Portal.tsx apps/admin/src/__tests__/navigasi.test.ts apps/admin/src/__tests__/rute.test.ts apps/web/src/ui/Ikon.tsx
git commit -m "admin: peta menu portal & rute beranda/menu"
```

---

### Task 4: Fungsi murni ringkasan & daftar (`ringkas.ts`)

**Files:**
- Create: `apps/admin/src/ringkas.ts`
- Modify: `apps/admin/src/layar/DaftarKonten.tsx` (hapus `statusTampil` & `judulEntri` lokal; impor dari `../ringkas`)
- Modify: `apps/admin/src/__tests__/daftar.test.tsx:7` (impor `statusTampil` dari `../ringkas`)
- Test: `apps/admin/src/__tests__/ringkas.test.ts` (baru)

**Interfaces:**
- Produces:
  ```ts
  export type StatusTampil = 'terbit' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit + draf';
  export type TabStatus = 'semua' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit';
  export const TAB_STATUS: readonly TabStatus[];
  export const LABEL_TAB: Record<TabStatus, string>;
  export function statusTampil(entri: RingkasanEntri): StatusTampil;          // dipindah apa adanya dari DaftarKonten
  export function judulEntri(entri: RingkasanEntri): string;                    // dipindah dari DaftarKonten, field calon judul diperluas
  export function cocokTab(entri: RingkasanEntri, tab: TabStatus): boolean;
  export function jumlahPerTab(daftar: RingkasanEntri[]): Record<TabStatus, number>;
  export function saringDaftar(daftar: RingkasanEntri[], tab: TabStatus, cari: string): RingkasanEntri[];
  export interface GrupModul { modul: RingkasanEntri | null; nomor: number | null; judul: string; materi: RingkasanEntri[] }
  export function kelompokkanPerModul(materi: RingkasanEntri[], modul: RingkasanEntri[]): GrupModul[];
  export interface RingkasanBeranda {
    drafSaya: number; menungguReview: number; dikembalikanKeSaya: number; terbit: number;
    lanjutkan: RingkasanEntri[]; antreanTertua: RingkasanEntri[];
  }
  export function ringkasBeranda(semua: RingkasanEntri[], userId: string): RingkasanBeranda;
  export function pindahkan<T>(daftar: readonly T[], dari: number, ke: number): T[];
  export function waktuRelatif(iso: string, sekarang: Date): string;
  export const BATAS_BERANDA = 8;
  ```

- [ ] **Step 1: Tulis tes gagal**

`apps/admin/src/__tests__/ringkas.test.ts`:

```ts
import { expect, test } from 'vitest';
import type { RingkasanEntri, RingkasanRevisi, } from '@waris/data';
import {
  jumlahPerTab, kelompokkanPerModul, pindahkan, ringkasBeranda, saringDaftar, waktuRelatif,
} from '../ringkas';

function entri(id: string, sisa: { status?: RingkasanRevisi['status'] | null; terbit?: boolean; oleh?: string; isi?: unknown;
  refs?: string[]; pada?: string; catatan?: string } = {}): RingkasanEntri {
  const revisiTerakhir = sisa.status === null ? null : {
    id: `r-${id}`, entriId: id, status: sisa.status ?? 'draf', refs: sisa.refs ?? [], isi: sisa.isi ?? {},
    dibuatOleh: sisa.oleh ?? 'u1', diperiksaOleh: null, catatanReview: sisa.catatan ?? null,
    dibuatPada: sisa.pada ?? '2026-09-27T00:00:00.000Z', diperiksaPada: null,
  } satisfies RingkasanRevisi;
  const revisiTerbitId = sisa.terbit ? (sisa.status === 'disetujui' ? `r-${id}` : `lama-${id}`) : null;
  return { entriId: id, jenis: 'faq', slug: id, urutan: 0, revisiTerbitId, revisiTerakhir };
}

test('jumlahPerTab: terbit + draf dihitung di Draf dan Terbit', () => {
  const daftar = [entri('a', { status: 'disetujui', terbit: true }), entri('b', { status: 'draf', terbit: true }),
    entri('c', { status: 'diajukan' }), entri('d', { status: 'dikembalikan' })];
  expect(jumlahPerTab(daftar)).toEqual({ semua: 4, draf: 1, diajukan: 1, dikembalikan: 1, terbit: 2 });
});

test('saringDaftar: cari judul, slug, atau ref tanpa beda huruf besar', () => {
  const daftar = [entri('apa-itu-tirkah', { isi: { pertanyaan: 'Apa itu tirkah?' } }), entri('radd', { refs: ['R09-7'] })];
  expect(saringDaftar(daftar, 'semua', 'TIRKAH').map(e => e.slug)).toEqual(['apa-itu-tirkah']);
  expect(saringDaftar(daftar, 'semua', 'r09').map(e => e.slug)).toEqual(['radd']);
  expect(saringDaftar(daftar, 'diajukan', '')).toEqual([]);
});

test('kelompokkanPerModul: urut nomor modul, modul kosong tetap tampil, modul tak dikenal ke "Tanpa modul"', () => {
  const modul = [entri('m2', { isi: { nomor: 2, judul: 'Ashabah' } }), entri('m1', { isi: { nomor: 1, judul: 'Pengantar' } })];
  const materi = [entri('x', { isi: { modul: 1, judul: 'X' } }), entri('y', { isi: { modul: 7, judul: 'Y' } }),
    entri('z', { status: null })];
  const grup = kelompokkanPerModul(materi, modul);
  expect(grup.map(g => [g.nomor, g.judul, g.materi.map(e => e.slug)])).toEqual([
    [1, 'Pengantar', ['x']], [2, 'Ashabah', []], [null, 'Tanpa modul', ['y', 'z']],
  ]);
});

test('ringkasBeranda: angka milik saya & antrean, lanjutkan terbaru dulu maks 8', () => {
  const semua = [
    entri('a', { status: 'draf', pada: '2026-09-27T01:00:00.000Z' }),
    entri('b', { status: 'dikembalikan', pada: '2026-09-27T03:00:00.000Z' }),
    entri('c', { status: 'draf', oleh: 'lain' }),
    entri('d', { status: 'diajukan', oleh: 'lain', pada: '2026-09-26T00:00:00.000Z' }),
    entri('e', { status: 'disetujui', terbit: true }),
    ...Array.from({ length: 9 }, (_, i) => entri(`f${i}`, { status: 'draf', pada: '2026-09-20T00:00:00.000Z' })),
  ];
  const hasil = ringkasBeranda(semua, 'u1');
  expect(hasil).toMatchObject({ drafSaya: 10, menungguReview: 1, dikembalikanKeSaya: 1, terbit: 1 });
  expect(hasil.lanjutkan).toHaveLength(8);
  expect(hasil.lanjutkan.slice(0, 2).map(e => e.slug)).toEqual(['b', 'a']);
  expect(hasil.antreanTertua.map(e => e.slug)).toEqual(['d']);
});

test('pindahkan: tidak memutasi, indeks di luar batas → salinan sama', () => {
  const awal = ['a', 'b', 'c'];
  expect(pindahkan(awal, 0, 2)).toEqual(['b', 'c', 'a']);
  expect(pindahkan(awal, 2, 0)).toEqual(['c', 'a', 'b']);
  expect(pindahkan(awal, 0, 5)).toEqual(['a', 'b', 'c']);
  expect(awal).toEqual(['a', 'b', 'c']);
});

test('waktuRelatif', () => {
  const sekarang = new Date('2026-09-27T12:00:00Z');
  expect(waktuRelatif('2026-09-27T11:59:30Z', sekarang)).toBe('baru saja');
  expect(waktuRelatif('2026-09-27T10:00:00Z', sekarang)).toBe('2 jam yang lalu');
  expect(waktuRelatif('2026-09-26T12:00:00Z', sekarang)).toBe('kemarin');
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/admin test -- ringkas`
Expected: FAIL, `Cannot find module '../ringkas'`.

- [ ] **Step 3: Implementasi** `apps/admin/src/ringkas.ts`

```ts
// Perhitungan murni untuk beranda & daftar konten portal: status ringkas, tab/cari, grup modul, ringkasan beranda,
// pindah urutan, dan waktu relatif. Menerima RingkasanEntri dari repo.konten.daftarEntri; komponen hanya menampilkan.
import type { RingkasanEntri } from '@waris/data';

export type StatusTampil = 'terbit' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit + draf';
export type TabStatus = 'semua' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit';
export const TAB_STATUS: readonly TabStatus[] = ['semua', 'draf', 'diajukan', 'dikembalikan', 'terbit'];
export const LABEL_TAB: Record<TabStatus, string> = {
  semua: 'Semua', draf: 'Draf', diajukan: 'Diajukan', dikembalikan: 'Dikembalikan', terbit: 'Terbit',
};
export const BATAS_BERANDA = 8;
const FIELD_JUDUL = ['judul', 'pertanyaan', 'istilahId', 'kunci', 'id', 'kode'] as const;

/** Entri bisa punya revisi terbit dan draf baru sekaligus ("terbit + draf"); revisi terakhir yang diajukan/
 * dikembalikan di atas revisi terbit ditampilkan statusnya sendiri (lebih relevan bagi reviewer). */
export function statusTampil(entri: RingkasanEntri): StatusTampil {
  const { revisiTerbitId, revisiTerakhir } = entri;
  if (!revisiTerakhir) return revisiTerbitId ? 'terbit' : 'draf';
  if (revisiTerbitId && revisiTerakhir.id === revisiTerbitId) return 'terbit';
  if (revisiTerbitId && revisiTerakhir.status === 'draf') return 'terbit + draf';
  if (revisiTerakhir.status === 'diajukan') return 'diajukan';
  if (revisiTerakhir.status === 'draf') return 'draf';
  return 'dikembalikan';
}

export function judulEntri(entri: RingkasanEntri): string {
  const isi = entri.revisiTerakhir?.isi as Record<string, unknown> | undefined;
  const kandidat = FIELD_JUDUL.map(kunci => isi?.[kunci]).find(nilai => typeof nilai === 'string' && nilai.length > 0);
  return typeof kandidat === 'string' ? kandidat : entri.slug;
}

export function cocokTab(entri: RingkasanEntri, tab: TabStatus): boolean {
  const status = statusTampil(entri);
  if (tab === 'semua') return true;
  if (status === 'terbit + draf') return tab === 'draf' || tab === 'terbit';
  return status === tab;
}

export const jumlahPerTab = (daftar: RingkasanEntri[]): Record<TabStatus, number> =>
  Object.fromEntries(TAB_STATUS.map(tab => [tab, daftar.filter(entri => cocokTab(entri, tab)).length])) as Record<TabStatus, number>;

export function saringDaftar(daftar: RingkasanEntri[], tab: TabStatus, cari: string): RingkasanEntri[] {
  const kata = cari.trim().toLowerCase();
  return daftar.filter(entri => cocokTab(entri, tab) && (!kata || [judulEntri(entri), entri.slug, ...(entri.revisiTerakhir?.refs ?? [])]
    .some(teks => teks.toLowerCase().includes(kata))));
}

export interface GrupModul { modul: RingkasanEntri | null; nomor: number | null; judul: string; materi: RingkasanEntri[] }

/** Materi dikelompokkan per isi.modul di bawah modulnya (urut nomor). Modul tanpa materi tetap tampil; materi yang
 * modulnya tidak dikenal atau isinya rusak masuk grup "Tanpa modul" di akhir. Urutan materi dalam grup dipertahankan. */
export function kelompokkanPerModul(materi: RingkasanEntri[], modul: RingkasanEntri[]): GrupModul[] {
  const nomorModul = (entri: RingkasanEntri) => angkaDari(entri, 'nomor');
  const grup: GrupModul[] = modul
    .filter(entri => nomorModul(entri) !== null)
    .sort((a, b) => nomorModul(a)! - nomorModul(b)!)
    .map(entri => ({ modul: entri, nomor: nomorModul(entri), judul: judulEntri(entri), materi: [] }));
  const tanpaModul: GrupModul = { modul: null, nomor: null, judul: 'Tanpa modul', materi: [] };
  for (const entri of materi) (grup.find(g => g.nomor === angkaDari(entri, 'modul')) ?? tanpaModul).materi.push(entri);
  return tanpaModul.materi.length ? [...grup, tanpaModul] : grup;
}

export interface RingkasanBeranda {
  drafSaya: number; menungguReview: number; dikembalikanKeSaya: number; terbit: number;
  lanjutkan: RingkasanEntri[]; antreanTertua: RingkasanEntri[];
}

export function ringkasBeranda(semua: RingkasanEntri[], userId: string): RingkasanBeranda {
  const milikSaya = (entri: RingkasanEntri) => entri.revisiTerakhir?.dibuatOleh === userId;
  const berstatus = (entri: RingkasanEntri, status: string) => entri.revisiTerakhir?.status === status;
  const waktu = (entri: RingkasanEntri) => entri.revisiTerakhir?.dibuatPada ?? '';
  const drafSaya = semua.filter(entri => milikSaya(entri) && berstatus(entri, 'draf'));
  const dikembalikan = semua.filter(entri => milikSaya(entri) && berstatus(entri, 'dikembalikan'));
  const diajukan = semua.filter(entri => berstatus(entri, 'diajukan'));
  return {
    drafSaya: drafSaya.length,
    menungguReview: diajukan.length,
    dikembalikanKeSaya: dikembalikan.length,
    terbit: semua.filter(entri => entri.revisiTerbitId).length,
    lanjutkan: [...dikembalikan, ...drafSaya].sort((a, b) => waktu(b).localeCompare(waktu(a))).slice(0, BATAS_BERANDA),
    antreanTertua: [...diajukan].sort((a, b) => waktu(a).localeCompare(waktu(b))).slice(0, BATAS_BERANDA),
  };
}

export function pindahkan<T>(daftar: readonly T[], dari: number, ke: number): T[] {
  const hasil = [...daftar];
  if (dari < 0 || dari >= hasil.length || ke < 0 || ke >= hasil.length) return hasil;
  const [dipindah] = hasil.splice(dari, 1);
  hasil.splice(ke, 0, dipindah!);
  return hasil;
}

const SATUAN_WAKTU: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86_400], ['hour', 3_600], ['minute', 60]];
const formatWaktu = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

export function waktuRelatif(iso: string, sekarang: Date): string {
  const detik = Math.round((new Date(iso).getTime() - sekarang.getTime()) / 1000);
  if (Math.abs(detik) < 60) return 'baru saja';
  const [satuan, besar] = SATUAN_WAKTU.find(([, ukuran]) => Math.abs(detik) >= ukuran)!;
  return formatWaktu.format(Math.round(detik / besar), satuan);
}

function angkaDari(entri: RingkasanEntri, kunci: string): number | null {
  const nilai = (entri.revisiTerakhir?.isi as Record<string, unknown> | undefined)?.[kunci];
  return typeof nilai === 'number' && Number.isInteger(nilai) ? nilai : null;
}
```

Di `apps/admin/src/layar/DaftarKonten.tsx`: hapus `type StatusTampil`, fungsi `statusTampil`, dan `judulEntri`; tambahkan `import { judulEntri, statusTampil } from '../ringkas';`. Di `daftar.test.tsx` baris 7: `import { DaftarKonten } from '../layar/DaftarKonten';` + `import { statusTampil } from '../ringkas';`.

Catatan `waktuRelatif`: bila `Intl.RelativeTimeFormat('id')` di Node menghasilkan teks berbeda dari tes (mis. "2 jam lalu"), sesuaikan **ekspektasi tes** dengan keluaran Node yang sebenarnya — jangan membuat format sendiri.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p .`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/ringkas.ts apps/admin/src/__tests__/ringkas.test.ts apps/admin/src/layar/DaftarKonten.tsx apps/admin/src/__tests__/daftar.test.tsx
git commit -m "admin: fungsi murni ringkasan beranda, saring, grup modul"
```

---

### Task 5: Kerangka (sidebar, laci, akun) + gaya portal

**Files:**
- Modify: `apps/web/src/ui/Ikon.tsx` (jalur baru)
- Create: `apps/admin/src/admin.css`
- Create: `apps/admin/src/Kerangka.tsx`
- Modify: `apps/admin/src/main.tsx` (impor `./admin.css`)
- Modify: `apps/admin/src/Portal.tsx` (hapus `NavigasiPortal`; bungkus `LayarRute` dengan `Kerangka`)
- Test: `apps/admin/src/__tests__/kerangka.test.tsx` (baru), `apps/admin/src/__tests__/gerbang.test.tsx`

**Interfaces:**
- Consumes: `MENU_PORTAL`, `GrupMenu`, `menuUntukJenis` (Task 3); `Rute`, `tulisRute` (Task 3).
- Produces:
  ```tsx
  export function Kerangka(props: { rute: Rute; onKeluar: () => void; children: ReactNode }): JSX.Element
  export function menuAktif(rute: Rute, menuTerakhir: KunciMenu | null): 'beranda' | 'review' | 'peran' | KunciMenu | null
  ```
  `Kerangka` membaca `usePortal()` untuk peran/sesi/repo dan memuat jumlah antrean (`repo.editorial.antreanReview()` + `repo.diksi.antreanReview()`) sekali saat pasang. Rute `entri`/`entriBaru` menyorot menu terakhir yang dibuka (disimpan di state `Kerangka`; `entriBaru` langsung dari `menuUntukJenis(jenis)`).
- Jalur ikon baru di `Ikon.tsx`: `kotakMasuk`, `peran`, `cari`, `pegangan`, `naik`, `turun`, `menu`.

- [ ] **Step 1: Tulis tes gagal**

`apps/admin/src/__tests__/kerangka.test.tsx`:

```tsx
// Tes Kerangka: sidebar berkelompok per peran, lencana antrean, menu aktif, laci layar sempit.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { Kerangka, menuAktif } from '../Kerangka';
import type { Rute } from '../rute';
import { DAFTAR_FAQ_UJI } from './contoh';

async function pasang(peran: Peran, rute: Rute = { layar: 'beranda' }) {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'fariq@x.id' }, peran: { u1: peran, u2: 'penulis' } });
  if (peran !== 'reviewer') {
    const id = await m.editorial.buatEntri('faq', 'a', 10);
    await m.editorial.ajukan(await m.editorial.buatDraf(id, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']));
  }
  const onKeluar = vi.fn();
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'fariq@x.id' }, peran }}>
      <Kerangka rute={rute} onKeluar={onKeluar}><p>isi layar</p></Kerangka>
    </KonteksRepo.Provider>,
  );
  return { onKeluar };
}

test('admin: grup, menu Peran, lencana antrean, email & keluar', async () => {
  const { onKeluar } = await pasang('admin');
  const nav = screen.getByRole('navigation', { name: 'Navigasi portal' });
  for (const grup of ['Belajar', 'Bank soal', 'Tanya jawab', 'Pustaka', 'Aplikasi']) expect(within(nav).getByText(grup)).toBeTruthy();
  expect(within(nav).getByRole('link', { name: /Modul & Materi/ }).getAttribute('href')).toBe('#/menu/materi/materi');
  expect(within(nav).getByRole('link', { name: 'Peran' })).toBeTruthy();
  expect(await within(nav).findByLabelText('1 menunggu review')).toBeTruthy();
  expect(screen.getByText('fariq@x.id')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));
  expect(onKeluar).toHaveBeenCalled();
  expect(screen.getByText('isi layar')).toBeTruthy();
});

test('reviewer: tanpa menu Peran', async () => {
  await pasang('reviewer');
  expect(screen.queryByRole('link', { name: 'Peran' })).toBeNull();
});

test('menu aktif ditandai aria-current', async () => {
  await pasang('admin', { layar: 'menu', menu: 'pustaka', tab: 'syahid' });
  expect(screen.getByRole('link', { name: /Kitab & syahid/ }).getAttribute('aria-current')).toBe('page');
});

test('menuAktif: entri memakai menu terakhir, entriBaru dari jenisnya', () => {
  expect(menuAktif({ layar: 'entri', entriId: 'x' }, 'faq')).toBe('faq');
  expect(menuAktif({ layar: 'entriBaru', jenis: 'modul' }, null)).toBe('materi');
  expect(menuAktif({ layar: 'review' }, 'faq')).toBe('review');
});

test('laci: tombol Menu membuka, memilih menu menutup', async () => {
  await pasang('admin');
  const tombol = screen.getByRole('button', { name: 'Menu' });
  expect(tombol.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(tombol);
  expect(tombol.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('link', { name: /FAQ/ }));
  expect(tombol.getAttribute('aria-expanded')).toBe('false');
});
```

Di `gerbang.test.tsx` tidak perlu ubah bila lulus; bila tes `'peran ada → tombol keluar di navigasi'` kini menemukan dua tombol "Keluar", ganti `findByRole('button', { name: /keluar/i })` menjadi `findByRole('button', { name: 'Keluar' })`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/admin test -- kerangka`
Expected: FAIL, `Cannot find module '../Kerangka'`.

- [ ] **Step 3: Implementasi**

Tambahkan ke `JALUR` di `apps/web/src/ui/Ikon.tsx`:

```tsx
  kotakMasuk: <><path d="M3 13h5l2 3h4l2-3h5" /><path d="M5.5 5h13L21 13v6H3v-6z" /></>,
  peran: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .8 3 2.8 3 6" /></>,
  cari: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  pegangan: <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />,
  naik: <path d="M6 15l6-6 6 6" />,
  turun: <path d="M6 9l6 6 6-6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
```

`apps/admin/src/Kerangka.tsx`:

```tsx
// Kerangka portal (spec tahap A "Kerangka & navigasi"): sidebar berkelompok dari MENU_PORTAL, lencana antrean review,
// email + peran + Keluar di bawah, dan isi layar di kanan. Layar sempit: sidebar jadi laci (tombol Menu), menutup
// setelah memilih menu. Menu aktif dari rute; layar entri menyorot menu terakhir yang dibuka.
import { useEffect, useState, type ReactNode } from 'react';
import { Ikon, type NamaIkon } from '@waris/web/ui/Ikon';
import { MENU_PORTAL, menuUntukJenis, type GrupMenu, type KunciMenu } from './navigasi';
import { usePortal } from './repo';
import { tulisRute, type Rute } from './rute';

type KunciAktif = 'beranda' | 'review' | 'peran' | KunciMenu | null;
const URUTAN_GRUP: GrupMenu[] = ['Belajar', 'Bank soal', 'Tanya jawab', 'Pustaka', 'Aplikasi'];
const LABEL_PERAN = { admin: 'Admin', penulis: 'Penulis', reviewer: 'Reviewer' } as const;

export function menuAktif(rute: Rute, menuTerakhir: KunciMenu | null): KunciAktif {
  switch (rute.layar) {
    case 'beranda': case 'review': case 'peran': return rute.layar;
    case 'menu': return rute.menu;
    case 'entriBaru': return menuUntukJenis(rute.jenis).kunci;
    case 'entri': return menuTerakhir;
  }
}

export function Kerangka({ rute, onKeluar, children }: { rute: Rute; onKeluar: () => void; children: ReactNode }) {
  const { repo, sesi, peran } = usePortal();
  const [lacilTerbuka, setLaciTerbuka] = useState(false);
  const [menuTerakhir, setMenuTerakhir] = useState<KunciMenu | null>(null);
  const [jumlahAntrean, setJumlahAntrean] = useState(0);

  useEffect(() => { if (rute.layar === 'menu') setMenuTerakhir(rute.menu); }, [rute]);
  useEffect(() => {
    let dibatalkan = false;
    Promise.all([repo.editorial.antreanReview(), repo.diksi.antreanReview()])
      .then(([konten, diksi]) => { if (!dibatalkan) setJumlahAntrean(konten.length + diksi.length); })
      .catch(() => { /* lencana hanya pelengkap; layar antrean menampilkan galatnya sendiri */ });
    return () => { dibatalkan = true; };
  }, [repo]);

  const aktif = menuAktif(rute, menuTerakhir);
  const tautan = (kunci: KunciAktif, href: string, ikon: NamaIkon, label: string, lencana?: number) => (
    <a key={String(kunci)} href={href} className="nav-portal" aria-current={aktif === kunci ? 'page' : undefined}
      onClick={() => setLaciTerbuka(false)}>
      <Ikon nama={ikon} ukuran={18} /><span>{label}</span>
      {lencana ? <span className="lencana-portal" aria-label={`${lencana} menunggu review`}>{lencana}</span> : null}
    </a>
  );

  return (
    <div className={lacilTerbuka ? 'kerangka-portal laci-terbuka' : 'kerangka-portal'}>
      <header className="kepala-portal">
        <button type="button" className="tombol-laci" aria-expanded={lacilTerbuka} aria-controls="sisi-portal"
          onClick={() => setLaciTerbuka(!lacilTerbuka)}>
          <Ikon nama="menu" /><span>Menu</span>
        </button>
        <b>Arif Waris</b>
      </header>
      <aside id="sisi-portal" className="sisi-portal">
        <div className="logo-portal">Arif Waris<small>Portal Konten</small></div>
        <nav aria-label="Navigasi portal">
          {tautan('beranda', tulisRute({ layar: 'beranda' }), 'rumah', 'Beranda')}
          {tautan('review', tulisRute({ layar: 'review' }), 'kotakMasuk', 'Antrean review', jumlahAntrean)}
          {URUTAN_GRUP.map(grup => (
            <div key={grup} className="grup-nav">
              <div className="label-grup">{grup}</div>
              {MENU_PORTAL.filter(menu => menu.grup === grup).map(menu =>
                tautan(menu.kunci, tulisRute({ layar: 'menu', menu: menu.kunci, tab: menu.isi[0]! }), menu.ikon, menu.label))}
            </div>
          ))}
          {peran === 'admin' ? <div className="grup-nav">{tautan('peran', tulisRute({ layar: 'peran' }), 'peran', 'Peran')}</div> : null}
        </nav>
        <div className="akun-portal">
          <span className="email-portal">{sesi.email}</span>
          <span className="keterangan">{LABEL_PERAN[peran]}</span>
          <button type="button" className="tombol-keluar-portal" onClick={onKeluar}><Ikon nama="keluar" ukuran={18} />Keluar</button>
        </div>
      </aside>
      {lacilTerbuka ? <div className="tirai-laci" aria-hidden="true" onClick={() => setLaciTerbuka(false)} /> : null}
      <main className="utama-portal">{children}</main>
    </div>
  );
}
```

`apps/admin/src/admin.css`:

```css
/* Gaya portal admin di atas token & komponen web (Arif Waris v4). Hanya token (var(--…)), tanpa warna mentah. */
body{margin:0;background:var(--surface);color:var(--ink);font-family:var(--font-sans)}
.kerangka-portal{display:grid;grid-template-columns:248px 1fr;min-height:100vh}
.kepala-portal{display:none}
.sisi-portal{position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column;gap:4px;
  padding:18px 14px;background:var(--surface-raised);border-right:var(--border-w) solid var(--outline)}
.logo-portal{font:700 18px var(--font-display);margin:0 6px 14px}
.logo-portal small{display:block;font:600 12px var(--font-sans);color:var(--ink-muted)}
.label-grup{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);margin:16px 10px 4px}
.nav-portal{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);color:var(--ink);
  text-decoration:none;font-weight:600;border:var(--border-w) solid transparent}
.nav-portal:hover{background:var(--surface-sunken)}
.nav-portal[aria-current="page"]{background:var(--primary-soft);border-color:var(--outline)}
.nav-portal:focus-visible,.tombol-laci:focus-visible,.tombol-keluar-portal:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.lencana-portal{margin-left:auto;background:var(--pink);color:var(--on-fill);border:1.5px solid var(--outline);
  border-radius:var(--radius-pill);padding:0 8px;font-size:12px;font-weight:700}
.akun-portal{margin-top:auto;padding:14px 10px 0;border-top:1px solid var(--divider);display:flex;flex-direction:column;gap:4px}
.email-portal{font-weight:700;overflow-wrap:anywhere}
.tombol-keluar-portal{display:inline-flex;align-items:center;gap:8px;margin-top:8px;background:none;border:var(--border-w) solid var(--outline);
  border-radius:var(--radius-sm);padding:6px 10px;font:inherit;font-weight:700;color:var(--ink);cursor:pointer}
.utama-portal{padding:28px 32px;min-width:0;max-width:var(--lebar-konten)}

/* Layar kepala halaman, kartu, tab, baris daftar */
.jejak-portal{color:var(--ink-muted);font-weight:600;margin:0 0 4px}
.judul-halaman-portal{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.judul-halaman-portal h1{font:700 26px var(--font-display);margin:0}
.kartu-portal{background:var(--surface-raised);border:var(--border-w) solid var(--outline);border-radius:var(--radius-md);
  box-shadow:var(--shadow-pop-sm);padding:14px 16px}
.kisi-angka{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}
.angka-besar{font:700 28px var(--font-display)}
.kartu-portal.peringatan{background:var(--danger-soft)}
.dua-kolom-portal{display:grid;grid-template-columns:1.5fr 1fr;gap:14px}
.tab-portal{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.tab-portal button{border:var(--border-w) solid var(--outline);border-radius:var(--radius-pill);padding:5px 14px;
  background:var(--surface-raised);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
.tab-portal button[aria-pressed="true"],.tab-portal a[aria-current="page"]{background:var(--ink);color:var(--surface)}
.tab-portal a{border:var(--border-w) solid var(--outline);border-radius:var(--radius-pill);padding:5px 14px;color:var(--ink);text-decoration:none;font-weight:700}
.alat-portal{display:flex;gap:8px;margin-bottom:14px}
.cari-portal{flex:1;display:flex;align-items:center;gap:8px;border:var(--border-w) solid var(--outline);border-radius:var(--radius-sm);
  padding:0 10px;background:var(--surface-raised)}
.cari-portal input{flex:1;border:0;background:none;padding:9px 0;font:inherit;color:var(--ink)}
.cari-portal input:focus{outline:none}.cari-portal:focus-within{outline:3px solid var(--focus);outline-offset:2px}
.grup-daftar{background:var(--surface-raised);border:var(--border-w) solid var(--outline);border-radius:var(--radius-md);
  box-shadow:var(--shadow-pop-sm);overflow:hidden;margin-bottom:14px}
.kepala-grup{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface-sunken);border-bottom:var(--border-w) solid var(--outline)}
.kepala-grup b{font-family:var(--font-display)}
.nomor-grup{min-width:28px;height:28px;display:grid;place-items:center;border:var(--border-w) solid var(--outline);
  border-radius:var(--radius-sm);background:var(--sun);color:var(--on-fill);font-weight:700}
.baris-entri{display:grid;grid-template-columns:auto 1fr auto auto auto;gap:12px;align-items:center;padding:10px 14px;
  border-bottom:1px solid var(--divider)}
.baris-entri:last-child{border-bottom:0}
.baris-entri.diseret{opacity:.5}
.baris-entri a{color:var(--ink);font-weight:700;text-decoration:none}
.baris-entri a:hover{text-decoration:underline}
.pegangan-seret{display:flex;align-items:center;gap:2px;color:var(--ink-muted);cursor:grab}
.pegangan-seret button{background:none;border:0;padding:2px;color:inherit;cursor:pointer;border-radius:4px}
.pegangan-seret button:disabled{opacity:.3;cursor:default}
.chip-status{display:inline-block;border:1.5px solid var(--outline);border-radius:var(--radius-pill);padding:1px 9px;
  font-size:12px;font-weight:700;color:var(--on-fill);white-space:nowrap}
.chip-status.draf{background:var(--surface-sunken);color:var(--ink)}.chip-status.diajukan{background:var(--sun)}
.chip-status.dikembalikan{background:var(--danger-soft);color:var(--ink)}.chip-status.terbit{background:var(--lime)}
.chip-ref{font:12px ui-monospace,monospace;background:var(--primary-soft);color:var(--ink);border-radius:6px;padding:1px 6px;margin-right:4px}
.catatan-baris{display:block;color:var(--ink-muted);font-size:13px;font-weight:500}
.kosong-portal{border:var(--border-w) dashed var(--ink-muted);border-radius:var(--radius-md);padding:28px;text-align:center;color:var(--ink-muted)}
.kerangka-abu{height:44px;border-radius:var(--radius-sm);background:var(--surface-sunken);margin-bottom:8px}
.galat-portal{background:var(--danger-soft);border:var(--border-w) solid var(--outline);border-radius:var(--radius-sm);padding:10px 14px;color:var(--ink)}

@media (max-width:900px){
  .kerangka-portal{grid-template-columns:1fr}
  .kepala-portal{display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--surface-raised);
    border-bottom:var(--border-w) solid var(--outline);position:sticky;top:0;z-index:20}
  .tombol-laci{display:inline-flex;align-items:center;gap:6px;background:none;border:var(--border-w) solid var(--outline);
    border-radius:var(--radius-sm);padding:6px 10px;font:inherit;font-weight:700;color:var(--ink)}
  .sisi-portal{position:fixed;inset:0 auto 0 0;width:min(280px,85vw);z-index:40;transform:translateX(-105%);transition:transform .2s}
  .laci-terbuka .sisi-portal{transform:none}
  .tirai-laci{position:fixed;inset:0;background:rgb(0 0 0 / .35);z-index:30}
  .utama-portal{padding:18px 16px}
  .kisi-angka{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dua-kolom-portal{grid-template-columns:1fr}
  .baris-entri{grid-template-columns:auto 1fr auto}
  .baris-entri .kolom-ref,.baris-entri .kolom-waktu{display:none}
}
@media (prefers-reduced-motion:reduce){.sisi-portal{transition:none}}
```

Catatan: `.tombol-laci` di layar lebar tidak tampil karena `.kepala-portal{display:none}`; jsdom tidak menerapkan CSS, jadi tes tetap bisa mengklik tombolnya.

`apps/admin/src/main.tsx`: tambahkan `import './admin.css';` setelah dua impor CSS web.

`apps/admin/src/Portal.tsx`: hapus fungsi `NavigasiPortal` dan impor `MENU_PORTAL`/`Tombol` yang tak terpakai di cabang siap; `LayarRute` menerima `onKeluar` dan membungkus hasil rute:

```tsx
  return (
    <KonteksRepo.Provider value={{ repo, sesi: status.sesi, peran: status.peran }}>
      <LayarRute onKeluar={() => void repo.akun.keluar().then(() => setStatus({ tahap: 'tamu' }))} />
    </KonteksRepo.Provider>
  );
}

function LayarRute({ onKeluar }: { onKeluar: () => void }) {
  const [rute, setRute] = useState(() => bacaRute(location.hash));
  useEffect(() => {
    const nyalakan = () => setRute(bacaRute(location.hash));
    window.addEventListener('hashchange', nyalakan);
    return () => window.removeEventListener('hashchange', nyalakan);
  }, []);
  return <Kerangka rute={rute} onKeluar={onKeluar}><IsiRute rute={rute} /></Kerangka>;
}

function IsiRute({ rute }: { rute: Rute }) {
  const { peran } = usePortal();
  if (rute.layar === 'menu') return rute.tab === 'diksi' ? <EditorDiksi /> : <DaftarKonten jenis={rute.tab} />;
  if (rute.layar === 'entri') return <EditorEntri key={rute.entriId} entriId={rute.entriId} />;
  if (rute.layar === 'entriBaru') return <EditorEntri key={`baru-${rute.jenis}`} jenis={rute.jenis} />;
  if (rute.layar === 'review') return <AntreanReview />;
  if (rute.layar === 'peran') return peran === 'admin' ? <KelolaPeran /> : <p>Hanya admin.</p>;
  return <p>Segera</p>;
}
```

(impor `Kerangka` dari `./Kerangka`, `usePortal` dari `./repo`, `type Rute` dari `./rute`; `Tombol` tetap diimpor untuk layar tamu/tanpa peran.)

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p . && pnpm --filter @waris/web exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ui/Ikon.tsx apps/admin/src/admin.css apps/admin/src/Kerangka.tsx apps/admin/src/main.tsx apps/admin/src/Portal.tsx apps/admin/src/__tests__/kerangka.test.tsx apps/admin/src/__tests__/gerbang.test.tsx
git commit -m "admin: kerangka dashboard dengan sidebar berkelompok & laci"
```

---

### Task 6: Beranda

**Files:**
- Create: `apps/admin/src/layar/Beranda.tsx`
- Modify: `apps/admin/src/Portal.tsx` (`IsiRute`: `if (rute.layar === 'beranda') return <Beranda />;` menggantikan `<p>Segera</p>`; cabang akhir jadi `return null;` tidak diperlukan karena semua layar tertangani — hapus)
- Test: `apps/admin/src/__tests__/beranda.test.tsx` (baru)

**Interfaces:**
- Consumes: `ringkasBeranda`, `judulEntri`, `statusTampil`, `waktuRelatif`, `RingkasanBeranda` (Task 4); `menuUntukJenis`, `LABEL_ISI`, `MENU_PORTAL` (Task 3); `tulisRute` (Task 3).
- Produces: `export function Beranda(): JSX.Element` — memuat `repo.konten.daftarEntri(jenis)` untuk semua `JENIS_KONTEN` paralel.

Tombol "Buat baru" (bukan reviewer): Materi, Soal kuis, Soal hitung, Kasus tanya jawab, FAQ → `tulisRute({ layar: 'entriBaru', jenis })`.

- [ ] **Step 1: Tulis tes gagal**

`apps/admin/src/__tests__/beranda.test.tsx`:

```tsx
// Tes Beranda: angka ringkasan, "Lanjutkan pekerjaan" dengan catatan review, tombol buat baru disembunyikan untuk reviewer.
import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { Beranda } from '../layar/Beranda';
import { DAFTAR_FAQ_UJI, SOAL_HITUNG_UJI } from './contoh';

async function pasang(peranSaya: Peran) {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'penulis', rev: 'reviewer' } });
  const faq = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const drafFaq = await m.editorial.buatDraf(faq, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']);
  await m.editorial.ajukan(drafFaq);
  const soal = await m.editorial.buatEntri('soal_hitung', 'h-01', 10);
  await m.editorial.buatDraf(soal, 'soal_hitung', SOAL_HITUNG_UJI, ['R05-1']);
  m.masukSebagai({ userId: 'rev', email: 'rev@x.id' });
  await m.editorial.kembalikan(drafFaq, 'Lengkapi dalil');
  m.masukSebagai({ userId: 'u1', email: 'a@x.id' });
  m.aturPeranLangsung('u1', peranSaya);
  render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran: peranSaya }}>
      <Beranda />
    </KonteksRepo.Provider>,
  );
}

test('penulis: angka, lanjutkan pekerjaan dengan catatan, tombol buat baru', async () => {
  await pasang('penulis');
  const angka = await screen.findByRole('region', { name: 'Ringkasan' });
  expect(within(angka).getByText('Draf saya').parentElement!.textContent).toContain('1');
  expect(within(angka).getByText('Dikembalikan ke saya').parentElement!.textContent).toContain('1');
  const lanjut = screen.getByRole('region', { name: 'Lanjutkan pekerjaan' });
  expect(within(lanjut).getByText('Lengkapi dalil')).toBeTruthy();
  expect(within(lanjut).getByRole('link', { name: /Apa itu tirkah\?/ })).toBeTruthy();
  expect(screen.getByRole('link', { name: '+ Materi' }).getAttribute('href')).toBe('#/baru/materi');
});

test('reviewer: tanpa tombol buat baru', async () => {
  await pasang('reviewer');
  await screen.findByRole('region', { name: 'Ringkasan' });
  expect(screen.queryByRole('link', { name: '+ Materi' })).toBeNull();
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/admin test -- beranda`
Expected: FAIL, `Cannot find module '../layar/Beranda'`.

- [ ] **Step 3: Implementasi** `apps/admin/src/layar/Beranda.tsx`

```tsx
// Beranda portal (spec tahap A "Beranda"): memuat daftarEntri semua jenis, meringkasnya lewat ringkasBeranda
// (angka milik saya & antrean, lanjutkan pekerjaan, antrean tertua untuk reviewer), dan menampilkan tombol buat baru
// untuk admin/penulis. Galat repo tampil sebagai pesan dengan tombol coba lagi.
import { useEffect, useState } from 'react';
import { JENIS_KONTEN, type JenisKonten } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { LABEL_ISI } from '../navigasi';
import { judulEntri, ringkasBeranda, statusTampil, waktuRelatif, type RingkasanBeranda } from '../ringkas';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';

const JENIS_BUAT_BARU: JenisKonten[] = ['materi', 'soal_kuis', 'soal_hitung', 'tanya_jawab', 'faq'];
const LABEL_PERAN = { admin: 'Admin', penulis: 'Penulis', reviewer: 'Reviewer' } as const;

export function Beranda() {
  const { repo, sesi, peran } = usePortal();
  const [ringkasan, setRingkasan] = useState<RingkasanBeranda | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    Promise.all(JENIS_KONTEN.map(jenis => repo.konten.daftarEntri(jenis)))
      .then(semua => { if (!dibatalkan) setRingkasan(ringkasBeranda(semua.flat(), sesi.userId)); })
      .catch(e => { if (!dibatalkan) setGalat(e instanceof Error ? e.message : String(e)); });
    return () => { dibatalkan = true; };
  }, [repo, sesi.userId, muatUlang]);

  const nama = sesi.email.split('@')[0];
  return (
    <div>
      <div className="judul-halaman-portal">
        <div>
          <h1>Assalamu'alaikum, {nama}</h1>
          <p className="keterangan">{LABEL_PERAN[peran]}</p>
        </div>
      </div>
      {galat ? (
        <p role="alert" className="galat-portal">{galat} <button type="button" onClick={() => setMuatUlang(n => n + 1)}>Coba lagi</button></p>
      ) : null}
      {!ringkasan && !galat ? <><div className="kerangka-abu" /><div className="kerangka-abu" /></> : null}
      {ringkasan ? <IsiBeranda ringkasan={ringkasan} bolehBuat={peran !== 'reviewer'} reviewer={peran === 'reviewer'} /> : null}
    </div>
  );
}

function IsiBeranda({ ringkasan, bolehBuat, reviewer }: { ringkasan: RingkasanBeranda; bolehBuat: boolean; reviewer: boolean }) {
  const sekarang = new Date();
  const daftarUtama = reviewer ? ringkasan.antreanTertua : ringkasan.lanjutkan;
  const judulDaftar = reviewer ? 'Menunggu review' : 'Lanjutkan pekerjaan';
  return (
    <>
      <section aria-label="Ringkasan" className="kisi-angka">
        <KartuAngka label="Draf saya" angka={ringkasan.drafSaya} />
        <KartuAngka label="Menunggu review" angka={ringkasan.menungguReview} />
        <KartuAngka label="Dikembalikan ke saya" angka={ringkasan.dikembalikanKeSaya} peringatan={ringkasan.dikembalikanKeSaya > 0} />
        <KartuAngka label="Terbit" angka={ringkasan.terbit} />
      </section>
      <div className="dua-kolom-portal">
        <section aria-label={judulDaftar} className="kartu-portal">
          <h2>{judulDaftar}</h2>
          {daftarUtama.length === 0 ? <p className="keterangan">Tidak ada yang tertunda.</p> : (
            <ul className="daftar-polos">
              {daftarUtama.map(entri => <BarisBeranda key={entri.entriId} entri={entri} sekarang={sekarang} />)}
            </ul>
          )}
          {reviewer ? <a href={tulisRute({ layar: 'review' })}>Buka antrean review</a> : null}
        </section>
        {bolehBuat ? (
          <section aria-label="Buat baru" className="kartu-portal">
            <h2>Buat baru</h2>
            <p className="keterangan">Pilih jenis, lalu isi formnya.</p>
            <div className="tab-portal">
              {JENIS_BUAT_BARU.map(jenis => <a key={jenis} href={tulisRute({ layar: 'entriBaru', jenis })}>+ {LABEL_ISI[jenis]}</a>)}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}

function KartuAngka({ label, angka, peringatan }: { label: string; angka: number; peringatan?: boolean }) {
  return (
    <div className={peringatan ? 'kartu-portal peringatan' : 'kartu-portal'}>
      <div className="angka-besar">{angka}</div>
      <div className="keterangan">{label}</div>
    </div>
  );
}

function BarisBeranda({ entri, sekarang }: { entri: RingkasanEntri; sekarang: Date }) {
  const status = statusTampil(entri);
  return (
    <li className="baris-entri" style={{ gridTemplateColumns: '1fr auto auto' }}>
      <span>
        <a href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{judulEntri(entri)}</a>
        <span className="catatan-baris">{LABEL_ISI[entri.jenis]}{entri.revisiTerakhir?.catatanReview ? ` · ${entri.revisiTerakhir.catatanReview}` : ''}</span>
      </span>
      <span className={`chip-status ${status === 'terbit + draf' ? 'draf' : status}`}>{status}</span>
      <span className="keterangan kolom-waktu">{entri.revisiTerakhir ? waktuRelatif(entri.revisiTerakhir.dibuatPada, sekarang) : ''}</span>
    </li>
  );
}
```

Catatan: `catatanReview` ditampilkan di dalam `<span>` yang sama dengan jenis; tes mencari teks `'Lengkapi dalil'` dengan `getByText` — bila gagal karena teks tergabung, pecah menjadi `<span className="catatan-baris">{LABEL_ISI[...]}</span>{catatan ? <span className="catatan-baris">{catatan}</span> : null}` (dua span terpisah).

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p .`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/layar/Beranda.tsx apps/admin/src/Portal.tsx apps/admin/src/__tests__/beranda.test.tsx
git commit -m "admin: beranda ringkasan & lanjutkan pekerjaan"
```

---

### Task 7: Daftar konten baru (menu bertab, tab status, cari, grup modul, kondisi kosong/galat)

**Files:**
- Modify: `apps/admin/src/layar/DaftarKonten.tsx` (tulis ulang seluruhnya)
- Modify: `apps/admin/src/Portal.tsx` (`IsiRute` cabang menu: `return <LayarMenu menu={rute.menu} tab={rute.tab} />;`)
- Test: `apps/admin/src/__tests__/daftar.test.tsx` (tulis ulang)

**Interfaces:**
- Consumes: Task 3 (`menuDari`, `LABEL_ISI`, `KunciMenu`, `IsiMenu`, `tulisRute`), Task 4 (`saringDaftar`, `jumlahPerTab`, `kelompokkanPerModul`, `statusTampil`, `judulEntri`, `waktuRelatif`, `TAB_STATUS`, `LABEL_TAB`, `TabStatus`, `GrupModul`).
- Produces:
  ```tsx
  export function LayarMenu(props: { menu: KunciMenu; tab: IsiMenu }): JSX.Element  // kepala + tab jenis + isi
  export function DaftarKonten(props: { jenis: JenisKonten; menuMateri?: boolean }): JSX.Element
  export function BarisEntri(props: { entri: RingkasanEntri; sekarang: Date; pegangan?: ReactNode }): JSX.Element
  ```
  `LayarMenu` menampilkan tab jenis (link `tulisRute({layar:'menu',…})`) bila `menu.isi.length > 1` dan `menu !== 'materi'`; tab `diksi` merender `<EditorDiksi />`. Menu materi merender `<DaftarKonten jenis="materi" menuMateri />` yang juga memuat `modul` dan menampilkan grup. Task 8 menambahkan seret ke `DaftarKonten`.

- [ ] **Step 1: Tulis tes gagal** — ganti seluruh isi `apps/admin/src/__tests__/daftar.test.tsx`:

```tsx
// Tes daftar konten: tab status + jumlah, cari, grup modul pada menu materi, tab jenis pada menu bertab,
// tombol buat baru per peran, kondisi kosong & galat.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { LayarMenu } from '../layar/DaftarKonten';
import type { IsiMenu, KunciMenu } from '../navigasi';
import { DAFTAR_FAQ_UJI, PELAJARAN_UJI } from './contoh';

async function siapkan() {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  const faq1 = await m.editorial.buatEntri('faq', 'apa-itu-tirkah', 10);
  const r1 = await m.editorial.buatDraf(faq1, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']);
  await m.editorial.ajukan(r1);
  await m.editorial.setujui(r1);
  const faq2 = await m.editorial.buatEntri('faq', 'siapa-ashabah', 20);
  await m.editorial.buatDraf(faq2, 'faq', DAFTAR_FAQ_UJI[1]!, ['R05-1']);
  return m;
}

function pasang(m: ReturnType<typeof buatMemori>, menu: KunciMenu, tab: IsiMenu, peran: Peran = 'admin') {
  return render(
    <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran }}>
      <LayarMenu menu={menu} tab={tab} />
    </KonteksRepo.Provider>,
  );
}

test('tab status dengan jumlah menyaring baris', async () => {
  pasang(await siapkan(), 'faq', 'faq');
  await screen.findByText('Apa itu tirkah?');
  fireEvent.click(screen.getByRole('button', { name: 'Draf 1' }));
  expect(screen.queryByText('Apa itu tirkah?')).toBeNull();
  expect(screen.getByText('Siapa ashabah?')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Terbit 1' }));
  expect(screen.getByText('Apa itu tirkah?')).toBeTruthy();
});

test('cari judul', async () => {
  pasang(await siapkan(), 'faq', 'faq');
  await screen.findByText('Apa itu tirkah?');
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cari' }), { target: { value: 'ashabah' } });
  expect(screen.queryByText('Apa itu tirkah?')).toBeNull();
  expect(screen.getByText('Siapa ashabah?')).toBeTruthy();
});

test('baris menaut ke editor; tombol buat baru untuk admin, tidak untuk reviewer', async () => {
  const m = await siapkan();
  const { unmount } = pasang(m, 'faq', 'faq');
  expect((await screen.findByRole('link', { name: 'Apa itu tirkah?' })).getAttribute('href')).toMatch(/^#\/entri\//);
  expect(screen.getByRole('link', { name: '+ FAQ baru' }).getAttribute('href')).toBe('#/baru/faq');
  unmount();
  pasang(m, 'faq', 'faq', 'reviewer');
  await screen.findByText('Apa itu tirkah?');
  expect(screen.queryByRole('link', { name: '+ FAQ baru' })).toBeNull();
});

test('menu bertab: tab jenis menaut ke rute menu', async () => {
  pasang(await siapkan(), 'pustaka', 'kitab');
  expect(screen.getByRole('link', { name: 'Syahid' }).getAttribute('href')).toBe('#/menu/pustaka/syahid');
  expect(screen.getByRole('link', { name: 'Kitab' }).getAttribute('aria-current')).toBe('page');
  expect(await screen.findByText(/Belum ada kitab/)).toBeTruthy();
});

test('menu materi: grup per modul dengan tautan edit modul', async () => {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  const modul = await m.editorial.buatEntri('modul', 'pengantar', 10);
  await m.editorial.buatDraf(modul, 'modul', { nomor: PELAJARAN_UJI.modul, judul: 'Pengantar', ringkas: 'r' }, []);
  const materi = await m.editorial.buatEntri('materi', PELAJARAN_UJI.slug, 10);
  await m.editorial.buatDraf(materi, 'materi', PELAJARAN_UJI, ['R05-1']);
  pasang(m, 'materi', 'materi');
  const grup = await screen.findByRole('region', { name: `Modul ${PELAJARAN_UJI.modul}: Pengantar` });
  expect(within(grup).getByText(PELAJARAN_UJI.judul)).toBeTruthy();
  expect(within(grup).getByRole('link', { name: 'Edit modul Pengantar' }).getAttribute('href')).toBe(`#/entri/${modul}`);
  expect(screen.getByRole('link', { name: '+ Modul baru' })).toBeTruthy();
});

test('galat repo tampil dengan tombol coba lagi', async () => {
  const m = await siapkan();
  m.konten.daftarEntri = async () => { throw new Error('jaringan putus'); };
  pasang(m, 'faq', 'faq');
  expect(await screen.findByText(/jaringan putus/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeTruthy();
});
```

Catatan untuk tes materi: `PELAJARAN_UJI` memuat refs di blok-bloknya; bila `buatDraf` menolak karena ref tak dikenal, isi `refs` awal `buatMemori` dengan semua kode ref di `PELAJARAN_UJI` (kumpulkan dengan `JSON.stringify(PELAJARAN_UJI).match(/R\d\d-\d+/g)`).

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/admin test -- daftar`
Expected: FAIL, `LayarMenu` tidak diekspor.

- [ ] **Step 3: Implementasi** — ganti seluruh isi `apps/admin/src/layar/DaftarKonten.tsx`:

```tsx
// Layar menu konten (spec tahap A "Daftar konten"): kepala (jejak grup, judul menu, tombol buat baru), tab jenis
// untuk menu bertab, lalu daftar entri dengan tab status + jumlah, cari (judul/slug/ref), dan baris berstatus.
// Menu materi mengelompokkan materi di bawah modulnya. Data dari repo.konten.daftarEntri; perhitungan di ringkas.ts.
import { useEffect, useState, type ReactNode } from 'react';
import type { JenisKonten } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { Ikon } from '@waris/web/ui/Ikon';
import { LABEL_ISI, menuDari, type IsiMenu, type KunciMenu } from '../navigasi';
import {
  jumlahPerTab, judulEntri, kelompokkanPerModul, LABEL_TAB, saringDaftar, statusTampil, TAB_STATUS, waktuRelatif,
  type GrupModul, type TabStatus,
} from '../ringkas';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';
import { EditorDiksi } from './EditorDiksi';

export function LayarMenu({ menu: kunci, tab }: { menu: KunciMenu; tab: IsiMenu }) {
  const { peran } = usePortal();
  const menu = menuDari(kunci)!;
  const bertab = menu.isi.length > 1 && kunci !== 'materi';
  const jenisBaru = kunci === 'materi' ? (['materi', 'modul'] as const) : tab === 'diksi' ? [] : [tab];
  return (
    <div>
      <p className="jejak-portal">{menu.grup} /</p>
      <div className="judul-halaman-portal">
        <h1>{menu.label}</h1>
        {peran !== 'reviewer' ? (
          <div className="tab-portal">
            {jenisBaru.map(jenis => (
              <a key={jenis} href={tulisRute({ layar: 'entriBaru', jenis })}>+ {LABEL_ISI[jenis]} baru</a>
            ))}
          </div>
        ) : null}
      </div>
      {bertab ? (
        <nav className="tab-portal" aria-label="Jenis">
          {menu.isi.map(isi => (
            <a key={isi} href={tulisRute({ layar: 'menu', menu: kunci, tab: isi })} aria-current={isi === tab ? 'page' : undefined}>{LABEL_ISI[isi]}</a>
          ))}
        </nav>
      ) : null}
      {tab === 'diksi' ? <EditorDiksi /> : <DaftarKonten key={tab} jenis={tab} menuMateri={kunci === 'materi'} />}
    </div>
  );
}

export function DaftarKonten({ jenis, menuMateri = false }: { jenis: JenisKonten; menuMateri?: boolean }) {
  const { repo } = usePortal();
  const [daftar, setDaftar] = useState<RingkasanEntri[] | null>(null);
  const [modul, setModul] = useState<RingkasanEntri[]>([]);
  const [galat, setGalat] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [tab, setTab] = useState<TabStatus>('semua');
  const [cari, setCari] = useState('');

  useEffect(() => {
    let dibatalkan = false;
    setGalat(null);
    Promise.all([repo.konten.daftarEntri(jenis), menuMateri ? repo.konten.daftarEntri('modul') : Promise.resolve([])])
      .then(([entri, daftarModul]) => { if (!dibatalkan) { setDaftar(entri); setModul(daftarModul); } })
      .catch(e => { if (!dibatalkan) setGalat(e instanceof Error ? e.message : String(e)); });
    return () => { dibatalkan = true; };
  }, [repo, jenis, menuMateri, muatUlang]);

  if (galat) return <p role="alert" className="galat-portal">{galat} <button type="button" onClick={() => setMuatUlang(n => n + 1)}>Coba lagi</button></p>;
  if (!daftar) return <div aria-busy="true"><div className="kerangka-abu" /><div className="kerangka-abu" /><div className="kerangka-abu" /></div>;

  const jumlah = jumlahPerTab(daftar);
  const tampil = saringDaftar(daftar, tab, cari);
  const sekarang = new Date();
  return (
    <div>
      <div className="tab-portal" role="group" aria-label="Status">
        {TAB_STATUS.map(t => (
          <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>{LABEL_TAB[t]} {jumlah[t]}</button>
        ))}
      </div>
      <div className="alat-portal">
        <label className="cari-portal">
          <Ikon nama="cari" ukuran={18} />
          <input type="search" aria-label="Cari" placeholder="Cari judul, slug, atau kode rujukan" value={cari} onChange={e => setCari(e.target.value)} />
        </label>
      </div>
      {daftar.length === 0 && !menuMateri ? <p className="kosong-portal">Belum ada {LABEL_ISI[jenis].toLowerCase()}. Buat entri pertama lewat tombol di atas.</p> : null}
      {daftar.length > 0 && tampil.length === 0 ? <p className="kosong-portal">Tidak ada yang cocok.</p> : null}
      {menuMateri
        ? kelompokkanPerModul(tampil, modul).map(grup => <GrupMateri key={grup.nomor ?? 'tanpa'} grup={grup} sekarang={sekarang} />)
        : tampil.length > 0 ? (
          <section className="grup-daftar" aria-label={LABEL_ISI[jenis]}>
            {tampil.map(entri => <BarisEntri key={entri.entriId} entri={entri} sekarang={sekarang} />)}
          </section>
        ) : null}
    </div>
  );
}

function GrupMateri({ grup, sekarang }: { grup: GrupModul; sekarang: Date }) {
  const label = grup.nomor === null ? grup.judul : `Modul ${grup.nomor}: ${grup.judul}`;
  return (
    <section className="grup-daftar" aria-label={label}>
      <div className="kepala-grup">
        <span className="nomor-grup">{grup.nomor ?? '–'}</span>
        <b>{grup.judul}</b>
        <span className="keterangan">{grup.materi.length} materi</span>
        {grup.modul ? (
          <a href={tulisRute({ layar: 'entri', entriId: grup.modul.entriId })} aria-label={`Edit modul ${grup.judul}`} style={{ marginLeft: 'auto' }}>
            <Ikon nama="pensil" ukuran={18} />
          </a>
        ) : null}
      </div>
      {grup.materi.length === 0 ? <p className="keterangan" style={{ padding: '10px 14px', margin: 0 }}>Belum ada materi.</p> : null}
      {grup.materi.map(entri => <BarisEntri key={entri.entriId} entri={entri} sekarang={sekarang} />)}
    </section>
  );
}

export function BarisEntri({ entri, sekarang, pegangan }: { entri: RingkasanEntri; sekarang: Date; pegangan?: ReactNode }) {
  const status = statusTampil(entri);
  const catatan = entri.revisiTerakhir?.status === 'dikembalikan' ? entri.revisiTerakhir.catatanReview : null;
  return (
    <div className="baris-entri">
      <span>{pegangan}</span>
      <span>
        <a href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{judulEntri(entri)}</a>
        {catatan ? <span className="catatan-baris">Catatan: {catatan}</span> : null}
      </span>
      <span><ChipStatus status={status} /></span>
      <span className="kolom-ref">{(entri.revisiTerakhir?.refs ?? []).map(kode => <span key={kode} className="chip-ref">{kode}</span>)}</span>
      <span className="keterangan kolom-waktu">{entri.revisiTerakhir ? waktuRelatif(entri.revisiTerakhir.dibuatPada, sekarang) : ''}</span>
    </div>
  );
}

function ChipStatus({ status }: { status: ReturnType<typeof statusTampil> }) {
  if (status === 'terbit + draf') return <><span className="chip-status terbit">Terbit</span> <span className="chip-status draf">+ draf</span></>;
  return <span className={`chip-status ${status}`}>{LABEL_TAB[status]}</span>;
}
```

`apps/admin/src/Portal.tsx`, di `IsiRute`: ganti cabang menu menjadi `if (rute.layar === 'menu') return <LayarMenu key={`${rute.menu}-${rute.tab}`} menu={rute.menu} tab={rute.tab} />;`, impor `LayarMenu` (bukan `DaftarKonten`) dari `./layar/DaftarKonten`, dan hapus impor `EditorDiksi` dari Portal bila tak terpakai lagi.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p .`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/layar/DaftarKonten.tsx apps/admin/src/Portal.tsx apps/admin/src/__tests__/daftar.test.tsx
git commit -m "admin: daftar konten bertab, cari, dan grup modul"
```

---

### Task 8: Seret urutan (+ tombol naik/turun, rollback)

**Files:**
- Modify: `apps/admin/src/layar/DaftarKonten.tsx` (`DaftarKonten`, `GrupMateri`)
- Test: `apps/admin/src/__tests__/urutan.test.tsx` (baru)

**Interfaces:**
- Consumes: `repo.editorial.aturUrutan(entriIds: string[])` (Task 2); `pindahkan` (Task 4); `BarisEntri` prop `pegangan` (Task 7).
- Produces: perilaku saja. Aturan:
  - Pegangan tampil hanya bila `peran !== 'reviewer'`, `tab === 'semua'`, dan `cari.trim() === ''`.
  - Pindah terjadi di dalam satu kelompok (satu modul pada menu materi, atau seluruh daftar pada menu lain).
  - Menu materi: yang dikirim ke `aturUrutan` adalah **semua** id materi, diratakan menurut urutan grup (modul 1, modul 2, …, "Tanpa modul") setelah perpindahan — supaya urutan global web tetap mengikuti urutan modul (Review Focus 1).
  - Sebelum menunggu repo, state `daftar` langsung diganti dengan urutan baru (nilai `urutan` diisi `(i+1)*10`); gagal → `daftar` dikembalikan ke salinan sebelumnya dan pesan galat tampil (`role="alert"`, teks "Urutan gagal disimpan: <pesan>").

- [ ] **Step 1: Tulis tes gagal** `apps/admin/src/__tests__/urutan.test.tsx`

```tsx
// Tes seret urutan: tombol turun memanggil aturUrutan dengan urutan baru, rollback saat gagal, pegangan hilang untuk
// reviewer / tab tersaring / saat mencari, dan materi mengirim urutan global rata per modul.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { LayarMenu } from '../layar/DaftarKonten';
import { DAFTAR_FAQ_UJI, SOAL_HITUNG_UJI } from './contoh';

async function siapkanFaq() {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'penulis' } });
  const a = await m.editorial.buatEntri('faq', 'a', 10);
  await m.editorial.buatDraf(a, 'faq', DAFTAR_FAQ_UJI[0]!, ['R05-1']);
  const b = await m.editorial.buatEntri('faq', 'b', 20);
  await m.editorial.buatDraf(b, 'faq', DAFTAR_FAQ_UJI[1]!, ['R05-1']);
  return { m, a, b };
}
const pasang = (m: ReturnType<typeof buatMemori>, peran: Peran, menu: 'faq' | 'materi' = 'faq') => render(
  <KonteksRepo.Provider value={{ repo: m, sesi: { userId: 'u1', email: 'a@x.id' }, peran }}>
    <LayarMenu menu={menu} tab={menu} />
  </KonteksRepo.Provider>,
);
const judulBaris = () => screen.getAllByRole('link').filter(el => el.getAttribute('href')?.startsWith('#/entri/')).map(el => el.textContent);

test('penulis: turunkan baris pertama → aturUrutan([b, a]) dan tampilan ikut', async () => {
  const { m, a, b } = await siapkanFaq();
  const mata = vi.spyOn(m.editorial, 'aturUrutan');
  pasang(m, 'penulis');
  fireEvent.click(await screen.findByRole('button', { name: 'Turunkan Apa itu tirkah?' }));
  expect(judulBaris()).toEqual(['Siapa ashabah?', 'Apa itu tirkah?']);
  await waitFor(() => expect(mata).toHaveBeenCalledWith([b, a]));
  expect((await m.konten.daftarEntri('faq')).map(e => e.slug)).toEqual(['b', 'a']);
});

test('gagal simpan → urutan kembali + pesan galat', async () => {
  const { m } = await siapkanFaq();
  m.editorial.aturUrutan = async () => { throw new Error('jaringan putus'); };
  pasang(m, 'penulis');
  fireEvent.click(await screen.findByRole('button', { name: 'Turunkan Apa itu tirkah?' }));
  expect(await screen.findByText(/Urutan gagal disimpan: jaringan putus/)).toBeTruthy();
  expect(judulBaris()).toEqual(['Apa itu tirkah?', 'Siapa ashabah?']);
});

test('reviewer, tab tersaring, atau sedang mencari → tanpa pegangan', async () => {
  const { m } = await siapkanFaq();
  const { unmount } = pasang(m, 'reviewer');
  await screen.findByText('Apa itu tirkah?');
  expect(screen.queryByRole('button', { name: /^Turunkan/ })).toBeNull();
  unmount();
  pasang(m, 'penulis');
  await screen.findByRole('button', { name: 'Turunkan Apa itu tirkah?' });
  fireEvent.click(screen.getByRole('button', { name: 'Draf 2' }));
  expect(screen.queryByRole('button', { name: /^Turunkan/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Semua 2' }));
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cari' }), { target: { value: 'tirkah' } });
  expect(screen.queryByRole('button', { name: /^Turunkan/ })).toBeNull();
});

test('seret (drop) memindah baris', async () => {
  const { m, a, b } = await siapkanFaq();
  const mata = vi.spyOn(m.editorial, 'aturUrutan');
  pasang(m, 'penulis');
  await screen.findByText('Apa itu tirkah?');
  const baris = screen.getAllByTestId('baris-seret');
  fireEvent.dragStart(baris[1]!);
  fireEvent.dragOver(baris[0]!);
  fireEvent.drop(baris[0]!);
  await waitFor(() => expect(mata).toHaveBeenCalledWith([b, a]));
});

test('materi: pindah di modul 2 mengirim semua materi rata per modul', async () => {
  const m = buatMemori({ refs: ['R05-1'], sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'admin' } });
  const buatModul = async (nomor: number) => {
    const id = await m.editorial.buatEntri('modul', `m${nomor}`, nomor * 10);
    await m.editorial.buatDraf(id, 'modul', { nomor, judul: `Modul ${nomor}`, ringkas: 'r' }, []);
  };
  await buatModul(1);
  await buatModul(2);
  const buatMateri = async (slug: string, modul: number, urutan: number) => {
    const id = await m.editorial.buatEntri('materi', slug, urutan);
    await m.editorial.buatDraf(id, 'materi', {
      slug, judul: slug.toUpperCase(), modul, urutan, tujuan: 't', perluCek: false,
      blok: [{ jenis: 'paragraf', isi: [{ jenis: 'rujukan', kode: 'R05-1' }] }],
    }, ['R05-1']);
    return id;
  };
  // Urutan global awal sengaja acak antar-modul: m2 dibuat duluan dengan urutan kecil.
  const x = await buatMateri('x', 2, 10);
  const y = await buatMateri('y', 2, 20);
  const p = await buatMateri('p', 1, 30);
  const mata = vi.spyOn(m.editorial, 'aturUrutan');
  pasang(m, 'admin', 'materi');
  const grup2 = await screen.findByRole('region', { name: 'Modul 2: Modul 2' });
  fireEvent.click(within(grup2).getByRole('button', { name: 'Turunkan X' }));
  await waitFor(() => expect(mata).toHaveBeenCalledWith([p, y, x]));
});
```

Catatan untuk tes materi: bila skema `materi` menolak isi di atas (field wajib lain), salin bentuk dari `PELAJARAN_UJI` (`{ ...PELAJARAN_UJI, slug, judul, modul, urutan }`) dan tambahkan semua kode ref `PELAJARAN_UJI` ke `refs` `buatMemori`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/admin test -- urutan`
Expected: FAIL, tombol "Turunkan …" tidak ditemukan.

- [ ] **Step 3: Implementasi** — perubahan di `apps/admin/src/layar/DaftarKonten.tsx`:

Impor tambahan: `import { pindahkan } from '../ringkas';` (gabungkan ke impor `../ringkas` yang ada).

Di `DaftarKonten`, setelah deklarasi state yang ada, tambahkan state & fungsi simpan, lalu teruskan ke daftar/grup:

```tsx
  const { peran } = usePortal();   // gabungkan dengan `const { repo } = usePortal();` → `const { repo, peran } = usePortal();`
  const [galatUrutan, setGalatUrutan] = useState<string | null>(null);

  const bolehSeret = peran !== 'reviewer' && tab === 'semua' && cari.trim() === '';

  /** Ganti isi satu kelompok dengan urutan barunya, lalu simpan. Materi dikirim utuh rata per modul supaya urutan
   * global web (pelajaran berikutnya) tetap mengikuti urutan modul. Gagal → kembalikan urutan lama. */
  async function simpanUrutan(kelompokLama: RingkasanEntri[], kelompokBaru: RingkasanEntri[]) {
    if (!daftar) return;
    const sebelum = daftar;
    const posisiLama = new Set(kelompokLama.map(entri => entri.entriId));
    let sisaBaru = [...kelompokBaru];
    const tersusun = daftar.map(entri => (posisiLama.has(entri.entriId) ? sisaBaru.shift()! : entri));
    const urutanKirim = menuMateri
      ? kelompokkanPerModul(tersusun, modul).flatMap(grup => grup.materi)
      : tersusun;
    setDaftar(urutanKirim.map((entri, indeks) => ({ ...entri, urutan: (indeks + 1) * 10 })));
    setGalatUrutan(null);
    try {
      await repo.editorial.aturUrutan(urutanKirim.map(entri => entri.entriId));
    } catch (e) {
      setDaftar(sebelum);
      setGalatUrutan(`Urutan gagal disimpan: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
```

(Catatan: `daftar` dari repo sudah terurut `urutan`; pada menu materi `kelompokkanPerModul` mempertahankan urutan dalam grup, jadi perataan per grup menghasilkan urutan modul 1, 2, …, "Tanpa modul".)

Tampilkan `galatUrutan` tepat di atas daftar: `{galatUrutan ? <p role="alert" className="galat-portal">{galatUrutan}</p> : null}`.

Ganti render daftar datar & grup agar memakai komponen `KelompokSeret`:

```tsx
      {menuMateri
        ? kelompokkanPerModul(tampil, modul).map(grup => (
          <GrupMateri key={grup.nomor ?? 'tanpa'} grup={grup} sekarang={sekarang} bolehSeret={bolehSeret} saatPindah={simpanUrutan} />
        ))
        : tampil.length > 0 ? (
          <section className="grup-daftar" aria-label={LABEL_ISI[jenis]}>
            <KelompokSeret daftar={tampil} sekarang={sekarang} bolehSeret={bolehSeret} saatPindah={simpanUrutan} />
          </section>
        ) : null}
```

`GrupMateri` menerima `bolehSeret` & `saatPindah` dan mengganti `grup.materi.map(… <BarisEntri …/>)` dengan
`<KelompokSeret daftar={grup.materi} sekarang={sekarang} bolehSeret={bolehSeret} saatPindah={saatPindah} />`.

Komponen baru di berkas yang sama (di bawah `GrupMateri`):

```tsx
type SaatPindah = (kelompokLama: RingkasanEntri[], kelompokBaru: RingkasanEntri[]) => void;

/** Satu kelompok yang bisa diurutkan: seret (HTML drag-and-drop bawaan) atau tombol naik/turun untuk keyboard. */
function KelompokSeret({ daftar, sekarang, bolehSeret, saatPindah }: {
  daftar: RingkasanEntri[]; sekarang: Date; bolehSeret: boolean; saatPindah: SaatPindah;
}) {
  const [diseret, setDiseret] = useState<number | null>(null);
  const pindah = (dari: number, ke: number) => { if (dari !== ke) void saatPindah(daftar, pindahkan(daftar, dari, ke)); };
  return (
    <>
      {daftar.map((entri, indeks) => {
        const judul = judulEntri(entri);
        const pegangan = bolehSeret ? (
          <span className="pegangan-seret">
            <Ikon nama="pegangan" ukuran={18} />
            <button type="button" aria-label={`Naikkan ${judul}`} disabled={indeks === 0} onClick={() => pindah(indeks, indeks - 1)}>
              <Ikon nama="naik" ukuran={16} />
            </button>
            <button type="button" aria-label={`Turunkan ${judul}`} disabled={indeks === daftar.length - 1} onClick={() => pindah(indeks, indeks + 1)}>
              <Ikon nama="turun" ukuran={16} />
            </button>
          </span>
        ) : undefined;
        if (!bolehSeret) return <BarisEntri key={entri.entriId} entri={entri} sekarang={sekarang} />;
        return (
          <div key={entri.entriId} data-testid="baris-seret" draggable className={diseret === indeks ? 'diseret' : undefined}
            onDragStart={e => { setDiseret(indeks); e.dataTransfer?.setData('text/plain', entri.entriId); }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (diseret !== null) pindah(diseret, indeks); setDiseret(null); }}
            onDragEnd={() => setDiseret(null)}>
            <BarisEntri entri={entri} sekarang={sekarang} pegangan={pegangan} />
          </div>
        );
      })}
    </>
  );
}
```

Tambahkan ke `admin.css`: `[data-testid="baris-seret"].diseret{opacity:.5}` (atau pakai kelas `.diseret` yang sudah ada dengan selektor `.diseret .baris-entri{opacity:.5}`).

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p .`
Expected: PASS semua tes admin (termasuk `daftar`, `kerangka`, `beranda`).

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/layar/DaftarKonten.tsx apps/admin/src/admin.css apps/admin/src/__tests__/urutan.test.tsx
git commit -m "admin: seret & naik/turun urutan tanpa revisi, rollback saat gagal"
```

---

### Task 9: Verifikasi menyeluruh di browser

**Files:**
- Modify: `.claude/launch.json` (tambah konfigurasi `admin`)

- [ ] **Step 1: Tambah konfigurasi preview admin**

Tambahkan ke array `configurations` di `.claude/launch.json`:

```json
{ "name": "admin", "runtimeExecutable": "pnpm", "runtimeArgs": ["--filter", "@waris/admin", "dev", "--port", "5174", "--strictPort"], "port": 5174 }
```

- [ ] **Step 2: Jalankan seluruh tes & build**

Run: `pnpm -r test && pnpm --filter @waris/admin build && pnpm db:tes`
Expected: semua PASS; build admin sukses.

- [ ] **Step 3: Cek di browser**

Pastikan Supabase lokal jalan (`pnpm db:mulai`) dan `apps/admin/.env.local` berisi `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` lokal. `preview_start {name: "admin"}`, masuk sebagai akun seed yang punya peran, lalu periksa:
- Beranda: 4 kartu angka, "Lanjutkan pekerjaan", tombol buat baru.
- Sidebar: grup & ikon, menu aktif, lencana antrean; lebar 375px → tombol Menu membuka laci, memilih menu menutupnya.
- Modul & Materi: grup per modul; turunkan satu materi → muat ulang halaman → urutan bertahan; status chip tidak berubah.
- Pustaka/Teks aplikasi: tab jenis; tab Diksi memuat editor diksi lama.
- `read_console_messages` tanpa galat. Ambil screenshot beranda & daftar materi sebagai bukti.

- [ ] **Step 4: Commit**

```bash
git add .claude/launch.json
git commit -m "chore: konfigurasi preview portal admin"
```
