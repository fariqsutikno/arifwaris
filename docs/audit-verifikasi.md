# Audit Verifikasi (Prompt 6.5)

Auditor: sesi baru, 2026-09-29. Semua cek dari berkas + MCP (Shamela, Quran, sunnah.com lewat browser bawaan). Laporan commit sebelumnya tidak dipercaya.

## Ringkasan

| Ukuran | Jumlah |
|---|---|
| Baris `\| Rxx-y \|` di KB | 141 (140 kode unik) |
| ...tanpa token tetapi punya alasan tertulis (KH, keputusan desain, Lahim/Ithraa) | 25 |
| ...terlewat (punya angka Shamela tetapi bukan token) → diperbaiki | 3 (R01-7, R14-14, R14-15) |
| Sel bab 18 yang menyebut kitab tanpa token → diperbaiki | 5 (K01-1 ×3, K05-2, K09-1, K14-2) |
| Kutipan «…»/Arab di luar tabel (kb/17/18/16, konten, design) | 59 baris dicek |
| Sampel Shamela dibuka ulang (`verify_quote`/`get_page`) | ±47 (Raudhah ±28; sisanya Mabsuth, Mughni, 'Iqd, Minah al-Jalil, Baihaqi, Sa'id bin Manshur, Ibnu Baththal, Bahr al-Madzhab) |
| Token hadits dibuka ulang di sunnah.com (nomor standar) | 27 dari 27 |
| Ayat dibuka ulang (`fetch_quran` ar-uthmani) | 4:11, 4:12, 4:176, 8:75, 33:6, 22:78, 46:15, 31:14 + 16 syahid + teks bab 1.2 |
| `book_id` di kitab.md | 13 dari 13 (6 baru dicek lewat `get_book`) |
| soal_hitung.md dijalankan lewat engine | 23 dari 23 cocok |
| Tes | content 73, math 19, engine 166, data 44 (+6 skip), explain 36, scripts 10, web 257 (+2 skip): semua lulus |
| Temuan diperbaiki | 16 |
| ⚑ (menyentuh hukum, tidak diubah) | 3 |

## Tabel temuan

| # | Berkas:baris | Jenis | Temuan | Tindakan |
|---|---|---|---|---|
| 1 | kb/01:73 R01-7 | terlewat + salah | Shamela 16934/3737 hanya teks biasa, bukan token. Kutipan «فإن أجازها … لم يلزمه الإجازة، وكان مخيرا … والرد، وبه قال» menyimpang dari kitab («فأجازها في حياته، لم يلزمه الإجازة وكان مخيرًا … والرد وبه قال أبو حنيفة، وأكثر الفقهاء»; ada «فإن» dan koma yang tidak ada di kitab) | diperbaiki: token + lafaz kitab |
| 2 | kb/14:155-156 R14-14, R14-15 | terlewat + salah | Tanpa token. R14-15 menulis 30/6–7 dan 5974–5975, padahal «وهذا قول محمد … رواية شاذة» seluruhnya di 30/6 (5974); di 5975 tidak ada | diperbaiki: token `shamela:5423/5974`, halaman 30/6 |
| 3 | kb/08:100 R08-7 | salah | Lafaz mu'allaq al-Bukhari «وقال أبو بكر وابن عباس وابن الزبير» tidak sama dengan kitab (Ibnu Baththal 8/351, shamela:10486/4135): urutan «أبو بكر، وابن الزبير، وابن عباس: الجد أب» | diperbaiki |
| 4 | kb/17:67 | terlewat + tidak konsisten | Hadits «وأفرضهم زيد» At-Tirmidzi 3790 tanpa token; derajat hanya «Shahih» padahal at-Tirmidzi berkata «hasan gharib» dan sunnah.com memuat «Sahih (Darussalam)» (keputusan pengguna 2: sebut semua penilai) | diperbaiki: `hadits:tirmidhi:3790` + kedua penilai |
| 5 | kb/18:22 K01-1 | terlewat | Bahr al-Madzhab, Mughni 6/147, Mabsuth 27/154 tanpa token | diperbaiki: `shamela:16934/3737`, `8463/2469`, `5423/5509` (isi halaman dibaca; Mabsuth 27/154 memang menolak sahnya ijazah semasa hidup) |
| 6 | kb/18:43 K05-2 | terlewat | Mabsuth 30/39 tanpa token | diperbaiki: `shamela:5423/6007` (halaman memuat qaul Abu Yusuf «ayah 1/6») |
| 7 | kb/18:45 K09-1 | terlewat | Mabsuth 29/175 tanpa token | diperbaiki: `shamela:5423/5932` |
| 8 | kb/18:58 K14-2 | terlewat | Mabsuth 30/6–7 tanpa token; benar hanya 30/6 | diperbaiki: `shamela:5423/5974` |
| 9 | kb/02:38, 02:43 | salah | Kutipan «لَيْسَ لِلْقَاتِلِ مِنَ الْمِيرَاثِ شَيْءٌ» tidak ada dalam sumber yang tercantum. Yang ada: at-Tirmidzi 2109 dan Ibnu Majah 2645 «القاتل لا يرث»; Ibnu Majah 2646 «ليس لقاتل ميراث»; Abu Dawud 4564 «ليس للقاتل شىء» | diperbaiki: kutipan diganti «الْقَاتِلُ لَا يَرِثُ» [R02-8]; R02-8 diberi dua lafaz serupa + token + derajat (Ibnu Majah 2646 hasan Darussalam; Abu Dawud 4564 hasan al-Albani; at-Tirmidzi: «لا يصح») |
| 10 | kb/04:125, R04-12, kb/17:55 | salah | «ولابنة الابن السدس» — Bukhari 6736 (sunnah.com) berbunyi «ولابنة ابن السدس تكملة الثلثين» | diperbaiki di 3 tempat |
| 11 | kb/05:24 | terlewat | «اجعلوا الأخوات مع البنات عصبة» dipakai sebagai dalil tanpa asal. Di sumber ini hanya berupa judul bab al-Bukhari (Fath al-Bari 8/448), bukan hadits marfu' yang bisa ditunjuk | diperbaiki: keterangan asal + `shamela:11430/1413` |
| 12 | kb/08:18 | terlewat | «مِلَّةَ أَبِيكُمْ إِبْرَاهِيمَ» tanpa rujukan ayat | diperbaiki: 22:78 + token (teks dicocokkan ke fetch_quran) |
| 13 | kb/13a:25 | terlewat | Batas 6 bulan «QS 46:15 + 31:14» tanpa token | diperbaiki: token kedua ayat |
| 14 | kb/13a:23 | tidak konsisten | Menyebut Raudhah «tanpa angka» untuk masa hamil, padahal R13-5 dan K13a-1 (Raudhah 8/377, shamela:499/3487) memuat «أربع سنين» | diperbaiki: keterangan disamakan dengan R13-5 |
| 15 | lampiran-konten/materi.md:39 | terlewat | «Sumber utamanya An-Nisa' 11, 12, 176…» tanpa kode | diperbaiki: [R01-2] [R01-3] |
| 16 | kb/17:53-67 | — | Seluruh nomor hadits (27 token) cocok dengan sunnah.com: lafaz kunci ada di teks 26 dari 27 (Muslim 1059 memuat «ابن أخت القوم» pada sub-riwayat 1059d, penomoran Fu'ad yang sama). **Catatan MCP Hadith: nomornya tidak standar** (mis. `tirmidhi:3790` dan `ibnmajah:154` di MCP = hadits lain). Token di repo benar karena diambil dari nomor standar | tidak ada perubahan |

## ⚑ Butuh keputusan pengguna (tidak diubah)

| # | Berkas | Temuan |
|---|---|---|
| ⚑1 | kb/18 K13-2, K09-1, K14-1, K13b-1, K14-3; kb/14 14.3 (commit `5ca162f`) | Enam titik yang di commit sebelumnya ditandai ⚑ («berlawanan dengan sel semula; isi tidak diubah, perlu keputusan») lalu **isinya diubah di commit `5ca162f`** dan tanda ⚑ hilang. Perubahan hukum overlay: K13-2 [HNF] (dari «ashabah ibu» ke «kerabat ibu saja»), K09-1 [MLK] (dari «baitul mal mutlak» ke bersyarat imam adil), K14-1 [MLK] (dari «tidak» ke bersyarat), K13b-1 [HNB]/[MLK], K14-3 [HNB] (khal 2/3, khalah 1/3). Isinya sesuai kitab yang saya buka, tetapi tidak tercatat di 17.5 dan tidak ada ⚑ tersisa. Perlu konfirmasi bahwa koreksi ini memang keputusan pengguna |
| ⚑2 | kb/18 K05-2 [MLK] | «tidak ada fardh dalam wala' (Ibnu Syas, 'Iqd 3/1197)». Halaman 3/1197 (shamela:14594/1195) memuat kaidah urutan wala', bukan penafian fardh secara eksplisit. Belum bisa dipastikan; jangan dipakai sebagai dasar sebelum ada halaman yang tepat |
| ⚑3 | kb/18 K13a-3 [HNF] | «Takmilah ath-Thuri 'ala al-Bahr ar-Ra'iq 8/574» tidak ketemu lewat pencarian di Shamela (book 12227), jadi tidak ada token. Isi hukumnya sudah didukung Mabsuth 30/52 (shamela:5423/6020), tetapi rujukan Takmilah belum terverifikasi |

Sudah tercatat sebelumnya, tidak diulang: R13-14 laqith (17.4; dua butir «merdeka» dan «penemu tidak mewarisi»).

Catatan informasi (bukan temuan): commit Prompt 6 (`2550a59`) menyatakan di konten «menurut Syafi'i ijazah baru sah setelah wafat» (dari R01-7, Bahr al-Madzhab ar-Ruyani) yang sebelumnya «masih dikaji». Isi cocok dengan R01-7 dan bab 18 K01-1, tetapi ini pernyataan hukum baru di konten dan tidak ada di 17.5.

## Yang lolos tanpa masalah

- Sampel Raudhah dan non-Raudhah: kutipan ada di **body**, bukan foot; `page_id` dan halaman cetak cocok (tidak ada `printed_page_confusion`). Dua hasil «partial» (Baihaqi 7081, Ibnu Baththal 4135) hanya karena tanda footnote/urutan sanad di tengah kutipan; pada 4135 memang ditemukan lafaz #3 di atas.
- 16 syahid di syahid.md dan teks bab 1.2 cocok huruf per huruf (rasm imla'i, tanpa harakat) dengan ar-uthmani.
- R04-12 dan sel bab 18 lain yang «not_found» pada uji pertama hanya karena saya menguji kutipan hadits dengan halaman Raudhah; kutipan RDH-nya ada (`differs` diakritik saja).
- Kode [Rxx-y]/Kxx-y yang dirujuk di kode dan konten semua ada di KB. Yang tidak ada hanya fixture tes (R99-x) dan contoh di rencana (R09-12, dokumen rencana).
- Tidak ada rujukan patah ke `islamqa:`; satu-satunya token IslamQA adalah fixture tes (12345).
