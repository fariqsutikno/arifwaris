# Database Tahap 3 — Portal Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplikasi `apps/admin` tempat tim menyunting konten & diksi, mengajukan, mereview (diff + setujui/kembalikan),
melihat pratinjau dengan komponen web, rollback, dan admin mengelola peran lewat email.

**Architecture:** App Vite + React terpisah yang mengimpor `ui/`, `gaya/`, `konten/sumber.ts`, dan layar belajar dari
`apps/web` lewat `exports` paket `@waris/web`. Semua data lewat repository `packages/data` (antarmuka ditambah untuk
kebutuhan portal: daftar entri, daftar kunci diksi, antrean diksi, daftar refs, peran berbasis email). App menerima
repository sebagai prop, jadi tes memakai `buatMemori()` tanpa jaringan. Pratinjau = `pasangSnapshot` berisi terbit +
draf, lalu render layar web yang sama.

**Tech Stack:** TypeScript, React 18, Vite 5, Vitest 2 + Testing Library + jsdom, Zod 3 (lewat `bacaIsi`),
`@supabase/supabase-js` 2, SQL Postgres (migrasi Supabase).

**Spec:** `docs/superpowers/specs/2026-09-26-database-portal-admin-design.md` (bagian "Portal admin", "Alur editorial",
"Diksi", "Urutan kerja" tahap 3). Plan sebelumnya: `...-tahap1-fondasi.md`, `...-tahap2-migrasi-konten.md`.

## Global Constraints

- Nama variabel/fungsi/tipe, komentar: bahasa Indonesia; istilah fikih sesuai `docs/kb/15_glosarium.md`.
- Tiap file dibuka komentar pendek: menerima apa, memutuskan apa, menyerahkan apa.
- Ref `[Rxx-y]` hanya dari `daftar_refs`; portal tidak pernah mengarang ref. Jenis fikih (`JENIS_FIKIH`) wajib ≥ 1 ref (`periksaRefs`).
- Aturan peran ditegakkan DB (RLS + fungsi transisi); UI hanya menyembunyikan tombol memakai `transisiRevisi`/`bolehSuntingDraf`
  yang sama, tidak pernah menjadi satu-satunya penjaga.
- Portal selalu online, tanpa cache (spec). Galat repository ditampilkan apa adanya (pesan Indonesia), tidak ditelan.
- `apps/web` tidak boleh mengimpor apa pun dari `apps/admin`; bundel web tidak bertambah.
- Kunci diksi cocok `^[a-z0-9_]+(\.[a-z0-9_]+)+$`.
- Tes yang ada tetap hijau di akhir tiap task. Commit setelah tiap task, hanya berkas milik task itu.
  Akhiri pesan dengan `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Keputusan (diskusi 2026-09-26)

1. **Letak:** `apps/admin` terpisah, mengimpor dari `@waris/web` (tanpa paket `ui` baru).
2. **Editor hibrida:** `materi` = field meta + blok sebagai Markdown terbatas (`bacaBlok`/`tulisBlok`, juga untuk `ar.blok`);
   jenis lain = input untuk tiap field string tingkat atas + textarea JSON untuk sisanya. Semua divalidasi `bacaIsi` sebelum simpan.
3. **Peran lewat email:** admin mengetik email; daftar menampilkan nama Google + email. Orang itu harus sudah pernah masuk sekali.

## Keputusan kecil plan ini

- Rute portal = hash (`#/konten/materi`, `#/entri/<id>`, `#/review`, `#/diksi`, `#/peran`); tanpa pustaka router.
- Diff review = diff baris (LCS) atas teks yang dinormalkan (`materi`: meta JSON + Markdown blok; lainnya: JSON berindentasi 2).
  ponytail: LCS O(n·m), cukup untuk entri berukuran ratusan baris.
- Diksi tidak punya `ubahDraf`: menyunting = draf baru (sesuai antarmuka tahap 1).
- Slug entri baru dari judul (`slug()` di `@waris/content`); urutan = maks + 10.

## Review Focus

1. **Reviewer membuka revisinya sendiri di antrean** → tombol setujui/kembalikan tidak tampil, dan bila dipaksa, galat DB tampil (Task 6).
2. **Isi JSON rusak / tidak lolos Zod saat simpan** → pesan galat per jalur tampil di editor, tidak ada revisi yang tercipta (Task 4).
3. **Email yang belum pernah masuk diberi peran** → pesan "akun belum pernah masuk" tampil, daftar tidak berubah (Task 1, Task 8).
4. **Pratinjau draf tidak boleh bocor ke tampilan lain** → setelah menutup pratinjau, snapshot terbit dipasang ulang (Task 5).
5. **Sesi kedaluwarsa / tanpa peran** → layar "belum punya akses", bukan layar kosong atau crash (Task 2).

---

## File Structure

```
supabase/migrations/20260927000001_portal.sql     fungsi peran berbasis email (admin saja)
packages/data/src/antarmuka.ts                    + RingkasanEntri, RingkasanKunciDiksi, PeranPengguna; metode portal
packages/data/src/memori/konten.ts                implementasi memori metode baru + akun memori
packages/data/src/supabase/index.ts, peta.ts      implementasi Supabase metode baru
apps/web/package.json                             + exports untuk admin
apps/admin/                                        BARU
  package.json, index.html, vite.config.ts, tsconfig.json
  src/main.tsx            buat repo Supabase dari env, render <Portal/>
  src/Portal.tsx          gerbang sesi/peran + navigasi + rute
  src/repo.ts             tipe RepoPortal + konteks React
  src/rute.ts             hash ↔ Rute (murni)
  src/editor/bentuk.ts    isi ↔ bentuk editor hibrida (murni)
  src/editor/diff.ts      diff baris (murni)
  src/layar/DaftarKonten.tsx, EditorEntri.tsx, PemilihRefs.tsx, Pratinjau.tsx,
           AntreanReview.tsx, RiwayatRevisi.tsx, EditorDiksi.tsx, KelolaPeran.tsx
  src/__tests__/*.test.ts(x)
docs/panduan-tim-keilmuan.md                      tulis ulang bagian "cara setor" → portal
```

---

### Task 1: Repository & SQL untuk portal

**Files:**
- Create: `supabase/migrations/20260927000001_portal.sql`
- Modify: `packages/data/src/antarmuka.ts`, `packages/data/src/memori/konten.ts`, `packages/data/src/supabase/index.ts`,
  `packages/data/src/supabase/peta.ts`, `packages/data/src/index.ts`
- Test: `packages/data/src/__tests__/memori-portal.test.ts`, tambah kasus di `packages/data/src/__tests__/supabase.test.ts`

**Interfaces:**
- Produces (di `antarmuka.ts`):

```ts
export interface RingkasanEntri {
  entriId: string; jenis: JenisKonten; slug: string; urutan: number;
  revisiTerbitId: string | null; revisiTerakhir: RingkasanRevisi | null;
}
export interface RingkasanKunciDiksi {
  kunci: string; halaman: string; terbit: DiksiTerbit | null; revisiTerakhir: RingkasanRevisiDiksi | null;
}
export interface PeranPengguna { userId: string; email: string; nama: string | null; peran: Peran }

// RepositoriKonten +
daftarEntri(jenis: JenisKonten): Promise<RingkasanEntri[]>;   // urut `urutan`, lalu slug
daftarRefs(): Promise<{ kode: string; bab: number }[]>;
// RepositoriDiksi +
daftarKunci(): Promise<RingkasanKunciDiksi[]>;                // urut halaman, lalu kunci
antreanReview(): Promise<RingkasanRevisiDiksi[]>;
// RepositoriAkun: GANTI aturPeran & daftarPeran
aturPeran(email: string, peran: Peran | null): Promise<void>; // 'akun belum pernah masuk' bila email tak dikenal
daftarPeran(): Promise<PeranPengguna[]>;
// MemoriBersama +
akun: RepositoriAkun;
daftarkanPengguna(p: { userId: string; email: string; nama?: string }): void; // tes: meniru auth.users
```

`revisiTerakhir` = revisi dengan `dibuat_pada` terbaru (memori: id terakhir) — dipakai daftar untuk kolom status.

- [x] **Step 1: Tulis tes memori (gagal)** — `memori-portal.test.ts`:

```ts
import { expect, test } from 'vitest';
import { buatMemori } from '../index.js';
import { SOAL_HITUNG_UJI } from './contoh.js';

const ADMIN = { userId: 'u-admin', email: 'admin@x.id' };
function siapkan() {
  const memori = buatMemori({ refs: ['R09-7'], sesi: ADMIN, peran: { 'u-admin': 'admin' } });
  memori.daftarkanPengguna({ ...ADMIN, nama: 'Admin' });
  memori.daftarkanPengguna({ userId: 'u-rev', email: 'rev@x.id', nama: 'Ustadz' });
  return memori;
}

test('daftarEntri memuat revisi terakhir dan terbit', async () => {
  const m = siapkan();
  const id = await m.editorial.buatEntri('soal_hitung', SOAL_HITUNG_UJI.kode, 10);
  const r1 = await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  await m.editorial.ajukan(r1);
  await m.editorial.setujui(r1);
  const r2 = await m.editorial.buatDraf(id, 'soal_hitung', SOAL_HITUNG_UJI, ['R09-7']);
  const [entri] = await m.konten.daftarEntri('soal_hitung');
  expect(entri).toMatchObject({ entriId: id, revisiTerbitId: r1, revisiTerakhir: { id: r2, status: 'draf' } });
});

test('aturPeran lewat email; email tak dikenal ditolak', async () => {
  const m = siapkan();
  await m.akun.aturPeran('rev@x.id', 'reviewer');
  expect(await m.akun.daftarPeran()).toContainEqual({ userId: 'u-rev', email: 'rev@x.id', nama: 'Ustadz', peran: 'reviewer' });
  await expect(m.akun.aturPeran('siapa@x.id', 'penulis')).rejects.toThrow('akun belum pernah masuk');
  await m.akun.aturPeran('rev@x.id', null);
  expect((await m.akun.daftarPeran()).map(p => p.email)).toEqual(['admin@x.id']);
});

test('aturPeran oleh non-admin ditolak', async () => {
  const m = siapkan();
  m.aturPeranLangsung('u-rev', 'reviewer');
  m.masukSebagai({ userId: 'u-rev', email: 'rev@x.id' });
  await expect(m.akun.aturPeran('admin@x.id', null)).rejects.toThrow('hanya admin');
});

test('daftarKunci & antrean diksi', async () => {
  const m = siapkan();
  await m.diksi.buatKunci('umum.simpan', 'umum');
  const r = await m.diksi.buatDraf('umum.simpan', 'Simpan', null, null);
  await m.diksi.ajukan(r);
  expect((await m.diksi.antreanReview()).map(x => x.id)).toEqual([r]);
  expect(await m.diksi.daftarKunci()).toMatchObject([{ kunci: 'umum.simpan', terbit: null, revisiTerakhir: { id: r, status: 'diajukan' } }]);
});

test('daftarRefs dari refs awal', async () => {
  expect(await siapkan().konten.daftarRefs()).toEqual([{ kode: 'R09-7', bab: 9 }]);
});
```

- [x] **Step 2: Jalankan, pastikan gagal** — `pnpm --filter @waris/data test memori-portal` → FAIL (metode tidak ada).

- [x] **Step 3: Implementasi memori.** Di `memori/konten.ts`: `pengguna = new Map<string, { userId; email; nama: string | null }>()`
  (kunci email); `daftarEntri` menyaring `entri` per jenis, `revisiTerakhir` = revisi entri itu dengan id numerik terbesar;
  `daftarRefs` = `[...refsDikenal].sort().map(kode => ({ kode, bab: Number(kode.slice(1, 3)) }))`;
  `daftarKunci`, `antreanReview` diksi setara versi konten. `akun`:

```ts
const akun: RepositoriAkun = {
  async sesi() { return sesi; },
  async masukGoogle() { throw new Error('masuk Google tidak tersedia di memori'); },
  async keluar() { sesi = null; },
  async peranSaya() { return sesi ? peran.get(sesi.userId) ?? null : null; },
  async aturPeran(email, peranBaru) {
    if (!sesi || peran.get(sesi.userId) !== 'admin') throw new Error('hanya admin yang bisa mengatur peran');
    const target = pengguna.get(email.trim().toLowerCase());
    if (!target) throw new Error(`akun belum pernah masuk: ${email}`);
    if (peranBaru) peran.set(target.userId, peranBaru); else peran.delete(target.userId);
  },
  async daftarPeran() {
    return [...pengguna.values()].flatMap(p => (peran.has(p.userId) ? [{ ...p, peran: peran.get(p.userId)! }] : []))
      .sort((a, b) => a.email.localeCompare(b.email));
  },
};
```

  `daftarkanPengguna` menyimpan dengan email di-lowercase, `nama ?? null`.

- [x] **Step 4: Jalankan tes memori** → PASS.

- [x] **Step 5: Migrasi SQL** `20260927000001_portal.sql`:

```sql
-- supabase/migrations/20260927000001_portal.sql
-- Peran berbasis email untuk portal (keputusan tahap 3). auth.users tidak terbaca klien, jadi lewat fungsi
-- security definer yang memeriksa admin sendiri. Nama = full_name dari metadata Google.

create function daftar_peran() returns table (user_id uuid, email text, nama text, peran peran)
language plpgsql stable security definer set search_path = public as $$
begin
  if peran_saya() is distinct from 'admin' then raise exception 'hanya admin yang bisa melihat daftar peran'; end if;
  return query
    select p.user_id, u.email::text, (u.raw_user_meta_data->>'full_name')::text, p.peran
      from peran_pengguna p join auth.users u on u.id = p.user_id order by u.email;
end $$;

create function atur_peran_email(p_email text, p_peran peran) returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if peran_saya() is distinct from 'admin' then raise exception 'hanya admin yang bisa mengatur peran'; end if;
  select id into v_id from auth.users where lower(email) = lower(btrim(p_email));
  if v_id is null then raise exception 'akun belum pernah masuk: %', p_email; end if;
  if p_peran is null then delete from peran_pengguna where user_id = v_id;
  else insert into peran_pengguna (user_id, peran) values (v_id, p_peran)
       on conflict (user_id) do update set peran = excluded.peran;
  end if;
end $$;

revoke execute on function daftar_peran(), atur_peran_email(text, peran) from public, anon;
```

  Cek dulu nama kolom PK `peran_pengguna` di `20260926000001_konten.sql` (baris 72) untuk `on conflict`.

- [x] **Step 6: Implementasi Supabase.** `daftarEntri`: `from('entri_konten').select('id, jenis, slug, urutan, revisi_terbit_id, revisi!revisi_entri_id_fkey(*)').eq('jenis', jenis).order('urutan')`,
  `revisiTerakhir` = elemen `revisi` dengan `dibuat_pada` maks (petakan lewat `keRevisi`; tambah `keRingkasanEntri` di `peta.ts`).
  Cek nama FK sebenarnya dengan `grep -n "references" supabase/migrations/20260926000001_konten.sql`.
  `daftarRefs`: `from('daftar_refs').select('kode, bab').order('kode')`. `daftarKunci`: pola sama atas `diksi` + `revisi_diksi`,
  `terbit` lewat `keDiksiTerbit` bila `revisi_terbit` ada. Antrean diksi: `from('revisi_diksi').select('*').eq('status','diajukan').order('dibuat_pada')`.
  `aturPeran(email, peran)` → `rpc('atur_peran_email', { p_email: email, p_peran: peran })`;
  `daftarPeran` → `klien.rpc('daftar_peran')` dipetakan ke `PeranPengguna`.

- [x] **Step 7: Tes integrasi** — di `supabase.test.ts` (dilewati tanpa env) tambah: admin `aturPeran(emailReviewer, 'reviewer')` — **belum dijalankan: perlu Supabase lokal.**
  lalu `daftarPeran()` memuat email itu; `aturPeran('tidak-ada@x.id', 'penulis')` rejects `akun belum pernah masuk`;
  penulis memanggil `daftarPeran()` rejects `hanya admin`. Ikuti pola `masuk(email)` di berkas itu.

- [x] **Step 8:** `pnpm test` hijau, `pnpm -r exec tsc --noEmit` bersih. Perbaiki pemanggil lama `aturPeran(userId, …)` bila ada (`grep -rn aturPeran packages apps scripts`).

- [x] **Step 9: Commit** — `data: metode portal (daftar entri/kunci, antrean diksi, refs, peran via email)`.

---

### Task 2: Kerangka `apps/admin` + gerbang sesi/peran

**Files:**
- Modify: `apps/web/package.json` (tambah `exports`)
- Create: `apps/admin/{package.json,index.html,vite.config.ts,tsconfig.json}`, `apps/admin/src/{main.tsx,Portal.tsx,repo.ts,rute.ts}`
- Test: `apps/admin/src/__tests__/rute.test.ts`, `apps/admin/src/__tests__/gerbang.test.tsx`

**Interfaces:**
- Produces:

```ts
// repo.ts
export type RepoPortal = { konten: RepositoriKonten; editorial: RepositoriEditorial; diksi: RepositoriDiksi; akun: RepositoriAkun };
export const KonteksRepo: React.Context<{ repo: RepoPortal; sesi: Sesi; peran: Peran } | null>;
export function usePortal(): { repo: RepoPortal; sesi: Sesi; peran: Peran }; // throw bila di luar provider
// rute.ts
export type Rute =
  | { layar: 'konten'; jenis: JenisKonten } | { layar: 'entri'; entriId: string } | { layar: 'entriBaru'; jenis: JenisKonten }
  | { layar: 'review' } | { layar: 'diksi' } | { layar: 'peran' };
export function bacaRute(hash: string): Rute;   // tak dikenal → { layar: 'review' }
export function tulisRute(rute: Rute): string;  // '#/konten/materi', '#/entri/<id>', '#/baru/materi', '#/review', '#/diksi', '#/peran'
// Portal.tsx
export function Portal({ repo }: { repo: RepoPortal }): JSX.Element;
```

- [x] **Step 1: exports web.** Di `apps/web/package.json` tambah:

```json
"exports": {
  "./sumber": "./src/konten/sumber.ts",
  "./terjemah": "./src/terjemah.ts",
  "./ui/*": "./src/ui/*.tsx",
  "./gaya/*": "./src/gaya/*",
  "./belajar/*": "./src/layar/belajar/*.tsx"
}
```

- [x] **Step 2: Paket admin.** `package.json` meniru `apps/web/package.json` (nama `@waris/admin`, dependensi `@waris/web`,
  `@waris/data`, `@waris/content`, `@supabase/supabase-js`, react; devDependencies sama). `vite.config.ts` & `tsconfig.json`
  salin dari web (tsconfig `include`: `["src", "../web/src", "../../packages/content/src/raw.d.ts"]` supaya berkas web yang
  diimpor ikut dicek). `index.html` salin dari web, judul `Arif Waris — Portal`. Jalankan `pnpm install`.

- [x] **Step 3: Tes rute (gagal)**:

```ts
import { expect, test } from 'vitest';
import { bacaRute, tulisRute, type Rute } from '../rute';

const CONTOH: Rute[] = [
  { layar: 'konten', jenis: 'materi' }, { layar: 'entri', entriId: 'abc' }, { layar: 'entriBaru', jenis: 'faq' },
  { layar: 'review' }, { layar: 'diksi' }, { layar: 'peran' },
];
test.each(CONTOH)('bolak-balik %o', rute => expect(bacaRute(tulisRute(rute))).toEqual(rute));
test('hash tak dikenal / jenis tak sah → review', () => {
  expect(bacaRute('')).toEqual({ layar: 'review' });
  expect(bacaRute('#/konten/bukan_jenis')).toEqual({ layar: 'review' });
});
```

- [x] **Step 4: Implementasi `rute.ts`** (split `#/a/b`, jenis dicek dengan `JENIS_KONTEN.includes`). Tes → PASS.

- [x] **Step 5: Tes gerbang (gagal)** — `gerbang.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { buatMemori } from '@waris/data';
import { Portal } from '../Portal';

test('tanpa sesi → tombol masuk Google', async () => {
  const m = buatMemori();
  render(<Portal repo={m} />);
  expect(await screen.findByRole('button', { name: /masuk dengan google/i })).toBeTruthy();
});
test('sesi tanpa peran → belum punya akses + tombol keluar', async () => {
  const m = buatMemori({ sesi: { userId: 'u1', email: 'a@x.id' } });
  render(<Portal repo={m} />);
  expect(await screen.findByText(/belum punya akses/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: /keluar/i })).toBeTruthy();
});
test('peran reviewer → navigasi tanpa menu Peran', async () => {
  const m = buatMemori({ sesi: { userId: 'u1', email: 'a@x.id' }, peran: { u1: 'reviewer' } });
  render(<Portal repo={m} />);
  expect(await screen.findByRole('link', { name: /antrean review/i })).toBeTruthy();
  expect(screen.queryByRole('link', { name: /peran/i })).toBeNull();
});
test('galat memuat sesi → pesan galat, bukan layar kosong', async () => {
  const m = buatMemori();
  m.akun.sesi = async () => { throw new Error('jaringan putus'); };
  render(<Portal repo={m} />);
  expect(await screen.findByText(/jaringan putus/)).toBeTruthy();
});
```

- [x] **Step 6: Implementasi `Portal.tsx`.** State `{ tahap: 'memuat' } | { tahap: 'galat', pesan } | { tahap: 'tamu' } | { tahap: 'tanpaPeran', sesi } | { tahap: 'siap', sesi, peran }`.
  `useEffect` memanggil `akun.sesi()` lalu `akun.peranSaya()`. Siap → `KonteksRepo.Provider`, navigasi (`<a href={tulisRute(...)}>`)
  "Konten" (per jenis `JENIS_KONTEN`), "Antrean review", "Diksi", dan "Peran" hanya untuk admin; rute dari `bacaRute(location.hash)`
  + listener `hashchange`. Layar yang belum dibuat di task ini: render `<p>Segera</p>` per rute (diganti task berikut).
  Masuk: `akun.masukGoogle(location.origin + location.pathname)`. Pakai `Tombol` dari `@waris/web/ui/komponen` dan
  impor `@waris/web/gaya/token.css`, `@waris/web/gaya/komponen.css` di `main.tsx`.

- [x] **Step 7: `main.tsx`.** Env `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`; tanpa env → render pesan "env Supabase belum diatur".
  Ada → `buatRepositoriSupabase(createClient(url, kunci))` (sesi dipersist, default supabase-js) → `<Portal repo={...} />`.

- [x] **Step 8:** `pnpm --filter @waris/admin test` PASS; `pnpm --filter @waris/admin exec tsc --noEmit -p .` bersih;
  `pnpm --filter @waris/web build` masih jalan dan ukuran `dist/assets/index-*.js` tidak berubah (web tidak mengimpor admin).
  Tambah skrip root `"admin": "pnpm --filter @waris/admin dev"`.

- [x] **Step 9: Commit** — `admin: kerangka portal, gerbang sesi & peran, rute hash`.

---

### Task 3: Daftar konten per jenis

**Files:**
- Create: `apps/admin/src/layar/DaftarKonten.tsx`
- Modify: `apps/admin/src/Portal.tsx` (rute `konten`)
- Test: `apps/admin/src/__tests__/daftar.test.tsx`

**Interfaces:**
- Consumes: `repo.konten.daftarEntri(jenis)`, `RingkasanEntri`, `tulisRute`.
- Produces: `DaftarKonten({ jenis }: { jenis: JenisKonten })`; helper murni diekspor
  `statusTampil(e: RingkasanEntri): 'terbit' | 'draf' | 'diajukan' | 'dikembalikan' | 'terbit + draf'`.

- [x] **Step 1: Tes (gagal)** — siapkan memori dengan satu entri terbit + draf baru, satu entri hanya diajukan (pakai `SOAL_HITUNG_UJI`/`DAFTAR_FAQ_UJI`
  dari `packages/data/src/__tests__/contoh.ts`; salin data yang dibutuhkan ke `apps/admin/src/__tests__/contoh.ts` karena berkas tes
  paket lain tidak diekspor). Harapan: baris tampil berurut `urutan`, kolom status "terbit + draf" dan "diajukan";
  filter status (select "Semua / Draf / Diajukan / Dikembalikan / Terbit") menyaring baris; tombol "Entri baru" menuju `#/baru/<jenis>`.
  Tes `statusTampil` untuk kelima kasus.

- [x] **Step 2: Jalankan → FAIL.**
- [x] **Step 3: Implementasi.** Tabel: slug (tautan `#/entri/<id>`), judul (dari `revisiTerakhir.isi` field `judul`/`pertanyaan`/`istilahId`/`kunci`, fallback slug),
  status, refs. Galat repository → teks galat di atas tabel.
- [x] **Step 4: Tes → PASS.** 
- [x] **Step 5: Commit** — `admin: daftar konten per jenis + filter status`.

---

### Task 4: Editor entri hibrida + pemilih refs

**Files:**
- Create: `apps/admin/src/editor/bentuk.ts`, `apps/admin/src/layar/EditorEntri.tsx`, `apps/admin/src/layar/PemilihRefs.tsx`
- Modify: `apps/admin/src/Portal.tsx` (rute `entri`, `entriBaru`)
- Test: `apps/admin/src/__tests__/bentuk.test.ts`, `apps/admin/src/__tests__/editor.test.tsx`

**Interfaces:**
- Produces (`bentuk.ts`, murni):

```ts
export interface BentukEditor {
  teks: Record<string, string>;   // field string tingkat atas (kecuali yang ditangani khusus)
  blok: string | null;            // materi: Markdown blok Indonesia
  blokAr: string | null;          // materi: Markdown ar.blok (null bila tidak ada)
  json: string;                   // sisa field, JSON indentasi 2
}
export function keBentuk<J extends JenisKonten>(jenis: J, isi: IsiKonten[J]): BentukEditor;
export function dariBentuk<J extends JenisKonten>(jenis: J, slug: string, bentuk: BentukEditor):
  { ok: true; isi: IsiKonten[J] } | { ok: false; galat: string };
```

  `keBentuk` memakai `keJson` dulu (bigint → string) lalu memisahkan; `dariBentuk` menggabung, `bacaBlok(slug, blok)` untuk materi,
  lalu `bacaIsi(jenis, gabungan)`. JSON rusak → `{ ok: false, galat: 'JSON tidak sah: <pesan>' }`.

- [x] **Step 1: Tes bentuk (gagal)**:

```ts
import { expect, test } from 'vitest';
import { tulisBlok } from '@waris/content';
import { keBentuk, dariBentuk } from '../editor/bentuk';
import { PELAJARAN_UJI, SOAL_HITUNG_UJI } from './contoh';

test('materi bolak-balik lewat Markdown blok', () => {
  const bentuk = keBentuk('materi', PELAJARAN_UJI);
  expect(bentuk.blok).toBe(tulisBlok(PELAJARAN_UJI.blok));
  expect(bentuk.json).not.toContain('"blok"');
  expect(dariBentuk('materi', PELAJARAN_UJI.slug, bentuk)).toEqual({ ok: true, isi: PELAJARAN_UJI });
});
test('soal hitung (bigint) bolak-balik', () => {
  expect(dariBentuk('soal_hitung', SOAL_HITUNG_UJI.kode, keBentuk('soal_hitung', SOAL_HITUNG_UJI)))
    .toEqual({ ok: true, isi: SOAL_HITUNG_UJI });
});
test('JSON rusak → galat, bukan throw', () => {
  const bentuk = { ...keBentuk('soal_hitung', SOAL_HITUNG_UJI), json: '{ rusak' };
  expect(dariBentuk('soal_hitung', 'x', bentuk)).toMatchObject({ ok: false, galat: expect.stringMatching(/^JSON tidak sah/) });
});
test('gagal Zod → galat berjalur', () => {
  const bentuk = keBentuk('soal_hitung', SOAL_HITUNG_UJI);
  const r = dariBentuk('soal_hitung', 'x', { ...bentuk, teks: { ...bentuk.teks, kode: 5 as unknown as string } });
  expect(r.ok).toBe(false);
});
```

  `PELAJARAN_UJI`: ambil satu pelajaran nyata dari `apps/web/src/snapshot.json` (`jenis === 'materi'`) lewat `bacaIsi`, di `contoh.ts`.

- [x] **Step 2: → FAIL. Step 3: implementasi `bentuk.ts`. Step 4: → PASS.**

- [x] **Step 5: Tes editor (gagal)** — `editor.test.tsx` dengan memori (penulis `u-p`, refs `['R09-7','R10-3']`):
  1. Entri baru `faq`: isi field, pilih ref lewat `PemilihRefs` (ketik "R09" → klik `R09-7`), "Simpan draf" → `daftarEntri('faq')` berisi 1 entri status draf.
  2. JSON rusak → pesan `JSON tidak sah` tampil, `daftarEntri` tetap kosong (Review Focus 2).
  3. Jenis fikih tanpa ref → pesan galat dari repo (`periksaRefs`) tampil.
  4. Draf milik sendiri: tombol "Ajukan" → status diajukan; setelah diajukan, form jadi baca-saja (`bolehSuntingDraf` false).
  5. Reviewer membuka entri: form baca-saja, tidak ada tombol simpan.

- [x] **Step 6: Implementasi `EditorEntri`.** Muat `daftarRevisi(entriId)`; basis = revisi terakhir (atau `revisi terbit` bila terakhir bukan draf).
  Boleh sunting = `bolehSuntingDraf({ peran, pelakuId: sesi.userId, pembuatId, status })` untuk draf; bila revisi terakhir
  bukan draf dan peran ≠ reviewer → tombol "Buat draf baru dari versi ini". Simpan: `dariBentuk` → gagal tampilkan galat;
  berhasil → `buatDraf`/`ubahDraf`; entri baru → `buatEntri(jenis, slug(judul), maksUrutan + 10)` dulu, lalu `location.hash = tulisRute({ layar:'entri', entriId })`.
  `PemilihRefs({ nilai, saatUbah })`: `daftarRefs()` sekali, input cari (kode atau "bab 9"), chip terpilih dengan tombol hapus.
  Editor materi: dua `<textarea>` (Indonesia & Arab `dir="rtl"`) untuk blok + input untuk `teks`; `json` di textarea monospace.

- [x] **Step 7: → PASS. Step 8: Commit** — `admin: editor entri hibrida + pemilih refs`.

---

### Task 5: Pratinjau dengan komponen web

**Files:**
- Create: `apps/admin/src/layar/Pratinjau.tsx`
- Modify: `apps/admin/src/layar/EditorEntri.tsx` (tombol "Pratinjau")
- Test: `apps/admin/src/__tests__/pratinjau.test.tsx`

**Interfaces:**
- Consumes: `pasangSnapshot`, `snapshotTerpasang` dari `@waris/web/sumber`; `Materi` (`@waris/web/belajar/Materi`),
  `KartuSoalKuis`, `Faq`, `TanyaJawab`; `keJson`.
- Produces: `Pratinjau({ jenis, slug, isi, saatTutup })`.

- [x] **Step 1: Tes (gagal)**: render pratinjau materi dengan judul diubah jadi `"JUDUL PRATINJAU"` → teks tampil; setelah `saatTutup`
  (unmount), `cariPelajaran(slug)?.judul` kembali ke judul snapshot bawaan (Review Focus 4). Jenis tanpa layar
  (`ahwal`, `teks_edukasi`, `glosarium_ar`, `kitab`, `syahid`, `cheatsheet`, `modul`, `soal_hitung`) → tampil JSON berindentasi + catatan "belum ada pratinjau".
- [x] **Step 2: → FAIL.**
- [x] **Step 3: Implementasi.** Saat mount: simpan `const asal = snapshotTerpasang()`, pasang
  `{ ...asal, konten: [...asal.konten.filter(b => !(b.jenis === jenis && b.slug === slug)), { entriId: 'pratinjau', jenis, slug, urutan: 0, revisiId: 'pratinjau', isi: keJson(jenis, isi), refs: [], versiTerbit: asal.versi }] }`;
  cleanup `useEffect` → `pasangSnapshot(asal)`. Render di `<div className="aw-pratinjau">` dengan `saatCoba={() => {}}`, `kasusSekarang={null}`
  (cek tipe Props aktual di `Materi.tsx:31`). Pasang di `useLayoutEffect` supaya render anak sudah melihat snapshot pratinjau.
  ponytail: pratinjau memakai snapshot bawaan build sebagai latar, bukan data DB terbaru; cukup untuk melihat tampilan satu entri.
- [x] **Step 4: → PASS. Step 5: Commit** — `admin: pratinjau draf dengan layar web`.

---

### Task 6: Antrean review + diff (konten & diksi)

**Files:**
- Create: `apps/admin/src/editor/diff.ts`, `apps/admin/src/layar/AntreanReview.tsx`
- Modify: `apps/admin/src/Portal.tsx` (rute `review`)
- Test: `apps/admin/src/__tests__/diff.test.ts`, `apps/admin/src/__tests__/review.test.tsx`

**Interfaces:**
- Produces:

```ts
export type BarisDiff = { jenis: 'sama' | 'tambah' | 'hapus'; teks: string };
export function diffBaris(lama: string, baru: string): BarisDiff[];
export function teksBanding(jenis: JenisKonten, isi: unknown): string; // materi: meta JSON + '\n---\n' + tulisBlok(blok); lainnya JSON 2 spasi
```

- [x] **Step 1: Tes diff (gagal)**:

```ts
import { expect, test } from 'vitest';
import { diffBaris } from '../editor/diff';

test('baris berubah = hapus + tambah, sisanya sama', () => {
  expect(diffBaris('a\nb\nc', 'a\nB\nc')).toEqual([
    { jenis: 'sama', teks: 'a' }, { jenis: 'hapus', teks: 'b' }, { jenis: 'tambah', teks: 'B' }, { jenis: 'sama', teks: 'c' },
  ]);
});
test('lama kosong (entri baru) = semua tambah', () => {
  expect(diffBaris('', 'x\ny').every(b => b.jenis === 'tambah')).toBe(true);
});
```

- [x] **Step 2: → FAIL. Step 3: implementasi LCS (tabel panjang, jalan balik). Step 4: → PASS.**

- [x] **Step 5: Tes review (gagal)** — memori: penulis `u-p` membuat & mengajukan draf faq dan draf diksi; reviewer `u-r` masuk:
  1. Antrean menampilkan dua butir (konten & diksi) dengan diff.
  2. "Setujui" butir konten → hilang dari antrean; `konten.bacaTerbit({ jenis: 'faq' })` berisi entri itu.
  3. "Kembalikan" tanpa catatan → tombol nonaktif; dengan catatan → status dikembalikan.
  4. Reviewer yang sama mengajukan drafnya sendiri (peran diubah sementara lewat `aturPeranLangsung`) → butir itu tampil tanpa tombol aksi
     dan berlabel "revisi Anda" (Review Focus 1).
  5. Penulis membuka antrean → butir tampil baca-saja.
- [x] **Step 6: Implementasi.** Muat `editorial.antreanReview()` + `diksi.antreanReview()`. Untuk konten: basis diff = revisi terbit entri
  (`daftarRevisi(entriId)` cari `id === revisiTerbitId` dari `daftarEntri`, atau revisi berstatus disetujui terakhir; tidak ada → `''`).
  Diksi: basis = `daftarKunci()` → `terbit`. Tombol tampil hanya bila `transisiRevisi({ ..., aksi: 'setujui' }).ok`.
  Galat repo (mis. RLS menolak) tampil di butir itu. Tautan "Pratinjau" untuk konten (pakai `Pratinjau` dari Task 5).
- [x] **Step 7: → PASS. Step 8: Commit** — `admin: antrean review dengan diff, setujui/kembalikan`.

---

### Task 7: Riwayat revisi + rollback

**Files:**
- Create: `apps/admin/src/layar/RiwayatRevisi.tsx`
- Modify: `apps/admin/src/layar/EditorEntri.tsx` (panel riwayat di bawah editor)
- Test: `apps/admin/src/__tests__/riwayat.test.tsx`

**Interfaces:**
- Consumes: `konten.daftarRevisi`, `editorial.terbitkanUlang`, `diffBaris`, `teksBanding`.
- Produces: `RiwayatRevisi({ entriId, jenis, revisiTerbitId, saatBerubah })`.

- [x] **Step 1: Tes (gagal)** — entri dengan dua revisi disetujui (r1 lalu r2, terbit = r2), reviewer masuk:
  daftar menampilkan r2 berlabel "terbit", r1 dengan tombol "Terbitkan ulang"; klik → `bacaTerbit` memuat `revisiId === r1`
  dan `saatBerubah` dipanggil. Penulis: tombol tidak tampil. Catatan review revisi dikembalikan tampil.
- [x] **Step 2: → FAIL.**
- [x] **Step 3: Implementasi.** Urut terbaru di atas; tiap revisi: status, pembuat (id singkat), tanggal, catatan review,
  tombol "Lihat beda dengan terbit" (diff inline). Tombol rollback hanya untuk status `disetujui`, bukan yang sedang terbit,
  peran reviewer/admin (cermin `terbitkan_ulang_revisi`). Minta konfirmasi `window.confirm` sebelum rollback.
- [x] **Step 4: → PASS. Step 5: Commit** — `admin: riwayat revisi & rollback`.

---

### Task 8: Editor diksi

**Files:**
- Create: `apps/admin/src/layar/EditorDiksi.tsx`
- Modify: `apps/admin/src/Portal.tsx` (rute `diksi`)
- Test: `apps/admin/src/__tests__/diksi.test.tsx`

**Interfaces:**
- Consumes: `diksi.daftarKunci`, `diksi.buatDraf`, `diksi.ajukan`, `diksi.daftarRevisi`, `diksi.terbitkanUlang`.
- Produces: `EditorDiksi()`; helper murni `saringDiksi(daftar: RingkasanKunciDiksi[], saring: { halaman?: string; arKosong?: boolean; belumTerbit?: boolean; cari?: string })`.

- [x] **Step 1: Tes (gagal)**: `saringDiksi` untuk tiap filter (Arab kosong = `terbit?.ar` null/kosong; belum terbit = `terbit === null` atau
  revisi terakhir bukan disetujui; cari mencocokkan kunci atau teks id). Komponen: tabel dikelompokkan per halaman;
  penulis mengubah kolom Arab satu baris → "Simpan & ajukan" membuat revisi diajukan dengan `idTeks` lama + `arTeks` baru;
  reviewer: sel baca-saja.
- [x] **Step 2: → FAIL.**
- [x] **Step 3: Implementasi.** Kolom: kunci, Indonesia (input), Arab (input `dir="rtl"`), status. Baris yang berubah ditandai;
  satu tombol per baris "Simpan & ajukan" (`buatDraf` lalu `ajukan`). Tanpa tambah kunci baru dari portal (kunci lahir dari kode + tes cakupan
  diksi; ponytail: admin menambah kunci lewat SQL/impor bila perlu).
- [x] **Step 4: → PASS. Step 5: Commit** — `admin: editor diksi dengan filter Arab kosong & belum terbit`.

---

### Task 9: Kelola peran

**Files:**
- Create: `apps/admin/src/layar/KelolaPeran.tsx`
- Modify: `apps/admin/src/Portal.tsx` (rute `peran`, hanya admin)
- Test: `apps/admin/src/__tests__/peran.test.tsx`

**Interfaces:**
- Consumes: `akun.daftarPeran(): PeranPengguna[]`, `akun.aturPeran(email, peran | null)`.
- Produces: `KelolaPeran()`.

- [x] **Step 1: Tes (gagal)** — memori admin + pengguna terdaftar `rev@x.id` (nama "Ustadz"):
  1. Tabel menampilkan nama + email + peran.
  2. Form email + select peran → "Beri peran" → baris baru tampil.
  3. Email tak dikenal → pesan "akun belum pernah masuk" tampil, tabel tidak berubah (Review Focus 3).
  4. "Cabut" (dengan `window.confirm`) → baris hilang. Admin tidak bisa mencabut dirinya sendiri (tombol nonaktif; mencegah terkunci).
  5. Rute `#/peran` untuk non-admin → "hanya admin".
- [x] **Step 2: → FAIL. Step 3: implementasi. Step 4: → PASS.**
- [x] **Step 5: Commit** — `admin: kelola peran lewat email`.

---

### Task 10: Dokumen & verifikasi akhir

**Files:**
- Modify: `docs/panduan-tim-keilmuan.md`, `README.md`, `docs/superpowers/plans/2026-09-26-database-tahap3-portal-admin.md` (centang)

- [x] **Step 1:** Panduan: ganti catatan "Berubah per 2026-09-26" dan bagian "Cara setor" dengan alur portal (masuk Google → minta peran ke admin →
  sunting → pratinjau → ajukan → reviewer setujui/kembalikan). Setiap sebutan lokasi berkas lama (`docs/materi/…`, `docs/soal/…`, dll.)
  diganti nama jenis konten di portal; aturan isi (Markdown terbatas, ref wajib) tetap. `grep -n "docs/materi\|docs/soal\|docs/faq\|tanya-jawab.md\|docs/rujukan\|glosarium-ar" docs/panduan-tim-keilmuan.md` → kosong.
- [x] **Step 2:** README: cara menjalankan portal (`pnpm admin`, env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, redirect URL Google di dashboard Supabase).
- [x] **Step 3:** `pnpm test` hijau semua paket; `pnpm -r exec tsc --noEmit` bersih; `pnpm --filter @waris/admin build` dan `pnpm --filter @waris/web build` berhasil.
- [x] **Step 4:** Uji manual dengan Supabase lokal (`pnpm db:mulai && pnpm db:reset`, impor konten): masuk, sunting FAQ, ajukan, setujui sebagai akun lain, — **belum dijalankan: perlu Supabase lokal** (lihat perintah di laporan Task 10).
  cek web memuat versi baru setelah reload kedua. Catat hasilnya di pesan commit.
- [x] **Step 5: Commit** — `docs: panduan tim keilmuan memakai portal; centang plan tahap 3`.
