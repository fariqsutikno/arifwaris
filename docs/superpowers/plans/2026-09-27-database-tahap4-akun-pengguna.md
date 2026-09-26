# Akun Pengguna (Tahap 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Login Google opsional di web; kasus tersimpan, progres belajar & latihan, dan preferensi tersinkron antar
perangkat lewat antrean lokal-dulu; tabel `log_kegiatan` sebagai fondasi streak/leaderboard tahap 5.

**Architecture:** Layar tetap membaca/menulis localStorage. Tiap penulisan data pengguna juga memanggil `antre()`
(no-op tanpa login). `akun/sinkron.ts` mengirim antrean ke `RepositoriPengguna`, menggabung data lokal saat login
pertama di perangkat (`akun/gabung.ts`, fungsi murni), dan sesudahnya menarik data server bila antrean kosong. SQL
menjaga "yang terbaru menang" dengan trigger.

**Tech Stack:** TypeScript, React 18, Vitest, Supabase (Postgres + Auth, `@supabase/supabase-js` v2), pgTAP.

**Spec:** `docs/superpowers/specs/2026-09-27-akun-pengguna-design.md` (melanjutkan
`docs/superpowers/specs/2026-09-26-database-portal-admin-design.md`).

## Global Constraints

- Nama variabel/fungsi/komentar bahasa Indonesia; tiap berkas dibuka komentar singkat (terima apa, putuskan apa, serahkan apa).
- Semua akses `localStorage` dibungkus try/catch; kegagalan = aplikasi tetap jalan.
- Web tetap jalan penuh tanpa env Supabase, tanpa internet, dan tanpa login.
- Teks UI hanya lewat `t('halaman.kunci')` dengan kunci literal; kunci baru wajib ditambah ke `apps/web/src/snapshot.json`
  (tes `diksi.test.ts`).
- Hasil hitung tidak pernah dikirim kecuali pengguna menekan Simpan.
- Commit setelah tiap task, hanya berkas task itu, diakhiri `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Perintah tes: `pnpm --filter @waris/web test`, `pnpm --filter @waris/data test`, `pnpm db:tes` (butuh `pnpm db:mulai`).

## Review Focus

1. **Redirect OAuth dengan rute hash** (`#/belajar/...`): alur implisit Supabase menaruh token di hash dan bentrok dengan
   router → klien memakai `flowType: 'pkce'` (kode di query). Tes di Task 7.
2. **localStorage tidak tersedia / isi rusak** (mode privat, JSON sampah): baca progres/antrean/tersimpan tidak melempar,
   kembali kosong. Tes di Task 2 dan Task 4.
3. **Kirim antrean gagal di tengah**: entri yang sudah terkirim hilang dari antrean, sisanya tetap berurutan. Tes Task 6.
4. **Akun lain masuk di perangkat yang sama tanpa Keluar**: data akun lama tidak ikut digabung ke akun baru. Tes Task 6.
5. **Kasus dengan `bigint` disimpan & disinkron**: bolak-balik JSON tetap utuh. Tes Task 3.

---

## Peta berkas

| Berkas | Tanggung jawab |
|---|---|
| `supabase/migrations/20260927000003_akun.sql` | trigger terbaru-menang, tabel & RLS `log_kegiatan` |
| `supabase/tests/database/04_akun.test.sql` | pgTAP untuk migrasi di atas |
| `packages/data/src/antarmuka.ts`, `memori/pengguna.ts`, `supabase/index.ts` | `catatKegiatan` |
| `apps/web/src/progres.ts` (baru) | progres belajar & latihan format baru + migrasi catatan lama + skor paket kuis |
| `apps/web/src/tersimpan.ts` (baru) | kasus tersimpan manual |
| `apps/web/src/akun/antrean.ts` (baru) | antrean perubahan per kunci baris |
| `apps/web/src/akun/gabung.ts` (baru) | penggabungan lokal+server, murni |
| `apps/web/src/akun/sinkron.ts` (baru) | kirim antrean, login pertama, tarik, keluar |
| `apps/web/src/akun/klien.ts` (baru) | satu klien Supabase web (sesi tersimpan, PKCE) |
| `apps/web/src/akun/TombolAkun.tsx` (baru) | tombol masuk / menu keluar di header |
| `apps/web/src/preferensi.ts` | preferensi tersinkron: kumpul/terapkan + antre saat berubah; catatan lama dihapus |

---

### Task 1: Database — terbaru menang & `log_kegiatan`

**Files:**
- Create: `supabase/migrations/20260927000003_akun.sql`
- Create: `supabase/tests/database/04_akun.test.sql`
- Modify: `packages/data/src/antarmuka.ts` (interface `RepositoriPengguna`, tipe `Kegiatan`)
- Modify: `packages/data/src/memori/pengguna.ts`, `packages/data/src/supabase/index.ts`
- Test: `packages/data/src/__tests__/memori-pengguna.test.ts`

**Interfaces:**
- Produces: `export interface Kegiatan { id: string; jenis: 'pelajaran' | 'soal' | 'kuis'; slug: string; benar: boolean | null }`
  dan `RepositoriPengguna.catatKegiatan(kegiatan: Kegiatan): Promise<void>` (id sama dua kali = diabaikan).

- [ ] **Step 1: Tulis tes pgTAP yang gagal** — `supabase/tests/database/04_akun.test.sql`:

```sql
-- supabase/tests/database/04_akun.test.sql
-- Spec akun pengguna: data lebih lama tidak menimpa yang lebih baru; log_kegiatan hanya bisa ditambah pemiliknya.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'a@tes.local'),
  ('00000000-0000-0000-0000-0000000000d2', 'b@tes.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated"}';

insert into progres_belajar (pelajaran_slug, selesai, diubah_pada) values ('ashabah-1', true, '2026-09-27T10:00Z');
insert into progres_belajar (pelajaran_slug, selesai, diubah_pada) values ('ashabah-1', false, '2026-09-27T09:00Z')
  on conflict (user_id, pelajaran_slug) do update set selesai = excluded.selesai, diubah_pada = excluded.diubah_pada;
select is((select selesai from progres_belajar), true, 'upsert dengan diubah_pada lebih lama diabaikan');

insert into progres_belajar (pelajaran_slug, selesai, diubah_pada) values ('ashabah-1', false, '2026-09-27T11:00Z')
  on conflict (user_id, pelajaran_slug) do update set selesai = excluded.selesai, diubah_pada = excluded.diubah_pada;
select is((select selesai from progres_belajar), false, 'upsert yang lebih baru menimpa');

insert into riwayat_hitung (id, kasus, judul, disimpan_pada) values ('k1', '{}', 'baru', '2026-09-27T10:00Z');
insert into riwayat_hitung (id, kasus, judul, disimpan_pada) values ('k1', '{}', 'lama', '2026-09-27T09:00Z')
  on conflict (user_id, id) do update set judul = excluded.judul, disimpan_pada = excluded.disimpan_pada;
select is((select judul from riwayat_hitung), 'baru', 'riwayat_hitung memakai disimpan_pada');

select lives_ok($$insert into log_kegiatan (id, jenis, slug, benar) values ('30000000-0000-0000-0000-000000000001', 'kuis', 'K-01', true)$$,
  'pemilik bisa menambah log');
select ok((select terjadi_pada from log_kegiatan) <= now(), 'terjadi_pada diisi server');
select throws_ok($$insert into log_kegiatan (jenis, slug, terjadi_pada) values ('kuis', 'K-02', '2020-01-01')$$,
  '42501', null, 'terjadi_pada tidak bisa diisi klien');
update log_kegiatan set slug = 'ubah';
delete from log_kegiatan;
select is((select slug from log_kegiatan), 'K-01', 'log tidak bisa diubah atau dihapus');

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d2", "role": "authenticated"}';
select is((select count(*) from log_kegiatan), 0::bigint, 'log orang lain tidak terbaca');

select * from finish();
rollback;
```

- [ ] **Step 2: Jalankan, pastikan gagal** — `pnpm db:reset && pnpm db:tes`. Expected: FAIL (`log_kegiatan` tidak ada, upsert lama menimpa).

- [ ] **Step 3: Tulis migrasi** — `supabase/migrations/20260927000003_akun.sql`:

```sql
-- supabase/migrations/20260927000003_akun.sql
-- Akun pengguna (spec 2026-09-27): baris yang lebih lama tidak menimpa yang lebih baru (jam perangkat bisa salah),
-- dan log_kegiatan = catatan mentah untuk streak/leaderboard tahap 5 (hanya bisa ditambah, waktu dari server).

-- Dalam INSERT ... ON CONFLICT DO UPDATE, trigger BEFORE UPDATE yang mengembalikan null membatalkan pembaruan baris itu.
-- tg_argv[0] = nama kolom waktu.
create function tolak_data_lebih_lama() returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) ->> tg_argv[0])::timestamptz <= (to_jsonb(old) ->> tg_argv[0])::timestamptz then
    return null;
  end if;
  return new;
end $$;

create trigger terbaru_menang before update on riwayat_hitung
  for each row execute function tolak_data_lebih_lama('disimpan_pada');
create trigger terbaru_menang before update on progres_belajar
  for each row execute function tolak_data_lebih_lama('diubah_pada');
create trigger terbaru_menang before update on progres_latihan
  for each row execute function tolak_data_lebih_lama('diubah_pada');
create trigger terbaru_menang before update on preferensi
  for each row execute function tolak_data_lebih_lama('diubah_pada');

create table log_kegiatan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  jenis text not null check (jenis in ('pelajaran', 'soal', 'kuis')),
  slug text not null,
  benar boolean,
  terjadi_pada timestamptz not null default now()
);
create index log_kegiatan_pengguna_waktu on log_kegiatan (user_id, terjadi_pada);

alter table log_kegiatan enable row level security;
create policy tambah_sendiri on log_kegiatan for insert to authenticated with check (user_id = auth.uid());
create policy baca_sendiri on log_kegiatan for select to authenticated using (user_id = auth.uid());
-- Waktu hanya dari server: klien tidak diberi hak menulis kolom terjadi_pada.
revoke insert on log_kegiatan from authenticated;
grant insert (id, jenis, slug, benar) on log_kegiatan to authenticated;
```

- [ ] **Step 4: Jalankan** — `pnpm db:reset && pnpm db:tes`. Expected: semua PASS (termasuk 01–03).

- [ ] **Step 5: Tes memori yang gagal** — tambahkan ke `memori-pengguna.test.ts` di dalam `describe`:

```ts
  test('catatKegiatan: id sama diabaikan, tanpa sesi ditolak', async () => {
    const bersama = buatMemori({ sesi: A });
    const { pengguna } = buatMemoriPengguna(bersama);
    const kegiatan = { id: 'u1', jenis: 'kuis' as const, slug: 'K-01', benar: true };
    await pengguna.catatKegiatan(kegiatan);
    await expect(pengguna.catatKegiatan(kegiatan)).resolves.toBeUndefined();
    bersama.masukSebagai(null);
    await expect(pengguna.catatKegiatan(kegiatan)).rejects.toThrow('belum masuk');
  });
```

- [ ] **Step 6: Jalankan** — `pnpm --filter @waris/data test`. Expected: FAIL `catatKegiatan is not a function`.

- [ ] **Step 7: Implementasi**

`antarmuka.ts` — setelah `Preferensi`:
```ts
/** Satu kegiatan belajar selesai (spec akun: dasar streak tahap 5). `id` dibuat klien supaya kirim ulang tidak dobel. */
export interface Kegiatan { id: string; jenis: 'pelajaran' | 'soal' | 'kuis'; slug: string; benar: boolean | null }
```
dan di `RepositoriPengguna`: `catatKegiatan(kegiatan: Kegiatan): Promise<void>;`

`memori/pengguna.ts` — tambah `const kegiatan = new Map<string, Kegiatan>();` dan
```ts
    async catatKegiatan(baris) { if (!kegiatan.has(kunci(baris.id))) kegiatan.set(kunci(baris.id), baris); },
```

`supabase/index.ts` — di `pengguna`:
```ts
    async catatKegiatan(baris) {
      await hasil(klien.from('log_kegiatan').upsert(
        { id: baris.id, jenis: baris.jenis, slug: baris.slug, benar: baris.benar }, { onConflict: 'id', ignoreDuplicates: true }));
    },
```
(`index.ts` sudah `export * from './antarmuka.js'`, jadi `Kegiatan` ikut terekspor.)

- [ ] **Step 8: Jalankan** — `pnpm --filter @waris/data test`. Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/20260927000003_akun.sql supabase/tests/database/04_akun.test.sql packages/data/src
git commit -m "db: terbaru menang per baris & log_kegiatan untuk tahap 5"
```

---

### Task 2: Progres belajar & latihan format baru (`progres.ts`)

**Files:**
- Create: `apps/web/src/penyimpanan.ts` (fungsi `baca`/`simpan` + `cadangan` dari `preferensi.ts` dipindah ke sini)
- Create: `apps/web/src/progres.ts`
- Create: `apps/web/src/__tests__/progres.test.ts`
- Modify: `apps/web/src/preferensi.ts` (pakai `penyimpanan.ts`; hapus `JenisCatatan`, `bacaCatatan`, `simpanCatatan`,
  `bacaPelajaranSelesai`, `tandaiPelajaranSelesai`; `resetProgresBelajar` pindah ke `progres.ts`)
- Modify pemakai: `Aplikasi.tsx:149`, `layar/belajar/Materi.tsx`, `Belajar.tsx`, `Latihan.tsx`, `KuisKonsep.tsx`,
  `layar/AwalHitung.tsx`, `layar/Beranda.tsx`

**Interfaces:**
- Consumes: `ProgresBelajar`, `ProgresLatihan` dari `@waris/data`.
- Produces (dipakai Task 4 & 6):
  - `bacaProgresBelajar(): Record<string, ProgresBelajar>` (kunci = slug)
  - `bacaPelajaranSelesai(): Set<string>`, `tandaiPelajaranSelesai(slug: string): void`
  - `bacaProgresLatihan(jenis: 'kuis' | 'hitung'): Record<string, ProgresLatihan>` (kunci = soalSlug)
  - `catatLatihan(jenis: 'kuis' | 'hitung', soalSlug: string, benar: boolean, jawaban: unknown): void`
  - `bacaSkorPaket(): Record<string, string>`, `simpanSkorPaket(paket: string, skor: string): void`
  - `resetProgresBelajar(): void`
  - `semuaProgres(): { belajar: ProgresBelajar[]; latihan: ProgresLatihan[] }`,
    `gantiSemuaProgres(data: { belajar: ProgresBelajar[]; latihan: ProgresLatihan[] }): void`
  - `penyimpanan.ts`: `bacaMentah(kunci): string | null`, `simpanMentah(kunci, nilai): void`, `hapusMentah(kunci): void`,
    `hapusSemuaMentah(awalan: string): void` — localStorage dengan cadangan memori (dipakai progres, tersimpan,
    preferensi, antrean, sinkron; dibuat di task ini supaya tidak ada impor melingkar nanti).

- [ ] **Step 1: Tes yang gagal** — `apps/web/src/__tests__/progres.test.ts`:

```ts
import { beforeEach, expect, test, vi } from 'vitest';
import {
  bacaPelajaranSelesai, bacaProgresBelajar, bacaProgresLatihan, bacaSkorPaket, catatLatihan, resetProgresBelajar,
  tandaiPelajaranSelesai,
} from '../progres';

const WAKTU_LAMA = new Date(0).toISOString();
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-27T10:00:00Z')); });

test('pelajaran selesai tercatat dengan waktu', () => {
  tandaiPelajaranSelesai('ashabah-1');
  expect(bacaPelajaranSelesai()).toEqual(new Set(['ashabah-1']));
  expect(bacaProgresBelajar()['ashabah-1']).toEqual({ pelajaranSlug: 'ashabah-1', selesai: true, diubahPada: '2026-09-27T10:00:00.000Z' });
});

test('latihan: jumlah coba bertambah, jawaban & benar terakhir disimpan', () => {
  catatLatihan('kuis', 'K-01', false, 2);
  catatLatihan('kuis', 'K-01', true, 1);
  expect(bacaProgresLatihan('kuis')['K-01']).toMatchObject({ jenis: 'kuis', benar: true, jumlahCoba: 2, jawabanTerakhir: 1 });
  expect(bacaProgresLatihan('hitung')).toEqual({});
});

test('catatan format lama dimigrasi sekali: waktu 0, jumlah coba 1, skor paket dipisah', () => {
  localStorage.setItem('arif-waris:catatan:pelajaran', JSON.stringify({ 'ashabah-1': 'selesai' }));
  localStorage.setItem('arif-waris:catatan:soal', JSON.stringify({ 'H-01': 'selesai' }));
  localStorage.setItem('arif-waris:catatan:kuis', JSON.stringify({ 'K-01': 'salah', 'bab-9': '3/5' }));
  expect(bacaProgresBelajar()['ashabah-1']).toEqual({ pelajaranSlug: 'ashabah-1', selesai: true, diubahPada: WAKTU_LAMA });
  expect(bacaProgresLatihan('hitung')['H-01']).toMatchObject({ benar: true, jumlahCoba: 1, jawabanTerakhir: null, diubahPada: WAKTU_LAMA });
  expect(bacaProgresLatihan('kuis')['K-01']).toMatchObject({ benar: false, jumlahCoba: 1 });
  expect(bacaSkorPaket()).toEqual({ 'bab-9': '3/5' });
  expect(localStorage.getItem('arif-waris:catatan:kuis')).toBeNull();
});

test('isi rusak dibaca sebagai kosong', () => {
  localStorage.setItem('arif-waris:progres-belajar', '{rusak');
  localStorage.setItem('arif-waris:progres-latihan', '[1,2]');
  expect(bacaProgresBelajar()).toEqual({});
  expect(bacaProgresLatihan('kuis')).toEqual({});
});

test('reset menghapus progres & skor paket', () => {
  tandaiPelajaranSelesai('a');
  catatLatihan('kuis', 'K-01', true, 0);
  resetProgresBelajar();
  expect(bacaPelajaranSelesai().size).toBe(0);
  expect(bacaProgresLatihan('kuis')).toEqual({});
});
```

- [ ] **Step 2: Jalankan** — `pnpm --filter @waris/web test progres`. Expected: FAIL (modul tidak ada).

- [ ] **Step 3: Implementasi** — `apps/web/src/progres.ts`:

```ts
// Progres belajar (pelajaran selesai) dan latihan (kuis & soal hitung) di perangkat, berbentuk sama dengan tabel
// progres_belajar / progres_latihan supaya bisa disinkron apa adanya (spec akun pengguna "Data lokal").
// Catatan format lama ('selesai' / 'benar' / 'salah' / skor paket) dimigrasi sekali saat pertama dibaca.
// Skor terakhir per paket kuis hanya untuk tampilan dan tetap lokal.

import type { ProgresBelajar, ProgresLatihan } from '@waris/data';
import { hapusMentah, bacaMentah, simpanMentah } from './penyimpanan';
import { hapusAktivitas } from './preferensi';

type JenisLatihan = ProgresLatihan['jenis'];

const KUNCI_BELAJAR = 'arif-waris:progres-belajar';
const KUNCI_LATIHAN = 'arif-waris:progres-latihan';
const KUNCI_SKOR_PAKET = 'arif-waris:skor-paket';
const AWALAN_CATATAN_LAMA = 'arif-waris:catatan:';
/** Data hasil migrasi kalah dari data mana pun yang punya waktu (spec: diubahPada = 0). */
const WAKTU_LAMA = new Date(0).toISOString();

export function bacaProgresBelajar(): Record<string, ProgresBelajar> {
  migrasiCatatanLama();
  return bacaObjek<ProgresBelajar>(KUNCI_BELAJAR);
}

export const bacaPelajaranSelesai = (): Set<string> =>
  new Set(Object.values(bacaProgresBelajar()).filter(progres => progres.selesai).map(progres => progres.pelajaranSlug));

export function tandaiPelajaranSelesai(slug: string): void {
  const baris: ProgresBelajar = { pelajaranSlug: slug, selesai: true, diubahPada: new Date().toISOString() };
  simpanMentah(KUNCI_BELAJAR, JSON.stringify({ ...bacaProgresBelajar(), [slug]: baris }));
}

export function bacaProgresLatihan(jenis: JenisLatihan): Record<string, ProgresLatihan> {
  migrasiCatatanLama();
  return Object.fromEntries(Object.values(bacaObjek<ProgresLatihan>(KUNCI_LATIHAN))
    .filter(progres => progres.jenis === jenis).map(progres => [progres.soalSlug, progres]));
}

export function catatLatihan(jenis: JenisLatihan, soalSlug: string, benar: boolean, jawaban: unknown): void {
  const semua = bacaObjek<ProgresLatihan>(KUNCI_LATIHAN);
  const sebelumnya = semua[kunciLatihan(jenis, soalSlug)];
  const baris: ProgresLatihan = {
    soalSlug, jenis, benar, jawabanTerakhir: jawaban ?? null,
    jumlahCoba: (sebelumnya?.jumlahCoba ?? 0) + 1, diubahPada: new Date().toISOString(),
  };
  simpanMentah(KUNCI_LATIHAN, JSON.stringify({ ...semua, [kunciLatihan(jenis, soalSlug)]: baris }));
}

export const bacaSkorPaket = (): Record<string, string> => bacaObjek<string>(KUNCI_SKOR_PAKET);
export const simpanSkorPaket = (paket: string, skor: string): void =>
  simpanMentah(KUNCI_SKOR_PAKET, JSON.stringify({ ...bacaSkorPaket(), [paket]: skor }));

/** Reset progres belajar: pelajaran selesai, latihan, skor paket, dan jejak belajar. Riwayat hitung tidak tersentuh. */
export function resetProgresBelajar(): void {
  [KUNCI_BELAJAR, KUNCI_LATIHAN, KUNCI_SKOR_PAKET].forEach(kunci => simpanMentah(kunci, '{}'));
  hapusAktivitas();
}

/** Untuk sinkron akun: semua baris progres di perangkat. */
export const semuaProgres = (): { belajar: ProgresBelajar[]; latihan: ProgresLatihan[] } => ({
  belajar: Object.values(bacaProgresBelajar()), latihan: Object.values(bacaObjek<ProgresLatihan>(KUNCI_LATIHAN)),
});

export function gantiSemuaProgres(data: { belajar: ProgresBelajar[]; latihan: ProgresLatihan[] }): void {
  simpanMentah(KUNCI_BELAJAR, JSON.stringify(Object.fromEntries(data.belajar.map(baris => [baris.pelajaranSlug, baris]))));
  simpanMentah(KUNCI_LATIHAN, JSON.stringify(Object.fromEntries(data.latihan.map(baris => [kunciLatihan(baris.jenis, baris.soalSlug), baris]))));
}

const kunciLatihan = (jenis: JenisLatihan, soalSlug: string) => `${jenis}:${soalSlug}`;

function bacaObjek<T>(kunci: string): Record<string, T> {
  try {
    const nilai: unknown = JSON.parse(bacaMentah(kunci) ?? '{}');
    return nilai && typeof nilai === 'object' && !Array.isArray(nilai) ? nilai as Record<string, T> : {};
  } catch {
    return {};
  }
}

function migrasiCatatanLama(): void {
  const lama = (jenis: 'pelajaran' | 'soal' | 'kuis') => bacaObjek<string>(AWALAN_CATATAN_LAMA + jenis);
  const [pelajaran, soal, kuis] = [lama('pelajaran'), lama('soal'), lama('kuis')];
  if (!Object.keys(pelajaran).length && !Object.keys(soal).length && !Object.keys(kuis).length) return;

  const belajar = Object.keys(pelajaran).map((slug): ProgresBelajar => ({ pelajaranSlug: slug, selesai: true, diubahPada: WAKTU_LAMA }));
  const latihanLama = (jenis: JenisLatihan, soalSlug: string, benar: boolean): ProgresLatihan =>
    ({ soalSlug, jenis, benar, jawabanTerakhir: null, jumlahCoba: 1, diubahPada: WAKTU_LAMA });
  // Soal hitung lama hanya mencatat "jawaban dibuka" → dianggap benar (spec "Data lokal").
  const latihan = [
    ...Object.keys(soal).map(slug => latihanLama('hitung', slug, true)),
    ...Object.entries(kuis).filter(([, nilai]) => nilai === 'benar' || nilai === 'salah')
      .map(([slug, nilai]) => latihanLama('kuis', slug, nilai === 'benar')),
  ];
  const skorPaket = Object.fromEntries(Object.entries(kuis).filter(([, nilai]) => nilai.includes('/')));

  gantiSemuaProgres({
    belajar: [...belajar, ...Object.values(bacaObjek<ProgresBelajar>(KUNCI_BELAJAR))],
    latihan: [...latihan, ...Object.values(bacaObjek<ProgresLatihan>(KUNCI_LATIHAN))],
  });
  simpanMentah(KUNCI_SKOR_PAKET, JSON.stringify({ ...skorPaket, ...bacaSkorPaket() }));
  (['pelajaran', 'soal', 'kuis'] as const).forEach(jenis => hapusMentah(AWALAN_CATATAN_LAMA + jenis));
}
```

`apps/web/src/penyimpanan.ts`:

```ts
// Akses localStorage dengan cadangan memori: mode privat / penyimpanan penuh tidak mematikan aplikasi, nilai bertahan
// selama sesi. Dipakai semua modul data pengguna (preferensi, progres, tersimpan, antrean akun).

const cadangan = new Map<string, string>();

export function bacaMentah(kunci: string): string | null {
  try {
    return localStorage.getItem(kunci) ?? cadangan.get(kunci) ?? null;
  } catch {
    return cadangan.get(kunci) ?? null;
  }
}

export function simpanMentah(kunci: string, nilai: string): void {
  cadangan.set(kunci, nilai);
  try {
    localStorage.setItem(kunci, nilai);
  } catch {
    // Mode privat / penyimpanan penuh: cukup di memori.
  }
}

export function hapusMentah(kunci: string): void {
  cadangan.delete(kunci);
  try {
    localStorage.removeItem(kunci);
  } catch {
    // Tidak bisa dihapus: cukup dari memori.
  }
}

/** Semua kunci berawalan `awalan`, di localStorage dan cadangan (dipakai saat keluar akun). */
export function hapusSemuaMentah(awalan: string): void {
  [...cadangan.keys()].filter(kunci => kunci.startsWith(awalan)).forEach(kunci => cadangan.delete(kunci));
  try {
    Object.keys(localStorage).filter(kunci => kunci.startsWith(awalan)).forEach(kunci => localStorage.removeItem(kunci));
  } catch {
    // localStorage tidak tersedia: cadangan sudah dibersihkan.
  }
}

/** Kunci berawalan `awalan` yang ada (localStorage + cadangan). */
export function daftarKunci(awalan: string): string[] {
  let tersimpan: string[] = [];
  try {
    tersimpan = Object.keys(localStorage);
  } catch {
    // hanya cadangan
  }
  return [...new Set([...tersimpan, ...cadangan.keys()])].filter(kunci => kunci.startsWith(awalan));
}
```

Di `preferensi.ts`: hapus `cadangan`, `baca`, `simpan`; impor `bacaMentah`/`simpanMentah` dari `./penyimpanan` dan ganti
semua pemanggilan. Hapus `AWALAN_CATATAN`, `JenisCatatan`, `bacaCatatan`, `simpanCatatan`, `bacaPelajaranSelesai`,
`tandaiPelajaranSelesai`, `resetProgresBelajar`. Perbarui komentar kepala berkas (catatan belajar pindah ke `progres.ts`,
akses penyimpanan ke `penyimpanan.ts`).

- [ ] **Step 4: Ganti pemakai**
  - `Aplikasi.tsx` `tandaiSoalDikerjakan`: `catatLatihan('hitung', soal.kode, true, null);` (tetap "jawaban dibuka" = benar,
    sama dengan migrasi).
  - `Materi.tsx`: impor `bacaPelajaranSelesai`, `tandaiPelajaranSelesai` dari `../../progres`.
  - `Belajar.tsx`: `resetProgresBelajar`, `bacaPelajaranSelesai` dari progres; `bacaCatatan('soal')` → `bacaProgresLatihan('hitung')`;
    `bacaCatatan('kuis')[soal.kode] === 'benar'` → `bacaProgresLatihan('kuis')[soal.kode]?.benar`.
  - `Latihan.tsx`, `AwalHitung.tsx`, `Beranda.tsx`: `bacaCatatan('soal')` → `bacaProgresLatihan('hitung')` (dipakai sebagai
    "ada/tidak", tetap cocok).
  - `KuisKonsep.tsx`: `DaftarPaketKuis` baca `bacaSkorPaket()` untuk skor paket (ganti `catatan[PAKET_ACAK]` dan setiap
    `catatan[kodePaket...]`); `selesaikan`:
    ```ts
    daftarSoal.forEach((soalIni, urutan) => catatLatihan('kuis', soalIni.kode, pilihan[urutan] === soalIni.indeksBenar, pilihan[urutan] ?? null));
    simpanSkorPaket(paket, skor);
    ```

- [ ] **Step 5: Jalankan semua tes web** — `pnpm --filter @waris/web test && pnpm --filter @waris/web build`.
  Expected: PASS; perbaiki tes lama (`belajar.test.tsx`, `latihan.test.tsx`, `materi.test.tsx`) yang menulis kunci
  `arif-waris:catatan:*` langsung — ganti ke `tandaiPelajaranSelesai`/`catatLatihan`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src
git commit -m "web: progres belajar & latihan berformat tabel, migrasi catatan lama"
```

---

### Task 3: Kasus tersimpan manual (`tersimpan.ts`) + tombol Simpan

**Files:**
- Create: `apps/web/src/tersimpan.ts`, `apps/web/src/__tests__/tersimpan.test.ts`
- Modify: `apps/web/src/layar/Hasil.tsx` (bar aksi, sekitar baris 187), `apps/web/src/layar/Riwayat.tsx`,
  `apps/web/src/riwayat.ts` (komentar kepala: "Terakhir dibuka"), `apps/web/src/snapshot.json` (diksi baru)

**Interfaces:**
- Consumes: `RiwayatTersimpan` dari `@waris/data`; `keJson`, `dariJson`, `Kasus` dari `./kasus`; `ringkasKasus` dari `./riwayat`.
- Produces:
  - `bacaTersimpan(): Array<{ id: string; judul: string; disimpanPada: string; kasus: Kasus }>` (terbaru di atas, entri rusak dibuang)
  - `simpanKasus(id: string, kasus: Kasus): void`, `hapusTersimpan(id: string): void`, `sudahTersimpan(id: string, kasus: Kasus): boolean`
  - `semuaTersimpan(): RiwayatTersimpan[]`, `gantiSemuaTersimpan(daftar: RiwayatTersimpan[]): void`

- [ ] **Step 1: Tes yang gagal** — `apps/web/src/__tests__/tersimpan.test.ts`:

```ts
import { beforeEach, expect, test } from 'vitest';
import { tambahAhliWaris } from '../checklist';
import { kasusBaru, keJson } from '../kasus';
import { bacaTersimpan, hapusTersimpan, semuaTersimpan, simpanKasus, sudahTersimpan } from '../tersimpan';

const kasus = () => {
  const dasar = kasusBaru('L');
  return { ...dasar, tirkah: { ...dasar.tirkah, kotor: 123_456_789_012_345_678n }, graf: tambahAhliWaris(dasar.graf, 'PEWARIS', 'ISTRI') };
};
beforeEach(() => localStorage.clear());

test('simpan, timpa per id, hapus; bigint utuh', () => {
  simpanKasus('a', kasus());
  simpanKasus('a', kasus());
  expect(semuaTersimpan()).toHaveLength(1);
  const [entri] = bacaTersimpan();
  expect(entri!.judul).toBe('Istri');
  expect(keJson(entri!.kasus)).toBe(keJson(kasus()));
  expect(sudahTersimpan('a', kasus())).toBe(true);
  hapusTersimpan('a');
  expect(bacaTersimpan()).toEqual([]);
});

test('isi rusak diabaikan', () => {
  localStorage.setItem('arif-waris:tersimpan', JSON.stringify([{ id: 'x', kasus: { bukan: 'kasus' }, judul: 'x', disimpanPada: 'z' }]));
  expect(bacaTersimpan()).toEqual([]);
});
```

- [ ] **Step 2: Jalankan** — `pnpm --filter @waris/web test tersimpan`. Expected: FAIL.

- [ ] **Step 3: Implementasi** — `apps/web/src/tersimpan.ts`:

```ts
// Kasus tersimpan: hanya yang pengguna simpan lewat tombol Simpan di layar hasil; tanpa kedaluwarsa; ikut disinkron
// ke akun (spec akun pengguna). Beda dengan riwayat.ts ("Terakhir dibuka") yang otomatis dan hanya di perangkat.
// Disimpan berbentuk RiwayatTersimpan dengan kasus = objek JSON dari keJson (bigint sebagai teks).

import type { RiwayatTersimpan } from '@waris/data';
import { dariJson, keJson, type Kasus } from './kasus';
import { bacaMentah, simpanMentah } from './penyimpanan';
import { ringkasKasus } from './riwayat';

const KUNCI_TERSIMPAN = 'arif-waris:tersimpan';

export function bacaTersimpan(): Array<{ id: string; judul: string; disimpanPada: string; kasus: Kasus }> {
  return semuaTersimpan().flatMap(baris => {
    const hasil = dariJson(JSON.stringify(baris.kasus));
    return hasil.berhasil ? [{ id: baris.id, judul: baris.judul, disimpanPada: baris.disimpanPada, kasus: hasil.kasus }] : [];
  }).sort((a, b) => b.disimpanPada.localeCompare(a.disimpanPada));
}

export function simpanKasus(id: string, kasus: Kasus): void {
  const baris: RiwayatTersimpan = { id, kasus: JSON.parse(keJson(kasus)), judul: ringkasKasus(kasus).judul, disimpanPada: new Date().toISOString() };
  gantiSemuaTersimpan([baris, ...semuaTersimpan().filter(lain => lain.id !== id)]);
}

export const hapusTersimpan = (id: string): void => gantiSemuaTersimpan(semuaTersimpan().filter(baris => baris.id !== id));

export const sudahTersimpan = (id: string, kasus: Kasus): boolean =>
  semuaTersimpan().some(baris => baris.id === id && JSON.stringify(baris.kasus) === keJson(kasus));

export function semuaTersimpan(): RiwayatTersimpan[] {
  try {
    const daftar: unknown = JSON.parse(bacaMentah(KUNCI_TERSIMPAN) ?? '[]');
    return Array.isArray(daftar) ? daftar.filter((baris): baris is RiwayatTersimpan => typeof baris?.id === 'string') : [];
  } catch {
    return [];
  }
}

export const gantiSemuaTersimpan = (daftar: RiwayatTersimpan[]): void => simpanMentah(KUNCI_TERSIMPAN, JSON.stringify(daftar));
```

(Pastikan `keJson` menghasilkan JSON dengan urutan kunci stabil — `sudahTersimpan` membandingkan teks. Bila `keJson` tidak
memakai `JSON.stringify` biasa, bandingkan `keJson(dariJson(JSON.stringify(baris.kasus)).kasus)` dengan `keJson(kasus)`.)

- [ ] **Step 4: Jalankan** — Expected: PASS.

- [ ] **Step 5: UI**
  - `Hasil.tsx`: terima prop `idSesi: string` (diteruskan dari `Aplikasi.tsx`, yang sudah punya `idSesi`). Ganti
    `<span className="status-simpan">…tersimpan_di_riwayat…</span>` dengan:
    ```tsx
    {sudahTersimpan(idSesi, kasus)
      ? <span className="status-simpan"><Ikon nama="benar" ukuran={16} /> {t('hitung.tersimpan')}</span>
      : <Tombol varian="secondary" onClick={() => { simpanKasus(idSesi, kasus); segarkan(); }}><Ikon nama="simpan" /> {t('umum.simpan')}</Tombol>}
    ```
    dengan `const [, segarkan] = useReducer((n: number) => n + 1, 0);`. Pakai ikon yang ada di `ui/Ikon.tsx` (cek nama;
    bila tak ada `simpan`, pakai `unduh` bukan — pilih ikon penanda/bookmark yang tersedia).
  - `Riwayat.tsx` (`HalamanRiwayat` penuh, bukan versi `ringkas`): bagian baru di atas berjudul `t('hitung.kasus_tersimpan')`
    berisi `bacaTersimpan()`; tiap entri tombol buka (`saatBuka` menerima `{ id, kasus, sumber: { jenis: 'sendiri' } }` —
    sesuaikan dengan bentuk `EntriRiwayat` yang dipakai `bukaRiwayat`) dan hapus lewat `DialogKonfirmasi` yang sama.
    Kosong → `t('hitung.belum_ada_kasus_tersimpan')`. Bagian lama diberi judul `t('hitung.terakhir_dibuka')`.
  - `snapshot.json`: tambah entri diksi (halaman `hitung`, `ar: null`, `versiTerbit: 0`):
    `hitung.tersimpan` "Tersimpan", `hitung.kasus_tersimpan` "Kasus tersimpan", `hitung.terakhir_dibuka` "Terakhir dibuka",
    `hitung.belum_ada_kasus_tersimpan` "Belum ada kasus yang disimpan. Tekan Simpan di layar hasil."
    Hapus `hitung.tersimpan_di_riwayat` bila tak lagi dipakai (tes diksi melaporkan kunci yatim).

- [ ] **Step 6: Tes UI** — tambahkan ke `apps/web/src/__tests__/hasil.test.tsx` (ikuti cara render layar hasil di berkas itu):
  klik tombol "Simpan" → `semuaTersimpan()` berisi 1 entri dan tombol berganti teks "Tersimpan".

- [ ] **Step 7: Jalankan** — `pnpm --filter @waris/web test && pnpm --filter @waris/web build`. Expected: PASS.

- [ ] **Step 8: Commit** — `git add apps/web/src && git commit -m "web: kasus tersimpan manual terpisah dari Terakhir dibuka"`

---

### Task 4: Antrean perubahan (`akun/antrean.ts`) + penulis data mengantre

**Files:**
- Create: `apps/web/src/akun/antrean.ts`, `apps/web/src/__tests__/antrean.test.ts`
- Modify: `apps/web/src/progres.ts`, `apps/web/src/tersimpan.ts`, `apps/web/src/preferensi.ts`

**Interfaces:**
- Consumes: tipe `RiwayatTersimpan`, `ProgresBelajar`, `ProgresLatihan`, `Preferensi`, `Kegiatan`, `RepositoriPengguna` dari `@waris/data`.
- Produces:
  ```ts
  export type EntriAntrean =
    | { tabel: 'tersimpan'; baris: RiwayatTersimpan }
    | { tabel: 'hapus_tersimpan'; id: string }
    | { tabel: 'belajar'; baris: ProgresBelajar }
    | { tabel: 'latihan'; baris: ProgresLatihan }
    | { tabel: 'preferensi'; baris: Preferensi }
    | { tabel: 'kegiatan'; baris: Kegiatan };
  export function akunLokal(): string | null;            // userId yang datanya ada di perangkat
  export function aturAkunLokal(userId: string | null): void;
  export function antre(entri: EntriAntrean): void;      // no-op bila akunLokal() null
  export function bacaAntrean(): EntriAntrean[];
  export function kirimAntrean(pengguna: RepositoriPengguna): Promise<number>; // sisa entri
  export function aturPengirim(kirim: (() => void) | null): void;
  ```
  di `preferensi.ts`: `kumpulPreferensi(): Preferensi | null` (null = belum pernah diubah) dan `terapkanPreferensi(p: Preferensi | null): void`.

- [ ] **Step 1: Tes yang gagal** — `apps/web/src/__tests__/antrean.test.ts`:

```ts
import { beforeEach, expect, test, vi } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { antre, aturAkunLokal, bacaAntrean, kirimAntrean } from '../akun/antrean';
import { catatLatihan, tandaiPelajaranSelesai } from '../progres';
import { kumpulPreferensi, simpanUkuranBaca, terapkanPreferensi, bacaUkuranBaca } from '../preferensi';

const belajar = (slug: string, diubahPada = '2026-09-27T00:00:00Z') => ({ tabel: 'belajar' as const, baris: { pelajaranSlug: slug, selesai: true, diubahPada } });
beforeEach(() => { localStorage.clear(); aturAkunLokal(null); });

test('tanpa akun tidak mengantre', () => {
  antre(belajar('a'));
  expect(bacaAntrean()).toEqual([]);
});

test('entri dengan kunci sama menimpa; kegiatan tidak saling menimpa', () => {
  aturAkunLokal('u');
  antre(belajar('a', '1'));
  antre(belajar('a', '2'));
  antre({ tabel: 'kegiatan', baris: { id: 'k1', jenis: 'kuis', slug: 'K-01', benar: true } });
  antre({ tabel: 'kegiatan', baris: { id: 'k2', jenis: 'kuis', slug: 'K-01', benar: false } });
  expect(bacaAntrean()).toHaveLength(3);
  expect(bacaAntrean()[0]).toMatchObject({ baris: { diubahPada: '2' } });
});

test('gagal di tengah: yang terkirim keluar, sisanya tetap berurutan', async () => {
  aturAkunLokal('u');
  const { pengguna } = buatMemoriPengguna(buatMemori({ sesi: { userId: 'u', email: 'u@tes.local' } }));
  antre(belajar('a'));
  antre(belajar('b'));
  antre(belajar('c'));
  const asli = pengguna.simpanProgresBelajar;
  pengguna.simpanProgresBelajar = vi.fn(async baris => { if (baris.pelajaranSlug === 'b') throw new Error('luring'); return asli(baris); });
  expect(await kirimAntrean(pengguna)).toBe(2);
  expect(bacaAntrean().map(entri => (entri as any).baris.pelajaranSlug)).toEqual(['b', 'c']);
  pengguna.simpanProgresBelajar = asli;
  expect(await kirimAntrean(pengguna)).toBe(0);
  expect((await pengguna.bacaProgresBelajar()).map(baris => baris.pelajaranSlug).sort()).toEqual(['a', 'b', 'c']);
});

test('penulis data mengantre: progres, latihan + kegiatan, preferensi', () => {
  aturAkunLokal('u');
  tandaiPelajaranSelesai('ashabah-1');
  catatLatihan('kuis', 'K-01', true, 0);
  simpanUkuranBaca(20);
  const tabel = bacaAntrean().map(entri => entri.tabel);
  expect(tabel).toEqual(['belajar', 'kegiatan', 'latihan', 'kegiatan', 'preferensi']);
});

test('preferensi: kumpul lalu terapkan bolak-balik', () => {
  simpanUkuranBaca(22);
  const preferensi = kumpulPreferensi()!;
  localStorage.clear();
  terapkanPreferensi(preferensi);
  expect(bacaUkuranBaca()).toBe(22);
});

test('antrean rusak dibaca kosong', () => {
  localStorage.setItem('arif-waris:antrean', 'bukan json');
  expect(bacaAntrean()).toEqual([]);
});
```

- [ ] **Step 2: Jalankan** — Expected: FAIL.

- [ ] **Step 3: Implementasi** — `apps/web/src/akun/antrean.ts`:

```ts
// Antrean perubahan data pengguna yang belum terkirim ke akun (spec akun pengguna "Sinkron"). Hanya aktif bila perangkat
// memegang data sebuah akun (akunLokal). Satu entri per kunci baris: perubahan baru menimpa yang lama, jadi antrean tidak
// membengkak saat luring. Kegiatan (log_kegiatan) berkunci id-nya sendiri, jadi tidak pernah saling menimpa.
// Menerima entri dari progres/tersimpan/preferensi; menyerahkannya ke RepositoriPengguna lewat kirimAntrean.

import type { Kegiatan, Preferensi, ProgresBelajar, ProgresLatihan, RepositoriPengguna, RiwayatTersimpan } from '@waris/data';
import { bacaMentah, hapusMentah, simpanMentah } from '../penyimpanan';

export type EntriAntrean =
  | { tabel: 'tersimpan'; baris: RiwayatTersimpan }
  | { tabel: 'hapus_tersimpan'; id: string }
  | { tabel: 'belajar'; baris: ProgresBelajar }
  | { tabel: 'latihan'; baris: ProgresLatihan }
  | { tabel: 'preferensi'; baris: Preferensi }
  | { tabel: 'kegiatan'; baris: Kegiatan };

const KUNCI_ANTREAN = 'arif-waris:antrean';
const KUNCI_AKUN = 'arif-waris:akun';
let pengirim: (() => void) | null = null;

export const akunLokal = (): string | null => bacaMentah(KUNCI_AKUN);
export const aturAkunLokal = (userId: string | null): void => (userId ? simpanMentah(KUNCI_AKUN, userId) : hapusMentah(KUNCI_AKUN));
/** Dipasang sinkron.ts: dipanggil tiap ada entri baru supaya langsung dicoba kirim. */
export const aturPengirim = (kirim: (() => void) | null): void => { pengirim = kirim; };

export function antre(entri: EntriAntrean): void {
  if (!akunLokal()) return;
  const kunci = kunciEntri(entri);
  // Hapus & simpan tersimpan berbagi kunci: yang terakhir yang berlaku.
  tulis([...bacaAntrean().filter(lama => kunciEntri(lama) !== kunci), entri]);
  pengirim?.();
}

export function bacaAntrean(): EntriAntrean[] {
  try {
    const daftar: unknown = JSON.parse(bacaMentah(KUNCI_ANTREAN) ?? '[]');
    return Array.isArray(daftar) ? daftar.filter((entri): entri is EntriAntrean => typeof entri?.tabel === 'string') : [];
  } catch {
    return [];
  }
}

/** Kirim berurutan; berhenti di kegagalan pertama supaya urutan terjaga. Mengembalikan jumlah entri yang tersisa. */
export async function kirimAntrean(pengguna: RepositoriPengguna): Promise<number> {
  for (const entri of bacaAntrean()) {
    try {
      await kirimSatu(pengguna, entri);
    } catch (galat) {
      console.warn('kirim perubahan akun gagal, dicoba lagi nanti:', galat);
      return bacaAntrean().length;
    }
    // Entri bisa sudah ditimpa versi baru selama menunggu: hanya buang bila masih sama persis.
    tulis(bacaAntrean().filter(sisa => JSON.stringify(sisa) !== JSON.stringify(entri)));
  }
  return bacaAntrean().length;
}

function kirimSatu(pengguna: RepositoriPengguna, entri: EntriAntrean): Promise<void> {
  switch (entri.tabel) {
    case 'tersimpan': return pengguna.simpanRiwayat(entri.baris);
    case 'hapus_tersimpan': return pengguna.hapusRiwayat(entri.id);
    case 'belajar': return pengguna.simpanProgresBelajar(entri.baris);
    case 'latihan': return pengguna.simpanProgresLatihan(entri.baris);
    case 'preferensi': return pengguna.simpanPreferensi(entri.baris);
    case 'kegiatan': return pengguna.catatKegiatan(entri.baris);
  }
}

function kunciEntri(entri: EntriAntrean): string {
  switch (entri.tabel) {
    case 'tersimpan': return `tersimpan:${entri.baris.id}`;
    case 'hapus_tersimpan': return `tersimpan:${entri.id}`;
    case 'belajar': return `belajar:${entri.baris.pelajaranSlug}`;
    case 'latihan': return `latihan:${entri.baris.jenis}:${entri.baris.soalSlug}`;
    case 'preferensi': return 'preferensi';
    case 'kegiatan': return `kegiatan:${entri.baris.id}`;
  }
}

const tulis = (daftar: EntriAntrean[]): void => simpanMentah(KUNCI_ANTREAN, JSON.stringify(daftar));
```

- [ ] **Step 4: Penulis data mengantre**
  - `progres.ts` `tandaiPelajaranSelesai`: setelah simpan,
    `antre({ tabel: 'belajar', baris }); antre({ tabel: 'kegiatan', baris: { id: crypto.randomUUID(), jenis: 'pelajaran', slug, benar: null } });`
    Lewati keduanya bila pelajaran sudah `selesai` sebelumnya (Materi memanggilnya berulang saat menggulir; kegiatan hanya
    sekali per penyelesaian).
  - `catatLatihan`: `antre({ tabel: 'kegiatan', baris: { id: crypto.randomUUID(), jenis: jenis === 'hitung' ? 'soal' : 'kuis', slug: soalSlug, benar } }); antre({ tabel: 'latihan', baris });`
  - `resetProgresBelajar`: reset hanya lokal (server tidak punya operasi hapus progres). Tambah komentar
    `// ponytail: reset tidak menghapus progres di akun; muncul lagi saat tarik berikutnya. Tambah hapus di repo bila dikeluhkan.`
    — lalu, supaya tidak muncul lagi, antre baris `selesai: false` untuk tiap pelajaran yang tadinya selesai, dan untuk
    latihan tidak ada padanan → catat keterbatasan di komentar yang sama.
  - `tersimpan.ts`: `simpanKasus` → `antre({ tabel: 'tersimpan', baris })`; `hapusTersimpan` → `antre({ tabel: 'hapus_tersimpan', id })`.
    `gantiSemuaTersimpan` tidak mengantre (dipakai sinkron).
  - `preferensi.ts`:
    ```ts
    const KUNCI_PREFERENSI_DIUBAH = 'arif-waris:preferensi-diubah';
    /** Preferensi yang ikut ke akun (spec "Data lokal"); aktivitas & skor paket tetap di perangkat. */
    const ikutAkun = (kunci: string) =>
      [KUNCI_TUJUAN, KUNCI_BAHASA, KUNCI_UKURAN_BACA].includes(kunci) || kunci.startsWith(AWALAN_TUR) || kunci.startsWith(AWALAN_PILIHAN);
    ```
    Semua penulis preferensi memanggil satu fungsi lokal `simpanPreferensi(kunci, nilai)` =
    `simpanMentah(kunci, nilai); if (ikutAkun(kunci)) { simpanMentah(KUNCI_PREFERENSI_DIUBAH, new Date().toISOString()); const baris = kumpulPreferensi(); if (baris) antre({ tabel: 'preferensi', baris }); }`.
    `kumpulPreferensi()` membaca kunci dari `daftarKunci('arif-waris:')` yang `ikutAkun`, → `{ isi: { [kunci]: nilai }, diubahPada }`;
    null bila `KUNCI_PREFERENSI_DIUBAH` belum ada. `terapkanPreferensi(p)`: hapus kunci `ikutAkun` yang ada, tulis isi `p`,
    set `KUNCI_PREFERENSI_DIUBAH = p.diubahPada` (tanpa mengantre). Tambahkan `const AWALAN_PILIHAN = 'arif-waris:pilihan:';`
    dan pakai di `bacaPilihan`/`simpanPilihan`. `bahasa`: `simpanBahasa` tetap memanggil pendengar.

- [ ] **Step 5: Jalankan** — `pnpm --filter @waris/web test && pnpm --filter @waris/web build`. Expected: PASS.

- [ ] **Step 6: Commit** — `git add apps/web/src && git commit -m "web: antrean perubahan akun, penulis data mengantre"`

---

### Task 5: Penggabungan (`akun/gabung.ts`)

**Files:**
- Create: `apps/web/src/akun/gabung.ts`, `apps/web/src/__tests__/gabung.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface DataPengguna { tersimpan: RiwayatTersimpan[]; belajar: ProgresBelajar[]; latihan: ProgresLatihan[]; preferensi: Preferensi | null }
  export function gabung(lokal: DataPengguna, server: DataPengguna): { hasil: DataPengguna; kirim: EntriAntrean[] };
  ```

- [ ] **Step 1: Tes yang gagal** — `apps/web/src/__tests__/gabung.test.ts`:

```ts
import { expect, test } from 'vitest';
import { gabung, type DataPengguna } from '../akun/gabung';

const kosong: DataPengguna = { tersimpan: [], belajar: [], latihan: [], preferensi: null };
const simpanan = (id: string, disimpanPada: string, judul = id) => ({ id, kasus: {}, judul, disimpanPada });
const latihan = (diubahPada: string, benar: boolean, jumlahCoba: number) =>
  ({ soalSlug: 'K-01', jenis: 'kuis' as const, jawabanTerakhir: null, benar, jumlahCoba, diubahPada });

test('tersimpan: gabung per id, yang terbaru menang; kirim hanya yang beda dari server', () => {
  const { hasil, kirim } = gabung(
    { ...kosong, tersimpan: [simpanan('a', '2', 'lokal'), simpanan('b', '1')] },
    { ...kosong, tersimpan: [simpanan('a', '1', 'server'), simpanan('c', '1')] });
  expect(hasil.tersimpan.map(baris => [baris.id, baris.judul]).sort()).toEqual([['a', 'lokal'], ['b', 'b'], ['c', 'c']]);
  expect(kirim.map(entri => entri.tabel === 'tersimpan' && entri.baris.id).sort()).toEqual(['a', 'b']);
});

test('progres belajar: selesai = OR, waktu = maksimum', () => {
  const { hasil } = gabung(
    { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: true, diubahPada: '1' }] },
    { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: false, diubahPada: '2' }] });
  expect(hasil.belajar).toEqual([{ pelajaranSlug: 'x', selesai: true, diubahPada: '2' }]);
});

test('progres latihan: terbaru menang, jumlah coba = maksimum', () => {
  const { hasil } = gabung({ ...kosong, latihan: [latihan('1', false, 5)] }, { ...kosong, latihan: [latihan('2', true, 2)] });
  expect(hasil.latihan).toEqual([latihan('2', true, 5)]);
});

test('preferensi: terbaru utuh; server kosong → lokal dikirim', () => {
  const lokal = { isi: { a: '1' }, diubahPada: '1' };
  expect(gabung({ ...kosong, preferensi: lokal }, { ...kosong, preferensi: { isi: { b: '2' }, diubahPada: '2' } }).hasil.preferensi)
    .toEqual({ isi: { b: '2' }, diubahPada: '2' });
  expect(gabung({ ...kosong, preferensi: lokal }, kosong).kirim).toEqual([{ tabel: 'preferensi', baris: lokal }]);
});

test('sama persis di kedua sisi → tidak ada yang dikirim', () => {
  const data = { ...kosong, belajar: [{ pelajaranSlug: 'x', selesai: true, diubahPada: '1' }] };
  expect(gabung(data, data).kirim).toEqual([]);
});
```

(`diubahPada` berupa teks ISO; perbandingan teks cukup karena format sama. Tes memakai '1'/'2' demi ringkas.)

- [ ] **Step 2: Jalankan** — Expected: FAIL.

- [ ] **Step 3: Implementasi** — `apps/web/src/akun/gabung.ts`:

```ts
// Penggabungan data perangkat dengan data akun saat akun pertama kali masuk di perangkat ini (spec akun pengguna
// "Penggabungan"). Fungsi murni: menerima dua sisi, mengembalikan hasil untuk ditulis ke lokal dan daftar baris yang
// harus dikirim karena berbeda dari server.

import type { Preferensi, ProgresBelajar, ProgresLatihan, RiwayatTersimpan } from '@waris/data';
import type { EntriAntrean } from './antrean';

export interface DataPengguna { tersimpan: RiwayatTersimpan[]; belajar: ProgresBelajar[]; latihan: ProgresLatihan[]; preferensi: Preferensi | null }

export function gabung(lokal: DataPengguna, server: DataPengguna): { hasil: DataPengguna; kirim: EntriAntrean[] } {
  const tersimpan = gabungPerKunci(lokal.tersimpan, server.tersimpan, baris => baris.id,
    (a, b) => (a.disimpanPada >= b.disimpanPada ? a : b));
  const belajar = gabungPerKunci(lokal.belajar, server.belajar, baris => baris.pelajaranSlug,
    (a, b) => ({ ...a, selesai: a.selesai || b.selesai, diubahPada: terbaru(a.diubahPada, b.diubahPada) }));
  const latihan = gabungPerKunci(lokal.latihan, server.latihan, baris => `${baris.jenis}:${baris.soalSlug}`,
    (a, b) => ({ ...(a.diubahPada >= b.diubahPada ? a : b), jumlahCoba: Math.max(a.jumlahCoba, b.jumlahCoba) }));
  const preferensi = !lokal.preferensi || !server.preferensi ? lokal.preferensi ?? server.preferensi
    : lokal.preferensi.diubahPada > server.preferensi.diubahPada ? lokal.preferensi : server.preferensi;

  const bedaDariServer = <T>(daftar: T[], dariServer: T[]) => {
    const ada = new Set(dariServer.map(baris => JSON.stringify(baris)));
    return daftar.filter(baris => !ada.has(JSON.stringify(baris)));
  };
  const kirim: EntriAntrean[] = [
    ...bedaDariServer(tersimpan, server.tersimpan).map(baris => ({ tabel: 'tersimpan' as const, baris })),
    ...bedaDariServer(belajar, server.belajar).map(baris => ({ tabel: 'belajar' as const, baris })),
    ...bedaDariServer(latihan, server.latihan).map(baris => ({ tabel: 'latihan' as const, baris })),
    ...(preferensi && JSON.stringify(preferensi) !== JSON.stringify(server.preferensi) ? [{ tabel: 'preferensi' as const, baris: preferensi }] : []),
  ];
  return { hasil: { tersimpan, belajar, latihan, preferensi }, kirim };
}

const terbaru = (a: string, b: string) => (a >= b ? a : b);

function gabungPerKunci<T>(lokal: T[], server: T[], kunci: (baris: T) => string, pilih: (lokal: T, server: T) => T): T[] {
  const hasil = new Map(server.map(baris => [kunci(baris), baris]));
  for (const baris of lokal) {
    const dariServer = hasil.get(kunci(baris));
    hasil.set(kunci(baris), dariServer ? pilih(baris, dariServer) : baris);
  }
  return [...hasil.values()];
}
```

Catatan: data dari server berformat waktu Postgres (`2026-09-27T10:00:00+00:00`) sedangkan lokal `toISOString()`
(`...000Z`). Perbandingan teks keliru bila formatnya beda → di Task 6, normalkan semua waktu dari server dengan
`new Date(x).toISOString()` sebelum masuk `gabung` dan sebelum ditulis ke lokal.

- [ ] **Step 4: Jalankan** — Expected: PASS.
- [ ] **Step 5: Commit** — `git add apps/web/src/akun/gabung.ts apps/web/src/__tests__/gabung.test.ts && git commit -m "web: penggabungan data lokal dan akun"`

---

### Task 6: Sinkron akun (`akun/sinkron.ts`)

**Files:**
- Create: `apps/web/src/akun/sinkron.ts`, `apps/web/src/__tests__/sinkron-akun.test.ts`

**Interfaces:**
- Consumes: `antrean.ts` (Task 4), `gabung` (Task 5), `semuaProgres`/`gantiSemuaProgres` (Task 2),
  `semuaTersimpan`/`gantiSemuaTersimpan` (Task 3), `kumpulPreferensi`/`terapkanPreferensi` (Task 4).
- Produces:
  ```ts
  export interface RepoAkun { akun: RepositoriAkun; pengguna: RepositoriPengguna }
  /** Saat aplikasi dibuka / kembali dari login. Tidak pernah melempar. Mengembalikan sesi (null = tidak masuk). */
  export function mulaiSinkron(repo: RepoAkun, saatDataBerubah: () => void): Promise<Sesi | null>;
  /** Kirim antrean dengan batas tunggu; jumlah yang belum terkirim. */
  export function kirimSebelumKeluar(repo: RepoAkun, batasMs?: number): Promise<number>;
  /** Keluar dari akun & hapus semua kunci arif-waris:* di perangkat. */
  export function keluarDanBersihkan(repo: RepoAkun): Promise<void>;
  ```

- [ ] **Step 1: Tes yang gagal** — `apps/web/src/__tests__/sinkron-akun.test.ts`:

```ts
import { beforeEach, expect, test, vi } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { akunLokal, bacaAntrean } from '../akun/antrean';
import { keluarDanBersihkan, kirimSebelumKeluar, mulaiSinkron } from '../akun/sinkron';
import { bacaPelajaranSelesai, tandaiPelajaranSelesai } from '../progres';

const A = { userId: 'a', email: 'a@tes.local' };
const B = { userId: 'b', email: 'b@tes.local' };
const siapkan = (sesi: typeof A | null) => {
  const bersama = buatMemori({ sesi });
  return { bersama, repo: buatMemoriPengguna(bersama) };
};
beforeEach(() => localStorage.clear());

test('tanpa sesi: tidak ada yang berubah', async () => {
  const { repo } = siapkan(null);
  tandaiPelajaranSelesai('x');
  expect(await mulaiSinkron(repo, vi.fn())).toBeNull();
  expect(akunLokal()).toBeNull();
});

test('login pertama: data lokal digabung & dikirim, data server masuk ke lokal', async () => {
  const { repo } = siapkan(A);
  await repo.pengguna.simpanProgresBelajar({ pelajaranSlug: 'server', selesai: true, diubahPada: '2026-09-27T00:00:00.000Z' });
  tandaiPelajaranSelesai('lokal');
  await mulaiSinkron(repo, vi.fn());
  expect(akunLokal()).toBe('a');
  expect(bacaPelajaranSelesai()).toEqual(new Set(['server', 'lokal']));
  expect((await repo.pengguna.bacaProgresBelajar()).map(baris => baris.pelajaranSlug).sort()).toEqual(['lokal', 'server']);
  expect(bacaAntrean()).toEqual([]);
});

test('buka berikutnya: server jadi acuan (hapus di perangkat lain tidak hidup lagi)', async () => {
  const { repo } = siapkan(A);
  await repo.pengguna.simpanRiwayat({ id: 'k1', kasus: {}, judul: 'x', disimpanPada: '2026-09-27T00:00:00.000Z' });
  await mulaiSinkron(repo, vi.fn());
  await repo.pengguna.hapusRiwayat('k1'); // perangkat lain menghapus
  await mulaiSinkron(repo, vi.fn());
  expect(localStorage.getItem('arif-waris:tersimpan')).toBe('[]');
});

test('akun lain masuk tanpa keluar: data akun lama dibersihkan, tidak digabung', async () => {
  const { bersama, repo } = siapkan(A);
  await mulaiSinkron(repo, vi.fn());
  tandaiPelajaranSelesai('milik-a');
  await mulaiSinkron(repo, vi.fn());
  bersama.masukSebagai(B);
  await mulaiSinkron(repo, vi.fn());
  expect(bacaPelajaranSelesai().has('milik-a')).toBe(false);
  expect(await repo.pengguna.bacaProgresBelajar()).toEqual([]);
});

test('antrean gagal terkirim: data lokal tidak ditimpa server', async () => {
  const { repo } = siapkan(A);
  await mulaiSinkron(repo, vi.fn());
  repo.pengguna.simpanProgresBelajar = vi.fn().mockRejectedValue(new Error('luring'));
  tandaiPelajaranSelesai('belum-terkirim');
  await mulaiSinkron(repo, vi.fn());
  expect(bacaPelajaranSelesai().has('belum-terkirim')).toBe(true);
  expect(await kirimSebelumKeluar(repo, 50)).toBeGreaterThan(0);
});

test('keluar menghapus semua kunci arif-waris', async () => {
  const { repo } = siapkan(A);
  await mulaiSinkron(repo, vi.fn());
  localStorage.setItem('arif-waris:riwayat', '[]');
  localStorage.setItem('lain', '1');
  await keluarDanBersihkan(repo);
  expect(Object.keys(localStorage)).toEqual(['lain']);
});
```

- [ ] **Step 2: Jalankan** — Expected: FAIL.

- [ ] **Step 3: Implementasi** — `apps/web/src/akun/sinkron.ts`:

```ts
// Sinkron data pengguna dengan akun (spec akun pengguna "Penggabungan", "Sinkron", "Keluar").
// Saat dibuka: tanpa sesi → tidak ada apa-apa. Akun pertama kali masuk di perangkat ini → gabung data lokal dengan
// server sekali. Sesudahnya → kirim antrean; bila kosong, data lokal diganti data server (semua perubahan lokal sudah
// lewat antrean, jadi tidak ada yang hilang, dan hapus di perangkat lain tidak hidup lagi).
// Semua kegagalan jaringan hanya dicatat: web tetap jalan dari data lokal.

import type { RepositoriAkun, RepositoriPengguna, Sesi } from '@waris/data';
import { gantiSemuaProgres, semuaProgres } from '../progres';
import { kumpulPreferensi, terapkanPreferensi } from '../preferensi';
import { gantiSemuaTersimpan, semuaTersimpan } from '../tersimpan';
import { hapusSemuaMentah } from '../penyimpanan';
import { akunLokal, antre, aturAkunLokal, aturPengirim, bacaAntrean, kirimAntrean } from './antrean';
import { gabung, type DataPengguna } from './gabung';

export interface RepoAkun { akun: RepositoriAkun; pengguna: RepositoriPengguna }
const AWALAN_DATA = 'arif-waris:';
const BATAS_KIRIM_KELUAR_MS = 3000;

export async function mulaiSinkron(repo: RepoAkun, saatDataBerubah: () => void): Promise<Sesi | null> {
  try {
    const sesi = await repo.akun.sesi();
    if (!sesi) return null;
    const pemilikLokal = akunLokal();
    if (pemilikLokal !== sesi.userId) {
      if (pemilikLokal) bersihkanPerangkat();
      const { hasil, kirim } = gabung(dataLokal(), await dataServer(repo.pengguna));
      tulisLokal(hasil);
      aturAkunLokal(sesi.userId);
      kirim.forEach(antre);
    }
    pasangPengirim(repo.pengguna);
    if (await kirimAntrean(repo.pengguna) === 0) tulisLokal(await dataServer(repo.pengguna));
    saatDataBerubah();
    return sesi;
  } catch (galat) {
    console.warn('sinkron akun gagal, memakai data perangkat:', galat);
    return null;
  }
}

export async function kirimSebelumKeluar(repo: RepoAkun, batasMs = BATAS_KIRIM_KELUAR_MS): Promise<number> {
  const batas = new Promise<number>(selesai => setTimeout(() => selesai(-1), batasMs));
  const sisa = await Promise.race([kirimAntrean(repo.pengguna), batas]);
  return sisa === -1 ? Math.max(1, bacaAntrean().length) : sisa;
}

export async function keluarDanBersihkan(repo: RepoAkun): Promise<void> {
  aturPengirim(null);
  try {
    await repo.akun.keluar();
  } finally {
    bersihkanPerangkat();
  }
}

let pendengarOnline: (() => void) | null = null;

function pasangPengirim(pengguna: RepositoriPengguna): void {
  let sedangKirim = false;
  const kirim = () => {
    if (sedangKirim) return;
    sedangKirim = true;
    void kirimAntrean(pengguna).finally(() => { sedangKirim = false; });
  };
  aturPengirim(kirim);
  if (pendengarOnline) window.removeEventListener('online', pendengarOnline);
  pendengarOnline = kirim;
  window.addEventListener('online', kirim);
}

const dataLokal = (): DataPengguna => ({ tersimpan: semuaTersimpan(), ...semuaProgres(), preferensi: kumpulPreferensi() });

function tulisLokal(data: DataPengguna): void {
  gantiSemuaTersimpan(data.tersimpan);
  gantiSemuaProgres(data);
  if (data.preferensi) terapkanPreferensi(data.preferensi);
}

/** Waktu dari Postgres dinormalkan ke toISOString supaya bisa dibandingkan sebagai teks dengan waktu lokal. */
async function dataServer(pengguna: RepositoriPengguna): Promise<DataPengguna> {
  const iso = (waktu: string) => new Date(waktu).toISOString();
  const [tersimpan, belajar, latihan, preferensi] = await Promise.all([
    pengguna.bacaRiwayat(), pengguna.bacaProgresBelajar(), pengguna.bacaProgresLatihan(), pengguna.bacaPreferensi(),
  ]);
  return {
    tersimpan: tersimpan.map(baris => ({ ...baris, disimpanPada: iso(baris.disimpanPada) })),
    belajar: belajar.map(baris => ({ ...baris, diubahPada: iso(baris.diubahPada) })),
    latihan: latihan.map(baris => ({ ...baris, diubahPada: iso(baris.diubahPada) })),
    preferensi: preferensi && { ...preferensi, diubahPada: iso(preferensi.diubahPada) },
  };
}

const bersihkanPerangkat = (): void => hapusSemuaMentah(AWALAN_DATA);
```

- [ ] **Step 4: Jalankan** — `pnpm --filter @waris/web test sinkron-akun`. Expected: PASS. Lalu semua tes web.
- [ ] **Step 5: Commit** — `git add apps/web/src && git commit -m "web: sinkron akun (login pertama, antrean, tarik, keluar)"`

---

### Task 7: Klien Supabase web, tombol akun, dan pemasangan

**Files:**
- Create: `apps/web/src/akun/klien.ts`, `apps/web/src/akun/TombolAkun.tsx`, `apps/web/src/__tests__/akun.test.tsx`
- Modify: `apps/web/src/konten/sinkron.ts` (`muatRepoSupabase` memakai klien bersama), `apps/web/src/layar/Kepala.tsx`,
  `apps/web/src/Aplikasi.tsx`, `apps/web/src/snapshot.json`, `apps/web/src/gaya/*.css` (gaya menu akun, ikuti `tombol-kepala`)

**Interfaces:**
- Consumes: `mulaiSinkron`, `kirimSebelumKeluar`, `keluarDanBersihkan`, `RepoAkun` (Task 6).
- Produces:
  - `akun/klien.ts`: `export function muatRepoAkun(): Promise<(RepoAkun & { konten: RepositoriKonten; diksi: RepositoriDiksi }) | null>`
    — null bila env kosong; satu instans per halaman.
  - `TombolAkun({ sesi, repo }: { sesi: Sesi | null; repo: RepoAkun | null })`.

- [ ] **Step 1: Klien** — `apps/web/src/akun/klien.ts`:

```ts
// Satu klien Supabase untuk web: dipakai sinkron konten dan akun pengguna. Sesi login disimpan (persistSession) dan
// memakai PKCE supaya kode login kembali lewat query (?code=), tidak bentrok dengan rute hash (#/...).
// Pustaka dimuat dinamis supaya tidak masuk bundel awal. Tanpa env → null, web jalan tanpa akun.

import type { RepoAkun } from './sinkron';

type RepoWeb = Awaited<ReturnType<typeof import('@waris/data')['buatRepositoriSupabase']>>;
let janjiRepo: Promise<RepoWeb | null> | null = null;

export function muatRepoAkun(url = import.meta.env.VITE_SUPABASE_URL, kunci = import.meta.env.VITE_SUPABASE_ANON_KEY): Promise<RepoWeb | null> {
  if (!url || !kunci) return Promise.resolve(null);
  janjiRepo ??= Promise.all([import('@supabase/supabase-js'), import('@waris/data')])
    .then(([{ createClient }, { buatRepositoriSupabase }]) =>
      buatRepositoriSupabase(createClient(url, kunci, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } })))
    .catch(galat => { console.warn('pustaka akun gagal dimuat:', galat); janjiRepo = null; return null; });
  return janjiRepo;
}

export type { RepoAkun };
```

`konten/sinkron.ts`: `muatRepoSupabase(url, kunci)` → `const repo = await muatRepoAkun(url, kunci); if (!repo) throw new Error('repo tidak tersedia'); return repo;`
(perilaku tes `sinkron.test.ts` tetap: kegagalan hanya dicatat). Setelah kembali dari login, PKCE menukar `?code=`
secara otomatis saat klien dibuat; hapus query itu dari alamat sesudahnya:
`history.replaceState(null, '', location.pathname + location.hash)` di `mulaiSinkron` pemanggil (Aplikasi) bila
`location.search.includes('code=')`.

- [ ] **Step 2: Tes UI yang gagal** — `apps/web/src/__tests__/akun.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { buatMemori, buatMemoriPengguna } from '@waris/data';
import { TombolAkun } from '../akun/TombolAkun';

test('tanpa repo (env kosong): tombol tidak tampil', () => {
  const { container } = render(<TombolAkun sesi={null} repo={null} />);
  expect(container.textContent).toBe('');
});

test('belum masuk: klik memanggil masukGoogle dengan alamat sekarang', () => {
  const repo = buatMemoriPengguna(buatMemori({ sesi: null }));
  repo.akun.masukGoogle = vi.fn().mockResolvedValue(undefined);
  render(<TombolAkun sesi={null} repo={repo} />);
  fireEvent.click(screen.getByRole('button', { name: /masuk/i }));
  expect(repo.akun.masukGoogle).toHaveBeenCalledWith(window.location.href);
});

test('masukGoogle gagal: pesan layanan tidak tersedia', async () => {
  const repo = buatMemoriPengguna(buatMemori({ sesi: null }));
  repo.akun.masukGoogle = vi.fn().mockRejectedValue(new Error('fetch failed'));
  render(<TombolAkun sesi={null} repo={repo} />);
  fireEvent.click(screen.getByRole('button', { name: /masuk/i }));
  expect(await screen.findByText(/sedang tidak tersedia/i)).toBeTruthy();
});

test('keluar dengan perubahan belum terkirim: tanya dulu', async () => {
  const repo = buatMemoriPengguna(buatMemori({ sesi: { userId: 'a', email: 'a@tes.local' } }));
  localStorage.setItem('arif-waris:akun', 'a');
  localStorage.setItem('arif-waris:antrean', JSON.stringify([{ tabel: 'belajar', baris: { pelajaranSlug: 'x', selesai: true, diubahPada: '1' } }]));
  repo.pengguna.simpanProgresBelajar = vi.fn().mockRejectedValue(new Error('luring'));
  render(<TombolAkun sesi={{ userId: 'a', email: 'a@tes.local' }} repo={repo} />);
  fireEvent.click(screen.getByRole('button', { name: /a@tes.local/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /keluar/i }));
  expect(await screen.findByText(/belum terkirim/i)).toBeTruthy();
});
```

- [ ] **Step 3: Jalankan** — Expected: FAIL.

- [ ] **Step 4: Implementasi** — `apps/web/src/akun/TombolAkun.tsx`:

```tsx
// Tombol akun di header (spec akun pengguna "Login"): belum masuk → "Masuk dengan Google"; sudah masuk → tombol berinisial
// email dengan menu Keluar. Keluar mengirim perubahan dulu; yang belum terkirim ditanyakan sebelum data perangkat dihapus.
// Tanpa repo (env Supabase kosong) tidak tampil apa pun.

import { useState } from 'react';
import type { Sesi } from '@waris/data';
import { t } from '../terjemah';
import { DialogKonfirmasi } from '../ui/Dialog';
import { Tombol } from '../ui/Tombol';
import { keluarDanBersihkan, kirimSebelumKeluar, type RepoAkun } from './sinkron';

export function TombolAkun({ sesi, repo }: { sesi: Sesi | null; repo: RepoAkun | null }) {
  const [galat, setGalat] = useState(false);
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [belumTerkirim, setBelumTerkirim] = useState(0);
  if (!repo) return null;

  const keluar = async () => {
    await keluarDanBersihkan(repo);
    window.location.reload();
  };
  const cobaKeluar = async () => {
    setMenuTerbuka(false);
    const sisa = await kirimSebelumKeluar(repo);
    if (sisa > 0) setBelumTerkirim(sisa);
    else await keluar();
  };

  if (!sesi) return (
    <>
      <Tombol varian="secondary" kecil className="tombol-kepala"
        onClick={() => repo.akun.masukGoogle(window.location.href).catch(() => setGalat(true))}>{t('umum.masuk_dengan_google')}</Tombol>
      {galat && <p role="alert" className="pesan-akun">{t('umum.layanan_akun_tidak_tersedia')}</p>}
    </>
  );
  return (
    <div className="menu-akun">
      <Tombol varian="secondary" kecil className="tombol-kepala" aria-label={sesi.email} aria-haspopup="menu" aria-expanded={menuTerbuka}
        onClick={() => setMenuTerbuka(!menuTerbuka)}>{sesi.email.slice(0, 1).toUpperCase()}</Tombol>
      {menuTerbuka && (
        <div role="menu" className="menu-akun-isi">
          <span className="keterangan">{sesi.email}</span>
          <button type="button" role="menuitem" onClick={() => void cobaKeluar()}>{t('umum.keluar')}</button>
        </div>
      )}
      {belumTerkirim > 0 && (
        <DialogKonfirmasi judul={t('umum.keluar')} labelLanjut={t('umum.tetap_keluar')}
          saatBatal={() => setBelumTerkirim(0)} saatLanjut={() => void keluar()}>
          <p>{t('umum.perubahan_belum_terkirim', { jumlah: belumTerkirim })}</p>
        </DialogKonfirmasi>
      )}
    </div>
  );
}
```

(Periksa props wajib `DialogKonfirmasi` di `ui/Dialog.tsx` dan `Tombol` di `ui/Tombol.tsx`; sesuaikan nama berkas/ekspor
bila beda. Menu ditutup dengan Esc & klik di luar — ikuti pola menu yang sudah ada bila ada, kalau tidak cukup Esc.)

Diksi baru di `snapshot.json` (halaman `umum`, `ar: null`, `versiTerbit: 0`):
`umum.masuk_dengan_google` "Masuk dengan Google", `umum.layanan_akun_tidak_tersedia` "Layanan akun sedang tidak tersedia.
Data di perangkat ini tetap aman.", `umum.keluar` "Keluar", `umum.tetap_keluar` "Tetap keluar",
`umum.perubahan_belum_terkirim` "{jumlah} perubahan belum terkirim ke akun dan akan hilang dari perangkat ini. Tetap keluar?"
(cek dulu apakah `umum.keluar` sudah ada).

- [ ] **Step 5: Pasang di Aplikasi & Kepala**
  - `Kepala.tsx`: prop baru `akun: ReactNode`, dirender sebelum `<select className="pilih-bahasa">`.
  - `Aplikasi.tsx`:
    ```tsx
    const [repoAkun, setRepoAkun] = useState<RepoAkun | null>(null);
    const [sesi, setSesi] = useState<Sesi | null>(null);
    const [, segarkanData] = useReducer((n: number) => n + 1, 0);
    useEffect(() => {
      void muatRepoAkun().then(async repo => {
        if (!repo) return;
        setRepoAkun(repo);
        setSesi(await mulaiSinkron(repo, segarkanData));
        if (location.search.includes('code=')) history.replaceState(null, '', location.pathname + location.hash);
      });
    }, []);
    ```
    dan `<Kepala … akun={<TombolAkun sesi={sesi} repo={repoAkun} />} />`.
    `// ponytail: layar yang menyimpan data di useState awal (mis. DaftarRiwayat) baru segar setelah pindah halaman.`

- [ ] **Step 6: Jalankan** — `pnpm --filter @waris/web test && pnpm --filter @waris/web build`. Expected: PASS.

- [ ] **Step 7: Uji manual di browser** (butuh `pnpm db:mulai` dan Google OAuth lokal di `supabase/config.toml`
  `[auth.external.google]`; bila belum dikonfigurasi, catat & lewati — portal admin memakai konfigurasi yang sama):
  masuk dari `#/belajar` → kembali ke `#/belajar` tanpa `?code=`; tandai pelajaran selesai → baris muncul di
  `progres_belajar` dan `log_kegiatan`; Keluar → localStorage tanpa kunci `arif-waris:*`.

- [ ] **Step 8: Commit** — `git add apps/web/src && git commit -m "web: login Google opsional & menu akun di header"`

---

### Task 8: Penutup

- [ ] Perbarui `docs/panduan-tim-keilmuan.md` hanya bila ada bagian tentang riwayat/"tersimpan otomatis" yang kini salah
  (cari "riwayat").
- [ ] Beri tahu pengguna: kunci diksi baru (Task 3 & 7) dibuat di snapshot dengan `versiTerbit: 0`; perlu dibuat juga
  di DB lewat portal (editor diksi) supaya tim bisa menyunting/menerjemahkan.
- [ ] `pnpm test && pnpm db:tes` — semua PASS.
- [ ] Centang plan ini, commit `docs: centang plan tahap 4`.
