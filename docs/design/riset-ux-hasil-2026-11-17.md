# Riset UX layar Hasil: audit (2026-11-17)

Lanjutan dari [riset-ux-wizard-kritik-2026-11-16.md](riset-ux-wizard-kritik-2026-11-16.md). Kendala (tahap 0), pengguna, dan
kosakata (tahap 1) tetap sama dengan dokumen itu. Dokumen ini hanya berisi **audit**. Solusi menyusul setelah disetujui.

**Cara audit:** tujuh kasus contoh dibuka di browser (HP 375 px dan laptop): biasa (ada yang terhalang), munasakhat,
mafqud, haml (hitung sekarang), haml (tunggu lahir), gharqa, serta munasakhat + haml. Ditambah pembacaan kode
`layar/Hasil.tsx`, `hasil/HasilKasusKhusus.tsx`, `hasil/ringkasan.ts`, `layar/lab/HeroLab.tsx`.
Belum diaudit: mode Belajar (tebak), lembar orang (ModalOrang), layar penuh pohon, ekspor PDF, pembaca layar.

## 2. JTBD layar Hasil

Dokumen wizard hanya punya JTBD sampai Periksa. Untuk Hasil:

| # | Saat… | Saya ingin… | Supaya… | Ukuran |
|---|---|---|---|---|
| H-a | hasil keluar di rapat keluarga | tahu tiap orang dapat berapa rupiah | bisa langsung dibagikan | angka per orang terbaca < 5 detik, tanpa istilah |
| H-b | ada yang protes ("kok saya nggak dapat?") | menunjukkan alasan per orang | keluarga menerima | alasan ditemukan ≤ 1 ketukan dari nama |
| H-c | ada yang meninggal berurutan | melihat harta mengalir lewat siapa | percaya hitungan berlapis | tiap orang tahu dapat dari almarhum yang mana |
| H-d | ada yang belum pasti (hamil, hilang) | tahu berapa yang boleh dibagi sekarang, berapa ditahan, untuk siapa, dan kapan dihitung lagi | tidak salah bagi | empat hal itu terjawab tanpa membuka lipatan |
| H-e | selesai menghitung | menyimpan, mengekspor, membagikan | dibawa ke rapat atau ke ustadz | satu tempat, jelas |
| H-f | belajar (santri) | melihat langkah dan istilah | memahami cara hitung | (mode Belajar, belum diaudit) |

## 4. Audit

Tingkat: **Kritis** (salah informasi, aplikasi rusak, atau job gagal), **Tinggi** (job tercapai dengan susah payah atau
salah paham), **Sedang** (beban dan bahasa).

### a. Kerusakan dan informasi yang salah

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| H1 | Kritis | Halaman ArifLab **crash** ("Halaman gagal ditampilkan") bila kasus terakhir adalah kasus belum pasti (mafqud/haml) atau gharqa | `HeroLab.tsx:25` memanggil `ringkas()` untuk kasus yang `lengkap`, padahal `ringkas` melempar galat untuk hasil selain biasa/munasakhat OK. Konsol: "ringkas hanya untuk hasil OK" |
| H2 | Kritis | Munasakhat: **satu orang tampil dengan dua nama dan dua status**. Cucu perempuan (anak dari anak laki-laki yang meninggal sesudah almarhum) tampil di Pembagian sebagai "Anak perempuan 2" (menerima Rp 87,5 jt), dan di "Tidak mendapat bagian" sebagai "Cucu perempuan, terhalang oleh Anak laki-laki" | `ringkasMunasakhat`: penerima dinamai dari mayit kedua, daftar terhalang dikumpulkan dari semua mayit tanpa membuang orang yang menerima di lapis lain |
| H3 | Kritis | Gharqa: penerima harta orang kedua disebut dengan hubungan ke almarhum pertama. "Harta Anak laki-laki: **Istri** Rp 20 jt, **Anak perempuan** Rp 30 jt", padahal itu ibunya dan saudarinya | `Gharqa` di `HasilKasusKhusus.tsx` memakai `namaSingkat` (sudut almarhum pertama) |
| H4 | Kritis | Janin disebut **"Anak laki-laki"** / "Anak laki-laki 2", karena data janin berjenis kelamin bawaan L. Di "Bagaimana kalau…" muncul judul yang bertentangan: "Anak laki-laki: 2 perempuan", "Anak laki-laki: sudah wafat" (maksudnya lahir tidak hidup) | `Taqdir`: `namaSingkat` + `teksTaqdir` |
| H5 | Tinggi | Kaki halaman selalu "Hasil ini menurut madzhab Syafi'i", walau madzhab lain dipilih (hero sudah benar) | `Hasil.tsx:262` memakai kunci tetap `hitung.hasil_ini_menurut_madzhab_syafi_i` |

### b. Kecocokan dengan alur pikir pengguna (kasus berbeda, layar berbeda)

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| H6 | Kritis | **Kasus paling sulit mendapat layar paling miskin.** Haml, mafqud, gharqa, dan menunggu memakai layar terpisah tanpa hero, pohon, stepper, total harta, label madzhab, ganti madzhab, ekspor, simpan, bagikan, pembulatan, tabel, alasan per orang. Pengguna kasus biasa mendapat semua itu. Job H-b, H-c, H-e gagal untuk kasus khusus | `Hasil.tsx:98` mengalihkan ke `HasilKasusKhusus` (komentar: "Hasil versi minimal") |
| H7 | Kritis | Munasakhat: **lapisannya tidak terlihat.** Anak laki-laki yang meninggal sesudah almarhum hanya diberi label kecil di pohon. Tidak ada keterangan "ia menerima Rp X dari almarhum, lalu hartanya dibagi ke…". Daftar hanya menampilkan angka akhir dengan keterangan "16 dari 72 saham jami'ah". Job H-c gagal, padahal rencana 1.1 menyebut kematian berlapis sebagai nilai ajar utama | `KartuPembagian` + `ringkasMunasakhat` (keterangan seragam) |
| H8 | Tinggi | Munasakhat: "Tentang kasus ini" hanya menjelaskan lapis pertama ("Normal, asal masalah 8, tashih 8 → 24") tetapi tampil seolah menjelaskan kasus utuh. Jami'ah 72 ditempel di bawahnya | `tentangKasus(pertama.jejak)` |
| H9 | Tinggi | Munasakhat + haml: anak laki-laki yang meninggal sesudah almarhum **hilang sama sekali** dari layar; hanya ada "Cucu perempuan Rp 37,5 jt" tanpa penjelasan dari mana | layar Taqdir tidak mengenal lapis |
| H10 | Tinggi | Haml: anak perempuan (pasti hidup) tertulis "menunggu kepastian" tanpa alasan. Alasan sebenarnya ([SYF]: ia berbagi ashabah dengan janin yang jumlahnya tidak dibatasi) baru ada di "Pelajari langkah perhitungan", terlipat. Keluarga akan mengira aplikasinya salah atau zalim | `teksMenunggu` |
| H11 | Tinggi | Titipan (Disimpan dulu): tidak menyebut **untuk siapa**. "Bagaimana kalau…" hanya pecahan dan persen, tanpa rupiah. Kalimat "Setelah bayi lahir atau ada kabar" sama untuk semua kasus (muncul juga di kasus mafqud tanpa bayi). Istilah "mauquf" ikut tampil. Job H-d hanya terjawab separuh | `KartuTitipan`, `Taqdir` |
| H12 | Tinggi | Menunggu kelahiran: layar hanya "Kasus disimpan · Hitung lagi setelah bayi lahir". Tidak memberi tahu bagian yang sudah pasti, di mana kasusnya bisa ditemukan lagi, atau akibat memilih "Hitung sekarang saja" (sebagian ditahan) | `Menunggu` |

### c. Beban pikiran

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| H13 | Sedang | Pecahan yang tidak bermakna bagi orang awam tampil di tiga tempat (pohon, daftar, pil): 17/36, 17/72, 35/72, "16 dari 72 saham jami'ah". Bagi mereka yang berarti hanya rupiah dan "bagian tertentu 1/8" | `KartuPembagian`, `Pohon` |
| H14 | Sedang | Statistik hero "Orang di pohon" tidak menjawab job apa pun dan menghitung almarhum serta yang terhalang | `Hasil.tsx:210` |
| H15 | Sedang | Aksi berulang: "Ubah data" di hero dan kaki (ditambah "Ubah harta" dan Ubah ahli waris), Ekspor di hero, "Habis ini ngapain?", dan layar penuh. Ada dua aksi utama bersaing di hero (Ekspor dan tab Hitung kasus/Belajar) | `Hasil.tsx` hero + kaki |
| H16 | Sedang | Pembulatan: tabel menulis "Jumlah Rp 299.999.999" tanpa baris selisih. Selisihnya ada di kartu "PERLU KEPUTUSANMU" yang harus dibuka dulu | `TabelFaraidh`, `KartuPembagian` |
| H17 | Sedang | Tur 5 langkah langsung menutupi hero setiap kali Hasil dibuka di sesi baru, termasuk di HP, saat pengguna sedang ingin melihat angka | pengamatan browser |

### d. Bahasa (dicocokkan ke kosakata)

| Kode | Tingkat | Temuan | Ganti dengan (arah, bukan keputusan) |
|---|---|---|---|
| H18 | Sedang | "Wafat" di legenda pohon dan "sudah wafat" di sebutan | meninggal |
| H19 | Sedang | "Tidak mendapat bagian · 1 orang di pohon" (kalimat janggal), "Terhalang" berdampingan dengan "Tidak menerima" untuk hal yang sama | satu istilah |
| H20 | Sedang | "mauquf", "jami'ah", "juz' as-sahm", "'adilah", "tashih", "tabayun" tampil di mode Hitung kasus tanpa disaring | istilah hanya di lipatan atau mode Belajar |
| H21 | Sedang | "ganti madzhab" huruf kecil, bersebelahan dengan "Ubah data" berhuruf besar | konsisten |
| H22 | Sedang | Layar galat/PERLU_INPUT menampilkan kalimat `alasan` mentah dari engine, dan tombol "Ubah data" ke langkah 1 (bukan ke isian yang kurang). Di layar kasus khusus, tombol yang sama ke langkah 3. Keduanya tombol berbingkai, padahal aturannya aksi sekunder berupa tautan | `Hasil.tsx:80`, `HasilKasusKhusus.tsx:25` |

### e. Jalan cerita per kasus (ringkas)

- **Biasa:** angka per orang ketemu cepat (H-a lulus). Alasan per orang lewat ketukan nama (H-b lulus). Tersendat di pecahan ashabah (H13) dan angka bulat (H16).
- **Munasakhat:** pengguna mencari "anak saya yang meninggal kemudian, bagiannya ke mana?" dan tidak menemukannya (H7). Lalu bingung melihat cucu tampil dua kali dengan nama berbeda (H2).
- **Mafqud:** tahu ada Rp 196,9 jt ditahan, tetapi tidak tahu untuk siapa dan berapa yang akan diterima kalau orangnya kembali (H11). Tidak bisa menyimpan atau mengekspor dari layar ini (H6).
- **Haml:** mengira anak perempuan dilupakan (H10), dan melihat janin disebut "Anak laki-laki" (H4).
- **Menunggu:** tidak tahu harus berbuat apa sesudahnya (H12).
- **Gharqa:** salah baca penerima harta orang kedua (H3). "Mereka tidak saling mewarisi" tidak menyebut siapa saja "mereka".
- **Munasakhat + haml:** lapis kedua hilang (H9). Semua masalah haml ikut muncul.

### f. Catatan untuk pemeriksa fikih (bukan temuan UI, jangan diubah dari UI)

- F1. Di [SYF], langkah perhitungan haml menulis "6 kemungkinan" dan memakai enam dunia. Menurut CLAUDE.md, model 6 taqdir
  hanya untuk [HNB], sedangkan di [SYF] jumlah janin tidak dibatasi. Angka contoh ini tetap konsisten (anak perempuan 0, istri dan
  ibu menerima bagian terkecil), tetapi kalimat "6 kemungkinan" perlu dicek ke engine dan KB 13a.

## Pertanyaan sebelum masuk ke solusi

1. Apakah kasus khusus (haml, mafqud, gharqa, menunggu) memang harus memakai **layar Hasil yang sama** dengan kasus biasa
   (hero, pohon, aksi), dengan kartu titipan sebagai tambahan? Atau cukup layar minimal yang diperbaiki?
2. H1 (crash) dan H2–H5 (informasi salah) boleh langsung diperbaiki tanpa mockup?
3. Untuk munasakhat (H7), lapisan ditampilkan sebagai satu daftar dengan keterangan "dari siapa", atau per almarhum seperti gharqa?
