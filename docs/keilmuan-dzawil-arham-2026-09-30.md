# Dzawil Arham: yang perlu dipastikan tim keilmuan

Tanggal: 2026-09-30. Konteks: kalkulator dzawil arham (bab 14) sudah jalan untuk [SYF] dan [HNB]. Ada tiga hal
yang tidak bisa diputuskan tim teknis karena menyangkut hukum atau bahasa. Tidak ada yang menghasilkan angka salah:
kasus yang belum pasti saat ini **ditolak dengan jujur** ("belum didukung"), bukan dihitung asal.

Urutan pengerjaan yang disarankan: **3a → 2 → 1 → 3b**.

| No | Hal | Siapa yang terdampak sekarang | Seberapa mendesak |
|---|---|---|---|
| 3a | Tata bahasa Arab «محجوب» untuk perempuan | Semua pengguna yang membuka narasi Arab | **Tinggi**: salah bahasa yang terlihat. Bisa langsung diperbaiki di portal (menu Diksi), tanpa programmer |
| 2 | Bab 14 dan bab 18 berbeda soal K14-3 [HNB] | Pembaca materi bab 14 mode Hanbali | **Sedang**: kalkulator sudah ikut bab 18; teks materi bab 14 bisa bertentangan dengan hasil hitung |
| 1 | [HNB] pasangan + dzawil arham ditolak | Pengguna mode Hanbali dengan kasus suami/istri + dzawil arham | **Sedang–rendah**: sekarang ditolak, bukan salah hitung. Perlu sebelum mode Hanbali dipromosikan |
| 3b | Sebutan "kerabat pertama/kedua" | Semua pengguna kasus dzawil arham | **Sedang**: bisa dipahami tapi kurang jelas. Butuh istilah dari tim + kerja programmer |

---

## 1. [HNB] suami/istri bersama dzawil arham

**Keadaan sekarang.** Mode Hanbali menolak kasus "pasangan + dzawil arham" (contoh: istri + anak saudari kandung).
Sebabnya tabel keberlakuan 18.4 menandai dua token ini `tidak` untuk [HNB]:

| Token | Isi | Alasan di 18.4 |
|---|---|---|
| R09-9 | Pasangan tidak menerima radd | "K09-1 berbeda di ketiga madzhab" |
| R14-3 | Sisa pasangan keluar ke dzawil arham (dalil: «ابن أخت القوم منهم») | "K14-1 berbeda di ketiga madzhab" |

**Mengapa ini patut ditinjau ulang.** Isi KB sendiri tampak mendukung `ya` untuk [HNB]:

- K09-1 [HNB] (bab 18): "radd mutlak, **kecuali pasangan**" (Mughni 6/295). Berarti isi R09-9 sama di [HNB].
  Yang berbeda di K09-1 adalah *kapan* radd terjadi (syarat baitul mal), bukan apakah pasangan ikut radd.
- K14-1 [HNB] (bab 18): dzawil arham mewarisi "ya" (Mughni 6/318–319), bahkan tanpa syarat baitul mal.
- R14-12 (pasangan mengambil fardh penuh, sisanya ke dzawil arham) sudah `ya` untuk [HNB] (Lahim hlm. 207–208).

**Yang diminta.** Pastikan dari Mughni:

1. Apakah di [HNB], bila ahli waris hanya pasangan + dzawil arham, pasangan mengambil fardh penuh (tanpa radd)
   dan **sisanya ke dzawil arham**?
2. Bila ya: ubah R09-9 dan R14-3 kolom [HNB] di 18.4 menjadi `ya`, beserta rujukan halamannya.

Dampak bila disetujui: kasus di atas langsung dihitung di mode Hanbali (hitungannya sudah ada dan teruji untuk [SYF]).
Tidak perlu kode baru selain mengubah tabel.

---

## 2. Bab 14 dan bab 18 berbeda soal K14-3 [HNB] (laki-laki vs perempuan)

| Tempat | Bunyi | Sumber |
|---|---|---|
| Bab 14, blok KHILAF K14-3 | [HNB] **sama rata mutlak** | Lahim hlm. 195 (sekunder) |
| Bab 18, baris K14-3 | [HNB] sama rata **bila ayah dan ibunya sama**, **kecuali khal (2/3) dan khalah (1/3)** | Mughni 6/324 |

Kalkulator mengikuti bab 18 (nukilan Mughni lebih rinci). Akibatnya ada kasus [HNB] yang sekarang ditolak karena
tidak tercakup rumusan bab 18:

| Kasus [HNB] | Keadaan sekarang |
|---|---|
| Anak lk dan anak pr dari satu anak perempuan, **ayahnya sama** | Sama rata (1:1) |
| Anak dari satu ibu tetapi **ayahnya berbeda** | Ditolak: "bila ayah dan ibunya sama" tidak terpenuhi |
| Khal dan khalah kandung/sebapak (satu kelompok) | 2:1 |
| Khal/khalah **seibu**, atau campuran kandung + seibu | Ditolak: bab 18 tidak merinci jenis khal/khalah |

**Yang diminta.**

1. Cek Mughni 6/324: benarkah rumusannya "sama rata bila ayah dan ibunya sama, kecuali khal dan khalah"?
2. Bila benar, perbarui blok KHILAF K14-3 di bab 14 supaya sama dengan bab 18 (atau jelaskan bila Lahim hlm. 195
   memang pendapat lain).
3. Bila ada nukilan untuk dua baris yang ditolak di tabel atas (beda ayah; khal/khalah seibu), sertakan.
   Tanpa nukilan, keduanya tetap ditolak.

Catatan [SYF]: untuk cabang saudara seibu, anak-anak yang satu ayah-ibu kini dibagi sama rata walau turunnya
bertingkat (misalnya anak lk dan anak pr dari anak pr saudari seibu). Ini mengikuti 14.5 ("cabang mengikuti hukum
perantaranya"). Cucu saudari seibu dari **dua** anak yang berbeda masih ditolak; bila ada nukilannya, mohon dikirim.

---

## 3. Bahasa narasi dzawil arham

### 3a. «محجوب» dipakai untuk perempuan (mendesak)

Dua kalimat Arab memakai «محجوب» apa pun jenis kelamin orangnya, sehingga salah bila yang dimaksud perempuan
(mestinya «محجوبة»):

| Teks Indonesia saat ini | Teks Arab saat ini |
|---|---|
| "{siapa} tidak mendapat bagian karena {oleh} lebih dulu sampai ke ahli waris dari arah yang sama." | «{siapa} محجوب؛ لأن {oleh} أسبق إلى الوارث من جهته.» |
| "{perantara} terhalang, sehingga yang bernasab melaluinya tidak mendapat apa-apa." | «{perantara} محجوب، فلا شيء لمن أدلى به.» |

Pilihan:

- **(a) Rumusan netral gender**, bisa langsung disunting di portal (menu Diksi). Contoh usulan untuk kalimat pertama:
  «لا شيء لـ{siapa}؛ لأن {oleh} أسبق إلى الوارث من جهته.» Kalimat kedua perlu disusun tim.
- **(b) Dua versi (laki-laki / perempuan)**: tim menulis keduanya, programmer menambah pemilihnya. Lebih rapi,
  tapi butuh kerja kode.

Mohon tim memilih (a) atau (b). Bila (a), bisa langsung diajukan lewat portal hari ini.

Temuan bahasa kecil lain (tidak mendesak):

- Kalimat pembuka "Tidak ada ashabul furudh atau ashabah yang menerima sisa…" kurang tepat bila ada suami/istri
  (pasangan adalah ashabul furudh). Mohon usulan rumusan yang tetap benar dalam dua keadaan.
- Angka berurutan di teks Arab bisa membingungkan: «الأخت الشقيقة ١ ٢» (nomor orang lalu saham) dan «الزوجة ٤ ١».
  Mohon usulan pemisah atau susunan kalimat.

### 3b. Sebutan "kerabat pertama / kerabat kedua"

Di narasi, dzawil arham disebut "kerabat pertama", "kerabat kedua" (Arab: «قريب ١», «قريب ٢»), bukan nama
kekerabatannya. Pembaca harus mencocokkan sendiri siapa yang dimaksud.

**Yang diminta.** Daftar istilah Indonesia + Arab untuk golongan dzawil arham (R14-4, sepuluh golongan), lengkap
dengan bentuk laki-laki dan perempuan, misalnya:

| Indonesia | Arab |
|---|---|
| 'ammah (saudari ayah) | عمة |
| khal / khalah (saudara/saudari ibu) | خال / خالة |
| anak perempuan saudara laki-laki | بنت الأخ |
| anak laki-laki saudari | ابن الأخت |
| anak laki-laki / perempuan dari anak perempuan | ابن البنت / بنت البنت |
| … (lengkapi sampai sepuluh golongan dan turunannya yang lazim) | … |

Setelah daftar ini ada, programmer memasangnya ke narasi. Ini tugas terpisah, bukan perbaikan cepat.

---

## Kasus lain yang sengaja ditolak (untuk diketahui)

- **Pernikahan antarkerabat di kalangan leluhur pewaris** (misalnya ayah dan ibu pewaris saling sepupu dari pihak
  ayah, lalu yang mewarisi adalah bint 'amm). Kerabat seperti ini tersambung ke pewaris lewat dua jalur yang salah
  satunya melalui leluhur pewaris sendiri; KB belum mengatur cara menghitungnya, jadi kalkulator menolak (R14-11).
  Bila ada nukilannya, kasus ini bisa dibuka.
