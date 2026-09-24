---
bab: 03
judul: Daftar dan Klasifikasi Ahli Waris
tags: [ahli waris, laki-laki, perempuan, furudh, ashabah, klasifikasi]
---

# 03. Daftar dan Klasifikasi Ahli Waris

## 3.1 Ahli Waris Laki-laki (15, dirinci) [R03-1] [R03-2]
| No | Ahli waris | Kode sistem |
|----|-----------|-------------|
| 1 | Anak laki-laki (ibn) | IBN |
| 2 | Cucu laki-laki dari anak laki-laki, dan seterusnya ke bawah melalui laki-laki (ibn al-ibn) | IBN_IBN |
| 3 | Ayah (ab) | AB |
| 4 | Kakek dari ayah, dan seterusnya ke atas melalui laki-laki (jadd shahih) | JADD |
| 5 | Saudara laki-laki kandung (akh syaqiq) | AKH_SYQ |
| 6 | Saudara laki-laki sebapak (akh li ab) | AKH_AB |
| 7 | Saudara laki-laki seibu (akh li umm) | AKH_UMM |
| 8 | Anak laki-laki saudara laki-laki kandung (ibn akh syaqiq) | IBN_AKH_SYQ |
| 9 | Anak laki-laki saudara laki-laki sebapak (ibn akh li ab) | IBN_AKH_AB |
| 10 | Paman kandung (saudara kandung ayah) ('amm syaqiq) | AMM_SYQ |
| 11 | Paman sebapak ('amm li ab) | AMM_AB |
| 12 | Anak laki-laki paman kandung (ibn 'amm syaqiq) | IBN_AMM_SYQ |
| 13 | Anak laki-laki paman sebapak (ibn 'amm li ab) | IBN_AMM_AB |
| 14 | Suami (zawj) | ZAWJ |
| 15 | Laki-laki yang memerdekakan (mu'tiq) | MUTIQ |

Ringkasan global: 10 (anak, cucu lk, ayah, kakek, saudara lk, anak saudara lk selain seibu, paman selain seibu, anak paman, suami, mu'tiq).
Catatan: paman dan anak paman mencakup juga paman ayah, paman kakek, dan seterusnya (bab ashabah).

## 3.2 Ahli Waris Perempuan (10, dirinci) [R03-1] [R03-4] [R03-5]
| No | Ahli waris | Kode |
|----|-----------|------|
| 1 | Anak perempuan (bint) | BINT |
| 2 | Cucu perempuan dari anak laki-laki, dan seterusnya melalui laki-laki (bint al-ibn) | BINT_IBN |
| 3 | Ibu (umm) | UMM |
| 4 | Nenek dari pihak ibu (umm al-umm, dst. melalui perempuan murni) | JADDAH_UMM |
| 5 | Nenek dari pihak ayah (umm al-ab, dst.) | JADDAH_AB |
| 6 | Saudara perempuan kandung (ukht syaqiqah) | UKHT_SYQ |
| 7 | Saudara perempuan sebapak (ukht li ab) | UKHT_AB |
| 8 | Saudara perempuan seibu (ukht li umm) | UKHT_UMM |
| 9 | Istri (zawjah) | ZAWJAH |
| 10 | Perempuan yang memerdekakan (mu'tiqah) | MUTIQAH |

Ringkasan global: 7 (anak pr, cucu pr, ibu, nenek, saudari, istri, mu'tiqah).

> **KHILAF – Nenek dari ayah yang lebih tinggi (umm abil jadd)**
> - **[SYF] (default)**, sejalan dengan Hanafi dan [UTS]: setiap nenek yang bernasab melalui ahli waris (**mudliyah bi warits**) adalah ahli waris, berapa pun tingginya (pilihan Ibnu Taimiyah juga sejalan dengan ini).
> - **Masyhur Hanabilah**: hanya mewarisi 3 nenek: ummul umm, ummul ab, ummul jadd (dan yang di atas mereka melalui perempuan murni). Nenek melalui ayah di atas kakek (umm abil jadd) dianggap dzawil arham.
> - **Nenek fasidah (disepakati bukan ahli waris furudh)**: nenek yang di antara dia dan mayit ada laki-laki diapit dua perempuan, contoh *umm abil umm* (ibunya kakek dari ibu) → dzawil arham.

## 3.3 Jika semua ahli waris ada sekaligus [R03-3]
- **Semua laki-laki ada** → yang mewarisi hanya 3: **ayah, anak laki-laki, suami**.
- **Semua perempuan ada** → yang mewarisi hanya 5: **anak pr, cucu pr dari anak lk, ibu, saudari kandung, istri**.
- **Semua laki-laki dan perempuan ada** (kecuali salah satu pasangan tentu saja) → yang mewarisi 5: **ayah, ibu, anak lk, anak pr, salah satu suami/istri**.

Ini adalah **kasus uji regresi** yang baik untuk engine hajb.

## 3.4 Klasifikasi Berdasarkan Cara Mewarisi [R03-6]
| Kategori | Ahli waris |
|----------|-----------|
| **Furudh saja** | Suami, istri, ibu, nenek, saudara/saudari seibu |
| **Ashabah saja** | Anak lk, cucu lk, saudara lk kandung/sebapak, anak lk saudara kandung/sebapak, paman kandung/sebapak, anak lk paman, mu'tiq/mu'tiqah |
| **Furudh atau ashabah, bisa gabung keduanya** | Ayah, kakek |
| **Furudh atau ashabah, tapi tidak gabung** | Anak pr, cucu pr, saudari kandung, saudari sebapak (ashabah bil ghair atau ma'al ghair) |

## 3.5 Kaidah Kunci [R03-7] [R14-4]
- Semua ahli waris laki-laki bisa mewarisi secara ashabah, **kecuali** suami dan saudara seibu (keduanya murni furudh).
- Perempuan mewarisi secara ashabah bi nafsiha **hanya** mu'tiqah.
- Siapa pun di luar 25 di atas (setelah dirinci) = **dzawil arham** (bab 14), misalnya cucu dari anak perempuan, paman dari ibu (khal), bibi, anak saudari.

---

## Dasar dan Rujukan Bab Ini
Kode: **[Q]** Al-Qur'an · **[H]** Hadits · **[A]** Atsar sahabat · **[IJ]** Ijma' (beserta penukilnya) · **[RDH]** Raudhah ath-Thalibin, an-Nawawi, Kitab al-Fara'idh (kutipan tanpa harakat) · **[KH]** Kaidah hisab operasional (bukan hukum syar'i). Daftar lengkap sumber: file `17_daftar_rujukan.md`.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R03-1 | 15 ahli waris laki-laki, 10 perempuan | RDH | Bab 1, Fashl al-Mujma' 'ala Tauritsihim | «الرجال الوارثون خمسة عشر... والنساء الوارثات عشر» |
| R03-2 | Paman mencakup paman ayah dan kakek | RDH | Idem | «ويدخل في لفظ العم عم الميت، وعم أبيه، وعم جده إلى حيث ينتهي... بخلاف الأخ، فإن المراد به أخو الميت فقط» |
| R03-3 | Jika semua ahli waris berkumpul | RDH | Idem, far' | «إذا اجتمع الرجال الوارثون ورث منهم الابن، والأب، والزوج فقط. وإذا اجتمع النساء، فالبنت، وبنت الابن، والأم، والزوجة، والأخت للأبوين. وإذا اجتمع الصنفان... ورث خمسة: الأبوان، والابن، والبنت، وأحد الزوجين» |
| R03-4 | Nenek di atas kakek mewarisi | RDH | Bab 1, Fashl al-Jaddah | «وفي أم أب الأب، وأم من فوقه من الأجداد وأمهاتهن قولان. المشهور: أنهن وارثات» |
| R03-5 | Nenek fasidah bukan ahli waris | RDH | Idem | «وأما الجدة المدلية بذكر بين أنثيين، كأم أبي الأم فلا ترث، بل هي من ذوي الأرحام» |
| R03-6 | Klasifikasi furudh/ashabah | RDH | Bab 1, Fashl Bayan ma Yastahiqquhu | «منهم من لا يرث إلا بالفرضية، وهم: الزوجان، والأم، والجدة، وولد الأم... ومنهم من يرث بهما جمعا وانفرادا، وهما: الأب، والجد» |
| R03-7 | Hanya saudara seibu, laki-laki yang bernasab lewat perempuan dan mewarisi | RDH | Bab 1, qultu Nawawi | «وليس في الورثة ذكر يدلي بأنثى فيرث إلا الأخ للأم» |
