# Rencana: fitur berikutnya dan rasa tampilannya

Tanggal: 2026-10-01 · Status: **disetujui pemilik 2026-10-01** (keputusan di bagian 5) · Belum ada kode yang ditulis dari dokumen ini.

Dokumen ini menjawab dua hal sekaligus:

1. **Apa yang dikerjakan berikutnya, dan urutannya.** Mengikuti urutan spec
   `docs/superpowers/specs/2026-10-01-perjalanan-keresahan-design.md` bagian 10 (keputusan pemilik 2026-10-01).
2. **Bagaimana supaya tidak flat.** Jawaban pemilik 2026-10-01: yang kurang adalah gerak dan suara tipis,
   susunan yang semuanya kotak sejajar, tidak ada rasa/karakter, dan kurang interaktif. Batasnya: hangat dan hidup,
   tetap tenang. Topiknya kematian, penggunanya termasuk lansia dan siswa SMP di HP biasa.

Fungsi tiap fitur sudah ada di spec; dokumen ini **tidak mengulangnya**, hanya menambah arah tampilan, urutan, dan
syarat selesai. Tiap tahap nanti mendapat rencana kerja rinci sendiri di `docs/superpowers/plans/` saat dimulai.

---

## 1. Arah: pohon keluarga yang hidup

**Tesis.** Hal yang hanya dimiliki Arif Waris: harta **turun lewat silsilah**, dan setiap angka bisa ditelusuri ke
orang dan alasannya. Jadi yang dihidupkan bukan kartu-kartunya, tetapi **pohon keluarga dan aliran harta di
dalamnya**. Kartu menjadi lembar pendamping.

Ini bukan metafora baru. Redesain "Peta Jalur" ditolak karena menambah kiasan (stasiun, kereta) di atas hitungan
yang sudah berat. Di sini tidak ada kata baru, tidak ada label baru, tidak ada benda kiasan: yang bergerak adalah
harta dan keluarga itu sendiri, yang memang pokok bahasannya. Kalau saat dibangun terasa mulai menjadi kiasan,
itu tanda harus dikurangi.

**Empat keluhan, empat jawaban:**

| Keluhan | Jawaban | Wujud paling jelas |
|---|---|---|
| Semuanya diam | Gerak yang menjelaskan, bukan menghias | Harta mengalir dari almarhum ke tiap orang saat Hasil dibuka |
| Semuanya kotak sejajar | Tiga lapis kedalaman, bukan deretan kartu | Pita bagian menyambungkan pohon dengan daftar; lembar orang naik dari kotaknya |
| Tidak ada rasa | Bahasa garis milik sendiri + suara tipis + gaya bicara yang sudah ada | Garis nasab/nikah/putus-putus dipakai di seluruh aplikasi |
| Kurang interaktif | Hasil bisa dipegang | Ketuk orang di pohon, ubah keadaannya, lihat angka semua orang berubah |

### 1.1 Gerak

Satu momen utama, sisanya pendukung. Bukan animasi masuk yang sama di tiap bagian.

- **Momen utama: aliran harta di Hasil.** Berjalan di pohon dalam kotak kaca hero (susunan hero tidak berubah) dan
  di layar penuh. Saat Hasil pertama terbuka, jumlah harta muncul di kotak almarhum, lalu
  berjalan menyusuri garis pohon ke tiap penerima. Angka di kotak penerima naik saat bagiannya tiba; yang tidak
  menerima tetap redup. Lamanya sekitar 2 detik, sekali per hasil, bisa dilewati dengan satu ketukan, dan ada tautan
  "Putar ulang".
- **Nilai ajarnya nyata pada kematian berlapis:** bagian tiba di orang yang sudah wafat, berhenti sebentar, lalu
  **diteruskan** ke keluarganya. Ini menjawab langsung "kok orang yang sudah wafat menerima?" dan "kok keluarga
  besan dapat?" (spec 4.1 pola D8 dan D1) tanpa satu kalimat pun.
- **Pendukung:**
  - orang baru muncul dari orang yang terkait, garisnya tergambar (langkah Keluarga);
  - mengganti keadaan seseorang mengubah kotaknya di tempat (hidup → wafat: garis jadi putus-putus);
  - berpindah kemungkinan ("Bagaimana kalau"): angka berubah di tempat dengan tanda naik/turun, baris bertukar
    posisi dengan halus;
  - pohon yang sama berpindah dari langkah Keluarga → Periksa → Hasil tanpa "lompat" (susunan kotaknya sama).
- **Aturan:** hanya `transform` dan `opacity` yang dianimasikan; pohon di atas 40 orang cukup memudar, tanpa
  aliran; `prefers-reduced-motion` dan sakelar "Animasi" yang sudah ada di langkah perhitungan menjadi **satu
  preferensi** untuk seluruh aplikasi. Semua informasi tetap terbaca tanpa gerak.

### 1.2 Suara

- Disintesis di perangkat (Web Audio), tanpa berkas suara: tetap jalan tanpa internet dan tidak menambah ukuran.
- Empat bunyi saja, pendek (di bawah 200 ms), pelan, tanpa melodi berulang:
  ketukan lembut (memilih), "tiba" (bagian sampai ke seseorang; nadanya berurutan), benar/salah (mode Belajar),
  selesai.
- Getar singkat di HP Android untuk "tiba", bila tersedia.
- Suara tidak pernah menjadi satu-satunya penanda sesuatu. Satu ikon pengeras suara, pilihan diingat.
- **Bawaan (diputuskan):** menyala di mode Belajar, mati di mode Hitung kasus sampai pengguna menyalakannya.
  Alasannya, mode Hitung sering dibuka saat rapat keluarga atau di kelas.

### 1.3 Susunan: tiga lapis, bukan deretan kartu

| Lapis | Isi | Rupa |
|---|---|---|
| **Panggung** | Pohon keluarga, kapan pun keluarga menjadi pokok layar: kotak pohon di hero Hasil, layar penuh, langkah Keluarga, Periksa, sampul lembar musyawarah | Gelap, hijau-teal dengan cahaya hangat (yang sekarang ada di hero Hasil) |
| **Lembar** | Yang dibaca pelan: pembagian, alasan, langkah hitung, tabel | Krem, tenang, tanpa efek |
| **Melayang** | Yang muncul karena diminta: lembar orang, alat pohon, pemilih kemungkinan | Naik dari benda yang diketuk, bukan dialog di tengah layar |

Akibatnya di layar:

- Hero Hasil **tetap seperti sekarang** (keputusan pemilik): pohon di dalam kotak kaca, mengetuknya membuka layar
  penuh. Kedalaman datang dari pita bagian, lembar yang melayang, dan gerak, bukan dari mengubah hero.
- **Pita bagian**: satu garis mendatar selebar lembar, seluruh harta sesuai skala, tiap ruas milik satu orang.
  Pita ini menyambungkan pohon (di atas) dengan daftar nama (di bawah): menunjuk nama menyalakan ruas dan jalur
  orangnya di pohon. Sistem sorot untuk ini sudah ada (`sorot.tsx`), tinggal dipakai lebih jauh. Pita adalah data
  berskala, bukan hiasan; ia juga menjadi bentuk tampilan "Per barang" (satu pita per barang).
- Lembar orang (penjelasan per orang) naik dari kotaknya di pohon atau dari barisnya di daftar, bukan dialog di
  tengah layar.
- Wizard: satu pertanyaan per layar seperti sekarang, dengan pohon yang **tumbuh di sampingnya** (di HP: di atas,
  kecil, bisa diketuk untuk layar penuh). Pengguna melihat jawabannya menjadi keluarga.

### 1.4 Rasa

- **Bahasa garis** menjadi ciri Arif Waris: garis utuh = nasab, garis dengan cincin = nikah, putus-putus = tanpa
  nasab atau tidak mewarisi (sudah ditetapkan spec 5.5 dan 5.3). Garis yang sama dipakai untuk pemisah, penanda
  langkah, dan keadaan memuat (garis yang menggambar dirinya). Satu ketebalan, ujung bulat.
- **Avatar inisial berwarna** per orang, sama di pohon, daftar, pita, dan lembar. Nanti diganti foto yang
  disimpan di perangkat (rencana di memori gaya Logivo).
- **Gaya bicara** yang sudah ada dipertahankan ("Nah, ini pembagiannya", "Habis ini ngapain?").
- **Tanpa ilustrasi tempelan.** Tidak ada ilustrasi yang bisa saya buat dengan mutu layak, dan gambar stok akan
  terasa generik. Karakter datang dari pohon, gerak, garis, dan suara. Bila pemilik punya ilustrator, itu tambahan
  di kemudian hari.
- **Yang sengaja dihindari:** teks bergradasi; kartu ikon + judul + teks berderet sebagai struktur halaman; angka
  besar + label kecil sebagai hiasan; kaca dan blur tanpa fungsi; perayaan (confetti) di mode Hitung kasus;
  kartu kerangka "segera hadir".

### 1.5 Interaksi

- **Coba-coba di pohon** (spec 3 dan 5.1): ketuk orang → ubah keadaannya → semua angka berubah di tempat dengan
  selisih terhadap kasus tersimpan → "Simpan perubahan ini" atau "Batalkan".
- **Langkah perhitungan memakai panggung yang sama**: melangkah menyorot orang dan garis di pohon (mode fokus dan
  sorot sudah ada; tinggal disatukan dengan panggung).
- **Lihat dari sisi orang ini** (spec 5.5): pusat pohon pindah, sebutan hubungan ikut berubah.

---

## 2. Urutan kerja

Urutan = spec bagian 10, ditambah **Tahap 0** (fondasi rasa) yang kecil dan dikerjakan lebih dulu supaya tahap
berikutnya tinggal memakainya. Ukuran: K = kecil, S = sedang, B = besar.

| Tahap | Isi fungsi (spec) | Yang membuatnya tidak flat | Selesai bila | Ukuran |
|---|---|---|---|---|
| **0. Fondasi rasa** | — | Preferensi tunggal gerak dan suara; modul gerak (durasi, lengkung) dan modul suara (4 bunyi); DESIGN.md ditulis dari hasil yang sudah ada | Sakelar gerak/suara berfungsi dan diingat; tanpa gerak semua tetap terbaca; tidak ada dependency baru | S |
| **1. Kata tampil** | "babak" → "Keluarga {nama}", "dunia" → "kemungkinan" (spec 1) | — | Tidak ada kata "babak"/"dunia" di teks tampil; tes diksi lolos | K |
| **2. Alasan tiap orang** | Jejak `BUKAN_AHLI_WARIS` di engine + satu kalimat alasan per orang (spec 4.2 butir 1, 4.3) | Kalimat alasan tampil di bawah tiap nama di Pembagian dan di lembar orang; kartu "Tidak mendapat bagian" kini memuat **semua** yang tidak menerima, bukan hanya yang terhalang | Tiap orang di graf punya tepat satu alasan; fixture bab 16 tidak berubah | S |
| **3. Pohon yang benar** | Tata letak berlapis dengan simpul nikah, galeri 11 fixture, `sebutanHubungan` (spec 5.4, 5.5) | **Aliran harta** sebagai momen utama (di pohon hero dan layar penuh); pita bagian | Invarian P1–P9 lolos di galeri; aliran berjalan mulus di HP kelas bawah dan mati bila gerak dikurangi | B |
| **4. Tambah kerabat dari pohon** | Tambah dari orang terkait, dari nama hubungan, anak angkat (spec 5.1–5.3) | Orang baru muncul dari orang yang diketuk, garis tergambar; pohon tumbuh di samping pertanyaan wizard; lembar orang naik dari kotaknya | Semua baris tabel 5.2 menghasilkan graf yang benar; pohon tidak "lompat" saat ditambah satu orang (P7) | B |

> **Status Tahap 4 (2026-10-01):** dibangun sebagian: menu orang di pohon (tambah orang tua, pasangan, anak, saudara, ubah, hapus) dan tautan nama hubungan (mertua, menantu, besan, ipar, anak tiri, dst.). Anak angkat (5.3), lipat cabang, ayah tiri, dan invarian P1–P9 formal menunggu Tahap 3/5. Rencana: `docs/superpowers/plans/2026-10-01-tambah-kerabat-dari-pohon.md`.
| **5. Model data** | Fixture tumpukan harta, lalu `Kasus` v4 + migrasi (spec 7) | — (tidak terlihat) | Fixture dicocokkan ke KB bab 12 **sebelum** logika; migrasi v3 → v4 lolos | S |
| **6. Tumpukan harta** | Daftar barang, kewajiban per pemilik, hitung per pemilik, hasil Per orang / Per barang (spec 2) | Tab "Per barang" baru muncul di sini, saat barangnya memang lebih dari satu; satu pita per barang; aliran harta berjalan per pemilik, berurutan | Invarian jumlah (spec 2.5) lolos; satu barang = tanpa tab | B |
| **7. Bagaimana kalau** | Kemungkinan jenis A, B, C dan coba-coba (spec 3) | Pemilih kemungkinan mengubah angka di tempat dengan selisih; coba-coba langsung di pohon | Batas 4 kemungkinan dihormati; kemungkinan tidak tersimpan di `Kasus` | B |
| **8. Yang sering ditanyakan** | Blok tanya-jawab keluarga (spec 4.2) | Tiap pertanyaan bertaut ke orangnya di pohon dan ke "Bagaimana kalau" | Blok hanya muncul bila polanya ada di kasus | S |
| **9. Beranda dan sesudah hasil** | Beranda dari situasi, simpan lanjut nanti, lembar musyawarah, kirim berkas, catatan resmi (spec 6) | Lembar musyawarah dengan pohon kecil sebagai sampul; beranda membuka dengan tiga situasi, bukan tiga kartu seragam | Lembar muat satu halaman A4; kasus belum selesai muncul di Riwayat dengan daftar yang kurang | S |

**Catatan urutan:**

- Dikerjakan berurutan dari Tahap 0 (keputusan pemilik). Tahap 3 adalah tempat "wow"-nya: aliran harta dan pita
  bagian tiba bersama tata letak pohon yang baru.
- Tahap 8 tertahan: kalimatnya menunggu tim keilmuan (spec 4.1 menyebut semua kalimat masih draf). Tahap 2 juga
  memakai kalimat draf yang sama; kalimat yang belum disahkan tidak masuk snapshot diksi.
- Kartu yang sebelumnya tampil sebagai kerangka (Yang belum pasti, Yang sering ditanyakan, Per barang, Lembar
  musyawarah, Kirim ke keluarga) baru muncul di tahap masing-masing, dan hanya pada kasus yang memang memuatnya.

---

## 3. Yang tidak boleh dilanggar

- **Engine tidak disentuh oleh tampilan.** Gerak dan suara hanya penyajian. Urutan aliran harta diambil dari jejak
  engine (`LangkahJejak`), bukan dihitung ulang di UI. Tidak ada aturan fikih di komponen.
- **Semua teks lewat diksi** (`t(...)`), termasuk label suara dan gerak.
- **Tanpa syarat:** tanpa internet, tanpa akun, tanpa server konten tetap berjalan. Tidak ada dependency baru
  untuk gerak atau suara (CSS, Web Animations API, Web Audio; View Transitions hanya sebagai tambahan bila
  peramban mendukung).
- **Pengguna paling lemah jadi patokan:** sasaran sentuh minimal 44 px, teks tetap terbaca saat dibesarkan,
  tidak ada informasi yang hanya dibawa warna, gerak, atau suara. Daftar bertingkat tetap menjadi padanan pohon
  untuk pembaca layar (spec 5.5).
- **Tenang:** tidak ada perayaan di mode Hitung kasus. Confetti dan bunyi benar/salah hanya di mode Belajar.
- **Keputusan lama tetap berlaku:** ikon SVG tanpa emoji; aksi sekunder berupa teks atau tautan; kode rujukan
  internal tidak tampil mentah; tema terang saja.

---

## 4. Berkas konteks desain

Dirapikan 2026-10-01 bersama dokumen ini:

- `apps/web/PRODUCT.md`: sistem visual kini gaya Logivo (bukan v4), tema terang saja.
- `apps/web/.impeccable/surfaces/src-aplikasi-tsx.md`: arah "Peta Jalur" diganti arah di dokumen ini.
- `DESIGN.md` belum ada; ditulis di Tahap 0 dari hasil yang sudah jadi (token, tiga lapis, bahasa garis, gerak,
  suara), supaya tahap berikutnya punya satu acuan.

---

## 5. Keputusan pemilik (2026-10-01)

1. **Hero Hasil tetap seperti sekarang.** Pohon tetap di dalam kotak kaca hero, sesuai mockup Logivo. Aliran harta
   berjalan di dalam kotak itu dan di layar penuh.
2. **Suara:** bawaan menyala di mode Belajar, mati di mode Hitung kasus sampai pengguna menyalakannya.
3. **Pita bagian disetujui**, termasuk pemakaiannya nanti untuk "Per barang".
4. **Spec `2026-10-01-perjalanan-keresahan-design.md` disetujui** sebagai dasar fungsi.
5. **Urutan kerja:** berurutan, Tahap 0 → 1 → 2 → 3 dan seterusnya.
