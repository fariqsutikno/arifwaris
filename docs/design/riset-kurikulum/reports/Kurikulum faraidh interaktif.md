# Riset kurikulum: menyusun belajar faraidh yang tidak bikin pusing (2026-11-25)

Pertanyaan: bagaimana menyusun kurikulum e-learning faraidh untuk mahasiswa dan orang awam yang "tidak bikin pusing",
berdasar ilmu belajar, JTBD, HMW, dan pembanding; dengan materi yang benar-benar interaktif (soal di dalam materi yang
bisa dibuka di Lab Waris, kuis uji pemahaman), dan ke depannya profil pengguna yang memetakan skill dari jawaban soal
(grafik radar dan "jaring" pengetahuan).

Penanda: **[Fakta-sumber]** (tautan di tempat; angka vendor = klaim vendor), **[Fakta-kode]** (path berkas repo),
**[Inferensi]**, **[Rekomendasi]**. Angka bertanda **(cuplikan)** hanya terbaca dari ringkasan hasil pencarian karena
halaman jurnal gagal dibuka; **wajib dicek ulang ke makalah asli sebelum masuk naskah TA**. **Tidak ada wawancara
pengguna**; semua JTBD adalah hipotesis.

Batasan yang mengikat seluruh dokumen: fikih hanya dari `docs/kb` (tidak ada aturan baru yang dikarang di sini; contoh
fikih di bawah dikutip dari KB beserta kodenya); [SYF] default, madzhab lain overlay dari bab 18; KHI hanya panel
informasi "kalau menurut KHI"; tanpa metafora game, kereta, stasiun, atau kartu remi; kartu tanpa isi tidak dirender;
aksi sekunder berupa teks/tautan; ikon SVG; tidak ada pengurangan XP karena salah; pengguna paling lemah (lansia, HP
biasa) jadi patokan. Catatan nama: pengguna menyebut "Lab Waris"; di kode saat ini namanya **Lab Hitung** [Fakta-kode]
`apps/web/src/layar/lab/`, `PintuLab.tsx`.

---

## 1. Ringkasan

Kurikulum yang tidak bikin pusing untuk faraidh bukan soal mengurangi isi, tapi soal **mengurutkan isi persis seperti
langkah yang nanti dilihat pelajar di Lab, lalu memecah tiap langkah menjadi satu keputusan per layar dengan contoh yang
dihitung engine**. Bukti ilmu belajar paling kuat mendukung empat hal yang murah dibangun di atas engine yang sudah ada:
contoh terselesaikan yang dipudarkan (worked example + fading), latihan mengingat (retrieval) di akhir tiap pelajaran,
pengulangan berjarak yang disisipkan ke pelajaran berikutnya, dan latihan campur (interleaving) untuk aturan yang mirip
tapi beda. Rekomendasi utamanya: (a) pakai **urutan kerja bab 00 KB** (mawani' → daftar ahli waris → hajb → furudh/
ashabah → hitung) sebagai tulang punggung, dengan **hajb dipecah**: hajb hirman dasar diajarkan sebelum furudh, hajb
nuqshan dijahit ke dalam pelajaran furudh; (b) **dua pintu masuk satu kurikulum**: pintu "dari situasi keluarga" untuk
awam dan pintu sistematis untuk mahasiswa, keduanya memakai pelajaran yang sama; (c) prasyarat pecahan/KPK sebagai
**modul 0 opsional tepat sebelum modul Menghitung**, bukan di depan; (d) tiap pelajaran mendeklarasikan
**knowledge component (KC) dan pola soal** yang dibutuhkannya, sehingga kurikulum sekaligus menjadi daftar kerja
generator soal G4 dan sumber penandaan skill untuk profil. Untuk profil, tampilan utama sebaiknya **bilah per skill
dengan jumlah bukti**, radar hanya tampilan sekunder (persepsi radar lemah), dan "jaring" berupa peta prasyarat yang
menyorot "siap dipelajari". Celah terbesar hari ini bukan desain tapi konten: **materi baru ada untuk modul 1–5**,
sedangkan modul 6–10 hanya punya soal. Semua urutan pedagogis di dokumen ini wajib divalidasi tim keilmuan dan diuji ke
5–8 orang per audiens.

---

## 2. Audit kondisi sekarang: infrastruktur jauh di depan konten

[Fakta-kode] Snapshot konten terbit berisi 214 entri: teks_edukasi 114, soal_hitung 23, syahid 16, faq 14, materi 11,
soal_kuis 11, modul 10, ahwal 7, cheatsheet 4, kitab 4 (`apps/web/src/snapshot.json`; jenis di
`packages/content/src/skema.ts`). Sepuluh modul berurutan: 1 Pengantar, 2 Siapa ahli waris, 3 Bagian pasti (furudh),
4 Sisa (ashabah), 5 Penghalang (hajb), 6 Kakek & saudara, 7 Menghitung (ashl, 'aul, radd), 8 Tashih, 9 Pembagian
nominal, 10 Munasakhat. Sebelas pelajaran hanya ada di modul 1–5, semuanya `perluCek: true`. Modul 6–10 tampil sebagai
`modulMenyusul` di `apps/web/src/layar/belajar/Belajar.tsx`.

[Fakta-kode] Blok materi yang tersedia: judul, paragraf, daftar, catatan, tabel, **kasus** (contoh dihitung engine,
harapannya diuji test), video, **kuis** (`packages/content/src/materi.ts`, tipe `Blok`). Kasus contoh sudah bisa
dibuka di kalkulator lewat `TombolBukaKasus.tsx`, yang meminta konfirmasi bila kalkulator sedang berisi kasus lain.
Pelajaran ditandai selesai saat dibaca sampai bawah (`Materi.tsx`).

[Fakta-kode] Bank soal: 23 soal hitung (bab KB 4–10; dasar 8, menengah 9, sulit 6), satu soal per topik; 11 kuis konsep
pilihan ganda bab 1–6. Jenis soal latihan G2 jauh lebih luas (munasakhat, dzawil arham, mafqud, khuntsa, haml [SYF]/
[HNB], gharqa) menurut `docs/design/roadmap.md`. Model `PolaSoal` + `bangkitkanSoal(pola, benih)` +
`verifikasiSoal` sudah dirancang (`docs/design/riset-ux-kelas-lms-skala-soal-monetisasi-2026-11-20.md` bagian 5b), begitu
juga level A1–C2 (15a), placement test (15a), tes awal/akhir (15b), dan profil 5 dimensi Kaidah/Hisab/Prosedur/
Kelancaran/Penalaran (16b–16e).

Celah yang relevan untuk kurikulum [Inferensi dari berkas di atas]:

| # | Celah | Akibat bagi pelajar |
|---|---|---|
| K1 | Materi modul 6–10 belum ada, padahal soal hitungnya ada | Latihan mendahului penjelasan; pelajar mentok tanpa tempat belajar |
| K2 | KB 11 (sebagian), 12, 13–13d, 14, 18 belum punya pelajaran walau engine dan jenis soalnya ada | Level C1–C2 tidak punya materi |
| K3 | Tidak ada prasyarat pecahan/KPK | Titik gagal terbesar (lihat bagian 3 dan 5) tidak ditangani |
| K4 | Kuis konsep berhenti di bab 6, tanpa tingkat, tanpa penanda KC | Tidak bisa jadi bahan profil |
| K5 | "Selesai" = dibaca sampai bawah | Tidak ada bukti paham; profil tidak punya data |
| K6 | Urutan modul tidak cocok dengan level: modul 6 (KB 08, level **B2**) berada sebelum modul 7 (KB 07+09, level **B1**) | Pelajar bertemu kakek-saudara sebelum bisa 'aul dan tashih, padahal kasus uji akdariyyah di KB 16 (kasus 12: 6 → 9 → 27) dan jadd wal ikhwah (kasus 14: 4 → 12) memerlukan keduanya |
| K7 | KB 11 (nominal) tidak ada di pemetaan level A1–C2 | Modul 9 tidak punya level |
| K8 | Belum ada pintu belajar khusus awam | Awam masuk lewat istilah, bukan lewat situasinya |
| K9 | Pemetaan modul ↔ bab KB implisit (soal memakai nomor bab, modul memakai nomor sendiri) | Rawan dua taksonomi |

---

## 3. Prinsip ilmu belajar yang dipakai: lima kuat, sisanya hipotesis

Hampir semua bukti berasal dari matematika, sains, dan teks; **tidak ada studi khusus pembelajaran fikih atau waris**
yang ditemukan. Semua penerapan ke faraidh adalah [Inferensi].

| Prinsip | Dipakai di mana | Kekuatan bukti | Catatan dan batas |
|---|---|---|---|
| **Worked example + fading** | Inti tiap pelajaran hitung (ashl, 'aul, radd, tashih) | Sedang-kuat. Meta-analisis 2023 untuk matematika: g = 0,48 **(cuplikan; jumlah studi 43 vs 55 beda antar sumber)** ([Springer](https://link.springer.com/content/pdf/10.1007/s10648-023-09745-1.pdf)). Fading adaptif lebih baik dari fading tetap ([Salden dkk. 2010](https://link.springer.com/doi/10.1007/s11251-009-9107-8)) | Hanya empat studi faded example; tidak ada angka faded vs biasa. Berbalik untuk pelajar mahir (**expertise reversal**, [Kalyuga 2007](https://www.uky.edu/~gmswan3/EDC608/Kalyuga2007_Article_ExpertiseReversalEffectAndItsI.pdf)): mahasiswa yang sudah paham harus bisa melompat ke soal dengan contoh sebagai rujukan |
| **Retrieval practice** | Akhir tiap pelajaran, kuis cek | Kuat. Dunlosky 2013 menempatkannya di utilitas tinggi ([APS](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html)); Rowland 2014 d ≈ 0,50 **(sekunder, belum dicek ke makalah)** ([PubMed](https://pubmed.ncbi.nlm.nih.gov/25150680/)); recall lebih kuat dari recognition | Tanpa umpan balik bisa menguatkan salah. Angka Adesope 2017 (0,61/0,70) **tidak terkonfirmasi**, jangan dikutip |
| **Spacing** | Ulasan berjarak disisipkan ke pelajaran/soal hari ini berikutnya | Kuat. Utilitas tinggi (Dunlosky); Cepeda 2006 ([PubMed](https://pubmed.ncbi.nlm.nih.gov/16719566/)) | Tugasnya recall verbal, bukan prosedur. Angka "hingga 150%" (Cepeda 2009) **perlu dicek**; aturan rasio jeda tetap tidak terbukti |
| **Interleaving** | Setelah tiap kelompok aturan dikenal sendiri-sendiri: ibu 1/3 vs 1/6, kakek vs ayah, kandung vs sebapak | Sedang. g = 0,42 keseluruhan, efek lebih kuat bila kategori antar-kelas mirip ([Brunmair & Richter 2019](https://pubmed.ncbi.nlm.nih.gov/31556629/)); matematika g ≈ 0,34 **(sekunder)**; RCT kelas 7: 61% vs 38%, d = 0,83 **(dari ringkasan hibah IES, belum dari makalah)** ([IES](https://ies.ed.gov/use-work/awards/efficacy-study-interleaved-mathematics-practice)) | Terasa lebih sulit dan menurunkan skor sesaat; perkenalan pertama tetap blok |
| **Umpan balik berisi alasan** | Tiap jawaban salah: langkah mana dan rujukan KB | Sedang, heterogen. d = 0,48, sangat bergantung isi umpan balik ([Wisniewski dkk. 2020](https://www.frontiersin.org/articles/10.3389/fpsyg.2019.03087/full)) | Pujian umum dan skor lemah efeknya |
| Self-explanation (prompt bertanya) | "Mengapa saudara terhalang di sini?" dengan menu alasan | Sedang. g = 0,55; prompt interogatif 0,56 vs imperatif 0,40 ([Bisra dkk. 2018](https://www.Gwern.net/doc/psychology/spaced-repetition/2018-bisra.pdf)) **(angka perlu dicek)** | Mayoritas subjek mahasiswa; untuk awam pakai pilihan, bukan isian bebas |
| Pretesting ("tebak dulu") | Pembuka pelajaran | Sedang-rendah untuk prosedur; bukti untuk teks ([Pan & Sana 2021](https://pubmed.ncbi.nlm.nih.gov/33793291/)) | Wajib diikuti umpan balik cepat; jangan dinilai |
| Mastery learning + prasyarat | Gerbang lunak antar modul | Positif tapi jauh di bawah klaim "2 sigma" ([Kulik dkk. 1990](https://www.academia.edu/81783373/Effectiveness_of_Mastery_Learning_Programs_A_Meta_Analysis); kritik [Slavin 1987](https://Www.Gwern.net/doc/psychology/1987-slavin.pdf)) | Angka 0,52 SD **tidak terkonfirmasi**. Gerbang tidak boleh menghukum |
| Representasi visual pecahan (garis bilangan/area) | Modul 0 dan bar harta di tiap contoh | Ada bukti untuk besaran pecahan dan aritmetika ([Tian dkk. 2021](https://sites.temple.edu/cognitionlearning/files/2021/08/Tian-et-al-2021.pdf)) | Manfaat tidak seragam; concreteness fading (Fyfe 2014) **belum diverifikasi** |
| Productive failure | Hanya untuk konsep yang bisa "ditemukan" ('aul: "jumlah bagian melebihi harta, lalu?") pada mahasiswa | Kuat untuk tujuan konseptual, g = 0,87 setelah koreksi ([Sinha & Kapur 2021](https://ouci.dntb.gov.ua/works/4KnMgZq7)) **(cuplikan)**; untuk prosedur, instruksi-dulu setara | Aturan fikih adalah fakta dari KB, tidak bisa ditemukan sendiri. Untuk awam berisiko memicu cemas |
| Gamifikasi | Hampir tidak dipakai | g = 0,49 kognitif tapi motivasi tidak stabil; fiksi/narasi memoderasi ([Sailer & Homner 2020](https://link.springer.com/article/10.1007/s10648-019-09498-w)); hadiah terduga merusak motivasi intrinsik ([Deci dkk. 1999](https://pubmed.ncbi.nlm.nih.gov/10589297/)) | Proyek sudah menolak metafora game. Yang diambil hanya narasi kasus keluarga realistis |
| Yang **tidak** dipakai | Gaya belajar (VAK), growth mindset sebagai fitur | Learning styles tanpa bukti interaksi ([Pashler dkk. 2008](https://pubmed.ncbi.nlm.nih.gov/26162104/)); intervensi mindset lemah ([Macnamara & Burgoyne 2022](https://Www.Gwern.net/doc/psychology/2022-macnamara.pdf)) | Personalisasi berdasar penguasaan, bukan preferensi |

Dua area penting **tanpa bukti terverifikasi**: andragogi/belajar karena kebutuhan mendesak, dan belajar topik bermuatan
duka. Desain untuk awam di bawah adalah hipotesis yang harus diuji, bukan turunan bukti.

[Inferensi] Satu pengamatan yang menyatukan tabel ini: faraidh punya dua jenis isi yang perlu perlakuan berbeda.
**Fakta aturan** (ibu mendapat berapa dalam keadaan apa) interaktivitas elemennya rendah, cocok untuk retrieval dan
interleaving, tidak perlu worked example panjang. **Prosedur hitung** (ashl, 'aul, radd, tashih) interaktivitas
elemennya tinggi, cocok untuk worked example yang dipudarkan. Kurikulum yang memperlakukan keduanya sama akan terasa
bertele-tele di aturan dan terlalu cepat di hitungan.

---

## 4. Pembanding: tiru struktur Math Academy dan Brilliant, hindari mekanik Duolingo

| Pembanding | Yang ditiru | Yang dihindari |
|---|---|---|
| **Math Academy** | Tiap "knowledge point" dibuka contoh terselesaikan, lalu maksimal 5 soal, maju setelah 2 benar berturut-turut; soal salah jadi tugas review; diagnostik menemukan fondasi yang hilang ([How It Works](https://www.mathacademy.com/how-it-works), klaim vendor) | Kuis bertimer dan target XP harian; diagnostik 30–45 menit terlalu panjang untuk awam |
| **Brilliant** | Tanpa video, interaktif; pelajaran ±5 soal + skill check 3 soal, 5–10 menit; umpan balik saat soal masih dikerjakan ([Brilliant](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/), klaim vendor) | Klaim bahwa satu pelajaran = penguasaan (Brilliant sendiri tidak mengklaimnya) |
| **Exercism** | Memisahkan latihan konsep (mengajar) dari latihan praktik; tiap latihan mendeklarasikan konsep dan prasyaratnya ([docs](https://exercism.io/docs/building/tracks/concept-exercises)) → peta langsung ke "pelajaran" vs "Lab" | Pohon terkunci yang kaku |
| **Khan Academy** | Empat tingkat skill sederhana tanpa ML; lebih baik Proficient di sedikit skill daripada Familiar di banyak ([support](https://support.khanacademy.org/hc/tr/articles/5548760867853)) | Turun dua level sekaligus terasa menghukum |
| **ALEKS** | Beda "dipelajari" vs "dikonfirmasi" lewat cek belakangan; prasyarat sebagai struktur ([ALEKS FAQ](https://www.mheducation.com/support/aleks-support-center/knowledge/what-is-the-aleks-pie.html)) | Diagram pie bersegmen sebagai visual utama |
| **Duolingo** | Satu urutan jelas karena pelajar sering bingung "belajar dengan benar atau tidak"; review disisipkan di urutan, bukan tugas terpisah ([blog 2022](https://blog.duolingo.com/new-duolingo-home-screen-design/)) | Streak, liga, kehilangan kemajuan; bukti dampak streak hanya laporan internal ([blog](https://blog.duolingo.com/duolingo-streak-research/)) |
| **Nicky Case / Bret Victor** | "Tebak dulu" sebelum jawaban; sandbox diperkenalkan bertahap; interaktif mengarahkan perhatian ke satu fenomena ([Case](https://blog.ncase.me/explorable-explanations-4-more-design-patterns/), [Victor](https://worrydream.com/ExplorableExplanations/)) | Sandbox terbuka tanpa arahan di awal |
| **Ruangguru/Zenius/Quipper** | Pembahasan langsung setelah soal | Video panjang sebagai inti; ada laporan siswa bosan ([mojok](https://mojok.co/terminal/ruangguru-vs-zenius-mana-yang-paling-asyik/), sumber populer) |
| **NU Online Kalkulator Waris** | Menjelaskan langkah, madzhab Syafi'i, ekspor ringkasan, kanal laporan galat ([NU Online](https://nu.or.id/nasional/kalkulator-waris-nu-online-hitung-hak-ahli-waris-dalam-sekejap-v8EGR)) | Belajar terpisah dari hitung |
| **Aplikasi faraidh lain** (Ilmu Waris, iFaraid, Faraid-Inheritance Calculator, WarisanQ) | Belajar per ahli waris dengan dalil; 40 kasus dengan pembahasan ([App Store](https://apps.apple.com/id/app/faraid-inheritance-calculator/id1577031741?l=id)) | Kalkulator yang hanya memberi hasil |
| **Prototipe akademik** (E-Waris, Far-Aid, Smart Waris) | Materi + kuis bertahap + hitung otomatis ([Far-Aid](https://openlibrarypublications.telkomuniversity.ac.id/index.php/appliedscience/article/download/13933/13673/26826)) | Uji ke puluhan siswa, tanpa ukur dampak belajar |
| **arifwaris** | Tidak dapat diakses (domain tidak resolve); tidak dinilai | |

[Inferensi] Celah pasar yang terlihat (dari pencarian terbatas): belum tampak platform yang memadukan jalur belajar
bertahap, latihan dengan umpan balik per tahap, jejak penjelasan, dan multi-madzhab. Diferensiasi platform ini bukan
hasil akhir (sudah banyak), tapi **jejak keputusan engine yang bisa dijadikan contoh terselesaikan dan dipudarkan**.

---

## 5. JTBD per audiens [Inferensi, menunggu wawancara]

Bukti yang mendasari: kesulitan mahasiswa yang paling konsisten dilaporkan adalah **pecahan dan penyamaan penyebut**,
lalu istilah dan pengelompokan ahli waris, plus waktu kuliah singkat sehingga variasi contoh sedikit
([AJSK](https://doi.org/10.24042/ajsk.v16i1.743), [Netriwati 2016](https://www.neliti.com/publications/57464/)); korelasi
pemahaman pecahan dengan kemampuan soal mawaris r = 0,588 **(cuplikan, sampel lokal)**
([ResearchGate](https://www.researchgate.net/publication/349222578_Analisis_Kesulitan_Mahasiswa_tentang_Pembelajaran_Pecahan_pada_Kitab_Faroid));
lulusan SMA lebih kesulitan dibanding lulusan madrasah **(cuplikan)**
([AJISD](https://ejournal.yasin-alsys.org/AJISD/article/download/4079/3202)). Untuk awam, bukti kualitatif menyebut
literasi rendah, pengaruh adat, dan benturan hukum Islam–positif–adat sebagai hambatan, dengan mediasi bergantung pada
pemahaman para pihak ([Burhanuddin 2025](https://urj.uin-malang.ac.id/index.php/mij/article/download/14025/4304), studi
literatur). Kegiatan penyuluhan kecil melaporkan nilai naik dari ±4,5 ke 8,3 **(cuplikan, sampel kecil)**
([Adi Dharma](https://jurnal.abisatya.org/index.php/ADI-DHARMA/article/download/170/101)). Tidak ada survei nasional
literasi waris.

### Awam dewasa (keluarga yang mengurus waris)

| Saat … | saya ingin … | supaya … | Ukuran sukses |
|---|---|---|---|
| A1. Ada anggota keluarga wafat dan rapat keluarga mendekat | tahu siapa yang berhak dan kira-kira berapa, dengan alasan satu kalimat per orang | bisa bicara tenang dan netral | Bisa menjelaskan bagian tiap orang tanpa membuka aplikasi lagi |
| A2. Ada yang bilang "dibagi rata saja" atau ada klaim sepihak | paham dasar pembagian tanpa merasa digurui | tidak dituduh serakah atau memihak | Tidak perlu membaca istilah Arab sebelum mendapat jawaban |
| A3. Hasil kalkulator sudah keluar | paham **mengapa** satu orang dapat lebih kecil atau tidak dapat | bisa menjawab pertanyaan keluarga | Bisa menunjuk alasan per orang di Hasil |
| A4. Mau membagikan ke grup keluarga | membawa ringkasan yang jelas batasnya (bukan fatwa, [SYF] default, KHI hanya info) | tidak disalahpahami | Ringkasan terkirim tanpa diedit |
| A5. Sedang berduka | belajar sedikit-sedikit, tanpa skor, tanpa terburu | tidak merasa bodoh | Kembali lagi tanpa dipaksa |

Kecemasan dugaan: istilah Arab, pecahan, "kalau salah dosa/konflik", bingung KHI vs adat vs fikih. Workaround: bertanya
ke ustadz/notaris/PA, kalkulator daring, pembagian adat.

### Mahasiswa (syariah, hukum, ekonomi syariah)

| Saat … | saya ingin … | supaya … | Ukuran sukses |
|---|---|---|---|
| M1. Menghadapi UTS/UAS fiqh mawaris | berlatih kasus bervariasi dengan urutan langkah yang benar | tidak lupa urutan di ujian | Benar penuh pada soal baru setingkat |
| M2. Salah di satu kolom | tahu langkah mana yang salah: aturan atau hitungan | tidak mengulang dari nol | Salah kaidah dan salah hisab terpisah (profil Hisab dengan ECF sudah dirancang, 16b) |
| M3. Pecahan masih goyah | memperkuat KPK dan penyebut tepat di titik dipakai | tidak tertinggal teman lulusan madrasah | Lolos cek pecahan singkat sebelum modul Menghitung |
| M4. Sudah paham dasar | melompati yang sudah bisa | tidak bosan | Bisa mengikuti cek penempatan dan langsung ke level-nya |
| M5. Mau membuktikan ke dosen/diri sendiri | melihat kemajuan per skill yang jujur | tahu apa yang perlu diulang | Profil menunjukkan jumlah bukti dan saran satu langkah |
| M6. Belajar madzhab lain atau KHI | melihat perbedaan setelah paham [SYF] | tidak mencampur | Perbedaan muncul sebagai lapisan, bukan aturan baru |

JTBD pelajar yang sudah ada di repo (J1–J8 di `riset-ux-model-percobaan-dan-keterlibatan-2026-11-20.md` bagian 3)
tetap berlaku dan tidak diulang di sini.

---

## 6. HMW

| HMW | Bagaimana kita bisa … | JTBD |
|---|---|---|
| HMW-1 | membuat awam paham kasusnya sendiri **sebelum** bertemu istilah? | A1–A3, A5 |
| HMW-2 | membuat pecahan tidak jadi tembok, tanpa menakuti yang tidak perlu menghitung sendiri? | M3, A5 |
| HMW-3 | membuat urutan belajar sama dengan urutan yang dilihat pelajar di Lab dan Hasil? | M1, A3 |
| HMW-4 | membuat soal di dalam materi bisa dicoba di Lab lalu kembali ke titik yang sama, tanpa merusak kasus pribadi? | A3, M1 |
| HMW-5 | membuat kuis cek mendiagnosis salah paham tertentu, bukan sekadar skor? | M2, M5 |
| HMW-6 | membuat profil skill yang jujur (berapa buktinya) dan berguna (langkah berikutnya), tanpa tekanan sosial? | M5 |
| HMW-7 | mengisi materi modul 6–10 dan C1–C2 dengan cepat tanpa mengarang fikih? | K1, K2 |

---

## 7. Ide per HMW, pilihan, dan rekomendasi

### HMW-1 Awam paham kasusnya dulu

| Opsi | Isi | Untung | Rugi |
|---|---|---|---|
| 1a | Satu jalur untuk semua, mulai modul 1 | Paling sedikit kerja | Awam bertemu definisi dan rukun dulu |
| 1b | **Pintu situasi**: dari Hasil kasus sendiri, tiap orang punya tautan "Kenapa begini?" yang membuka pelajaran pendek tentang **keputusan yang terjadi pada orang itu** (dari `LangkahJejak`) | Belajar tepat saat butuh; tanpa kurikulum kedua | Butuh pemetaan langkah jejak → pelajaran |
| 1c | Kursus kilat awam terpisah (4–5 pelajaran) | Jelas | Dua kurikulum, dua tempat diperbarui |

**[Rekomendasi] 1b + satu urutan pendek "Paham waris keluarga" (4 pelajaran yang diambil dari kurikulum yang sama**,
bukan konten baru): harta dibereskan dulu (KB 01), siapa yang tidak mendapat apa-apa (hajb hirman), bagian pasti dan
sisa, apa yang tidak dijawab aplikasi (bukan fatwa, KHI sebagai panel informasi). Teks nada tenang, tanpa skor, tanpa
perayaan (selaras keputusan "tanpa perayaan di mode Hitung kasus").

### HMW-2 Pecahan bukan tembok

| Opsi | Isi |
|---|---|
| 2a | Modul pecahan wajib di depan |
| 2b | **Modul 0 opsional tepat sebelum modul 7 Menghitung**, dibuka oleh cek 5 soal; lolos = lewat |
| 2c | Pengingat pecahan satu layar di dalam tiap pelajaran hitung |

**[Rekomendasi] 2b + 2c.** Di modul 3 (furudh) cukup visual bar harta utuh (area model) untuk 1/2, 1/3, 1/6, tanpa
operasi. Operasi (penyebut sama, KPK, nisab arba') baru di modul 0, yang hanya memakai kaidah hisab [KH] dari
`packages/math`. Awam yang tidak menghitung sendiri tidak pernah dipaksa melewatinya.

### HMW-3 Urutan belajar = urutan di Lab

Dibahas tuntas di bagian 8a. **[Rekomendasi]**: urutan kerja bab 00 sebagai tulang punggung, hajb dipecah.

### HMW-4 Soal di materi → Lab → kembali

[Fakta-sumber] Tidak ditemukan dokumentasi bagaimana Brilliant/Khan/Codecademy menangani "buka sandbox lalu kembali ke
langkah semula"; ini celah. [Fakta-kode] `TombolBukaKasus` sudah meminta konfirmasi bila kalkulator berisi kasus lain;
riset siklus kasus vs soal (`riset-ux-siklus-kasus-dan-soal-2026-11-23.md` bagian 4–6) mengusulkan "dua benda, dua
rumah": soal di Latihan, kasus di Kasusmu.

| Opsi | Isi |
|---|---|
| 4a | Buka di Lab menimpa isi kalkulator (dengan konfirmasi), seperti sekarang |
| 4b | **Buka sebagai contoh sementara**: Lab terbuka dengan isian contoh, tidak menyentuh kasus pribadi, dengan tautan tetap di atas "Kembali ke pelajaran: langkah 3 dari 6"; posisi pelajaran disimpan per langkah dalam rute |
| 4c | Lab mini tersemat di dalam pelajaran |

**[Rekomendasi] 4b.** Murah (rute + satu state), tidak membuat Lab kedua, dan konsisten dengan "dua benda". Di Lab,
contoh dari pelajaran membawa **satu pertanyaan arahan** ala Bret Victor ("hapus kedua saudara, tebak dulu bagian ibu,
lalu lihat"), bukan sandbox kosong. "Jadikan kasus sendiri" tetap salinan.

### HMW-5 Kuis yang mendiagnosis

**[Rekomendasi]** pertanyaan engsel (hinge) 1–3 per pelajaran, pengecoh dari daftar miskonsepsi yang divalidasi tim
keilmuan, dan pengecoh hitung yang dibangkitkan dengan **mengubah satu langkah kunci engine** (bukan ruleset palsu di
engine). Rinci di bagian 10.

### HMW-6 Profil yang jujur

**[Rekomendasi]** bilah per skill dengan jumlah bukti sebagai tampilan utama; radar 5 dimensi sekunder; jaring
prasyarat dengan sorotan "siap dipelajari". Rinci di bagian 11.

### HMW-7 Mengisi materi tanpa mengarang

| Opsi | Isi |
|---|---|
| 7a | Tulis tiap pelajaran sebagai prosa dari bab KB |
| 7b | **Kerangka pelajaran = blok `kasus` dari kasus uji KB 16 + paragraf pendek yang mengutip bab KB dengan `[Rxx-y]`**, lalu tim keilmuan mengesahkan |
| 7c | Pakai AI untuk menulis draf penjelasan |

**[Rekomendasi] 7b.** Kasus contoh dihitung engine dan diuji test, jadi angka tidak bisa melenceng dari KB; prosa
dibatasi ke "mengapa" yang sudah tertulis di KB. 7c ditolak untuk isi fikih (tidak terlacak ke KB).

---

## 8. Usulan kurikulum konkret

### 8a. Konflik urutan: kitab vs pipeline engine

Urutan kitab dan buku yang ditemukan: sebab → penghalang (mawani') → ashabul furudh → ashabah → hajb
([ringkasan fikih](https://islamcontent.com/storage/contents/69249/id_05_summary_of_the_islamic_fiqh_tuwajre.pdf),
[Rahabiyyah](https://www.cia.gov/library/abbottabad-compound/AC/ACB4027BDE6C085CEF33B4B0CA1CC4E7rahbiyah.pdf), hanya urutan
judul). Nomor bab KB mengikuti pola ini (04 furudh, 05 ashabah, 06 hajb). Tapi **bab 00 KB sendiri menetapkan urutan
kerja** tiap kasus: hak tirkah → mawani' → daftar ahli waris → **hajb** → furudh dan ashabah → ashl → 'aul/radd →
tashih → nominal [Fakta-kode] `docs/kb/00_indeks_dan_konvensi.md` konvensi 2; engine mengikuti urutan itu (CLAUDE.md
prinsip 4).

| Opsi | Isi | Untung | Rugi |
|---|---|---|---|
| A. Urutan kitab | furudh dulu, hajb belakangan | Cocok dengan buku dosen dan RPS | Pelajar belajar memberi bagian kepada orang yang ternyata terhalang; contoh di Lab (yang menampilkan hajb lebih dulu) tidak cocok dengan materi |
| B. Urutan pipeline murni | hajb lengkap sebelum furudh | Sama persis dengan Lab dan jejak engine | Hajb nuqshan (bagian mengecil) tidak bisa dipahami sebelum tahu bagian asalnya |
| **C. Pipeline, hajb dipecah** | hajb hirman dasar sebelum furudh; hajb nuqshan masuk ke tiap pelajaran furudh sebagai syarat bagian; modul hajb menjadi pemantapan tabel hajib–mahjub + latihan campur | Urutan sama dengan Lab; tidak ada konsep yang dipakai sebelum dikenalkan | Menggeser satu pelajaran dari urutan buku |

**[Rekomendasi] C**, dengan alasan: (1) glosarium KB sendiri sudah memisahkan hajb hirman (gugur seluruhnya) dan hajb
nuqshan (berkurang) [Fakta-kode] `docs/kb/15_glosarium.md`; (2) hirman cukup butuh daftar ahli waris, nuqshan butuh
furudh, jadi pemisahan mengikuti ketergantungan pengetahuan, bukan selera; (3) contoh terselesaikan dari `LangkahJejak`
selalu bernarasi dalam urutan pipeline, jadi materi dan Lab bercerita dengan urutan yang sama; (4) perubahannya kecil:
**tambah pelajaran 2.4 "Siapa yang tidak mendapat apa-apa" (hajb hirman dasar)**, modul 5 tetap ada sebagai "Hajb
lengkap". Mahasiswa yang dosennya memakai urutan kitab tetap bisa membuka modul 3–5 dalam urutan apa pun (gerbang
lunak). Urutan ini keputusan pedagogis, bukan fikih, tetapi **wajib divalidasi tim keilmuan** (sama seperti level 15a).

### 8b. Peta modul, bab KB, level, dan audiens

| Urutan | Modul | Bab KB | Level (15a) | Pintu awam | Catatan |
|---|---|---|---|---|---|
| 1 | Pengantar | 01 | pra-A1 | ya (harta dibereskan dulu) | ada |
| 2 | Siapa ahli waris | 02, 03 + **2.4 hajb hirman dasar** (06) | A1 | ya | tambah 2.4 |
| 3 | Bagian pasti (furudh) | 04 (+ syarat nuqshan per ahli waris) | A1 | ya (ringkas) | bar harta, tanpa operasi |
| 4 | Sisa (ashabah) | 05 | A2 | ya (ringkas) | ada |
| 5 | Hajb lengkap | 06 | A2 | tidak | jadi pemantapan + interleaving |
| 6 | **Modul 0: Pecahan untuk faraidh** (opsional, cek 5 soal) | [KH] 09/10 | prasyarat B1 | tidak | baru |
| 7 | Menghitung (ashl, 'aul, radd; masalah khusus furudh) | 07, 09 | B1 | tidak | materi belum ada |
| 8 | Tashih | 10 | B2 | tidak | materi belum ada |
| 9 | Kakek & saudara | 08 | B2 | tidak | **pindah ke sesudah Tashih** (K6) |
| 10 | Pembagian nominal | 11 | B1/B2 (diputuskan) | ya (bagian "berapa rupiah") | K7 |
| 11 | Munasakhat | 12 | C1 | tidak | |
| 12 | Dzawil arham (baru) | 14 | C1 | tidak | |
| 13 | Kasus khusus (baru) | 13, 13a–13d | C2 | tidak | patuhi titik blocked (haml [SYF], batas taqdir) |
| lapisan | Perbedaan madzhab | 18 | sesudah B1 | tidak | overlay, sumber `primer`/`sekunder` disebut |
| panel | Kalau menurut KHI | `docs/kb-khi/` | — | ya | informasi, "hukum positif, bukan fikih", bukan pelajaran hitung |

Nomor modul yang terlihat pengguna boleh tetap 1–10 (pemilik memilih apakah diberi nomor ulang).

### 8c. Dua pintu, satu kurikulum

**Pintu situasi (awam)** [Rekomendasi]: masuk dari Hasil kasus sendiri atau dari beranda "Saya sedang mengurus waris
keluarga". Isinya urutan pendek 4 pelajaran (bagian 7, HMW-1), tiap pelajaran ±5 menit, tanpa kuis bernilai; cek
pemahaman berupa "tebak dulu" tanpa skor. Dari Hasil, tautan "Kenapa begini?" per orang membuka satu layar pelajaran
yang cocok dengan keputusan engine untuk orang itu (hajb hirman → 2.4; nuqshan → pelajaran furudh orang itu; 'aul →
modul 7). Lanjut ke kurikulum penuh hanya bila mau.

**Pintu sistematis (mahasiswa)** [Rekomendasi]: modul berurutan dengan gerbang lunak; cek penempatan opsional
(placement 10–15 soal dari 15a) untuk melompat; ulasan berjarak dan latihan campur aktif; profil dan level tampil.

---

## 9. Anatomi satu pelajaran interaktif

| Bagian | Durasi | Isi | Prinsip |
|---|---|---|---|
| 1. Tebak dulu | ±30 dtk | satu pertanyaan tanpa skor atas kasus kecil | pretesting, "tebak dulu" (Nicky Case) |
| 2. Contoh terselesaikan | 1–2 mnt | blok `kasus` dihitung engine, langkah tampil satu per satu sesuai `LangkahJejak`, bar harta | worked example, satu keputusan per layar |
| 3. Mengapa? | ±30 dtk | prompt bertanya dengan 3 pilihan alasan | self-explanation interogatif |
| 4. Contoh dipudarkan | 1–2 mnt | soal dari pola yang sama (benih lain); pelajar mengisi **satu** sel kunci, engine mengisi sisanya | fading |
| 5. Soal penuh | 1–3 mnt | 1–2 soal dari pola; koreksi bertahap seperti mode Latihan | retrieval, umpan balik berisi alasan |
| 6. Buka di Lab | opsional | tautan teks "Coba ubah di Lab" dengan satu pertanyaan arahan; tautan kembali ke langkah ini | sandbox terarah |
| 7. Cek pemahaman | ±1–2 mnt | 1–3 pertanyaan engsel | hinge question |
| 8. Ulasan berjarak | nanti | KC pelajaran ini muncul lagi di soal hari ini dan di latihan campur modul berikutnya | spacing, interleaving |

Total 5–10 menit; angka ini **hipotesis** dari patokan vendor Brilliant dan asumsi repo "sesi 5–15 menit di HP", bukan
bukti. Patokan yang lebih aman adalah **satu keputusan fikih per layar**, bukan menit. Mahasiswa yang benar di bagian 1
dan 5 sekaligus boleh melompati 2–4 (expertise reversal). Selesai = cek pemahaman dijawab, bukan "dibaca sampai bawah"
(menutup K5). Semua aksi lanjut berupa tautan teks; tombol berbingkai hanya Periksa/Kirim di form soal.

[Rekomendasi kode, minimal] Blok yang ada sudah menutup bagian 2 (`kasus`) dan 7 (`kuis`). Yang perlu ditambah cukup
**satu jenis blok `latihan`** (pola + sel yang dikosongkan) untuk bagian 4–5; "tebak dulu" bisa memakai `kuis` dengan
penanda tanpa nilai. Jangan buat tipe blok per varian.

### Contoh jalan: pelajaran "Saudara yang terhalang tetap mengurangi bagian ibu"

Fikih di contoh ini seluruhnya dari KB: kasus uji 15 (ayah, ibu, 2 saudara lk kandung; ashl 6; ibu 1, ayah 5,
saudara 0; menguji "mahjub tetap menghijab nuqshan") di `docs/kb/16_kasus_uji.md` dengan rujukan **[R16-3]** (Raudhah),
dan penjelasan hajb hirman/nuqshan di glosarium (`docs/kb/15_glosarium.md`). Letak: modul 5 (Hajb lengkap), sesudah 2.4
dan pelajaran furudh ibu.

1. **Tebak dulu.** Pohon keluarga kecil: ayah, ibu, dua saudara laki-laki kandung. "Siapa yang tidak mendapat apa-apa?"
   Pelajar mengetuk orang di pohon. Umpan balik langsung, tanpa skor.
2. **Contoh terselesaikan.** Langkah 1 (hajb): kedua saudara terhalang sepenuhnya oleh ayah (hajb hirman). Langkah 2
   (furudh): ibu mendapat 1/6 karena ada dua saudara, walaupun keduanya sendiri terhalang (hajb nuqshan). Langkah 3:
   sisanya untuk ayah. Langkah 4: ashl 6, ibu 1 bagian, ayah 5 bagian `[R16-3]`. Bar harta 6 kotak mewarnai 1 dan 5.
   Semua angka berasal dari blok `kasus` yang dihitung engine.
3. **Mengapa?** "Mengapa bagian ibu 1/6 di kasus ini?" Tiga pilihan alasan; teks alasan benar dari KB, pengecoh ditulis
   tim keilmuan.
4. **Dipudarkan.** Pola yang sama dengan jumlah saudara berbeda (benih lain). Pelajar hanya mengisi sel Bagian ibu;
   engine mengisi kolom lain dan memeriksa.
5. **Soal penuh.** Satu soal dari pola sejenis; pelajar mengisi Bagian dan saham; koreksi bertahap.
6. **Buka di Lab.** Tautan "Coba di Lab: hapus kedua saudara, tebak dulu bagian ibu, lalu lihat hasilnya". Engine yang
   menjawab; materi tidak menyebut angkanya. Tautan tetap "Kembali ke pelajaran, langkah 6".
7. **Cek pemahaman.** Satu pertanyaan engsel (lihat bagian 10) dengan pengecoh yang memetakan salah paham.
8. **Ulasan berjarak.** KC "nuqshan oleh mahjub" dijadwalkan muncul di soal hari ini dan dicampur dengan kasus ibu
   1/3 vs 1/6 di latihan modul 7.

---

## 10. Desain kuis uji pemahaman

[Fakta-sumber] Pertanyaan engsel (Wiliam) ditaruh di titik keputusan sebelum lanjut; tiap pilihan salah menargetkan
satu miskonsepsi; pengecoh yang tidak masuk akal membuat soal jadi tebakan; menjawab sekitar 1–2 menit
([ASCD](https://ascd.org/el/articles/designing-great-hinge-questions), ringkasan). Tes dua tingkat (jawaban + alasan)
menurunkan pilihan alasan dari jawaban siswa sungguhan
([Treagust 1988](https://www.dcu.ie/sites/default/files/smec/pdfs/P3%20SMEC%202008%20Treagust.pdf)). Contoh salah
("temukan kesalahan") bisa seefektif contoh benar untuk pemahaman konsep aljabar, tapi lebih membingungkan dan
hasilnya campur ([Booth dkk. 2013](https://learnlab.org/research/wiki/index.php/Booth)). Certainty-based marking memakai
penalti dan buktinya sebagian besar dari pengembangnya sendiri ([Moodle docs](https://docs.moodle.org/503/en/Using_certainty-based_marking)).

[Rekomendasi]
- **Jumlah**: 1–3 pertanyaan engsel per pelajaran, satu KC terpenting. Volume untuk profil datang dari soal pola, bukan
  dari kuis cek.
- **Bentuk**: isian (recall) bila jawabannya satu sel (mis. Bagian ibu); pilihan ganda bila yang diuji alasannya.
  "Pilih alasan" yang sudah dirancang (16d) adalah bentuk dua tingkat yang tertutup dan dinilai otomatis.
- **Sumber pengecoh**, tiga lapis:
  1. Daftar miskonsepsi yang divalidasi tim keilmuan (sumber utama; awalnya kecil, diperluas dari data pilot karena
     **tidak ada daftar miskonsepsi faraidh terukur** di literatur yang ditemukan).
  2. **Pengecoh hitung dari kunci engine yang diubah satu langkah**: ambil keluaran engine, ubah satu keputusan pada
     jejak (mis. abaikan nuqshan, tidak menjalankan 'aul, lupa tashih), lalu hitung ulang sisanya hanya dengan kaidah
     hisab [KH] dari `packages/math`. Tiap mutasi diberi label miskonsepsi. Ini sama dengan mekanisme "temukan
     kesalahan" di 16d dan **tidak menambah ruleset salah ke engine** (engine tetap satu-satunya sumber kunci benar).
     Pada contoh di bagian 9, mutasi "abaikan nuqshan oleh mahjub" menghasilkan pengecoh yang memetakan tepat salah
     paham yang diuji kasus 15.
  3. Jawaban salah yang sering muncul di data nyata (sesudah ada log).
- **Umpan balik** spesifik per pilihan: langkah mana, rujukan KB, satu kalimat; tanpa "salah!" dan tanpa pengurangan XP.
- **Tidak dipakai**: certainty-based marking (penalti bertentangan dengan prinsip tanpa hukuman; bukti tipis), kuis
  bertimer di cek pemahaman.
- **Bobot bukti**: jawaban kuis cek masuk ke log yang sama dengan soal, tapi berbobot lebih rendah dari Latihan/Ujian.

---

## 11. Profil skill: dari jejak engine ke bilah, radar, dan jaring

### 11a. Penandaan skill dari jejak engine

[Fakta-sumber] Knowledge component adalah unit kognitif yang hanya bisa disimpulkan dari kinerja
([KLI, Koedinger dkk. 2012](https://kilthub.cmu.edu/articles/journal_contribution/The_knowledge-learning-instruction_framework_bridging_the_science-practice_chasm_to_enhance_robust_student_learning_/6470522));
Q-matrix memetakan langkah ke KC ([Chi dkk.](https://www.stat.cmu.edu/~brian/nynke/726-2021/project%20HCI%20Prereqs%20(Elaine,%20Smeet%20&%20Zhou)/2021-03-02/chi-etal-ifa-AFM-PFM-IFM.pdf));
pilihan butir KC tetap harus dibuat bahkan untuk model sederhana ([Pelánek 2017](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)).

[Rekomendasi] Nilai per **langkah**, bukan per soal. KC = tahap pipeline × keluarga aturan (mis. hajb hirman,
nuqshan, fardh pasangan, ashl, 'aul, radd tanpa/dengan pasangan, tashih inkisar, nominal pembulatan); perkiraan 20–40 KC
untuk versi pertama [Inferensi, tidak ada sumber jumlah optimal]. **Baris Q-matrix diturunkan otomatis dari
`LangkahJejak` + `refs`** yang sudah dipancarkan engine, bukan dilabeli tangan. Dua tingkat: KC (halus, diestimasi) →
digulung ke 5 dimensi profil yang sudah diputuskan (16b) dan ke topik/level. Langkah lanjut dinilai dengan ECF terhadap
jawaban pelajar sendiri (sudah diputuskan untuk profil, 16b).

### 11b. Estimator: aturan sederhana dulu

[Fakta-sumber] Pelánek menyarankan implementasi sederhana untuk semua komponen penting lebih baik daripada model canggih
dengan kebijakan instruksi dan open learner model yang buruk; rata-rata bergerak eksponensial sering memberi prediksi
wajar ([Pelánek 2017](https://www.fi.muni.cz/~xpelanek/publications/umuai-overview.pdf)); Elo dengan K tetap setara rata-
rata berbobot meluruh, dan K yang bergantung ketidakpastian disarankan
([Pelánek, decay-Elo](https://www.fi.muni.cz/~xpelanek/publications/decay-elo.pdf)).

[Rekomendasi]
- **v1**: aturan ambang yang sudah ada (16c: "belum cukup bukti" < 12 sel dari < 3 soal; Beginner/Intermediate/
  Advanced) diterapkan per KC, ditambah rata-rata bergerak per KC untuk urutan saran. Tingkat kesulitan diambil dari
  ciri pola (jumlah ahli waris, ada 'aul/radd/inkisar), bukan dipelajari dari data, jadi tidak ada masalah awal dingin
  [Inferensi].
- **Penyimpanan**: satu tabel kejadian langkah yang hanya ditambah (pelajar, KC, benar, pola, benih, waktu). Estimasi
  selalu bisa dihitung ulang, sehingga algoritma bisa diganti (Elo/PFA/BKT) tanpa migrasi data.
- **v2** hanya bila log sudah ada dan ada kebutuhan nyata: bandingkan Elo/PFA dengan v1 pada prediksi data yang
  disisihkan. pyBKT hanya Python, berarti pekerjaan luring, bukan di browser
  ([pyBKT](https://arxiv.org/pdf/2105.00385)).

### 11c. Visualisasi: bilah utama, radar sekunder, jaring sebagai peta prasyarat

[Fakta-sumber] Posisi pada skala yang sama dinilai paling akurat, sudut dan luas paling lemah
([catatan Cornell](https://info3312.infosci.cornell.edu/ae/graphical-perception-A.html)); radar membesar-besarkan beda
lewat luas dan bentuknya berubah bila urutan sumbu diubah ([Scott Logic](https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts),
kritik praktisi, bukan eksperimen). Tidak ditemukan studi radar vs bilah khusus profil belajar. Skill meter berbentuk
bilah adalah visual open learner model paling umum ([EduTechWiki](https://edutechwiki.unige.ch/en/Open_learner_model)).
Tinjauan 38 studi dashboard: **tidak ada bukti dashboard meningkatkan prestasi**, efek motivasi kecil
([Kaliisa dkk.](https://arxiv.org/pdf/2312.15042)).

[Rekomendasi]
- **Utama: bilah per skill** pada skala sama, **diurutkan tetap mengikuti alur hitung** (bukan diurutkan dari nilai,
  supaya letak tiap skill selalu sama), dengan jumlah bukti ("dari 9 soal") dan status "belum cukup bukti" berupa bilah
  pudar. Tiap skill lemah punya satu tautan langkah berikutnya ("Latihan tashih, 3 soal" / "Pelajari: Tashih"). Ini
  bentuk yang sudah digambar di 16e.
- **Sekunder: radar 5 dimensi** (Kaidah, Hisab, Prosedur, Kelancaran, Penalaran), sumbu tetap dan berlabel nilai,
  hanya di layar lebar atau sebagai ringkasan yang bisa diketuk ke bilah. Di HP biasa radar kecil sulit dibaca; bilah
  tetap tampilan bawaan.
- **Jaring = peta prasyarat**: simpul KC/topik, garis = prasyarat (diturunkan dari urutan bab 00 dan ketergantungan
  kasus), warna = status, sorotan **"siap dipelajari"** = KC yang semua prasyaratnya sudah cukup tapi dirinya belum
  (analog ringan "outer fringe" KST, [Knowledge space](https://en.wikipedia.org/wiki/Knowledge_space); belum divalidasi
  seperti ALEKS). Di HP tampil sebagai daftar bertingkat, graf hanya di layar lebar. Bukti dampak tampilan graf ke
  pelajar tidak ditemukan; perlakukan sebagai alat navigasi, bukan alat motivasi.
- **Pengajar**: matriks pelajar × dimensi (sudah di 16e), tanpa peringkat bawaan.

### 11d. Privasi

[Fakta-kode] Profil tidak pernah otomatis menjadi nilai (16c, merujuk UU PDP Pasal 10 dan audit P9). [Rekomendasi,
tanpa sumber luar di sesi ini]: profil privat bawaan; pengajar hanya melihat lewat keanggotaan kelas yang jelas; tidak
ada papan peringkat bawaan; perbandingan teman, bila ada, opsional dan berupa sebaran kelas, bukan urutan; pelajar bisa
melihat bukti dan menghapus datanya; estimasi selalu dilabeli perkiraan. Penerapan UU PDP untuk pelajar di bawah umur
dan persetujuan orang tua **belum diverifikasi** di riset ini.

---

## 12. Kaitan ke generator soal pola (G4): kurikulum = daftar kerja pola

[Rekomendasi] Tiap pelajaran mendeklarasikan tiga hal, dan itulah antarmuka kurikulum ↔ G4:

| Field pelajaran | Isi | Dipakai oleh |
|---|---|---|
| `kc` | KC yang diajarkan (dari daftar 11a) | profil, ulasan berjarak |
| `pola` | pola soal untuk bagian dipudarkan, soal penuh, dan ulasan | `bangkitkanSoal(pola, benih)` |
| `syarat` | batasan yang harus terjadi di keluaran engine (mis. "terjadi nuqshan oleh mahjub", "tanpa tashih") | `verifikasiSoal` |

Akibatnya:
- **Cetak biru level** (A1–C2, tes awal/akhir 15b, placement 15a) = gabungan `pola` dari semua pelajaran di level itu;
  tidak perlu daftar terpisah.
- **Cek cakupan otomatis**: tiap KC di tiap level harus punya ≥ 1 pola yang lolos verifikasi; bila tidak, pakai soal
  kurasi, atau KC itu memang blocked (engine `TIDAK_DIDUKUNG`) dan pelajarannya ditandai.
- **Urutan membangun pola** mengikuti celah kurikulum: modul 7–9 dulu (soal hitungnya hanya satu per topik, K1), lalu
  C1–C2.
- **Contoh**: pelajaran di bagian 9 → pola dengan slot ayah 1, ibu 1, saudara lk kandung 2..n, syarat "nuqshan oleh
  mahjub terjadi"; teks soal lewat diksi; `refs` wajib menyebut R16-3 dan bab 06. Pola hanya menyusun input, fikih tetap
  di engine (5b).
- **Soal serupa** sesudah salah = pola sama, benih lain (sudah di 5b).

---

## 13. Keputusan yang menunggu pemilik

1. Urutan inti: **opsi C** (pipeline, hajb dipecah, tambah pelajaran 2.4) atau A/B (bagian 8a)?
2. Pindahkan modul Kakek & saudara ke sesudah Tashih (menutup K6)? Nomor modul yang terlihat diberi nomor ulang atau
   tidak?
3. Modul 0 pecahan: opsional tepat sebelum Menghitung (rekomendasi) atau wajib di depan?
4. Level untuk modul Pembagian nominal (KB 11): B1 atau B2 (K7)?
5. Awam: pintu situasi + urutan pendek 4 pelajaran dari kurikulum yang sama (rekomendasi), atau kursus awam terpisah?
6. "Buka di Lab" sebagai contoh sementara yang tidak menyentuh kasus pribadi, dengan tautan kembali ke langkah (4b)?
7. Definisi "pelajaran selesai": cek pemahaman dijawab (rekomendasi) menggantikan "dibaca sampai bawah"?
8. Tambah satu jenis blok `latihan` di `materi.ts`?
9. Pengecoh hitung dari mutasi satu langkah kunci engine: disetujui, dengan daftar mutasi yang disahkan tim keilmuan?
10. Profil: bilah sebagai tampilan utama dan radar sekunder (rekomendasi), atau radar utama?
11. Jaring: tampil di versi pertama profil, atau menyusul sesudah bilah?
12. Siapa di tim keilmuan yang mengesahkan urutan pedagogis dan daftar miskonsepsi, dan kapan?
13. Prioritas penulisan materi: modul 7–9 dulu (rekomendasi) atau berurutan 6–10?

---

## 14. Celah riset dan langkah validasi

**Celah bukti**: tidak ada studi pembelajaran fikih/waris untuk prinsip apa pun di bagian 3; tidak ada daftar
miskonsepsi faraidh terukur; tidak ada bukti radar vs bilah untuk profil belajar; tidak ada bukti untuk desain belajar
topik bermuatan duka; tidak ada survei nasional literasi waris atau angka perkara kewarisan agregat; RPS pertemuan per
pertemuan tidak dibaca, jadi urutan yang dipakai dosen belum diketahui; tidak ada data pemakaian aplikasi faraidh oleh
mahasiswa. Angka bertanda (cuplikan) di bagian 3 dan 5 harus dibaca dari makalah asli sebelum dikutip di TA.

**Langkah validasi** [Rekomendasi]:
- **Wawancara 5–8 per audiens** (awam yang pernah/sedang mengurus waris; mahasiswa fiqh mawaris dari latar SMA dan
  madrasah). Uji JTBD bagian 5, khususnya A2/A5 (malu, duka) dan M3 (pecahan).
- **Uji prototipe pintu situasi** dengan 5 awam, termasuk minimal 1 lansia dengan HP biasa: bisakah mereka menjelaskan
  bagian tiap orang setelah 10 menit?
- **Uji satu pelajaran contoh** (bagian 9) dengan 5 mahasiswa: waktu per bagian, titik bingung, apakah "Buka di Lab"
  dipakai dan apakah mereka kembali.
- **Kumpulkan 2–3 RPS** fiqh mawaris lengkap untuk membandingkan urutan dengan opsi C.
- **Pilot kuis**: catat pilihan salah terbanyak untuk memperluas daftar miskonsepsi.
- **Setelah ada log**: uji apakah estimator v1 memprediksi jawaban berikutnya lebih baik dari rata-rata sederhana
  sebelum mempertimbangkan model lain.

---

## Penutup

Temuan yang paling mengubah cara pandang: kurikulum, generator soal, dan profil skill ternyata **satu struktur data
yang sama dilihat dari tiga sisi**. Bila tiap pelajaran mendeklarasikan KC dan pola, dan tiap KC diturunkan dari jejak
engine, maka menulis kurikulum otomatis menghasilkan daftar pola yang harus dibangun, cetak biru tes, dan sumbu profil,
tanpa taksonomi kedua. Karena itu keputusan paling murah dan paling berdampak sekarang bukan desain visual radar atau
jaring, tapi **menyepakati urutan (keputusan 1–2) dan daftar KC**, lalu menulis materi modul 7–9 sebagai blok kasus dari
KB 16. "Tidak bikin pusing" pada akhirnya berarti pelajar tidak pernah bertemu konsep sebelum prasyaratnya, dan tidak
pernah melihat urutan di materi yang berbeda dengan urutan di Lab.
