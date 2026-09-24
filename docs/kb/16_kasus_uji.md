---
bab: 16
judul: Kasus Uji (Test Cases) Terverifikasi
tags: [kasus uji, test case, validasi, contoh]
---

# 16. Kasus Uji

Format: **Ahli waris → Ashl/Tashih → Bagian (saham)**. Default = jumhur kecuali ditandai. Setiap kasus menguji aturan tertentu.

| # | Ahli waris | Ashl → final | Saham | Menguji |
|---|-----------|-------------|-------|---------|
| 1 | Istri, anak lk, anak pr | 8 → 24 | Istri 3; anak lk 14; anak pr 7 | Ashabah bil ghair + tashih tabayun |
| 2 | Suami, ayah, ibu | 6 | Suami 3; ibu 1; ayah 2 | 'Umariyyah |
| 3 | Istri, ayah, ibu | 4 | Istri 1; ibu 1; ayah 2 | 'Umariyyah |
| 4 | Suami, kakek, ibu | 6 | Suami 3; ibu 2; kakek 1 | Kakek ≠ ayah dalam 'Umariyyah |
| 5 | Suami, 2 saudari kandung | 6 → 7 | Suami 3; saudari 4 (2+2) | 'Aul |
| 6 | Istri, ayah, ibu, 2 anak pr | 24 → 27 | Istri 3; ayah 4; ibu 4; anak pr 16 | Minbariyyah |
| 7 | Suami, ibu, 2 saudari seibu, 2 saudari kandung | 6 → 10 | Suami 3; ibu 1; seibu 2; kandung 4 | 'Aul maksimal |
| 8 | Anak pr, cucu pr (dari anak lk), saudari kandung | 6 | Anak pr 3; cucu pr 1; saudari 2 | Takmilah + ma'al ghair |
| 9 | Anak pr, ibu | 6 → radd 4 | Anak pr 3; ibu 1 | Radd tanpa pasangan |
| 10 | Suami, anak pr, cucu pr | 4 × 4 = 16 | Suami 4; anak pr 9; cucu pr 3 | Radd dengan pasangan (tabayun) |
| 11 | Istri, ibu, 2 saudara seibu | 4 | Istri 1; ibu 1; seibu 2 | Radd dengan pasangan (habis) |
| 12 | Suami, ibu, kakek, 1 saudari kandung | 6 → 9 → 27 | Suami 9; ibu 6; kakek 8; saudari 4 | Akdariyyah |
| 13 | Suami, ibu, 2 saudara seibu, 1 saudara lk kandung | 6 → 18 | Suami 9; ibu 3; tiap saudara (3 orang) 2 | Musyarrakah (tasyrik, default) |
| 13b | Sama, mode tanpa tasyrik (Hanafi–Hanbali–[UTS]) | 6 | Suami 3; ibu 1; seibu 2; kandung 0 | Opsi khilaf |
| 14 | Istri, kakek, 3 saudara lk kandung | 4 → 12 | Istri 3; kakek 3 (1/3 sisa); saudara 6 | Jadd wal ikhwah jumhur |
| 14b | Sama, mode [UTS] | 4 | Istri 1; kakek 3; saudara 0 | Kakek = ayah |
| 15 | Ayah, ibu, 2 saudara lk kandung | 6 | Ibu 1; ayah 5; saudara 0 | Mahjub tetap menghijab nuqshan |
| 16 | Suami, ayah, anak lk (+ semua lk lain) | 12 | Suami 3; ayah 2; anak lk 7 | Regresi hajb (semua lk) |
| 17 | Suami, ibu, saudari kandung, saudara lk sebapak, saudari sebapak | 6 → 7 | Suami 3; ibu 1; saudari kandung 3; sebapak (lk & pr) 0 | Qarib masy'um |
| 17b | Suami, ibu, saudari kandung, saudari sebapak | 6 → 8 | Suami 3; ibu 1; kandung 3; sebapak 1 | Pembanding 17 |
| 18 | 2 anak pr, cucu pr, cicit lk (anak lk cucu lk) | 3 → 9 | Anak pr 6 (3+3); cucu pr 1; cicit lk 2 | Qarib mubarak |
| 19 | Istri, anak pr, saudara lk sebapak, paman kandung | 8 | Istri 1; anak pr 4; saudara 3; paman 0 | Urutan jihah |
| 20 | Istri, anak lk, ayah, ibu | 24 | Istri 3; ayah 4; ibu 4; anak lk 13 | Ayah fardh saja |
| 21 | Istri, anak pr, ayah, ibu | 24 | Istri 3; anak pr 12; ibu 4; ayah 4 + 1 = 5 | Ayah fardh + ashabah |
| 22 | 4 istri, 3 saudara lk kandung | 4 → 16 | Istri 4 (1 each); saudara 12 (4 each) | Tashih 1 kelompok |
| 23 | 2 nenek, 3 saudara lk sebapak | 6 → 36 | Nenek 6 (3 each); saudara 30 (10 each) | Tashih 2 kelompok |
| 24 | Khalah, 'ammah (tanpa ahli waris lain) | 3 | Khalah 1; 'ammah 2 | Dzawil arham tanzil |

## Uji Nominal
Tirkah Rp 150.000.000; tajhiz Rp 5.000.000; hutang Rp 25.000.000; wasiat untuk masjid Rp 50.000.000.
- Sisa setelah hutang = 120.000.000; batas wasiat 1/3 = 40.000.000 → wasiat dipotong jadi **40.000.000** (kelebihan 10.000.000 butuh ijazah ahli waris).
- Tirkah bersih = 80.000.000. Ahli waris: kasus #1 (24).
- Istri 3/24 = **10.000.000**; anak lk 14/24 = **46.666.666**; anak pr 7/24 = **23.333.333**; selisih pembulatan = **1**. Σ = 80.000.000 (floor per orang ke unit=1, selisih tidak dibagikan diam-diam — lihat engine-contract Tahap 6).

## Uji Negatif (sistem harus menolak / bertanya)
- Ahli waris beda agama → dikeluarkan, tidak menghijab.
- Pembunuh pewaris → dikeluarkan.
- Status hidup ahli waris tidak jelas → tanyakan; jika hilang → bab 13.2.
- Wasiat kepada ahli waris → tandai perlu ijazah.
- Jumlah istri > 4 → validasi gagal.

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R16-1 | Kasus 5, 6, 7 ('aul 7, 27, 10) | RDH | Bab 9, muqaddimah 4 | Contoh identik di Raudhah: zawj + 2 ukht (7); Minbariyyah (27); Syuraihiyyah (10). |
| R16-2 | Kasus 12 (akdariyyah 27) | RDH | Bab 3 | «للزوج تسعة، وللأم ستة، وللأخت أربعة، وللجد ثمانية» |
| R16-3 | Kasus 15 (ayah, ibu, 2 saudara) | RDH | Bab 4, far' | «مات عن أبوين وأخوين، فللأم السدس، والباقي للأب» |
| R16-4 | Kasus 13 (musyarrakah) | RDH | Bab 1 | Rukun terpenuhi; pembagian sama rata (R07-2). |
| R16-5 | Kasus 22–23 (tashih) | RDH + KH | Bab 9, Fashl 2 | Metode tabayun/tawafuq sesuai R10-2. |
