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
| | 2.6 Kerabat jauh | diperluas dengan hubungan bukan ahli waris (5.2) |
| | 3.5 Pohon di HP | pohon ↔ daftar bertingkat, syarat pohon (5.5) |
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
| 9 | "Ada yang salah, anak Budi kurang satu." / "Mertua dan besan juga perlu dicatat?" | Tambah siapa saja dari orang terkait atau dari nama hubungan | 5.1–5.3 |
| 10 | "Ini bukan keluarga saya, posisinya aneh." | Pohon dengan syarat yang dites | 5.5 |
| 11 | "Harus menjelaskan ke Paman 70 th di rapat keluarga." | Lembar musyawarah | 6.3 |
| 12 | "Bisa dipakai untuk notaris?" | Catatan bukan dokumen resmi | 6.5 |

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

## 5. Keluarga: tambah siapa saja, pohon yang benar

Pengguna harus bisa memasukkan **siapa pun** yang ada di ceritanya, termasuk yang bukan ahli waris (mertua,
besan, anak tiri, anak angkat). Ada dua alasan:
- dalam munasakhat, orang itu bisa mewarisi almarhum berikutnya (orang tua Dewi mewarisi Dewi);
- kalau pun tidak mewarisi, pengguna melihat alasannya (4.1 T3) dan tidak merasa ada yang terlupa.

UI hanya menyusun graf dan memberi nama hubungan. Siapa yang mewarisi tetap diputuskan engine.

### 5.1 Tambah dari orang yang terkait

Menambah atau mengubah orang dilakukan **dari orang yang terkait**, bukan dari dialog "anak dari siapa".

- Di langkah Keluarga, Periksa, dan Hasil, keluarga tampil sebagai **pohon** (5.5) atau **daftar bertingkat**
  (komponen yang sama dengan silsilah, spec babak 8.2 S3), dan keduanya bisa dipindah dengan satu tautan.
- Tiap orang punya menu tautan: **+ Orang tua · + Pasangan · + Anak · + Saudara · Ubah · Hapus**.
- Hubungan diturunkan dari orang yang diklik:

  | Aksi pada X | Hasil di graf | Pertanyaan tambahan |
  |---|---|---|
  | + Orang tua | ayah/ibu X (`tambahKerabat` 'ayah'/'ibu') | tidak ada; pilihan yang sudah terisi tidak tampil |
  | + Pasangan | istri/suami X; jenis kelamin dari X | "Masih suami-istri waktu X wafat?" hanya bila X sudah wafat (spec babak S14) |
  | + Anak | anak X; orang tua lain = pasangan X bila hanya satu | bila pasangan > 1: "Dari istri yang mana?" (+ "istri lain, tidak dicatat") |
  | + Saudara | anak dari orang tua X (orang tua dibuat sebagai penghubung bila belum ada) | "Satu ayah dan satu ibu" (bawaan) / "Satu ayah saja" / "Satu ibu saja" |
  | Ubah | nama, jenis kelamin (bila `bolehUbahJenisKelamin`), keadaan (`DialogKeadaan`) | — |
  | Hapus | `hapusAhliWaris` | konfirmasi yang menyebut siapa saja yang ikut terhapus (spec babak 2.3) |

- Dialog tambah hanya **satu layar**: nama (opsional), jenis kelamin (bila tidak diturunkan dari hubungan), dan
  keadaan (Masih hidup bawaan).
- Penyusun graf yang dipakai sudah ada: `tambahKerabat` / `opsiRelasi` di engine (`graf.ts`, termasuk batas 4
  istri [R04-3]), serta `pastikanOrangTua`, `tambahSaudara`, dan `tambahOrang` di `checklist.ts` yang diekspor.
- **Di Hasil**, tiap perubahan langsung dihitung ulang dan disimpan, dengan tautan **Batalkan perubahan
  terakhir**. Mode coba-coba (3) memakai menu yang sama tanpa menyimpan.
- Daftar ± (`LangkahAhliWaris`) tetap untuk isian cepat. Keduanya mengubah graf yang sama.

### 5.2 Tambah dengan nama hubungan

Tidak semua orang mau mencari "orang tua dari istri Budi". Di bawah pohon/daftar ada tautan **Tambah kerabat
lain**: daftar nama hubungan yang bisa dicari. Daftar ini memperluas ArifLab 2.6 (kerabat jauh) dengan hubungan
yang bukan ahli waris.

Tiap nama hubungan adalah **jalur** dari orang yang sedang dilihat (pusat, bawaannya almarhum bagian itu) lewat
aksi 5.1. Bila jalurnya lewat orang yang belum pasti, aplikasi menanyakan **jangkar**, yaitu orang yang
menghubungkan. Pilihannya diambil dari graf, ditambah "orang lain, belum dicatat" yang dibuat sebagai
penghubung.

| Nama hubungan (dari sisi pusat P) | Jalur | Jangkar yang ditanyakan |
|---|---|---|
| Ayah, ibu | orang tua | — |
| Kakek, nenek (dari ayah / dari ibu) | orang tua → orang tua | — (sisi dipilih di nama) |
| Buyut | orang tua ×3 | sisi |
| Anak, cucu, cicit | anak ×1/2/3 | anak/cucu yang mana |
| Suami, istri | pasangan | — |
| Saudara (kandung / seayah / seibu) | saudara | — |
| Paman, bibi (dari ayah / dari ibu) | orang tua → saudara | — |
| Sepupu | orang tua → saudara → anak | paman/bibi yang mana |
| Keponakan | saudara → anak | saudara yang mana |
| **Mertua** | pasangan → orang tua | pasangan yang mana (bila > 1) |
| **Menantu** | anak → pasangan | anak yang mana |
| **Besan** | anak → pasangan → orang tua | menantu yang mana |
| **Ipar** | pasangan → saudara, atau saudara → pasangan | "saudara dari pasangan" / "pasangan dari saudara", lalu orangnya |
| Cucu menantu | cucu → pasangan | cucu yang mana |
| **Anak tiri** | pasangan → anak (orang tua lain ≠ P) | pasangan yang mana |
| Ayah / ibu tiri | orang tua → pasangan (≠ orang tua P yang lain) | orang tua yang mana |
| **Saudara tiri** | tidak ada orang tua yang sama | ditanya dulu: "Ada ayah atau ibu yang sama?" Ya → Saudara seayah/seibu; Tidak → orang tua tiri → anak |
| Mantan istri / suami | pasangan, status `talakBain` | — |
| **Anak angkat, anak asuh** | tanpa nasab (5.3) | orang tua angkatnya |

Catatan kata: di Indonesia "saudara tiri" sering dipakai untuk saudara seayah atau seibu, dan mereka **ahli
waris**. Karena itu pertanyaan "Ada ayah atau ibu yang sama?" wajib ditanyakan.

### 5.3 Anak angkat: hubungan tanpa nasab

Graf engine hanya mengenal nasab (`idAyah`, `idIbu`) dan pernikahan. Anak angkat tidak punya keduanya, jadi:
- orangnya masuk graf **tanpa** `idAyah`/`idIbu` ke orang tua angkat. Engine melihatnya tak berhubungan dan
  memancarkan `BUKAN_AHLI_WARIS` alasan `tanpaSebab` (4.3);
- hubungan tampilnya disimpan di web: `Kasus.hubunganLain` (7), digambar sebagai garis putus-putus di pohon
  berlabel "anak angkat";
- penjelasan T3 berlaku ("Anak angkat tidak mewarisi karena tidak ada hubungan nasab"). Ditambah catatan
  berlabel **Hukum positif, bukan fikih**: KHI mengatur wasiat wajibah untuk anak angkat; hitungannya fase 4.
  Jalan yang ada di KB: wasiat untuk bukan ahli waris ≤ 1/3 (bab 01).
- Tes engine: orang tanpa hubungan di graf tidak mengubah hasil dan mendapat tepat satu alasan.

### 5.4 Nama hubungan di semua tempat

Setiap orang disebut dengan nama hubungan **dari sisi pusat yang sedang dilihat** ("Siti · ibu Budi",
"Pak Harjo · besan Mbah Karto"). Sebutan ini penyajian, bukan fikih:
- fungsi murni `sebutanHubungan(graf, idPusat, idOrang)` di `packages/explain`, di sebelah sebutan bertingkat
  yang sudah ada (branch pohon bebas);
- mencari jalur terpendek lewat orang tua / anak / pasangan, lalu mencocokkannya dengan tabel 5.2;
- bila tak ada nama baku, sebutan bersusun: "anak dari sepupu Budi";
- orang dengan dua jalur (Mbah Sumi: istri Mbah dan ibu Budi) disebut menurut pusat yang sedang dilihat, dan di
  Hasil kedua perannya tampil (4.1 D2);
- peran ahli waris dari engine (`labelPeran`) tetap dipakai untuk penerima di hasil. `sebutanHubungan` dipakai
  untuk orang lain dan di pohon;
- kata disimpan di diksi (`narasi.hubungan.*`), bukan hardcode.

### 5.5 Pohon keluarga yang benar

Pohon adalah tempat pengguna mengecek "ini keluarga saya". Satu kotak yang salah tempat membuat seluruh hasil
tidak dipercaya. Karena itu syarat pohon ditulis sebagai **invarian yang dites**, bukan kesan visual.

**Invarian tata letak** (dites otomatis pada galeri fixture di bawah):

| # | Syarat |
|---|---|
| P1 | Tiap orang tepat **satu kotak**, walau terhubung lewat dua jalur. |
| P2 | Satu baris = satu generasi terhadap pusat. Pasangan ditaruh di baris pasangannya yang sedarah; bila keduanya sedarah dan beda generasi, garis nikah boleh miring. |
| P3 | Pasangan bersebelahan. Suami dengan beberapa istri: istri berderet di satu sisi, urut pernikahan, tiap garis nikah terpisah. |
| P4 | Anak tergantung dari **titik nikah** orang tuanya, bukan dari satu orang. Anak dari pernikahan berbeda terpisah per pernikahan. Anak tanpa orang tua lain tercatat tergantung dari satu orang tuanya. |
| P5 | Graf berbentuk pohon (tanpa pernikahan antar-kerabat): **nol** garis bersilangan dan nol kotak bertumpuk. Graf dengan pernikahan antar-kerabat: nol kotak bertumpuk, silang sesedikit mungkin, P1 tetap. |
| P6 | Keluarga asal pasangan (mertua, besan, ipar) mengelompok di atas pasangan itu dan tidak menyela garis keturunan utama. |
| P7 | Urutan stabil: menambah satu orang tidak memindahkan orang lain ke sisi berbeda. Saudara urut lahir bila tahun diisi, selain itu urut ditambahkan. |
| P8 | Penghubung (orang buatan sistem) tampil sebagai kotak kecil "belum dinamai", bisa diketuk untuk diberi nama. |
| P9 | Hubungan tanpa nasab (5.3) digambar putus-putus dan tidak memengaruhi generasi. |

**Tanda keadaan di kotak** (ikon SVG + teks, tidak hanya warna):
- wafat (+ tahun, "sebelum/sesudah {almarhum}");
- hilang;
- dalam kandungan (kotak putus-putus);
- kelamin belum jelas;
- beda agama;
- bercerai (garis nikah putus-putus).

Di Hasil ada tambahan: penerima ditonjolkan beserta nominal (bisa disembunyikan), yang tidak menerima diredupkan,
dan mengetuk kotak menampilkan alasannya (4.1).

**Interaksi**
- **Lihat dari sisi orang ini**: pusat bisa dipindah ke siapa saja. Nama hubungan (5.4) dan generasi ikut
  berubah. Bawaannya almarhum bagian yang sedang diisi; di Hasil, pemilik harta pertama.
- Mengetuk kotak membuka menu 5.1. Tombol "+" kecil di tepi kotak menjadi jalan pintas + Anak / + Pasangan /
  + Orang tua.
- **Pohon besar** (> 25 orang): cabang yang seluruhnya hidup dan tidak menerima bisa dilipat ("+3 orang"). Di
  desktop bisa diperbesar dan digeser; di HP daftar bertingkat menjadi tampilan bawaan dan pohon dibuka layar
  penuh.
- **Aksesibilitas**: daftar bertingkat adalah padanan pohon untuk pembaca layar. Kotak di pohon bisa difokus
  dengan keyboard, dan menunya dibuka dengan Enter.

**Algoritma.** Pengurutan satu kali per generasi di `tataLetak.ts` diganti **tata letak berlapis dengan simpul
nikah**:
1. lapis = generasi (P2);
2. tiap pernikahan yang punya anak menjadi simpul di antara lapis orang tua dan lapis anak;
3. pengurangan silang: urut barycenter bolak-balik atas-bawah sampai tidak membaik (paling banyak 24 putaran),
   ditambah tukar tetangga, dengan blok pasangan tidak dipisah;
4. posisi: anak berpusat di bawah simpul nikahnya, orang tua di atas anak-anaknya, tumpukan diselesaikan dengan
   menggeser subpohon.

Semua langkah deterministik. `ponytail:` implementasi sendiri dulu (± 200 baris, tanpa dependency). Bila galeri
fixture masih melanggar P5, baru pertimbangkan `d3-dag` (sugiyama) sebagai dependency.

**Galeri fixture pohon** (tiap fixture dicek P1–P9 dan disimpan sebagai gambar pembanding):
1. kasus biasa (istri, 2 anak);
2. turun-temurun 4 generasi ± 40 orang (spec babak 8.7);
3. poligami 2 istri, anak masing-masing;
4. janda menikah lagi, anak dari dua suami (S12);
5. suami pewaris menikahi saudari pewaris (S11);
6. sepupu menikah (pernikahan antar-kerabat);
7. besan dua sisi: dua anak menikah, satu besan wafat;
8. anak tanpa ibu tercatat, dan penghubung tak bernama;
9. anak angkat dan anak tiri;
10. janin, orang hilang, kelamin belum jelas, cerai;
11. pusat dipindah dari Mbah ke cucu (label dan generasi berubah, P1 tetap).

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
  /** Hubungan tanpa nasab, hanya tampilan (5.3). Engine tidak menerimanya. */
  hubunganLain?: Array<{ jenis: 'anakAngkat' | 'anakAsuh'; idAnak: IdOrang; idOrangTua: IdOrang }>;
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
  `kewajiban` hanya untuk pemilik yang ada; minimal satu barang;
  `hubunganLain` hanya berisi orang yang ada, dan anaknya tidak punya `idAyah`/`idIbu` ke orang tua angkat itu.
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
| `packages/explain` (`sebutanHubungan`) | nama hubungan dari sisi pusat (5.4) |
| `src/checklist.ts` | ekspor `pastikanOrangTua`, `tambahSaudara`, `tambahOrang`; jalur nama hubungan 5.2 (`tambahMenurutHubungan`) |
| `src/hasil/tataLetak.ts` | tata letak berlapis dengan simpul nikah (5.5) |
| `src/layar/SuntingPohon.tsx` | pohon/daftar bertingkat + menu per orang (5.1), tambah kerabat lain (5.2) |
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
- `tambahMenurutHubungan`: tiap baris tabel 5.2 menghasilkan graf yang benar; "saudara tiri" dengan orang tua
  sama → saudara seayah/seibu; anak angkat tanpa `idAyah`/`idIbu` + entri `hubunganLain`.
- `sebutanHubungan`: tiap baris tabel 5.2 dari dua pusat berbeda; orang dengan dua jalur; sebutan bersusun.
- `tataLetak`: galeri fixture 5.5, P1–P9 dicek otomatis (tumpukan kotak, jumlah silang, pasangan bersebelahan,
  anak di bawah simpul nikah, stabil setelah tambah satu orang).
- Komponen: kasus biasa tanpa layar tambahan; "Milik berdua" → pesan jujur; "+ Anak" pada orang dengan satu
  istri tidak bertanya ibu; Hasil satu barang tanpa tab; blok "Yang sering ditanyakan" hanya muncul bila polanya ada.

## 10. Urutan pengerjaan

1. Kata tampil: "babak" dan "dunia" diganti (1). Perbaikan cepat, berdiri sendiri.
2. Jejak `BUKAN_AHLI_WARIS` + kalimat alasan lapis 1 (4.3, 4.2 butir 1).
3. Tata letak pohon + galeri fixture (5.5), `sebutanHubungan` (5.4).
4. Tambah dari orang terkait dan dari nama hubungan, anak angkat (5.1–5.3).
5. Fixture tumpukan harta, lalu `Kasus` v4 + migrasi.
6. Daftar barang + kewajiban per pemilik + hitung per pemilik + hasil dua tampilan (2).
7. Bagaimana kalau: jenis A (relabel taqdir), lalu B, lalu C; coba-coba (3).
8. Blok "Yang sering ditanyakan" (kalimat menunggu tim keilmuan) (4.2).
9. Beranda, simpan lanjut nanti, lembar musyawarah, label kirim berkas, catatan resmi (6).

## Di luar cakupan

- Harta bersama suami-istri: pesan jujur (2.4).
- Harta yang sudah dibagi sebagian; uang sewa atau hasil barang yang sudah dinikmati salah satu ahli waris.
- Utang melebihi harta milik sendiri, dan wasiat, untuk pemilik yang bukan pertama (2.2).
- Siapa mengambil barang apa (qismah/takharuj bab 11): hanya tautan edukasi.
- Tautan bersama dengan login untuk kerabat (6.4).
- Hitungan KHI (fase 4).
