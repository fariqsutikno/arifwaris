# Prior art: kurikulum & pelajaran platform belajar interaktif (untuk app faraidh dengan Lab Waris)

Catatan: riset ini memakai ~20 panggilan web. Banyak klaim berasal dari halaman resmi vendor (bias promosi) dan ringkasan hasil pencarian; yang tidak terverifikasi ke sumber primer ditandai. Beberapa platform (Quizlet, Anki, Seterra, PhET, Codecademy lesson anatomy, Zenius/Quipper detail) tidak berhasil didalami: lihat Gaps.

## 1. Struktur kurikulum dan anatomi pelajaran (Brilliant, Duolingo, Khan, Math Academy, Exercism, Codecademy, platform Indonesia)

### Takeaway
Platform yang paling mirip kebutuhan Anda (Brilliant, Math Academy) memakai pelajaran pendek yang berselang-seling antara penjelasan dan soal, dengan kemajuan dikunci oleh penguasaan. Duolingo meninggalkan pohon keterampilan demi satu jalur linear dengan review disisipkan; Exercism memisahkan "concept exercise" (mengajar) dari "practice exercise" (melatih) lewat graf prasyarat.

### Cited Findings
- Brilliant: tanpa video, semua interaktif; berpusat pada pemecahan masalah dengan visual terpandu; tutor digital "Koji" memberi petunjuk kontekstual tanpa menyelesaikan soal. Contoh kursus Solving Equations: pelajaran = sekitar 5 soal interaktif + skill check 3 soal; level = sekitar 6 pelajaran + review level; 13 level; pelajaran 5-10 menit; 40+ kursus dikelompokkan ke "learning path" (mis. Foundational Math). Review set campuran sedang diluncurkan per kursus. Semua dari halaman vendor — [Brilliant: how brilliant teaches math](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/)
- Brilliant menyatakan tidak menjanjikan mastery dari satu pelajaran dan bukan asesmen diagnostik formal — [Brilliant (hasil pencarian yang sama)](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/)
- Math Academy: pelajaran dipecah jadi "knowledge point"; tiap titik dibuka dengan contoh terpecahkan penuh (worked example), lalu maksimal 5 soal latihan; 2 benar berturut-turut maju ke contoh berikutnya, kalau tidak diberi soal tambahan; setiap soal punya penjelasan; instruksi diselang-seling dengan latihan — [Math Academy: How It Works](https://www.mathacademy.com/how-it-works)
- Math Academy: kuis tersedia tiap 150 XP, mencakup topik terbaru, bertimer, tanpa membuka pelajaran; topik yang salah menjadi tugas review; 1 XP kira-kira 1 menit usaha fokus; ada target XP harian — [Math Academy: How It Works](https://www.mathacademy.com/how-it-works)
- Duolingo 2022: skill lama punya 5 level mahkota + Legendary; di desain baru satu lingkaran jalur = satu level mahkota; Stories pindah ke jalur; tips pindah ke "guidebook" tiap unit; review diletakkan di jalur supaya tidak perlu kembali ke skill yang "retak"; peluncuran ke semua pelajar 1 Nov 2022 — [Duolingo blog, 6 Mei 2022](https://blog.duolingo.com/new-duolingo-home-screen-design/)
- Exercism: concept exercise mengajarkan konsep; konsep-konsep itu membentuk syllabus; tiap latihan mendeklarasikan konsep dan prasyaratnya; akses dibuka berdasar konsep yang sudah dipelajari; concept exercise tidak di-mentor sehingga latihan sendiri harus jadi jalur belajar yang jelas; practice exercise di samping untuk melatih — [Exercism docs: concept exercises](https://exercism.io/docs/building/tracks/concept-exercises)
- Khan Academy: tingkat skill Not started, Attempted, Familiar, Proficient, Mastered; hanya Proficient dan Mastered dihitung dalam persentase penguasaan unit/kursus; Mastered butuh semua benar di Unit Test atau Course Challenge — [Khan Academy support: mastery](https://support.khanacademy.org/hc/tr/articles/5548760867853)
- Codecademy: proyek muncul di akhir modul; kuis dan proyek bisa diulang tanpa batas (pembaruan 2018); ada pembedaan quiz/assessment/exam — [Codecademy blog Mar 2018](https://www.codecademy.com/resources/blog/updates-improvements-to-projects-quizzes-march2018), [Codecademy help: quizzes, assessments, exams](https://help.codecademy.com/hc/en-us/articles/15373426748187-Quizzes-Assessments-and-Exams-What-s-the-Difference)
- Platform Indonesia (Ruangguru, Zenius, Quipper): umumnya tiga bagian: materi (video), pembahasan latihan soal, evaluasi. Ruangguru: video beranimasi, daftar isi video, ratusan ribu soal berjenjang termasuk HOTS, nilai langsung keluar dengan pembahasan; sebuah studi mencatat keluhan siswa bahwa video kadang membosankan dan kurang memengaruhi pemahaman. Zenius: video + bank soal, fitur Zen Practice, Try Out. Sebagian dari jurnal kecil dan promosi toko aplikasi — [hasil pencarian: Ruangguru/Zenius/Quipper](https://mojok.co/terminal/ruangguru-vs-zenius-mana-yang-paling-asyik/), [Ruangguru App Store](https://apps.apple.com/app/id1099742206)

### Inferences
- Pola "contoh terpecahkan, lalu 2-5 soal, lanjut hanya bila benar berturut-turut" (Math Academy) paling cocok untuk faraidh yang berbasis aturan: tiap "knowledge point" = satu keputusan fikih (satu SRP seperti pipeline engine Anda).
- Pemisahan Exercism (konsep mengajar vs latihan bebas) memetakan langsung ke "pelajaran" vs "Lab Waris".
- Pelajaran 5-10 menit dengan ~5 interaksi (Brilliant) adalah patokan panjang yang bisa dipakai sebagai hipotesis awal.

### Gaps
- Anatomi lesson Codecademy (rasio teks vs editor) tidak ditemukan.
- Struktur kurikulum Quipper/Zenius yang rinci dan data rasio video vs latihan tidak ditemukan.
- Halaman Khan Academy bahasa Inggris diblokir (403); hanya versi terjemahan dalam hasil pencarian yang dipakai, dan aturan turun-level 2018 mungkin sudah berubah.

## 2. Sandbox/manipulatif tersemat, lompat dari pelajaran ke "coba sendiri" dan kembali tanpa kehilangan tempat

### Takeaway
Pola terbaik: interaktif tersemat tepat di titik konsep, dengan prediksi dulu dan sandbox terbuka di akhir (Nicky Case/Bret Victor). Untuk "keluar ke sandbox lalu kembali", tidak ada sumber yang saya temukan yang mendokumentasikan mekanisme resume secara eksplisit; ini celah.

### Cited Findings
- Bret Victor (2011) membedakan explorable explanation dari widget interaktif lepas: ia secara sengaja mengarahkan perhatian pembaca ke fenomena tertentu di dalam simulasi — [Bret Victor: Explorable Explanations](https://worrydream.com/ExplorableExplanations/)
- Pola desain Nicky Case: Puzzle It Out (belajar dan asesmen menyatu), Place Your Bets (prediksi dulu sebelum jawaban sebenarnya), Role Play, Sandbox Mode (simulasi terbuka, sedikit panduan, diperkenalkan bertahap) — [Nicky Case: 4 more design patterns](https://blog.ncase.me/explorable-explanations-4-more-design-patterns/)
- Exercism: latihan terkunci/terbuka mengikuti konsep yang sudah dipelajari, jadi urutan "belajar konsep -> latihan" dikontrol oleh graf prasyarat — [Exercism docs](https://exercism.io/docs/building/tracks/concept-exercises)
- Desmos Classroom (kini Amplify Classroom, 2025-26): dashboard guru dengan pacing yang mengunci siswa pada rentang layar tertentu dan bisa menyembunyikan layar; Pause terpisah dari pacing — [Desmos blog: Activity Dashboard](https://blog.desmos.com/articles/introducing-the-new-desmos-activity-dashboard/), [Amplify Classroom](https://amplify.com/blog/problem-based-learning/introducing-amplify-classroom/)
- Brilliant: umpan balik terjadi saat soal masih dikerjakan sehingga salah menjadi kesempatan revisi — [Brilliant](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/)

### Inferences
- Susunan "prediksi -> sandbox -> soal pemeriksaan" dari Nicky Case cocok untuk Lab Waris: minta pengguna menebak bagian ahli waris sebelum mesin menghitung.
- Untuk tidak kehilangan tempat: praktik umum web (rute dalam yang bisa dikembalikan, state pelajaran disimpan per langkah) lebih aman daripada mengandalkan satu platform; ini inferensi, bukan temuan terdokumentasi.

### Gaps
- Tidak ditemukan dokumentasi bagaimana Brilliant/Khan/Codecademy menangani "buka sandbox lalu kembali ke langkah semula".
- PhET: tidak ada hasil tentang riset desainnya.
- Codecademy: tidak ada sumber soal editor tersemat dalam pelajaran.

## 3. Mastery, review berjarak, dan penempatan (Khan, Math Academy, Duolingo HLR/Birdbrain, ALEKS)

### Takeaway
Mastery dilacak per skill dengan beberapa tingkat, dan review dijadwalkan algoritmik. Duolingo memakai HLR (2016, publik) dan Birdbrain (2020); Math Academy memakai FIRe yang memberi kredit repetisi implisit ke prasyarat; ALEKS memakai knowledge space theory dan penilaian diagnostik.

### Cited Findings
- Khan: Familiar lewat skor latihan sekitar 70-85% atau semua benar pada kuis/tes; Proficient mulai dari Familiar dengan semua benar; Mastered dari Proficient dengan semua benar di Unit Test/Course Challenge; level bisa turun (aturan 2018: Proficient turun ke Familiar bila Course Challenge tidak sempurna) — [Khan support](https://support.khanacademy.org/hc/tr/articles/5548760867853), [pembaruan 2018](https://support.khanacademy.org/hc/de/community/posts/360023249611/comments/360003245051)
- Math Academy: diagnostik adaptif 30-45 menit untuk menemukan "knowledge frontier", mengukur mastery dan otomatisasi, menandai fondasi yang hilang, menghasilkan penempatan kursus + perkiraan tanggal selesai; graf pengetahuan individual diperbarui tiap tugas; kuis topik terlewat jadi review — [Math Academy: How It Works](https://www.mathacademy.com/how-it-works)
- FIRe (Skycak): praktik pada topik lanjut "menetes" ke prasyarat sebagai repetisi implisit; repetisi implisit pada topik sederhana diberi diskon; dipasangkan dengan Spaced Repetition Compression yang memilih review yang kreditnya menghapus review lain yang jatuh tempo; rumus bobot tepat tidak ditemukan — [Skycak: individualized spaced repetition](https://www.justinmath.com/individualized-spaced-repetition-in-hierarchical-knowledge-structures), [Hecker ringkasan buku](https://frankhecker.com/2025/02/14/math-academy-part-7/)
- Duolingo HLR (Settles & Meeder, ACL 2016): mengurangi galat prediksi recall lebih dari 45% terhadap baseline, dan meningkatkan keterlibatan harian 12% dalam studi operasional (angka dari abstrak yang dikutip di milis, bukan dari PDF yang bisa saya parse) — [ACL Anthology P16-1174](https://preview.aclanthology.org/fix_video/P16-1174.pdf), [kutipan abstrak](https://www.mail-archive.com/mnemosyne-proj-users@googlegroups.com/msg09645.html), [Duolingo blog](https://blog.duolingo.com/how-we-learn-how-you-learn)
- Duolingo Birdbrain: model ML yang memprediksi apakah pelajar menjawab benar dengan menggabungkan estimasi pengetahuan pelajar dan kesulitan soal; target soal pada level pelajar (terlalu sulit = frustrasi, terlalu mudah = sudah dikuasai); pada Okt 2020 mempersonalisasi >20% pelajaran; klaim A/B "belajar lebih banyak" adalah laporan perusahaan sendiri — [Duolingo blog: Birdbrain](https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/)
- ALEKS: berbasis Knowledge Space Theory (Falmagne & Doignon, 1983-1992, dana NSF); topik "Learned" (ditunjukkan di Learning Mode, belum dikonfirmasi) vs "Mastered" (dikonfirmasi lewat Knowledge Check); ada pengecekan ulang berkala — [ALEKS KST practical perspective](https://www.mheducation.com/content/dam/mhe/research/prek-12/essa-tier-4/aleks-practical-perspective-knowledge-space-theory.pdf), [ALEKS FAQ](https://www.mheducation.com/support/aleks-support-center/knowledge/what-is-the-aleks-pie.html)

### Inferences
- Konsep "Learned vs Mastered, dikonfirmasi belakangan" (ALEKS) dan kredit prasyarat (FIRe) cocok untuk graf faraidh (mis. latihan kasus 'aul menguatkan pecahan/ashl).
- Untuk MVP, tingkat Khan (4 level, naik hanya dengan jawaban semua benar, turun bila gagal) paling sederhana diimplementasikan tanpa model ML.

### Gaps
- Detail matematis FIRe tidak terbit di sumber yang saya akses.
- Evaluasi independen efektivitas Birdbrain/HLR di luar klaim Duolingo tidak ditemukan.
- Quizzlet, Anki, Seterra tidak diteliti.

## 4. Visualisasi kemajuan: pohon skill, bilah mastery, radar, peta pengetahuan; bukti dampaknya

### Takeaway
Visual yang umum dan terbukti paling banyak dipakai adalah skill meter (bilah). Radar/spider jarang dipakai produk utama; ALEKS memakai diagram "pie" bersegmen topik, Math Academy memakai graf pengetahuan dengan oval yang makin biru = makin stabil. Bukti riset OLM: transparansi model belajar membantu refleksi dan regulasi diri, tapi bukti untuk radar spesifik tipis.

### Cited Findings
- ALEKS pie: irisan = kategori topik, warna lebih gelap = mastered, lebih terang = learned, area luar tak berwarna = sisa; juga pintu masuk ke Learning Mode — [ALEKS FAQ](https://www.mheducation.com/support/aleks-support-center/knowledge/what-is-the-aleks-pie.html), [ALEKS Pie Report](https://www.mheducation.com/support/aleks-support-center/knowledge/aleks-pie-report.html)
- Math Academy: graf pengetahuan, oval makin biru = pengetahuan lebih stabil; liga mingguan opsional (bisa keluar), XP tidak pernah hilang — [Math Academy](https://www.mathacademy.com/how-it-works)
- Khan Academy Reimagined menyediakan halaman progres skill dengan empat tingkat — [Khan support: skill progress](https://support.khanacademy.org/hc/articles/47078681852045-Where-can-I-view-my-skill-progress-in-Khan-Academy-Reimagined)
- Open learner model (OLM): tujuan utamanya meningkatkan perilaku metakognitif, regulasi diri, refleksi (Bull & Kay 2013); skill meter mirip bar chart adalah visualisasi OLM yang paling umum; satu studi: bila siswa melihat kepercayaan diri dan kinerja, monitoring pengetahuan dan kinerja meningkat, terutama siswa berprestasi rendah — [Open learner model, EduTechWiki](https://edutechwiki.unige.ch/en/Open_learner_model), [Springer UMUAI s11257-019-09253-4](https://link.springer.com/article/10.1007/s11257-019-09253-4)
- Radar plot dengan data pembanding ditumpuk dan kompetensi di tepi dijelaskan dalam Bull, Brusilovsky & Guerra (peer comparison); saya tidak menemukan makalah Bull & Kay yang mendefinisikan radar sebagai OLM — [Guerra et al. 2018](https://www.lrdc.pitt.edu/Schunn/papers/guerra-et-al2018.pdf)
- Bodily et al. (LAK 2018) tinjauan OLM vs LAD: hampir 60% OLM berbasis satu tipe data, 33% memakai metrik perilaku, 39% menerima input pengguna, 37% model kompleks, 6% lintas aplikasi; OLM menekankan kontrol dan akses pelajar atas data sendiri; asumsi bersama: pelajar akan memakai informasi untuk memantau dan meregulasi belajar — [Bodily et al. via TU Delft](https://repository.tudelft.nl/record/uuid:6ddc2565-0cd8-42a9-b09b-6ef40ba143c3), [LAK18 PDF](https://dan7davis.github.io/papers/LAK18_Camera_Ready_FINAL.pdf)

### Inferences
- Radar chart profil keterampilan faraidh (mis. furudh, hajb, 'aul/radd, munasakhat) wajar secara visual, tapi dukungan buktinya lemah; bilah/segmen yang menunjukkan "belum dikonfirmasi vs sudah dikonfirmasi" punya dasar lebih kuat.
- Memperlihatkan keyakinan diri di samping kinerja (OLM) bisa dijadikan fitur profil keterampilan masa depan.

### Gaps
- Tidak ada temuan yang saya akses tentang platform produk yang memakai radar untuk pelajar; bukti dampak radar spesifik tidak ditemukan.
- Temuan efek (bukan deskripsi) dari Bodily et al. tidak terbaca di snippet.

## 5. Mekanik motivasi dan kritik yang terdokumentasi

### Takeaway
Duolingo melaporkan streak membangun kebiasaan, tapi buktinya internal dan tidak ada studi yang mengisolasi dampak streak pada hasil belajar. Kritik akademik mengaitkan gamifikasi dengan kecemasan terutama pada fitur kompetitif; bukti kuat soal "streak anxiety" tidak ditemukan.

### Cited Findings
- Duolingo: menurunkan hambatan kebiasaan harian lebih penting daripada jumlah belajar harian pada tahap awal (hasil uji pemisahan streak dari target harian); pelajar yang "binge" lebih cenderung meninggalkan app; animasi milestone dikaitkan dengan kenaikan kecil retensi hari ke-7 (+1,7% pada versi Jepang). Semua laporan sendiri — [Duolingo blog: streak research](https://blog.duolingo.com/duolingo-streak-research/), [Duolingo blog: improving the streak](https://blog.duolingo.com/improving-the-streak)
- Studi kualitatif 2022 (forum Duolingo + 15 wawancara) berargumen gamifikasi dapat gagal ("misuse") — [arXiv 2203.16175](https://arxiv.org/abs/2203.16175)
- Tinjauan sistematis penelitian Duolingo: interaksi elemen gamifikasi dengan hasil belajar di tingkat mikro masih kurang diteliti — [hasil pencarian tinjauan](https://www.tandfonline.com/doi/full/10.1080/09588221.2021.1933540) (URL dari daftar hasil pencarian, isi belum saya buka)
- Persepsi pelajar: dihargai karena menarik, dikritik karena fokus berlebihan pada gamifikasi dan minim instruksi tata bahasa eksplisit — [hasil pencarian: studi persepsi (Essex repository)](https://repository.essex.ac.uk/41011/1/Jabbari%2C%20Zarrinabadi%2C%20%26%20Amini%20%28accepted%20copy%29.pdf)
- Artikel UX non-peer-review: banyak pengguna kecewa saat kehilangan streak — [UX Collective: reframing streaks](https://uxdesign.cc/3-reframing-streaks-on-duolingo-5-ideas-for-a-more-healthy-and-flexible-approach-to-language-8fd89545771e)
- Math Academy: liga mingguan promosi/degradasi tapi opsional; XP tidak hilang — [Math Academy](https://www.mathacademy.com/how-it-works)

### Inferences
- Karena proyek ini menekankan tombol hanya untuk aksi utama dan UI tanpa metafora game, ambil dari Duolingo hanya penurunan hambatan harian dan review disisipkan, bukan liga/streak berhukuman.
- Bila ada penanda kebiasaan, buat tanpa hukuman (tanpa kehilangan kemajuan), seperti XP Math Academy yang tidak pernah hilang.

### Gaps
- Tidak ada studi terkontrol independen tentang streak anxiety.
- Legendary level: hanya aturan mekanisnya yang ditemukan (di blog 2022), bukan evaluasi dampaknya.
- Penyebab tepat Duolingo meninggalkan pohon: hanya alasan resmi (kebingungan "cara benar" belajar, integrasi spaced repetition); tidak ada data yang dirilis.

## 6. Onboarding dan penempatan

### Takeaway
Diagnostik adaptif (Math Academy, ALEKS) menempatkan pelajar dan menemukan fondasi hilang; Duolingo justru menyederhanakan menjadi satu jalur supaya pelajar tidak ragu.

### Cited Findings
- Math Academy diagnostik: 30-45 menit, bisa dipecah sesi, menghasilkan penempatan, perkiraan tanggal selesai untuk beberapa target XP harian, dan gap fondasi — [Math Academy](https://www.mathacademy.com/how-it-works)
- ALEKS: pie awal dibentuk dari penilaian dan menjadi pintu masuk ke Learning Mode — [ALEKS FAQ](https://www.mheducation.com/support/aleks-support-center/knowledge/what-is-the-aleks-pie.html)
- Duolingo: pelajar sering bertanya apakah mereka belajar "dengan benar"; jalur tunggal memberi "jalur jelas" — [Duolingo blog 2022](https://blog.duolingo.com/new-duolingo-home-screen-design/)

### Inferences
- Untuk faraidh: awali dengan pilihan jalur sederhana ("baru mulai" vs "sudah tahu dasar"), diagnostik pendek opsional, bukan penempatan 30-45 menit.

### Gaps
- Onboarding Brilliant, Khan, dan platform Indonesia tidak ditemukan.
