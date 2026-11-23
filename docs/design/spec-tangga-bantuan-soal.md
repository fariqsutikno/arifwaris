# Spec: tangga bantuan soal hitung (2026-11-23)

Menggantikan "Lihat jawaban" (dialog tahan, semua jawaban sekaligus) di soal latihan bertabel. Mode Ujian tidak berubah.
Status: **konsep disetujui pemilik 2026-11-23**; mockup `mockup-tangga-bantuan.html` revisi 4; bagian 6 (peta diksi) revisi 5 menunggu persetujuan; kode belum disentuh.

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

## 6. Peta diksi petunjuk (revisi 5, 2026-11-24, menunggu persetujuan pemilik)
Fikih hanya dari KB; tidak ada kalimat yang dikarang per soal. Petunjuk diturunkan dari `LangkahJejak` yang menjelaskan
**sel salah pertama**, jadi sesuai kasus dan ber-refs. Semua kalimat = draf; setelah disetujui masuk diksi (fase 2).

### 6.1 Pola dan aturan penulisan
- **Petunjuk 1** = "Ingat **{istilah}**." (bertooltip, isi dari bab 15) + satu pertanyaan yang mengajak berpikir. Tanpa nama
  orang, tanpa peran ahli waris yang spesifik, tanpa nilai.
- **Petunjuk 2** = "Lihat lagi bagian **{nama}**." + apa yang perlu dipertimbangkan. Boleh nama/kelompok, tidak pernah nilai,
  tidak pernah menyebut berapa pilihan di kolom. Bila beberapa baris salah, hanya baris salah pertama yang disebut.
- **Arah tidak bocor**: varian yang jawabannya berlawanan arah (pasangan 1/2 vs 1/4, ibu 1/3 vs 1/6, anak pr 1/2 vs ashabah)
  memakai **kunci diksi yang sama**. Petunjuk menyebut faktor yang dipertimbangkan, bukan hasilnya, sehingga tidak
  membocorkan apakah faktor itu ada atau tidak. Itu sebabnya `ADA_X` dan `TANPA_X` satu baris.
- **Pemilih jejak** (fungsi murni di `packages/latihan`): untuk orang di baris salah pertama, ambil jejak pertama yang
  mengenainya dengan urutan prioritas `KASUS_KHUSUS` > `KHILAF_MADZHAB` > `HAJB_HIRMAN` > `HAJB_NUQSHAN` > `FARDH` > `ASHABAH`.
  Untuk kolom akhir: bila kepala salah, ambil tahap pipeline paling awal yang ada (`AUL` > `RADD`/`SISA_KELUAR` > inkisar);
  bila kepala benar tetapi sel salah, ambil tahap yang paling akhir (inkisar > `RADD` > `AUL`). Tanpa jejak yang cocok →
  templat umum 6.9.
- **Tooltip**: hanya istilah yang ada di `docs/kb/15_glosarium.md`, ejaan baku glosarium. Istilah yang belum ada
  (*jihah*, *sabq*, *aqall*, *muzahamah*, *tasyrik*) tidak diberi tooltip; kalimatnya memakai padanan Indonesia, atau
  pemilik menambahkannya ke glosarium dulu (keputusan 6.11 no. 2).
- **Tautan materi** = bab KB pada kolom "Materi". Slug materi di database dipetakan di fase 2.
- Kunci: `hitung.bantuan.p1.<kunci>` dan `hitung.bantuan.p2.<kunci>`; kolom "Kunci" hanya memuat `<kunci>`.
  Parameter dalam kurung kurawal diisi dari jejak (`{nama}` = nama baris salah pertama, `{kelompok}` = label kelompok).

### 6.2 Kolom **Bagian** (`bagian`, `bagianPerantara`, `bagian · mayit`): hajb dan fardh
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `hajbHirman` | `HAJB_HIRMAN` (semua penyebab: saudara oleh ayah/anak, seibu oleh far'u warits, dst.) | Ingat **hajb hirman**. Siapa saja yang bisa tidak mendapat bagian sama sekali, dan oleh siapa? | Lihat lagi bagian **{nama}**. Adakah ahli waris lain yang lebih dekat atau yang menghalanginya di kasus ini? | [R06-2] [R06-3] [R06-4] [R06-5] [R06-6] | bab 6.4–6.5 |
| `hajbHirman.sisaHabis` | `HAJB_HIRMAN` pada ashabah karena furudh menghabiskan harta | Ingat **ta'shib**. Apa yang diterima ashabah kalau semua bagian pasti sudah dibayarkan? | Lihat lagi bagian **{nama}**. Setelah semua bagian pasti dibayarkan, masih adakah sisa untuknya? | [R06-7] [R05-1] | bab 6.4, 5.1 |
| `faruWarits` | `HAJB_NUQSHAN` penyebab far'u warits (suami, istri, ibu); `FARDH` `ADA_FARU_WARITS` / `TANPA_FARU_WARITS` | Ingat **far'u warits**. Keadaan keturunan almarhum seperti apa yang mengubah bagian pasangan? | Lihat lagi bagian **{nama}**. Apakah sudah memperhatikan ada tidaknya keturunan almarhum yang mewarisi? | [R04-2] [R04-3] [R06-1] | bab 4.3–4.4, 6.3 |
| `ibu` | `HAJB_NUQSHAN` ibu; `FARDH` ibu: `JAM_IKHWAH`, `TANPA_FARU_WARITS_DAN_IKHWAH`, `ADA_FARU_WARITS` | Ingat **far'u warits** dan **jam' min al-ikhwah**. Siapa saja yang kalau hadir mengubah bagian ibu? | Lihat lagi bagian **{nama}**. Sudahkah kamu mempertimbangkan keturunan dan saudara almarhum, termasuk saudara yang sendiri terhalang? | [R04-4] [R06-1] [R06-6] | bab 4.7, 6.3 |
| `jamIkhwah` | `HAJB_NUQSHAN` penyebab saudara (bila penyebabnya hanya saudara, bukan far'u) | Ingat **jam' min al-ikhwah**. Apakah jumlah saudara almarhum bisa memengaruhi bagian seseorang, walau saudara itu sendiri tidak mendapat bagian? | Lihat lagi bagian **{nama}**. Berapa saudara almarhum yang ada, dan apakah yang terhalang ikut dihitung? | [R04-4] [R06-6] | bab 4.2, 4.7 |
| `ayahKakek` | `FARDH` `ADA_FARU_MUDZAKKAR` / `ADA_FARU_MUANNATS`; `HAJB_NUQSHAN` ayah/kakek | Ingat **far'u warits**. Keadaan keturunan almarhum seperti apa yang mengubah cara ayah (atau kakek) mewarisi? | Lihat lagi bagian **{nama}**. Apakah ia mewarisi dengan bagian pasti, sebagai penerima sisa, atau keduanya? Apa yang menentukannya? | [R04-5] [R04-6] | bab 4.5–4.6 |
| `nenek` | `FARDH` `NENEK_TANPA_IBU`; `HAJB_HIRMAN` nenek (oleh ibu / ayah) | Ingat **jaddah shahihah**. Apa yang menentukan seorang nenek mewarisi, dan bagaimana bila neneknya lebih dari satu? | Lihat lagi bagian **{nama}**. Adakah ibu atau ayah almarhum yang menghalanginya? Berapa nenek yang berbagi? | [R04-7] [R04-8] [R04-9] [R04-10] | bab 4.8 |
| `muashshib` | `FARDH` `TANPA_MUASHSHIB` (anak/cucu pr); `ASHABAH` `bilGhair` | Ingat **mu'ashshib**. Bagaimana bagian perempuan sederajat berubah ketika ada atau tidak ada laki-laki yang sederajat dengannya? | Lihat lagi bagian **{nama}**. Adakah laki-laki sederajat yang bersamanya, dan berapa perempuan sederajat yang ada? | [R04-11] [R04-12] [R04-13] [R05-4] [R04-14] [R04-15] | bab 4.10–4.13, 5.2 |
| `takmilah` | `FARDH` `TAKMILAH`; `HAJB_NUQSHAN` cucu pr / saudari sebapak bersama yang lebih dekat | Ingat **takmilah tsulutsain**. Apa yang terjadi pada bagian perempuan sederajat ketika yang lebih dekat sudah mengambil bagiannya? | Lihat lagi bagian **{nama}** dan **{pendamping}**. Sudahkah kamu menghitung bagian **{pendamping}** lebih dulu, lalu melihat apa yang masih tersisa untuk **{nama}**? | [R04-12] [R04-13] [R06-1] | bab 4.11, 4.13, 6.3 |
| `kalalah` | `FARDH` `KALALAH` (saudari, saudara seibu) | Ingat **kalalah**. Siapa saja yang kalau ada membuat saudara dan saudari tidak mewarisi dengan cara ini? | Lihat lagi bagian **{nama}**. Apakah almarhum meninggalkan keturunan, ayah, atau kakek yang mengubah keadaannya? | [R04-14] [R04-16] [R04-17] [R06-4] [R06-5] | bab 4.9, 4.12–4.13 |
| `ashabahBinNafsi` | `ASHABAH` `binNafsi` (juga kolom Bagian "Ashabah" / "Terhalang") | Ingat **ta'shib**. Siapa yang berhak atas sisa lebih dulu, dan kapan sisa itu habis? | Lihat lagi bagian **{nama}**. Siapa di antara ahli waris yang paling dekat dan paling kuat hubungannya dengan almarhum? | [R05-1] [R05-2] [R05-3] [R06-7] | bab 5.1, 5.3 |
| `maalGhair` | `ASHABAH` `maalGhair` | Ingat **ma'al ghair**. Bersama siapa seorang saudari bisa menjadi penerima sisa? | Lihat lagi bagian **{nama}**. Adakah anak atau cucu perempuan almarhum bersamanya? Adakah yang lebih dekat yang menghalangi? | [R05-4] [R05-5] | bab 5.2 |

### 6.3 Kolom **Bagian**: kakek dan kasus khusus
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `jadd` | `ASHABAH` `pilihanJadd`; `FARDH` `JADD_WAL_IKHWAH` | Ingat **muqasamah**. Kakek yang bersama saudara bisa dihitung dengan beberapa cara. Bagaimana memilihnya? | Lihat lagi bagian **{kakek}**. Sudahkah kamu membandingkan semua cara hitungnya, lalu mengambil yang paling menguntungkan kakek? | [R08-1] [R08-2] [R08-3] [R04-6] | bab 8 |
| `jadd.sisaSedikit` | `FARDH` `JADD_SISA_SEDIKIT` | Ingat **muqasamah**. Apa yang terjadi pada saudara kalau yang tersisa sangat sedikit? | Lihat lagi bagian **{kakek}**. Setelah semua bagian pasti dibayarkan, berapa banyak sisa dibanding yang kakek perlukan? | [R08-3] | bab 8 |
| `muaddah` | `KASUS_KHUSUS` `muaddah` | Ingat **mu'addah**. Saudara jenis apa yang tetap dihitung terhadap kakek walau tidak ikut menerima? | Lihat lagi bagian **{sebapak}** dan **{kandung}**. Apakah yang sebapak ikut diperhitungkan terhadap kakek? Ke mana bagiannya? | [R08-4] | bab 8 |
| `akdariyyah` | `KASUS_KHUSUS` `akdariyyah`; `FARDH` `AKDARIYYAH` | Ingat **akdariyyah**. Kapan saudari boleh mendapat bagian pasti ketika bersama kakek? | Lihat lagi bagian **{saudari}** dan **{kakek}**. Apakah susunan ahli waris ini termasuk pengecualian pada aturan umum? | [R08-5] [R08-6] | bab 8, 7 |
| `musyarrakah` | `KASUS_KHUSUS` `musyarrakah`; `FARDH` `MUSYARRAKAH` | Ingat **musyarrakah**. Apa yang bisa dilakukan agar saudara kandung tidak pulang tanpa bagian ketika harta sudah habis? | Lihat lagi bagian **{kandung}** dan **{seibu}**. Apakah syarat-syaratnya lengkap, dan apakah keduanya berserikat pada bagian yang sama? | [R07-2] [R07-3] | bab 7 |
| `umariyyatain` | `KASUS_KHUSUS` `umariyyatain`; `FARDH` `UMARIYYATAIN` | Ingat **'umariyyatain**. Pada susunan seperti apa bagian ibu dihitung dari sisa, bukan dari seluruh harta? | Lihat lagi bagian **{ibu}**. Apakah bagian ibu dihitung dari seluruh harta, atau dari yang tersisa setelah bagian pasangan? | [R07-1] [R04-4] | bab 7, 4.7 |
| `khilaf` | `KHILAF_MADZHAB` (K03-1, K04-1, K04-2, K05-1, K07-1, K14-3) | Kunci P1 = kunci topik dasar kodenya: K03-1/K04-1/K04-2 → `nenek`; K05-1 → `jadd`; K07-1 → `musyarrakah`; K14-3 → `tanzil.pembagian` | Kalimat P2 topik dasar, lalu satu kalimat tetap `p2.khilaf`: "Di titik ini madzhab bisa berbeda pendapat; yang berlaku adalah madzhab yang kamu pilih." | sesuai kode (bab 18) | bab 18 + bab topik |

### 6.4 Baris yang tidak mewarisi karena mani'
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `mani` | `MANI` (pembunuh, beda agama, budak, murtad) dan korban gharqa yang wafat bersamaan | Ingat **mani'**. Hal apa saja yang membuat seseorang tidak berhak mewarisi sama sekali? | Lihat lagi bagian **{nama}**. Apakah ada sifat atau keadaan yang menghalanginya untuk mewarisi almarhum? | [R02-2] [R02-4] [R02-8] [R02-9] [R13-10] | bab 2, 13d |

### 6.5 Kolom **Asal masalah** (`asalMasalah`, `masalah kemungkinan`) dan kolom saham
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `ashl.kepala` | `KELAS_MASALAH` / `PERBANDINGAN_NISAB` `ashl` (kepala kolom salah) | Ingat **ashlul mas'alah**. Penyebut dari bagian siapa saja yang harus dipertimbangkan agar semua bagian bisa dijumlah? | Perhatikan penyebut tiap bagian di kolom Bagian. Apakah angkamu sudah yang terkecil yang bisa dibagi oleh semuanya? | [R09-1] [R10-1] | bab 9.1, 10.2 |
| `ashl.semuaAshabah` | tabel tanpa fardh (semua ashabah) | Ingat **ashlul mas'alah**. Kalau tidak ada bagian pasti sama sekali, dari mana asalnya? | Lihat lagi susunan ahli waris. Bagaimana laki-laki dan perempuan dihitung dalam jumlah kepala? | [R09-2] [R05-9] | bab 9.1 |
| `saham.fardh` | sel saham kelompok berfardh salah | Ingat **saham**. Bagaimana mengubah bagian pecahan menjadi saham dari asal masalah? | Lihat lagi bagian **{nama}**. Penyebut bagian itu masuk berapa kali ke asal masalahmu? | [R09-1] (bab 00, konvensi 3) | bab 9.1 |
| `saham.ashabah` | sel saham ashabah salah | Ingat **ta'shib**. Berapa yang tersisa bagi ashabah setelah semua bagian pasti dibayarkan? | Lihat lagi bagian **{nama}**. Kurangi asal masalah dengan jumlah saham semua yang berbagian pasti. | [R05-1] [R09-1] | bab 5.1, 9.1 |
| `ashl.kemungkinan` | kolom `sahamKemungkinan` (taqdir) | Ingat **ashlul mas'alah**. Setiap kemungkinan punya masalahnya sendiri. Apa yang menentukannya? | Lihat lagi kemungkinan **{kemungkinan}**. Hitung seolah-olah itu satu-satunya keadaan, dengan ahli waris yang ada pada kemungkinan itu. | [R13-16] [R13-4] | bab 13a.5 |

### 6.6 Kolom **Asal masalah akhir** ('aul, radd, sisa, tashih)
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `adilah` | `KELAS_MASALAH` `adilah` (tidak ada perubahan) | Ingat **'adilah**. Apa artinya kalau jumlah semua bagian pas sama dengan harta? | Jumlahkan saham semua ahli waris di kolom sebelumnya. Adakah yang perlu diubah di kolom ini? | [R09-1] (bab 9.2) | bab 9.2 |
| `aul` | `AUL` | Ingat **'aul**. Apa yang terjadi pada asal masalah kalau jumlah bagian melebihi harta? | Jumlahkan saham semua ahli waris. Lebih besar dari asal masalah atau tidak? Kalau lebih, apa yang dijadikan penyebut baru? | [R09-3] [R09-4] [R09-5] [R14-13] | bab 9.3 |
| `aul.akdariyyah` | `AUL` + `KASUS_KHUSUS` `akdariyyah` | Ingat **akdariyyah**. Setelah 'aul, apa yang terjadi pada bagian kakek dan saudari? | Lihat lagi bagian **{kakek}** dan **{saudari}** setelah 'aul. Apakah bagian keduanya diperlakukan sebagai satu kesatuan? | [R08-5] [R09-4] | bab 8, 9.3 |
| `radd` | `RADD` `raddA` (tanpa pasangan) | Ingat **radd**. Ke mana sisa harta pergi kalau tidak ada ashabah? | Jumlahkan saham semua ahli waris. Bila harta masih tersisa, kepada siapa sisa itu dikembalikan, dan dengan perbandingan apa? | [R09-7] [R09-10] | bab 9.4 |
| `radd.pasangan` | `RADD` `raddB` (ada pasangan) | Ingat **radd**. Apakah semua ahli waris yang bagiannya pasti ikut menerima kembalian sisa? | Lihat lagi bagian **{pasangan}**. Apakah ia ikut menerima kembalian? Sisa untuk ahli waris lain dibandingkan dengan apa? | [R09-7] [R09-9] [R09-10] | bab 9.4 |
| `sisaKeluar` | `SISA_KELUAR` (semua `TujuanSisa`; tujuan tidak disebut karena bergantung kebijakan) | Ingat **radd**. Apakah semua ahli waris ikut menerima kembalian sisa harta? | Lihat lagi bagian **{pasangan}**. Kalau pasangan satu-satunya yang mewarisi, apa yang terjadi pada sisanya? | [R09-9] [R09-8] [R14-12] | bab 9.4, 14.9 |
| `inkisar` | `PERBANDINGAN_NISAB` `inkisar` | Ingat **inkisar**. Kelompok mana yang sahamnya tidak habis dibagi anggotanya? | Lihat lagi saham **{kelompok}**. Bagaimana hubungan saham itu dengan jumlah ru'us-nya: habis dibagi, bisa disederhanakan, atau tidak sama sekali? | [R10-2] [R10-3] | bab 10.3 |
| `juzSahm` | `PERBANDINGAN_NISAB` `juzSahm` (2–4 kelompok inkisar) | Ingat **juz' as-sahm**. Kalau lebih dari satu kelompok inkisar, bagaimana angka simpanan tiap kelompok digabung? | Bandingkan angka simpanan tiap kelompok satu sama lain. Hubungannya **tamatsul**, **tadakhul**, **tawafuq**, atau **tabayun**? | [R10-1] [R10-2] [R10-3] | bab 10.2–10.3 |
| `tashih` | `TASHIH` (kepala salah) | Ingat **tashih**. Asal masalah dikalikan apa supaya semua bagian bulat? | Kalikan asal masalah (setelah 'aul atau radd bila ada) dengan angka pengali dari langkah inkisar. | [R10-2] | bab 10.3 |
| `tashih.perOrang` | `TASHIH` / `DISTRIBUSI` (sel orang salah) | Ingat **ru'us**. Bagian kelompok dibagi apa untuk mendapat bagian satu orang? | Lihat lagi bagian **{nama}**. Pada kelompok berisi laki-laki dan perempuan, bagaimana laki-laki dihitung terhadap perempuan? | [R10-2] [R09-2] [R04-11] | bab 10.3, 9.1 |

### 6.7 Munasakhat (kolom `bagian · mayit`, `masalahLanjutan`, `pengali`, `jamiah`)
Kolom Bagian tiap mayit memakai kunci 6.2–6.4. `masalahPertama` terkunci, tanpa petunjuk. `MUNASAKHAT_DILEWATI` tidak punya
kolom, jadi tidak ada petunjuk.

| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `munasakhat.masalah` | kolom `masalahLanjutan` | Ingat **munasakhat**. Harta siapa yang dibagi pada kematian berikutnya, dan ahli waris siapa saja? | Lihat lagi **{mayit}**. Hitung masalahnya seperti masalah biasa, hanya dengan ahli waris yang ada saat ia wafat. | [R12-1] [R12-5] [R12-3] | bab 12.1–12.3 |
| `munasakhat.pengali` | baris `pengali`, `MUNASAKHAT` (tiga `HubunganInkisar` memakai kunci sama) | Ingat **jami'ah**. Angka pengali tiap masalah diambil dari mana? | Lihat lagi masalah **{mayit}**. Bandingkan saham yang ia terima dengan masalahnya sendiri: habis dibagi, bisa disederhanakan, atau tidak sama sekali? | [R12-2] [R12-3] [R10-1] | bab 12.3–12.4 |
| `munasakhat.pengaliLanjutan` | pengali masalah yang masih ada penggabungan sesudahnya | (kunci P1 `munasakhat.pengali`) | Selain penggabungan miliknya sendiri, penggabungan sesudahnya juga memengaruhi pengali masalah ini. | [R12-2] | bab 12.4 |
| `jamiah.kepala` | kolom `jamiah` (kepala) | Ingat **jami'ah**. Angka pembagi gabungan itu didapat dari mana? | Kalikan masalah pertama dengan pengali tiap penggabungan sesudahnya. | [R12-2] [R12-3] | bab 12.3–12.4 |
| `jamiah.perOrang` | `MUNASAKHAT` `rincian`, sel orang | Ingat **jami'ah**. Bagaimana bagian orang yang menerima dari lebih dari satu mayit digabung? | Lihat lagi bagian **{nama}**. Apakah ia menerima dari lebih dari satu mayit? Jumlahkan tiap bagian dikalikan pengali masalahnya. | [R12-2] | bab 12.4 |

### 6.8 Taqdir (kolom `bagianKemungkinan`, `sahamKemungkinan`, `jamiahSekarang`)
Kolom `sahamKemungkinan` memakai `ashl.kemungkinan` (6.5). Dunia yang dilebur tidak punya kolom bagian (K13c-1), jadi
`TAQDIR_LEBUR` tidak punya petunjuk. Sumber ketidakpastian ditentukan dari jenis soal.
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `kemungkinan.haml` | `TAQDIR_DUNIA`, sumber janin | Ingat **haml**. Apa saja kemungkinan keadaan janin, dan siapa yang bagiannya berubah pada tiap kemungkinan? | Lihat lagi bagian **{nama}** pada kemungkinan **{kemungkinan}**. Dalam kemungkinan itu, bagaimana kedudukan janin terhadap ahli waris lain? | [R13-4] [R13-20] [R13-1] | bab 13a.5 |
| `kemungkinan.mafqud` | `TAQDIR_DUNIA`, sumber mafqud | Ingat **mafqud**. Apa yang berubah bagi ahli waris lain kalau ia hidup atau sudah wafat? | Lihat lagi bagian **{nama}** pada kemungkinan **{kemungkinan}**. Dalam kemungkinan itu, apakah mafqud dianggap ada sebagai ahli waris? | [R13-4] [R13-8] | bab 13b |
| `kemungkinan.khuntsa` | `TAQDIR_DUNIA`, sumber khuntsa | Ingat **khuntsa musykil**. Bagian apa yang berubah kalau ia diperlakukan sebagai laki-laki atau perempuan? | Lihat lagi bagian **{nama}** pada kemungkinan **{kemungkinan}**. Dalam kemungkinan itu ia berkedudukan sebagai apa? | [R13-4] [R13-9] | bab 13c |
| `kemungkinan.jamiah` | kolom `jamiahSekarang`, `TAQDIR_DUNIA` | Ingat **jami'ah**. Bagaimana beberapa masalah dari kemungkinan yang berbeda disamakan penyebutnya? | Bandingkan masalah tiap kemungkinan satu sama lain. Hubungannya **tamatsul**, **tadakhul**, **tawafuq**, atau **tabayun**? | [R13-16] [R10-1] | bab 13a.5, 10.2 |
| `kemungkinan.pemberian` | `TAQDIR_PEMBERIAN` `aqall` / `ditahan`; `MAUQUF` | Ingat **mauquf**. Bagian siapa yang ditahan dulu, dan bagian siapa yang boleh diberikan sekarang? | Lihat lagi bagian **{nama}** pada semua kemungkinan. Mana yang paling kecil, dan apakah bagiannya sudah pasti di semua kemungkinan? | [R13-4] [R13-16] | bab 13a.5 |
| `kemungkinan.kelasD` | `TAQDIR_PEMBERIAN` `kelasD`, hanya [SYF]; ruleset lain memakai `kemungkinan.pemberian` | Ingat **haml**. Apa yang terjadi pada ashabah yang berbagi sisa dengan janin yang jumlahnya belum diketahui? | Lihat lagi bagian **{nama}**. Bisakah bagiannya dipastikan selama jumlah janin belum diketahui? | [R13-15] [R13-3] [R13-20] | bab 13a |

### 6.9 Dzawil arham (kolom `didudukkanSebagai`, `bagianPerantara`, `asalMasalah`)
Kolom `asalMasalah` dan sel `bagianPerantara` memakai kunci 6.2–6.6 dengan kalimat P2 `p2.perantara` sebagai ganti: "Lihat lagi bagian **{perantara}**. Anggap ia ahli waris biasa yang mewarisi dari almarhum: siapa yang menghalangi atau mengurangi bagiannya?"
| Kunci | Jejak / varian | Petunjuk 1 | Petunjuk 2 | Rujukan | Materi |
|---|---|---|---|---|---|
| `tanzil.kedudukan` | `DZAWIL_ARHAM_TANZIL` (kolom `didudukkanSebagai`) | Ingat **tanzil**. Lewat siapa seorang kerabat bersambung ke almarhum, dan perantara itu berkedudukan sebagai apa? | Lihat lagi **{nama}**. Siapa perantaranya, dan perantara itu menempati kedudukan ahli waris yang mana? | [R14-6] [R14-7] [R14-4] | bab 14.4–14.5 |
| `tanzil.sabq` | `DZAWIL_ARHAM_TANZIL` dengan jalur tidak `lolos`; `DZAWIL_ARHAM_TERHIJAB_JIHAH` hanya [HNB] (rujukan [K14-4], sekunder, tanpa kode R) | Ingat **dzawil arham**. Siapa yang lebih dulu sampai ke ahli waris, dan apa akibatnya bagi yang terlambat? | Lihat lagi **{nama}**. Adakah kerabat lain yang lebih cepat sampai ke ahli waris? | [R14-7] [R14-10] | bab 14.5, 14.7 |
| `tanzil.duaJalur` | `DZAWIL_ARHAM_DUA_JALUR` | Ingat **dzawil arham**. Apa yang terjadi kalau seseorang bersambung lewat dua jalur sekaligus? | Lihat lagi **{nama}**. Apakah salah satu jalur menghalangi jalur lainnya, atau keduanya dihitung? | [R14-11] | bab 14.8 |
| `tanzil.pembagian` | `DZAWIL_ARHAM_TURUN` (`ikutMasalah` / `samaRata` satu kunci); K14-3 | Ingat **tanzil**. Setelah perantara menerima bagiannya, bagaimana bagian itu diteruskan kepada yang bersambung lewat dia? | Lihat lagi bagian **{perantara}**. Menurut apa bagiannya dibagi kepada penerimanya? | [R14-8] [R14-9] | bab 14.5 |
| `tanzil.pasangan` | `DZAWIL_ARHAM_GABUNG_PASANGAN` | Ingat **munasakhat**. Pasangan sudah menerima bagian pastinya. Bagaimana sisa dibagi kepada kerabat yang punya masalah sendiri? | Bandingkan saham sisa dengan masalah para perantara. Hubungannya habis dibagi, bisa disederhanakan, atau tidak sama sekali? | [R14-12] [R12-2] | bab 14.9 |
Baris `TURUN` dan `GABUNG_PASANGAN` baru dipakai bila kolomnya memuat sel; dicek di fase 2, sel yang tak ada = kunci tak dipakai.

### 6.10 Templat umum (cadangan, tanpa jejak yang cocok)
| Kunci | Kapan | Petunjuk 1 | Petunjuk 2 |
|---|---|---|---|
| `umum` | kolom belum terpetakan | Ingat **{istilah kolom}**. Kolom ini bergantung pada hasil kolom sebelumnya; apakah kolom itu sudah benar? | Lihat lagi kolom **{kolom}** baris **{nama}**. Apa yang kamu pakai untuk mengisinya? |
| `kosong` | belum lengkap (sel kosong, bukan salah) | Ingat **{istilah kolom}**. Bagian mana yang belum terisi? | Lihat lagi kolom **{kolom}**. Masih ada baris yang belum kamu isi. |
Pilihan istilah kolom: `bagian` → **fardh**, `asalMasalah` → **ashlul mas'alah**, `asalMasalahAkhir` → **tashih**, `pengali`/`jamiah` → **jami'ah**.

### 6.11 Catatan keputusan dan titik yang perlu dicek
1. **Tidak ada baris `blocked`**: bab 17.4 kosong per 2026-11-22 dan setiap baris di atas punya kode R. Dua sumber sekunder (`status: sekunder`,
   UI menyebut sumbernya): taqdir haml [SYF] R13-20 (al-Ahdal) dan jihah [HNB] K14-4 (Lahim). Tarjih Lahim/Ithraa tidak dipakai untuk [SYF].
2. **Istilah di luar glosarium** (*jihah*, *sabq*, *aqall*, *muzahamah*, *tasyrik*): pemilik memilih (a) tambah ke bab 15, lalu diberi tooltip,
   atau (b) tetap padanan Indonesia tanpa tooltip. Rekomendasi: (b), supaya glosarium tidak membengkak demi petunjuk.
3. **P1 tidak menyebut peran** (ibu, ayah, kakek) kecuali baris `ayahKakek`, `nenek`, `jadd`, `muaddah`, `akdariyyah`, `musyarrakah` dan
   `umariyyatain`, karena nama kasus khusus sudah memuat susunannya. Kalau pemilik menganggap itu terlalu menjurus, istilah
   kasus khususnya dipindah ke P2.
4. **Cakupan**: ±45 kunci x 2 petunjuk = ±90 kalimat diksi. Diperiksa terhadap bab KB sebelum masuk `pnpm diksi:tambah`.
5. **Dicek di kode engine saat fase 2**: jejak mana yang benar-benar mengenai `sisaHabis` (R06-7), kapan `TURUN`/`GABUNG_PASANGAN` punya sel di tabel dzawil arham, dan label kelompok (`{kelompok}`) dari `IdKelompok`.
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
