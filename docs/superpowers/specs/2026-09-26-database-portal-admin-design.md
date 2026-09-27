# Database, Portal Admin, dan Akun Pengguna — Desain

Status: disetujui dalam diskusi 2026-09-26, menunggu review spec.
Branch: `fitur/database-portal-admin`. Dikerjakan sebelum ekspor PNG/PDF, munasakhat, dan haml.

## Tujuan

1. Konten edukasi dan diksi UI dikelola lewat portal admin, bukan menyunting `.md`/`.ts`.
2. Konten fikih melewati review tim keilmuan sebelum tampil (menggantikan penanda `perluCek`).
3. Pengguna bisa login Google dan datanya (riwayat tersimpan, progres belajar & latihan, preferensi) ada di semua perangkat.

## Bukan tujuan

- Aturan fikih/engine di database. Engine tetap fungsi murni di repo, sumber hukum tetap `docs/kb/`.
- Unggah berkas (Supabase Storage). Cheatsheet = tautan Google Drive; PDF kitab tetap di `apps/web/public/kitab/`.
- Kontributor terbuka / moderasi publik.
- Menghitung di server. Engine tetap berjalan di browser.

## Keputusan

| Hal | Keputusan |
|---|---|
| Backend | Supabase (Postgres, Auth Google, RLS). Sementara; nanti pindah ke VPS. |
| Portabilitas | Skema = migrasi SQL Postgres biasa di `supabase/migrations/`. Fitur khusus Supabase (Edge Functions, Realtime, Storage) tidak dipakai. |
| Akses data | Pola repository di `packages/data`: antarmuka + implementasi `supabase/` dan `memori/` (tes). Pindah VPS = tambah implementasi `http/`, app tidak berubah. |
| Service layer | Tidak ada. Aturan aplikasi (validasi, transisi status) = fungsi murni di `packages/content`. |
| Sumber kebenaran konten | Database. Berkas konten di repo diimpor sekali lalu dihapus. |
| KB | Tetap di repo, tidak bisa diubah dari portal. |
| Portal | App terpisah `apps/admin`, berbagi design system & `ui/komponen` dengan `apps/web`. |
| Peran | `admin` (kamu), `penulis`, `reviewer` (tim keilmuan). |
| Diksi | Kunci = ID stabil (`hitung.lanjut`); teks Indonesia dan Arab sama-sama bisa diubah dari portal. |
| Web pengguna | Tetap jalan tanpa login dan offline. |

## Arsitektur

```
packages/math, engine, explain   tidak berubah
packages/content                 tipe + skema Zod + aturan editorial murni (tanpa berkas .md)
packages/data          BARU      repository: antarmuka, supabase/, memori/
apps/web                         kalkulator + belajar (membaca lewat packages/data)
apps/admin             BARU      portal admin
supabase/migrations    BARU      skema + RLS
scripts/               BARU      impor-konten.ts, ekspor-konten.ts, daftar-refs.ts
```

Arah dependensi: `apps/*` → `data` → `content`; `engine` → `math`. `data` tidak mengimpor engine.

Repository (satu per domain):
- `RepositoriKonten`: baca konten terbit (per jenis, sejak versi N); di portal juga daftar/baca revisi.
- `RepositoriEditorial`: buat draf, ajukan, setujui, kembalikan (dengan catatan), rollback ke revisi lama.
- `RepositoriDiksi`: baca diksi terbit; di portal sunting lewat alur editorial yang sama.
- `RepositoriPengguna`: riwayat tersimpan, progres belajar, progres latihan, preferensi.
- `RepositoriAkun`: sesi, login Google, peran pengguna.

## Konten yang dikelola portal

| Jenis (`jenis`) | Asal sekarang | Catatan |
|---|---|---|
| `modul`, `materi` | `docs/materi/*.md` | Blok teks, contoh kasus, video (tautan YouTube), cek pemahaman, versi Arab |
| `soal_kuis` | `docs/soal/kuis.md` | |
| `soal_hitung` | `docs/soal/hitung.md` | |
| `tanya_jawab` | `docs/tanya-jawab.md` | |
| `faq` | `docs/faq.md` | |
| `kitab` | `docs/rujukan/kitab.md` | Tautan + nama berkas PDF di `public/kitab/` |
| `syahid` | `docs/rujukan/syahid.md` | Termasuk arti & tafsir (sekarang TODO) |
| `glosarium_ar` | `docs/glosarium-ar.md` | Terkunci ke istilah `docs/kb/15_glosarium.md`; istilah di luar KB ditolak |
| `ahwal` | `apps/web/src/konten/ahwal.ts` | Refs `[Rxx-y]` wajib |
| `teks_edukasi` | `konten/ahliWaris.ts`, `harta.ts`, `wizard.ts`, `tur.ts`, `umum.ts` | Label sehari-hari, keterangan hubungan, teks harta/kewajiban, langkah wizard, tur |
| `cheatsheet` | `Belajar.tsx` (`DAFTAR_CHEATSHEET`) | Judul id/ar, deskripsi, urutan, tautan Google Drive |
| diksi | `t('...')` di kode + `konten/kamus/*.ts` | Tabel sendiri, lihat di bawah |

Tetap di repo: KB 00–17 (termasuk glosarium Indonesia dan daftar `[Rxx-y]`), engine, kasus uji bab 16,
pilihan pembulatan (konfigurasi hitung, bukan konten).

## Model data

```sql
entri_konten   id uuid, jenis text, slug text unique per jenis, urutan int,
               revisi_terbit_id uuid null → revisi
revisi         id uuid, entri_id → entri_konten, isi jsonb ({ id: ..., ar?: ... }),
               refs text[], status ('draf'|'diajukan'|'disetujui'|'dikembalikan'),
               dibuat_oleh → auth.users, diperiksa_oleh → auth.users null,
               catatan_review text null, dibuat_pada, diperiksa_pada
diksi          kunci text pk (mis. 'hitung.lanjut'), halaman text,
               revisi_terbit_id → revisi_diksi
revisi_diksi   id, kunci → diksi, id_teks text, ar_teks text null, catatan text null,
               status, dibuat_oleh, diperiksa_oleh, catatan_review, dibuat_pada
daftar_refs    kode text pk ('R09-7'), bab int   -- dihasilkan dari docs/kb saat build
versi_konten   satu baris: angka yang naik tiap ada revisi terbit (konten atau diksi)
peran_pengguna user_id → auth.users, peran ('admin'|'penulis'|'reviewer')

riwayat_hitung  id, user_id, kasus jsonb (Kasus versi 2), judul, disimpan_pada
progres_belajar user_id, pelajaran_slug, selesai bool, diubah_pada
progres_latihan user_id, soal_slug, jenis ('kuis'|'hitung'), jawaban_terakhir jsonb,
                benar bool, jumlah_coba int, diubah_pada
preferensi      user_id pk, isi jsonb, diubah_pada
```

- `isi` divalidasi skema Zod di `packages/content` per jenis (bentuknya = tipe yang sudah ada: `Pelajaran`,
  `SoalKuis`, `EntriFaq`, ...). Portal memvalidasi sebelum simpan; web memvalidasi saat baca dan membuang entri
  tidak valid (dicatat di console, tidak crash).
- `refs` harus ada di `daftar_refs` (foreign key lewat tabel penghubung atau constraint pemeriksa). Jenis fikih
  (`materi`, `soal_*`, `tanya_jawab`, `faq`, `ahwal`, `syahid`) wajib punya minimal satu ref.
- Revisi tidak pernah diedit setelah diajukan; perubahan = revisi baru. Rollback = menerbitkan ulang revisi lama.

## Alur editorial

```
draf ──ajukan──▶ diajukan ──setujui──▶ disetujui (revisi_terbit_id ← revisi ini; versi_konten++)
                    │
                    └──kembalikan (catatan wajib)──▶ dikembalikan ──sunting──▶ draf baru
```

Dijaga RLS (bukan hanya UI):
- Anonim & pengguna biasa: hanya baca revisi yang ditunjuk `revisi_terbit_id`, diksi terbit, `daftar_refs`.
- Penulis: buat/ubah draf miliknya, ajukan. Tidak bisa menyetujui.
- Reviewer: setujui/kembalikan revisi yang bukan buatannya sendiri.
- Admin: semua, termasuk kelola `peran_pengguna`.
- Transisi status lewat fungsi Postgres (`ajukan_revisi`, `setujui_revisi`, `kembalikan_revisi`) supaya
  `revisi_terbit_id` dan `versi_konten` berubah atomik. Fungsi ini SQL biasa, ikut pindah ke VPS.

## Diksi

- Semua `t('teks Indonesia')` di web diganti `t('halaman.id')`. ID dibuat skrip dari halaman + teks sekarang,
  lalu diperiksa manual.
- `t` membaca diksi terbit sesuai bahasa aktif; bila `ar` kosong, tampil Indonesia (perilaku sekarang).
- Tes: setiap ID yang dipakai di kode ada di snapshot diksi; ID di snapshot yang tidak dipakai kode dilaporkan.

## Alur data di web pengguna

Konten & diksi (baca saja):
1. Saat buka: pakai cache IndexedDB; bila kosong, snapshot JSON hasil build (`ekspor-konten.ts`).
2. Di latar: cek `versi_konten`; bila berubah, unduh revisi terbit yang berubah sejak versi cache.
3. Supabase mati/offline → tetap jalan dengan versi terakhir.

Data pengguna:
- **Kasus hitung sendiri tidak disimpan** kecuali pengguna menekan "Simpan". Riwayat lokal otomatis di
  `riwayat.ts` diubah mengikuti aturan ini.
- **Progres latihan (kuis & soal hitung) dan progres belajar disimpan otomatis.**
- Tanpa login: semua di localStorage (dibungkus try/catch seperti sekarang).
- Login Google pertama kali: data lokal digabung ke akun
  - riwayat: gabung, duplikat berdasarkan id kasus;
  - progres belajar: `selesai` = OR;
  - progres latihan: ambil yang `diubah_pada` terbaru per soal, `jumlah_coba` = maksimum;
  - preferensi: `diubah_pada` terbaru.
- Setelah login: tulis ke lokal dulu, lalu kirim; gagal/offline → antrean, kirim ulang saat online.
  Konflik antar perangkat: yang terakhir menang per baris (`diubah_pada`).
- Logout: data lokal dibersihkan di perangkat itu.
- Engine tetap di browser; hasil hitung tidak pernah dikirim kecuali disimpan pengguna.

## Portal admin (`apps/admin`)

- Login Google; akun tanpa peran melihat "belum punya akses".
- Daftar per jenis konten dengan filter status; editor per jenis (form dari skema Zod; blok materi disunting
  sebagai Markdown terbatas yang sama dengan parser sekarang, lalu diubah ke `Blok[]`).
- Pemilih refs dari `daftar_refs` (cari kode/bab).
- Editor diksi: tabel per halaman, kolom id/ar, filter "Arab kosong" dan "belum terbit".
- Antrean review untuk reviewer: diff revisi vs versi terbit, tombol setujui / kembalikan + catatan.
- Pratinjau: draf dirender dengan komponen web yang sama.
- Riwayat revisi per entri + rollback.
- Admin: kelola peran pengguna.
- Selalu online, tanpa cache.

## Migrasi konten lama

1. `scripts/daftar-refs.ts`: baca `docs/kb` (parser `refs.ts`) → isi `daftar_refs`.
2. `scripts/impor-konten.ts` (idempoten, berdasarkan `jenis`+`slug`): jalankan parser yang ada di
   `packages/content`, validasi Zod, tulis sebagai revisi `disetujui`. Entri yang sekarang `perluCek: true`
   (termasuk kamus Arab) masuk sebagai `diajukan` supaya jadi antrean review.
3. Diksi: teks dari kode + `konten/kamus/*.ts` → `diksi` dengan ID stabil.
4. Verifikasi: jumlah entri DB = jumlah dari berkas; tes web lolos dengan snapshot hasil ekspor.
5. Baru setelah itu hapus `docs/materi`, `docs/soal`, `docs/faq.md`, `docs/tanya-jawab.md`, `docs/rujukan/`,
   `docs/glosarium-ar.md`, `apps/web/src/konten/*` (kecuali yang murni kode), `konten/kamus/*`.
6. `scripts/ekspor-konten.ts`: konten terbit → JSON (snapshot build, backup) + Markdown (lampiran TA).

## Pengujian

- Tes yang ada (math 19, content 48, engine 166, explain 36, web 193) tetap hijau; web memakai repository
  `memori/` berisi snapshot, tanpa jaringan.
- Skema Zod: semua konten hasil impor lolos validasi.
- RLS di Supabase lokal (`supabase start`): penulis tidak bisa menyetujui; reviewer tidak bisa menyetujui
  revisinya sendiri; pengguna A tidak bisa membaca data pengguna B; anonim hanya melihat yang terbit.
- Fungsi transisi: setujui mengubah `revisi_terbit_id` dan menaikkan `versi_konten` dalam satu transaksi.
- Penggabungan data lokal saat login: fungsi murni, diuji per aturan di atas.
- Diksi: ID di kode ⊆ ID di snapshot.

## Urutan kerja (tiap tahap = plan sendiri)

1. **Fondasi** — migrasi SQL + RLS + fungsi transisi, skema Zod, `packages/data` (antarmuka + `memori/` +
   `supabase/`), `daftar-refs.ts`. UI belum berubah.
2. **Migrasi konten & diksi** — impor/ekspor, refactor `t()` ke ID stabil, web membaca dari repository
   (snapshot → cache → Supabase), hapus berkas konten lama.
3. **Portal admin** — login, peran, editor per jenis, editor diksi, antrean review, pratinjau, rollback.
4. **Akun pengguna** — login di web, penggabungan data lokal, sinkron riwayat tersimpan, progres belajar,
   progres latihan, preferensi; ubah `riwayat.ts` jadi simpan-manual.

## Risiko

- Proyek Supabase gratis di-pause bila tidak aktif seminggu → web tetap jalan dari cache/snapshot; portal
  perlu dibangunkan manual.
- Refactor `t()` menyentuh banyak berkas web → dikerjakan dengan skrip + tes cakupan ID, satu commit per halaman.
- Konten yang sekarang lolos parser tapi tidak lolos Zod → dilaporkan skrip impor, diperbaiki sebelum
  berkas lama dihapus.
