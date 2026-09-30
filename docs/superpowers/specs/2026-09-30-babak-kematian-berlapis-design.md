# Spec: Babak Kematian Berlapis (langkah 4–5, jalankan, hasil minimal)

Tanggal: 2026-09-30 · Status: bagian 1–7 sudah dibangun; revisi 1.0, 1.1, bagian 8 (jalur silsilah) disetujui
2026-09-30, belum dibangun
Dasar: `docs/design/riset-ux-input-kematian-berlapis.md` (riset + keputusan 12.2), sketsa
https://claude.ai/artifact/72YVQXeaogX2Abr54gnBeq. KB: bab 12, 13, 13a–13d.

## Tujuan

Pengguna awam (target: siswa SMP) bisa menyusun kasus munasakhat, janin (haml), orang hilang (mafqud),
khuntsa, dan wafat bersamaan (gharqa) **tanpa memilih istilah fikih**, cukup dengan menjawab keadaan tiap orang.
Engine menerima data yang tepat; hasil bab 13 tampil dalam versi minimal.

Sukses bila: skenario S1–S32 riset (yang didukung engine) bisa disusun lewat UI dan menghasilkan input engine
yang sama dengan fixture; kasus biasa tidak bertambah satu layar pun.

Madzhab tetap `'syafii'` (pilihan madzhab = spec lain). Pewaris yang hilang (mafqud sebagai pewaris) di luar cakupan.

## 1. Alur layar

### 1.0 Pertanyaan pintu (revisi 2026-09-30, lihat bagian 8)

Di atas daftar keluarga langkah 4, satu layar yang sama (bukan layar tambahan), **wajib dijawab, tanpa bawaan**:

> **Sejak [pewaris] wafat sampai sekarang, apakah ada keluarganya yang juga sudah wafat, sementara hartanya belum
> dibagi?**
> - Tidak ada → alur 1.1 seperti biasa.
> - Ada, satu-dua orang dari keluarga dekatnya → alur 1.1, pertanyaan penutup langsung terbuka di "Ada".
> - Sudah turun-temurun: anak-anaknya pun banyak yang sudah wafat → **jalur silsilah** (bagian 8).
> - Tidak tahu → jalur silsilah (menanyakan keadaan semua orang, jadi paling aman).

Tanpa bawaan karena bawaan "Tidak ada" mengulang kegagalan yang dikritik: pengguna hanya mengetik yang hidup
sekarang, munasakhat terlewat diam-diam. Tautan "Tampilkan sebagai silsilah" / "Tampilkan sebagai babak" ada di
kedua jalur; datanya sama (2.1), jadi pindah tidak menghapus isian.

### 1.1 Langkah 4 · Keluarga — Babak 1 (pewaris)

- Baris "− jumlah +" (`LangkahAhliWaris`) tetap.
- **Judul berjangkar waktu** (revisi 2026-09-30): "Siapa saja keluarga [pewaris] yang masih hidup **waktu beliau
  wafat**?" + keterangan "Termasuk yang sekarang sudah meninggal. Nanti kita tanyakan." Menggantikan
  "Siapa saja keluarga yang ditinggalkan?", yang dibaca pengguna sebagai "yang masih ada sekarang".
- **Pertanyaan penutup** di bawah daftar: "Semua orang di atas masih hidup?"
  - **Ya, masih hidup semua** (bawaan).
  - **Ada yang sudah wafat atau hilang** → daftar orang babak ini + keadaannya ("masih hidup", "wafat sesudah
    Pak Ahmad", "hilang", …). Ketuk orang → **Dialog keadaan**.
  - Kembali ke "Ya" padahal ada keadaan terisi → dialog konfirmasi yang menyebut apa yang akan dihapus.
- **Dialog keadaan** (satu pertanyaan per layar, `Dialog` yang sudah ada):
  1. Keadaan: Masih hidup / Sudah wafat / Hilang, tidak ada kabar / tautan **Keadaan lain ›**
     (Masih dalam kandungan; Kelaminnya belum bisa ditentukan — hanya untuk hubungan yang mungkin, 13c.1).
  2. Sudah wafat → "X wafat sebelum atau sesudah [almarhum babak]?" Sebelum / Sesudah / Bersamaan, atau tidak tahu.
     Tautan "Kenapa ditanya?".
  3. Sesudah → **sekali per harta** (revisi 2026-09-30, menggantikan "per orang"): pertama kali ada jawaban
     "sesudah", tanya "Sejak [pewaris] wafat, apakah hartanya pernah dibagi?" + definisi "dibagi".
     Belum pernah (disimpan di `hartaPernahDibagi`) → pertanyaan ini tidak muncul lagi untuk orang berikutnya.
     Sudah / sebagian → pertanyaan lama "Waktu X wafat, apakah harta [pewaris] sudah dibagi?" per orang.
     Tautan "Untuk X berbeda" di ringkasan tetap bisa menandai satu orang `wafatSesudahDibagi`.
  4. Hilang → "Sudah ada putusan pengadilan bahwa X dianggap wafat?" Belum ada / Sudah ada (→ langkah 2) /
     Ternyata sudah pasti wafat, tapi tidak tahu kapan (→ jalur bersamaan).
  5. Bersamaan → G1 "Pasti wafat di saat yang sama persis?" (Ya → serentak); G2 "Dulu pernah ada yang tahu siapa
     yang terakhir?" (lupa → terlupakan; tidak pernah → tidakDiketahui; sekarang tahu → kembali ke langkah 2 sebagai
     sesudah/sebelum). Lalu "X juga punya harta sendiri?" (isian uang, boleh dilewati).
  6. Kelamin belum jelas → "Sudah dewasa (baligh)?" Belum / Sudah dan tetap belum jelas.
  7. Masih dalam kandungan (dari Keadaan lain) → sama dengan dialog janin 1.3 langkah 3–4.
- **Siapa lebih dulu**: bila ≥ 2 orang "wafat sesudah, belum dibagi", orang baru disisipkan dengan pertanyaan
  berpasangan "Siapa yang wafat lebih dulu: A atau B?" (+ "Bersamaan, atau tidak tahu"), pencarian biner:
  2 orang = 1 pertanyaan, 3 ≤ 3, 4 ≤ 5. Orang dari babak k hanya dibanding dengan yang wafat sesudah almarhum babak k.
- **Pertanyaan hamil** di akhir babak: "Waktu [almarhum] wafat, apakah ada yang sedang hamil di keluarga ini?"
  Tidak ada (bawaan) / Ada → dialog janin (1.3).

### 1.2 Langkah 4 · Babak 2..n

- Stepper tetap 5 langkah. Langkah 4 bersub-judul "Babak k dari n · [nama]". Lanjut/Kembali berpindah antar-babak
  dulu, baru antar-langkah.
- Isi babak:
  1. Pembuka: "[X] wafat sesudah [almarhum sebelumnya], sebelum hartanya dibagi. Jadi bagian [X] dari harta
     [pewaris] diteruskan kepada keluarga [X]. Sekarang kita lihat dari sisi [X]." + catatan harta X sendiri
     tidak ikut dihitung (12.5) dengan tautan "Hitung warisan X" (kasus baru).
  2. Pohon kecil berpusat ke X (`PohonDasar`, sebutan dari sisi X).
  3. **Dari orang yang sudah ada**: orang di graf yang kerabat X dicentang otomatis, dengan sebutan dari sisi X
     ("Siti · bagi Budi: ibu"); keterangan "Sudah kami centang dari babak sebelumnya. Hapus centang bila keliru."
     Orang yang wafat sebelum X tampil nonaktif dengan alasannya. Hapus centang = orang itu diputus hubungannya
     dengan X hanya bila hubungan itu dibuat di babak ini; hubungan darah dari babak sebelumnya tidak bisa diputus
     (centang terkunci dengan keterangan).
  4. `LangkahAhliWaris` dengan `idMayit = X` untuk orang baru (termasuk pasangan dipilih dari orang yang sudah ada, S11).
  5. Pertanyaan penutup + pertanyaan hamil yang sama → babak k+1 bisa lahir dari babak k.
- Tanpa almarhum lanjutan, langkah 4 = satu babak seperti sekarang.

### 1.3 Dialog janin

1. Siapa yang hamil? Pilihan disaring ke perempuan yang janinnya bisa mewarisi almarhum babak (13a.1).
2. Janin dari siapa? Suaminya di data / Suami lain.
3. Bayinya sudah lahir? Belum lahir / Sudah lahir, masih hidup (→ jenis kelamin, kembar?) /
   Sudah lahir, lalu wafat (→ jenis kelamin, lalu masuk urutan wafat) / Lahir tanpa tanda kehidupan.
4. Bila "sudah lahir" dan lahir lebih dari 6 bulan sesudah almarhum wafat: pertanyaan lanjutan netral di balik
   tautan (R13-1, R13-5). Bila syarat tidak terpenuhi → bayi bukan ahli waris almarhum itu (pesan jujur).
   Kalimat final dirumuskan bersama tim keilmuan (celah E4); sebelum itu tautan ini tidak ditampilkan dan dicatat
   di "Di luar cakupan".

### 1.4 Langkah 5 · Kondisi

Tetap: beda agama dan terlibat kematian, untuk semua babak (label "ahli waris [X]" yang sudah ada).
`PanelMunasakhat` dan `TAMPILKAN_MUNASAKHAT` dihapus.

### 1.5 Periksa cerita

Layar antara langkah 5 dan hasil, **hanya** bila ada `urutanWafat`, janin, mafqud, khuntsa, `gharqa`, atau
`wafatSesudahDibagi`. Ringkasan kalimat per babak (pola check answers), tiap babak bertautan "ubah" ke babaknya,
plus kalimat "Harta yang dibagi: harta [pewaris]. Harta milik [X] sendiri tidak ikut dihitung di sini."
Tombol utama: **Lihat hasil**. Kalimat dirangkai dari templat diksi, bukan hardcode.

### 1.6 Layar pilihan menunggu

Sesudah Periksa cerita, bila ada janin belum lahir dan `pilihanJanin` belum diisi:
"Bayi belum lahir. Mau menunggu dulu?" — Tunggu lahir dulu (dianjurkan, 13a.3) / Hitung sekarang.

### 1.7 Yang ditolak di dialog (tidak disimpan)

- "Bersamaan" antara dua almarhum yang bukan pewaris (S29, celah E1).
- "Wafat sesudah" bila sudah ada `gharqa`, atau "bersamaan dengan pewaris" bila sudah ada `urutanWafat` (celah E2).

Pesan: "Keadaan ini belum bisa dihitung otomatis. Tanyakan ke ahli faraidh." Jawaban dikembalikan ke sebelumnya.

## 2. Model data

### 2.1 `Kasus` versi 3

```ts
interface Kasus {
  versi: 3;
  graf: GrafKeluarga;
  tirkah: InputTirkah;
  satuanPembulatan: bigint;
  rincianHarta?: Partial<Record<KategoriHarta, bigint>>;
  /** Wafat sesudah almarhum sebelumnya dan sebelum harta dibagi, urut waktu wafat. */
  urutanWafat: IdOrang[];
  /** Anak → almarhum yang wafat sebelum anak itu dikandung (bukan ahli waris almarhum itu). */
  dikandungSetelahWafat?: Record<IdOrang, IdOrang>;
  /** Wafat bersamaan dengan pewaris; pewaris selalu anggota. Harta pewaris = `tirkah`. */
  gharqa?: { anggota: IdOrang[]; keadaan: KeadaanGharqa; tirkah: Record<IdOrang, InputTirkah> };
  /** Khusus UI (S30): wafat sesudah harta dibagi; engine melihat mereka hidup. */
  wafatSesudahDibagi?: IdOrang[];
  pilihanJanin?: 'tunggu' | 'hitungSekarang';
}
```

Versi 1 dan 2 dibaca lalu dimigrasi ke 3 (field baru kosong). "Babak asal" tidak disimpan: `babakAsal(kasus, id)`
= almarhum pertama di `[pewaris, ...urutanWafat]` yang menjadikan orang itu kerabat (pola `mayitDari`).

### 2.2 Jawaban → data

| Jawaban | Data |
|---|---|
| Wafat sebelum almarhum babaknya | `statusHidup: 'wafat'` (bukan penghubung); baris jumlah diberi catatan "n sudah wafat sebelumnya" |
| Wafat sesudah, belum dibagi | `statusHidup: 'hidup'` + disisipkan ke `urutanWafat` |
| Wafat sesudah, sudah dibagi | `wafatSesudahDibagi` |
| Bersamaan dengan pewaris | `statusHidup: 'wafat'` + `gharqa.anggota`, `gharqa.keadaan`, `gharqa.tirkah[id]` |
| Hilang tanpa putusan | `statusHidup: 'mafqud'` |
| Hilang dengan putusan | seperti wafat (sebelum/sesudah) |
| Janin belum lahir | node `statusHidup: 'dalamKandungan'`, `idIbu`, `idAyah` bila dari suami di data; `jenisKelamin` pengisi |
| Janin lahir hidup | orang biasa (`hidup`), jenis kelamin; kembar = dua orang |
| Janin lahir lalu wafat | orang biasa + `urutanWafat` (babak baru) |
| Lahir tanpa tanda kehidupan | node dihapus |
| Anak dikandung sesudah almarhum X wafat | `dikandungSetelahWafat[anak] = X` |
| Kelamin belum jelas | `khuntsa: 'diharapkanJelas' \| 'tidakDiharapkanJelas'` |

Semua perubahan dari dialog adalah fungsi murni `(kasus, jawaban) => Kasus` di `src/keadaanOrang.ts` (dites sendiri).

### 2.3 `rapikanKeadaan`

Mengganti `rapikanUrutanWafat`, tetap dipanggil hanya di `UBAH_KASUS`:
- buang id yang tidak ada di graf dari semua daftar;
- `urutanWafat` tanpa orang berstatus `wafat`; satu orang hanya di satu daftar
  (`urutanWafat` / `gharqa.anggota` / `wafatSesudahDibagi`);
- `gharqa` dihapus bila anggota < 2 atau pewaris bukan anggota;
- entri `dikandungSetelahWafat` dibuang bila anak/almarhumnya hilang dari `[pewaris, ...urutanWafat]`;
- `pilihanJanin` dihapus bila tidak ada node `dalamKandungan`.

Membatalkan almarhum (babak X hilang) menghapus orang yang babak asalnya X, **setelah konfirmasi** yang menyebut
namanya: `orangBabak(kasus, X)` menyerahkan daftar untuk dialog; penghapusan memakai `hapusAhliWaris`.

### 2.4 `bacaKasus` (batas kepercayaan file impor)

Tambahan pemeriksaan: `statusHidup` boleh `dalamKandungan`/`mafqud`; `khuntsa` bernilai sah; anggota `gharqa`
ada, berstatus `wafat` (kecuali pewaris), pewaris termasuk, `keadaan` sah, `tirkah` berupa uang sah; tak ada
orang di dua daftar; kunci dan nilai `dikandungSetelahWafat` ada, nilainya ∈ `[pewaris, ...urutanWafat]`;
`pilihanJanin` sah. Pesan galat lewat `t(...)`.

### 2.5 `jalankan.ts`

Prioritas:
1. `gharqa` → `hitungGharqa({ dasar, anggota, keadaan, tirkah: { [pewaris]: kasus.tirkah, ...gharqa.tirkah } })`.
2. Ada node `dalamKandungan`/`mafqud`/`khuntsa`:
   `pilihanJanin === 'tunggu'` dan ada janin → `{ jenis: 'menunggu' }`;
   selain itu → `hitungTaqdir(dasar, { urutanWafat, dikandungSetelahWafat })`.
3. `urutanWafat` tidak kosong → `hitungMunasakhat({ dasar, urutanWafat, dikandungSetelahWafat })`.
4. Selain itu → `hitungDzawilArham(dasar)`.

`wafatSesudahDibagi` tidak dikirim. `HasilTampil` bertambah `taqdir` (`HasilTaqdir`), `gharqa` (`HasilGharqa`),
`menunggu`.

## 3. Hasil minimal

Hasil `biasa` dan `munasakhat` tidak berubah. Jenis baru memakai kerangka layar hasil yang sama, kartu lebih sedikit.

**taqdir**
1. **Pembagian sekarang**: per orang nominal dari `nominal`; yang menerima 0 ditulis di bawah dengan alasan
   (menunggu bayi lahir / menunggu kabar / menunggu kepastian) dari `TAQDIR_PEMBERIAN` di jejak.
2. **Amplop titipan** (keterangan kecil: mauquf): `nominalMauquf` + kalimat alasan + "Setelah bayi lahir / ada kabar,
   buka kasus ini lagi dan ubah jawabannya."
3. **Kalau terbukti…** (terlipat): satu baris per `daftarDunia`, judul kalimat ("Bayi Dewi: 1 laki-laki ·
   Arif: masih hidup"), isi bagian tiap orang dalam pecahan dan persen (`pecahanTeks`, `persenTeks`).
4. **Langkah perhitungan**: `jelaskanTaqdir` lewat `KartuLangkah`.
5. **Pohon** tanpa angka; janin bertanda "belum lahir", mafqud "hilang".

`MAUQUF_SEMUA` (tak terjangkau di [SYF]) ditangani sebagai kartu pesan.

**gharqa**
- Kalimat pembuka: "Mereka tidak saling mewarisi. Harta masing-masing dibagi kepada keluarganya yang masih hidup."
- Satu kartu per `harta`: penerima + nominal; amplop titipan harta itu bila `mauquf > 0`.
- `MAUQUF` (terlupakan): kartu "Harta ditahan sampai ada yang ingat, atau keluarga bersepakat" + skenario terlipat
  "Kalau [A] wafat lebih dulu…".
- Langkah perhitungan: `jelaskanGharqa`.

**menunggu**
Kartu "Kasus disimpan. Hitung lagi setelah bayi lahir." (kasus disimpan ke riwayat) + tautan **Hitung sekarang saja**
(mengubah `pilihanJanin` ke `hitungSekarang`).

## 4. Galat, batas, teks

| Keadaan | Tampilan |
|---|---|
| `PERLU_INPUT` karena `BATAS_DUNIA` | "Terlalu banyak yang belum pasti" + daftar orang (`pertanyaan[].idOrang`) dengan tautan **Pastikan** ke Dialog keadaan di langkah 4 |
| `PERLU_INPUT` lain | kartu yang ada + nama orang |
| `TIDAK_DIDUKUNG` | kartu pesan; bila terkait janin, saran "tunggu bayi lahir, lalu hitung lagi" |
| Exception engine | kartu galat yang ada |

Validasi wizard (`alasanBelumLengkap`): babak k butuh ≥ 1 kerabat almarhumnya; semua "Siapa lebih dulu?"
terjawab; dialog yang ditutup di tengah tidak menyimpan jawaban setengah.

Teks: semua lewat `t(...)` dengan kunci `hitung.keadaan.*`, `hitung.babak.*`, `hitung.janin.*`, `hitung.hilang.*`,
`hitung.bersamaan.*`, `hitung.cerita.*`, `hasil.titipan.*`; ditambah ke snapshot dengan `pnpm diksi:tambah`.
Aturan kalimat riset 9.2. Ikon SVG. Aksi sekunder berupa tautan; tombol hanya aksi utama.

## 5. Unit

| Unit | Tanggung jawab |
|---|---|
| `src/kasus.ts` | `Kasus` v3, migrasi, `bacaKasus`, `rapikanKeadaan` |
| `src/keadaanOrang.ts` | jawaban dialog → `Kasus`; `babakAsal`, `orangBabak`, daftar almarhum; fungsi murni |
| `src/urutan.ts` | penyisipan berpasangan (pertanyaan berikutnya / sisipkan jawaban); fungsi murni |
| `src/layar/keadaan/DialogKeadaan.tsx` | dialog satu pertanyaan per layar (keadaan, waktu, dibagi, hilang, bersamaan, khuntsa) |
| `src/layar/keadaan/DialogJanin.tsx` | dialog janin |
| `src/layar/keadaan/PertanyaanPenutup.tsx` | "Semua masih hidup?" + daftar keadaan + "Siapa lebih dulu?" + pertanyaan hamil |
| `src/layar/LangkahBabak.tsx` | babak 2..n: pembuka, pohon kecil, "dari orang yang sudah ada", `LangkahAhliWaris` |
| `src/layar/PeriksaCerita.tsx`, `LayarMenunggu.tsx` | 1.5, 1.6 |
| `src/jalankan.ts` | dispatch 2.5 |
| `src/hasil/HasilTaqdir.tsx`, `HasilGharqa.tsx`, `KartuTitipan.tsx` | hasil minimal |
| `src/keadaan.ts`, `layar/wizard/validasi.ts` | sub-langkah babak (`babak` di keadaan wizard), validasi baru |

## 6. Tes

- Unit: `keadaanOrang` (tiap baris tabel 2.2), `urutan` (jumlah pertanyaan 2/3/4 orang, "tidak tahu"),
  `babakAsal`, `rapikanKeadaan` + hapus berantai, `bacaKasus` v3 + migrasi v1/v2 + penolakan file tak konsisten.
- `jalankan`: tiap jalur memanggil orkestrator yang benar, termasuk `menunggu`.
- Komponen: pertanyaan penutup bawaan "Ya"; kasus biasa tanpa layar tambahan (tanpa Periksa cerita); dialog S1, S5, S30;
  babak 2 mencentang Siti "ibu"; hamil → layar menunggu; dialog menolak S29.
- Integrasi (kasus disusun lewat helper UI, dicocokkan dengan fixture engine): contoh 12.6, M1; H1 [SYF]
  (saudara lk 0, mauquf 60); F1; X1; G1 mode [SYF].
- Regresi: `kondisi.test.tsx` (tes "munasakhat disembunyikan" diganti), `integrasi.test.ts` tetap hijau.

## 7. Urutan pengerjaan

1. Model: `Kasus` v3, `rapikanKeadaan`, `bacaKasus`, `keadaanOrang`, `urutan`.
2. Pertanyaan penutup + Dialog keadaan (hidup/wafat/sesudah/dibagi/urutan).
3. Babak 2..n.
4. `jalankan` + hasil `taqdir` / `gharqa` / `menunggu`.
5. Janin, lalu hilang, lalu bersamaan di dialog.
6. Periksa cerita + layar menunggu.
7. Khuntsa.

## 8. Jalur silsilah: warisan turun-temurun (revisi 2026-09-30)

### 8.0 Masalah yang dijawab

Kasus munasakhat yang paling umum di Indonesia adalah harta (biasanya rumah atau tanah) peninggalan kakek buyut
atau kakek dari ayah yang tidak pernah dibagi, sementara anak dan cucunya sudah banyak yang wafat. Alur Babak
(1.1–1.2) mengikuti cara kitab: mulai dari mayit pertama lalu maju. Untuk kasus ini ada tiga kendala:

- Pengguna datang dari dua ujung: tahu hartanya dan tahu siapa yang hidup **sekarang**, bagian tengahnya kabur.
  Pertanyaan "siapa yang ditinggalkan" membuat orang yang sudah wafat tidak pernah diketik.
- Babak per almarhum tidak cocok untuk jumlah besar: 10 almarhum berarti 10 babak "lihat dari sisi X", dan
  perbandingan berpasangan untuk urutan wafat jumlahnya membengkak.
- Hampir semua cicit lahir sesudah buyut wafat, jadi `dikandungSetelahWafat` berlaku untuk banyak orang,
  bukan kasus pinggir.

Engine tidak berubah: `InputMunasakhat` sudah berupa satu graf, satu urutan wafat global, dan
`dikandungSetelahWafat`, dan `grafPada` menurunkan siapa yang hidup pada tiap kematian. Babak hanya konsep tampilan.

### 8.1 Prinsip

1. **Pohon dulu, urutan belakangan.** Pengguna mengisi silsilah ke bawah dari pemilik harta. Urutan wafat dan
   kelahiran diturunkan dari tahun.
2. **Tanya hanya bila jawabannya mengubah hasil.** Pertanyaan tambahan (urutan, kelahiran, kerabat di luar pohon,
   anak dari orang yang masih hidup) hanya muncul bila **uji hipotetis** (8.4) menunjukkan jawabannya berpengaruh.
   UI tidak memuat aturan hajb sendiri; engine yang menentukan (CLAUDE.md: fikih hanya di engine).
3. **Data kurang → tanya, jangan menebak.** "Tidak tahu" pada pertanyaan yang berpengaruh tidak diisi asumsi;
   orangnya masuk daftar "belum dipastikan" di Periksa cerita, dan hitung ditahan sampai dipastikan.

### 8.2 Alur layar

**S1. Pemilik harta.** Pewaris dari langkah sebelumnya. Satu isian: "Kira-kira tahun berapa [pewaris] wafat?"
(tahun + pilihan "pasti" / "kira-kira" / tautan "tidak ingat").

**S2. Harta pernah dibagi?** "Sejak [pewaris] wafat, apakah hartanya pernah dibagi?" + definisi "dibagi" (1.1).
- Belum pernah → lanjut.
- Sudah, sekitar tahun T → orang yang wafat sesudah T otomatis `wafatSesudahDibagi`; bila tahunnya kira-kira dan
  dekat T (selisih ≤ 2 tahun), ditanya satu per satu dengan pertanyaan lama 1.1 butir 3.
- Sebagian saja → pesan jujur "Pembagian sebagian belum bisa dihitung otomatis. Tanyakan ke ahli faraidh." (di luar cakupan).

**S3. Silsilah per generasi.** Daftar bertingkat (bukan pohon lebar, supaya nyaman di HP dan terbaca pembaca layar):

```
Mbah Karto · wafat ±1975
  Pasangan: Mbah Sumi · wafat ±1990
  Anak:
    Budi · wafat 1998        › Keluarga Budi (3 orang)
    Rina · masih hidup
    Slamet · wafat ±1970     (sebelum Mbah Karto)  › Keluarga Slamet
```

- Tiap orang: nama, hubungan, keadaan (Masih hidup / Sudah wafat + tahun, pasti atau kira-kira / Hilang /
  Keadaan lain › dari Dialog keadaan 1.1), tahun lahir opsional.
- **Cabang dibuka hanya untuk orang yang sudah wafat**: "Keluarga Budi: pasangan dan anak-anaknya". Anak dari orang
  yang masih hidup tidak ditanyakan, kecuali uji hipotetis menyatakan anak itu bisa mendapat bagian (8.4). Tautan
  "Tambah anak" tetap ada untuk siapa saja.
- Wafat sebelum pemilik harta (tahun lebih awal, atau jawaban "sebelum") tetap dibuka cabangnya, karena anaknya
  bisa mewarisi sebagai cucu.

**S4. Pertanyaan susulan** (satu per layar, hanya yang lolos uji hipotetis, urut dari generasi atas):

| Jenis | Kapan muncul | Kalimat |
|---|---|---|
| Urutan | Dua almarhum tahunnya sama, atau salah satunya "tidak ingat", atau keduanya kira-kira dengan selisih ≤ 2 tahun, **dan** urutan keduanya mengubah hasil | "Siapa yang wafat lebih dulu: A atau B?" + "Bersamaan, atau tidak tahu" (sama dengan 1.1) |
| Sebelum/sesudah pemilik | Tahun wafat tidak diketahui | Dialog keadaan 1.1 butir 2 |
| Kelahiran | Tahun lahir tidak diisi, dan anak itu mendapat bagian dari almarhum Y bila dianggap sudah ada | "Waktu Y wafat, [anak] sudah lahir atau dalam kandungan?" |
| Kerabat di luar pohon | Almarhum M menerima bagian, dan posisi kerabat yang belum ada di graf (mis. nenek dari pihak ibu, orang tua dan saudara menantu) akan mendapat bagian dari M | "Waktu M wafat, apakah [sebutan] masih hidup?" Ya (tambah orang) / Sudah wafat lebih dulu / Tidak ada / Tidak tahu |

Menantu yang wafat sesudah menerima bagian memicu baris terakhir untuk keluarga asalnya; di hasil, bagian yang
keluar ke keluarga besan ditampilkan terang (8.5), karena ini titik yang sering mengagetkan.

**S5. Periksa cerita** (1.5) dalam bentuk **kronologis**, disusun dari tahun: "±1975 Mbah Karto wafat. Ia
meninggalkan … · 1998 Budi wafat. Bagiannya diteruskan kepada …". Orang yang "belum dipastikan" (8.1 butir 3)
tampil di atas dengan tautan **Pastikan**. Pohon kecil tanpa angka di bawahnya.

Langkah 5 (kondisi) dan layar menunggu (1.6) tetap sama.

### 8.3 Model data: `Kasus` versi 4

```ts
/** Presisi bebas: tahun saja sampai tanggal lengkap. Dipakai juga oleh mode linimasa (C) nanti. */
interface TanggalKira { tahun: number; bulan?: number; hari?: number; kiraKira: boolean }

interface Kasus {
  versi: 4;
  // ... semua field v3
  /** Tampilan langkah 4. Hanya tampilan; kedua jalur mengisi field yang sama. */
  jalur: 'babak' | 'silsilah';
  /** Jawaban pertanyaan pintu 1.0; kosong = belum dijawab (validasi wizard menahan). */
  pintu?: 'tidakAda' | 'sedikit' | 'turunTemurun' | 'tidakTahu';
  /** Jawaban "harta pernah dibagi?" sekali per harta (1.1 butir 3, S2). */
  hartaPernahDibagi?: { status: 'belum' } | { status: 'sudah'; tahun?: TanggalKira } | { status: 'sebagian' };
  /** Khusus UI; tidak dikirim ke engine. */
  waktu?: Record<IdOrang, { wafat?: TanggalKira; lahir?: TanggalKira }>;
}
```

- `waktu` hanya bahan penurunan. Yang dikirim ke engine tetap `urutanWafat`, `dikandungSetelahWafat`,
  `statusHidup`, `wafatSesudahDibagi`. Tahun tidak masuk jalur hitung (`number` hanya di UI).
- **Penurunan** (fungsi murni `turunkanDariWaktu(kasus) => Kasus`, dipanggil di `UBAH_KASUS` sebelum
  `rapikanKeadaan`): wafat sebelum tahun pemilik → `statusHidup: 'wafat'`; sesudah → masuk `urutanWafat` terurut
  tahun; lahir sesudah tahun wafat Y → `dikandungSetelahWafat[anak] = Y` (bila lebih dari satu Y, yang paling akhir
  di `urutanWafat`). Pasangan yang tak terurutkan dari tahun diurutkan oleh jawaban S4; jawaban itu disimpan di
  `urutanWafat` seperti sekarang dan tidak ditimpa penurunan.
- Migrasi v3 → v4: `jalur: 'babak'`, `pintu` diisi `'sedikit'` bila `urutanWafat` tidak kosong, selain itu
  `'tidakAda'`; field lain kosong. `bacaKasus` memeriksa `TanggalKira` (bilangan bulat, rentang wajar, bulan 1–12,
  hari 1–31).

### 8.4 Uji hipotetis

Fungsi murni di UI yang **memanggil engine** untuk memutuskan apakah sebuah pertanyaan perlu ditanyakan:

- **Kerabat/anak hipotetis**: tambahkan satu node hipotetis (hidup) di posisi yang ditanyakan, jalankan
  `hitungMunasakhat`; bila node itu tidak menerima saham di langkah mana pun, pertanyaan dilewati. Cukup satu node
  per uji: orang yang tidak menerima apa pun saat hidup juga tidak meneruskan apa pun bila wafat.
- **Urutan**: jalankan kedua urutan; bila saham akhir sama, pertanyaan dilewati.
- **Kelahiran**: anggap anak sudah ada saat Y wafat; bila ia tidak menerima saham dari langkah Y, pertanyaan dilewati.
- Kandidat posisi kerabat = jenis ahli waris ruleset aktif yang belum punya orang di graf relatif M.
- Hasil engine `PERLU_INPUT` / `TIDAK_DIDUKUNG` saat uji → pertanyaan tetap ditanyakan (aman).
- Batas biaya: uji dijalankan per perubahan jawaban, hanya untuk pertanyaan yang belum terjawab. Bila jumlah uji
  melewati batas (angka ditetapkan saat plan, diukur dengan kasus 4 generasi ± 40 orang), tanyakan saja tanpa
  uji. `ponytail:` tanpa memo; tambah memo per graf bila terasa lambat.

### 8.5 Hasil: dikelompokkan per cabang

Hasil `munasakhat` (dari jalur mana pun) dengan ≥ 2 anak pemilik yang punya penerima mendapat tampilan kelompok di
atas daftar per orang:

```
Keluarga Budi        37,5 %   Rp …   › Andi, Sari, Bu Dewi
Rina                 25 %     Rp …
Keluarga Slamet      …        (cucu dari anak yang wafat lebih dulu)
Di luar keturunan    …        › keluarga Bu Dewi (besan), …
```

Cabang seseorang = anak pemilik yang menjadi leluhurnya; pasangan ikut cabang pasangannya; selain itu (orang tua
atau saudara pemilik, keluarga besan) masuk "Di luar keturunan" dengan keterangan jalurnya ("dari bagian Bu Dewi").
Hanya penyajian: angka tetap dari `saham`/`nominal` engine, dijumlah per kelompok.

### 8.6 Unit

| Unit | Tanggung jawab |
|---|---|
| `src/kasus.ts` | `Kasus` v4, migrasi v3 → v4, `bacaKasus` untuk `TanggalKira` |
| `src/silsilah.ts` | `turunkanDariWaktu`, daftar generasi, pertanyaan susulan berikutnya; fungsi murni |
| `src/ujiHipotetis.ts` | 8.4; fungsi murni, memanggil engine |
| `src/layar/LangkahSilsilah.tsx` | S1–S3 (daftar bertingkat, cabang) |
| `src/layar/keadaan/PertanyaanSusulan.tsx` | S4, satu per layar |
| `src/layar/PeriksaCerita.tsx` | mode kronologis + daftar "belum dipastikan" |
| `src/hasil/KelompokCabang.tsx` | 8.5 |
| `src/layar/wizard/*` | pertanyaan pintu 1.0, validasi: pintu terjawab, tidak ada "belum dipastikan" |

### 8.7 Tes

- Fixture engine **munasakhat 3–4 lapis bergaya turun-temurun** (buyut → anak → cucu, satu menantu wafat sesudah
  menerima), dibuat dan dicocokkan ke bab 12 **sebelum** logika UI.
- `turunkanDariWaktu`: sebelum/sesudah pemilik, urutan dari tahun, tahun sama tidak diurutkan sendiri, lahir
  sesudah wafat → `dikandungSetelahWafat`, jawaban S4 tidak ditimpa.
- `ujiHipotetis`: anak dari orang hidup yang terhalang dilewati; nenek dari pihak ibu ditanyakan hanya bila
  mendapat bagian; urutan yang tidak berpengaruh dilewati; `PERLU_INPUT` saat uji → tetap ditanyakan.
- Batas jumlah pertanyaan: kasus fixture dengan semua tahun terisi menghasilkan 0 pertanyaan urutan.
- Komponen: pintu tanpa bawaan menahan Lanjut; "Tidak ada" tidak menambah layar; pindah babak ↔ silsilah tidak
  mengubah `Kasus` selain `jalur`; "Sebagian saja" → pesan jujur.
- Integrasi: fixture di atas disusun lewat jalur silsilah **dan** jalur babak menghasilkan input engine yang sama.
- Hasil: jumlah per cabang = jumlah nominal anggotanya; keluarga besan masuk "Di luar keturunan".

### 8.8 Urutan pengerjaan

1. Kalimat 1.1 (jangkar waktu) dan pertanyaan pintu 1.0: perbaikan cepat, berdiri sendiri.
2. `hartaPernahDibagi` sekali per harta (1.1 butir 3).
3. Fixture engine turun-temurun (8.7).
4. `Kasus` v4 + `turunkanDariWaktu`.
5. `ujiHipotetis`.
6. `LangkahSilsilah` + pertanyaan susulan.
7. Periksa cerita kronologis.
8. Hasil per cabang.

### 8.9 Risiko

- Tahun yang sama lebih sering muncul di kasus turun-temurun. "Bersamaan" antara dua almarhum yang bukan pewaris
  tetap ditolak (1.7, celah E1) sampai engine mendukung.
- Tahun "kira-kira" bisa salah urut. Ditangani dengan konfirmasi berpasangan bila selisih ≤ 2 tahun dan urutan
  berpengaruh; ambang 2 tahun diuji ulang di uji pengguna (riset bagian 11).
- Uji hipotetis mengandalkan engine; kalau ada celah engine (kandidat posisi yang tidak dikenal ruleset), posisi
  itu tidak pernah ditanyakan. Daftar kandidat dicek ke glosarium bab 15 saat plan.

## Di luar cakupan

- Harta yang sudah dibagi **sebagian** (S2 "sebagian saja"): pesan jujur, tidak dihitung.

- Pilihan madzhab di UI (tetap [SYF]); pewaris mafqud; mode linimasa (C) — spec terpisah.
- Hasil taqdir/gharqa lengkap: tabel faraidh per dunia, nominal per dunia, sorot silang, modal orang, mode tebak.
- Pertanyaan syarat masa kandungan (1.3 langkah 4) sampai kalimatnya disetujui tim keilmuan (E4).
- Gharqa di tengah rantai dan gharqa + munasakhat (E1/E2) — ditolak di dialog sampai engine mendukung.
- Mode cerita AI.
