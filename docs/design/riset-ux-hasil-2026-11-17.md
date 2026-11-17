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

## 9. HMW dan ide (tahap 3)

Skor: **Paham** (mudah bagi keluarga awam di HP?), **Dampak** (menjawab job?), **Usaha** (realistis; kecil = murah).
Ide pertama di tiap tabel adalah yang paling sederhana. Belum ada rupa visual; itu di mockup.

### HMW-1. Bagaimana agar jawaban "siapa dapat berapa" langsung terbaca di layar pertama? (S1, S3, I2, I3, I4, V1)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Buang hero. Layar dibuka dengan daftar orang + rupiah; pohon pindah ke bawah atau tab | tinggi | tinggi | kecil |
| B. Kalimat jawaban di atas: "Harta Rp 300.000.000 dibagi ke 4 orang", lalu daftar rupiah besar. Pecahan cukup di keterangan ("1/8 karena ada anak"), persen dibuang dari tampilan awal | tinggi | tinggi | kecil |
| C. Pohon tetap di atas, tapi kotaknya besar dan terbaca (hanya penerima + almarhum), rupiah di kotak | sedang | sedang | sedang |
| D. Kartu per orang yang bisa digeser (carousel) | rendah | sedang | sedang |

**Pilih A + B.** Daftar rupiah adalah jawaban; pohon menjadi alat menjelaskan (HMW-3), bukan pembuka. Satu sumber angka:
daftar. Bagian lain merujuk ke daftar, tidak mengulang.

### HMW-2. Bagaimana agar pengguna langsung menemukan bagiannya sendiri? (I1)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Baris "Kamu" ditandai di daftar ("Istri almarhum · kamu") | tinggi | sedang | kecil |
| B. Kalimat pembuka pribadi: "Bagianmu Rp 37.500.000 (istri almarhum)", lalu daftar semua | tinggi | tinggi | kecil |
| C. Pilihan "lihat dari sisi…" untuk berganti orang | sedang | sedang | besar |

**Pilih B (dengan A).** Bila jangkar diri kosong ("mengisi untuk orang lain"), kalimat ini tidak muncul.

### HMW-3. Bagaimana agar setiap orang yang bertanya "kenapa" mendapat jawaban satu kalimat di tempat namanya? (S4, I7, B3, H-b)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Satu kalimat alasan di bawah tiap nama dalam daftar, termasuk yang tidak dapat ("1/8 karena almarhum punya anak", "tidak dapat karena ada anak laki-laki") | tinggi | tinggi | kecil |
| B. Ketuk nama → lembar orang dengan alasan + dalil; istilah hanya dalam kurung yang bisa diketuk | tinggi | tinggi | sedang |
| C. Satu bagian "Kenapa begini?" berisi semua alasan (dari Langkah 2–3), di bawah daftar | sedang | sedang | kecil |

**Pilih A + B.** Alasan satu sumber (jejak engine). Langkah 2–3, kartu "Tidak mendapat", dan "Tentang kasus" tidak lagi
mengulangnya. Yang tidak dapat ikut di daftar yang sama (redup, di bawah), bukan kartu terpisah.

### HMW-4. Bagaimana agar keluarga dan pemeriksa sama-sama terlayani tanpa saling mengganggu? (S5, S6, I9, V5, V7, B3, H-f)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Dua lapis: atas untuk keluarga (jawaban, alasan, langkah selanjutnya); bawah satu tautan "Cara menghitung (untuk dicocokkan)" yang membuka langkah + tabel + istilah | tinggi | tinggi | kecil |
| B. Sakelar "Tampilan sederhana / lengkap" | sedang | sedang | kecil |
| C. Halaman terpisah "Rincian perhitungan" | tinggi | sedang | sedang |

**Pilih A.** Tabel faraidh, "Tentang kasus", Langkah 4–6, dan Atur tampilan pindah ke lapis bawah. "Tentang kasus"
digabung ke langkah (tidak dua kali). Sakelar Hitung kasus/Belajar keluar dari layar jawaban (A3).

### HMW-5. Bagaimana agar aksi sesudah hasil sedikit, bernama jelas, dan benar-benar berguna di rapat keluarga? (R7, R8, A1–A7, H-e)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Satu aksi utama yang berfungsi: "Kirim ke keluarga" (teks ringkas siap tempel ke WhatsApp: nama + rupiah + catatan madzhab); JSON jadi "Simpan file kasus" di menu | tinggi | tinggi | kecil |
| B. Cetak halaman (CSS print) sebagai "Cetak / simpan PDF" | tinggi | tinggi | kecil |
| C. Gambar PNG ringkasan | tinggi | sedang | sedang |
| D. Satu pintu "Ubah" yang menuju Periksa (bukan langkah 1), menggantikan lima jalan ubah | tinggi | sedang | kecil |

**Pilih A + B + D.** Kartu "segera hadir" dibuang. "Urutan yang biasa dilakukan keluarga" diperbaiki urutannya
(hutang/wasiat dipastikan, bukan disuruh sesudahnya) dan label draf tidak tampil (perlu tim keilmuan, F2).

### HMW-6. Bagaimana agar pembulatan tidak menakutkan tapi tetap jujur? (I5, V6)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Satu baris kecil di bawah daftar: "Sisa pembulatan Rp 1 belum dibagi" + tautan "ubah pembulatan" | tinggi | sedang | kecil |
| B. Baris "Sisa pembulatan" ikut di daftar dan jumlah tepat Rp 300.000.000 | tinggi | tinggi | kecil |
| C. Tanya satuan pembulatan sekali di langkah Harta | sedang | sedang | sedang |

**Pilih A + B.** Label "Perlu keputusanmu" hanya bila selisihnya berarti (mis. satuan Rp 1.000).

### HMW-7. Bagaimana agar orang yang meninggal berurutan terlihat sebagai aliran, dan tiap orang tetap satu sebutan? (M1–M8, R2, R3, bagian 5)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Daftar total per orang (satu sebutan dari almarhum pertama, + "ibu Budi"), dan tiap baris bisa dibuka: "dari suami Rp 37,5 jt · dari Budi Rp 29,2 jt" | tinggi | tinggi | sedang |
| B. Per almarhum, berurutan seperti cerita: "1. Harta almarhum Rp 300 jt → …, Budi Rp 175 jt" lalu "2. Budi meninggal: Rp 175 jt → …"; penutup "Totalnya:" | tinggi | tinggi | sedang |
| C. Pohon beranimasi: harta mengalir ke Budi, berhenti, lalu mengalir lagi | sedang | sedang | besar |
| D. Tabel matriks (baris orang × kolom almarhum) | rendah | sedang | kecil |

**Pilih A, lalu B di bawahnya (diputuskan dari JTBD, 2026-11-17).** Urutan pertanyaan pengguna di bagian 5 dimulai dengan
"akhirnya saya/masing-masing terima berapa" (eksekusi, H-a). "Bagian Budi ke mana" dan "dari suami berapa, dari Budi berapa"
datang sesudahnya (H-c). Jadi layar dibuka dengan total per orang, dan tiap baris bisa dibuka menjadi rincian per almarhum.
Di bawahnya, cerita per almarhum ("Bagaimana hartanya mengalir") menjawab aliran dan alasan per lapis.
Pengecualian dari job yang berbeda: bila harta pertama **sudah dibagi**, job-nya hanya membagi harta Budi. Layar dibuka dengan
"Yang dibagi sekarang: harta Budi", dan lapis pertama hanya disebut sebagai asal harta Budi. Harus tetap terbaca untuk 3–4
almarhum. D untuk lapis pemeriksa (HMW-4).

### HMW-8. Bagaimana agar keluarga dengan orang yang belum pasti tahu: dibagi sekarang berapa, ditahan berapa, untuk siapa, kapan dihitung lagi? (K1–K10, R5)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Daftar yang sama dengan kasus biasa, tiap orang dua angka: "diterima sekarang" dan "mungkin bertambah sampai …"; janin/orang hilang di daftar sebagai "Bayi dalam kandungan istri almarhum" / "Anak perempuan (hilang)" dengan "ditahan" | tinggi | tinggi | sedang |
| B. Kartu titipan menyebut isinya: "Rp 212,5 jt ditahan untuk bayi dan anak perempuan; dibagi lagi setelah bayi lahir" + kalimat alasan [SYF] untuk anak perempuan | tinggi | tinggi | kecil |
| C. Pemilih kemungkinan ("kalau bayinya laki-laki / perempuan / kembar / meninggal") yang mengganti angka di daftar dalam rupiah | sedang | tinggi | sedang |
| D. Layar "menunggu" berisi yang sudah pasti + di mana membuka lagi + akibat "hitung sekarang" | tinggi | sedang | kecil |

**Pilih A + B + D, C sebagai lapis kedua.** Sebutan janin dan orang hilang diambil dari keadaannya, bukan jenis kelamin
bawaan. Gharqa memakai pola cerita per almarhum yang sama dengan HMW-7, dengan sebutan dari sudut masing-masing almarhum
yang jelas ("ibunya", "saudarinya").

### HMW-9. Bagaimana agar nada dan kata cocok untuk keluarga yang berduka? (B1–B6, I10)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Pakai kosakata yang sudah ada (meninggal, tidak mendapat bagian, satu sebutan per orang); istilah fikih hanya dalam kurung yang bisa diketuk, dan di lapis pemeriksa | tinggi | tinggi | kecil |
| B. Nada tenang di Hitung kasus ("Pembagian harta [nama]"), gaya santai hanya di Belajar | tinggi | sedang | kecil |
| C. Tanpa petunjuk pemakaian ("ketuk nama…"); rupa yang menjelaskan | tinggi | sedang | kecil |

**Pilih A + B + C.**

## 10. Prinsip desain (dari pilihan di atas)

1. **Satu layar, satu jawaban:** yang pertama terlihat adalah rupiah per orang (dan bagianmu), bukan judul, statistik, atau pohon.
2. **Satu angka, satu tempat:** daftar adalah sumber; bagian lain merujuk, tidak mengulang.
3. **Alasan menempel di nama:** setiap orang, termasuk yang tidak dapat, punya satu kalimat "karena…".
4. **Dua lapis:** keluarga di atas; cara menghitung (langkah, tabel, istilah) di bawah untuk yang ingin mencocokkan.
5. **Satu orang, satu sebutan:** dari almarhum pertama, di semua bagian dan semua lapis; hubungan lain ditambahkan sebagai keterangan.
6. **Kasus mengikuti cerita keluarga:** berlapis = cerita per almarhum lalu total; belum pasti = sekarang · ditahan · untuk siapa · kapan.
7. **Aksi sedikit dan berfungsi:** kirim ke keluarga, cetak, ubah (ke Periksa). Tidak ada "segera hadir".
8. **Nada tenang:** kosakata pengguna, istilah hanya di kurung atau lapis pemeriksa.

## 11. Jawaban pemilik dan keputusan (2026-11-17)

1. **Bagikan menurut kebutuhan:** WhatsApp cukup untuk kabar singkat (nama + rupiah). PDF untuk kondisi yang butuh banyak
   penjelasan (rapat keluarga, dibawa ke ustadz, urusan dokumen). Jadi dua aksi: "Kirim ringkasan" (teks WA) dan
   "Unduh PDF lengkap" (jawaban + alasan per orang + cara menghitung).
2. Pertanyaan pohon dijelaskan ulang ke pemilik (bagian 12).
3. Urutan munasakhat diputuskan dari JTBD, bukan preferensi: total per orang dulu, lalu aliran (HMW-7).

## 12. Pertanyaan terbuka: peran pohon keluarga di Hasil

Sekarang pohon adalah kotak besar di bagian atas layar Hasil. Menurut HMW-1, bagian atas diganti daftar rupiah. Yang perlu
diputuskan: setelah itu, apakah pohon masih tampil di layar Hasil?

Dari JTBD: pohon tidak menjawab "dapat berapa" (H-a); daftar lebih cepat. Pohon membantu dua hal: (1) menunjukkan
hubungan saat menjelaskan alasan ("paman tidak dapat karena ada anak laki-laki"; terlihat siapa lebih dekat), dan (2) di
munasakhat, menunjukkan jalur harta dari almarhum ke Budi lalu ke anak Budi (H-c).
Usulan: pohon tidak lagi di atas. Pohon muncul (a) di bagian "Bagaimana hartanya mengalir" untuk kasus berlapis, dan (b) kecil
di lembar orang, menyorot orang itu dan penghalangnya. Untuk kasus biasa tanpa lapis, tidak ada pohon besar di layar.

**Keputusan pemilik:** pohon **tetap ditampilkan**. Di mockup, pohon diletakkan di bawah daftar, terbaca (kotak terang, rupiah di
kotak), dan menyorot orang yang barisnya dibuka.

## 13. Mockup

[mockup-hasil-per-kasus.html](mockup-hasil-per-kasus.html), tab: Biasa · Meninggal berurutan · Berurutan, sudah dibagi · Ada yang
hamil · Ada yang hilang · Menunggu lahir · Meninggal bersamaan · Cara mencoba (7 tugas, validasi asumsi, salin catatan).

Susunan bersama: kepala (nama almarhum, kalimat jawaban, potongan harta, madzhab) → bagianmu → daftar siapa dapat berapa
(alasan satu kalimat, ketuk untuk rincian; yang tidak dapat di daftar yang sama; sisa pembulatan dan jumlah pas) → Kirim
ringkasan · Unduh PDF lengkap · Ubah data → pohon → (berlapis: aliran per almarhum) → langkah selanjutnya → Cara menghitung
(terlipat).

Versi 2 (2026-11-17): disusun ulang sebagai bento grid gaya Logivo (hero gelap berisi ubin bagianmu + ringkasan, ubin pastel: daftar, porsi harta, pohon, aliran, bagikan, langkah selanjutnya, cara menghitung). Dicek di browser: HP 375 px tanpa gulir mendatar halaman (pohon bergulir di dalam kotaknya), laptop 1200 px. Interaksi: buka
baris + sorot pohon, tahap aliran, pemilih kemungkinan bayi, lembar Kirim ringkasan, banner tugas. Konsol tanpa galat.
Tidak dicek: pembaca layar, isi PDF (hanya pesan mockup).

Catatan data: angka mafqud "kalau Siti kembali/meninggal" sengaja tidak diisi (tidak dikarang; diambil dari engine saat
dibangun). Tab hamil memakai enam kemungkinan seperti engine sekarang; lihat F1.

## 14. Audit ulang mockup v2 (bento) — 2026-11-17

Masukan pemilik: materi lama harus tetap ada **dan** materi baru tetap ada, semuanya rapi. Tambahan: pohon besar yang bisa
diperbesar, diperkecil, dan dibuka layar penuh; mode fokus dengan langkah 1 sampai selesai; tabel faraidh dan pohon
berdampingan tanpa menjadi ramai, tetapi juga tidak serba-terlipat; ubah nama kasus; keterangan harus jelas asalnya;
kasus meninggal bersamaan masih membingungkan; madzhab mungkin cukup di bagian informasi (ide, divalidasi di HMW);
pertimbangkan kasus yang memuat semua keunikan sekaligus. Bagian ini hanya audit, belum ide.

### 14a. Materi lama yang hilang di v2

| Kode | Materi lama | Keadaan di v2 |
|---|---|---|
| L1 | Pecahan dan persen per orang, bentuk pecahan (disederhanakan/penyebut sama) | Hilang dari daftar; persen hanya di ubin Porsi. Pecahan hanya di kalimat alasan, tidak konsisten |
| L2 | Langkah perhitungan 1–7, "langkah demi langkah / tampilkan semua", "Kenapa begitu?" per langkah | Diringkas jadi 5 butir statis di ubin Cara menghitung yang terlipat |
| L3 | **Mode fokus**: layar penuh, pohon + tabel berdampingan, sub-langkah (4a, 4b, …), peragaan angka terbang dari pohon ke tabel, laci daftar langkah, kontrol animasi | Tidak ada sama sekali |
| L4 | Tabel faraidh seperti di Belajar (asal masalah, tashih, saham, nominal) | Hanya di dalam lipatan; tidak bisa dilihat bersama pohon |
| L5 | Jenis masalah ('adilah/'aul/radd), asal masalah + alasannya, tashih, jami'ah | Hilang (hanya sebaris di lipatan) |
| L6 | Lembar orang lengkap: Kenapa segitu, Cara menghitungnya, Ahli waris lain yang terdampak, **Kapan dapat berapa** (ahwal), Dalil, Ubah jumlah | Diganti rincian sebaris di bawah nama; ahwal, terdampak, dan ubah jumlah hilang |
| L7 | Pohon layar penuh: perbesar, perkecil, geser, tambah anak, sembunyikan nominal, putar ulang aliran harta | Pohon ubin kecil tanpa alat apa pun |
| L8 | Pilihan pembulatan Rp 1/100/1.000 dengan keterangan kapan cocok | Hanya tautan "ubah" berupa pesan mockup |
| L9 | Sembunyikan nominal, Atur tampilan | Hilang |
| L10 | Mode Belajar (tebak dulu), Banding madzhab | Tidak dirancang |
| L11 | Simpan (beri nama), Bagikan tautan (akun), simpan file kasus (JSON) untuk impor | Hilang; hanya Kirim ringkasan dan PDF |
| L12 | Catatan sumber sekunder untuk madzhab selain Syafi'i | Hilang |
| L13 | **Ubah nama kasus** | Tidak ada di lama (hanya lewat dialog Simpan) maupun di v2. Judul "Harta Pak Ahmad" diambil dari nama almarhum, bukan nama kasus |

### 14b. Pohon keluarga dan tabel faraidh

| Kode | Tingkat | Temuan |
|---|---|---|
| P1 | Tinggi | Di v2, pohon menjadi ubin 5/12 kolom (±430 px di laptop) dengan huruf ±10 px. Di HP lebar pohon 600 px dan digeser di dalam kotak tanpa petunjuk. Tidak bisa diperbesar atau dibuka layar penuh |
| P2 | Tinggi | Pohon dan tabel menjawab pertanyaan yang **sama dari dua arah**: pohon "siapa, hubungannya apa" dan tabel "berapa saham, dari mana angkanya". Di aplikasi lama keduanya hanya bersanding di mode fokus. Di v2 keduanya terpisah jauh (pohon di tengah, tabel terlipat di bawah), jadi menghubungkan baris tabel dengan kotak pohon membebani ingatan |
| P3 | Tinggi | **Dilema ruang:** di laptop, pohon (butuh lebar) dan tabel (butuh lebar, 5–6 kolom) tidak muat berdampingan tanpa salah satunya terlalu kecil. Di HP keduanya pasti bertumpuk. Menampilkan keduanya selalu terbuka memperpanjang halaman (kembali ke masalah S2). Melipat keduanya membuat pemeriksa harus mencari (S5) |
| P4 | Sedang | Sorot pohon hanya dari daftar. Tabel tidak menyorot pohon, dan langkah tidak menyorot keduanya |
| P5 | Sedang | Pohon besar (15+ orang, munasakhat 3 lapis) belum diuji; di aplikasi lama pohon >40 orang tidak beranimasi |

### 14c. Langkah perhitungan dan mode fokus

| Kode | Tingkat | Temuan |
|---|---|---|
| F1' | Tinggi | Tidak ada alur "dari 1 sampai selesai": tidak ada penanda posisi, tidak ada langkah penutup ("Selesai: harta dibagi ke 4 orang"), tidak ada jalan kembali ke jawaban setelah selesai |
| F2' | Tinggi | Di aplikasi lama, mode fokus hanya bisa dibuka dari kartu langkah yang terlipat di bawah. Pintunya tersembunyi, padahal ini fitur paling mengajar |
| F3' | Sedang | Kasus khusus (haml, mafqud, gharqa) dan munasakhat tidak punya mode fokus di aplikasi lama. Langkahnya hanya teks panjang ("Mas'alahnya 72… juz' as-sahm") |
| F4' | Sedang | Langkah dan lembar orang menjelaskan hal yang sama dengan teks yang sama (jejak engine). Tidak ada aturan mana yang ringkas dan mana yang lengkap |

### 14d. Asal setiap keterangan (ketertelusuran)

| Kode | Tingkat | Temuan |
|---|---|---|
| T1 | Kritis | Kalimat mockup "Pak Ahmad dan Budi meninggal bersamaan **dan tidak diketahui siapa yang lebih dulu**" mencampur dua keadaan gharqa yang berbeda (KB 13d.2): keadaan 1 **serentak** (ijma': tidak saling mewarisi) dan keadaan 5 **tidak diketahui** (jumhur [SYF]: tidak saling mewarisi; [HNB]: saling mewarisi dari tilad). Keadaan 3 **terlupakan** di [SYF] justru **ditahan** sampai ingat atau berdamai. Jadi kalimat dan hasilnya harus berasal dari **jawaban pengguna** (keadaan mana) dan rujukan [R13-10], bukan kalimat umum |
| T2 | Tinggi | Mockup memuat kalimat alasan yang saya tulis sendiri, bukan dari jejak engine. Contoh: "1/2, lalu sisanya juga kembali kepadanya" (radd, tanpa nama dan alasan), "Bagian ibu dari harta anaknya" (angkanya 2/5, tidak dijelaskan), "Tanya ustadz atau pengadilan agama" (pengadilan agama tidak ada di KB fikih; itu ranah KHI). Di aplikasi, setiap kalimat harus dari jejak engine + templat diksi dengan rujukan |
| T3 | Tinggi | "Harta Budi Rp 50.000.000" muncul tanpa asal. Pengguna tidak melihat bahwa angka itu isiannya sendiri (tirkah anggota gharqa di wizard) |
| T4 | Sedang | Setiap angka hasil tidak menunjukkan data masukan yang membentuknya (harta kotor, potongan, tahun meninggal, keadaan). Pengguna harus kembali ke Periksa untuk mencocokkan |
| T5 | Sedang | Tab hamil menyebut enam kemungkinan; lihat F1 bagian 7 (perlu cek engine untuk [SYF]) |

### 14e. Meninggal bersamaan (gharqa)

| Kode | Tingkat | Temuan |
|---|---|---|
| G1 | Tinggi | Tidak dijelaskan **mengapa** tidak saling mewarisi (syarat mewarisi: ahli waris pasti hidup saat pewaris meninggal; R13-10, mani' istibham waqt al-maut) |
| G2 | Tinggi | Orang yang sama tampil di dua daftar dengan sebutan berbeda (Aminah "istrinya" dan "ibunya"), ditambah daftar total. Tiga daftar, dua almarhum, satu keluarga: pengguna tidak tahu daftar mana yang dipakai untuk membagi |
| G3 | Tinggi | Pohon menggambar Budi sebagai kotak almarhum kedua, tanpa penanda "meninggal bersamaan dengan Pak Ahmad". Tidak terlihat bahwa garis waris antara keduanya **putus** |
| G4 | Sedang | Hasil berbeda per keadaan (serentak / terlupakan / berurutan tak diketahui / tidak diketahui) dan per madzhab ([HNB] tilad–tharif), tetapi layar tidak menyebut keadaan yang dipilih atau akibat memilih keadaan lain |
| G5 | Sedang | Keadaan 3 [SYF] (ditahan, dua skenario urutan) tidak dirancang sama sekali |
| G6 | Sedang | Radd di harta Pak Ahmad dan harta Budi tidak dijelaskan (kenapa Siti mendapat lebih dari 1/2) |

### 14f. Madzhab dan informasi kasus

| Kode | Tingkat | Temuan |
|---|---|---|
| I11 | Sedang | Madzhab tampil kecil di bilah atas ("Menurut madzhab Syafi'i · ganti"), sejajar dengan tautan kembali. Madzhab adalah **konteks hasil** (mempengaruhi angka), bukan aksi navigasi. Catatan sumber sekunder untuk madzhab selain Syafi'i hilang |
| I12 | Sedang | Tidak ada satu tempat "informasi kasus" (nama kasus, madzhab, tanggal dihitung, harta kotor dan potongannya, keadaan khusus yang dipilih, satuan pembulatan). Informasi itu tersebar di hero, meta, dan lipatan |
| I13 | Sedang | Hero v2 mengulang angka: kalimat "Rp 300.000.000 dibagi ke 4 orang" dan ubin "Total harta Rp 300 jt" serta "Menerima 4 orang" |

### 14g. Beban pikiran v2

| Kode | Tingkat | Temuan |
|---|---|---|
| C1' | Sedang | Kirim ringkasan muncul dua kali (tombol hero dan ubin Bagikan) |
| C2' | Sedang | Sekitar 9 ubin per kasus dengan 4 warna latar (putih, mint, oranye, hitam) tanpa arti warna yang konsisten: oranye = bagikan, mint = langkah, hitam = cara menghitung. Warna dipakai sebagai hiasan, bukan makna |
| C3' | Sedang | Persen hanya di ubin Porsi, rupiah hanya di daftar. Untuk membandingkan satu orang, mata harus melompat antar-ubin |
| C4' | Sedang | Ubin "Cara menghitung" hitam tampak seperti tombol, tetapi membuka konten di **bawah** semua ubin. Hubungan sebab-akibatnya tidak terlihat |

### 14h. Satu kasus yang memuat semua keunikan

Skenario: Pak Ahmad meninggal → Budi meninggal sesudahnya (munasakhat) → istri Budi sedang hamil (haml di lapis 2) → Siti hilang
(mafqud di lapis 1 dan 2) → paman dan sepupu meninggal bersamaan dalam kecelakaan lain yang ikut dalam rantai (gharqa) → ada
khuntsa. KB 13.0b: taqdir gabungan = hasil kali (mis. 6 × 4 × 2 = 48 kemungkinan), lalu satu jami'ah, aqall, dan sisanya ditahan.

| Kode | Tingkat | Temuan |
|---|---|---|
| X1 | Kritis | Pola "empat ubin" (dibagi sekarang / ditahan / untuk siapa / kapan) tidak memuat **beberapa alasan menahan sekaligus**: ditahan untuk bayi (sampai lahir) **dan** untuk Siti (sampai ada kabar), dengan waktu berbeda. "Kapan dihitung lagi" bisa lebih dari satu peristiwa |
| X2 | Kritis | Pemilih "Kalau bayinya…" berupa pil tidak bisa menampung 48 kemungkinan gabungan. Pengguna perlu memilih **per sumber** (bayi: …, Siti: …), bukan per dunia |
| X3 | Tinggi | Aliran per almarhum harus bisa memuat "ditahan" di tengah rantai: bagian Budi dari ayahnya sebagian ditahan karena Siti hilang, lalu harta Budi sendiri sebagian ditahan karena bayi |
| X4 | Tinggi | Satu orang bisa punya beberapa keadaan di lapis berbeda (Siti: hilang di harta ayah, hilang juga di harta Budi). Daftar total per orang harus menunjukkan bagian pasti dan bagian ditahan per lapis |
| X5 | Tinggi | Tabel faraidh untuk kasus ini = tabel per mayit × per kemungkinan. Tidak mungkin ditampilkan sekaligus. Perlu jalan masuk (pilih mayit, pilih kemungkinan) |
| X6 | Tinggi | Pohon harus menandai beberapa jenis keadaan pada satu gambar: meninggal lebih dulu, meninggal sesudah (berlapis), meninggal bersamaan, hilang, dalam kandungan, khuntsa, terhalang, ditahan. Legenda v2 hanya 4 jenis |
| X7 | Sedang | Batas kemungkinan engine (`BATAS_DUNIA` → PERLU_INPUT) harus tampil sebagai daftar orang yang perlu dipastikan, bukan layar galat. Di aplikasi lama sudah ada, di mockup belum |
| X8 | Sedang | Bagianmu bisa berupa rentang ("sekarang Rp X, bisa sampai Rp Y"), dari beberapa almarhum, dengan beberapa sebab ditahan. Ubin tunggal v2 tidak memuat itu |

### 14i. "Lebih informatif" (yang belum dijawab layar)

- Harta kotor → potongan (biaya jenazah, hutang, wasiat) → harta bersih, dalam satu baris yang bisa dibuka.
- Data masukan yang membentuk hasil (siapa saja, keadaannya, urutan meninggal) untuk dicocokkan tanpa kembali ke Periksa.
- Untuk tiap orang: bagian, pecahan, persen, alasan, dalil, dan "kalau keadaannya lain" (ahwal), tanpa membuka banyak tempat.
- Jenis masalah dalam bahasa awam ("bagian pas", "bagian melebihi harta, semua dikurangi sebanding", "ada sisa, dikembalikan").
- Status hasil: pasti, sebagian ditahan, ditunda, atau perlu data.

## 15. Analisis munasakhat panjang dan kasus gabungan (2026-11-17)

Koreksi istilah bagian 14h: yang "tidak sanggup" adalah **pola tampilan mockup v2**, bukan engine. Engine memang dirancang
untuk rantai panjang dan gabungan (KB 13.0b). Di bawah ini hasil ukur nyata dan dampaknya ke tampilan.

### 15a. Ukur engine (rantai keturunan: tiap generasi = istri + anak laki-laki + anak perempuan; anak laki-laki meninggal sesudah ayahnya)

Diukur lewat `jalankan()` aplikasi web (vitest, Node, satu kali jalan, mesin pengembang). Harta Rp 1 miliar.

| Kasus | Generasi | Hasil | Waktu | Digit jami'ah | Penerima | Kemungkinan |
|---|---|---|---|---|---|---|
| Munasakhat saja | 5 / 20 / 50 | OK | 22 / 81 / 669 ms | 10 / 33 / 80 | 13 / 43 / 52 | – |
| + 1 orang hilang (generasi 1) | 5 / 20 / 50 | OK | 7 / 74 / 1.439 ms | 10 / 33 / 80 | 12 / 42 / 51 | 2 |
| + 1 janin (generasi terakhir) | 5 / 20 / 50 | OK | 10 / 173 / 4.359 ms | 11 / 34 / 81 | 11 / 41 / 52 | 6 |
| + hilang + janin | 5 / 20 / 50 | OK | 12 / 305 / 7.612 ms | 11 / 35 / 81 | 10 / 40 / 51 | 12 |

Kesimpulan ukur:
- **Kebenaran dan kapasitas: sanggup.** Rantai 50 generasi dengan dua ketidakpastian selesai OK. Tidak ada batas jumlah lapis di
  engine (`munasakhat.ts` mengulang per mayit). Batas yang ada hanya `BATAS_DUNIA = 256` kemungkinan gabungan (`taqdir.ts`):
  mis. 2 janin [SYF] (6 × 6 = 36) × 3 orang hilang (2³ = 8) = 288 > 256 → `PERLU_INPUT` dengan daftar orang yang perlu dipastikan.
- **Waktu: masalah tampilan.** 0,7–7,6 detik di Node untuk 50 generasi. Di browser HP bisa beberapa kali lebih lambat, dan
  sekarang `jalankan()` dipanggil di utas utama (`Hasil.tsx` memanggilnya di `useMemo`, dua kali: di `Hasil` dan `HasilOkLayar`).
  Layar akan membeku selama itu. (Belum diukur di browser; perlu diukur sebelum memutuskan.)
- **Angka: tidak terbaca.** Jami'ah 80 digit. Tabel saham per orang berisi angka 70–80 digit.

### 15b. Munasakhat: apa yang harus terlihat agar "harta X dibagi, lalu dibagi lagi" jelas

Temuan baru (melengkapi M1–M8):

| Kode | Tingkat | Temuan |
|---|---|---|
| M9 | Kritis | Mockup v2 tab "sudah dibagi" menyebut "**Harta Budi Rp 175.000.000**". Menurut bab 12.5 (dan komentar `munasakhat.ts`), yang dibagi lewat munasakhat hanya **bagian Budi dari harta mayit pertama**. Harta pribadi Budi, hutang, dan wasiatnya diselesaikan terpisah oleh ahli warisnya. Menyebutnya "harta Budi" menyesatkan |
| M10 | Tinggi | Aliran harus memperlihatkan perpindahan **per lapis** sebagai satu rantai: harta asal → dibagi → bagian si mayit berikutnya → dibagi lagi → … Di v2 hanya dua ubin terpisah tanpa garis sambung, dan pohonnya tidak beranimasi |
| M11 | Tinggi | Mayit yang **tidak mendapat bagian** dari mayit sebelumnya dilewati [R12-1] (`MUNASAKHAT_DILEWATI`). Keadaan 1 (*ikhtishar*) dihitung seolah mayit kedua tidak ada. Dua hal ini mengubah bentuk rantai, tapi belum ada cara menampilkannya ("Budi dilewati karena tidak mendapat dari ayahnya") |
| M12 | Tinggi | Sisa harta mayit yang tidak di-radd ke pasangan keluar sebagai baris `sisaKeluar:<mayit>` per lapis. Belum dirancang |
| M13 | Tinggi | **Satu sumber angka rupiah.** Engine hanya menghitung rupiah dari jami'ah akhir (pembulatan per orang). Rupiah per lapis di aliran (mis. "dari Budi Rp 29.166.666") adalah turunan. Jumlah rupiah per lapis bisa berbeda beberapa rupiah dari total per orang. Harus diputuskan mana sumbernya dan bagaimana selisihnya dilaporkan |
| M14 | Sedang | Orang yang sama menerima dari banyak lapis (Aminah dari suami, lalu dari anak, mungkin dari cucu). Rincian per orang bisa sampai puluhan baris di rantai panjang |

### 15c. Dampak skala ke setiap bagian layar

Hitungan kasar untuk rantai **50 generasi** (52 penerima, 50 mayit berurutan):

| Bagian | Bentuk v2 | Akibat di 50 generasi |
|---|---|---|
| Daftar penerima | satu baris per orang | 52 baris ≈ 52 × 90 px ≈ 4.700 px di HP; bagianmu tetap di atas, tapi "siapa dapat berapa" tidak bisa dipindai |
| Aliran per mayit | satu ubin per mayit | 50 ubin ≈ 50 × 160 px ≈ 8.000 px; tidak terlihat sebagai rantai |
| Pohon | satu gambar | 51 tingkat × ±100 px ≈ 5.100 px tinggi; layar penuh pun hanya memuat ±8 tingkat sekaligus |
| Animasi aliran | jalan sekali saat dibuka | 50 lompatan × ±1 detik ≈ 50 detik; aplikasi lama sudah mematikan aliran untuk pohon > 40 orang (`BATAS_ALIRAN`) |
| Tabel faraidh | satu tabel | munasakhat: kolom per mayit → 50 kolom angka 1–80 digit. Gabungan: × jumlah kemungkinan |
| Porsi harta | pita | 52 ruas; ruas kecil < 1 px, tidak terlihat |
| Langkah perhitungan | langkah 1–7 | per mayit 7 langkah → ±350 langkah |
| Kirim ringkasan | daftar nama + rupiah | 52 baris di WhatsApp |

### 15d. Kasus gabungan (rantai panjang + belum pasti + bersamaan)

| Kode | Tingkat | Temuan |
|---|---|---|
| X9 | Kritis | Ketidakpastian di lapis ke-k **menjalar** ke semua lapis sesudahnya. Bila Siti (generasi 1) hilang, setiap mayit sesudahnya yang mewarisi dari Siti, atau yang bagiannya bergantung pada ada-tidaknya Siti, ikut punya bagian ditahan. Tampilan harus bisa menunjuk "ditahan karena Siti" di lapis mana pun |
| X10 | Tinggi | Gharqa di tengah rantai memutus garis waris antara anggota kelompok, tetapi rantai tetap berlanjut lewat ahli waris masing-masing. Rantai bercabang, bukan garis lurus |
| X11 | Tinggi | "Kapan dihitung lagi" bisa banyak peristiwa yang tidak berurutan (bayi lahir, kabar Siti, khuntsa jelas, keadaan gharqa diingat). Setiap peristiwa membuka sebagian uang yang ditahan |
| X12 | Sedang | Lewat 256 kemungkinan, engine meminta data. Layar harus mengarahkan ke orang yang paling banyak menambah kemungkinan, bukan sekadar daftar |

### 15e. Animasi aliran di pohon (permintaan pemilik)

- Aplikasi lama sudah punya aliran (±2 detik, sekali per hasil, bisa diputar ulang) tapi hanya di pratinjau hero, dan hanya untuk
  satu lapis. Untuk munasakhat, rencana 1.1 menyebut "bagian tiba di orang yang sudah meninggal, berhenti sebentar, lalu
  mengalir lagi". Ini belum dibangun.
- Kendala dari ukur: 50 lapis × 1 detik terlalu lama, dan pohon tinggi tidak muat satu layar. Animasi harus bisa **mengikuti satu
  lapis**, kamera ikut bergerak, dan bisa dilompati. (Ini kendala, bukan rancangan.)
- Gerak harus bisa dimatikan (`prefers-reduced-motion`, pengaturan gerak yang sudah ada di aplikasi).

## 16. Cara memenuhi syarat dosen: munasakhat 20–50 generasi + kasus gabungan

Syarat: satu kasus bisa memuat rantai munasakhat 20–50 generasi, ditambah janin, orang hilang, khuntsa, dan meninggal
bersamaan. Dari ukur 15a, **engine sudah benar dan sanggup**; yang perlu dikerjakan adalah kecepatan, batas kemungkinan, dan
tampilan. Tidak ada aturan fikih yang diubah.

### 16a. Kecepatan (tanpa mengubah hasil)

| Cara | Isi | Usaha | Catatan |
|---|---|---|---|
| K1. Hitung di latar (Web Worker) | `jalankan()` pindah ke worker; layar menampilkan "Menghitung 50 generasi…" dengan kemajuan per mayit dan tombol Batal; layar tidak membeku | sedang | Paling penting. Engine sudah fungsi murni tanpa I/O, jadi cocok dipindah |
| K2. Hitung sekali | Sekarang `jalankan()` dipanggil dua kali (`Hasil` dan `HasilOkLayar`). Cukup sekali | kecil | Langsung memotong waktu separuh |
| K3. Pakai ulang lapis yang sama antar kemungkinan | Di kasus belum pasti, lapis sebelum orang yang belum pasti identik di semua kemungkinan. Lapis itu cukup dihitung sekali | sedang | Optimasi hisab [KH]. Wajib dijaga dengan tes: hasil harus identik bit demi bit dengan cara sekarang |
| K4. Ukur di browser HP | Target: < 2 detik untuk 50 generasi + 12 kemungkinan di HP kelas menengah | kecil | Dasar keputusan K3 dan B2 |

### 16b. Batas 256 kemungkinan

| Cara | Isi | Usaha | Catatan |
|---|---|---|---|
| B1. Pertahankan batas, tapi tanya dengan pintar | Bila lewat batas, tampilkan orang yang paling banyak menambah kemungkinan lebih dulu ("Memastikan keadaan bayi mengurangi 288 menjadi 48 kemungkinan") | kecil | Sesuai prinsip "data kurang → tanya" |
| B2. Naikkan batas setelah K1 + K4 | Mis. 1.024 bila worker dan ukur membuktikan masih cepat | kecil | `BATAS_DUNIA` adalah batas keras di CLAUDE.md: **keputusan pemilik** |
| B3. Pisah sumber yang saling lepas | Ketidakpastian di cabang keluarga yang tidak saling menyentuh tidak perlu dikalikan; tiap orang hanya bergantung pada sumber di cabangnya | besar | Perlu bukti matematis bahwa hasil aqall dan mauquf identik dengan perkalian penuh, lalu tes. Tanpa bukti, jangan dipakai. **Perlu verifikasi** |

### 16c. Angka sangat besar

- Rupiah tetap biasa (harta tetap ukuran wajar).
- Jami'ah dan saham 30–80 digit: tampil ringkas ("angka 80 digit") dengan tautan "salin angka lengkap"; tabel per mayit
  dibuka satu per satu, bukan semua kolom sekaligus.

### 16d. Tampilan rantai panjang

Dibahas di HMW-11 di bawah.

**Rekomendasi:** K1 + K2 + K4 dulu (wajib), B1 (wajib), K3 bila ukur HP belum mencapai target, B2 bila pemilik setuju, B3 hanya
setelah ada bukti. Dengan ini syarat dosen terpenuhi tanpa mengakali hukum: rantai berapa pun panjangnya tetap dihitung
penuh, dan kasus gabungan di atas batas tetap dijawab lewat pertanyaan, bukan galat.

## 17. HMW lanjutan (dari audit 14–15)

Skor: Paham · Dampak · Usaha (kecil = murah). Ide pertama = paling sederhana.

### HMW-10. Bagaimana agar perpindahan "harta dibagi, lalu bagian seseorang dibagi lagi" terlihat sebagai satu rantai? (M1, M9–M13)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Linimasa vertikal "estafet": tiap lapis satu blok (siapa meninggal, menerima berapa dari siapa, dibagi ke siapa), disambung garis; uang yang diteruskan tampil sebagai pita yang turun ke blok berikutnya | tinggi | tinggi | sedang |
| B. Diagram aliran (Sankey): lebar pita = rupiah | sedang | tinggi | besar |
| C. Pohon beranimasi saja | sedang | sedang | sedang |
| D. Tabel matriks orang × lapis | rendah | sedang | kecil |

**Pilih A, disinkronkan dengan pohon (C).** Mengetuk satu blok menyalakan lapis itu di pohon dan menjalankan alirannya.
Judul blok "Bagian Budi dari harta Pak Ahmad: Rp 175.000.000", bukan "Harta Budi" (M9). Mayit yang dilewati dan keadaan 1
tampil sebagai blok tipis berketerangan (M11). Sisa yang keluar tampil sebagai cabang ke luar (M12). Rupiah per lapis diberi
catatan bila selisih dengan total (M13).

### HMW-11. Bagaimana agar rantai 20–50 generasi tetap terbaca? (15c)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Lipat lapis: tampilkan lapis pertama, lapis yang menyangkut "kamu", dan lapis terakhir; sisanya "12 lapis di antaranya" yang bisa dibuka | tinggi | tinggi | kecil |
| B. "Jalur hartaku": dari almarhum pertama ke kamu (atau orang yang dipilih), hanya lapis yang dilalui | tinggi | tinggi | sedang |
| C. Cari orang + lompat ke generasi | tinggi | sedang | kecil |
| D. Peta mini di samping pohon | sedang | sedang | sedang |

**Pilih A + B + C.** Daftar penerima diberi pencarian dan dikelompokkan per generasi. Ringkasan WhatsApp hanya memuat
total per orang. PDF memuat semuanya.

### HMW-12. Bagaimana agar pohon cukup besar, bisa diperbesar dan dibuka layar penuh, dan alirannya hidup? (P1, P5, 15e)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Ubin pohon selebar halaman dengan alat: perbesar, perkecil, pas layar, layar penuh (memakai `PohonLayarPenuh` yang sudah ada) | tinggi | tinggi | kecil |
| B. Aliran per lapis: pandangan pohon bergerak mengikuti uang, berhenti di orang yang meninggal, lalu lanjut; bisa dijeda dan dilompati; mati bila gerak dikurangi | tinggi | tinggi | sedang |
| C. Lipat cabang yang tidak menerima apa pun | sedang | sedang | sedang |

**Pilih A + B + C.** Animasi diputar saat ubin pohon atau blok aliran **aktif** (diketuk atau terlihat), bukan otomatis
seluruh rantai.

### HMW-13. Bagaimana agar pohon dan tabel faraidh bisa dibaca bersama tanpa ramai dan tanpa serba-terlipat? (P2, P3, P4, Q2)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Satu ubin dua panel: di laptop pohon (kiri, lebar) dan tabel (kanan) berdampingan dengan sorot silang; di HP satu panel dengan sakelar "Pohon / Tabel" | tinggi | tinggi | sedang |
| B. Tabel dua tingkat: baris awal ringkas (nama, bagian, rupiah); kolom hisab (asal masalah, tashih, saham) dibuka dengan "Tampilkan hitungan" | tinggi | tinggi | kecil |
| C. Tabel di bawah pohon, selalu terbuka | tinggi | sedang | kecil |
| D. Keduanya hanya di mode fokus | sedang | rendah | kecil |

**Pilih A + B.** Mengetuk baris tabel menyorot orangnya di pohon, dan sebaliknya. Jenis masalah tampil sebagai ubin kecil
selalu terlihat dengan satu kalimat awam ("Bagian pas dengan harta ('adilah)"), detailnya di dalam. Langkah perhitungan
menjadi pintu ke mode fokus (dibahas di tahap berikutnya), bukan daftar panjang di halaman.

### HMW-14. Bagaimana agar setiap keterangan jelas asalnya? (T1–T5)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Semua kalimat dari jejak engine + templat diksi; tiap kalimat fikih punya tautan rujukan kecil (dalil, KB) | tinggi | tinggi | sedang |
| B. Penanda "dari isianmu" untuk data masukan (harta, keadaan, urutan), yang membuka langsung ke isian itu di Periksa | tinggi | tinggi | sedang |
| C. Ubin "Data yang dipakai" (ringkasan isian) | tinggi | sedang | kecil |

**Pilih A + B + C.** Mockup berikutnya hanya memakai kalimat yang ada di jejak engine untuk kasus yang sama.

### HMW-15. Bagaimana agar meninggal bersamaan mudah dipahami? (G1–G6)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Kalimat pembuka dari jawaban keadaan ("Kamu menjawab: meninggal serentak") + alasan satu kalimat dengan rujukan [R13-10] | tinggi | tinggi | kecil |
| B. Pohon: garis waris antara anggota yang meninggal bersamaan digambar terputus, dengan penanda kejadian | tinggi | tinggi | kecil |
| C. Satu daftar total per orang, rincian "dari harta Pak Ahmad · dari harta Budi" di dalam baris (pola yang sama dengan munasakhat) | tinggi | tinggi | kecil |
| D. Keadaan terlupakan [SYF] memakai pola ditahan (HMW-17) dengan dua skenario urutan | tinggi | sedang | sedang |

**Pilih A + B + C + D.**

### HMW-16. Bagaimana agar informasi kasus lengkap dan terkumpul di satu tempat? (I11–I13, L12, L13, 14i)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Ubin "Tentang kasus ini": nama kasus (bisa diubah), madzhab + catatan sumber, harta kotor → potongan → bersih, keadaan khusus yang dipilih, satuan pembulatan, tanggal dihitung | tinggi | tinggi | kecil |
| B. Nama kasus bisa diubah langsung di judul (ikon pensil) | tinggi | sedang | kecil |
| C. Madzhab tetap di judul sebagai label kecil | tinggi | sedang | kecil |

**Pilih A + B; madzhab pindah ke ubin informasi** (ide pemilik). Label madzhab kecil tetap di bawah judul hanya bila bukan
Syafi'i, karena angkanya berbeda dari bawaan.

### HMW-17. Bagaimana agar uang yang ditahan karena banyak sebab tetap jelas? (X1–X12)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Ubin "Uang ditahan" berisi satu baris per sebab: "Rp X untuk bayi Aminah · dibuka setelah lahir", "Rp Y untuk Siti · dibuka setelah ada kabar" | tinggi | tinggi | kecil |
| B. Pemilih kemungkinan per sumber (bayi: …, Siti: …), angka di daftar ikut berubah | tinggi | tinggi | sedang |
| C. Pohon menandai sumber ketidakpastian dan cabang yang terdampak | tinggi | sedang | sedang |
| D. Tiap orang: "pasti Rp X · bisa bertambah sampai Rp Y" | tinggi | tinggi | kecil |

**Pilih A + B + C + D.** Bila lewat batas kemungkinan: B1.

### HMW-18. Bagaimana agar semua materi lama tetap ada tanpa menambah beban? (L1–L13, C1'–C4')

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Tiga lapis tetap: **keluarga** (bagianmu, daftar, uang ditahan, bagikan) → **pemeriksa** (pohon + tabel, jenis masalah, aliran, informasi kasus) → **belajar** (pintu mode fokus, mode tebak, banding madzhab) | tinggi | tinggi | sedang |
| B. Lembar orang lengkap lagi: kenapa segitu, cara menghitung, kapan dapat berapa, terdampak, dalil, ubah jumlah | tinggi | tinggi | kecil |
| C. Pecahan dan persen kecil di baris daftar; Atur tampilan dan Sembunyikan nominal di menu titik-tiga ubin daftar | tinggi | sedang | kecil |
| D. Warna bermakna tetap: hijau = menerima, kuning = ditahan, abu = meninggal/tidak mendapat, oranye = aliran; ubin lain netral | tinggi | sedang | kecil |

**Pilih A + B + C + D.** Satu aksi satu tempat (Kirim ringkasan hanya di hero). Simpan, Bagikan tautan, dan Simpan file kasus
di menu aksi.

## 18. Prinsip tambahan

9. **Rantai, bukan kepingan:** perpindahan harta antar-lapis selalu terlihat tersambung, di daftar, aliran, dan pohon.
10. **Skala dulu:** setiap bagian dirancang untuk 50 lapis dan 50 penerima, lalu dicek dengan kasus kecil.
11. **Setiap kalimat punya asal:** jejak engine, rujukan, atau isian pengguna. Tidak ada kalimat karangan.
12. **Lambat itu tampilan, bukan alasan:** hitungan panjang berjalan di latar dengan kemajuan dan Batal.

## 19. Pertanyaan sebelum konsep

1. B2: boleh menaikkan `BATAS_DUNIA` (batas keras di CLAUDE.md) setelah ada worker dan ukur HP? Bila ya, sampai berapa?
2. B3 (memisah sumber yang saling lepas) mau dijajaki sebagai riset engine terpisah, atau cukup B1 dulu?
3. Apakah dosen punya contoh kasus gabungan atau rantai panjang yang akan dipakai menguji? Bila ada, dijadikan kasus uji.

## 19a. Keputusan: model "cepat untuk yang biasa, tetap jalan untuk yang ekstrem" (2026-11-17)

Pemilik: jangan merusak sistem atau performa; dosen realistisnya menguji ±5 generasi; tidak ada contoh kasus dari dosen.

Dasar: ukur 15a. Kasus 5 generasi dengan hilang + janin = **12 ms**. Kasus realistis tidak butuh perubahan besar.

1. **Engine tidak diubah.** Tidak ada perubahan aturan, struktur, atau `BATAS_DUNIA` (tetap 256).
2. **Jalur cepat tetap seperti sekarang:** hitung langsung di layar, cukup sekali (K2, memperbaiki panggilan ganda).
3. **Jalur berat hanya bila perlu:** web memperkirakan beban sebelum menghitung (jumlah mayit berurutan × jumlah kemungkinan).
   Di atas ambang, perhitungan dipindah ke latar (worker) dengan layar "Menghitung…", kemajuan, dan Batal. Di bawah ambang,
   tidak ada worker. Ambang ditentukan dari ukur di browser HP (K4), bukan ditebak.
4. **Tampilan bertahap untuk rantai panjang:** lapis dilipat, daftar dikelompokkan per generasi, pohon dan aliran digambar
   untuk bagian yang terlihat; animasi mati otomatis di atas ambang (pola `BATAS_ALIRAN` yang sudah ada).
5. **Lewat 256 kemungkinan:** pertanyaan pintar (B1), bukan galat.
6. **Ditunda (YAGNI):** K3 (pakai ulang lapis) dan B3 (memisah sumber) hanya diriset bila ukur HP membuktikan jalur berat
   masih terlalu lambat untuk kasus yang wajar.
7. **Kasus uji buatan sendiri** (tidak ada contoh dari dosen): rantai 5 generasi + janin + orang hilang + meninggal bersamaan
   sebagai kasus peraga, plus 20 dan 50 generasi sebagai tes ketahanan dengan batas waktu, supaya perubahan berikutnya tidak
   diam-diam membuatnya lambat. Hasilnya dicocokkan ke KB sebelum dipakai.

## 20. Pertanyaan lama (sudah dijawab)

1. Ada bagian lain yang perlu diaudit? (Belum: mode Belajar secara rinci, Banding madzhab, isi PDF lengkap, dan teks Kirim ringkasan.)
2. Untuk kasus gabungan (14h), apakah ada contoh kasus nyata yang ingin dijadikan acuan, atau saya susun dari kasus uji bab 16?

## 21. Mockup v3 (2026-11-17)

Berkas yang sama: [mockup-hasil-per-kasus.html](mockup-hasil-per-kasus.html). Tab: Biasa · Berurutan (3 lapis: Pak Ahmad → Budi →
Aminah) · Rantai 12 generasi · Hamil + hilang (gabungan, 12 kemungkinan) · Menunggu lahir · Meninggal bersamaan (serentak /
terlupakan) · Cara mencoba.

- **Angka dari engine.** Saham per lapis, per kemungkinan, dan per harta diambil dari `jalankan()` untuk keluarga contoh yang sama
  (dibuat dengan tes sementara, lalu dihapus). Rupiah dihitung di mockup dari pecahan itu dengan BigInt. Total rantai 3 lapis dicek
  sama dengan nominal engine (Siti 173.958.333, Zahra 104.166.666, Rina 21.875.000).
- **Susunan bento:** hero (nama kasus bisa diubah, status, judul, kalimat dengan rujukan, bagianmu, 2 ubin) → daftar (pecahan
  · persen kecil, alasan + rujukan, rincian per lapis/harta, Penjelasan lengkap, pilihan pembulatan Rp 1/100/1.000) + kolom kanan
  (uang ditahan per sebab, jenis masalah dalam bahasa awam, tentang kasus ini: madzhab + sumber, harta kotor → bersih "dari
  isianmu", keadaan, pembulatan, tanggal) → aliran estafet per lapis (lapis tengah dilipat bila > 5) → pohon + tabel berdampingan
  (perbesar, perkecil, pas, layar penuh, putar aliran; sorot silang; HP: sakelar Pohon/Tabel; tabel "Tampilkan hitungan"; tabel
  per lapis untuk rantai; pemilih kemungkinan per sumber untuk gabungan) → bagikan dan simpan · langkah selanjutnya · pelajari
  (pintu mode fokus, tebak, banding madzhab).
- **Lembar orang:** rupiah, pecahan, persen, kenapa segitu, dari mana saja (per lapis), kapan dapat berapa, dalil, ubah jumlah.
- **Meninggal bersamaan:** kalimat dari jawaban keadaan + rujukan [R13-10]; garis waris putus (merah putus-putus) di pohon; satu daftar
  total dengan rincian per harta; keadaan terlupakan = ditahan dengan dua kemungkinan urutan.
- Dicek di browser: semua tab tanpa galat konsol; laptop 1200 px dan HP 375 px tanpa gulir mendatar halaman; aliran per lapis,
  sorot silang, pemilih kemungkinan, cari orang, lipat lapis, ubah nama. Tidak dicek: layar penuh native di semua browser,
  pembaca layar, kontras otomatis.
- Kalimat alasan di mockup disusun dari kode alasan jejak engine (mis. `kelasD` [R13-15], `aqall` [R13-8], `MANI istibham` [R13-10]);
  di aplikasi, kalimatnya wajib dari templat diksi.

## 22. Mockup v4 (2026-11-17), dari 12 catatan pemilik atas v3

| Catatan | Di v4 |
|---|---|
| Tentang kasus belum memuat tawafuq, tadakhul, asal masalah, jami'ah | Ubin "Tentang kasus ini" dua bagian: KASUS (madzhab + sumber, harta kotor − potongan "dari isianmu", keadaan, jumlah ahli waris per status, pembulatan, tanggal) dan HITUNGAN (asal masalah + alasannya, tashih, 'aul/radd; munasakhat: masalah tiap mayit, perbandingan saham, jami'ah) |
| Penjelasan lengkap pakai modal; HP pakai laci | Modal di laptop, laci bawah di HP |
| Pembulatan berupa penjumlahan; pilihan jelas dengan keterangan | Di bawah daftar: Dibagikan + Ditahan + Sisa pembulatan = Harta. Di bawahnya "Pilih jenis pembulatan bagian tiap orang": tiga pilihan berketerangan (transfer bank / angka rapi / tunai) |
| Pengelompokan daftar | Menerima · Ditahan (atau Menunggu bayi lahir) · Meneruskan bagiannya · Tidak mendapat bagian |
| Penjelasan lengkap kurang menjawab, tidak seperti versi lama | Isi mengikuti `ModalOrang` sebelum Logivo: Bagiannya (pecahan, persen, nominal), Kenapa segitu, Cara menghitungnya (saham dari tashih × harta), Ahli waris lain yang terdampak, Kapan dapat berapa (teks ahwal dari konten aplikasi, baris "kasus ini" ditandai), Dalilnya (syahid ayat dari konten), Ubah jumlah, Oke paham |
| Jenis masalah: kategori dulu, lalu jenis, lalu penjelasan | "Ada yang belum pasti" → "Haml dan mafqud" → chip istilah → butir: siapa, berapa kemungkinan, jami'ah, aturan pemberian. Munasakhat: keadaan ke berapa, berapa lapis, siapa yang meninggal kemudian. Gharqa: keadaan ke berapa dari 5 |
| Munasakhat: jelaskan apa yang harus dibagi | Kotak hijau di daftar: "Yang dibagi sekarang: harta Pak Ahmad, langsung ke 3 orang, sekali saja. Lapis-lapisnya hanya menjelaskan." Judul hero: "Bagikan harta Pak Ahmad langsung ke 3 orang" |
| Tabel faraidh seperti di kitab | Tabel munasakhat ala kitab (KB 12.3): kolom masalah tiap mayit dengan pengali oranye di kepala kolom, perbandingan "14 : 24 → tawafuq", kolom jami'ah sesudahnya, sel mayit ditandai ✕. Dihitung dari saham engine dan dicek sama dengan jami'ah 288 engine. Kasus biasa: Asal masalah 24 → × 3 → 72. Kasus belum pasti: kolom per kemungkinan + pengali ke jami'ah 10.080 + "Diberi sekarang" |
| Aliran munasakhat harus dibaca satu-satu | Rute ringkas di atas ("1. Pak Ahmad · Rp 300 jt → 2. Budi · Rp 175 jt → 3. Aminah · Rp 66,7 jt", bisa diketuk). Tiap lapis berupa tabel: Penerima · Rupiah · Selanjutnya ("diterima" atau "→ lapis 3"). Judul menyebut asal: "Bagiannya dari Pak Ahmad (lapis 1) dan Budi (lapis 2)" |
| Istilah dijelaskan dengan popover | Istilah bergaris titik (munasakhat, jami'ah, tawafuq, tabayun, inqisam, radd, haml, mafqud, gharqa, mauquf, dll.) membuka penjelasan dari glosarium KB bab 15 saat diarahkan atau diketuk |
| Penjelasan lengkap terlalu banyak klik | Ketuk baris (atau ubin bagianmu, atau kotak di pohon) langsung membuka modal |
| Kode QS 4:12, R06 membingungkan | Dihapus dari baris. Dalil tampil di dalam modal sebagai ayat Arab + artinya + nama surah |

Dicek di browser: semua tab tanpa galat konsol; laptop 1200 px dan HP 375 px tanpa gulir mendatar halaman (tabel bergulir di dalam kotaknya dengan kolom nama tetap); modal di laptop dan laci di HP; tabel munasakhat cocok dengan saham engine (cek otomatis di konsol).
Belum: dzawil arham (belum ada contoh kasus engine di mockup), pembaca layar.

### 22a. Revisi v4 (catatan putaran berikutnya)

- Hitungan di "Tentang kasus ini": tiap baris = label · **angka tebal** · keterangan kecil (mis. "Bagian Budi : masalahnya · **14 : 24** · tawafuq, dibagi 2 → 7 : 12").
- Jenis masalah: kategori → nama → chip istilah → ringkasan berlabel (Keadaan, Jumlah lapis, Meninggal kemudian, Yang dibagi). Jami'ah pindah ke Hitungan.
- Pembulatan: pilihan besar dihapus. Baris "Sisa pembulatan … · ubah pembulatan" membuka modal dengan tiga pilihan baris penuh (gaya kuis) beserta sisanya masing-masing.
- Modal: kepala berwarna tegas (hijau tua = menerima, kuning tua = ditahan, abu tua = tidak mendapat/meneruskan). Yang terbuka: Bagiannya, Kenapa segitu, Cara menghitungnya. Yang terlipat (dengan judul dan keterangan jumlah): Ahli waris lain yang terdampak, Kapan dapat berapa, Dalilnya.
- Munasakhat di modal: "Kenapa segitu" per lapis dengan rupiahnya, ditutup alasan totalnya; orang yang meninggal kemudian: kepada siapa bagiannya dibagi.
- Baris daftar tidak lagi memuat alasan; alasan hanya di modal.
- Baris tabel faraidh, baris tabel aliran, dan kotak pohon membuka modal yang sama.
- Sakelar Pohon/Tabel hanya muncul di layar sempit (keduanya tidak muat berdampingan); di laptop keduanya tampil bersamaan tanpa sakelar (sebelumnya sakelar ikut tampil karena urutan CSS).
- Petunjuk bila ada bagian tersembunyi: "Geser ke kanan untuk kolom lain →" di kaki tabel dan "Geser atau perkecil untuk melihat semua" di pohon, muncul hanya bila memang terpotong; lipatan generasi/lapis tetap berlabel jumlahnya.

## 23. Audit + HMW: Tentang kasus, Jenis masalah, kalimat pembuka (2026-11-17)

Pemilik mengingatkan: perubahan tampilan **tidak langsung diedit**. Harus lewat JTBD → HMW → ide → dipilih. Bagian ini mengikuti
urutan itu. Mockup belum diubah.

### 23a. JTBD yang dilayani

- **H-f (pemeriksa):** "Saat mencocokkan dengan ustadz atau kitab, saya ingin tahu **jenis kasusnya** dan **bagaimana angkanya
  disusun**, supaya bisa menelusuri langkah yang sama." Ukuran: jenis kasus dan angka kunci (asal masalah, tashih, jami'ah)
  ketemu dalam satu kali pandang, dengan nama yang sama seperti di kitab.
- **H-a/H-c (keluarga):** "Saat membuka hasil, saya ingin langsung paham **apa yang terjadi** pada keluarga ini (siapa yang
  meninggal, urutannya, siapa yang belum pasti), supaya percaya angkanya." Ukuran: bisa diceritakan ulang tanpa istilah.
- **Semua jenis kasus memakai pola yang sama**, supaya orang yang sudah membaca satu kasus tidak perlu belajar lagi di kasus lain.

### 23b. Temuan (audit)

| Kode | Bagian | Temuan |
|---|---|---|
| J1 | Tentang kasus | KASUS memakai daftar polos, HITUNGAN memakai kotak berlatar dengan angka tebal. Bobotnya sama, tapi rupanya berbeda, sehingga terlihat seolah HITUNGAN lebih penting |
| J2 | Tentang kasus | Label kiri tidak sejajar ukuran dan jenisnya: "Madzhab" lalu keterangan panjang dua baris, sementara "Dihitung" hanya tanggal. Nilai yang bisa diubah (ganti, ubah, dari isianmu) berupa tautan kecil di tengah kalimat |
| J3 | Jenis masalah | Tidak seragam antar-kasus: biasa = "Kasus biasa / Bagian pas dengan harta"; munasakhat = "Meninggal berurutan / Munasakhat" + chip "Munasakhat" (**ditulis dua kali**); belum pasti = "Ada yang belum pasti / Haml dan mafqud" + chip |
| J4 | Jenis masalah | "Keadaan **3 dari 3**": "dari 3" tidak bermakna bagi siapa pun. "Keadaan 3" sendiri butuh penjelasan (KB 12.2: keadaan 1 = ahli waris mayit berikutnya sama persis dengan sisa ahli waris sebelumnya; 2 = terpisah total, lebih dari satu; 3 = selain itu), tapi tidak bisa disorot |
| J5 | Jenis masalah | "Meninggal kemudian: Budi, lalu Aminah" membingungkan: siapa yang pertama (Pak Ahmad) tidak disebut, dan istilah kitab yang lazim adalah **mayit pertama, mayit kedua, …** (KB 12.3). "Jumlah lapis" memakai istilah kita sendiri, bukan istilah kitab |
| J6 | Jenis masalah | "Ahli waris" dan "'Aul / radd" muncul di ubin Jenis **dan** di Tentang kasus (dua tempat, satu fakta) |
| J7 | Kalimat pembuka (hero) | Judul dan kalimat ditulis tangan per kasus ("Bagikan harta Pak Ahmad langsung ke 27 orang", "Setiap putra meninggal sesudah ayahnya… Contoh ketahanan rantai panjang"). Di aplikasi nyata kalimat seperti ini harus disusun otomatis dari data; untuk kasus gabungan (berurutan + hamil + bersamaan) kalimat bebas akan panjang, tidak seragam, dan sulit diuji |
| J8 | Kalimat pembuka | Kalimat menjelaskan sebab (siapa meninggal kapan) dan sekaligus perintah ("Bagikan … langsung ke 27 orang"). Dua tugas dalam satu kalimat |

### 23c. HMW dan ide

#### HMW-19. Bagaimana agar "Tentang kasus ini" terbaca seragam, dengan bobot yang sama untuk data kasus dan hitungan? (J1, J2, J6)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Satu pola baris untuk semua: label kecil di atas, **nilai tebal**, keterangan kecil di bawah; KASUS dan HITUNGAN sama-sama memakai pola ini, dipisah judul kecil saja | tinggi | tinggi | kecil |
| B. Dua kolom berdampingan (Kasus kiri, Hitungan kanan) dalam pola tabel | sedang | sedang | kecil |
| C. Satu daftar tanpa pemisah | sedang | rendah | kecil |

**Usul: A.** Aksi ubah (ganti madzhab, ubah keadaan, ubah harta) dipindah ke ujung kanan baris sebagai ikon pensil, tidak di tengah kalimat.
Fakta yang sama hanya di satu tempat: "Ahli waris" dan "'Aul/radd" tinggal di Tentang kasus.

#### HMW-20. Bagaimana agar ubin Jenis masalah seragam di semua kasus, tanpa pengulangan, dan istilahnya bisa dipelajari? (J3, J4, J5)

Kerangka seragam yang diusulkan (semua kasus mengisi baris yang sama; baris yang tidak relevan tidak dirender):

| Baris | Biasa | Berurutan | Belum pasti | Bersamaan |
|---|---|---|---|---|
| **Jenis kasus** | Biasa | Munasakhat (meninggal berurutan) | Haml · Mafqud | Gharqa (meninggal bersamaan) |
| **Kondisi** | 'Adilah | Keadaan 3 | 12 kemungkinan | Keadaan 1: serentak |
| **Mayit** | 1: Pak Ahmad | 1: Pak Ahmad · 2: Budi · 3: Aminah | 1: Pak Ahmad | Pak Ahmad dan Budi (bersamaan) |
| **Yang belum pasti** | – | – | Janin Aminah · Siti (hilang) | – |
| **Yang dibagi** | Harta Pak Ahmad | Harta Pak Ahmad saja | Harta Pak Ahmad, sebagian ditahan | Dua harta, terpisah |

Ide penyajian:

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Daftar berlabel seperti tabel di atas; tiap istilah (munasakhat, keadaan 3, 'adilah, gharqa) bisa disorot untuk penjelasan; tanpa chip | tinggi | tinggi | kecil |
| B. Kartu kecil per baris (ubin mini) | sedang | sedang | sedang |
| C. Satu kalimat ringkas ("Munasakhat keadaan 3, tiga mayit") | sedang | rendah | kecil |

**Usul: A.** Chip dihapus (penyebab dobel). "Dari 3" dihapus. "Keadaan 3" disorot → "Ahli waris mayit berikutnya tidak sama persis
dengan sisa ahli waris mayit sebelumnya (KB 12.2)". Baris **Mayit** memakai istilah kitab (mayit 1, 2, 3) dan sekaligus
menyebut urutannya, menggantikan "meninggal kemudian" dan "jumlah lapis". Untuk rantai panjang: "1: Pak Ahmad · 2–13: Putra
gen. 1–12".

#### HMW-21. Bagaimana agar judul dan kalimat pembuka seragam, bisa disusun otomatis dari data, dan tidak membingungkan di kasus apa pun? (J7, J8)

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Judul tetap "Pembagian harta {almarhum}" + satu baris status dari templat ("Dibagi ke 3 orang" / "Sebagian ditahan" / "Ditunda sampai bayi lahir") + deret fakta pendek berupa label (mis. "3 mayit berurutan", "1 janin", "1 hilang") | tinggi | tinggi | kecil |
| B. Kalimat templat bersambung ("Harta {almarhum} dibagi ke {n} orang. {mayit lain} meninggal sesudahnya…") | sedang | sedang | sedang |
| C. Tanpa kalimat; hanya judul dan ubin angka | tinggi | rendah | kecil |

**Usul: A.** Judul tidak lagi berupa perintah ("Bagikan … langsung ke …"); perintah pindah ke kotak "Yang dibagi sekarang" di
daftar. Cerita lengkap tetap ada di ubin Jenis masalah (baris Mayit) dan aliran. Semua teks lewat templat diksi.

### 23d. Pertanyaan untuk pemilik

1. HMW-19: setuju pola A (satu pola baris, pensil di kanan)?
2. HMW-20: setuju kerangka lima baris (Jenis kasus, Kondisi, Mayit, Yang belum pasti, Yang dibagi) dengan istilah kitab "mayit 1, 2, 3"?
3. HMW-21: setuju judul tetap "Pembagian harta {almarhum}" + status + label fakta, tanpa kalimat bebas?

### 23e. Urutan kerja berikutnya (pemilik, 2026-11-17)

Layar Hasil (ini) → **mode fokus** (langkah demi langkah pembagian) → penyempurnaan informasi → mode AI (cerita) dan seterusnya.

### 23f. Diterapkan ke mockup (pemilik: "coba buat mockup nya")

- HMW-19 A: "Tentang kasus ini" KASUS dan HITUNGAN memakai satu pola baris (label · nilai tebal · keterangan), pensil di kanan untuk madzhab, harta, ahli waris, pembulatan. Baris Keadaan pindah ke Jenis masalah.
- HMW-20 A: ubin "Jenis masalah" lima baris seragam (Jenis kasus · Kondisi · Mayit · Yang belum pasti · Yang dibagi); chip dihapus; "Keadaan 3", "Keadaan 1: serentak", "'Adilah", "Munasakhat", "Haml", "Mafqud", "Gharqa" bisa disorot.
- HMW-21 A: judul "Pembagian harta {almarhum}" + status templat + label fakta ("3 mayit berurutan", "1 janin · 1 hilang"); tanpa kalimat bebas.
Dicek: semua tab tanpa galat; laptop 1200 px dan HP 375 px tanpa gulir mendatar; pensil pembulatan membuka modal.

## 24. Audit + HMW: bahasa ringkasan, aliran, bagian tersembunyi, ketebalan, tabel bertahap, penjumlahan, ubin atas (2026-11-17)

Pemahaman dikonfirmasi pemilik (7 poin). Filter penjumlahan berlaku untuk **semua** jenis kasus. Mockup belum diubah.

### 24a. Temuan

| Kode | Temuan |
|---|---|
| B7 | "27 menerima · 12 meneruskan" memakai kata kerja tanpa objek; "meneruskan" tidak dimengerti tanpa konteks |
| B8 | "Bagaimana hartanya mengalir", "lapis", tanda →, dan keterangan "Penjelasan rinci. Tiap lapis: …" memakai istilah buatan kita; panjang dan teknis |
| B9 | Generasi yang dilipat hanya diberi tombol di bawah daftar; di antara "Generasi 2" dan "Generasi 13" tidak ada tanda bahwa ada yang hilang |
| B10 | Generasi 13 menampilkan pecahan "—" dan persen "0%" karena penyebutnya terlalu panjang dan persennya < 0,01%. Terkesan data kosong |
| V11 | Nilai di Jenis masalah dan Tentang kasus (700) lebih tebal dari judul ubin (600) dan judul generasi. Hierarki terbalik |
| T6 | Tabel hanya menampilkan hasil per tahap, tidak menampilkan **proses**: pecahan awal → disamakan penyebutnya → tashih → jami'ah → rupiah |
| R14 | "Sisa pembulatan, dibulatkan ke Rp 1 · ubah pembulatan" panjang dan tautannya tenggelam di kalimat |
| R15 | Baris penjumlahan (Dibagikan, Ditahan, dari harta X) hanya angka; tidak bisa dipakai untuk melihat siapa saja di balik angka itu |
| D1 | Ubin atas berisi teks tulisan tangan ("Rp 87,5 jt", "Aminah dan Fatimah", "untuk Budi, Siti, dan bayi"); tidak dihitung dari data, jadi tidak bisa dipakai untuk kasus lain |

### 24b. HMW dan ide

**HMW-22. Bagaimana menyebut jumlah penerima dan yang meneruskan dengan singkat dan awam? (B7)**

| Ide | Paham | Panjang |
|---|---|---|
| A. "27 penerima · 12 meninggal sebelum dibagi" | tinggi | pendek |
| B. "27 orang mendapat bagian · 12 orang bagiannya diteruskan" | tinggi | sedang |
| C. "27 ahli waris hidup · 12 ahli waris wafat" | sedang | pendek |

**Usul: A.** Kata yang sama dipakai sebagai judul kelompok di daftar ("Penerima", "Meninggal sebelum dibagi").

**HMW-23. Bagaimana menamai dan menjelaskan bagian aliran dengan kata awam? (B8)**

| Ide | Judul | Keterangan | Penanda |
|---|---|---|---|
| A | "Jalan harta dari orang ke orang" | "Urut dari yang meninggal pertama. Bila penerimanya juga sudah meninggal, bagiannya dibagi lagi di bawahnya." | "dibagi lagi di langkah 2" |
| B | "Urutan pembagian" | "Siapa meninggal, dapat berapa, dan diberikan ke siapa." | "lanjut ke Budi" |
| C | "Dari Pak Ahmad sampai penerima terakhir" | (tanpa keterangan) | panah |

**Usul: B**, dengan penanda "lanjut ke {nama}" (bukan "→ lapis 3") dan judul tiap langkah "1. Pak Ahmad meninggal", "2. Budi meninggal", karena urutan meninggal adalah cara keluarga bercerita. Kata "lapis" tidak dipakai di layar; istilah kitab "mayit ke-2" ada di ubin Jenis masalah.

**HMW-24. Bagaimana menandai bagian yang tersembunyi di tempatnya, dan angka yang terlalu kecil? (B9, B10)**

| Ide | Paham | Usaha |
|---|---|---|
| A. Baris bayangan di posisi yang hilang: garis putus-putus + "Generasi 3–12 · 20 orang disembunyikan · Tampilkan" | tinggi | kecil |
| B. Tumpukan kartu tipis (efek kartu bertumpuk) | sedang | sedang |
| C. Tombol di bawah (seperti sekarang) | rendah | kecil |

**Usul: A**, pola yang sama untuk semua lipatan (generasi, langkah aliran tengah). Angka kecil: pecahan yang terlalu panjang ditulis "pecahan panjang" yang bisa disorot untuk angka lengkapnya; persen di bawah 0,01% ditulis "< 0,01%", bukan "0%".

**HMW-25. Bagaimana agar judul tetap paling menonjol? (V11)**

Satu skala ketebalan untuk seluruh layar: judul ubin 600 · ukuran lebih besar; nilai di baris info 500–600 · ukuran sama dengan teks; label 400 abu. Rupiah di daftar tetap 600 karena itu jawaban utama. **Usul langsung** (tidak perlu pilihan: ini perbaikan hierarki).

**HMW-26. Bagaimana menampilkan proses hitung di tabel tanpa membuatnya penuh? (T6)**

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Sakelar tahap di atas tabel: "Bagian · Asal masalah · Tashih · Jami'ah · Rupiah" (pil yang bisa dinyalakan/dimatikan); kolom mayit dan jami'ah selalu ada, yang ditampilkan/disembunyikan hanya kolom tahap rinci di dalamnya (pecahan awal, angka sebelum dikali, pengali) | tinggi | tinggi | sedang |
| B. Satu sakelar "Tampilkan proses" (semua tahap sekaligus) | tinggi | sedang | kecil |
| C. Tahap sebagai tab (satu tabel per tahap) | sedang | sedang | sedang |

**Usul: B dulu, dengan isi seperti A.** Bawaan: tabel ringkas (ahli waris, bagian, saham akhir, rupiah). "Tampilkan proses" membuka kolom berurutan: pecahan awal → asal masalah (dengan keterangan tawafuq/tadakhul/…) → tashih (pengali) → jami'ah (pengali per mayit) → rupiah. Pemilihan per tahap (A) bisa menyusul bila B terasa terlalu penuh. Ini juga akan dipakai ulang di mode fokus.

**HMW-27. Bagaimana agar pembulatan dan penjumlahan sederhana, dan tiap baris penjumlahan bisa menyaring daftar? (R14, R15)**

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Penjumlahan sebagai baris yang bisa diketuk ("Penerima Rp …", "Ditahan Rp …", "Dari harta Budi Rp …", "Sisa pembulatan Rp 1"). Mengetuk satu baris menyaring daftar di atasnya ke orang-orang di baris itu (penanda "Disaring: dari harta Budi · Tampilkan semua"); mengetuk lagi mengembalikan. Baris pembulatan berisi pil kecil "Rp 1 ▾" yang membuka modal pilihan | tinggi | tinggi | sedang |
| B. Pil saring terpisah di atas daftar ("Semua · Pak Ahmad · Budi · Aminah · Ditahan") + pembulatan sebagai pil di ujung baris sisa | tinggi | tinggi | sedang |
| C. Hanya pembulatan disederhanakan; tanpa saring | tinggi | rendah | kecil |

**Usul: A**, karena saringnya lahir dari angka yang sedang dibaca (orang bertanya "Rp 175 jt dari Budi itu ke siapa saja?"). Berlaku untuk semua kasus: biasa (penerima / tidak mendapat), munasakhat (per mayit: dari Pak Ahmad, dari Budi, dari Aminah), belum pasti (pasti / ditahan per sebab), bersamaan (per harta). Saat menyaring per mayit, rupiah yang tampil adalah bagian dari mayit itu, bukan total.

**HMW-28. Bagaimana memastikan ubin atas selalu dihitung dari data? (D1)**

Bukan pilihan desain; ini aturan pembuatan: setiap ubin = fungsi dari hasil (penerima, ditahan, mayit, harta), dengan templat diksi untuk teksnya:
- Bagianmu: rupiah orang "kamu" + kalimat alasan dari jejak; bila "kamu" kosong, ubin ini tidak dirender.
- Dibagi sekarang: jumlah rupiah penerima pasti + nama penerima (≤ 3 nama, lalu "dan n lainnya").
- Ditahan: jumlah ditahan + nama yang ditahan (aturan nama yang sama).
- Harta / Menerima / Mayit: dari ringkasan hasil.
Di mockup berikutnya ubin dihitung dengan fungsi yang sama dari data contoh, bukan teks tetap.

### 24c. Pertanyaan untuk pemilik

1. HMW-22 A ("27 penerima · 12 meninggal sebelum dibagi")?
2. HMW-23 B (judul "Urutan pembagian", langkah "1. Pak Ahmad meninggal", penanda "lanjut ke Budi")?
3. HMW-26: mulai dari satu sakelar "Tampilkan proses" (B), atau langsung pil per tahap (A)?
4. HMW-27 A (baris penjumlahan bisa diketuk untuk menyaring; pembulatan pil "Rp 1 ▾")?
HMW-24, 25, 28 langsung diterapkan karena bersifat perbaikan.

### 24d. Diterapkan ke mockup (pemilik setuju keempat usulan)

- HMW-22: "27 penerima · 12 meninggal sebelum dibagi"; judul kelompok daftar "Penerima" dan "Meninggal sebelum dibagi".
- HMW-23: "Urutan pembagian" · "Siapa meninggal, dapat berapa, dan diberikan ke siapa." · langkah "Budi meninggal" · kolom "Diberikan ke / Rupiah / Keterangan" · penanda "dibagi lagi di langkah 2". Kata "lapis" tidak tampil. (Penanda "lanjut ke Budi" diganti "dibagi lagi di langkah n" karena muncul di baris Budi sendiri.)
- HMW-24: baris bayangan putus-putus di tempat yang dilipat ("Generasi 3–12 · 20 orang disembunyikan · Tampilkan", "Langkah 3–12 · 10 langkah disembunyikan", "Meninggal sebelum dibagi · 12 orang disembunyikan"); "pecahan panjang" bisa disorot; "< 0,01%".
- HMW-25: judul ubin 700; nilai di Jenis masalah dan Tentang kasus 500; judul generasi 600 berwarna tinta.
- HMW-26: tombol "Tampilkan proses" di tabel: membuka asal masalah, pengali, perbandingan saham (tawafuq/inqisam) dan keterangan masalah; kolom mayit dan jami'ah selalu tampil.
- HMW-27: baris penjumlahan bisa diketuk untuk menyaring daftar (Penerima, Ditahan, Tidak mendapat bagian; munasakhat: "Harta Pak Ahmad dibagi", "Bagian Budi dibagi lagi", …, dengan rupiah dari orang itu saja; bersamaan: per harta). Penanda "Disaring: … · Tampilkan semua". Pembulatan = pil "Rp 1 ▾".
- HMW-28: ubin atas dan "Ahli waris" di Tentang kasus dihitung dari data daftar (jumlah, nama ≤ 3 lalu "dan n lainnya").
Dicek: semua tab tanpa galat; laptop 1200 px dan HP 375 px tanpa gulir mendatar; saring per mayit, baris bayangan, sakelar proses.

## 25. Audit + HMW: proses hitung bertahap dan penjelasan "dasar → penerapan" (2026-11-17)

Masukan pemilik: (1) "Tampilkan proses" belum menjawab: harus terlihat dari bagian awal tiap orang → asal masalah → 'aul/radd →
tashih → per orang, dan untuk munasakhat berlanjut ke masalah tiap mayit → perbandingan → jami'ah; bukan hanya hasil akhir,
karena web ini web edukasi; tiap tahap bisa ditampilkan/disembunyikan sendiri. (2) Penjelasan di modal dimulai dari **dasar**
(aturan umum + dalil, seperti bagian "Dalilnya" dan "Kapan dapat berapa"), lalu **penerapan** di kasus ini (kondisi apa yang
terpenuhi, apa yang bertambah/berkurang), divisualkan dengan baik. Berlaku di layar Hasil dan nanti di mode fokus.
Modal dibuat beberapa alternatif untuk dipilih; setelah dipilih, diintegrasikan ke mockup, lalu ke aplikasi.

### 25a. JTBD

- **H-g/H-f (belajar, mencocokkan):** "Saat mempelajari kasus ini, saya ingin melihat **setiap tahap** hitungan faraidh seperti di
  kitab, dan bisa memilih tahap mana yang ingin saya lihat, supaya saya paham dari mana tiap angka datang." Ukuran: dari bagian
  awal sampai rupiah bisa diikuti tanpa membuka sumber lain.
- **H-b (keluarga bertanya "kenapa"):** "Saat ditanya kenapa bagian seseorang segitu, saya ingin bisa menunjukkan **aturannya dulu**
  (dalil dan syarat), **lalu** bahwa syarat itu terpenuhi di keluarga kami, **lalu** hitungannya." Ukuran: penjelasan bisa
  dibacakan berurutan tanpa melompat.

### 25b. Temuan

| Kode | Temuan |
|---|---|
| P6 | "Tampilkan proses" hanya memunculkan keterangan di kepala kolom (pengali, "14 : 24 → tawafuq"); tidak ada tahap **bagian awal** (1/8, 1/6, sisa), tidak ada langkah penjumlahan (3 + 4 + 17 = 24), tidak ada tahap 'aul/radd dalam bentuk kolom tersendiri |
| P7 | Satu tombol untuk semua tahap: tidak bisa memilih hanya "asal masalah" atau hanya "jami'ah" |
| P8 | Munasakhat: tahap per mayit (masalah Budi dari bagian awalnya, perbandingan 14 : 24, pengali) hanya tersirat di angka kepala kolom |
| E1 | Modal sekarang: Bagiannya → Kenapa segitu → Cara menghitungnya → (terlipat) Kapan dapat berapa → (terlipat) Dalilnya. **Dasar ada di bawah dan terlipat**, padahal secara cara berpikir ia datang pertama |
| E2 | "Kenapa segitu" sudah menyebut penerapan ("karena ada Budi dan Siti") tetapi tidak menunjuk baris aturan mana yang terpenuhi, dan tidak menunjukkan apa yang **berubah** dari bagian dasar (1/4 → 1/8) |
| E3 | "Cara menghitungnya" melompat langsung ke 9/72 tanpa jembatan 1/8 → 3/24 → 9/72 |
| E4 | Untuk munasakhat, penjelasan per lapis berupa kalimat; penjumlahan (Rp a + Rp b + Rp c = total) tidak divisualkan |

### 25c. HMW

**HMW-29. Bagaimana menampilkan setiap tahap hitung faraidh, dari bagian awal sampai rupiah (dan sampai jami'ah), dengan tahap yang bisa dipilih?**

Tahap baku (diambil dari kolom tabel engine `fardh · ashl · aul/radd · tashih · perOrang · nominal`, ditambah tahap munasakhat):
1. Bagian awal (fardh / sisa) · 2. Asal masalah (+ perbandingan penyebut) · 3. 'Aul atau radd (bila ada) · 4. Tashih (bila ada) ·
5. Per orang · 6. Rupiah · (munasakhat) 7. Masalah tiap mayit · 8. Perbandingan bagian : masalah · 9. Jami'ah.

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. Tabel kitab + pil tahap di atasnya (tiap pil menyalakan kolomnya); di bawah tabel kotak "hitungan tahap ini" berisi penjumlahan (3 + 4 + 17 = 24) untuk tahap yang terakhir dinyalakan | tinggi | tinggi | sedang |
| B. Tabel bertahap dengan langkah (Tahap 1/6 · Sebelumnya · Berikutnya): tiap tahap menambah satu kolom dan menampilkan kotak dasar → penerapan → hitungan; ada pil "Semua tahap" | tinggi | tinggi | sedang |
| C. Kartu proses vertikal (satu kartu per tahap, berisi rumus dan hasil), tabel ringkas di bawahnya | tinggi | sedang | sedang |

**HMW-30. Bagaimana menyusun penjelasan orang dari dasar ke penerapan, dan memvisualkan perubahannya?**

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| A. **Urut dasar dulu**: Bagiannya → 1. Dasarnya (dalil + tabel "kapan dapat berapa", terbuka) → 2. Di kasus ini (baris aturan yang terpenuhi disorot + syaratnya dicentang: "Almarhum punya anak ✓ Budi, Siti") → 3. Hitungannya (1/8 → 3/24 → 9/72 → × harta) | tinggi | tinggi | kecil |
| B. **Tab di dalam modal**: Ringkas · Dasar · Hitungan | sedang | sedang | kecil |
| C. **Alur visual bertingkat**: garis vertikal bernomor dari aturan umum → syarat terpenuhi → bagian yang berlaku (dengan coretan 1/4 → 1/8) → hitungan → rupiah; munasakhat menambah cabang per lapis yang dijumlahkan | tinggi | tinggi | sedang |

### 25d. Rencana

Dibuat mockup alternatif terpisah: [mockup-hasil-penjelasan-alternatif.html](mockup-hasil-penjelasan-alternatif.html)
dengan modal A, B, C (untuk Aminah di kasus biasa, Siti di kasus berurutan, dan suami di kasus 'aul) dan tabel proses A, B, C
(kasus biasa, 'aul, dan berurutan). Pemilik memilih; pilihan diintegrasikan ke mockup utama, lalu ke aplikasi.
Kasus 'aul (suami, ibu, 2 saudari kandung; harta Rp 300.000.000) diambil dari engine: asal 6 → 'aul 8; suami 3, ibu 1,
saudari 2 dan 2; rupiah 112.500.000 · 37.500.000 · 75.000.000 · 75.000.000.

### 25e. Keputusan pemilik dan integrasi

- **Proses tabel bertahap (HMW-29) ditunda ke mode fokus.** Alternatif tabel A/B/C tetap di berkas alternatif sebagai bahan; di layar Hasil tetap sakelar "Tampilkan proses" yang sekarang.
- **Penjelasan orang: gabungan A + C.** Alur visual bernomor ala C (1 Dasar · berlaku untuk semua kasus → 2 Di keluarga ini → 3 Diterima dari tiap orang, bila munasakhat/dua harta → 4 Hitungan), dengan hitungan bertambah ala A ("24 × 1/8 = 3", "3 × 3 = 9 dari 72", "7 × 12 = 84 · 5 × 7 = 35 · 3 × 16 = 48 · 84 + 35 + 48 = 167 dari 288", "167/288 × Rp 300.000.000 = …"). Dalil dan "kapan dapat berapa" terbuka di bagian Dasar dengan baris "kasus ini". Perubahan bagian ditampilkan "~~1/4~~ → 1/8". Titik yang tidak punya isi untuk orang itu tidak dirender.
- Diintegrasikan ke [mockup-hasil-per-kasus.html](mockup-hasil-per-kasus.html). Hitungan jami'ah per orang dihitung dari pengali tabel munasakhat (bukan teks tetap). Dicek: semua tab, laptop dan HP, tanpa galat.

### 25f. Revisi: bentuk pecahan, modal seragam, proses tabel di layar Hasil

- **Bentuk pecahan (dipulihkan dari layar sebelum Logivo):** sakelar "1/8 · 9/72" di kepala daftar. Berlaku untuk daftar dan modal.
  Munasakhat: 9/72 → saham jami'ah (mis. 167/288). Meninggal bersamaan: pecahan per harta "1/8 + 1/6" atau "4/32 + 4/24"
  (tidak ada lagi "pecahan panjang"). Pecahan sangat panjang disingkat dan bisa disorot untuk angka lengkapnya.
- **Modal seragam untuk semua orang, termasuk yang mendapat 0:** per harta/langkah: Dasar (dalil + tabel kapan dapat berapa,
  baris kasus ini) → Di keluarga ini (syarat) → Hitungan bertambah; ditutup "Bagiannya digabung" (rupiah per sumber dijumlahkan +
  jami'ah per orang) atau "meninggal sebelum dibagi" (diterima lalu dibagi kepada siapa). Data per orang ditulis per kasus;
  rantai panjang dihitung dari pola keluarga. Ahwal cucu perempuan dan saudari kandung diringkas dari KB 4.11–4.12 dan **perlu
  ditambahkan ke konten ahwal aplikasi** sebelum dipakai; dalilnya hadits Ibnu Mas'ud (KB 4.11).
- **Proses tabel lengkap di layar Hasil (pemilik menegaskan; sebelumnya keliru ditunda):** pil tahap (Bagian awal · Asal masalah ·
  'Aul/radd · Tashih · Per orang · Kemungkinan · Perbandingan · Jami'ah · Rupiah, sesuai yang ada di kasus) menyalakan/mematikan
  kolom per jenis tahap; kolom mayit dan jami'ah tetap tersedia. Mengetuk judul kolom menampilkan kotak Dasar · Di kasus ini ·
  Hitungan untuk kolom itu. Berlaku di semua kasus bertabel (biasa, berurutan, rantai 12 generasi, hamil + hilang, bersamaan).
  Mode fokus nanti memakai tahap yang sama, maju satu per satu.

### 25g. Revisi kecil

- Sakelar bentuk pecahan memakai istilah **Fardh** (bagian asal, mis. 1/8) dan **Saham** (setelah disamakan, mis. 9 dari 72), dengan keterangan saat disorot.
- Tombol mata di kepala daftar menyembunyikan semua nominal seperti kata sandi ("Rp •••••••"): daftar, ubin atas, penjumlahan, tabel, dan modal.
- Tabel faraidh: semua tahap tampil dalam satu tabel memanjang tanpa nomor; "Atur kolom" (kotak centang per jenis tahap) untuk menyembunyikan yang tidak ingin dilihat.

## 26. Audit + JTBD + HMW: mode fokus (2026-11-17)

Lingkup: mode fokus layar Hasil = penjelasan langkah demi langkah dari langkah 1 sampai **Selesai**, layar penuh, bersama
pohon keluarga dan tabel faraidh. Dasar: kode sekarang (`hasil/FokusLangkah.tsx`, `KartuLangkah.tsx`, `peraga.ts`), temuan
F1'–F4' (14c), skala 15, model performa 19a, tahap baku dan pola "Dasar → Di keluarga ini → Hitungan" (25, 25e–25g).

### 26a. Audit mode fokus yang ada

Yang sudah baik: pohon + tabel berdampingan; sub-langkah 4a/4b; peraga penyebut → nisab arba' → ashl × fardh, lalu
saham/penyebut × harta; angka "terbang" dari pohon ke sel tabel; laci daftar langkah; gerak bisa dimatikan; Esc menutup.

| Kode | Tingkat | Temuan (kode sekarang) |
|---|---|---|
| F5' | Kritis | **Tidak bisa dipakai di HP.** Di bawah 900 px layar ditutup "Mode fokus tidak tersedia di mobile". Pengguna utama (keluarga, pelajar) memakai HP |
| F6' | Tinggi | Langkah = bab narasi `packages/explain` (harta · ahli waris · bagian · ashl · penyesuaian · tashih · hasil), bukan tahap baku 25. **Dasar (aturan + dalil) tidak ada di mode fokus**: dalil hanya di kartu, terlipat di "Kenapa begitu?" (E1 terulang) |
| F7' | Tinggi | Peraga hitungan hanya untuk asal masalah dan rupiah. 'Aul (3 + 1 + 2 + 2 = 8), radd, tashih (kepala × saham), dan "siapa terhalang oleh siapa" tanpa hitungan bertambah |
| F8' | Tinggi | `Hasil.tsx` mengirim `hasilBiasa`: munasakhat, haml, mafqud, gharqa tidak mendapat peraga dan tabel bertahap (F3' tetap terbuka) |
| F9' | Sedang | Animasi sub-langkah **diulang terus** sampai Lanjut ditekan (1,2 dtk per bagian + tahan 3,5 dtk). Tidak ada titik diam untuk membaca; pengguna harus menjeda sendiri |
| F10' | Sedang | Panel "Selesai" hanya "kamu sudah mengikuti seluruh pembagian". Tidak merangkum siapa dapat berapa, tidak ada jalan ke modal orang atau kembali ke Hasil (F1' belum tuntas) |
| F11' | Sedang | Posisi hanya teks "Langkah 4b"; tidak ada peta kemajuan. Daftar langkah di laci tersembunyi |
| F12' | Sedang | Tabel di mode fokus tabel biasa yang kolomnya terbuka sampai langkah ini (`kolomTerbukaSampai`); belum memakai tabel kitab memanjang + kotak "hitungan tahap ini" yang disetujui di 25f–25g |
| F13' | Sedang | Rantai panjang: ±7 langkah × jumlah mayit (15c: 50 generasi ≈ 350 langkah); tidak ada pengelompokan atau lompatan per mayit |

### 26b. JTBD

- **H-g (pelajar):** "Saat belajar dari kasus ini, saya ingin diajak **dari langkah 1 sampai selesai**, tiap langkah dimulai dari
  aturannya, lalu dilihat di keluarga ini, lalu dihitung, supaya saya bisa mengulang sendiri di kertas." Ukuran: tabel faraidh di
  akhir sama dengan yang ia tulis sendiri.
- **H-b (keluarga menjelaskan):** "Saat menjelaskan ke saudara di HP, saya ingin **menunjukkan satu langkah sekali waktu** dengan
  pohon kami yang disorot, supaya mereka percaya pembagiannya." Ukuran: bisa dipakai di HP tanpa memiringkan layar.
- **H-f (mencocokkan dengan ustadz/kitab):** "Saat mencocokkan, saya ingin **melompat ke tahap tertentu** (mis. tashih atau
  jami'ah) tanpa memutar dari awal." Ukuran: dua ketukan ke tahap mana pun.

### 26c. Bentuk langkah (berlaku untuk semua ide)

Setiap langkah tiga bagian, sama dengan modal orang (25e) supaya pengguna belajar satu pola saja:
1. **Dasar** · berlaku untuk semua kasus: aturan + dalil (dari `packages/content`, rujukan `[Rxx-y]` tidak ditampilkan, lihat memori admin).
2. **Di keluarga ini**: syarat yang terpenuhi dicentang, orang yang terkait disorot di pohon.
3. **Hitungan** bertambah satu baris per ketukan, angka masuk ke sel tabel saat barisnya muncul.

Urutan langkah = tahap baku 25, hanya yang ada di kasus (UI hanya yang relevan):

| Kasus | Langkah |
|---|---|
| Biasa | 1 Harta bersih → 2 Siapa mewarisi & terhalang → 3 Bagian awal (fardh/sisa) → 4 Asal masalah → 5 Per orang → 6 Rupiah → **Selesai** |
| 'Aul | … 4 Asal masalah (6) → 5 **'Aul**: 3 + 1 + 2 + 2 = 8 > 6, asal naik ke 8 → … |
| Radd | … 4 Asal masalah → 5 **Radd**: sisa dikembalikan, pasangan tidak ikut → … |
| Tashih | … → **Tashih**: saham tidak habis dibagi kepala → pengali → … |
| Munasakhat | Babak per mayit (masalah mayit 1 → masalah mayit 2 …) → **Perbandingan** bagian : masalah → **Jami'ah** → Per orang → Rupiah → Selesai. Mayit yang dilewati [R12-1] tampil satu baris "dilewati karena …" |
| Haml / mafqud | … → **Kemungkinan** (tiap kemungkinan satu kolom, mis. 6 untuk janin) → **Bagian yang dibayar sekarang** (terkecil) dan **ditahan** → Selesai menyebut kapan dihitung lagi |
| Gharqa | Satu babak per harta (mereka tidak saling mewarisi), lalu **Bagian digabung** per orang |
| Gabungan | Susunan di atas bertingkat: babak per mayit, di dalamnya kemungkinan; "ditahan karena Siti" ikut menjalar (X9) |

Langkah terakhir **Selesai**: ringkasan siapa dapat berapa (nominal ikut sakelar sembunyi), tabel kitab lengkap, tautan
"Kembali ke Hasil" dan "Ulangi dari langkah 1"; ketuk nama → modal orang.

### 26d. HMW dan ide berskor

Skor 1–3: **Paham** (mudah diikuti) · **Dampak** (menjawab JTBD) · **Usaha** (3 = kecil).

**HMW-31. Bagaimana mode fokus bisa dipakai di HP 375 px tanpa kehilangan pohon dan tabel? (F5')**

| Ide | Paham | Dampak | Usaha | Jml |
|---|---|---|---|---|
| A. **Tumpuk + pita orang**: di HP pohon diringkas jadi pita nama berwarna (sorot sama dengan pohon) yang menempel di atas; di bawahnya kartu langkah (Dasar · Di keluarga ini · Hitungan), lalu tabel kitab. Ketuk pita → pohon penuh di lembar bawah | 3 | 3 | 2 | **8** |
| B. **Tiga tab** Langkah · Pohon · Tabel di HP | 2 | 2 | 3 | 7 |
| C. **Geser horizontal** antar panel (pohon ← langkah → tabel) | 2 | 2 | 2 | 6 |

**HMW-32. Bagaimana tiap langkah dimulai dari dasar lalu penerapan, dengan hitungan bertambah? (F6', F7')**

| Ide | Paham | Dampak | Usaha | Jml |
|---|---|---|---|---|
| A. **Kartu langkah = pola modal 25e** (Dasar terbuka singkat, "Lihat dalil lengkap" tautan; Di keluarga ini dengan centang; Hitungan bertambah). Satu komponen untuk modal dan fokus | 3 | 3 | 2 | **8** |
| B. Dasar sebagai langkah tersendiri sebelum tiap tahap ("3a Aturannya", "3b Di keluarga ini") | 2 | 3 | 2 | 7 |
| C. Dasar di laci samping, langkah hanya penerapan + hitungan | 2 | 2 | 3 | 7 |

**HMW-33. Bagaimana tabel faraidh terasa seperti di kitab dan tumbuh bersama langkah? (F12')**

| Ide | Paham | Dampak | Usaha | Jml |
|---|---|---|---|---|
| A. **Tabel B "bertahap"** (alternatif yang belum dipakai): tiap langkah menambah satu kolom tabel kitab memanjang; kolom baru disorot, angka masuk sel saat baris hitungan muncul | 3 | 3 | 2 | **8** |
| B. Tabel lengkap sejak awal, kolom yang belum dibahas diredupkan | 3 | 2 | 3 | 8 |
| C. Tabel hanya muncul di Selesai | 2 | 1 | 3 | 6 |

**HMW-34. Bagaimana munasakhat dan rantai panjang tetap terbaca langkah demi langkah? (F8', F13', 15c)**

| Ide | Paham | Dampak | Usaha | Jml |
|---|---|---|---|---|
| A. **Babak per mayit + peta rantai**: peta kecil di atas (Ahmad → Budi → Citra …) menunjuk babak aktif; tiap babak 3–5 langkah; ketuk mayit → lompat. Pohon kamera ikut mayit aktif | 3 | 3 | 2 | **8** |
| B. A + **ringkas babak berpola sama**: babak yang susunannya sama dengan sebelumnya tampil satu kartu ("sama seperti masalah Budi: istri 1/8, anak sisa 2:1") yang bisa dibuka; menjaga 50 generasi tetap ±60 langkah | 3 | 3 | 1 | 7 |
| C. Satu babak saja (jami'ah), masalah per mayit dilipat | 2 | 1 | 3 | 6 |

**HMW-35. Bagaimana haml, mafqud, gharqa dijelaskan tanpa membingungkan? (F3', F8')**

| Ide | Paham | Dampak | Usaha | Jml |
|---|---|---|---|---|
| A. **Kemungkinan sebagai kolom tabel** + langkah "Yang dibayar sekarang = terkecil di tiap kolom", sisa "ditahan karena …" | 3 | 3 | 2 | **8** |
| B. Babak per kemungkinan (ulang langkah 3–5 untuk tiap kemungkinan) | 2 | 2 | 2 | 6 |
| C. Hanya kemungkinan terburuk & terbaik | 2 | 1 | 3 | 6 |

Gharqa memakai babak per harta (pola HMW-34 A), lalu "Bagian digabung".

**HMW-36. Bagaimana tempo animasi membantu membaca, bukan mengganggu? (F9', F11')**

| Ide | Paham | Dampak | Usaha | Jml |
|---|---|---|---|---|
| A. **Putar sekali lalu diam**; tautan "Putar ulang"; Lanjut/Kembali + panah kiri/kanan; peta kemajuan titik per langkah (ketuk = lompat) | 3 | 3 | 3 | **9** |
| B. Putar otomatis seluruh langkah seperti video, dengan jeda | 2 | 2 | 2 | 6 |
| C. Tanpa animasi, semua baris langsung tampil | 3 | 1 | 3 | 7 |

### 26e. Usulan

Gabungan skor tertinggi: **31A + 32A + 33A + 34A + 35A + 36A**; 34B (ringkas babak berpola sama) sebagai tambahan bila rantai
> ±8 mayit. Kasus mockup: biasa (Aminah dkk.), 'aul (suami, ibu, 2 saudari kandung; Rp 300 jt), munasakhat 3 mayit,
rantai 5 generasi + janin + hilang (19a.7), gharqa. Angka dari engine lewat tes vitest sementara.

### 26f. Pertanyaan untuk pemilik

1. HP: pita orang + lembar pohon (31A), atau tiga tab (31B)?
2. Dasar di dalam kartu langkah (32A), atau langkah tersendiri (32B)?
3. Tabel tumbuh per kolom (33A), atau lengkap tapi redup (33B)?
4. Rantai panjang: babak per mayit saja (34A), atau ditambah ringkasan babak berpola sama (34B)?

## 27. Acuan final layar Hasil (disetujui pemilik, 2026-11-17)

Salinan beku mockup yang disetujui: [acuan-hasil-final.html](acuan-hasil-final.html) (sama dengan `mockup-hasil-per-kasus.html` pada commit ini).
Dipakai sebagai acuan saat integrasi ke aplikasi dan untuk mode fokus; perubahan berikutnya dibuat di `mockup-hasil-per-kasus.html`, acuan ini tidak disunting.
