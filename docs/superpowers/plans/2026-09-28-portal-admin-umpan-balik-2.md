# Portal admin — umpan balik putaran 2: telaah & rencana

Tanggal: 2026-09-28 · Cabang: `admin/manusiawi` · Status: **K1–K4 disetujui (semua usulan: ya), Fase 1 dikerjakan; Fase 5–6 ditunda bersama bagian F (KB lewat portal)**

Lanjutan dari `2026-09-28-portal-admin-umpan-balik-pengguna.md`. Sembilan keluhan baru, dicari akar masalahnya di kode,
lalu disusun jadi fase. Belum ada kode yang diubah.

---

## A. Keluhan → akar masalah → arah perbaikan

### A1. Satu teks diubah, tempat lain tidak ikut ("Bagi" vs "Bagikan")

**Akar masalah** — `EditorTeksAplikasi.tsx` `setelahSimpan()`: setelah menyimpan, portal menulis teks baru **hanya ke satu
simpul DOM yang diklik** (`dipilih.simpul.data = idBaru`, ditandai `ponytail:`). Simpul lain dengan kunci yang sama tetap
teks lama. Lebih buruk: `daftarSumber` ikut diganti ke teks baru, jadi pencocok tidak lagi mengenali "Bagikan" → kotak
bergaris di kartu lain **hilang** (terlihat di tangkapan layar: "Bagi" bergaris, "Bagikan" tidak).

**Perbaikan** — buang penulisan DOM langsung. Setelah simpan: pasang snapshot baru dengan diksi/teks kunci itu diganti
(`pasangSnapshot` dari `@waris/web/sumber`, pola yang sama dengan `Pratinjau.tsx`), lalu pasang ulang layar web
(`key` naik). Semua pemanggil `t('glosarium.bagikan')` membaca nilai baru sekaligus.
Batas: teks yang dipanggil `t()` di konstanta tingkat modul tidak ikut berubah sampai halaman portal dimuat ulang (jarang).

### A2. Setelah diajukan, sama sekali tidak bisa menyunting

**Akar masalah** — `DialogSunting`: `terkunci = bacaSaja || status === 'diajukan'`. Untuk konten sudah ada
`tarik_revisi` (diajukan → draf), tapi **diksi tidak punya padanannya** (`20260926000002_transisi.sql`), dan dialog teks
tidak memakainya. Editor entri punya tombol "Tarik", tapi alurnya dua langkah (tarik dulu, baru sunting).

**Perbaikan** — "Perbarui ajuan": pembuat (atau admin) boleh menyunting ajuannya yang masih menunggu. Simpan = ganti isi
ajuan itu, tetap di antrean, reviewer melihat versi terbaru. Satu fungsi SQL per tabel supaya atomik (tidak ada jeda di
mana reviewer menyetujui versi setengah jadi):

- `perbarui_ajuan(p_id, p_isi, p_refs)` — revisi konten `diajukan` milik pemanggil/admin → isi diganti, `dibuat_pada = now()`.
- `perbarui_ajuan_diksi(p_id, p_id_teks, p_ar_teks)` — sama untuk diksi.

Dipakai di dialog teks aplikasi **dan** editor entri (tombol "Tarik" diganti "Simpan perubahan ajuan"). Reviewer tetap
baca-saja.

### A3. Tampilan pratinjau masih "hancur", susunan beda dengan web

**Akar masalah** — dua hal:
1. `komponen.css` web punya **38 `@media (max-width …)`** yang membaca lebar **jendela browser**, bukan lebar kotak
   pratinjau. Jendela 1920 px → web memakai tata letak desktop, padahal kotaknya ± 780 px → kolom berdesakan / tumpang
   tindih. Tombol "HP" di pratinjau juga tidak memicu tata letak HP karena media query tidak berubah.
2. CSS web dimuat global di portal (`main.tsx`) dan bertabrakan dengan Tailwind/shadcn (sudah ada tambalan di
   `admin.css:119`).

**Perbaikan** — layar web dirender di dalam **`<iframe>`** lewat `createPortal` ke `iframe.contentDocument.body`
(tetap satu pohon React, jadi state & event tetap jalan). CSS web disuntikkan ke iframe sebagai string
(`import css from '@waris/web/gaya/komponen.css?inline'`), dan tidak lagi diimpor global di portal. Media query lalu
membaca lebar iframe → HP/desktop tampil persis seperti web. Satu komponen `BingkaiWeb` dipakai `Pratinjau` dan
`Sunting di layar` (kotak bergaris ikut digambar di dalam iframe). Tambalan `admin.css:119` dihapus.

### A4. "Kembalikan" di review: klik dulu, baru muncul kolom keterangan

**Akar masalah** — `AksiReview.tsx` selalu menampilkan kolom "Catatan" dan tombol Kembalikan mati sampai catatan terisi.
Kolom itu juga membingungkan untuk Setujui: `setujui_revisi` **tidak menyimpan catatan**, jadi catatan yang diketik lalu
Setujui hilang begitu saja.

**Perbaikan** — bawaan hanya dua tombol: **Setujui** · **Kembalikan** (selalu bisa diklik). Klik Kembalikan → muncul kolom
"Apa yang perlu diperbaiki?" (fokus otomatis) + **Kirim pengembalian** / Batal. Dipakai Antrean review & editor entri.

### A5. Penulis tidak tahu ajuannya disetujui atau dikembalikan

**Akar masalah** — Beranda hanya menghitung "Dikembalikan ke saya" dan "Lanjutkan pekerjaan" dari **revisi terakhir
entri konten**. Diksi tidak dihitung sama sekali, "disetujui" tidak pernah ditampilkan, dan tidak ada tanda "ada kabar
baru".

**Perbaikan** — menu baru **Ajuan saya** (di bawah Antrean review, untuk penulis & admin) dengan badge jumlah kabar baru:

```
Ajuan saya
[Perlu diperbaiki (2)] [Menunggu review (3)] [Disetujui (5)]
┌───────────────────────────────────────────────────────────┐
│ Materi · Hajb hirman                         Dikembalikan │
│ "Contoh kasus kedua belum ada dalilnya." — Ust. Fulan,    │
│ 2 jam lalu                                                │
│ Perbaiki →                                                │
└───────────────────────────────────────────────────────────┘
```

- Sumber data: repo baru `editorial.revisiSaya()` & `diksi.revisiSaya()` (revisi milik pemanggil, 60 hari terakhir),
  bukan `revisiTerakhir`, supaya hasil review tetap terlihat walau entrinya sudah disunting orang lain.
- "Perbaiki" membuka editor entri / dialog teks aplikasi di tempatnya. "Menunggu review" menaut ke "Perbarui ajuan" (A2).
- Badge = dikembalikan + disetujui sejak terakhir membuka menu ini (waktu terakhir dibuka disimpan di `localStorage`
  per perangkat; tanpa tabel notifikasi). Kartu "Dikembalikan ke saya" di Beranda menaut ke sini.
- Tanpa email/push (belum perlu; tambah bila tim mengeluh tidak membuka portal).

### A6. Glosarium & ahwal belum masuk

Benar, belum. Keduanya bagian dari rencana F (KB lewat portal), lapisan 2:
- **Glosarium** masih dibaca dari `docs/kb/15_glosarium.md` saat build; database hanya punya `glosarium_ar` (0 baris).
  Makanya menu Glosarium tampak kosong.
- **Ahwal** baru 7 ahli waris (SUAMI, ISTRI, IBU, AYAH, ANAK_LK, ANAK_PR, SAUDARA_KANDUNG); daftar portal hanya menampilkan
  yang sudah ada.

**Perbaikan** — sama dengan pola lapisan 1 (rujukan, commit `0d337bd`):
- Jenis konten `glosarium` (istilah, arab, makna, artiAwam, contoh, sinonim, + versi Arab `ar`) menggantikan
  `glosarium_ar` (dilebur saat impor). `konten:pulihkan` mengimpor tabel bab 15, `konten:ekspor` menulis ulang
  tabelnya; uji pulang-pergi tanpa selisih satu karakter pun.
- Web & `packages/content` (konsistensi `[[istilah]]`) membaca glosarium dari snapshot, bukan dari berkas md.
- Menu Glosarium: semua istilah tampil.
- Ahwal: daftar menampilkan **semua ahli waris** dari engine; yang belum ada ditulis "Belum diisi · Tambah" (tautan,
  membuka form dengan kunci terisi + templat baris ahwal yang sudah ada).

### A7. Dalil belum dikelompokkan dalam satu induk

**Akar masalah** — skema `syahid` datar: `{surah, ayat, hukum, syahid, rujukan}`. An-Nisa 11 muncul sebagai 3+ baris
terpisah, tanpa arti, tanpa teks ayat utuh.

**Perbaikan** — KB lapisan 3, sesuai keputusan C1:
- Jenis konten `dalil` (induk): `jenis: 'ayat' | 'hadis'`, identitas (surah+ayat, atau perawi+nomor), teks Arab utuh
  (impor dari KB 1.2 / 17.3), `arti` (diisi tim, KB tidak memuat terjemahan), `sumberArti`, `tafsir?`,
  `tautan: {label, alamat}[]` (wajib `https://`).
- `syahid` jadi turunan: `{ dalil: <slug induk>, syahid, hukum, rujukan }`. Cek "potongan ada persis di teks ayat" memakai
  teks induk.
- Portal, Pustaka › **Dalil**: satu kartu per induk (QS. An-Nisa: 11), di bawahnya daftar syahid + tautan
  "Tambah syahid" (form dengan induk terisi).
- Migrasi: 16 syahid dikelompokkan otomatis per surah+ayat → induk dibuat dari DAFTAR_AYAT.
- Web Rujukan: tab Arti terisi dari induk.

### A8. Beda "Sunting di layar" dan "Daftar teks" tidak jelas

**Akar masalah** — keduanya menyunting hal yang sama dengan dialog yang sama; bedanya hanya cara mencari (klik di layar
vs daftar per layar). Dua tab untuk satu pekerjaan.

**Perbaikan** — gabung jadi **satu tampilan**: layar web di kiri, panel kanan "Teks di layar ini (n)" berisi daftar teks
yang sedang tampil (klik → dialog sunting, arahkan kursor → kotaknya di layar menyala). Kotak cari di panel mencari
**semua** teks, termasuk yang tidak tampil di layar mana pun (tur, pesan galat), dengan pilihan "Tampilkan juga label
pendek" (kurasi C6). Tab "Daftar teks" dihapus; tautan lama `#/menu/aplikasi/teks` diarahkan ke tampilan ini.
Menu Teks aplikasi tinggal: **Teks aplikasi** · Cheatsheet.

### A9. Teks aplikasi tidak sampai ke pengguna web

Sinkronnya sendiri berjalan (server versi 1004, snapshot bawaan build versi 873; web mengunduh selisihnya). Yang membuat
perubahan "tidak masuk":

1. **Suntingan diksi admin tidak pernah langsung terbit.** `DialogSunting`: `langsungTerbit` hanya untuk teks edukasi;
   diksi (703 dari 817 teks) selalu `ajukan` → diam di antrean sampai ada yang menyetujui. Tidak ada
   `terbitkan_langsung_diksi`.
   → Tambah `terbitkan_langsung_diksi(p_id)` (padanan `terbitkan_langsung` konten); admin: "Simpan & terbitkan".
2. **Web baru menampilkan perubahan di muat kedua**: muat pertama mengunduh ke cache, baru muat berikutnya dipakai
   (`main.tsx`, disengaja supaya teks tidak berganti di tengah pemakaian).
   → Setelah sinkron menemukan versi baru, tampilkan tautan kecil "Ada pembaruan konten · Muat ulang" (tautan, bukan
   tombol). Tetap tidak mengganti teks diam-diam.
3. **Portal sendiri memakai snapshot build** (versi 873) untuk Sunting di layar & Pratinjau, jadi teks yang sudah terbit
   pun tampak lama di portal.
   → Saat portal dibuka, jalankan `sinkronkan(repo, snapshotBawaan)` (fungsi yang sama dengan web) lalu `pasangSnapshot`.
   Draf/ajuan milik sendiri ditimpakan di atasnya khusus di Sunting di layar.
4. Teks yang ditulis langsung di kode web (bukan `t()`/`teksEdukasi()`) memang tidak bisa diubah dari portal.
   → Tes inventaris: pindai JSX web untuk teks Indonesia literal di luar `t()`; daftar hasilnya dipindah ke diksi.

---

## B. Rencana bertahap

Tiap fase = satu PR, tes per layar (vitest + testing-library, pola `apps/admin/src/__tests__`), SQL diuji di
`supabase/tests/database`, repo memori (`packages/data/src/memori`) diperbarui bersama repo Supabase. Commit per perubahan.

### Fase 1 — Alur teks aplikasi yang benar (A1, A2, A9)
1. SQL `terbitkan_langsung_diksi`, `perbarui_ajuan`, `perbarui_ajuan_diksi` + tes pgTAP + repo memori & Supabase.
   Aturan peran juga di `transisiRevisi` (`packages/content/src/editorial.ts`, aksi baru `perbarui`).
2. `DialogSunting`: admin diksi → langsung terbit; ajuan milik sendiri bisa disunting ("Simpan perubahan ajuan").
3. `EditorTeksAplikasi`: ganti tulis-DOM dengan pasang snapshot + pasang ulang layar. Tes: dua simpul berkunci sama,
   simpan satu → keduanya berubah & keduanya masih bergaris.
4. Portal memuat snapshot terbaru dari database saat dibuka (A9.3).
5. Web: tautan "Ada pembaruan konten · Muat ulang" (A9.2).
6. `EditorEntri`: "Tarik" diganti menyunting ajuan langsung.

### Fase 2 — Review & kabar untuk penulis (A4, A5)
1. `AksiReview`: Kembalikan → baru muncul kolom catatan.
2. Repo `revisiSaya()` (konten + diksi) + menu **Ajuan saya** + badge; Beranda menaut ke sana.

### Fase 3 — Pratinjau di iframe (A3)
1. Komponen `BingkaiWeb` (iframe + `createPortal` + CSS `?inline`), tinggi mengikuti isi.
2. `Pratinjau` & Sunting di layar memakai `BingkaiWeb`; CSS web dicabut dari impor global portal; tambalan
   `admin.css` dibuang. Tes: lebar HP → kelas tata letak HP aktif (cek `getComputedStyle` di iframe).

### Fase 4 — Teks aplikasi satu tampilan (A8)
Panel "Teks di layar ini" + cari semua teks; hapus tab Daftar teks; alihkan rute lama. Tes inventaris teks literal (A9.4).

### Fase 5 — KB lapisan 2: glosarium + ahwal lengkap (A6)
### Fase 6 — KB lapisan 3: dalil induk + syahid turunan (A7)

Fase 5–6 mengikuti pola lapisan 1 (impor → sunting & review di portal → ekspor ke `docs/kb`, uji pulang-pergi).
Rincian tugasnya ditulis sebagai rencana tersendiri saat fase itu dimulai, karena menyentuh skema, migrasi, skrip
impor/ekspor, web, dan `packages/content`.

---

## C. Keputusan yang dibutuhkan

- **K1.** Suntingan teks aplikasi oleh **admin langsung terbit** tanpa antrean (sama seperti konten lain)? Penulis tetap
  lewat review. *Usulan: ya.*
- **K2.** Menyunting ajuan yang menunggu: ajuan **diganti di tempat & tetap di antrean** (reviewer melihat versi
  terbaru, waktu ajuan diperbarui)? *Usulan: ya.*
- **K3.** Web: tampilkan tautan "Ada pembaruan konten · Muat ulang" saat ada teks baru, atau cukup otomatis di kunjungan
  berikutnya? *Usulan: tautan.*
- **K4.** Urutan: Fase 1 → 2 → 3 → 4 → 5 → 6? *Usulan: ya; Fase 1 paling mendesak karena perubahan teks sekarang memang
  tidak sampai ke pengguna.*

## D. Catatan sampingan

- `apps/web/.env.local` menyimpan kunci servis sebagai `VITE_SUPABASE_SERVICE_ROLE_KEY`. Awalan `VITE_` membuat nilainya
  boleh dibundel ke web. Sekarang tidak dipakai kode web (bundel bersih), tapi sebaiknya diganti nama tanpa `VITE_` atau
  dipindah ke `scripts/.env` supaya tidak bocor bila suatu saat terbaca `import.meta.env`.
