# Muat ulang di Hitung & Latihan: diagnosis dan peta uji

Tanggal: 2026-11-23. Status: diagnosis selesai, perbaikan belum.

## Cara kerja sekarang

- URL kasus: `#/hitung/<idSesi>` (hasil), `/langkah/<n>` (wizard), `/cerita` (`rute.ts`).
- Muat ulang → `pulihDariUrl` (`Aplikasi.tsx`) mencari entri **riwayat** (`localStorage arif-waris:riwayat`) berid itu,
  lalu memutar ulang reducer: `MUAT` (+ `KE_LANGKAH`/`KE_LAYAR`). Tidak ketemu → `keadaanAwal` → layar Awal, dan efek
  `replaceState` menimpa URL jadi `#/hitung`.
- Yang **tidak** ikut tersimpan: semua `useState` di `Aplikasi` (soalAktif, sesiJanganSimpan) dan di `Hasil` /
  `TabelLatihan` (isian tabel, jawabanTerbuka, sudahMencoba, tebakanBenar, jangkar, idSesiSoal, panel/dialog).

## Akar masalah (terverifikasi)

| # | Gejala | Sebab | Bukti |
|---|---|---|---|
| A1 | Soal latihan setelah refresh: judul "Soal" saja; hilang "Soal 1 dari 23 · bab", kode "Soal H-01", tombol soal berikutnya | `soalAktif` hanya `useState`, tidak dipulihkan dari `entri.sumber = {latihan, kode}` | Browser: sebelum vs sesudah reload |
| A2 | Setelah refresh, buka jawaban / jawab benar **tidak menandai soal selesai**, tanpa XP, percobaan tidak tercatat | turunan A1: `saatDikerjakan` & `soal` = undefined | `Aplikasi.tsx` props Hasil |
| A3 | Isian tabel yang sudah diketik kosong lagi, jawaban yang sudah dibuka tertutup lagi | state `TabelLatihan`/`Hasil` tidak dipersist | `TabelLatihan.tsx` `useState<IsianTabel>` |
| A4 | Sel jangkar (angka bantuan) pindah tempat tiap refresh | `pilihJangkar(tabel, Math.random)` di `useMemo` | Browser: jangkar 3 di Istri → 4 di Ayah |
| B1 | Lab Hitung: susunan cepat → Hasil (saham, harta belum diisi) → refresh → **wizard isian** | `pulihDariUrl` memaksa kasus `!kasusLengkap` ke wizard, padahal `mulaiDari` sengaja membuka Hasil tanpa harta | Unit test sementara: layar `wizard` langkah 1 |
| C1 | Refresh di pintu / wizard sebelum jenis kelamin almarhum dipilih → Awal | `kasus` null → URL `#/hitung` | Disengaja (belum ada isian); cukup dicatat |

Kasus sendiri yang lengkap, dibuka dari Riwayat lalu di-refresh: **pulih benar** (diuji di browser).

## Arah perbaikan (usulan, belum dikerjakan)

1. A1/A2: di `pulihDariUrl` (dan efek `PULIHKAN`), bila `sumber.jenis === 'latihan'` turunkan `soalAktif` dari
   `daftarSoalHitung().find(kode)`; satu sumber, tanpa simpanan baru.
2. B1: syarat "boleh tetap di Hasil" sama dengan syarat `mulaiDari`, bukan `kasusLengkap`. Bisa jadi satu fungsi
   `bolehDiHasil(kasus)` (ada ahli waris + keluarga lengkap; harta boleh 0) dipakai oleh `pulihDariUrl` dan Hasil.
3. A4: jangkar dari benih `idSesi` (PRNG kecil, deterministik), bukan `Math.random`, jadi sama setelah refresh.
4. A3: simpan `{isian, jawabanTerbuka, sudahMencoba, tebakanBenar, idSesiSoal}` per `idSesi` di `sessionStorage`
   (hilang saat tab ditutup, cukup untuk refresh). Bersihkan saat soal ditandai selesai atau dibuka ulang dari daftar.

## Peta uji

Lapisan: **U** = unit (vitest, `pulihDariUrl`/reducer/riwayat), **K** = komponen (Testing Library), **E** = browser
(preview, manual/otomatis). Kolom "Harapan" = perilaku yang diinginkan sesudah perbaikan.

### 1. Pulih posisi (rute + riwayat)

| ID | Skenario | Harapan | Lapisan |
|---|---|---|---|
| P1 | Kasus sendiri lengkap di Hasil, refresh | Hasil kasus sama, URL sama | U (ada) |
| P2 | Wizard langkah n, refresh | Langkah n; bila n melewati yang boleh, dibatasi ke langkah terjauh | U (ada) |
| P3 | `/cerita`, refresh | Layar cerita | U |
| P4 | Susunan cepat (harta 0) di Hasil, refresh | **Tetap di Hasil** (B1) | U |
| P5 | Kasus belum ada ahli waris di URL hasil | Wizard langkah pertama yang kosong | U (ada) |
| P6 | URL `/langkah/abc`, `/langkah/99`, `/langkah/0`, `/langkah/-1` | Tidak macet; jatuh ke langkah sah | U |
| P7 | URL lama `/langkah/3/<babak>` | Langkah 3 | U (ada) |
| P8 | Id tidak ada di riwayat (dihapus / > 30 hari / perangkat lain) | Layar Awal **dengan pesan** "kasus tidak ditemukan di perangkat ini", bukan diam-diam | U + K |
| P9 | Id cuma ada di Tersimpan (manual, ikut akun), tidak di riwayat | Pulih dari Tersimpan | U |
| P10 | `localStorage` diblokir / penuh / JSON rusak | Tidak crash; Awal + pesan | U |
| P11 | Entri riwayat berisi kasus versi lama yang gagal `dariJson` | Dilewati; perlakuan seperti P8 | U |
| P12 | Hash diganti manual ke kasus lain di tab yang sama | Kasus itu dibuka (`PULIHKAN`), kasus lama tercatat | U/E (ada sebagian) |
| P13 | Back/forward browser antara `#/latihan` dan `#/hitung/<id>` | Posisi benar, tanpa dialog ganda | E |
| P14 | Login Google (`?code=`) lalu kembali ke `#/hitung/<id>` | Kasus pulih, `code` dibersihkan dari URL | E |
| P15 | Sinkron akun selesai setelah render awal | Tidak menimpa kasus yang sedang dibuka | E |

### 2. Soal latihan

| ID | Skenario | Harapan | Lapisan |
|---|---|---|---|
| L1 | Buka soal, refresh sebelum mengisi | Hero "Soal n dari N · bab", kode soal, soal berikutnya tetap ada (A1) | U + E |
| L2 | Isi sebagian tabel, refresh | Isian kembali (A3) | K + E |
| L3 | Periksa (salah), refresh | Isian + status "sudah mencoba" kembali; buka jawaban sesudahnya dihitung dikerjakan tanpa XP | K |
| L4 | Jawab benar, refresh | Pembahasan tetap terbuka; progres & XP tercatat **sekali** (tidak dobel) | K + U |
| L5 | Buka jawaban tanpa mencoba, refresh | Jawaban tetap terbuka; tidak dihitung dikerjakan | K |
| L6 | Jangkar | Sama sebelum dan sesudah refresh (A4); beda antar sesi soal boleh | U |
| L7 | Kejadian percobaan | `idSesiSoal` sama setelah refresh; tidak ada kejadian `buka` ganda | U |
| L8 | Buka soal yang sama dari daftar dua kali | Sesi baru: isian kosong, jangkar boleh baru | K |
| L9 | Soal gharqa (`GharqaLatihan`), refresh | Sama dengan L1–L6 | K |
| L10 | Soal [HNB] yang tak bisa jadi tabel (tampil sebagai hasil hitung), refresh | Tetap tampil hasil, tidak macet | U |
| L11 | Soal tanpa harta (masuk wizard), refresh | Wizard langkah yang sama | U |
| L12 | Kode soal di riwayat sudah dihapus dari bank soal | Kasus tetap dibuka sebagai latihan terkunci, tanpa hero soal; tidak crash | U |
| L13 | Revisi soal berubah antara buka dan refresh | `revisiId` diambil ulang; isian lama dibuang bila struktur tabel beda | U |
| L14 | Soal terakhir (tanpa berikutnya), refresh | Tautan "Kembali ke daftar soal" | K |
| L15 | Buka soal dari Awal Hitung (`saatKerjakanSoal`) saat hash sudah `#/hitung` | URL jadi `#/hitung/<id>`; refresh pulih | E |
| L16 | Mode tujuan `belajar` vs `hitung` | Tujuan tetap setelah refresh (dari `bacaTujuan`) | U |

### 3. Kasus sendiri / Lab Hitung

| ID | Skenario | Harapan | Lapisan |
|---|---|---|---|
| H1 | Hasil kasus sendiri, refresh | Simpan otomatis tetap menunjuk id yang sama, tanpa entri ganda | U |
| H2 | "Jangan simpan kasus ini" lalu refresh | Putuskan: tetap tidak disimpan (persist per id) atau kembali tersimpan, lalu uji keputusan itu (sekarang hilang diam-diam) | K |
| H3 | Ubah harta / ahli waris di Hasil, refresh | Perubahan terakhir ada (riwayat ditulis tiap perubahan) | U |
| H4 | Wizard belum selesai, refresh | Dialog bawaan `beforeunload` muncul; bila lanjut, langkah pulih | E |
| H5 | Kasus contoh materi (`sumber materi`, terkunci), refresh | Tetap terkunci | U (ada sebagian) |
| H6 | Kasus impor file, refresh | Pulih, sumber `impor` | U |
| H7 | Salin dari kasus dibagikan (`#/k/<slug>` → mulaiDari), refresh | Hasil kasus salinan (lihat P4) | U |
| H8 | Kasus menunggu kelahiran / munasakhat (`/cerita`), refresh | Layar sama | U |
| H9 | Pintu / wizard sebelum pewaris dipilih, refresh | Awal (C1, disengaja); dicatat di tes supaya tidak berubah diam-diam | U |

### 4. Lintas tab & data

| ID | Skenario | Harapan | Lapisan |
|---|---|---|---|
| X1 | Dua tab membuka soal yang sama → `catatRiwayat` membuang entri lain dengan JSON sama | Tab pertama refresh **tetap pulih** (dedup jangan menghapus id yang masih dibuka; minimal tetap pulih lewat P8) | U |
| X2 | Kasus dihapus dari halaman Riwayat di tab lain, lalu refresh | P8 | E |
| X3 | Riwayat > 30 hari dibuang saat `catatRiwayat` | Kasus yang sedang dibuka tidak ikut terbuang | U |
| X4 | Bahasa diganti (memuat ulang halaman) saat di Hasil/soal | Sama dengan refresh: posisi + isian kembali | E |
| X5 | Refresh berkali-kali cepat | Tidak menumpuk entri riwayat / kejadian percobaan | U |

### 5. Properti (invarian)

- Untuk setiap `keadaan` yang bisa dicapai lewat reducer dengan kasus `k`:
  `pulihDariUrl(tautanKasus(id, keadaan))` setelah `catatRiwayat(id, k)` menghasilkan `layar` & `langkah` yang sama
  (kecuali `awal`/`pintu`). Ini menangkap B1 dan regresi serupa sekaligus.
- `bacaRute(tautanKasus(...))` selalu bolak-balik ke posisi yang sama.

## Urutan kerja yang disarankan

1. Tes U untuk P4, P6, L1, L6, X1 + properti (merah dulu).
2. Perbaikan 1–3 (kecil, di `pulihDariUrl` + jangkar berbenih).
3. Tes K untuk L2–L5, lalu perbaikan 4 (sessionStorage per idSesi).
4. P8 (pesan kasus tidak ditemukan) dan H2 (keputusan pemilik).
5. Cek E di preview: L1–L4, P13, H4.
