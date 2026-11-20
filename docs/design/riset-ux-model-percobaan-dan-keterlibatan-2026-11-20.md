# Riset UX: model percobaan, penilaian, dan keterlibatan latihan (2026-11-20)

Pertanyaan pemilik:
1. Soal latihan (tabel faraidh) perlu model percobaan dan penilaian yang siap untuk fitur **kelas** (penugasan pengajar).
2. Pembelajaran harus **terasa seperti game yang menantang** dan membuat pelajar ingin kembali, tetapi mekaniknya harus
   mendorong **pemahaman fikih yang benar**, bukan menebak berulang atau mengumpulkan poin.
3. Ide pemilik yang perlu dinilai: **nyawa** (5 nyawa, salah mengurangi, habis → belajar lagi dan menunggu 1 jam).

Keputusan pemilik yang menjadi pegangan: **tidak ada pengurangan XP per percobaan salah**; **XP berbeda menurut jenis
soal**; nyawa hanya kandidat untuk kuis/ujian mandiri.

Spec yang bertumpu pada riset ini: `spec-model-percobaan-dan-penilaian.md`. Audit teknis pendamping:
`audit-arsitektur-kesiapan-kelas.md`.

Penanda di dokumen ini:
- **[Fakta-kode]**: terbaca di repo, dengan `file:baris`.
- **[Fakta-sumber]**: dari sumber luar yang dikutip (tautan di tempat). Angka dari perusahaan (mis. Duolingo) adalah klaim
  perusahaan, belum diaudit pihak lain; ditandai begitu.
- **[Dugaan]**: kesimpulan kami yang belum diuji ke pengguna.
- **[Rekomendasi]**: usulan untuk dipilih pemilik.

**Tidak ada data pengguna nyata** (wawancara/analitik) di riset ini. Profil pengguna di bagian 1 adalah asumsi yang
disusun dari dokumen proyek; diuji di bagian 11.

---

## 0. Batasan

- Platform: web (PWA), sebagian besar dibuka di HP. Bisa luring; akun opsional (Google).
- Fikih hanya dari KB; kunci jawaban dari engine (spec B1). Riset ini tidak menyentuh aturan fikih.
- UI: aksi sekunder = tautan teks; tombol berbingkai hanya aksi utama (CLAUDE.md). Ikon SVG, bukan emoji. Kartu tanpa isi
  tidak dirender (memori "UI hanya yang relevan"). Tolak metafora game/kartu remi di layar belajar (memori "UI interaktif
  tapi mudah dipahami", 2026-10-01): "terasa seperti game" di sini berarti **ritme, tantangan, dan umpan**, bukan dekorasi
  game.
- Tanpa mockup di sesi ini; pilihan yang perlu dilihat disajikan sebagai daftar ide (bagian 10).

---

## 1. Pengguna

### 1a. Siapa (asumsi)

| Peran | Gambaran | Kebiasaan yang relevan |
|---|---|---|
| **Utama: pelajar pemula** | Mahasiswa syariah, santri tingkat awal, atau orang awam yang sedang mengurus waris keluarga dan ingin paham. Belajar dari HP di sela kegiatan (kendaraan, antre, sebelum tidur) | Sesi pendek 5–15 menit. Pernah memakai aplikasi belajar bergaya game (Duolingo, kuis di grup WA). Takut salah di depan orang; nyaman salah sendirian |
| Pelajar mahir | Santri/mahasiswa yang sudah menghafal furudh dan sedang mengasah 'aul, tashih, munasakhat, taqdir | Ingin soal yang menantang, tidak suka diulang-ulang yang mudah, ingin bukti kemampuan (nilai, peringkat) |
| Pengajar (segera) | Ustadz/dosen faraidh yang memberi tugas | Ingin tahu siapa paham dan siapa belum, di kolom/langkah mana kelasnya salah, tanpa memeriksa satu per satu |
| Pelajar dalam kelas | Pelajar di atas, mengerjakan tugas bernilai | Ingin aturan jelas (berapa kali boleh, sampai kapan), adil, dan tidak "dihukum sistem" |

### 1b. Kosakata pengguna

Tabel ini mengikat semua teks di layar (aturan "kosakata pengguna, bukan kosakata sistem").

| Dipakai | Hindari | Alasan |
|---|---|---|
| **Latihan** (mode koreksi bertahap) | Belajar (untuk mode) | "Belajar" = menu utama; bentrok |
| **Ujian** (mode sekali kirim) | Kuis (untuk tabel) | "Mode latihan / Mode ujian" sudah dipakai Kuis konsep [Fakta-kode] `layar/belajar/KuisKonsep.tsx:141`, kunci `latihan.mode_latihan`, `latihan.mode_ujian`. "Kuis" = Kuis konsep pilihan ganda |
| Periksa, Kirim, Kosongkan, Lihat jawaban | Submit, Reset, Cek | sudah dipakai (spec B6) |
| XP, Streak, Peringkat | Poin, Skor (untuk XP) | sudah tampil di header, notifikasi, halaman Peringkat |
| Benar semua / Mulai salah di kolom … | Gagal, Kalah | kalimat B6 yang sudah disetujui; "gagal/kalah" menghukum |
| **Paham / Kuasai** (kemahiran per topik, bila dipilih) | Level, Rank, Tingkat | "Tingkat" sudah berarti kesulitan soal (dasar/menengah/sulit) [Fakta-kode] `packages/content/src/soal.ts:5`; "level/rank" bukan bahasa pengguna dan bentrok dengan Peringkat |
| Tugas, Tenggat, Nilai (kelas) | Assignment, Deadline, Skor | bahasa sekolah/pesantren |
| Nyawa (bila dibangun) | Hati, Energi | "hati" ambigu dalam bahasa Indonesia; "energi" mekaniknya lain |

---

## 2. Audit alur yang ada

Sudut pandang: pelajar pemula di HP. Hanya masalah; solusi di bagian 6.

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| A1 | **Tinggi** | **Lihat jawaban lalu ulangi memberi XP penuh.** Jawaban yang dibuka tanpa mencoba tidak tercatat; dibuka sesudah mencoba tercatat `benar=false`. Membuka soal yang sama lagi dan mengisi kunci yang tadi dilihat → `benar=true` → XP. Mekanik memberi hadiah untuk menyalin | [Fakta-kode] `layar/Hasil.tsx:164`; `supabase/migrations/20260927000006_peringkat.sql:84-90` |
| A2 | **Tinggi** | **Sesudah salah atau membuka jawaban, tidak ada jalan pemulihan.** Satu-satunya langkah sesudah jawaban dibuka adalah "Soal berikutnya" (B8). Pelajar yang baru melihat cara yang benar tidak diberi kesempatan membuktikan bahwa ia sekarang paham, padahal itulah saat belajar paling kuat (bagian 5, retrieval + umpan) | spec B8; `layar/Hasil.tsx` |
| A3 | Tinggi | **Umpan Latihan berhenti di kolom pertama yang salah, tanpa menunjukkan kemajuan.** "Mulai salah di kolom Asal masalah akhir" tidak mengatakan bahwa kolom Bagian dan Asal masalah sudah benar. Pelajar yang hampir benar menerima umpan yang sama nadanya dengan yang salah dari awal. Rasa "hampir" hilang | spec B6 butir 5; `hasil/tabelLatihan.ts:94-102` |
| A4 | Sedang | **XP tidak membedakan kerja.** Soal haml [HNB] (±13 kolom) dan soal biasa dasar (3 kolom) bisa bernilai sama atau malah lebih kecil, karena XP ditentukan `tingkat` saja | [Fakta-kode] `20260927000006_peringkat.sql:32-38` |
| A5 | Sedang | **Status "sudah benar" bisa mundur.** Soal yang pernah benar lalu salah saat diulang kehilangan centangnya. Mengulang (yang baik untuk belajar) jadi berisiko | [Fakta-kode] `apps/web/src/progres.ts:48-53` |
| A6 | Sedang | **Tidak ada ukuran "paham" yang lebih dari "pernah benar sekali".** Satu jawaban benar bisa hasil tebakan (9 pilihan Bagian per baris; Periksa tanpa batas). Daftar soal dan XP memperlakukannya sama dengan pemahaman | `layar/belajar/DaftarSoalHitung.tsx` (centang per soal); B6 |
| A7 | Sedang | **Tidak ada alasan harian untuk kembali selain streak.** Streak dijaga dengan "satu pelajaran atau soal" apa saja; tidak ada saran soal yang paling perlu diulang hari ini. Rekomendasi sudah ada untuk paket kuis (`rekomendasiKuis.ts`) dan "soal berikutnya" (DaftarSoalHitung), tetapi berdasarkan urutan, bukan kebutuhan pengulangan | [Fakta-kode] `layar/belajar/rekomendasiKuis.ts:1-2`, `DaftarSoalHitung.tsx:1-4` |
| A8 | Rendah | **Mode ujian Kuis konsep punya batas waktu**; bila mode Ujian tabel meniru ini, tabel 13 kolom di HP dengan waktu terbatas akan terasa menghukum | [Fakta-kode] `KuisKonsep.tsx:36-37` (`durasiUjian`) |
| A9 | Rendah | Notifikasi streak bernada netral ("Streak {jumlah} harimu belum aman" / "Selesaikan satu pelajaran atau soal hari ini untuk menjaganya."), dikirim sekali sehari 17.00–19.59 untuk streak ≥ 3, bisa dimatikan. **Tidak** ditemukan pola rasa bersalah. Dicatat sebagai garis dasar yang harus dijaga | [Fakta-kode] `supabase/migrations/20261002000001_push.sql:72-77`; `apps/web/src/snapshot.json` kunci `notifikasi.streak_ingat_*` |
| A10 | Rendah | Papan peringkat **opt-out** (semua yang login ikut otomatis) | [Fakta-kode] `20260928000001_peringkat_otomatis.sql:1-8` |

Alur Periksa (kanvas silsilah, `layar/latihan/RingkasanLatihan.tsx`) adalah pemeriksaan **isian kasus** sebelum dihitung,
bukan penilaian jawaban; tidak terdampak model percobaan selain bahwa soal latihan masuk ke Hasil sesudahnya.

---

## 3. JTBD

| # | Saat… | Saya ingin… | Supaya… | Ukuran sukses |
|---|---|---|---|---|
| J1 | mengerjakan soal di HP dan salah | tahu langkah mana yang salah dan bahwa sisanya sudah benar | memperbaiki cara pikir, tidak mulai dari nol | umpan menyebut kolom salah **dan** kolom yang sudah benar |
| J2 | sudah membuka jawaban | membuktikan bahwa saya sekarang paham | tidak merasa "gagal lalu ditinggal" | ada soal serupa yang langsung bisa dicoba, dan bernilai |
| J3 | mau belajar 10 menit hari ini | langsung diberi soal yang paling saya butuhkan | tidak bingung memilih, waktu terpakai baik | satu ketukan dari Beranda ke soal hari ini |
| J4 | merasa sudah paham satu topik ('aul, tashih, …) | melihat bukti kemahiran yang tidak bisa didapat dengan menebak | percaya diri / tahu harus lanjut ke mana | status "Kuasai" per topik hanya dari bukti yang kuat |
| J5 | mahir dan bosan dengan soal mudah | tantangan yang setimpal dan dihargai | tetap tertarik | soal sulit memberi XP lebih besar; ada mode Ujian |
| J6 | (pengajar) memberi tugas | aturan tugas jelas dan nilainya bisa dipercaya | menilai adil tanpa memeriksa manual | nilai dihitung server; per kolom terlihat |
| J7 | (pelajar kelas) mengerjakan tugas | tidak dihukum mekanik game di tugas bernilai | nilainya mencerminkan kemampuan | tugas tanpa nyawa, streak, atau waktu tunggu |
| J8 | gagal berkali-kali | berhenti sebentar tanpa merasa dihukum, dan tahu apa yang dipelajari dulu | tidak menyerah | arahan ke materi yang tepat, bukan kunci |

---

## 4. HMW

- **HMW-1** Bagaimana pelajar merasa "hampir" dan tahu kemajuannya saat salah? (J1, A3)
- **HMW-2** Bagaimana membuka jawaban menjadi awal pemulihan, bukan akhir soal? (J2, A1, A2)
- **HMW-3** Bagaimana hadiah mengikuti **pemahaman**, sehingga menebak dan menyalin tidak menguntungkan? (J4, A1, A6)
- **HMW-4** Bagaimana memberi alasan harian untuk kembali yang juga baik untuk ingatan jangka panjang? (J3, A7)
- **HMW-5** Bagaimana tantangan naik sesuai kemampuan tanpa membuat pemula menyerah? (J5, J8)
- **HMW-6** Bagaimana membatasi kegagalan beruntun tanpa menghukum? (J8; ide nyawa)
- **HMW-7** Bagaimana mekanik game tidak masuk ke tugas bernilai? (J6, J7)

---

## 5. Riset pembanding

### 5a. Bukti belajar (umum)

| # | Temuan | Status | Sumber |
|---|---|---|---|
| E1 | Mengerjakan soal (retrieval practice) menghasilkan ingatan lebih baik daripada membaca ulang, juga tanpa umpan; dengan umpan biasanya lebih baik lagi | Fakta-sumber (meta-analisis dan tinjauan) | Adesope dkk. 2017, *Review of Educational Research* ([PDF](https://education.wsu.edu/documents/2018/01/rethinking-use-tests.pdf/)); ringkasan bukti umpan: [Frontiers in Education 2019](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2019.00005/full); Rowland 2014 ([PDF](https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf)) |
| E2 | Pengulangan berjarak (spacing) mengalahkan pengulangan beruntun, rata-rata g ≈ 0,74 (Latimier dkk. 2021); interleaving g ≈ 0,42 tetapi heterogen dan kadang terbalik (Brunmair & Richter 2019) | Fakta-sumber | [Bjork & Bjork 2011, "desirable difficulties"](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf); ringkasan meta-analisis: [Educational Psychology Review 2020](https://link.springer.com/10.1007/s10648-020-09572-8) |
| E3 | Mencoba memecahkan soal **sebelum** diajari (productive failure) unggul untuk pemahaman konsep dalam meta-analisis 53 studi; manfaatnya bergantung pada pengetahuan awal yang cukup | Fakta-sumber (via liputan; makalah asli Sinha & Kapur 2021, *Review of Educational Research*) | [phys.org 2021](https://phys.org/news/2021-09-productively-wiser.html) |
| E4 | **"Gaming the system"** (menebak cepat berulang, menekan bantuan sampai jawaban keluar) adalah perilaku yang paling kuat berkaitan dengan hasil belajar rendah di sistem tutor; minta bantuan **sebelum** mencoba berkorelasi negatif dengan belajar | Fakta-sumber | Baker, Corbett & Koedinger 2004 ([PDF](https://www.cs.cmu.edu/~rsbaker/BCK2004MLFinal.pdf)); [Baker, "Gaming the System: A Retrospective Look"](https://learninganalytics.upenn.edu/ryanbaker/PSCS-gaming-v6.pdf); [LearnLab: Help abuse](https://learnlab.org/research/wiki/index.php/Help_abuse); An dkk., LAK 2026 ([PDF](https://www.cs.cmu.edu/afs/cs.cmu.edu/Web/People/bmclaren/pubs/AnEtAl-RevisitingTheHintButton-LAK2026.pdf)) |
| E5 | Gamifikasi berefek kecil sampai sedang pada hasil kognitif (g = 0,49), motivasi (0,36), dan perilaku (0,25); efek kognitif stabil di studi yang ketat, efek motivasi/perilaku kurang stabil | Fakta-sumber (meta-analisis) | Sailer & Homner 2020, *Educational Psychology Review* ([Springer](https://link.springer.com/article/10.1007/s10648-019-09498-w)) |
| E6 | Hadiah yang bergantung pada keterlibatan, penyelesaian, atau kinerja menurunkan motivasi intrinsik pada pilihan bebas (meta-analisis 128 studi); temuan ini diperdebatkan (Cameron & Pierce) | Fakta-sumber, diperdebatkan | Deci, Koestner & Ryan 1999 ([PDF](https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf)); tanggapan untuk pendidikan 2001 ([PDF](https://selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf)) |

### 5b. Pola di aplikasi yang dikenal

| # | Mekanik | Yang terjadi | Status | Sumber |
|---|---|---|---|---|
| P1 | **Nyawa (hearts) Duolingo**: 5 nyawa, tiap salah −1 | Pada 2025 Duolingo mengganti nyawa dengan "energi" untuk pengguna gratis. Alasan resmi: kehilangan nyawa per kesalahan "bukan cara paling efektif untuk mendukung belajar", dan pengguna baru sering macet di kesalahan. Meninjau kesalahan di akhir pelajaran tidak memakai energi | Fakta-sumber (klaim perusahaan) | [Duolingo blog: Energy](https://blog.duolingo.com/duolingo-energy/) |
| P2 | Energi Duolingo | Berkurang tiap latihan, benar maupun salah; dikritik karena menghukum pelajar yang mahir dan dianggap mendorong pembelian. Duolingo mengklaim pelajar "berbuat lebih banyak" dengan energi; tidak ada studi independen | Fakta-sumber (liputan + klaim) | [Android Authority](https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/), [PCWorld](https://www.pcworld.com/article/2924235/why-i-fell-out-of-love-with-duolingo.html) |
| P3 | Streak Duolingo | Klaim perusahaan: pelajar yang mencapai streak 7 hari 3,6× lebih mungkin menyelesaikan kursus; streak freeze (maks. dua) menaikkan pengguna aktif harian +0,38%; memisahkan target harian dari streak menaikkan retensi hari ke-14 +3,3%. Duolingo menyebut streak memanfaatkan *loss aversion* | Fakta-sumber (klaim perusahaan, tidak diaudit) | [How the streak builds habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit), [Improving the streak](https://blog.duolingo.com/improving-the-streak), [Making Duolingo: streaks](https://making.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals) |
| P4 | Kritik streak | Pengguna sering menganggap memperpanjang streak lebih penting daripada kegiatan belajarnya (Silverman dkk. 2023, *J. Consumer Research*, dikutip pihak kedua); studi kualitatif forum Duolingo + 15 wawancara mencatat penyalahgunaan gamifikasi: XP booster, kompetisi, kompulsi, "dark nudges" | Fakta-sumber (sebagian sekunder) | [The Decision Lab: Streak creep](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification); Hadi Mogavi dkk., [arXiv 2203.16175](https://www.arxiv.org/abs/2203.16175) |
| P5 | Papan peringkat / liga | Kompetisi dikaitkan dengan kecemasan dan persepsi diri negatif pada sebagian pelajar; studi lain menemukan gamifikasi menurunkan kecemasan. Bukti campuran dan kecil | Fakta-sumber, campuran | dirangkum di [arXiv 2203.16175](https://ar5iv.labs.arxiv.org/html/2203.16175) dan kajian yang dikutip di sana (Hanus & Fox 2015) |
| P6 | Pola gelap keluar (exit dark patterns) di aplikasi belajar bergaya game untuk anak | Kajian 2026 dengan wawancara orang tua–anak tentang desain yang menaikkan biaya emosional untuk berhenti (Duolingo sebagai kasus utama). Isi lengkap tidak terbaca oleh kami | Fakta-sumber (keberadaan kajian), temuan belum diverifikasi | [deceptive.design](https://deceptive.design/articles/the-evil-bird-and-the-right-to-disconnect-children-s-vulnerability-to-exit-dark-patterns-in-gamified-educational-apps) |
| P7 | **Kemahiran Khan Academy**: Belum mulai → Dicoba → Mengenal → Mahir → Kuasai | "Mahir" butuh semua benar dalam satu latihan; "Kuasai" butuh benar lagi di ujian unit/tantangan (bukti kedua, di waktu lain); bisa turun bila nilai < 70% | Fakta-sumber (dokumentasi resmi) | [Khan Academy: Mastery levels](https://support.khanacademy.org/hc/en-us/articles/5548760867853) |

### 5c. Apa artinya untuk kita [Dugaan]

1. **Nyawa per kesalahan bertentangan dengan alur Latihan kita.** Latihan sengaja memakai koreksi bertahap (E1: umpan
   membantu). Bila tiap Periksa salah memakan nyawa, pelajar takut menekan Periksa dan beralih ke Lihat jawaban sebelum
   mencoba, perilaku yang justru paling merugikan (E4). Pembuat pola nyawa paling terkenal meninggalkannya karena
   alasan yang sama (P1). Alternatif energi (P2) lebih buruk untuk kita: menghukum yang mahir.
2. **Hadiah harus melekat pada bukti paham, bukan pada aktivitas.** E6 memperingatkan hadiah atas penyelesaian bisa
   menggerus motivasi intrinsik; E4 menunjukkan menebak merusak belajar. Maka XP boleh memberi rasa maju, tetapi
   **status kemahiran** (P7) yang menjadi tujuan, dan status itu butuh bukti kedua (Ujian atau pengulangan berjarak, E2).
3. **Streak efektif untuk kebiasaan tetapi bisa menggeser tujuan** (P3 vs P4). Pertahankan, jangan dibesarkan. Isi
   alasan harian dengan **pengulangan berjarak** (E2) supaya kebiasaan itu bermanfaat.
4. **Kompetisi sebaiknya tetap opsional dan tidak masuk kelas** (P5).

---

## 6. Ide per HMW

Kriteria: **Paham** (mudah dimengerti pemula?), **Dampak** (menjawab JTBD + mendorong pemahaman?), **Usaha** (kecil =
baik), **Risiko gelap** (rasa bersalah/hukuman/tekanan sosial).

### HMW-1 "Hampir" dan kemajuan saat salah

| Ide | Paham | Dampak | Usaha | Risiko gelap | Catatan |
|---|---|---|---|---|---|
| 1a. Umpan merah tetap seperti B6 | ✓ | rendah | nol | – | A3 tetap |
| **1b. Centang hijau di kepala kolom yang sudah benar** + kalimat `Kolom 1–2 benar. Mulai salah di kolom "…"` | ✓ | tinggi | kecil (`nilaiSemuaKolom` sudah menghitung semuanya) | – | rasa "hampir" yang jujur; menunjuk langkah (J1) |
| 1c. Bilah kemajuan persen | ✓ | sedang | kecil | rendah | persen per kolom menyesatkan bila kolom awal salah (kolom sesudahnya belum bermakna) |
| 1d. Tunjukkan semua sel salah sekaligus di Latihan | ✓ | sedang | kecil | – | mengubah keputusan B6 (berhenti di kolom pertama); kolom sesudah yang salah sering salah karena turunan, jadi banyak merah palsu |

**[Rekomendasi] 1b.** Kolom yang benar hanya ditandai, tidak dikunci; pelajar tetap bisa mengubahnya. Alasan: menandai
kemajuan tanpa mengubah alur B6 yang sudah disetujui.

### HMW-2 Pemulihan sesudah membuka jawaban atau gagal

| Ide | Paham | Dampak | Usaha | Risiko gelap |
|---|---|---|---|---|
| 2a. Hanya "Soal berikutnya" (sekarang) | ✓ | rendah | nol | – |
| **2b. "Coba soal kembaran"**: soal lain dengan **topik** yang sama (field `topik` sudah ada, [Fakta-kode] `packages/content/src/soal.ts:14`) muncul sebagai tautan sesudah jawaban dibuka atau sesudah 3 Periksa salah di kolom yang sama; soal kembaran tetap memberi XP penuh bila benar | ✓ | tinggi (E1+E3: coba lagi segera sesudah melihat cara benar) | sedang (butuh ≥ 2 soal per topik; bank soal perlu dicek) | – |
| 2c. Ulangi soal yang sama dengan angka harta berbeda | ✓ | sedang (pecahan dan saham tetap sama → menyalin) | kecil | – |
| 2d. Arahkan ke materi bab | ✓ | sedang | kecil | rendah bila tanpa kunci |

**[Rekomendasi] 2b + 2d**: sesudah jawaban dibuka, dua tautan teks: `Coba soal serupa` (bila ada) dan
`Pelajari dulu: {judul materi}`. Soal yang dibuka tetap 0 XP selamanya (menutup A1), tetapi pelajar tidak kehilangan
kesempatan mendapat XP untuk **topik** itu.

### HMW-3 Hadiah mengikuti pemahaman

| Ide | Paham | Dampak | Usaha | Risiko gelap |
|---|---|---|---|---|
| 3a. XP pertama benar, apa pun caranya (sekarang) | ✓ | rendah (A1, A6) | – | – |
| **3b. XP: pertama benar tanpa Lihat jawaban; Lihat jawaban membakar XP soal itu; tanpa potongan per salah (keputusan pemilik); ulang = 0 XP** | ✓ | tinggi | kecil | – |
| **3c. Kemahiran per topik**: `Dicoba` → `Paham` (benar di Latihan) → `Kuasai` (benar lagi di Ujian **atau** benar di soal lain bertopik sama ≥ 1 hari kemudian). Turun ke `Paham` bila salah di Ujian topik itu | ✓ (meniru P7) | tinggi (E2 + menebak tidak cukup untuk Kuasai) | sedang | rendah (turun status bisa terasa menghukum → kalimat netral, tanpa animasi kehilangan) |
| 3d. Level global dari total XP | ✓ | rendah (mengukur aktivitas, bukan paham) | kecil | sedang (dorong farming) |
| 3e. Lencana | ✓ | rendah | sedang | rendah |

**[Rekomendasi] 3b sekarang, 3c sebagai pengganti "level/rank".** Level global (3d) ditolak: XP sudah tampil di header
dan peringkat; level di atasnya hanya mengulang angka yang sama. Kemahiran per topik memberi arah ("topik mana yang
belum Kuasai") dan tidak bisa dicapai dengan menebak di Latihan saja.

### HMW-4 Alasan harian untuk kembali

| Ide | Paham | Dampak | Usaha | Risiko gelap |
|---|---|---|---|---|
| 4a. Streak saja (sekarang) | ✓ | sedang | – | rendah (A9 netral) |
| **4b. "Soal hari ini"**: satu soal yang dipilih dari (1) topik yang dibuka/salah ≥ 1 hari lalu, (2) topik `Paham` yang belum `Kuasai` dan sudah ≥ 1 hari, (3) soal baru berikutnya. Tampil di Beranda; mengerjakannya = aktivitas hari itu | ✓ | tinggi (E2; J3) | sedang (fungsi murni atas kejadian) | rendah |
| 4c. Tantangan harian yang sama untuk semua orang + papan hari itu | ✓ | sedang | sedang | sedang (kompetisi, P5) |
| 4d. Bonus XP harian untuk soal hari ini | ✓ | rendah–sedang | kecil | sedang (farming tipis, E6) |
| 4e. Streak freeze | ✓ | rendah (+0,38% menurut klaim Duolingo, P3) | sedang | rendah; mengurangi tekanan |

**[Rekomendasi] 4b**, tanpa bonus XP tambahan (XP tetap aturan 3b; soal ulang = 0 XP tetapi tetap aktivitas). Streak
dipertahankan apa adanya. Freeze ditunda (dampak kecil menurut data pembuatnya sendiri).

### HMW-5 Kesulitan bertahap

| Ide | Paham | Dampak | Usaha | Risiko gelap |
|---|---|---|---|---|
| 5a. Bab terbuka berurutan (sekarang, [Fakta-kode] `DaftarSoalHitung.tsx:1-2`) + saring tingkat | ✓ | sedang | – | – |
| **5b. Saran berikutnya mengikuti kemahiran**: tingkat berikutnya (dasar → menengah → sulit) disarankan sesudah 2 soal `Paham` di tingkat itu; jenis kasus khusus disarankan sesudah topik prasyaratnya `Paham` | ✓ | tinggi | sedang | – |
| 5c. Kesulitan adaptif penuh (model kemampuan) | ✗ (tak terlihat) | tinggi? | besar | – |
| 5d. Kunci keras (tidak boleh membuka yang sulit) | ✓ | rendah (menghalangi yang sudah mahir) | kecil | sedang |

**[Rekomendasi] 5b**: saran, bukan kunci. Pelajar mahir tetap bisa langsung ke soal sulit (J5).

### HMW-6 Membatasi kegagalan beruntun tanpa menghukum (ide nyawa)

| Ide | Paham | Dampak belajar | Usaha | Risiko gelap |
|---|---|---|---|---|
| 6a. **Nyawa di Latihan** (5, tiap Periksa salah −1, habis → tunggu 1 jam) | ✓ | **negatif**: Periksa jadi menakutkan, Lihat jawaban sebelum mencoba naik (E4); soal 13 kolom bisa menghabiskan 5 nyawa dalam satu soal | sedang | **tinggi** (hukuman berlebihan) |
| 6b. **Nyawa di mode Tantangan** (Ujian mandiri beruntun: satu Kirim per soal; salah −1; habis → selesai sesi + jeda) | ✓ | netral–positif: memberi taruhan dan ritme di tempat yang memang menilai, bukan melatih | **besar**: jujur hanya bila dinilai server dan daring (klien bisa tidak mengirim kejadian salah) | sedang |
| **6c. Saran belajar tanpa kunci**: sesudah 3 Periksa salah berturut di kolom yang sama → tautan ke materi bab + "Coba soal serupa" | ✓ | positif (J8, E4: mengarahkan ke bantuan yang tepat **sesudah** mencoba) | kecil | rendah |
| 6d. Jeda singkat otomatis (mis. Periksa nonaktif 10 detik sesudah 3 salah cepat) | ✓ | positif terhadap menebak cepat (E4) | kecil | sedang (bertentangan dengan memori "tombol tak nonaktif") |
| 6e. Nyawa yang pulih dengan belajar (membaca materi mengembalikan 1 nyawa) | sedang | sedang | besar | sedang (mengubah materi jadi "harga") |

**[Rekomendasi] 6c sekarang; 6b hanya bila pemilik tetap menginginkan sesudah 6c berjalan**, dan hanya sesudah penilaian
server ada. 6a ditolak. 6d ditolak (bertentangan dengan keputusan "tombol tak nonaktif"). 6e ditolak.

Bila 6b dibangun, **jeda yang terasa adil**:
- dihitung server dari waktu terima kejadian, bukan jam perangkat;
- sisa waktu tampil sebagai jam selesai (`Bisa lagi pukul 14.20`), bukan hitung mundur yang menegangkan;
- selama jeda, Latihan, materi, dan Kuis konsep **tetap terbuka** dan tetap menghitung streak; yang terkunci hanya
  Tantangan;
- tidak ada pembelian atau iklan untuk memulihkan;
- tidak ada notifikasi "nyawamu sudah penuh".

### HMW-7 Kelas netral

| Ide | Paham | Dampak | Usaha |
|---|---|---|---|
| **7a. Tugas kelas tanpa mekanik game**: tanpa nyawa, jeda, streak, saran soal hari ini, dan peringkat di dalam layar tugas; aturan tugas (mode, batas percobaan, tenggat) tampil jelas di atas | ✓ | tinggi (J6, J7) | kecil |
| 7b. Tugas memberi XP ekstra | ✓ | rendah (mencampur nilai dan gamifikasi) | kecil |
| 7c. Papan peringkat per kelas | ✓ | rendah–negatif (P5; tekanan sosial di depan teman sekelas) | sedang |

**[Rekomendasi] 7a.** Percobaan tugas tetap dihitung ke XP dan kemahiran pribadi dengan aturan yang sama (tidak dobel),
tetapi layar tugas tidak menampilkannya. 7c ditolak.

### Prinsip turunan

1. **Hadiah mengikuti bukti paham.** XP untuk usaha yang jujur; kemahiran untuk bukti yang diulang.
2. **Salah adalah bagian dari Latihan.** Tidak ada yang hilang karena salah di Latihan.
3. **Bantuan sesudah mencoba.** Arahan ke materi muncul sesudah usaha, bukan sebelum.
4. **Satu alasan kembali yang bermanfaat**: soal hari ini dipilih untuk pengulangan berjarak.
5. **Penilaian netral di tempat bernilai.** Mekanik game hanya di jalur mandiri.
6. **Tidak ada rasa bersalah, hukuman berlebih, atau tekanan sosial** (bagian 7).

---

## 7. Pola gelap yang harus dihindari

| Pola | Contoh yang dilarang | Penjaga |
|---|---|---|
| Rasa bersalah | Kalimat "Kamu mengecewakan…", maskot sedih, "Streak-mu akan hilang!" berulang | Notifikasi maksimal satu per hari, nada netral (A9 garis dasar); kehilangan streak tanpa animasi kehilangan, cukup angka mulai lagi |
| Hukuman berlebihan | Nyawa di Latihan; menurunkan XP; mengunci materi sesudah salah | XP tidak pernah berkurang; materi dan Latihan tidak pernah terkunci |
| Tekanan sosial | Peringkat di kelas; menampilkan siapa yang belum mengerjakan ke sesama pelajar; notifikasi "temanmu menyalipmu" | Peringkat hanya publik dan opt-out; daftar "belum mengerjakan" hanya untuk pengajar |
| Biaya keluar | Dialog berlapis saat keluar sesi; hitung mundur yang menekan | Keluar sesi satu ketukan (dialog tahan hanya bila ada isian yang akan hilang, pola yang ada) |
| Menjual pemulihan | Beli nyawa/streak | Tidak ada pembelian untuk mekanik belajar |
| Hadiah acak (variable reward) | Peti hadiah, XP acak | XP selalu dapat diperkirakan dari bobot soal |
| Kompetisi yang memaksa | Liga dengan degradasi mingguan | Tidak dibangun |

---

## 8. Cara mengukur keberhasilan

Semua ukuran diturunkan dari **kejadian percobaan** (spec bagian 2), tanpa pelacak pihak ketiga. Dihitung per pekan,
dibandingkan sebelum/sesudah fitur.

| Ukuran | Definisi | Arah yang diinginkan | Menangkap |
|---|---|---|---|
| Retensi D1/D7/D30 | % pengguna aktif yang aktif lagi 1/7/30 hari kemudian (dari hari aktif) | naik | keinginan kembali |
| Penyelesaian jujur | % sesi soal yang berakhir benar **tanpa** Lihat jawaban | naik | pemahaman, bukan menyalin |
| Rasio lihat-sebelum-mencoba | % Lihat jawaban tanpa satu Periksa pun | turun | E4 (bantuan sebelum mencoba) |
| Tanda menebak | % Periksa yang terjadi < 5 detik sesudah Periksa salah sebelumnya dengan ≤ 1 sel berubah | turun | gaming the system (E4) |
| Kesalahan berulang per konsep | untuk tiap jenis kolom (Bagian, Asal masalah, Asal masalah akhir, pengali, jami'ah), % pelajar yang salah di kolom itu pada soal ke-n bertopik sama | turun seiring n | belajar sungguhan per konsep |
| Pemulihan | % soal kembaran yang benar sesudah jawaban soal sebelumnya dibuka | tinggi | HMW-2 bekerja |
| Transfer Latihan → Ujian | % topik `Paham` yang benar di Ujian berikutnya | naik | Latihan menghasilkan paham, bukan hafal jawaban |
| Kemahiran | rata-rata topik `Kuasai` per pelajar aktif | naik pelan | kemajuan nyata |
| Sinyal bahaya | pengguna yang berhenti dalam 2 hari sesudah sesi dengan ≥ 5 salah | turun | mekanik menghukum |

Ambang awal untuk dianggap gagal (USULAN): penyelesaian jujur turun > 5 poin, atau tanda menebak naik > 5 poin, sesudah
sebuah mekanik dipasang → mekanik ditinjau ulang. Tidak ada A/B test di tahap ini (pengguna masih sedikit); bandingkan
sebelum/sesudah dan dengarkan uji pengguna (bagian 11).

---

## 9. Hubungan dengan kelas

- Mekanik game (nyawa bila ada, soal hari ini, saran, streak, peringkat) **hanya di jalur mandiri**.
- Tugas bernilai: aturan pengajar (mode wajib, batas percobaan, tenggat, cara mengambil nilai) dan penilaian server.
  Pelajar melihat aturan itu di atas tugas; tidak ada elemen game di layar tugas.
- Percobaan tugas tetap memperbarui XP dan kemahiran pribadi pelajar (satu kali per soal), supaya pelajar tidak harus
  memilih antara tugas dan kemajuan pribadi. Pengajar tidak melihat XP, streak, atau latihan mandiri pelajar.
- Ukuran bagian 8 bisa disajikan ke pengajar **per kolom/konsep untuk tugasnya saja** ("40% kelas salah di Asal masalah
  akhir pada soal 'aul"), yang menjawab J6.

---

## 10. Pilihan untuk pemilik (tanpa mockup; mockup menyusul di sesi lain)

| # | Pilihan | Rekomendasi | Alternatif yang masuk akal |
|---|---|---|---|
| O1 | Rasa "hampir" di Latihan | **1b** centang kolom benar + kalimat "Kolom 1–2 benar" | 1a (biarkan) |
| O2 | Sesudah jawaban dibuka | **2b + 2d** (soal serupa + materi) | 2d saja (bila bank soal per topik belum cukup) |
| O3 | Pengganti level/rank | **3c** kemahiran per topik (Dicoba/Paham/Kuasai) | tidak ada level sama sekali |
| O4 | Alasan harian | **4b** soal hari ini (pengulangan berjarak), tanpa bonus XP | 4b + bonus kecil 5 XP |
| O5 | Kesulitan | **5b** saran mengikuti kemahiran, tanpa kunci | 5a (biarkan) |
| O6 | Nyawa | **6c** saran belajar tanpa kunci; nyawa (6b) hanya di Tantangan daring, nanti | 6b dibangun sesudah penilaian server |
| O7 | Kelas | **7a** tugas netral | – |
| O8 | Batas waktu di Ujian tabel | **tanpa batas waktu** untuk mandiri; tenggat (bukan hitung mundur) untuk tugas | batas waktu opsional yang dipilih pelajar |

---

## 11. Asumsi dan uji dengan pengguna

Asumsi yang belum diuji:
- Pelajar memakai HP untuk sesi pendek (1a).
- Pelajar pemula lebih banyak berhenti karena merasa gagal daripada karena bosan.
- Bank soal punya ≥ 2 soal per topik untuk soal kembaran (perlu dihitung dari konten terbit sebelum O2 dipilih).
- "Paham / Kuasai" dimengerti tanpa penjelasan.

Uji (5 orang cukup untuk menemukan masalah besar; 3 pemula, 2 mahir):
1. Kerjakan satu soal biasa sampai benar; amati reaksi saat "Mulai salah di kolom…" dengan dan tanpa centang kolom benar.
2. Buka jawaban sebuah soal; tanyakan apa yang ingin dilakukan sesudahnya (apakah mencari "soal serupa"?).
3. Tunjukkan konsep nyawa (kertas/teks): "Kalau salah 5 kali kamu harus menunggu 1 jam." Tanyakan bagaimana itu mengubah
   cara mereka menekan Periksa.
4. Minta mereka menjelaskan arti "Paham" dan "Kuasai" pada sebuah topik.
5. (Pengajar, 1–2 orang) Tunjukkan contoh ringkasan "40% kelas salah di kolom …": apakah itu yang mereka butuhkan?

---

## Sumber

- Adesope, Trevisan & Sundararajan (2017). Rethinking the use of tests: a meta-analysis of practice testing. *Review of
  Educational Research*. https://education.wsu.edu/documents/2018/01/rethinking-use-tests.pdf/
- Frontiers in Education (2019), tinjauan umpan dan testing effect. https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2019.00005/full
- Rowland (2014). The effect of testing versus restudy on retention: a meta-analytic review. *Psychological Bulletin*. (PDF di atas)
- Bjork & Bjork (2011). Making things hard on yourself, but in a good way: creating desirable difficulties. https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf
- Educational Psychology Review (2020), meta-analisis spaced retrieval. https://link.springer.com/10.1007/s10648-020-09572-8
- Sinha & Kapur (2021), productive failure (liputan). https://phys.org/news/2021-09-productively-wiser.html
- Baker, Corbett & Koedinger (2004). Detecting student misuse of intelligent tutoring systems. https://www.cs.cmu.edu/~rsbaker/BCK2004MLFinal.pdf
- Baker. Gaming the System: A Retrospective Look. https://learninganalytics.upenn.edu/ryanbaker/PSCS-gaming-v6.pdf
- LearnLab wiki: Help abuse. https://learnlab.org/research/wiki/index.php/Help_abuse
- An, Mehrvarz, Stamper & McLaren (LAK 2026). Revisiting the hint button. https://www.cs.cmu.edu/afs/cs.cmu.edu/Web/People/bmclaren/pubs/AnEtAl-RevisitingTheHintButton-LAK2026.pdf
- Sailer & Homner (2020). The gamification of learning: a meta-analysis. *Educational Psychology Review*. https://link.springer.com/article/10.1007/s10648-019-09498-w
- Deci, Koestner & Ryan (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf
- Deci, Koestner & Ryan (2001). Extrinsic rewards and intrinsic motivation in education: reconsidered once again. https://selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf
- Duolingo blog: Energy. https://blog.duolingo.com/duolingo-energy/
- Duolingo blog: How the Duolingo streak builds habit. https://blog.duolingo.com/how-duolingo-streak-builds-habit
- Duolingo blog: Improving the streak. https://blog.duolingo.com/improving-the-streak
- Making Duolingo: How streaks keep learners committed. https://making.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals
- Android Authority: quitting Duolingo over Energy. https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/
- PCWorld: why I fell out of love with Duolingo. https://www.pcworld.com/article/2924235/why-i-fell-out-of-love-with-duolingo.html
- The Decision Lab: Streak creep. https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification
- Hadi Mogavi dkk. When gamification spoils your learning. https://www.arxiv.org/abs/2203.16175
- Kuo, Zhao & Scott. The evil bird and the right to disconnect. https://deceptive.design/articles/the-evil-bird-and-the-right-to-disconnect-children-s-vulnerability-to-exit-dark-patterns-in-gamified-educational-apps
- Khan Academy Help Center: How do Khan Academy's Mastery levels work? https://support.khanacademy.org/hc/en-us/articles/5548760867853
