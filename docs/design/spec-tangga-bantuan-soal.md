# Spec: tangga bantuan soal hitung (2026-11-23)

Menggantikan "Lihat jawaban" (dialog tahan, semua jawaban sekaligus) di soal latihan bertabel. Mode Ujian tidak berubah.
Status: **konsep disetujui pemilik 2026-11-23**; mockup `mockup-tangga-bantuan.html` revisi 4; bagian 6 (peta diksi) revisi 7 menunggu persetujuan; kode belum disentuh.

## 1. Masalah sekarang
- Lihat jawaban tersedia sejak detik pertama, cukup ditahan, dan membuka semua kolom sekaligus. Pelajar yang buntu di satu
  kolom kehilangan seluruh soal, padahal sebagian besar sudah bisa ia kerjakan.
- Periksa tak terbatas dan umpan menunjuk kolom salah: kolom pilihan bisa ditebak satu per satu tanpa biaya, XP tetap penuh.
- Tidak ada bantuan di antara "coba sendiri" dan "jawaban penuh". Menurut riset tutor cerdas (Baker dkk., *gaming the
  system*), celah inilah yang membuat orang menekan tombol sampai jawaban keluar.

## 2. JTBD
- Saat buntu di satu langkah, aku ingin **didorong sedikit**, bukan diberi jawaban, supaya aku tetap merasa mengerjakan sendiri.
- Saat benar-benar tidak tahu, aku ingin **melihat jawaban langkah itu saja**, lalu melanjutkan sisanya sendiri.
- Saat sudah menyerah, aku ingin **melihat semuanya dengan cepat**, tanpa membuka kolom satu per satu.
- Sebagai pemilik: XP harus mencerminkan seberapa mandiri soal itu dikerjakan, dan aturannya transparan.

## 3. HMW
- Bagaimana kalau bantuan *datang* setelah pelajar berusaha, bukan tersedia sejak awal?
- Bagaimana kalau bantuan bertingkat per kolom, dari konsep umum ke singgungan kasus, baru jawaban?
- Bagaimana kalau harga setiap bantuan terlihat sebelum diambil, sehingga pilihan itu disadari, bukan dihukum diam-diam?
- Bagaimana kalau soal yang selesai dengan bantuan diajak untuk diulang nanti, supaya pelajar ingin kembali?

## 4. Alur
```
Mulai  →  isi  →  Periksa ─ benar ─→ selesai (predikat)
                     │
                   salah / belum lengkap (≥1 kolom terisi) = 1 usaha
                     │
             usaha ≥ 2  →  tautan "Butuh bantuan?" di kolom pertama yang salah/kosong
                     │
   Tangga per kolom:
     1  Petunjuk konsep      (umum, tanpa angka kasus)
     2  Singgungan kasus     ("Ingat, di kasus ini ada …")
     3  Buka jawaban kolom   (pertama kali di soal ini: ketik "hangus" → XP soal = 0)
                     │
     setelah XP hangus  →  tautan "Buka sisanya"
```
- **Usaha** = Periksa dengan hasil salah, atau belum lengkap asalkan minimal satu kolom terisi. Jalan keluar bagi yang buntu
  di kolom pertama: Periksa dengan kolom pertama terisi sebagian sudah dihitung usaha.
- Tangga selalu di **kolom pertama yang belum benar** (dari `putusanLatihan`). Setelah kolom itu benar atau dibuka, tangga
  pindah ke kolom berikutnya dan mulai lagi dari anak tangga 1; tidak ada syarat 2 usaha lagi.
- Ketik "hangus" hanya sekali per percobaan soal, saat XP benar-benar akan hilang. Kalau soal ini sudah pernah benar (XP
  sudah didapat) atau XP sudah hangus, buka kolom tanpa mengetik.
- "Lihat semua jawaban" dihapus. "Buka sisanya" hanya tampil setelah XP hangus.
- Kosongkan / Kerjakan ulang = percobaan baru: hitungan usaha dan anak tangga kembali ke nol. XP tetap mengikuti aturan
  server (benar pertama saja).

## 5. XP (server, `xp_soal_baru`) — revisi 2026-11-23
Dibingkai sebagai **untung**, bukan potongan. Alasan:
- *Loss aversion* (Kahneman & Tversky): kehilangan terasa sekitar dua kali lebih berat daripada untung yang sama besar.
  "−3 XP" di setiap tombol terasa seperti hukuman, sedangkan "bonus mandiri" yang tidak didapat terasa seperti peluang.
- *Help avoidance* (Aleven dkk., kajian *help seeking* di lingkungan belajar interaktif): kalau bantuan mahal, pelajar
  yang paling butuh justru menghindarinya, lalu menyerah atau menebak. Harga bantuan harus kecil dan sekali saja.
- Salah adalah bagian dari belajar (*desirable difficulties*, Bjork). Memotong XP per salah membuat orang takut menekan
  Periksa, padahal Periksa itulah umpan baliknya.

Aturannya:
- Benar tanpa membuka kolom = **XP dasar** (60% bobot).
- **Bonus mandiri** (40% bobot) hanya kalau benar tanpa petunjuk **dan** Periksa salah tidak lebih dari 3 kali. Batas 3
  menutup celah menebak kolom pilihan satu per satu (biasanya 6–8 pilihan), tanpa menghukum salah biasa.
- Petunjuk berapa pun hanya melepas bonus (sekali), tidak ada potongan per petunjuk.
- Buka kolom sebelum benar pertama = 0 XP selamanya.
- Hitungan dilakukan di semua sesi sebelum benar pertama; Kosongkan tidak memutihkan.

Di layar hanya ada satu penanda di kepala tabel: "12 XP · ☆ +8 mandiri". Saat bonus lepas, chip itu dicoret. Tidak ada
harga di setiap tombol.

## 5a. Tampilan petunjuk — revisi 2026-11-23
- Tidak ada daftar tiga anak tangga. Setelah 2 usaha, umpan merah mendapat satu tautan **Lihat petunjuk**.
- Kartu kuning "Petunjuk · kolom Bagian" berisi petunjuk 1. Di bawahnya hanya satu aksi berikutnya: "Masih buntu?
  Petunjuk berikutnya", lalu setelah petunjuk 2 "Tunjukkan jawaban kolom Bagian" (merah). Petunjuk yang sudah dibuka
  tetap tampil bertumpuk di kartu yang sama.
- Umpan salah menunjuk **kolom**, tidak menunjuk baris ("Kolom **Bagian** belum tepat semua"); seluruh kolom diberi warna
  merah. Menunjuk baris membuat kolom dengan dua pilihan (misalnya istri 1/4 atau 1/8) langsung tertebak. (Revisi 3.)
- Petunjuk menyenggol, tidak menjurus. Petunjuk 1 = konsep umum dari jenis jejak, tanpa nama orang dan tanpa nilai
  ("Bagian tetap seseorang bisa mengecil karena ahli waris lain ikut hadir"). Petunjuk 2 = menyempit ke siapa yang perlu
  dicek ("Coba lihat lagi bagian istri"), tetap tanpa nilai. Yang paham akan berkata "oh iya"; yang menebak tetap
  tidak tahu nilainya. Tautan materi ke bab yang sesuai jejak (di sini hajb nuqshan).
- "Buka sisanya" dinamai **Buka semua kolom**, hanya muncul setelah ada kolom dibuka (XP sudah hilang).
- Daftar Latihan memakai gaya baris yang ada sekarang (DaftarSoalHitung). Tambahannya hanya keterangan
  (mandiri / dengan petunjuk / satu kolom dibuka) dan penanda **layak diulang**. Judul tetap buta sampai selesai
  (`judulSoalTampil`). Predikat berupa kalimat di layar selesai ("Dua dari tiga kolom kamu selesaikan sendiri"),
  bukan label.

## 6. Peta diksi petunjuk (revisi 7, 2026-11-24, menunggu persetujuan pemilik)
Fikih hanya dari KB; tidak ada kalimat fikih yang dikarang per soal. Kalimat = draf; setelah disetujui masuk diksi (fase 2).

### 6.0 Akar masalah revisi 5–6 (dasar revisi 7)
1. **Sumber petunjuk = alasan jawaban.** Kalimat diturunkan dari `LangkahJejak`, yaitu *kenapa* kuncinya begitu. Petunjuk yang
   bersumber dari alasan jawaban hanya bisa spesifik (bocor, revisi 5) atau samar (tak berguna, lalu ditambal formula, revisi 6).
2. **Satu pola untuk dua jenis kolom.** Kolom pilihan (Bagian, Didudukkan sebagai) = mengenali keadaan; pilihan yang masuk akal di
   satu baris biasanya hanya dua, jadi petunjuk yang membedakannya sama dengan jawaban. Kolom bilangan = prosedur; menyebut formula
   aman karena pelajar tetap harus menghitung.
3. **Petunjuk 2 menyebut baris**, padahal umpan sengaja hanya menunjuk kolom (revisi 3). Nama baris + dua pilihan = jawaban.
4. **Petunjuk tidak membaca isian pelajar.** Umpan *tentang kesalahan* dan pertanyaan agar pelajar menjelaskan pilihannya sendiri
   (Narciss: umpan tentang kesalahan/konsep/cara melanjutkan; Chi: *self-explanation*) tidak membutuhkan kunci, jadi tidak bocor.
5. **Urutan tangga terbalik.** Pola tutor yang lazim (VanLehn; Aleven & Koedinger): *menunjuk* → *mengajar* (prinsip/contoh) →
   jawaban. Revisi 5 menaruh prinsip bernama di petunjuk 1.

### 6.1 Pola: sumber petunjuk berbeda per jenis kolom
| | Kolom pilihan (`bagian`, `bagianPerantara`, `bagian · mayit`, `didudukkanSebagai`, `bagianKemungkinan`) | Kolom bilangan (`asalMasalah`, saham, `asalMasalahAkhir`, `pengali`, `jamiah`, `sahamKemungkinan`, `jamiahSekarang`) |
|---|---|---|
| **Petunjuk 1** | **Tentang isian pelajar** (6.2): kalimat menurut jenis kekeliruan, tanpa baris, ditambah arah perhatian berupa **kategori keluarga** (6.3), bukan orang | **Cek diri atas akibat isian**: jumlahkan, apakah bulat, apakah sama dengan asal masalah (6.5–6.9) |
| **Petunjuk 2** | **Pasangan kontras dari kasus lain** (6.4): dua kasus bab 16 dengan peran yang sama, satu dengan faktor itu dan satu tanpa; pelajar memeriksa sendiri faktor mana yang ada di keluarganya. Tanpa pasangan → tautan materi | **Formula** (KPK, FPB, pengali); boleh menyebut baris/kelompok karena tetap harus dihitung |
| **Langkah 3** | Buka jawaban kolom | Buka jawaban kolom |

Aturan tetap:
- "Ingat **{istilah}**" hanya untuk nama **prosedur** (ashlul mas'alah, saham, jami'ah, tanzil, mauquf), tidak pernah untuk nama
  **keadaan** ('aul, radd, inkisar, hajb nuqshan, akdariyyah, musyarrakah, 'umariyyatain, takmilah, kalalah, ma'al ghair, …): nama
  keadaan menyatakan hasilnya.
- Nama keadaan dan kasus khusus baru muncul di layar selesai sebagai pelajaran ("Kasus ini disebut **akdariyyah**";
  `hitung.selesai.namaKasus.<nama>`, bertooltip).
- Tidak pernah nilai jawaban soal ini, tidak menyebut jumlah pilihan, tidak berupa pertanyaan yang jawabannya pasti ya/tidak.
- KPK dan FPB bertooltip berisi nisab arba' (bab 10.2); istilahnya tidak ditanyakan.
- Kunci diksi: `hitung.bantuan.p1.<kunci>` / `hitung.bantuan.p2.<kunci>`.

### 6.2 Kolom pilihan — Petunjuk 1 menurut jenis kekeliruan
Ditentukan dari isian vs kunci pada **sel salah pertama** (baris tidak disebut). `{kemungkinan}` hanya di kolom taqdir.
| Kunci | Kapan (isian → kunci) | Petunjuk 1 |
|---|---|---|
| `pilihan.terhalangKeliru` | memilih Terhalang, padahal mewarisi | Kamu menandai ada yang tidak mendapat bagian. Siapa yang menurutmu menghalanginya, dan apakah orang itu memang lebih dekat ke almarhum? |
| `pilihan.mewarisiKeliru` | memberi bagian, padahal terhalang (`HAJB_HIRMAN`, `MANI`) | Periksa lagi: apakah semua orang yang kamu beri bagian memang berhak mewarisi di keluarga ini? |
| `pilihan.caraKeliru` | bagian pasti ↔ Ashabah ↔ 1/6 + Ashabah | Ada yang cara mewarisinya belum tepat. Untuk tiap orang, tanyakan: ia mendapat bagian pasti, menerima sisa, atau keduanya, dan apa yang menentukannya? |
| `pilihan.besarKeliru` | sama-sama bagian pasti, besarnya beda | Ada bagian pasti yang besarnya belum sesuai. Siapa saja di keluarga ini yang kehadirannya bisa membesarkan atau mengecilkan bagian orang lain? |
| `pilihan.kedudukanKeliru` | kolom `didudukkanSebagai` | Ingat **tanzil**. Ada kerabat yang kedudukannya belum tepat. Telusuri lagi lewat siapa tiap kerabat bersambung ke almarhum. |
Di kolom taqdir kalimat diawali "Pada kemungkinan **{kemungkinan}**, …". Di kolom `bagianPerantara` diakhiri "Perlakukan tiap
perantara seperti ahli waris biasa."

### 6.3 Arah perhatian (kalimat kedua petunjuk 1, kolom pilihan)
Satu kalimat "Perhatikan terutama **{kategori}** almarhum." Kategori diturunkan dari jejak sel itu, menyebut **bagian keluarga**,
bukan orang dan bukan aturannya. Bila satu sel punya dua kategori, keduanya disebut supaya arah tidak bocor.
| Kategori (kunci `fokus.<x>`) | Teks | Dari jejak | Rujukan |
|---|---|---|---|
| `keturunan` | keturunan | `ADA_`/`TANPA_FARU_WARITS`, `ADA_FARU_MUDZAKKAR`/`MUANNATS`, hajib far'u warits | [R04-2] [R04-4] [R04-5] [R06-5] |
| `saudara` | saudara-saudara | `JAM_IKHWAH`, `HAJB_NUQSHAN` penyebab saudara | [R04-4] [R06-6] |
| `keturunanDanSaudara` | keturunan dan saudara-saudara | `FARDH` ibu (semua alasan) | [R04-4] |
| `generasiAtas` | ayah, ibu, dan kakek | `KALALAH`, hajib ayah/kakek, nenek oleh ibu/ayah | [R04-9] [R04-10] [R04-14] [R04-16] [R06-4] |
| `sederajat` | orang yang sederajat dengannya | `TANPA_MUASHSHIB`, `TAKMILAH`, `ASHABAH` bilGhair/maalGhair, `NENEK_TANPA_IBU` | [R04-8] [R04-11]–[R04-15] [R05-4] [R05-5] |
| `lebihDekat` | siapa yang lebih dekat hubungannya | `HAJB_HIRMAN` antar ashabah, `ASHABAH` binNafsi | [R05-2] [R05-3] [R06-3] |
| `kakekSaudara` | kakek dan saudara-saudara | `JADD_*`, `pilihanJadd`, `KASUS_KHUSUS` muaddah | [R08-1]–[R08-4] |
| `sifatOrang` | keadaan diri tiap ahli waris (agama, pembunuhan, wafat bersamaan) | `MANI` | [R02-2] [R02-4] [R02-8] [R13-10] |
| (tanpa) | — | `KASUS_KHUSUS` akdariyyah/musyarrakah/umariyyatain, `KHILAF_MADZHAB`: tanpa arah perhatian, karena kategori apa pun menunjuk kasusnya | [R07-1] [R07-2] [R08-5] |

### 6.4 Kolom pilihan — Petunjuk 2: pasangan kontras dari bab 16
Kalimat tetap `p2.kontras`: "Bandingkan dua kasus lain. **{kasusA}**: {peran} mendapat {bagianA}. **{kasusB}**: {peran} mendapat
{bagianB}. Apa yang berbeda di antara keduanya? Sekarang periksa keluargamu." Nilai yang tampil milik kasus pembanding, bukan soal
ini; karena keduanya ditampilkan (dengan dan tanpa faktor), petunjuk tidak memberi tahu arah mana yang berlaku di soal ini.

Pemilihan (fungsi murni, data dari suite bab 16 yang sudah dijalankan engine):
1. Ambil peran baris salah pertama (kunci ahli waris, mis. `ISTRI`) dan kunci petunjuknya (tabel di bawah).
2. Cari dua kasus bab 16 yang memuat peran itu dengan **kunci jawaban berbeda** dan jejak dari kelompok yang sama.
3. Kasus yang susunannya sama dengan soal ini dibuang. Tanpa pasangan → `p2.materi`: "Baca lagi subbab **{judulMateri}**, lalu
   periksa keluargamu." dengan tautan materi.
4. Kasus khusus dan khilaf selalu `p2.materi` (contoh mana pun sama dengan jawabannya).

Cakupan pasangan di bab 16 sekarang:
| Peran / kelompok jejak | Pasangan kontras | Rujukan | Materi |
|---|---|---|---|
| Suami (far'u warits) | 16.2 (1/2) ↔ 16.16 (1/4) | [R04-2] | bab 4.3 |
| Istri (far'u warits) | 16.3 (1/4) ↔ 16.20 (1/8) | [R04-2] [R04-3] | bab 4.4 |
| Ibu | 16.4 (1/3) ↔ 16.15 (1/6, saudara) / 16.20 (1/6, keturunan) | [R04-4] [R06-6] | bab 4.7 |
| Ayah | 16.20 (1/6) ↔ 16.21 (1/6 + Ashabah) ↔ 16.15 (Ashabah) | [R04-5] | bab 4.5 |
| Anak pr | 16.21 (1/2) ↔ 16.6 (2/3) ↔ 16.1 (Ashabah) | [R04-11] [R05-4] | bab 4.10 |
| Cucu pr | 16.8 (1/6) ↔ 16.18 (Ashabah) | [R04-12] [R04-13] | bab 4.11 |
| Saudari kandung | 16.5 (2/3) ↔ 16.8 (Ashabah) | [R04-14] [R05-5] | bab 4.12 |
| Saudari sebapak | 16.17b (1/6) ↔ 16.17 (Ashabah bersama saudara lk sebapak, sisa habis) | [R04-14] [R04-15] | bab 4.13 |
| Saudara lk kandung (hirman) | 16.15 (Terhalang) ↔ 16.14 (Ashabah) | [R06-4] [R08-1] | bab 6.4 |
| Paman / urutan ashabah | 16.19 (Terhalang) ↔ — | [R05-3] | bab 5.3 → `p2.materi` |
| Nenek | 16.23 saja | [R04-8] [R04-9] | bab 4.8 → `p2.materi` |
| Saudara seibu | 16.7 / 16.11 (1/3), tanpa pembanding terhalang | [R04-16] [R06-5] | bab 4.9 → `p2.materi` |
| Kakek bersama saudara, mu'addah | 16.14 saja | [R08-2] [R08-4] | bab 8 → `p2.materi` |
| Mani' | tidak ada | [R02-2] | bab 2 → `p2.materi` |
| Didudukkan sebagai (tanzil) | 16.24 saja | [R14-6] [R14-7] | bab 14.5 → `p2.materi` |
| Taqdir (`bagianKemungkinan`) | tidak ada di bab 16 | [R13-4] | bab 13a–13c → `p2.materi` |
| Kasus khusus, khilaf | sengaja tidak | [R07-1] [R07-2] [R08-5] | bab 7, 8, 18 → `p2.materi` |
Menambah pasangan cukup dengan menambah kasus terverifikasi ke bab 16 (tidak menambah kalimat diksi).

### 6.5 Kolom **Asal masalah** dan kolom saham
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `ashl` | kepala `asalMasalah` (`KELAS_MASALAH`, `PERBANDINGAN_NISAB` `ashl`; juga tabel semua ashabah) | Ingat **ashlul mas'alah**: angka terkecil yang bisa dibagi oleh semua penyebut. | Lihat lagi penyebut di kolom Bagian. Sudahkah kamu mencari KPK-nya? Kalau tidak ada bagian pasti, hitung jumlah kepala penerima sisa. | [R09-1] [R09-2] [R10-1] [R10-4] | bab 9.1, 10.2 |
| `saham` | sel saham kelompok (fardh atau ashabah) | Ingat **saham**: bagian dalam bilangan bulat dari asal masalah. | Lihat lagi **{nama}**. Ubah bagiannya menjadi saham dari asal masalahmu; untuk penerima sisa, lihat apa yang belum terbagi. | [R09-1] [R05-1] | bab 9.1, 5.1 |
| `ashl.kemungkinan` | kolom `sahamKemungkinan` (taqdir) | Ingat **ashlul mas'alah**. Tiap kemungkinan punya masalahnya sendiri. | Lihat lagi kemungkinan **{kemungkinan}**. Hitung seolah-olah itu satu-satunya keadaan. | [R13-16] [R13-4] | bab 13a.5 |

### 6.6 Kolom **Asal masalah akhir**
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `jumlahSaham` | kepala salah: `KELAS_MASALAH` (adilah/ailah/raddA/raddB), `AUL`, `RADD`, `SISA_KELUAR` | Jumlahkan semua saham di kolom sebelumnya. Apakah pas dengan asal masalahmu, lebih, atau kurang? | Kalau jumlahnya tidak sama dengan asal masalah, harta itu kurang atau bersisa. Siapa yang ikut menanggung kekurangannya, atau siapa yang berhak atas sisanya? | [R09-3] [R09-4] [R09-7] [R09-9] [R09-10] [R14-13] | bab 9.2–9.4 |
| `jumlahSaham.perOrang` | sel salah dengan kepala benar, setelah 'aul/radd | Ingat **saham**. Setelah asal masalah berubah, apakah saham tiap orang ikut berubah? | Lihat lagi **{nama}**. Periksa apakah dia memang ikut berbagi perubahan itu, dan dengan perbandingan apa. | [R09-3] [R09-7] [R09-9] | bab 9.3–9.4 |
| `saudariKakek.akhir` | `AUL` + `KASUS_KHUSUS` `akdariyyah` | Lihat kembali bagian kakek dan saudari setelah asal masalah berubah. Apakah pembagian keduanya sudah selesai? | Lihat lagi **{kakek}** dan **{saudari}**. Bandingkan saham keduanya. Apakah perbandingannya sama dengan saudara laki-laki dan perempuan yang berbagi sisa? | [R08-5] [R09-4] | bab 8 |
| `bulat` | `PERBANDINGAN_NISAB` `inkisar`/`juzSahm`, `TASHIH` | Coba bagi saham tiap kelompok ke jumlah orangnya. Apakah semuanya dapat bilangan bulat? | Lihat lagi saham **{kelompok}** dan jumlah orangnya. Berapa FPB keduanya? Kalau lebih dari satu kelompok, angka-angka itu digabung dengan KPK. | [R10-1] [R10-2] [R10-3] [R10-4] [R09-2] | bab 10.2–10.3 |
| `bulat.perOrang` | sel orang salah setelah tashih | Ingat **saham**. Bagian kelompok dibagi berapa untuk mendapat bagian satu orang? | Lihat lagi **{nama}**. Dalam kelompoknya, apakah semua anggota dihitung sama? | [R10-2] [R09-2] [R04-11] | bab 10.3 |

### 6.7 Munasakhat (`bagian · mayit` memakai 6.2–6.4; `masalahPertama` terkunci tanpa petunjuk)
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `munasakhat.masalah` | kolom `masalahLanjutan` | Harta yang dibagi di kolom ini milik siapa, dan siapa ahli warisnya saat itu? | Lihat lagi **{mayit}**. Hitung masalahnya seperti soal biasa, dengan ahli waris yang hidup saat ia wafat. | [R12-1] [R12-5] [R12-3] | bab 12.1–12.3 |
| `munasakhat.pengali` | baris `pengali`, `MUNASAKHAT` (semua hubungan) | Ingat **jami'ah**. Supaya dua masalah bisa digabung, keduanya perlu disamakan dulu. | Lihat lagi masalah **{mayit}** dan saham yang ia terima dari mayit sebelumnya. Berapa FPB keduanya? Ingat juga penggabungan sesudahnya. | [R12-2] [R12-3] [R10-1] | bab 12.3–12.4 |
| `munasakhat.jamiah` | kolom `jamiah` (kepala dan sel orang) | Ingat **jami'ah**. Apakah semua saham sekarang dihitung dari angka yang sama? | Lihat lagi **{nama}**. Apakah ia menerima dari lebih dari satu mayit? Periksa tiap bagiannya setelah dikalikan pengali masing-masing. | [R12-2] | bab 12.4 |

### 6.8 Taqdir dan dzawil arham (kolom bilangan)
`bagianKemungkinan` dan `didudukkanSebagai` memakai 6.2–6.4; `sahamKemungkinan` memakai `ashl.kemungkinan` (6.5).
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `kemungkinan.jamiah` | kolom `jamiahSekarang` (kepala) | Ingat **jami'ah**. Masalah dari tiap kemungkinan perlu disamakan dulu. | Lihat lagi masalah tiap kemungkinan. Sudahkah kamu mencari KPK-nya? | [R13-16] [R10-1] | bab 13a.5, 10.2 |
| `kemungkinan.pemberian` | `TAQDIR_PEMBERIAN` (aqall/ditahan/kelasD), `MAUQUF` | Ingat **mauquf**. Bagian mana yang aman diberikan sekarang, apa pun yang terjadi nanti? | Lihat lagi **{nama}** di semua kemungkinan. Bagian berapa yang pasti ia terima di mana pun? | [R13-4] [R13-15] [R13-16] | bab 13a.5 |
| `tanzil.pembagian` | `DZAWIL_ARHAM_TURUN`; K14-3 | Ingat **tanzil**. Setelah perantara mendapat bagian, bagian itu diteruskan kepada siapa? | Lihat lagi **{perantara}** dan siapa saja yang bersambung lewat dia. | [R14-8] [R14-9] | bab 14.5 |
| `tanzil.pasangan` | `DZAWIL_ARHAM_GABUNG_PASANGAN` | Ingat **jami'ah**. Bagian pasangan dan masalah kerabat perlu disamakan dulu. | Bandingkan sisa setelah bagian pasangan dengan masalah para perantara. Berapa FPB keduanya? | [R14-12] [R12-2] | bab 14.9 |
`TAQDIR_LEBUR` tidak punya kolom (K13c-1). `TURUN`/`GABUNG_PASANGAN` hanya dipakai bila kolomnya memuat sel (dicek di fase 2).

### 6.9 Templat umum (tanpa jejak yang cocok)
| Kunci | Kapan | Petunjuk 1 | Petunjuk 2 |
|---|---|---|---|
| `umum` | kolom belum terpetakan | Kolom ini bergantung pada kolom sebelumnya. Apakah kolom itu sudah benar? | Lihat lagi kolom **{kolom}** baris **{nama}**. Dari mana kamu mendapat isiannya? |
| `kosong` | belum lengkap | Masih ada kotak yang kosong di kolom **{kolom}**. | Lihat lagi kolom **{kolom}**. Isi semua baris dulu, lalu Periksa lagi. |

### 6.10 Catatan
1. **Tidak ada baris `blocked`**: bab 17.4 kosong (per 2026-11-22); semua baris ber-kode R. Sumber sekunder (UI menyebut
   sumbernya): R13-20 taqdir haml [SYF] (al-Ahdal), K14-4 jihah [HNB] (Lahim).
2. **Jumlah kalimat**: kolom pilihan 5 kalimat P1 + 9 arah perhatian + 2 kalimat P2 (`kontras`, `materi`); kolom bilangan ±13
   kunci (6.5–6.8); templat 2; nama kasus 7. Kunci per varian jejak (revisi 5–6) dihapus.
3. **Data baru**: indeks pasangan kontras dibangun dari hasil engine atas suite bab 16 (peran → kunci jawaban → kasus), di
   `packages/latihan`. Tidak ada tabel kalimat fikih yang ditulis tangan.
4. **Perlu persetujuan pemilik**: (a) KPK dan FPB masuk glosarium bab 15 sebagai tooltip; (b) arah perhatian 6.3 dinyalakan
   (kalau terasa masih menjurus, petunjuk 1 kolom pilihan cukup kalimat 6.2 saja).
5. **Dicek di fase 2**: label `{kelompok}` dari `IdKelompok`, jejak ashabah yang tak kebagian sisa (R06-7), dan apakah kasus bab 16 sudah
   ada sebagai fikstur yang bisa dijalankan engine.
- **Buka kolom (anak tangga 3)**: kunci kolom itu tampil seperti mode kunci sekarang; isian yang berbeda dicoret.


## 7. Supaya ingin kembali
- Predikat per soal, kata tanpa medali (memori: latihan aksi terlihat jelas): **Mandiri** (tanpa bantuan),
  **Dibantu** (pakai petunjuk), **Dibuka** (ada kolom yang dibuka).
- Soal Dibantu/Dibuka diberi penanda "Ulangi nanti" di daftar Latihan. Kerjakan ulang yang berhasil Mandiri mengganti
  predikatnya (XP tetap mengikuti aturan server).
- Umpan saat benar menyebut kemajuannya: "Kolom hajb kali ini tanpa petunjuk."
- Gerak tipis saat tautan bantuan muncul (memori: UI tidak flat), tanpa suara mengagetkan.

## 8. Data dan kode
- `KejadianPercobaan.aksi` + `'petunjuk' | 'bukaKolom'`, dengan `bantuan: { idKolom, tingkat: 1 | 2 }` / `{ idKolom }`.
  Migrasi: perluas cek `aksi` di `percobaan_soal`, ubah `xp_soal_baru`, dan tambah tes pgTAP.
- `TabelLatihan`: buang `saatLihatJawaban`; tambah state tangga per kolom; mode kunci per kolom (sekarang semua-atau-tidak).
- `packages/latihan`: fungsi murni `singgunganKolom(idJudul, jejak) → Singgungan | null` (data, bukan kalimat).
- Diksi baru lewat `pnpm diksi:tambah`.
- Gharqa: tangga hanya berlaku di tabel harta; langkah keputusan (3 pilihan) tetap tanpa bantuan. Gharqa juga belum
  menyimpan isian; diselesaikan bersamaan.

## 9. Celah yang diketahui (diterima)
- Membuka jawaban saat offline di perangkat lain lalu benar di perangkat ini bisa tetap memberi XP (server memakai waktu
  diterima). Dampaknya kecil.
- Kasus yang sama bisa dimasukkan ke Kalkulator. Ini latihan, bukan ujian; pengamannya mode Ujian.

## 10. Langkah berikutnya
1. Mockup statis (keadaan: awal, salah 1×, tautan bantuan, petunjuk 1, petunjuk 2, dialog ketik "hangus", kolom dibuka,
   Buka sisanya, selesai + predikat), lalu pemilik memilih.
2. Server: migrasi + tes XP.
3. Web: tangga di `TabelLatihan`, singgungan di `packages/latihan`, diksi.
