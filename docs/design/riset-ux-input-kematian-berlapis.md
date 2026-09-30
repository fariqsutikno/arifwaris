# Riset UX: Input Kematian Berlapis (munasakhat, haml, mafqud, khuntsa, gharqa)

Tanggal: 2026-09-30 · Status: riset, belum spec · Terkait: spec UI langkah 5
(`docs/superpowers/specs/2026-09-25-desain-ulang-ui.md`), KB bab 12, 13, 13a–13d.

**Target pembaca akhir aplikasi:** siswa SMP yang belum pernah belajar faraidh dan tidak suka matematika.
Kalau dia bisa menyusun kasusnya sendiri dengan benar, orang dewasa awam juga bisa.

Dokumen ini disusun berurutan:

1. [Ringkasan dan rekomendasi](#1-ringkasan-dan-rekomendasi)
2. [Apa yang sebenarnya dibutuhkan engine](#2-apa-yang-sebenarnya-dibutuhkan-engine)
3. [Siapa penggunanya dan di mana mereka bingung](#3-siapa-penggunanya-dan-di-mana-mereka-bingung)
4. [Pembanding: kitab, aplikasi lain, pola desain](#4-pembanding)
5. [Delapan variasi desain input](#5-delapan-variasi-desain-input)
6. [Perbandingan variasi](#6-perbandingan-variasi)
7. [Rekomendasi: alur "Babak" berurutan](#7-rekomendasi-alur-babak)
8. [Katalog 30 skenario dan cara alur menanganinya](#8-katalog-skenario)
9. [Bahasa: kamus kata dan aturan kalimat](#9-bahasa)
10. [Anti-pola](#10-anti-pola)
11. [Rencana uji dengan pengguna](#11-rencana-uji)
12. [Celah engine dan keputusan pengguna](#12-celah-dan-keputusan)

---

## 1. Ringkasan dan rekomendasi

**Temuan utama**

1. **Orang awam tidak tahu kata "munasakhat", "haml", "mafqud", "gharqa".** Tapi mereka tahu jawaban dari
   pertanyaan sehari-hari: *"Budi masih hidup?"*, *"Siapa yang meninggal duluan?"*, *"Waktu itu ada yang sedang
   hamil?"*. Jadi kasus khusus jangan dijadikan menu fitur ("Pilih jenis kasus"). Kasus khusus harus **muncul
   sendiri dari jawaban atas status tiap orang**.
2. **Sumber bingung terbesar adalah label yang bergeser.** Siti adalah *istri* Pak Ahmad, tapi *ibu* bagi Budi.
   Di kitab ini wajar; bagi anak SMP ini membingungkan. Setiap kali "sudut pandang" pindah ke almarhum lain,
   layar harus mengatakannya terang-terangan dan pohon harus ikut berpusat ke almarhum itu.
3. **Urutan wafat lebih mudah dijawab sebagai perbandingan dua orang** ("Siapa yang lebih dulu: Budi atau
   Siti?") daripada menyusun daftar dengan tombol ↑↓. Jawaban "tidak tahu / bersamaan" di pertanyaan yang sama
   langsung membuka jalur gharqa, tanpa pengguna perlu tahu istilahnya.
4. **Kitab sendiri menulis munasakhat sebagai cerita kronologis** ("seseorang wafat meninggalkan ...; belum
   dibagi, lalu wafat ..."). Model mental ini paling alami: satu kematian = satu **babak**.
5. **Pengguna tidak boleh diminta mengklasifikasi.** Program Arab yang dibandingkan (Maknoon) meminta pengguna memilih
   jenis munasakhat (lapis berurutan vs selapis dengan mayit pertama). Itu menuntut ilmu faraidh. Engine kita
   sudah menentukan keadaan 1/2/3 sendiri (bab 12.7), jadi UI tidak perlu bertanya.

**Rekomendasi (dirinci di bagian 7):** gabungan empat variasi.

| Peran | Variasi | Keterangan |
|---|---|---|
| Tulang punggung | **D. Babak berurutan** | Satu almarhum = satu babak: "Siapa yang ditinggalkan?" |
| Pemicu | **B. Status tiap orang** | Tiap kartu orang punya status: hidup / wafat / hilang / dalam kandungan. |
| Urutan | **B. Perbandingan berpasangan** | "Siapa yang lebih dulu?" + jalan keluar "tidak tahu". |
| Konfirmasi | **E. Pohon + ringkasan kalimat** | Pohon berpusat ke almarhum babak itu; di akhir, cerita utuh untuk dicek. |
| Mode lanjutan | **C. Linimasa** | Tautan "Atur linimasa lengkap" (sudah disepakati): tanggal, nikah, cerai, lahir. |

Semua variasi memakai **satu model data** (`Kasus`), jadi pindah tampilan tidak menghapus isian.

---

## 2. Apa yang sebenarnya dibutuhkan engine

UI hanya boleh menanyakan hal yang memang dipakai engine. Tabel ini adalah "daftar belanja" data.

| Data engine | Arti sehari-hari | Dipakai untuk | Rujukan |
|---|---|---|---|
| `urutanWafat: IdOrang[]` | Siapa saja ahli waris yang wafat **sesudah** pewaris dan **sebelum harta dibagi**, urut dari yang paling dulu | Munasakhat | R12-1, 12.7 |
| `Orang.statusHidup` | `hidup` / `wafat` / `dalamKandungan` / `mafqud` / `tidakDiketahui` | Semua | 13a, 13b |
| `Orang.idAyah`, `idIbu` | Anak siapa | Hubungan, janin milik siapa | 13a.1 |
| `Pernikahan.status` | Masih suami-istri / cerai masih iddah / cerai tuntas, **pada saat salah satunya wafat** | Pasangan mewarisi | bab 02 |
| `dikandungSetelahWafat` | Anak yang baru dikandung **setelah** almarhum tertentu wafat → bukan ahli warisnya | Munasakhat + kelahiran | R13-1, R13-2 |
| `Orang.khuntsa` | Kelamin belum bisa ditentukan; sudah/belum baligh | Khuntsa | 13c.1, K13c-1 |
| `InputGharqa.anggota` | Orang-orang yang wafat dengan urutan samar | Gharqa | 13d.1 |
| `InputGharqa.keadaan` | Serentak / tahu lalu lupa / tahu berurutan tapi tak tahu siapa / sama sekali tak tahu | Gharqa | 13d.2 |
| `InputGharqa.tirkah` | Harta **masing-masing** anggota gharqa | Gharqa | 13d.3 |
| `agama`, `membunuhPewaris` | Beda agama, terlibat kematian | Mawani' tiap almarhum | bab 02 |

Yang **tidak** dibutuhkan engine dan jangan ditanyakan di mode biasa:

- **Tanggal pasti.** Engine hanya butuh urutan. Tanggal cuma alat bantu mengurutkan (mode lanjutan).
- **Jenis/keadaan munasakhat** (1, 2, 3). Ditentukan engine sendiri, disimpan sebagai label (12.7).
- **Harta pribadi, hutang, wasiat almarhum kedua dst.** Di luar cakupan munasakhat (12.5). Cukup satu
  kalimat pemberitahuan (lihat 7.6).
- **Peristiwa nikah sebagai tanggal.** Cukup status pernikahan saat pasangan pertama wafat (keputusan
  2026-09-30, memori "mode lanjutan munasakhat").

Batas yang UI harus hormati:

- Taqdir: maksimal `BATAS_DUNIA = 256` kemungkinan. Lewat batas → engine `PERLU_INPUT`; UI harus meminta
  pengguna memastikan status sebagian orang, bukan macet.
- Gharqa: maksimal 4 anggota untuk skenario urutan (`MAKS_ANGGOTA_SKENARIO`).

---

## 3. Siapa penggunanya dan di mana mereka bingung

### 3.1 Persona

| Persona | Kemampuan | Yang dia bawa | Risiko |
|---|---|---|---|
| **Nisa, 14 th, siswi SMP** | Bisa pakai HP, belum kenal faraidh, takut pecahan | Cerita dari orang tua, sering tidak lengkap | Salah urut, salah pilih "sudut pandang", menyerah di istilah |
| **Bu Rahma, 48 th, ibu rumah tangga** | Tahu keluarganya, tidak tahu fikih | Ingatan kejadian, kadang tanggal | Mengira harta "sudah dibagi" karena rumah sudah ditempati |
| **Mas Dimas, 25 th, mahasiswa non-syariah** | Nyaman dengan formulir | Diminta keluarga menghitung | Terburu-buru, melewati pertanyaan |
| **Ustadz Hanif, pengajar faraidh** | Paham istilah | Soal latihan dari kitab | Butuh jalur cepat; bosan kalau ditanya satu-satu |

Desain untuk Nisa. Ustadz Hanif dilayani dengan jalan pintas (mode linimasa, nanti mode tabel), bukan dengan
membuat jalur utama lebih teknis.

### 3.2 Batas kognitif yang dipakai sebagai patokan

- **Memori kerja ± 4 potong informasi** (Cowan 2001). Jadi satu layar jangan menuntut pengguna mengingat lebih
  dari ~4 hal dari layar lain. Contoh buruk: "urutkan 5 orang ini" sambil mengingat siapa istri siapa.
- **Satu hal per halaman** (GOV.UK *question pages*): satu keputusan, satu pertanyaan, atau satu informasi per
  layar memudahkan fokus, pemakaian di HP, dan pemulihan dari kesalahan.
- **Pengungkapan bertahap** (*progressive disclosure*, Nielsen 1995): yang jarang dipakai disembunyikan sampai
  relevan. Haml, mafqud, khuntsa, gharqa semuanya jarang; munculkan hanya saat jawaban memicunya.
- **Beban intrinsik vs beban tambahan** (Sweller): faraidh memang rumit (intrinsik), tapi pengguna hanya perlu
  menceritakan fakta keluarga. Semua kerumitan hitung ditanggung engine. Tugas UI: jangan menambah beban
  (istilah, klasifikasi, angka).

### 3.3 Peta kebingungan (dari kasus nyata dan contoh kitab)

| # | Titik bingung | Contoh salah paham | Akibat kalau dibiarkan | Penangkal |
|---|---|---|---|---|
| K1 | "Sebelum harta dibagi" | "Rumah sudah ditempati adik, berarti sudah dibagi" | Munasakhat terlewat | Definisikan: *dibagi = sudah dihitung bagiannya dan diserahkan jadi milik masing-masing* |
| K2 | Wafat **sebelum** pewaris vs **sesudah** | Anak yang wafat 5 tahun sebelum ayahnya dimasukkan ke urutan wafat | Hasil salah besar | Pertanyaan relatif: "Budi wafat sebelum atau sesudah Pak Ahmad?" |
| K3 | Wafat sesudah **harta dibagi** | Dimasukkan sebagai munasakhat | Harta dihitung dua kali | Pertanyaan K1 per almarhum + tawaran "hitung terpisah" |
| K4 | Label bergeser | "Ibu" Budi dicari di daftar, padahal sudah ada sebagai "istri" | Orang dobel; Siti dihitung dua kali | Pilih dari "orang yang sudah ada" di atas, dengan sebutan baru ditulis jelas |
| K5 | Urutan banyak orang | Menyusun 4 orang dengan ↑↓ | Salah urut tanpa sadar | Perbandingan berpasangan, ringkasan kalimat di akhir |
| K6 | "Tidak tahu siapa duluan" | Menebak saja | Hukum gharqa terlewat | Pilihan jujur "Tidak tahu / bersamaan" selalu ada |
| K7 | Hamil — hamil **saat siapa** wafat | "Menantu hamil" tanpa jelas saat kematian yang mana | Janin dianggap ahli waris almarhum yang salah | Pertanyaan hamil ditanyakan **di dalam babak** almarhum tertentu |
| K8 | Bayi sudah lahir atau belum | Bayi sudah lahir, tapi masih diisi "hamil" | Ada bagian ditahan padahal tidak perlu | "Bayinya sudah lahir?" selalu ditanyakan |
| K9 | Hilang ≠ wafat | Orang hilang 3 tahun diisi "wafat" | Hartanya dibagi padahal hukum asalnya hidup (13b.1) | Status "Hilang, tidak ada kabar" terpisah dari "wafat" |
| K10 | Harta almarhum kedua | Mengira aplikasi juga membagi harta Budi sendiri | Salah harap | Satu kalimat pemberitahuan (12.5) + tautan "hitung harta Budi sendiri" |
| K11 | Istilah & angka | "Ashl masalah", "1/6" di tahap input | Menyerah | Input tanpa istilah dan tanpa angka (kecuali uang) |
| K12 | Topik sensitif | Pertanyaan khuntsa, masa hamil, perceraian | Tersinggung / berhenti | Letakkan di balik tautan "keadaan lain", kalimat netral, tanpa menghakimi |

---

## 4. Pembanding

### 4.1 Kitab (Lahim dan contoh di `contoh munasakhot/`)

Kitab selalu menulis kasus sebagai **cerita kronologis satu paragraf**, contoh terjemahan bebas:

> Seseorang wafat meninggalkan suami, saudari kandung, dan nenek. Harta belum dibagi, lalu saudari itu wafat
> **setelah dinikahi suami tadi** ...

Pelajaran:

- **Unit cerita = satu kematian** beserta siapa yang ditinggalkan. Itu yang kita sebut *babak*.
- **Pernikahan bisa terjadi di antara dua kematian** (contoh di atas). Mode biasa harus bisa menangkapnya tanpa
  linimasa: saat mengisi keluarga saudari, "suami"-nya dipilih dari orang yang sudah ada.
- Tabel kitab (kolom per mas'alah, baris per orang, "×" untuk yang wafat sebelum pembagian) cocok untuk
  **hasil** dan untuk mode ahli, bukan untuk input orang awam.

### 4.2 Aplikasi kalkulator lain

| Aplikasi | Cara input munasakhat | Catatan |
|---|---|---|
| Kalkulator faraid umum berbahasa Inggris (mis. halalwallet) | Tidak ada; hanya jumlah ahli waris per jenis | Model "hitung jumlah anak laki-laki" tidak bisa menyimpan urutan wafat |
| Program Maknoon (حساب الزكاة والمواريث) | Pertanyaan "Apakah ada ahli waris yang wafat?", lalu **pengguna memilih jenis munasakhat**: lapis berurutan atau selapis dengan mayit pertama | Menuntut pengguna paham klasifikasi. Anti-pola untuk Nisa |
| Aplikasi kita (sekarang) | `PanelMunasakhat` disembunyikan (`TAMPILKAN_MUNASAKHAT = false`): centang orang, urutkan ↑↓, isi ahli waris per almarhum | Fondasi data sudah benar; interaksinya yang perlu diganti |

### 4.3 Aplikasi silsilah (FamilySearch, dll.)

- Tiap orang punya **linimasa peristiwa hidup** (lahir, nikah, wafat) urut kronologis.
- Peristiwa ditambahkan **di kartu orangnya**, bukan di menu terpisah.

Pelajaran: status wafat dan hamil paling alami ditempel ke kartu orang. Linimasa penuh cocok untuk mode
lanjutan; untuk Nisa terlalu banyak isian.

### 4.4 Pola desain layanan publik (GOV.UK)

- **Satu hal per halaman**: satu pertanyaan per layar.
- **Tambah lagi** (*add another*): isi satu item → daftar ringkas → "tambah lagi / ubah / lanjut". Pas untuk
  "tambah anggota keluarga" per babak.
- **Periksa jawaban** (*check answers*): halaman ringkasan sebelum hasil, tiap baris bisa diubah.

### 4.5 Formulir berbentuk kalimat (*Mad Libs*)

Uji A/B Luke Wroblewski di Vast.com: formulir berbentuk kalimat naratif menaikkan penyelesaian 25–40%
dibanding formulir biasa. Pelajaran: **ringkasan akhir** paling mudah dicek kalau berbentuk kalimat cerita,
bukan tabel. Untuk input panjang, kalimat berisian cepat jadi berantakan di HP, jadi dipakai terbatas.

---

## 5. Delapan variasi desain input

Semua variasi di bawah memakai contoh yang sama:

> **Pak Ahmad** wafat meninggalkan istri **Siti**, anak laki-laki **Budi**, anak perempuan **Rina**.
> Harta belum dibagi, lalu **Budi** wafat meninggalkan istri **Dewi** (sedang hamil) dan ibunya, Siti.

### Variasi A — Centang lalu urutkan (desain lama, disembunyikan)

```
[✓] Ada ahli waris yang wafat sebelum harta dibagi
    [ ] Siti   [✓] Budi   [ ] Rina
    1. Budi                          ↑ ↓
       + Tambah ahli waris Budi ...
```

- **Kelebihan:** sudah ada kodenya; cepat bagi yang paham.
- **Kekurangan:** kata "sebelum harta dibagi" tanpa penjelasan (K1); tidak menanyakan wafat sebelum/sesudah
  pewaris (K2); ↑↓ untuk 3+ orang rawan salah (K5); tidak ada jalan "tidak tahu" (K6); haml/mafqud tak ada
  tempatnya.
- **Cocok:** mode ahli.

### Variasi B — Status di tiap kartu orang + perbandingan berpasangan

```
Budi · anak laki-laki Pak Ahmad
Keadaannya sekarang?
( ) Masih hidup
(•) Sudah wafat
( ) Hilang, tidak ada kabar
    Keadaan lain ›

Budi wafat sebelum atau sesudah Pak Ahmad?
( ) Sebelum Pak Ahmad
(•) Sesudah Pak Ahmad
( ) Bersamaan / tidak tahu siapa duluan

Waktu Budi wafat, harta Pak Ahmad sudah dibagi?
( ) Sudah dibagi         (•) Belum dibagi
```

Kalau ada 2+ almarhum sesudah pewaris: **"Siapa yang wafat lebih dulu: Budi atau Rina?"** (+ "tidak tahu").
Urutan disusun dari jawaban-jawaban itu (penyisipan satu per satu; untuk 3 orang paling banyak 3 pertanyaan).

- **Kelebihan:** tiap pertanyaan bisa dijawab anak SMP; K2, K3, K6, K9 tertangani; gharqa & mafqud muncul
  alami.
- **Kekurangan:** kalau dipakai sendirian, pengisian keluarga almarhum kedua tidak punya "rumah" yang jelas.
- **Cocok:** pemicu dan pengurut. Inti rekomendasi.

### Variasi C — Linimasa (mode lanjutan)

```
2019 ── ● Pak Ahmad wafat
        │
2021 ── ● Dewi menikah dengan Budi
        │
2023 ── ● Budi wafat           (Dewi hamil 3 bulan)
        │
2024 ── ○ Bayi Dewi lahir
        │
Hari ini ── Harta Pak Ahmad dibagi
```

- **Kelebihan:** paling lengkap (nikah, cerai, lahir di antara kematian); cocok untuk kasus yang punya tanggal.
- **Kekurangan:** menuntut tanggal atau urutan banyak peristiwa sekaligus; berat untuk HP dan Nisa.
- **Cocok:** tautan "Atur linimasa lengkap" (sudah disepakati 2026-09-28).

### Variasi D — Babak berurutan (buku cerita)

```
Babak 1 · Pak Ahmad wafat
  Siapa saja keluarga yang ditinggalkan?   [Siti] [Budi] [Rina]  + Tambah

Babak 2 · Budi wafat (sesudah Pak Ahmad, harta belum dibagi)
  Sekarang kita lihat dari sisi Budi.
  Siapa saja keluarga yang Budi tinggalkan?
  Dari orang yang sudah ada:  [✓] Siti — bagi Budi: IBU
                              [ ] Rina — bagi Budi: SAUDARI
  Orang baru:                 + Istri   + Anak   + ...
```

- **Kelebihan:** sama dengan cara kitab bercerita; satu babak = satu sudut pandang, jadi pergeseran label
  (K4) terjadi di batas yang jelas; mudah dijelaskan ("babak berikutnya").
- **Kekurangan:** butuh pemicu untuk membuka babak baru (dari B), dan urutan babak harus benar (dari B).
- **Cocok:** tulang punggung.

### Variasi E — Pohon keluarga interaktif

```
        [Pak Ahmad ✝1]──○──[Siti]
                  │
        ┌─────────┴─────────┐
   [Budi ✝2]──○──[Dewi ◐]   [Rina]
```
Ketuk orang → "Tandai wafat" → pertanyaan B. Angka ✝1, ✝2 = urutan wafat; ◐ = sedang hamil.

- **Kelebihan:** paling visual; bagus untuk mengecek hubungan; sudah ada komponen pohon (spec desain ulang).
- **Kekurangan:** pohon lebar sulit di HP; menambah orang di posisi yang benar butuh keterampilan spasial;
  urutan tidak kelihatan dari posisi.
- **Cocok:** alat bantu lihat dan cek di tiap babak; alternatif input bagi yang suka.

### Variasi F — Kalimat berisian (*Mad Libs*)

```
[Pak Ahmad] wafat. Sebelum hartanya dibagi, [Budi ▾] juga wafat.
Budi meninggalkan [ibu: Siti ▾], [istri ▾] ... dan [tambah ▾].
```

- **Kelebihan:** terasa seperti bercerita; hasil akhir mudah dibaca ulang.
- **Kekurangan:** untuk keluarga besar kalimat jadi panjang dan sulit di HP; isian bersarang sulit diakses
  pembaca layar.
- **Cocok:** **ringkasan periksa jawaban** (hanya-baca dengan tautan "ubah"), bukan input utama.

### Variasi G — Mode cerita AI (rencana, lihat memori "mode cerita AI")

Pengguna mengetik: *"Kakek wafat tahun lalu, lalu om Budi wafat bulan kemarin, tante Dewi lagi hamil."* AI
menyusun graf; engine yang memutuskan; pengguna mengonfirmasi lewat pohon + ringkasan kalimat (E + F).

- **Kelebihan:** beban input paling rendah bagi yang lancar bercerita.
- **Kekurangan:** butuh login, kuota, privasi; salah tafsir AI harus dicek; bukan pengganti jalur utama.
- **Cocok:** jalan pintas setelah jalur utama matang. Pertanyaan tindak lanjutnya memakai pertanyaan B yang sama.

### Variasi H — Tabel ala kitab (mode ahli)

Kolom mas'alah per almarhum, baris per orang, "×" untuk yang wafat sebelum pembagian.

- **Kelebihan:** cepat bagi pengajar dan untuk menyalin soal kitab.
- **Kekurangan:** tidak bisa dipakai orang awam sama sekali.
- **Cocok:** nanti, untuk Ustadz Hanif / portal belajar. Di luar cakupan sekarang.

---

## 6. Perbandingan variasi

Skor 1 (buruk) – 5 (baik). **Ini penilaian heuristik penulis, bukan hasil ukur.** Angka final harus datang dari
uji pengguna (bagian 11).

| Kriteria | A Centang | B Status | C Linimasa | D Babak | E Pohon | F Kalimat | G AI | H Tabel |
|---|---|---|---|---|---|---|---|---|
| Beban kognitif rendah (Nisa) | 2 | 5 | 2 | 4 | 3 | 3 | 4 | 1 |
| Mencegah salah urut | 2 | 5 | 4 | 3 | 2 | 3 | 3 | 3 |
| Mencegah label bergeser (K4) | 2 | 3 | 3 | 5 | 4 | 3 | 3 | 2 |
| Menangani haml / mafqud | 1 | 4 | 5 | 4 | 3 | 2 | 3 | 3 |
| Menangani gharqa | 1 | 5 | 4 | 3 | 2 | 2 | 3 | 2 |
| Nikah/lahir di antara kematian | 1 | 2 | 5 | 4 | 3 | 2 | 4 | 2 |
| Nyaman di HP | 3 | 5 | 2 | 4 | 2 | 2 | 5 | 1 |
| Aksesibilitas (keyboard, pembaca layar) | 4 | 5 | 3 | 5 | 2 | 2 | 4 | 3 |
| Cepat untuk ahli | 4 | 2 | 4 | 3 | 3 | 3 | 5 | 5 |
| Biaya bangun (kode sekarang) | 5 | 4 | 2 | 3 | 3 | 3 | 1 | 2 |

Kesimpulan: tidak ada satu variasi yang menang di semua baris. B unggul di pencegahan kesalahan dan HP,
D unggul di sudut pandang, C unggul di kelengkapan, E dan F unggul di pengecekan. Gabungan B + D + E + F,
dengan C sebagai mode lanjutan, menutup kelemahan masing-masing.

---

## 7. Rekomendasi: alur "Babak"

### 7.1 Prinsip

1. **Tanya fakta, bukan hukum.** Pengguna menjawab "siapa, masih hidup atau tidak, siapa duluan". Engine yang
   menentukan munasakhat, taqdir, gharqa.
2. **Satu layar, satu pertanyaan** di HP. Di desktop boleh beberapa pertanyaan pendek dalam satu kartu, tapi
   tetap satu topik.
3. **Selalu ada jawaban jujur "tidak tahu".** Tiap "tidak tahu" dipetakan ke jalur yang benar (gharqa, mafqud,
   atau pesan "tanyakan dulu ke keluarga").
4. **Nama, bukan istilah.** "Babak Budi", bukan "mayit kedua". Nama boleh panggilan atau inisial (privasi).
5. **Sudut pandang diumumkan.** Setiap babak dibuka dengan "Sekarang kita lihat dari sisi Budi" dan pohon
   berpusat ke Budi.
6. **Tanpa angka di input**, kecuali uang. Tanggal opsional.
7. **Bawaan aman:** semua orang "masih hidup" sampai diubah; pertanyaan kasus khusus tidak tampil kalau tidak
   dipicu. Kasus biasa (satu almarhum) tidak bertambah satu layar pun.

### 7.2 Peta alur

```
Langkah 4 · Ahli waris (Babak 1: pewaris)
  Tambah orang ──► kartu orang: nama, hubungan, KEADAAN (bawaan: masih hidup)
                                                │
                ┌───────────────┬───────────────┼───────────────┬────────────────┐
             Masih hidup    Sudah wafat    Hilang, tak ada    Dalam kandungan   Keadaan lain ›
                │               │           kabar (7.5)        (7.4)            (khuntsa, cerai…)
                ▼               ▼
              selesai    Sebelum / sesudah / bersamaan-tak-tahu (dibanding pewaris)?
                            │         │               │
                 Sebelum ◄──┘         │               └──► Jalur gharqa (7.7)
                 (bukan ahli waris;   ▼
                  tawarkan tambah   Harta pewaris sudah dibagi waktu itu?
                  anaknya)              │            │
                               Belum ◄──┘            └──► Sudah: bukan munasakhat (skenario S30)
                                 │
                                 ▼
                     Masuk daftar "babak berikutnya"
                     2+ orang? → "Siapa lebih dulu: X atau Y?" (+ tidak tahu → gharqa)

Langkah 5 · Kondisi (sekarang: beda agama, terlibat kematian)
  + tiap babak berikutnya:  Babak 2 · Budi  →  Babak 3 · ...
      "Sekarang kita lihat dari sisi Budi."
      a. Keluarga yang Budi tinggalkan  (pilih dari yang sudah ada + tambah orang baru)
      b. Orang baru juga punya KEADAAN (bisa memicu babak 3, hamil, hilang)
      c. Beda agama / terlibat kematian Budi (mawani' per almarhum)

Periksa cerita (sebelum hasil)
  Ringkasan kalimat per babak + pohon kecil, tiap baris punya tautan "ubah".
```

Penempatan (diputuskan 2026-09-30): **sub-langkah di langkah 4**, karena mengisi keluarga almarhum kedua
adalah pekerjaan yang sama dengan langkah 4, dan stepper bisa menampilkan "4 · Keluarga (Babak 2 dari 2)".
Langkah 5 tinggal kondisi (beda agama, terlibat kematian) untuk semua babak.

### 7.3 Layar per layar (mode biasa, HP)

**L1. Kartu orang — keadaan** (muncul saat menambah atau mengetuk orang di Babak 1)

> **Bagaimana keadaan Budi sekarang?**
> - Masih hidup
> - Sudah wafat
> - Hilang, tidak ada kabar
>
> Keadaan lain › *(tautan; membuka: "masih dalam kandungan", "kelaminnya belum jelas")*

Pilihan "masih dalam kandungan" hanya muncul untuk hubungan yang mungkin (anak, saudara, dst. menurut 13a.1),
dan lebih sering dipicu dari pertanyaan hamil (7.4).

**L2. Sebelum atau sesudah** (hanya jika "Sudah wafat")

> **Budi wafat sebelum atau sesudah Pak Ahmad?**
> - Sebelum Pak Ahmad
> - Sesudah Pak Ahmad
> - Bersamaan, atau tidak tahu siapa yang duluan
>
> *Kenapa ditanya?* Orang yang wafat lebih dulu dari Pak Ahmad tidak mendapat warisan darinya.

**L3. Harta sudah dibagi?** (hanya jika "Sesudah")

> **Waktu Budi wafat, apakah harta Pak Ahmad sudah dibagi?**
> *Sudah dibagi artinya: sudah dihitung bagian masing-masing dan sudah diserahkan.
> Rumah yang ditempati bersama belum termasuk dibagi.*
> - Belum dibagi
> - Sudah dibagi

"Sudah dibagi" → Budi dianggap masih hidup untuk kasus ini (bagiannya sudah miliknya), dengan catatan:
"Warisan Budi dihitung terpisah" + tautan *Hitung warisan Budi*.

**L4. Siapa lebih dulu** (hanya jika ada 2+ almarhum "sesudah, belum dibagi")

> **Siapa yang wafat lebih dulu?**
> - Budi
> - Rina
> - Bersamaan, atau tidak tahu

Algoritma penyisipan: orang baru dibandingkan dengan yang sudah terurut, mulai dari tengah. Untuk 2 orang =
1 pertanyaan, 3 orang ≤ 3, 4 orang ≤ 5. Tautan kecil "Saya tahu tanggalnya" membuka isian tanggal opsional
yang mengurutkan otomatis (tanggal sama → tetap ditanya L4).

**L5. Pembuka babak**

> **Babak 2 · Budi**
> Budi wafat sesudah Pak Ahmad, sebelum hartanya dibagi.
> Jadi bagian Budi dari harta Pak Ahmad **diteruskan** kepada keluarga Budi.
> Sekarang kita lihat dari sisi Budi.

Pohon kecil di bawahnya, berpusat ke Budi, orang yang sudah ada ditulis dengan sebutan **dari sisi Budi**.

**L6. Keluarga yang ditinggalkan** (pola *add another*)

> **Siapa saja keluarga yang ditinggalkan Budi?**
>
> Dari orang yang sudah ada
> ☐ Siti — bagi Budi: **ibu**
> ☐ Rina — bagi Budi: **saudari kandung**
>
> Tambah orang baru
> Istri · Anak laki-laki · Anak perempuan · Ayah · Kerabat lain ›

Sistem **mencentang otomatis** orang yang sudah ada dan memang kerabat Budi (Siti, Rina), dengan tulisan
"sudah kami isi dari babak sebelumnya, hapus centang bila keliru". Ini memotong K4 (orang dobel).
Kerabat yang sudah ada tapi sudah wafat lebih dulu tampil abu-abu dengan keterangan.

**L7. Pertanyaan hamil per babak** (lihat 7.4)

**L8. Periksa cerita** (pola *check answers* + kalimat)

> **Coba baca ceritanya. Sudah benar?**
>
> **Babak 1.** Pak Ahmad wafat. Ia meninggalkan istri (Siti), anak laki-laki (Budi), dan anak perempuan (Rina).
> Hartanya belum dibagi. *ubah*
>
> **Babak 2.** Lalu Budi wafat. Ia meninggalkan ibu (Siti), istri (Dewi) yang sedang hamil, dan saudari (Rina).
> *ubah*
>
> Harta yang dibagi: harta Pak Ahmad, Rp 600.000.000.
> Harta milik Budi sendiri tidak ikut dihitung di sini. *Kenapa?*

Tombol utama: **Lihat hasil**. Aksi lain berupa tautan (keputusan UI 2026-09-28).

### 7.4 Hamil (haml)

**Di mana ditanyakan:** di akhir tiap babak, satu pertanyaan saja.

> **Waktu Budi wafat, apakah ada yang sedang hamil di keluarga ini?**
> *Janin bisa ikut mendapat warisan. Contoh: istri Budi, atau ibu Budi.*
> - Tidak ada
> - Ada

"Ada" → pilih perempuannya dari orang di babak itu (hanya yang mungkin: istri almarhum, ibu almarhum, istri
ayah, istri anak laki-laki, istri saudara laki-laki, istri paman, dst. sesuai 13a.1) → **"Janinnya dari siapa?"**
(pilihan: suaminya yang ada di data; atau "suami lain" untuk ibu yang menikah lagi) → **"Bayinya sudah lahir?"**

| Jawaban | Data engine | Pesan ke pengguna |
|---|---|---|
| **Belum lahir** | Node `statusHidup: 'dalamKandungan'` dengan `idIbu`, `idAyah` | Lihat di bawah: tawarkan menunggu |
| **Sudah lahir, masih hidup** | Orang biasa (`hidup`), tanya jenis kelamin, kembar? | Tidak ada yang ditahan |
| **Sudah lahir, lalu wafat** | Orang biasa (`wafat`) → masuk urutan wafat (babak baru) | "Bayi ini ikut mewarisi, lalu bagiannya diteruskan" |
| **Lahir tidak bernyawa** | Node dihapus | "Bayi yang lahir tanpa tanda kehidupan tidak mewarisi" (R13-2) |

"Sudah lahir" yang dikandung **setelah** almarhum wafat (mis. Dewi baru hamil setelah Budi wafat dari suami
baru) tidak ditanyakan di sini, karena tidak memenuhi syarat 1 (R13-1). Kasus anak yang dikandung **di antara
dua kematian** ditangani `dikandungSetelahWafat` (skenario S11).

Syarat masa kandungan (R13-1, R13-5) hanya ditanyakan bila relevan: bayi **lahir lebih dari 6 bulan sesudah**
almarhum wafat dan ibunya menikah lagi sebelum melahirkan. Kalimatnya netral, di balik tautan
"Bayi lahir lebih dari 6 bulan sesudah Budi wafat?". Tidak menanyakan hubungan suami-istri secara langsung.

**Menawarkan menunggu (13a.3, K13a-2).** Sebelum menghitung taqdir:

> **Bayi belum lahir. Mau menunggu dulu?**
> Menunggu kelahiran lebih baik: pembagian cukup sekali dan tidak ada yang ditahan.
> - Tunggu lahir dulu *(simpan kasus, ingatkan saya nanti)*
> - Hitung sekarang, bagian yang belum pasti disimpan dulu

Untuk [MLK], pilihan kedua tidak ada (engine `MAUQUF_SEMUA`), dan layar menjelaskannya.

Di hasil, bagian mauquf dijelaskan dengan metafora **"amplop titipan"**: "Sebagian harta disimpan di amplop
titipan sampai bayi lahir. Setelah lahir, isi amplop dibagi sesuai keadaan bayi." Tabel "jika terbukti X"
ditulis sebagai "Kalau bayinya 1 laki-laki: ...".

### 7.5 Hilang (mafqud)

> **Hilang, tidak ada kabar** → **"Sudah ada putusan pengadilan bahwa Budi dianggap wafat?"**
> - Belum ada → `statusHidup: 'mafqud'`. Pesan: "Orang hilang dianggap masih hidup sampai ada kepastian.
>   Bagiannya disimpan dulu." (13b.1, 13b.3)
> - Sudah ada → diperlakukan sebagai **sudah wafat** pada tanggal putusan → lanjut ke L2 (sebelum/sesudah
>   pewaris) memakai tanggal putusan. (13b.4 butir 3)
> - Ternyata sudah pasti wafat, tapi tidak tahu kapan dibanding Pak Ahmad → jalur gharqa (13b.4 butir 5).

Mafqud sebagai **pewaris** (Pak Ahmad sendiri yang hilang): langkah 1 bertanya "Pak Ahmad wafat atau hilang?".
Kalau hilang tanpa putusan: jelaskan bahwa hartanya belum bisa dibagi (13b.2) dan hentikan dengan sopan.
Kalau sudah ada putusan: lanjut seperti biasa; ahli waris = yang hidup saat putusan. Ini perlu dicek apakah
engine butuh penanda khusus (bagian 12).

Banyak orang hilang → kemungkinan berlipat (2ⁿ). Kalau engine mengembalikan `PERLU_INPUT` karena
`BATAS_DUNIA`, layar: "Terlalu banyak yang belum pasti. Coba pastikan keadaan sebagian orang dulu", lalu daftar
orangnya dengan tautan ke kartu masing-masing.

### 7.6 Harta almarhum kedua (12.5)

Muncul sekali di L5 dan di L8, bukan di tiap babak:

> Yang dibagi di sini hanya **harta Pak Ahmad**. Bagian Budi dari harta itu diteruskan ke keluarganya.
> Harta milik Budi sendiri, hutang, dan wasiatnya diurus terpisah. *Hitung warisan Budi* ›

### 7.7 Wafat bersamaan / tidak tahu siapa duluan (gharqa)

Dipicu dari L2 atau L4 ("Bersamaan, atau tidak tahu"). Pertanyaan disusun supaya jawaban yang **hasilnya sama
di semua madzhab digabung** (KB 13d.2, K13d-1: keadaan 4 dan 5 selalu diperlakukan sama), jadi cukup dua
pertanyaan:

> **G1. Apakah Pak Ahmad dan Budi pasti wafat di saat yang sama persis?**
> *Contoh: dalam satu kecelakaan, dan keduanya meninggal di tempat.*
> - Ya, pasti bersamaan → `keadaan: 'serentak'`
> - Tidak pasti → G2
>
> **G2. Dulu, pernah ada yang tahu siapa yang wafat terakhir?**
> - Pernah tahu, tapi sekarang lupa → `keadaan: 'terlupakan'`
> - Tidak pernah ada yang tahu → `keadaan: 'tidakDiketahui'`
> - Sekarang tahu siapa yang terakhir → kembali ke urutan biasa (keadaan 2 = munasakhat biasa)

Karena tiap anggota gharqa punya **harta sendiri** (`InputGharqa.tirkah`), layar berikutnya:

> **Budi juga punya harta sendiri?** Karena Pak Ahmad dan Budi wafat bersamaan, harta masing-masing dibagi
> sendiri-sendiri. Isi harta Budi (boleh dilewati).

Hasil [SYF] "terlupakan" = ditahan (`MAUQUF`); layar menjelaskan "harta ditahan sampai ada yang ingat, atau
keluarga bersepakat (berdamai)", lalu menampilkan skenario tiap urutan.

Kalimat hukum yang disampaikan ke pengguna, dengan bahasa sederhana: "Orang yang wafat bersamaan (atau tidak
diketahui siapa duluan) tidak saling mewarisi. Harta masing-masing dibagi kepada keluarganya yang masih hidup."
(K13d-1 jumhur/[SYF]; [HNB] berbeda dan disebut di catatan madzhab.)

### 7.8 Kelamin belum jelas (khuntsa)

Di balik "Keadaan lain ›" pada kartu orang, hanya untuk hubungan yang mungkin (anak, cucu dari anak laki-laki,
saudara, keponakan, paman, sepupu; bukan ayah/ibu/pasangan, 13c.1):

> **Kelaminnya belum bisa ditentukan (kelamin ganda)**
> *Pilih ini hanya bila sudah diperiksa dokter atau diputuskan hakim dan tetap belum jelas.
> Kalau sudah jelas laki-laki atau perempuan, pilih yang jelas itu.*
>
> **Sudah dewasa (baligh)?**
> - Belum → `khuntsa: 'diharapkanJelas'`
> - Sudah, dan tetap belum jelas / sudah wafat saat kecil → `khuntsa: 'tidakDiharapkanJelas'`

### 7.9 Mode lanjutan: "Atur linimasa lengkap"

Tautan di L4 dan L8. Membuka tampilan C di atas data yang sama:

- Tiap peristiwa: wafat, lahir, nikah, cerai; tanggal opsional, bisa diseret untuk mengurutkan.
- Peristiwa diterjemahkan ke data engine: urutan wafat → `urutanWafat`; lahir di antara dua kematian →
  `dikandungSetelahWafat` (dikandung setelah almarhum X wafat); nikah/cerai → status `Pernikahan` **saat
  pasangan pertama wafat**; titik wafat yang ditandai "bersamaan" → gharqa.
- Kembali ke mode biasa tidak menghapus apa pun (keputusan 2026-09-28).

---

## 8. Katalog skenario

Tiap baris: cerita pengguna → pertanyaan yang muncul → data engine → yang ditampilkan. Katalog ini sekaligus
bahan uji integrasi UI (pasangkan dengan fixture engine bila sudah ada).

### 8.1 Munasakhat dasar

| # | Cerita | Pertanyaan yang muncul | Data engine | Catatan tampilan |
|---|---|---|---|---|
| S1 | Satu anak wafat sesudah ayah, harta belum dibagi | L1 → L2 → L3 → Babak 2 | `urutanWafat: [Budi]` | Contoh 12.6 |
| S2 | Anak wafat, lalu cucu (anaknya) wafat | Keadaan cucu di Babak 2 → L2 dibanding Budi dan Pak Ahmad → Babak 3 | `[Budi, Cucu]` | Rantai 3 lapis; stepper "Babak 3 dari 3" |
| S3 | Dua anak wafat dari cabang berbeda, keluarga masing-masing terpisah | L4 sekali | `[Budi, Rina]` | Engine memberi label keadaan 2; UI tidak menanyakannya |
| S4 | Semua saudara wafat berturut-turut, tersisa ahli waris yang sama (contoh kitab 6 saudara) | L4 beberapa kali | urutan lengkap | Engine mendapati keadaan 1 → hasil "seolah langsung dibagi ke yang tersisa"; tampilkan kalimat itu |
| S5 | Anak wafat **sebelum** ayah | L2 = "Sebelum" | bukan di `urutanWafat`; `statusHidup: 'wafat'` | "Budi tidak mewarisi Pak Ahmad. Anak-anak Budi mungkin mewarisi sebagai cucu. Tambahkan?" |
| S6 | Almarhum kedua ternyata tidak dapat bagian (terhalang) | tidak ada pertanyaan tambahan | tetap di `urutanWafat` | Engine: `MUNASAKHAT_DILEWATI`; tampilkan "Paman tidak mendapat bagian dari Pak Ahmad, jadi tidak ada yang diteruskan" |
| S7 | Ahli waris almarhum kedua sudah ada di data (ibu = istri pewaris) | L6 dicentang otomatis | orang yang sama, tidak dobel | Sebutan dari sisi Budi: "ibu" |
| S8 | Ahli waris almarhum kedua orang baru (istri, anak Budi) | L6 "tambah orang baru" | node baru dengan `idAyah: Budi` | Pohon Babak 2 menampilkan cabang baru |
| S9 | Beda agama / terlibat kematian di babak 2 | Langkah 5 per babak | `agama`, `membunuhPewaris` relatif almarhumnya | Label "ahli waris Budi" (sudah ada di kode) |
| S10 | Pengguna salah urut, lalu membetulkan | tautan "ubah" di L8 → L4 diulang | urutan baru | Isian keluarga tiap babak tetap; babak ikut berpindah |

### 8.2 Pernikahan dan kelahiran di antara kematian

| # | Cerita | Pertanyaan | Data engine | Catatan |
|---|---|---|---|---|
| S11 | Suami pewaris menikahi saudari pewaris, lalu saudari itu wafat (contoh kitab) | Babak saudari: L6 → "Istri/suami" → **pilih dari orang yang sudah ada** | `Pernikahan` baru (utuh) antara keduanya | Tidak perlu linimasa; status dinilai saat saudari wafat |
| S12 | Janda pewaris menikah lagi, lalu wafat | Babak janda: suami baru = orang baru | `Pernikahan` kedua | Untuk pewaris ia tetap istri (utuh saat pewaris wafat). Sudah ada tes regresi 02.3 |
| S13 | Anak Budi **dikandung sesudah Pak Ahmad wafat**, lahir, lalu Budi wafat | Saat menambah anak Budi: "Anak ini sudah ada (lahir atau dalam kandungan) waktu Pak Ahmad wafat?" | `dikandungSetelahWafat: { anak: PakAhmad }` | Anak mewarisi Budi, tidak mewarisi Pak Ahmad. Pertanyaan hanya muncul untuk keturunan yang bisa jadi ahli waris pewaris |
| S14 | Pasangan bercerai sebelum salah satunya wafat | Keadaan lain › "Masih suami-istri waktu X wafat?" | `status: 'talakRajiIddah' / 'talakBain'` | Kalimat awam: "sudah cerai tapi masih masa iddah" vs "sudah cerai dan masa iddah selesai / talak tiga" |
| S15 | Cerai saat sakit menjelang wafat | Pertanyaan lanjutan hanya bila `talakBain` | `talakSaatMaradh` | Tergantung konfigurasi qaul (R02-3) |

### 8.3 Hamil

| # | Cerita | Pertanyaan | Data engine | Catatan |
|---|---|---|---|---|
| S16 | Istri pewaris hamil, belum lahir | 7.4 di Babak 1 | janin `dalamKandungan` | Tawarkan menunggu; [SYF] mitra ashabah janin (mis. anak lk) diberi 0 sementara, jelaskan "karena belum tahu berapa bayinya" (R13-15) |
| S17 | Istri almarhum kedua (Dewi) hamil saat Budi wafat | 7.4 di Babak 2 | janin `idAyah: Budi` + `urutanWafat` | taqdir di dalam rantai (13.0b butir 2) |
| S18 | Janin sudah lahir hidup | "Bayinya sudah lahir?" = hidup | orang biasa | Tidak ada yang ditahan |
| S19 | Bayi lahir hidup lalu wafat sebelum harta dibagi | = "lahir lalu wafat" | orang `wafat` + babak baru | Bayi mewarisi, bagiannya diteruskan ke keluarganya (biasanya ibu dll.) |
| S20 | Lahir tanpa tanda kehidupan | = "lahir tidak bernyawa" | node dihapus | Kalimat lembut; tanpa istilah |
| S21 | Ibu pewaris hamil dari suami lain (saudara seibu janin) | 7.4 → "Janinnya dari siapa?" = suami lain | janin `idIbu` saja | [SYF] berbagi fardh dengan janin: **ditolak engine** (titik keilmuan no. 1). Tampilkan pesan jujur + saran menunggu kelahiran |

### 8.4 Hilang

| # | Cerita | Pertanyaan | Data engine | Catatan |
|---|---|---|---|---|
| S22 | Seorang saudara hilang, belum ada putusan | 7.5 | `mafqud` | Bagiannya "disimpan dulu" |
| S23 | Hilang, lalu ada putusan wafat sesudah pewaris wafat | 7.5 → "sudah ada putusan" → L2 | `wafat` + `urutanWafat` | Jadi munasakhat (13b.4 butir 3) |
| S24 | Hilang, kemudian diketahui wafat sebelum pewaris | 7.5 → L2 = sebelum | `wafat`, bukan ahli waris | (13b.4 butir 2) |
| S25 | Dua atau lebih orang hilang | 7.5 berulang | beberapa `mafqud` | Tabel "kalau A hidup dan B wafat ...". Lewat batas → minta memastikan sebagian |

### 8.5 Wafat bersamaan

| # | Cerita | Pertanyaan | Data engine | Catatan |
|---|---|---|---|---|
| S26 | Ayah dan anak wafat di tempat dalam satu kecelakaan | L2 → G1 = pasti bersamaan | `keadaan: 'serentak'`, harta masing-masing | Dua pembagian terpisah di hasil |
| S27 | Tidak tahu siapa duluan | G1 → G2 = tidak pernah tahu | `tidakDiketahui` | [SYF] sama dengan serentak; [HNB] tilad (catatan madzhab) |
| S28 | Dulu tahu siapa terakhir, sekarang lupa | G2 = lupa | `terlupakan` | [SYF] ditahan + skenario urutan |
| S29 | Pewaris wafat, kemudian dua ahli warisnya wafat bersamaan | L4 → "bersamaan" antara Budi dan Rina | **belum didukung engine** sebagai satu input (lihat 12) | Sementara: pesan jujur "belum bisa dihitung otomatis" |

### 8.6 Batas cakupan

| # | Cerita | Pertanyaan | Hasil |
|---|---|---|---|
| S30 | Budi wafat **sesudah** harta Pak Ahmad dibagi | L3 = sudah dibagi | Budi dianggap hidup di kasus ini; tawarkan "Hitung warisan Budi" sebagai kasus baru |
| S31 | Kelamin anak belum jelas | 7.8 | taqdir khuntsa, aqall + mauquf [SYF] |
| S32 | Terlalu banyak yang belum pasti (> 256 kemungkinan) | tidak ada | `PERLU_INPUT` → daftar orang yang perlu dipastikan |

---

## 9. Bahasa

### 9.1 Kamus kata (tampilan ↔ istilah)

Istilah fikih boleh muncul **sebagai keterangan kecil** atau di halaman belajar, tidak sebagai label utama.

| Tampilkan | Istilah (keterangan kecil saja) |
|---|---|
| Almarhum / almarhumah + nama | mayit, muwarrits |
| Yang wafat pertama (Pak Ahmad) | mayit pertama |
| Babak 2 · Budi | mas'alah kedua |
| Wafat sebelum harta dibagi; bagiannya **diteruskan** | munasakhat |
| Janin / bayi dalam kandungan | haml |
| Hilang, tidak ada kabar | mafqud |
| Wafat bersamaan / tidak tahu siapa duluan | gharqa, hadma |
| Kelaminnya belum bisa ditentukan | khuntsa musykil |
| Disimpan dulu / amplop titipan | mauquf |
| Bagian paling kecil yang pasti | al-aqall |
| Keluarga bersepakat | ishtilah, shulh |
| Putusan pengadilan bahwa ia dianggap wafat | hukm bi al-mawt |

### 9.2 Aturan kalimat (target baca kelas 7–8)

1. Kalimat ≤ 15 kata; satu gagasan per kalimat.
2. Kalimat aktif, sebut nama orangnya: "Budi wafat sesudah Pak Ahmad", bukan "Ahli waris yang wafat setelah
   pewaris".
3. Tanpa negatif ganda: "Belum dibagi", bukan "Tidak belum dibagi".
4. Pertanyaan diakhiri tanda tanya dan jawabannya kalimat pendek, bukan "Ya/Tidak" bila bisa dihindari
   ("Belum dibagi / Sudah dibagi" lebih jelas dari "Ya / Tidak").
5. Tiap pertanyaan yang tidak jelas alasannya punya tautan "Kenapa ditanya?" satu kalimat.
6. Tanpa angka pecahan di input. Tanpa emoji; ikon SVG (keputusan memori "ikon bukan emoji").
7. Topik sensitif (kelamin, perceraian, masa hamil) ditulis netral, di balik tautan, tanpa kata yang
   menghakimi.
8. Semua teks masuk kamus diksi (`t(...)`), bukan hardcode (CLAUDE.md prinsip 6).

---

## 10. Anti-pola

| Jangan | Kenapa | Gantinya |
|---|---|---|
| Menu "Pilih jenis kasus: munasakhat / haml / mafqud / gharqa" | Menuntut istilah; kasus bisa gabungan | Status tiap orang memicu jalurnya |
| Meminta pengguna memilih jenis munasakhat (lapis/keadaan) | Itu tugas engine (12.7) | Tidak ditanyakan |
| Mengurutkan 3+ orang dengan ↑↓ atau seret tanpa pertanyaan | Salah urut tanpa sadar | Perbandingan berpasangan |
| Memaksa tanggal | Banyak keluarga tidak ingat | Tanggal opsional |
| Menambah orang yang sama dua kali di babak berbeda | Orang dihitung dobel | "Dari orang yang sudah ada" dicentang otomatis |
| Menyembunyikan "tidak tahu" | Pengguna menebak | "Bersamaan / tidak tahu" selalu ada |
| Menampilkan sebutan dari sisi pewaris di babak Budi | Label bergeser tanpa diumumkan | Sebutan dari sisi almarhum babak itu |
| Menghitung taqdir tanpa menawarkan menunggu | Menunggu lebih utama (13a.3) | Tawaran L7 |
| Menanyakan hamil di awal untuk semua kasus | Menambah beban 95% kasus | Pertanyaan hamil hanya satu, di akhir babak, bawaan "Tidak ada" |
| Tombol berbingkai untuk aksi sekunder | Keputusan UI 2026-09-28 | Tautan teks |
| Kode rujukan (R12-1) atau JSON di layar pengguna | Tidak dipahami awam | Kode hanya di jejak / halaman belajar |

---

## 11. Rencana uji

### 11.1 Peserta dan putaran

- 3 putaran × 5 peserta (aturan praktis Nielsen: 5 peserta per putaran menemukan sebagian besar masalah).
- Campuran: minimal 2 siswa SMP per putaran, 2 dewasa awam, 1 yang paham faraidh (untuk memeriksa ketepatan).
- Metode: *think-aloud*, di HP, prototipe klik (Figma) atau langsung di `apps/web` dengan fitur di belakang
  penanda.

### 11.2 Tugas

Tugas diberikan sebagai **cerita lisan/kartu**, bukan istilah. Contoh:

1. (S1) "Kakekmu wafat. Nenek, om Budi, dan tante Rina masih ada. Sebelum hartanya dibagi, om Budi wafat.
   Om Budi punya istri dan satu anak. Hitung pembagiannya."
2. (S5 jebakan) "Om Budi sudah wafat 5 tahun **sebelum** kakek."
3. (S17) "Tante Dewi, istri om Budi, sedang hamil waktu om Budi wafat. Bayinya belum lahir."
4. (S27) "Kakek dan om Budi wafat di kecelakaan yang sama. Tidak ada yang tahu siapa duluan."
5. (S30 jebakan) "Om Budi wafat setahun **sesudah** harta kakek dibagi."
6. (S11) Cerita kitab: suami menikahi saudari, lalu saudari wafat.

### 11.3 Ukuran keberhasilan

| Ukuran | Target awal |
|---|---|
| Kasus tersusun benar (graf + urutan sama dengan kunci) | ≥ 80% per tugas pada putaran 3 |
| Jebakan S5 dan S30 dijawab benar | 100% (kesalahan ini mengubah hasil besar) |
| Waktu tugas 1 | ≤ 4 menit di HP |
| Pertanyaan ke fasilitator "maksudnya apa?" | ≤ 1 per tugas |
| Skor kemudahan satu pertanyaan (SEQ, 1–7) | ≥ 5,5 |

Kesalahan dicatat per titik bingung K1–K12 supaya perbaikan bisa diarahkan ke layar tertentu.

---

## 12. Celah dan keputusan

### 12.1 Celah engine yang ditemukan saat riset (perlu dicek sebelum UI)

| # | Hal | Keadaan | Usulan |
|---|---|---|---|
| E1 | Gharqa **di tengah rantai** (pewaris wafat, lalu dua ahli warisnya wafat bersamaan, S29) | `InputGharqa` tidak punya `urutanWafat` sebelum kelompok; `InputMunasakhat` tidak punya kelompok gharqa | Tentukan apakah KB 13d + 12 cukup untuk menggabungkannya. Sampai itu, UI menolak dengan jujur |
| E2 | Gharqa lalu munasakhat (anggota gharqa punya ahli waris yang wafat sesudahnya) | Belum ada di `InputGharqa` | Sama dengan E1 |
| E3 | Mafqud sebagai pewaris dengan putusan (13b.2) | Engine tidak punya penanda "tanggal putusan"; cukup diperlakukan wafat? | Konfirmasi: UI memperlakukan sebagai wafat biasa, ahli waris = yang hidup saat putusan |
| E4 | Syarat masa kandungan (R13-1, R13-5) | Diperiksa di UI setelah lahir (catatan keilmuan) | Rumuskan pertanyaan lanjutan 7.4 bersama tim keilmuan |
| E5 | [SYF] berbagi fardh dengan janin (S21) | Ditolak (titik keilmuan no. 1) | Pesan UI khusus + saran menunggu |

### 12.2 Keputusan pengguna (2026-09-30)

1. **Letak babak 2 dst.:** sub-langkah langkah 4 "Keluarga" ("4 · Keluarga, Babak 2 dari 2"). Langkah 5
   tinggal kondisi (beda agama, terlibat kematian) untuk semua babak.
2. **"Harta sudah dibagi?" (L3):** ditanyakan **per almarhum**.
3. **Menunggu kelahiran (7.4):** **layar pilihan** sebelum hitung **dan** catatan di hasil.
4. **Khuntsa:** hanya di balik tautan "Keadaan lain ›".
5. Masih terbuka: urutan pengerjaan UI. Usulan riset: B (status + urutan) → D (babak) → L8 (periksa cerita)
   → haml → mafqud → gharqa → C (linimasa).

---

## Sumber

Internal: KB `12_munasakhat.md`, `13_kasus_khusus.md`, `13a_haml.md`, `13b_mafqud.md`, `13c_khuntsa.md`,
`13d_gharqa.md`; `docs/keilmuan-kasus-khusus-2026-09-30.md`; `packages/engine/src/types.ts`, `taqdir.ts`,
`gharqa.ts`; `apps/web/src/layar/LangkahKondisi.tsx`; contoh kitab di `../contoh munasakhot/`.

Eksternal:

- [GOV.UK Design System — Question pages](https://design-system.service.gov.uk/patterns/question-pages)
- [GOV.UK Design Notes — One thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/)
- [DWP Design System — Add another thing](https://design-system.dwp.gov.uk/patterns/add-another-thing/how-it-works)
- [Nava PBC — Structuring a complex eligibility form (HealthCare.gov)](https://www.navapbc.com/insights/structuring-complex-eligibility-form-healthcare)
- [Cowan (2001), The magical number 4 in short-term memory](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/magical-number-4-in-shortterm-memory-a-reconsideration-of-mental-storage-capacity/44023F1147D4A1D44BDC0AD226838496)
- [Kajian kapasitas memori kerja: empat, tujuh, atau tergantung?](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11259112/)
- [Progressive disclosure (ringkasan konsep, Nielsen 1995)](https://uxcel.com/glossary/progressive-disclosure)
- [LukeW via adactio — "Mad Libs" style form increased conversion by 25–40%](https://adactio.com/links/15591)
- [FamilySearch — Timeline dan peta di Family Tree](https://familysearch.org/en/help/helpcenter/article/what-is-the-timeline-or-map-in-family-tree)
- [Multaqa Ahl at-Tafsir — program Maknoon حساب الزكاة والمواريث (alur munasakhat)](https://mtafsir.net/threads/%D8%AD%D9%85%D9%84-%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC-%D8%AD%D8%B3%D8%A7%D8%A8-%D8%A7%D9%84%D8%B2%D9%83%D8%A7%D8%A9-%D9%88%D8%A7%D9%84%D9%85%D9%88%D8%A7%D8%B1%D9%8A%D8%AB-%D9%85%D8%B9-%D8%A7%D9%84%D8%B4%D8%B1%D8%AD.32835/post-243025)
- [halalwallet — Faraid calculator](https://www.halalwallet.us/tools/faraid-calculator)
- [Nielsen Norman Group — Why you only need to test with 5 users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)
