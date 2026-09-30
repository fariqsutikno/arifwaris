# Spec: Babak Kematian Berlapis (langkah 4–5, jalankan, hasil minimal)

Tanggal: 2026-09-30 · Status: disetujui per bagian, menunggu review tertulis
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

### 1.1 Langkah 4 · Keluarga — Babak 1 (pewaris)

- Baris "− jumlah +" (`LangkahAhliWaris`) tetap.
- Keterangan di atas daftar: "Masukkan juga anggota keluarga yang sudah wafat sesudah [almarhum], nanti kita tanyakan."
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
  3. Sesudah → "Waktu X wafat, apakah harta [pewaris] sudah dibagi?" + definisi "dibagi". **Per orang.**
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

## Di luar cakupan

- Pilihan madzhab di UI (tetap [SYF]); pewaris mafqud; mode linimasa (C) — spec terpisah.
- Hasil taqdir/gharqa lengkap: tabel faraidh per dunia, nominal per dunia, sorot silang, modal orang, mode tebak.
- Pertanyaan syarat masa kandungan (1.3 langkah 4) sampai kalimatnya disetujui tim keilmuan (E4).
- Gharqa di tengah rantai dan gharqa + munasakhat (E1/E2) — ditolak di dialog sampai engine mendukung.
- Mode cerita AI.
