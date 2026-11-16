# Riset UX layar Hasil: audit rinci (2026-11-17)

Lanjutan dari [riset-ux-wizard-kritik-2026-11-16.md](riset-ux-wizard-kritik-2026-11-16.md): kendala, pengguna, dan kosakata
tetap sama. Dokumen ini **hanya audit**, belum ada solusi.

## Keputusan pemilik (2026-11-17)

- Kasus khusus **tidak wajib** memakai layar yang sama dengan kasus biasa; boleh dirancang bebas. Menurut pemilik, layar
  kasus biasa pun belum masuk dari sisi UI maupun UX.
- **Semua perbaikan lewat mockup** dan acc dulu, termasuk yang tergolong bug.
- Penyajian munasakhat ditentukan dari JTBD (bagian 5).

## Cara audit

- Tujuh kasus contoh dibuka di browser (HP 375 px dan laptop ±800 px): **biasa** (istri, ibu, anak laki-laki, anak perempuan,
  saudara kandung terhalang, ayah sudah meninggal lebih dulu), **munasakhat** (anak laki-laki meninggal sesudah almarhum,
  meninggalkan satu putri), **mafqud**, **haml** (hitung sekarang), **haml** (tunggu lahir), **gharqa**, dan
  **munasakhat + haml**.
- Yang dibuka: hero, pohon pratinjau, layar penuh pohon, Pembagian (dan ikon-ikonnya), kartu pembulatan, Tidak mendapat bagian,
  Habis ini ngapain, Urutan yang biasa dilakukan keluarga, Langkah perhitungan (per langkah dan semua), Tabel faraidh, Tentang
  kasus, lembar orang (kasus biasa dan anak yang meninggal kemudian), dialog Ekspor, dialog pindah ke Belajar.
- Kode yang dibaca: `layar/Hasil.tsx`, `hasil/HasilKasusKhusus.tsx`, `hasil/ringkasan.ts`, `layar/lab/HeroLab.tsx`.
- **Belum diaudit:** mode Belajar (tebak jawaban) secara utuh, Banding madzhab, Bagikan (perlu masuk akun), pembaca layar.

## 1. JTBD layar Hasil

| # | Saat… | Saya ingin… | Supaya… | Ukuran |
|---|---|---|---|---|
| H-a | hasil keluar, di rapat keluarga | tahu tiap orang dapat berapa rupiah | bisa langsung dibagikan | angka per orang terlihat di layar pertama, tanpa istilah |
| H-b | ada yang protes ("kok saya nggak dapat?", "kok cuma segini?") | menunjukkan alasan per orang dalam satu kalimat | keluarga menerima | alasan ≤ 1 ketukan dari nama |
| H-c | ada yang meninggal berurutan | melihat harta mengalir lewat siapa | percaya hitungan berlapis | tiap orang tahu ia dapat dari almarhum yang mana, berapa |
| H-d | ada yang belum pasti (hamil, hilang, meninggal bersamaan) | tahu berapa yang boleh dibagi sekarang, berapa ditahan, untuk siapa, dan kapan dihitung lagi | tidak salah bagi | empat hal itu terjawab tanpa membuka lipatan |
| H-e | selesai menghitung | menyimpan, mencetak/mengirim, membagikan | dibawa ke rapat, ke grup keluarga, atau ke ustadz | satu tempat, berfungsi |
| H-f | ingin yakin hitungannya benar (ustadz, anggota keluarga yang kritis) | mencocokkan dengan cara hitung faraidh | percaya pada aplikasi | langkah dan tabel tersedia, tapi tidak mengganggu H-a |
| H-g | belajar (santri) | menebak lalu mempelajari langkah | paham cara hitung | (mode Belajar, belum diaudit) |

Catatan: wizard sudah menanyakan **"Kamu siapa?"** (jangkar diri). Pengguna wajar berharap Hasil menjawab
"**bagianku** berapa". Hasil sama sekali tidak memakai jawaban itu (bukti: tidak ada pemakaian `kasus.saya` di `hasil/*`
dan `Hasil.tsx`).

## 2. Kerusakan dan informasi yang salah

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| R1 | Kritis | Halaman ArifLab **crash** ("Halaman gagal ditampilkan") bila kasus terakhir adalah mafqud, haml, atau gharqa | `HeroLab.tsx:25` memanggil `ringkas()` untuk kasus `lengkap`, padahal `ringkas` melempar galat untuk hasil selain biasa/munasakhat OK |
| R2 | Kritis | Munasakhat: **satu orang, dua nama, dua status.** Putri dari anak yang meninggal kemudian tampil di Pembagian sebagai "Anak perempuan 2" (menerima Rp 87,5 jt), dan di "Tidak mendapat bagian" sebagai "Cucu perempuan, terhalang oleh Anak laki-laki" | `ringkasMunasakhat`: daftar terhalang dikumpulkan dari semua lapis tanpa membuang orang yang menerima di lapis lain |
| R3 | Kritis | Munasakhat, lembar orang anak yang meninggal kemudian: orang yang sama berganti nama di dalam satu lembar. Istri almarhum menjadi "**Ibu**", anak perempuan almarhum menjadi "**Saudara perempuan kandung**". Lembar itu juga menulis "cucu perempuan terhalang oleh anak laki-laki", padahal ia mewarisi dari ayahnya | lembar orang memakai sebutan dari sudut tiap mayit tanpa penanda lapis |
| R4 | Kritis | Gharqa: penerima harta orang kedua disebut dengan hubungan ke almarhum pertama. "Harta Anak laki-laki: **Istri** Rp 20 jt, **Anak perempuan** Rp 30 jt", padahal itu ibunya dan saudarinya | `Gharqa` memakai `namaSingkat` (sudut almarhum pertama) |
| R5 | Kritis | Janin disebut "**Anak laki-laki**" / "Anak laki-laki 2" (data janin berjenis kelamin bawaan L). Di "Bagaimana kalau…" muncul "Anak laki-laki: 2 perempuan" dan "Anak laki-laki: sudah wafat" (maksudnya lahir tidak hidup) | `Taqdir`: `namaSingkat` + `teksTaqdir` |
| R6 | Tinggi | Kaki halaman selalu "Hasil ini menurut madzhab Syafi'i", walau madzhab lain dipilih (hero sudah benar) | `Hasil.tsx:262`, kunci tetap |
| R7 | Tinggi | Ekspor **hanya JSON**. PNG dan PDF tertulis "Segera hadir", padahal tombol ini aksi utama di hero dan dijanjikan sebagai "**Ekspor tabel lengkap**" di "Habis ini ngapain?". Kartu "segera hadir" juga termasuk yang dilarang di rencana 1.4 | dialog Ekspor |
| R8 | Tinggi | "Urutan yang biasa dilakukan keluarga" menyuruh "pastikan biaya jenazah dan hutang sudah beres" dan "tunaikan wasiat" **sesudah** angka keluar, padahal ketiganya harus dikurangkan **sebelum** dihitung (langkah Harta). Bila pengguna menurut urutan ini, angkanya sudah salah. Daftar ini juga menampilkan "(Draf, menunggu pengecekan tim keilmuan.)" ke pengguna umum | kartu Habis ini ngapain |
| R9 | Sedang | Pohon: legenda "Wafat" bergaris putus, tetapi kotak Ayah (sudah meninggal) bergaris utuh abu, sama dengan kotak terhalang. Kotak saudara terhalang menulis "Terhalang" lalu "Terhalang oleh Anak laki-laki" (ganda) | layar penuh pohon |

## 3. Kasus biasa: audit per aspek

### 3a. Susunan dan urutan

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| S1 | Kritis | **Jawaban utama tidak ada di layar pertama.** Di HP, hero (judul, aksi, statistik, tab, pohon pratinjau) memakan 806 dari 812 px. Daftar "siapa dapat berapa" baru mulai di px 808. Satu-satunya angka per orang di layar pertama ada di pohon pratinjau yang hurufnya ±5 px | pengukuran DOM di 375×812 |
| S2 | Tinggi | Halaman sepanjang **±4,3 layar HP** (3.464 px) untuk 5 orang. Urutannya: hero → Pembagian → kartu pembulatan → Tidak mendapat → Habis ini → Langkah perhitungan → Tabel → Tentang → kaki | pengukuran DOM |
| S3 | Tinggi | **Angka yang sama tampil lima kali**: pohon, Pembagian, Langkah 7 "Hasil akhir", Tabel faraidh, lembar orang. Tidak ada yang menjadi sumber utama, jadi pengguna tidak tahu mana yang harus dibaca | — |
| S4 | Tinggi | **"Kenapa" tersebar di empat tempat** dengan isi yang tumpang tindih: lembar orang ("Kenapa segitu?"), Langkah 2–3, kartu "Tidak mendapat bagian", dan "Tentang kasus ini". Penjelasan terbaik untuk H-b (Langkah 2–3: "Istri mendapat 1/8, bukan 1/4, karena…") justru dikubur di bawah judul "Pelajari langkah perhitungan", yang terdengar seperti materi pelajaran | — |
| S5 | Tinggi | Hal untuk pengguna awam dan hal untuk pemeriksa/ustadz **bercampur tanpa lapis**: Tabel faraidh (asal masalah, tashih, saham) dan "Tentang kasus ini" ('adilah, tawafuq, tabayun) selalu terbuka di Hitung kasus, sedangkan "Langkah perhitungan" yang lebih manusiawi justru terlipat | — |
| S6 | Sedang | "Tentang kasus ini" mengulang Langkah 4–6 dengan kata lain. Judulnya pun mengulang: kepala kartu "Normal ('adilah)", lalu isinya lagi "JENIS KASUS · Normal ('adilah)" | — |
| S7 | Sedang | Di laptop, kolom kanan ("Tidak mendapat bagian" lalu "Habis ini ngapain") sejajar dengan Pembagian, sehingga aksi lanjut bersaing dengan jawaban. Di HP keduanya turun ke bawah Pembagian dan kartu pembulatan | — |
| S8 | Sedang | Hasil tidak lagi menampilkan stepper wizard (Langkah 5 dari 5). Pengguna yang ingin kembali ke Periksa tidak punya jalan yang terlihat selain "Ubah data" (ke langkah 1) | — |

### 3b. Informasi yang diberikan (yang ada, yang kurang, yang berlebih)

| Kode | Tingkat | Temuan |
|---|---|---|
| I1 | Kritis | **Tidak ada "bagianmu".** Wizard menanyakan "Kamu siapa", tapi Hasil tidak menyorot orang itu (lihat bagian 1) |
| I2 | Tinggi | Angka paling besar di halaman adalah **"Rp 300 jt" total harta**, yaitu angka yang diketik pengguna sendiri, ringkas dan dibulatkan. Angka bagian per orang lebih kecil. Judul terbesar "Nah, ini pembagiannya" tidak berisi informasi |
| I3 | Tinggi | Statistik hero: "Menerima bagian 4" dan "**Orang di pohon 6**". Yang kedua tidak menjawab job apa pun, dan menghitung almarhum serta yang terhalang |
| I4 | Tinggi | Tiap orang ditampilkan dengan **empat bentuk angka** sekaligus: rupiah, keterangan ("Bagian tertentu 1/8"), pil pecahan (1/8), dan pil persen (12,5%). Untuk ashabah, pecahannya tidak bermakna bagi awam (17/36, 17/72). Pil persen hitam adalah unsur paling kontras di baris, lebih menonjol dari rupiah |
| I5 | Tinggi | Pembulatan dijelaskan di **tiga tempat dengan pesan berbeda**: kartu "PERLU KEPUTUSANMU" (pilih Rp 1/100/1.000), Langkah 7 ("selisih Rp 1… perlu disepakati"), dan tabel yang menjumlah "Rp 299.999.999" tanpa baris selisih. Untuk selisih Rp 1, kartu berlabel "perlu keputusanmu" berwarna salmon membesar-besarkan hal yang hampir tidak berarti |
| I6 | Sedang | Potongan harta (biaya jenazah, hutang, wasiat) hanya muncul bila ada. Bila tidak ada, Hasil tidak memastikan "tanpa hutang dan wasiat". Padahal itu pertanyaan pertama di rapat keluarga, dan R8 malah menyuruh membereskannya sesudahnya |
| I7 | Sedang | Lembar orang: tiga kotak sama besar Pecahan · Persen · Nominal, dengan rupiah **paling akhir**. Bagian "Ahli waris lain yang terdampak" pada lembar anak perempuan berisi alasan istri dan ibu, bukan tentang dirinya |
| I8 | Sedang | Ayah yang sudah meninggal lebih dulu tetap tampil di pohon dengan teks kecil "meninggal sebelum almarhum". Kotak almarhum kosong (tidak ada total harta), padahal ia sumber aliran |
| I9 | Sedang | Langkah 1 "Menghitung harta yang dibagi" hanya berisi satu kalimat. Langkah 4–6 (menyamakan penyebut, memeriksa jumlah, tashih) murni hisab dan tidak relevan bagi keluarga, tapi diberi bobot sama dengan Langkah 2–3 |
| I10 | Sedang | "Saudara laki-laki kandung" (Langkah 2) dan "Kakak/adik laki-laki kandung" (pohon, daftar) dipakai untuk orang yang sama |

### 3c. Penyajian visual

| Kode | Tingkat | Temuan |
|---|---|---|
| V1 | Tinggi | Pohon pratinjau di hero **pucat dan tak terbaca**: kotak redup, huruf ±5–8 px, kontras rendah di atas latar hijau gelap. Di HP sama sekali tidak terbaca, padahal pohon ini memakan separuh layar pertama |
| V2 | Tinggi | Pita bagian (garis berwarna di atas daftar) tanpa label. Warnanya tidak unik (ibu dan anak perempuan sama-sama ungu). Di HP pecah menjadi titik-titik kecil. Kotak warna di Tabel faraidh memakai palet lain (lavender/mint) dari avatar (cokelat/ungu/hijau tua), jadi warna tidak berarti apa-apa lintas bagian |
| V3 | Tinggi | Avatar inisial dari **nama peran**, bukan nama orang: Istri dan Ibu sama-sama "I", anak laki-laki dan anak perempuan sama-sama "A". Inisial tidak membantu membedakan |
| V4 | Sedang | Tiga ikon tanpa label di kepala Pembagian (pensil = "Ubah ahli waris", mata = "Sembunyikan nominal", penggeser = "Atur tampilan"). Pensil di samping tautan "Ubah harta" membuat dua cara mengubah berbeda rupa |
| V5 | Sedang | "Atur tampilan" membuka panel pilihan Pecahan/Persen/Bentuk pecahan (Disederhanakan vs Penyebut sama) di tengah kartu. Ini pengaturan untuk pemeriksa/pelajar, ditaruh di kartu jawaban untuk keluarga |
| V6 | Sedang | Kartu pembulatan memakai label huruf kapital hitam "PERLU KEPUTUSANMU" dengan latar salmon. Gaya peringatan yang sama dipakai untuk "Kenapa begitu?" di Langkah dan lembar orang, sehingga salmon kehilangan arti |
| V7 | Sedang | Tabel faraidh di laptop 800 px terpotong ke kanan: kolom Nominal tidak terlihat tanpa gulir mendatar. Kepala tabel hitam pekat paling berat di halaman |
| V8 | Sedang | Tombol melayang "Nemu masalah? Laporkan" dan "FAQ" menutupi judul "Tidak mendapat bagian" dan tautan "Reset skenario" di kaki. Bilah navigasi bawah HP menutupi isi |
| V9 | Sedang | Lembar orang muncul sebagai dialog di tengah layar, bukan naik dari kotak yang diketuk (rencana 1.3 "Melayang") |
| V10 | Sedang | Langkah perhitungan: judul ganda ("Langkah 1 dari 7" lalu "Langkah 1 — Menghitung…"), tujuh chip langkah yang terpotong ke kanan, lipatan "Kenapa begitu?" bersarang di tiap langkah, dan langkah tidak menyorot pohon karena pohonnya jauh di atas (di hero) |

### 3d. Aksi

Hasil kasus biasa memuat **±22 aksi**: Ekspor (3 tempat: hero, "Habis ini", layar penuh sebagai "Bagikan"), Bagikan (akun),
Ubah data (hero dan kaki), Ubah harta, Ubah ahli waris (pensil), Ubah jumlah (lembar orang), ganti madzhab, tab Hitung kasus/Belajar,
Putar ulang, Perbesar, Layar penuh, Sembunyikan nominal (2 tempat), Atur tampilan, pilihan pembulatan, Simpan, Urutan keluarga,
Langkah demi langkah/Tampilkan semua, Mode fokus, Reset skenario, Laporkan (2 tempat), FAQ.

| Kode | Tingkat | Temuan |
|---|---|---|
| A1 | Tinggi | Aksi utama hero adalah **Ekspor**, yang hanya menghasilkan file JSON (R7). Bagi keluarga, file JSON tidak berguna. Aksi yang paling dibutuhkan di rapat (tunjukkan, cetak, kirim ke grup) tidak ada |
| A2 | Tinggi | Satu aksi, banyak nama: tombol hero "Ekspor", tautan "Ekspor tabel lengkap", dan tombol layar penuh "**Bagikan**" membuka dialog yang sama. Sementara itu "Bagikan" di hero adalah fitur lain (tautan akun) |
| A3 | Tinggi | Tab **Hitung kasus / Belajar** di hero kasus nyata keluarga. Menekannya membuka dialog "Pindah ke mode Belajar?" dan menyembunyikan jawaban. Ini sakelar mode aplikasi yang ditaruh di tengah jawaban |
| A4 | Sedang | Lima jalan mengubah data dengan tujuan berbeda: Ubah data (langkah 1), Ubah harta (dialog), pensil (langkah 3), Ubah jumlah (dialog dari lembar orang), tambah anak (layar penuh). Tidak ada satu pun yang ke langkah Periksa |
| A5 | Sedang | "Simpan, lanjut nanti" di layar hasil: kasus sudah tersimpan otomatis di riwayat. Kata "lanjut nanti" janggal ketika hitungan sudah selesai |
| A6 | Sedang | "Reset skenario" (merusak) berdampingan dengan "Ubah data" di kaki, sama rupa (tautan), tertutup tombol FAQ |
| A7 | Sedang | "ganti madzhab" huruf kecil, bersebelahan dengan "Ubah data" berhuruf besar. Tombol "Ubah data" di layar galat dan PERLU_INPUT berbingkai, padahal aturannya aksi sekunder berupa tautan |

### 3e. Bahasa

| Kode | Tingkat | Temuan |
|---|---|---|
| B1 | Sedang | "Wafat" di legenda, "sudah wafat" di sebutan (kosakata: meninggal) |
| B2 | Sedang | "Tidak mendapat bagian · **1 orang di pohon**" (kalimat janggal). "Terhalang" dan "Tidak menerima" dipakai untuk hal yang sama |
| B3 | Sedang | Istilah tampil di mode Hitung kasus tanpa saringan: ashabah, ashabah bil ghair, far'u warits, hajb hirman, hajb nuqshan, 'adilah, tawafuq, tabayun, tashih, inkisar, ru'us, juz' as-sahm, saham, asal masalah, jami'ah, mauquf |
| B4 | Sedang | "Nah, ini pembagiannya", "Habis ini ngapain?", "nggak bulat", "Nemu yang janggal?" bercampur dengan kalimat fikih formal. Gaya santai ini dipertahankan sejak rencana 1.4, tapi berbenturan dengan suasana berduka (pengguna utama) |
| B5 | Sedang | "Ketuk nama untuk melihat kenapa bagiannya segitu" dan "Pratinjau semua orang · ketuk untuk memperbesar" adalah petunjuk pemakaian yang menggantikan rupa yang jelas bisa diketuk |
| B6 | Sedang | Layar galat dan PERLU_INPUT menampilkan kalimat `alasan` mentah dari engine. Tombol "Ubah data" di sana menuju langkah 1, sedangkan di layar kasus khusus ke langkah 3 |

## 4. Kasus khusus: audit per jenis

Haml, mafqud, gharqa, dan menunggu memakai layar terpisah (`HasilKasusKhusus`, komentar kodenya: "Hasil versi minimal").

| Kode | Tingkat | Temuan |
|---|---|---|
| K1 | Kritis | **Kasus paling sulit mendapat layar paling miskin.** Tanpa judul atau nama almarhum, total harta, label madzhab, ganti madzhab, pohon, alasan per orang (tidak ada lembar orang), simpan, ekspor, pembulatan, tabel, "Habis ini ngapain". Job H-b, H-c, H-e gagal |
| K2 | Kritis | Mafqud/haml: **titipan tidak menyebut untuk siapa.** "Disimpan dulu Rp 196.875.000" berdiri sendiri, terpisah dari baris "Anak perempuan · menunggu kabar" |
| K3 | Kritis | Haml: anak perempuan yang pasti hidup tertulis "**menunggu kepastian**" tanpa alasan. Alasannya ([SYF]: ia berbagi ashabah dengan janin yang jumlahnya tidak dibatasi) baru ada di Langkah perhitungan yang terlipat. Keluarga akan mengira aplikasinya salah atau zalim |
| K4 | Tinggi | "Bagaimana kalau…" (terlipat) hanya memuat pecahan dan persen, tanpa rupiah. Tidak menjawab "kalau bayinya laki-laki, istri dapat berapa". Judul tiap kemungkinan memakai nama yang salah (R5) |
| K5 | Tinggi | Kalimat "Setelah bayi lahir atau ada kabar, buka kasus ini lagi" sama untuk semua kasus, termasuk mafqud yang tidak melibatkan bayi. Tidak menyebut di mana kasus bisa ditemukan lagi |
| K6 | Tinggi | Mafqud: tidak ada informasi batas waktu atau apa yang terjadi bila orang yang hilang tidak pernah kembali (siapa yang menerima titipan). Haml: tidak ada informasi bagian ibu janin yang sudah pasti |
| K7 | Tinggi | Menunggu kelahiran: layar hanya "Kasus disimpan · Hitung lagi setelah bayi lahir" dan tautan "Hitung sekarang saja". Tidak memberi tahu bagian yang sudah pasti sekarang (istri dan ibu), akibat memilih "Hitung sekarang saja" (sebagian ditahan), maupun di mana kasus bisa dibuka lagi |
| K8 | Tinggi | Gharqa: "Mereka tidak saling mewarisi" tidak menyebut siapa saja "mereka". Total harta tiap orang tidak ditampilkan. Penerima disebut dengan sudut almarhum pertama (R4) |
| K9 | Tinggi | Langkah perhitungan haml: "Mas'alahnya 72. Supaya sama dengan jami'ah 1440, tiap saham dikali 20 (juz' as-sahm)". Enam blok seperti ini berturut-turut, tidak terbaca bagi keluarga |
| K10 | Sedang | Istilah "mauquf" di sebelah judul "Disimpan dulu" |

### Munasakhat (memakai layar kasus biasa)

| Kode | Tingkat | Temuan |
|---|---|---|
| M1 | Kritis | **Lapisan tidak terlihat.** Anak yang meninggal kemudian hanya diberi label kecil "meninggal sesudah almarhum" di pohon, kotaknya kosong. Bahwa ia menerima **Rp 175 jt** dari almarhum hanya bisa ditemukan di lembar orangnya, lewat layar penuh pohon |
| M2 | Kritis | Daftar Pembagian hanya menampilkan **angka gabungan**. Istri tertulis "16 dari 72 saham jami'ah · Rp 66,7 jt" tanpa rincian (dari suami Rp 37,5 jt dan dari anak Rp 29,2 jt) |
| M3 | Kritis | R2 dan R3: orang yang sama berganti nama antar-bagian dan di dalam lembar orang |
| M4 | Tinggi | "Tentang kasus ini" hanya menjelaskan lapis pertama ("Normal, asal masalah 8, tashih 8 → 24"), seolah menjelaskan kasus utuh, lalu jami'ah 72 ditempel di bawahnya |
| M5 | Tinggi | Tabel faraidh munasakhat hanya kolom "Saham jami'ah · Nominal". Tabel per lapis yang biasa ditulis di kitab tidak ada, sehingga H-f gagal untuk munasakhat |
| M6 | Tinggi | Kasus "harta almarhum pertama **sudah dibagi**" (dijawab di wizard) tidak dibedakan di Hasil. Pengguna yang hanya perlu membagi harta orang kedua tetap melihat semuanya digabung |
| M7 | Tinggi | Munasakhat + haml: anak yang meninggal kemudian **hilang sama sekali** dari layar. Muncul "Cucu perempuan Rp 37,5 jt" tanpa penjelasan dari mana |
| M8 | Sedang | Pecahan gabungan (2/9, 35/72, 7/24) tidak bermakna bagi siapa pun |

## 5. Munasakhat dari sudut pengguna (kebutuhan informasi, belum solusi)

Contoh pengguna: istri almarhum. Suaminya meninggal (harta Rp 300 jt), lalu anak laki-lakinya meninggal beberapa bulan
kemudian sebelum harta sempat dibagi. Anak itu meninggalkan seorang putri.

**Cara ia bercerita:** "Harta bapak 300 juta. Anak saya, Budi, meninggal setelahnya. Jadi bagian Budi ikut dibagi lagi
ke saya, adiknya, dan anaknya."

**Pertanyaan di kepalanya, berurutan:**

1. "Akhirnya **saya** terima berapa? Masing-masing terima berapa?" Ini angka untuk eksekusi. Jika harta belum dibagi,
   uang cukup ditransfer sekali per orang, jadi yang dibutuhkan adalah total.
2. "**Bagian Budi berapa**, dan ke siapa saja?" Ini aliran, untuk percaya.
3. "Saya dapat **dari suami** berapa, **dari Budi** berapa?" Ini rincian per orang.
4. "Kok cucu dapat? Bukannya terhalang?" atau "Kok adiknya Budi dapat lagi?" Ini alasan yang **berganti antar-lapis**:
   cucu terhalang di harta kakeknya, tetapi mewarisi dari ayahnya.
5. (Bila harta suami sudah dibagi) "Yang perlu dibagi sekarang hanya harta Budi. Berapa dan ke siapa?"

**Turunan untuk perancangan (kebutuhan, bukan rupa):**

- Setiap orang tampil **sekali**, dengan **satu sebutan tetap** dari sudut almarhum pertama. Hubungannya ke almarhum
  berikutnya ditambahkan sebagai keterangan ("ibu Budi"), bukan nama baru.
- Tiap almarhum berikutnya adalah **penerima dan sekaligus sumber**: harus terlihat "menerima Rp X" lalu "dibagi ke…".
- Total per orang dan rincian per lapis sama-sama dibutuhkan: total untuk H-a, rincian untuk H-c dan H-b.
- Alasan terhalang atau menerima harus disebut **per lapis** ("di harta kakek: terhalang · di harta ayah: menerima ½").
- Harta yang sudah dibagi mengubah fokus: yang dihitung hanya lapis yang belum dibagi.
- Kasus berlapis bisa lebih dari dua almarhum (urutan wafat panjang). Kebutuhan ini harus tetap terbaca untuk 3–4 lapis.

## 6. Jalan cerita per job (kasus biasa)

| Job | Langkah pengguna | Tersendat di |
|---|---|---|
| H-a | Buka Hasil di HP → melihat judul, Ekspor, statistik, pohon kabur → gulir → Pembagian | S1, V1, I2, I4 |
| H-b | Anak bertanya "kok saya cuma setengah kakak?" → ketuk nama (setelah membaca petunjuk) → lembar orang → "Kenapa segitu?" | I7, B3 ("ashabah bil ghair"), S4 |
| H-b' | Paman bertanya "kok saya nggak dapat?" → cari namanya → di laptop ada di kolom kanan, di HP setelah kartu pembulatan → "Terhalang oleh Anak laki-laki." | B2, tanpa dasar ("kenapa anak menghalangi saudara?") kecuali di Langkah 2 dan lembar orang |
| H-e | Ingin mengirim ke grup keluarga → tekan Ekspor → hanya JSON | R7, A1, A2 |
| H-f | Ustadz ingin mencocokkan → Tabel faraidh (terpotong di laptop) → Tentang kasus → Langkah | V7, S6 |
| — | Mengikuti "Urutan yang biasa dilakukan keluarga" | R8 |

## 7. Catatan untuk pemeriksa fikih (bukan temuan UI, jangan diubah dari UI)

- F1. Di [SYF], langkah perhitungan haml menulis "6 kemungkinan" dan memakai enam dunia, termasuk mas'alah 72 dan jami'ah 1440.
  Menurut CLAUDE.md, model 6 taqdir hanya untuk [HNB]; di [SYF] jumlah janin tidak dibatasi. Angka contoh tetap konsisten
  (anak perempuan 0, istri dan ibu menerima bagian terkecil), tetapi kalimat dan jalannya perlu dicek ke engine dan KB 13a.
- F2. R8: urutan "bereskan hutang, tunaikan wasiat" sesudah hasil berbenturan dengan pipeline tirkah (bab 00.2). Isi daftar
  itu masih berstatus draf tim keilmuan.

## 8. Ringkasan

- 9 temuan rusak/salah (R1–R9).
- Kasus biasa: 8 temuan susunan, 10 informasi, 10 penyajian, 7 aksi, 6 bahasa.
- 10 temuan kasus khusus (K1–K10) dan 8 temuan munasakhat (M1–M8).
- **Akar yang berulang:**
  1. Tidak ada jawaban utama per layar (S1, S3, I2).
  2. Lapis "keluarga" dan "pemeriksa" tidak dipisah (S5, B3, V5).
  3. Sebutan orang tidak satu sumber antar-lapis dan antar-almarhum (R2–R5, I10).
  4. Kasus selain biasa dirancang sebagai tambahan, bukan dari job-nya (K1, M1, M6).
  5. Aksi tumbuh tanpa disusun ulang (A1–A4).
