# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Tiga kelompok pengguna dengan bobot setara, semuanya harus terlayani oleh satu antarmuka:

- **Keluarga / ahli waris awam.** Punya kasus nyata atau sedang bertanya-tanya ("bagian saya berapa?"). Tidak kenal istilah faraidh. Termasuk pengguna yang sangat awam secara teknis: siswa SMP dan lansia (batas kemampuan yang ditetapkan pemilik produk, bukan perkiraan).
- **Pelajar faraidh.** Belajar dari nol sampai bisa mengerjakan 'aul/radd/tashih sendiri; membaca kitab berbahasa Arab (al-Lahim dan sejenisnya) dan butuh jembatan istilah Indonesia ↔ Arab.
- **Praktisi / pengajar / konsultan.** Butuh kasus rumit tertangani, setiap langkah bisa ditunjukkan ke kitab, dan hasil bisa dipertanggungjawabkan di depan orang lain.

Pekerjaan inti mereka sama: memasukkan keadaan sebuah keluarga, lalu memahami mengapa bagian tiap orang sebesar itu. Yang berbeda hanya seberapa jauh mereka ingin masuk ke dalam hitungannya, dan itu sudah dibedakan lewat dua tujuan pemakaian: **Hitung kasus** dan **Belajar**.

## Product Purpose

**Arif Waris** (ARIF = *Aplikasi Representasi Ilmu Faraidh*) adalah portal edukasi waris: kalkulator dan tempat belajar dalam satu produk, dengan penjelasan gamblang langkah demi langkah sebagai intinya. Pengguna memasukkan pewaris, harta, kewajiban, ahli waris, dan kondisi khusus; aplikasi memberi bagian tiap orang (pecahan dan nominal) beserta penjelasan langkah demi langkah, dari halangan waris sampai pembagian akhir, dengan dalil di tiap keputusan. Modul Belajar (materi bertahap, glosarium, latihan hitung, kuis, rujukan) tersedia tanpa harus punya kasus.

Keberhasilan: orang yang tidak pernah belajar faraidh dapat memasukkan keluarga yang rumit, tidak tersesat di tengah pengisian, dan keluar dengan pemahaman yang bisa ia jelaskan lagi ke keluarganya. Pelajar dan praktisi bisa mengecek setiap angka ke sumbernya.

## Positioning

Klaim yang tidak bisa ditiru begitu saja oleh kalkulator waris lain:

1. **Setiap hasil bisa ditelusuri ke kitab, dan dijelaskan gamblang langkah demi langkah.** Hitungan dijalankan engine yang deterministik dan eksak (pecahan bigint, tanpa floating point); tiap keputusan (hajb, fardh, ashabah, 'aul/radd, tashih) dijelaskan dengan bahasa awam dan membawa rujukan ke basis pengetahuan fikih yang dikurasi tim keilmuan. Bukan kotak hitam; angka dan penjelasan dasarnya tidak berasal dari model bahasa.
2. **Kasus rumit tetap terjawab.** Kondisi bersusun ditangani dalam satu kasus: kematian berlapis (munasakhat), janin (haml), mafqud, khuntsa, wafat bersamaan (gharqa), hingga dzawil arham; termasuk kasus iftiradhiyah (istilah pemilik produk untuk kasus rumit/hipotetis), yang biasanya hanya dikerjakan pakar dengan tangan. Data yang kurang ditanyakan, tidak ditebak.
3. **Multi-madzhab dengan default Syafi'i.** Syafi'i adalah dasar; Hanbali, Hanafi, dan Maliki berupa selisih pendapat yang tertelusur per titik khilaf, bukan tiga kalkulator terpisah.
4. **Ramah bagi orang awam untuk kasus yang tidak ramah.** Pengisian dipandu satu pertanyaan pada satu waktu, silsilah ditampilkan sebagai pohon keluarga, hasil sebagai tabel dan langkah yang bisa dibaca pelan-pelan. Kerumitan fikih ditanggung engine dan antarmuka, bukan pengguna.

## Operating Context

- Pengguna mengisi sendiri di ponsel atau laptop, kadang saat keluarga berkumpul, kadang di kelas atau saat belajar sendiri. Alur utama sekitar 5 langkah (Pewaris, Harta, Kewajiban, Ahli waris, Kondisi khusus) lalu Hasil, sekitar 3 menit untuk kasus sederhana.
- Perhitungan berjalan di perangkat; kasus bisa disimpan ke berkas dan dibuka kembali. Akun (login Google) opsional: memberi riwayat tersimpan, progres belajar, streak, dan papan peringkat lintas perangkat.
- Konten (materi, narasi, teks UI) dikelola tim keilmuan lewat portal admin terpisah dan tiba di web sebagai snapshot yang disinkronkan di latar. Aplikasi harus tetap jalan penuh tanpa internet dan saat server konten mati.
- Pembelajar membaca kitab berbahasa Arab, sehingga ada mode tampilan Indonesia, Indonesia + Arab (istilah dan peran diberi padanan Arab), dan Arab penuh (belum).
- Hasil bersifat edukasi. Untuk pembagian waris sungguhan pengguna diarahkan ke ahli faraidh atau lembaga berwenang.

## Capabilities and Constraints

Sudah ada: wizard kasus, hasil dengan pohon, tabel dan penjelasan langkah, mode Hitung/Belajar, Pusat Belajar (materi, glosarium, latihan hitung, kuis, FAQ, tanya jawab, rujukan), riwayat, tur singkat, akun opsional, streak dan peringkat, tampilan Indonesia + Arab (redaksi Arab masih draf).

Logika engine untuk semua fitur di bawah sudah selesai; yang tersisa adalah tampilannya (dirancang sekali untuk semuanya): pilihan madzhab, kondisi khusus bab 13 dan dzawil arham, pohon keluarga bebas dengan label bertingkat, kematian berlapis dengan mode biasa (urutan wafat) dan mode lanjutan "Atur linimasa lengkap" (satu model data, pindah mode tidak menghapus isian), dan mode cerita (pengguna mengetik cerita, AI menyusun draf silsilah).

Rencana ke depan: chatbot **AMIN** (*AI Mawaris Interaktif*) yang menjelaskan ulang bagian penjelasan yang belum dipahami pengguna. Belum dirancang; rincian (letak, batas jawaban, sumber rujukan, kuota) belum diputuskan.

Batas yang mengikat produk:

- **Engine memutuskan, bukan AI.** AI di mode cerita hanya menerjemahkan cerita menjadi draf silsilah; pengguna mengonfirmasi pohonnya dan engine yang menentukan siapa dapat berapa. Mode cerita wajib login, berkuota, dan meminta pengguna tanpa nama asli. AMIN kelak hanya menjelaskan ulang penjelasan yang sudah ada, tidak menetapkan hukum atau mengubah hasil hitung.
- **Hanya hukum yang ada di basis pengetahuan.** Aturan yang belum terverifikasi tidak dikarang; tampil sebagai "sedang dikaji" (contoh: laqith, dan aturan haml khusus Syafi'i di luar yang tercatat). Kombinatorik terlalu besar berakhir "perlu input", bukan macet.
- **Sumber bertingkat harus jujur.** Syafi'i adalah yang terverifikasi ke teks primer. Pendapat dari al-Lahim dan Ithraa berstatus sumber sekunder dan UI menyebut sumbernya. Tarjih yang condong Hanbali tidak pernah ditampilkan sebagai posisi Syafi'i.
- **KHI bukan fikih.** Bila kelak ada, ditandai jelas sebagai hukum positif dan tidak dicampur ke pilihan madzhab.
- **Uang eksak.** Pembulatan ke bawah per orang ke satuan pilihan pengguna (1 / 100 / 1000); selisih pembulatan dilaporkan terpisah, tidak dibagikan diam-diam.
- **Kode rujukan internal (mis. R09-4) tidak tampil mentah** ke pengguna; muncul sebagai kotak "Dalilnya" yang bisa dibuka.
- Semua teks tampil berasal dari konten yang bisa diedit tim keilmuan, bukan ditulis mati di komponen.

## Brand Commitments

- Nama: **Arif Waris** (*Aplikasi Representasi Ilmu Faraidh*); ruang latihan hitung **ArifLab**; chatbot mendatang **AMIN** (*AI Mawaris Interaktif*). Ada mode pra-peluncuran yang menyamarkan nama menjadi "Kalkulator Waris" / "Lab Hitung"; teks tampil tidak boleh mengeraskan nama itu di luar lapisan terjemah.
- Sistem visual akan **dirombak ulang** oleh pemilik produk memakai Impeccable. Arif Waris v4 (token dan komponen yang ada) hanya bukti tentang kondisi sekarang, bukan acuan yang harus dipertahankan.
- Keputusan pemilik yang tetap mengikat: ikon SVG, tanpa emoji, di UI maupun mockup; aksi sekunder dan ajakan berupa teks atau tautan, tombol berbingkai hanya untuk aksi utama di form/dialog (Simpan, Batal).
- Bahasa: Indonesia, dengan istilah fikih bertransliterasi baku sesuai glosarium; istilah Arab tampil bila mode Indonesia + Arab aktif. Portal admin tidak menampilkan kode teknis, kunci teks, atau JSON kepada penulis konten.

## Evidence on Hand

- Basis pengetahuan fikih `docs/kb/00–18` (sumber hukum tunggal), termasuk matriks khilaf antar-madzhab (bab 18) dan kasus uji bab 16 sebagai regression suite; `docs/audit-verifikasi.md`, `docs/keilmuan-*.md` untuk titik yang masih terbuka.
- Engine dan suite tes (`packages/*`, `apps/web/src/__tests__`), snapshot konten (`apps/web/src/snapshot.json`), spesifikasi dan rencana di `docs/superpowers/`, riset UX kematian berlapis di `docs/design/riset-ux-input-kematian-berlapis.md`, konsep dwibahasa di `docs/design/dwibahasa.md`.
- Tidak ada: pengguna nyata, testimoni, metrik pemakaian, atau ulasan pakar yang dipublikasikan; verifikasi teks primer selain Syafi'i; redaksi Arab yang sudah dicek tim keilmuan. Jangan mengarang ketiganya di halaman mana pun.

## Product Principles

1. **Jangan pernah menyembunyikan dasar sebuah angka.** Setiap bagian yang ditampilkan harus bisa dibuka sampai ke alasan dan sumbernya, dan status sumbernya (primer, sekunder, belum direview) tampil apa adanya.
2. **Kerumitan dipikul sistem, bukan pengguna.** Bila kasus rumit, aplikasi bertanya lebih pintar dan menjelaskan lebih pelan; ia tidak memaksa pengguna memahami istilah dulu. Awam paling lemah sebagai patokan: kalau siswa SMP atau lansia tersesat, itu cacat produk.
3. **Tanya, jangan tebak; kosong lebih baik daripada karangan.** Data kurang menghasilkan pertanyaan, hukum yang belum terverifikasi menghasilkan "sedang dikaji". Mode cerita dan fitur otomatis tidak boleh mengambil keputusan fikih.
4. **Kalkulator dan tempat belajar saling menaut.** Istilah di hasil mengarah ke glosarium; materi mengarah ke "coba di kalkulator". Pelajar dan praktisi tidak berpindah produk.
5. **Berfungsi tanpa syarat.** Tanpa akun, tanpa internet, tanpa server konten: kalkulator dan konten yang sudah dimuat tetap berjalan.

## Accessibility & Inclusion

Kebutuhan yang sudah ditetapkan: pengguna paling awam (siswa SMP, lansia) harus bisa menyelesaikan kasus rumit sendirian; kalimat penjelasan bersahaja; pengguna Arab-membaca mendapat padanan istilah. Belum ditetapkan standar formal (mis. tingkat WCAG), dukungan pembaca layar, tema gelap, atau mode Arab RTL penuh; putuskan dulu bersama pemilik sebelum diklaim di UI atau dokumentasi.
