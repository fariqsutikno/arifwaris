# Spec: tangga bantuan soal hitung (2026-11-23)

Menggantikan "Lihat jawaban" (dialog tahan, semua jawaban sekaligus) di soal latihan bertabel. Mode Ujian tidak berubah.
Status: **konsep disetujui pemilik 2026-11-23**; mockup `mockup-tangga-bantuan.html` revisi 4; bagian 6 (peta diksi) revisi 6 menunggu persetujuan; kode belum disentuh.

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

## 6. Peta diksi petunjuk (revisi 6, 2026-11-24, menunggu persetujuan pemilik)
Fikih hanya dari KB; tidak ada kalimat yang dikarang per soal. Petunjuk dipilih dari `LangkahJejak` yang menjelaskan
**sel salah pertama**, jadi sesuai kasus dan ber-refs. Kalimat = draf; setelah disetujui masuk diksi (fase 2).

Revisi 6 (koreksi pemilik atas revisi 5): nama konsep yang menentukan hasil ('aul, radd, inkisar, akdariyyah, dst.) tidak lagi
disebut di petunjuk, karena menyebutnya sama dengan memberi jawaban. Petunjuk berubah sudut pandang: **dari menjelaskan aturan
menjadi mengajak memeriksa pekerjaan sendiri**. Hitungan memakai KPK dan FPB, bahasa yang sudah dikenal pelajar.

### 6.1 Pola dan aturan penulisan
- **Petunjuk 1** = kata kunci umum atau satu pertanyaan cek diri. Boleh diawali "Ingat **{istilah}**." hanya untuk istilah
  payung yang tidak menentukan hasil: **hajb**, **fardh**, **ta'shib**, **ashlul mas'alah**, **saham**, **jami'ah**, **tanzil**,
  **mauquf**, **mani'**. Tanpa nama orang, tanpa nilai.
- **Petunjuk 2** = arahkan ke baris/kelompok tertentu + apa yang perlu diperiksa di isiannya sendiri. Boleh nama/kelompok;
  tidak pernah nilai, tidak pernah resep langkah demi langkah, tidak pernah menyebut berapa pilihan di kolom, dan tidak
  berupa pertanyaan yang jawabannya pasti "ya" atau "tidak".
- **Formula boleh disebut** (KPK, FPB, "jumlahkan", "bagi ke jumlah orang"); aturan fikih yang menjadi jawabannya tidak.
- **Arah tidak bocor**: varian yang jawabannya berlawanan arah (pasangan 1/2 vs 1/4, ibu 1/3 vs 1/6, anak pr fardh vs
  ashabah) memakai kunci yang sama.
- **Jenis masalah tidak bocor**: semua kesalahan di kolom akhir ('aul, radd, 'adilah, sisa keluar) memakai petunjuk cek diri
  yang sama; tashih (satu atau beberapa kelompok) juga satu kunci.
- **Nama konsep dan kasus khusus** (*'aul*, *radd*, *inkisar*, *akdariyyah*, *musyarrakah*, *'umariyyatain*, *mu'addah*,
  *takmilah tsulutsain*, *kalalah*, *ma'al ghair*, *jam' min al-ikhwah*) baru disebut di layar selesai sebagai pelajaran:
  "Kasus ini disebut **akdariyyah**" (kunci `hitung.selesai.namaKasus.<nama>`, bertooltip).
- **KPK/FPB** diberi tooltip berisi nisab arba' (bab 10.2): tamatsul, tadakhul, tawafuq, tabayun. Istilahnya tidak ditanyakan.
- **Pemilih jejak** (fungsi murni di `packages/latihan`): untuk orang di baris salah pertama ambil jejak pertama yang mengenainya,
  urut `KASUS_KHUSUS` > `KHILAF_MADZHAB` > `HAJB_HIRMAN` > `HAJB_NUQSHAN` > `FARDH` > `ASHABAH`. Tanpa jejak yang cocok → 6.8.
- **Tautan materi** = bab KB di kolom "Materi"; slug dipetakan di fase 2. Kunci: `hitung.bantuan.p1.<kunci>` /
  `hitung.bantuan.p2.<kunci>`. Parameter: `{nama}` baris salah pertama, `{kelompok}` label kelompok.

### 6.2 Kolom **Bagian** (`bagian`, `bagianPerantara`, `bagian · mayit`)
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `terhalang` | `HAJB_HIRMAN` (semua penyebab, termasuk ashabah yang tak kebagian sisa) | Ingat **hajb**. Apakah semua orang di tabelmu benar-benar mendapat bagian? | Lihat lagi **{nama}**. Siapa saja yang hubungannya dengan almarhum lebih dekat dari dia? | [R06-2] [R06-3] [R06-4] [R06-5] [R06-7] | bab 6.4–6.5 |
| `pasangan` | `HAJB_NUQSHAN` / `FARDH` pasangan (`ADA_`/`TANPA_FARU_WARITS`) | Ingat **fardh**. Siapa saja di keluarga almarhum yang bisa mengubah besar bagian pasangan? | Lihat lagi **{nama}**. Coba periksa siapa saja yang ditinggalkan almarhum di generasi bawahnya. | [R04-2] [R04-3] [R06-1] | bab 4.3–4.4, 6.3 |
| `ibu` | `HAJB_NUQSHAN` / `FARDH` ibu (far'u warits, 2+ saudara, tanpa keduanya) | Ingat **fardh**. Bagian ibu tidak selalu sama. Siapa saja yang kehadirannya berpengaruh? | Lihat lagi **{nama}**. Periksa seluruh keluarga almarhum, juga yang di tabelmu tidak mendapat apa-apa. | [R04-4] [R06-1] [R06-6] | bab 4.7, 6.3 |
| `ayahKakek` | `FARDH` `ADA_FARU_MUDZAKKAR` / `ADA_FARU_MUANNATS`; ayah/kakek ashabah | Ingat **fardh** dan **ta'shib**. Ayah tidak selalu mewarisi dengan cara yang sama. Apa yang membedakannya? | Lihat lagi **{nama}**. Periksa keturunan almarhum: siapa saja mereka? | [R04-5] [R04-6] | bab 4.5–4.6 |
| `nenek` | `FARDH` `NENEK_TANPA_IBU`; `HAJB_HIRMAN` nenek | Ingat **hajb**. Kapan seorang nenek ikut mewarisi? | Lihat lagi **{nama}**. Siapa yang menghubungkan dia dengan almarhum, dan apakah orang itu masih ada? | [R04-7] [R04-8] [R04-9] [R04-10] | bab 4.8 |
| `perempuanSederajat` | `FARDH` `TANPA_MUASHSHIB`, `TAKMILAH`; `ASHABAH` `bilGhair`; `HAJB_NUQSHAN` cucu pr / saudari sebapak | Ingat **fardh** dan **ta'shib**. Bagian perempuan bisa berubah karena siapa yang sederajat atau lebih dekat dengannya. Siapa saja itu? | Lihat lagi **{nama}**. Siapa yang sederajat dengannya, dan siapa yang lebih dekat ke almarhum? | [R04-11] [R04-12] [R04-13] [R04-14] [R04-15] [R05-4] | bab 4.10–4.13, 5.2 |
| `saudaraSaudari` | `FARDH` `KALALAH`; `ASHABAH` `maalGhair` | Ingat **fardh** dan **ta'shib**. Saudara dan saudari mewarisi dengan cara berbeda tergantung siapa yang ada. Siapa saja yang perlu kamu periksa? | Lihat lagi **{nama}**. Periksa ada tidaknya anak, cucu, ayah, atau kakek almarhum. | [R04-14] [R04-16] [R05-5] [R06-4] [R06-5] | bab 4.9, 4.12–4.13, 5.2 |
| `ashabah` | `ASHABAH` `binNafsi` | Ingat **ta'shib**. Kalau ada beberapa calon penerima sisa, siapa yang lebih dulu? | Lihat lagi **{nama}**. Bandingkan arah, kedekatan, dan kekuatan hubungannya dengan penerima sisa yang lain. | [R05-1] [R05-2] [R05-3] | bab 5.1, 5.3 |
| `kakekSaudara` | `ASHABAH` `pilihanJadd`; `FARDH` `JADD_WAL_IKHWAH`, `JADD_SISA_SEDIKIT`; `KASUS_KHUSUS` `muaddah` | Kakek yang bersama saudara bisa dihitung lebih dari satu cara. | Lihat lagi **{kakek}**. Sudahkah kamu mencoba lebih dari satu cara menghitung bagiannya, lalu membandingkannya? | [R08-1] [R08-2] [R08-3] [R08-4] | bab 8 |
| `kasusKhusus.saudariKakek` | `KASUS_KHUSUS` `akdariyyah`; `FARDH` `AKDARIYYAH` | Ada susunan ahli waris yang tidak mengikuti aturan umum. Apakah kasus ini salah satunya? | Lihat lagi **{saudari}**. Hasilmu membuatnya tidak mendapat apa-apa. Apakah itu sudah pasti benar untuk susunan ini? | [R08-5] [R08-6] | bab 8 |
| `kasusKhusus.saudaraKandung` | `KASUS_KHUSUS` `musyarrakah` | Ada susunan ahli waris yang tidak mengikuti aturan umum. Apakah kasus ini salah satunya? | Lihat lagi **{kandung}**. Hasilmu membuatnya tidak mendapat apa-apa, padahal ada yang hubungannya lebih jauh mendapat. Apakah itu sudah pasti benar? | [R07-2] [R07-3] | bab 7 |
| `kasusKhusus.ibu` | `KASUS_KHUSUS` `umariyyatain` | Ada susunan ahli waris yang tidak mengikuti aturan umum. Apakah kasus ini salah satunya? | Bandingkan bagian **{ibu}** dan **{ayah}** di tabelmu. Apakah wajar ibu mendapat lebih banyak dari ayah? | [R07-1] [R04-4] | bab 7 |
| `mani` | `MANI`; korban gharqa yang wafat bersamaan | Ingat **mani'**. Apakah semua orang di tabelmu memang berhak mewarisi? | Lihat lagi **{nama}**. Adakah keadaan dirinya yang membuatnya tidak bisa mewarisi almarhum? | [R02-2] [R02-4] [R02-8] [R13-10] | bab 2, 13d |
| `khilaf` | `KHILAF_MADZHAB` (K03-1, K04-1, K04-2, K05-1, K07-1, K14-3) | P1 topik dasar: K03-1/K04-1/K04-2 → `nenek`; K05-1 → `kakekSaudara`; K07-1 → `kasusKhusus.saudaraKandung`; K14-3 → `tanzil.pembagian` | P2 topik dasar + kalimat tetap `p2.khilaf`: "Di titik ini madzhab berbeda pendapat; yang berlaku adalah madzhab yang kamu pilih." | sesuai kode (bab 18) | bab 18 |

### 6.3 Kolom **Asal masalah** dan kolom saham
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `ashl` | kepala `asalMasalah` (`KELAS_MASALAH`, `PERBANDINGAN_NISAB` `ashl`; juga tabel semua ashabah) | Ingat **ashlul mas'alah**: angka terkecil yang bisa dibagi oleh semua penyebut. | Lihat lagi penyebut di kolom Bagian. Sudahkah kamu mencari KPK-nya? Kalau tidak ada bagian pasti, hitung jumlah kepala penerima sisa. | [R09-1] [R09-2] [R10-1] [R10-4] | bab 9.1, 10.2 |
| `saham` | sel saham kelompok (fardh atau ashabah) | Ingat **saham**: bagian dalam bilangan bulat dari asal masalah. | Lihat lagi **{nama}**. Ubah bagiannya menjadi saham dari asal masalahmu; untuk penerima sisa, lihat apa yang belum terbagi. | [R09-1] [R05-1] | bab 9.1, 5.1 |
| `ashl.kemungkinan` | kolom `sahamKemungkinan` (taqdir) | Ingat **ashlul mas'alah**. Tiap kemungkinan punya masalahnya sendiri. | Lihat lagi kemungkinan **{kemungkinan}**. Hitung seolah-olah itu satu-satunya keadaan. | [R13-16] [R13-4] | bab 13a.5 |

### 6.4 Kolom **Asal masalah akhir**
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `jumlahSaham` | kepala salah: `KELAS_MASALAH` (adilah/ailah/raddA/raddB), `AUL`, `RADD`, `SISA_KELUAR` | Jumlahkan semua saham di kolom sebelumnya. Apakah pas dengan asal masalahmu, lebih, atau kurang? | Kalau jumlahnya tidak sama dengan asal masalah, harta itu kurang atau bersisa. Siapa yang ikut menanggung kekurangannya, atau siapa yang berhak atas sisanya? | [R09-3] [R09-4] [R09-7] [R09-9] [R09-10] [R14-13] | bab 9.2–9.4 |
| `jumlahSaham.perOrang` | sel salah dengan kepala benar, setelah 'aul/radd | Ingat **saham**. Setelah asal masalah berubah, apakah saham tiap orang ikut berubah? | Lihat lagi **{nama}**. Periksa apakah dia memang ikut berbagi perubahan itu, dan dengan perbandingan apa. | [R09-3] [R09-7] [R09-9] | bab 9.3–9.4 |
| `saudariKakek.akhir` | `AUL` + `KASUS_KHUSUS` `akdariyyah` | Lihat kembali bagian kakek dan saudari setelah asal masalah berubah. Apakah pembagian keduanya sudah selesai? | Lihat lagi **{kakek}** dan **{saudari}**. Bandingkan saham keduanya. Apakah perbandingannya sama dengan saudara laki-laki dan perempuan yang berbagi sisa? | [R08-5] [R09-4] | bab 8 |
| `bulat` | `PERBANDINGAN_NISAB` `inkisar`/`juzSahm`, `TASHIH` | Coba bagi saham tiap kelompok ke jumlah orangnya. Apakah semuanya dapat bilangan bulat? | Lihat lagi saham **{kelompok}** dan jumlah orangnya. Berapa FPB keduanya? Kalau lebih dari satu kelompok, angka-angka itu digabung dengan KPK. | [R10-1] [R10-2] [R10-3] [R10-4] [R09-2] | bab 10.2–10.3 |
| `bulat.perOrang` | sel orang salah setelah tashih | Ingat **saham**. Bagian kelompok dibagi berapa untuk mendapat bagian satu orang? | Lihat lagi **{nama}**. Dalam kelompoknya, apakah semua anggota dihitung sama? | [R10-2] [R09-2] [R04-11] | bab 10.3 |

### 6.5 Munasakhat (`bagian · mayit` memakai 6.2; `masalahPertama` terkunci tanpa petunjuk)
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `munasakhat.masalah` | kolom `masalahLanjutan` | Harta yang dibagi di kolom ini milik siapa, dan siapa ahli warisnya saat itu? | Lihat lagi **{mayit}**. Hitung masalahnya seperti soal biasa, dengan ahli waris yang hidup saat ia wafat. | [R12-1] [R12-5] [R12-3] | bab 12.1–12.3 |
| `munasakhat.pengali` | baris `pengali`, `MUNASAKHAT` (semua hubungan) | Ingat **jami'ah**. Supaya dua masalah bisa digabung, keduanya perlu disamakan dulu. | Lihat lagi masalah **{mayit}** dan saham yang ia terima dari mayit sebelumnya. Berapa FPB keduanya? Ingat juga penggabungan sesudahnya. | [R12-2] [R12-3] [R10-1] | bab 12.3–12.4 |
| `munasakhat.jamiah` | kolom `jamiah` (kepala dan sel orang) | Ingat **jami'ah**. Apakah semua saham sekarang dihitung dari angka yang sama? | Lihat lagi **{nama}**. Apakah ia menerima dari lebih dari satu mayit? Periksa tiap bagiannya setelah dikalikan pengali masing-masing. | [R12-2] | bab 12.4 |

### 6.6 Taqdir (`bagianKemungkinan`, `sahamKemungkinan` → `ashl.kemungkinan`, `jamiahSekarang`)
`TAQDIR_LEBUR` tidak punya kolom bagian (K13c-1), jadi tidak punya petunjuk. `{sumber}` = janin / orang yang hilang / khuntsa.
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `kemungkinan` | `TAQDIR_DUNIA` kolom `bagianKemungkinan` (haml, mafqud, khuntsa) | Di kemungkinan ini, bayangkan keadaan {sumber} sudah pasti. Siapa yang bagiannya berubah? | Lihat lagi **{nama}** pada kemungkinan **{kemungkinan}**. Perlakukan seperti soal biasa dengan keadaan itu. | [R13-4] [R13-8] [R13-9] [R13-20] | bab 13a–13c |
| `kemungkinan.jamiah` | kolom `jamiahSekarang` (kepala) | Ingat **jami'ah**. Masalah dari tiap kemungkinan perlu disamakan dulu. | Lihat lagi masalah tiap kemungkinan. Sudahkah kamu mencari KPK-nya? | [R13-16] [R10-1] | bab 13a.5, 10.2 |
| `kemungkinan.pemberian` | `TAQDIR_PEMBERIAN` `aqall`/`ditahan`/`kelasD`; `MAUQUF` | Ingat **mauquf**. Bagian mana yang aman diberikan sekarang, apa pun yang terjadi nanti? | Lihat lagi **{nama}** di semua kemungkinan. Bagian berapa yang pasti ia terima di mana pun? | [R13-4] [R13-15] [R13-16] | bab 13a.5 |
`kelasD` hanya [SYF] (R13-15); petunjuknya tetap sama dengan `aqall`, jadi ruleset tidak bocor lewat kalimat.

### 6.7 Dzawil arham (`didudukkanSebagai`, `bagianPerantara`, `asalMasalah`)
Sel `bagianPerantara` dan `asalMasalah` memakai P1 kunci 6.2–6.4, dengan P2 tetap `p2.perantara`: "Lihat lagi **{perantara}**.
Perlakukan dia seperti ahli waris biasa yang mewarisi dari almarhum."
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `tanzil.kedudukan` | `DZAWIL_ARHAM_TANZIL`, `DUA_JALUR` | Ingat **tanzil**. Lewat siapa kerabat ini bersambung ke almarhum? | Lihat lagi **{nama}**. Telusuri jalurnya ke almarhum (bisa lebih dari satu): orang pertama yang ahli waris itulah kedudukannya. | [R14-6] [R14-7] [R14-11] | bab 14.4–14.5, 14.8 |
| `tanzil.urutan` | jalur tidak `lolos`; `TERHIJAB_JIHAH` hanya [HNB] ([K14-4], sekunder) | Ingat **tanzil**. Kalau beberapa kerabat bersaing, siapa yang didahulukan? | Lihat lagi **{nama}**. Bandingkan jalurnya dengan kerabat lain: siapa yang lebih cepat sampai ke ahli waris? | [R14-7] [R14-10] | bab 14.7 |
| `tanzil.pembagian` | `DZAWIL_ARHAM_TURUN`; K14-3 | Ingat **tanzil**. Setelah perantara mendapat bagian, bagian itu diteruskan kepada siapa? | Lihat lagi **{perantara}** dan siapa saja yang bersambung lewat dia. | [R14-8] [R14-9] | bab 14.5 |
| `tanzil.pasangan` | `DZAWIL_ARHAM_GABUNG_PASANGAN` | Ingat **jami'ah**. Bagian pasangan dan masalah kerabat perlu disamakan dulu. | Bandingkan sisa setelah bagian pasangan dengan masalah para perantara. Berapa FPB keduanya? | [R14-12] [R12-2] | bab 14.9 |
Kunci `TURUN` dan `GABUNG_PASANGAN` dipakai hanya bila kolomnya memuat sel (dicek di fase 2).

### 6.8 Templat umum (tanpa jejak yang cocok)
| Kunci | Kapan | Petunjuk 1 | Petunjuk 2 |
|---|---|---|---|
| `umum` | kolom belum terpetakan | Kolom ini bergantung pada kolom sebelumnya. Apakah kolom itu sudah benar? | Lihat lagi kolom **{kolom}** baris **{nama}**. Dari mana kamu mendapat isiannya? |
| `kosong` | belum lengkap | Masih ada kotak yang kosong di kolom **{kolom}**. | Lihat lagi kolom **{kolom}**. Isi semua baris dulu, lalu Periksa lagi. |

### 6.9 Catatan
1. **Tidak ada baris `blocked`**: bab 17.4 kosong (per 2026-11-22), semua baris ber-kode R. Sumber sekunder (UI menyebut
   sumbernya): R13-20 taqdir haml [SYF] (al-Ahdal), K14-4 jihah [HNB] (Lahim).
2. Jumlah kunci turun dari ±45 ke 33 (±66 kalimat), ditambah 7 kunci `hitung.selesai.namaKasus.*`.
3. Istilah di luar glosarium tidak diberi tooltip; KPK dan FPB diberi tooltip baru di bab 15 (bab 10.2, kaidah hisab [KH]),
   **perlu persetujuan pemilik** karena menambah glosarium.
4. Dicek di fase 2: label `{kelompok}` dari `IdKelompok`, sel untuk `TURUN`/`GABUNG_PASANGAN`, dan jejak ashabah yang tak kebagian sisa (R06-7).
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
