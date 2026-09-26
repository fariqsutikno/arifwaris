# Portal Admin — Tahap A: Kerangka Dashboard — Desain

Status: disetujui dalam diskusi 2026-09-27, menunggu review spec.
Branch: `fitur/database-portal-admin`. Melanjutkan [database-portal-admin](2026-09-26-database-portal-admin-design.md);
alur editorial (draf → ajukan → review → terbit) dan RLS di sana tetap berlaku kecuali diubah di sini.

## Latar

Portal sekarang HTML polos: navigasi 12 link nama teknis (`soal_kuis`, `glosarium_ar`), daftar berupa tabel mentah,
editor berisi textarea JSON/Markdown. Pengguna portal campuran (penulis materi, penyusun soal, reviewer) dan tidak
boleh perlu paham skema. Perombakan dipecah tiga, berurutan, tiap tahap spec sendiri:

- **A. Kerangka dashboard** (spec ini): layout, sidebar berkelompok, beranda, daftar konten, urutan seret.
- **B.** Form per jenis konten menggantikan textarea JSON.
- **C.** Editor blok (materi, tanya jawab, FAQ) dengan sisipan istilah & rujukan.

## Tujuan

1. Portal tampil rapi dan konsisten dengan web (token & komponen Arif Waris v4), memakai ikon, **tanpa emoji**.
2. Penulis langsung tahu pekerjaan yang tertunda (beranda).
3. Konten dicari & disaring dengan mudah; urutan materi/soal diatur dengan seret tanpa membuat revisi.

## Bukan tujuan

- Mengubah editor entri, diksi, review, peran → tetap layar lama, hanya dibungkus kerangka baru (B/C).
- Memindah materi antar-modul lewat seret (mengubah `isi.modul` = revisi → lewat editor, tahap B).
- Tabel atau query baru untuk beranda.

## Keputusan

| Hal | Keputusan |
|---|---|
| Layout | Sidebar kiri berkelompok (pilihan A dari mockup), konten di kanan; layar sempit → sidebar jadi laci |
| Gaya | `@waris/web/gaya/token.css` + `komponen.css` + satu `apps/admin/src/admin.css` |
| Ikon | Komponen `Ikon` web; jalur yang kurang ditambahkan di `apps/web/src/ui/Ikon.tsx` |
| Urutan | Seret di dalam satu kelompok mengubah kolom `entri_konten.urutan` (bukan revisi) lewat RPC `atur_urutan` |
| Siapa boleh seret | admin dan penulis; reviewer tidak (tanpa pegangan seret) |
| Data beranda | Dihitung di klien dari `daftarEntri` semua jenis |

## Kerangka & navigasi

Sidebar, dari atas:

| Grup | Menu | Jenis konten |
|---|---|---|
| — | Beranda | — |
| — | Antrean review (lencana jumlah diajukan) | semua |
| Belajar | Modul & Materi | `modul`, `materi` |
| Bank soal | Soal kuis | `soal_kuis` |
| | Soal hitung | `soal_hitung` |
| Tanya jawab | Kasus tanya jawab | `tanya_jawab` |
| | FAQ | `faq` |
| Pustaka | Kitab & syahid (tab) | `kitab`, `syahid` |
| | Glosarium & ahwal (tab) | `glosarium_ar`, `ahwal` |
| Aplikasi | Teks aplikasi (tab) | `teks_edukasi`, diksi, `cheatsheet` |
| — | Peran (admin saja) | — |

Bawah sidebar: email + peran + tombol Keluar. Pemetaan menu → jenis ada di satu konstanta `MENU_PORTAL`
(`apps/admin/src/navigasi.ts`) supaya sidebar, rute, dan beranda memakai sumber yang sama. Menu aktif ditandai
sesuai rute (termasuk saat membuka editor entri jenis itu). Rute tetap `location.hash` (`rute.ts`), ditambah
`{ layar: 'beranda' }` sebagai bawaan dan `{ layar: 'menu', menu, tab? }` untuk menu bertab.

## Beranda

- Sapaan + peran.
- Empat kartu angka: **Draf saya**, **Menunggu review**, **Dikembalikan ke saya**, **Terbit**.
  "Saya" = `revisiTerakhir.dibuatOleh === sesi.userId`.
- **Lanjutkan pekerjaan**: entri saya berstatus draf / dikembalikan, terbaru dulu, dengan catatan review; maks 8.
- **Buat baru**: tombol per kelompok (Materi, Soal kuis, Soal hitung, FAQ, …), disembunyikan untuk reviewer.
- Reviewer: daftar utama = 8 entri diajukan tertua (tautan ke antrean review).
- Fungsi murni `ringkasBeranda(daftarEntri, userId)` → angka & daftar; komponen hanya menampilkan.

## Daftar konten

- Kepala: jejak grup, judul menu, tombol "+ <jenis> baru" (bukan reviewer).
- Tab status dengan jumlah: Semua / Draf / Diajukan / Dikembalikan / Terbit (memakai `statusTampil` yang ada;
  "terbit + draf" dihitung di Draf dan Terbit).
- Cari: judul, slug, atau kode ref (tanpa beda huruf besar/kecil).
- Baris: pegangan seret (bila boleh), judul, chip status, chip ref, waktu relatif diubah; catatan review tampil
  kecil bila dikembalikan. Klik baris → editor.
- **Modul & Materi**: materi dikelompokkan per `isi.modul` di bawah kepala modul (nomor, judul, jumlah materi,
  ikon pensil → editor modul). Materi dengan modul tak dikenal masuk grup "Tanpa modul" di akhir.
- Jenis lain: daftar datar.
- Kondisi memuat (kerangka abu), kosong (ajakan buat entri pertama), dan galat (pesan + coba lagi).

## Urutan seret

- Seret hanya di dalam satu kelompok (satu modul, atau satu daftar datar) dan hanya saat tab "Semua" tanpa
  kata cari (urutan parsial tak bermakna).
- Implementasi: HTML drag-and-drop bawaan + tombol naik/turun per baris untuk keyboard (aksesibilitas);
  tanpa dependency baru.
- Setelah lepas: UI langsung memakai urutan baru, lalu `repo.editorial.aturUrutan(entriIds)`. Gagal → urutan
  dikembalikan ke semula + pesan galat.
- Database: fungsi baru

  ```sql
  atur_urutan(p_entri uuid[]) -- security definer
  ```

  memeriksa `peran_saya() in ('admin','penulis')`, semua id satu `jenis`, lalu dalam satu transaksi
  `urutan = posisi * 10`; entri yang sedang terbit mendapat `versi_terbit = naikkan_versi_konten()` supaya web
  mengambil urutan baru. Status revisi tidak disentuh. Grant update kolom `urutan` untuk penulis **tidak**
  ditambahkan; policy `ubah` tetap admin.
- `RepositoriEditorial.aturUrutan(entriIds: string[]): Promise<void>` di `@waris/data` (Supabase = RPC,
  memori = set urutan & periksa peran yang sama).

## Galat

Semua galat repo tampil sebagai pesan di layar (bukan layar kosong / konsol saja), mengikuti pola yang ada.

## Tes

- Unit: `MENU_PORTAL` mencakup semua `JENIS_KONTEN` tepat sekali (+ diksi); `ringkasBeranda`; penyaringan
  tab & cari; pengelompokan materi per modul.
- Komponen: sidebar per peran (Peran hanya admin, tanpa tombol buat untuk reviewer); seret memanggil
  `aturUrutan` dan rollback saat gagal; reviewer tanpa pegangan seret.
- pgTAP: `atur_urutan` — penulis & admin boleh, reviewer ditolak, campur jenis ditolak, status revisi tidak
  berubah, entri terbit naik `versi_terbit`.
- Repo memori & Supabase lulus tes kontrak yang sama untuk `aturUrutan`.
