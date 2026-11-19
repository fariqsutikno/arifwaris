# Riset UX: aksi di hero Hasil dan sakelar Belajar (2026-11-19)

Lanjutan [riset-ux-hasil-2026-11-17.md](riset-ux-hasil-2026-11-17.md) (temuan A1, A2, A3) dan
[riset-ux-hasil-keterbacaan-2026-11-19.md](riset-ux-hasil-keterbacaan-2026-11-19.md). Dokumen ini **audit + JTBD + HMW +
ide**. Belum ada mockup dan belum ada kode diubah; menunggu pemilik memilih (bagian 6).

> **Diaudit ulang hari yang sama (bagian 9).** Beberapa klaim di bagian 2–6 keliru atau tidak sesuai kode, dan rekomendasinya
> diganti. Baca bagian 9 dulu; bagian 1–8 dibiarkan sebagai jejak.

Dasar bukti: kode `layar/Hasil.tsx` (hero baris 250–290, dialog baris 380–405), `hasil/ModalEkspor.tsx`, `layar/AwalHitung.tsx`,
tangkapan layar laptop dari pemilik. **Tidak ada data pengguna nyata**; yang bertanda "asumsi" belum diuji.

## 1. Apa yang ada di hero sekarang

| Elemen | Jenis | Catatan |
|---|---|---|
| "Menurut madzhab Syafi'i" · "Pasti" | informasi | sudah baik |
| Judul, "Dibagi ke 3 orang", chip "1 mayit" | informasi | chip "1 mayit" tidak menjawab pekerjaan apa pun (I3) |
| **Ekspor** (pil putih terisi) | aksi utama | satu-satunya tombol terisi di hero |
| **Hitung kasus / Belajar** (sakelar dua segmen) | pindah mode aplikasi | di bawah Ekspor |
| Ubin "Harta dibagi", "Penerima" | informasi | |

## 2. Audit: Ekspor sebagai aksi utama hero

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| E1 | Tinggi | **Aksi utama mengarah ke jalan buntu.** Dialog Ekspor hanya punya JSON yang berfungsi; PNG dan PDF "Segera hadir". Bagi keluarga yang mau menunjukkan hasil di rapat, JSON tidak berguna | `ModalEkspor.tsx` `DAFTAR_FORMAT` |
| E2 | Tinggi | **Urutan pekerjaan terbalik.** Detik pertama pengguna membaca "siapa dapat berapa" (H-a) lalu "kenapa" (H-b). Mengirim/menyimpan (H-e) baru relevan sesudah itu, tetapi tombolnya paling terang dan paling atas, sebelum jawaban terbaca | hero mendahului daftar |
| E3 | Sedang | **Bentrok dengan keputusan sendiri.** Keputusan 2026-09-28: tombol berbingkai hanya untuk aksi utama di form/dialog; aksi sekunder pakai teks/tautan. Ekspor di hero itu pil terisi untuk aksi yang bukan inti halaman | CLAUDE.md "Cara kerja dengan pengguna" |
| E4 | Sedang | **Satu aksi, banyak pintu.** Ekspor di hero, ubin Bagikan ("Simpan file kasus", "Bagikan tautan"), dan layar penuh pohon. Keputusan 2026-11-19 sebelumnya: "satu aksi satu tempat" (Kirim ringkasan hanya di hero), tetapi kode masih Ekspor/JSON | `Hasil.tsx:268`, `aksiBagikan`, `PohonLayarPenuh` |
| E5 | Sedang | Nama **"Ekspor"** adalah kata sistem. Kosakata pengguna: kirim, simpan, cetak, tunjukkan. Tidak ada satu pun yang jelas dari kata "Ekspor" | KB kosakata pengguna |
| E6 | Rendah | Di HP, hero sudah memakan hampir seluruh layar pertama (S1); tombol tambahan memperpanjangnya | riset 11-17 |

**Seberapa penting?** Pekerjaannya (H-e: bawa hasil ke rapat/grup) **penting**, tetapi **bukan aksi pertama** dan
**bentuk sekarang tidak memenuhinya**. Kesimpulan: pekerjaannya dipertahankan, tempat dan bentuknya dirombak.
Aturan umum yang dipakai: aksi utama = langkah berikutnya yang paling mungkin diambil pengguna pada keadaannya saat itu
(sesudah membaca jawaban), dan tidak menjanjikan sesuatu yang belum jalan.

## 3. Audit: sakelar Hitung kasus / Belajar

| Kode | Tingkat | Temuan | Bukti |
|---|---|---|---|
| B1 | Tinggi | **Satu kata, dua makna.** Menu atas "Belajar" = materi dan latihan. Sakelar di hero "Belajar" = menyembunyikan jawaban kasusmu lalu menyuruh menebak. Pengguna yang mengetuk "Belajar" berharap pelajaran, bukan kuis atas kasusnya | nav atas vs `Hasil.tsx:272` |
| B2 | Tinggi | **Sakelar menyamar sebagai tab, padahal pintu satu arah.** Ke Belajar: dialog "Pindah ke mode Belajar?". Kembali: dialog **tahan-untuk-pindah** dengan peringatan "semua jawaban langsung kebuka". Sakelar yang normal itu murah dan bisa dibalik; ini mahal | `konfirmasiBelajar`, `konfirmasiBuka` |
| B3 | Tinggi | **Segmen "Hitung kasus" tidak berarti di layar ini.** Pengguna sudah berada di hasil hitung; segmen itu hanya aktif (dan memicu dialog) saat sedang menebak. Separuh sakelar tidak pernah menjadi pilihan nyata di mode normal | `aria-pressed={!adalahBelajar}` |
| B4 | Sedang | **Dua penonton, satu hero.** Keluarga yang sedang membagi harta (kasus nyata) dan santri yang berlatih memakai sakelar yang sama. Untuk keluarga, tombol "Belajar" di bawah angka warisan orang tuanya adalah gangguan; untuk santri, tempatnya jauh dari soal latihan yang sudah membuka Belajar sendiri (asumsi: perlu diuji) | `saatDikerjakan`, `terkunci` |
| B5 | Sedang | **Pintu ganda.** Selain sakelar, ada "Coba tebak dulu" di ubin Pelajari, kartu Latihan di Beranda/Lab, dan soal latihan. Empat jalan masuk, dua nama berbeda ("Belajar", "Coba tebak dulu") | `DaftarAksi`, `AwalHitung.tsx` |
| B6 | Sedang | Bersama Ekspor, sakelar membuat **dua kelompok kontrol bersaing** di hero yang sama untuk dua tujuan berbeda (membawa hasil keluar, mengganti mode). Tidak ada hierarki jelas di antara keduanya | screenshot |
| B7 | Rendah | Mode Belajar tidak ada untuk taqdir, menunggu kelahiran, gharqa (`!khusus`), jadi sakelar menghilang diam-diam di kasus tertentu tanpa penjelasan | `Hasil.tsx:137` |

## 4. JTBD

| # | Saat… | Saya ingin… | Supaya… | Ukuran sukses |
|---|---|---|---|---|
| H-a | hasil keluar | membaca bagian tiap orang | tahu jawabannya | terbaca tanpa gulir, tanpa menekan apa pun |
| H-b | ada yang bertanya "kenapa" | membuka alasan per orang | keluarga menerima | ≤ 1 ketukan dari nama |
| H-e | sudah yakin dengan hasil | **mengirim ringkasan ke grup keluarga / menunjukkan / mencetak** | rapat berjalan dari angka yang sama | ≤ 2 ketukan dari hasil, keluar dalam bentuk yang bisa langsung dipakai (teks, gambar, PDF), bukan file mentah |
| H-e2 | belum yakin, mau lanjut nanti | menyimpan keadaan ini | tidak mengulang input | kasus sudah otomatis ke riwayat; tidak perlu tombol |
| H-g | saya santri / ingin paham caranya | **menebak dulu lalu mencocokkan** pada sebuah kasus | paham cara hitung | pintu masuk jelas, tebakan boleh dihentikan kapan saja, jawaban tak hilang |
| H-g2 | saya sedang membagi harta keluarga sendiri | tidak diganggu mode yang tidak saya butuhkan | fokus pada angka | tidak ada kontrol mode di wilayah jawaban (asumsi) |

Pemetaan: hero harus melayani **H-a** (informasi), **H-e** (satu aksi, bila bisa jalan). **H-g** bukan tugas hero.

## 5. HMW dan ide

**HMW-1** Bagaimana hero hanya menawarkan satu langkah berikutnya yang benar-benar jalan, tepat sesudah jawaban terbaca?
**HMW-2** Bagaimana pengguna yang ingin menebak menemukan pintunya tanpa mengganggu keluarga yang hanya ingin angka?
**HMW-3** Bagaimana "Belajar" tidak lagi bermakna dua hal?
**HMW-4** Bagaimana masuk-keluar tebakan terasa murah dan bisa dibalik?

Skor: **Paham** (mudah dimengerti pengguna), **Dampak** (menyelesaikan pekerjaan), **Usaha** (3 = kecil). Format Paham·Dampak·Usaha.

### Aksi hero (HMW-1)

| Ide | Isi | Skor |
|---|---|---|
| **C1** | Hapus semua aksi dari hero; hero hanya bacaan. Aksi tetap di ubin Bagikan (sudah ada) | 3·2·3 |
| **C2** | Satu pil: **"Kirim ringkasan"** (bukan "Ekspor"). Membuka pilihan yang berfungsi: salin teks untuk grup, simpan gambar, cetak/PDF. JSON dipindah ke ubin Bagikan sebagai "Simpan file kasus" | 3·3·2 |
| **C3** | Pertahankan Ekspor, hanya aktifkan PNG dan PDF | 2·2·1 |
| **C4** | Aksi turun jadi ikon bagikan + teks kecil di bilah atas hero (sejajar status "Pasti"), tanpa pil | 3·2·3 |

**Rekomendasi: C2, dengan C1 sebagai jalan sementara**: selama teks ringkasan/PNG/PDF belum ada, jangan promosikan jalan buntu
di hero (hapus pil, aksi tinggal di ubin Bagikan). Begitu salah satu jalan keluar yang pengguna pakai berfungsi, naikkan
sebagai satu pil "Kirim ringkasan". Di HP, pil dipindah ke bar bawah supaya hero tidak memanjang.

### Sakelar Belajar (HMW-2/3/4)

| Ide | Isi | Skor |
|---|---|---|
| **B1** | **Buang sakelar dari hero kasus.** Satu pintu masuk tebak di ubin "Pelajari cara menghitungnya" (sudah ada: "Coba tebak dulu"), plus Latihan di menu. Hero soal (dari latihan/materi) tidak punya sakelar, hanya tautan teks "Lihat hasil hitung" | 3·3·3 |
| **B2** | Ganti sakelar jadi **tautan teks reversibel "Tutup jawaban dan tebak dulu"** di hero, sama seperti ikon mata yang menyembunyikan nominal: buka kapan saja tanpa dialog tahan; hanya XP soal latihan yang gugur | 2·2·2 |
| **B3** | **Ganti nama**: sakelar/pintu jadi "Tebak dulu"; kata "Belajar" tinggal untuk menu materi | 3·2·3 |
| **B4** | Pisahkan jadi layar sendiri "Latihan tebak" yang menerima kasus; di Hasil hanya ada pintu | 3·3·1 |

**Rekomendasi: B1 + B3.** Menghapus sakelar menyelesaikan B2, B3, B4, B6 sekaligus; mengganti nama menyelesaikan B1 dan B5.
Dialog tahan-untuk-pindah tetap hanya berlaku di tengah tebakan (menyerah sebelum selesai), bukan saat berpindah mode.
B4 bisa menyusul kalau latihan tebak berkembang.

### Prinsip turunan
1. Hero = jawaban. Satu aksi saja, atau nol.
2. Aksi utama hanya bila jalannya berfungsi; kata aksi = kata pengguna (kirim, simpan, cetak).
3. Mode aplikasi tidak ditaruh di wilayah jawaban. Pintu menebak ada di tempat orang membaca cara menghitung.
4. Satu kata, satu makna: "Belajar" = materi; "Tebak dulu" = menutup jawaban.

## 6. Yang perlu diputuskan pemilik

1. **Aksi hero:** C2 dengan C1 sementara (rekomendasi), C1 saja, C4, atau C3?
2. **Sakelar:** B1 + B3 (rekomendasi), B2, atau B4?
3. **Kasus nyata keluarga boleh dijadikan tebakan?** Bila tidak, "Coba tebak dulu" hanya muncul di soal latihan/materi, dan ubin Pelajari
   cukup menawarkan Latihan.
4. **Nama pintu tebak:** "Tebak dulu" (rekomendasi) atau tetap "Coba tebak dulu"?

## 7. Belum diaudit
- Mode Belajar secara utuh (kartu jawaban, XP, pembahasan) selain pintu masuknya.
- Perilaku pengguna sebenarnya: belum ada data klik. Bila ada analitik, ukur dulu seberapa sering Ekspor dan sakelar ditekan
  sebelum memutuskan.
- Isi ringkasan teks yang dikirim ke grup (perlu dirancang bila C2 dipilih).

## 8. Langkah sesudah dipilih
Ubah `docs/design/mockup-hasil-per-kasus.html` (acuan Hasil, lihat memori acuan-hasil-final) → acc pemilik → baru kode
`Hasil.tsx`, `ModalEkspor.tsx`, `KartuLain.tsx`, dan uji `hasil.test.tsx`.

## 9. Audit ulang atas dokumen ini (2026-11-19, sore)

Diminta pemilik: bukan melengkapi, tetapi memeriksa apakah bagian 1–8 benar. Setiap klaim dicocokkan ulang ke kode
(`Hasil.tsx`, `ModalEkspor.tsx`, `ui/Bagikan.tsx`, `Aplikasi.tsx`), ke keputusan lama (`riset-ux-hasil-2026-11-17.md`), dan ke
sumber luar. Status: **Benar**, **Keliru**, **Lemah** (benar tapi buktinya kurang), **Terlewat**.

### 9a. Kritik terbesar: masalahnya dibingkai salah

**Keliru.** Dokumen ini memperlakukan aksi hero sebagai pertanyaan baru dan menawarkan empat pilihan (C1–C4). Padahal pemilik
**sudah memutuskan** pada 2026-11-17 (riset-ux-hasil bagian 11 butir 1 dan bagian 17): aksi hero = **"Kirim ringkasan"** (teks
singkat untuk WA), PDF lengkap untuk rapat/ustadz, dan simpan, tautan, serta file kasus di ubin Bagikan. Acuan beku
`acuan-hasil-final.html` memuat pil "Kirim ringkasan" di hero. Kode lalu menyimpang menjadi "Ekspor" yang hanya berisi JSON.

Jadi temuan intinya bukan "Ekspor kurang penting", tetapi **implementasi menyimpang dari desain yang sudah disetujui**. Dokumen ini
tidak menyebut keputusan 11-17 sama sekali dan membuka ulang perdebatan (C1 "hapus aksi dari hero" bertentangan langsung dengan
keputusan itu) tanpa bukti baru. Ini melanggar prinsip kerja: jangan membuka ulang keputusan pemilik tanpa alasan baru.

### 9b. Klaim per temuan

| Kode | Status | Koreksi |
|---|---|---|
| E1 jalan buntu | **Benar** | `DAFTAR_FORMAT`: PNG/PDF tanpa `unduh`, tombolnya `disabled` |
| E2 urutan terbalik | **Lemah → kini ada bukti** | "Detik pertama pengguna membaca…" tanpa data. Bukti luar yang lebih kuat: *reading gravity*, yaitu aksi utama diletakkan di tempat pemindaian berakhir; orang mencari aksi **setelah** isi habis dibaca ([UX Movement](https://uxmovement.com/mobile/optimal-placement-for-mobile-call-to-action-buttons/)). Ini justru alasan baru yang sah untuk meninjau **letak** (bukan isi) keputusan 11-17, dan dokumen ini tidak memakainya |
| E3 bentrok aturan tombol | **Benar, tetapi tidak konsisten** | Kalau pil di hero melanggar aturan, pil "Kirim ringkasan" di rekomendasi C2 juga melanggar. Dokumen mengkritik bentuk Ekspor lalu merekomendasikan bentuk yang sama |
| E4 banyak pintu | **Sebagian keliru** | Dokumen menyebut keputusan "satu aksi satu tempat" seolah dilanggar kode. Faktanya pintu Ekspor ada **dua**: hero dan `PohonLayarPenuh saatEkspor`. Ubin Bagikan berisi aksi lain (simpan untuk nanti, file kasus, tautan), bukan duplikat Ekspor |
| E5 "kata sistem" | **Bukti keliru** | Rujukannya "KB kosakata pengguna", padahal tabel kosakata ada di `riset-ux-wizard-kritik-2026-11-16.md`, bukan di KB (KB hanya berisi fikih). Isi temuannya tetap masuk akal |
| E6 hero memanjang di HP | Benar | |
| B1 satu kata dua makna | **Benar, buktinya lebih kuat** | Kunci terjemahan sama persis: `t('umum.belajar')` dipakai di menu atas (`Kepala.tsx`) dan di sakelar |
| B2 sakelar = pintu satu arah | **Benar** | Masuk: dialog biasa (`konfirmasiBelajar`). Keluar: dialog tahan (`konfirmasiBuka 'pindah'`). Sakelar seharusnya langsung berlaku dan bisa dibalik; kalau butuh konfirmasi, itu bukan sakelar ([ringkasan pedoman toggle NN/g](https://www.nngroup.com/articles/toggle-switch-guidelines/)) |
| B3 segmen "Hitung kasus" kosong | Benar | |
| B4 dua penonton | **Lemah + ada yang terlewat** | Yang terlewat: di **soal latihan** (`kerjakanSoal` memasang `tujuan: 'belajar'`), segmen "Hitung kasus" berfungsi sebagai jalan keluar "lihat jawaban". Jalan itu **sudah ada** lewat `saatTampilkanJawaban` → dialog "Yakin mau lihat jawaban?". Jadi di latihan, sakelar adalah pintu keluar ganda dengan dua judul dialog berbeda. Menghapusnya tidak menghilangkan jalan keluar |
| B5 empat pintu | **Dilebih-lebihkan** | Di Hasil hanya ada **dua** pintu ke mode tebak untuk kasus sendiri: sakelar dan "Coba tebak dulu" (`DaftarAksi`), keduanya membuka dialog yang sama. Kartu Latihan di Beranda/Lab membuka soal, bukan mode tebak atas kasus sendiri |
| B7 hilang diam-diam | Benar, kurang lengkap | Sakelar juga hilang saat `hanyaBaca` (tautan dibagikan) |

### 9c. JTBD dan HMW

- **H-e2 keliru.** "Kasus sudah otomatis ke riwayat; tidak perlu tombol" tidak sesuai kode: penyimpanan otomatis hanya untuk
  kasus menunggu kelahiran. Kasus biasa butuh "Simpan, lanjut nanti" di ubin Bagikan (`aksiBagikan`).
- **Terlewat: nominal disembunyikan.** Tangkapan layar pemilik menampilkan `Rp ••••••`. Kirim ringkasan dalam keadaan itu harus
  diputuskan: ikut tersembunyi (hanya pecahan) atau bertanya dulu. Dokumen tidak membahasnya.
- **Terlewat: pengajar.** `riset-narasi-pengajar-2026-11-19.md` (hari yang sama) punya pengguna ustadz/pengajar. Pemilik kini
  memutuskan **tebakan hanya untuk soal latihan**, jadi kebutuhan pengajar dilayani lewat "Langkah demi langkah", bukan mode tebak.
- **HMW-1 menggiring.** "…hanya menawarkan satu langkah berikutnya…" sudah memuat jawabannya. Seharusnya: "Bagaimana hasil
  sampai ke grup keluarga dalam bentuk yang langsung terbaca, tepat saat pengguna selesai membaca?"
- **Skor Paham·Dampak·Usaha tanpa alasan.** C1 dan C4 sama-sama 3·2·3 tanpa penjelasan. Usaha C2 dinilai 2, padahal
  `ui/Bagikan.tsx` sudah menangani Web Share API dan clipboard. Yang perlu dibuat hanya penyusun teks ringkasan dari data
  `ringkasan` (yang sudah ada). Usaha C2 seharusnya 3, sehingga "C1 sementara" tidak perlu.
- **Rekomendasi C2 bertentangan dengan E2 milik dokumen sendiri.** E2 berkata aksi di atas datang sebelum jawaban terbaca, lalu
  C2 tetap menaruh pil di hero.

### 9d. Riset luar (singkat, sumber sekunder)

- Satu aksi utama per halaman, sisanya turun hierarki ([Red Hat Design System](https://ux.redhat.com/elements/call-to-action/guidelines)).
- Aksi utama diletakkan di akhir jalur pemindaian, bukan di atas ([UX Movement](https://uxmovement.com/mobile/optimal-placement-for-mobile-call-to-action-buttons/)).
- Toggle = langsung berlaku dan bisa dibalik; yang butuh konfirmasi atau beberapa langkah bukan toggle (pedoman sekunder yang
  merujuk NN/g; teks asli NN/g tidak terbaca saat riset).
- Aplikasi hitung belajar (Photomath, Symbolab) memakai pengungkapan bertahap (jawaban → langkah) dan menaruh latihan di area
  terpisah. Tidak ditemukan pola "sakelar sembunyikan jawaban" di halaman hasil ([dukungan Photomath](https://support.google.com/photomath/answer/14335006?hl=en)).
  Bukti ini lemah (kebanyakan halaman perbandingan), cukup sebagai pembanding, bukan dasar.

### 9e. Kesimpulan yang dikoreksi

**Aksi hero.** Pekerjaan H-e dan keputusan 11-17 tetap berlaku: **Kirim ringkasan** (teks WA) adalah aksi utama. Yang ditinjau
hanya **letaknya**, dengan alasan baru (*reading gravity*, E2):
- Laptop: pil "Kirim ringkasan" **di akhir kartu "Siapa dapat berapa"**, tepat di bawah baris "Harta yang dibagi", tempat
  pembacaan selesai. Hero = jawaban saja, tanpa tombol. Ini juga menyelesaikan E3 (hero tidak lagi memuat pil).
- HP: pil yang sama di akhir daftar. Tidak perlu bar bawah.
- "Ekspor" dihapus. JSON tetap di ubin Bagikan sebagai "Simpan file kasus" (sudah ada). PDF baru muncul di ubin Bagikan
  setelah dibuat; sebelum itu tidak dirender (bukan "Segera hadir").
- Nominal tersembunyi → ringkasan berisi pecahan saja, dengan satu baris "nominal disembunyikan".

**Sakelar.** Hapus dari hero di **semua** keadaan:
- Kasus sendiri: tidak ada mode tebak (keputusan pemilik). "Coba tebak dulu" di ubin Pelajari juga dihapus. Ubin Pelajari
  berisi "Langkah demi langkah" dan "Bandingkan madzhab".
- Soal latihan: mode tebak menjadi keadaan bawaan soal, bukan pilihan. Jalan keluar tunggal = "Lihat jawaban" yang sudah ada
  (dialog tahan + XP gugur tetap). Sesudah jawaban terbuka, aksi utama = "Soal berikutnya" di akhir pembahasan.
- Kata "Belajar" hanya untuk menu materi. Tidak perlu nama pintu baru (pertanyaan 4 bagian 6 gugur) karena pintunya tidak ada lagi.

### 9f. Masih asumsi
- Belum ada data klik. Keputusan letak berdasar pedoman umum, bukan pengamatan pengguna aplikasi ini.
- Isi teks ringkasan (urutan baris, kalimat penutup, panjang untuk munasakhat ±52 baris) belum dirancang; bagian 15 riset 11-17
  sudah mencatat risikonya.
