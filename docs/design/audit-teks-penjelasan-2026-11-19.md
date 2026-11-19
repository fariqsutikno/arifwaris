# Audit teks penjelasan: drawer Langkah demi langkah dan modal orang (2026-11-19)

Sumber teks: [dump lengkap](audit-teks-penjelasan-2026-11-19-dump.md) (139 kasus/varian, ±3.400 langkah, 281 modal orang; tiap baris sudah diberi
tanda otomatis `⚠Nkata` untuk narasi >30 kata dan `⚠papan-kecil` untuk papan berhuruf kecil di awal). Diambil dari keluaran nyata kode, bukan dari templat.
Cakupan: bab 16, madzhab (3 ruleset), kakek/semua-ashabah, dzawil arham, munasakhat, taqdir, gharqa. Belum dilihat di browser.
Kalimat unik: ±935 (setelah angka dinormalkan); semuanya dibaca. Temuan ditandai per kelompok baris (ID T/S/I), contoh ditunjuk ke kasusnya di dump.

## 1. Ringkasan

| Kategori | Jumlah temuan | Baris terdampak (kira-kira) |
|---|---|---|
| T. Pengajar (alur, jembatan, panjang, pengulangan, papan) | 15 | ±900 baris dump |
| S. Anak SMP (istilah dini, "kenapa" hilang, angka tak diturunkan, kata ambigu) | 9 | ±1.100 baris |
| I. Istilah teknis tanpa penjelasan awam (bagian 5) | 9 dari 22 belum dijelaskan | |
| Cakupan modal (kasus yang jatuh ke UI lama) | 1 | 10 modal |

Koreksi atas "temuan yang sudah diketahui": kata "kepala" sudah tidak ada (sekarang "jatah"); "tharif" tidak muncul di teks; papan huruf kecil
bukan hanya di langkah per orang: **±350 baris** (munasakhat 118, taqdir 179, gharqa 44, dzawil arham 5, lainnya 4).

## 2. Sepuluh temuan terpenting

1. **T1. Papan salinan narasi dan berhuruf kecil (±350 baris).** Baris dari bab cerita (munasakhat/taqdir/gharqa/dzawil arham, plus `orang_nol`, khilaf, sisa, selisih) dibuat
   `{...buatBaris(k), papan: k}`: papan = kalimat penuh yang sama dengan narasi, dan tidak dikapitalkan (narasi dikapitalkan `buatBaris`). Contoh: `ibu: 24/72.`, `Mas'alahnya 3. Supaya sama dengan jami'ah 72, …` (papan identik narasi, 20+ kata).
   Akar: `papanDari`/`buatBaris` tidak menjaga kapital papan. Perbaikan satu tempat (kapital otomatis) + templat papan ringkas untuk 4 pola (hasil per orang, mas'alah, kemungkinan, harta).
2. **S1. Istilah muncul sebelum arti di taqdir/gharqa/munasakhat:** "saham" (112×), "mas'alah" (210×), "jami'ah" (180×) dipakai tanpa definisi, padahal alur kasus biasa memakai "kotak/potong". "khuntsa" (126×) muncul di pertanyaan pembuka sebelum dijelaskan.
3. **S3. Angka tak diturunkan.** Taqdir: "Mas'alahnya 3. Supaya sama dengan jami'ah 72" (72 tidak pernah diturunkan; H1 punya 6 masalah dengan 3, 12, 18). Dzawil arham DA-02: "seibu 1 dan kandung 5, jumlahnya 6" tanpa langkah penurunannya.
4. **T3/S1. "Kerabat pertama/kedua" di dzawil arham tidak menyebut peran asli** (`buatSebutArham`, label umum `kerabat`). Pembaca tak tahu siapa mereka (anak laki-laki dari anak perempuan? bibi?). Usul: sebut peran asli pada penyebutan pertama ("kerabat pertama, yaitu anak laki-laki dari saudara laki-laki") lalu pendek.
5. **S1. "perantara" dipakai tanpa definisi** ("Bagi di antara perantara", "Para perantara dihitung…"). Dasar tanzil hanya bilang "ahli waris yang menjadi jalur nasabnya". Lihat bagian 4 (mudla bihi).
6. **T4/T5. Narasi >30 kata: 62 baris** (A16, B13, C2, D4, E23, F2, G2). Dua penyebab: (a) daftar nama dan peran panjang ("anak laki-laki dari cucu laki-laki dari anak laki-laki", 17 kemunculan; "khuntsa (saudara laki-laki kandung atau saudara perempuan kandung)"), (b) templat dasar 31–33 kata (`dasar` 'Umariyyatain, Musyarrakah, Akdariyyah, munasakhat) dan keluarga radd-pasangan (38 kata).
7. **T8. Jembatan hilang di tiga tahap kasus biasa:** ahliWaris, ashl, penyesuaian berakhir tanpa jembatan, dan tahap `bagian` kasus tanpa ashabah (mis. C16-05) tidak punya `dasar` maupun `tanya`: "bagian pasti" tak pernah diperkenalkan. Mockup menutup hampir tiap tahap dengan jembatan.
8. **S4/T12. Lima kata untuk satu ide "jumlah bagian":** bagian, kotak, potong, jatah, saham. Di ashl: "dipotong menjadi 8 bagian sama besar" lalu "8 kotak"; di tashih "kotak dipotong 3" lalu "24 potong". "sisa 1" ambigu (sisa pembagian vs sisa harta): "7 kotak dibagi 3 jatah: 2, sisa 1".
9. **S2. "Kenapa" hilang** di: tanzil "naik 1 tingkat" (kenapa naik?), radd "suami atau istri tidak menerima radd" (alasan tak diberi), taqdir "bagian terkecil" (kenapa yang terkecil?), kakek "bagian yang paling menguntungkannya" (kenapa boleh memilih?). Alasan harus dicari di KB (R09-9, K13a-3, R08-x); tidak boleh dikarang.
10. **T15/I. Pengulangan tiap mayit dan tiap kelompok:** munasakhat mengulang dasar fardh, aturan istri/suami, dan tahap penuh untuk tiap mayit; tiga baris dasar yang sama di modal anak laki-laki dan anak perempuan. Usul: dasar generik hanya pada kemunculan pertama.

## 3. Temuan lengkap

### T. Sudut pengajar

| ID | Temuan | Contoh (kasus) | Usul |
|---|---|---|---|
| T1 | Papan = salinan narasi/berhuruf kecil, ±350 baris | E. M1 `ibu: 2/6.`; F. H1-HNB `ibu: 24/72.`; G. `ibu: 24/144 = Rp240.000.` | kapital di `papanDari`; papan ringkas untuk pola hasil/mas'alah |
| T2 | Rincian per orang di taqdir/munasakhat/gharqa "Ibu: 24/72" tanpa kata kerja dan tanpa satuan; tidak memakai analogi kotak | F. H1 kemungkinan 1–6; E. hasil akhir | satu pola "Ibu 24 dari 72 potong" seperti kasus biasa |
| T3 | Sebutan "kerabat pertama" menyembunyikan peran | D. DA-02 baris 5–13 | `buatSebutArham`: peran pada kemunculan pertama |
| T4 | 62 narasi >30 kata | A. C16-02 dasar 'Umariyyatain (31); E. M2 dasar munasakhat (33); G. tilad (32) | pecah dasar jadi dua langkah (aturan, lalu nama kasus); daftar panjang pindah ke papan |
| T5 | `tanya` mendaftar semua ahli waris (sampai 9 nama, 36 kata) | A. kasus KK semua-ashabah, tanya #829 | "meninggalkan 9 kerabat" + daftar di papan/pohon |
| T6 | Modal: dasar fardh umum ("Sebagian ahli waris punya bagian pasti… Sisanya diambil ahli waris lain") ditempel di bawah judul "Kenapa mendapat sisa?" tanpa kaitan; keluarga anak laki-laki dan perempuan identik | A. C16-01 modal S1, D1 | untuk ashabah tunjukkan hanya aturan 2:1 dan alasan, dasar fardh dipendekkan |
| T7 | Modal hitungan: "Tashih: 1 × 3 = 3; bagian orang ini 3" (label/satuan samar); "'Aul: 3 dari 6 menjadi 3 dari 7" tanpa alasan | A. C16-01, C16-05 | "Tiap kotak dipotong 3: 1 kotak × 3 = 3 potong" ; tambah satu kalimat alasan aul |
| T8 | Jembatan hilang: ahliWaris, ashl, penyesuaian; tahap bagian tanpa dasar/tanya bila tak ada ashabah | A. C16-05; semua kasus 'adilah | tambah jembatan "Siapa yang dapat sudah jelas. Berapa? Itu tahap berikut" dst. |
| T9 | Urutan tahap `bagian` tidak seragam: kadang dasar dulu (C16-01), kadang langsung keluarga (C16-05) | A. C16-01 vs C16-05 | selalu dasar fardh sekali di awal tahap bagian |
| T10 | Tanya `penyesuaian` berisi jawabannya ("Kalau lebih…, kalau kurang…") sehingga tiga kalimat | semua `cek.tanya` | cukup pertanyaan; dua kemungkinan pindah ke langkah hitung |
| T11 | Modal yang jatuh ke UI lama (10): NEG1, NEG2 (mamnu), DA-02/03/06/14/19 (dzawil arham terhalang), MZ11 ×3 (mu'addah saudara sebapak) | lihat dump "tidak dipetakan" | petakan: mani' memakai dasar+keluarga langkah mani'; terhalang dzawil arham memakai baris terhalang |
| T12 | "Mas'alah" (munasakhat/taqdir) vs "asal masalah" (kasus biasa) tanpa kaitan | E. M2; F. H1 | satu sebutan: "asal masalah" |
| T13 | Peralihan mayit di munasakhat: "Istri meninggalkan suami dan anak laki-laki" (mayit kedua disebut "Istri") bingung dengan almarhumah pertama | E. mayit kedua | "Istri almarhumah (yang wafat kedua)" pada penyebutan pertama |
| T14 | Judul tahap munasakhat menimpa nama ("almarhum: Siapa yang mewarisi") huruf kecil | E. M2 tahap ahliWaris | kapital judul |
| T15 | Pengulangan dasar tiap mayit dan tiap kelompok | E. M2, M7 | dasar sekali per penjelasan |

### S. Sudut anak SMP

| ID | Temuan | Contoh | Usul |
|---|---|---|---|
| S1 | Istilah sebelum arti: saham, mas'alah, jami'ah, khuntsa, perantara, "ahli waris utama" (48×), nasab/bernasab (86×) | F. H1; E. M2; D. DA-02 | bagian 4 |
| S2 | "Kenapa" hilang (lihat top 10 no. 9) | D. "naik 1 tingkat"; A. radd pasangan | cari alasan di KB; bila tak ada, tulis apa adanya tanpa "kenapa" |
| S3 | Angka tak diturunkan: 72 di taqdir, 1 dan 5 di dzawil arham | F. H1; D. DA-02 | tambah langkah turunan (kpk 3, 12, 18 → 72; bagi 1/6 dan sisa 5/6) |
| S4 | Kata ambigu: bagian/kotak/potong/jatah/saham; "sisa" ganda | A. C16-01 tashih | satu kamus kata: bagian = pecahan; kotak = satuan asal; potong = satuan setelah tashih; jatah → "kepala bobot" belum diputuskan |
| S5 | "ayahnya ibu" (kakek dari pihak ibu), "keponakan laki-laki" | A. radd dzawil arham | pakai "kakek dari pihak ibu", dan "cicit laki-laki" untuk "anak laki-laki dari cucu laki-laki dari anak laki-laki" (kata "cicit" ada di KB 16.18; cek glosarium) |
| S6 | "dan kakek dan saudara perempuan kandung 3" (dua "dan") | A. C16-12 ashl hitung | gabung dengan "serta" atau kurung |
| S7 | "Yang terbesar sepertiga sisa" (rujukan "yang terbesar" tak jelas) | A. kakek terpilih | "Pilihan terbesarnya sepertiga sisa" |
| S8 | Kalimat besar-besaran "khuntsa (saudara laki-laki kandung atau saudara perempuan kandung)" berulang 126× | F. khuntsa | "khuntsa (saudara kandung)" pada pertama, lalu "khuntsa pertama" |
| S9 | "Kitab menghitungnya… Langkah bertahap di bawah memberi hasil yang sama" kitab tak disebut | E. | sebut jenis rujukan atau hapus |

## 4. Istilah "perantara" dan mudla bihi (verifikasi)

KB (`15_glosarium.md` baris Tanzil, bab 14) memakai kata "perantara" dan tidak memuat istilah Arabnya.
Hasil verifikasi lewat MCP Shamela (sumber sekunder, bukan Raudhah):

- Istilah yang dimaksud pemilik: **المُدْلَى بِهِ** (al-mudlā bihi), diucapkan "al-mudla bihi"; pelaku sebaliknya **المُدْلِي** (al-mudlī). Ejaan "mudla bihi" benar bila ditambah "al-" dan tanda panjang pada lā.
- Makna terverifikasi: mudla bihi = orang yang lewat dia kerabat jauh tersambung ke mayit (perantara), mudli = kerabat jauh yang tersambung. Contoh nukilan: «حال المدلي مع المدلى به كحال المدلى به مع الميت» (al-Mabsuth as-Sarakhsi 29/166, hanafi); «حكم المدلى به أقوى في الميراث من حكم المدلي» (Bahr al-Madzhab ar-Ruyani 7/433, syafi'i); «لا يجوز أن يكون المدلي أولى من المدلى به» (al-Bayan al-'Imrani 11/284, syafi'i).
- **Belum terverifikasi di Raudhah ath-Thalibin** (id 499): pencarian "المدلى به" dan "يدلي الأرحام" tidak menghasilkan temuan (pencarian umum "ذوو الأرحام" di buku itu juga nol, jadi mungkin kendala indeks, bukan bukti tidak ada). Lahim/Ithraa tidak dicek.
- Status: **blocked** untuk glosarium KB dan untuk teks bertooltip. Sementara teks hanya pakai kata awam "perantara". Bila pemilik setuju, istilah Arab boleh ditambah sebagai keterangan kecil dengan label "sumber sekunder: Bahr al-Madzhab, al-Bayan, al-Mabsuth".
- Usul kalimat dasar awam (tanpa istilah Arab): "Perantara adalah kerabat yang menjadi jalur nasab: lewat dialah kerabat jauh tersambung ke almarhum. Contoh: ibu adalah perantara bagi bibi dari ibu."

## 5. Sapuan istilah teknis

Aturan: arti awam di tempat pertama muncul, istilah belakangan. "Sudah?" = sudah dijelaskan di tempat pertama muncul pada alur kasus yang umum.

| Istilah | Muncul pertama (konteks) | Sudah? | Usul kalimat penjelas |
|---|---|---|---|
| fardh | dasar bagian ("namanya fardh") | ya, hanya bila ada ashabah | tambahkan dasar fardh di semua tahap bagian (T9) |
| hajb hirman | dasar ahliWaris | ya | "Kerabat yang lebih dekat menghalangi yang lebih jauh" sudah ada |
| hajb nuqshan | papan saja ("1/4 → 1/8 · hajb nuqshan") | tidak | "Bagian turun tapi tidak hilang; ini disebut hajb nuqshan" |
| ashabah | keluarga ("yang mengambil sisa disebut ashabah") | ya, tapi tidak di modal ashabah ma'al ghair | ulangi arti di modal |
| ashabah bil ghair / ma'al ghair | papan | sebagian (ma'al ghair ada dasar) | bil ghair: "ikut mengambil sisa karena ada saudara laki-lakinya" |
| tashih | judul + papan | tidak | "Supaya bagian bulat, harta dipotong lagi. Ini disebut tashih" |
| ru'us/jatah | "jatah" tanpa definisi | tidak | "Jatah: laki-laki dihitung 2, perempuan 1 (disebut ru'us)" |
| jami'ah | taqdir, gharqa, munasakhat | hanya satu kalimat munasakhat | "angka pembagi bersama (jami'ah)" di kemunculan pertama |
| mas'alah | taqdir, munasakhat | tidak | ganti "asal masalah" |
| saham | taqdir/gharqa/munasakhat | tidak | ganti "potong" |
| wafq / tawafuq / tadakhul / tamatsul / tabayun | logika ashl | ya (arti dulu, istilah dalam kurung) | cukup |
| juz' as-sahm | tashih | ya (kurung) | cukup |
| mauquf | dasar taqdir | ya ("ditahan (mauquf)") | cukup |
| tilad | gharqa | ya ("harta asli (tilad)") | cukup; ("tharif" tidak muncul) |
| haml / mafqud | keluarga taqdir | ya (kurung) | cukup |
| khuntsa | tanya taqdir | tidak (arti baru di baris sesudah) | "orang yang jenis kelaminnya belum jelas (khuntsa)" di tanya |
| munasakhat | dasar munasakhat | ya | cukup |
| tanzil | dasar dzawil arham | ya | tambahkan "naik" = pindah ke posisi lebih dekat |
| perantara | dzawil arham | tidak | bagian 4 |
| dzawil arham | dasar | ya | cukup; papan "dzawil arham bila ada" tanpa arti |
| radd | dasar radd | ya | "suami/istri tidak ikut radd" butuh alasan dari KB |
| baitul mal | satu dari tiga kalimat | sebagian | arti pada kemunculan pertama |
| ahli waris utama | dasar dzawil arham | tidak | "ahli waris yang punya bagian pasti atau menerima sisa" |

Usul perubahan glosarium (belum dilakukan; butuh rujukan): tambahkan baris "Mudla bihi / perantara" dan "Mudli" setelah verifikasi Raudhah.

## 6. Yang belum terverifikasi

- Tidak ada layar browser dilihat; semua dari keluaran kode.
- Kalimat fikih tidak dibandingkan ulang dengan KB baris per baris (di luar cakupan audit teks); yang ditandai hanya "kenapa" hilang.
- Modal munasakhat/taqdir/gharqa tidak ada (fungsi hanya untuk kasus biasa dan dzawil arham).
