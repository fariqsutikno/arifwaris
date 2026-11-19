# Riset UX: aksi di hero Hasil dan sakelar Belajar (2026-11-19)

Lanjutan [riset-ux-hasil-2026-11-17.md](riset-ux-hasil-2026-11-17.md) (temuan A1, A2, A3) dan
[riset-ux-hasil-keterbacaan-2026-11-19.md](riset-ux-hasil-keterbacaan-2026-11-19.md). Dokumen ini **audit + JTBD + HMW +
ide**. Belum ada mockup dan belum ada kode diubah; menunggu pemilik memilih (bagian 6).

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
