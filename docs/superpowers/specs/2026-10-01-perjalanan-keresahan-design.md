# Spec: Perjalanan dari Keresahan (tumpukan harta, "Bagaimana kalau", kenapa dapat/tidak, sunting di tempat)

Tanggal: 2026-10-01 · Status: draf, menunggu review pemilik

Sumber:
- mockup `docs/design/mockup-perjalanan-pengguna.html` (perjalanan Bu Rahma, 7 keresahan);
- diskusi 2026-10-01: harta menumpuk dari beberapa almarhum, istilah "babak" dan "dunia" diganti,
  "belum bisa dihitung" diganti kemungkinan, sunting keluarga dari pohon;
- KB bab 01, 02, 03, 06, 12.5, 13, 13a–13d, 14. Contoh keluhan nyata: konsultasi hukumonline (status harta dulu,
  gono-gini; jual rumah warisan butuh semua ahli waris), jurnal jual-beli tanah warisan yang belum dibagi,
  NU Online tentang KHI ps. 185 (ahli waris pengganti).

Spec ini **mengubah**:

| Spec | Bagian | Perubahan |
|---|---|---|
| `2026-09-30-alur-ariflab-terintegrasi-design.md` | 1.2 Beranda | pintu dari situasi (6.1) |
| | 2.2 Harta | daftar barang + milik siapa (2) |
| | 2.3–2.4 | kata "babak" diganti (1); pertanyaan harta almarhum lain (2.3) |
| | 2.5 Periksa, 3.1 Lapis 1 | sunting di tempat (5); hasil per orang / per barang (2.5); kemungkinan (3) |
| | 3.2 Lapis 2 | kelompok per almarhum (1); blok kenapa dapat/tidak (4) |
| `2026-09-30-babak-kematian-berlapis-design.md` | 1.1 butir 3, 8.2 S2, 8.3 | `hartaPernahDibagi` diganti "masih utuh?" per barang (2.2) |
| | 1.7, 8.1 butir 3 | "ditolak / hitung ditahan" diganti kemungkinan bila bisa dihitung (3) |
| | 3 (hasil taqdir) | "Kalau terbukti…" → "Bagaimana kalau…" (3) |
| | 2.1 `gharqa.tirkah` | harta anggota gharqa masuk daftar barang (7) |
| `docs/design/riset-ux-input-kematian-berlapis.md` | 7.6, K10 | harta almarhum kedua tidak lagi buntu (2) |

Engine tidak diubah hitungannya. Satu tambahan jejak (4.3).

---

## 0. Masalah

Alur yang ada mengikuti urutan kitab: pilih mayit pertama, lalu maju ke kematian berikutnya. Pengguna datang
dari arah lain. Ia membawa **keperluan soal harta**, hartanya sering **bercampur dari beberapa almarhum**, dan
yang ia cemaskan adalah **apa yang terjadi sesudah angka keluar**.

| # | Keresahan | Jawabannya | Bagian |
|---|---|---|---|
| 1 | "Rumah Mbah mau dijual. Dulu tidak pernah dibagi. Mulai dari mana?" | Beranda dari situasi | 6.1 |
| 2 | "Rumah atas nama Bapak, emas punya Ibu, tanah dari Mbah. Kami mau bagi semua." | Daftar barang, tiap barang milik siapa | 2.1 |
| 3 | "Oh iya, Ibu juga punya tabungan." | Pertanyaan harta almarhum lain | 2.3 |
| 4 | "Tahun wafat Budi saya lupa." | Tahun kira-kira; simpan dan lanjut nanti; kemungkinan bila berpengaruh | 3, 6.2 |
| 5 | "Yang hafal silsilahnya Bibi." | Kirim berkas ke keluarga | 6.4 |
| 6 | "Saya dapat total berapa? Rumah ini punya siapa saja sekarang?" | Hasil per orang dan per barang | 2.5 |
| 7 | "Kalau ternyata Budi wafat sebelum Mbah?" / "Bayinya belum lahir." | Bagaimana kalau… | 3 |
| 8 | "Kok besan dapat, cucu Pak Slamet tidak?" | Kenapa dapat, kenapa tidak | 4 |
| 9 | "Ada yang salah, anak Budi kurang satu." | Sunting langsung dari pohon | 5 |
| 10 | "Harus menjelaskan ke Paman 70 th di rapat keluarga." | Lembar musyawarah | 6.3 |
| 11 | "Bisa dipakai untuk notaris?" | Catatan bukan dokumen resmi | 6.5 |

## 1. Kata: tanpa "babak", tanpa "dunia"

"Babak" dan "dunia" adalah istilah desain, bukan kata sehari-hari. Di layar, satuannya adalah **orangnya**.

| Dulu | Sekarang (teks tampil) |
|---|---|
| Babak 2 dari 3 · Budi | **Keluarga Budi** · 2 dari 3 |
| Babak 1 · harta Pak Ahmad | **Harta Pak Ahmad** |
| Babak 2 · bagian Budi | **Bagian Budi, diteruskan ke keluarganya** |
| Lanjut: keluarga {nama babak k+1} | tetap |
| Dunia / taqdir (hasil) | **Kemungkinan**; judul bagian "Bagaimana kalau…" |
| Kalau terbukti… | Bagaimana kalau… |
| Amplop titipan (mauquf) | **Disimpan dulu** (kata "amplop titipan" tetap boleh sebagai keterangan) |

- Kalimat pembuka tiap keluarga lanjutan tetap (spec babak 1.2 butir 1), tanpa kata "babak".
- Istilah fikih (munasakhat, taqdir, mauquf) hanya di lapis 3 dan mode Belajar, dengan glosarium.
- Nama di kode (`LangkahBabak`, `babak` di keadaan wizard, `daftarDunia`) **tidak diganti massal**. Diganti hanya
  bila file itu memang disentuh untuk fitur ini.
- Kamus kata riset 9.1 ditambah tiga baris di atas.

## 2. Tumpukan harta

### 2.1 Langkah 2 · Harta: daftar barang

**Kasus biasa tidak bertambah layar.** Layar awal tetap satu isian: "Harta {almarhum}" dengan pemilik = almarhum.
Di bawahnya ada tautan **"Ada harta lain yang juga belum dibagi"**, yang menambah satu barang. Tiap barang berisi:

1. **Nama** bebas ("Rumah Jl. Melati", "Emas Ibu").
2. **Nilai sekarang**, boleh kosong. Kosong berarti barang itu tampil dalam persen saja di hasil. Keterangan:
   "Pakai perkiraan nilai sekarang. Yang dibagi barangnya, angka hanya membantu."
3. **Dulu milik siapa, waktu beliau wafat?**
   - {almarhum} (bawaan);
   - orang lain yang sudah wafat: dipilih dari daftar keluarga, atau nama baru (menjadi orang berstatus wafat,
     keluarganya ditanyakan di langkah 3);
   - **Milik berdua (harta bersama suami-istri)** → pesan jujur (2.4);
   - **Tidak tahu** → pilih calon pemiliknya (≤ 3 orang) → hasil tampil sebagai kemungkinan (3).
4. **Sampai sekarang masih utuh, belum dibagi?** (definisi "dibagi" dari riset K1)
   - Ya (bawaan) → masuk hitungan.
   - Sudah dibagi → barang tidak dimasukkan. Pesan: "Harta yang sudah dibagi sudah menjadi milik masing-masing.
     Kalau salah satu penerimanya kemudian wafat, masukkan bagiannya sebagai harta orang itu."
   - Sebagian → pesan jujur (tetap di luar cakupan, spec babak "Di luar cakupan").

Pertanyaan "Sejak {pewaris} wafat, apakah hartanya pernah dibagi?" (spec babak 1.1 butir 3, 8.2 S2) **dihapus**.
Alasannya: barang yang masuk daftar sudah pasti masih utuh, jadi semua kematian sesudah pemiliknya ikut berantai.
Kasus S30 (wafat sesudah harta dibagi) otomatis tertangani oleh jawaban "Sudah dibagi" di atas.

### 2.2 Utang, biaya, wasiat per pemilik

Pertanyaan kewajiban (ArifLab 2.2) ditanyakan **per pemilik**.

- **Pemilik yang wafat paling dulu** di tiap rantai: seperti sekarang (KB bab 01).
- **Pemilik lain** (mis. Ibu yang wafat sesudah Mbah): utang dan biaya pemakaman dipotong dari harta miliknya
  sendiri. Hasilnya sama dengan memotong dari seluruh tirkahnya selama potongan ≤ harta miliknya, karena harta
  milik sendiri dan bagian yang ia terima dari almarhum sebelumnya dibagi dengan perbandingan yang sama kepada
  keluarganya. Bila potongan melebihi harta miliknya, **atau ada wasiat** → pesan jujur: batas 1/3 wasiat dan
  pelunasan utang dihitung dari seluruh tirkahnya, termasuk bagian dari almarhum sebelumnya; KB 12.5 belum
  mengatur ini. (Kasus D di bagian 3.)

### 2.3 Pertanyaan harta almarhum lain

Di akhir langkah 3 (Keluarga), sebelum Periksa, **hanya bila** di graf ada orang berstatus wafat yang bukan
pemilik barang mana pun:

> **Budi dan Ibu juga sudah wafat. Apakah mereka meninggalkan harta sendiri yang juga belum dibagi?**
> Tidak ada (bawaan) / Ada → tambah barang (2.1) dengan pemilik sudah terisi.

Pemilik yang wafat **sebelum** pewaris pertama (mis. Ibu wafat 2010, pewaris yang dipilih Bapak 2020) membuka
bagian **Keluarga Ibu** di langkah 3: siapa keluarganya waktu ia wafat, dengan Bapak dan anak-anak tercentang
dari orang yang sudah ada (spec babak 1.2 butir 3).

### 2.4 Harta bersama suami-istri: pesan jujur

Keputusan pemilik 2026-10-01. `docs/kb/SYSTEM_PROMPT.md` menyebut gono-gini sebagai hal yang butuh interpretasi
hukum baru, jadi aplikasi tidak membaginya.

> Harta bersama suami-istri perlu ditentukan dulu, berapa bagian masing-masing. Aplikasi belum bisa
> menentukannya. Musyawarahkan dulu atau tanyakan ke ahli. Setelah itu, masukkan sebagai dua barang:
> "bagian Bapak" dan "bagian Ibu".

Catatan KHI yang sudah ada di ArifLab 2.2 tetap, berlabel **hukum positif, bukan fikih**.

### 2.5 Hitung dan hasil

**Hitung.** Tiap pemilik P, urut dari yang wafat paling dulu:
- `graf` sama, `idPewaris = P`;
- status hidup dan `urutanWafat` diturunkan relatif ke P (fungsi `turunkanDariWaktu` spec babak 8.3, ditambah
  parameter pemilik): yang wafat sebelum P berstatus `wafat`, yang wafat sesudah P masuk urutan;
- `tirkah.kotor` = jumlah nilai barang milik P, potongan dari 2.2;
- jalankan dispatch yang ada (`jalankan.ts`: gharqa / taqdir / munasakhat / biasa).

Pola "tiap anggota bergiliran jadi pewaris di graf yang sama" sudah dipakai `hitungGharqa`. Penjumlahan antar-
pemilik hanya penyajian: `bigint` per orang, di web (`src/gabungPemilik.ts`), bukan di engine.

**Invarian** (tes, bukan hanya tampilan): per pemilik, Σ nominal + sisa pembulatan = harta bersih P;
gabungan, Σ total per orang + Σ sisa pembulatan = Σ harta bersih semua pemilik.

**Lapis 1, dua tampilan** (tab sederhana, bawaan: Per orang):

- **Per orang yang masih hidup**: nama, total Rp. Di bawahnya asal bagian per pemilik ("dari harta Mbah Karto
  Rp a · dari harta Ibu Rp b"), lalu asal per jalur munasakhat seperti ArifLab 3.1.
- **Per barang**: tiap barang, siapa saja yang sekarang punya bagian, dalam persen (dari saham engine) dan Rp bila
  nilainya diisi. Keterangan: "Mereka semua perlu dilibatkan bila barang ini dijual atau dibalik nama." Bila
  pemiliknya punya utang: "Setelah utang {P} dilunasi."
- Hanya satu barang: tab disembunyikan, hasil seperti sekarang.
- Hasil per cabang (spec babak 8.5) tetap, di dalam tampilan Per orang.

## 3. Bagaimana kalau… (satu cara untuk semua yang belum pasti)

Aplikasi tidak lagi menolak semua hal yang belum pasti. Bila **tiap kemungkinan fakta bisa dihitung sebagai kasus
yang pasti**, aplikasi menghitung semuanya dan menampilkannya berdampingan. Aplikasi **tidak memilih** kemungkinan
mana yang berlaku bila KB tidak menentukannya (CLAUDE.md: tidak mengarang aturan).

| Jenis | Contoh | "Sekarang" | Kemungkinan |
|---|---|---|---|
| **A. Belum bisa diketahui siapa pun** | janin, orang hilang, kelamin belum jelas | Pembagian sekarang + disimpan dulu, sesuai KB 13 (engine taqdir) | Tiap `daftarDunia` engine: "Kalau bayinya 1 laki-laki…", "Kalau Arif masih hidup…" |
| **B. Pengguna tidak ingat** | urutan wafat, sebelum/sesudah, lahir sebelum/sesudah, barang milik siapa | Kalau semua kemungkinan hasilnya sama: satu hasil + catatan "tidak berpengaruh". Kalau beda: tidak ada satu jawaban; kemungkinan tampil berdampingan | Tiap jawaban alternatif (uji hipotetis spec babak 8.4) |
| **C. Faktanya jelas, tapi hukumnya belum bisa ditentukan aplikasi** | dua ahli waris lanjutan wafat bersamaan (E1/E2); janin dari suami lain bersama saudara seibu [SYF] (S21); syarat masa kandungan (E4) | Tidak ada. Pesan: "Aplikasi belum bisa menentukan mana yang berlaku. Ini perbandingan untuk bahan bertanya ke ahli faraidh." | Tiap fakta alternatif yang bisa dihitung ("kalau Budi lebih dulu", "kalau Rina lebih dulu"; "kalau bayinya laki-laki / perempuan / tidak lahir hidup") |
| **D. Tidak ada kemungkinan yang bisa dihitung tanpa mengarang aturan** | harta bersama (2.4), dibagi sebagian, utang/wasiat almarhum lain (2.2) | Pesan jujur, seperti sekarang | — |

Untuk E1, pesan jenis C ditambah satu kalimat dari KB 13d: orang yang wafat bersamaan tidak saling mewarisi,
dan hitungan untuk keadaan itu belum tersedia. Jadi urutan "Budi lebih dulu" / "Rina lebih dulu" jelas
berlabel perbandingan, bukan jawaban.

**Tampilan** (lapis 1, di atas daftar nama-Rp):

- Jenis A: "Pembagian sekarang" tetap utama. Bagian **Bagaimana kalau…** terlipat di bawahnya, satu baris per
  kemungkinan; dibuka → daftar nama-Rp dengan selisih terhadap "sekarang" (naik/turun).
- Jenis B dan C: kepala "Hasil ini bergantung pada {n} hal yang belum pasti", lalu pemilih kemungkinan
  (daftar pilihan, bukan tab kecil); tiap pilihan menampilkan daftar nama-Rp lengkap dengan selisih terhadap
  pilihan pertama. Tautan **Pastikan** di tiap hal membuka pertanyaannya (5).
- **Batas**: paling banyak `BATAS_KEMUNGKINAN_TAMPIL = 4` kemungkinan jenis B/C (dua hal yang belum pasti).
  Lebih dari itu → "Terlalu banyak yang belum pasti" + daftar hal dengan tautan Pastikan (pola `BATAS_DUNIA`).
  Kemungkinan jenis A tetap mengikuti `BATAS_DUNIA` engine.
- Kemungkinan tidak disimpan di `Kasus`; diturunkan tiap hitung: `(kasus, perubahan) => Kasus` lalu `jalankan`.

Perubahan pada spec babak: 1.7 (ditolak di dialog) dan 8.1 butir 3 (hitung ditahan) **diganti** dengan jenis B/C.
Dialog menyimpan jawaban "bersamaan / tidak tahu" apa adanya di `belumPasti` (7).

**Coba-coba.** Mekanisme yang sama dipakai untuk simulasi bebas: dari Hasil, tautan "Coba ubah sesuatu" membuka
sunting di tempat (5) dalam mode coba-coba. Perubahan tidak disimpan, hasil tampil sebagai kemungkinan
dibanding kasus tersimpan, dan ada tautan "Simpan perubahan ini". Blok kenapa (4) memakai ini untuk tautan
seperti "Bagaimana kalau Pak Slamet masih hidup waktu Mbah wafat?".

## 4. Kenapa dapat, kenapa tidak

Keluarga biasanya ribut karena ada bagian yang terasa tidak adil, bukan karena angkanya. Jadi **setiap orang di
graf** mendapat satu alasan, termasuk orang yang tidak menerima apa pun. Alasan diturunkan dari jejak engine
(data), dirangkai di `packages/explain` sebagai templat diksi. UI tidak memuat aturan fikih.

### 4.1 Katalog pola

Kalimat di bawah adalah **draf**. Kalimat final dirumuskan bersama tim keilmuan sebelum masuk snapshot diksi.

**Tidak mendapat bagian**

| # | Pola | Pemicu (jejak) | Draf kalimat | KB |
|---|---|---|---|---|
| T1 | Cucu dari anak yang wafat lebih dulu ("cucu yatim") | `HAJB_HIRMAN`, hajib = anak lk; ayah cucu wafat sebelum pewaris | "Pak Slamet wafat sebelum Mbah, jadi tidak mewarisi Mbah. Anak-anaknya terhalang oleh Budi, anak laki-laki Mbah yang masih hidup waktu Mbah wafat." | 2.2 syarat 2; 6.4 butir 2; 6.5 |
| T2 | Kakak/adik almarhum | `HAJB_HIRMAN`, hajib = anak lk / cucu lk / ayah | "Saudara terhalang oleh anak laki-laki {almarhum}." | 6.4 butir 3–4; 6.5 |
| T3 | Menantu, anak tiri, mertua, besan (langsung dari almarhum) | `BUKAN_AHLI_WARIS` alasan `tanpaSebab` (4.3) | "Menantu tidak mewarisi mertuanya. Dewi menerima dari Budi, sebagai istrinya." | 2.3 (sebab waris: nikah, nasab, wala') |
| T4 | Cucu dari anak perempuan, keponakan dari saudari, bibi, paman dari ibu | `BUKAN_AHLI_WARIS` alasan `dzawilArhamTerhalang` | "Kerabat dari jalur perempuan baru mendapat bagian bila tidak ada ahli waris utama." | 3.5; 14.1–14.3 |
| T5 | Wafat sebelum almarhum | `BUKAN_AHLI_WARIS` alasan `wafatSebelum` | "Budi wafat sebelum Mbah, jadi tidak mewarisi Mbah." | 2.2 syarat 2 |
| T6 | Anak yang dikandung sesudah kakeknya wafat | `BUKAN_AHLI_WARIS` alasan `dikandungSesudah` | "Dimas belum ada waktu Mbah wafat, jadi tidak mewarisi Mbah. Ia mewarisi Budi, ayahnya." | 13a.2 [R13-1] |
| T7 | Wafat sesudah almarhum tapi terhalang, jadi tidak ada yang diteruskan | `MUNASAKHAT_DILEWATI` | "Paman tidak mendapat bagian dari Mbah, jadi tidak ada yang diteruskan ke keluarganya." | 12.5 [R12-1] |
| T8 | Beda agama, terlibat kematian | `MANI` | Kalimat netral, tanpa menghakimi (riset K12) | 2.4 |
| T9 | Cerai sebelum almarhum wafat, iddah selesai | `BUKAN_AHLI_WARIS` alasan `tanpaSebab` | "Pernikahan sudah berakhir sebelum {almarhum} wafat." | 2.3 baris nikah |

**Mendapat bagian (yang sering mengejutkan)**

| # | Pola | Pemicu (jejak) | Draf kalimat | KB |
|---|---|---|---|---|
| D1 | Keluarga besan menerima harta Mbah | rantai `MUNASAKHAT`: penerima bukan keturunan pemilik | "Dewi menerima dari Budi sebagai istri. Bagian itu miliknya, lalu diteruskan ke keluarga Dewi waktu ia wafat." | 2.3; 12 [R12-1] |
| D2 | Satu orang menerima dua kali | orang yang sama muncul di > 1 mas'alah | "Mbah Sumi menerima sebagai istri Mbah Karto, lalu sebagai ibu Budi." | 12.3 langkah 6 |
| D3 | Paman/saudara menerima padahal ada anak perempuan | `ASHABAH` untuk hawasyi + anak pr `FARDH` | "Anak perempuan mendapat bagian tetap. Sisanya untuk kerabat laki-laki terdekat." | bab 5; 5.3 |
| D4 | Anak laki-laki dua kali anak perempuan | `ASHABAH` bilGhair | "Anak laki-laki mendapat dua kali bagian anak perempuan." + tautan hikmah | 5.5 |
| D5 | Kakek/nenek menerima padahal ada anak | `FARDH` ayah/ibu | "Ayah dan ibu almarhum tidak pernah terhalang oleh ahli waris lain." | 6.2 |
| D6 | Bagian istri kecil | `HAJB_NUQSHAN` | "Bagian istri menjadi 1/8 karena ada anak." | 6.3 |
| D7 | Semua bagian mengecil / membesar | `AUL` / `RADD` | Kalimat 'aul/radd yang sudah ada di explain | 9.3, 9.4 |
| D8 | Orang yang sudah wafat "menerima" | `MUNASAKHAT` | "Budi wafat sesudah Mbah, jadi Budi mewarisi. Bagiannya diteruskan ke keluarganya." | 12 [R12-1] |

### 4.2 Tampilan

- **Lapis 1**: tiap orang, satu kalimat pendek di bawah nama. Yang tidak menerima dilipat seperti ArifLab 3.1
  ("Tidak mendapat bagian (n)"), sekarang dengan alasan dari tabel T.
- **Lapis 2, blok "Yang sering ditanyakan keluarga"**, di atas langkah perhitungan, muncul hanya bila kasus
  mengandung T1, T3, D1, D2, atau D3. Tiap butir: pertanyaan dengan kata pengguna ("Kok keluarga Bu Dewi
  dapat?"), jawaban menurut fikih, dan tautan "Bagaimana kalau…" bila ada fakta yang bisa diubah (3, coba-coba).
- **T1 saja** mendapat catatan kedua berlabel **Hukum positif, bukan fikih**: KHI ps. 185 mengatur ahli waris
  pengganti secara berbeda; hitungan KHI adalah fase 4 terpisah. Aplikasi tidak memutuskan mana yang dipakai
  keluarga.
- **Jalan keluar yang disebut** hanya yang ada di KB: wasiat untuk bukan ahli waris ≤ 1/3 (bab 01) dan kerelaan
  ahli waris lewat takharuj (bab 11). Tanpa nasihat hukum.

### 4.3 Tambahan jejak engine: `BUKAN_AHLI_WARIS`

Engine sekarang tidak memancarkan apa pun untuk orang di graf yang bukan ahli waris (menantu, anak tiri, orang
yang wafat lebih dulu). Tanpa jejak, UI terpaksa menebak alasannya, dan itu berarti aturan fikih di UI.

```ts
| { jenis: 'BUKAN_AHLI_WARIS'; idOrang: IdOrang;
    alasan: 'tanpaSebab' | 'wafatSebelum' | 'dikandungSesudah' | 'dzawilArhamTerhalang' }
```

- Dipancarkan satu kali per orang di graf yang tidak menerima dan tidak punya jejak `MANI` / `HAJB_HIRMAN`.
- Hanya jejak; hasil hitung tidak berubah. Tes: semua fixture bab 16 tetap sama; tiap orang di graf punya tepat
  satu alasan (menerima, `MANI`, `HAJB_HIRMAN`, atau `BUKAN_AHLI_WARIS`).
- Anotasi rujukan sesuai tabel 4.1.

## 5. Sunting di tempat

Menambah atau mengubah orang dilakukan **dari orang yang terkait**, bukan dari dialog yang bertanya "anak dari
siapa".

- **Di Periksa dan Hasil**, keluarga tampil sebagai daftar bertingkat (komponen yang sama dengan silsilah, spec
  babak 8.2 S3). Tiap orang punya menu tautan:
  **+ Anak · + Pasangan · + Orang tua** (bila belum ada) **· + Saudara · Ubah keadaan · Hapus**.
- **Hubungan diturunkan dari orang yang diklik.**
  - "+ Anak" pada Budi → `idAyah = Budi`. Ibunya = pasangan Budi bila hanya satu. Bila lebih dari satu, satu
    pertanyaan: "Dari istri yang mana?" (pilihan + "istri lain, tidak dicatat").
  - "+ Saudara" pada Budi → saudara kandung bawaan; tautan kecil "satu ayah saja / satu ibu saja".
  - "+ Orang tua" membuat node lewat `pastikanOrangTua`.
- **Dialog tambah = satu layar**: nama (opsional), jenis kelamin, keadaan (Masih hidup bawaan; pilihan lain
  membuka `DialogKeadaan`). Tidak ada pertanyaan hubungan.
- Pembangun graf yang dipakai sudah ada: `tambahOrang`, `pastikanOrangTua`, `tambahSaudara`, `hapusAhliWaris`
  (dengan konfirmasi yang menyebut siapa saja yang ikut terhapus, spec babak 2.3).
- **Di Hasil**, tiap perubahan langsung dihitung ulang dan disimpan, dengan tautan **Batalkan perubahan
  terakhir**. Mode coba-coba (3) memakai menu yang sama tanpa menyimpan.
- Daftar ± (`LangkahAhliWaris`) tetap untuk isian cepat di langkah 3. Keduanya mengubah graf yang sama.

## 6. Beranda, simpan, lembar, berkas, catatan resmi

### 6.1 Beranda dari situasi

"Apa yang ingin kamu ketahui?" (register santai):
- **Harta keluarga belum dibagi sejak lama** → pertanyaan pintu (spec babak 1.0) otomatis `turunTemurun`, jalur
  silsilah.
- **Seseorang baru saja wafat** → alur biasa; pertanyaan pintu tetap ditanyakan.
- **Saya sedang belajar faraidh** → Belajar.

### 6.2 Simpan dan lanjut nanti

Tautan "Simpan, lanjut nanti" di tiap layar isian. Kasus masuk Riwayat berstatus **belum selesai** beserta daftar
yang masih kurang (dari `alasanBelumLengkap` dan hal yang belum pasti di bagian 3). Kalimat tidak menyalahkan:
"Tidak apa-apa. Kita catat dulu, lengkapi kapan saja."

### 6.3 Lembar musyawarah

Satu halaman A4 lewat `@media print` dari data hasil yang sudah ada. Isinya:
- judul "Pembagian harta {pemilik…} (menurut madzhab {x})";
- daftar barang;
- pohon kecil tanpa angka;
- tabel per orang: nama, total Rp, asal per pemilik, satu kalimat alasan (4);
- kemungkinan bila ada, ringkas ("Bila Budi wafat sebelum Mbah: …");
- catatan 6.5.

Tanpa tabel munasakhat, tanpa istilah Arab. Tabel lengkap tetap di Ekspor untuk praktisi.

### 6.4 Kirim ke keluarga (versi berkas)

Ekspor/impor berkas kasus yang sudah ada (`berkas.ts`, `bacaKasus` sebagai batas kepercayaan) diberi label
"Kirim ke keluarga untuk dilengkapi" dan keterangan cara mengirim balik. Tautan bersama dengan login ditunda.

### 6.5 Catatan urusan resmi

Di Hasil dan lembar: "Hasil ini membantu keluarga memahami pembagian menurut fikih. Surat keterangan waris dan
balik nama mengikuti ketentuan lembaga berwenang. Tanyakan ke ahli faraidh atau pengadilan agama setempat."

## 7. Model data: `Kasus` versi 4 (belum dibangun, digabung)

Menggantikan rancangan v4 di spec babak 8.3 pada tiga titik: `hartaPernahDibagi` dihapus, `harta` dan
`kewajiban` ditambah, `gharqa.tirkah` dilebur.

```ts
interface BarangHarta {
  id: string;
  nama: string;
  /** Kosong = tampil persen saja. */
  nilai?: bigint;
  /** Satu pemilik, atau calon pemilik bila pengguna tidak tahu (→ kemungkinan jenis B). */
  pemilik: IdOrang | { calon: IdOrang[] };
}

type HalBelumPasti =
  | { jenis: 'urutan'; a: IdOrang; b: IdOrang; bersamaan: boolean } // bersamaan = jenis C (E1), selain itu B
  | { jenis: 'sebelumSesudah'; idOrang: IdOrang; relatifKe: IdOrang }
  | { jenis: 'lahir'; anak: IdOrang; almarhum: IdOrang };

interface Kasus {
  versi: 4;
  graf: GrafKeluarga;
  harta: BarangHarta[];                                   // menggantikan tirkah.kotor dan rincianHarta
  kewajiban: Record<IdOrang, Omit<InputTirkah, 'kotor'>>; // per pemilik (2.2)
  satuanPembulatan: bigint;
  urutanWafat: IdOrang[];
  dikandungSetelahWafat?: Record<IdOrang, IdOrang>;
  gharqa?: { anggota: IdOrang[]; keadaan: KeadaanGharqa };  // harta anggota = barang dengan pemilik itu
  wafatSesudahDibagi?: IdOrang[];                         // hanya dari migrasi v3; UI baru tidak membuatnya
  /** Jawaban "tidak tahu" / "bersamaan" yang disimpan apa adanya; sumber kemungkinan jenis B/C (3). */
  belumPasti?: HalBelumPasti[];
  pilihanJanin?: 'tunggu' | 'hitungSekarang';
  jalur: 'babak' | 'silsilah';
  pintu?: 'tidakAda' | 'sedikit' | 'turunTemurun' | 'tidakTahu';
  waktu?: Record<IdOrang, { wafat?: TanggalKira; lahir?: TanggalKira }>;
}
```

- **Migrasi v3 → v4**: `tirkah.kotor` → satu barang "Harta {pewaris}" milik pewaris; potongan → `kewajiban[pewaris]`;
  `gharqa.tirkah[id]` → barang milik `id` + `kewajiban[id]`; `rincianHarta` → nama barang (satu barang per
  kategori yang terisi); `wafatSesudahDibagi` tetap.
- **`bacaKasus`**: `pemilik` ada di graf dan berstatus wafat (atau pewaris); `calon` 2–3 orang; `nilai ≥ 0`;
  `kewajiban` hanya untuk pemilik yang ada; minimal satu barang.
- **`rapikanKeadaan`**: entri `belumPasti` yang orangnya hilang dari graf dibuang; hal yang terjawab pasti
  dipindah ke `urutanWafat` / `statusHidup` / `dikandungSetelahWafat`. Barang dengan pemilik yang dihapus dari graf ikut dihapus **setelah konfirmasi** yang
  menyebut nama barangnya.

## 8. Unit

| Unit | Tanggung jawab |
|---|---|
| `packages/engine` | jejak `BUKAN_AHLI_WARIS` (4.3) |
| `packages/explain` | kalimat alasan T/D dan blok "Yang sering ditanyakan" sebagai templat diksi |
| `src/kasus.ts` | `Kasus` v4, migrasi, `bacaKasus`, `rapikanKeadaan` |
| `src/silsilah.ts` | `turunkanDariWaktu(kasus, pemilik)` |
| `src/jalankan.ts` | hitung per pemilik (2.5) |
| `src/gabungPemilik.ts` | jumlah per orang, per barang; invarian 2.5 |
| `src/kemungkinan.ts` | daftar hal belum pasti (jenis B/C), `(kasus, perubahan) => Kasus`, batas tampil |
| `src/layar/wizard/LangkahHarta.tsx` | daftar barang (2.1), kewajiban per pemilik (2.2) |
| `src/layar/keadaan/HartaAlmarhumLain.tsx` | 2.3 |
| `src/layar/SuntingPohon.tsx` | daftar bertingkat + menu per orang (5) |
| `src/hasil/HasilGabungan.tsx`, `BagaimanaKalau.tsx`, `YangSeringDitanyakan.tsx` | 2.5, 3, 4.2 |
| `src/gaya/cetak.css` | lembar musyawarah (6.3) |

## 9. Tes

- **Engine**: `BUKAN_AHLI_WARIS` untuk menantu, orang wafat sebelum pewaris, anak dikandung sesudah, dzawil
  arham terhalang; fixture bab 16 tidak berubah; tiap orang tepat satu alasan.
- **Fixture tumpukan harta**, dibuat dan dicocokkan ke bab 12 **sebelum** logika UI: Ibu wafat 2010 (emas),
  Bapak 2020 (rumah), 4 anak; dan kasus turun-temurun spec babak 8.7 ditambah harta Budi sendiri. Hasil per
  pemilik = hitung manual per kasus terpisah (KB 12.5); gabungan = jumlahnya.
- `gabungPemilik`: invarian 2.5; barang tanpa nilai tampil persen dan tidak ikut total Rp.
- `kemungkinan`: urutan yang tidak berpengaruh → satu hasil; "tidak tahu milik siapa" → satu kemungkinan per
  calon; > 4 → daftar Pastikan; E1 → dua kemungkinan berlabel perbandingan.
- `turunkanDariWaktu` dengan pemilik bukan pewaris pertama.
- Migrasi v3 → v4 (termasuk gharqa dan `rincianHarta`), `bacaKasus` menolak pemilik yang tidak ada.
- Komponen: kasus biasa tanpa layar tambahan; "Milik berdua" → pesan jujur; "+ Anak" pada orang dengan satu
  istri tidak bertanya ibu; Hasil satu barang tanpa tab; blok "Yang sering ditanyakan" hanya muncul bila polanya ada.

## 10. Urutan pengerjaan

1. Kata tampil: "babak" dan "dunia" diganti (1). Perbaikan cepat, berdiri sendiri.
2. Jejak `BUKAN_AHLI_WARIS` + kalimat alasan lapis 1 (4.3, 4.2 butir 1).
3. Sunting di tempat (5).
4. Fixture tumpukan harta, lalu `Kasus` v4 + migrasi.
5. Daftar barang + kewajiban per pemilik + hitung per pemilik + hasil dua tampilan (2).
6. Bagaimana kalau: jenis A (relabel taqdir), lalu B, lalu C; coba-coba (3).
7. Blok "Yang sering ditanyakan" (kalimat menunggu tim keilmuan) (4.2).
8. Beranda, simpan lanjut nanti, lembar musyawarah, label kirim berkas, catatan resmi (6).

## Di luar cakupan

- Harta bersama suami-istri: pesan jujur (2.4).
- Harta yang sudah dibagi sebagian; uang sewa atau hasil barang yang sudah dinikmati salah satu ahli waris.
- Utang melebihi harta milik sendiri, dan wasiat, untuk pemilik yang bukan pertama (2.2).
- Siapa mengambil barang apa (qismah/takharuj bab 11): hanya tautan edukasi.
- Tautan bersama dengan login untuk kerabat (6.4).
- Hitungan KHI (fase 4).
