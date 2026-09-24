---
bab: 06
judul: Hajb (Penghalangan)
tags: [hajb, hirman, nuqshan, mahjub, hajib, tabel]
---

# 06. Hajb

## 6.1 Definisi dan Pembagian [R06-1] [R06-6]
**Hajb**: terhalangnya ahli waris dari seluruh atau sebagian bagiannya karena ada ahli waris lain.

| Jenis | Keterangan |
|-------|-----------|
| **Hajb bil awshaf** (karena sifat) | Ahli waris yang terkena mani' (bab 02). Ia dianggap **tidak ada** dan **tidak menghijab siapa pun**. Berlaku pada semua ahli waris. |
| **Hajb bil asykhash** (karena orang lain) | Dibagi dua ↓ |
| → **Hajb nuqshan** | Pengurangan bagian (7 bentuk, lihat 6.3). |
| → **Hajb hirman** | Gugur total. |

**Perbedaan penting mahjub vs mamnu'**: yang terhijab (mahjub) karena orang lain **tetap bisa menghijab** orang lain secara nuqshan. Contoh: dua saudara yang terhijab oleh ayah tetap mengurangi bagian ibu dari 1/3 ke 1/6 (menurut jumhur). Yang terkena mani' tidak menghijab sama sekali.

## 6.2 Ahli Waris yang Tidak Pernah Terhijab Hirman (6) [R06-2]
**Ayah, ibu, anak lk, anak pr, suami, istri.** Sebagian dari mereka bisa terkena hajb nuqshan (6.3), tidak pernah hirman.

## 6.3 Hajb Nuqshan (7 bentuk)
1. Suami: 1/2 → 1/4 (ada far'u warits).
2. Istri: 1/4 → 1/8 (ada far'u warits).
3. Ibu: 1/3 → 1/6 (ada far'u warits atau 2+ saudara).
4. Cucu pr: 1/2 → 1/6 (bersama 1 anak pr).
5. Saudari sebapak: 1/2 → 1/6 (bersama 1 saudari kandung).
6. Ayah/kakek: ashabah → 1/6 (ada far'u warits lk).
7. Muzahamah: berkurang karena berbagi (istri-istri, nenek-nenek) dan karena 'aul.

## 6.4 Kaidah Hajb Hirman [R06-4] [R06-5] [R06-7]
1. **Yang bernasab melalui seseorang terhijab olehnya** (kecuali awlad al-umm bersama ibu).
2. **Yang lebih dekat menghijab yang lebih jauh** dalam satu jenis.
3. **Far'u warits mudzakkar** menghijab semua hawasyi.
4. **Ashl warits mudzakkar**: ayah menghijab seluruh hawasyi; kakek menghijab saudara seibu dan semua hawasyi di bawah saudara (anak saudara, paman); terhadap saudara kandung/sebapak → bab 08.
5. **Far'u warits (lk maupun pr)** menghijab saudara seibu.

## 6.5 Tabel Hajib–Mahjub [R06-3]
| Mahjub | Terhijab oleh |
|--------|--------------|
| Cucu lk | Anak lk; cucu lk yang lebih dekat |
| Kakek | Ayah; kakek yang lebih dekat |
| Nenek (semua) | Ibu |
| Nenek dari ayah | + Ayah; kakek (untuk nenek yang melalui dia) |
| Nenek jauh | Nenek dekat (lihat khilaf bab 04.8) |
| Cucu pr | Anak lk; 2+ anak pr (kecuali ada mu'ashshib); cucu lk yang lebih tinggi |
| Saudara lk kandung | Anak lk, cucu lk, ayah; (kakek → bab 08) |
| Saudari kandung | Sama seperti saudara lk kandung |
| Saudara lk sebapak | + saudara lk kandung; saudari kandung ma'al ghair |
| Saudari sebapak | + saudara lk kandung; saudari kandung ma'al ghair; 2+ saudari kandung (kecuali ada saudara lk sebapak) |
| Saudara/i seibu | Far'u warits (lk/pr); ayah; kakek |
| Anak lk saudara lk kandung | Anak lk, cucu lk, ayah, kakek, saudara lk kandung, saudara lk sebapak, saudari kandung/sebapak ma'al ghair |
| Anak lk saudara lk sebapak | + anak lk saudara lk kandung |
| Paman kandung | + anak lk saudara lk sebapak (dan semua di atasnya) |
| Paman sebapak | + paman kandung |
| Anak lk paman kandung | + paman sebapak |
| Anak lk paman sebapak | + anak lk paman kandung |
| Mu'tiq | Semua ashabah nasab |

## 6.6 Klasifikasi Ahli Waris terhadap Hajb Hirman
- **Menghijab tapi tidak terhijab**: ayah, ibu, anak lk, anak pr.
- **Terhijab tapi tidak menghijab**: saudara seibu (mereka tidak menghijab siapa pun secara hirman). 
- **Tidak menghijab & tidak terhijab hirman**: suami, istri.
- **Menghijab dan terhijab**: sisanya (cucu, kakek, saudara, dsb.).

## 6.7 Aturan Implementasi Engine
1. Keluarkan dulu yang terkena mani'.
2. Jalankan hajb hirman dengan urutan prioritas tabel 6.5 (proses dari hajib terkuat).
3. Jangan hapus ahli waris terhijab dari perhitungan hajb nuqshan ibu (jumlah saudara).
4. Tentukan furudh/ashabah bagi yang tersisa.

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R06-1 | Dua jenis hajb | RDH | Bab 4, al-Hajb | «هو نوعان: حجب نقصان - كحجب الولد الزوج من النصف إلى الربع... - وحجب حرمان» |
| R06-2 | Enam ahli waris tidak terhijab hirman | RDH | Idem | «قسم لا يتوسط بينهم وبين الميت غيرهم، وهم: الأبوان، والزوجان، والأولاد، فهؤلاء لا يحجبهم أحد» |
| R06-3 | Tabel hajib–mahjub | RDH | Idem, adh-dharb 1–3 | Daftar lengkap penghalang saudara, anak saudara, paman, dan anak paman sesuai tabel 6.5. |
| R06-4 | Saudara kandung gugur oleh ayah, anak lk, cucu lk | IJ | Dinukil ijma'-nya dalam RDH Bab 4 | «والأخ للأبوين يحجبه الأب، والابن، وابن الابن بالإجماع» |
| R06-5 | Saudara seibu gugur oleh far'u warits, ayah, kakek | RDH | Idem | «فالإخوة والأخوات للأم يحجبهم أربعة: الولد، وولد الابن، والأب، والجد» |
| R06-6 | Yang terkena mani' tidak menghijab; yang terhijab tetap bisa hajb nuqshan | RDH | Bab 4, far' | «إن كان امتناع الإرث لنقص كالرق وغيره من الموانع، فلا يحجب لا حجب حرمان، ولا حجب نقصان. وإن كان لا يرث لتقدم غيره عليه، فقد يحجب غيره حجب نقصان». Contoh: «مات عن أبوين وأخوين، فللأم السدس، والباقي للأب» |
| R06-7 | Ashabah gugur bila furudh menghabiskan harta | RDH | Bab 4 | «وكل عصبة يحجبه أصحاب الفروض المستغرقة» |
