# Daftar sumber jalur KHI dan cara melacaknya

> Tujuan: setiap pernyataan di `00_temuan_awal.md`, `01_riset_fikih_pembanding.md`, dan KB KHI nanti bisa ditelusuri ke berkas, halaman atau pasal asalnya.
> Aturan: kutip dengan **kode sumber + lokasi** (contoh: `[S01 Pasal 185]`, `[S05 hlm. 164, butir 2a]`, `[F01 Raudhah 4/279]`). Berkas asli ada di folder
> `/home/fariqsutikno/Kuliah/0. Tugas Akhir/Referensi Kitab Faraidh/` (di luar repo; **sha256 12 huruf pertama** dicantumkan supaya salinan bisa dicocokkan).
> Teks hasil ekstraksi: `markdown-khi/` di folder yang sama; gabungan semuanya: `markdown-khi/kumpulan-sumber-khi.md`. Teks KHI terverifikasi (Pasal 85–97, 170–214): `docs/kb-khi/00_teks_khi_terverifikasi.md`.
> Tingkat: **P** = teks hukum positif, **PA** = praktik peradilan agama (pedoman/SEMA/yurisprudensi), **S** = sekunder (makalah ilmiah), **T** = tersier (ulasan populer), **F** = fikih klasik, **FM** = fikih modern.

## 1. Hukum positif dan praktik PA

| Kode | Sumber | Tingkat | Berkas | sha256 | Cara melacak |
|---|---|---|---|---|---|
| S01 | Kompilasi Hukum Islam (Inpres 1/1991), Buku I Bab XIII, Buku II, Penjelasan | P | `KHI.pdf` | 96bad0e96ccd | Pasal 85–97 hlm. cetak 22–25; Pasal 170–214 hlm. 40–48; Penjelasan hlm. 55–58. Salinan lurus: `docs/kb-khi/00_teks_khi_terverifikasi.md` |
| S02 | KHI, kutipan Buku II (hlm. 40–44, Pasal 170–193) | P | `KHI Waris.pdf` | c1d1d98d98d9 | subset S01; hanya sampai Pasal 193 |
| S03 | KHI edisi lain 1 (OCR, memuat catatan kaki Pasal 177 = SEMA MA 2/1994) | P | `KHI Ed Lain.md` | 025824d36879 | cari "Pasall77" dan "Surat Edaran Mahkamah Agung Nomor : 2 Tahun 1994" |
| S04 | KHI edisi lain 2 (bersih) | P | `KHI Ed Lain 2.md` | 709279c5a126 | judul `# Pasal 174`, `# Pasal 177`, `# Pasal 209` |
| S05 | Pedoman Pelaksanaan Tugas dan Administrasi Peradilan Agama, **Buku II Edisi Revisi 2010** (MA RI Ditjen Badilag, 2011) | PA | `Pedoman Pelaksana Tugas dan Administrasi Peradilan Agama.md` | b7da72489c3c | Harta bersama poligami: hlm. cetak 139–140 (baris berkas 4296–4324). Hukum Kewarisan: hlm. 163–168 (baris 4812–4960). Kutipan: `markdown-khi/pedoman-buku-ii-kutipan.md` (OCR, ada derau) |
| S06 | Himpunan Yurisprudensi MA s.d. 2018: Y1 `1/Yur/Ag/2018` (wasiat wajibah, baris 1759–1830), Y2 `2/Yur/Ag/2018` (ahli waris pengganti, baris 1840–) | PA | `Yurisprudensi Tahun 2018.md` | 1349669cc3f1 | juga tersedia sebagai teks ditempel pemilik: `markdown-khi/yurisprudensi-dan-rumusan-kamar-ma.md` (Y1–Y4, dengan alamat putusan3.mahkamahagung.go.id) |
| S07 | Rumusan Kamar Agama SEMA: 3/2023 (berkas PDF utuh), serta 3/2015, 7/2012 (butir 10, 17, 18–20), 1/2017, 5/2021, 1/2022, 2/2019 | PA | `rumusan_kamar_agama_3_sema_3_2023_20261123035316.pdf` (hanya SEMA 3/2023) | d4b510abbf29 | SEMA lain hanya ada sebagai teks ditempel pemilik: `markdown-khi/yurisprudensi-dan-rumusan-kamar-ma.md` tabel "Rumusan Kamar" (alamat asli pada teks ditempel; **belum ada berkas PDF-nya** untuk SEMA selain 3/2023) |
| S08 | Putusan MK 46/PUU-VIII/2010 (Pasal 43(1) UU Perkawinan), diucapkan 17 Februari 2012 | P | `putusan_46-puu-viii-2010_(perkawinan).md` | bdd5431da210 | amar pada judul "5. AMAR PUTUSAN" (baris ±628–640), pertimbangan [3.14] baris 608 |

## 2. Sekunder dan tersier (ulasan; bukan dasar aturan)

| Kode | Sumber | Tingkat | Berkas | sha256 | Cara melacak |
|---|---|---|---|---|---|
| S09 | Drs. H. Djafar Abdul Muchith, SH, MHI, "Hukum Kewarisan Islam menurut KHI (Kajian Implementasi Pasal 178 ayat 2, 181, 182, dan 185)" | S | `Kewarisan Islam menurut KHI-revisi.pdf` | 3b484b591a8d | 26 hlm.; Pasal 185: bagian C hlm. 14–24 (hlm. 18–19 rumusan, hlm. 23–24 batasan); Pasal 181–182: bagian B hlm. 5–13. Teks: `markdown-khi/kewarisan-islam-menurut-khi-revisi.txt` |
| S10 | Jurnal JHPIS 1(3) 2022, "Sistem Pewarisan Menurut Hukum Perdata" (BW; pembanding, bukan KHI) | S | `204-214+Sistem+Pewarisan+Menurut+Hukum+Perdata.md` | 212dda947046 | seluruhnya |
| S11 | Artikel IJISK 3(4) 2026, saudara seibu menurut BW dan putusan PN Medan 117/Pdt.G/2026 (di luar cakupan KHI; tidak dipakai) | S | `Artikel+Ijisk+3508-3526.md` | abdac8765f72 | seluruhnya |
| H01 | hukumonline Klinik: Aturan Ahli Waris karena Penggantian Tempat | tersier | `hukumonline.com-Aturan Ahli Waris karena Penggantian Tempat.pdf` | 9f59847164d6 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H02 | hukumonline Klinik: Bisakah Mantan Suami Dapat Warisan Jika Masih Masa Iddah | tersier | `hukumonline.com-Bisakah Mantan Suami Dapat Warisan Jika Masih Masa Iddah.pdf` | acaac18b6de7 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H03 | hukumonline Klinik: Bolehkah Menggunakan Hukum Waris Lain Jika Beragama Islam | tersier | `hukumonline.com-Bolehkah Menggunakan Hukum Waris Lain Jika Beragama Islam.pdf` | b1b49aa6fbc6 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H04 | hukumonline Klinik: Bolehkah Warisan Dibagi Rata Menurut Hukum Islam | tersier | `hukumonline.com-Bolehkah Warisan Dibagi Rata Menurut Hukum Islam.pdf` | 134a9e461fc9 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H05 | hukumonline Klinik: Cara Hitung Pembagian Harta Warisan Anak Menurut Hukum Islam | tersier | `hukumonline.com-Cara Hitung Pembagian Harta Warisan Anak Menurut Hukum Islam.pdf` | fff444816379 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H06 | hukumonline Klinik: Cara Menentukan Ahli Waris dalam Islam Jika Tak Ada Keturunan | tersier | `hukumonline.com-Cara Menentukan Ahli Waris dalam Islam Jika Tak Ada Keturunan.pdf` | 257bd57f2e3e | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H07 | hukumonline Klinik: Cara Pembatalan Fatwa Waris Jika Ada Ahli Waris yang Keberatan | tersier | `hukumonline.com-Cara Pembatalan Fatwa Waris Jika Ada Ahli Waris yang Keberatan.pdf` | 87194199dc53 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H08 | hukumonline Klinik: Dapatkah Ahli Waris Menolak Warisan | tersier | `hukumonline.com-Dapatkah Ahli Waris Menolak Warisan.pdf` | b77b6e805eaf | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H09 | hukumonline Klinik: Hak Waris Duda Menurut Hukum Waris Islam | tersier | `hukumonline.com-Hak Waris Duda Menurut Hukum Waris Islam.pdf` | 6efa58184ff5 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H10 | hukumonline Klinik: Hak Waris Istri Kedua Jika Suaminya Meninggal | tersier | `hukumonline.com-Hak Waris Istri Kedua Jika Suaminya Meninggal.pdf` | f29ac74c336d | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H11 | hukumonline Klinik: Hukum Wasiat dalam Pembagian Waris secara Islam | tersier | `hukumonline.com-Hukum Wasiat dalam Pembagian Waris secara Islam.pdf` | 80f238040d69 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H12 | hukumonline Klinik: Kedudukan antara Wasiat dan Pembagian Waris Menurut Al-Quran | tersier | `hukumonline.com-Kedudukan antara Wasiat dan Pembagian Waris Menurut Al-Quran.pdf` | 4491f6904807 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H13 | hukumonline Klinik: Langkah Hukum Jika Ahli Waris Dihalang-halangi dalam Pembagian Warisan | tersier | `hukumonline.com-Langkah Hukum Jika Ahli Waris Dihalang-halangi dalam Pembagian Warisan.pdf` | 4f86d9354aa9 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H14 | hukumonline Klinik: Mengenal Ahli Waris untuk Pewaris Lajang dalam Islam | tersier | `hukumonline.com-Mengenal Ahli Waris untuk Pewaris Lajang dalam Islam.pdf` | 4ea292a1fe9c | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H15 | hukumonline Klinik: Ortu Bagikan Harta ke Anaknya Sebelum Meninggal Bagaimana Hukumnya | tersier | `hukumonline.com-Ortu Bagikan Harta ke Anaknya Sebelum Meninggal Bagaimana Hukumnya.pdf` | f2d7db177a74 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H16 | hukumonline Klinik: Pembagian Waris Menurut Islam dalam Keadaan Kalalah | tersier | `hukumonline.com-Pembagian Waris Menurut Islam dalam Keadaan Kalalah.pdf` | 900c5a8bcd66 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H17 | hukumonline Klinik: Perhitungan Pembagian Waris dalam Perkawinan Poligami | tersier | `hukumonline.com-Perhitungan Pembagian Waris dalam Perkawinan Poligami.pdf` | 4ab857d7f765 | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H18 | hukumonline Klinik: Prinsip Pewarisan Menurut KUH Perdata dan Hukum Islam | tersier | `hukumonline.com-Prinsip Pewarisan Menurut KUH Perdata dan Hukum Islam.pdf` | d6d737c1ef0b | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |
| H19 | hukumonline Klinik: Yang Berhak Jadi Ahli Waris Jika Sekeluarga Telah Meninggal | tersier | `hukumonline.com-Yang Berhak Jadi Ahli Waris Jika Sekeluarga Telah Meninggal.pdf` | 22532f33bb4d | teks: `markdown-khi/hukumonline-*.txt` dan bagian 4 `kumpulan-sumber-khi.md` |

## 3. Fikih (rujukan Shamela)

Bentuk: `jilid/halaman cetak · shamela:<book_id>/<page_id>`; dapat dibuka dengan `shamela_get_page(book_id, page_id)`.

| Kode | Sumber | Tingkat | book_id | Dipakai untuk |
|---|---|---|---|---|
| F01 | an-Nawawi, *Raudhah ath-Thalibin* | F ([SYF] primer) | 499 | syirkah: 4/275 (p.1669), 4/279 (p.1673), 4/280 (p.1674); hibah: 5/364 (p.2202), 5/375 (p.2213); tabarru' sakit maut: 3/429 (p.1236) |
| F02 | Ibnu al-Mulaqqin, *'Ujalat al-Muhtaj ila Taujih al-Minhaj* (syarah Minhaj an-Nawawi) | F ([SYF] sekunder-klasik) | 20561 | taswiyah hibah antar anak, sunnah/makruh: 2/987 (p.982), 2/988 (p.983) |
| F03 | an-Namlah, *Taisir Masa'il al-Fiqh* (syarah ar-Raudh al-Murbi', [HNB]) | F ([HNB] sekunder) | 1319 | taswiyah wajib: 4/18 (p.2063) |
| F04 | Fadhl Murad, *al-Qawa'id al-Umm li al-Fiqh*, memuat Keputusan 3/1444 H Lajnah al-Ijtihad wa al-Fatwa, Ittihad 'Alami li 'Ulama al-Muslimin (2 Mei 1444 H / 26 Nov 2022), tentang harta campuran suami-istri | FM | 30084 | kadd wa si'ayah, harta istri milik sendiri: hlm. 581–582 (p.569–570) |
| F05 | Ibnu Hazm, *al-Muhalla* | F (sekunder bagi madzhab lain) | 767 | pendapat Abu Hanifah tentang syirkah abdan: 6/413 (p.2534) |

## 4. Peta klaim → sumber (untuk `00_temuan_awal.md` bagian 3 dan 6)

| Baris temuan | Klaim | Sumber dan lokasi |
|---|---|---|
| 1 | Pasal 185 | S01 Pasal 185; S06 (Y2); Rakernas 2010 lewat S07 SEMA 3/2015 butir 9; S09 hlm. 18–24; S05 hlm. 163–164 (asas a(2)), 167 (butir 4c) |
| 2 | Pasal 209 dan perluasan | S01 Pasal 209; S06 (Y1); S07 SEMA 7/2012 butir 20, SEMA 3/2023; S05 hlm. 165 (asas i) |
| 3 | Harta bersama | S01 Pasal 85–97, 171(e), 190; S05 hlm. 139–140 (poligami); S06 (Y1: putusan 16 K/Ag/2010, 721 K/Ag/2015) |
| 4 | Pasal 173 | S01 Pasal 173, 197; bandingkan KB bab 02 (R02-8, K02-1) |
| 5 | Pasal 171(c), 172 | S01 Pasal 171(c), 172 |
| 6 | Pasal 177 | S01 Pasal 177; S03 catatan kaki (SEMA MA 2/1994); S05 hlm. 165 butir 4a(1) |
| 7–8 | Pasal 176, 178(2) | S01; S09 hlm. 2–5 (Umariyyatain) |
| 9 | Pasal 181–182, saudara seibu = kandung | S01 Pasal 181–182; S05 hlm. 167 butir 6 (tanpa nomor putusan); S09 hlm. 5–13 |
| 10, 14 | kakek/nenek/paman/bibi, tanpa dzawil arham | S05 hlm. 163 (asas a), 166 butir 4b–c, 167 butir 5–7 |
| 11 | Pasal 186 | S01 Pasal 186 dan Penjelasan ("149 s/d 185" sic); S08 amar |
| 12–13 | Pasal 192–193, rad tanpa janda/duda | S01 Pasal 192–193; S05 hlm. 168 butir 8(g)(h) |
| 15–16 | Pasal 195, 201, 211–213 | S01 Pasal 195, 201, 210–213; S05 hlm. 165 butir 3 |
| 17 | Pasal 183 | S01 Pasal 183; S05 hlm. 164 butir 2(e) |
| 18–19 | Pasal 189, 175, 187 | S01 Pasal 175, 187, 189 |
| A (riset) | syirkah [SYF] | F01 4/275, 4/279, 4/280; kadd wa si'ayah F04 hlm. 581–582 |
| B (riset) | hibah | F01 5/375, 3/429, 5/364; taswiyah: F02 2/987–988 ([SYF]), F03 4/18 ([HNB]) |
