# Panduan Tim Keilmuan

Panduan menyusun dan mereview konten aplikasi waris. Untuk ustadz, reviewer syariah, dan penulis materi.
Tidak perlu bisa coding.

**Cara setor:** kirim berkas `.md` (atau teks biasa untuk konten di bagian 10) ke Fariq. Fariq yang memasukkan
ke repo dan menjalankan pengecekan otomatis. Kalau pengecekan gagal (misalnya angka contoh tidak cocok dengan
hitungan aplikasi), berkas dikembalikan beserta alasannya.

---

## Daftar isi

1. Aturan main
2. Menulis dengan kode rujukan dan istilah
3. Gaya bahasa
4. Materi (pelajaran)
5. Kuis
6. Soal hitung
7. FAQ
8. Glosarium
9. Rujukan: syahid ayat dan sumber kitab
10. Teks aplikasi: tanya jawab, habis ini ngapain, label, dan lain-lain
11. Penjelasan langkah hitung
12. Menyunting KB (sumber hukum)
13. Alur review
14. Checklist sebelum setor
15. Lampiran: kunci ahli waris

---

## 1. Aturan main

1. **Sumber hukum hanya knowledge base (KB)** di `docs/kb/` bab 00–17. Konten hanya menjelaskan ulang KB dengan
   bahasa yang lebih mudah. Kalau ingin menulis hukum yang belum ada di KB, usulkan dulu penambahan KB (lihat bagian 12).
2. **Madzhab Syafi'i saja.** Pendapat lain boleh disebut sebagai perbandingan, dan harus ditulis jelas bahwa itu
   bukan pendapat yang dipakai aplikasi.
3. **Setiap klaim hukum wajib punya kode rujukan** `[Rxx-y]` (lihat bagian 2).
4. **Jangan mengarang.** Hal yang di KB berstatus *perlu verifikasi lanjut* (bab 17.4) tidak dijawab isinya.
   Tulis saja bahwa hal itu masih dikaji, lalu arahkan pembaca bertanya ke ahli. Titik yang masih tertahan saat ini:
   - batas masa kehamilan, laqith (anak temuan), ijazah wasiat, takharuj
   - rincian haml (janin) dan mafqud (orang hilang) menurut madzhab Syafi'i
5. **KHI (Kompilasi Hukum Islam)** dipisah dari fikih. Kalau disebut, tandai "hukum positif, bukan fikih Syafi'i".
6. **Angka contoh harus benar.** Contoh yang bisa dihitung aplikasi dicek otomatis (lihat blok `kasus`, bagian 4).

---

## 2. Menulis dengan kode rujukan dan istilah

### Kode rujukan `[Rxx-y]`

Tiap bab KB punya tabel **"Dasar dan Rujukan Bab Ini"** di bagian akhir. Kodenya berbentuk `R` + nomor bab +
nomor urut, misalnya `R04-2` = bab 4, rujukan ke-2 (bagian suami dan istri). Di aplikasi, kode ini tampil sebagai
tautan "dalil" yang membuka ayat, hadits, atau kutipan kitabnya.

```
Suami mendapat 1/2 bila istri yang wafat tidak punya anak [R04-2].
```

Satu kalimat boleh punya lebih dari satu kode: `[R04-4] [R04-5]`. Kodenya harus ada di KB; kode yang tidak ada
akan ditolak pengecekan otomatis.

### Istilah glosarium `[[...]]`

Istilah fikih ditulis dengan kurung siku ganda supaya tampil sebagai tooltip berisi arti awam dari glosarium
(bab 15).

```
Ia mendapat bagian [[fardh]].
Ia mendapat [[fardh|bagian pasti]].        ← teks yang tampil: "bagian pasti"
```

Bagian kiri adalah id istilah. Kalau ragu id-nya, tulis saja istilahnya dan beri catatan; Fariq yang mencocokkan.
Istilah yang belum ada di glosarium perlu diusulkan dulu (lihat bagian 12).

---

## 3. Gaya bahasa

- **Pembaca utama adalah orang awam**: keluarga yang sedang membagi warisan. Anggap mereka belum pernah belajar faraidh.
- Kalimat pendek. Satu paragraf, satu gagasan.
- Istilah Arab boleh dipakai, tapi jelaskan saat pertama muncul, atau pakai `[[istilah|kata sehari-hari]]`.
- Transliterasi mengikuti glosarium bab 15 (`ashabah`, `'aul`, `far'u warits`), jangan membuat ejaan sendiri.
- Sebut orang dengan hubungannya: "kakak/adik perempuan satu ayah", bukan hanya "ukht li ab".
- Contoh angka pakai harta **Rp 120.000.000** supaya mudah dibagi 6, 8, 12, dan 24.
- Hindari nada menggurui atau menakut-nakuti. Cukup jelaskan hukumnya dan alasannya.

---

## 4. Materi (pelajaran)

Lokasi: `docs/materi/`. Daftar modul ada di `docs/materi/00-modul.md`.

**Satu berkas = satu pelajaran.** Nama berkas: `<modul>-<urutan>-<slug>.md`, contoh `3-1-enam-bagian-pasti.md`.
Slug ditulis dengan huruf kecil dan tanda hubung.

### Kepala berkas (wajib)

```
---
judul: Enam bagian pasti, dan bagian suami-istri
modul: 3
urutan: 1
tujuan: Mengenal enam fardh dalam Al-Qur'an dan menghitung bagian suami atau istri.
perluCek: true
---
```

- `tujuan`: satu kalimat, apa yang bisa dilakukan pembaca setelah membaca.
- `perluCek`: `true` untuk draf; diubah ke `false` hanya oleh reviewer (bagian 13).

### Format yang boleh dipakai

| Tulis | Hasil |
|---|---|
| `## Judul`, `### Subjudul` | Judul bagian |
| paragraf biasa | Paragraf |
| `- butir` atau `1. butir` | Daftar |
| `> catatan` | Kotak catatan |
| tabel Markdown | Tabel |
| `**tebal**`, `*miring*` | Penekanan |
| `[[istilah]]`, `[Rxx-y]` | Tooltip istilah, tautan dalil |

Selain itu (gambar, tautan web, HTML) belum didukung. Kalau butuh, sampaikan ke Fariq.

### Blok contoh yang dihitung aplikasi

````
```kasus
pewaris: L
ahli waris: ISTRI, 2 ANAK_PR, AYAH
harta: 120.000.000
harapan: ISTRI 3, ANAK_PR 16, AYAH 5; ashl 24
```
````

- `pewaris`: `L` (laki-laki) atau `P` (perempuan).
- `ahli waris`: kunci ahli waris (lampiran, bagian 15). Angka di depan = jumlah orang: `2 ANAK_PR` = dua anak perempuan.
- `harapan`: jawaban yang kamu harapkan. Isinya **saham per jenis ahli waris** (jumlah untuk semua orang sejenis)
  dan **ashl akhir** (setelah 'aul, radd, atau tashih). Ahli waris yang tidak mendapat bagian tidak ditulis.
  Baris ini tidak ditampilkan ke pembaca. Aplikasi menghitung ulang dan menolak kalau hasilnya berbeda.
- Angka di teks pelajaran harus sama dengan `harapan`.

Di aplikasi, blok ini tampil sebagai kartu contoh yang bisa dibuka di kalkulator.

### Blok video

````
```video
https://www.youtube.com/watch?v=XXXXXXXXXXX
judul: Judul video
```
````

Pakai hanya video dari sumber yang isinya sesuai madzhab Syafi'i dan sudah ditonton reviewer.

### Blok cek pemahaman

````
```kuis
K-06, K-07
```
````

Memanggil soal dari bank kuis (bagian 5) berdasarkan kodenya.

### Susunan pelajaran yang disarankan

1. Masalahnya apa (satu paragraf pembuka)
2. Aturannya, lengkap dengan kode rujukan (tabel sangat membantu)
3. Contoh `kasus`
4. Cek pemahaman `kuis`

### Menambah modul

Daftar modul ada di tabel `docs/materi/00-modul.md` (No, Judul, Ringkas). Pelajaran dengan `modul: 11` baru
muncul kalau modul 11 sudah ada di tabel itu. Untuk modul baru, kirim baris tabelnya bersama pelajaran pertamanya.

Panjang ideal 300–700 kata. Kalau lebih panjang, pecah jadi dua pelajaran.

---

## 5. Kuis

Lokasi: `docs/soal/kuis.md`. Kuis adalah soal pilihan ganda untuk menguji konsep.

```
## K-12
bab: 4
pertanyaan: Kapan istri mendapat 1/8?
- [ ] Bila suami tidak punya anak
- [x] Bila suami punya anak atau cucu dari anak laki-laki
- [ ] Bila istrinya lebih dari satu
- [ ] Bila ada ayah
pembahasan: Istri mendapat 1/8 bila ada [[faru-warits|far'u warits]] [R04-2]. Jumlah istri tidak mengubah besar bagian; mereka berbagi rata [R04-3].
```

- Kode `K-nn` diurutkan dan tidak boleh dipakai ulang. Ambil nomor berikutnya setelah yang terakhir.
- `bab`: nomor bab KB yang diuji.
- `- [x]` menandai jawaban benar, **tepat satu**. Yang lain `- [ ]`.
- Pilihan salah sebaiknya kesalahan yang memang sering terjadi, bukan jawaban yang jelas ngawur.
- `pembahasan` wajib menjelaskan kenapa jawaban benar, dan wajib punya kode rujukan.

---

## 6. Soal hitung

Lokasi: `docs/soal/hitung.md`. Soal kasus yang dikerjakan pembaca di kalkulator mode Belajar. Jawaban
disembunyikan sampai pembaca membukanya.

Ditulis sebagai satu baris tabel:

| Kode | Bab | Tingkat | Judul | Pewaris | Ahli waris | Harapan | Topik | Sumber |
|---|---|---|---|---|---|---|---|---|
| H-24 | 9 | dasar | Suami, dua saudari kandung | P | SUAMI, 2 SAUDARI_KANDUNG | SUAMI 3, SAUDARI_KANDUNG 4; ashl 7 | 'Aul | KB 16 #5 |

- `Tingkat`: `dasar`, `menengah`, atau `sulit`.
- `Judul`: daftar ahli warisnya dalam bahasa sehari-hari. Jangan membocorkan jawaban atau topiknya.
- `Ahli waris` dan `Harapan`: format sama dengan blok `kasus` (bagian 4). Harta selalu Rp 120.000.000.
- `Topik`: konsep yang dilatih. Baru ditampilkan setelah soal dikerjakan.
- `Sumber`: asal kasus, misalnya `KB 16 #5` (kasus uji bab 16) atau nama kitab dan halamannya.
- Kasus yang belum bisa dibentuk di kalkulator (cicit, dzawil arham, kasus khusus bab 13) belum bisa dijadikan soal.

---

## 7. FAQ

Lokasi: `docs/faq.md`.

```
## Fikih

### Apakah anak angkat mendapat warisan?
Tidak lewat jalur waris. Sebab mewarisi hanya empat ... [R02-1].
```

- `##` = kelompok (misalnya *Fikih*, *Aplikasi*), `###` = pertanyaan, di bawahnya jawaban.
- Format jawaban sama dengan materi (bagian 4).
- Jawaban kelompok **Fikih** wajib punya kode rujukan.
- Pertanyaan yang belum dibahas KB tetap boleh dimasukkan, tapi jawabannya hanya: "belum dibahas di aplikasi
  ini, tanyakan ke ustadz atau lembaga yang berwenang".
- Tulis pertanyaan seperti orang awam bertanya, bukan seperti judul bab.

---

## 8. Glosarium

Lokasi: tabel di `docs/kb/15_glosarium.md` (bagian dari KB). Dipakai untuk halaman Glosarium, tooltip `[[...]]`
di materi/kuis/FAQ, dan tooltip di penjelasan langkah hitung.

| Istilah | Arab | Makna | Arti awam | Contoh |
|---|---|---|---|---|
| 'Aul | العول | ... | Semua bagian dikurangi seimbang karena jumlahnya melebihi harta. | Kasus 16.5 (suami, 2 saudari kandung): ... |

- **Istilah**: transliterasi baku. Sinonim dipisah garis miring: `Ta'shib / 'Ashabah`. Tiap nama (termasuk
  sinonim) hanya boleh muncul sekali di seluruh tabel.
- **Id** untuk `[[...]]` dibuat otomatis dari istilah pertama: huruf kecil, tanpa apostrof, spasi jadi tanda
  hubung. Contoh: `Far'u warits` → `faru-warits`, `'Aul` → `aul`, sinonim `'Ashabah` → `ashabah`.
  **Mengganti ejaan istilah berarti mengganti id-nya**, dan semua `[[...]]` yang memakai id lama akan ditolak.
  Jadi kalau mengoreksi ejaan, kabari Fariq supaya pemakaiannya ikut diganti.
- **Makna**: definisi fikih (bahasa teknis boleh).
- **Arti awam**: satu atau dua kalimat bahasa sehari-hari untuk tooltip. Hanya memparafrasekan kolom Makna,
  tidak menambah hukum.
- **Contoh**: boleh kosong. Kalau diisi, **wajib menyebut kasus uji bab 16** dalam bentuk `Kasus 16.<nomor>`
  (misalnya `Kasus 16.5`), supaya contohnya sudah pasti benar.
- Istilah yang dipakai di penjelasan langkah hitung sudah terkunci di aplikasi. Menghapus salah satunya perlu
  dikabarkan ke Fariq dulu.

---

## 9. Rujukan: syahid ayat dan sumber kitab

### Syahid ayat (`docs/rujukan/syahid.md`)

Potongan ayat yang menjadi dasar tiap hukum. Di halaman Rujukan, potongan ini disorot saat hukumnya dipilih.

| Surah | Ayat | Hukum | Syahid | Rujukan |
|---|---|---|---|---|
| An-Nisa | 12 | Istri mendapat 1/8 bila suami punya anak | فَإِن كَانَ لَكُمْ وَلَدٌ فَلَهُنَّ الثُّمُنُ | R04-2 |

- Kolom **Syahid** harus sama persis dengan teks ayat di KB bab 1.2, **termasuk harakat**. Paling aman: salin
  langsung dari KB. Beda satu harakat saja akan ditolak.
- Bagian **Arti dan Tafsir** di bawah tabel belum diisi. Formatnya:

  ```
  ### An-Nisa 11
  Arti: ...
  Tafsir: ... (sumber: nama kitab tafsir, jilid, halaman)
  ```

### Sumber kitab (`docs/rujukan/kitab.md`)

Mengisi tombol "Baca kitab" di halaman Rujukan.

| Judul | Tautan | PDF |
|---|---|---|
| Raudhah ath-Thalibin wa 'Umdah al-Muftin | https://... | |

- **Judul** harus sama dengan KB bab 17.2.
- **Tautan**: hanya situs resmi atau yang legal.
- **PDF**: hanya berkas yang lisensinya jelas boleh diunggah. Kirim berkasnya ke Fariq bersama sumber lisensinya.

### Menambah atau mengoreksi rujukan di KB

Kode `[Rxx-y]` sendiri hidup di KB, bukan di berkas konten. Untuk menambah dalil atau mengoreksi kutipan, lihat
bagian 12.

---

## 10. Teks aplikasi: tanya jawab, habis ini ngapain, label, dan lain-lain

Teks di layar aplikasi tersimpan di dalam kode. Tim keilmuan **tidak perlu membuka kode**: kirim teksnya dengan
templat di bawah, dan Fariq yang memasukkannya.

Semua teks ini sekarang berupa **draf** yang disusun sementara dan perlu dicek. Cara ceknya: minta Fariq
mengirimkan daftar teks yang sekarang dipakai, lalu balas dengan koreksinya.

### 10.1 Tanya jawab (kasus nyata)

Artikel satu kasus waris nyata beserta penyelesaiannya dari ustadz atau lembaga fatwa. **Sekarang semuanya masih
placeholder.** Hanya isi dengan jawaban yang sumbernya jelas.

```
Judul: Sengketa rumah peninggalan
Jenis: Saran ustadz   (atau: Fatwa)
Ringkasan (1 kalimat untuk kartu daftar): ...
Kasus (boleh beberapa paragraf):
  ...
Penyelesaian (boleh beberapa paragraf):
  ...
Sumber: Nama ustadz / lembaga · tempat & tanggal terbit / nomor fatwa
Izin: sudah / belum ada izin dari yang bersangkutan untuk dimuat
```

Samarkan nama dan detail yang bisa mengenali keluarga yang bersangkutan.

### 10.2 Habis ini ngapain?

Daftar langkah yang biasanya dilakukan keluarga setelah melihat hasil pembagian. Tampil di layar hasil.
Isi sekarang:

1. Pastikan biaya jenazah dan hutang sudah beres.
2. Tunaikan wasiat.
3. Musyawarahkan hasil ini dengan semua ahli waris.
4. Sepakati sisa pembulatan dan cara membagi.
5. Urus dokumen yang dibutuhkan.
6. Kalau ragu atau ada perselisihan, tanya ahlinya.

Templat:

```
Langkah: (judul singkat, satu kalimat perintah)
Isi: (satu kalimat penjelas)
```

### 10.3 Ahwal: "Kapan dapat berapa?"

Semua kemungkinan bagian tiap ahli waris. Muncul saat pembaca mengklik seseorang di hasil. Contoh untuk ibu:

| Bagian | Syarat |
|---|---|
| 1/6 | Ada anak/cucu, atau ada dua saudara atau lebih. |
| 1/3 | Tidak ada anak/cucu dan saudaranya kurang dari dua. |
| 1/3 sisa | Hanya bersama ayah dan suami/istri (umariyyatain). |

Kirim koreksi per ahli waris dalam bentuk tabel yang sama, dan cantumkan kode rujukannya (yang ini tidak
ditampilkan, hanya untuk pengecekan).

### 10.4 Label ahli waris

Nama sehari-hari tiap ahli waris di formulir, misalnya `SAUDARI_SEBAPAK` → "Kakak/adik perempuan satu ayah".
Daftar lengkapnya ada di lampiran (bagian 15). Kirim koreksi dalam bentuk `KUNCI → label baru`.

### 10.5 Keterangan hubungan dan kerabat yang tidak ada di daftar

- **Keterangan hubungan**: kalimat kecil di bawah label, misalnya `NENEK_DARI_AYAH` → "ibunya ayah almarhum".
- **Kelompok kerabat** di formulir: Kakek & nenek, Cucu, Kakak/adik almarhum, Paman & sepupu dari pihak ayah, Keponakan.
- **"Kok kakek dari ibu, cucu dari anak perempuan, atau bibi tidak ada?"**: penjelasan bahwa mereka dzawil arham
  dan belum didukung [R14-4].

Koreksi dikirim dengan templat 10.6.

### 10.6 Pertanyaan formulir dan teks harta

- **Formulir (wizard)**: tiap langkah punya *pertanyaan* dan *caption* (kalimat kecil yang menjelaskan kenapa ditanya).
- **Harta dan kewajiban**: kategori harta beserta contohnya, dan urutan kewajiban (pengurusan jenazah → hutang → wasiat)
  beserta alasannya.

Templat:

```
Layar: (misalnya "Langkah Harta")
Teks lama: ...
Teks baru: ...
Rujukan: [Rxx-y] (kalau menyangkut hukum)
```

### 10.7 Teks lain di layar

Masih ada kalimat yang menyangkut hukum dan tertanam langsung di layar, misalnya:

- **Kondisi khusus**: "Beda agama atau terlibat dalam penyebab kematian almarhum."
- **Kartu harta**: "Harta tidak langsung dibagi. Dipakai dulu untuk mengurus jenazah, lalu melunasi hutang, lalu
  menunaikan wasiat..." dan peringatan saat wasiat melebihi 1/3.
- **Tentang kasus ini**: keterangan jenis kasus ('adilah, 'aul, radd).
- **Mode belajar**: petunjuk menebak bagian.

Cara paling mudah: jelajahi aplikasi, dan setiap kalimat yang keliru atau kurang jelas dikirim dengan
templat 10.6 (sebut layarnya dan tempelkan screenshot).

### 10.8 Tur singkat

Tur perkenalan yang menyorot bagian-bagian layar. Ini teks petunjuk pemakaian, bukan hukum, jadi tidak perlu
rujukan. Kirim dengan templat 10.6.

---

## 11. Penjelasan langkah hitung

Setelah menghitung, aplikasi menjelaskan cara hitungnya langkah demi langkah. Ada dua mode:

- **Cerita**: untuk orang awam. Urutannya: harta yang dibagi → siapa yang mewarisi → bagian masing-masing →
  menyamakan penyebut (ashl) → 'aul atau radd → tashih → hasil akhir.
- **Ringkas**: untuk pelajar atau ustadz, lebih padat dan memakai istilah.

Kalimat penjelasan ini **dirakit otomatis** dari hasil hitungan, jadi tidak bisa ditulis bebas per kasus. Yang
bisa diperbaiki tim keilmuan adalah pola kalimatnya. Cara review:

1. Buka kalkulator dan masukkan kasus (paling mudah pakai soal hitung di `docs/soal/hitung.md` atau kasus bab 16).
2. Baca penjelasan tiap langkah, di kedua mode.
3. Kirim koreksi dengan templat:

```
Kasus: H-17 (atau daftar ahli warisnya)
Mode: cerita / ringkas
Langkah ke-: 3
Kalimat sekarang: ...
Masalah: salah hukum / kurang jelas / istilah keliru / kurang rujukan
Usulan: ...
Rujukan: [Rxx-y]
```

Kesalahan hukum di sini diprioritaskan karena muncul di semua kasus sejenis.

---

## 12. Menyunting KB (sumber hukum)

KB (`docs/kb/`) adalah dasar mesin hitung **dan** semua konten. Perubahan di sini berdampak paling luas, jadi
selalu kirim terpisah dari konten dan sertakan sumbernya.

### Tabel "Dasar dan Rujukan Bab Ini"

Ada di akhir tiap bab. Dari tabel inilah kode `[Rxx-y]` berasal.

| Kode | Klaim | Jenis | Sumber | Kutipan / Keterangan |
|---|---|---|---|---|
| R04-2 | Bagian suami dan istri | Q + RDH | An-Nisa' 12 · RDH Bab 1 | «فللزوج نصف المال ...» |

- **Kode**: `R` + nomor bab dua digit + nomor urut. Kode yang sudah ada **tidak boleh diubah atau dipakai ulang**,
  karena sudah dirujuk dari konten. Kalau sebuah rujukan salah, koreksi isinya; kalau tidak dipakai lagi, beri
  keterangan, jangan dihapus.
- **Jenis**: `Q` Al-Qur'an, `H` hadits, `A` atsar sahabat, `IJ` ijma' (sebut penukilnya), `RDH` Raudhah
  ath-Thalibin, `KH` kaidah hisab (bukan hukum syar'i). Boleh digabung: `Q + RDH`. Hadits lemah ditandai `H (dha'if)`.
- **Sumber**: surah dan ayat, nomor hadits, atau kitab dan bab.
- **Kutipan**: teks Arab di antara `«...»`. Teks inilah yang tampil di tautan "dalil".
- Ayat Al-Qur'an ditulis lengkap di bab 1.2; syahid (bagian 9) mengambil potongan dari sana.

### Kasus uji (bab 16)

Kasus yang jawabannya sudah pasti. Dipakai untuk menguji mesin hitung, sebagai contoh glosarium, dan sebagai
sumber soal hitung.

| # | Ahli waris | Ashl → final | Saham | Menguji |
|---|---|---|---|---|
| 5 | Suami, 2 saudari kandung | 6 → 7 | Suami 3; saudari 4 (2+2) | 'Aul |

Setiap kasus baru wajib disertai kitab sumbernya (judul, jilid, halaman). Selain tabel ini, bab 16 juga memuat
**uji nominal** (hitungan sampai rupiah) dan **uji negatif** (hal yang harus ditolak atau ditanyakan aplikasi).

### Daftar rujukan (bab 17)

- **17.2 Sumber primer**: kitab yang dipakai, lengkap dengan penerbit dan cetakan.
- **17.3 Hadits**: lafaz, takhrij, dan status. Cocokkan dengan lafaz, bukan nomor saja.
- **17.4 Perlu verifikasi lanjut**: titik yang belum dicek ke teks asli. Hasil verifikasi atas titik-titik ini
  sangat dibutuhkan, karena selama masih di sini fiturnya ditahan.
- **17.5 Koreksi**: catatan koreksi yang pernah dilakukan, untuk jejak audit.

### Templat usulan

```
Bab KB: 04
Bagian: tabel Dasar dan Rujukan / isi bab / kasus uji / glosarium / bab 17
Jenis: tambah / koreksi
Isi usulan: ...
Dalil dan sumber: (ayat / hadits / kitab, jilid, halaman, kutipan aslinya)
Alasan: ...
```

---

## 13. Alur review

### Status draf

Semua konten yang belum direview ditandai **perlu dicek** (`perluCek: true` di materi, atau keterangan "draf,
perlu direview" di kepala berkas). Draf yang disusun dengan bantuan AI juga berstatus ini, sampai dicek manusia.

### Langkah

1. **Penulis** menyusun konten dan mengirimnya ke Fariq.
2. **Fariq** memasukkannya ke repo dan menjalankan pengecekan otomatis (kode rujukan ada, istilah dikenal, angka
   contoh cocok dengan hitungan, format benar). Kalau gagal, berkas dikembalikan beserta alasannya.
3. **Reviewer** (bukan penulisnya) mengecek isi terhadap KB:
   - Apakah setiap klaim cocok dengan rujukan yang dikutip?
   - Apakah ada hukum yang tidak ada di KB?
   - Apakah bahasanya bisa dipahami orang awam?
4. Kalau lolos, reviewer mengabari Fariq: "berkas X sudah dicek oleh [nama], tanggal". Fariq mengubah
   `perluCek` menjadi `false` dan mencatat nama reviewernya.

### Usulan perubahan KB

Pakai templat di bagian 12. Kasus uji baru untuk bab 16 sangat berharga: sertakan jawaban lengkapnya (ashl,
'aul/radd, tashih, dan saham tiap ahli waris) beserta kitab sumbernya.

---

## 14. Checklist sebelum setor

- [ ] Setiap klaim hukum punya kode `[Rxx-y]`, dan kodenya memang membahas klaim itu
- [ ] Tidak ada hukum di luar KB, dan tidak ada pendapat selain Syafi'i tanpa keterangan
- [ ] Istilah fikih memakai `[[...]]` dan ejaan glosarium
- [ ] Glosarium: contoh menyebut `Kasus 16.x`; ganti ejaan istilah sudah dikabarkan
- [ ] Usulan KB: kode lama tidak diubah, sumber lengkap sampai halaman
- [ ] Angka di teks sama dengan `harapan` di blok `kasus`
- [ ] Materi: kepala berkas lengkap, `perluCek: true`
- [ ] Kuis: tepat satu jawaban benar, ada pembahasan
- [ ] Soal hitung: judul tidak membocorkan jawaban
- [ ] Syahid ayat: disalin dari KB bab 1.2 lengkap dengan harakat
- [ ] Tanya jawab: sumber jelas, ada izin, identitas keluarga disamarkan
- [ ] Sudah dibaca ulang dengan membayangkan pembaca awam

---

## 15. Lampiran: kunci ahli waris

Dipakai di blok `kasus` dan soal hitung.

| Kunci | Label di aplikasi |
|---|---|
| `SUAMI` | Suami |
| `ISTRI` | Istri |
| `ANAK_LK` | Anak laki-laki |
| `ANAK_PR` | Anak perempuan |
| `AYAH` | Ayah |
| `IBU` | Ibu |
| `CUCU_LK` | Cucu laki-laki (dari anak laki-laki) |
| `CUCU_PR` | Cucu perempuan (dari anak laki-laki) |
| `KAKEK` | Kakek (dari ayah) |
| `NENEK_DARI_AYAH` | Nenek (dari ayah) |
| `NENEK_DARI_IBU` | Nenek (dari ibu) |
| `SAUDARA_KANDUNG` | Kakak/adik laki-laki kandung |
| `SAUDARI_KANDUNG` | Kakak/adik perempuan kandung |
| `SAUDARA_SEBAPAK` | Kakak/adik laki-laki satu ayah |
| `SAUDARI_SEBAPAK` | Kakak/adik perempuan satu ayah |
| `SAUDARA_SEIBU` | Kakak/adik laki-laki satu ibu |
| `SAUDARI_SEIBU` | Kakak/adik perempuan satu ibu |
| `KEPONAKAN_KANDUNG` | Keponakan laki-laki (kandung) |
| `KEPONAKAN_SEBAPAK` | Keponakan laki-laki (satu ayah) |
| `PAMAN_KANDUNG` | Paman (kandung) |
| `PAMAN_SEBAPAK` | Paman (satu ayah) |
| `SEPUPU_KANDUNG` | Sepupu laki-laki (kandung) |
| `SEPUPU_SEBAPAK` | Sepupu laki-laki (satu ayah) |
