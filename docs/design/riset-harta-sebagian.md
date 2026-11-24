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
- Memotong piutang pewaris dari bagian si penghutang (S5).
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

## 5. Verifikasi primer yang disarankan (opsional, sebelum membuka S3, S5)
KB 00 konvensi 2 mewajibkan titik tanpa rujukan tegas ditandai; tiga pertanyaan belum punya nukilan:
1. Raudhah/Fara'idh: ahli waris yang wafat setelah **sebagian** tirkah dibagi (cari di sekitar 6/64–6/72).
2. Hutang ahli waris kepada pewaris (muqashshah dengan bagiannya) dan piutang sebagai bagian tirkah.
3. Penerimaan di muka (ta'jil) dari bagian waris dan nasib kelebihannya.
Hasil dimasukkan ke bab 11 sebagai baris `R11-x` jenis RDH bila ada; bila nihil, tulis "tidak ditemukan".
Per memori proyek, verifikasi MCP boleh dikerjakan langsung.

## 6. Pertanyaan keputusan untuk pemilik

1. **Makna "sudah menerima".** Pilihan: (a) hanya "bagian warisan yang diserahkan di muka" (rekomendasi); (b) ditambah hibah
   dari pewaris; (c) ditambah pinjaman. Final vs uang muka: untuk hitungan **sama** (keduanya mengurangi sisa hak), beda
   hanya soal dapat ditarik atau tidak (tidak ada di KB). Apakah dua istilah itu dilebur menjadi satu isian?
2. **Hibah (S4) dan pinjaman (S5)**: ditolak dengan penjelasan + tautan baca (rekomendasi), atau pinjaman boleh masuk
   tirkah sebagai piutang tanpa potong otomatis (perlu verifikasi 5.2)?
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
