# Bedah penjelasan dari sudut pandang pengajar (2026-11-19)

Keluhan pemilik: penjelasan di drawer/sinema dan modal ahli waris **tidak mengalir, tanpa bridging, sulit dipahami**, tidak step-by-step seperti
`mockup-langkah-demi-langkah.html` (disetujui 2026-11-18) dan modal di `mockup-hasil-per-kasus.html`.
Dokumen ini: audit teks sekarang, prinsip mengajar, usulan format + contoh. **Belum ada kode atau diksi yang diubah**; menunggu pilihan pemilik (bagian 4).

Catatan metode: prinsip di bagian 2 adalah prinsip desain pembelajaran yang mapan (contoh kerja, beban kognitif, penanda alur), bukan hasil pencarian web
sesi ini. Contoh teks di bagian 3 hanya memperagakan **gaya**; isi fikihnya saat ditulis tetap dicocokkan ke KB dan membawa `[Rxx-y]` dari jejak engine.

## 1. Audit: di mana alurnya putus

Teks diambil dari keluaran nyata `susunLinimasa` (kasus bab 16: C16-01 istri + anak lk + anak pr, C16-03 'Umariyyatain, C16-05 'aul, C16-09 radd).

**Akar masalahnya struktural, bukan soal kalimat satu per satu.** `linimasa.ts` memakai ulang bab *cerita* (prosa untuk dibaca) dan menjadikan
1 baris = 1 langkah. Mockup menulis *skrip adegan*: tiap tahap berisi pertanyaan, dasar, penerapan, logika, hitungan, penghubung. Di kode, `BagianLangkah`
baru `'keluarga' | 'hitung'`; `tanya`, `dasar`, `logika`, `jembatan` ada di rencana (`rencana-integrasi...md` bagian 2–3) tapi belum dibuat
(komentar kepala `linimasa.ts`: "Belum: templat tanya/logika/jembatan").

| # | Gejala | Contoh nyata | Mockup |
|---|---|---|---|
| A | Tahap tidak dibuka dengan pertanyaan; langsung pernyataan | "Ahli waris (warits) almarhum: istri, anak laki-laki, dan anak perempuan." | "…Apakah semuanya mendapat bagian?" |
| B | Aturan umum dan penerapan dicampur dalam satu kalimat | C16-01: "Istri mendapat 1/8, bukan 1/4, karena almarhum meninggalkan keturunan yang ikut mewarisi (far'u warits): … Pengurangan seperti ini disebut hajb nuqshan." (3 ide, 2 istilah) | Langkah `d` (aturan) terpisah dari langkah `k` (di keluarga ini) |
| C | Tidak ada jembatan antar tahap | "Bagian masing-masing" berakhir di "…mengambil sisa", tahap berikut mulai "Bagian yang sudah pasti: istri 1/8. Penyebutnya 8, jadi…" | Langkah `j`: "1/8 dan 1/6 belum bisa dijumlahkan… itu tugas tahap berikutnya" |
| D | Istilah muncul sebelum artinya, dan di tengah kalimat inti | "(warits)", "(ashlul mas'alah)", "(tabayun)", "(juz' as-sahm)" | Arti awam dulu, istilah belakangan di papan atau tooltip |
| E | "Kotak" dipakai tanpa pernah diperkenalkan | C16-01: "8 ÷ 8 = 1 kotak untuk istri" | "Bayangkan harta sebagai 1 kotak utuh. Supaya bisa dibagi, dipotong sama besar." |
| F | Persamaan tanpa alasan operasinya | "6 ÷ 3 × 2 = 4 kotak untuk kedua saudara perempuan" | "Aminah 1/8: 24 dibagi 8, 3 kotak." (satu kalimat alasan + hasil) |
| G | Tashih: bagian tersulit, paling padat | C16-01: "7 tidak bisa dibagi 3 dan keduanya tidak punya faktor bersama (tabayun), jadi angka 3 disimpan. Semua bagian dikalikan 3 (juz' as-sahm)". "Disimpan" tidak dijelaskan; tidak ada alasan *kenapa semua* kotak dipotong | 5 langkah: tidak habis → dipotong → bagian istri tetap sama nilainya → 51÷3 → cek jumlah |
| H | Hasil akhir muncul tanpa jalan ke sana | "Anak laki-laki: 14 bagian (14/24)" padahal sebelumnya hanya "×3 = 24"; 7→21→14 tidak pernah ditunjukkan | "51 ÷ 3 = 17 · Budi 34 · Siti 17" |
| I | Tahap formal tanpa motivasi | "Jumlah semua bagian 1 + 7 = 8, pas sama dengan 8 ('adilah). Tidak perlu penyesuaian." | Didahului pertanyaan: "Apakah jumlahnya pas dengan hartanya?" |
| J | 'Aul: satu kalimat 45 kata, alasan "kenapa tidak ada yang dicoret" hilang | "Supaya adil, penyebutnya dinaikkan menjadi 7 ('aul): setiap orang tetap mendapat jumlah bagian yang sama, tetapi karena harta sekarang dibagi 7, semua bagian berkurang secara sebanding." | Pertanyaan "siapa yang dikurangi?" → "semuanya bagian pasti, tidak boleh dicoret" → potong ulang → Yusuf 3/6 → 3/8 |
| K | 'Umariyyatain terbaca keliru | "Ayah yang mengambilnya karena tidak ada yang lebih dekat darinya: anak laki-laki atau cucu laki-laki dari anak laki-laki." (terbaca: ayah lebih dekat dari anak) | Harus berbunyi "tidak ada anak laki-laki atau cucu laki-laki dari anak laki-laki" |
| L | Radd: angka sisa tanpa pertanyaan | "Masih tersisa 2 bagian, dan tidak ada ahli waris yang berhak atas sisa (ashabah)." | "Sisa 2 kotak: ke mana?" lalu jawabannya |
| M | **Modal orang**: "Cara menghitungnya" satu kalimat generik, tidak menyambung dari 1/8 ke 3/24 | "Harta dibagi menjadi 24 bagian yang sama; Istri mendapat 3 bagian. 3/24 × Rp … = Rp …" (dari kunci tetap `hitung.harta_dibagi_menjadi_penyebut_bagian_yang`); bullet kedua "Istri: 3 bagian (3/24)." mengulang kotak angka di atasnya | Alur bernomor **Dasar → Di keluarga ini → Hitungan** (tabel 'kasus ini', ✓ syarat, baris label/nilai: `Asal 24: 24 × 1/8 = 3`, `Rupiah: 3/24 × Rp = Rp`) |
| N | Modal orang memfilter baris cerita berdasar `subjek` | Isi "Kenapa segitu?" = potongan prosa bab *Bagian*, bukan penjelasan yang ditulis untuk satu orang | Penjelasan per orang disusun khusus (`blokPeran`) |

## 2. Prinsip mengajar yang dipakai

1. **Pertanyaan dulu** (celah rasa ingin tahu). Tiap tahap dibuka dengan pertanyaan yang jawabannya adalah isi tahap itu.
2. **Aturan sebelum penerapan, penerapan sebelum hitungan.** Urutan baku: tanya → dasar → di keluarga ini → logika → hitungan → jembatan (enam bagian di mockup).
3. **Satu langkah = satu ide**, maksimal 2 kalimat, sekitar 25 kata (sinema dibacakan suara; pendengar tidak bisa membaca ulang).
4. **Konkret sebelum abstrak.** Gambar kotak/potongan diperkenalkan dulu ("bayangkan harta sebagai 1 kotak"), baru angka asal masalah.
5. **Arti awam dulu, istilah setelahnya**: "…Penurunan ini disebut hajb nuqshan." Paling banyak satu istilah baru per langkah; istilah di papan atau tooltip, bukan kurung di tengah kalimat inti.
6. **Penanda alur (signposting)**: kata penghubung tetap per fungsi, dan jembatan di ujung tahap yang menyebut *apa yang belum beres* (masalah yang dijawab tahap berikut).
   - sebab: "karena itu", "jadi" · urutan: "sekarang", "lalu", "tinggal" · kontras: "tapi", "ternyata" · cek: "mari kita cek", "pas".
7. **Hitungan selalu membawa alasan operasinya** (contoh kerja): "24 dibagi 8, karena 1/8 berarti satu dari delapan potong", bukan hanya "24 ÷ 8 = 3".
8. **Angka selalu dengan satuannya** ("3 kotak", "3 dari 24"), dan angka yang muncul di hasil harus sudah pernah diturunkan di langkah sebelumnya.
9. **Cek di akhir bagian sulit**: "9 + 12 + 34 + 17 = 72" membuat pembaca yakin sebelum lanjut.

## 3. Usulan format dan contoh (C16-01, istri + anak lk + anak pr)

Setiap langkah punya jenis: `tanya` `dasar` `keluarga` `logika` `hitung` `jembatan`. Templat dibuat **per jenis tahap** (bukan per kasus), diisi angka dari jejak.

**Siapa mewarisi**
- (tanya) Almarhum meninggalkan istri, anak laki-laki, dan anak perempuan. Apakah ketiganya mendapat bagian?
- (dasar) Kerabat yang lebih dekat menghalangi kerabat yang lebih jauh. Ini disebut hajb.
- (keluarga) Di keluarga ini tidak ada yang menghalangi siapa pun. Ketiganya mewarisi.

**Bagian awal**
- (dasar) Sebagian ahli waris punya bagian pasti dari Al-Qur'an (fardh). Yang tidak punya, mengambil sisa (ashabah).
- (keluarga) Istri biasanya mendapat 1/4. Tapi almarhum meninggalkan anak, jadi bagiannya turun menjadi 1/8. Penurunan ini disebut hajb nuqshan.
- (keluarga) Anak laki-laki dan anak perempuan tidak punya bagian pasti. Mereka mengambil sisa bersama-sama; anak laki-laki mendapat dua kali bagian anak perempuan.
- (jembatan) Istri 1/8, sisanya untuk anak-anak. Supaya "sisa" jadi angka, harta harus dipotong dulu. Itu tugas tahap berikutnya.

**Asal masalah**
- (logika) Bayangkan harta sebagai satu kotak utuh. Supaya 1/8 bisa dihitung tanpa pecahan, kotak itu dipotong menjadi 8 bagian sama besar.
- (hitung) Istri 1/8: 8 dibagi 8, satu kotak.
- (hitung) Sisanya 8 dikurangi 1, yaitu 7 kotak, untuk anak laki-laki dan anak perempuan.
- (hitung) Jadi harta dipotong 8. Angka 8 inilah asal masalah.
- (jembatan) 7 kotak harus dibagi 2 : 1, yaitu 3 kepala (anak laki-laki dihitung 2). Habiskah 7 dibagi 3?

**Memeriksa jumlah bagian**
- (tanya) Sebelum lanjut: apakah jumlah kotak pas dengan hartanya?
- (hitung) 1 + 7 = 8, sama dengan 8 potong harta. Pas, tidak ada penyesuaian ('adilah).

**Tashih**
- (keluarga) 7 kotak dibagi 3 kepala: 7 ÷ 3 = 2 sisa 1. Tidak habis, jadi ada kotak yang harus dipotong lagi.
- (logika) Caranya: setiap kotak dipotong 3. Semua kotak, bukan hanya milik anak-anak, supaya semua potongan sama besar. Sekarang ada 8 × 3 = 24 potong (tashih).
- (logika) Lihat istri. Kotaknya tetap 1, hanya potongnya menjadi 3. 1/8 sama dengan 3/24.
- (hitung) Anak-anak punya 7 × 3 = 21 potong. 21 ÷ 3 kepala = 7 per kepala. Anak laki-laki 2 kepala: 14. Anak perempuan: 7.
- (hitung) Cek: 3 + 14 + 7 = 24.

**Modal orang (istri)**: Dasar → Di keluarga ini → Hitungan, memakai kalimat langkah yang sama
- Dasar: Istri mendapat 1/4 bila almarhum tidak punya anak atau cucu, dan 1/8 bila punya.
- Di keluarga ini: ✓ Almarhum punya anak (anak laki-laki dan anak perempuan), jadi istri 1/8.
- Hitungan: harta dipotong 24, jadi 1/8 = 3/24 · 3/24 × Rp … = Rp …

## 4. Keputusan untuk pemilik

**Opsi A, skrip adegan penuh (rekomendasi).** Linimasa memakai enam jenis langkah di atas, templat baru namespace `narasi.langkah.*` (kira-kira 70–90 kunci, per jenis tahap, termasuk 'aul, radd, 'Umariyyatain, tashih). Modal orang dapat fungsi baru di `packages/explain` yang menghasilkan blok Dasar / Di keluarga ini / Hitungan memakai templat yang sama (satu sumber kata). Menyentuh `linimasa.ts` (tipe `BagianLangkah`, `Langkah`) dan snapshot linimasa.
Konsekuensi: `pnpm diksi:tambah` menolak kunci yang sudah ada, jadi kalimat lama tidak diedit di tempat; `narasi.cerita.*` tetap dipakai mode cerita/ringkas dan layar Penjelasan lama, linimasa pindah ke kunci baru.
Koordinasi: tipe baru dibaca komponen `hasil/` (sesi utama), dan modal perlu sesi utama menyambungkan fungsi baru.

**Opsi B, rapikan yang ada.** Tetap 1 baris cerita = 1 langkah; tambah hanya pertanyaan pembuka dan jembatan per tahap, pecah kalimat panjang, pindahkan istilah ke belakang (kira-kira 25–30 kunci). Lebih cepat, tapi adegan `logika` (kotak dipotong, 'aul "kotak tidak muat") tetap tidak ada, jadi hasilnya masih jauh dari mockup.

Kasus yang di luar jangkauan awal (munasakhat, taqdir, gharqa, dzawil arham) dikerjakan setelah kasus biasa + 'aul + radd lolos, mengikuti urutan di rencana integrasi.

## 5. Pola yang terbaca dari mockup (dipilih Opsi A, 2026-11-19)

Dibaca dari kasus biasa, 'aul, berlapis, dan hamil di `mockup-langkah-demi-langkah.html`.

**Rangka tahap.** `tanya? → dasar? → keluarga+ → logika* → hitung+ → jembatan?`. Tidak semua wajib: tahap rutin (harta) hanya `keluarga`; 'aul = tanya, logika, logika, hitung. Jembatan ada di ujung hampir tiap tahap kecuali tahap penutup (rupiah, jami'ah akhir).
**Dua teks per langkah.** `narasi` (kalimat utuh, dibacakan) dan `papan` (rumus/angka ringkas, hasil ditebalkan, istilah Arab di keterangan kecil: "(tawafuq)", "(tadakhul)").
**Panjang.** Satu ide, 1–2 kalimat, 10–30 kata. Hanya `dasar` boleh 2–3 kalimat.
**Pola kalimat tetap per fungsi.**
- keluarga: "[Nama] adalah [peran]…" lalu kesimpulan "Maka/Jadi [akibat]." Papan: ~~1/4~~ **1/8** + sebab + sumber.
- hitung (paralel, diulang per orang): "[Nama] [pecahan]: [asal] dibagi [penyebut], [n] kotak."
- logika bila ada masalah: coba, gagal, cari jalan ("Kalau dipotong 8, Aminah 1. Pas. Tapi 1/6 dari 8 = 1,33. Tidak bulat." → "Kelipatan 8: 8, 16, 24. Kelipatan 6: 6, 12, 18, 24. Yang pertama sama: 24.").
- logika "nilai tak berubah": "Lihat Aminah. Kotaknya tetap 3, hanya potongnya jadi 9."
- cek penutup: "Jumlahnya 72." / "…pas Rp 300.000.000, tanpa selisih."
**Jembatan tiga rupa.** (a) masalah menggantung ("1/8 + 1/6 = ?"), (b) pertanyaan ("Bisakah tanpa pecahan?", "Ke mana?"), (c) pengumuman ("Mulai dari mayit pertama", "Dua harta sudah dibagi. Tinggal dijumlahkan"). Selalu menyebut apa yang belum beres.
**Tanya dua rupa.** Dunia nyata ("Apakah semuanya mendapat bagian?") dan teknis ("14 ÷ 24 tidak habis. Apa yang dikalikan?"); sering membawa data kasus (jumlah kerabat).
**Dasar.** Satu ide + dalil Arab + sumber, berlabel "berlaku untuk semua kasus"; dipisah tegas dari "Di keluarga ini".
**Analogi konsisten.** Kotak, bingkai, potong, meja (taqdir), dapur (dua harta). Satu analogi dipakai dari awal sampai akhir; pembeda dari kasus lain disebut eksplisit ("Berbeda dengan kasus berurutan").
**Rupiah.** Satu langkah per orang, bentuk tetap "[Nama] [n] potong: Rp …"; selisih pembulatan disebut di langkah orang terakhir.
