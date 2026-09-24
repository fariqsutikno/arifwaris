---
bab: 10
judul: Tashih (Koreksi Pembagian)
tags: [tashih, inkisar, nisab arba, tamatsul, tadakhul, tawafuq, tabayun, juz sahm]
---

# 10. Tashih

## 10.1 Definisi
**Tashih**: mencari bilangan terkecil yang darinya bagian setiap individu ahli waris keluar sebagai bilangan bulat, ketika saham suatu kelompok tidak habis dibagi jumlah anggotanya (**inkisar**).

## 10.2 Nisab Arba' (Empat Relasi Antar Bilangan) [R10-1] [R10-4]
| Relasi | Definisi | Contoh | Hasil gabung |
|-------|---------|--------|-------------|
| **Tamatsul** | Sama | 3 & 3 | Ambil salah satu |
| **Tadakhul** | Yang kecil habis membagi yang besar | 3 & 6 | Ambil yang besar |
| **Tawafuq** | Tidak habis, tapi punya FPB > 1 | 4 & 6 (FPB 2) | Kalikan salah satu dengan **wafq** yang lain (6 × 4/2 = 12) |
| **Tabayun** | FPB = 1 | 3 & 4 | Kalikan keduanya (12) |

**Wafq** = bilangan ÷ FPB. Secara komputasi: hasil gabung = **KPK**.

**Kaidah angka 1** [R10-5]: «كل عدد مع الواحد فهو متباين» — setiap angka bertemu 1 = **tabayun**, bukan tadakhul,
walau 1 selalu habis membagi angka lain. Berlaku sebelum pengecekan tadakhul (mis. contoh 10.3c: istri
1 vs 4 ru'us → tabayun, bukan tadakhul).

## 10.3 Langkah Tashih [R10-2] [R10-3]
1. Selesaikan ashl (termasuk 'aul bila ada).
2. Untuk setiap kelompok yang **inkisar**, bandingkan **saham kelompok** dengan **jumlah kepala** (ru'us):
   - **Tawafuq** → simpan **wafq ru'us** (ru'us ÷ FPB).
   - **Tabayun** → simpan **seluruh ru'us**.
3. **Inkisar pada satu kelompok**: bilangan yang disimpan = **juz' as-sahm** (pengali).
4. **Inkisar pada 2–4 kelompok**: bandingkan bilangan-bilangan simpanan satu sama lain dengan nisab arba' → hasil gabung (KPK) = **juz' as-sahm**.
   - Tamatsul → ambil salah satu.
   - Tadakhul → ambil yang terbesar.
   - Tawafuq → kalikan wafq salah satu dengan yang lain.
   - Tabayun → kalikan semuanya.
5. **Tashih** = ashl (atau 'aulnya) × juz' as-sahm.
6. Bagian tiap kelompok = saham di ashl × juz' as-sahm; bagian individu = bagian kelompok ÷ ru'us.

Inkisar tidak mungkin terjadi pada lebih dari **4 kelompok** (menurut istiqra').

## 10.4 Contoh
**(a) Satu kelompok, tabayun**: istri, 3 saudara lk kandung.
Ashl 4: istri 1, saudara 3 → 3 ÷ 3 habis. Tidak perlu tashih.
Ubah: istri, 2 saudara lk: saudara 3 vs 2 → tabayun → juz' 2 → tashih 8: istri 2, saudara 6 (masing-masing 3).

**(b) Satu kelompok, tawafuq**: ibu, 4 paman.
Ashl 3: ibu 1, paman 2. 2 vs 4 → tawafuq (FPB 2) → wafq ru'us = 2 → tashih 6: ibu 2, paman 4 (masing-masing 1).

**(c) Satu kelompok, tabayun (istri)**: 4 istri, 3 saudara lk kandung.
Ashl 4: istri 1, saudara 3. Istri: 1 vs 4 → tabayun → simpan 4. Saudara: 3 vs 3 → habis → tidak disimpan.
Juz' = 4 → tashih 16: istri 4 (masing-masing 1), saudara 12 (masing-masing 4).

**(d) Dua kelompok, tabayun antar simpanan**: 2 nenek, 3 saudara lk sebapak.
Ashl 6: nenek 1, saudara 5. Nenek 1 vs 2 → simpan 2. Saudara 5 vs 3 → simpan 3. 2 vs 3 tabayun → juz' 6 → tashih 36: nenek 6 (masing-masing 3), saudara 30 (masing-masing 10).

## 10.5 Validasi Engine
- Σ bagian individu = tashih (atau ashl bila tidak ada tashih).
- Semua bagian bilangan bulat.
- Rasio 2:1 terjaga pada kelompok ashabah bil ghair (hitung ru'us: lk = 2, pr = 1).

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R10-1 | Nisab arba' | RDH | Bab 9, muqaddimah 2 | «كل عددين فهما متماثلان، أو متداخلان، أو متوافقان، أو متباينان» |
| R10-2 | Tashih satu kelompok | RDH | Bab 9, Fashl 2 | «إن كانا متباينين، ضربت عدد رءوسهم في أصل المسألة بعولها إن عالت. وإن كانا متوافقين، ضربت جزء الوفق من عدد رءوسهم» |
| R10-3 | Inkisar maksimal 4 kelompok, beserta alasannya | RDH | Idem | «ولا تتصور الزيادة؛ لأن الوارثين في الفريضة لا يزيدون على خمسة أصناف... ولا بد من صحة نصيب أحد الأصناف عليه» |
| R10-4 | Perhitungan KPK/FPB | KH | Kaidah hisab | Setara dengan metode klasik; bukan hukum syar'i. |
| R10-5 | Kaidah angka 1 = tabayun | KH | Kaidah hisab | «كل عدد مع الواحد فهو متباين» — didahulukan atas pengecekan tadakhul. |
