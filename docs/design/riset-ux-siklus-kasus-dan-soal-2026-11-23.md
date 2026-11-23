# Riset UX: siklus kasus dan soal latihan (buka, keluar, simpan, lanjutkan) (2026-11-23)

Pemicu: pemilik ingin membuka kasus lama dari Lab Hitung, tetapi malah masuk soal latihan dan harus menjawab dulu.
Perbaikan darurat sudah di PR #55 (soal tidak lagi menjadi "kasus terakhir"). Dokumen ini menjawab pertanyaan yang lebih
besar: **bagaimana kasus dan soal seharusnya hidup** di aplikasi, dari dibuka sampai disimpan, dan bagaimana pindah di
antara keduanya.

Status: **tahap 1–3 (pengguna, JTBD, audit, HMW, usulan)**. Mockup menunggu pilihan pemilik di bagian 7.
Label: [Fakta-kode] = dibaca dari kode hari ini; [Asumsi] = belum diuji ke pengguna.

---

## 0. Batasan

- Web (HP dan laptop), simpan lokal + akun opsional (Supabase). Riwayat otomatis 30 hari, kasus bernama permanen.
- Keputusan lama yang tetap dipegang: simpan otomatis + status terlihat (riset hero 10c, S3); tebak **hanya** di soal
  latihan (riset hero 10d, T3); aksi sekunder = tautan teks; tombol tak pernah nonaktif.
- Revamp boleh mengubah keputusan lain bila ada alasan.

## 1. Pengguna

| Peran | Kapan membuka | Yang dibawa |
|---|---|---|
| **A. Keluarga yang mengurus waris** (utama untuk Hitung) | beberapa kali dalam beberapa minggu, setiap ada data baru (ternyata ada utang, ada anak dari istri lain) | satu sampai tiga kasus nyata; ingin kembali ke kasus yang **sama** tanpa mengisi ulang |
| **B. Pelajar** (santri/mahasiswa, utama untuk Latihan) | sesi pendek 5–15 menit di HP | puluhan soal; ingin tahu mana yang sudah, mana yang belum, dan melanjutkan soal yang terputus |
| C. Pengajar / pemilik (penguji) | bolak-balik keduanya dalam satu sesi | sering pindah mode; paling cepat merasakan kebingungan (keluhan pemicu datang dari sini) |

### Kosakata pengguna

| Dipakai | Hindari | Alasan |
|---|---|---|
| **Kasus** / Kasusmu | skenario, sesi, entri | "kasus" = kata pengguna untuk masalah waris keluarga |
| **Soal** / Latihan | kasus (untuk soal), mode Belajar | soal punya kunci jawaban; kasus tidak |
| **Lanjutkan** | Pulihkan, Resume | |
| **Sudah dikerjakan / Belum dikerjakan / Terputus** | selesai/gagal, status: pending | "Terputus" = sudah dibuka, belum diperiksa |
| **Tersimpan / Sementara** | draf, cache | sudah dipakai `kasusmu.ts` [Fakta-kode] |
| **Jadikan kasus sendiri** | fork, salin ke skenario | |
| Contoh dari materi | sumber: materi | |

## 2. Peta keadaan hari ini [Fakta-kode]

Satu "sesi" kalkulator = `idSesi` + `sumberSesi` (`sendiri | impor | materi | latihan`). Semua sesi, apa pun sumbernya,
ditulis ke **riwayat yang sama** (`catatRiwayat`) dan muncul di **Kasusmu** yang sama (`bacaKasusKu`).

| Pintu masuk | Sumber | Ke mana | Mode |
|---|---|---|---|
| Lab Hitung → Mulai dari nol / susunan cepat | sendiri | wizard | biasa |
| Lab Hitung → Impor file | impor | wizard/hasil | biasa |
| Materi → "Coba di kalkulator" | materi | hasil | **terkunci** |
| Latihan / pintasan soal di Lab / acak soal / "Soal berikutnya" | latihan | hasil | **tebak**, tanpa simpan |
| Lab hero "Lanjutkan" / Beranda kasus terakhir | sumber entri lama | hasil/wizard | ikut sumber lama |
| Kasusmu / Riwayat → buka entri | sumber entri | hasil/wizard | ikut sumber lama |
| Tautan `#/hitung/<id>` (muat ulang) | dari URL | sama | ikut sumber |

Keluar: penjaga keluar (`usePenjaga`) bertanya bila meninggalkan kalkulator; kasus belum lengkap memicu dialog peramban.

## 3. JTBD

| # | Saat… | Saya ingin… | Supaya… | Ukuran sukses |
|---|---|---|---|---|
| J1 | (A) kembali beberapa hari kemudian dengan data baru | membuka **kasus keluarga saya** | memperbaiki tanpa mengisi ulang | ≤ 2 ketukan dari Beranda/Lab; tidak pernah mendarat di soal |
| J2 | (A) punya beberapa kasus | membedakan kasus yang satu dengan lainnya | tidak salah buka | nama kasus terbaca; soal tidak ikut di daftar |
| J3 | (B) membuka aplikasi lagi | **melanjutkan soal yang terputus** | tidak kehilangan tebakan | ≤ 2 ketukan dari Latihan; isian tebakan masih ada [Asumsi: perlu isian tersimpan] |
| J4 | (B) melihat daftar soal | tahu mana yang sudah dan belum | memilih soal berikutnya | status per soal terlihat di daftar Latihan |
| J5 | (B) membuka soal yang sudah dikerjakan | melihat pembahasannya lagi | mengulang materi | langsung tampil jawaban; "Kerjakan ulang" tersedia tapi tidak memaksa |
| J6 | (B/C) penasaran "kalau anaknya ditambah satu bagaimana?" | mengubah soal menjadi kasus bebas | bereksperimen | satu tautan; jelas bahwa soal aslinya tidak berubah |
| J7 | (A) belajar dari contoh materi | mencoba contoh, lalu menyesuaikan dengan keluarga sendiri | memakai contoh sebagai titik awal | contoh bisa disalin jadi kasus sendiri |
| J8 | (semua) keluar di tengah jalan | yakin tidak ada yang hilang | berani menutup aplikasi | status "tersimpan" terlihat; tidak ada dialog yang membingungkan |

## 4. Audit alur sekarang (masalah saja)

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| S1 | **Tinggi** | **Soal dan kasus adalah satu benda di penyimpanan.** Soal yang dibuka masuk riwayat, Kasusmu, dan "kasus terakhir" seperti kasus keluarga. Akibatnya Lanjutkan/Kasusmu membawa pengguna A ke mode tebak. (Kasus terakhir sudah ditambal di PR #55; riwayat/Kasusmu belum) | `Aplikasi.tsx` `catatRiwayat` untuk semua sumber; `kasusmu.ts` |
| S2 | **Tinggi** | **Mode ditentukan oleh asal-usul entri, bukan oleh niat saat membuka.** Membuka entri dari Kasusmu memulihkan `sumber: latihan` → tebak lagi, walau pengguna hanya ingin melihat | `bukaRiwayat` |
| S3 | Tinggi | **Status soal tinggal di dua tempat.** Kemajuan soal (`bacaProgresLatihan`) di Latihan; salinan soal di riwayat tanpa status. Soal yang sama bisa muncul di Kasusmu sebagai "Sementara, 29 hari lagi" padahal di Latihan sudah "dikerjakan" | `kasusmu.ts`, `riwayat.ts`, progres latihan |
| S4 | Sedang | **Tambalan PR #55 mengubah sumber entri diam-diam**: soal yang sudah dikerjakan, saat dibuka dari Riwayat, dicatat ulang sebagai "Skenario pribadi". Benar untuk J1 jangka pendek, tetapi soal itu kini menyamar sebagai kasus | PR #55 `bukaRiwayat` |
| S5 | Sedang | **Tidak ada "Lanjutkan soal".** Latihan hanya punya daftar dan acak; soal terputus tidak ditandai. Pelajar menemukan soal terputusnya justru lewat Kasusmu (tempat yang salah) | `layar/belajar/DaftarSoalHitung.tsx` |
| S6 | Sedang | **Soal tampil di URL kalkulator** (`#/hitung/<id>`). Muat ulang/bagikan tautan memulihkan soal sebagai sesi kalkulator; alamat tidak berkata "ini soal" | `rute.ts` `tautanKasus` |
| S7 | Sedang | **Isian tebakan tidak jelas nasibnya saat keluar.** Dialog keluar berkata "soal ini bisa kamu buka lagi", tetapi tidak berkata apakah tebakannya ikut [perlu dicek di kode isian] | `umum.soal_ini_bisa_kamu_buka_lagi` |
| S8 | Rendah | **Contoh materi juga masuk Kasusmu** sebagai entri terkunci. Untuk A ini sampah; untuk J7 tidak ada jalan "jadikan kasus sendiri" yang eksplisit | `cobaDiKalkulator`, `terkunci` |
| S9 | Rendah | Komentar `AwalHitung.tsx:4-6` masih menyebut sakelar Belajar di hasil, padahal sakelar sudah dihapus (T3) | `AwalHitung.tsx` |
| S10 | Rendah | **Tiga pintu soal di luar Latihan** (pintasan di Lab, acak, soal berikutnya) tetap menulis ke riwayat kalkulator; makin sering dipakai, makin penuh Kasusmu | `PintasanSoal` |

Walkthrough keluhan pemilik: buka Lab → hero "Lanjutkan" menampilkan soal yang terakhir dikerjakan (S1) → klik → hasil
dalam mode tebak (S2) → tidak ada jalan "lihat saja" selain Lihat jawaban yang membakar XP → frustrasi.

## 5. HMW dan ide

**HMW-1 Bagaimana kalau pengguna yang membuka "kasus" tidak pernah mendarat di soal?**

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| 1a. Saring soal dari Kasusmu & kasus terakhir (penyimpanan tetap satu) | ✓ | sedang (S1 saja) | kecil |
| **1b. Dua benda terpisah: Kasus disimpan di Kasusmu; Soal disimpan di Latihan (status + isian per kode soal). Soal tidak pernah menulis riwayat kasus** | ✓ | tinggi (S1–S3, S5, S10) | sedang |
| 1c. Tetap satu daftar, tapi beri lencana "Soal" dan buka soal selalu sebagai hasil biasa | ✓ | rendah (pelajar kehilangan tebakan) | kecil |

**HMW-2 Bagaimana mode ditentukan oleh niat, bukan riwayat?**

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| **2a. Tempat menentukan mode: dibuka dari Latihan = soal; dari Kasusmu/Lab/Beranda = kasus. Tidak ada sakelar** | ✓ | tinggi | kecil (mengikuti 1b) |
| 2b. Tanya saat membuka ("Buka sebagai soal atau kasus?") | ✗ menyela | sedang | kecil |
| 2c. Sakelar di hasil | ✗ sudah ditolak (riset hero B1–B3) | – | – |

**HMW-3 Bagaimana pelajar melanjutkan soal terputus dan melihat statusnya?**

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| **3a. Status per soal di daftar Latihan: Belum · Terputus · Sudah (benar / lihat jawaban). Baris "Lanjutkan soal K-12" di atas daftar bila ada yang terputus** | ✓ | tinggi | sedang |
| 3b. Simpan isian tebakan per soal (lokal), dihapus saat diperiksa benar atau Kosongkan | ✓ | tinggi untuk J3 | sedang |
| 3c. Soal sudah dikerjakan dibuka langsung dengan jawaban (pembahasan) + tautan "Kerjakan ulang" (0 XP, sesuai spec K5) | ✓ | tinggi untuk J5 | kecil |

**HMW-4 Bagaimana berpindah dari soal/contoh ke kasus sendiri tanpa merusak keduanya?**

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| **4a. Tautan "Jadikan kasus sendiri" di soal yang sudah dikerjakan dan di contoh materi → salinan baru di Kasusmu, sumber "dari soal K-12"; soal asli tetap** | ✓ | tinggi (J6, J7) | kecil |
| 4b. Boleh juga di soal yang belum dikerjakan, dengan peringatan "jawaban terbuka, XP soal ini gugur" | ~ | sedang | kecil |
| 4c. "Jadikan soal" dari kasus sendiri (pengajar) | ✓ | belum ada bukti permintaan | ditunda (riset hero T4) |

**HMW-5 Bagaimana Beranda menawarkan "lanjutkan" untuk dua benda tanpa membingungkan?**

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| 5a. Satu "Terakhir dibuka" gabungan (kasus atau soal, mana yang terbaru) | ~ ambigu, ini persis sumber keluhan | rendah | kecil |
| **5b. Dua baris terpisah, masing-masing hanya bila ada: "Lanjutkan kasus: Almarhum Ahmad · istri, 2 anak" dan "Lanjutkan soal: K-12 'Aul (terputus)"** | ✓ | tinggi | kecil |
| 5c. Beranda hanya kasus; soal hanya di Latihan | ✓ | sedang (pelajar kehilangan pintasan) | kecil |

### Prinsip turunan
1. **Dua benda, dua rumah.** Kasus tinggal di Kasusmu; soal tinggal di Latihan. Tidak ada benda yang tinggal di dua rumah.
2. **Tempat menentukan mode.** Tidak ada sakelar dan tidak ada pertanyaan "mau mode apa".
3. **Menyalin, bukan mengubah wujud.** Soal/contoh menjadi kasus hanya lewat salinan; aslinya tidak berubah.
4. **Kembali selalu aman.** Kasus otomatis tersimpan; soal terputus menyimpan tebakannya; status terlihat.

## 6. Usulan konsep (ringkas, sebelum mockup)

### Benda dan statusnya

| Benda | Rumah | Status | Disimpan di |
|---|---|---|---|
| **Kasus** (sendiri, impor, salinan dari soal/contoh) | Kasusmu (Lab Hitung), Riwayat | Sementara (30 hari) · Tersimpan (bernama) | riwayat + tersimpan (seperti sekarang) |
| **Soal** | Latihan | Belum · Terputus (ada isian, belum diperiksa) · Sudah: benar / dengan lihat jawaban | progres latihan + isian per kode soal (baru) |
| **Contoh materi** | halaman materi | tidak punya status; dilihat saja | tidak disimpan |

### Alur per pintu

| Dari | Klik | Hasil |
|---|---|---|
| Beranda | Lanjutkan kasus | kasus terakhir (hanya kasus) |
| Beranda | Lanjutkan soal | soal terputus terbaru, isian dipulihkan |
| Lab Hitung | hero Lanjutkan / Kasusmu | hanya kasus; soal tidak pernah muncul |
| Lab Hitung | pintasan "Berlatih dengan soal" | membuka soal (dalam rumah Latihan: URL `#/latihan/soal/<kode>`) |
| Latihan | soal Belum | tebak dari kosong |
| Latihan | soal Terputus | tebak, isian dipulihkan |
| Latihan | soal Sudah | pembahasan (jawaban terbuka) + tautan "Kerjakan ulang" + "Jadikan kasus sendiri" |
| Materi | Coba di kalkulator | hasil hanya-baca + tautan "Jadikan kasus sendiri" |

### Keluar
- **Kasus:** tanpa dialog bila hasil lengkap; status "Tersimpan di riwayat · 17.26" di hero (S3 lama). Dialog peramban
  hanya untuk isian wizard yang belum lengkap (sudah ada).
- **Soal:** tanpa dialog; kalimat kecil "Tebakanmu tersimpan, lanjutkan kapan saja dari Latihan". Soal menjadi Terputus.

### Migrasi data lama
Entri riwayat dengan `sumber: latihan` disembunyikan dari Kasusmu (tidak dihapus); isinya tidak dipakai lagi karena status
soal sudah ada di progres latihan. Entri `materi` diperlakukan sama. PR #55 diganti oleh konsep ini (S4 hilang).

### Dampak kode (perkiraan)
`Aplikasi.tsx` (sesi soal terpisah dari sesi kasus: tidak `catatRiwayat`, tidak `simpanLokal`), `kasusmu.ts` (saring
sumber latihan/materi), `rute.ts` (rute soal), progres latihan (+ status Terputus + isian), `DaftarSoalHitung` (status &
"Lanjutkan soal"), `Beranda` (dua baris), `Hasil` (tautan "Jadikan kasus sendiri", mode pembahasan untuk soal sudah).

## 7. Yang perlu diputuskan pemilik

1. **Dua benda terpisah (1b) atau cukup saring (1a)?** Rekomendasi: 1b. 1a menutup keluhan hari ini tetapi status soal
   tetap tinggal di dua tempat.
2. **Beranda: dua baris (5b) atau hanya kasus (5c)?** Rekomendasi: 5b.
3. **Isian tebakan soal terputus disimpan (3b)?** Rekomendasi: ya, lokal saja dulu; ikut akun nanti bersama spec percobaan.
4. **"Jadikan kasus sendiri" boleh di soal yang belum dikerjakan (4b)?** Rekomendasi: tidak; hanya sesudah dikerjakan
   (lebih sederhana, tidak ada urusan XP gugur).
5. Soal sudah dikerjakan dibuka sebagai **pembahasan** (3c) dengan "Kerjakan ulang" sebagai tautan. Setuju?

## 8. Belum diaudit / asumsi
- Belum ada pengamatan pengguna A dan B; semua JTBD dari keluhan pemilik dan riset sebelumnya [Asumsi].
- Nasib isian tebakan saat keluar belum dicek di kode (S7).
- Kasus yang dibagikan lewat tautan (`KasusDibagikan`) dan munasakhat/linimasa tidak dibahas; keduanya kasus, jadi ikut
  aturan kasus.
- Kelas (tugas dari pengajar) akan menambah benda ketiga "Tugas"; konsep "dua rumah" sengaja menyisakan tempat untuknya
  di rumah Latihan.

## 9. Langkah sesudah dipilih
Mockup statis (Beranda dua baris, Lab tanpa soal di Kasusmu, Latihan dengan status + Lanjutkan soal, hasil soal
"pembahasan" dengan tautan Jadikan kasus sendiri) + panduan uji, lalu spec dan implementasi.

## 10. Revisi mockup (2026-11-23, sore)

Masukan pemilik: mockup pertama tidak mengikuti gaya Logivo, status soal tampil sebagai label kaku, dan judul soal
membocorkan susunan keluarga.

### 10a. Gaya
Mockup memakai kerangka yang sudah ada di aplikasi, bukan token lama: hero gelap teal dengan cahaya jingga
(`beranda.css .hero-beranda`), panel kaca untuk "Lanjutkan" (`belajar.css .panel-lanjut`), latar krem, kartu putih radius
24px, ubin bergradasi, judul Parkinsans 500 rapat, dan baris soal per bab dengan bar kemajuan (`latihan.css`).

### 10b. Status soal: pola di tempat lain (dari pengamatan umum, belum dicek ulang per aplikasi)
| Aplikasi | Cara menampilkan |
|---|---|
| LeetCode | ikon kecil di depan judul: centang hijau = selesai, lingkaran jingga = pernah dicoba; tidak ada label teks di baris |
| Duolingo | cincin kemajuan di tiap unit; terisi sebagian = sedang jalan |
| Khan Academy | kotak kecil berwarna bertingkat (dicoba, kenal, mahir) dengan legenda sekali di atas |
| Brilliant / Exercism | ikon status + satu baris keterangan; tombol berubah kata (Mulai / Lanjutkan / Tinjau) |

Pola bersama: **satu tanda visual di depan baris + legenda sekali**, keterangan teks hanya untuk keadaan yang perlu
tindakan, dan **kata tombol mengikuti status**. Label/chip di setiap baris dihindari karena ramai.

Penerapan: cincin 30px yang memperluas `.status-soal-baru` yang sudah ada.
- Belum dikerjakan: cincin putus-putus (sudah ada di aplikasi).
- Terputus: cincin jingga terisi sesuai jumlah isian (mis. 1 dari 5), baris disorot `--aksen-soft`, keterangan
  "Terputus, 1 dari 5 isian", tombol hitam "Lanjutkan".
- Sudah, benar: lingkaran hijau `--sorot-fardh` dengan centang (sudah ada).
- Sudah, lihat jawaban: lingkaran abu dengan ikon mata. Netral, bukan merah: tidak menghukum.
Teks status tetap ada untuk pembaca layar (`aria-label`) dan di keterangan baris untuk yang sudah selesai.

### 10c. Judul soal
Mengikuti aturan soal buta yang sudah ada (`layar/belajar/judulSoal.ts`): sebelum dikerjakan hanya "Soal K-12" + bab +
tingkat; judul asli terbuka setelah benar atau jawaban dibuka. Berlaku juga di Beranda dan panel "Lanjutkan soal".
