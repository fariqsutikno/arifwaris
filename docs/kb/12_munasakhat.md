---
bab: 12
judul: Munasakhat (Kematian Berantai)
tags: [munasakhat, jamiah, kematian berantai, mayit kedua]
---

# 12. Munasakhat

## 12.1 Definisi [R12-1]
Seorang ahli waris wafat **sebelum** tirkah mayit pertama dibagi, sehingga bagiannya berpindah ke ahli warisnya sendiri.

## 12.2 Tiga Keadaan [R12-2]

Kaidah pembeda (dari Lahim, hal. 72): *Apakah ahli waris mayit kedua **terbatas pada** ahli waris mayit pertama, **dan** bagian mereka **tidak berbeda** (nisbah bagian mereka satu sama lain sama antara mas'alah 1 dan mas'alah 2)?*

---

### Keadaan 1 — Komposisi sama, bagian tidak berbeda

**Kondisi**: ahli waris mayit kedua adalah **seluruh** ahli waris mayit pertama, **dan** bagian mereka tidak berbeda (nisbah antar-mereka identik di kedua mas'alah).

**Teknik**: anggap mayit kedua tidak pernah ada; bagi harta langsung ke ahli waris yang hidup saat pembagian. Tidak perlu prosedur jami'ah/KPK.

Sub-bentuk (4): ta'shib saja / ta'shib yang tadinya fardh lalu berubah / fardh + ta'shib / fardh saja. Untuk sub-bentuk "fardh saja": mas'alah mayit pertama harus 'aul dengan nilai yang sama persis dengan bagian mayit kedua — syarat ini *ghairu muththarid* (tidak selalu berlaku), ada kasus pengecualian di contoh soal.

Contoh: mayit meninggalkan 4 anak lk, lalu salah satunya wafat tanpa ahli waris selain 3 saudaranya → harta dibagi 3 anak lk langsung.

---

### Keadaan 2 — Dua mayit, ahli waris sepenuhnya disjoint

**Kondisi**: ahli waris masing-masing mayit **sama sekali tidak** mewarisi dari yang lain (fully disjoint) — khusus kasus **hanya 2 mayit**.

**Teknik**: metode jami'ah (7 langkah, sama dengan Keadaan 3).

---

### Keadaan 3 — Kombinasi/campuran

**Kondisi** (salah satu dari):
- Ahli waris mayit kedua adalah **sebagian** ahli waris mayit pertama, tapi bagian mereka **berbeda**; atau
- Ahli waris mayit kedua = sebagian ahli waris mayit pertama **ditambah** orang lain di luar itu; atau
- Ada **mayit ketiga** dalam mas'alah yang tidak mewarisi dari mayit pertama.

**Teknik**: metode jami'ah (sama dengan Keadaan 2).

> **Catatan desain**: Keadaan 2 dan 3 secara teknik hisab **identik** — keduanya memakai metode jami'ah 7 langkah yang sama. Perbedaannya hanya pada kondisi pemicu/kaidah pembeda di awal (routing). Field `keadaan` di kode sebaiknya punya 3 nilai (`keadaan_1`, `keadaan_2`, `keadaan_3`) untuk telusur-balik ke KB, walau modul hisab keadaan 2 & 3 boleh berbagi fungsi yang sama.

---

### Metode Jami'ah (Keadaan 2 & 3) [R12-2] [KH]

1. Buat **mas'alah 1** (mayit pertama), tashih jika perlu.
2. Buat **mas'alah 2** (mayit kedua) dengan ahli warisnya, tashih jika perlu.
3. Bandingkan **saham mayit kedua di mas'alah 1** dengan **mas'alah 2** (nisab arba'):
   | Relasi | Jami'ah | Pengali mas'alah 1 | Pengali mas'alah 2 |
   |-------|---------|-------------------|-------------------|
   | Tamatsul (identik) | = mas'alah 1 | 1 | saham ÷ mas'alah 2 |
   | Tadakhul / habis dibagi | = mas'alah 1 | 1 | saham ÷ mas'alah 2 |
   | Tawafuq | mas'alah 1 × wafq mas'alah 2 | wafq mas'alah 2 | wafq saham |
   | Tabayun | mas'alah 1 × mas'alah 2 | mas'alah 2 | saham |
4. Bagian ahli waris mayit pertama = saham × pengali mas'alah 1.
5. Bagian ahli waris mayit kedua = saham × pengali mas'alah 2.
6. Yang mewarisi dari keduanya → jumlahkan.
7. Jika ada mayit ketiga (Keadaan 3): jami'ah yang baru didapat jadi "mas'alah 1" baru, ulangi dari langkah 2.

## 12.3 Contoh
Mayit 1: suami, ibu, saudara lk kandung → ashl 6: suami 3, ibu 2, saudara 1.
Sebelum dibagi, **suami** wafat meninggalkan: anak lk dan anak pr (dari istri lain).
- Mas'alah 2: ashabah 2:1 → 3.
- Saham suami di mas'alah 1 = 3; mas'alah 2 = 3 → habis dibagi → jami'ah = 6.
- Hasil: ibu 2, saudara 1, anak lk 2, anak pr 1.

Mayit 1: istri, anak lk, anak pr → ashl 8: istri 1, sisa 7 dibagi 3 ru'us → tabayun → tashih 24: istri 3, anak lk 14, anak pr 7.
Anak pr wafat meninggalkan ibu (istri tadi) dan saudara lk (anak lk tadi).
- Mas'alah 2: ibu 1/3, saudara sisa → 3: ibu 1, saudara 2.
- Saham anak pr = 7; mas'alah 2 = 3 → tabayun → jami'ah 24 × 3 = **72**.
- Istri: 3×3 + 1×7 = **16**; anak lk: 14×3 + 2×7 = **56**. Σ = 72 ✓.

## 12.4 Aturan Engine
- Proses mayit berurutan sesuai **waktu wafat**.
- Setiap mas'alah melewati pipeline lengkap (mani', hajb, furudh, 'aul/radd, tashih).
- Ahli waris yang wafat sebelum mayit pertama bukan ahli waris sama sekali (bukan munasakhat).
- Jika urutan wafat tidak diketahui → bab 13 (gharqa).

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R12-1 | Definisi dan kedudukan munasakhat | RDH | Bab 9, Fashl 2, nazhar 2 | «التصحيح إذا مات وارثان فأكثر قبل القسمة، وتعرف: بالمناسخات» |
| R12-2 | Kaidah 3 keadaan + teknik jami'ah | KH + Lahim | Kaidah hisab (RDH Bab 9); Lahim hal. 72 & 91 | Lahim hal. 72: kaidah pembeda 3 keadaan. Hal. 91 (Bab Kelima "Shifatul 'Amal"): algoritma per keadaan. Keadaan 2 & 3 berbagi metode jami'ah (nisab arba', R10-1); Keadaan 1 tidak butuh jami'ah. |
