# Riset 7b: harta sudah dibagi sebagian

Tanggal: 2026-11-25. Jenis: riset saja (tanpa perubahan kode engine/UI). Sumber hukum: hanya `docs/kb`.
Dibaca: CLAUDE.md, KB bab 00, 01, 11, 12, 17, 18, 19, `engine-contract.md` (Tahap 6), `riset-ux-input-kematian-berlapis.md`
(L3), `mockup-sudah-dibagi.html`, `kb-khi/13_butir_lain.md` (hibah, hanya informasi).

## 1. Ringkasan

1. **KB tidak punya satu pun aturan tentang keadaan "tirkah sudah dibagi sebagian".** Bab 11 hanya memuat konversi
   saham ke nominal (R11-1) dan takharuj (R11-2, R11-3). Bab 12 hanya mengenal "sebelum dibagi" (R12-1, R12-5,
   Raudhah 6/72 «قبل قسمة التركة»); tidak ada teks tentang pembagian separuh jalan. Bab 18 tidak punya kode `Kxx-y` untuknya.
2. **Saham (furudh/ashabah, ashl, tashih) tidak berubah** oleh penyerahan sebagian harta. Yang berubah hanya
   "berapa lagi yang harus diserahkan". Maka yang bisa dihitung hanya lapis nominal (Tahap 6):
   `sisa hak = bagian nominal − sudah diterima`. Ini aritmetika (setara [KH]), bukan hukum fikih baru.
3. **Yang butuh hukum** bukan hitungannya, tetapi **status** penyerahan: bagian warisan (di muka), hibah, atau
   pinjaman. Hanya yang pertama yang memakai rumus di atas. Hibah dan pinjaman punya akibat hukum lain yang
   KB tidak atur (set-off, pengembalian kelebihan, penyamaan antar anak): kembalikan `TIDAK_DIDUKUNG`.
4. Usulan lingkup 7b: **satu jenis saja, "sudah menerima sebagian dari bagian warisnya"**; sisanya ditolak dengan
   penjelasan dan tautan baca. Perlu keputusan pemilik (bagian 6) sebelum kode.

## 2. Skenario, dasar KB, klasifikasi

Klasifikasi: **HITUNG** = bisa dihitung dari KB; **TD** = `TIDAK_DIDUKUNG` (KB tidak punya dasar, jangan dikarang);
**KEP** = perlu keputusan pemilik sebelum bisa dihitung.

| # | Skenario | Dasar di KB | Klasifikasi |
|---|---|---|---|
| S1 | Sebagian tirkah sudah diserahkan ke satu/beberapa ahli waris **sebagai bagian warisannya** (uang muka/final) | Hitungan: R11-1 (nominal = saham ÷ tashih × tirkah bersih). Tirkah bersih: R01-1 (tajhiz, dain, wasiat dahulu). Kerelaan bersama: R11-2 (Raudhah 6/41). Tidak ada nash "penyerahan sebagian" | **HITUNG** (lapis nominal) + **KEP** (makna, nilai barang) |
| S2 | Satu ahli waris menerima barang/uang **sebagai ganti sahamnya lalu keluar** | R11-2, R11-3 (takharuj/shulh), bab 11.2 tiga bentuk | **HITUNG**, tetapi itu **takharuj, bukan 7b**; jalur sendiri, jangan digabung |
| S3 | Ahli waris wafat **setelah sebagian dibagi** | R12-1, R12-5 (Raudhah 6/72, `قبل القسمة`). Bab 12.5: yang diteruskan = bagian dari mayit pertama; harta pribadi, hutang, wasiat mayit kedua di luar engine. Tidak ada teks untuk "dibagi sebagian" | **KEP** + **verifikasi primer**; hitung angka tidak berubah (lihat 3.3) |
| S4 | Pewaris **menghibahkan** sebagian hartanya ke ahli waris semasa hidup (sudah qabdh) | R01-10 (hibah lazim dengan qabdh, Raudhah 5/375): keluar dari milik pewaris, **bukan tirkah**. R01-11: tabarru' di sakit maut dihitung dari sepertiga. K01-3: penyamaan antar anak. Bab 01.6: "engine tidak memodelkan hibah" | Efek ke faraidh: **tidak ada** [SYF]. Penyamaan antar anak [HNB]/[HNF]/[MLK], hibah sakit maut ke ahli waris, dan KHI 211 → **TD** (hanya informasi; KHI = panel info, tanpa hasil hitung) |
| S5 | Pewaris **meminjamkan** uang/harta ke ahli waris (piutang), atau memberi uang muka yang masih berstatus utang | Definisi tirkah (bab 01.3: «hak yang bernilai harta») dapat memuat piutang, tetapi **tanpa kode R**. Tidak ada teks tentang memotong piutang dari bagian si penghutang | Piutang sebagai aset tirkah: **KEP**. Potong otomatis dari bagian penghutang (muqashshah): **TD** |
| S6 | Setelah sebagian dibagi, **muncul ahli waris baru/status berubah** (anak terlupa/diakui, haml lahir, mafqud kembali, penerima ternyata mahjub atau terhalang mani') | Saham dihitung ulang penuh lewat pipeline (hajb, furudh/ashabah, ashl, 'aul/radd, tashih) dengan seluruh ahli waris. Prinsip pencegahan: bab 13.0 (bagian aqall, sisa **mauquf**). Tidak ada teks tentang penarikan kembali kelebihan yang sudah diterima | Hitung ulang + sisa hak: **HITUNG**. Pengembalian kelebihan / siapa menanggung kekurangan: **TD** |
| S7 | Sebagian harta dibagi, tetapi **hutang/wasiat belum lunas** atau pengguna hanya mengisi harta "yang tersisa" | R01-1, R01-4, R01-5, bab 01.5 («jika hutang ≥ tirkah, tidak ada pembagian») | **HITUNG** bila input = tirkah **awal**; risiko input salah (bagian 4.3) |
| S8 | Pembagian sebagian menurut **adat/kesepakatan tidak sesuai faraidh** (mis. rata) tanpa shulh | R11-2 hanya mengakui kesepakatan semua pihak baligh-rasyid (bab 11.2 "Syarat sistem"). Tidak ada ketentuan menilai sah/tidaknya | Tampilkan hak faraidh vs yang diterima: **HITUNG**. Menilai sah/batal: **TD** |
| S9 | Sebagian tirkah sudah dipakai untuk **tajhiz, hutang, wasiat** | Itu bukan "dibagi ke ahli waris"; sudah tahap 1 (R01-1) | Di luar 7b |

## 3. Yang bisa dihitung

### 3.1 Tahap pipeline yang terkena
Hanya **Tahap 6 (Pembagian/nominal)**, bab 00.2 langkah (i). Tahap 1–5, 'aul/radd, tashih: tidak disentuh.
Kecuali S6, di mana pengguna mengubah daftar ahli waris dan **seluruh pipeline dijalankan ulang** seperti biasa;
7b hanya menambah lapis "sudah diterima" di akhirnya. Orkestrator munasakhat (bab 12) tidak berubah (3.3).

### 3.2 Rumus (S1, S6, S7, S8)
Misal `T` = tirkah bersih **awal** (sebelum ada yang diserahkan), `n_i` = nominal ahli waris i menurut Tahap 6
(sudah dibulatkan ke bawah per `satuan`, `selisih` = T − Σ n_i), `d_i` = yang sudah diterima i (`bigint`, tidak dibulatkan).

```
sisaHak_i      = n_i − d_i                      (boleh negatif → tanda KELEBIHAN)
sisaKas        = T − Σ d_i                      (uang/harta yang masih ada untuk dibagi)
Σ sisaHak_i + selisih = sisaKas                 (assertion, bukan perkiraan)
Σ d_i ≤ T                                       (pelanggaran → PERLU_INPUT, field "sudahDiterima")
```

Contoh (bab 11.1: suami, ibu, ayah, ashl 6 = 3:1:2, T = Rp 120.000.000): n = 60 / 20 / 40 juta.
Suami sudah menerima Rp 30.000.000 → sisaHak suami 30 jt, ibu 20 jt, ayah 40 jt; sisaKas = 90 jt = 30+20+40 ✓.

Dua keadaan yang harus tampil, bukan diselesaikan:
- **Kelebihan**: d_i > n_i (mis. A menerima 70 padahal bagiannya 50). Sisa hak A negatif. Tidak ada aturan KB
  tentang siapa mengembalikan kepada siapa → tampilkan angka dan tandai "perlu disepakati/ke pengadilan"; jangan memutuskan.
- **Kekurangan kas**: Σ sisaHak positif > sisaKas (akibat kelebihan di atas): sama, tampilkan, jangan dibagi ulang diam-diam
  (selaras prinsip "tidak dibagikan diam-diam" untuk selisih pembulatan).

### 3.3 Munasakhat (S3), turunan matematis
Hasil nominal munasakhat **tidak berubah** oleh penerimaan sebagian: bagian mayit kedua dari mayit pertama
tetap `saham × pengali` dari jami'ah. Bagian yang sudah ia terima ikut menjadi hartanya, sisanya hak yang
diwarisi ahli warisnya; keduanya jatuh ke ahli warisnya dengan mas'alah kedua yang sama, sehingga totalnya sama
dengan memperlakukan seluruh sahamnya diteruskan (bab 12.3, 12.5).
Hanya **penyajian** yang berubah: siapa yang sudah memegang berapa. Ini **turunan, bukan nukilan KB**:
perlu konfirmasi pemilik dan (opsional) pengecekan Raudhah (bagian 5) sebelum dipakai.
Jangan menyamakan dengan L3 "Sudah dibagi → mayit kedua dianggap hidup": itu untuk **seluruhnya** sudah dibagi
(bukan munasakhat, R12-1/R12-5). Untuk "sebagian", KB diam.

## 4. Yang tidak boleh dihitung / catatan input

### 4.1 TIDAK_DIDUKUNG (kembalikan dengan penjelasan)
- ~~Memotong piutang pewaris dari bagian si penghutang (S5)~~: **dikoreksi setelah verifikasi (bagian 5.2)**: ada dasar
  Raudhah 6/299–301 untuk [SYF]; tetap `TIDAK_DIDUKUNG` untuk madzhab lain dan sampai rumusnya masuk KB.
- Penyamaan hibah antar anak, termasuk ukuran 2:1 [HNB] (K01-3; bab 01.6 menyatakan engine tidak memodelkan hibah).
- Hibah di sakit maut kepada ahli waris (R01-11 memuat hibah sakit maut dari sepertiga, tetapi tidak menjawab
  kasus penerimanya ahli waris; R01-5 hanya soal wasiat).
- Pengembalian kelebihan dan penanggung kekurangan kas (S6, 3.2).
- KHI 211 "dapat diperhitungkan sebagai warisan": hanya panel informasi (CLAUDE.md: bukan kalkulator).

### 4.2 Multi-madzhab
Tidak ada baris di bab 18. Aturan bab 18: titik tanpa baris sama dengan [SYF] hanya bila bab asal menyebut ijma'/jumhur,
selain itu non-[SYF] → `TIDAK_DIDUKUNG`. Argumen agar S1 **tidak** perlu overlay: rumus 3.2 hanya aritmetika
di atas hasil Tahap 6 madzhab mana pun (nol cabang fikih). Perlu persetujuan pemilik (bagian 6, butir 8). Bagian yang
**memang** fikih (status hibah/pinjaman) sudah dikecualikan dari 7b.

### 4.3 Risiko input
- Pengguna cenderung mengisi harta yang **masih tersisa**. Bila dipakai sebagai T, semua bagian mengecil dan salah.
  UI wajib bertanya **tirkah awal** dan **yang sudah diserahkan** terpisah (S7).
- Rumah yang "sudah ditempati" belum dibagi (acuan K1 di riset berlapis): jangan dianggap sudah diterima.
- Penyerahan berupa barang butuh nilai rupiah; KB tidak menetapkan nilai saat kapan (bagian 6, butir 3).

## 5. Hasil verifikasi primer ke Raudhah (2026-11-25, Shamela buku 499)
Metode: `shamela_search_pages` dibatasi buku 499, lalu halaman dibaca langsung (`shamela_get_pages_range`/`get_page`).
Kutipan di bawah dibaca dari halaman itu; **belum** dimasukkan ke KB (KB hanya diubah dengan persetujuan pemilik).

### 5.1 Ahli waris wafat setelah sebagian dibagi: **tidak ditemukan**
- Raudhah 6/72 · shamela:499/2361 (dan 6/73–74 · shamela:499/2362, 2363) hanya memuat «ثُمَّ مَاتَ أَحَدُهُمْ قَبْلَ قِسْمَةِ التَّرِكَةِ».
  Tidak ada kasus "sebagian sudah dibagi". Pencarian «قسمة بعض التركة» hanya 3 hasil (nazhar munasakhat itu, bab qismah,
  dan bagian zakat/nakhl), «اقتسموا بعض التركة» nihil.
- Kesimpulan: S3 tetap **KEP**. Turunan matematis 3.3 tidak punya nash; dasarnya hanya kaidah jami'ah (R12-2, [KH]).

### 5.2 Hutang ahli waris kepada pewaris: **ADA nash tegas** (mengubah klasifikasi S5)
Raudhah **6/299–301** (Kitab al-Washaya, *ath-tharaf al-khamis*: «فِي مَسَائِلِ الْعَيْنِ وَالدَّيْنِ») · shamela:499/2588, 2589, 2590.
Isi yang relevan:
- Hanya ada piutang pada seorang ahli waris: «بَرِئَ مَنْ عَلَيْهِ مِنْ حِصَّتِهِ، وَلَا تَتَوَقَّفُ بَرَاءَتُهُ عَلَى تَوْفِيرِ حِصَّةِ الْبَاقِينَ؛ لِأَنَّ الْمِلْكَ بِالْإِرْثِ لَا يَتَأَخَّرُ، وَالْإِنْسَانُ لَا يَسْتَحِقُّ عَلَى نَفْسِهِ شَيْئًا».
- Ada barang ('ain) **dan** piutang pada seorang ahli waris: «نَصِيبُهُ مِنْ جُمْلَةِ التَّرِكَةِ» (piutang dihitung dalam tirkah), lalu tiga keadaan:
  (1) bagiannya **sama** dengan hutangnya: mas'alah ditashih, bagiannya dibuang, barang dibagi atas saham yang lain, bagian si penghutang jatuh **qishash**;
  (2) bagiannya **lebih besar**: tirkah dibagi, hutang dikurangkan dari bagiannya, sisanya diberi dari barang;
  (3) bagiannya **lebih kecil**: bagiannya dibuang dari mas'alah, barang dibagi atas sisanya, sisa hutang ditagih darinya lalu dibagi ke ahli waris lain (rumus lengkap + contoh di 6/300–301).
- **Syarat**: ar-Rafi'i/Imam al-Haramain menahan kesimpulan itu: «هَذَا مَحْمُولٌ عَلَى مَا إِذَا رَضِيَ الْمَدِينُ بِذَلِكَ، أَوْ كَانَ جَاحِدًا، أَوْ مُعْسِرًا»; bila ia mengakui dan mampu, ahli waris lain **tidak boleh** mengambil sepihak, harus saling rela (6/299).
- Dampak: potong piutang dari bagian si penghutang **ada dasar [SYF] primer**, bersyarat. Rumusnya bukan sederhana
  (keadaan 3 memakai mas'alah yang dikurangi). Engine bisa mengimplementasikan setelah rumusnya dimasukkan ke KB.
  Status madzhab lain: belum dicek (bab 18 → non-[SYF] `TIDAK_DIDUKUNG` sampai ada baris).

### 5.3 Penerimaan di muka (ta'jil) dan nasib kelebihan: **tidak ditemukan**
- Pencarian «تعجيل الميراث», «تعجيل … التركة الوارث», «أخذ أحد الورثة شيئا من التركة قبل القسمة»: nihil di Raudhah.
  Satu pencarian («أخذ الوارث … أكثر من نصيبه») terhenti oleh pembatasan laju dan belum diulang.
- Temuan **terkait, bukan jawaban langsung**, di Kitab al-Qismah:
  - Raudhah 11/209 · shamela:499/4527: «إِذَا قُسِّمَتِ التَّرِكَةُ بَيْنَ الْوَرَثَةِ، ثُمَّ ظَهَرَ دَيْنٌ، فَإِنْ قُلْنَا: الْقِسْمَةُ إِفْرَازٌ، فَهِيَ صَحِيحَةٌ، ثُمَّ تُبَاعُ الْأَنْصِبَاءُ فِي الدَّيْنِ إِنْ لَمْ يُوَفُّوهُ».
    Mendukung S7: hutang tetap lebih dahulu walau tirkah sudah dibagi; hitung dari tirkah **awal**. Bila qismah dipandang bay', ada dua wajh (perlu kajian bila mau dimodelkan).
  - Raudhah 11/210 · shamela:499/4528: bila setelah qismah sebagian yang dibagi ternyata hak pihak lain (istihqaq), qismah batal pada bagian itu; ini analogi untuk S6, **bukan** nash tentang ahli waris baru.
- Kesimpulan: aturan pengembalian kelebihan/penanggung kekurangan kas (S6) tetap **TD**.

### 5.4 Dampak ke klasifikasi
| Skenario | Sebelum | Sesudah verifikasi |
|---|---|---|
| S3 wafat setelah sebagian | KEP + verifikasi | **KEP**, tidak ada nash (nihil) |
| S5 piutang pewaris pada ahli waris | KEP / potong = TD | Potong **ada dasar [SYF] primer** (6/299–301), bersyarat kerelaan atau penghutang menolak/pailit; butuh keputusan pemilik + masuk KB |
| S6 kelebihan/pengembalian | TD | **TD** tetap |
| S7 hutang setelah sebagian dibagi | HITUNG | **HITUNG**, kini ada dasar primer (11/209) |

## 6. Pertanyaan keputusan untuk pemilik

1. **Makna "sudah menerima".** Pilihan: (a) hanya "bagian warisan yang diserahkan di muka" (rekomendasi); (b) ditambah hibah
   dari pewaris; (c) ditambah pinjaman. Final vs uang muka: untuk hitungan **sama** (keduanya mengurangi sisa hak), beda
   hanya soal dapat ditarik atau tidak (tidak ada di KB). Apakah dua istilah itu dilebur menjadi satu isian?
2. **Hibah (S4) dan pinjaman (S5)**: hibah ditolak dengan penjelasan + tautan baca. Pinjaman: karena Raudhah 6/299–301
   mengatur potong piutang dari bagian si penghutang (bersyarat), pilih (a) tunda ke fase berikutnya dengan catatan
   (rekomendasi: rumusnya tiga keadaan, perlu bab KB baru), atau (b) masukkan ke 7b setelah rumus masuk KB dan
   ada input "penghutang setuju dipotong?".
3. **Nilai barang** (rumah, tanah, emas) yang sudah diserahkan: nilai saat diserahkan atau nilai disepakati hari ini?
   Rekomendasi: pengguna mengisi nilai rupiah yang disepakati sekarang; engine tidak menaksir.
4. **Kelebihan** (diterima > bagian): tampilkan angka dan label netral tanpa saran pengembalian? (rekomendasi: ya,
   karena KB tidak punya aturan.)
5. **Munasakhat saat sebagian dibagi** (S3): setuju hasil nominal tidak berubah dan hanya penyajian "sudah dipegang"?
   Atau ditahan `TIDAK_DIDUKUNG` sampai verifikasi 5.1 selesai?
6. **Ahli waris baru setelah sebagian dibagi** (S6): cukup "hitung ulang + sisa hak + tanda kelebihan"?
7. **Pintu UI.** Mockup `mockup-sudah-dibagi.html` hanya punya: belum (baru), belum (bertahun), sudah pernah dibagi,
   tidak tahu. **Tidak ada "sebagian"**, padahal riset L3 menyebut "sudah" atau "sebagian". Tambah pilihan kelima
   "Sebagian sudah diserahkan" yang membuka isian per ahli waris, atau cukup tautan di layar Hasil?
8. **KB**: izinkan tambah bab 11.3 "Penerimaan di muka" berjenis **[KH]** (aritmetika, bukan hukum; contoh 3.2),
   tanpa kode `Kxx-y`, sehingga setiap cabang kode punya anotasi `[R11-x]`/`[KH]` seperti aturan CLAUDE.md?
9. **Takharuj vs 7b**: setuju keduanya tetap terpisah (takharuj = pihak keluar, saham dihapus; 7b = saham tetap,
   hanya sisa hak)?

## 7. Bentuk teknis bila disetujui (sketsa, belum ada kode)
- Input tambahan: `sudahDiterima: Record<KunciAhliWaris, bigint>` (kosong = perilaku sekarang, tanpa regresi).
- Fungsi baru di Tahap 6, murni: `hitungSisaHak(nominal, sudahDiterima, tirkahBersih)` → `{ sisaHak, sisaKas, kelebihan[] }`.
  Pelanggaran `Σ sudahDiterima > tirkahBersih` → `PERLU_INPUT`; identitas `Σ sisaHak + selisih = sisaKas` sebagai assertion.
- Jejak: `LangkahJejak` baru (data), narasi lewat `pnpm diksi:tambah`; `packages/explain` menyebut kelebihan dan kekurangan kas.
- Uji: contoh 3.2 sebagai regression; property test untuk identitas di atas; uji negatif untuk kelebihan dan `Σ > T`.
- Tidak menyentuh `packages/math` maupun Tahap 1–5.
