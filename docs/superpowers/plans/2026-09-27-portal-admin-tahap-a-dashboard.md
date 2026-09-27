# Portal Admin Tahap A — Kerangka Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portal admin tampil sebagai dashboard rapi (sidebar berkelompok, beranda, daftar konten dengan tab/cari/grup modul) dan urutan entri bisa diatur dengan seret tanpa membuat revisi.

**Architecture:** Satu konstanta `MENU_PORTAL` memetakan menu → jenis konten dan dipakai sidebar, rute, dan daftar. Perhitungan (ringkasan beranda, saring tab/cari, grup modul, pindah urutan) berupa fungsi murni di `apps/admin/src/ringkas.ts`; komponen hanya menampilkan. Urutan disimpan lewat fungsi Postgres baru `atur_urutan` (security definer, hanya kolom `urutan`) yang dibungkus `RepositoriEditorial.aturUrutan`.

**Tech Stack:** React 18, Vite, Vitest + Testing Library (jsdom), `@waris/data` (memori & Supabase), Supabase Postgres + pgTAP, shadcn/ui (Tailwind v4 + Radix, warna dipetakan ke token Arif Waris v4), lucide-react, @dnd-kit.

**Spec:** `docs/superpowers/specs/2026-09-27-portal-admin-dashboard-design.md`

## Global Constraints

- Tanpa emoji di UI; ikon `lucide-react`, selalu disertai label teks (atau `aria-label` pada tombol ikon).
- Gaya: komponen shadcn/ui di `apps/admin/src/components/ui` + kelas Tailwind; warna hanya lewat variabel shadcn yang dipetakan ke token (`apps/admin/src/admin.css`), tanpa warna mentah.
- Dependency baru hanya di `apps/admin`: Tailwind v4, shadcn/Radix (lewat CLI), lucide-react, @dnd-kit. Paket lain tidak berubah.
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
| `apps/admin/components.json`, `src/components/ui/*`, `src/lib/utils.ts` (baru, CLI shadcn) | komponen UI |
| `apps/admin/src/admin.css` (baru) | Tailwind + pemetaan token ke variabel shadcn |
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
  export interface Menu { kunci: KunciMenu; label: string; grup: GrupMenu; ikon: LucideIcon; isi: readonly IsiMenu[] }
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

  Ikon = komponen `lucide-react` (`LucideIcon`); dependency dipasang di Step 3.

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

Pasang ikon: `pnpm --filter @waris/admin add lucide-react`.

`apps/admin/src/navigasi.ts`:

```ts
// Peta menu portal: satu sumber untuk sidebar (Kerangka), rute (#/menu/<kunci>/<tab>), dan daftar konten.
// Menerima JENIS_KONTEN + diksi, mengelompokkannya menjadi menu berlabel manusiawi (spec tahap A "Kerangka & navigasi").
// isi[0] = tab bawaan; menu materi menampilkan modul sebagai kepala grup, bukan tab.
import type { JenisKonten } from '@waris/content';
import { AppWindow, BookOpen, Calculator, CircleHelp, GraduationCap, Library, ListChecks, MessagesSquare, type LucideIcon } from 'lucide-react';

export type IsiMenu = JenisKonten | 'diksi';
export type KunciMenu = 'materi' | 'soal_kuis' | 'soal_hitung' | 'tanya_jawab' | 'faq' | 'pustaka' | 'kamus' | 'aplikasi';
export type GrupMenu = 'Belajar' | 'Bank soal' | 'Tanya jawab' | 'Pustaka' | 'Aplikasi';
export interface Menu { kunci: KunciMenu; label: string; grup: GrupMenu; ikon: LucideIcon; isi: readonly IsiMenu[] }

export const MENU_PORTAL: readonly Menu[] = [
  { kunci: 'materi', label: 'Modul & Materi', grup: 'Belajar', ikon: GraduationCap, isi: ['materi', 'modul'] },
  { kunci: 'soal_kuis', label: 'Soal kuis', grup: 'Bank soal', ikon: ListChecks, isi: ['soal_kuis'] },
  { kunci: 'soal_hitung', label: 'Soal hitung', grup: 'Bank soal', ikon: Calculator, isi: ['soal_hitung'] },
  { kunci: 'tanya_jawab', label: 'Kasus tanya jawab', grup: 'Tanya jawab', ikon: MessagesSquare, isi: ['tanya_jawab'] },
  { kunci: 'faq', label: 'FAQ', grup: 'Tanya jawab', ikon: CircleHelp, isi: ['faq'] },
  { kunci: 'pustaka', label: 'Kitab & syahid', grup: 'Pustaka', ikon: Library, isi: ['kitab', 'syahid'] },
  { kunci: 'kamus', label: 'Glosarium & ahwal', grup: 'Pustaka', ikon: BookOpen, isi: ['glosarium_ar', 'ahwal'] },
  { kunci: 'aplikasi', label: 'Teks aplikasi', grup: 'Aplikasi', ikon: AppWindow, isi: ['teks_edukasi', 'diksi', 'cheatsheet'] },
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
git add apps/admin/src/navigasi.ts apps/admin/src/rute.ts apps/admin/src/Portal.tsx apps/admin/src/__tests__/navigasi.test.ts apps/admin/src/__tests__/rute.test.ts apps/admin/package.json pnpm-lock.yaml
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

### Task 5: Pasang shadcn/ui + kerangka (sidebar, laci, akun)

**Files:**
- Modify: `apps/admin/package.json` (dependency baru), `apps/admin/vite.config.ts` (plugin Tailwind, alias `@`, `setupFiles`), `apps/admin/tsconfig.json` (`baseUrl`/`paths` `@/*`)
- Create: `apps/admin/components.json`, `apps/admin/src/lib/utils.ts`, `apps/admin/src/components/ui/*` (hasil CLI shadcn), `apps/admin/src/hooks/use-mobile.ts` (hasil CLI)
- Create: `apps/admin/src/admin.css` (Tailwind + pemetaan token), `apps/admin/src/__tests__/siapkan.ts` (polyfill jsdom)
- Create: `apps/admin/src/Kerangka.tsx`
- Modify: `apps/admin/src/main.tsx` (impor `./admin.css`), `apps/admin/src/Portal.tsx` (hapus `NavigasiPortal`; bungkus rute dengan `Kerangka`)
- Test: `apps/admin/src/__tests__/kerangka.test.tsx` (baru), `apps/admin/src/__tests__/gerbang.test.tsx`

**Interfaces:**
- Consumes: `MENU_PORTAL`, `GrupMenu`, `menuUntukJenis` (Task 3); `Rute`, `tulisRute` (Task 3).
- Produces:
  ```tsx
  export function Kerangka(props: { rute: Rute; onKeluar: () => void; children: ReactNode }): JSX.Element
  export function menuAktif(rute: Rute, menuTerakhir: KunciMenu | null): 'beranda' | 'review' | 'peran' | KunciMenu | null
  ```
  Komponen shadcn yang tersedia untuk Task 6–8: `button`, `card`, `badge`, `input`, `tabs`, `skeleton`, `alert`, `sidebar` (+ `sheet`, `separator`, `tooltip` yang ditarik `sidebar`), impor dari `@/components/ui/<nama>`.

- [ ] **Step 1: Pasang Tailwind v4 + shadcn**

```bash
pnpm --filter @waris/admin add tailwindcss @tailwindcss/vite lucide-react class-variance-authority clsx tailwind-merge
pnpm --filter @waris/admin add -D @types/node
```

`apps/admin/tsconfig.json` → tambah di `compilerOptions`: `"baseUrl": ".", "paths": { "@/*": ["./src/*"] }`.

`apps/admin/vite.config.ts`:

```ts
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { target: 'es2022' },  // top-level await di main.tsx
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/__tests__/siapkan.ts'] },  // globals: Testing Library membersihkan DOM antar test
});
```

`apps/admin/src/admin.css` (sementara, CLI menambah variabel):

```css
@import "tailwindcss";
```

Lalu dari `apps/admin`:

```bash
pnpm dlx shadcn@latest init -b neutral --css-variables
pnpm dlx shadcn@latest add button card badge input tabs skeleton alert sidebar
```

Bila CLI bertanya lokasi CSS: `src/admin.css`; alias komponen `@/components`. Setelah selesai, pastikan `components.json`, `src/lib/utils.ts`, `src/components/ui/*`, `src/hooks/use-mobile.ts` ada dan dependency Radix ditambahkan ke `package.json`.

- [ ] **Step 2: Petakan token Arif Waris ke variabel shadcn**

Di `apps/admin/src/admin.css`, ganti nilai variabel `:root` hasil CLI dengan token (blok `.dark` hapus; token web sudah menangani mode gelap). Buka komentar pembuka berkas:

```css
/* Gaya portal admin: Tailwind + shadcn/ui, warnanya dipetakan ke token Arif Waris v4 (token.css web) supaya
   portal dan web satu identitas. Hanya var(--…) token, tanpa warna mentah. */
:root {
  --background: var(--surface);
  --foreground: var(--ink);
  --card: var(--surface-raised);
  --card-foreground: var(--ink);
  --popover: var(--surface-raised);
  --popover-foreground: var(--ink);
  --primary: var(--primary);   /* lihat catatan di bawah */
  --primary-foreground: var(--on-fill);
  --secondary: var(--surface-sunken);
  --secondary-foreground: var(--ink);
  --muted: var(--surface-sunken);
  --muted-foreground: var(--ink-muted);
  --accent: var(--primary-soft);
  --accent-foreground: var(--ink);
  --destructive: var(--danger);
  --border: var(--outline);
  --input: var(--outline);
  --ring: var(--focus);
  --radius: var(--radius-md);
  --sidebar: var(--surface-raised);
  --sidebar-foreground: var(--ink);
  --sidebar-primary: var(--primary);
  --sidebar-primary-foreground: var(--on-fill);
  --sidebar-accent: var(--primary-soft);
  --sidebar-accent-foreground: var(--ink);
  --sidebar-border: var(--outline);
  --sidebar-ring: var(--focus);
}
body { font-family: var(--font-sans); }
```

Catatan: shadcn dan token web sama-sama memakai nama `--primary`/`--border`. Cek dulu nama token di `apps/web/src/gaya/token.css`; bila bentrok (variabel menunjuk dirinya sendiri), jangan tulis `--primary: var(--primary)` — biarkan baris itu dihapus sehingga nilai token web yang dipakai langsung. Hapus baris lain yang namanya sama persis dengan token web dengan alasan yang sama. Token yang tidak ada di `token.css` (mis. `--danger`) diganti dengan token terdekat yang ada; jangan menulis warna mentah.

- [ ] **Step 3: Polyfill jsdom** `apps/admin/src/__tests__/siapkan.ts`

```ts
// Polyfill jsdom untuk komponen shadcn/Radix: matchMedia (hook use-mobile sidebar) dan ResizeObserver.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
```

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p .`
Expected: tes lama tetap PASS (pemasangan tidak mengubah perilaku). Commit langkah pasang:

```bash
git add apps/admin/package.json apps/admin/vite.config.ts apps/admin/tsconfig.json apps/admin/components.json apps/admin/src/lib apps/admin/src/components apps/admin/src/hooks apps/admin/src/admin.css apps/admin/src/__tests__/siapkan.ts pnpm-lock.yaml
git commit -m "admin: pasang Tailwind v4 + shadcn/ui, token Arif Waris"
```

- [ ] **Step 4: Tulis tes gagal** `apps/admin/src/__tests__/kerangka.test.tsx`

```tsx
// Tes Kerangka: sidebar berkelompok per peran, lencana antrean, menu aktif, laci layar sempit.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { Kerangka, menuAktif } from '../Kerangka';
import type { Rute } from '../rute';
import { DAFTAR_FAQ_UJI } from './contoh';

const LEBAR_AWAL = window.innerWidth;
afterEach(() => { window.innerWidth = LEBAR_AWAL; });

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

test('layar sempit: tombol Menu membuka laci, memilih menu menutupnya', async () => {
  window.innerWidth = 500;
  await pasang('admin');
  expect(screen.queryByRole('link', { name: /FAQ/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
  const laci = await screen.findByRole('dialog');
  fireEvent.click(within(laci).getByRole('link', { name: /FAQ/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
```

Di `gerbang.test.tsx`: bila tes `'peran ada → tombol keluar di navigasi'` menemukan lebih dari satu tombol, ganti pencarinya menjadi `findByRole('button', { name: 'Keluar' })`.

- [ ] **Step 5: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/admin test -- kerangka`
Expected: FAIL, `Cannot find module '../Kerangka'`.

- [ ] **Step 6: Implementasi** `apps/admin/src/Kerangka.tsx`

```tsx
// Kerangka portal (spec tahap A "Kerangka & navigasi") di atas Sidebar shadcn: menu berkelompok dari MENU_PORTAL,
// lencana antrean review, email + peran + Keluar di kaki sidebar, isi layar di kanan. Layar sempit: sidebar jadi
// laci (Sheet) lewat tombol Menu dan menutup setelah memilih menu. Layar entri menyorot menu terakhir yang dibuka.
import { useEffect, useState, type ReactNode } from 'react';
import { House, Inbox, LogOut, Menu as IkonMenu, Users, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar,
} from '@/components/ui/sidebar';
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
  return (
    <SidebarProvider>
      <SisiPortal rute={rute} onKeluar={onKeluar} />
      <SidebarInset>
        <KepalaSempit />
        <main className="w-full max-w-6xl p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function KepalaSempit() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="flex items-center gap-3 border-b px-4 py-2 md:hidden">
      <Button variant="outline" size="sm" onClick={toggleSidebar}><IkonMenu />Menu</Button>
      <b>Arif Waris</b>
    </header>
  );
}

function SisiPortal({ rute, onKeluar }: { rute: Rute; onKeluar: () => void }) {
  const { repo, sesi, peran } = usePortal();
  const { setOpenMobile } = useSidebar();
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
  const tautan = (kunci: KunciAktif, href: string, Ikon: LucideIcon, label: string, lencana?: number) => (
    <SidebarMenuItem key={String(kunci)}>
      <SidebarMenuButton asChild isActive={aktif === kunci}>
        <a href={href} aria-current={aktif === kunci ? 'page' : undefined} onClick={() => setOpenMobile(false)}>
          <Ikon /><span>{label}</span>
        </a>
      </SidebarMenuButton>
      {lencana ? <SidebarMenuBadge aria-label={`${lencana} menunggu review`}>{lencana}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1 font-bold">Arif Waris<small className="block font-semibold text-muted-foreground">Portal Konten</small></div>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Navigasi portal">
          <SidebarGroup>
            <SidebarMenu>
              {tautan('beranda', tulisRute({ layar: 'beranda' }), House, 'Beranda')}
              {tautan('review', tulisRute({ layar: 'review' }), Inbox, 'Antrean review', jumlahAntrean)}
            </SidebarMenu>
          </SidebarGroup>
          {URUTAN_GRUP.map(grup => (
            <SidebarGroup key={grup}>
              <SidebarGroupLabel>{grup}</SidebarGroupLabel>
              <SidebarMenu>
                {MENU_PORTAL.filter(menu => menu.grup === grup).map(menu =>
                  tautan(menu.kunci, tulisRute({ layar: 'menu', menu: menu.kunci, tab: menu.isi[0]! }), menu.ikon, menu.label))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
          {peran === 'admin' ? (
            <SidebarGroup><SidebarMenu>{tautan('peran', tulisRute({ layar: 'peran' }), Users, 'Peran')}</SidebarMenu></SidebarGroup>
          ) : null}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="font-semibold break-all">{sesi.email}</span>
        <span className="text-sm text-muted-foreground">{LABEL_PERAN[peran]}</span>
        <Button variant="outline" size="sm" onClick={onKeluar}><LogOut />Keluar</Button>
      </SidebarFooter>
    </Sidebar>
  );
}
```

`apps/admin/src/main.tsx`: tambahkan `import './admin.css';` setelah dua impor CSS web (urutan ini membuat variabel shadcn menimpa nilai yang sama namanya).

`apps/admin/src/Portal.tsx`: hapus `NavigasiPortal` dan impor yang tak terpakai; cabang siap jadi:

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

(impor `Kerangka` dari `./Kerangka`, `usePortal` dari `./repo`, `type Rute` dari `./rute`; `Tombol` tetap untuk layar tamu/tanpa peran.)

- [ ] **Step 7: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p .`
Expected: PASS. Bila tes laci gagal karena `use-mobile` membaca lebar hanya lewat `matchMedia`, sesuaikan polyfill (`matches` = `window.innerWidth < 768` untuk query `max-width`), bukan komponennya.

- [ ] **Step 8: Commit**

```bash
git add apps/admin/src/Kerangka.tsx apps/admin/src/main.tsx apps/admin/src/Portal.tsx apps/admin/src/__tests__/kerangka.test.tsx apps/admin/src/__tests__/gerbang.test.tsx
git commit -m "admin: kerangka dashboard dengan sidebar shadcn & laci"
```

---

### Task 6: Beranda

**Files:**
- Create: `apps/admin/src/layar/Beranda.tsx`
- Modify: `apps/admin/src/Portal.tsx` (`IsiRute`: `beranda` → `<Beranda />`, hapus `<p>Segera</p>`)
- Test: `apps/admin/src/__tests__/beranda.test.tsx` (baru)

**Interfaces:**
- Consumes: `ringkasBeranda`, `judulEntri`, `statusTampil`, `waktuRelatif`, `RingkasanBeranda` (Task 4); `LABEL_ISI` (Task 3); `tulisRute` (Task 3); `Card`, `Badge`, `Button`, `Skeleton`, `Alert` (Task 5).
- Produces: `export function Beranda(): JSX.Element`; `export function ChipStatus(props: { status: StatusTampil }): JSX.Element` (dipakai ulang Task 7).

- [ ] **Step 1: Tulis tes gagal** `apps/admin/src/__tests__/beranda.test.tsx`

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
// untuk admin/penulis. Galat repo tampil sebagai Alert dengan tombol coba lagi.
import { useEffect, useState } from 'react';
import { JENIS_KONTEN, type JenisKonten } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LABEL_ISI } from '../navigasi';
import { judulEntri, LABEL_TAB, ringkasBeranda, statusTampil, waktuRelatif, type RingkasanBeranda, type StatusTampil } from '../ringkas';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assalamu'alaikum, {sesi.email.split('@')[0]}</h1>
        <p className="text-muted-foreground">{LABEL_PERAN[peran]}</p>
      </div>
      {galat ? <PesanGalat pesan={galat} onCobaLagi={() => setMuatUlang(n => n + 1)} /> : null}
      {!ringkasan && !galat ? <div className="space-y-2"><Skeleton className="h-24" /><Skeleton className="h-48" /></div> : null}
      {ringkasan ? <IsiBeranda ringkasan={ringkasan} reviewer={peran === 'reviewer'} /> : null}
    </div>
  );
}

export function PesanGalat({ pesan, onCobaLagi }: { pesan: string; onCobaLagi: () => void }) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription className="flex items-center justify-between gap-3">
        {pesan}<Button variant="outline" size="sm" onClick={onCobaLagi}>Coba lagi</Button>
      </AlertDescription>
    </Alert>
  );
}

export function ChipStatus({ status }: { status: StatusTampil }) {
  if (status === 'terbit + draf') return <span className="inline-flex gap-1"><Badge>Terbit</Badge><Badge variant="secondary">+ draf</Badge></span>;
  const varian = status === 'terbit' ? 'default' : status === 'dikembalikan' ? 'destructive' : status === 'diajukan' ? 'outline' : 'secondary';
  return <Badge variant={varian}>{LABEL_TAB[status]}</Badge>;
}

function IsiBeranda({ ringkasan, reviewer }: { ringkasan: RingkasanBeranda; reviewer: boolean }) {
  const sekarang = new Date();
  const daftarUtama = reviewer ? ringkasan.antreanTertua : ringkasan.lanjutkan;
  const judulDaftar = reviewer ? 'Menunggu review' : 'Lanjutkan pekerjaan';
  return (
    <>
      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KartuAngka label="Draf saya" angka={ringkasan.drafSaya} />
        <KartuAngka label="Menunggu review" angka={ringkasan.menungguReview} />
        <KartuAngka label="Dikembalikan ke saya" angka={ringkasan.dikembalikanKeSaya} peringatan={ringkasan.dikembalikanKeSaya > 0} />
        <KartuAngka label="Terbit" angka={ringkasan.terbit} />
      </section>
      <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
        <Card aria-label={judulDaftar} role="region">
          <CardHeader><CardTitle>{judulDaftar}</CardTitle></CardHeader>
          <CardContent>
            {daftarUtama.length === 0 ? <p className="text-muted-foreground">Tidak ada yang tertunda.</p> : (
              <ul className="divide-y">{daftarUtama.map(entri => <BarisBeranda key={entri.entriId} entri={entri} sekarang={sekarang} />)}</ul>
            )}
            {reviewer ? <a className="font-semibold underline" href={tulisRute({ layar: 'review' })}>Buka antrean review</a> : null}
          </CardContent>
        </Card>
        {reviewer ? null : (
          <Card aria-label="Buat baru" role="region">
            <CardHeader><CardTitle>Buat baru</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {JENIS_BUAT_BARU.map(jenis => (
                <Button key={jenis} variant="outline" size="sm" asChild>
                  <a href={tulisRute({ layar: 'entriBaru', jenis })}>+ {LABEL_ISI[jenis]}</a>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function KartuAngka({ label, angka, peringatan }: { label: string; angka: number; peringatan?: boolean }) {
  return (
    <Card className={peringatan ? 'border-destructive' : undefined}>
      <CardContent className="pt-6">
        <div className="text-3xl font-bold">{angka}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function BarisBeranda({ entri, sekarang }: { entri: RingkasanEntri; sekarang: Date }) {
  const catatan = entri.revisiTerakhir?.catatanReview;
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="min-w-0 flex-1">
        <a className="font-semibold hover:underline" href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{judulEntri(entri)}</a>
        <span className="block text-sm text-muted-foreground">{LABEL_ISI[entri.jenis]}</span>
        {catatan ? <span className="block text-sm text-muted-foreground">{catatan}</span> : null}
      </span>
      <ChipStatus status={statusTampil(entri)} />
      <span className="hidden text-sm text-muted-foreground md:inline">
        {entri.revisiTerakhir ? waktuRelatif(entri.revisiTerakhir.dibuatPada, sekarang) : ''}
      </span>
    </li>
  );
}
```

Catatan: `LABEL_TAB` diindeks dengan `StatusTampil` selain `'terbit + draf'` — keempat nilai itu juga kunci `TabStatus`, jadi tipe lolos setelah penyempitan; bila tidak, pakai `LABEL_TAB[status as TabStatus]`.

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
- Modify: `apps/admin/src/Portal.tsx` (`IsiRute` cabang menu → `LayarMenu`)
- Test: `apps/admin/src/__tests__/daftar.test.tsx` (tulis ulang)

**Interfaces:**
- Consumes: Task 3 (`menuDari`, `LABEL_ISI`, `KunciMenu`, `IsiMenu`, `tulisRute`), Task 4 (`saringDaftar`, `jumlahPerTab`, `kelompokkanPerModul`, `statusTampil`, `judulEntri`, `waktuRelatif`, `TAB_STATUS`, `LABEL_TAB`, `TabStatus`, `GrupModul`), Task 6 (`ChipStatus`, `PesanGalat`), shadcn `Tabs`, `Input`, `Card`, `Button`, `Skeleton`.
- Produces:
  ```tsx
  export function LayarMenu(props: { menu: KunciMenu; tab: IsiMenu }): JSX.Element
  export function DaftarKonten(props: { jenis: JenisKonten; menuMateri?: boolean }): JSX.Element
  export function BarisEntri(props: { entri: RingkasanEntri; sekarang: Date; pegangan?: ReactNode }): JSX.Element
  ```
  Tab status = shadcn `Tabs` (role `tab`, nama "Draf 1"); tab jenis menu bertab = tautan bergaya tombol dengan `aria-current`.

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

// Radix Tabs berpindah pada mouseDown (bukan click) di jsdom.
const pilihTab = (nama: string) => fireEvent.mouseDown(screen.getByRole('tab', { name: nama }), { button: 0 });

test('tab status dengan jumlah menyaring baris', async () => {
  pasang(await siapkan(), 'faq', 'faq');
  await screen.findByText('Apa itu tirkah?');
  pilihTab('Draf 1');
  expect(screen.queryByText('Apa itu tirkah?')).toBeNull();
  expect(screen.getByText('Siapa ashabah?')).toBeTruthy();
  pilihTab('Terbit 1');
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

Catatan tes materi: bila `buatDraf` menolak ref tak dikenal, isi `refs` `buatMemori` dengan semua kode ref di `PELAJARAN_UJI` (`JSON.stringify(PELAJARAN_UJI).match(/R\d\d-\d+/g)`). Bila `mouseDown` tidak memindah tab Radix di versi terpasang, pakai `userEvent.click` bila `@testing-library/user-event` sudah ada, atau `fireEvent.mouseDown` + `fireEvent.click` — jangan mengganti Tabs dengan tombol biasa.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/admin test -- daftar`
Expected: FAIL, `LayarMenu` tidak diekspor.

- [ ] **Step 3: Implementasi** — ganti seluruh isi `apps/admin/src/layar/DaftarKonten.tsx`:

```tsx
// Layar menu konten (spec tahap A "Daftar konten"): kepala (jejak grup, judul menu, tombol buat baru), tab jenis
// untuk menu bertab, lalu daftar entri dengan tab status + jumlah, cari (judul/slug/ref), dan baris berstatus.
// Menu materi mengelompokkan materi di bawah modulnya. Data dari repo.konten.daftarEntri; perhitungan di ringkas.ts.
import { useEffect, useState, type ReactNode } from 'react';
import { Pencil, Search } from 'lucide-react';
import type { JenisKonten } from '@waris/content';
import type { RingkasanEntri } from '@waris/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LABEL_ISI, menuDari, type IsiMenu, type KunciMenu } from '../navigasi';
import {
  jumlahPerTab, judulEntri, kelompokkanPerModul, LABEL_TAB, saringDaftar, statusTampil, TAB_STATUS, waktuRelatif,
  type GrupModul, type TabStatus,
} from '../ringkas';
import { usePortal } from '../repo';
import { tulisRute } from '../rute';
import { ChipStatus, PesanGalat } from './Beranda';
import { EditorDiksi } from './EditorDiksi';

export function LayarMenu({ menu: kunci, tab }: { menu: KunciMenu; tab: IsiMenu }) {
  const { peran } = usePortal();
  const menu = menuDari(kunci)!;
  const bertab = menu.isi.length > 1 && kunci !== 'materi';
  const jenisBaru = kunci === 'materi' ? (['materi', 'modul'] as const) : tab === 'diksi' ? [] : [tab];
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{menu.grup} /</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{menu.label}</h1>
          {peran !== 'reviewer' ? (
            <div className="flex gap-2">
              {jenisBaru.map(jenis => (
                <Button key={jenis} size="sm" asChild><a href={tulisRute({ layar: 'entriBaru', jenis })}>+ {LABEL_ISI[jenis]} baru</a></Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {bertab ? (
        <nav aria-label="Jenis" className="flex gap-2">
          {menu.isi.map(isi => (
            <Button key={isi} size="sm" variant={isi === tab ? 'default' : 'outline'} asChild>
              <a href={tulisRute({ layar: 'menu', menu: kunci, tab: isi })} aria-current={isi === tab ? 'page' : undefined}>{LABEL_ISI[isi]}</a>
            </Button>
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

  if (galat) return <PesanGalat pesan={galat} onCobaLagi={() => setMuatUlang(n => n + 1)} />;
  if (!daftar) return <div aria-busy="true" className="space-y-2"><Skeleton className="h-11" /><Skeleton className="h-11" /><Skeleton className="h-11" /></div>;

  const jumlah = jumlahPerTab(daftar);
  const tampil = saringDaftar(daftar, tab, cari);
  const sekarang = new Date();
  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={nilai => setTab(nilai as TabStatus)}>
        <TabsList aria-label="Status">
          {TAB_STATUS.map(t => <TabsTrigger key={t} value={t}>{LABEL_TAB[t]} {jumlah[t]}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input type="search" aria-label="Cari" className="pl-9" placeholder="Cari judul, slug, atau kode rujukan"
          value={cari} onChange={e => setCari(e.target.value)} />
      </label>
      {daftar.length === 0 && !menuMateri ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Belum ada {LABEL_ISI[jenis].toLowerCase()}. Buat entri pertama lewat tombol di atas.
        </p>
      ) : null}
      {daftar.length > 0 && tampil.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Tidak ada yang cocok.</p> : null}
      {menuMateri
        ? kelompokkanPerModul(tampil, modul).map(grup => <GrupMateri key={grup.nomor ?? 'tanpa'} grup={grup} sekarang={sekarang} />)
        : tampil.length > 0 ? (
          <Card role="region" aria-label={LABEL_ISI[jenis]} className="gap-0 divide-y py-0">
            {tampil.map(entri => <BarisEntri key={entri.entriId} entri={entri} sekarang={sekarang} />)}
          </Card>
        ) : null}
    </div>
  );
}

function GrupMateri({ grup, sekarang }: { grup: GrupModul; sekarang: Date }) {
  const label = grup.nomor === null ? grup.judul : `Modul ${grup.nomor}: ${grup.judul}`;
  return (
    <Card role="region" aria-label={label} className="gap-0 divide-y py-0">
      <div className="flex items-center gap-3 bg-muted px-4 py-2">
        <Badge variant="outline">{grup.nomor ?? '–'}</Badge>
        <b>{grup.judul}</b>
        <span className="text-sm text-muted-foreground">{grup.materi.length} materi</span>
        {grup.modul ? (
          <Button variant="ghost" size="icon" className="ml-auto" asChild>
            <a href={tulisRute({ layar: 'entri', entriId: grup.modul.entriId })} aria-label={`Edit modul ${grup.judul}`}><Pencil /></a>
          </Button>
        ) : null}
      </div>
      {grup.materi.length === 0 ? <p className="px-4 py-2 text-sm text-muted-foreground">Belum ada materi.</p> : null}
      {grup.materi.map(entri => <BarisEntri key={entri.entriId} entri={entri} sekarang={sekarang} />)}
    </Card>
  );
}

export function BarisEntri({ entri, sekarang, pegangan }: { entri: RingkasanEntri; sekarang: Date; pegangan?: ReactNode }) {
  const catatan = entri.revisiTerakhir?.status === 'dikembalikan' ? entri.revisiTerakhir.catatanReview : null;
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-2">
      {pegangan}
      <span className="min-w-0 flex-1">
        <a className="font-semibold hover:underline" href={tulisRute({ layar: 'entri', entriId: entri.entriId })}>{judulEntri(entri)}</a>
        {catatan ? <span className="block text-sm text-muted-foreground">Catatan: {catatan}</span> : null}
      </span>
      <ChipStatus status={statusTampil(entri)} />
      <span className="hidden gap-1 md:flex">
        {(entri.revisiTerakhir?.refs ?? []).map(kode => <Badge key={kode} variant="secondary" className="font-mono">{kode}</Badge>)}
      </span>
      <span className="hidden text-sm text-muted-foreground md:inline">
        {entri.revisiTerakhir ? waktuRelatif(entri.revisiTerakhir.dibuatPada, sekarang) : ''}
      </span>
    </div>
  );
}
```

`apps/admin/src/Portal.tsx`, `IsiRute`: `if (rute.layar === 'menu') return <LayarMenu key={`${rute.menu}-${rute.tab}`} menu={rute.menu} tab={rute.tab} />;`, impor `LayarMenu` (bukan `DaftarKonten`), hapus impor `EditorDiksi` bila tak terpakai.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p .`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/layar/DaftarKonten.tsx apps/admin/src/Portal.tsx apps/admin/src/__tests__/daftar.test.tsx
git commit -m "admin: daftar konten bertab, cari, dan grup modul"
```

---

### Task 8: Seret urutan (@dnd-kit + tombol naik/turun, rollback)

**Files:**
- Modify: `apps/admin/package.json` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- Modify: `apps/admin/src/ringkas.ts` (`indeksSeret`)
- Modify: `apps/admin/src/layar/DaftarKonten.tsx` (`DaftarKonten`, `GrupMateri`, komponen `KelompokSeret`, `BarisSeret`)
- Test: `apps/admin/src/__tests__/urutan.test.tsx` (baru), `apps/admin/src/__tests__/ringkas.test.ts`

**Interfaces:**
- Consumes: `repo.editorial.aturUrutan(entriIds: string[])` (Task 2); `pindahkan` (Task 4); `BarisEntri` prop `pegangan` (Task 7).
- Produces: `export function indeksSeret(ids: readonly string[], aktif: string, tujuan: string | null): [number, number] | null` di `ringkas.ts` (null bila tujuan kosong/sama/tak dikenal). Aturan perilaku:
  - Pegangan & tombol hanya bila `peran !== 'reviewer'`, `tab === 'semua'`, `cari.trim() === ''`.
  - Pindah terjadi di dalam satu kelompok (satu modul, atau seluruh daftar datar); tiap kelompok satu `SortableContext`.
  - Menu materi: `aturUrutan` menerima **semua** id materi diratakan per grup (modul 1, 2, …, "Tanpa modul") (Review Focus 1).
  - `daftar` langsung diganti urutan baru (`urutan = (i+1)*10`); gagal → kembali ke salinan lama + `role="alert"` "Urutan gagal disimpan: <pesan>".
- Seret pointer/sentuh/keyboard dari @dnd-kit diuji lewat `indeksSeret` (jsdom tidak punya tata letak, jadi seret nyata dicek di Task 9); tombol naik/turun diuji sebagai komponen.

- [ ] **Step 1: Tulis tes gagal**

Tambahkan ke `apps/admin/src/__tests__/ringkas.test.ts` (dan `indeksSeret` ke impornya):

```ts
test('indeksSeret: posisi asal & tujuan, null bila tak berpindah', () => {
  expect(indeksSeret(['a', 'b', 'c'], 'a', 'c')).toEqual([0, 2]);
  expect(indeksSeret(['a', 'b', 'c'], 'c', 'a')).toEqual([2, 0]);
  expect(indeksSeret(['a', 'b'], 'a', 'a')).toBeNull();
  expect(indeksSeret(['a', 'b'], 'a', null)).toBeNull();
  expect(indeksSeret(['a', 'b'], 'a', 'x')).toBeNull();
});
```

`apps/admin/src/__tests__/urutan.test.tsx`:

```tsx
// Tes urutan: tombol turun memanggil aturUrutan dengan urutan baru, rollback saat gagal, pegangan hilang untuk
// reviewer / tab tersaring / saat mencari, dan materi mengirim urutan global rata per modul.
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori } from '@waris/data';
import type { Peran } from '@waris/content';
import { KonteksRepo } from '../repo';
import { LayarMenu } from '../layar/DaftarKonten';
import { DAFTAR_FAQ_UJI } from './contoh';

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
  expect(screen.queryByRole('button', { name: /^Seret/ })).toBeNull();
  unmount();
  pasang(m, 'penulis');
  await screen.findByRole('button', { name: 'Turunkan Apa itu tirkah?' });
  expect(screen.getByRole('button', { name: 'Seret Apa itu tirkah?' })).toBeTruthy();
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Draf 2' }), { button: 0 });
  expect(screen.queryByRole('button', { name: /^Turunkan/ })).toBeNull();
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Semua 2' }), { button: 0 });
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cari' }), { target: { value: 'tirkah' } });
  expect(screen.queryByRole('button', { name: /^Turunkan/ })).toBeNull();
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
  // Urutan global awal sengaja acak antar-modul: materi modul 2 dibuat duluan dengan urutan kecil.
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

Catatan tes materi: bila skema `materi` menolak isi di atas, salin bentuk `PELAJARAN_UJI` (`{ ...PELAJARAN_UJI, slug, judul, modul, urutan }`) dan tambahkan kode refnya ke `refs` `buatMemori`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `pnpm --filter @waris/admin add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities && pnpm --filter @waris/admin test -- urutan ringkas`
Expected: FAIL — `indeksSeret` tidak diekspor; tombol "Turunkan …" tidak ditemukan.

- [ ] **Step 3: Implementasi**

`apps/admin/src/ringkas.ts`, setelah `pindahkan`:

```ts
/** Hasil seret @dnd-kit (id aktif → id tujuan) sebagai pasangan indeks untuk pindahkan; null bila tidak berpindah. */
export function indeksSeret(ids: readonly string[], aktif: string, tujuan: string | null): [number, number] | null {
  const dari = ids.indexOf(aktif);
  const ke = tujuan === null ? -1 : ids.indexOf(tujuan);
  return dari < 0 || ke < 0 || dari === ke ? null : [dari, ke];
}
```

`apps/admin/src/layar/DaftarKonten.tsx`:

Impor tambahan:

```tsx
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
// gabungkan ke impor ../ringkas: indeksSeret, pindahkan
```

Di `DaftarKonten`: `const { repo, peran } = usePortal();`, lalu setelah state lain:

```tsx
  const [galatUrutan, setGalatUrutan] = useState<string | null>(null);
  const bolehSeret = peran !== 'reviewer' && tab === 'semua' && cari.trim() === '';

  /** Ganti isi satu kelompok dengan urutan barunya, lalu simpan. Materi dikirim utuh rata per modul supaya urutan
   * global web (pelajaran berikutnya) tetap mengikuti urutan modul. Gagal → kembalikan urutan lama. */
  async function simpanUrutan(kelompokLama: RingkasanEntri[], kelompokBaru: RingkasanEntri[]) {
    if (!daftar) return;
    const sebelum = daftar;
    const anggotaKelompok = new Set(kelompokLama.map(entri => entri.entriId));
    const sisaBaru = [...kelompokBaru];
    const tersusun = daftar.map(entri => (anggotaKelompok.has(entri.entriId) ? sisaBaru.shift()! : entri));
    const urutanKirim = menuMateri ? kelompokkanPerModul(tersusun, modul).flatMap(grup => grup.materi) : tersusun;
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

Tampilkan `{galatUrutan ? <Alert variant="destructive" role="alert"><AlertDescription>{galatUrutan}</AlertDescription></Alert> : null}` tepat di atas daftar (impor `Alert`, `AlertDescription`). Daftar datar & grup:

```tsx
      {menuMateri
        ? kelompokkanPerModul(tampil, modul).map(grup => (
          <GrupMateri key={grup.nomor ?? 'tanpa'} grup={grup} sekarang={sekarang} bolehSeret={bolehSeret} saatPindah={simpanUrutan} />
        ))
        : tampil.length > 0 ? (
          <Card role="region" aria-label={LABEL_ISI[jenis]} className="gap-0 divide-y py-0">
            <KelompokSeret daftar={tampil} sekarang={sekarang} bolehSeret={bolehSeret} saatPindah={simpanUrutan} />
          </Card>
        ) : null}
```

`GrupMateri` menerima `bolehSeret` & `saatPindah` dan mengganti `grup.materi.map(… <BarisEntri …/>)` dengan `<KelompokSeret daftar={grup.materi} sekarang={sekarang} bolehSeret={bolehSeret} saatPindah={saatPindah} />`.

Komponen baru di bawah `GrupMateri`:

```tsx
type SaatPindah = (kelompokLama: RingkasanEntri[], kelompokBaru: RingkasanEntri[]) => void;

/** Satu kelompok yang bisa diurutkan: seret @dnd-kit (pointer, sentuh, keyboard lewat pegangan) atau tombol naik/turun. */
function KelompokSeret({ daftar, sekarang, bolehSeret, saatPindah }: {
  daftar: RingkasanEntri[]; sekarang: Date; bolehSeret: boolean; saatPindah: SaatPindah;
}) {
  const sensor = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const ids = daftar.map(entri => entri.entriId);
  const pindah = (dari: number, ke: number) => { if (dari !== ke) void saatPindah(daftar, pindahkan(daftar, dari, ke)); };
  if (!bolehSeret) return <>{daftar.map(entri => <BarisEntri key={entri.entriId} entri={entri} sekarang={sekarang} />)}</>;
  const saatLepas = ({ active, over }: DragEndEvent) => {
    const indeks = indeksSeret(ids, String(active.id), over ? String(over.id) : null);
    if (indeks) pindah(...indeks);
  };
  return (
    <DndContext sensors={sensor} collisionDetection={closestCenter} onDragEnd={saatLepas}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {daftar.map((entri, indeks) => (
          <BarisSeret key={entri.entriId} entri={entri} sekarang={sekarang}
            naik={indeks > 0 ? () => pindah(indeks, indeks - 1) : undefined}
            turun={indeks < daftar.length - 1 ? () => pindah(indeks, indeks + 1) : undefined} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function BarisSeret({ entri, sekarang, naik, turun }: { entri: RingkasanEntri; sekarang: Date; naik?: () => void; turun?: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: entri.entriId });
  const judul = judulEntri(entri);
  const pegangan = (
    <span className="flex items-center text-muted-foreground">
      <Button ref={setActivatorNodeRef} variant="ghost" size="icon" className="cursor-grab touch-none" aria-label={`Seret ${judul}`} {...attributes} {...listeners}>
        <GripVertical />
      </Button>
      <Button variant="ghost" size="icon" aria-label={`Naikkan ${judul}`} disabled={!naik} onClick={naik}><ChevronUp /></Button>
      <Button variant="ghost" size="icon" aria-label={`Turunkan ${judul}`} disabled={!turun} onClick={turun}><ChevronDown /></Button>
    </span>
  );
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? 'opacity-50' : undefined}>
      <BarisEntri entri={entri} sekarang={sekarang} pegangan={pegangan} />
    </div>
  );
}
```

Catatan: `attributes` @dnd-kit memberi `role="button"` dan `aria-roledescription="sortable"`; `aria-label` eksplisit di atas yang dipakai tes. Bila `Button` shadcn terpasang tidak meneruskan `ref` (React 18 butuh `forwardRef`), ganti pegangan dengan `<button type="button" ref={setActivatorNodeRef} className={buttonVariants({ variant: 'ghost', size: 'icon' })} …>`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `pnpm --filter @waris/admin test && pnpm --filter @waris/admin exec tsc --noEmit -p .`
Expected: PASS semua tes admin (termasuk `daftar`, `kerangka`, `beranda`, `ringkas`).

- [ ] **Step 5: Commit**

```bash
git add apps/admin/package.json pnpm-lock.yaml apps/admin/src/ringkas.ts apps/admin/src/layar/DaftarKonten.tsx apps/admin/src/__tests__/urutan.test.tsx apps/admin/src/__tests__/ringkas.test.ts
git commit -m "admin: seret urutan dengan dnd-kit + naik/turun, rollback saat gagal"
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
- Modul & Materi: grup per modul; seret satu materi dengan pegangan (mouse & keyboard: Spasi, panah, Spasi) lalu turunkan satu materi dengan tombol → muat ulang halaman → urutan bertahan; status chip tidak berubah.
- Pustaka/Teks aplikasi: tab jenis; tab Diksi memuat editor diksi lama.
- `read_console_messages` tanpa galat. Ambil screenshot beranda & daftar materi sebagai bukti.

- [ ] **Step 4: Commit**

```bash
git add .claude/launch.json
git commit -m "chore: konfigurasi preview portal admin"
```
