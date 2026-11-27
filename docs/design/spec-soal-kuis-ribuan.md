# Spec: ribuan soal kuis pilihan ganda dan review dua tahap

Status: draf, menunggu persetujuan pemilik (2026-11-27).

## 1. Maksud

Pemilik ingin angka jualan "jutaan soal hitung, ribuan soal kuis". Soal hitung sudah ada (bank G1–G5, 1,18 juta).
Spec ini menambah soal kuis pilihan ganda dalam jumlah ribuan tanpa membebani tim keilmuan dengan peninjauan satu
per satu yang tidak perlu, dan menambah alur verifikasi supaya soal baru tampil setelah disetujui.

Bukan cakupan: soal benar/salah (dibatalkan pemilik), XP server (ikut fitur kelas), madzhab selain [SYF] untuk
soal mesin.

## 2. Dua sumber soal kuis

| | Soal konsep | Soal angka |
|---|---|---|
| Contoh | "Mengapa saudara seibu gugur oleh kakek?" | "Ahli waris: istri, ibu, 2 anak perempuan. Berapa bagian ibu?" |
| Pembuat | Codex lewat `docs/soal-kit/` | Mesin, dari bank kasus G1 |
| Jumlah | sekitar 1.000 (kerangka × ~7) | puluhan ribu (dipilih dari 1,18 juta kasus) |
| Kebenaran | `soal:cek` + review dua tahap per soal | engine; tim memverifikasi **aturan pengecoh** sekali |
| Disimpan | `soal_kuis` (revisi, status) | tidak disimpan per soal; diturunkan dari kode, seperti soal bank |

Angka publik yang jujur: "1,18 juta soal hitung, N ribu soal kuis angka, ~1.000 soal konsep terverifikasi tim
keilmuan". N dihitung dari hasil sapuan, bukan ditaksir.

## 3. Soal angka buatan mesin

### 3.1 Bentuk soal

Satu kasus bank (kode `G1-…`, keluarga biasa saja pada tahap ini) dipasangkan dengan satu **pertanyaan**:

| Jenis pertanyaan | Jawaban benar | Syarat kasus |
|---|---|---|
| `bagian:<KUNCI>` | pecahan bagian akhir ahli waris itu (setelah 'aul/radd) | KUNCI ada dan mendapat bagian |
| `gugur` | ahli waris yang mahjub hirman | ada tepat satu kelompok yang gugur |
| `ashlAkhir` | penyebut akhir (ashl, 'aul, atau tashih) | — |
| `ashabah` | siapa penerima ashabah | ada ashabah |

Kode soal: `K1-<muatan>` dengan muatan = kode kasus bank + jenis pertanyaan + kunci, Crockford base32 dan bisa
diurai balik, mengikuti `kodeSoal.ts`. Soal tidak disimpan; teks, pilihan, dan pembahasan dibangun ulang dari kode.
Urutan pilihan diacak deterministik dari kode (FNV), bukan `Math.random`.

### 3.2 Pengecoh dari aturan salah paham

Tiap pengecoh dihasilkan oleh satu **aturan salah paham** yang menjalankan engine pada kasus yang sengaja dikeliruan
atau mengambil angka antara dari jejak engine. Daftar awal (dipilih dari `docs/soal-kit/pengecoh.md` yang punya
dasar KB):

| Aturan | Cara menghitung angka keliru | Dasar benarnya |
|---|---|---|
| `lupaAul` | bagian sebelum 'aul (fardh/ashl, bukan fardh/'aul) | R09-4 |
| `lupaRadd` | bagian fardh tanpa radd | R09-7 |
| `lupaHajb` | engine dijalankan dengan mahjub dianggap tidak terhalang | bab 5 |
| `ibuTetapSepertiga` | ibu 1/3 padahal ada anak atau ≥2 saudara | bab 3 (ibu) |
| `pasanganTertukar` | suami/istri memakai bagian tanpa anak padahal ada anak, atau sebaliknya | bab 3 |
| `ashabahSamaRata` | ashabah bil ghair dibagi rata, bukan 2:1 | bab 4 / 10.5 |
| `ashabahTerbalik` | penerima ashabah = kerabat yang kalah kuat | bab 4 |

Aturan sah untuk sebuah soal bila angkanya **berbeda** dari jawaban benar dan dari pengecoh lain. Soal dibuang
bila pengecoh sah kurang dari 2 (pilihan = 3 atau 4). Setiap pengecoh membawa alasan bertemplat diksi
(`soalKuis.pengecoh.<aturan>`), pilihan benar membawa alasan dari narasi engine (`packages/explain`), dan ada
pembahasan utuh dari jejak. Semua kalimat lewat `pnpm diksi:tambah`.

Verifikasi tim keilmuan: per **aturan**, bukan per soal. Halaman admin menampilkan tiap aturan dengan 5 contoh
soal acak; satu aturan disetujui = semua soal yang memakainya boleh tampil. Aturan yang belum disetujui tidak
dipakai pembangun.

### 3.3 Pemilihan dan tingkat

- Tingkat dan modul diambil dari kasus bank (ATURAN_TINGKAT/ATURAN_MODUL), lalu disesuaikan jenis pertanyaan
  (`gugur` dan `ashabah` turun satu tingkat dari kasusnya, minimal dasar).
- Kuota per (tingkat, jenis pertanyaan, label utama) memakai water-filling seperti G2, target awal 30.000 soal.
- Indeks ditulis ke `.bank/indeks-kuis.jsonl`, dimuat ke tabel `bank_soal` dengan kolom `bentuk = 'kuis'`
  (kolom baru, default `'hitung'`), sehingga `cari_soal` bisa menyaring bentuk.

## 4. Soal konsep dari Codex

- Target dinaikkan dari 136 ke sekitar 1.000: `kerangka-soal.md` dikali ~7, proporsi dasar/menengah/sulit tetap.
  Soal konsep tidak mengulang soal angka yang sudah dibuat mesin: kerangka diubah supaya Codex fokus pada
  pengertian, syarat, alasan hukum, khilaf, dan kasus yang tidak bisa dibuat mesin (munasakhat, dzawil arham,
  ketidakpastian).
- `pnpm soal:impor <paket>... [--kering]`: hanya paket yang lolos `soal:cek` tanpa galat. Tiap soal = entri
  `soal_kuis` (slug = kode `P-NN-NNN`, `sumber = 'paket:<nama>'`) dengan revisi berstatus **diajukan**. Soal yang
  isinya sama dengan revisi terakhir dilewati. Menulis lewat akun impor ke database lokal atau yang ditunjuk
  pemilik; agen tidak pernah menulis ke database produksi.
- Format tetap: setiap pilihan (benar dan salah) wajib punya alasan, ditambah `pembahasan`.

## 5. Review dua tahap

### 5.1 Status dan peran

```
draf → diajukan → diperiksa → disetujui (terbit)
                ↘ dikembalikan ↙
```

- Status baru `diperiksa` di enum `status_revisi`, di antara `diajukan` dan `disetujui`.
- Peran baru `keilmuan` di enum `peran`.
- `diajukan → diperiksa`: admin atau reviewer, wajib semua butir checklist dicentang.
- `diperiksa → disetujui`: hanya `keilmuan` (atau admin). Disetujui = diterbitkan seperti alur sekarang.
- Kedua tahap boleh `dikembalikan` dengan catatan. Ditegakkan di database (trigger/RLS), bukan hanya di UI.
- Berlaku untuk `soal_kuis` saja; jenis konten lain tetap satu tahap seperti sekarang.

### 5.2 Checklist

Tabel `ceklis_review (revisi_id, butir, dicentang_oleh, dicentang_pada)`. Butir tetap (konstanta di satu tempat,
bukan konfigurasi):

1. Jawaban benar sesuai KB dan rujukannya cocok.
2. Setiap pengecoh mewakili salah paham yang masuk akal, alasannya benar.
3. Kalimat soal jelas, tidak ambigu, tidak menebak dari panjang pilihan.
4. Tingkat dan modul sesuai.
5. Bahasa sesuai panduan gaya.

Hasil `soal:cek` (rujukan, istilah, angka engine) ditampilkan di samping soal sebagai bantuan, tidak menggantikan
centang.

### 5.3 Layar antrean

Antrean review untuk `soal_kuis` mendapat tampilan soal pilihan ganda: soal, pilihan dengan kunci ditandai, alasan
tiap pilihan, pembahasan, rujukan, hasil cek mesin, dan checklist. Saring per modul, tingkat, status, dan paket,
supaya tim bisa membagi kerja. Pindah ke soal berikutnya setelah menyetujui. Tanpa kode teknis di layar (kode
rujukan tampil sebagai nama kitab/bab, sesuai aturan portal).

## 6. Uji

- Kode `K1-…` bolak-balik untuk semua jenis pertanyaan (property test).
- Tiap aturan pengecoh: kasus contoh dengan angka keliru yang diharapkan; pengecoh tak pernah sama dengan jawaban.
- Sapuan: tidak ada soal dengan < 3 pilihan; jawaban benar selalu ada di pilihan.
- pgTAP: transisi status ilegal ditolak (reviewer tidak bisa `disetujui`, `diperiksa` tanpa checklist lengkap
  ditolak, keilmuan bisa menyetujui).
- `soal:impor --kering` pada contoh soal-kit.

## 7. Tahapan

| Tahap | Isi | Pelaksana |
|---|---|---|
| K1 | Review dua tahap: migrasi status + peran + checklist + pgTAP | Sonnet, review Opus |
| K2 | `soal:impor` | Sonnet |
| K3 | Layar antrean soal kuis + checklist di admin | Sonnet, cek browser |
| K4 | Kode `K1-…` + aturan pengecoh + pembangun soal angka | Sonnet, review Opus (fikih) |
| K5 | Halaman verifikasi aturan pengecoh + muat ke `bank_soal` + tampil di Latihan | Sonnet |
| K6 | Kerangka soal konsep ~1.000 di soal-kit | Opus |

K1–K3 dan K6 membuka jalan bagi Codex; K4–K5 bisa berjalan paralel.

## 8. Keputusan terbuka

- Siapa saja anggota peran `keilmuan` (pemilik mengatur di Kelola Peran).
- Soal angka keluarga lanjutan (munasakhat dll.) menyusul setelah keluarga biasa stabil.
