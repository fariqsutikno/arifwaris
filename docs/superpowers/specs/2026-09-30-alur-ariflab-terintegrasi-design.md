# Spec: Alur ArifLab Terintegrasi (Beranda → 4 langkah → Hasil 3 lapis → madzhab)

Tanggal: 2026-09-30 · Status: disetujui per bagian di chat, menunggu review tertulis

Spec ini menggabungkan dua sumber:

- **Audit UX Lab Hitung 2026-09-30.** Skornya 24/40. Arsipnya ada di `apps/web/.impeccable/critique/2026-09-30T14-20-28Z__src-layar-wizard-tsx.md`, tapi foldernya belum dilacak git.
- **Riset "Babak"** di `docs/design/riset-ux-input-kematian-berlapis.md`, dengan keputusan pengguna di bagian 12.2.

Spec ini **menggantikan** sebagian `2026-09-30-babak-kematian-berlapis-design.md`:

- bagian 1.4, yaitu langkah 5 Kondisi;
- penomoran langkah di bagian 1.1–1.2.

Isi lainnya dari spec itu tetap berlaku, yaitu dialog keadaan, urutan berpasangan, dan dialog janin.

## Tujuan

Semua pengguna datang untuk hal yang sama: **"siapa dapat berapa, dan kenapa"**. Yang berbeda hanya seberapa dalam mereka ingin masuk.

| Pengguna | Momen penentu |
|---|---|
| Awam (siswa SMP, lansia) | Daftar **nama → Rp** yang jelas dan totalnya cocok, lalu satu kalimat "kenapa" |
| Pelajar | Langkah hitung yang menyorot pohon dan tabel |
| Praktisi / pengajar | Tabel ala kitab, dalil, status sumber, perbandingan madzhab |

Semua fitur baru menempel di slot tetap pada satu alur, tanpa menambah langkah. Fitur baru itu: madzhab, munasakhat (mode biasa dan linimasa), bab 13, dzawil arham, pohon bebas, dan mode cerita.

**Ukuran sukses:**

1. Kasus biasa (satu almarhum) tetap 5 layar isian sebelum Hasil, sama seperti sekarang.
2. Target uji riset 11.3 tercapai:
   - kasus S1 selesai ≤ 4 menit di HP;
   - jebakan S5 dan S30 terjawab benar 100%;
   - pertanyaan "maksudnya apa?" ≤ 1 per tugas.
3. Tidak ada aksi di UI yang label atau tujuannya menyesatkan. Temuan audit P1 hilang.

## Batasan tetap

- **Tanpa metafora stasiun/jalur.** Tampilan memakai sistem visual Arif Waris v4. Redesain "Peta Jalur" dibatalkan pemilik pada 2026-09-30 (commit `9b92664`). Teks memakai kata biasa: "langkah 3 dari 4", "Babak 2 dari 2".
- **Ikon SVG, tanpa emoji.** Aksi sekunder berupa teks/tautan; tombol berbingkai hanya untuk aksi utama.
- **Engine tidak diubah.** Semua kebutuhan spec ini sudah tersedia di engine:
  - `DAFTAR_RULESET`, `periksaKeberlakuan`, jejak `KHILAF_MADZHAB`;
  - taqdir, gharqa, dan munasakhat.
- **Semua teks tampil lewat `t()` dan snapshot diksi** (`pnpm diksi:tambah`), bukan hardcode. Kode rujukan internal (Rxx-y, Kxx-y) tidak tampil mentah.
- **Dua register nada:**
  - **Santai** di Beranda dan Belajar.
  - **Tenang** di layar Keluarga, Keadaan keluarga, Periksa, dan Hasil. Register ini mengikuti kamus kata riset 9.1: tanpa "Nah", "Waduh", atau "nggak"; kalimat ≤ 15 kata; menyebut nama orang, bukan istilah.

---

## 1. Beranda dan titik masuk

### 1.1 AwalHitung dihapus

Layar `awal` (`AwalHitung.tsx`) dihapus. Isinya dipindahkan:

| Isi lama | Pindah ke |
|---|---|
| Skenario baru / Lanjut kasus terakhir | CTA Beranda dan menu ArifLab |
| Impor berkas | Halaman Riwayat, tautan "Buka berkas" |
| Pintasan 3 soal latihan | Halaman Latihan (sudah ada; pintasan tidak dipindah, cukup dihapus) |
| Riwayat hitung | Beranda (3 terakhir) dan halaman Riwayat |

**Menu ArifLab** (`#/hitung`):

- Kasus aktif sudah lengkap → buka **Hasil**.
- Kasus aktif belum lengkap → buka langkah terjauh yang boleh dibuka.
- Tidak ada kasus aktif → langkah 1 dengan kasus kosong.

**Reset skenario** (sekarang dilabeli "Mulai kasus baru"): konfirmasi (`KonfirmasiKasusBaru`) → kasus dikosongkan → langkah 1.

**Kasus dari latihan/materi** (mode Belajar, terkunci) tetap langsung membuka Hasil seperti sekarang (`bukaDiHitung`).

### 1.2 Susunan Beranda (dasbor v4)

1. **Kepala.** Judul dan lead. Lead tidak lagi mengeraskan "menurut madzhab Syafi'i". Gantinya kalimat netral bahwa Syafi'i adalah bawaan dan hasil bisa dibandingkan dengan tiga madzhab lain.
2. **Dua kartu aksi** (`kartu-pilihan`). Kartu hitung berubah menurut keadaan:

   | Keadaan | Kartu hitung (aksi utama) | Tautan kecil di bawahnya |
   |---|---|---|
   | Belum ada kasus | **Mulai hitung** → langkah 1 | — |
   | Kasus belum lengkap | **Lanjutkan kasus {nama almarhum}**, keterangan "langkah {n} dari 4" | Mulai kasus baru |
   | Kasus lengkap | **Lihat hasil {nama almarhum}** | Mulai kasus baru |

   - Kartu kedua: **Mulai belajar / Lanjut belajar**, seperti sekarang.
   - Teks "Coba di ArifLab" diganti kata kerja di atas. Nama menu tetap ArifLab.
   - Slot: tautan "Ceritakan saja" di bawah kartu hitung, hanya setelah mode cerita tersedia (bagian 5).
3. **Tiga kotak status** (`kotak-status`): Kasus terakhir, Belajar (bar progres), Latihan.
   - Kotak Kasus terakhir memanggil `lanjutkan()`, bukan membuka pemilih.
   - Pengguna baru tanpa progres melihat satu kalimat ajakan, bukan angka nol.
4. **Kasus terakhir.** 3 entri riwayat terbaru dengan nama almarhum, plus tautan "Semua riwayat".
5. **FAQ dan Cari tahu.** Seperti sekarang.
6. **Tentang tim.** Seperti sekarang.

Bagian "Kasus rumit juga terjawab" **tidak** dibuat. Bank soal belum punya contoh munasakhat/janin/hilang, dan bagian ini baru dirancang setelah tim keilmuan mengisinya.

### 1.3 Riwayat

- Draf baru masuk riwayat **setelah langkah Harta terisi**. Tujuannya supaya "Mulai kasus baru" tidak menggeser kasus lengkap dari "Kasus terakhir" dengan entri "Belum ada ahli waris".
- Judul entri memakai nama almarhum (atau "Almarhum/Almarhumah" bila tanpa nama) + ringkasan ahli waris.

---

## 2. Wizard 4 langkah dan Babak

### 2.1 Langkah dan stepper

Stepper memakai gaya v4, bernomor biasa: **1 Almarhum · 2 Harta · 3 Keluarga · 4 Periksa → Hasil**.

- **Periksa** adalah langkah 4 untuk semua kasus. Layar `cerita` terpisah dihapus.
- **Centang** hanya untuk langkah yang **sudah dikunjungi dan isinya valid**. Sekarang centang dihitung dari `langkah < terjauh`, sehingga langkah opsional yang belum dibuka ikut tercentang.
- **Gulir kembali ke atas** tiap pindah langkah, babak, atau bagian.

**Layar kasus biasa:**

| # | Layar | Isi |
|---|---|---|
| 1 | Almarhum | Jenis kelamin, nama (opsional), tautan madzhab (bagian 4.2) |
| 2 | Harta | Lihat 2.2 |
| 3 | Keluarga · daftar | Daftar ± (`LangkahAhliWaris`) |
| 4 | Keluarga · keadaan | Lihat 2.3 |
| 5 | Periksa | Lihat 2.5 |

### 2.2 Harta (kewajiban digabung)

- Isian harta seperti sekarang.
- Di bawahnya: **"Ada utang, biaya pemakaman, atau wasiat?"** dengan pilihan **Tidak ada** (bawaan) / Ada. Jawaban Ada membuka isian `LangkahKewajiban` di layar yang sama.
- Hitungan berjalan "Yang akan dibagi" tetap tampil.
- Catatan gono-gini yang menyebut KHI ditandai **hukum positif, bukan fikih** (CLAUDE.md).

### 2.3 Keadaan keluarga (menggantikan langkah 5)

Satu layar per babak, tampil sesudah daftar babak itu. Pertanyaannya berukuran judul, bukan label 12px. Masing-masing punya jawaban bawaan:

1. "Semua orang di atas masih hidup?" → **Ya, masih hidup semua** / Ada yang sudah wafat atau hilang.
2. "Waktu {almarhum} wafat, ada yang sedang hamil?" → **Tidak ada** / Ada.
3. "Ada yang beda agama dengan {almarhum}, atau terlibat dalam wafatnya?" → **Tidak ada** / Ada.

Rincian tiap jawaban:

- **Jawaban 1 = "ada"** membuka daftar orang babak itu beserta keadaannya. Mengetuk orang membuka `DialogKeadaan`, satu pertanyaan per lapis (riset 7.3, spec babak 1.1).
- **Jawaban 2 = "ada"** membuka dialog janin (spec babak 1.3).
- **Jawaban 3 = "ada"** membuka daftar centang orang babak itu untuk beda agama dan untuk terlibat wafat.
  - Label orang ditulis dari sisi almarhum babak itu.
  - Isinya logika `LangkahKondisi` yang dipindah, dengan cakupan **per babak**, bukan semua ahli waris sekaligus.
- **Kembali ke jawaban bawaan** padahal sudah ada isian → dialog konfirmasi yang menyebut apa yang akan dihapus. Ini perilaku `PertanyaanPenutup` yang sekarang, dan juga berlaku untuk pertanyaan 3.

Keputusan sadar: tiga pertanyaan ditaruh di satu layar. Ini menyimpang dari riset 7.1 ("satu layar satu pertanyaan di HP"), karena ketiganya satu topik dan punya jawaban bawaan. Rinciannya tetap satu pertanyaan per lapis di dialog. Kalau dipecah, kasus biasa bertambah dua layar.

`LangkahKondisi.tsx` sebagai langkah dihapus.

### 2.4 Babak 2..n (munasakhat)

Tetap sesuai spec babak 1.2 dan riset L5–L6. Babak diulang **di dalam langkah Keluarga** dengan urutan: layar pembuka → daftar (bagian "Dari orang yang sudah ada" tercentang otomatis) → Keadaan keluarga babak itu.

Perbaikan dari audit:

- **Sub-judul:** "Keluarga · Babak {k} dari {n} · {nama}".
- **Judul menyebut almarhum:** "Siapa saja keluarga yang ditinggalkan {nama}?"
- **Label tombol bawah** diturunkan dari posisi, bukan dari `LANGKAH_WIZARD[langkah]`:

  | Posisi | Label |
  |---|---|
  | daftar babak k | Lanjut: keadaan keluarga |
  | keadaan babak k, ada babak k+1 | Lanjut: keluarga {nama babak k+1} |
  | keadaan babak terakhir | Lanjut: periksa |
  | Periksa | Lihat hasil |

- **Ringkasan samping sadar babak.**
  - Orang yang wafat sesudah almarhum ditulis "{nama} · wafat sesudah {almarhum}" dan tidak ikut dihitung sebagai ahli waris hidup (bukan "Anak laki-laki ×2").
  - Isinya dikelompokkan per babak.
  - "Kondisi khusus: n dicatat" diganti ringkasan per babak.
- **Pohon mini babak (`PohonDasar`)**
  - Menyebut orang dari sisi almarhum babak itu, misalnya Pak Ahmad = "Ayah", bukan "(Kerabat)".
  - Node pusat berlabel nama almarhum, bukan "babak ini".

### 2.5 Periksa (langkah 4)

- Layar "Coba baca ceritanya" yang sudah ada (riset L8), sekarang di dalam wizard. Stepper dan bar bawah tetap tampil.
- Isi: kalimat per babak dengan tautan "ubah" (menuju babak/bagian terkait), harta yang dibagi, dan catatan harta almarhum kedua (riset 7.6).
- Isi tambahan: baris madzhab "Dihitung menurut madzhab {x}" beserta tautan "ganti" (bagian 4.2).
- **Kasus biasa** mendapat versi pendek: satu paragraf cerita + harta. Tidak ada layar tambahan selain Periksa itu sendiri.
- **Menunggu kelahiran** (keputusan 12.2.3) tetap menjadi layar pilihan sesudah Periksa, sebelum Hasil, hanya bila ada janin belum lahir.

### 2.6 Perbaikan wizard lain

- Semua kontrol ≥ 44px: tombol −/+, "Nama", pilih bahasa.
- Tombol "Kerabat lain" memakai `aria-disabled`, bukan `disabled`, supaya keterangan "tetap terbuka karena…" terjangkau keyboard.
- Heading berurutan (h1 → h2 → h3).
- Glyph "▾" diganti ikon SVG.

---

## 3. Hasil 3 lapis

Kerangka tetap: kanvas (pohon/tabel) di kiri, kolom kartu di kanan; di HP bertumpuk. Urutan dan bobotnya diubah supaya yang pertama terbaca adalah jawaban.

### 3.1 Lapis 1 · Siapa dapat berapa (selalu terbuka, paling atas)

- **Judul tenang:** "Pembagian harta {almarhum}". Di bawahnya chip "Menurut madzhab {x}" dan tautan "Bandingkan pendapat lain" (bagian 4.3).
- **`KartuPembagian` dibalik bobotnya.** **Nama — Rp** jadi teks utama; pecahan dan persen jadi teks kecil di bawahnya. Bar pecahan pindah ke lapis 3.
- **Yang tidak mendapat bagian** dilipat: "Tidak mendapat bagian ({n})".
  - Alasan menyebut orang sebenarnya dan mayit rujukannya, misalnya "terhalang oleh Siti (ibu {almarhum})". Tidak lagi "terhalang oleh Ibu" ketika Ibu dan nenek dilihat dari mayit berbeda.
- **Baris penutup netral:** "Total dibagikan Rp {a} · sisa pembulatan Rp {b} · atur". Kartu "Perlu keputusanmu" dihapus.
- **Munasakhat dikelompokkan per orang, dengan asal bagian:**
  - Contoh: "Siti — Rp X". Di bawahnya: "sebagai istri Pak Ahmad Rp a · dari bagian Budi, sebagai ibunya Rp b".
  - Almarhum lanjutan: "Budi · wafat sesudah Pak Ahmad; bagiannya Rp Z diteruskan ke keluarganya".
- **Kasus khusus bab 13** (`HasilKasusKhusus`: taqdir, menunggu, gharqa) memakai format yang sama:
  - "Diterima sekarang" per orang;
  - "Disimpan dulu (amplop titipan) Rp X", dengan kalimat "Kalau bayinya 1 laki-laki: …" (riset 7.4).
- **Catatan tenang:** hasil ini untuk belajar; pembagian sungguhan dimusyawarahkan dengan ahli faraidh atau lembaga berwenang. Tautan "laporkan" tetap ada.

### 3.2 Lapis 2 · Kenapa begitu?

Terlipat di mode Hitung, terbuka di mode Belajar setelah jawaban dibuka.

- `KartuLangkah` tetap dipakai, termasuk sorot di pohon.
- 16 pil diganti **daftar bernomor yang dikelompokkan per bab** (dari `daftarBabDari`), dengan tombol sebelumnya/berikutnya.
- Untuk munasakhat, kelompok teratas per babak: "Babak 1 · harta Pak Ahmad", "Babak 2 · bagian Budi".
- Langkah yang menyentuh titik khilaf mendapat lencana "Di sini madzhab berbeda" (bagian 4.4).

### 3.3 Lapis 3 · Hitungan lengkap (terlipat)

- Tabel faraidh (`TabelFaraidh`) dan bar pecahan.
- **Tabel munasakhat** ala kitab (baru): satu kolom per mas'alah, baris per orang, tanda "×" untuk yang wafat sebelum pembagian, lalu kolom jami'ah.
- `KartuTentang`: jenis masalah ditulis **per babak**. Kasus munasakhat tidak lagi berlabel "Normal ('adilah)".
- Status sumber tiap dalil ditampilkan.

Status buka/tutup lapis 2 dan 3 diingat per perangkat (`localStorage`, dibungkus try/catch), supaya praktisi tidak perlu membukanya ulang.

### 3.4 Mode Belajar

Tidak berubah. Tebakan ada di lapis 1, dan jawaban dibuka dengan menekan-tahan.

### 3.5 HP dan kerangka

- **Pohon di HP:** terlipat "Lihat pohon keluarga", sesudah lapis 1. Legenda 8 butir masuk ke "Keterangan warna".
- **Dok FAQ + "Nemu masalah?"** disembunyikan di `#/hitung`, karena menutupi nominal dan tombol "Berikutnya".
- **Header:** "Tur singkat" dan "Reset skenario" pindah ke menu "Lainnya", supaya "Rujukan" tidak terdesak keluar di lebar 1280.
- **Di HP selama wizard dan hasil:** navigasi bawah disembunyikan. Hanya satu bar aksi yang tampil, dengan label teks (bukan ikon saja).
- **Bar aksi hasil:**
  - "Ubah data" dan "Mulai kasus baru" berupa tautan teks, dengan konfirmasi.
  - "Simpan" sekunder, "Ekspor" utama.
  - Ikon reset bukan ikon jam riwayat.

---

## 4. Madzhab

### 4.1 Data

- `Kasus` naik ke **versi 4** dengan field `ruleset?: Ruleset`. Tidak ada = `'syafii'`.
- `bacaKasus`:
  - file lama tanpa `ruleset` → Syafi'i;
  - ruleset tak dikenal → ditolak dengan pesan.
- `jalankan.ts` meneruskan `kasus.ruleset ?? 'syafii'`, bukan konstanta.
- Kasus baru mewarisi `ruleset` kasus terakhir.

Ini melaksanakan Task 9 plan `2026-09-29-multi-madzhab-waris-dasar.md`.

### 4.2 Tautan di langkah Almarhum dan Periksa

- Satu baris pelan: "Dihitung menurut madzhab Syafi'i (bawaan) · ganti".
- "ganti" membuka dialog 4 pilihan, masing-masing dengan satu kalimat status sumber:
  - **Syafi'i:** "diperiksa sampai kitab rujukan utama".
  - **Hanbali, Hanafi, Maliki:** "perbedaan per titik; sebagian dari sumber sekunder (al-Lahim, Ithraa)".
- Pengguna awam tidak perlu menyentuhnya.

### 4.3 Perbandingan di Hasil

- **Perhitungan:** engine dijalankan untuk keempat `DAFTAR_RULESET` dengan kasus yang sama. Hasilnya di-memo per kasus, lalu dibandingkan bagian per orang (fungsi murni di `apps/web`, diuji sendiri).
- **Tautan "Bandingkan pendapat lain"** hanya tampil bila minimal satu madzhab lain berbeda atau tidak bisa dihitung. Bila keempatnya sepakat, tidak ada tautan.
- **Panel perbandingan (laci):**
  - Baris = ahli waris; kolom = madzhab. Di HP, pengguna memilih satu madzhab untuk dibandingkan dengan yang sekarang.
  - Baris yang berbeda disorot.
  - Tiap perbedaan punya kotak **"Dalilnya"** berisi posisi keempat madzhab dari matriks 18.2 (`cariTitikKhilaf`).
  - Status tiap sel diturunkan dari sel matriks: tanpa tanda = rujukan utama; `(s)` = sumber sekunder; `?` = belum pasti.
  - Kode Kxx-y tidak tampil mentah.
- **Kolom yang tidak bisa dihitung:**
  - `TIDAK_DIDUKUNG` → "Belum dikaji untuk kasus ini", tanpa angka.
  - `PERLU_INPUT` → "Butuh jawaban tambahan" + pertanyaan dari engine.
- **"Pakai madzhab ini"** mengganti `Kasus.ruleset` dan menghitung ulang. Chip judul ikut berubah.

### 4.4 Lencana di lapis 2

Langkah dengan jejak `KHILAF_MADZHAB`, atau langkah yang `refs`-nya memuat kode titik matriks, mendapat lencana "Di sini madzhab berbeda". Lencana itu membuka kotak "Dalilnya" yang sama.

### 4.5 Teks yang bergantung madzhab

- Lead Beranda dan catatan hasil memakai nama madzhab dari kasus.
- Layar menunggu kelahiran untuk Maliki tidak menawarkan "hitung sekarang" (riset 7.4; engine `MAUQUF_SEMUA`).
- Pertanyaan "terlibat dalam wafatnya" netral untuk semua madzhab. Pertanyaan lanjutan hanya muncul bila engine mengembalikan `PERLU_INPUT`.

### 4.6 Di luar cakupan

- Khilaf internal Syafi'iyyah (`KonfigurasiMadzhab`: kebijakan sisa, qaul qadim) tetap bawaan.
- KHI adalah fase terpisah (`docs/kb-khi/`), bukan pilihan di dialog madzhab.

---

## 5. Slot fitur yang spec-nya menyusul

Ketiganya menulis `Kasus` yang sama, sehingga pindah tampilan tidak menghapus isian. Spec ini hanya menetapkan letak dan kontraknya.

| Fitur | Letak | Kontrak |
|---|---|---|
| **Pohon bebas** | Pilihan tampilan "Daftar \| Pohon" di layar Keluarga · daftar | Menulis `Kasus.graf`; label bertingkat memakai explain yang sudah ada. **Satu-satunya jalan input dzawil arham.** Daftar kunci (`KERABAT_LAIN`) tidak memuat khal, 'ammah, atau cucu dari anak perempuan, dan tidak diperluas. |
| **Linimasa** ("Atur linimasa lengkap") | Tautan di layar Keadaan keluarga (bila ada yang wafat sesudah) dan di Periksa | Peristiwa diterjemahkan menurut jenisnya (riset 7.9, memori 2026-09-30); lihat daftar di bawah tabel |
| **Mode cerita** | Tautan "Ceritakan saja" di Beranda (1.2); wajib login, berkuota | AI menyusun draf `Kasus`, yang mendarat di **langkah 4 Periksa** beserta pohon. Data kurang → `PERLU_INPUT` engine → pertanyaan. AI tidak memutuskan fikih. |

Penerjemahan peristiwa linimasa:

- urutan wafat → `urutanWafat`;
- nikah/cerai → status `Pernikahan` saat pasangan pertama wafat;
- lahir di antara dua kematian → `dikandungSetelahWafat`;
- wafat bersamaan → gharqa.

Catatan lain:

- AMIN belum dirancang dan tidak diberi slot.
- Sampai spec pohon bebas diimplementasikan, dzawil arham hanya bisa terjadi dari kerabat yang sudah ada di daftar. Ini keterbatasan yang diakui, bukan dikarang.

---

## 6. Data dan state

- **`Layar`:** `'wizard' | 'hasil' | 'belajar'`. `'awal'` dan `'cerita'` dihapus.
- **`KeadaanAplikasi`:** `langkah` 1–4 (`TOTAL_LANGKAH = 4`), `babak`, `bagian: 'daftar' | 'keadaan'` (hanya bermakna di langkah 3), dan `dikunjungi: Set<number>` untuk centang stepper.
- **Aksi baru/berubah:** `KE_BAGIAN`. `KE_LANGKAH`/`KE_BABAK` memasang gulir ke atas lewat efek di `Wizard`. `ULANGI` → langkah 1 dengan kasus kosong.
- **Label bar bawah dan sub-judul:** fungsi murni `posisiWizard(kasus, langkah, babak, bagian)` → `{ labelLanjut, subjudul, judul }`.
- **Validasi** (`validasi.ts`) mengikuti penomoran baru; `langkahTerjauh` tetap satu sumber kebenaran.
- **`Kasus` v4:** `ruleset?`, dengan migrasi v3 → v4 di `bacaKasus`.
- **Riwayat:** `catatRiwayat` dipanggil hanya bila `kasus.tirkah.kotor` sudah terisi.

## 7. Fase implementasi

Tiap fase bisa dirilis sendiri dan seluruh tes hijau di akhir fase.

1. **Masuk dan Beranda.**
   - AwalHitung dihapus; menu ArifLab langsung ke kasus.
   - Kartu aksi Beranda menurut keadaan; kotak Kasus terakhir memanggil `lanjutkan()`.
   - Aturan draf riwayat; impor pindah ke Riwayat.
   - Menu header "Lainnya"; dok FAQ disembunyikan di `#/hitung`.
   - Kontras `a.aw-btn` + `.aw-btn-primary` di mode gelap diperiksa dan diperbaiki: `a.aw-btn{color:inherit}` mengalahkan warna tombol utama.
2. **Wizard 4 langkah.**
   - Harta + kewajiban digabung.
   - Keadaan keluarga per babak, termasuk mawani' dari `LangkahKondisi`.
   - Periksa sebagai langkah 4.
   - `posisiWizard`; stepper `dikunjungi`; gulir ke atas.
   - Ringkasan samping dan pohon mini sadar babak.
   - Register tenang; kontrol ≥ 44px dan perbaikan aksesibilitas 2.6.
3. **Hasil 3 lapis.**
   - Lapis 1 dengan pengelompokan munasakhat per orang dan baris total.
   - Lapis 2 per bab/babak.
   - Lapis 3 dengan tabel munasakhat dan `KartuTentang` per babak.
   - `HasilKasusKhusus` memakai format lapis 1.
   - HP: pohon terlipat, satu bar aksi berlabel.
4. **Madzhab.**
   - `Kasus` v4.
   - Tautan di Almarhum/Periksa.
   - Perbandingan dan panel.
   - Lencana lapis 2.
   - Teks yang bergantung madzhab.

## 8. Pengujian

- **Reducer dan `posisiWizard`:**
  - navigasi `(langkah, babak, bagian)` maju-mundur, termasuk mundur dari Periksa ke keadaan babak terakhir;
  - label tombol per posisi (tabel 2.4);
  - centang stepper hanya untuk yang dikunjungi.
- **Titik masuk:**
  - menu ArifLab untuk tiga keadaan kasus;
  - "Lanjutkan" membuka kasus;
  - draf tanpa harta tidak masuk riwayat.
- **Migrasi `Kasus` v3 → v4:** file lama dibaca Syafi'i; ruleset tak dikenal ditolak.
- **Invarian lapis 1:**
  - Σ nominal + sisa pembulatan = harta bersih;
  - untuk munasakhat, Σ rincian per sumber = total per orang.
- **Perbandingan madzhab:**
  - tidak ada tautan bila keempat madzhab sepakat;
  - `TIDAK_DIDUKUNG` tampil "Belum dikaji";
  - fixture `packages/engine/src/__tests__/fixtures/madzhab.ts` dipakai ulang lewat jalur web.
- **Integrasi UI:**
  - skenario riset S1–S32 yang didukung engine, disusun lewat jawaban UI dan dibandingkan dengan input engine yang diharapkan;
  - tes bab 13 yang ada (`316daee`) diperbarui karena mawani' pindah ke Keadaan keluarga.
- **Uji pengguna:** rencana riset bagian 11 (3 putaran × 5 peserta, target 11.3), ditambah satu tugas praktisi: "Bandingkan hasil kasus ini menurut Hanbali, lalu sebutkan dalil perbedaannya."
